Add a `config.json` file in the root directory with the following structure:

```json
{
    "urls": ["https://your-website.com"],
    "proxies": ["http://user:pass@host:port"],
    "countryFocus": "USA",
    "threads": 2
}
```

Then run the bot using:
`node runner.js`
