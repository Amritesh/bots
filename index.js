const config = require('./config');
const api = require('./api');
const utils = require('./utils');
const yargs = require('yargs');
const chromium = require('chrome-aws-lambda');
(async () => {
    console.log(chromium.executablePath);
    let browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        devtools: true
    });
    try{
        const page = (await browser.pages())[0];
        const url = 'http://instagram.com';
        await page.goto(url, { waitUntil: 'networkidle2'});
    }
    catch (error) { 
        console.error(error);
    } finally { 
        if (browser !== null && !halt) {await browser.close();} 
    }
})();