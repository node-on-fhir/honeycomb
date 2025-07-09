import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * Studies publications
 */

Meteor.publish('studies', function() {
  // For now, publish all studies
  // In production, you might want to add user-based filtering
  
  return Studies.find({}, {
    fields: {
      studyUID: 1,
      studyInstanceUID: 1,
      patientId: 1,
      patientName: 1,
      patientBirthDate: 1,
      patientSex: 1,
      studyDate: 1,
      studyTime: 1,
      studyDescription: 1,
      accessionNumber: 1,
      referringPhysician: 1,
      institutionName: 1,
      seriesCount: 1,
      instanceCount: 1,
      modalities: 1,
      createdAt: 1,
      updatedAt: 1,
      // Exclude large metadata object for list view
    },
    sort: { studyDate: -1, createdAt: -1 },
  });
});

Meteor.publish('study.detail', function(studyUID) {
  check(studyUID, String);
  
  return Studies.find({ studyUID });
});

Meteor.publish('studies.byPatient', function(patientId) {
  check(patientId, String);
  
  return Studies.find({ patientId }, {
    sort: { studyDate: -1, createdAt: -1 },
  });
});

Meteor.publish('studies.recent', function(limit = 50) {
  check(limit, Number);
  
  return Studies.find({}, {
    fields: {
      studyUID: 1,
      patientName: 1,
      studyDate: 1,
      studyDescription: 1,
      modalities: 1,
      seriesCount: 1,
      instanceCount: 1,
      createdAt: 1,
    },
    sort: { createdAt: -1 },
    limit: Math.min(limit, 100), // Cap at 100 for performance
  });
});

console.log('📚 Studies publications registered');