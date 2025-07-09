// client/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializeAll } from './startup';

// Example App component
const App = () => {
  return (
    <div>
      <h1>DICOM Viewer</h1>
      {/* Your app components here */}
    </div>
  );
};

// Initialize the application
async function startApp() {
  try {
    // Initialize all startup modules
    const modules = await initializeAll({
      settings: {
        pwa: {
          enableServiceWorker: true
        }
      }
    });
    
    // Store modules globally if needed
    window.dicomModules = modules;
    
    // Render React app
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
    
  } catch (error) {
    console.error('Failed to start application:', error);
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}