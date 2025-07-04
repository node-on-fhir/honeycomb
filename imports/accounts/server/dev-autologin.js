// imports/accounts/server/dev-autologin.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Development-only auto-login functionality
export const DevAutoLogin = {
  async setupDevUser() {
    // Only run in development
    if (!Meteor.isDevelopment) return null;
    
    // Check if auto-login is enabled
    const devUsername = process.env.DEV_AUTO_USERNAME;
    const devPassword = process.env.DEV_AUTO_PASSWORD;
    const autoLoginEnabled = process.env.DEV_AUTO_LOGIN === 'true';
    
    if (!autoLoginEnabled || !devUsername || !devPassword) {
      return null;
    }
    
    console.log('[DevAutoLogin] Setting up development auto-login user...');
    
    try {
      // Check if user exists
      let user = Accounts.findUserByUsername(devUsername);
      
      if (!user) {
        // Create the dev user
        const userId = Accounts.createUser({
          username: devUsername,
          email: `${devUsername}@dev.local`,
          password: devPassword,
          profile: {
            name: 'Development User',
            isDevelopmentAccount: true
          }
        });
        
        user = Meteor.users.findOne(userId);
        console.log(`[DevAutoLogin] Created dev user: ${devUsername}`);
      } else {
        // Update password in case it changed
        Accounts.setPassword(user._id, devPassword);
        console.log(`[DevAutoLogin] Updated dev user: ${devUsername}`);
      }
      
      // Mark as development account
      Meteor.users.update(user._id, {
        $set: {
          'profile.isDevelopmentAccount': true,
          'profile.autoLoginEnabled': true
        }
      });
      
      return user._id;
    } catch (error) {
      console.error('[DevAutoLogin] Error setting up dev user:', error);
      return null;
    }
  },
  
  async generateAutoLoginToken(userId) {
    // Only run in development
    if (!Meteor.isDevelopment) {
      throw new Meteor.Error('not-allowed', 'Auto-login only available in development');
    }
    
    // Check if user is a dev account
    const user = Meteor.users.findOne(userId);
    if (!user?.profile?.isDevelopmentAccount) {
      throw new Meteor.Error('not-allowed', 'User is not a development account');
    }
    
    // Generate a login token
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    const hashedToken = Accounts._hashLoginToken(stampedLoginToken.token);
    
    // Add the token to the user's login tokens
    await Meteor.users.updateAsync(userId, {
      $push: {
        'services.resume.loginTokens': {
          hashedToken,
          when: stampedLoginToken.when
        }
      }
    });
    
    console.log('[DevAutoLogin] Generated auto-login token for user:', user.username);
    
    // Return the unhashed token (this is what the client will use)
    return {
      userId,
      token: stampedLoginToken.token,
      tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when)
    };
  }
};

// Initialize on startup
Meteor.startup(async () => {
  if (Meteor.isDevelopment && process.env.DEV_AUTO_LOGIN === 'true') {
    const userId = await DevAutoLogin.setupDevUser();
    if (userId) {
      console.log('[DevAutoLogin] Development auto-login user ready');
      
      // Add visual warning to console
      console.warn('┌─────────────────────────────────────────────────┐');
      console.warn('│ ⚠️  DEVELOPMENT AUTO-LOGIN ENABLED              │');
      console.warn('│ Username:', process.env.DEV_AUTO_USERNAME.padEnd(27), '│');
      console.warn('│ This should NEVER be enabled in production!    │');
      console.warn('└─────────────────────────────────────────────────┘');
    }
  }
});

// Server method to get auto-login token
Meteor.methods({
  'dev.getAutoLoginToken': async function() {
    // Multiple safety checks
    if (Meteor.isProduction) {
      throw new Meteor.Error('not-allowed', 'Auto-login not available in production');
    }
    
    if (process.env.DEV_AUTO_LOGIN !== 'true') {
      throw new Meteor.Error('not-configured', 'Auto-login is not enabled');
    }
    
    const devUsername = process.env.DEV_AUTO_USERNAME;
    if (!devUsername) {
      throw new Meteor.Error('not-configured', 'Dev username not configured');
    }
    
    // Find the dev user
    const user = Accounts.findUserByUsername(devUsername);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'Dev user not found');
    }
    
    // Generate and return login token
    const loginData = await DevAutoLogin.generateAutoLoginToken(user._id);
    
    // Log the auto-login for security monitoring
    console.log(`[DevAutoLogin] Auto-login token requested from ${this.connection.clientAddress}`);
    
    return loginData;
  }
});