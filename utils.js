const secret = require('./secret');
const chromium = require('chrome-aws-lambda');

exports.initializeBrowser = async () =>{
    const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        devtools: true
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

exports.getFollowers = async (page) => {
    await page.waitForXPath("//a[contains(., 'followers')]");
    const [button] = await page.$x("//a[contains(., 'followers')]");
    button && await button.click();
    await page.waitForXPath("//div[@role='dialog']/div[1]/div[2]");
    const [followrsDiv] = await page.$x("//div[@role='dialog']/div[1]/div[2]");
    document.getElementById("d").scrollTop += 100;
    return followers;
}

exports.scrollAndGetLinks = async (page, config, dom) => {
    return await page.evaluate(async ({scrollCount}) => {
        let allLinks = await new Promise((resolve, reject) => {
            let count = 0;
            let distance = 2000;
            let allLinks = [];
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                count++;
                const htmlCollection = document.getElementsByTagName('a')
                const links = Array.prototype.slice.call( htmlCollection ).map(b=>b.href);
                allLinks = Array.from(new Set([...allLinks, ...links]));
                if(scrollCount<count){
                    clearInterval(timer);
                    resolve(allLinks);
                }
            }, Math.random()*2000+2000);
        });
        return allLinks;
    }, config);
}

exports.postComment = async (page) => {
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
    const smileyString = [0,1,2,3,4].map(_=>smileys[Math.floor(Math.random() * smileys.length)]).join('');
    return randomComment.split(":smileys:").join(smileyString);
}
