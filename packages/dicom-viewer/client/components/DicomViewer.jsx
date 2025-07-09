// client/components/DicomViewer.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { makeStyles } from '@mui/styles';
import { Paper, Typography, CircularProgress, Toolbar, IconButton, Tooltip, Alert, Button } from '@mui/material';
import { ZoomIn, ZoomOut, PanTool, Straighten, RotateLeft, RotateRight, Tune, Refresh } from '@mui/icons-material';
import { cornerstone, cornerstoneTools } from 'clinical-dicom-viewer/client/cornerstone-setup';
import { get } from 'lodash';

const useStyles = makeStyles(function(theme) {
  return {
    root: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    toolbar: {
      minHeight: 48,
      backgroundColor: theme.palette.grey[900],
    },
    viewerContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#000',
    },
    canvas: {
      width: '100%',
      height: '100%',
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    overlay: {
      position: 'absolute',
      top: 8,
      left: 8,
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: theme.spacing(1),
      borderRadius: theme.spacing(0.5),
      pointerEvents: 'none', // Prevent blocking mouse events
    },
    errorContainer: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }
  };
});

// PERFORMANCE FIX: Cache blob URLs to avoid recreating
const blobUrlCache = new Map();
const imageCache = new Map();

// ENHANCED: Base64 validation function
const validateBase64 = function(base64String) {
  try {
    // Check if it's a valid base64 string
    if (!base64String || typeof base64String !== 'string') {
      return { valid: false, error: 'Invalid or empty base64 data' };
    }
    
    // Remove data URL prefix if present
    const cleanBase64 = base64String.replace(/^data:[^;]+;base64,/, '');
    
    // Test base64 decode
    atob(cleanBase64);
    
    return { valid: true, data: cleanBase64 };
  } catch (error) {
    return { valid: false, error: `Invalid base64 encoding: ${error.message}` };
  }
};

