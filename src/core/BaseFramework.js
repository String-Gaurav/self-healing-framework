const { test, expect } = require('@playwright/test');
const { HealingEngine } = require('../healing/HealingEngine');
const { AIIntegration } = require('../ai/AIIntegration');
const { Logger } = require('../utils/Logger');
const { ConfigManager } = require('../config/ConfigManager');

/**
 * Base Framework Class - Core architecture for self-healing test automation
 * Provides unified interface for UI and API testing with AI-powered healing
 */
class BaseFramework {
    constructor(options = {}) {
        this.options = {
            enableHealing: true,
            enableAI: true,
            aiProvider: 'openai', // 'openai', 'anthropic', 'local'
            healingMode: 'aggressive', // 'conservative', 'aggressive', 'learning'
            maxHealingAttempts: 3,
            healingTimeout: 30000,
            ...options
        };

        this.healingEngine = new HealingEngine(this.options);
        this.aiIntegration = new AIIntegration(this.options);
        this.logger = new Logger();
        this.config = new ConfigManager();
        
        this.healingHistory = [];
        this.testContext = {};
        this.metrics = {
            totalTests: 0,
            healedTests: 0,
            healingSuccessRate: 0,
            averageHealingTime: 0
        };
    }

    /**
     * Initialize the framework with test context
     */
    async initialize(testContext = {}) {
        this.testContext = {
            testName: '',
            testType: 'ui', // 'ui' or 'api'
            startTime: Date.now(),
            ...testContext
        };

        await this.healingEngine.initialize();
        await this.aiIntegration.initialize();
        
        this.logger.info(`Framework initialized with healing: ${this.options.enableHealing}`);
    }

    /**
     * Execute test with self-healing capabilities
     */
    async executeTest(testFunction, testData = {}) {
        const testStartTime = Date.now();
        this.metrics.totalTests++;

        try {
            // Pre-test analysis
            await this.preTestAnalysis(testFunction, testData);
            
            // Execute test with healing wrapper
            const result = await this.executeWithHealing(testFunction, testData);
            
            // Post-test analysis
            await this.postTestAnalysis(result);
            
            return result;
        } catch (error) {
            this.logger.error(`Test execution failed: ${error.message}`);
            
            // Attempt healing if enabled
            if (this.options.enableHealing) {
                const healingResult = await this.attemptHealing(error, testFunction, testData);
                if (healingResult.success) {
                    this.metrics.healedTests++;
                    return healingResult;
                }
            }
            
            throw error;
        } finally {
            const testDuration = Date.now() - testStartTime;
            this.updateMetrics(testDuration);
        }
    }

    /**
     * Execute test function with healing wrapper
     */
    async executeWithHealing(testFunction, testData) {
        const healingWrapper = async () => {
            try {
                return await testFunction(testData);
            } catch (error) {
                // Check if error is healable
                if (this.isHealableError(error)) {
                    throw new HealableError(error);
                }
                throw error;
            }
        };

        return await healingWrapper();
    }

    /**
     * Attempt to heal a failed test
     */
    async attemptHealing(error, testFunction, testData, context = {}) {
        this.logger.info(`Attempting healing for: ${error.message}`);
        
        // Merge provided context with test context
        const healingContext = { ...this.testContext, ...context };
        
        const healingAttempts = [];
        
        for (let attempt = 1; attempt <= this.options.maxHealingAttempts; attempt++) {
            try {
                const healingStrategy = await this.healingEngine.analyzeError(error, healingContext);
                const healingResult = await this.healingEngine.applyHealing(healingStrategy, testFunction, testData, healingContext);
                
                if (healingResult.success) {
                    this.logger.info(`Healing successful on attempt ${attempt}`);
                    this.healingHistory.push({
                        timestamp: Date.now(),
                        error: error.message,
                        strategy: healingStrategy,
                        attempt: attempt,
                        success: true
                    });
                    return healingResult;
                }
                
                healingAttempts.push({
                    attempt,
                    strategy: healingStrategy,
                    error: healingResult.error
                });
                
            } catch (healingError) {
                this.logger.error(`Healing attempt ${attempt} failed: ${healingError.message}`);
                healingAttempts.push({
                    attempt,
                    strategy: null,
                    error: healingError.message
                });
            }
        }
        
        this.healingHistory.push({
            timestamp: Date.now(),
            error: error.message,
            attempts: healingAttempts,
            success: false
        });
        
        return { success: false, attempts: healingAttempts };
    }

    /**
     * Check if error is healable
     */
    isHealableError(error) {
        const healablePatterns = [
            'element not found',
            'timeout',
            'selector not found',
            'network error',
            'assertion failed',
            'element not visible',
            'element not clickable'
        ];
        
        return healablePatterns.some(pattern => 
            error.message.toLowerCase().includes(pattern)
        );
    }

    /**
     * Pre-test analysis using AI
     */
    async preTestAnalysis(testFunction, testData) {
        if (!this.options.enableAI) return;
        
        try {
            const analysis = await this.aiIntegration.analyzeTest(testFunction, testData);
            this.testContext.aiAnalysis = analysis;
            
            // Store potential issues for proactive healing
            if (analysis.potentialIssues?.length > 0) {
                this.logger.info(`AI detected potential issues: ${analysis.potentialIssues.join(', ')}`);
            }
        } catch (error) {
            this.logger.warn(`Pre-test AI analysis failed: ${error.message}`);
        }
    }

    /**
     * Post-test analysis and learning
     */
    async postTestAnalysis(result) {
        if (!this.options.enableAI) return;
        
        try {
            await this.aiIntegration.learnFromTest(result, this.testContext);
            
            // Update healing patterns
            await this.healingEngine.updatePatterns(result, this.testContext);
        } catch (error) {
            this.logger.warn(`Post-test analysis failed: ${error.message}`);
        }
    }

    /**
     * Update metrics
     */
    updateMetrics(testDuration) {
        this.metrics.healingSuccessRate = this.metrics.healedTests / this.metrics.totalTests * 100;
        this.metrics.averageHealingTime = testDuration;
    }

    /**
     * Get framework metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            healingHistory: this.healingHistory,
            totalHealingAttempts: this.healingHistory.length,
            successfulHealings: this.healingHistory.filter(h => h.success).length
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.healingEngine.cleanup();
        await this.aiIntegration.cleanup();
        this.logger.info('Framework cleanup completed');
    }
}

/**
 * Custom error class for healable errors
 */
class HealableError extends Error {
    constructor(originalError) {
        super(originalError.message);
        this.name = 'HealableError';
        this.originalError = originalError;
        this.stack = originalError.stack;
    }
}

module.exports = {
    BaseFramework,
    HealableError
};
