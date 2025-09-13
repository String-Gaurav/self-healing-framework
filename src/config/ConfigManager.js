const fs = require('fs-extra');
const path = require('path');
const Joi = require('joi');

/**
 * Configuration Manager - Centralized configuration management
 * Handles environment variables, config files, and validation
 */
class ConfigManager {
    constructor(options = {}) {
        this.options = {
            configPath: './config',
            envFile: '.env',
            ...options
        };

        this.config = {};
        this.schema = this.createValidationSchema();
        this.loadEnvironmentVariables();
    }

    /**
     * Create Joi validation schema for configuration
     */
    createValidationSchema() {
        return Joi.object({
            // Framework settings
            framework: Joi.object({
                enableHealing: Joi.boolean().default(true),
                enableAI: Joi.boolean().default(true),
                healingMode: Joi.string().valid('conservative', 'aggressive', 'learning').default('aggressive'),
                maxHealingAttempts: Joi.number().integer().min(1).max(10).default(3),
                healingTimeout: Joi.number().integer().min(1000).max(300000).default(30000)
            }).default(),

            // AI settings
            ai: Joi.object({
                provider: Joi.string().valid('openai', 'anthropic', 'local').default('openai'),
                model: Joi.string().default('gpt-4'),
                temperature: Joi.number().min(0).max(2).default(0.1),
                maxTokens: Joi.number().integer().min(100).max(4000).default(2000),
                enableLearning: Joi.boolean().default(true),
                learningDataPath: Joi.string().default('./data/learning')
            }).default(),

            // Logging settings
            logging: Joi.object({
                level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
                enableFileLogging: Joi.boolean().default(true),
                logDir: Joi.string().default('./logs'),
                maxFiles: Joi.number().integer().min(1).max(50).default(5),
                maxSize: Joi.string().default('10MB')
            }).default(),

            // Playwright settings
            playwright: Joi.object({
                headless: Joi.boolean().default(true),
                slowMo: Joi.number().integer().min(0).max(5000).default(0),
                timeout: Joi.number().integer().min(1000).max(60000).default(30000),
                viewport: Joi.object({
                    width: Joi.number().integer().min(320).max(3840).default(1280),
                    height: Joi.number().integer().min(240).max(2160).default(720)
                }).default(),
                browsers: Joi.array().items(Joi.string().valid('chromium', 'firefox', 'webkit')).default(['chromium'])
            }).default(),

            // API testing settings
            api: Joi.object({
                baseUrl: Joi.string().uri().default(''),
                timeout: Joi.number().integer().min(1000).max(120000).default(30000),
                retries: Joi.number().integer().min(0).max(5).default(3),
                retryDelay: Joi.number().integer().min(100).max(10000).default(1000),
                headers: Joi.object().pattern(Joi.string(), Joi.string()).default({})
            }).default(),

            // Healing strategies
            healing: Joi.object({
                strategies: Joi.array().items(Joi.string()).default([
                    'locator_healing',
                    'wait_healing',
                    'element_state_healing',
                    'navigation_healing',
                    'api_endpoint_healing',
                    'api_schema_healing',
                    'api_response_healing',
                    'data_healing'
                ]),
                enablePatternLearning: Joi.boolean().default(true),
                patternStoragePath: Joi.string().default('./data/patterns'),
                successThreshold: Joi.number().min(0).max(1).default(0.7)
            }).default(),

            // Test data settings
            testData: Joi.object({
                path: Joi.string().default('./test-data'),
                format: Joi.string().valid('json', 'csv', 'yaml').default('json'),
                enableDataHealing: Joi.boolean().default(true),
                dataValidation: Joi.boolean().default(true)
            }).default()
        });
    }

    /**
     * Load environment variables from .env file
     */
    loadEnvironmentVariables() {
        try {
            const envPath = path.resolve(this.options.envFile);
            if (fs.existsSync(envPath)) {
                require('dotenv').config({ path: envPath });
            }
        } catch (error) {
            console.warn('Failed to load .env file:', error.message);
        }
    }

    /**
     * Load configuration from files
     */
    async loadConfig() {
        try {
            // Load default config
            await this.loadDefaultConfig();
            
            // Load environment-specific config
            await this.loadEnvironmentConfig();
            
            // Load user config
            await this.loadUserConfig();
            
            // Validate configuration
            this.validateConfig();
            
            return this.config;
        } catch (error) {
            console.error('Failed to load configuration:', error.message);
            throw error;
        }
    }

