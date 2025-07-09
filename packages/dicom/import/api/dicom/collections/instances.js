import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

/**
 * Instances collection for DICOM instance metadata
 */
export const InstancesCollection = new Mongo.Collection('instances');

/**
 * Instance schema validation
 */
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

/**
 * Validate instance document
 */
export function validateInstance(instance) {
  check(instance, InstanceSchema);
}

/**
 * Create instance document from DICOM metadata
 */
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

// Global reference for imports
if (Meteor.isServer) {
  global.Instances = InstancesCollection;
}
if (Meteor.isClient) {
  window.Instances = InstancesCollection;
}