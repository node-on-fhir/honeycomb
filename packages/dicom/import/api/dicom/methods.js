// imports/api/dicom/methods.js (Enhanced version)
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DicomFiles, DicomSeries, DicomStudies, DicomHelpers } from './collection';
import { get, set } from 'lodash';
import moment from 'moment';

Meteor.methods({
  'dicom.uploadFile': async function(fileData, fileName, dicomMetadata, conversionInfo = null) {
    check(fileData, String);
    check(fileName, String);
    check(dicomMetadata, Object);
    check(conversionInfo, Match.OneOf(Object, null));
    
    try {
      const studyInstanceUID = get(dicomMetadata, 'x0020000d.Value.0', 
        get(dicomMetadata, 'string.x0020000d', 'unknown-study'));
      const seriesInstanceUID = get(dicomMetadata, 'x0020000e.Value.0',
        get(dicomMetadata, 'string.x0020000e', 'unknown-series'));
      const sopInstanceUID = get(dicomMetadata, 'x00080018.Value.0',
        get(dicomMetadata, 'string.x00080018', 'unknown-instance'));
      
      // Enhanced patient name handling for converted files
      let patientName = DicomHelpers.getPatientName(dicomMetadata);
      if (conversionInfo && conversionInfo.wasConverted) {
        patientName = get(conversionInfo, 'metadata.patientName', patientName);
      }
      
      // Create or update study with enhanced metadata
      const studyData = {
        studyInstanceUID: studyInstanceUID,
        patientName: patientName,
        patientId: DicomHelpers.getPatientId(dicomMetadata),
        studyDate: DicomHelpers.getStudyDate(dicomMetadata),
        studyTime: DicomHelpers.getStudyTime(dicomMetadata),
        studyDescription: DicomHelpers.getStudyDescription(dicomMetadata),
        modality: DicomHelpers.getModality(dicomMetadata),
        updatedAt: new Date(),
        // Add conversion tracking
        hasConvertedImages: conversionInfo ? true : false,
        originalFormats: conversionInfo ? [conversionInfo.originalFormat] : []
      };
      
      await DicomStudies.upsertAsync(
        { studyInstanceUID: studyInstanceUID },
        { 
          $set: studyData, 
          $setOnInsert: { createdAt: new Date() },
          $addToSet: conversionInfo ? { originalFormats: conversionInfo.originalFormat } : {}
        }
      );
      
      // Create or update series with enhanced metadata
      const seriesData = {
        seriesInstanceUID: seriesInstanceUID,
        studyInstanceUID: studyInstanceUID,
        seriesDescription: DicomHelpers.getSeriesDescription(dicomMetadata),
        modality: DicomHelpers.getModality(dicomMetadata),
        updatedAt: new Date(),
        // Track if this series contains converted images
        hasConvertedImages: conversionInfo ? true : false,
        conversionSource: conversionInfo ? conversionInfo.originalFormat : null
      };
      
      await DicomSeries.upsertAsync(
        { seriesInstanceUID: seriesInstanceUID },
        { $set: seriesData, $setOnInsert: { createdAt: new Date() } }
      );
      
      // Store DICOM file with enhanced metadata
      const fileRecord = {
        fileName: fileName,
        sopInstanceUID: sopInstanceUID,
        seriesInstanceUID: seriesInstanceUID,
        studyInstanceUID: studyInstanceUID,
        fileData: fileData,
        metadata: dicomMetadata,
        instanceNumber: parseInt(DicomHelpers.getInstanceNumber(dicomMetadata)) || 1,
        sliceLocation: parseFloat(DicomHelpers.getSliceLocation(dicomMetadata)) || 0,
        uploadedAt: new Date(),
        // Conversion tracking
        wasConverted: conversionInfo ? true : false,
        originalFormat: conversionInfo ? conversionInfo.originalFormat : 'dicom',
        originalFileName: conversionInfo ? conversionInfo.originalFileName : fileName,
        conversionMetadata: conversionInfo ? conversionInfo.metadata : null
      };
      
      const fileId = await DicomFiles.insertAsync(fileRecord);
      
      // Log successful upload with conversion info
      console.log(`DICOM file uploaded: ${fileName}`, {
        fileId: fileId,
        wasConverted: fileRecord.wasConverted,
        originalFormat: fileRecord.originalFormat,
        studyUID: studyInstanceUID
      });
      
      return {
        success: true,
        fileId: fileId,
        studyInstanceUID: studyInstanceUID,
        seriesInstanceUID: seriesInstanceUID,
        wasConverted: fileRecord.wasConverted,
        originalFormat: fileRecord.originalFormat
      };
      
    } catch (error) {
      console.error('Error uploading DICOM file:', error);
      throw new Meteor.Error('upload-failed', `Failed to upload DICOM file: ${error.message}`);
    }
  },
  
  'dicom.getConversionStats': async function() {
    const totalFiles = await DicomFiles.countAsync({});
    const convertedFiles = await DicomFiles.countAsync({ wasConverted: true });
    const conversionFormats = await DicomFiles.findAsync(
      { wasConverted: true }, 
      { fields: { originalFormat: 1 } }
    ).fetchAsync();
    
    const formatStats = conversionFormats.reduce(function(stats, file) {
      const format = file.originalFormat || 'unknown';
      stats[format] = (stats[format] || 0) + 1;
      return stats;
    }, {});
    
    return {
      totalFiles: totalFiles,
      convertedFiles: convertedFiles,
      nativeFiles: totalFiles - convertedFiles,
      conversionRate: totalFiles > 0 ? (convertedFiles / totalFiles * 100).toFixed(1) : 0,
      formatBreakdown: formatStats
    };
  },
  
  'dicom.getFile': async function(fileId) {
    check(fileId, String);
    
    const file = await DicomFiles.findOneAsync({ _id: fileId });
    if (!file) {
      throw new Meteor.Error('file-not-found', 'DICOM file not found');
    }
    
    return file;
  },
  
  'dicom.deleteFile': async function(fileId) {
    check(fileId, String);
    
    const result = await DicomFiles.removeAsync({ _id: fileId });
    return { success: result > 0 };
  },
  
  'dicom.getSeriesImages': async function(seriesInstanceUID) {
    check(seriesInstanceUID, String);
    
    const images = await DicomFiles.findAsync(
      { seriesInstanceUID: seriesInstanceUID },
      { sort: { instanceNumber: 1, sliceLocation: 1 } }
    ).fetchAsync();
    
    return images.map(function(image) {
      return {
        _id: image._id,
        fileName: image.fileName,
        instanceNumber: image.instanceNumber,
        sliceLocation: image.sliceLocation,
        sopInstanceUID: image.sopInstanceUID,
        wasConverted: image.wasConverted || false,
        originalFormat: image.originalFormat || 'dicom',
        originalFileName: image.originalFileName || image.fileName
      };
    });
  }
});