// CircleCI-specific Nightwatch configuration
// This configuration is optimized for CI environments with verbose logging

const baseConfig = require('./nightwatch.conf.js');

// Use environment variable if set by CircleCI
const chromeDriverPath = process.env.CHROMEDRIVER_PATH || '/usr/local/bin/chromedriver';

module.exports = {
  ...baseConfig,
  
  // Disable parallel test execution in CI
  test_workers: {
    enabled: false
  },
  
  // More verbose output for CI
  detailed_output: true,
  live_output: true,
  
  test_settings: {
    default: {
      ...baseConfig.test_settings.default,
      
      // Increase timeouts for CI environment
      globals: {
        waitForConditionTimeout: 30000,
        waitForConditionPollInterval: 500,
        asyncHookTimeout: 30000,
        retryAssertionTimeout: 10000
      },
      
      // More verbose logging
      silent: false,
      output: true,
      detailed_output: true,
      disable_error_log: false,
      log_screenshot_data: true,
      
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--headless',
            '--disable-gpu',
            '--window-size=1280,800',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
      
      webdriver: {
        start_process: true,
        // ChromeDriver will be installed by CircleCI orb
        server_path: chromeDriverPath,
        log_path: './tests/output/logs',
        port: 9515,
        cli_args: [
          '--verbose',
          '--log-level=ALL',
          '--port=9515',
          '--allowed-ips=',
          '--disable-dev-shm-usage',
          '--whitelisted-ips='
        ],
        // Increase timeout for webdriver
        timeout_options: {
          timeout: 60000,
          retry_attempts: 3
        },
        // Additional selenium settings
        keep_alive: true,
        check_process_delay: 1000
      }
    }
  },
  
  // Custom reporter function to ensure output
  reporter: function(results, done) {
    console.log('Test run completed');
    console.log('Total tests:', results.tests);
    console.log('Passed:', results.passed);
    console.log('Failed:', results.failed);
    console.log('Errors:', results.errors);
    console.log('Skipped:', results.skipped);
    done();
  }
};