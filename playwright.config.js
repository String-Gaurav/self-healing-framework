const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Self-Healing Test Framework
 * Extends Playwright with self-healing capabilities
 */
module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Global test settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list']
  ],
  
  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Browser settings
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO) || 0,
    
    // Timeouts
    actionTimeout: parseInt(process.env.ACTION_TIMEOUT) || 30000,
    navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT) || 30000,
    
    // Viewport
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH) || 1280,
      height: parseInt(process.env.VIEWPORT_HEIGHT) || 720
    },
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Browser context options
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    
    // Self-healing framework integration
    extraHTTPHeaders: {
      'X-Test-Framework': 'self-healing-framework'
    }
  },
  
  // Project configurations for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Self-healing specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--no-sandbox'
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit specific settings
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
    
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    }
  ],
  
  // Web server configuration for local testing
  webServer: process.env.START_SERVER ? {
    command: process.env.SERVER_COMMAND || 'npm start',
    port: parseInt(process.env.SERVER_PORT) || 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test'
    }
  } : undefined,
  
  // Global setup and teardown
  globalSetup: require.resolve('./src/core/global-setup.js'),
  globalTeardown: require.resolve('./src/core/global-teardown.js'),
  
  // Test timeout
  timeout: parseInt(process.env.TEST_TIMEOUT) || 60000,
  
  // Expect timeout
  expect: {
    timeout: parseInt(process.env.EXPECT_TIMEOUT) || 10000,
    toHaveScreenshot: { threshold: 0.2, maxDiffPixels: 100 },
    toMatchSnapshot: { threshold: 0.2, maxDiffPixels: 100 }
  },
  
  // Output directory
  outputDir: 'test-results/',
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  
  // Test ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ],
  
  // Global test configuration
  globalSetup: require.resolve('./src/core/global-setup.js'),
  globalTeardown: require.resolve('./src/core/global-teardown.js'),
  
  // Self-healing framework specific configuration
  use: {
    ...this.use,
    // Enable self-healing
    enableHealing: process.env.ENABLE_HEALING !== 'false',
    healingMode: process.env.HEALING_MODE || 'aggressive',
    maxHealingAttempts: parseInt(process.env.MAX_HEALING_ATTEMPTS) || 3,
    healingTimeout: parseInt(process.env.HEALING_TIMEOUT) || 30000,
    
    // AI integration
    enableAI: process.env.ENABLE_AI !== 'false',
    aiProvider: process.env.AI_PROVIDER || 'openai',
    aiModel: process.env.AI_MODEL || 'gpt-4',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    
    // Test data
    testDataPath: process.env.TEST_DATA_PATH || './test-data',
    enableDataHealing: process.env.ENABLE_DATA_HEALING !== 'false'
  }
});
