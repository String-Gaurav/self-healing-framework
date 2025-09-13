const OpenAI = require('openai').default;
const Anthropic = require('@anthropic-ai/sdk');
const natural = require('natural');
const { v4: uuidv4 } = require('uuid');

/**
 * AI Integration Class - Handles all AI/LLM interactions for self-healing
 * Supports multiple AI providers and intelligent test analysis
 */
class AIIntegration {
    constructor(options = {}) {
        this.options = {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.1,
            maxTokens: 2000,
            enableLearning: true,
            learningDataPath: './data/learning',
            ...options
        };

        this.clients = {};
        this.learningData = [];
        this.patterns = new Map();
        this.initializeClients();
    }

    /**
     * Initialize AI clients based on provider
     */
    initializeClients() {
        if (this.options.provider === 'openai' || this.options.provider === 'anthropic') {
            try {
                if (this.options.provider === 'openai') {
                    const apiKey = process.env.OPENAI_API_KEY || this.options.apiKey;
                    if (!apiKey) {
                        throw new Error('OPENAI_API_KEY environment variable is missing or empty');
                    }
                    this.clients.openai = new OpenAI({
                        apiKey: apiKey
                    });
                } else if (this.options.provider === 'anthropic') {
                    const apiKey = process.env.ANTHROPIC_API_KEY || this.options.apiKey;
                    if (!apiKey) {
                        throw new Error('ANTHROPIC_API_KEY environment variable is missing or empty');
                    }
                    this.clients.anthropic = new Anthropic({
                        apiKey: apiKey
                    });
                }
            } catch (error) {
                console.warn(`Failed to initialize ${this.options.provider} client:`, error.message);
            }
        }
    }

    /**
     * Initialize AI integration
     */
    async initialize() {
        if (this.options.enableLearning) {
            await this.loadLearningData();
        }
    }

    /**
     * Analyze test for potential issues using AI
     */
    async analyzeTest(testFunction, testData) {
        const analysisId = uuidv4();
        
        try {
            const prompt = this.buildTestAnalysisPrompt(testFunction, testData);
            const response = await this.callAI(prompt);
            
            const analysis = {
                id: analysisId,
                timestamp: Date.now(),
                testFunction: testFunction.toString(),
                testData,
                potentialIssues: this.parseAIResponse(response, 'issues'),
                recommendations: this.parseAIResponse(response, 'recommendations'),
                confidence: this.parseAIResponse(response, 'confidence'),
                riskLevel: this.assessRiskLevel(response)
            };

            return analysis;
        } catch (error) {
            console.error('Test analysis failed:', error);
            return {
                id: analysisId,
                timestamp: Date.now(),
                potentialIssues: [],
                recommendations: [],
                confidence: 0,
                riskLevel: 'unknown'
            };
        }
    }

    /**
     * Generate healing strategies using AI
     */
    async generateHealingStrategies(error, context) {
        const prompt = this.buildHealingPrompt(error, context);
        
        try {
            const response = await this.callAI(prompt);
            
            const strategies = this.parseHealingStrategies(response);
            
            // Rank strategies by likelihood of success
            return this.rankStrategies(strategies, context);
        } catch (error) {
            console.error('Healing strategy generation failed:', error);
            return [];
        }
    }

    /**
     * Heal test data using AI
     */
    async healTestData(testData, error) {
        const prompt = `
Test data failed with error: ${error.message}

Current test data: ${JSON.stringify(testData, null, 2)}

Generate corrected test data that should work. Return only valid JSON.
`;
        
        try {
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Test data healing failed:', error);
            return testData; // Return original data if healing fails
        }
    }

    /**
     * Learn from test execution results
     */
    async learnFromTest(result, testContext) {
        if (!this.options.enableLearning) return;

        const learningEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            testContext,
            result,
            patterns: this.extractPatterns(result),
            success: result.success || false
        };

        this.learningData.push(learningEntry);
        
        // Update pattern recognition
        await this.updatePatterns(learningEntry);
        
