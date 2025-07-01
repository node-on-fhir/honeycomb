// packages/hipaa-audit-starter/package.js

Package.describe({
  name: 'clinical:hipaa-compliance',
  version: '0.1.0',
  summary: 'HIPAA-compliant audit logging and compliance management for Honeycomb v3',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');

  // Core Meteor dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'mongo',
    'session',
    'tracker',
    'reactive-var'
  ]);

  // React and UI dependencies
  api.use([
    'react-meteor-data@2.6.3',
    'static-html@1.3.2'
  ]);

  // Clinical packages
  api.use([
    'clinical:hl7-fhir-data-infrastructure@6.15.1',
    'clinical:hl7-resource-audit-event@1.3.2'
  ]);

  // Third party packages
  api.use([
    'matb33:collection-hooks@1.0.1',
    'aldeed:collection2@3.5.0',
    'meteorhacks:async@1.0.0',
    'dburles:collection-helpers@1.1.0',
    'momentjs:moment@2.29.4',
    'peerlibrary:reactive-publish@0.10.0'
  ]);
  
  // NPM dependencies
  api.use('tmeasday:check-npm-versions@1.0.2');
  Npm.depends({
    'marked': '4.3.0'
  });

  // Server files
  api.addFiles([
    'server/startup.js',
    'server/methods.js',
    'server/publications.js',
    'server/hooks.js',
    'server/encryption.js',
    'server/policyMethods.js'
  ], 'server');

  // Shared files (lib)
  api.addFiles([
    'lib/Collections.js',
    'lib/Constants.js'
  ], ['client', 'server']);

  api.addFiles([
    'lib/HipaaLogger.js',
    'lib/SecurityValidators.js',
    'lib/EncryptionManager.js',
    'lib/PolicyRoutes.js',
    'lib/PolicyGenerator.js'
  ], ['client', 'server']);

  // Client entry point
  api.mainModule('index.jsx', 'client');

  // Export for other packages
  api.export('HipaaLogger');
  api.export('HipaaAuditLog');
  api.export('HipaaConstants');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:hipaa-audit-starter');
  api.use('ecmascript');
  
  api.addFiles('tests/HipaaAuditLog.tests.js');
});