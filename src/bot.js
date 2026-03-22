const path = require('path');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const { getRandomProfile } = require('./browser-profiles');

class BotInstance {
    constructor(botId, config) {
        this.botId = botId;
        this.config = config;
        this.urls = config.urls;
        this.browser = null;
        this.page = null;
        this.context = null;
    }

    log(msg, type='info') {
        const message = `[Worker ${this.botId}] ${msg}`;
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    }

    getRandomReferrer() {
        const queries = ['best cpm networks', 'online earning 2024', 'tech news updates', 'make money online', 'blog traffic tips'];
        const query = queries[Math.floor(Math.random() * queries.length)];
        const engines = [
            `https://www.google.com/search?q=${encodeURIComponent(query)}&oq=${encodeURIComponent(query)}`,
            `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
            'https://www.facebook.com/',
            'https://twitter.com/',
            'https://t.co/'
        ];
        return engines[Math.floor(Math.random() * engines.length)];
    }

    async humanWait(min = 2, max = 5) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
        await this.page.waitForTimeout(delay);
    }

    async humanScroll() {
        try {
            const scrollSteps = Math.floor(Math.random() * 5) + 3;
            for (let i = 0; i < scrollSteps; i++) {
                const direction = Math.random() > 0.2 ? 1 : -1; // 80% scroll down, 20% scroll up
                const amount = Math.floor(Math.random() * 400) + 100;
                await this.page.mouse.wheel(0, amount * direction);
                await this.humanWait(1, 3);
            }
        } catch(e) {}
    }

    async humanMouseMovement() {
        try {
            const width = this.page.viewportSize().width;
            const height = this.page.viewportSize().height;
            const points = Math.floor(Math.random() * 4) + 2;
            for (let i = 0; i < points; i++) {
                const x = Math.floor(Math.random() * width);
                const y = Math.floor(Math.random() * height);
                await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 20) + 10 });
                await this.humanWait(0.5, 1.5);
            }
        } catch(e) {}
    }

    async browseInternalLinks() {
        this.log('Searching for internal links...', 'info');
        try {
            const currentHost = new URL(this.page.url()).hostname;
            const links = await this.page.$$('a');
            const validLinks = [];
            
            for (const link of links) {
                const href = await link.getAttribute('href');
                if (href && href.length > 1 && !href.startsWith('#') && !href.startsWith('mailto:')) {
                    try {
                        const linkUrl = new URL(href, this.page.url());
                        if (linkUrl.hostname === currentHost && linkUrl.href !== this.page.url()) {
                            validLinks.push(link);
                        }
                    } catch (e) {}
                }
            }

            if (validLinks.length > 0) {
                const randomLink = validLinks[Math.floor(Math.random() * validLinks.length)];
                this.log('Clicking internal link to reduce bounce rate...', 'info');
                await randomLink.scrollIntoViewIfNeeded().catch(()=>{});
                await this.humanWait(1, 2);
                await randomLink.click({ timeout: 5000, force: true }).catch(()=>{});
                await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(()=>{});
                return true;
            }
        } catch (e) {
            this.log(`Internal navigation failed: ${e.message}`, 'error');
        }
        return false;
    }

    async run() {
        while (true) {
            try {
                const targetUrl = this.urls[Math.floor(Math.random() * this.urls.length)];
                const profile = getRandomProfile(this.config.countryFocus);
                const referrer = this.getRandomReferrer();
                
                this.log(`Launching browser [${profile.country}] for ${targetUrl}...`, 'info');

                let launchOptions = {
                    headless: true, 
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                };

                const proxyStr = (this.config.proxies && this.config.proxies.length > 0) 
                    ? this.config.proxies[Math.floor(Math.random() * this.config.proxies.length)] 
                    : null;

                if (proxyStr) {
                    try {
                        let proxyObj = null;
                        if (proxyStr.startsWith('http')) {
                            const urlObj = new URL(proxyStr);
                            proxyObj = { server: `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}` };
                            if (urlObj.username) {
                                proxyObj.username = decodeURIComponent(urlObj.username);
                                proxyObj.password = decodeURIComponent(urlObj.password);
                            }
                        } else {
                            proxyObj = { server: `http://${proxyStr}` };
                        }
                        launchOptions.proxy = proxyObj;
                        this.log(`Using Proxy: ${proxyObj.server}`, 'info');
                    } catch(e) {
                        this.log(`Proxy parsing failed.`, 'error');
                    }
                }

                this.browser = await chromium.launch(launchOptions);
                this.context = await this.browser.newContext({
                    ...profile,
                    permissions: ['geolocation'],
                    extraHTTPHeaders: {
                        'Referer': referrer,
                        'Upgrade-Insecure-Requests': '1',
                        'DNT': '1'
                    }
                });
                
                this.page = await this.context.newPage();
                
                this.log(`Navigating via: ${referrer}`, 'info');
                await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                this.log('Target page loaded.', 'success');

                // ACTIVE INTERACTION LOOP
                const stayTimeSeconds = Math.floor(Math.random() * (this.config.stayTimeMax - this.config.stayTimeMin + 1) + this.config.stayTimeMin);
                this.log(`Staying on page for ${stayTimeSeconds}s...`, 'info');
                
                const startTime = Date.now();
                while ((Date.now() - startTime) < (stayTimeSeconds * 1000)) {
                    const action = Math.random();
                    if (action < 0.4) await this.humanScroll();
                    else if (action < 0.7) await this.humanMouseMovement();
                    else await this.humanWait(5, 15);
                    
                    // Periodic internal nav check
                    if (Math.random() > 0.8 && (Date.now() - startTime) > 30000) {
                        await this.browseInternalLinks();
                    }
                }

                this.log(`Task cycle completed successfully.`, 'success');

            } catch (error) {
                this.log(`Cycle error: ${error.message}`, 'error');
            } finally {
                if (this.page) await this.page.close().catch(()=>{});
                if (this.context) await this.context.close().catch(()=>{});
                if (this.browser) await this.browser.close().catch(()=>{});
                this.page = null;
                this.context = null;
                this.browser = null;
            }
            
            await new Promise(r => setTimeout(r, 15000));
        }
    }
}

module.exports = { BotInstance };
