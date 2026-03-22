const { BotInstance } = require('./src/bot');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
    console.error('config.json not found!');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function runHeadless() {
    console.log('Starting Headless Traffic Bot...');
    console.log(`Targeting URLs: ${config.urls.join(', ')}`);
    console.log(`Using ${config.proxies.length} proxies.`);
    
    // EXIT TIMER: Auto-exit after 50 minutes to avoid GitHub timeout error
    const runtimeLimit = 50 * 60 * 1000;
    setTimeout(() => {
        console.log('--- RUNTIME LIMIT REACHED (50 min) ---');
        console.log('Exiting cleanly to allow the next cron job to start.');
        process.exit(0); 
    }, runtimeLimit);

    const bots = [];
    const totalThreads = config.threads || 2;

    for (let i = 0; i < totalThreads; i++) {
        const botConfig = {
            urls: config.urls,
            stayTimeMin: config.stayTimeMin || 30,
            stayTimeMax: config.stayTimeMax || 60,
            countryFocus: config.countryFocus || 'all',
            proxies: config.proxies
        };

        const bot = new BotInstance(i + 1, botConfig);
        bots.push(bot.run());
        
        // Stagger starts
        await new Promise(r => setTimeout(r, 5000));
    }

    await Promise.all(bots);
    console.log('Finalised all bot threads.');
}

runHeadless().catch(console.error);
