const { AIIntegration } = require('../ai/AIIntegration');
const { UIFealingStrategies } = require('./strategies/UIFealingStrategies');
const { APIHealingStrategies } = require('./strategies/APIHealingStrategies');
const { Logger } = require('../utils/Logger');
const natural = require('natural');

/**
 * Healing Engine - Core self-healing logic for test automation
 * Orchestrates healing strategies for UI and API test failures
 */
class HealingEngine {
    constructor(options = {}) {
        this.options = {
            maxAttempts: 3,
            timeout: 30000,
            enableLearning: true,
            healingMode: 'aggressive', // 'conservative', 'aggressive', 'learning'
            ...options
        };

        this.aiIntegration = new AIIntegration(options);
        this.uiHealing = new UIFealingStrategies(options);
        this.apiHealing = new APIHealingStrategies(options);
        this.logger = new Logger();
        
        this.healingHistory = [];
        this.patterns = new Map();
        this.successRates = new Map();
    }

    /**
     * Initialize healing engine
     */
    async initialize() {
        await this.aiIntegration.initialize();
        await this.loadHealingPatterns();
        this.logger.info('Healing engine initialized');
    }

    /**
     * Analyze error and determine healing strategy
     */
    async analyzeError(error, context) {
        const errorType = this.classifyError(error);
        const contextData = this.extractContextData(context);
        
        this.logger.info(`Analyzing error: ${errorType}`, { context: contextData });

        // Get AI-powered analysis
        const aiStrategies = await this.aiIntegration.generateHealingStrategies(error, context);
        
        // Get pattern-based strategies
        const patternStrategies = this.getPatternBasedStrategies(errorType, contextData);
        
        // Combine and rank strategies
        const allStrategies = [...aiStrategies, ...patternStrategies];
        const rankedStrategies = this.rankStrategies(allStrategies, context);
        
        return {
            errorType,
            context: contextData,
            strategies: rankedStrategies,
            timestamp: Date.now()
        };
    }

    /**
     * Apply healing strategy to fix the test
     */
    async applyHealing(analysis, testFunction, testData, context = {}) {
        const { strategies } = analysis;
        
        for (const strategy of strategies) {
            try {
                this.logger.info(`Applying healing strategy: ${strategy.strategy}`);
                
                const result = await this.executeHealingStrategy(strategy, testFunction, testData, context);
                
                if (result.success) {
                    await this.recordSuccessfulHealing(strategy, result);
                    return result;
                }
                
                this.logger.warn(`Strategy ${strategy.strategy} failed: ${result.error}`);
                
            } catch (error) {
                this.logger.error(`Strategy execution error: ${error.message}`);
            }
        }
        
        return {
            success: false,
            error: 'All healing strategies failed',
            strategies: strategies.map(s => s.strategy)
        };
    }

    /**
     * Execute specific healing strategy
     */
    async executeHealingStrategy(strategy, testFunction, testData, context = {}) {
        const strategyType = strategy.strategy.toLowerCase();
        
        try {
            switch (strategyType) {
                case 'locator_healing':
                    return await this.uiHealing.healLocatorIssue(strategy, testData, context);
                
                case 'wait_healing':
                    return await this.uiHealing.healWaitIssue(strategy, testData, context);
                
                case 'element_state_healing':
                    return await this.uiHealing.healElementStateIssue(strategy, testData, context);
                
                case 'navigation_healing':
                    return await this.uiHealing.healNavigationIssue(strategy, testData, context);
                
                case 'api_endpoint_healing':
                    return await this.apiHealing.healEndpointIssue(strategy, testData, context);
                
                case 'api_schema_healing':
                    return await this.apiHealing.healSchemaIssue(strategy, testData, context);
                
                case 'api_response_healing':
                    return await this.apiHealing.healResponseIssue(strategy, testData, context);
                
                case 'data_healing':
                    return await this.healDataIssue(strategy, testData, context);
                
                default:
                    return await this.executeCustomStrategy(strategy, testFunction, testData, context);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: strategy.strategy
            };
        }
    }

