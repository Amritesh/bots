const yargs = require('yargs');
const { initializeBrowser, loginInsta, openTagPage, openProfilePage, getPostLinks, commentOnPosts, 
    getFollowers, getPostLikes, likePostsOfProfiles, shareMessageToProfiles } = require('./utils');

const runAutomation = async (type) => {
    const { browser, page } = await initializeBrowser();
    await loginInsta(page);
    if (type === "commentTags") {
        await openTagPage(page);
        const postLinks = await getPostLinks(page);
        await commentOnPosts(page, postLinks);
    } else if (type === "likeFollowers") {
        await openProfilePage(page);
        const profileLinks = await getFollowers(page);
        await likePostsOfProfiles(page, profileLinks);
    } else if (type === "likePostLikes"){
        await openProfilePage(page);
        const postLinks = await getPostLinks(page, true);
        for(postLink of postLinks){
            const profileLinks = await getPostLikes(page, postLink);
            await likePostsOfProfiles(page, profileLinks);
        }
    } else if(type === "likeCommentFollowers"){
        await openProfilePage(page);
        const profileLinks = await getFollowers(page);
        await likePostsOfProfiles(page, profileLinks, true);
    } else if (type === "shareMessage") {
        await openProfilePage(page);
        const profileLinks = await getFollowers(page);
        await shareMessageToProfiles(browser, page, profileLinks);
    }
    await browser.close();
};

(async () => {
    for (type of yargs.argv._) {
        await runAutomation(type);
    }
})();