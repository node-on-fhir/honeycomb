// imports/accounts/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import crypto from 'crypto';

Meteor.methods({
  // Removed custom accounts.createUser and accounts.login methods
  // These are handled by Meteor's built-in accounts-password package
  
  // Test method to verify connection
  'accounts.test'() {
    console.log('[Accounts] Test method called successfully');
    return {
      success: true,
      timestamp: new Date(),
      message: 'Accounts test method is working'
    };
  },
  
  // Test method to create user server-side
  'accounts.testCreateUser'(userData) {
    check(userData, {
      username: String,
      email: String,
      password: String
    });
    
    console.log('[Accounts] Test create user method called with:', {
      username: userData.username,
      email: userData.email
    });
    
    try {
      const userId = Accounts.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      
      console.log('[Accounts] User created successfully with ID:', userId);
      return { success: true, userId };
    } catch (error) {
      console.error('[Accounts] Server-side user creation error:', error);
      throw error;
    }
  },
  
  async 'accounts.sendResetPasswordEmail'(email) {
    check(email, String);
    
    // Find user by email
    const user = await Accounts.findUserByEmail(email);
    if (!user) {
      throw new Meteor.Error(403, 'Email address not found');
    }
    
    // Send reset password email
    try {
      await Accounts.sendResetPasswordEmail(user._id, email);
    } catch (error) {
      console.error('Error sending reset password email:', error);
      throw new Meteor.Error(500, 'Failed to send reset email. Please try again later.');
    }
    
    return true;
  },
  
  'accounts.sendVerificationEmail'(userId) {
    check(userId, String);
    
    // Only allow users to send verification email for themselves
    if (this.userId !== userId) {
      throw new Meteor.Error(403, 'Not authorized');
    }
    
    try {
      Accounts.sendVerificationEmail(userId);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Meteor.Error(500, 'Failed to send verification email. Please try again later.');
    }
    
    return true;
  },
  
  async 'accounts.checkEmailAvailability'(email) {
    check(email, String);
    
    const user = await Accounts.findUserByEmail(email);
    return !user; // true if email is available
  },
  
  async 'accounts.checkUsernameAvailability'(username) {
    check(username, String);
    
    const user = await Accounts.findUserByUsername(username);
    return !user; // true if username is available
  },
  
  // Check if email is configured
  'accounts.isEmailConfigured'() {
    return {
      configured: !!process.env.MAIL_URL,
      hasMailUrl: !!process.env.MAIL_URL
    };
  },

  async 'accounts.checkAvailability'(username, email) {
    check(username, String);
    check(email, String);
    
    console.log('[Debug] checkAvailability called with:', { username, email });
    
    const userByUsername = await Accounts.findUserByUsername(username);
    const userByEmail = await Accounts.findUserByEmail(email);
    
    console.log('[Debug] findUserByUsername result:', userByUsername);
    console.log('[Debug] findUserByEmail result:', userByEmail);
    
    // Direct database check
    const directUsername = await Meteor.users.findOneAsync({ username });
    const directEmail = await Meteor.users.findOneAsync({ 'emails.address': email });
    console.log('[Debug] Direct username check:', directUsername);
    console.log('[Debug] Direct email check:', directEmail);
    console.log('[Debug] Total users:', await Meteor.users.find({}).countAsync());
    
    return {
      usernameAvailable: !userByUsername,
      emailAvailable: !userByEmail,
      suggestions: !userByUsername ? [] : [
        username + '_' + Math.floor(Math.random() * 1000),
        username + new Date().getFullYear(),
        username.replace('@', '_').replace('.', '_')
      ]
    };
  },
  
  async 'accounts.checkUserExists'(usernameOrEmail) {
    check(usernameOrEmail, String);
    
    console.log('[Debug] checkUserExists called with:', usernameOrEmail);
    
    // Check if it's an email or username
    const isEmail = usernameOrEmail.includes('@');
    
    let user;
    if (isEmail) {
      console.log('[Debug] Checking by email...');
      user = await Accounts.findUserByEmail(usernameOrEmail);
      console.log('[Debug] findUserByEmail result:', user);
    } else {
      console.log('[Debug] Checking by username...');
      user = await Accounts.findUserByUsername(usernameOrEmail);
      console.log('[Debug] findUserByUsername result:', user);
    }
    
    // Also do a direct database check
    const directCheck = await Meteor.users.findOneAsync({
      $or: [
        { username: usernameOrEmail },
        { 'emails.address': usernameOrEmail }
      ]
    });
    console.log('[Debug] Direct database check:', directCheck);
    console.log('[Debug] Total users in database:', await Meteor.users.find({}).countAsync());
    
    return {
      exists: !!user,
      isEmail: isEmail,
      hasPassword: user ? !!(user.services && user.services.password) : null
    };
  }
});