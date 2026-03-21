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

    async minStaySleep() {
        const min = (this.config.stayTimeMin || 30) * 1000;
        const max = (this.config.stayTimeMax || 60) * 1000;
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        this.log(`Simulating user stay time: ${delay / 1000}s`, 'info');
        await this.page.waitForTimeout(delay);
    }

    async humanScroll() {
        this.log('Simulating human scrolling...', 'info');
        try {
            for (let i = 0; i < 3; i++) {
                await this.page.mouse.wheel(0, Math.floor(Math.random() * 500) + 200);
                await this.page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
            }
            await this.page.mouse.wheel(0, -Math.floor(Math.random() * 300));
            await this.page.waitForTimeout(1000);
        } catch(e) {}
    }

    async humanMouseMovement() {
        try {
            const width = this.page.viewportSize().width;
            const height = this.page.viewportSize().height;
            for (let i = 0; i < 3; i++) {
                const x = Math.floor(Math.random() * width);
                const y = Math.floor(Math.random() * height);
                await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
                await this.page.waitForTimeout(500);
            }
        } catch(e) {}
    }

    async run() {
        while (true) {
            try {
                const targetUrl = this.urls[Math.floor(Math.random() * this.urls.length)];
                const profile = getRandomProfile(this.config.countryFocus);
                this.log(`Launching browser [${profile.country}] for ${targetUrl}...`, 'info');

                let launchOptions = {
                    headless: true, 
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                };

                const proxyStr = this.config.proxies && this.config.proxies.length > 0 
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
                    permissions: ['geolocation']
                });
                this.page = await this.context.newPage();
                
                await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                this.log('Page loaded.', 'success');

                await this.page.waitForTimeout(2000);
                await this.humanMouseMovement();
                await this.humanScroll();
                await this.minStaySleep();

                this.log(`Task cycle completed.`, 'success');

            } catch (error) {
                this.log(`Error: ${error.message}`, 'error');
            } finally {
                if (this.page) await this.page.close().catch(()=>{});
                if (this.context) await this.context.close().catch(()=>{});
                if (this.browser) await this.browser.close().catch(()=>{});
                this.page = null;
                this.context = null;
                this.browser = null;
            }
            
            // Wait before next cycle
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

module.exports = { BotInstance };
