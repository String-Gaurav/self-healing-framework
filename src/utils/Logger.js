const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

/**
 * Logger Class - Centralized logging for self-healing framework
 * Supports multiple log levels, file output, and structured logging
 */
class Logger {
    constructor(options = {}) {
        this.options = {
            level: process.env.LOG_LEVEL || 'info',
            enableFileLogging: true,
            logDir: './logs',
            maxFiles: 5,
            maxSize: '10MB',
            ...options
        };

        this.logger = this.createLogger();
    }

    /**
     * Create Winston logger instance
     */
    createLogger() {
        const transports = [
            new winston.transports.Console({
                level: this.options.level,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                        return `${timestamp} [${level}]: ${message} ${metaStr}`;
                    })
                )
            })
        ];

        if (this.options.enableFileLogging) {
            this.ensureLogDirectory();
            
            transports.push(
                new winston.transports.File({
                    filename: path.join(this.options.logDir, 'error.log'),
                    level: 'error',
                    maxsize: this.parseSize(this.options.maxSize),
                    maxFiles: this.options.maxFiles,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                }),
                new winston.transports.File({
                    filename: path.join(this.options.logDir, 'combined.log'),
                    maxsize: this.parseSize(this.options.maxSize),
                    maxFiles: this.options.maxFiles,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            );
        }

        return winston.createLogger({
            level: this.options.level,
            transports,
            exitOnError: false
        });
    }

    /**
     * Ensure log directory exists
     */
    async ensureLogDirectory() {
        try {
            await fs.ensureDir(this.options.logDir);
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    /**
     * Parse size string to bytes
     */
    parseSize(sizeStr) {
        const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
        
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return value * units[unit];
        }
        
        return 10 * 1024 * 1024; // Default 10MB
    }

    /**
     * Log info message
     */
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    /**
     * Log warning message
     */
    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    /**
     * Log error message
     */
    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    /**
     * Log debug message
     */
    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    /**
     * Log test execution start
     */
    testStart(testName, testType = 'ui') {
        this.info(`Test started: ${testName}`, {
            testType,
            timestamp: new Date().toISOString(),
            event: 'test_start'
        });
    }

    /**
     * Log test execution end
     */
    testEnd(testName, success, duration, meta = {}) {
        this.info(`Test completed: ${testName}`, {
            success,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            event: 'test_end',
            ...meta
        });
    }

    /**
     * Log healing attempt
     */
    healingAttempt(error, strategy, attempt, meta = {}) {
        this.info(`Healing attempt ${attempt}: ${strategy}`, {
            error: error.message,
            strategy,
            attempt,
            timestamp: new Date().toISOString(),
            event: 'healing_attempt',
            ...meta
        });
    }

    /**
     * Log healing success
     */
    healingSuccess(strategy, duration, meta = {}) {
        this.info(`Healing successful: ${strategy}`, {
            strategy,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            event: 'healing_success',
            ...meta
        });
    }

    /**
     * Log healing failure
     */
    healingFailure(strategy, error, attempts, meta = {}) {
        this.error(`Healing failed: ${strategy}`, {
            strategy,
            error: error.message,
            attempts,
            timestamp: new Date().toISOString(),
            event: 'healing_failure',
            ...meta
        });
    }

    /**
     * Log AI analysis
     */
    aiAnalysis(analysisType, result, meta = {}) {
        this.debug(`AI Analysis: ${analysisType}`, {
            analysisType,
            result,
            timestamp: new Date().toISOString(),
            event: 'ai_analysis',
            ...meta
        });
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration, meta = {}) {
        this.info(`Performance: ${operation}`, {
            operation,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            event: 'performance',
            ...meta
        });
    }

    /**
     * Create child logger with additional context
     */
    child(context) {
        return {
            info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
            warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
            error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
            debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
            testStart: (testName, testType) => this.testStart(testName, testType),
            testEnd: (testName, success, duration, meta = {}) => this.testEnd(testName, success, duration, { ...context, ...meta }),
            healingAttempt: (error, strategy, attempt, meta = {}) => this.healingAttempt(error, strategy, attempt, { ...context, ...meta }),
            healingSuccess: (strategy, duration, meta = {}) => this.healingSuccess(strategy, duration, { ...context, ...meta }),
            healingFailure: (strategy, error, attempts, meta = {}) => this.healingFailure(strategy, error, attempts, { ...context, ...meta }),
            aiAnalysis: (analysisType, result, meta = {}) => this.aiAnalysis(analysisType, result, { ...context, ...meta }),
            performance: (operation, duration, meta = {}) => this.performance(operation, duration, { ...context, ...meta })
        };
    }

    /**
     * Get logger statistics
     */
    getStats() {
        return {
            level: this.options.level,
            transports: this.logger.transports.length,
            logDir: this.options.logDir,
            maxFiles: this.options.maxFiles,
            maxSize: this.options.maxSize
        };
    }
}

module.exports = { Logger };
