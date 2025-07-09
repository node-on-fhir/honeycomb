import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * Series publications
 */

Meteor.publish('series.byStudy', function(studyUID) {
  check(studyUID, String);
  
  return Series.find({ studyUID }, {
    sort: { seriesNumber: 1, createdAt: 1 },
  });
});

Meteor.publish('series.detail', function(seriesUID) {
  check(seriesUID, String);
  
  return Series.find({ seriesUID });
});

Meteor.publish('series.byModality', function(modality) {
  check(modality, String);
  
  return Series.find({ modality }, {
    fields: {
      seriesUID: 1,
      studyUID: 1,
      seriesNumber: 1,
      seriesDescription: 1,
      modality: 1,
      instanceCount: 1,
      thumbnail: 1,
      createdAt: 1,
    },
    sort: { createdAt: -1 },
    limit: 100,
  });
});

console.log('📋 Series publications registered');