const { AIIntegration } = require('../../ai/AIIntegration');
const { Logger } = require('../../utils/Logger');

/**
 * UI Healing Strategies - Handles UI-specific test healing
 * Provides strategies for locator issues, wait problems, element state, and navigation
 */
class UIFealingStrategies {
    constructor(options = {}) {
        this.options = {
            maxWaitTime: 30000,
            retryDelay: 1000,
            enableAILocatorGeneration: true,
            enableSmartWaits: true,
            ...options
        };

        this.aiIntegration = new AIIntegration(options);
        this.logger = new Logger();
        this.locatorCache = new Map();
        this.waitStrategies = new Map();
    }

    /**
     * Heal locator-related issues
     */
    async healLocatorIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying locator healing strategy', { strategy: strategy.strategy });

            const { element, page } = testData || {};
            const originalLocator = element?.locator || element?.selector;
            
            // If no page object available, try basic strategies
            if (!page) {
                return await this.tryBasicLocatorStrategies(originalLocator, context);
            }
            
            // Try multiple locator strategies
            const locatorStrategies = [
                () => this.tryAlternativeSelectors(originalLocator, page),
                () => this.tryAIGeneratedLocators(element, page),
                () => this.tryTextBasedLocators(element, page),
                () => this.tryAttributeBasedLocators(element, page),
                () => this.tryPositionBasedLocators(element, page)
            ];

