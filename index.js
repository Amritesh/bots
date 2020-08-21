const config = require('./config');
const secret = require('./secret');
const api = require('./api');
const utils = require('./utils');
const yargs = require('yargs');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
(async () => {
    const argv = yargs.argv;
    const run = argv._.includes('run');
    const halt = argv._.includes('halt');
    let visitedPosts = [];
    fs.readFile(config.logFile, 'utf-8', function (err, content) {
        visitedPosts = content.split('\n').map(line=>line !== "" && JSON.parse(line)).filter(Boolean);
    });
    if (run) {
        const browser = await chromium.puppeteer.launch({
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            debugger: true
        });
        try {
            const page = (await browser.pages())[0];
            await page.goto(config.homeurl, { waitUntil: 'networkidle2' });
            await page.type("input[name*='username']", secret.username);
            await page.type("input[name*='password']", secret.password);
            await page.click('[type="submit"]');
            await page.waitForSelector("div[role*='dialog']");
            const [button] = await page.$x("//button[contains(., 'Not Now')]");
            button && await button.click();
            const comments = config.comments;
            for (tag of config.tags) {
                const tagspage = config.tagurl + tag;
                await page.goto(tagspage, { waitUntil: 'networkidle2' });
                const allLinks = await page.$$eval('a', as => as.map(a => a.href));
                const postLinkRE = new RegExp(config.postLink, "g");
                let postLinks = allLinks.filter(link => link.match(postLinkRE));
                let count = 0;
                for (postLink of postLinks) {
                    try {
                        await page.goto(postLink, { waitUntil: 'networkidle2' });
                        const [profileRef] = await page.$x("//button[contains(., 'Follow')]/../../div[1]/span/a");
                        const profileLink = await page.evaluate(el => el.href, profileRef);
                        await page.waitFor(Math.random()*1000);
                        if(!visitedPosts.find(post=>post.profileLink === profileLink)){
                            const post = {postLink, profileLink }
                            const randomComment = comments[Math.floor(Math.random() * comments.length)];
                            await page.type("textarea", randomComment);
                            const [button] = await page.$x("//button[contains(., 'Post')]");
                            await page.waitFor(Math.random()*10000);
                            // button && await button.click();
                            fs.appendFile(config.logFile,JSON.stringify(post)+"\n",()=>{});   
                            count++;
                        } else {
                            console.log(`skipped ${profileLink}`);
                        }
                    } catch (e) {
                        console.log(e, postLink);
                    }
                    if(count >= config.totalComments)
                        break;
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (browser !== null && !halt) {
                await browser.close();
            }
        }
    }
})();