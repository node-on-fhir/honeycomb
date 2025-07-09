import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { getCacheStats, cleanupCache } from '/packages/clinical-dicom-viewer/client/utils/indexeddb-setup';

// Create context
const CacheContext = createContext();

// Action types
const CACHE_ACTIONS = {
  SET_CACHE_STATS: 'SET_CACHE_STATS',
  SET_CACHE_SETTINGS: 'SET_CACHE_SETTINGS',
  SET_PREFETCH_QUEUE: 'SET_PREFETCH_QUEUE',
  ADD_TO_PREFETCH: 'ADD_TO_PREFETCH',
  REMOVE_FROM_PREFETCH: 'REMOVE_FROM_PREFETCH',
  SET_CACHE_STATUS: 'SET_CACHE_STATUS',
  UPDATE_CACHE_PROGRESS: 'UPDATE_CACHE_PROGRESS',
};

// Initial state
const initialState = {
  cacheStats: {
    totalSize: 0,
    count: 0,
    averageSize: 0,
  },
  cacheSettings: {
    maxSizeMB: 2048,
    ttlHours: 168, // 1 week
    prefetchStrategy: 'balanced',
    enablePrefetch: true,
  },
  prefetchQueue: [],
  cacheStatus: 'idle', // 'idle', 'prefetching', 'cleaning'
  cacheProgress: {
    current: 0,
    total: 0,
    percentage: 0,
  },
};

// Reducer
function cacheReducer(state, action) {
  switch (action.type) {
    case CACHE_ACTIONS.SET_CACHE_STATS:
      return { ...state, cacheStats: action.payload };
      
    case CACHE_ACTIONS.SET_CACHE_SETTINGS:
      return { ...state, cacheSettings: { ...state.cacheSettings, ...action.payload } };
      
    case CACHE_ACTIONS.SET_PREFETCH_QUEUE:
      return { ...state, prefetchQueue: action.payload };
      
    case CACHE_ACTIONS.ADD_TO_PREFETCH:
      return { 
        ...state, 
        prefetchQueue: [...state.prefetchQueue, action.payload] 
      };
      
    case CACHE_ACTIONS.REMOVE_FROM_PREFETCH:
      return {
        ...state,
        prefetchQueue: state.prefetchQueue.filter(item => item.id !== action.payload),
      };
      
    case CACHE_ACTIONS.SET_CACHE_STATUS:
      return { ...state, cacheStatus: action.payload };
      
    case CACHE_ACTIONS.UPDATE_CACHE_PROGRESS:
      return { ...state, cacheProgress: action.payload };
      
    default:
      return state;
  }
}

/**
 * Cache Context Provider
 */
