// import/startup/client/memory-cleanup.js
import { Meteor } from 'meteor/meteor';

// Memory management utilities for DICOM viewer
class MemoryManager {
  constructor() {
    this.imageCache = new Map();
    this.blobCache = new Map();
    this.maxImageCache = 5; // Keep max 5 images in memory
    this.maxBlobCache = 10; // Keep max 10 blob URLs
    this.cleanupInterval = null;
    
    this.startCleanupTimer();
  }
  
  // Cache management for images
  cacheImage(imageId, image) {
    if (this.imageCache.size >= this.maxImageCache) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
    this.imageCache.set(imageId, image);
  }
  
  getCachedImage(imageId) {
    return this.imageCache.get(imageId);
  }
  
  // Cache management for blob URLs
  cacheBlobUrl(hash, blobUrl) {
    if (this.blobCache.size >= this.maxBlobCache) {
      const firstKey = this.blobCache.keys().next().value;
      const oldUrl = this.blobCache.get(firstKey);
      URL.revokeObjectURL(oldUrl);
      this.blobCache.delete(firstKey);
    }
    this.blobCache.set(hash, blobUrl);
  }
  
  getCachedBlobUrl(hash) {
    return this.blobCache.get(hash);
  }
  
  // Force cleanup of all caches
  cleanup() {
    console.log('MemoryManager: Performing cleanup');
    
    // Clear image cache
    this.imageCache.clear();
    
    // Revoke all blob URLs and clear cache
    this.blobCache.forEach(function(blobUrl) {
      URL.revokeObjectURL(blobUrl);
    });
    this.blobCache.clear();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    console.log('MemoryManager: Cleanup completed');
  }
  
  // Get memory usage estimate
  getMemoryUsage() {
    const imageCount = this.imageCache.size;
    const blobCount = this.blobCache.size;
    
    return {
      cachedImages: imageCount,
      cachedBlobs: blobCount,
      totalCacheSize: imageCount + blobCount
    };
  }
  
  // Start periodic cleanup
  startCleanupTimer() {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const usage = this.getMemoryUsage();
      console.log('MemoryManager stats:', usage);
      
      // Force cleanup if we have too many cached items
      if (usage.totalCacheSize > 15) {
        this.cleanup();
      }
    }, 5 * 60 * 1000);
  }
  
  // Stop cleanup timer
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create global memory manager instance
export const memoryManager = new MemoryManager();

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', function() {
    memoryManager.cleanup();
  });
  
  // Expose to global scope for debugging
  window.dicomMemoryManager = memoryManager;
  
  // Add keyboard shortcut for manual cleanup (Ctrl+Shift+C)
  window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      console.log('Manual cleanup triggered');
      memoryManager.cleanup();
    }
  });
}

Meteor.startup(function() {
  console.log('DICOM Memory Manager initialized');
  console.log('Press Ctrl+Shift+C to manually trigger cleanup');
});