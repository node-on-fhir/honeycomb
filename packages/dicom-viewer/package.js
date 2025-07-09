Package.describe({
  name: 'clinical:dicom-viewer',
  version: '0.1.0',
  summary: 'DICOM medical imaging viewer for Honeycomb with Cornerstone.js integration',
  git: 'https://github.com/clinical-meteor/dicom-viewer',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  // Core dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'session',
    'mongo',
    'check',
    'random',
    'ddp-rate-limiter'
  ]);
  
  // React dependencies
  api.use('react-meteor-data@2.6.3');
  
  // Collections and shared code
  api.addFiles('lib/collections.js', ['client', 'server']);
  
  // Server files
  api.addFiles([
    'server/methods.js',
    'server/publications.js',
    'server/file-processor.js',
    'server/stream-handler.js',
    'server/security.js',
    'server/startup.js'
  ], 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Npm.depends({
  // DICOM libraries
  'cornerstone-core': '2.6.1',
  'cornerstone-tools': '6.0.10',
  'cornerstone-math': '0.1.10',
  'cornerstone-wado-image-loader': '4.13.2',
  'dicom-parser': '1.8.21',
  'hammerjs': '2.0.8',
  
  // Image conversion
  '@caoshouse/dcmtk': '1.2.0',
  
  // File handling
  'formidable': '3.5.1',
  'cors': '2.8.5',
  
  // Utilities
  'lodash': '4.17.21',
  'moment': '2.30.1'
});