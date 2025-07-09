import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * Instances publications
 */

Meteor.publish('instances.bySeries', function(seriesUID) {
  check(seriesUID, String);
  
  return Instances.find({ seriesUID }, {
    fields: {
      sopUID: 1,
      sopInstanceUID: 1,
      seriesUID: 1,
      studyUID: 1,
      instanceNumber: 1,
      sopClassUID: 1,
      rows: 1,
      columns: 1,
      imagePositionPatient: 1,
      imageOrientationPatient: 1,
      pixelSpacing: 1,
      sliceLocation: 1,
      sliceThickness: 1,
      windowCenter: 1,
      windowWidth: 1,
      wadoUri: 1,
      createdAt: 1,
      // Exclude large metadata for list view performance
    },
    sort: { instanceNumber: 1, sliceLocation: 1 },
  });
});

Meteor.publish('instance.detail', function(sopInstanceUID) {
  check(sopInstanceUID, String);
  
  return Instances.find({ sopInstanceUID });
});

Meteor.publish('instances.metadata', function(sopInstanceUIDs) {
  check(sopInstanceUIDs, [String]);
  
  // Limit to prevent abuse
  const limitedUIDs = sopInstanceUIDs.slice(0, 100);
  
  return Instances.find(
    { sopInstanceUID: { $in: limitedUIDs } },
    {
      fields: {
        sopInstanceUID: 1,
        seriesUID: 1,
        instanceNumber: 1,
        imagePositionPatient: 1,
        imageOrientationPatient: 1,
        pixelSpacing: 1,
        sliceLocation: 1,
        windowCenter: 1,
        windowWidth: 1,
        wadoUri: 1,
      },
    }
  );
});

console.log('🖼️ Instances publications registered');