const { test, expect } = require('@playwright/test');
const { BaseFramework } = require('../src/core/BaseFramework');

/**
 * Example API Test with Self-Healing
 * Demonstrates how to write API tests that automatically heal themselves
 */

// Initialize the self-healing framework
const framework = new BaseFramework({
    enableHealing: true,
    enableAI: true,
    healingMode: 'aggressive',
    maxHealingAttempts: 3
});

test.beforeAll(async () => {
    await framework.initialize();
});

test.afterAll(async () => {
    await framework.cleanup();
});

test('User API with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedResponse: {
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            username: expect.any(String)
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, expectedResponse } = data;
        
        // Make API request
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response data structure
        const users = await response.json();
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
        
        // Verify first user structure
        const firstUser = users[0];
        expect(firstUser).toMatchObject(expectedResponse);
        
        return { success: true, data: users };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Create user with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users',
        method: 'POST',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        requestData: {
            name: 'John Doe',
            email: 'john@example.com',
            username: 'johndoe'
        },
        expectedResponse: {
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            username: expect.any(String)
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, requestData, expectedResponse } = data;
        
        // Make API request
        const response = await request.post(`${baseUrl}${endpoint}`, {
            data: requestData
        });
        
        // Verify response status
        expect(response.status()).toBe(201);
        
        // Verify response data
        const user = await response.json();
        expect(user).toMatchObject(expectedResponse);
        expect(user.name).toBe(requestData.name);
        expect(user.email).toBe(requestData.email);
        expect(user.username).toBe(requestData.username);
        
        return { success: true, data: user };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Update user with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users/1',
        method: 'PUT',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        requestData: {
            id: 1,
            name: 'Jane Doe',
            email: 'jane@example.com',
            username: 'janedoe'
        },
        expectedResponse: {
            id: 1,
            name: expect.any(String),
            email: expect.any(String),
            username: expect.any(String)
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, requestData, expectedResponse } = data;
        
        // Make API request
        const response = await request.put(`${baseUrl}${endpoint}`, {
            data: requestData
        });
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response data
        const user = await response.json();
        expect(user).toMatchObject(expectedResponse);
        expect(user.id).toBe(requestData.id);
        
        return { success: true, data: user };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Delete user with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users/1',
        method: 'DELETE',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedStatus: 200
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, expectedStatus } = data;
        
        // Make API request
        const response = await request.delete(`${baseUrl}${endpoint}`);
        
        // Verify response status
        expect(response.status()).toBe(expectedStatus);
        
        return { success: true, status: response.status() };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Posts API with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/posts',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedResponse: {
            id: expect.any(Number),
            title: expect.any(String),
            body: expect.any(String),
            userId: expect.any(Number)
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, expectedResponse } = data;
        
        // Make API request
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response data structure
        const posts = await response.json();
        expect(Array.isArray(posts)).toBe(true);
        expect(posts.length).toBeGreaterThan(0);
        
        // Verify first post structure
        const firstPost = posts[0];
        expect(firstPost).toMatchObject(expectedResponse);
        
        return { success: true, data: posts };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Comments API with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/comments',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedResponse: {
            id: expect.any(Number),
            postId: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            body: expect.any(String)
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, expectedResponse } = data;
        
        // Make API request
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response data structure
        const comments = await response.json();
        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBeGreaterThan(0);
        
        // Verify first comment structure
        const firstComment = comments[0];
        expect(firstComment).toMatchObject(expectedResponse);
        
        return { success: true, data: comments };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API error handling with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/nonexistent',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        expectedStatus: 404
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, expectedStatus } = data;
        
        // Make API request that should fail
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        // Verify error status
        expect(response.status()).toBe(expectedStatus);
        
        return { success: true, status: response.status() };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API authentication with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/protected',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        headers: {
            'Authorization': 'Bearer fake-token',
            'Content-Type': 'application/json'
        },
        expectedStatus: 401
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, headers, expectedStatus } = data;
        
        // Make authenticated API request
        const response = await request.get(`${baseUrl}${endpoint}`, {
            headers
        });
        
        // Verify authentication error
        expect(response.status()).toBe(expectedStatus);
        
        return { success: true, status: response.status() };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API rate limiting with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        retries: 3,
        retryDelay: 1000
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, retries, retryDelay } = data;
        
        let lastResponse;
        let attempts = 0;
        
        // Retry logic for rate limiting
        while (attempts < retries) {
            try {
                const response = await request.get(`${baseUrl}${endpoint}`);
                
                if (response.status() === 200) {
                    return { success: true, data: await response.json() };
                }
                
                lastResponse = response;
                attempts++;
                
                if (attempts < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } catch (error) {
                attempts++;
                if (attempts >= retries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        throw new Error(`API request failed after ${retries} attempts. Last status: ${lastResponse?.status()}`);
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API schema validation with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users/1',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' }
            },
            required: ['id', 'name', 'email', 'username']
        }
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, schema } = data;
        
        // Make API request
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response data
        const user = await response.json();
        
        // Basic schema validation
        expect(typeof user.id).toBe('number');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.username).toBe('string');
        
        // Verify required fields exist
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.username).toBeDefined();
        
        return { success: true, data: user };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API performance with self-healing', async ({ request }) => {
    const testData = {
        endpoint: '/users',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com',
        maxResponseTime: 5000
    };

    const testFunction = async (data) => {
        const { endpoint, method, baseUrl, maxResponseTime } = data;
        
        const startTime = Date.now();
        
        // Make API request
        const response = await request.get(`${baseUrl}${endpoint}`);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Verify response status
        expect(response.status()).toBe(200);
        
        // Verify response time
        expect(responseTime).toBeLessThan(maxResponseTime);
        
        return { 
            success: true, 
            responseTime,
            data: await response.json()
        };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
    expect(result.responseTime).toBeLessThan(5000);
});
