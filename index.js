const yargs = require('yargs');
const { initializeBrowser, loginInsta, openTagPage, openProfilePage, getPostLinks, commentOnPosts, 
    getFollowers, getPostLikes, likePostsOfProfiles, shareMessageToProfiles, likeEngageGroup } = require('./utils');

const runAutomation = async (type, slice, index) => {
    const { browser, page } = await initializeBrowser();
    await loginInsta(page);
    if (type === 1) {
        await openTagPage(page);
        let postLinks = await getPostLinks(page);
        postLinks = postLinks.slice(...slice);
        await commentOnPosts(page, postLinks);
    } else if (type === 2) {
        await openProfilePage(page);
        let profileLinks = await getFollowers(page);
        profileLinks = profileLinks.slice(...slice);
        await likePostsOfProfiles(page, profileLinks);
    } else if (type === 3){
        await openProfilePage(page);
        const postLinks = await getPostLinks(page, true);
        for(postLink of postLinks){
            const profileLinks = await getPostLikes(page, postLink);
            await likePostsOfProfiles(page, profileLinks);
        }
    } else if(type === 4){
        await openProfilePage(page);
        let profileLinks = await getFollowers(page);
        profileLinks = profileLinks.slice(...slice);
        await likePostsOfProfiles(page, profileLinks, true);
    } else if (type === 5) {
        await openProfilePage(page);
        const profileLinks = await getFollowers(page);
        await shareMessageToProfiles(browser, page, profileLinks);
    } else if(type === 6) {
        await likeEngageGroup(page,index);
    }
    await browser.close();
};

(async () => {
    const argv = yargs
        .options({
            'a': { 
                array: true, default: [], number: true,
                describe: `Run Automations: 
                1. commentTags.
                2. likeFollowers.
                3. likePostLikes,
                4. likeCommentFollowers,
                5. shareMessage,
                6. likeEngageGroup`
            },
            'índex': {number: true},
            'slice': { default: [0], array: true, describe: `Use this option to process only a part. Usage --slice 10 20 to process from 10th to 19th item.`, number: true}
        }).argv;
    console.log(argv);
    for (type of yargs.argv.a) {
        await runAutomation(type,yargs.argv.slice, yargs.argv.índex);
    }
})();