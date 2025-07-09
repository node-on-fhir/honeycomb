// imports/api/dicom/publications.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DicomFiles, DicomSeries, DicomStudies } from './collection';

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