// client/startup/usage-example.js

/**
 * Example usage of startup modules
 */

// Option 1: Import and initialize individual modules
import { initializeCornerstone } from './cornerstone-setup';
import { initializeMemoryCleanup, memoryManager } from './memory-cleanup';
import { initializeServiceWorker } from './service-worker-setup';

async function exampleIndividualInit() {
  // Initialize Cornerstone only
  const cornerstoneModules = initializeCornerstone();
  
  // Initialize memory cleanup only
  const memManager = initializeMemoryCleanup();
  
  // Initialize service worker with custom settings
  const serviceWorker = await initializeServiceWorker({
    pwa: { enableServiceWorker: true }
  });
}

// Option 2: Import and initialize all modules at once
import { initializeAll } from './index';

async function exampleFullInit() {
  const modules = await initializeAll({
    settings: {
      pwa: { enableServiceWorker: true }
    }
  });
  
  // Access individual modules
  const { cornerstone, memoryManager, serviceWorker } = modules;
}

// Option 3: Use in React components
import React, { useEffect, useState } from 'react';
import { initializeCornerstone } from './cornerstone-setup';

export function DicomViewerComponent() {
  const [cornerstoneReady, setCornerstoneReady] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      try {
        const modules = initializeCornerstone();
        setCornerstoneReady(true);
      } catch (error) {
        console.error('Failed to initialize Cornerstone:', error);
      }
    };
    
    init();
  }, []);
  
  return (
    <div>
      {cornerstoneReady ? (
        <div>Cornerstone is ready!</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

// Option 4: Access memory manager directly
import { memoryManager } from './memory-cleanup';

function cleanupMemory() {
  // Manually trigger cleanup
  memoryManager.cleanup();
  
  // Check memory usage
  const usage = memoryManager.getMemoryUsage();
  console.log('Memory usage:', usage);
  
  // Cache an image
  memoryManager.cacheImage('image123', imageData);
  
  // Get cached image
  const cachedImage = memoryManager.getCachedImage('image123');
}