function DicomViewer({ imageData, fileName }) {
  const classes = useStyles();
  const elementRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [activeTool, setActiveTool] = useState('Wwwc');
  const [retryCount, setRetryCount] = useState(0);
  
  // PERFORMANCE FIX: Create stable image identifier
  const imageHash = useMemo(function() {
    if (!imageData) return null;
    // Use first 100 chars as a simple hash for caching
    return imageData.substring(0, 100);
  }, [imageData]);

  // ENHANCED: Memoize blob URL creation with validation
  const imageId = useMemo(function() {
    if (!imageData || !imageHash) return null;
    
    // Check cache first
    if (blobUrlCache.has(imageHash)) {
      return `wadouri:${blobUrlCache.get(imageHash)}`;
    }
    
    try {
      // ENHANCED: Validate base64 first
      const validation = validateBase64(imageData);
      if (!validation.valid) {
        console.error('Base64 validation failed:', validation.error);
        return null;
      }
      
      // Use more efficient conversion for large images
      const binaryString = atob(validation.data);
      const bytes = new Uint8Array(binaryString.length);
      
      // PERFORMANCE: Use faster loop
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/dicom' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Cache the blob URL
      blobUrlCache.set(imageHash, blobUrl);
      
      // Cleanup old cache entries (keep only last 10)
      if (blobUrlCache.size > 10) {
        const firstKey = blobUrlCache.keys().next().value;
        const oldUrl = blobUrlCache.get(firstKey);
        URL.revokeObjectURL(oldUrl);
        blobUrlCache.delete(firstKey);
      }
      
      return `wadouri:${blobUrl}`;
    } catch (err) {
      console.error('Error creating blob URL:', err);
      setError(`Failed to process image data: ${err.message}`);
      return null;
    }
  }, [imageData, imageHash]);

  // PERFORMANCE FIX: Memoize update function
  const updateImageInfo = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const enabledElement = cornerstone.getEnabledElement(elementRef.current);
      if (enabledElement && enabledElement.image && enabledElement.viewport) {
        setImageInfo({
          width: get(enabledElement.image, 'width', 0),
          height: get(enabledElement.image, 'height', 0),
          windowCenter: Math.round(get(enabledElement.viewport, 'voi.windowCenter', 0)),
          windowWidth: Math.round(get(enabledElement.viewport, 'voi.windowWidth', 0)),
          zoom: get(enabledElement.viewport, 'scale', 1),
          rotation: get(enabledElement.viewport, 'rotation', 0),
        });
      }
    } catch (err) {
      console.warn('Error updating image info:', err);
    }
  }, []);

  // Helper function to safely check if element is enabled
  const isElementEnabled = useCallback(function(element) {
    try {
      cornerstone.getEnabledElement(element);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // ENHANCED: Retry mechanism for failed loads
  const handleRetry = useCallback(function() {
    setError(null);
    setLoading(true);
    setRetryCount(function(prev) { return prev + 1; });
  }, []);

  useEffect(function() {
    let element = elementRef.current;
    let isComponentMounted = true;
    
    if (!element || !imageId) {
      if (!imageId && imageData) {
        setError('Failed to create image URL from provided data');
        setLoading(false);
      }
      return;
    }

    async function loadImage() {
      try {
        setLoading(true);
        setError(null);

        // Check if cornerstone is properly initialized
        if (!cornerstone || !cornerstone.enable) {
          throw new Error('Cornerstone is not properly initialized');
        }

        // FIXED: Enable element BEFORE checking if it's enabled
        if (!isElementEnabled(element)) {
          cornerstone.enable(element);
          console.log('Element enabled for cornerstone');
        }

        // Check image cache first
        let image;
        if (imageCache.has(imageId)) {
          image = imageCache.get(imageId);
          console.log('Using cached image');
        } else {
          // Load image with caching and timeout
          console.log('Loading new image:', imageId);
          
          // Add timeout for image loading
          const loadPromise = cornerstone.loadImage(imageId);
          const timeoutPromise = new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Image loading timeout (30 seconds)'));
            }, 30000);
          });
          
          image = await Promise.race([loadPromise, timeoutPromise]);
          imageCache.set(imageId, image);
          
          // Cleanup old cache entries
          if (imageCache.size > 5) {
            const firstKey = imageCache.keys().next().value;
            imageCache.delete(firstKey);
          }
        }
        
        // Check if component is still mounted before continuing
        if (!isComponentMounted) return;
        
        await cornerstone.displayImage(element, image);
        console.log('Image displayed successfully');

        // TOOL FIX: Set up tools with proper error handling
        if (cornerstoneTools) {
          try {
            // Clear existing tools first
            if (cornerstoneTools.clearToolState) {
              cornerstoneTools.clearToolState(element);
            }
            
            // Add stack state manager if available
            if (cornerstoneTools.addStackStateManager) {
              cornerstoneTools.addStackStateManager(element, ['stack']);
            }
            
            // Add tool state
            if (cornerstoneTools.addToolState) {
              cornerstoneTools.addToolState(element, 'stack', {
                imageIds: [imageId],
                currentImageIdIndex: 0
              });
            }

            // TOOL FIX: Use correct tool activation method - try element-specific first
            if (cornerstoneTools.setToolActiveForElement) {
              cornerstoneTools.setToolActiveForElement(element, 'WwwcTool', { mouseButtonMask: 1 });
              console.log('Tools activated for element');
            } else if (cornerstoneTools.setToolActive) {
              cornerstoneTools.setToolActive('WwwcTool', { mouseButtonMask: 1 });
              console.log('Tools activated globally');
            }
          } catch (toolError) {
            console.warn('Error setting up cornerstone tools:', toolError);
            // Continue without tools if they fail to initialize
          }
        }

        // Add event listener for viewport changes
        element.addEventListener('cornerstoneimagerendered', updateImageInfo);

        // Get initial image information
        updateImageInfo();

        if (isComponentMounted) {
          setLoading(false);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (err) {
        console.error('Error loading DICOM image:', err);
        if (isComponentMounted) {
          setError(`Failed to load DICOM image: ${err.message}`);
          setLoading(false);
        }
      }
    }

    loadImage();

    // Cleanup function
    return function() {
      isComponentMounted = false;
      if (element) {
        element.removeEventListener('cornerstoneimagerendered', updateImageInfo);
        try {
          if (isElementEnabled(element)) {
            cornerstone.disable(element);
            console.log('Element disabled');
          }
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }
      }
    };
  }, [imageId, updateImageInfo, isElementEnabled, retryCount]);

  // PERFORMANCE FIX: Memoize tool handlers
  const handleToolChange = useCallback(function(toolName) {
    if (!elementRef.current || !cornerstoneTools) return;
    
    try {
      const element = elementRef.current;
      
      // Make sure we're using the correct tool names
      const toolMap = {
        'Wwwc': 'WwwcTool',
        'Pan': 'PanTool', 
        'Zoom': 'ZoomTool',
        'Length': 'LengthTool'
      };
      
      const actualToolName = toolMap[toolName] || toolName;
      
      // Try element-specific tool activation first
      if (cornerstoneTools.setToolActiveForElement) {
        // Deactivate all tools for this element
        const tools = ['WwwcTool', 'PanTool', 'ZoomTool', 'LengthTool'];
        tools.forEach(function(tool) {
          try {
            if (cornerstoneTools.setToolPassiveForElement) {
              cornerstoneTools.setToolPassiveForElement(element, tool);
            }
          } catch (err) {
            // Ignore errors for tools that don't exist
          }
        });
        
        cornerstoneTools.setToolActiveForElement(element, actualToolName, { mouseButtonMask: 1 });
        console.log('Activated tool:', actualToolName);
      } else if (cornerstoneTools.setToolActive) {
        // Fallback to global tool activation
        const tools = ['WwwcTool', 'PanTool', 'ZoomTool', 'LengthTool'];
        tools.forEach(function(tool) {
          try {
            if (cornerstoneTools.setToolPassive) {
              cornerstoneTools.setToolPassive(tool);
            }
          } catch (err) {
            // Ignore errors for tools that don't exist
          }
        });
        
        cornerstoneTools.setToolActive(actualToolName, { mouseButtonMask: 1 });
        console.log('Activated tool globally:', actualToolName);
      }
      
      setActiveTool(toolName);
    } catch (err) {
      console.warn('Error changing tool:', err);
    }
  }, []);

  const handleZoomIn = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const element = elementRef.current;
      const viewport = cornerstone.getViewport(element);
      viewport.scale += 0.25;
      cornerstone.setViewport(element, viewport);
    } catch (err) {
      console.warn('Error zooming in:', err);
    }
  }, []);

  const handleZoomOut = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const element = elementRef.current;
      const viewport = cornerstone.getViewport(element);
      viewport.scale = Math.max(0.1, viewport.scale - 0.25);
      cornerstone.setViewport(element, viewport);
    } catch (err) {
      console.warn('Error zooming out:', err);
    }
  }, []);

  const handleRotateLeft = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const element = elementRef.current;
      const viewport = cornerstone.getViewport(element);
      viewport.rotation -= 90;
      cornerstone.setViewport(element, viewport);
    } catch (err) {
      console.warn('Error rotating left:', err);
    }
  }, []);

  const handleRotateRight = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const element = elementRef.current;
      const viewport = cornerstone.getViewport(element);
      viewport.rotation += 90;
      cornerstone.setViewport(element, viewport);
    } catch (err) {
      console.warn('Error rotating right:', err);
    }
  }, []);

  const handleReset = useCallback(function() {
    if (!elementRef.current) return;
    
    try {
      const element = elementRef.current;
      cornerstone.reset(element);
    } catch (err) {
      console.warn('Error resetting image:', err);
    }
  }, []);

  if (error) {
    return (
      <Paper className={classes.root}>
        <div className={classes.errorContainer}>
          <Alert severity="error" style={{ marginBottom: 16 }}>
            <Typography variant="h6" gutterBottom>
              Failed to Load DICOM Image
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 16 }}>
              {error}
            </Typography>
            {retryCount < 3 && (
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={handleRetry}
                size="small"
              >
                Retry ({retryCount + 1}/3)
              </Button>
            )}
          </Alert>
          
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
            <strong>Troubleshooting Tips:</strong>
            <br />• Ensure the file is a valid DICOM format
            <br />• Try uploading the original DICOM file instead of converted files
            <br />• Check that the file is not corrupted
          </Typography>
        </div>
      </Paper>
    );
  }

  return (
    <Paper className={classes.root}>
      <Toolbar className={classes.toolbar} variant="dense">
        <Tooltip title="Window/Level">
          <IconButton 
            color={activeTool === 'Wwwc' ? 'secondary' : 'default'}
            onClick={function() { handleToolChange('Wwwc'); }}
          >
            <Tune />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Pan">
          <IconButton 
            color={activeTool === 'Pan' ? 'secondary' : 'default'}
            onClick={function() { handleToolChange('Pan'); }}
          >
            <PanTool />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Measure">
          <IconButton 
            color={activeTool === 'Length' ? 'secondary' : 'default'}
            onClick={function() { handleToolChange('Length'); }}
          >
            <Straighten />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate Left">
          <IconButton onClick={handleRotateLeft}>
            <RotateLeft />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate Right">
          <IconButton onClick={handleRotateRight}>
            <RotateRight />
          </IconButton>
        </Tooltip>

        <Tooltip title="Reset">
          <IconButton onClick={handleReset}>
            <Typography variant="caption">RESET</Typography>
          </IconButton>
        </Tooltip>
      </Toolbar>
      
      <div className={classes.viewerContainer}>
        <div
          ref={elementRef}
          className={classes.canvas}
          onContextMenu={function(e) { e.preventDefault(); }}
        />
        
        {loading && (
          <div className={classes.loading}>
            <CircularProgress />
            <Typography variant="body2" style={{ marginTop: 8 }}>
              Loading DICOM image...
            </Typography>
          </div>
        )}
        
        {imageInfo && !loading && (
          <div className={classes.overlay}>
            <div>File: {fileName}</div>
            <div>Size: {imageInfo.width} × {imageInfo.height}</div>
            <div>Zoom: {(imageInfo.zoom * 100).toFixed(0)}%</div>
            <div>WC: {imageInfo.windowCenter}</div>
            <div>WW: {imageInfo.windowWidth}</div>
            <div>Rotation: {imageInfo.rotation}°</div>
          </div>
        )}
      </div>
    </Paper>
  );
}

export default DicomViewer;