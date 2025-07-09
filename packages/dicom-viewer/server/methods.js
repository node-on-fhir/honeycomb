// imports/api/dicom/methods.js (Combined and namespaced version)
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';
import moment from 'moment';

// Import collections - these should be imported from the proper location
// Assuming these collections exist in the clinical-dicom-viewer package
import { 
  DicomFiles, 
  DicomSeries, 
  DicomStudies, 
  DicomHelpers,
  Studies,
  Series,
  Instances 
} from '../collections';

/**
 * Combined DICOM methods with clinical.dicom namespace
 */

// ============================================
// Original methods from methods.js
// ============================================

Meteor.methods({
  'clinical.dicom.uploadFile': async function(fileData, fileName, dicomMetadata, conversionInfo = null) {
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
  
  'clinical.dicom.getConversionStats': async function() {
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
  
  'clinical.dicom.getFile': async function(fileId) {
    check(fileId, String);
    
    const file = await DicomFiles.findOneAsync({ _id: fileId });
    if (!file) {
      throw new Meteor.Error('file-not-found', 'DICOM file not found');
    }
    
    return file;
  },
  
  'clinical.dicom.deleteFile': async function(fileId) {
    check(fileId, String);
    
    const result = await DicomFiles.removeAsync({ _id: fileId });
    return { success: result > 0 };
  },
  
  'clinical.dicom.getSeriesImages': async function(seriesInstanceUID) {
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
  },

  // ============================================
  // Annotation methods
  // ============================================

  /**
   * Save annotation to instance
   */
  async 'clinical.dicom.saveAnnotation'(annotationData) {
    check(annotationData, {
      sopInstanceUID: String,
      type: String,
      data: Object,
      userId: Match.Maybe(String),
    });
    
    try {
      const { sopInstanceUID, type, data, userId } = annotationData;
      
      // Find the instance
      const instance = await Instances.findOneAsync({ sopInstanceUID });
      if (!instance) {
        throw new Meteor.Error('instance-not-found', 'Instance not found');
      }
      
      // Create annotation object
      const annotation = {
        id: Random.id(),
        type,
        data,
        userId: userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add annotation to instance metadata
      const result = await Instances.updateAsync(
        { sopInstanceUID },
        {
          $push: { 'metadata.annotations': annotation },
          $set: { updatedAt: new Date() },
        }
      );
      
      if (result) {
        console.log(`Saved ${type} annotation to instance ${sopInstanceUID}`);
        return { success: true, annotationId: annotation.id };
      } else {
        throw new Meteor.Error('annotation-save-failed', 'Failed to save annotation');
      }
      
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw new Meteor.Error('annotation-save-failed', error.message);
    }
  },
  
  /**
   * Update existing annotation
   */
  async 'clinical.dicom.updateAnnotation'(updateData) {
    check(updateData, {
      sopInstanceUID: String,
      annotationId: String,
      data: Object,
    });
    
    try {
      const { sopInstanceUID, annotationId, data } = updateData;
      
      const result = await Instances.updateAsync(
        { 
          sopInstanceUID,
          'metadata.annotations.id': annotationId,
        },
        {
          $set: {
            'metadata.annotations.$.data': data,
            'metadata.annotations.$.updatedAt': new Date(),
            updatedAt: new Date(),
          },
        }
      );
      
      if (result) {
        console.log(`Updated annotation ${annotationId} on instance ${sopInstanceUID}`);
        return { success: true };
      } else {
        throw new Meteor.Error('annotation-not-found', 'Annotation not found');
      }
      
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw new Meteor.Error('annotation-update-failed', error.message);
    }
  },
  
  /**
   * Delete annotation
   */
  async 'clinical.dicom.deleteAnnotation'(deleteData) {
    check(deleteData, {
      sopInstanceUID: String,
      annotationId: String,
    });
    
    try {
      const { sopInstanceUID, annotationId } = deleteData;
      
      const result = await Instances.updateAsync(
        { sopInstanceUID },
        {
          $pull: { 'metadata.annotations': { id: annotationId } },
          $set: { updatedAt: new Date() },
        }
      );
      
      if (result) {
        console.log(`Deleted annotation ${annotationId} from instance ${sopInstanceUID}`);
        return { success: true };
      } else {
        throw new Meteor.Error('annotation-not-found', 'Annotation not found');
      }
      
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw new Meteor.Error('annotation-delete-failed', error.message);
    }
  },
  
  /**
   * Get all annotations for an instance
   */
  async 'clinical.dicom.getInstanceAnnotations'(sopInstanceUID) {
    check(sopInstanceUID, String);
    
    try {
      const instance = await Instances.findOneAsync(
        { sopInstanceUID },
        { fields: { 'metadata.annotations': 1 } }
      );
      
      if (!instance) {
        throw new Meteor.Error('instance-not-found', 'Instance not found');
      }
      
      const annotations = instance.metadata?.annotations || [];
      
      return {
        sopInstanceUID,
        annotations,
        count: annotations.length,
      };
      
    } catch (error) {
      console.error('Error getting instance annotations:', error);
      throw new Meteor.Error('annotations-fetch-failed', error.message);
    }
  },
  
  /**
   * Get all annotations for a series
   */
  async 'clinical.dicom.getSeriesAnnotations'(seriesUID) {
    check(seriesUID, String);
    
    try {
      const instances = await Instances.find(
        { seriesUID },
        { fields: { sopInstanceUID: 1, 'metadata.annotations': 1 } }
      ).fetchAsync();
      
      const seriesAnnotations = instances.map(function(instance) {
        return {
          sopInstanceUID: instance.sopInstanceUID,
          annotations: instance.metadata?.annotations || [],
        };
      });
      
      const totalAnnotations = seriesAnnotations.reduce(function(sum, instance) {
        return sum + instance.annotations.length;
      }, 0);
      
      return {
        seriesUID,
        instances: seriesAnnotations,
        totalAnnotations,
      };
      
    } catch (error) {
      console.error('Error getting series annotations:', error);
      throw new Meteor.Error('annotations-fetch-failed', error.message);
    }
  },

  // ============================================
  // Metadata methods
  // ============================================

  /**
   * Get detailed study metadata
   */
  async 'clinical.dicom.getStudyMetadata'(studyUID) {
    check(studyUID, String);
    
    try {
      // Find study
      const study = await Studies.findOneAsync({ studyUID });
      if (!study) {
        throw new Meteor.Error('study-not-found', 'Study not found');
      }
      
      // Find all series for this study
      const series = await Series.find({ studyUID }).fetchAsync();
      
      // Get instance counts for each series
      const seriesWithCounts = await Promise.all(
        series.map(async function(s) {
          const instanceCount = await Instances.countAsync({ seriesUID: s.seriesUID });
          return { ...s, instanceCount };
        })
      );
      
      return {
        ...study,
        series: seriesWithCounts,
      };
      
    } catch (error) {
      console.error('Error getting study metadata:', error);
      throw new Meteor.Error('metadata-fetch-failed', error.message);
    }
  },
  
  /**
   * Get series metadata with instances
   */
  async 'clinical.dicom.getSeriesMetadata'(seriesUID) {
    check(seriesUID, String);
    
    try {
      // Find series
      const series = await Series.findOneAsync({ seriesUID });
      if (!series) {
        throw new Meteor.Error('series-not-found', 'Series not found');
      }
      
      // Find all instances for this series
      const instances = await Instances.find(
        { seriesUID },
        { sort: { instanceNumber: 1 } }
      ).fetchAsync();
      
      return {
        ...series,
        instances,
      };
      
    } catch (error) {
      console.error('Error getting series metadata:', error);
      throw new Meteor.Error('metadata-fetch-failed', error.message);
    }
  },
  
  /**
   * Update study metadata
   */
  async 'clinical.dicom.updateStudyMetadata'(studyUID, updates) {
    check(studyUID, String);
    check(updates, Object);
    
    try {
      const result = await Studies.updateAsync(
        { studyUID },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        }
      );
      
      return { success: true, modifiedCount: result };
      
    } catch (error) {
      console.error('Error updating study metadata:', error);
      throw new Meteor.Error('metadata-update-failed', error.message);
    }
  },
  
  /**
   * Delete study and all related data
   */
  async 'clinical.dicom.deleteStudy'(studyUID) {
    check(studyUID, String);
    
    try {
      // Get all series UIDs for this study
      const series = await Series.find({ studyUID }).fetchAsync();
      const seriesUIDs = series.map(s => s.seriesUID);
      
      // Delete instances
      const instancesDeleted = await Instances.removeAsync({ 
        seriesUID: { $in: seriesUIDs } 
      });
      
      // Delete series
      const seriesDeleted = await Series.removeAsync({ studyUID });
      
      // Delete study
      const studyDeleted = await Studies.removeAsync({ studyUID });
      
      console.log(`Deleted study ${studyUID}: ${studyDeleted} study, ${seriesDeleted} series, ${instancesDeleted} instances`);
      
      return {
        success: true,
        deleted: {
          studies: studyDeleted,
          series: seriesDeleted,
          instances: instancesDeleted,
        },
      };
      
    } catch (error) {
      console.error('Error deleting study:', error);
      throw new Meteor.Error('study-delete-failed', error.message);
    }
  },

  // ============================================
  // Streaming methods
  // ============================================

  /**
   * Generate WADO URI for instance
   */
  async 'clinical.dicom.getInstanceWadoUri'(sopInstanceUID) {
    check(sopInstanceUID, String);
    
    try {
      const instance = await Instances.findOneAsync({ sopInstanceUID });
      if (!instance) {
        throw new Meteor.Error('instance-not-found', 'Instance not found');
      }
      
      // Generate WADO URI
      const baseUrl = Meteor.absoluteUrl('api/dicom/files');
      const wadoUri = `${baseUrl}/${instance.sopInstanceUID}`;
      
      // Update instance with WADO URI if not set
      if (!instance.wadoUri) {
        await Instances.updateAsync(
          { sopInstanceUID },
          { $set: { wadoUri, updatedAt: new Date() } }
        );
      }
      
      return wadoUri;
      
    } catch (error) {
      console.error('Error generating WADO URI:', error);
      throw new Meteor.Error('wado-uri-failed', error.message);
    }
  },
  
  /**
   * Get streaming URLs for series
   */
  async 'clinical.dicom.getSeriesStreamingUrls'(seriesUID) {
    check(seriesUID, String);
    
    try {
      const instances = await Instances.find(
        { seriesUID },
        { sort: { instanceNumber: 1 } }
      ).fetchAsync();
      
      if (instances.length === 0) {
        throw new Meteor.Error('series-empty', 'No instances found for series');
      }
      
      const baseUrl = Meteor.absoluteUrl('api/dicom/files');
      
      const streamingUrls = instances.map(function(instance) {
        return {
          sopInstanceUID: instance.sopInstanceUID,
          instanceNumber: instance.instanceNumber,
          wadoUri: instance.wadoUri || `${baseUrl}/${instance.sopInstanceUID}`,
        };
      });
      
      return streamingUrls;
      
    } catch (error) {
      console.error('Error getting streaming URLs:', error);
      throw new Meteor.Error('streaming-urls-failed', error.message);
    }
  },
  
  /**
   * Prefetch instances for better performance
   */
  async 'clinical.dicom.prefetchInstances'(instanceUIDs) {
    check(instanceUIDs, [String]);
    
    try {
      // Mark instances as high priority for caching
      const result = await Instances.updateAsync(
        { sopInstanceUID: { $in: instanceUIDs } },
        { 
          $set: { 
            priority: 'high',
            lastAccessed: new Date(),
            updatedAt: new Date(),
          }
        },
        { multi: true }
      );
      
      console.log(`Marked ${result} instances for prefetching`);
      
      return { success: true, markedCount: result };
      
    } catch (error) {
      console.error('Error marking instances for prefetch:', error);
      throw new Meteor.Error('prefetch-failed', error.message);
    }
  },
  
  /**
   * Get cache statistics
   */
  async 'clinical.dicom.getCacheStats'() {
    try {
      const totalStudies = await Studies.countAsync();
      const totalSeries = await Series.countAsync();
      const totalInstances = await Instances.countAsync();
      
      // Get approximate file sizes
      const instancesWithSize = await Instances.find(
        { fileSize: { $exists: true } }
      ).fetchAsync();
      
      const totalFileSize = instancesWithSize.reduce(function(sum, instance) {
        return sum + (instance.fileSize || 0);
      }, 0);
      
      return {
        studies: totalStudies,
        series: totalSeries,
        instances: totalInstances,
        totalSizeMB: Math.round(totalFileSize / 1024 / 1024),
        averageFileSizeMB: instancesWithSize.length > 0 
          ? Math.round(totalFileSize / instancesWithSize.length / 1024 / 1024) 
          : 0,
      };
      
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw new Meteor.Error('cache-stats-failed', error.message);
    }
  },

  // ============================================
  // Upload methods
  // ============================================

  /**
   * Process uploaded DICOM file metadata
   */
  async 'clinical.dicom.processUploadedFile'(fileInfo) {
    check(fileInfo, {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      filePath: String,
    });
    
    try {
      console.log('Processing uploaded file:', fileInfo.fileName);
      
      // TODO: Parse DICOM metadata using dicom-parser
      // TODO: Extract study/series/instance information
      // TODO: Store metadata in collections
      // TODO: Generate thumbnails
      // TODO: Set up WADO URI
      
      return {
        success: true,
        message: 'File processing queued',
        fileId: 'placeholder-id',
      };
      
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      throw new Meteor.Error('upload-processing-failed', error.message);
    }
  },
  
  /**
   * Get upload progress for a batch
   */
  async 'clinical.dicom.getUploadProgress'(batchId) {
    check(batchId, String);
    
    // TODO: Implement progress tracking
    return {
      batchId,
      completed: 0,
      total: 0,
      currentFile: null,
      status: 'pending',
    };
  },
  
  /**
   * Cancel upload batch
   */
  async 'clinical.dicom.cancelUpload'(batchId) {
    check(batchId, String);
    
    // TODO: Implement upload cancellation
    return { success: true };
  },
});

console.log('Clinical DICOM methods registered');