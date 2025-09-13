const { test, expect, describe, beforeEach, afterEach } = require('@playwright/test');
const { HealingEngine } = require('../../src/healing/HealingEngine');

describe('HealingEngine', () => {
    let healingEngine;
    let mockAIIntegration;
    let mockUIFealingStrategies;
    let mockAPIHealingStrategies;

    beforeEach(async () => {
        // Mock dependencies
        mockAIIntegration = {
            initialize: jest.fn().mockResolvedValue(true),
            generateHealingStrategies: jest.fn().mockResolvedValue([]),
            cleanup: jest.fn().mockResolvedValue(true)
        };

        mockUIFealingStrategies = {
            healLocatorIssue: jest.fn().mockResolvedValue({ success: false }),
            healWaitIssue: jest.fn().mockResolvedValue({ success: false }),
            healElementStateIssue: jest.fn().mockResolvedValue({ success: false }),
            healNavigationIssue: jest.fn().mockResolvedValue({ success: false })
        };

        mockAPIHealingStrategies = {
            healEndpointIssue: jest.fn().mockResolvedValue({ success: false }),
            healSchemaIssue: jest.fn().mockResolvedValue({ success: false }),
            healResponseIssue: jest.fn().mockResolvedValue({ success: false })
        };

        healingEngine = new HealingEngine({
            maxAttempts: 3,
            timeout: 30000,
            enableLearning: true,
            healingMode: 'aggressive'
        });

        // Replace dependencies with mocks
        healingEngine.aiIntegration = mockAIIntegration;
        healingEngine.uiHealing = mockUIFealingStrategies;
        healingEngine.apiHealing = mockAPIHealingStrategies;
    });

    afterEach(async () => {
        if (healingEngine) {
            await healingEngine.cleanup();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const engine = new HealingEngine();
            expect(engine.options.maxAttempts).toBe(3);
            expect(engine.options.timeout).toBe(30000);
            expect(engine.options.enableLearning).toBe(true);
            expect(engine.options.healingMode).toBe('aggressive');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                maxAttempts: 5,
                timeout: 60000,
                enableLearning: false,
                healingMode: 'conservative'
            };
            const engine = new HealingEngine(customOptions);
            expect(engine.options.maxAttempts).toBe(5);
            expect(engine.options.timeout).toBe(60000);
            expect(engine.options.enableLearning).toBe(false);
            expect(engine.options.healingMode).toBe('conservative');
        });

        test('should initialize successfully', async () => {
            await healingEngine.initialize();
            expect(mockAIIntegration.initialize).toHaveBeenCalled();
        });
    });

    describe('Error Analysis', () => {
        beforeEach(async () => {
            await healingEngine.initialize();
        });

        test('should classify locator failure errors', () => {
            const error = new Error('element not found');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('locator_failure');
        });

        test('should classify wait failure errors', () => {
            const error = new Error('timeout waiting for element');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('wait_failure');
        });

        test('should classify element state failure errors', () => {
            const error = new Error('element not visible');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('element_state_failure');
        });

        test('should classify navigation failure errors', () => {
            const error = new Error('page not found');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('navigation_failure');
        });

        test('should classify API failure errors', () => {
            const error = new Error('API endpoint not found');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('api_failure');
        });

        test('should classify assertion failure errors', () => {
            const error = new Error('assertion failed');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('assertion_failure');
        });

        test('should classify network failure errors', () => {
            const error = new Error('network error');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('network_failure');
        });

        test('should classify unknown failure errors', () => {
            const error = new Error('unknown error');
            const errorType = healingEngine.classifyError(error);
            expect(errorType).toBe('unknown_failure');
        });

        test('should extract context data', () => {
            const context = {
                testType: 'ui',
                pageUrl: 'https://example.com',
                element: '#test',
                action: 'click',
                userAgent: 'Chrome',
                viewport: { width: 1280, height: 720 }
            };

            const contextData = healingEngine.extractContextData(context);
            expect(contextData.testType).toBe('ui');
            expect(contextData.pageUrl).toBe('https://example.com');
            expect(contextData.element).toBe('#test');
            expect(contextData.action).toBe('click');
            expect(contextData.userAgent).toBe('Chrome');
            expect(contextData.viewport).toEqual({ width: 1280, height: 720 });
        });
    });

    describe('Healing Strategy Application', () => {
        beforeEach(async () => {
            await healingEngine.initialize();
        });

        test('should apply UI healing strategies for UI errors', async () => {
            const error = new Error('element not found');
            const context = { testType: 'ui', pageUrl: 'https://example.com' };
            const testFunction = jest.fn();
            const testData = { element: { selector: '#test' } };

            // Mock AI strategies
            mockAIIntegration.generateHealingStrategies.mockResolvedValue([
                { strategy: 'locator_healing', confidence: 80 }
            ]);

            // Mock UI healing success
            mockUIFealingStrategies.healLocatorIssue.mockResolvedValue({
                success: true,
                healedData: testData,
                strategy: 'locator_healing'
            });

            const analysis = await healingEngine.analyzeError(error, context);
            const result = await healingEngine.applyHealing(analysis, testFunction, testData);

            expect(result.success).toBe(true);
            expect(mockUIFealingStrategies.healLocatorIssue).toHaveBeenCalled();
        });

        test('should apply API healing strategies for API errors', async () => {
            const error = new Error('API endpoint not found');
            const context = { testType: 'api', pageUrl: 'https://api.example.com' };
            const testFunction = jest.fn();
            const testData = { endpoint: '/users', method: 'GET' };

            // Mock AI strategies
            mockAIIntegration.generateHealingStrategies.mockResolvedValue([
                { strategy: 'api_endpoint_healing', confidence: 80 }
            ]);

            // Mock API healing success
            mockAPIHealingStrategies.healEndpointIssue.mockResolvedValue({
                success: true,
                healedData: testData,
                strategy: 'api_endpoint_healing'
            });

            const analysis = await healingEngine.analyzeError(error, context);
            const result = await healingEngine.applyHealing(analysis, testFunction, testData);

            expect(result.success).toBe(true);
            expect(mockAPIHealingStrategies.healEndpointIssue).toHaveBeenCalled();
        });

        test('should try multiple strategies when first fails', async () => {
            const error = new Error('element not found');
            const context = { testType: 'ui' };
            const testFunction = jest.fn();
            const testData = { element: { selector: '#test' } };

            // Mock AI strategies
            mockAIIntegration.generateHealingStrategies.mockResolvedValue([
                { strategy: 'locator_healing', confidence: 80 },
                { strategy: 'wait_healing', confidence: 70 }
            ]);

            // Mock first strategy failure, second success
            mockUIFealingStrategies.healLocatorIssue.mockResolvedValue({
                success: false,
                error: 'Locator healing failed'
            });
            mockUIFealingStrategies.healWaitIssue.mockResolvedValue({
                success: true,
                healedData: testData,
                strategy: 'wait_healing'
            });

            const analysis = await healingEngine.analyzeError(error, context);
            const result = await healingEngine.applyHealing(analysis, testFunction, testData);

            expect(result.success).toBe(true);
            expect(mockUIFealingStrategies.healLocatorIssue).toHaveBeenCalled();
            expect(mockUIFealingStrategies.healWaitIssue).toHaveBeenCalled();
        });

        test('should return failure when all strategies fail', async () => {
            const error = new Error('element not found');
            const context = { testType: 'ui' };
            const testFunction = jest.fn();
            const testData = { element: { selector: '#test' } };

            // Mock AI strategies
            mockAIIntegration.generateHealingStrategies.mockResolvedValue([
                { strategy: 'locator_healing', confidence: 80 },
                { strategy: 'wait_healing', confidence: 70 }
            ]);

            // Mock all strategies failure
            mockUIFealingStrategies.healLocatorIssue.mockResolvedValue({
                success: false,
                error: 'Locator healing failed'
            });
            mockUIFealingStrategies.healWaitIssue.mockResolvedValue({
                success: false,
                error: 'Wait healing failed'
            });

            const analysis = await healingEngine.analyzeError(error, context);
            const result = await healingEngine.applyHealing(analysis, testFunction, testData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('All healing strategies failed');
        });
    });

    describe('Pattern Learning', () => {
        beforeEach(async () => {
            await healingEngine.initialize();
        });

        test('should update patterns on successful healing', async () => {
            const strategy = {
                strategy: 'locator_healing',
                description: 'Heal locator issues',
                implementation: jest.fn()
            };

            const result = {
                success: true,
                healedData: { element: { selector: '#new-selector' } }
            };

            await healingEngine.recordSuccessfulHealing(strategy, result);

            expect(healingEngine.patterns.has('locator_healing')).toBe(true);
            const pattern = healingEngine.patterns.get('locator_healing');
            expect(pattern.successCount).toBe(1);
            expect(pattern.totalCount).toBe(1);
            expect(pattern.successRate).toBe(1);
        });

        test('should update success rates', async () => {
            const strategy = {
                strategy: 'locator_healing',
                description: 'Heal locator issues',
                implementation: jest.fn()
            };

            const result = {
                success: true,
                healedData: { element: { selector: '#new-selector' } }
            };

            await healingEngine.recordSuccessfulHealing(strategy, result);

            expect(healingEngine.successRates.has('locator_healing')).toBe(true);
            const successRate = healingEngine.successRates.get('locator_healing');
            expect(successRate).toBeGreaterThan(0.5);
        });
    });

    describe('Statistics', () => {
        beforeEach(async () => {
            await healingEngine.initialize();
        });

        test('should return healing statistics', () => {
            // Add some healing history
            healingEngine.healingHistory.push({
                timestamp: Date.now(),
                strategy: 'locator_healing',
                success: true
            });
            healingEngine.healingHistory.push({
                timestamp: Date.now(),
                strategy: 'wait_healing',
                success: false
            });

            const stats = healingEngine.getStatistics();
            expect(stats.totalAttempts).toBe(2);
            expect(stats.successfulHealings).toBe(1);
            expect(stats.successRate).toBe(50);
            expect(stats.patternsCount).toBe(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle AI integration errors gracefully', async () => {
            mockAIIntegration.generateHealingStrategies.mockRejectedValue(
                new Error('AI service unavailable')
            );

            const error = new Error('element not found');
            const context = { testType: 'ui' };

            const analysis = await healingEngine.analyzeError(error, context);
            expect(analysis.strategies).toEqual([]);
        });

        test('should handle healing strategy errors gracefully', async () => {
            const error = new Error('element not found');
            const context = { testType: 'ui' };
            const testFunction = jest.fn();
            const testData = { element: { selector: '#test' } };

            // Mock AI strategies
            mockAIIntegration.generateHealingStrategies.mockResolvedValue([
                { strategy: 'locator_healing', confidence: 80 }
            ]);

            // Mock strategy to throw error
            mockUIFealingStrategies.healLocatorIssue.mockRejectedValue(
                new Error('Strategy execution failed')
            );

            const analysis = await healingEngine.analyzeError(error, context);
            const result = await healingEngine.applyHealing(analysis, testFunction, testData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('All healing strategies failed');
        });
    });
});
