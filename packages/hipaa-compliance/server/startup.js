// packages/hipaa-compliance/server/startup.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import { HipaaAuditLog, HipaaAuditLogSchema } from '../lib/Collections';
import { HipaaLogger } from '../lib/HipaaLogger';
import { EncryptionManager } from '../lib/EncryptionManager';
import { setupAuditHooks, setupUserActivityHooks } from './hooks';

Meteor.startup(async function() {
  console.log('Initializing HIPAA Compliance package...');

  // Inject environment variables into settings
  injectEnvironmentVariables();

  // Initialize the logger
  HipaaLogger.initialize();

  // Add validation to HipaaAuditLog inserts
  if (HipaaAuditLog.before) {
    HipaaAuditLog.before.insert(function(userId, doc) {
      // Validate against schema
      HipaaAuditLogSchema.validate(doc);
    });
  }

  // Create indexes for performance
  await createIndexes();

  // Setup collection hooks if enabled
  const hooksEnabled = get(Meteor, 'settings.public.hipaa.features.automaticHooks', true);
  if (hooksEnabled) {
    await setupAuditHooks();
    setupUserActivityHooks();
  }

  // Check encryption key rotation
  checkKeyRotation();

  // Log startup
  await HipaaLogger.logSystemEvent('init', {
    package: 'clinical:hipaa-compliance',
    version: '0.1.0',
    environment: get(Meteor, 'settings.public.hipaa.compliance.environment', 'production'),
    encryptionLevel: get(Meteor, 'settings.private.hipaa.security.encryptionLevel', 'none')
  });

  console.log('HIPAA Compliance package initialized successfully');
});

// Inject environment variables into Meteor.settings
function injectEnvironmentVariables() {
  // Encryption key
  if (process.env.HIPAA_ENCRYPTION_KEY) {
    set(Meteor, 'settings.private.hipaa.encryption.secretKey', process.env.HIPAA_ENCRYPTION_KEY);
    console.log('Loaded HIPAA encryption key from environment');
  }

  // Security level
  if (process.env.HIPAA_SECURITY_LEVEL) {
    set(Meteor, 'settings.private.hipaa.security.encryptionLevel', process.env.HIPAA_SECURITY_LEVEL);
    console.log(`HIPAA security level set to: ${process.env.HIPAA_SECURITY_LEVEL}`);
  }

  // Data retention
  if (process.env.HIPAA_RETENTION_YEARS) {
    set(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears', 
        parseInt(process.env.HIPAA_RETENTION_YEARS));
  }

  // Environment
  if (process.env.HIPAA_ENVIRONMENT) {
    set(Meteor, 'settings.public.hipaa.compliance.environment', process.env.HIPAA_ENVIRONMENT);
  }

  // Debug access
  if (process.env.HIPAA_ALLOW_DEBUG) {
    set(Meteor, 'settings.private.hipaa.security.allowDebugAccess', 
        process.env.HIPAA_ALLOW_DEBUG === 'true');
  }
}

// Create database indexes
async function createIndexes() {
  try {
    const collection = HipaaAuditLog.rawCollection();
    
    // Create indexes for common queries
    await collection.createIndex({ eventDate: -1 });
    await collection.createIndex({ eventType: 1, eventDate: -1 });
    await collection.createIndex({ userId: 1, eventDate: -1 });
    await collection.createIndex({ patientId: 1, eventDate: -1 });
    await collection.createIndex({ collectionName: 1, eventDate: -1 });
    await collection.createIndex({ resourceId: 1 });
    
    // Compound index for patient audit trails
    await collection.createIndex({ 
      patientId: 1, 
      eventType: 1, 
      eventDate: -1 
    });

    // Text index for search
    await collection.createIndex({
      message: 'text',
      userName: 'text',
      patientName: 'text'
    });

    console.log('HIPAA audit log indexes created successfully');
  } catch (error) {
    console.error('Error creating HIPAA audit log indexes:', error);
  }
}

// Check if encryption key rotation is needed
function checkKeyRotation() {
  try {
    if (EncryptionManager.shouldRotateKey()) {
      console.warn('⚠️  HIPAA encryption key rotation is due!');
      console.warn('Please rotate your encryption key and update settings.private.hipaa.encryption.lastKeyRotation');
      
      // Log security event
      HipaaLogger.logSecurityEvent('key-rotation-due', {
        message: 'Encryption key rotation is overdue',
        lastRotation: get(Meteor, 'settings.private.hipaa.encryption.lastKeyRotation'),
        rotationDays: get(Meteor, 'settings.private.hipaa.encryption.keyRotationDays', 90)
      });
    }
  } catch (error) {
    console.error('Error checking key rotation:', error);
  }
}

// Clean up old audit logs based on retention policy
export const cleanupOldAuditLogs = async function() {
  const retentionYears = get(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears', 7);
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

  // Log the cleanup attempt
  await HipaaLogger.logSystemEvent('audit-cleanup', {
    retentionYears: retentionYears,
    cutoffDate: cutoffDate
  });

  // In production, you would archive rather than delete
  // For now, we'll just count what would be cleaned
  const oldEventCount = await HipaaAuditLog.find({
    eventDate: { $lt: cutoffDate }
  }).countAsync();

  if (oldEventCount > 0) {
    console.log(`Found ${oldEventCount} audit events older than ${retentionYears} years`);
    // Archive logic would go here
  }

  return oldEventCount;
};