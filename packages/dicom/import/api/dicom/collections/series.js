import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

/**
 * Series collection for DICOM series metadata
 */
export const SeriesCollection = new Mongo.Collection('series');

/**
 * Series schema validation
 */
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

/**
 * Validate series document
 */
export function validateSeries(series) {
  check(series, SeriesSchema);
}

/**
 * Create series document from DICOM metadata
 */
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

// Global reference for imports
if (Meteor.isServer) {
  global.Series = SeriesCollection;
}
if (Meteor.isClient) {
  window.Series = SeriesCollection;
}