export function CacheProvider({ children }) {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  
  // Load cache settings from Meteor.settings on startup
  useEffect(function() {
    const settings = Meteor.settings.public;
    const cacheConfig = get(settings, 'cache', {});
    
    dispatch({
      type: CACHE_ACTIONS.SET_CACHE_SETTINGS,
      payload: {
        maxSizeMB: cacheConfig.maxSizeMB || 2048,
        ttlHours: cacheConfig.ttlHours || 168,
        prefetchStrategy: get(settings, 'dicom.prefetchStrategy', 'balanced'),
        enablePrefetch: get(settings, 'dicom.enablePrefetch', true),
      },
    });
  }, []);
  
  // Update cache stats periodically
  useEffect(function() {
    async function updateStats() {
      try {
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATS, payload: stats });
        }
      } catch (error) {
        console.error('Error updating cache stats:', error);
      }
    }
    
    // Update immediately
    updateStats();
    
    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return function() {
      clearInterval(interval);
    };
  }, []);
  
  /**
   * Update cache settings
   */
  function updateCacheSettings(newSettings) {
    dispatch({ type: CACHE_ACTIONS.SET_CACHE_SETTINGS, payload: newSettings });
  }
  
  /**
   * Add items to prefetch queue
   */
  function addToPrefetchQueue(items) {
    const prefetchItems = Array.isArray(items) ? items : [items];
    
    prefetchItems.forEach(function(item) {
      const prefetchItem = {
        id: item.sopInstanceUID || item.id,
        sopInstanceUID: item.sopInstanceUID,
        seriesUID: item.seriesUID,
        priority: item.priority || 'normal',
        addedAt: new Date(),
      };
      
      dispatch({ type: CACHE_ACTIONS.ADD_TO_PREFETCH, payload: prefetchItem });
    });
  }
  
  /**
   * Remove item from prefetch queue
   */
  function removeFromPrefetchQueue(itemId) {
    dispatch({ type: CACHE_ACTIONS.REMOVE_FROM_PREFETCH, payload: itemId });
  }
  
  /**
   * Clear prefetch queue
   */
  function clearPrefetchQueue() {
    dispatch({ type: CACHE_ACTIONS.SET_PREFETCH_QUEUE, payload: [] });
  }
  
  /**
   * Start prefetching
   */
  async function startPrefetching() {
    if (!state.cacheSettings.enablePrefetch || state.prefetchQueue.length === 0) {
      return;
    }
    
    try {
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'prefetching' });
      
      const totalItems = state.prefetchQueue.length;
      
      for (let i = 0; i < totalItems; i++) {
        const item = state.prefetchQueue[i];
        
        // Update progress
        dispatch({
          type: CACHE_ACTIONS.UPDATE_CACHE_PROGRESS,
          payload: {
            current: i + 1,
            total: totalItems,
            percentage: Math.round(((i + 1) / totalItems) * 100),
          },
        });
        
        // TODO: Implement actual prefetching logic
        // For now, just simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Remove completed item from queue
        removeFromPrefetchQueue(item.id);
      }
      
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
      dispatch({
        type: CACHE_ACTIONS.UPDATE_CACHE_PROGRESS,
        payload: { current: 0, total: 0, percentage: 0 },
      });
      
    } catch (error) {
      console.error('Prefetch error:', error);
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
    }
  }
  
  /**
   * Clear cache
   */
  async function clearCache() {
    try {
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'cleaning' });
      
      const success = await cleanupCache(0, 0); // Clear everything
      
      if (success) {
        // Update stats
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATS, payload: stats });
        }
      }
      
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
      
      return success;
      
    } catch (error) {
      console.error('Cache clear error:', error);
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
      return false;
    }
  }
  
  /**
   * Cleanup old cache entries
   */
  async function cleanupOldEntries() {
    try {
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'cleaning' });
      
      const maxSizeBytes = state.cacheSettings.maxSizeMB * 1024 * 1024;
      const maxAgeMs = state.cacheSettings.ttlHours * 60 * 60 * 1000;
      
      const success = await cleanupCache(maxSizeBytes, maxAgeMs);
      
      if (success) {
        // Update stats
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATS, payload: stats });
        }
      }
      
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
      
      return success;
      
    } catch (error) {
      console.error('Cache cleanup error:', error);
      dispatch({ type: CACHE_ACTIONS.SET_CACHE_STATUS, payload: 'idle' });
      return false;
    }
  }
  
  /**
   * Get cache size in human readable format
   */
  function getCacheSizeFormatted() {
    const sizeBytes = state.cacheStats.totalSize;
    if (sizeBytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
    
    return parseFloat((sizeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get cache usage percentage
   */
  function getCacheUsagePercentage() {
    const maxSizeBytes = state.cacheSettings.maxSizeMB * 1024 * 1024;
    const usedBytes = state.cacheStats.totalSize;
    
    if (maxSizeBytes === 0) return 0;
    return Math.round((usedBytes / maxSizeBytes) * 100);
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    updateCacheSettings,
    addToPrefetchQueue,
    removeFromPrefetchQueue,
    clearPrefetchQueue,
    startPrefetching,
    clearCache,
    cleanupOldEntries,
    
    // Computed values
    cacheSizeFormatted: getCacheSizeFormatted(),
    cacheUsagePercentage: getCacheUsagePercentage(),
    isPrefetching: state.cacheStatus === 'prefetching',
    isCleaning: state.cacheStatus === 'cleaning',
    prefetchQueueLength: state.prefetchQueue.length,
  };
  
  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

/**
 * Hook to use cache context
 */
export function useCache() {
  const context = useContext(CacheContext);
  
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  
  return context;
}