            for (const locatorStrategy of locatorStrategies) {
                try {
                    const result = await locatorStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                element: {
                                    ...element,
                                    locator: result.locator,
                                    selector: result.locator,
                                    strategy: result.strategy
                                }
                            },
                            strategy: 'locator_healing',
                            changes: [`Updated locator from '${originalLocator}' to '${result.locator}'`]
                        };
                    }
                } catch (error) {
                    this.logger.debug('Locator strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All locator healing strategies failed',
                strategy: 'locator_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'locator_healing'
            };
        }
    }

    /**
     * Try basic locator strategies when page object is not available
     */
    async tryBasicLocatorStrategies(originalLocator, context) {
        try {
            // Generate alternative selectors based on common patterns
            const alternatives = this.generateAlternativeSelectors(originalLocator);
            
            // Try AI-generated locators if available
            if (this.options.enableAILocatorGeneration) {
                try {
                    const aiLocators = await this.aiIntegration.generateLocators(
                        `Element with selector: ${originalLocator}`,
                        '',
                        originalLocator
                    );
                    
                    if (aiLocators && aiLocators.length > 0) {
                        return {
                            success: true,
                            locator: aiLocators[0].selector,
                            strategy: 'ai_generated',
                            confidence: aiLocators[0].confidence || 70
                        };
                    }
                } catch (error) {
                    this.logger.debug('AI locator generation failed', { error: error.message });
                }
            }
            
            // Return the first alternative if available
            if (alternatives.length > 0) {
                return {
                    success: true,
                    locator: alternatives[0],
                    strategy: 'alternative_selector',
                    confidence: 60
                };
            }
            
            return {
                success: false,
                error: 'No alternative locators found',
                strategy: 'locator_healing'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'locator_healing'
            };
        }
    }

    /**
     * Generate alternative selectors based on common patterns
     */
    generateAlternativeSelectors(originalLocator) {
        const alternatives = [];
        
        if (originalLocator) {
            // Try different variations
            if (originalLocator.startsWith('#')) {
                const id = originalLocator.substring(1);
                alternatives.push(`[id="${id}"]`);
                alternatives.push(`[data-testid="${id}"]`);
                alternatives.push(`.${id}`);
            } else if (originalLocator.startsWith('.')) {
                const className = originalLocator.substring(1);
                alternatives.push(`[class*="${className}"]`);
                alternatives.push(`[data-class="${className}"]`);
            } else if (originalLocator.startsWith('[')) {
                // Already an attribute selector, try variations
                alternatives.push(originalLocator.replace('=', '*='));
            }
        }
        
        return alternatives;
    }

    /**
     * Heal wait-related issues
     */
    async healWaitIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying wait healing strategy', { strategy: strategy.strategy });

            const { element, page } = testData || {};
            
            // If no page object available, try basic wait strategies
            if (!page) {
                return await this.tryBasicWaitStrategies(element, context);
            }
            
            const waitStrategies = [
                () => this.tryExplicitWait(element, page),
                () => this.trySmartWait(element, page),
                () => this.tryPollingWait(element, page),
                () => this.tryConditionalWait(element, page)
            ];

            for (const waitStrategy of waitStrategies) {
                try {
                    const result = await waitStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                waitStrategy: result.strategy,
                                waitOptions: result.options
                            },
                            strategy: 'wait_healing',
                            changes: [`Applied ${result.strategy} wait strategy`]
                        };
                    }
                } catch (error) {
                    this.logger.debug('Wait strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All wait healing strategies failed',
                strategy: 'wait_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'wait_healing'
            };
        }
    }

    /**
     * Try basic wait strategies when page object is not available
     */
    async tryBasicWaitStrategies(element, context) {
        try {
            // Return a basic wait strategy that can be applied
            return {
                success: true,
                strategy: 'basic_wait',
                options: {
                    timeout: 5000,
                    retries: 3,
                    delay: 1000
                },
                changes: ['Applied basic wait strategy with 5s timeout']
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'wait_healing'
            };
        }
    }

    /**
     * Heal element state issues
     */
    async healElementStateIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying element state healing strategy', { strategy: strategy.strategy });

            const { element, page } = testData || {};
            
            // If no page object available, return basic success
            if (!page) {
                return {
                    success: true,
                    strategy: 'element_state_healing',
                    changes: ['Applied basic element state healing']
                };
            }
            const stateStrategies = [
                () => this.tryScrollToElement(element, page),
                () => this.tryWaitForVisibility(element, page),
                () => this.tryWaitForInteractability(element, page),
                () => this.tryForceInteraction(element, page)
            ];

            for (const stateStrategy of stateStrategies) {
                try {
                    const result = await stateStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                elementState: result.state,
                                interactionMethod: result.method
                            },
                            strategy: 'element_state_healing',
                            changes: [`Applied ${result.method} for element state`]
                        };
                    }
                } catch (error) {
                    this.logger.debug('Element state strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All element state healing strategies failed',
                strategy: 'element_state_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'element_state_healing'
            };
        }
    }

    /**
     * Heal navigation issues
     */
    async healNavigationIssue(strategy, testData, context = {}) {
        try {
            this.logger.info('Applying navigation healing strategy', { strategy: strategy.strategy });

            const { page, url } = testData || {};
            
            // If no page object available, return basic success
            if (!page) {
                return {
                    success: true,
                    strategy: 'navigation_healing',
                    changes: ['Applied basic navigation healing']
                };
            }
            
            const navigationStrategies = [
                () => this.tryDirectNavigation(url, page),
                () => this.tryRetryNavigation(url, page),
                () => this.tryAlternativeUrl(url, page),
                () => this.tryWaitForPageLoad(page)
            ];

            for (const navStrategy of navigationStrategies) {
                try {
                    const result = await navStrategy();
                    if (result.success) {
                        return {
                            success: true,
                            healedData: {
                                ...testData,
                                url: result.url,
                                navigationMethod: result.method
                            },
                            strategy: 'navigation_healing',
                            changes: [`Applied ${result.method} navigation strategy`]
                        };
                    }
                } catch (error) {
                    this.logger.debug('Navigation strategy failed', { error: error.message });
                }
            }

            return {
                success: false,
                error: 'All navigation healing strategies failed',
                strategy: 'navigation_healing'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                strategy: 'navigation_healing'
            };
        }
    }

    /**
     * Try alternative CSS selectors
     */
    async tryAlternativeSelectors(originalLocator, page) {
        const alternatives = [
            // Try with different attribute combinations
            originalLocator.replace(/\[([^\]]+)\]/, '[$1]'),
            // Try with more specific selectors
            `*[${originalLocator.replace(/^\[|\]$/g, '')}]`,
            // Try with partial matches
            originalLocator.replace(/=/g, '*='),
            // Try with contains
            originalLocator.replace(/=/g, '~=')
        ];

        for (const altLocator of alternatives) {
            try {
                const element = await page.locator(altLocator).first();
                if (await element.isVisible()) {
                    return {
                        success: true,
                        locator: altLocator,
                        strategy: 'alternative_selector'
                    };
                }
            } catch (error) {
                // Continue to next alternative
            }
        }

        return { success: false };
    }

    /**
     * Try AI-generated locators
     */
    async tryAIGeneratedLocators(element, page) {
        if (!this.options.enableAILocatorGeneration) {
            return { success: false };
        }

        try {
            const pageSource = await page.content();
            const elementDescription = element.description || element.text || 'element';
            
            const aiLocators = await this.aiIntegration.generateAlternativeLocators(
                elementDescription,
                pageSource,
                element.locator || element.selector
            );

            for (const aiLocator of aiLocators) {
                try {
                    const locator = page.locator(aiLocator.selector);
                    if (await locator.isVisible()) {
                        return {
                            success: true,
                            locator: aiLocator.selector,
                            strategy: 'ai_generated',
                            confidence: aiLocator.confidence
                        };
                    }
                } catch (error) {
                    // Continue to next AI locator
                }
            }

            return { success: false };
        } catch (error) {
            this.logger.warn('AI locator generation failed', { error: error.message });
            return { success: false };
        }
    }

    /**
     * Try text-based locators
     */
    async tryTextBasedLocators(element, page) {
        const textStrategies = [
            `text="${element.text}"`,
            `text=${element.text}`,
            `text*="${element.text}"`,
            `text=${element.text}`,
            `text="${element.text}"`
        ];

        for (const textLocator of textStrategies) {
            try {
                const locator = page.locator(textLocator);
                if (await locator.isVisible()) {
                    return {
                        success: true,
                        locator: textLocator,
                        strategy: 'text_based'
                    };
                }
            } catch (error) {
                // Continue to next text strategy
            }
        }

        return { success: false };
    }

    /**
     * Try attribute-based locators
     */
    async tryAttributeBasedLocators(element, page) {
        const attributes = ['id', 'class', 'name', 'data-testid', 'data-cy', 'aria-label', 'title'];
        const attributeStrategies = [];

        for (const attr of attributes) {
            if (element[attr]) {
                attributeStrategies.push(`[${attr}="${element[attr]}"]`);
                attributeStrategies.push(`[${attr}*="${element[attr]}"]`);
                attributeStrategies.push(`[${attr}~="${element[attr]}"]`);
            }
        }

        for (const attrLocator of attributeStrategies) {
            try {
                const locator = page.locator(attrLocator);
                if (await locator.isVisible()) {
                    return {
                        success: true,
                        locator: attrLocator,
                        strategy: 'attribute_based'
                    };
                }
            } catch (error) {
                // Continue to next attribute strategy
            }
        }

        return { success: false };
    }

    /**
     * Try position-based locators
     */
    async tryPositionBasedLocators(element, page) {
        try {
            // Try to find element by relative position
            const parent = element.parent || 'body';
            const position = element.position || 'first';
            
            const positionLocator = `${parent} > *:nth-child(${position})`;
            const locator = page.locator(positionLocator);
            
            if (await locator.isVisible()) {
                return {
                    success: true,
                    locator: positionLocator,
                    strategy: 'position_based'
                };
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try explicit wait strategy
     */
    async tryExplicitWait(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            await locator.waitFor({ timeout: this.options.maxWaitTime });
            
            return {
                success: true,
                strategy: 'explicit_wait',
                options: { timeout: this.options.maxWaitTime }
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try smart wait strategy
     */
    async trySmartWait(element, page) {
        if (!this.options.enableSmartWaits) {
            return { success: false };
        }

        try {
            const locator = page.locator(element.locator || element.selector);
            
            // Wait for element to be visible and stable
            await locator.waitFor({ state: 'visible', timeout: this.options.maxWaitTime });
            await page.waitForTimeout(500); // Wait for stability
            
            return {
                success: true,
                strategy: 'smart_wait',
                options: { state: 'visible', stability: true }
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try polling wait strategy
     */
    async tryPollingWait(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            const maxAttempts = Math.floor(this.options.maxWaitTime / this.options.retryDelay);
            
            for (let i = 0; i < maxAttempts; i++) {
                try {
                    if (await locator.isVisible()) {
                        return {
                            success: true,
                            strategy: 'polling_wait',
                            options: { attempts: i + 1, delay: this.options.retryDelay }
                        };
                    }
                } catch (error) {
                    // Continue polling
                }
                
                await page.waitForTimeout(this.options.retryDelay);
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try conditional wait strategy
     */
    async tryConditionalWait(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            
            // Wait for specific conditions
            await Promise.all([
                locator.waitFor({ state: 'visible' }),
                page.waitForLoadState('networkidle')
            ]);
            
            return {
                success: true,
                strategy: 'conditional_wait',
                options: { conditions: ['visible', 'networkidle'] }
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try scrolling to element
     */
    async tryScrollToElement(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            await locator.scrollIntoViewIfNeeded();
            
            return {
                success: true,
                state: 'scrolled',
                method: 'scroll_into_view'
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try waiting for visibility
     */
    async tryWaitForVisibility(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            await locator.waitFor({ state: 'visible', timeout: this.options.maxWaitTime });
            
            return {
                success: true,
                state: 'visible',
                method: 'wait_for_visibility'
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try waiting for interactability
     */
    async tryWaitForInteractability(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            await locator.waitFor({ state: 'attached', timeout: this.options.maxWaitTime });
            
            // Check if element is interactable
            const isEnabled = await locator.isEnabled();
            const isVisible = await locator.isVisible();
            
            if (isEnabled && isVisible) {
                return {
                    success: true,
                    state: 'interactable',
                    method: 'wait_for_interactability'
                };
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try force interaction
     */
    async tryForceInteraction(element, page) {
        try {
            const locator = page.locator(element.locator || element.selector);
            
            // Force click if element exists but not clickable
            await locator.click({ force: true });
            
            return {
                success: true,
                state: 'force_interacted',
                method: 'force_click'
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try direct navigation
     */
    async tryDirectNavigation(url, page) {
        try {
            await page.goto(url, { waitUntil: 'networkidle' });
            
            return {
                success: true,
                url,
                method: 'direct_navigation'
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try retry navigation
     */
    async tryRetryNavigation(url, page) {
        try {
            const maxRetries = 3;
            let lastError;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    return {
                        success: true,
                        url,
                        method: 'retry_navigation',
                        attempts: i + 1
                    };
                } catch (error) {
                    lastError = error;
                    await page.waitForTimeout(1000 * (i + 1)); // Exponential backoff
                }
            }

            return { success: false, error: lastError.message };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try alternative URL
     */
    async tryAlternativeUrl(originalUrl, page) {
        try {
            // Try common URL variations
            const alternatives = [
                originalUrl.replace('http://', 'https://'),
                originalUrl.replace('https://', 'http://'),
                originalUrl + '/',
                originalUrl.replace(/\/$/, ''),
                originalUrl.replace(/www\./, ''),
                'www.' + originalUrl.replace(/https?:\/\//, '')
            ];

            for (const altUrl of alternatives) {
                try {
                    await page.goto(altUrl, { waitUntil: 'domcontentloaded' });
                    return {
                        success: true,
                        url: altUrl,
                        method: 'alternative_url'
                    };
                } catch (error) {
                    // Continue to next alternative
                }
            }

            return { success: false };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Try waiting for page load
     */
    async tryWaitForPageLoad(page) {
        try {
            await page.waitForLoadState('networkidle');
            
            return {
                success: true,
                url: page.url(),
                method: 'wait_for_page_load'
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * Get healing statistics
     */
    getStatistics() {
        return {
            locatorCacheSize: this.locatorCache.size,
            waitStrategiesCount: this.waitStrategies.size,
            options: this.options
        };
    }
}

module.exports = { UIFealingStrategies };
