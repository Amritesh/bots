const config = require('./config');
const secret = require('./secret');
const api = require('./api');
const chromium = require('chrome-aws-lambda');
const fs = require('fs-extra');
exports.postInsta = async ({params}) => {
    params = {...config, ...params};
    console.log(params);
    const headless = true;
    let visitedPosts = [];
    fs.readFile(params.logFile, 'utf-8', function (err, content) { visitedPosts = content.split('\n').map(line=>line !== "" && JSON.parse(line)).filter(Boolean);});
    const {tags, tagurl, comments, smileys} = params;
    const browser = await chromium.puppeteer.launch({
        args: ['--no-sandbox'],
        executablePath: await chromium.executablePath,
        headless: headless,
        devtools: true
    });
    let count = 0, totalPosted = 0;
    try {
        const page = (await browser.pages())[0];
        await page.goto(params.homeurl, { waitUntil: 'networkidle2' });
        headless && await page.waitFor(5000);
        await page.type("input[name*='username']", secret.username);
        await page.type("input[name*='password']", secret.password);
        await page.$eval('[type="submit"]', el => el.disabled = false);
        await page.click('[type="submit"]');
        await page.waitFor(1000);
        const [button1] = await page.$x("//button[contains(., 'Not Now')]");
        button1 && await button1.click();
        await page.waitFor(1000);
        const [button2] = await page.$x("//button[contains(., 'Not Now')]");
        button2 && await button2.click();
        const tag = params.tag || tags[Math.floor(Math.random() * tags.length)];
        const tagspage = tagurl + tag;
        headless && await page.waitFor(5000);
        await page.goto(tagspage, { waitUntil: 'networkidle2' });
        const allLinks = await api.autoScroll(page,params.scrollCount);
        const postLinkRE = new RegExp(params.postLink, "g");
        let postLinks = allLinks.filter(link => link.match(postLinkRE));
        console.log("total Posts", postLinks.length);
        for (postLink of postLinks) {
            try {
                if(!visitedPosts.find(post=>post.postLink === postLink)) {
                    await page.goto(postLink, { waitUntil: 'networkidle2' });
                    headless && await page.waitFor(5000);
                    const [profileRef] = await page.$x("//button[contains(., 'Follow')]/../../div[1]/span/a");
                    const profileLink = await page.evaluate(el => el.href, profileRef);
                    if(!visitedPosts.find(post=>post.profileLink === profileLink)){
                        const post = {postLink, profileLink }
                        const randomComment = params.comment || comments[Math.floor(Math.random() * comments.length)];
                        const smileyString = [0,1,2,3,4].map(_=>smileys[Math.floor(Math.random() * smileys.length)]).join('');
                        const comment = randomComment.split(":smileys:").join(smileyString);
                        await page.type("textarea", comment);
                        const [button] = await page.$x("//button[contains(., 'Post')]");
                        await page.waitFor(Math.random()*1000+1000);
                        button && await button.click();
                        await page.waitFor(Math.random()*1000+1000);
                        console.log(`posted ${profileLink}`);
                        visitedPosts.push(post);
                        totalPosted++;
                        fs.appendFile(params.logFile,JSON.stringify(post)+"\n",()=>{});   
                        count++;
                    } else {
                        console.log(`skipped ${profileLink}`);
                    }
                } else {
                    console.log(`skipped ${postLink}`);
                }
            } catch (e) {
                console.log(e, postLink);
            }
            if(count >= params.totalComments)
                break;
        }
    } catch (error) {
        console.error(error);
    } finally {
        if (browser !== null) {await browser.close();}
        return totalPosted;
    }
};
