import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

/**
 * User sessions collection for tracking viewer state
 */
export const UserSessionsCollection = new Mongo.Collection('userSessions');

/**
 * User session schema validation
 */
export const UserSessionSchema = {
  sessionId: String,
  userId: Match.Maybe(String),
  clientIP: Match.Maybe(String),
  userAgent: Match.Maybe(String),
  currentStudyUID: Match.Maybe(String),
  currentSeriesUID: Match.Maybe(String),
  currentInstanceUID: Match.Maybe(String),
  viewportSettings: Match.Maybe(Object),
  toolSettings: Match.Maybe(Object),
  preferences: Match.Maybe(Object),
  lastActivity: Date,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * Validate user session document
 */
export function validateUserSession(session) {
  check(session, UserSessionSchema);
}

/**
 * Create user session document
 */
export function createUserSession(sessionData) {
  const now = new Date();
  
  return {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId || null,
    clientIP: sessionData.clientIP || null,
    userAgent: sessionData.userAgent || null,
    currentStudyUID: null,
    currentSeriesUID: null,
    currentInstanceUID: null,
    viewportSettings: {
      windowCenter: null,
      windowWidth: null,
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipH: false,
      flipV: false,
    },
    toolSettings: {
      activeTool: 'pan',
      measurements: [],
      annotations: [],
    },
    preferences: {
      theme: 'dark',
      layout: 'single',
      autoPlay: false,
      playbackSpeed: 100,
    },
    lastActivity: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId) {
  if (Meteor.isServer) {
    return await UserSessionsCollection.updateAsync(
      { sessionId },
      { 
        $set: { 
          lastActivity: new Date(),
          updatedAt: new Date(),
        }
      }
    );
  }
}

/**
 * Update session state
 */
export async function updateSessionState(sessionId, stateUpdate) {
  if (Meteor.isServer) {
    return await UserSessionsCollection.updateAsync(
      { sessionId },
      { 
        $set: { 
          ...stateUpdate,
          lastActivity: new Date(),
          updatedAt: new Date(),
        }
      }
    );
  }
}

// Global reference for imports
if (Meteor.isServer) {
  global.UserSessions = UserSessionsCollection;
}
if (Meteor.isClient) {
  window.UserSessions = UserSessionsCollection;
}