        // Save learning data periodically
        if (this.learningData.length % 10 === 0) {
            await this.saveLearningData();
        }
    }

    /**
     * Generate alternative locators using AI
     */
    async generateAlternativeLocators(elementDescription, pageSource, currentLocator) {
        const prompt = this.buildLocatorGenerationPrompt(elementDescription, pageSource, currentLocator);
        
        try {
            const response = await this.callAI(prompt);
            return this.parseLocators(response);
        } catch (error) {
            console.error('Locator generation failed:', error);
            return [];
        }
    }

    /**
     * Analyze API schema changes
     */
    async analyzeAPISchemaChanges(oldSchema, newSchema, testEndpoint) {
        const prompt = this.buildSchemaAnalysisPrompt(oldSchema, newSchema, testEndpoint);
        
        try {
            const response = await this.callAI(prompt);
            return this.parseSchemaChanges(response);
        } catch (error) {
            console.error('Schema analysis failed:', error);
            return { changes: [], impact: 'unknown' };
        }
    }

    /**
     * Call AI provider with appropriate method
     */
    async callAI(prompt) {
        if (this.options.provider === 'openai') {
            if (!this.clients.openai) {
                throw new Error('OpenAI client not initialized. Check your API key.');
            }
            const completion = await this.clients.openai.chat.completions.create({
                model: this.options.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert test automation engineer specializing in self-healing test frameworks. Provide precise, actionable responses.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.options.temperature,
                max_tokens: this.options.maxTokens
            });
            
            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }
            return content;
        } else if (this.options.provider === 'anthropic') {
            if (!this.clients.anthropic) {
                throw new Error('Anthropic client not initialized. Check your API key.');
            }
            const completion = await this.clients.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: this.options.maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            
            const content = completion.content?.[0]?.text;
            if (!content) {
                throw new Error('No content received from Anthropic');
            }
            return content;
        } else {
            throw new Error(`AI provider ${this.options.provider} not available`);
        }
    }

    /**
     * Build test analysis prompt
     */
    buildTestAnalysisPrompt(testFunction, testData) {
        return `
Analyze this test function for potential issues and provide recommendations:

Test Function:
${testFunction.toString()}

Test Data:
${JSON.stringify(testData, null, 2)}

Please provide:
1. Potential issues (array of strings)
2. Recommendations (array of strings)
3. Confidence level (0-100)
4. Risk assessment (low/medium/high)

Format your response as JSON with these exact keys: potentialIssues, recommendations, confidence, riskLevel.
`;
    }

    /**
     * Build healing strategy prompt
     */
    buildHealingPrompt(error, context) {
        return `
A test failed with this error: ${error.message}

Context:
- Test Type: ${context.testType || 'unknown'}
- Page URL: ${context.pageUrl || 'unknown'}
- Element: ${context.element || 'unknown'}
- Error Stack: ${error.stack || 'not available'}

Generate healing strategies to fix this test. Consider:
1. Locator alternatives
2. Wait strategies
3. Element state checks
4. Page navigation
5. Data adjustments

IMPORTANT: Return ONLY a valid JSON array with this exact format:
[
  {
    "strategy": "locator_healing",
    "description": "Try alternative CSS selectors",
    "implementation": "return { success: true, locator: '#alternative-selector' };",
    "confidence": 80
  },
  {
    "strategy": "wait_healing", 
    "description": "Add explicit wait for element",
    "implementation": "await page.waitForTimeout(2000); return { success: true };",
    "confidence": 70
  }
]

Do not include any text before or after the JSON array.
`;
    }

    /**
     * Build locator generation prompt
     */
    buildLocatorGenerationPrompt(elementDescription, pageSource, currentLocator) {
        return `
Generate alternative locators for this element:

Element Description: ${elementDescription}
Current Locator: ${currentLocator}
Page Source (first 2000 chars): ${pageSource.substring(0, 2000)}

Provide multiple locator strategies:
1. CSS selectors
2. XPath expressions
3. Text-based selectors
4. Attribute-based selectors

Format as JSON array with: type, selector, confidence, description.
`;
    }

    /**
     * Build schema analysis prompt
     */
    buildSchemaAnalysisPrompt(oldSchema, newSchema, testEndpoint) {
        return `
Analyze API schema changes and their impact on testing:

Endpoint: ${testEndpoint}
Old Schema: ${JSON.stringify(oldSchema, null, 2)}
New Schema: ${JSON.stringify(newSchema, null, 2)}

Identify:
1. Breaking changes
2. New fields
3. Removed fields
4. Modified fields
5. Impact on existing tests

Format as JSON with: changes, impact, recommendations.
`;
    }

    /**
     * Parse AI response for specific field
     */
    parseAIResponse(response, field) {
        try {
            const parsed = JSON.parse(response);
            return parsed[field] || [];
        } catch {
            return [];
        }
    }

    /**
     * Parse healing strategies from AI response
     */
    parseHealingStrategies(response) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        } catch {
            // If JSON parsing fails, try to extract strategies from text
            const strategies = [];
            
            // Look for strategy patterns in the response
            const strategyPatterns = [
                /locator.*healing/i,
                /wait.*strategy/i,
                /element.*state/i,
                /navigation.*healing/i,
                /data.*adjustment/i
            ];
            
            for (const pattern of strategyPatterns) {
                if (pattern.test(response)) {
                    strategies.push({
                        strategy: this.extractStrategyName(response, pattern),
                        description: this.extractDescription(response, pattern),
                        implementation: this.generateBasicImplementation(pattern),
                        confidence: 70
                    });
                }
            }
            
            // If no patterns found, return basic strategies
            if (strategies.length === 0) {
                return [
                    {
                        strategy: 'locator_healing',
                        description: 'Try alternative locators',
                        implementation: 'return { success: true, locator: "#alternative-selector" };',
                        confidence: 60
                    },
                    {
                        strategy: 'wait_healing',
                        description: 'Add explicit wait',
                        implementation: 'await page.waitForTimeout(2000); return { success: true };',
                        confidence: 60
                    }
                ];
            }
            
            return strategies;
        }
    }
    
    /**
     * Extract strategy name from response
     */
    extractStrategyName(response, pattern) {
        if (pattern.test('locator')) return 'locator_healing';
        if (pattern.test('wait')) return 'wait_healing';
        if (pattern.test('element')) return 'element_state_healing';
        if (pattern.test('navigation')) return 'navigation_healing';
        if (pattern.test('data')) return 'data_healing';
        return 'generic_healing';
    }
    
    /**
     * Extract description from response
     */
    extractDescription(response, pattern) {
        const lines = response.split('\n');
        for (const line of lines) {
            if (pattern.test(line)) {
                return line.trim();
            }
        }
        return 'AI-generated healing strategy';
    }
    
    /**
     * Generate basic implementation for strategy
     */
    generateBasicImplementation(pattern) {
        if (pattern.test('locator')) {
            return 'return { success: true, locator: "#alternative-selector" };';
        }
        if (pattern.test('wait')) {
            return 'await page.waitForTimeout(2000); return { success: true };';
        }
        if (pattern.test('element')) {
            return 'await element.scrollIntoViewIfNeeded(); return { success: true };';
        }
        if (pattern.test('navigation')) {
            return 'await page.reload(); return { success: true };';
        }
        if (pattern.test('data')) {
            return 'return { success: true, healedData: testData };';
        }
        return 'return { success: true };';
    }

    /**
     * Parse locators from AI response
     */
    parseLocators(response) {
        try {
            if (!response) {
                console.warn('No response received from AI for locator generation');
                return [];
            }
            
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        } catch (error) {
            console.warn('Failed to parse AI response for locators:', error.message);
            return [];
        }
    }

    /**
     * Parse schema changes from AI response
     */
    parseSchemaChanges(response) {
        try {
            return JSON.parse(response);
        } catch {
            return { changes: [], impact: 'unknown' };
        }
    }

    /**
     * Assess risk level from AI response
     */
    assessRiskLevel(response) {
        const riskKeywords = {
            high: ['critical', 'breaking', 'failure', 'error'],
            medium: ['warning', 'caution', 'potential'],
            low: ['minor', 'safe', 'stable']
        };

        const lowerResponse = response.toLowerCase();
        
        for (const [level, keywords] of Object.entries(riskKeywords)) {
            if (keywords.some(keyword => lowerResponse.includes(keyword))) {
                return level;
            }
        }
        
        return 'unknown';
    }

    /**
     * Rank healing strategies by likelihood of success
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
     * Calculate strategy score based on context and history
     */
    calculateStrategyScore(strategy, context) {
        let score = strategy.confidence || 50;
        
        // Boost score based on historical success
        const historicalSuccess = this.getHistoricalSuccessRate(strategy.strategy);
        score += historicalSuccess * 20;
        
        // Adjust based on context similarity
        const contextSimilarity = this.calculateContextSimilarity(context);
        score += contextSimilarity * 10;
        
        return Math.min(100, score);
    }

    /**
     * Get historical success rate for strategy
     */
    getHistoricalSuccessRate(strategyType) {
        const relevantEntries = this.learningData.filter(entry => 
            entry.patterns?.includes(strategyType)
        );
        
        if (relevantEntries.length === 0) return 0.5;
        
        const successfulEntries = relevantEntries.filter(entry => entry.success);
        return successfulEntries.length / relevantEntries.length;
    }

    /**
     * Calculate context similarity
     */
    calculateContextSimilarity(currentContext) {
        // Simple similarity calculation based on test type and page URL
        const similarEntries = this.learningData.filter(entry => 
            entry.testContext?.testType === currentContext.testType &&
            entry.testContext?.pageUrl === currentContext.pageUrl
        );
        
        return similarEntries.length > 0 ? 0.8 : 0.3;
    }

    /**
     * Extract patterns from test result
     */
    extractPatterns(result) {
        const patterns = [];
        
        if (result.healingAttempts) {
            patterns.push(...result.healingAttempts.map(attempt => attempt.strategy));
        }
        
        if (result.error) {
            const errorType = this.classifyError(result.error);
            patterns.push(`error_${errorType}`);
        }
        
        return patterns;
    }

    /**
     * Classify error type
     */
    classifyError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('element not found')) return 'element_not_found';
        if (errorMessage.includes('timeout')) return 'timeout';
        if (errorMessage.includes('network')) return 'network';
        if (errorMessage.includes('assertion')) return 'assertion';
        
        return 'unknown';
    }

    /**
     * Update patterns based on learning data
     */
    async updatePatterns(learningEntry) {
        const patterns = learningEntry.patterns || [];
        
        for (const pattern of patterns) {
            if (!this.patterns.has(pattern)) {
                this.patterns.set(pattern, { count: 0, successes: 0 });
            }
            
            const patternData = this.patterns.get(pattern);
            patternData.count++;
            
            if (learningEntry.success) {
                patternData.successes++;
            }
        }
    }

    /**
     * Load learning data from storage
     */
    async loadLearningData() {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            
            const dataPath = path.join(this.options.learningDataPath, 'learning.json');
            
            if (await fs.pathExists(dataPath)) {
                const data = await fs.readJson(dataPath);
                this.learningData = data.learningData || [];
                this.patterns = new Map(data.patterns || []);
            }
        } catch (error) {
            console.warn('Failed to load learning data:', error.message);
        }
    }

    /**
     * Save learning data to storage
     */
    async saveLearningData() {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            
            await fs.ensureDir(this.options.learningDataPath);
            
            const dataPath = path.join(this.options.learningDataPath, 'learning.json');
            const data = {
                learningData: this.learningData,
                patterns: Array.from(this.patterns.entries()),
                lastUpdated: Date.now()
            };
            
            await fs.writeJson(dataPath, data, { spaces: 2 });
        } catch (error) {
            console.error('Failed to save learning data:', error.message);
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.options.enableLearning && this.learningData.length > 0) {
            await this.saveLearningData();
        }
    }
}

module.exports = { AIIntegration };
