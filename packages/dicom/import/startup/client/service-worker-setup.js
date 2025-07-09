import { Meteor } from 'meteor/meteor';

/**
 * Service worker setup for PWA features and DICOM caching
 */

let serviceWorkerRegistration = null;

/**
 * Register service worker for offline support and caching
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('📦 Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      
      serviceWorkerRegistration = registration;
      
      console.log('✅ Service worker registered successfully');
      
      // Listen for updates
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New service worker available - refresh to update');
            // Could show user notification here
          }
        });
      });
      
      return registration;
      
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      return null;
    }
  } else {
    console.log('📦 Service workers not supported');
    return null;
  }
}

/**
 * Unregister service worker
 */
async function unregisterServiceWorker() {
  if (serviceWorkerRegistration) {
    try {
      await serviceWorkerRegistration.unregister();
      console.log('🗑️ Service worker unregistered');
    } catch (error) {
      console.error('Error unregistering service worker:', error);
    }
  }
}

/**
 * Check if app is running from cache (offline)
 */
function isOffline() {
  return !navigator.onLine;
}

/**
 * Get service worker registration
 */
export function getServiceWorkerRegistration() {
  return serviceWorkerRegistration;
}

/**
 * Check if service worker is available
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

// Initialize service worker when module loads
Meteor.startup(async function() {
  const settings = Meteor.settings.public;
  const enableServiceWorker = settings?.pwa?.enableServiceWorker !== false;
  
  if (enableServiceWorker) {
    // Delay registration to avoid blocking app startup
    setTimeout(async function() {
      await registerServiceWorker();
    }, 2000);
  } else {
    console.log('📦 Service worker disabled via settings');
  }
  
  // Listen for online/offline events
  window.addEventListener('online', function() {
    console.log('🌐 App is online');
  });
  
  window.addEventListener('offline', function() {
    console.log('📴 App is offline');
  });
});

// Cleanup on unload
window.addEventListener('beforeunload', function() {
  // Could perform cleanup here if needed
});