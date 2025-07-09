import React from 'react';
import { Meteor } from 'meteor/meteor';

// Import components
import DicomViewerPage from './client/pages/DicomViewerPage';
import DicomSettingsPage from './client/pages/DicomSettingsPage';
import DicomUploader from './client/components/DicomUploader';
import DicomViewer from './client/components/DicomViewer';
import MultiFormatUploader from './client/components/MultiFormatUploader';

// Import contexts
import { ViewerProvider } from './client/contexts/ViewerContext';
import { CacheProvider } from './client/contexts/CacheContext';
import { PerformanceProvider } from './client/contexts/PerformanceContext';

// Import hooks
import { usePerformance } from './client/hooks/usePerformance';

// Route definitions
let DynamicRoutes = [{
  name: 'DicomViewer',
  path: '/dicom-viewer',
  element: (
    <ViewerProvider>
      <CacheProvider>
        <PerformanceProvider>
          <DicomViewerPage />
        </PerformanceProvider>
      </CacheProvider>
    </ViewerProvider>
  ),
  requireAuth: true
}, {
  name: 'DicomSettings',
  path: '/dicom-settings',
  element: <DicomSettingsPage />,
  requireAuth: true
}];

// Sidebar integration
let SidebarElements = [{
  primaryText: "DICOM Viewer",
  to: '/dicom-viewer',
  iconName: "medical_imaging",
  requireAuth: true,
  collectionName: 'DicomStudies'
}];

let SidebarWorkflows = [{
  primaryText: "Medical Imaging",
  to: '/dicom-viewer',
  iconName: "radiology"
}];

// Footer buttons for context-sensitive actions
let FooterButtons = [{
  pathname: '/dicom-viewer',
  label: 'Upload DICOM',
  onClick: () => {
    Session.set('showDicomUploader', true);
  }
}];

// Initialize client-side components
if (Meteor.isClient) {
  Meteor.startup(function() {
    // Initialize Cornerstone on startup
    import('./client/startup/cornerstone-setup').then(module => {
      module.initializeCornerstone();
    });
    
    // Set up memory cleanup
    import('./client/startup/memory-cleanup').then(module => {
      module.initializeMemoryCleanup();
    });
    
    // Initialize service worker if supported
    if ('serviceWorker' in navigator) {
      import('./client/startup/service-worker-setup').then(module => {
        module.initializeServiceWorker();
      });
    }
  });
}

// Export all components and utilities
export {
  // Routes
  DynamicRoutes,
  
  // Sidebar
  SidebarElements,
  SidebarWorkflows,
  
  // Footer
  FooterButtons,
  
  // Components
  DicomViewer,
  DicomUploader,
  MultiFormatUploader,
  
  // Contexts
  ViewerProvider,
  CacheProvider,
  PerformanceProvider,
  
  // Hooks
  usePerformance
};