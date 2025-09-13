const { test, expect, describe, beforeEach, afterEach } = require('@playwright/test');
const { Logger } = require('../../src/utils/Logger');
const fs = require('fs-extra');
const path = require('path');

describe('Logger', () => {
    let logger;
    let logDir;

    beforeEach(() => {
        logDir = path.join(process.cwd(), 'test-logs');
        logger = new Logger({
            level: 'debug',
            enableFileLogging: true,
            logDir: logDir,
            maxFiles: 3,
            maxSize: '1MB'
        });
    });

    afterEach(async () => {
        // Clean up test logs
        if (await fs.pathExists(logDir)) {
            await fs.remove(logDir);
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const defaultLogger = new Logger();
            expect(defaultLogger.options.level).toBe('info');
            expect(defaultLogger.options.enableFileLogging).toBe(true);
            expect(defaultLogger.options.logDir).toBe('./logs');
            expect(defaultLogger.options.maxFiles).toBe(5);
            expect(defaultLogger.options.maxSize).toBe('10MB');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                level: 'error',
                enableFileLogging: false,
                logDir: './custom-logs',
                maxFiles: 10,
                maxSize: '5MB'
            };
            const customLogger = new Logger(customOptions);
            expect(customLogger.options.level).toBe('error');
            expect(customLogger.options.enableFileLogging).toBe(false);
            expect(customLogger.options.logDir).toBe('./custom-logs');
            expect(customLogger.options.maxFiles).toBe(10);
            expect(customLogger.options.maxSize).toBe('5MB');
        });

        test('should create logger instance', () => {
            expect(logger.logger).toBeDefined();
            expect(logger.logger.transports).toHaveLength(3); // Console + 2 file transports
        });
    });

    describe('Logging Methods', () => {
        test('should log info messages', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.info('Test info message');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log warning messages', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            logger.warn('Test warning message');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log error messages', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            logger.error('Test error message');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log debug messages', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.debug('Test debug message');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log with metadata', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const metadata = { userId: 123, action: 'login' };
            logger.info('User action', metadata);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Test-specific Logging', () => {
        test('should log test start', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.testStart('Test Name', 'ui');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log test end', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.testEnd('Test Name', true, 1000, { duration: 1000 });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log healing attempt', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const error = new Error('Test error');
            logger.healingAttempt(error, 'locator_healing', 1, { context: 'test' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log healing success', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.healingSuccess('locator_healing', 500, { strategy: 'locator_healing' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log healing failure', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Healing failed');
            logger.healingFailure('locator_healing', error, 3, { attempts: 3 });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log AI analysis', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.aiAnalysis('test_analysis', { confidence: 85 }, { type: 'pre_test' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should log performance metrics', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            logger.performance('test_execution', 1500, { operation: 'test_execution' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Child Logger', () => {
        test('should create child logger with context', () => {
            const context = { testId: 'test-123', userId: 456 };
            const childLogger = logger.child(context);

            expect(childLogger).toBeDefined();
            expect(typeof childLogger.info).toBe('function');
            expect(typeof childLogger.warn).toBe('function');
            expect(typeof childLogger.error).toBe('function');
            expect(typeof childLogger.debug).toBe('function');
        });

        test('should include context in child logger messages', () => {
            const context = { testId: 'test-123', userId: 456 };
            const childLogger = logger.child(context);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            childLogger.info('Test message');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('File Logging', () => {
        test('should create log directory', async () => {
            expect(await fs.pathExists(logDir)).toBe(true);
        });

        test('should write to log files', async () => {
            logger.info('Test file log message');
            logger.error('Test error log message');

            // Wait for file writes to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const combinedLogPath = path.join(logDir, 'combined.log');
            const errorLogPath = path.join(logDir, 'error.log');

            expect(await fs.pathExists(combinedLogPath)).toBe(true);
            expect(await fs.pathExists(errorLogPath)).toBe(true);

            const combinedContent = await fs.readFile(combinedLogPath, 'utf8');
            const errorContent = await fs.readFile(errorLogPath, 'utf8');

            expect(combinedContent).toContain('Test file log message');
            expect(combinedContent).toContain('Test error log message');
            expect(errorContent).toContain('Test error log message');
            expect(errorContent).not.toContain('Test file log message');
        });
    });

    describe('Size Parsing', () => {
        test('should parse size strings correctly', () => {
            expect(logger.parseSize('1MB')).toBe(1024 * 1024);
            expect(logger.parseSize('5KB')).toBe(5 * 1024);
            expect(logger.parseSize('2GB')).toBe(2 * 1024 * 1024 * 1024);
            expect(logger.parseSize('500B')).toBe(500);
        });

        test('should handle invalid size strings', () => {
            expect(logger.parseSize('invalid')).toBe(10 * 1024 * 1024); // Default 10MB
            expect(logger.parseSize('')).toBe(10 * 1024 * 1024);
            expect(logger.parseSize('5')).toBe(10 * 1024 * 1024);
        });
    });

    describe('Statistics', () => {
        test('should return logger statistics', () => {
            const stats = logger.getStats();
            expect(stats.level).toBe('debug');
            expect(stats.transports).toBe(3);
            expect(stats.logDir).toBe(logDir);
            expect(stats.maxFiles).toBe(3);
            expect(stats.maxSize).toBe('1MB');
        });
    });

    describe('Error Handling', () => {
        test('should handle file logging errors gracefully', async () => {
            // Create a logger with invalid log directory
            const invalidLogger = new Logger({
                enableFileLogging: true,
                logDir: '/invalid/path/that/does/not/exist'
            });

            // Should not throw error
            expect(() => {
                invalidLogger.info('Test message');
            }).not.toThrow();
        });

        test('should handle directory creation errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock fs.ensureDir to throw error
            const originalEnsureDir = fs.ensureDir;
            fs.ensureDir = jest.fn().mockRejectedValue(new Error('Permission denied'));

            const logger = new Logger({
                enableFileLogging: true,
                logDir: '/invalid/path'
            });

            expect(consoleSpy).toHaveBeenCalled();
            
            // Restore original function
            fs.ensureDir = originalEnsureDir;
            consoleSpy.mockRestore();
        });
    });
});
