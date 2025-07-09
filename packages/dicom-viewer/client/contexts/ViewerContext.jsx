import React, { createContext, useContext, useReducer } from 'react';
import { get, set } from 'lodash';

// Create context
const ViewerContext = createContext();

// Action types
const VIEWER_ACTIONS = {
  SET_VIEWPORT_SETTINGS: 'SET_VIEWPORT_SETTINGS',
  SET_ACTIVE_TOOL: 'SET_ACTIVE_TOOL',
  SET_WINDOW_LEVEL: 'SET_WINDOW_LEVEL',
  SET_ZOOM: 'SET_ZOOM',
  SET_PAN: 'SET_PAN',
  SET_ROTATION: 'SET_ROTATION',
  SET_FLIP: 'SET_FLIP',
  ADD_MEASUREMENT: 'ADD_MEASUREMENT',
  REMOVE_MEASUREMENT: 'REMOVE_MEASUREMENT',
  ADD_ANNOTATION: 'ADD_ANNOTATION',
  REMOVE_ANNOTATION: 'REMOVE_ANNOTATION',
  SET_LAYOUT: 'SET_LAYOUT',
  SET_PLAYBACK_SETTINGS: 'SET_PLAYBACK_SETTINGS',
  RESET_VIEWPORT: 'RESET_VIEWPORT',
};

// Initial state
const initialState = {
  viewportSettings: {
    windowCenter: null,
    windowWidth: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    rotation: 0,
    flipH: false,
    flipV: false,
  },
  activeTool: 'pan',
  measurements: [],
  annotations: [],
  layout: 'single', // 'single', 'grid-2x2', 'grid-3x3'
  playbackSettings: {
    isPlaying: false,
    frameRate: 10, // fps
    loop: true,
    currentFrame: 0,
  },
  presets: {
    bone: { windowCenter: 400, windowWidth: 1000 },
    lung: { windowCenter: -600, windowWidth: 1200 },
    soft: { windowCenter: 50, windowWidth: 400 },
    brain: { windowCenter: 40, windowWidth: 80 },
  },
};

// Reducer
function viewerReducer(state, action) {
  switch (action.type) {
    case VIEWER_ACTIONS.SET_VIEWPORT_SETTINGS:
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, ...action.payload },
      };
      
    case VIEWER_ACTIONS.SET_ACTIVE_TOOL:
      return { ...state, activeTool: action.payload };
      
    case VIEWER_ACTIONS.SET_WINDOW_LEVEL:
      return {
        ...state,
        viewportSettings: {
          ...state.viewportSettings,
          windowCenter: action.payload.center,
          windowWidth: action.payload.width,
        },
      };
      
    case VIEWER_ACTIONS.SET_ZOOM:
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, zoom: action.payload },
      };
      
    case VIEWER_ACTIONS.SET_PAN:
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, pan: action.payload },
      };
      
    case VIEWER_ACTIONS.SET_ROTATION:
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, rotation: action.payload },
      };
      
    case VIEWER_ACTIONS.SET_FLIP:
      return {
        ...state,
        viewportSettings: {
          ...state.viewportSettings,
          flipH: action.payload.horizontal !== undefined ? action.payload.horizontal : state.viewportSettings.flipH,
          flipV: action.payload.vertical !== undefined ? action.payload.vertical : state.viewportSettings.flipV,
        },
      };
      
    case VIEWER_ACTIONS.ADD_MEASUREMENT:
      return {
        ...state,
        measurements: [...state.measurements, action.payload],
      };
      
    case VIEWER_ACTIONS.REMOVE_MEASUREMENT:
      return {
        ...state,
        measurements: state.measurements.filter(m => m.id !== action.payload),
      };
      
    case VIEWER_ACTIONS.ADD_ANNOTATION:
      return {
        ...state,
        annotations: [...state.annotations, action.payload],
      };
      
    case VIEWER_ACTIONS.REMOVE_ANNOTATION:
      return {
        ...state,
        annotations: state.annotations.filter(a => a.id !== action.payload),
      };
      
    case VIEWER_ACTIONS.SET_LAYOUT:
      return { ...state, layout: action.payload };
      
    case VIEWER_ACTIONS.SET_PLAYBACK_SETTINGS:
      return {
        ...state,
        playbackSettings: { ...state.playbackSettings, ...action.payload },
      };
      
    case VIEWER_ACTIONS.RESET_VIEWPORT:
      return {
        ...state,
        viewportSettings: initialState.viewportSettings,
        measurements: [],
        annotations: [],
      };
      
    default:
      return state;
  }
}

