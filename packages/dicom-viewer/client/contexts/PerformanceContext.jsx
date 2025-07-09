import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Create context
const PerformanceContext = createContext();

// Action types
const PERFORMANCE_ACTIONS = {
  UPDATE_METRICS: 'UPDATE_METRICS',
  ADD_BENCHMARK: 'ADD_BENCHMARK',
  SET_MONITORING_ENABLED: 'SET_MONITORING_ENABLED',
  UPDATE_MEMORY_INFO: 'UPDATE_MEMORY_INFO',
  ADD_PERFORMANCE_EVENT: 'ADD_PERFORMANCE_EVENT',
};

// Initial state
const initialState = {
  monitoringEnabled: true,
  metrics: {
    memoryUsage: {
      used: 0,
      total: 0,
      limit: 0,
      percentage: 0,
    },
    cacheSize: 0,
    frameRate: 0,
    renderTime: 0,
    imageLoadTime: 0,
    cornerstone3DInfo: null,
  },
  benchmarks: [],
  performanceEvents: [],
  lastUpdate: null,
};

// Reducer
function performanceReducer(state, action) {
  switch (action.type) {
    case PERFORMANCE_ACTIONS.UPDATE_METRICS:
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload },
        lastUpdate: new Date(),
      };
      
    case PERFORMANCE_ACTIONS.ADD_BENCHMARK:
      return {
        ...state,
        benchmarks: [...state.benchmarks.slice(-49), action.payload], // Keep last 50
      };
      
    case PERFORMANCE_ACTIONS.SET_MONITORING_ENABLED:
      return { ...state, monitoringEnabled: action.payload };
      
    case PERFORMANCE_ACTIONS.UPDATE_MEMORY_INFO:
      return {
        ...state,
        metrics: {
          ...state.metrics,
          memoryUsage: action.payload,
        },
      };
      
    case PERFORMANCE_ACTIONS.ADD_PERFORMANCE_EVENT:
      return {
        ...state,
        performanceEvents: [...state.performanceEvents.slice(-99), action.payload], // Keep last 100
      };
      
    default:
      return state;
  }
}

/**
 * Performance Context Provider
 */
export function PerformanceProvider({ children }) {
  const [state, dispatch] = useReducer(performanceReducer, initialState);
  
  // Initialize monitoring settings
  useEffect(function() {
    const settings = Meteor.settings.public;
    const monitoringEnabled = get(settings, 'performance.enableMonitoring', true);
    
    dispatch({
      type: PERFORMANCE_ACTIONS.SET_MONITORING_ENABLED,
      payload: monitoringEnabled,
    });
  }, []);
  
  // Memory monitoring
  useEffect(function() {
    if (!state.monitoringEnabled) return;
    
    function updateMemoryInfo() {
      if (performance.memory) {
        const memoryInfo = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100),
        };
        
        dispatch({
          type: PERFORMANCE_ACTIONS.UPDATE_MEMORY_INFO,
          payload: memoryInfo,
        });
      }
    }
    
    // Update immediately
    updateMemoryInfo();
    
    // Update every 5 seconds
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return function() {
      clearInterval(interval);
    };
  }, [state.monitoringEnabled]);
  
  // Performance observer for general metrics
  useEffect(function() {
    if (!state.monitoringEnabled || !window.PerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        
        entries.forEach(function(entry) {
          addPerformanceEvent({
            type: entry.entryType,
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: new Date(),
          });
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      
      return function() {
        observer.disconnect();
      };
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }, [state.monitoringEnabled]);
  
  /**
   * Add benchmark result
   */
  function addBenchmark(benchmarkData) {
    const benchmark = {
      ...benchmarkData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    dispatch({ type: PERFORMANCE_ACTIONS.ADD_BENCHMARK, payload: benchmark });
  }
  
  /**
   * Add performance event
   */
  function addPerformanceEvent(eventData) {
    const event = {
      ...eventData,
      id: Date.now().toString(),
      timestamp: eventData.timestamp || new Date(),
    };
    
    dispatch({ type: PERFORMANCE_ACTIONS.ADD_PERFORMANCE_EVENT, payload: event });
  }
  
  /**
   * Measure function execution time
   */
  function measurePerformance(name, fn) {
    const startTime = performance.now();
    
    try {
      const result = fn();
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.then(function(asyncResult) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          addBenchmark({
            name,
            duration,
            type: 'async-function',
            success: true,
          });
          
          return asyncResult;
        }).catch(function(error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          addBenchmark({
            name,
            duration,
            type: 'async-function',
            success: false,
            error: error.message,
          });
          
          throw error;
        });
      } else {
        // Sync function
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        addBenchmark({
          name,
          duration,
          type: 'sync-function',
          success: true,
        });
        
        return result;
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      addBenchmark({
        name,
        duration,
        type: 'sync-function',
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Update metrics
   */
  function updateMetrics(newMetrics) {
    dispatch({ type: PERFORMANCE_ACTIONS.UPDATE_METRICS, payload: newMetrics });
  }
  
  /**
   * Get performance summary
   */
  function getPerformanceSummary() {
    const recentBenchmarks = state.benchmarks.slice(-20);
    
    if (recentBenchmarks.length === 0) {
      return {
        averageDuration: 0,
        successRate: 100,
        totalOperations: 0,
      };
    }
    
    const successfulBenchmarks = recentBenchmarks.filter(b => b.success);
    const averageDuration = recentBenchmarks.reduce((sum, b) => sum + b.duration, 0) / recentBenchmarks.length;
    const successRate = (successfulBenchmarks.length / recentBenchmarks.length) * 100;
    
    return {
      averageDuration: Math.round(averageDuration * 100) / 100,
      successRate: Math.round(successRate),
      totalOperations: recentBenchmarks.length,
    };
  }
  
  /**
   * Get memory status
   */
  function getMemoryStatus() {
    const { used, limit, percentage } = state.metrics.memoryUsage;
    
    let status = 'good';
    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 75) {
      status = 'warning';
    }
    
    return {
      status,
      percentage,
      usedMB: Math.round(used / 1024 / 1024),
      limitMB: Math.round(limit / 1024 / 1024),
    };
  }
  
  /**
   * Enable/disable monitoring
   */
  function setMonitoringEnabled(enabled) {
    dispatch({ type: PERFORMANCE_ACTIONS.SET_MONITORING_ENABLED, payload: enabled });
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    addBenchmark,
    addPerformanceEvent,
    measurePerformance,
    updateMetrics,
    setMonitoringEnabled,
    
    // Computed values
    performanceSummary: getPerformanceSummary(),
    memoryStatus: getMemoryStatus(),
    isMonitoring: state.monitoringEnabled,
  };
  
  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to use performance context
 */
export function usePerformance() {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  
  return context;
}