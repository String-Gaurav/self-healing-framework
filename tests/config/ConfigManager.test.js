const { test, expect, describe, beforeEach, afterEach } = require('@playwright/test');
const { ConfigManager } = require('../../src/config/ConfigManager');
const fs = require('fs-extra');
const path = require('path');

describe('ConfigManager', () => {
    let configManager;
    let testConfigDir;

    beforeEach(() => {
        testConfigDir = path.join(process.cwd(), 'test-config');
        configManager = new ConfigManager({
            configPath: testConfigDir,
            envFile: '.env.test'
        });
    });

    afterEach(async () => {
        // Clean up test config directory
        if (await fs.pathExists(testConfigDir)) {
            await fs.remove(testConfigDir);
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const defaultConfig = new ConfigManager();
            expect(defaultConfig.options.configPath).toBe('./config');
            expect(defaultConfig.options.envFile).toBe('.env');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                configPath: './custom-config',
                envFile: '.env.custom'
            };
            const customConfig = new ConfigManager(customOptions);
            expect(customConfig.options.configPath).toBe('./custom-config');
            expect(customConfig.options.envFile).toBe('.env.custom');
        });

        test('should create validation schema', () => {
            expect(configManager.schema).toBeDefined();
            expect(configManager.schema.describe().keys).toHaveProperty('framework');
            expect(configManager.schema.describe().keys).toHaveProperty('ai');
            expect(configManager.schema.describe().keys).toHaveProperty('logging');
            expect(configManager.schema.describe().keys).toHaveProperty('playwright');
            expect(configManager.schema.describe().keys).toHaveProperty('api');
            expect(configManager.schema.describe().keys).toHaveProperty('healing');
            expect(configManager.schema.describe().keys).toHaveProperty('testData');
        });
    });

    describe('Configuration Loading', () => {
        test('should load default configuration', async () => {
            await configManager.loadConfig();
            const config = configManager.getAll();
            
            expect(config.framework.enableHealing).toBe(true);
            expect(config.framework.enableAI).toBe(true);
            expect(config.framework.healingMode).toBe('aggressive');
            expect(config.ai.provider).toBe('openai');
            expect(config.logging.level).toBe('info');
        });

        test('should load environment-specific configuration', async () => {
            // Create environment-specific config file
            await fs.ensureDir(testConfigDir);
            const envConfig = {
                framework: {
                    enableHealing: false,
                    healingMode: 'conservative'
                },
                logging: {
                    level: 'debug'
                }
            };
            await fs.writeJson(path.join(testConfigDir, 'development.json'), envConfig);

            // Set NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            await configManager.loadConfig();
            const config = configManager.getAll();

            expect(config.framework.enableHealing).toBe(false);
            expect(config.framework.healingMode).toBe('conservative');
            expect(config.logging.level).toBe('debug');

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });

        test('should load user configuration', async () => {
            // Create user config file
            await fs.ensureDir(testConfigDir);
            const userConfig = {
                framework: {
                    maxHealingAttempts: 5
                },
                ai: {
                    model: 'gpt-3.5-turbo'
                }
            };
            await fs.writeJson(path.join(testConfigDir, 'user.json'), userConfig);

            await configManager.loadConfig();
            const config = configManager.getAll();

            expect(config.framework.maxHealingAttempts).toBe(5);
            expect(config.ai.model).toBe('gpt-3.5-turbo');
        });

        test('should merge configurations correctly', async () => {
            // Create environment config
            await fs.ensureDir(testConfigDir);
            const envConfig = {
                framework: {
                    enableHealing: false
                },
                logging: {
                    level: 'debug'
                }
            };
            await fs.writeJson(path.join(testConfigDir, 'development.json'), envConfig);

            // Create user config
            const userConfig = {
                framework: {
                    maxHealingAttempts: 5
                }
            };
            await fs.writeJson(path.join(testConfigDir, 'user.json'), userConfig);

            // Set NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            await configManager.loadConfig();
            const config = configManager.getAll();

            // Should merge all configurations
            expect(config.framework.enableHealing).toBe(false); // From env config
            expect(config.framework.maxHealingAttempts).toBe(5); // From user config
            expect(config.logging.level).toBe('debug'); // From env config
            expect(config.ai.provider).toBe('openai'); // From default config

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Configuration Validation', () => {
        test('should validate configuration against schema', async () => {
            await configManager.loadConfig();
            // Should not throw error for valid configuration
            expect(() => configManager.validateConfig()).not.toThrow();
        });

        test('should throw error for invalid configuration', () => {
            // Set invalid configuration
            configManager.config = {
                framework: {
                    enableHealing: 'invalid', // Should be boolean
                    healingMode: 'invalid_mode' // Should be one of: conservative, aggressive, learning
                }
            };

            expect(() => configManager.validateConfig()).toThrow('Configuration validation failed');
        });
    });

    describe('Configuration Access', () => {
        beforeEach(async () => {
            await configManager.loadConfig();
        });

        test('should get configuration value by path', () => {
            expect(configManager.get('framework.enableHealing')).toBe(true);
            expect(configManager.get('ai.provider')).toBe('openai');
            expect(configManager.get('logging.level')).toBe('info');
            expect(configManager.get('nonexistent.path')).toBeUndefined();
            expect(configManager.get('nonexistent.path', 'default')).toBe('default');
        });

        test('should set configuration value by path', () => {
            configManager.set('framework.maxHealingAttempts', 10);
            expect(configManager.get('framework.maxHealingAttempts')).toBe(10);

            configManager.set('custom.newProperty', 'value');
            expect(configManager.get('custom.newProperty')).toBe('value');
        });

        test('should get all configuration', () => {
            const config = configManager.getAll();
            expect(config).toHaveProperty('framework');
            expect(config).toHaveProperty('ai');
            expect(config).toHaveProperty('logging');
            expect(config).toHaveProperty('playwright');
            expect(config).toHaveProperty('api');
            expect(config).toHaveProperty('healing');
            expect(config).toHaveProperty('testData');
        });

        test('should update configuration', () => {
            const updates = {
                framework: {
                    maxHealingAttempts: 5
                },
                ai: {
                    model: 'gpt-3.5-turbo'
                }
            };

            configManager.update(updates);

            expect(configManager.get('framework.maxHealingAttempts')).toBe(5);
            expect(configManager.get('ai.model')).toBe('gpt-3.5-turbo');
        });
    });

    describe('Configuration Persistence', () => {
        test('should save configuration to file', async () => {
            await configManager.loadConfig();
            
            // Modify configuration
            configManager.set('framework.maxHealingAttempts', 10);
            configManager.set('ai.model', 'gpt-3.5-turbo');

            // Save configuration
            const savePath = path.join(testConfigDir, 'user.json');
            await configManager.saveConfig(savePath);

            // Verify file was created
            expect(await fs.pathExists(savePath)).toBe(true);

            // Verify content
            const savedConfig = await fs.readJson(savePath);
            expect(savedConfig.framework.maxHealingAttempts).toBe(10);
            expect(savedConfig.ai.model).toBe('gpt-3.5-turbo');
        });

        test('should reset configuration to defaults', async () => {
            await configManager.loadConfig();
            
            // Modify configuration
            configManager.set('framework.maxHealingAttempts', 10);
            configManager.set('ai.model', 'gpt-3.5-turbo');

            // Reset to defaults
            await configManager.reset();

            // Verify reset
            expect(configManager.get('framework.maxHealingAttempts')).toBe(3);
            expect(configManager.get('ai.model')).toBe('gpt-4');
        });
    });

    describe('Environment Variable Parsing', () => {
        test('should parse headers from environment variable', () => {
            const headersStr = '{"Content-Type": "application/json", "User-Agent": "Test"}';
            const headers = configManager.parseHeaders(headersStr);
            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'User-Agent': 'Test'
            });
        });

        test('should parse headers from simple format', () => {
            const headersStr = 'Content-Type: application/json, User-Agent: Test';
            const headers = configManager.parseHeaders(headersStr);
            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'User-Agent': 'Test'
            });
        });

        test('should handle invalid headers gracefully', () => {
            const headers = configManager.parseHeaders('invalid');
            expect(headers).toEqual({});
        });
    });

    describe('Configuration Summary', () => {
        beforeEach(async () => {
            await configManager.loadConfig();
        });

        test('should return configuration summary', () => {
            const summary = configManager.getSummary();
            expect(summary).toHaveProperty('framework');
            expect(summary).toHaveProperty('ai');
            expect(summary).toHaveProperty('logging');
            expect(summary).toHaveProperty('playwright');
            expect(summary).toHaveProperty('api');
        });
    });

    describe('Error Handling', () => {
        test('should handle configuration loading errors gracefully', async () => {
            // Mock fs.readJson to throw error
            const originalReadJson = fs.readJson;
            fs.readJson = jest.fn().mockRejectedValue(new Error('File read error'));

            await expect(configManager.loadConfig()).rejects.toThrow('File read error');

            // Restore original function
            fs.readJson = originalReadJson;
        });

        test('should handle configuration saving errors gracefully', async () => {
            await configManager.loadConfig();
            
            // Mock fs.writeJson to throw error
            const originalWriteJson = fs.writeJson;
            fs.writeJson = jest.fn().mockRejectedValue(new Error('File write error'));

            await expect(configManager.saveConfig()).rejects.toThrow('File write error');

            // Restore original function
            fs.writeJson = originalWriteJson;
        });

        test('should handle invalid JSON in configuration files', async () => {
            // Create invalid JSON file
            await fs.ensureDir(testConfigDir);
            await fs.writeFile(path.join(testConfigDir, 'user.json'), 'invalid json');

            await expect(configManager.loadConfig()).rejects.toThrow();
        });
    });
});
