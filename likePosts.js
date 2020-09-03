const fs = require('fs');
const {initializeBrowser, loginInsta, clickFollowers, scrollAndGetLinks} = require('./utils');
exports.likePosts = async (config) => {
    let visitedPosts = [];
    fs.readFile(config.logFile, 'utf-8', function (err, content) {
        visitedPosts = content.split('\n').filter(Boolean).map(line=>JSON.parse(line));
    });
    const {browser, page, posturl} = await initializeBrowser();
    await loginInsta(page, config);
    const {profiles, homeurl} = config;
    const profilePage = homeurl + profiles[Math.floor(Math.random() * profiles.length)];
    await page.goto(profilePage, { waitUntil: 'networkidle2' });
    await clickFollowers(page);
    const allLinks = await scrollAndGetLinks(page,config);
    await page.waitFor(Math.random()*2000000);
    const posturlRE = new RegExp(posturl, "g");
    const followers = allLinks.filter(link => link.match(posturlRE));
    let count = 0;
    console.log("Total Posts Found:", followers.length);
    console.log(followers);
    // for (follower of followers) {
    //     try {
    //         if(!visitedPosts.find(post=>post.postLink === postLink)) {
    //             await page.goto(postLink, { waitUntil: 'networkidle2' });
    //             const [profileRef] = await page.$x("//button[contains(., 'Follow')]/../../div[1]/span/a");
    //             const profileLink = await page.evaluate(el => el.href, profileRef);
    //             if(!visitedPosts.find(post=>post.profileLink === profileLink)){
    //                 const post = {postLink, profileLink};
    //                 await postComment(page, config);
    //                 console.log(`Posted ${postLink}`);
    //                 visitedPosts.push(post);
    //                 fs.appendFile(config.logFile,JSON.stringify(post)+"\n",()=>{});   
    //                 count++;
    //             } else {
    //                 console.log(`Skipped ${profileLink}`);
    //             }
    //         } else {
    //             console.log(`Skipped ${postLink}`);
    //         }
    //     } catch (e) { console.log(e, postLink);}
    //     if(count >= config.totalComments) break;
    // }
    console.log(`Total Comments posted: ${count}`);
    await browser.close();
};