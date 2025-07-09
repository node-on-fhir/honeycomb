// imports/api/dicom/collection.js
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';
import moment from 'moment';

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