    /**
     * Load default configuration
     */
    async loadDefaultConfig() {
        const defaultConfig = {
            framework: {
                enableHealing: true,
                enableAI: true,
                healingMode: 'aggressive',
                maxHealingAttempts: 3,
                healingTimeout: 30000
            },
            ai: {
                provider: process.env.AI_PROVIDER || 'openai',
                model: process.env.AI_MODEL || 'gpt-4',
                temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
                maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
                enableLearning: process.env.AI_ENABLE_LEARNING !== 'false',
                learningDataPath: process.env.AI_LEARNING_PATH || './data/learning'
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                enableFileLogging: process.env.LOG_FILE_ENABLED !== 'false',
                logDir: process.env.LOG_DIR || './logs',
                maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
                maxSize: process.env.LOG_MAX_SIZE || '10MB'
            },
            playwright: {
                headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
                slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO) || 0,
                timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT) || 30000,
                viewport: {
                    width: parseInt(process.env.PLAYWRIGHT_VIEWPORT_WIDTH) || 1280,
                    height: parseInt(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT) || 720
                },
                browsers: (process.env.PLAYWRIGHT_BROWSERS || 'chromium').split(',')
            },
            api: {
                baseUrl: process.env.API_BASE_URL || '',
                timeout: parseInt(process.env.API_TIMEOUT) || 30000,
                retries: parseInt(process.env.API_RETRIES) || 3,
                retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000,
                headers: this.parseHeaders(process.env.API_HEADERS)
            },
            healing: {
                strategies: (process.env.HEALING_STRATEGIES || 'locator_healing,wait_healing,element_state_healing,navigation_healing,api_endpoint_healing,api_schema_healing,api_response_healing,data_healing').split(','),
                enablePatternLearning: process.env.HEALING_LEARNING !== 'false',
                patternStoragePath: process.env.HEALING_PATTERNS_PATH || './data/patterns',
                successThreshold: parseFloat(process.env.HEALING_SUCCESS_THRESHOLD) || 0.7
            },
            testData: {
                path: process.env.TEST_DATA_PATH || './test-data',
                format: process.env.TEST_DATA_FORMAT || 'json',
                enableDataHealing: process.env.TEST_DATA_HEALING !== 'false',
                dataValidation: process.env.TEST_DATA_VALIDATION !== 'false'
            }
        };

        this.config = { ...defaultConfig };
    }

    /**
     * Load environment-specific configuration
     */
    async loadEnvironmentConfig() {
        const env = process.env.NODE_ENV || 'development';
        const envConfigPath = path.join(this.options.configPath, `${env}.json`);
        
        if (await fs.pathExists(envConfigPath)) {
            const envConfig = await fs.readJson(envConfigPath);
            this.config = this.mergeConfig(this.config, envConfig);
        }
    }

    /**
     * Load user configuration
     */
    async loadUserConfig() {
        const userConfigPath = path.join(this.options.configPath, 'user.json');
        
        if (await fs.pathExists(userConfigPath)) {
            const userConfig = await fs.readJson(userConfigPath);
            this.config = this.mergeConfig(this.config, userConfig);
        }
    }

    /**
     * Merge configuration objects
     */
    mergeConfig(base, override) {
        const result = { ...base };
        
        for (const key in override) {
            if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
                result[key] = this.mergeConfig(base[key] || {}, override[key]);
            } else {
                result[key] = override[key];
            }
        }
        
        return result;
    }

    /**
     * Validate configuration against schema
     */
    validateConfig() {
        const { error, value } = this.schema.validate(this.config, { allowUnknown: true });
        
        if (error) {
            throw new Error(`Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
        }
        
        this.config = value;
    }

    /**
     * Parse headers from environment variable
     */
    parseHeaders(headersStr) {
        if (!headersStr) return {};
        
        try {
            return JSON.parse(headersStr);
        } catch {
            // Fallback to simple key:value parsing
            const headers = {};
            headersStr.split(',').forEach(header => {
                const [key, value] = header.split(':');
                if (key && value) {
                    headers[key.trim()] = value.trim();
                }
            });
            return headers;
        }
    }

    /**
     * Get configuration value by path
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
    }

    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    update(updates) {
        this.config = this.mergeConfig(this.config, updates);
        this.validateConfig();
    }

    /**
     * Save configuration to file
     */
    async saveConfig(configPath = null) {
        try {
            const savePath = configPath || path.join(this.options.configPath, 'user.json');
            await fs.ensureDir(path.dirname(savePath));
            await fs.writeJson(savePath, this.config, { spaces: 2 });
        } catch (error) {
            console.error('Failed to save configuration:', error.message);
            throw error;
        }
    }

    /**
     * Reset configuration to defaults
     */
    async reset() {
        this.config = {};
        await this.loadDefaultConfig();
        this.validateConfig();
    }

    /**
     * Get configuration summary
     */
    getSummary() {
        return {
            framework: {
                healingEnabled: this.get('framework.enableHealing'),
                aiEnabled: this.get('framework.enableAI'),
                healingMode: this.get('framework.healingMode')
            },
            ai: {
                provider: this.get('ai.provider'),
                model: this.get('ai.model'),
                learningEnabled: this.get('ai.enableLearning')
            },
            logging: {
                level: this.get('logging.level'),
                fileLogging: this.get('logging.enableFileLogging')
            },
            playwright: {
                headless: this.get('playwright.headless'),
                browsers: this.get('playwright.browsers')
            },
            api: {
                baseUrl: this.get('api.baseUrl'),
                timeout: this.get('api.timeout')
            }
        };
    }
}

module.exports = { ConfigManager };
