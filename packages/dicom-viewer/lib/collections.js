// Combined DICOM collections for clinical-dicom-viewer package
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// =============================================================================
// Core DICOM Collections from packages/dicom/import/api/dicom/collection.js
// =============================================================================

export const DicomFiles = new Mongo.Collection('dicomFiles');
export const DicomSeries = new Mongo.Collection('dicomSeries');
export const DicomStudies = new Mongo.Collection('dicomStudies');

// Helper functions for DICOM data access
export const DicomHelpers = {
  getPatientName: function(dicomData) {
    return get(dicomData, 'string.x00100010', 'Unknown Patient');
  },
  
  getPatientId: function(dicomData) {
    return get(dicomData, 'string.x00100020', 'Unknown ID');
  },
  
  getStudyDate: function(dicomData) {
    const studyDate = get(dicomData, 'string.x00080020', '');
    if (!studyDate || studyDate === 'Unknown Date') {
      return 'Unknown Date';
    }
    
    // Handle DICOM date format (YYYYMMDD)
    if (studyDate.length === 8 && /^\d{8}$/.test(studyDate)) {
      const year = studyDate.substring(0, 4);
      const month = studyDate.substring(4, 6);
      const day = studyDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    // Try to parse with moment, but handle invalid dates
    const parsed = moment(studyDate, 'YYYYMMDD', true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
    
    return 'Unknown Date';
  },
  
  getStudyTime: function(dicomData) {
    const studyTime = get(dicomData, 'string.x00080030', '');
    if (!studyTime || studyTime === 'Unknown Time') {
      return 'Unknown Time';
    }
    
    // Handle DICOM time format (HHMMSS or HHMMSS.FFFFFF)
    if (studyTime.length >= 6 && /^\d{6}/.test(studyTime)) {
      const hours = studyTime.substring(0, 2);
      const minutes = studyTime.substring(2, 4);
      const seconds = studyTime.substring(4, 6);
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // Try to parse with moment, but handle invalid times
    const parsed = moment(studyTime, 'HHmmss', true);
    if (parsed.isValid()) {
      return parsed.format('HH:mm:ss');
    }
    
    return 'Unknown Time';
  },
  
  getModality: function(dicomData) {
    return get(dicomData, 'string.x00080060', 'Unknown');
  },
  
  getStudyDescription: function(dicomData) {
    return get(dicomData, 'string.x00081030', 'No Description');
  },
  
  getSeriesDescription: function(dicomData) {
    return get(dicomData, 'string.x0008103e', 'No Description');
  },
  
  getInstanceNumber: function(dicomData) {
    return get(dicomData, 'string.x00200013', '1');
  },
  
  getSliceLocation: function(dicomData) {
    return get(dicomData, 'string.x00201041', '0');
  },
  
  getPixelSpacing: function(dicomData) {
    return get(dicomData, 'string.x00280030', '1\\1');
  },
  
  getWindowCenter: function(dicomData) {
    return get(dicomData, 'string.x00281050', '');
  },
  
  getWindowWidth: function(dicomData) {
    return get(dicomData, 'string.x00281051', '');
  }
};

// =============================================================================
// Instances Collection from packages/dicom/import/api/dicom/collections/instances.js
// =============================================================================

export const InstancesCollection = new Mongo.Collection('instances');
export const Instances = InstancesCollection; // Alias for compatibility

// Instance schema validation
export const InstanceSchema = {
  sopUID: String,
  sopInstanceUID: String,
  seriesUID: String,
  studyUID: String,
  instanceNumber: Match.Maybe(Number),
  sopClassUID: String,
  transferSyntaxUID: Match.Maybe(String),
  imageType: Match.Maybe([String]),
  acquisitionNumber: Match.Maybe(Number),
  acquisitionDate: Match.Maybe(Date),
  acquisitionTime: Match.Maybe(String),
  contentDate: Match.Maybe(Date),
  contentTime: Match.Maybe(String),
  imagePositionPatient: Match.Maybe([Number]),
  imageOrientationPatient: Match.Maybe([Number]),
  pixelSpacing: Match.Maybe([Number]),
  sliceLocation: Match.Maybe(Number),
  sliceThickness: Match.Maybe(Number),
  rows: Match.Maybe(Number),
  columns: Match.Maybe(Number),
  bitsAllocated: Match.Maybe(Number),
  bitsStored: Match.Maybe(Number),
  highBit: Match.Maybe(Number),
  pixelRepresentation: Match.Maybe(Number),
  photometricInterpretation: Match.Maybe(String),
  samplesPerPixel: Match.Maybe(Number),
  planarConfiguration: Match.Maybe(Number),
  windowCenter: Match.Maybe(Number),
  windowWidth: Match.Maybe(Number),
  rescaleIntercept: Match.Maybe(Number),
  rescaleSlope: Match.Maybe(Number),
  fileSize: Match.Maybe(Number),
  filePath: Match.Maybe(String), // Server-side file path
  wadoUri: Match.Maybe(String), // WADO URI for client access
  metadata: Match.Maybe(Object),
  createdAt: Date,
  updatedAt: Date,
};

// Validate instance document
export function validateInstance(instance) {
  check(instance, InstanceSchema);
}

// Create instance document from DICOM metadata
export function createInstanceFromDicom(dicomMetadata, fileInfo = {}) {
  const now = new Date();
  
  return {
    sopUID: dicomMetadata.sopInstanceUID,
    sopInstanceUID: dicomMetadata.sopInstanceUID,
    seriesUID: dicomMetadata.seriesInstanceUID,
    studyUID: dicomMetadata.studyInstanceUID,
    instanceNumber: dicomMetadata.instanceNumber || null,
    sopClassUID: dicomMetadata.sopClassUID || '',
    transferSyntaxUID: dicomMetadata.transferSyntaxUID || null,
    imageType: dicomMetadata.imageType || null,
    acquisitionNumber: dicomMetadata.acquisitionNumber || null,
    acquisitionDate: dicomMetadata.acquisitionDate ? new Date(dicomMetadata.acquisitionDate) : null,
    acquisitionTime: dicomMetadata.acquisitionTime || null,
    contentDate: dicomMetadata.contentDate ? new Date(dicomMetadata.contentDate) : null,
    contentTime: dicomMetadata.contentTime || null,
    imagePositionPatient: dicomMetadata.imagePositionPatient || null,
    imageOrientationPatient: dicomMetadata.imageOrientationPatient || null,
    pixelSpacing: dicomMetadata.pixelSpacing || null,
    sliceLocation: dicomMetadata.sliceLocation || null,
    sliceThickness: dicomMetadata.sliceThickness || null,
    rows: dicomMetadata.rows || null,
    columns: dicomMetadata.columns || null,
    bitsAllocated: dicomMetadata.bitsAllocated || null,
    bitsStored: dicomMetadata.bitsStored || null,
    highBit: dicomMetadata.highBit || null,
    pixelRepresentation: dicomMetadata.pixelRepresentation || null,
    photometricInterpretation: dicomMetadata.photometricInterpretation || null,
    samplesPerPixel: dicomMetadata.samplesPerPixel || null,
    planarConfiguration: dicomMetadata.planarConfiguration || null,
    windowCenter: dicomMetadata.windowCenter || null,
    windowWidth: dicomMetadata.windowWidth || null,
    rescaleIntercept: dicomMetadata.rescaleIntercept || null,
    rescaleSlope: dicomMetadata.rescaleSlope || null,
    fileSize: fileInfo.size || null,
    filePath: fileInfo.path || null,
    wadoUri: fileInfo.wadoUri || null,
    metadata: dicomMetadata,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Series Collection from packages/dicom/import/api/dicom/collections/series.js
// =============================================================================

export const SeriesCollection = new Mongo.Collection('series');
export const Series = SeriesCollection; // Alias for compatibility

// Series schema validation
export const SeriesSchema = {
  seriesUID: String,
  seriesInstanceUID: String,
  studyUID: String,
  seriesNumber: Match.Maybe(Number),
  seriesDescription: Match.Maybe(String),
  modality: String,
  bodyPartExamined: Match.Maybe(String),
  protocolName: Match.Maybe(String),
  seriesDate: Match.Maybe(Date),
  seriesTime: Match.Maybe(String),
  instanceCount: Match.Maybe(Number),
  imageOrientationPatient: Match.Maybe([Number]),
  imagePositionPatient: Match.Maybe([Number]),
  pixelSpacing: Match.Maybe([Number]),
  sliceThickness: Match.Maybe(Number),
  spacingBetweenSlices: Match.Maybe(Number),
  metadata: Match.Maybe(Object),
  thumbnail: Match.Maybe(String), // Base64 thumbnail image
  createdAt: Date,
  updatedAt: Date,
};

// Validate series document
export function validateSeries(series) {
  check(series, SeriesSchema);
}

// Create series document from DICOM metadata
export function createSeriesFromDicom(dicomMetadata) {
  const now = new Date();
  
  return {
    seriesUID: dicomMetadata.seriesInstanceUID,
    seriesInstanceUID: dicomMetadata.seriesInstanceUID,
    studyUID: dicomMetadata.studyInstanceUID,
    seriesNumber: dicomMetadata.seriesNumber || null,
    seriesDescription: dicomMetadata.seriesDescription || null,
    modality: dicomMetadata.modality || 'OT',
    bodyPartExamined: dicomMetadata.bodyPartExamined || null,
    protocolName: dicomMetadata.protocolName || null,
    seriesDate: dicomMetadata.seriesDate ? new Date(dicomMetadata.seriesDate) : null,
    seriesTime: dicomMetadata.seriesTime || null,
    instanceCount: 0,
    imageOrientationPatient: dicomMetadata.imageOrientationPatient || null,
    imagePositionPatient: dicomMetadata.imagePositionPatient || null,
    pixelSpacing: dicomMetadata.pixelSpacing || null,
    sliceThickness: dicomMetadata.sliceThickness || null,
    spacingBetweenSlices: dicomMetadata.spacingBetweenSlices || null,
    metadata: dicomMetadata,
    thumbnail: null,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// User Sessions Collection from packages/dicom/import/api/dicom/collections/user-sessions.js
// =============================================================================

export const UserSessionsCollection = new Mongo.Collection('userSessions');
export const UserSessions = UserSessionsCollection; // Alias for compatibility

// User session schema validation
export const UserSessionSchema = {
  sessionId: String,
  userId: Match.Maybe(String),
  clientIP: Match.Maybe(String),
  userAgent: Match.Maybe(String),
  currentStudyUID: Match.Maybe(String),
  currentSeriesUID: Match.Maybe(String),
  currentInstanceUID: Match.Maybe(String),
  viewportSettings: Match.Maybe(Object),
  toolSettings: Match.Maybe(Object),
  preferences: Match.Maybe(Object),
  lastActivity: Date,
  createdAt: Date,
  updatedAt: Date,
};

// Validate user session document
export function validateUserSession(session) {
  check(session, UserSessionSchema);
}

// Create user session document
export function createUserSession(sessionData) {
  const now = new Date();
  
  return {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId || null,
    clientIP: sessionData.clientIP || null,
    userAgent: sessionData.userAgent || null,
    currentStudyUID: null,
    currentSeriesUID: null,
    currentInstanceUID: null,
    viewportSettings: {
      windowCenter: null,
      windowWidth: null,
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipH: false,
      flipV: false,
    },
    toolSettings: {
      activeTool: 'pan',
      measurements: [],
      annotations: [],
    },
    preferences: {
      theme: 'dark',
      layout: 'single',
      autoPlay: false,
      playbackSpeed: 100,
    },
    lastActivity: now,
    createdAt: now,
    updatedAt: now,
  };
}

// Update session activity
export async function updateSessionActivity(sessionId) {
  if (Meteor.isServer) {
    return await UserSessionsCollection.updateAsync(
      { sessionId },
      { 
        $set: { 
          lastActivity: new Date(),
          updatedAt: new Date(),
        }
      }
    );
  }
}

// Update session state
export async function updateSessionState(sessionId, stateUpdate) {
  if (Meteor.isServer) {
    return await UserSessionsCollection.updateAsync(
      { sessionId },
      { 
        $set: { 
          ...stateUpdate,
          lastActivity: new Date(),
          updatedAt: new Date(),
        }
      }
    );
  }
}

// =============================================================================
// Global References for Backward Compatibility
// =============================================================================

// Set up global references for imports (maintaining backward compatibility)
if (Meteor.isServer) {
  // Core collections
  global.DicomFiles = DicomFiles;
  global.DicomSeries = DicomSeries;
  global.DicomStudies = DicomStudies;
  
  // Extended collections
  global.Instances = InstancesCollection;
  global.Series = SeriesCollection;
  global.UserSessions = UserSessionsCollection;
}

if (Meteor.isClient) {
  // Core collections
  window.DicomFiles = DicomFiles;
  window.DicomSeries = DicomSeries;
  window.DicomStudies = DicomStudies;
  
  // Extended collections
  window.Instances = InstancesCollection;
  window.Series = SeriesCollection;
  window.UserSessions = UserSessionsCollection;
}

// =============================================================================
// Collection Aliases for Convenience
// =============================================================================

export const Collections = {
  DicomFiles,
  DicomSeries,
  DicomStudies,
  Instances: InstancesCollection,
  Series: SeriesCollection,
  UserSessions: UserSessionsCollection,
};

// Default export for convenience
export default Collections;