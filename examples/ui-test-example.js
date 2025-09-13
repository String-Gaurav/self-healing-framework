const { test, expect } = require('@playwright/test');
const { BaseFramework } = require('../src/core/BaseFramework');

/**
 * Example UI Test with Self-Healing
 * Demonstrates how to write UI tests that automatically heal themselves
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

test('Login functionality with self-healing', async ({ page }) => {
    // Test data that might need healing
    const testData = {
        page,
        element: {
            selector: '#login-button',
            description: 'Login button',
            text: 'Login'
        },
        url: 'https://example.com/login'
    };

    // Test function that might fail due to UI changes
    const testFunction = async (data) => {
        const { page, element, url } = data;
        
        // Navigate to login page
        await page.goto(url);
        
        // Fill in login form (these selectors might change)
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'testpass');
        
        // Click login button (this might fail if selector changes)
        await page.click(element.selector);
        
        // Verify successful login
        await expect(page.locator('#dashboard')).toBeVisible();
    };

    // Execute test with self-healing
    const result = await framework.executeTest(testFunction, testData);
    
    // Verify test passed
    expect(result.success).toBe(true);
});

test('Shopping cart with self-healing', async ({ page }) => {
    const testData = {
        page,
        element: {
            selector: '.add-to-cart',
            description: 'Add to cart button',
            text: 'Add to Cart'
        },
        product: {
            name: 'Test Product',
            price: 99.99
        }
    };

    const testFunction = async (data) => {
        const { page, element, product } = data;
        
        // Navigate to product page
        await page.goto('https://example.com/products');
        
        // Find and click product
        await page.click(`text=${product.name}`);
        
        // Add to cart (selector might change)
        await page.click(element.selector);
        
        // Verify item added to cart
        await expect(page.locator('#cart-count')).toContainText('1');
        await expect(page.locator('#cart-total')).toContainText(product.price.toString());
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Form submission with self-healing', async ({ page }) => {
    const testData = {
        page,
        form: {
            name: '#contact-form',
            fields: {
                name: '#name',
                email: '#email',
                message: '#message'
            },
            submit: '#submit-button'
        },
        data: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Test message'
        }
    };

    const testFunction = async (data) => {
        const { page, form, data: formData } = data;
        
        // Navigate to contact page
        await page.goto('https://example.com/contact');
        
        // Fill form fields
        await page.fill(form.fields.name, formData.name);
        await page.fill(form.fields.email, formData.email);
        await page.fill(form.fields.message, formData.message);
        
        // Submit form
        await page.click(form.submit);
        
        // Verify success message
        await expect(page.locator('#success-message')).toBeVisible();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Navigation with self-healing', async ({ page }) => {
    const testData = {
        page,
        navigation: {
            menu: '#main-menu',
            links: {
                home: 'Home',
                about: 'About',
                contact: 'Contact'
            }
        }
    };

    const testFunction = async (data) => {
        const { page, navigation } = data;
        
        // Navigate to homepage
        await page.goto('https://example.com');
        
        // Test navigation links
        for (const [key, text] of Object.entries(navigation.links)) {
            await page.click(`text=${text}`);
            await expect(page).toHaveURL(new RegExp(key, 'i'));
        }
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Search functionality with self-healing', async ({ page }) => {
    const testData = {
        page,
        search: {
            input: '#search-input',
            button: '#search-button',
            results: '.search-results'
        },
        query: 'test search'
    };

    const testFunction = async (data) => {
        const { page, search, query } = data;
        
        // Navigate to search page
        await page.goto('https://example.com/search');
        
        // Perform search
        await page.fill(search.input, query);
        await page.click(search.button);
        
        // Verify results
        await expect(page.locator(search.results)).toBeVisible();
        await expect(page.locator('.search-result')).toHaveCount.greaterThan(0);
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Modal interaction with self-healing', async ({ page }) => {
    const testData = {
        page,
        modal: {
            trigger: '#open-modal',
            content: '.modal-content',
            close: '.modal-close'
        }
    };

    const testFunction = async (data) => {
        const { page, modal } = data;
        
        // Navigate to page with modal
        await page.goto('https://example.com/modal-demo');
        
        // Open modal
        await page.click(modal.trigger);
        
        // Verify modal is open
        await expect(page.locator(modal.content)).toBeVisible();
        
        // Close modal
        await page.click(modal.close);
        
        // Verify modal is closed
        await expect(page.locator(modal.content)).toBeHidden();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('Data table interaction with self-healing', async ({ page }) => {
    const testData = {
        page,
        table: {
            container: '#data-table',
            rows: 'tbody tr',
            columns: ['name', 'email', 'status'],
            sortButton: '.sort-button'
        }
    };

    const testFunction = async (data) => {
        const { page, table } = data;
        
        // Navigate to data table page
        await page.goto('https://example.com/data-table');
        
        // Verify table is visible
        await expect(page.locator(table.container)).toBeVisible();
        
        // Verify table has data
        await expect(page.locator(table.rows)).toHaveCount.greaterThan(0);
        
        // Test sorting
        await page.click(table.sortButton);
        await page.waitForTimeout(1000); // Wait for sort to complete
        
        // Verify data is sorted
        const firstRow = page.locator(table.rows).first();
        await expect(firstRow).toBeVisible();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('File upload with self-healing', async ({ page }) => {
    const testData = {
        page,
        upload: {
            input: '#file-input',
            button: '#upload-button',
            progress: '.upload-progress',
            success: '.upload-success'
        },
        file: {
            path: './test-files/sample.txt',
            name: 'sample.txt'
        }
    };

    const testFunction = async (data) => {
        const { page, upload, file } = data;
        
        // Navigate to upload page
        await page.goto('https://example.com/upload');
        
        // Upload file
        await page.setInputFiles(upload.input, file.path);
        await page.click(upload.button);
        
        // Verify upload progress
        await expect(page.locator(upload.progress)).toBeVisible();
        
        // Wait for upload completion
        await expect(page.locator(upload.success)).toBeVisible({ timeout: 10000 });
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});

test('API integration with self-healing', async ({ page }) => {
    const testData = {
        page,
        api: {
            endpoint: '/api/data',
            method: 'GET',
            baseUrl: 'https://example.com'
        },
        expectedData: {
            id: expect.any(Number),
            name: expect.any(String)
        }
    };

    const testFunction = async (data) => {
        const { page, api, expectedData } = data;
        
        // Navigate to page that makes API calls
        await page.goto('https://example.com/api-demo');
        
        // Wait for API call to complete
        await page.waitForResponse(response => 
            response.url().includes(api.endpoint) && response.status() === 200
        );
        
        // Verify data is displayed
        await expect(page.locator('#api-data')).toBeVisible();
        await expect(page.locator('#data-id')).toBeVisible();
        await expect(page.locator('#data-name')).toBeVisible();
    };

    const result = await framework.executeTest(testFunction, testData);
    expect(result.success).toBe(true);
});
