import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * DICOM annotations and measurements methods
 */

Meteor.methods({
  /**
   * Save annotation to instance
   */
  async 'dicom.saveAnnotation'(annotationData) {
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
        console.log(`✏️ Saved ${type} annotation to instance ${sopInstanceUID}`);
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
  async 'dicom.updateAnnotation'(updateData) {
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
        console.log(`📝 Updated annotation ${annotationId} on instance ${sopInstanceUID}`);
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
  async 'dicom.deleteAnnotation'(deleteData) {
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
        console.log(`🗑️ Deleted annotation ${annotationId} from instance ${sopInstanceUID}`);
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
  async 'dicom.getInstanceAnnotations'(sopInstanceUID) {
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
  async 'dicom.getSeriesAnnotations'(seriesUID) {
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
});

console.log('📝 Annotation methods registered');