    /**
     * Classify error type for appropriate healing
     */
    classifyError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('element not found') || errorMessage.includes('selector')) {
            return 'locator_failure';
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('wait')) {
            return 'wait_failure';
        }
        
        if (errorMessage.includes('not visible') || errorMessage.includes('not clickable')) {
            return 'element_state_failure';
        }
        
        if (errorMessage.includes('navigation') || errorMessage.includes('page not found')) {
            return 'navigation_failure';
        }
        
        if (errorMessage.includes('api') || errorMessage.includes('endpoint')) {
            return 'api_failure';
        }
        
        if (errorMessage.includes('assertion') || errorMessage.includes('expect')) {
            return 'assertion_failure';
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            return 'network_failure';
        }
        
        return 'unknown_failure';
    }

    /**
     * Extract relevant context data
     */
    extractContextData(context) {
        return {
            testType: context.testType || 'ui',
            pageUrl: context.pageUrl || '',
            element: context.element || '',
            action: context.action || '',
            timestamp: Date.now(),
            userAgent: context.userAgent || '',
            viewport: context.viewport || {}
        };
    }

    /**
     * Get pattern-based healing strategies
     */
    getPatternBasedStrategies(errorType, context) {
        const strategies = [];
        
        // Get strategies from pattern matching
        const matchingPatterns = this.findMatchingPatterns(errorType, context);
        
        for (const pattern of matchingPatterns) {
            const strategy = this.patterns.get(pattern);
            if (strategy) {
                strategies.push({
                    strategy: strategy.name,
                    description: strategy.description,
                    implementation: strategy.implementation,
                    confidence: strategy.successRate * 100,
                    source: 'pattern'
                });
            }
        }
        
        return strategies;
    }

    /**
     * Find matching patterns for error type and context
     */
    findMatchingPatterns(errorType, context) {
        const patterns = [];
        
        // Direct error type match
        patterns.push(errorType);
        
        // Context-based patterns
        if (context.testType === 'ui') {
            patterns.push(`ui_${errorType}`);
        } else if (context.testType === 'api') {
            patterns.push(`api_${errorType}`);
        }
        
        // Page-specific patterns
        if (context.pageUrl) {
            const domain = this.extractDomain(context.pageUrl);
            patterns.push(`${domain}_${errorType}`);
        }
        
        return patterns;
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Rank strategies by likelihood of success
     */
    rankStrategies(strategies, context) {
        return strategies
            .map(strategy => ({
                ...strategy,
                score: this.calculateStrategyScore(strategy, context)
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate strategy success score
     */
    calculateStrategyScore(strategy, context) {
        let score = strategy.confidence || 50;
        
        // Historical success rate
        const historicalRate = this.successRates.get(strategy.strategy) || 0.5;
        score += historicalRate * 30;
        
        // Context similarity bonus
        const contextSimilarity = this.calculateContextSimilarity(context);
        score += contextSimilarity * 20;
        
        return Math.min(100, score);
    }

    /**
     * Calculate context similarity
     */
    calculateContextSimilarity(context) {
        const similarContexts = this.healingHistory.filter(entry => 
            entry.context?.testType === context.testType &&
            entry.context?.pageUrl === context.pageUrl
        );
        
        return similarContexts.length > 0 ? 0.8 : 0.3;
    }

    /**
     * Execute custom healing strategy
     */
    async executeCustomStrategy(strategy, testFunction, testData) {
        try {
            // Parse custom implementation
            const implementation = strategy.implementation;
            
            if (typeof implementation === 'function') {
                return await implementation(testData);
            }
            
            // Handle string-based implementations
            if (typeof implementation === 'string') {
                return await this.executeStringImplementation(implementation, testData);
            }
            
            return {
                success: false,
                error: 'Invalid strategy implementation',
                strategy: strategy.strategy
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: strategy.strategy
            };
        }
    }

    /**
     * Execute string-based implementation
     */
    async executeStringImplementation(implementation, testData) {
        // This is a simplified version - in production, you'd want more sophisticated execution
        const code = `
            (async (testData) => {
                ${implementation}
            })
        `;
        
        const func = eval(code);
        return await func(testData);
    }

    /**
     * Heal data-related issues
     */
    async healDataIssue(strategy, testData, context = {}) {
        try {
            // AI-powered data healing
            const healedData = await this.aiIntegration.healTestData(testData, strategy);
            
            return {
                success: true,
                healedData,
                strategy: strategy.strategy,
                changes: strategy.changes || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: strategy.strategy
            };
        }
    }

    /**
     * Record successful healing for learning
     */
    async recordSuccessfulHealing(strategy, result) {
        const healingRecord = {
            timestamp: Date.now(),
            strategy: strategy.strategy,
            success: true,
            result,
            context: result.context || {}
        };
        
        this.healingHistory.push(healingRecord);
        
        // Update success rates
        const currentRate = this.successRates.get(strategy.strategy) || 0.5;
        const newRate = (currentRate + 1) / 2; // Simple moving average
        this.successRates.set(strategy.strategy, newRate);
        
        // Update patterns
        await this.updatePatterns(strategy, true);
    }

    /**
     * Update healing patterns based on results
     */
    async updatePatterns(strategy, success) {
        const patternKey = strategy.strategy;
        
        if (!this.patterns.has(patternKey)) {
            this.patterns.set(patternKey, {
                name: strategy.strategy,
                description: strategy.description,
                implementation: strategy.implementation,
                successCount: 0,
                totalCount: 0,
                successRate: 0.5
            });
        }
        
        const pattern = this.patterns.get(patternKey);
        pattern.totalCount++;
        
        if (success) {
            pattern.successCount++;
        }
        
        pattern.successRate = pattern.successCount / pattern.totalCount;
    }

    /**
     * Load healing patterns from storage
     */
    async loadHealingPatterns() {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            
            const patternsPath = path.join(process.cwd(), 'data', 'patterns.json');
            
            if (await fs.pathExists(patternsPath)) {
                const data = await fs.readJson(patternsPath);
                
                // Load patterns
                if (data.patterns) {
                    this.patterns = new Map(data.patterns);
                }
                
                // Load success rates
                if (data.successRates) {
                    this.successRates = new Map(data.successRates);
                }
                
                // Load healing history
                if (data.healingHistory) {
                    this.healingHistory = data.healingHistory;
                }
            }
        } catch (error) {
            this.logger.warn('Failed to load healing patterns:', error.message);
        }
    }

    /**
     * Save healing patterns to storage
     */
    async saveHealingPatterns() {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            
            await fs.ensureDir(path.join(process.cwd(), 'data'));
            
            const patternsPath = path.join(process.cwd(), 'data', 'patterns.json');
            
            const data = {
                patterns: Array.from(this.patterns.entries()),
                successRates: Array.from(this.successRates.entries()),
                healingHistory: this.healingHistory.slice(-1000), // Keep last 1000 records
                lastUpdated: Date.now()
            };
            
            await fs.writeJson(patternsPath, data, { spaces: 2 });
        } catch (error) {
            this.logger.error('Failed to save healing patterns:', error.message);
        }
    }

    /**
     * Get healing statistics
     */
    getStatistics() {
        const totalAttempts = this.healingHistory.length;
        const successfulHealings = this.healingHistory.filter(h => h.success).length;
        const successRate = totalAttempts > 0 ? (successfulHealings / totalAttempts) * 100 : 0;
        
        const strategyStats = {};
        for (const [strategy, rate] of this.successRates.entries()) {
            strategyStats[strategy] = {
                successRate: rate * 100,
                attempts: this.healingHistory.filter(h => h.strategy === strategy).length
            };
        }
        
        return {
            totalAttempts,
            successfulHealings,
            successRate,
            strategyStats,
            patternsCount: this.patterns.size
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.saveHealingPatterns();
        await this.aiIntegration.cleanup();
    }
}

module.exports = { HealingEngine };
