// tests/nightwatch/accounts/login.js
// Nightwatch tests for the Login page components

const { get } = require('lodash');

module.exports = {
  tags: ['accounts', 'login', 'authentication'],
  
  before: function(client) {
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
  },

  'Login Page - Initial Load': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('body', 5000)
      .verify.elementPresent('form')
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('button[type="submit"]')
      .verify.containsText('h1, h2, h3, h4, h5, h6', 'Sign In')
      .saveScreenshot('tests/nightwatch/screenshots/login/01-initial-load.png');
  },

  'Login Page - Form Validation': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test empty form submission
      .click('button[type="submit"]')
      .pause(500)
      
      // Check for validation messages (HTML5 or custom)
      .verify.elementPresent('input[name="username"]:invalid, .error, .alert')
      .saveScreenshot('tests/nightwatch/screenshots/login/02-empty-form-validation.png')
      
      // Test with only username
      .setValue('input[name="username"]', 'testuser')
      .click('button[type="submit"]')
      .pause(500)
      .verify.elementPresent('input[name="password"]:invalid, .error, .alert')
      .saveScreenshot('tests/nightwatch/screenshots/login/03-partial-form-validation.png');
  },

  'Login Page - Successful Login': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Fill in valid credentials
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'testuser')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'testpass123')
      .saveScreenshot('tests/nightwatch/screenshots/login/04-filled-form.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(3000)
      
      // Verify redirect to authenticated area
      .verify.urlContains('/', 'Should redirect to home page after successful login')
      .verify.not.urlContains('/login', 'Should not remain on login page')
      .saveScreenshot('tests/nightwatch/screenshots/login/05-successful-login.png');
  },

  'Login Page - Invalid Credentials': function(client) {
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
      
      // Fill in invalid credentials
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'invaliduser')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'wrongpassword')
      .saveScreenshot('tests/nightwatch/screenshots/login/06-invalid-credentials.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(2000)
      
      // Verify error message appears
      .verify.elementPresent('.alert, .error, [role="alert"]')
      .verify.urlContains('/login', 'Should remain on login page after failed login')
      .saveScreenshot('tests/nightwatch/screenshots/login/07-invalid-credentials-error.png');
  },

  'Login Page - Email Login': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test login with email instead of username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'test@example.com')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'testpass123')
      .saveScreenshot('tests/nightwatch/screenshots/login/08-email-login.png')
      
      // Submit form
      .click('button[type="submit"]')
      .pause(3000)
      
      // Verify successful login with email
      .verify.urlContains('/', 'Should redirect after successful email login')
      .saveScreenshot('tests/nightwatch/screenshots/login/09-email-login-success.png');
  },

  'Login Page - Navigation Links': function(client) {
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
      
      // Check for signup link
      .verify.elementPresent('a[href*="register"], a[href*="signup"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/10-navigation-links.png')
      
      // Test signup link navigation
      .click('a[href*="register"], a[href*="signup"]')
      .pause(1000)
      .verify.urlContains('/register', 'Should navigate to register page')
      .saveScreenshot('tests/nightwatch/screenshots/login/11-signup-navigation.png');
  },

  'Login Page - Responsive Design': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      
      // Test mobile viewport
      .resizeWindow(375, 667) // iPhone 6/7/8 size
      .pause(500)
      .waitForElementVisible('form', 5000)
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
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
  },

  'Login Page - Form Accessibility': function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for proper form labels and accessibility attributes
      .verify.elementPresent('label[for], input[aria-label], input[placeholder]')
      .verify.attributeContains('input[name="username"]', 'type', 'text')
      .verify.attributeContains('input[name="password"]', 'type', 'password')
      
      // Test keyboard navigation
      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="password"]:focus, button:focus')
      .saveScreenshot('tests/nightwatch/screenshots/login/15-accessibility-check.png');
  },

  after: function(client) {
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
  }
};