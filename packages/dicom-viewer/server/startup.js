import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

/**
 * Clinical DICOM Viewer Server Startup
 * Combines initialization of settings, security, and cleanup tasks
 */

// DICOM Viewer Configuration
const defaultSettings = {
  dicom: {
    // Maximum file size in bytes (default: 100MB)
    maxFileSize: 100 * 1024 * 1024,
    
    // Supported file extensions
    supportedExtensions: ['.dcm', '.dicom'],
    
    // Cornerstone.js configuration
    cornerstone: {
      // Enable web workers for better performance
      useWebWorkers: true,
      
      // Maximum number of web workers
      maxWebWorkers: navigator.hardwareConcurrency || 2,
      
      // Enable strict DICOM parsing
      strictParsing: false,
    },
    
    // Database settings
    database: {
      // Enable automatic cleanup of old files
      enableCleanup: false,
      
      // Days to keep files before cleanup
      cleanupAfterDays: 30,
    },
    
    // Security settings
    security: {
      // Enable patient data anonymization
      anonymizePatientData: false,
      
      // Fields to anonymize
      anonymizeFields: [
        'x00100010', // Patient Name
        'x00100020', // Patient ID
        'x00100030', // Patient Birth Date
      ],
    },
  },
};

// Initialize settings on server startup
Meteor.startup(function() {
  console.log('🚀 Initializing Clinical DICOM Viewer server...');
  
  // Merge environment variables with default settings
  const envSettings = {
    dicom: {
      maxFileSize: parseInt(process.env.DICOM_MAX_FILE_SIZE) || get(defaultSettings, 'dicom.maxFileSize'),
      cornerstone: {
        useWebWorkers: process.env.DICOM_USE_WEB_WORKERS === 'true' || get(defaultSettings, 'dicom.cornerstone.useWebWorkers'),
        maxWebWorkers: parseInt(process.env.DICOM_MAX_WEB_WORKERS) || get(defaultSettings, 'dicom.cornerstone.maxWebWorkers'),
        strictParsing: process.env.DICOM_STRICT_PARSING === 'true' || get(defaultSettings, 'dicom.cornerstone.strictParsing'),
      },
      database: {
        enableCleanup: process.env.DICOM_ENABLE_CLEANUP === 'true' || get(defaultSettings, 'dicom.database.enableCleanup'),
        cleanupAfterDays: parseInt(process.env.DICOM_CLEANUP_DAYS) || get(defaultSettings, 'dicom.database.cleanupAfterDays'),
      },
      security: {
        anonymizePatientData: process.env.DICOM_ANONYMIZE_DATA === 'true' || get(defaultSettings, 'dicom.security.anonymizePatientData'),
      },
    },
  };
  
  // Set Meteor settings
  Meteor.settings = Object.assign({}, Meteor.settings, envSettings);
  
  console.log('📋 Clinical DICOM Viewer settings initialized:');
  console.log('- Max file size:', get(Meteor.settings, 'dicom.maxFileSize') / (1024 * 1024), 'MB');
  console.log('- Web workers enabled:', get(Meteor.settings, 'dicom.cornerstone.useWebWorkers'));
  console.log('- Max web workers:', get(Meteor.settings, 'dicom.cornerstone.maxWebWorkers'));
  console.log('- Strict parsing:', get(Meteor.settings, 'dicom.cornerstone.strictParsing'));
  console.log('- Cleanup enabled:', get(Meteor.settings, 'dicom.database.enableCleanup'));
  console.log('- Anonymize data:', get(Meteor.settings, 'dicom.security.anonymizePatientData'));
  
  // Initialize security settings
  import('./security');
  
  // Schedule cleanup if enabled
  if (get(Meteor.settings, 'dicom.database.enableCleanup')) {
    scheduleCleanup();
  }
  
  console.log('✅ Clinical DICOM Viewer server startup complete');
});

/**
 * Schedule periodic cleanup of old DICOM files
 */
function scheduleCleanup() {
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
  const cleanupDays = get(Meteor.settings, 'dicom.database.cleanupAfterDays');
  
  setInterval(async function() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
      
      // Import collections dynamically to avoid circular dependencies
      const { DicomFiles, DicomSeries, DicomStudies } = await import('../lib/collections');
      
      // Remove old files
      const removedFiles = await DicomFiles.removeAsync({
        uploadedAt: { $lt: cutoffDate }
      });
      
      // Clean up orphaned series and studies
      const allSeries = await DicomSeries.findAsync({}, { fields: { seriesInstanceUID: 1 } }).fetchAsync();
      for (const series of allSeries) {
        const hasFiles = await DicomFiles.findOneAsync({ seriesInstanceUID: series.seriesInstanceUID });
        if (!hasFiles) {
          await DicomSeries.removeAsync({ _id: series._id });
        }
      }
      
      const allStudies = await DicomStudies.findAsync({}, { fields: { studyInstanceUID: 1 } }).fetchAsync();
      for (const study of allStudies) {
        const hasSeries = await DicomSeries.findOneAsync({ studyInstanceUID: study.studyInstanceUID });
        if (!hasSeries) {
          await DicomStudies.removeAsync({ _id: study._id });
        }
      }
      
      if (removedFiles > 0) {
        console.log(`🧹 DICOM cleanup: Removed ${removedFiles} old files`);
      }
    } catch (error) {
      console.error('❌ DICOM cleanup error:', error);
    }
  }, cleanupInterval);
  
  console.log(`⏰ DICOM cleanup scheduled: every 24 hours, files older than ${cleanupDays} days`);
}

/**
 * Create database indexes for optimal performance
 */
Meteor.startup(async function() {
  console.log('🗄️ Creating database indexes for Clinical DICOM Viewer...');
  
  try {
    const { DicomFiles, DicomSeries, DicomStudies } = await import('../lib/collections');
    
    // DicomFiles indexes
    await DicomFiles.rawCollection().createIndex({ studyInstanceUID: 1 });
    await DicomFiles.rawCollection().createIndex({ seriesInstanceUID: 1 });
    await DicomFiles.rawCollection().createIndex({ sopInstanceUID: 1 });
    await DicomFiles.rawCollection().createIndex({ uploadedAt: 1 });
    await DicomFiles.rawCollection().createIndex({ 'metadata.patientId': 1 });
    await DicomFiles.rawCollection().createIndex({ 'metadata.patientName': 1 });
    
    // DicomSeries indexes
    await DicomSeries.rawCollection().createIndex({ studyInstanceUID: 1 });
    await DicomSeries.rawCollection().createIndex({ seriesInstanceUID: 1 }, { unique: true });
    await DicomSeries.rawCollection().createIndex({ modality: 1 });
    await DicomSeries.rawCollection().createIndex({ seriesDate: 1 });
    
    // DicomStudies indexes
    await DicomStudies.rawCollection().createIndex({ studyInstanceUID: 1 }, { unique: true });
    await DicomStudies.rawCollection().createIndex({ patientId: 1 });
    await DicomStudies.rawCollection().createIndex({ patientName: 1 });
    await DicomStudies.rawCollection().createIndex({ studyDate: 1 });
    await DicomStudies.rawCollection().createIndex({ accessionNumber: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
});