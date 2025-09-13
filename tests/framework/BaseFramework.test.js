const { test, expect, describe, beforeEach, afterEach } = require('@playwright/test');
const { BaseFramework } = require('../../src/core/BaseFramework');
const { Logger } = require('../../src/utils/Logger');
const { ConfigManager } = require('../../src/config/ConfigManager');

describe('BaseFramework', () => {
    let framework;
    let mockLogger;
    let mockConfig;

    beforeEach(async () => {
        // Mock dependencies
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };

        mockConfig = {
            framework: {
                enableHealing: true,
                enableAI: true,
                healingMode: 'aggressive',
                maxHealingAttempts: 3,
                healingTimeout: 30000
            },
            ai: {
                provider: 'openai',
                model: 'gpt-4',
                temperature: 0.1,
                maxTokens: 2000
            },
            logging: {
                level: 'info',
                enableFileLogging: true,
                logDir: './logs'
            }
        };

        framework = new BaseFramework(mockConfig);
    });

    afterEach(async () => {
        if (framework) {
            await framework.cleanup();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const defaultFramework = new BaseFramework();
            expect(defaultFramework.options.enableHealing).toBe(true);
            expect(defaultFramework.options.enableAI).toBe(true);
            expect(defaultFramework.options.healingMode).toBe('aggressive');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                enableHealing: false,
                healingMode: 'conservative',
                maxHealingAttempts: 5
            };
            const customFramework = new BaseFramework(customOptions);
            expect(customFramework.options.enableHealing).toBe(false);
            expect(customFramework.options.healingMode).toBe('conservative');
            expect(customFramework.options.maxHealingAttempts).toBe(5);
        });

        test('should initialize framework components', async () => {
            await framework.initialize();
            expect(framework.healingEngine).toBeDefined();
            expect(framework.aiIntegration).toBeDefined();
            expect(framework.logger).toBeDefined();
            expect(framework.config).toBeDefined();
        });
    });

    describe('Test Execution', () => {
        beforeEach(async () => {
            await framework.initialize();
        });

        test('should execute successful test without healing', async () => {
            const testFunction = async (testData) => {
                return { success: true, data: testData };
            };

            const testData = { test: 'data' };
            const result = await framework.executeTest(testFunction, testData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
        });

        test('should attempt healing on test failure', async () => {
            const testFunction = async (testData) => {
                throw new Error('Element not found');
            };

            const testData = { element: { selector: '#test' } };
            
            // Mock healing engine
            framework.healingEngine.analyzeError = jest.fn().mockResolvedValue({
                strategies: [{ strategy: 'locator_healing', confidence: 80 }]
            });
            framework.healingEngine.applyHealing = jest.fn().mockResolvedValue({
                success: true,
                healedData: testData
            });

            const result = await framework.executeTest(testFunction, testData);

            expect(framework.healingEngine.analyzeError).toHaveBeenCalled();
            expect(framework.healingEngine.applyHealing).toHaveBeenCalled();
        });

        test('should handle healing failure', async () => {
            const testFunction = async (testData) => {
                throw new Error('Element not found');
            };

            const testData = { element: { selector: '#test' } };
            
            // Mock healing engine to fail
            framework.healingEngine.analyzeError = jest.fn().mockResolvedValue({
                strategies: [{ strategy: 'locator_healing', confidence: 80 }]
            });
            framework.healingEngine.applyHealing = jest.fn().mockResolvedValue({
                success: false,
                error: 'Healing failed'
            });

            await expect(framework.executeTest(testFunction, testData)).rejects.toThrow('Element not found');
        });

        test('should update metrics after test execution', async () => {
            const testFunction = async (testData) => {
                return { success: true, data: testData };
            };

            const testData = { test: 'data' };
            await framework.executeTest(testFunction, testData);

            const metrics = framework.getMetrics();
            expect(metrics.totalTests).toBe(1);
            expect(metrics.healedTests).toBe(0);
        });
    });

    describe('Healing Detection', () => {
        test('should identify healable errors', () => {
            const healableErrors = [
                new Error('element not found'),
                new Error('timeout waiting for element'),
                new Error('selector not found'),
                new Error('network error'),
                new Error('assertion failed'),
                new Error('element not visible'),
                new Error('element not clickable')
            ];

            healableErrors.forEach(error => {
                expect(framework.isHealableError(error)).toBe(true);
            });
        });

        test('should identify non-healable errors', () => {
            const nonHealableErrors = [
                new Error('syntax error'),
                new Error('type error'),
                new Error('reference error'),
                new Error('invalid argument')
            ];

            nonHealableErrors.forEach(error => {
                expect(framework.isHealableError(error)).toBe(false);
            });
        });
    });

    describe('AI Integration', () => {
        beforeEach(async () => {
            await framework.initialize();
        });

        test('should perform pre-test analysis when AI is enabled', async () => {
            const testFunction = async (testData) => {
                return { success: true, data: testData };
            };

            const testData = { test: 'data' };
            
            // Mock AI integration
            framework.aiIntegration.analyzeTest = jest.fn().mockResolvedValue({
                potentialIssues: ['Potential timeout'],
                recommendations: ['Add explicit wait'],
                confidence: 85
            });

            await framework.preTestAnalysis(testFunction, testData);

            expect(framework.aiIntegration.analyzeTest).toHaveBeenCalledWith(testFunction, testData);
        });

        test('should perform post-test analysis when AI is enabled', async () => {
            const result = { success: true, data: { test: 'data' } };
            const testContext = { testName: 'test', testType: 'ui' };
            
            // Mock AI integration
            framework.aiIntegration.learnFromTest = jest.fn().mockResolvedValue(true);

            await framework.postTestAnalysis(result);

            expect(framework.aiIntegration.learnFromTest).toHaveBeenCalledWith(result, testContext);
        });
    });

    describe('Metrics and Statistics', () => {
        test('should track healing metrics', async () => {
            await framework.initialize();

            // Simulate successful healing
            framework.metrics.totalTests = 10;
            framework.metrics.healedTests = 3;
            framework.updateMetrics(1000);

            const metrics = framework.getMetrics();
            expect(metrics.totalTests).toBe(10);
            expect(metrics.healedTests).toBe(3);
            expect(metrics.healingSuccessRate).toBe(30);
            expect(metrics.averageHealingTime).toBe(1000);
        });

        test('should track healing history', async () => {
            await framework.initialize();

            // Add healing history
            framework.healingHistory.push({
                timestamp: Date.now(),
                error: 'Element not found',
                strategy: 'locator_healing',
                success: true
            });

            const metrics = framework.getMetrics();
            expect(metrics.healingHistory).toHaveLength(1);
            expect(metrics.totalHealingAttempts).toBe(1);
            expect(metrics.successfulHealings).toBe(1);
        });
    });

    describe('Error Handling', () => {
        test('should handle initialization errors gracefully', async () => {
            // Mock initialization failure
            framework.healingEngine.initialize = jest.fn().mockRejectedValue(new Error('Init failed'));

            await expect(framework.initialize()).rejects.toThrow('Init failed');
        });

        test('should handle cleanup errors gracefully', async () => {
            await framework.initialize();
            
            // Mock cleanup failure
            framework.healingEngine.cleanup = jest.fn().mockRejectedValue(new Error('Cleanup failed'));

            await expect(framework.cleanup()).rejects.toThrow('Cleanup failed');
        });
    });

    describe('Configuration Management', () => {
        test('should merge options correctly', () => {
            const baseOptions = {
                enableHealing: true,
                healingMode: 'aggressive',
                maxHealingAttempts: 3
            };

            const overrideOptions = {
                healingMode: 'conservative',
                maxHealingAttempts: 5
            };

            const framework = new BaseFramework({ ...baseOptions, ...overrideOptions });

            expect(framework.options.enableHealing).toBe(true);
            expect(framework.options.healingMode).toBe('conservative');
            expect(framework.options.maxHealingAttempts).toBe(5);
        });
    });
});
