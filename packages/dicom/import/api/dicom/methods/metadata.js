import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * DICOM metadata methods
 */

Meteor.methods({
  /**
   * Get detailed study metadata
   */
  async 'dicom.getStudyMetadata'(studyUID) {
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
  async 'dicom.getSeriesMetadata'(seriesUID) {
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
  async 'dicom.updateStudyMetadata'(studyUID, updates) {
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
  async 'dicom.deleteStudy'(studyUID) {
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
      
      console.log(`🗑️ Deleted study ${studyUID}: ${studyDeleted} study, ${seriesDeleted} series, ${instancesDeleted} instances`);
      
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
});

console.log('🏷️ Metadata methods registered');