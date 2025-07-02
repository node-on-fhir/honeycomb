// tests/nightwatch/accounts/signup.js
// Nightwatch tests for the Signup/Registration page components

const { get } = require('lodash');
const moment = require('moment');

describe('Accounts - Signup/Registration', function() {
  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing test users
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', done);
        } else {
          done();
        }
      });
  });

  it('should load the signup page with all required elements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('body', 5000)
      .verify.elementPresent('form')
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="email"], input[type="email"]')
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('input[name="confirm"], input[name="confirmPassword"]')
      .verify.elementPresent('button[type="submit"]')
      .verify.containsText('h1, h2, h3, h4, h5, h6', 'Register')
      .saveScreenshot('tests/nightwatch/screenshots/signup/01-initial-load.png');
  });

  it('should validate empty fields on form submission', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test empty form submission
      .click('button[type="submit"]')
      .pause(500)
      
      // Check for validation messages
      .verify.elementPresent('input[name="username"]:invalid, .error, .alert')
      .saveScreenshot('tests/nightwatch/screenshots/signup/02-empty-form-validation.png');
  });

  it('should enforce username requirements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test short username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'a')
      .click('button[type="submit"]')
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/signup/03-short-username.png')
      
      // Test valid username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'validuser123')
      .saveScreenshot('tests/nightwatch/screenshots/signup/04-valid-username.png');
  });

  it('should validate email format', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test invalid email format
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'invalid-email')
      .click('button[type="submit"]')
      .pause(500)
      .verify.elementPresent('input[type="email"]:invalid, .error, .alert')
      .saveScreenshot('tests/nightwatch/screenshots/signup/05-invalid-email.png')
      
      // Test valid email
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'test@example.com')
      .saveScreenshot('tests/nightwatch/screenshots/signup/06-valid-email.png');
  });

  it('should enforce password requirements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test weak password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', '123')
      .click('button[type="submit"]')
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/signup/07-weak-password.png')
      
      // Test strong password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'StrongPass123!')
      .saveScreenshot('tests/nightwatch/screenshots/signup/08-strong-password.png');
  });

  it('should validate password confirmation match', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Set initial password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'TestPassword123')
      
      // Test mismatched confirmation
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'DifferentPassword')
      .click('button[type="submit"]')
      .pause(500)
      .verify.elementPresent('.error, .alert, [data-testid="password-mismatch"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/09-password-mismatch.png')
      
      // Test matching confirmation
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'TestPassword123')
      .saveScreenshot('tests/nightwatch/screenshots/signup/10-password-match.png');
  });

  it('should successfully register a new user', function(client) {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const testUsername = `testuser${timestamp}`;
    const testEmail = `test${timestamp}@example.com`;
    
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Fill in all required fields
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', testUsername)
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', testEmail)
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'SecurePassword123!')
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'SecurePassword123!')
      .saveScreenshot('tests/nightwatch/screenshots/signup/11-complete-form.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(5000)
      
      // Verify successful registration (should redirect or show success)
      .execute(function() {
        return {
          url: window.location.href,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null
        };
      }, function(result) {
        console.log('After registration:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/signup/12-registration-success.png');
  });

  it('should prevent duplicate username registration', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Try to register with the same username again
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'testuser')
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'different@example.com')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'AnotherPassword123!')
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'AnotherPassword123!')
      .saveScreenshot('tests/nightwatch/screenshots/signup/13-duplicate-username.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(2000)
      
      // Verify error message for duplicate username
      .verify.elementPresent('.error, .alert, [role="alert"]')
      .verify.urlContains('/register', 'Should remain on register page after duplicate error')
      .saveScreenshot('tests/nightwatch/screenshots/signup/14-duplicate-username-error.png');
  });

  it('should provide navigation to login page', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for login link
      .verify.elementPresent('a[href*="login"], a[href*="signin"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/15-login-link.png')
      
      // Test login link navigation
      .click('a[href*="login"], a[href*="signin"]')
      .pause(1000)
      .verify.urlContains('/login')
      .saveScreenshot('tests/nightwatch/screenshots/signup/16-navigate-to-login.png');
  });

  it('should have proper tab order for keyboard navigation', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test tab order through form fields
      .click('input[name="username"]')
      .pause(100)
      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="email"]:focus, input[type="email"]:focus')
      
      .sendKeys('input[name="email"], input[type="email"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="password"]:focus')
      
      .sendKeys('input[name="password"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="confirm"]:focus, input[name="confirmPassword"]:focus')
      
      .saveScreenshot('tests/nightwatch/screenshots/signup/17-tab-order.png');
  });

  it('should be responsive across different screen sizes', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      
      // Test mobile viewport
      .resizeWindow(375, 667) // iPhone 6/7/8 size
      .pause(500)
      .waitForElementVisible('form', 5000)
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/18-mobile-view.png')
      
      // Test tablet viewport
      .resizeWindow(768, 1024) // iPad size
      .pause(500)
      .verify.elementPresent('form')
      .saveScreenshot('tests/nightwatch/screenshots/signup/19-tablet-view.png')
      
      // Reset to desktop
      .resizeWindow(1024, 768)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/signup/20-desktop-view.png');
  });

  it('should have proper security attributes on form fields', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Verify password field is properly masked
      .verify.attributeContains('input[name="password"]', 'type', 'password')
      .verify.attributeContains('input[name="confirm"], input[name="confirmPassword"]', 'type', 'password')
      
      // Check for autocomplete attributes for security
      .verify.attributeContains('input[name="username"]', 'autocomplete', 'username')
      .verify.attributeContains('input[name="password"]', 'autocomplete', 'new-password')
      
      .saveScreenshot('tests/nightwatch/screenshots/signup/21-security-check.png');
  });

  it('should handle first-run setup scenario', function(client) {
    client
      // Test first-run setup scenario
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          // Simulate first run condition
          Meteor.call('test.setFirstRun', true, done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000')
      .pause(2000)
      
      // Should show first-run setup page
      .verify.elementPresent('form, #firstRunSetup, [data-testid="first-run"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/22-first-run-setup.png')
      
      // Reset first run state
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.setFirstRun', false, done);
        } else {
          done();
        }
      });
  });

  after(function(client) {
    // Cleanup
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', done);
        } else {
          done();
        }
      })
      .end();
  });
});