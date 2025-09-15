# Self-Healing Test Framework

A comprehensive test automation framework that automatically detects and fixes failing tests using AI-powered healing strategies. The framework supports both UI and API testing with intelligent error recovery mechanisms.

## Features

- **AI-Powered Healing**: Uses OpenAI and Anthropic AI to analyze test failures and generate healing strategies
- **Multi-Strategy Support**: Implements various healing approaches for different types of test failures
- **UI Test Healing**: Handles locator issues, wait problems, element state, and navigation failures
- **API Test Healing**: Manages endpoint issues, schema changes, and response problems
- **Context-Aware**: Provides rich context to healing strategies for better decision making
- **Extensible Architecture**: Easy to add new healing strategies and AI providers
- **Comprehensive Logging**: Detailed logging and reporting for debugging and monitoring

## Architecture

```
src/
├── ai/                    # AI integration layer
│   └── AIIntegration.js   # OpenAI and Anthropic integration
├── core/                  # Core framework components
│   └── BaseFramework.js   # Main framework class
├── healing/               # Healing engine and strategies
│   ├── HealingEngine.js   # Orchestrates healing strategies
│   └── strategies/        # Specific healing implementations
│       ├── UIFealingStrategies.js    # UI-specific healing
│       └── APIHealingStrategies.js   # API-specific healing
├── utils/                 # Utility classes
│   └── Logger.js          # Logging system
└── config/                # Configuration files
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd self-healing-framework
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your API keys in `.env`:
```env
# AI Integration Settings
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Framework Settings
ENABLE_HEALING=true
ENABLE_AI=true
HEALING_MODE=aggressive
MAX_HEALING_ATTEMPTS=3
HEALING_TIMEOUT=30000
```

## Quick Start

### Basic Usage

```javascript
const { BaseFramework } = require('./src/core/BaseFramework');

// Initialize the framework
const framework = new BaseFramework({
    enableHealing: true,
    enableAI: true,
    aiProvider: 'openai',
    maxHealingAttempts: 3
});

await framework.initialize();

// Run a test with healing
const result = await framework.runTest(async () => {
    // Your test code here
    await page.click('#login-button');
    await expect(page.locator('#dashboard')).toBeVisible();
});

