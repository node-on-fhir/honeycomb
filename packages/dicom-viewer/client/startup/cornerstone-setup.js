// client/startup/cornerstone-setup.js
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import cornerstoneTools from 'cornerstone-tools';
import Hammer from 'hammerjs';

/**
 * Initialize Cornerstone with all dependencies and tools
 */
export function initializeCornerstone() {
  console.log('Initializing cornerstone with dependencies...');

  // Initialize cornerstone external references
  cornerstone.external = cornerstone.external || {};
  cornerstone.external.cornerstone = cornerstone;
  cornerstone.external.cornerstoneMath = cornerstoneMath;

  // Configure WADO Image Loader
  cornerstoneWADOImageLoader.external = cornerstoneWADOImageLoader.external || {};
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  // Configure web workers for parsing
  if (cornerstoneWADOImageLoader.webWorkerManager) {
    const config = {
      maxWebWorkers: navigator.hardwareConcurrency || 1,
      startWebWorkersOnDemand: true,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false,
          usePDFJS: false,
          strict: false,
        },
      },
    };

    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    console.log('Web worker manager initialized');
  }

  // Initialize cornerstone tools external references
  cornerstoneTools.external = cornerstoneTools.external || {};
  cornerstoneTools.external.cornerstone = cornerstone;
  cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

  // CRITICAL FIX: Set up Hammer.js properly
  cornerstoneTools.external.Hammer = Hammer;

  // Make sure Hammer is available globally for cornerstone
  if (typeof window !== 'undefined') {
    window.Hammer = Hammer;
  }

  console.log('Hammer.js configured:', !!Hammer);

  // Initialize cornerstone tools
  try {
    if (cornerstoneTools.init) {
      cornerstoneTools.init();
      console.log('Cornerstone tools initialized successfully');
    }
  } catch (error) {
    console.warn('Error initializing cornerstone tools:', error);
  }

  // FIXED: Correct tool registration for v6.x with proper tool names
  const toolConfiguration = {
    mouseButtonMask: 1,
    preventHandleOutsideImage: true,
    passive: true
  };

  // CRITICAL FIX: Use correct tool names for cornerstoneTools v6
  const toolsConfig = [
    { name: 'Zoom', tool: cornerstoneTools.ZoomTool },
    { name: 'Pan', tool: cornerstoneTools.PanTool },
    { name: 'WwwcTool', tool: cornerstoneTools.WwwcTool },  // FIXED: Use WwwcTool not Wwwc
    { name: 'Length', tool: cornerstoneTools.LengthTool },
    { name: 'Angle', tool: cornerstoneTools.AngleTool },
    { name: 'RectangleRoi', tool: cornerstoneTools.RectangleRoiTool },
    { name: 'EllipticalRoi', tool: cornerstoneTools.EllipticalRoiTool },
    { name: 'Magnify', tool: cornerstoneTools.MagnifyTool },
    { name: 'Rotate', tool: cornerstoneTools.RotateTool },
  ];

  if (cornerstoneTools.addTool) {
    toolsConfig.forEach(function({ name, tool }) {
      try {
        if (tool) {
          cornerstoneTools.addTool(tool, toolConfiguration);
          console.log(`Added tool: ${name}`);
        } else {
          console.warn(`Tool ${name} not found - checking alternatives`);
          
          // Try alternative names for missing tools
          const alternatives = [
            `${name}Tool`,
            name.toLowerCase(),
            `${name.toLowerCase()}Tool`,
            name.replace('Tool', '')
          ];
          
          let foundTool = null;
          for (const altName of alternatives) {
            if (cornerstoneTools[altName]) {
              foundTool = cornerstoneTools[altName];
              break;
            }
          }
          
          if (foundTool) {
            cornerstoneTools.addTool(foundTool, toolConfiguration);
            console.log(`Added tool: ${name} (using alternative)`);
          } else {
            console.warn(`Could not find tool: ${name}`);
          }
        }
      } catch (err) {
        console.warn(`Error adding tool ${name}:`, err);
      }
    });
  } else {
    console.warn('cornerstoneTools.addTool is not available');
  }

  // PERFORMANCE FIX: Configure passive event listeners
  if (cornerstoneTools.external.Hammer) {
    // Override default Hammer.js options to use passive listeners
    const originalHammer = cornerstoneTools.external.Hammer;
    cornerstoneTools.external.Hammer = function(element, options) {
      const defaultOptions = {
        touchAction: 'pan-y',
        recognizers: [
          [originalHammer.Pan, { direction: originalHammer.DIRECTION_ALL }],
          [originalHammer.Pinch, { enable: true }],
        ],
        inputClass: originalHammer.TouchInput,
        cssProps: {
          userSelect: 'none',
          touchSelect: 'none',
          touchCallout: 'none',
          contentZooming: 'none',
          userDrag: 'none',
          tapHighlightColor: 'rgba(0,0,0,0)'
        }
      };
      
      return new originalHammer(element, Object.assign(defaultOptions, options));
    };
    
    // Copy static properties
    Object.setPrototypeOf(cornerstoneTools.external.Hammer, originalHammer);
    Object.assign(cornerstoneTools.external.Hammer, originalHammer);
  }

  console.log('Cornerstone setup completed');
  console.log('Cornerstone version:', cornerstone.version || 'unknown');
  console.log('CornerstoneTools version:', cornerstoneTools.version || 'unknown');
  console.log('Available cornerstone methods:', Object.keys(cornerstone).length);
  console.log('Available cornerstoneTools methods:', Object.keys(cornerstoneTools).length);

  // PERFORMANCE FIX: Add image caching configuration
  cornerstone.events.addEventListener('cornerstoneimageloaded', function(e) {
    // Enable image caching to improve performance
    const imageId = e.detail.image.imageId;
    if (imageId && !cornerstone.imageCache.getImage(imageId)) {
      cornerstone.imageCache.putImage(imageId, e.detail.image);
    }
  });

  // Set image cache size (in MB)
  cornerstone.imageCache.setMaximumSizeBytes(256 * 1024 * 1024); // 256MB

  // Return configured instances
  return { cornerstone, cornerstoneTools, cornerstoneWADOImageLoader };
}

// Export configured instances for use in other modules
export { cornerstone, cornerstoneTools, cornerstoneWADOImageLoader };