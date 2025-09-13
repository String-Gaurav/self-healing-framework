const { Logger } = require('../utils/Logger');
const fs = require('fs-extra');
const path = require('path');

/**
 * Global Teardown for Self-Healing Test Framework
 * Cleans up resources and generates reports
 */
async function globalTeardown(config) {
    const logger = new Logger();
    
    try {
        logger.info('Starting global teardown for self-healing framework');
        
        // Cleanup AI integration
        if (global.selfHealingAI) {
            await global.selfHealingAI.cleanup();
        }
        
        // Cleanup healing engine
        if (global.selfHealingEngine) {
            await global.selfHealingEngine.cleanup();
        }
        
        // Generate healing reports
        await generateHealingReports();
        
        // Generate performance reports
        await generatePerformanceReports();
        
        // Cleanup temporary files
        await cleanupTempFiles();
        
        logger.info('Global teardown completed successfully');
        
    } catch (error) {
        logger.error('Global teardown failed', { error: error.message });
        throw error;
    }
}

/**
 * Generate healing reports
 */
async function generateHealingReports() {
    try {
        if (!global.selfHealingEngine) return;
        
        const stats = global.selfHealingEngine.getStatistics();
        const reportPath = path.join('./test-results', 'healing-report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalAttempts: stats.totalAttempts,
                successfulHealings: stats.successfulHealings,
                successRate: stats.successRate,
                patternsCount: stats.patternsCount
            },
            strategyStats: stats.strategyStats,
            healingHistory: global.selfHealingEngine.healingHistory || []
        };
        
        await fs.writeJson(reportPath, report, { spaces: 2 });
        console.log(`Healing report generated: ${reportPath}`);
        
    } catch (error) {
        console.warn('Failed to generate healing report:', error.message);
    }
}

/**
 * Generate performance reports
 */
async function generatePerformanceReports() {
    try {
        const performanceData = global.selfHealingPerformance || {};
        const reportPath = path.join('./test-results', 'performance-report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            performance: {
                totalTests: performanceData.totalTests || 0,
                totalDuration: performanceData.totalDuration || 0,
                averageTestDuration: performanceData.averageTestDuration || 0,
                healingOverhead: performanceData.healingOverhead || 0
            },
            metrics: performanceData.metrics || {}
        };
        
        await fs.writeJson(reportPath, report, { spaces: 2 });
        console.log(`Performance report generated: ${reportPath}`);
        
    } catch (error) {
        console.warn('Failed to generate performance report:', error.message);
    }
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles() {
    try {
        const tempDirs = [
            './temp',
            './.playwright',
            './test-results/temp'
        ];
        
        for (const dir of tempDirs) {
            if (await fs.pathExists(dir)) {
                await fs.remove(dir);
            }
        }
        
    } catch (error) {
        console.warn('Failed to cleanup temp files:', error.message);
    }
}

module.exports = globalTeardown;