/**
 * Viewer Context Provider
 */
export function ViewerProvider({ children }) {
  const [state, dispatch] = useReducer(viewerReducer, initialState);
  
  /**
   * Set viewport settings
   */
  function setViewportSettings(settings) {
    dispatch({ type: VIEWER_ACTIONS.SET_VIEWPORT_SETTINGS, payload: settings });
  }
  
  /**
   * Set active tool
   */
  function setActiveTool(tool) {
    dispatch({ type: VIEWER_ACTIONS.SET_ACTIVE_TOOL, payload: tool });
  }
  
  /**
   * Set window/level
   */
  function setWindowLevel(center, width) {
    dispatch({ 
      type: VIEWER_ACTIONS.SET_WINDOW_LEVEL, 
      payload: { center, width } 
    });
  }
  
  /**
   * Apply preset window/level
   */
  function applyPreset(presetName) {
    const preset = get(state.presets, presetName);
    if (preset) {
      setWindowLevel(preset.windowCenter, preset.windowWidth);
    }
  }
  
  /**
   * Set zoom level
   */
  function setZoom(zoom) {
    dispatch({ type: VIEWER_ACTIONS.SET_ZOOM, payload: zoom });
  }
  
  /**
   * Set pan position
   */
  function setPan(x, y) {
    dispatch({ type: VIEWER_ACTIONS.SET_PAN, payload: { x, y } });
  }
  
  /**
   * Set rotation
   */
  function setRotation(rotation) {
    dispatch({ type: VIEWER_ACTIONS.SET_ROTATION, payload: rotation });
  }
  
  /**
   * Set flip
   */
  function setFlip(horizontal, vertical) {
    dispatch({ 
      type: VIEWER_ACTIONS.SET_FLIP, 
      payload: { horizontal, vertical } 
    });
  }
  
  /**
   * Add measurement
   */
  function addMeasurement(measurement) {
    const measurementWithId = {
      ...measurement,
      id: measurement.id || Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: VIEWER_ACTIONS.ADD_MEASUREMENT, payload: measurementWithId });
  }
  
  /**
   * Remove measurement
   */
  function removeMeasurement(measurementId) {
    dispatch({ type: VIEWER_ACTIONS.REMOVE_MEASUREMENT, payload: measurementId });
  }
  
  /**
   * Add annotation
   */
  function addAnnotation(annotation) {
    const annotationWithId = {
      ...annotation,
      id: annotation.id || Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: VIEWER_ACTIONS.ADD_ANNOTATION, payload: annotationWithId });
  }
  
  /**
   * Remove annotation
   */
  function removeAnnotation(annotationId) {
    dispatch({ type: VIEWER_ACTIONS.REMOVE_ANNOTATION, payload: annotationId });
  }
  
  /**
   * Set layout
   */
  function setLayout(layout) {
    dispatch({ type: VIEWER_ACTIONS.SET_LAYOUT, payload: layout });
  }
  
  /**
   * Set playback settings
   */
  function setPlaybackSettings(settings) {
    dispatch({ type: VIEWER_ACTIONS.SET_PLAYBACK_SETTINGS, payload: settings });
  }
  
  /**
   * Reset viewport to defaults
   */
  function resetViewport() {
    dispatch({ type: VIEWER_ACTIONS.RESET_VIEWPORT });
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    setViewportSettings,
    setActiveTool,
    setWindowLevel,
    applyPreset,
    setZoom,
    setPan,
    setRotation,
    setFlip,
    addMeasurement,
    removeMeasurement,
    addAnnotation,
    removeAnnotation,
    setLayout,
    setPlaybackSettings,
    resetViewport,
    
    // Computed values
    measurementCount: state.measurements.length,
    annotationCount: state.annotations.length,
    isPlaying: state.playbackSettings.isPlaying,
  };
  
  return (
    <ViewerContext.Provider value={contextValue}>
      {children}
    </ViewerContext.Provider>
  );
}

/**
 * Hook to use viewer context
 */
export function useViewer() {
  const context = useContext(ViewerContext);
  
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  
  return context;
}