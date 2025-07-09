// packages/clinical-dicom-viewer/server/publications.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DicomFiles, DicomSeries, DicomStudies } from '/packages/dicom/import/api/dicom/collection';

// Note: The newer collections (Studies, Series, Instances) appear to be global variables
// They are referenced in the publications but their definitions were not found in the expected locations

/**
 * Legacy DICOM Publications (from publications.js)
 * These use the DicomFiles, DicomSeries, and DicomStudies collections
 */

Meteor.publish('dicom.studies', function() {
  return DicomStudies.find({}, {
    sort: { studyDate: -1, studyTime: -1 }
  });
});

Meteor.publish('dicom.series', function(studyInstanceUID) {
  check(studyInstanceUID, String);
  
  return DicomSeries.find({
    studyInstanceUID: studyInstanceUID
  }, {
    sort: { seriesDescription: 1 }
  });
});

Meteor.publish('dicom.seriesImages', function(seriesInstanceUID) {
  check(seriesInstanceUID, String);
  
  return DicomFiles.find({
    seriesInstanceUID: seriesInstanceUID
  }, {
    fields: {
      fileName: 1,
      sopInstanceUID: 1,
      instanceNumber: 1,
      sliceLocation: 1,
      seriesInstanceUID: 1,
      studyInstanceUID: 1,
      uploadedAt: 1
    },
    sort: { instanceNumber: 1, sliceLocation: 1 }
  });
});

Meteor.publish('dicom.fileData', function(fileId) {
  check(fileId, String);
  
  return DicomFiles.find({
    _id: fileId
  });
});

/**
 * Newer Studies Publications (from publications/studies.js)
 * These use the global Studies collection
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

/**
 * Series Publications (from publications/series.js)
 * These use the global Series collection
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

/**
 * Instances Publications (from publications/instances.js)
 * These use the global Instances collection
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

// Log successful registration
console.log('🏥 Clinical DICOM Viewer publications loaded');
console.log('📡 Legacy DICOM publications registered');
console.log('📚 Studies publications registered');
console.log('📋 Series publications registered');
console.log('🖼️ Instances publications registered');