if (result.success) {
    console.log('Test passed!');
} else {
    console.log('Test failed, healing attempted:', result.healingAttempted);
}
```

### Running the Demo

```bash
npm run healing-demo
```

This will run a comprehensive demo showing various healing scenarios:
- Element Not Found errors
- Timeout errors
- API endpoint errors
- AI integration examples

## Healing Strategies

### UI Healing Strategies

#### Locator Healing
- **Alternative Selectors**: Tries different CSS selectors for the same element
- **AI-Generated Locators**: Uses AI to generate new locators based on element description
- **Text-Based Locators**: Finds elements by text content
- **Attribute-Based Locators**: Uses data attributes and other element properties
- **Position-Based Locators**: Uses element position and hierarchy

#### Wait Healing
- **Explicit Waits**: Adds explicit wait times for elements
- **Smart Waits**: Uses intelligent waiting based on element state
- **Polling Waits**: Implements polling mechanisms
- **Conditional Waits**: Waits for specific conditions to be met

#### Element State Healing
- **Scroll to Element**: Scrolls element into view
- **Wait for Visibility**: Waits for element to become visible
- **Wait for Interactability**: Waits for element to become clickable
- **Force Interaction**: Attempts to force interaction with element

#### Navigation Healing
- **Direct Navigation**: Navigates directly to URLs
- **Retry Navigation**: Retries failed navigation attempts
- **Alternative URLs**: Tries alternative URL patterns
- **Wait for Page Load**: Waits for page to fully load

### API Healing Strategies

#### Endpoint Healing
- **Alternative Endpoints**: Tries different endpoint variations
- **Versioned Endpoints**: Attempts different API versions
- **Fallback Endpoints**: Uses backup endpoints
- **AI-Generated Endpoints**: Uses AI to suggest new endpoints

#### Schema Healing
- **Schema Adaptation**: Adapts to schema changes
- **Field Mapping**: Maps old fields to new ones
- **Data Type Conversion**: Converts data types as needed
- **AI Schema Healing**: Uses AI to understand schema changes

#### Response Healing
- **Response Normalization**: Normalizes response formats
- **Response Mapping**: Maps responses to expected format
- **Response Validation**: Validates and corrects responses
- **AI Response Healing**: Uses AI to fix response issues

## Configuration

### Framework Options

```javascript
const config = {
    // Healing settings
    enableHealing: true,
    enableAI: true,
    healingMode: 'aggressive', // 'conservative', 'aggressive', 'custom'
    maxHealingAttempts: 3,
    healingTimeout: 30000,
    
    // AI settings
    aiProvider: 'openai', // 'openai', 'anthropic'
    aiModel: 'gpt-4',
    aiTemperature: 0.1,
    aiMaxTokens: 2000,
    
    // UI settings
    maxWaitTime: 30000,
    retryDelay: 1000,
    enableAILocatorGeneration: true,
    enableSmartWaits: true,
    
    // API settings
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableSchemaValidation: true,
    enableResponseHealing: true
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider to use | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `ENABLE_HEALING` | Enable healing functionality | `true` |
| `ENABLE_AI` | Enable AI integration | `true` |
| `HEALING_MODE` | Healing mode | `aggressive` |
| `MAX_HEALING_ATTEMPTS` | Maximum healing attempts | `3` |
| `HEALING_TIMEOUT` | Healing timeout in ms | `30000` |

## API Reference

### BaseFramework

#### Constructor
```javascript
new BaseFramework(options)
```

#### Methods

##### `initialize()`
Initializes the framework and all its components.

##### `runTest(testFunction, testData, context)`
Runs a test with healing capabilities.

**Parameters:**
- `testFunction`: Function containing the test logic
- `testData`: Test data object
- `context`: Additional context for healing

**Returns:**
```javascript
{
    success: boolean,
    result: any,
    healingAttempted: boolean,
    healingResult: object,
    error: Error
}
```

##### `attemptHealing(error, testFunction, testData, context)`
Attempts to heal a failed test.

**Parameters:**
- `error`: The error that occurred
- `testFunction`: Function containing the test logic
- `testData`: Test data object
- `context`: Additional context for healing

**Returns:**
```javascript
{
    success: boolean,
    healedData: any,
    strategy: string,
    changes: string[],
    error: string
}
```

### AIIntegration

#### Constructor
```javascript
new AIIntegration(options)
```

#### Methods

##### `generateHealingStrategies(error, context)`
Generates healing strategies for a given error.

##### `analyzeTest(testFunction, testData)`
Analyzes a test for potential issues.

##### `generateLocators(elementDescription, pageSource, currentLocator)`
Generates alternative locators for an element.

##### `healTestData(testData, error)`
Heals test data using AI.

### HealingEngine

#### Constructor
```javascript
new HealingEngine(options)
```

#### Methods

##### `analyzeError(error, context)`
Analyzes an error and determines appropriate healing strategies.

##### `applyHealing(analysis, testFunction, testData, context)`
Applies healing strategies to fix a test.

## Examples

### UI Test Example

```javascript
const { BaseFramework } = require('./src/core/BaseFramework');
const { test, expect } = require('@playwright/test');

const framework = new BaseFramework({
    enableHealing: true,
    enableAI: true
});

await framework.initialize();

test('Login test with healing', async ({ page }) => {
    const result = await framework.runTest(async () => {
        await page.goto('https://example.com/login');
        await page.click('#login-button'); // This might fail and get healed
        await expect(page.locator('#dashboard')).toBeVisible();
    }, {
        element: { selector: '#login-button' },
        page: page
    }, {
        testType: 'ui',
        pageUrl: 'https://example.com/login'
    });
    
    expect(result.success).toBe(true);
});
```

### API Test Example

```javascript
const { BaseFramework } = require('./src/core/BaseFramework');
const axios = require('axios');

const framework = new BaseFramework({
    enableHealing: true,
    enableAI: true
});

await framework.initialize();

test('API test with healing', async () => {
    const result = await framework.runTest(async () => {
        const response = await axios.get('https://api.example.com/users');
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('users');
    }, {
        endpoint: '/users',
        method: 'GET',
        baseUrl: 'https://api.example.com'
    }, {
        testType: 'api'
    });
    
    expect(result.success).toBe(true);
});
```

### Custom Healing Strategy

```javascript
const { BaseFramework } = require('./src/core/BaseFramework');

class CustomHealingStrategy {
    async healCustomIssue(strategy, testData, context) {
        // Your custom healing logic here
        return {
            success: true,
            healedData: testData,
            strategy: 'custom_healing',
            changes: ['Applied custom healing']
        };
    }
}

const framework = new BaseFramework({
    enableHealing: true,
    customStrategies: [CustomHealingStrategy]
});
```

## Logging and Monitoring

The framework provides comprehensive logging through the Logger utility:

```javascript
const { Logger } = require('./src/utils/Logger');

const logger = new Logger();

// Log levels: error, warn, info, debug
logger.info('Healing strategy applied', { strategy: 'locator_healing' });
logger.error('Healing failed', { error: error.message });
```

### Log Files

- `logs/framework.log`: General framework logs
- `logs/healing.log`: Healing-specific logs
- `logs/ai.log`: AI integration logs
- `logs/errors.log`: Error logs

## Testing

Run the test suite:

```bash
npm test
```

Run specific test categories:

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# UI tests
npm run test:ui

# API tests
npm run test:api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Troubleshooting

### Common Issues

#### AI API Key Not Working
- Ensure your API key is correctly set in `.env`
- Check that the API key has sufficient credits
- Verify the API provider is correctly configured

#### Healing Strategies Not Working
- Check that the test data contains the required context
- Ensure the healing strategies are properly configured
- Review the logs for specific error messages

#### Page Object Not Available
- The framework now handles missing page objects gracefully
- Ensure your test data includes proper context
- Use the demo as a reference for proper setup

### Debug Mode

Enable debug logging:

```javascript
const framework = new BaseFramework({
    enableHealing: true,
    enableAI: true,
    debug: true
});
```

- [ ] Support for more AI providers
- [ ] Additional healing strategies
- [ ] Web UI for monitoring and configuration
- [ ] Integration with popular CI/CD platforms
- [ ] Performance optimization
- [ ] Machine learning-based healing improvements
