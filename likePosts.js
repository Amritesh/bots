const fs = require('fs');
const {initializeBrowser, loginInsta, getFollowers, getPostLinks, likePost} = require('./utils');
exports.likePosts = async (config) => {
    let visitedPosts = [];
    fs.readFile(config.logFile, 'utf-8', function (err, content) {
        visitedPosts = content.split('\n').filter(Boolean).map(line=>JSON.parse(line));
    });
    const {browser, page} = await initializeBrowser();
    await loginInsta(page, config);
    await page.goto('https://www.instagram.com/p/CCBjYyvDLTj/', { waitUntil: 'networkidle2' });
    const {profiles, homeurl} = config;
    const profilePage = homeurl + profiles[Math.floor(Math.random() * profiles.length)];
    await page.goto(profilePage, { waitUntil: 'networkidle2' });
    const followerLinks = await getFollowers(page, config);
    let count = 0;
    console.log("Total Followers Found:", followerLinks.length);
    for (profileLink of followerLinks) {
        try {
            if(!visitedPosts.find(post=>post.profileLink === profileLink)){
                await page.goto(profileLink, { waitUntil: 'networkidle2' });
                await page.waitFor(Math.random()*2000+2000);
                let postLinks = await getPostLinks(page, config);
                postLinks = postLinks.slice(0,12);
                console.log("Total Posts Found:", postLinks.length);
                for (postLink of postLinks) {
                    if(!visitedPosts.find(post=>post.postLink === postLink)) {
                        await page.goto(postLink, { waitUntil: 'networkidle2' });
                        const post = {postLink, profileLink};
                        await likePost(page, config);
                        console.log(`Liked ${postLink}`);
                        visitedPosts.push(post);
                        fs.appendFile(config.logFile,JSON.stringify(post)+"\n",()=>{}); 
                        count++;
                    } else {
                        console.log(`Skipped ${postLink}`);
                    }
                }   
            } else {
                console.log(`Skipped ${profileLink}`);
            }
        } catch (e) { 
            console.log(e, profileLink);
        }
        if(count >= config.totalComments) break;
    }
    console.log(`Total Liked: ${count}`);
    await browser.close();
};