// server/main.js
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import '../import/api/dicom/methods';
import '../import/api/dicom/publications';
import '../import/startup/server/dicom-settings';

Meteor.startup(async function() {
  console.log('DICOM Viewer server starting...');
  
  // Enable CORS for DICOM file uploads
  WebApp.rawConnectHandlers.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }
    
    next();
  });
  
  console.log('DICOM Viewer server ready on port:', process.env.PORT || 3000);
});