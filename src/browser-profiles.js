const { geoData } = require('./geo-data');

function getRandomProfile(countryFocus = 'all') {
    const profiles = [
        {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            isMobile: false,
            hasTouch: false,
            hardwareConcurrency: 8,
            deviceMemory: 16
        },
        {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1440, height: 900 },
            isMobile: false,
            hasTouch: false,
            hardwareConcurrency: 8,
            deviceMemory: 16
        },
        {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
            viewport: { width: 393, height: 852 },
            isMobile: true,
            hasTouch: true,
            hardwareConcurrency: 6,
            deviceMemory: 8
        }
    ];

    const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
    
    let geo;
    if (countryFocus === 'all') {
        geo = geoData[Math.floor(Math.random() * geoData.length)];
    } else {
        const filtered = geoData.filter(g => g.country === countryFocus);
        if (filtered.length > 0) {
            geo = filtered[Math.floor(Math.random() * filtered.length)];
        } else {
            geo = geoData[Math.floor(Math.random() * geoData.length)];
        }
    }

    return {
        ...randomProfile,
        locale: geo.locale,
        timezoneId: geo.timezoneId,
        geolocation: { latitude: geo.latitude, longitude: geo.longitude },
        country: geo.country
    };
}

module.exports = { getRandomProfile };
