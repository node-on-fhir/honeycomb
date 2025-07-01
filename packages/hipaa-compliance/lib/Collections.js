// packages/hipaa-audit-starter/lib/Collections.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import SimpleSchema from 'simpl-schema';
import { EventTypes } from './Constants';

// Create the collection
HipaaAuditLog = new Mongo.Collection('HipaaAuditLog');

// Define the schema
const HipaaAuditLogSchema = new SimpleSchema({
  // Event Information
  eventType: {
    type: String,
    allowedValues: Object.values(EventTypes),
    index: true
  },
  eventDate: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    },
    index: true
  },
  
  // User Information
  userId: {
    type: String,
    optional: true,
    index: true
  },
  userName: {
    type: String,
    optional: true
  },
  userEmail: {
    type: String,
    optional: true
  },
  userRoles: {
    type: Array,
    optional: true
  },
  'userRoles.$': {
    type: String
  },
  
  // Resource Information
  resourceType: {
    type: String,
    optional: true,
    index: true
  },
  resourceId: {
    type: String,
    optional: true,
    index: true
  },
  collectionName: {
    type: String,
    optional: true,
    index: true
  },
  
  // Patient Context
  patientId: {
    type: String,
    optional: true,
    index: true
  },
  patientName: {
    type: String,
    optional: true
  },
  
  // Event Details
  message: {
    type: String,
    optional: true
  },
  metadata: {
    type: Object,
    optional: true,
    blackbox: true
  },
  
  // Security and Tracking
  ipAddress: {
    type: String,
    optional: true
  },
  userAgent: {
    type: String,
    optional: true
  },
  sessionId: {
    type: String,
    optional: true
  },
  
  // Compliance Fields
  encryptionLevel: {
    type: String,
    optional: true
  },
  signature: {
    type: String,
    optional: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    },
    denyUpdate: true
  }
});

// Attach schema
HipaaAuditLog.attachSchema(HipaaAuditLogSchema);

// Security rules - Write only, no updates or deletes
HipaaAuditLog.allow({
  insert: function (userId, doc) {
    // Only allow inserts from authenticated users or system
    return userId || doc.userId === 'system';
  },
  update: function () {
    // Audit logs are immutable
    return false;
  },
  remove: function () {
    // Audit logs cannot be deleted
    return false;
  }
});

// Add helpers
HipaaAuditLog.helpers({
  getUser: function() {
    if (this.userId) {
      return Meteor.users.findOne(this.userId);
    }
  },
  
  getPatient: async function() {
    if (this.patientId && Meteor.isServer) {
      const Patients = await global.Collections.Patients;
      if (Patients) {
        return await Patients.findOneAsync(this.patientId);
      }
    }
  },
  
  isPatientRelated: function() {
    return !!this.patientId;
  },
  
  getEventIcon: function() {
    const iconMap = {
      'view': 'visibility',
      'create': 'add_circle',
      'update': 'edit',
      'delete': 'delete',
      'login': 'login',
      'logout': 'logout',
      'denied': 'block',
      'error': 'error',
      'export': 'file_download'
    };
    return iconMap[this.eventType] || 'info';
  },
  
  getEventColor: function() {
    const colorMap = {
      'view': 'info',
      'create': 'success',
      'update': 'warning',
      'delete': 'error',
      'denied': 'error',
      'error': 'error'
    };
    return colorMap[this.eventType] || 'default';
  }
});

// Export for use in other files
export { HipaaAuditLog, HipaaAuditLogSchema };