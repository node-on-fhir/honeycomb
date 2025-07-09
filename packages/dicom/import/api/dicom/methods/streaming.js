import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * DICOM streaming methods
 */

Meteor.methods({
  /**
   * Generate WADO URI for instance
   */
  async 'dicom.getInstanceWadoUri'(sopInstanceUID) {
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
  async 'dicom.getSeriesStreamingUrls'(seriesUID) {
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
  async 'dicom.prefetchInstances'(instanceUIDs) {
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
      
      console.log(`📋 Marked ${result} instances for prefetching`);
      
      return { success: true, markedCount: result };
      
    } catch (error) {
      console.error('Error marking instances for prefetch:', error);
      throw new Meteor.Error('prefetch-failed', error.message);
    }
  },
  
  /**
   * Get cache statistics
   */
  async 'dicom.getCacheStats'() {
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
});

console.log('🌊 Streaming methods registered');