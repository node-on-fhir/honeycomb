// client/startup/index.js

// Export all startup functions
export { initializeCornerstone } from './cornerstone-setup';
export { initializeMemoryCleanup, memoryManager } from './memory-cleanup';
export { initializeServiceWorker, getServiceWorkerRegistration, isServiceWorkerSupported } from './service-worker-setup';

/**
 * Initialize all DICOM viewer startup modules
 * @param {Object} options - Configuration options
 * @returns {Object} Initialized modules
 */
export async function initializeAll(options = {}) {
  console.log('Initializing DICOM viewer modules...');
  
  const modules = {};
  
  // Initialize Cornerstone
  try {
    modules.cornerstone = await import('./cornerstone-setup').then(m => m.initializeCornerstone());
    console.log('✅ Cornerstone initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Cornerstone:', error);
  }
  
  // Initialize Memory Cleanup
  try {
    modules.memoryManager = await import('./memory-cleanup').then(m => m.initializeMemoryCleanup());
    console.log('✅ Memory cleanup initialized');
  } catch (error) {
    console.error('❌ Failed to initialize memory cleanup:', error);
  }
  
  // Initialize Service Worker
  try {
    modules.serviceWorker = await import('./service-worker-setup').then(m => 
      m.initializeServiceWorker(options.settings || {})
    );
    console.log('✅ Service worker initialized');
  } catch (error) {
    console.error('❌ Failed to initialize service worker:', error);
  }
  
  console.log('DICOM viewer initialization complete');
  return modules;
}