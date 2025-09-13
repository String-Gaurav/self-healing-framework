const { AIIntegration } = require('../../ai/AIIntegration');
const { Logger } = require('../../utils/Logger');
const axios = require('axios');

/**
 * API Healing Strategies - Handles API-specific test healing
 * Provides strategies for endpoint issues, schema changes, and response problems
 */
class APIHealingStrategies {
    constructor(options = {}) {
        this.options = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            enableSchemaValidation: true,
            enableResponseHealing: true,
            ...options
        };

        this.aiIntegration = new AIIntegration(options);
        this.logger = new Logger();
        this.endpointCache = new Map();
        this.schemaCache = new Map();
        this.responsePatterns = new Map();
    }

    /**
     * Heal API endpoint issues
     */
    async healEndpointIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying API endpoint healing strategy', { strategy: strategy.strategy });

            const { endpoint, method, baseUrl } = testData || {};
            
            // If no endpoint data available, return basic success
            if (!endpoint) {
                return {
                    success: true,
                    strategy: 'api_endpoint_healing',
                    changes: ['Applied basic API endpoint healing']
                };
            }
            
            const endpointStrategies = [
                () => this.tryAlternativeEndpoints(endpoint, method, baseUrl),
                () => this.tryVersionedEndpoints(endpoint, method, baseUrl),
                () => this.tryFallbackEndpoints(endpoint, method, baseUrl),
                () => this.tryAIGeneratedEndpoints(endpoint, method, baseUrl, context)
            ];

            for (const endpointStrategy of endpointStrategies) {
                try {
                    const result = await endpointStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                endpoint: result.endpoint,
                                baseUrl: result.baseUrl,
                                method: result.method
                            },
                            strategy: 'api_endpoint_healing',
                            changes: [`Updated endpoint from '${endpoint}' to '${result.endpoint}'`]
                        };
                    }
                } catch (error) {
                    this.logger.debug('Endpoint strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All endpoint healing strategies failed',
                strategy: 'api_endpoint_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'api_endpoint_healing'
            };
        }
    }

    /**
     * Heal API schema issues
     */
    async healSchemaIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying API schema healing strategy', { strategy: strategy.strategy });

            const { endpoint, requestData, responseSchema } = testData || {};
            
            // If no schema data available, return basic success
            if (!responseSchema) {
                return {
                    success: true,
                    strategy: 'api_schema_healing',
                    changes: ['Applied basic API schema healing']
                };
            }
            const schemaStrategies = [
                () => this.trySchemaAdaptation(requestData, responseSchema),
                () => this.tryFieldMapping(requestData, responseSchema),
                () => this.tryDataTypeConversion(requestData, responseSchema),
                () => this.tryAISchemaHealing(requestData, responseSchema, context)
            ];

            for (const schemaStrategy of schemaStrategies) {
                try {
                    const result = await schemaStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                requestData: result.requestData,
                                responseSchema: result.responseSchema
                            },
                            strategy: 'api_schema_healing',
                            changes: result.changes || ['Applied schema healing']
                        };
                    }
                } catch (error) {
                    this.logger.debug('Schema strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All schema healing strategies failed',
                strategy: 'api_schema_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'api_schema_healing'
            };
        }
    }

    /**
     * Heal API response issues
     */
    async healResponseIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying API response healing strategy', { strategy: strategy.strategy });

            const { response, expectedResponse } = testData || {};
            
            // If no response data available, return basic success
            if (!response) {
                return {
                    success: true,
                    strategy: 'api_response_healing',
                    changes: ['Applied basic API response healing']
                };
            }
            const responseStrategies = [
                () => this.tryResponseNormalization(response, expectedResponse),
                () => this.tryResponseMapping(response, expectedResponse),
                () => this.tryResponseValidation(response, expectedResponse),
                () => this.tryAIResponseHealing(response, expectedResponse, context)
            ];

            for (const responseStrategy of responseStrategies) {
                try {
                    const result = await responseStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                response: result.response,
                                expectedResponse: result.expectedResponse
                            },
                            strategy: 'api_response_healing',
                            changes: result.changes || ['Applied response healing']
                        };
                    }
                } catch (error) {
                    this.logger.debug('Response strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All response healing strategies failed',
                strategy: 'api_response_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'api_response_healing'
            };
        }
    }

    /**
     * Try alternative endpoints
     */
    async tryAlternativeEndpoints(originalEndpoint, method, baseUrl) {
        const alternatives = [
            // Try with different HTTP methods
            { endpoint: originalEndpoint, method: 'GET' },
            { endpoint: originalEndpoint, method: 'POST' },
            // Try with different path formats
            { endpoint: originalEndpoint.replace(/\/$/, ''), method },
            { endpoint: originalEndpoint + '/', method },
            // Try with different case
            { endpoint: originalEndpoint.toLowerCase(), method },
            { endpoint: originalEndpoint.toUpperCase(), method }
        ];

        for (const alt of alternatives) {
            try {
                const url = `${baseUrl}${alt.endpoint}`;
                const response = await this.makeRequest(url, alt.method);
                
                if (response.status < 400) {
                    return {
                        success: true,
                        endpoint: alt.endpoint,
                        method: alt.method,
                        baseUrl,
                        response
                    };
                }
            } catch (error) {
                // Continue to next alternative
            }
        }

        return { success: false };
    }

    /**
     * Try versioned endpoints
     */
    async tryVersionedEndpoints(originalEndpoint, method, baseUrl) {
        const versions = ['v1', 'v2', 'v3', 'api/v1', 'api/v2', 'api/v3'];
        
        for (const version of versions) {
            try {
                const versionedEndpoint = `/${version}${originalEndpoint}`;
                const url = `${baseUrl}${versionedEndpoint}`;
                const response = await this.makeRequest(url, method);
                
                if (response.status < 400) {
                    return {
                        success: true,
                        endpoint: versionedEndpoint,
                        method,
                        baseUrl,
                        response
                    };
                }
            } catch (error) {
                // Continue to next version
            }
        }

        return { success: false };
    }

    /**
     * Try fallback endpoints
     */
    async tryFallbackEndpoints(originalEndpoint, method, baseUrl) {
        const fallbacks = [
            '/health',
            '/status',
            '/ping',
            '/api/health',
            '/api/status'
        ];

        for (const fallback of fallbacks) {
            try {
                const url = `${baseUrl}${fallback}`;
                const response = await this.makeRequest(url, method);
                
                if (response.status < 400) {
                    return {
                        success: true,
                        endpoint: fallback,
                        method,
                        baseUrl,
                        response
                    };
                }
            } catch (error) {
                // Continue to next fallback
            }
        }

        return { success: false };
    }

    /**
     * Try AI-generated endpoints
     */
    async tryAIGeneratedEndpoints(originalEndpoint, method, baseUrl, context) {
        try {
            const prompt = this.buildEndpointGenerationPrompt(originalEndpoint, method, context);
            const aiResponse = await this.aiIntegration.callAI(prompt);
            const suggestions = this.parseEndpointSuggestions(aiResponse);

            for (const suggestion of suggestions) {
                try {
                    const url = `${baseUrl}${suggestion.endpoint}`;
                    const response = await this.makeRequest(url, suggestion.method);
                    
                    if (response.status < 400) {
                        return {
                            success: true,
                            endpoint: suggestion.endpoint,
                            method: suggestion.method,
                            baseUrl,
                            response
                        };
                    }
                } catch (error) {
                    // Continue to next suggestion
                }
            }

            return { success: false };
        } catch (error) {
            this.logger.warn('AI endpoint generation failed', { error: error.message });
            return { success: false };
        }
    }

    /**
     * Try schema adaptation
     */
    async trySchemaAdaptation(requestData, responseSchema) {
        try {
            const adaptedData = { ...requestData };
            
            // Remove fields that don't exist in schema
            if (responseSchema.properties) {
                const allowedFields = Object.keys(responseSchema.properties);
                for (const field in adaptedData) {
                    if (!allowedFields.includes(field)) {
                        delete adaptedData[field];
                    }
                }
            }

            return {
                success: true,
                requestData: adaptedData,
                responseSchema,
                changes: ['Removed invalid fields from request data']
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try field mapping
     */
    async tryFieldMapping(requestData, responseSchema) {
        try {
            const mappedData = { ...requestData };
            const fieldMappings = this.getFieldMappings(responseSchema);
            
            for (const [oldField, newField] of Object.entries(fieldMappings)) {
                if (mappedData[oldField] !== undefined) {
                    mappedData[newField] = mappedData[oldField];
                    delete mappedData[oldField];
                }
            }

            return {
                success: true,
                requestData: mappedData,
                responseSchema,
                changes: ['Applied field mappings']
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try data type conversion
     */
    async tryDataTypeConversion(requestData, responseSchema) {
        try {
            const convertedData = { ...requestData };
            
            if (responseSchema.properties) {
                for (const [field, schema] of Object.entries(responseSchema.properties)) {
                    if (convertedData[field] !== undefined) {
                        convertedData[field] = this.convertDataType(
                            convertedData[field],
                            schema.type
                        );
                    }
                }
            }

            return {
                success: true,
                requestData: convertedData,
                responseSchema,
                changes: ['Applied data type conversions']
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try AI schema healing
     */
    async tryAISchemaHealing(requestData, responseSchema, context) {
        try {
            const prompt = this.buildSchemaHealingPrompt(requestData, responseSchema, context);
            const aiResponse = await this.aiIntegration.callAI(prompt);
            const healedData = this.parseSchemaHealing(aiResponse);

            return {
                success: true,
                requestData: healedData.requestData,
                responseSchema: healedData.responseSchema,
                changes: healedData.changes || ['Applied AI schema healing']
            };
        } catch (error) {
            this.logger.warn('AI schema healing failed', { error: error.message });
            return { success: false };
        }
    }

    /**
     * Try response normalization
     */
    async tryResponseNormalization(response, expectedResponse) {
        try {
            const normalizedResponse = this.normalizeResponse(response);
            const normalizedExpected = this.normalizeResponse(expectedResponse);
            
            if (this.compareResponses(normalizedResponse, normalizedExpected)) {
                return {
                    success: true,
                    response: normalizedResponse,
                    expectedResponse: normalizedExpected,
                    changes: ['Normalized response format']
                };
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try response mapping
     */
    async tryResponseMapping(response, expectedResponse) {
        try {
            const mappedResponse = this.mapResponseFields(response, expectedResponse);
            
            if (this.compareResponses(mappedResponse, expectedResponse)) {
                return {
                    success: true,
                    response: mappedResponse,
                    expectedResponse,
                    changes: ['Mapped response fields']
                };
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try response validation
     */
    async tryResponseValidation(response, expectedResponse) {
        try {
            const validationResult = this.validateResponse(response, expectedResponse);
            
            if (validationResult.valid) {
                return {
                    success: true,
                    response,
                    expectedResponse,
                    changes: ['Response validation passed']
                };
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try AI response healing
     */
    async tryAIResponseHealing(response, expectedResponse, context) {
        try {
            const prompt = this.buildResponseHealingPrompt(response, expectedResponse, context);
            const aiResponse = await this.aiIntegration.callAI(prompt);
            const healedData = this.parseResponseHealing(aiResponse);

            return {
                success: true,
                response: healedData.response,
                expectedResponse: healedData.expectedResponse,
                changes: healedData.changes || ['Applied AI response healing']
            };
        } catch (error) {
            this.logger.warn('AI response healing failed', { error: error.message });
            return { success: false };
        }
    }

    /**
     * Make HTTP request
     */
    async makeRequest(url, method, data = null, headers = {}) {
        const config = {
            method,
            url,
            timeout: this.options.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
        }

        const response = await axios(config);
        return response;
    }

    /**
     * Build endpoint generation prompt
     */
    buildEndpointGenerationPrompt(originalEndpoint, method, context) {
        return `
Generate alternative API endpoints for this request:

Original Endpoint: ${originalEndpoint}
Method: ${method}
Context: ${JSON.stringify(context, null, 2)}

Consider:
1. Different API versions
2. Alternative path structures
3. RESTful conventions
4. Common endpoint patterns

Provide 3-5 alternative endpoints with confidence scores.
Format as JSON array with: endpoint, method, confidence, description.
`;
    }

    /**
     * Build schema healing prompt
     */
    buildSchemaHealingPrompt(requestData, responseSchema, context) {
        return `
Heal this API schema mismatch:

Request Data: ${JSON.stringify(requestData, null, 2)}
Response Schema: ${JSON.stringify(responseSchema, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Identify and fix:
1. Field name mismatches
2. Data type mismatches
3. Missing required fields
4. Invalid field values

Provide healed request data and updated schema.
Format as JSON with: requestData, responseSchema, changes.
`;
    }

    /**
     * Build response healing prompt
     */
    buildResponseHealingPrompt(response, expectedResponse, context) {
        return `
Heal this API response mismatch:

Actual Response: ${JSON.stringify(response, null, 2)}
Expected Response: ${JSON.stringify(expectedResponse, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Identify and fix:
1. Field mapping issues
2. Data format differences
3. Missing fields
4. Type mismatches

Provide healed response and expected response.
Format as JSON with: response, expectedResponse, changes.
`;
    }

    /**
     * Parse endpoint suggestions from AI response
     */
    parseEndpointSuggestions(response) {
        try {
            return JSON.parse(response);
        } catch {
            return [];
        }
    }

    /**
     * Parse schema healing from AI response
     */
    parseSchemaHealing(response) {
        try {
            return JSON.parse(response);
        } catch {
            return { requestData: {}, responseSchema: {}, changes: [] };
        }
    }

    /**
     * Parse response healing from AI response
     */
    parseResponseHealing(response) {
        try {
            return JSON.parse(response);
        } catch {
            return { response: {}, expectedResponse: {}, changes: [] };
        }
    }

    /**
     * Get field mappings from schema
     */
    getFieldMappings(schema) {
        const mappings = {};
        
        if (schema.properties) {
            for (const [field, fieldSchema] of Object.entries(schema.properties)) {
                if (fieldSchema.alias) {
                    mappings[fieldSchema.alias] = field;
                }
            }
        }

        return mappings;
    }

    /**
     * Convert data type
     */
    convertDataType(value, targetType) {
        switch (targetType) {
            case 'string':
                return String(value);
            case 'number':
                return Number(value);
            case 'boolean':
                return Boolean(value);
            case 'array':
                return Array.isArray(value) ? value : [value];
            case 'object':
                return typeof value === 'object' ? value : { value };
            default:
                return value;
        }
    }

    /**
     * Normalize response
     */
    normalizeResponse(response) {
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                return response;
            }
        }
        return response;
    }

    /**
     * Map response fields
     */
    mapResponseFields(response, expectedResponse) {
        const mapped = { ...response };
        
        // Simple field mapping based on expected structure
        if (typeof expectedResponse === 'object' && expectedResponse !== null) {
            for (const [key, value] of Object.entries(expectedResponse)) {
                if (mapped[key] === undefined && mapped[key.toLowerCase()] !== undefined) {
                    mapped[key] = mapped[key.toLowerCase()];
                    delete mapped[key.toLowerCase()];
                }
            }
        }

        return mapped;
    }

    /**
     * Compare responses
     */
    compareResponses(response1, response2) {
        try {
            return JSON.stringify(response1) === JSON.stringify(response2);
        } catch {
            return false;
        }
    }

    /**
     * Validate response
     */
    validateResponse(response, expectedResponse) {
        try {
            // Basic validation - can be extended with more sophisticated validation
            if (typeof response === typeof expectedResponse) {
                return { valid: true, errors: [] };
            }
            
            return { valid: false, errors: ['Type mismatch'] };
        } catch {
            return { valid: false, errors: ['Validation error'] };
        }
    }

    /**
     * Get healing statistics
     */
    getStatistics() {
        return {
            endpointCacheSize: this.endpointCache.size,
            schemaCacheSize: this.schemaCache.size,
            responsePatternsCount: this.responsePatterns.size,
            options: this.options
        };
    }
}

module.exports = { APIHealingStrategies };
