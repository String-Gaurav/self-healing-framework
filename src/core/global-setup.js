const { ConfigManager } = require('../config/ConfigManager');
const { Logger } = require('../utils/Logger');
const fs = require('fs-extra');
const path = require('path');

/**
 * Global Setup for Self-Healing Test Framework
 * Initializes framework components and prepares test environment
 */
async function globalSetup(config) {
    const logger = new Logger();
    const configManager = new ConfigManager();
    
    try {
        logger.info('Starting global setup for self-healing framework');
        
        // Load configuration
        await configManager.loadConfig();
        const frameworkConfig = configManager.getAll();
        
        // Create necessary directories
        await createDirectories(frameworkConfig);
        
        // Initialize AI integration if enabled
        if (frameworkConfig.framework.enableAI) {
            await initializeAI(frameworkConfig.ai);
        }
        
        // Initialize healing patterns
        await initializeHealingPatterns(frameworkConfig.healing);
        
        // Set up test data
        await setupTestData(frameworkConfig.testData);
        
        // Store configuration in global context
        global.selfHealingConfig = frameworkConfig;
        global.selfHealingLogger = logger;
        
        logger.info('Global setup completed successfully');
        
    } catch (error) {
        logger.error('Global setup failed', { error: error.message });
        throw error;
    }
}

/**
 * Create necessary directories
 */
async function createDirectories(config) {
    const directories = [
        config.logging.logDir,
        config.ai.learningDataPath,
        config.healing.patternStoragePath,
        config.testData.path,
        './test-results',
        './data/patterns',
        './data/learning'
    ];
    
    for (const dir of directories) {
        await fs.ensureDir(dir);
    }
}

/**
 * Initialize AI integration
 */
async function initializeAI(aiConfig) {
    try {
        const { AIIntegration } = require('../ai/AIIntegration');
        const aiIntegration = new AIIntegration(aiConfig);
        await aiIntegration.initialize();
        
        global.selfHealingAI = aiIntegration;
    } catch (error) {
        console.warn('AI initialization failed:', error.message);
    }
}

/**
 * Initialize healing patterns
 */
async function initializeHealingPatterns(healingConfig) {
    try {
        const { HealingEngine } = require('../healing/HealingEngine');
        const healingEngine = new HealingEngine(healingConfig);
        await healingEngine.initialize();
        
        global.selfHealingEngine = healingEngine;
    } catch (error) {
        console.warn('Healing engine initialization failed:', error.message);
    }
}

/**
 * Set up test data
 */
async function setupTestData(testDataConfig) {
    try {
        const testDataPath = testDataConfig.path;
        
        // Create sample test data if it doesn't exist
        const sampleDataPath = path.join(testDataPath, 'sample.json');
        if (!await fs.pathExists(sampleDataPath)) {
            const sampleData = {
                users: [
                    { id: 1, name: 'Test User', email: 'test@example.com' },
                    { id: 2, name: 'Admin User', email: 'admin@example.com' }
                ],
                products: [
                    { id: 1, name: 'Test Product', price: 99.99 },
                    { id: 2, name: 'Another Product', price: 149.99 }
                ],
                api: {
                    baseUrl: 'https://jsonplaceholder.typicode.com',
                    endpoints: {
                        users: '/users',
                        posts: '/posts',
                        comments: '/comments'
                    }
                }
            };
            
            await fs.writeJson(sampleDataPath, sampleData, { spaces: 2 });
        }
        
        global.testDataPath = testDataPath;
    } catch (error) {
        console.warn('Test data setup failed:', error.message);
    }
}

module.exports = globalSetup;
