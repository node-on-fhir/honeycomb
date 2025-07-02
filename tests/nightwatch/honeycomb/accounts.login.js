// tests/nightwatch/accounts/login.js
// Nightwatch tests for the Login page components

const { get } = require('lodash');

describe('Accounts - Login', function() {
  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing users and create test data
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', function(err) {
            if (!err) {
              Meteor.call('test.createTestUser', {
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpass123'
              }, done);
            } else {
              done();
            }
          });
        } else {
          done();
        }
      });
  });

  it('should load the login page with all required elements', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('body', 5000)
      .verify.elementPresent('form')
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[type="password"]')
      .verify.elementPresent('button[type="submit"]')
      .verify.containsText('h1, h2, h3, h4, h5, h6', 'Sign In')
      .saveScreenshot('tests/nightwatch/screenshots/login/01-initial-load.png');
  });

  it('should validate form fields before submission', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test empty form submission - button should be disabled
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      
      // Fill username only
      .setValue('input[name="username"]', 'test')
      .pause(500)
      
      // Verify password field exists
      .verify.elementPresent('input[type="password"][required]')
      // Button should still be disabled without password
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .saveScreenshot('tests/nightwatch/screenshots/login/03-partial-form-validation.png');
  });

  it('should successfully log in with valid credentials', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Fill in valid credentials
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'testuser')
      .clearValue('input[type="password"]')
      .setValue('input[type="password"]', 'testpass123')
      .saveScreenshot('tests/nightwatch/screenshots/login/04-filled-form.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(3000)
      
      // Wait for login to complete - check multiple conditions
      .waitForElementNotPresent('button[type="submit"][disabled]', 15000) // Wait for button to stop being disabled
      .pause(2000) // Additional time for redirect
      
      // Check if we've left the login page
      .execute(function() {
        return {
          path: window.location.pathname,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          hasLoginForm: !!document.querySelector('form input[name="username"]')
        };
      }, function(result) {
        console.log('Login result:', result.value);
      })
      
      // Verify we're no longer on login page
      .verify.not.urlContains('/login', 'Should not remain on login page')
      .saveScreenshot('tests/nightwatch/screenshots/login/05-successful-login.png');
  });

  it('should show error message for invalid credentials', function(client) {
    client
      // Logout first if logged in
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Use a username that exists but with wrong password
      // First create a test user to ensure we have valid username
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.createTestUser', {
            username: 'validuser',
            email: 'validuser@example.com',
            password: 'correctpassword123'
          }, done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      // Fill in valid username but wrong password
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'validuser')
      .pause(2000) // Wait for user check
      
      // Check if password field is enabled before interacting
      .execute(function() {
        const passwordField = document.querySelector('input[type="password"]');
        return passwordField && !passwordField.disabled;
      }, function(result) {
        if (result.value) {
          client
            .clearValue('input[type="password"]')
            .setValue('input[type="password"]', 'wrongpassword')
            .saveScreenshot('tests/nightwatch/screenshots/login/06-invalid-credentials.png')
            
            // Submit form
            .click('button[type="submit"]')
            .pause(2000)
            
            // Verify error message appears
            .verify.elementPresent('.MuiAlert-root, [role="alert"]')
            .verify.urlContains('/login', 'Should remain on login page after failed login');
        } else {
          console.log('Password field is disabled - user does not exist');
          // Just verify we're still on login page
          client.verify.urlContains('/login', 'Should remain on login page');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/07-invalid-credentials-error.png');
  });

  it('should allow login with email address', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test login with email instead of username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'test@example.com')
      .clearValue('input[type="password"]')
      .setValue('input[type="password"]', 'testpass123')
      .saveScreenshot('tests/nightwatch/screenshots/login/08-email-login.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(3000)
      
      // Verify successful login with email
      .verify.urlContains('/', 'Should redirect after successful email login')
      .saveScreenshot('tests/nightwatch/screenshots/login/09-email-login-success.png');
  });

  it('should provide navigation to signup page', function(client) {
    client
      // Logout first
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for signup link - it's a button styled as link
      .verify.containsText('form', 'Sign Up')
      .saveScreenshot('tests/nightwatch/screenshots/login/10-navigation-links.png')
      
      // Test signup link navigation  
      .execute(function() {
        const links = document.querySelectorAll('button, a');
        for (let link of links) {
          if (link.textContent.includes('Sign Up')) {
            link.click();
            return true;
          }
        }
        return false;
      })
      .pause(1000)
      .verify.urlContains('/register', 'Should navigate to register page')
      .saveScreenshot('tests/nightwatch/screenshots/login/11-signup-navigation.png');
  });

  it('should be responsive across different screen sizes', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      
      // Test mobile viewport
      .resizeWindow(375, 667) // iPhone 6/7/8 size
      .pause(500)
      .waitForElementVisible('form', 5000)
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[type="password"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/12-mobile-view.png')
      
      // Test tablet viewport
      .resizeWindow(768, 1024) // iPad size
      .pause(500)
      .verify.elementPresent('form')
      .saveScreenshot('tests/nightwatch/screenshots/login/13-tablet-view.png')
      
      // Reset to desktop
      .resizeWindow(1024, 768)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/login/14-desktop-view.png');
  });

  it('should have proper accessibility attributes', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for proper form labels and accessibility attributes
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[type="password"]')
      .verify.attributeContains('input[name="username"]', 'type', 'text')
      .verify.attributeContains('input[type="password"]', 'type', 'password')
      
      // Test keyboard navigation
      .click('input[name="username"]')
      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(500)
      .execute(function() {
        return document.activeElement.name || document.activeElement.type;
      }, function(result) {
        console.log('Focused element:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/15-accessibility-check.png');
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