const secret = require('./secret');
const api = require('./api');
const yargs = require('yargs');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const {loginInsta, postComment} = require('./utils');
exports.commentTags = async (config) => {
    let visitedPosts = [];
    fs.readFile(config.logFile, 'utf-8', function (err, content) {
        visitedPosts = content.split('\n').filter(Boolean).map(line=>JSON.parse(line));
    });
    const browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        devtools: false
    });
    const page = (await browser.pages())[0];
    await loginInsta(page, config, secret);
    const {tags, tagurl} = config;
    const tagspage = tagurl + tags[Math.floor(Math.random() * tags.length)];
    await page.goto(tagspage, { waitUntil: 'networkidle2' });
    const allLinks = await api.autoScroll(page,config.scrollCount);
    const postLinkRE = new RegExp(config.postLink, "g");
    const postLinks = allLinks.filter(link => link.match(postLinkRE));
    let count = 0;
    console.log("Total Posts Found:", postLinks.length);
    for (postLink of postLinks) {
        try {
            if(!visitedPosts.find(post=>post.postLink === postLink)) {
                await page.goto(postLink, { waitUntil: 'networkidle2' });
                const [profileRef] = await page.$x("//button[contains(., 'Follow')]/../../div[1]/span/a");
                const profileLink = await page.evaluate(el => el.href, profileRef);
                if(!visitedPosts.find(post=>post.profileLink === profileLink)){
                    const post = {postLink, profileLink};
                    await postComment(page, config);
                    console.log(`Posted ${postLink}`);
                    visitedPosts.push(post);
                    fs.appendFile(config.logFile,JSON.stringify(post)+"\n",()=>{});   
                    count++;
                } else {
                    console.log(`Skipped ${profileLink}`);
                }
            } else {
                console.log(`Skipped ${postLink}`);
            }
        } catch (e) { console.log(e, postLink);}
        if(count >= config.totalComments) break;
    }
    console.log(`Total Comments posted: ${count}`);
    await browser.close();
};