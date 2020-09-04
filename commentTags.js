const fs = require('fs');
const {initializeBrowser, loginInsta, getPostLinks, postComment} = require('./utils');
exports.commentTags = async (config) => {
    let visitedPosts = [];
    fs.readFile(config.logFile, 'utf-8', function (err, content) {
        visitedPosts = content.split('\n').filter(Boolean).map(line=>JSON.parse(line));
    });
    const {browser, page} = await initializeBrowser();
    await loginInsta(page, config);
    const {tags, tagurl} = config;
    const tagpage = tagurl + tags[Math.floor(Math.random() * tags.length)];
    await page.goto(tagpage, { waitUntil: 'networkidle2' });
    const postLinks = await getPostLinks(page, config);
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