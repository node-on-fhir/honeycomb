// imports/accounts/server/test-methods.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Only register test methods in test/development environments
if (get(Meteor, 'settings.public.environment') !== 'production') {
  Meteor.methods({
    // Clear all test users (be careful with this!)
    async 'test.clearUsers'() {
      // Only allow in test environments
      if (get(Meteor, 'settings.public.environment') === 'production') {
        throw new Meteor.Error('not-allowed', 'Cannot clear users in production');
      }

      // Remove all users except the current one (if any)
      const currentUserId = this.userId;
      
      await Meteor.users.removeAsync({
        _id: { $ne: currentUserId },
        // Only remove test users (safety check)
        $or: [
          { username: /^testuser/ },
          { 'emails.address': /^test.*@example\.com$/ }
        ]
      });

      return true;
    },

    // Create a test user
    async 'test.createTestUser'(userData) {
      check(userData, {
        username: String,
        email: String,
        password: String
      });

      // Only allow in test environments
      if (get(Meteor, 'settings.public.environment') === 'production') {
        throw new Meteor.Error('not-allowed', 'Cannot create test users in production');
      }

      // Check if user already exists
      const existingUser = await Accounts.findUserByUsername(userData.username) || 
                          await Accounts.findUserByEmail(userData.email);
      
      if (existingUser) {
        // Update password if user exists
        Accounts.setPassword(existingUser._id, userData.password);
        return existingUser._id;
      }

      // Create new user
      const userId = Accounts.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });

      // Verify email automatically for test users
      if (userId && userData.email) {
        const user = await Meteor.users.findOneAsync(userId);
        if (user.emails && user.emails[0]) {
          await Meteor.users.updateAsync(
            { _id: userId, 'emails.address': userData.email },
            { $set: { 'emails.$.verified': true } }
          );
        }
      }

      return userId;
    },

    // Set first run status
    async 'test.setFirstRun'(isFirstRun) {
      check(isFirstRun, Boolean);

      // Only allow in test environments
      if (get(Meteor, 'settings.public.environment') === 'production') {
        throw new Meteor.Error('not-allowed', 'Cannot modify first run in production');
      }

      // In a real app, this might update a settings collection
      // For now, we'll just set it in memory
      if (!Meteor.settings.public) {
        Meteor.settings.public = {};
      }
      Meteor.settings.public.firstRun = isFirstRun;

      // If first run, clear all users
      if (isFirstRun) {
        await Meteor.users.removeAsync({});
      }

      return true;
    },

    // Check if system is in first run state
    async 'test.isFirstRun'() {
      const userCount = await Meteor.users.find().countAsync();
      return userCount === 0;
    }
  });
}