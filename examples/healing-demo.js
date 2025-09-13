#!/usr/bin/env node

/**
 * Self-Healing Framework Demo
 * Demonstrates the self-healing capabilities of the framework
 */

// Load environment variables first
require('dotenv').config();

const { BaseFramework } = require('../src/core/BaseFramework');
const { test, expect } = require('@playwright/test');

// Demo configuration
const demoConfig = {
    enableHealing: true,
    enableAI: true,
    aiProvider: 'openai',
    healingMode: 'aggressive',
    maxHealingAttempts: 3,
    healingTimeout: 30000
};

/**
 * Demo UI Test with Self-Healing
 */
async function demoUITest() {
    console.log('🎭 Starting UI Test Demo with Self-Healing...\n');
    
    const framework = new BaseFramework(demoConfig);
    await framework.initialize({
        testName: 'UI Demo Test',
        testType: 'ui'
    });

    // Simulate a test that might fail due to locator issues
    const testFunction = async (testData) => {
        const { page } = testData;
        
        // This test might fail if the element selector changes
        await page.goto('https://example.com');
        
        // Simulate a potentially failing locator
        const element = page.locator('#potentially-changing-selector');
        await element.click();
        
        // Verify the action worked
        await expect(element).toBeVisible();
    };

    const testData = {
        page: global.page, // This would be provided by Playwright
        element: {
            selector: '#potentially-changing-selector',
            description: 'Main navigation button'
        }
    };

    try {
        const result = await framework.executeTest(testFunction, testData);
        console.log('Test completed successfully!');
        console.log('Healing Statistics:', framework.getMetrics());
    } catch (error) {
        console.log('Test failed even after healing attempts:', error.message);
    } finally {
        await framework.cleanup();
    }
}

/**
 * Demo API Test with Self-Healing
 */
async function demoAPITest() {
    console.log('Starting API Test Demo with Self-Healing...\n');
    
    const framework = new BaseFramework(demoConfig);
    await framework.initialize({
        testName: 'API Demo Test',
        testType: 'api'
    });

    // Simulate an API test that might fail due to endpoint changes
    const testFunction = async (testData) => {
        const { endpoint, method, baseUrl } = testData;
        
        // This test might fail if the API endpoint changes
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    };

    const testData = {
        endpoint: '/users',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedResponse: {
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String)
        }
    };

    try {
        const result = await framework.executeTest(testFunction, testData);
        console.log('API Test completed successfully!');
        console.log('Healing Statistics:', framework.getMetrics());
    } catch (error) {
        console.log('API Test failed even after healing attempts:', error.message);
    } finally {
        await framework.cleanup();
    }
}

/**
 * Demo Healing Strategies
 */
async function demoHealingStrategies() {
    console.log('Demonstrating Healing Strategies...\n');
    
    const framework = new BaseFramework(demoConfig);
    await framework.initialize();

    // Simulate different types of failures
    const failureScenarios = [
        {
            name: 'Element Not Found',
            error: new Error('Element not found: #missing-element'),
            testData: {
                element: { selector: '#missing-element' },
                page: global.page
            },
            context: {
                testType: 'ui',
                pageUrl: 'https://example.com',
                element: '#missing-element',
                action: 'click',
                timestamp: Date.now(),
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                viewport: { width: 1920, height: 1080 }
            }
        },
        {
            name: 'Timeout Error',
            error: new Error('Timeout waiting for element'),
            testData: {
                element: { selector: '#slow-loading-element' },
                page: global.page
            },
            context: {
                testType: 'ui',
                pageUrl: 'https://example.com',
                element: '#slow-loading-element',
                action: 'wait',
                timestamp: Date.now(),
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                viewport: { width: 1920, height: 1080 }
            }
        },
        {
            name: 'API Endpoint Error',
            error: new Error('404 Not Found'),
            testData: {
                endpoint: '/old-endpoint',
                method: 'GET',
                baseUrl: 'https://api.example.com'
            },
            context: {
                testType: 'api',
                endpoint: '/old-endpoint',
                method: 'GET',
                baseUrl: 'https://api.example.com',
                timestamp: Date.now()
            }
        }
    ];

    for (const scenario of failureScenarios) {
        console.log(`\nTesting scenario: ${scenario.name}`);
        
        try {
            const healingResult = await framework.attemptHealing(
                scenario.error,
                () => Promise.reject(scenario.error),
                scenario.testData,
                scenario.context
            );
            
            if (healingResult.success) {
                console.log('Healing successful!');
            } else {
                console.log('Healing failed');
            }
        } catch (error) {
            console.log('Healing error:', error.message);
        }
    }

    await framework.cleanup();
}

/**
 * Demo AI Integration
 */
async function demoAIIntegration() {
    console.log('Demonstrating AI Integration...\n');
    
    const framework = new BaseFramework(demoConfig);
    await framework.initialize();

    // Simulate AI-powered test analysis
    const testFunction = async (testData) => {
        // Simulate a test function
        return { success: true, data: testData };
    };

    const testData = {
        element: {
            selector: '#login-button',
            description: 'Login button on homepage'
        },
        page: global.page
    };

    try {
        // Pre-test analysis
        const analysis = await framework.preTestAnalysis(testFunction, testData);
        console.log('AI Analysis:', analysis);
        
        // Test execution
        const result = await framework.executeTest(testFunction, testData);
        console.log('Test result:', result);
        
        // Post-test learning
        await framework.postTestAnalysis(result);
        console.log('AI learning completed');
        
    } catch (error) {
        console.log('AI integration error:', error.message);
    } finally {
        await framework.cleanup();
    }
}

/**
 * Main demo function
 */
async function runDemo() {
    console.log('Self-Healing Test Framework Demo\n');
    console.log('=====================================\n');
    
    try {
        // Check if we're in a Playwright context
        if (typeof global.page === 'undefined') {
            console.log('Note: This demo requires a Playwright browser context.');
            console.log('   Run with: npx playwright test examples/healing-demo.js\n');
        }
        
        // Run demos
        await demoHealingStrategies();
        await demoAIIntegration();
        
        if (typeof global.page !== 'undefined') {
            await demoUITest();
        }
        
        await demoAPITest();
        
        console.log('\nDemo completed successfully!');
        console.log('\nNext steps:');
        console.log('   1. Copy env.example to .env and configure your API keys');
        console.log('   2. Run: npm run healing-demo');
        console.log('   3. Check the logs directory for detailed information');
        console.log('   4. Explore the test-results directory for reports');
        
    } catch (error) {
        console.error('Demo failed:', error.message);
        process.exit(1);
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = {
    runDemo,
    demoUITest,
    demoAPITest,
    demoHealingStrategies,
    demoAIIntegration
};
