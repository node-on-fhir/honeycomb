// tests/nightwatch/honeycomb/accounts.login.js
// Nightwatch tests for the Login page components with new progressive flow

const { get } = require('lodash');

describe('Accounts - Login (Progressive Flow)', function() {
  const timestamp = Date.now();
  const newUsername = `newuser${timestamp}`;
  const newEmail = `newuser${timestamp}@example.com`;
  const password = 'TestPassword123!';

  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing users and create test data
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', function(err) {
            done();
          });
        } else {
          done();
        }
      });
  });

  it('should load the login page with login elements', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('body', 10000)
      .verify.elementPresent('form')
      .verify.elementPresent('input[name="username"]')
      // Password field may be disabled initially in progressive flow
      .verify.elementPresent('input[name="password"], input[type="password"]')
      .verify.elementPresent('button[type="submit"]')
      .assert.textContains('h1, h2, h3, h4, h5, h6', 'Sign In')
      .saveScreenshot('tests/nightwatch/screenshots/login/01-initial-load.png');
  });

  it('should handle progressive field validation', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('form', 10000)
      
      // Test empty form submission - button should be disabled
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      
      // Fill username only
      .setValue('input[name="username"]', 'test')
      .pause(2000) // Wait for user check in progressive flow
      
      // Check what happens based on user existence
      .execute(function() {
        const passwordField = document.querySelector('input[name="password"]');
        const emailField = document.querySelector('input[name="email"]');
        return {
          passwordDisabled: passwordField ? passwordField.disabled : null,
          emailPresent: !!emailField,
          hasAlert: !!document.querySelector('.MuiAlert-root')
        };
      }, function(result) {
        console.log('Progressive form state:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/03-progressive-validation.png');
  });





  it('should handle registration for non-existent users', function(client) {
    // const timestamp = Date.now();
    // const newUsername = `newuser${timestamp}`;
    // const newEmail = `newuser${timestamp}@example.com`;
    // const password = 'TestPassword123!';

    // const timestamp = Date.now();
    // const newUsername = `newuser`;
    // const newEmail = `newuser@example.com`;
    // const password = 'TestPassword123!';

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
      .pause(2000)
      .waitForElementVisible('form', 10000)
      
      // Step 1: Initial state - verify username, password inputs and disabled sign-in button
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('button[type="submit"][disabled]')
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-01-initial-state.png')
      
      // Step 2: Enter non-existent username/email
      .setValue('input[name="username"]', newEmail)
      .pause(3000) // Wait for user check
      
      // Step 3: Verify infobox and CREATE NEW ACCOUNT button appear, sign-in button not present
      .waitForElementPresent('.MuiAlert-root', 5000)
      .verify.textContains('.MuiAlert-root', 'No account found')
      .execute(function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createButton = buttons.find(b => b.textContent.includes('CREATE NEW ACCOUNT'));
        const signInButton = buttons.find(b => b.textContent.includes('SIGN IN'));
        return {
          hasCreateButton: !!createButton,
          hasSignInButton: !!signInButton,
          buttonTexts: buttons.map(b => b.textContent)
        };
      }, function(result) {
        console.log('Buttons after non-existent user:', result.value);
        client.assert.ok(result.value.hasCreateButton, 'CREATE NEW ACCOUNT button should be present');
        client.assert.ok(!result.value.hasSignInButton, 'SIGN IN button should not be present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-02-no-account-found.png')
      
      // Step 4: Click CREATE NEW ACCOUNT button
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('CREATE NEW ACCOUNT')) {
            button.click();
            return { clicked: true };
          }
        }
        return { clicked: false };
      }, function(result) {
        console.log('CREATE NEW ACCOUNT click:', result.value);
      })
      .pause(1000)
      
      // Step 5: Verify password and confirm password inputs appear (email already entered as username)
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('input[name="confirmPassword"]')
      .execute(function() {
        const confirmField = document.querySelector('input[name="confirmPassword"]');
        return {
          confirmDisabled: confirmField ? confirmField.disabled : null
        };
      }, function(result) {
        console.log('Confirm password state:', result.value);
        client.assert.ok(result.value.confirmDisabled, 'Confirm password should be disabled initially');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-03-password-fields.png')
      
      // Step 6: Enter password
      .setValue('input[name="password"]', password)
      .pause(500)
      
      // Step 7: Verify confirm password is now enabled
      .waitForElementPresent('input[name="confirmPassword"]:not([disabled])', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-04-confirm-enabled.png')
      
      // Step 8: Enter matching confirm password
      .setValue('input[name="confirmPassword"]', password)
      .pause(500)
      
      // Step 9: Verify username input appears after passwords match
      .waitForElementPresent('input[name="newUsername"]', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-05-username-appears.png')
      
      // Step 10: Fill username
      .setValue('input[name="newUsername"]', newUsername)
      .pause(2000) // Wait for availability check
      
      // Step 11: Verify REGISTER USER button appears
      .waitForElementPresent('button[type="submit"]', 5000)
      .execute(function() {
        const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
        const registerButton = buttons.find(b => b.textContent.includes('REGISTER USER'));
        return {
          hasRegisterButton: !!registerButton,
          buttonText: registerButton ? registerButton.textContent : null,
          disabled: registerButton ? registerButton.disabled : null
        };
      }, function(result) {
        console.log('Register button state:', result.value);
        client.assert.ok(result.value.hasRegisterButton, 'REGISTER USER button should be present');
        client.assert.ok(!result.value.disabled, 'REGISTER USER button should be enabled');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-06-register-button.png')
      
      // Step 12: Click REGISTER USER button
      .click('button[type="submit"]')
      .pause(3000) // Wait for registration to complete
      
      // Step 13: Verify successful registration and redirect
      .execute(function() {
        return {
          url: window.location.pathname,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          username: typeof Meteor !== 'undefined' && Meteor.user() ? Meteor.user().username : null
        };
      }, function(result) {
        console.log('After registration:', result.value);
        client.assert.ok(result.value.userId, 'User should be logged in after registration');
        client.assert.equal(result.value.username, newUsername, 'Username should match');
      })
      .verify.not.urlContains('/login', 'Should be redirected away from login page')
      .verify.urlEquals('http://localhost:3000/', 'Should be redirected to home page')
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-07-registration-success.png');
  });
  it('should be able to logout', function(client) {
    client
      // User should already be logged in from the previous test
      // Verify we're on the home page and logged in
      .url('http://localhost:3000/')
      .pause(2000)
      
      // Verify user is logged in
      .execute(function() {
        return {
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          username: typeof Meteor !== 'undefined' && Meteor.user() ? Meteor.user().username : null
        };
      }, function(result) {
        console.log('Current user state:', result.value);
        client.assert.ok(result.value.userId, 'User should be logged in');
        client.assert.equal(result.value.username, newUsername, 'Should be logged in as ' + newUsername);
      })
      
      // Wait for header with logout button
      .waitForElementPresent('#header', 5000)
      .waitForElementPresent('button[name="logout"]', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/login/11-before-logout.png')
      
      // Click logout button
      .click('button[name="logout"]')
      .pause(2000)
      
      // Verify logout was successful
      .execute(function() {
        return {
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          url: window.location.pathname
        };
      }, function(result) {
        console.log('After logout:', result.value);
        client.assert.ok(!result.value.userId, 'User should be logged out');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/12-successful-logout.png');
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
      
      // Fill in valid username directly (use the user created in registration test)
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', newUsername)
      .pause(2000) // Wait for user check
      
      // Now enter wrong password
      .waitForElementPresent('input[name="password"]:not([disabled])', 5000)
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'wrongpassword')
      .saveScreenshot('tests/nightwatch/screenshots/login/06-invalid-credentials.png')
      
      // Wait for button to be ready (not checking user)
      .waitForElementPresent('button[type="submit"]', 5000)
      .pause(1000) // Extra time for any async checks
      
      // Check form state and submit
      .execute(function() {
        const submitButton = document.querySelector('button[type="submit"]');
        const usernameField = document.querySelector('input[name="username"]');
        const passwordField = document.querySelector('input[name="password"]');
        
        // Log current state
        const state = {
          buttonExists: !!submitButton,
          buttonDisabled: submitButton ? submitButton.disabled : null,
          buttonText: submitButton ? submitButton.textContent : '',
          username: usernameField ? usernameField.value : '',
          password: passwordField ? passwordField.value : '',
          passwordDisabled: passwordField ? passwordField.disabled : null
        };
        console.log('Form state:', state);
        
        // If button says "CHECKING...", wait
        if (submitButton && submitButton.textContent.includes('CHECKING')) {
          return { clicked: false, reason: 'Still checking user' };
        }
        
        // Try to submit
        if (submitButton && usernameField && passwordField && 
            usernameField.value && passwordField.value) {
          submitButton.click();
          return { clicked: true, state: state };
        }
        
        return { clicked: false, state: state };
      }, function(result) {
        console.log('Submit attempt:', result.value);
      })
      .pause(3000) // Give time for login attempt
      
      // Check for error message or if we're still on login page
      .execute(function() {
        const alert = document.querySelector('.MuiAlert-root');
        const stillOnLogin = window.location.pathname.includes('/login');
        return {
          hasAlert: !!alert,
          alertText: alert ? alert.textContent : '',
          stillOnLogin: stillOnLogin,
          url: window.location.pathname
        };
      }, function(result) {
        console.log('After login attempt:', result.value);
        // Verify we're still on login page (login failed)
        client.verify.ok(result.value.stillOnLogin, 'Should remain on login page after failed login');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/07-invalid-credentials-error.png');
  });

  it('should successfully log in with valid credentials', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('form', 10000)
      
      // Fill in username first
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', newUsername)
      .pause(2000) // Wait for user check
      
      // Wait for password field to be enabled if user exists
      .waitForElementPresent('input[name="password"]:not([disabled])', 10000)
      
      // Now fill password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', password)
      .saveScreenshot('tests/nightwatch/screenshots/login/04-filled-form.png')
      
      // Submit form
      .waitForElementNotPresent('button[type="submit"][disabled]', 5000)
      .click('button[type="submit"]')
      .pause(3000)
      
      // Check if we've successfully logged in
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