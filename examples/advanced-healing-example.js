const { test, expect } = require('@playwright/test');
const { BaseFramework } = require('../src/core/BaseFramework');

/**
 * Advanced Self-Healing Example
 * Demonstrates complex healing scenarios and custom strategies
 */

// Custom healing configuration
const advancedConfig = {
    enableHealing: true,
    enableAI: true,
    aiProvider: 'openai',
    healingMode: 'learning', // Use learning mode for better adaptation
    maxHealingAttempts: 5,
    healingTimeout: 45000,
    customStrategies: [
        'dynamic_wait',
        'element_redesign',
        'api_versioning',
        'data_transformation'
    ]
};

// Initialize framework with advanced configuration
const framework = new BaseFramework(advancedConfig);

test.beforeAll(async () => {
    await framework.initialize();
});

test.afterAll(async () => {
    await framework.cleanup();
});

test('Complex form with dynamic fields - self-healing', async ({ page }) => {
    const testData = {
        page,
        form: {
            container: '#dynamic-form',
            fields: {
                // These selectors might change based on user role or form state
                name: ['#name', '#full-name', '#user-name'],
                email: ['#email', '#email-address', '#user-email'],
                phone: ['#phone', '#phone-number', '#mobile'],
                address: ['#address', '#street-address', '#location']
            },
            submit: ['#submit', '#submit-form', '#save', 'button[type="submit"]']
        },
        data: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            address: '123 Main St'
        }
    };

    const testFunction = async (data) => {
        const { page, form, data: formData } = data;
        
        await page.goto('https://example.com/dynamic-form');
        
        // Wait for form to load
        await page.waitForSelector(form.container);
        
        // Fill form fields with fallback selectors
        for (const [fieldName, selectors] of Object.entries(form.fields)) {
            let filled = false;
            for (const selector of selectors) {
                try {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                        await element.fill(formData[fieldName]);
                        filled = true;
                        break;
                    }
                } catch (error) {
                    // Try next selector
                }
            }
            if (!filled) {
                throw new Error(`Could not find field: ${fieldName}`);
            }
        }
        
        // Submit form with fallback selectors
        let submitted = false;
        for (const selector of form.submit) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.click();
                    submitted = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        if (!submitted) {
            throw new Error('Could not find submit button');
        }
        
        // Verify success
        await expect(page.locator('#success-message')).toBeVisible();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Multi-step wizard with self-healing', async ({ page }) => {
    const testData = {
        page,
        wizard: {
            steps: [
                {
                    name: 'personal',
                    selectors: ['#step-1', '.wizard-step-1', '[data-step="personal"]'],
                    fields: {
                        name: ['#name', '#first-name'],
                        email: ['#email', '#email-address']
                    }
                },
                {
                    name: 'address',
                    selectors: ['#step-2', '.wizard-step-2', '[data-step="address"]'],
                    fields: {
                        street: ['#street', '#address-line-1'],
                        city: ['#city', '#city-name'],
                        zip: ['#zip', '#postal-code']
                    }
                },
                {
                    name: 'payment',
                    selectors: ['#step-3', '.wizard-step-3', '[data-step="payment"]'],
                    fields: {
                        card: ['#card-number', '#credit-card'],
                        expiry: ['#expiry', '#expiration-date'],
                        cvv: ['#cvv', '#security-code']
                    }
                }
            ],
            navigation: {
                next: ['#next', '.btn-next', 'button[data-action="next"]'],
                prev: ['#prev', '.btn-prev', 'button[data-action="prev"]'],
                submit: ['#submit', '.btn-submit', 'button[type="submit"]']
            }
        },
        data: {
            personal: { name: 'John Doe', email: 'john@example.com' },
            address: { street: '123 Main St', city: 'Anytown', zip: '12345' },
            payment: { card: '4111111111111111', expiry: '12/25', cvv: '123' }
        }
    };

    const testFunction = async (data) => {
        const { page, wizard, data: wizardData } = data;
        
        await page.goto('https://example.com/wizard');
        
        // Process each step
        for (let i = 0; i < wizard.steps.length; i++) {
            const step = wizard.steps[i];
            const stepData = wizardData[step.name];
            
            // Wait for step to be visible
            let stepVisible = false;
            for (const selector of step.selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    stepVisible = true;
                    break;
                } catch (error) {
                    // Try next selector
                }
            }
            if (!stepVisible) {
                throw new Error(`Could not find step: ${step.name}`);
            }
            
            // Fill step fields
            for (const [fieldName, selectors] of Object.entries(step.fields)) {
                let filled = false;
                for (const selector of selectors) {
                    try {
                        const element = page.locator(selector);
                        if (await element.isVisible()) {
                            await element.fill(stepData[fieldName]);
                            filled = true;
                            break;
                        }
                    } catch (error) {
                        // Try next selector
                    }
                }
                if (!filled) {
                    throw new Error(`Could not find field: ${fieldName} in step: ${step.name}`);
                }
            }
            
            // Navigate to next step (except for last step)
            if (i < wizard.steps.length - 1) {
                let navigated = false;
                for (const selector of wizard.navigation.next) {
                    try {
                        const element = page.locator(selector);
                        if (await element.isVisible()) {
                            await element.click();
                            navigated = true;
                            break;
                        }
                    } catch (error) {
                        // Try next selector
                    }
                }
                if (!navigated) {
                    throw new Error(`Could not navigate from step: ${step.name}`);
                }
            }
        }
        
        // Submit wizard
        let submitted = false;
        for (const selector of wizard.navigation.submit) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.click();
                    submitted = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        if (!submitted) {
            throw new Error('Could not submit wizard');
        }
        
        // Verify completion
        await expect(page.locator('#wizard-complete')).toBeVisible();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API with versioning and fallback - self-healing', async ({ request }) => {
    const testData = {
        api: {
            baseUrl: 'https://api.example.com',
            versions: ['v3', 'v2', 'v1'],
            endpoints: {
                users: '/users',
                posts: '/posts',
                comments: '/comments'
            },
            fallbackEndpoints: {
                users: '/user',
                posts: '/post',
                comments: '/comment'
            }
        },
        data: {
            endpoint: 'users',
            method: 'GET',
            expectedResponse: {
                id: expect.any(Number),
                name: expect.any(String),
                email: expect.any(String)
            }
        }
    };

    const testFunction = async (data) => {
        const { api, data: requestData } = data;
        const { endpoint, method, expectedResponse } = requestData;
        
        let response;
        let lastError;
        
        // Try different API versions
        for (const version of api.versions) {
            try {
                const url = `${api.baseUrl}/${version}${api.endpoints[endpoint]}`;
                response = await request.get(url);
                
                if (response.status() === 200) {
                    const data = await response.json();
                    expect(data).toMatchObject(expectedResponse);
                    return { success: true, data, version };
                }
            } catch (error) {
                lastError = error;
                // Try next version
            }
        }
        
        // Try fallback endpoints
        for (const version of api.versions) {
            try {
                const url = `${api.baseUrl}/${version}${api.fallbackEndpoints[endpoint]}`;
                response = await request.get(url);
                
                if (response.status() === 200) {
                    const data = await response.json();
                    expect(data).toMatchObject(expectedResponse);
                    return { success: true, data, version, fallback: true };
                }
            } catch (error) {
                lastError = error;
                // Try next version
            }
        }
        
        throw new Error(`API request failed: ${lastError?.message}`);
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Dynamic content loading with self-healing', async ({ page }) => {
    const testData = {
        page,
        content: {
            container: ['#content', '.main-content', '[data-content="main"]'],
            loader: ['#loader', '.loading', '.spinner'],
            items: ['.item', '.content-item', '[data-item]'],
            pagination: {
                next: ['#next-page', '.pagination-next', 'button[data-action="next"]'],
                prev: ['#prev-page', '.pagination-prev', 'button[data-action="prev"]'],
                pages: ['.page-number', '.pagination-item', '[data-page]']
            }
        },
        expectedItems: 5
    };

    const testFunction = async (data) => {
        const { page, content, expectedItems } = data;
        
        await page.goto('https://example.com/dynamic-content');
        
        // Wait for content container
        let containerVisible = false;
        for (const selector of content.container) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                containerVisible = true;
                break;
            } catch (error) {
                // Try next selector
            }
        }
        if (!containerVisible) {
            throw new Error('Could not find content container');
        }
        
        // Wait for loader to disappear
        for (const selector of content.loader) {
            try {
                await page.waitForSelector(selector, { state: 'hidden', timeout: 15000 });
            } catch (error) {
                // Loader might not exist or already hidden
            }
        }
        
        // Wait for items to load
        let itemsLoaded = false;
        for (const selector of content.items) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                const items = await page.locator(selector).count();
                if (items >= expectedItems) {
                    itemsLoaded = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        if (!itemsLoaded) {
            throw new Error('Items did not load properly');
        }
        
        // Test pagination
        let paginationWorked = false;
        for (const selector of content.pagination.next) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.click();
                    paginationWorked = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        
        // Verify content is still visible after pagination
        if (paginationWorked) {
            await page.waitForTimeout(2000); // Wait for new content to load
            let contentStillVisible = false;
            for (const selector of content.items) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        contentStillVisible = true;
                        break;
                    }
                } catch (error) {
                    // Try next selector
                }
            }
            if (!contentStillVisible) {
                throw new Error('Content disappeared after pagination');
            }
        }
        
        return { success: true, paginationWorked };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Cross-browser compatibility with self-healing', async ({ page, browserName }) => {
    const testData = {
        page,
        browserName,
        selectors: {
            // Different selectors for different browsers
            button: {
                chromium: ['#button', '.btn', 'button[type="button"]'],
                firefox: ['#button', '.button', 'input[type="button"]'],
                webkit: ['#button', '.btn-primary', 'button']
            },
            input: {
                chromium: ['#input', 'input[type="text"]', '.form-input'],
                firefox: ['#input', 'input', '.input-field'],
                webkit: ['#input', 'input[type="text"]', '.text-input']
            }
        },
        data: {
            text: 'Test input'
        }
    };

    const testFunction = async (data) => {
        const { page, browserName, selectors, data: inputData } = data;
        
        await page.goto('https://example.com/cross-browser-test');
        
        // Use browser-specific selectors
        const browserSelectors = selectors.input[browserName] || selectors.input.chromium;
        
        let inputFilled = false;
        for (const selector of browserSelectors) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.fill(inputData.text);
                    inputFilled = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        if (!inputFilled) {
            throw new Error(`Could not find input for browser: ${browserName}`);
        }
        
        // Use browser-specific button selectors
        const buttonSelectors = selectors.button[browserName] || selectors.button.chromium;
        
        let buttonClicked = false;
        for (const selector of buttonSelectors) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.click();
                    buttonClicked = true;
                    break;
                }
            } catch (error) {
                // Try next selector
            }
        }
        if (!buttonClicked) {
            throw new Error(`Could not find button for browser: ${browserName}`);
        }
        
        // Verify result
        await expect(page.locator('#result')).toBeVisible();
        
        return { success: true, browserName };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Performance monitoring with self-healing', async ({ page }) => {
    const testData = {
        page,
        performance: {
            maxLoadTime: 5000,
            maxInteractionTime: 2000,
            maxResponseTime: 3000
        },
        actions: [
            { type: 'navigate', url: 'https://example.com' },
            { type: 'click', selector: '#button' },
            { type: 'fill', selector: '#input', value: 'test' },
            { type: 'wait', selector: '#result' }
        ]
    };

    const testFunction = async (data) => {
        const { page, performance, actions } = data;
        
        const startTime = Date.now();
        
        for (const action of actions) {
            const actionStartTime = Date.now();
            
            switch (action.type) {
                case 'navigate':
                    await page.goto(action.url);
                    break;
                case 'click':
                    await page.click(action.selector);
                    break;
                case 'fill':
                    await page.fill(action.selector, action.value);
                    break;
                case 'wait':
                    await page.waitForSelector(action.selector);
                    break;
            }
            
            const actionEndTime = Date.now();
            const actionDuration = actionEndTime - actionStartTime;
            
            // Check performance thresholds
            if (action.type === 'navigate' && actionDuration > performance.maxLoadTime) {
                throw new Error(`Page load too slow: ${actionDuration}ms`);
            }
            if (action.type === 'click' && actionDuration > performance.maxInteractionTime) {
                throw new Error(`Click too slow: ${actionDuration}ms`);
            }
        }
        
        const totalTime = Date.now() - startTime;
        
        if (totalTime > performance.maxResponseTime) {
            throw new Error(`Total test time too slow: ${totalTime}ms`);
        }
        
        return { success: true, totalTime, performance: { totalTime } };
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
    expect(result.totalTime).toBeLessThan(5000);
});
