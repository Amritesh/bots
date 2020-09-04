const secret = require('./secret');
const chromium = require('chrome-aws-lambda');

exports.initializeBrowser = async () =>{
    const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        devtools: false
    });
    const page = (await browser.pages())[0];
    return {browser, page};
}

exports.loginInsta = async (page, config) => {
    await page.goto(config.homeurl, { waitUntil: 'networkidle2' });
    await page.waitForSelector("input[name*='username']");
    await page.type("input[name*='username']", secret.username);
    await page.type("input[name*='password']", secret.password);
    await page.click('[type="submit"]');
    await clickNotNow(page);
    await clickNotNow(page);
}

const clickNotNow = async (page) => {
    await page.waitForXPath("//button[contains(., 'Not Now')]");
    const [button] = await page.$x("//button[contains(., 'Not Now')]");
    button && await button.click();
}

exports.getFollowers = async (page, config) => {
    const {posturl, scrollCount} = config;
    await page.waitForXPath("//a[contains(., 'followers')]");
    const [button] = await page.$x("//a[contains(., 'followers')]");
    button && await button.click();
    await page.waitForXPath("//div[@role='dialog']/div[1]/div[2]");
    const allLinks = await scrollAndGetLinks(page, scrollCount, "div[role=dialog] div div:nth-child(2)");
    const posturlRE = new RegExp(posturl, "g");
    return allLinks.filter(link => !link.match(posturlRE)).slice(40);
    
}


exports.getPostLinks = async (page, config, noScroll) => {
    let {posturl, scrollCount} = config;
    noScroll && (scrollCount = 0);
    const allLinks = await scrollAndGetLinks(page, scrollCount);
    const posturlRE = new RegExp(posturl, "g");
    return allLinks.filter(link => link.match(posturlRE));
}

const scrollAndGetLinks = async (page, scrollCount, selector) => {
    return await page.evaluate(async (scrollCount, selector) => {
        let dom = window;
        selector && (dom = document.querySelector(selector));
        const allLinks = await new Promise((resolve, reject) => {
            let count = 0;
            const distance = 1000;
            let allLinks = [];
            const timer = setInterval(() => {
                dom.scrollBy(0, distance);
                const htmlCollection = document.getElementsByTagName('a');
                const links = Array.prototype.slice.call( htmlCollection ).map(b=>b.href);
                allLinks = Array.from(new Set([...allLinks, ...links]));
                count++;
                if(scrollCount<count){
                    clearInterval(timer);
                    resolve(allLinks);
                }
            }, Math.random()*2000+2000);
        });
        return allLinks;
    }, scrollCount, selector);
}

exports.postComment = async (page,config) => {
    const comment = getComment(config);
    await page.type("textarea", comment);
    const [button] = await page.$x("//button[contains(., 'Post')]");
    await page.waitFor(Math.random()*1000+1000);
    button && await button.click();
    await page.waitFor(Math.random()*2000+2000);
}

const getComment = (config) => {
    const {comments, smileys} = config;
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    const smileyString = [0,1,2].map(_=>smileys[Math.floor(Math.random() * smileys.length)]).join('');
    return randomComment.split(":smileys:").join(smileyString);
}

exports.likePost = async (page) => {
    await page.waitForSelector("svg");
    const liked  = await page.evaluate(async () => {
        const unLikeButton = document.querySelector("svg[aria-label='Unlike']");
        if(unLikeButton) return false;
        const likeButton = document.querySelector("svg[aria-label='Like']");
        likeButton && likeButton.parentElement.click(); 
        return true;
    });
    return liked;   
}