var path = require('path');
const { initializeBrowser, promptloginInsta, getFollowers, shareMessageToProfiles } = require(path.resolve(process.cwd(), 'utils.js'));
(async () => {
    const { browser, page } = await initializeBrowser();
    await promptloginInsta(page);
    const profileLinks = await getFollowers(page);
    await shareMessageToProfiles(browser, page, profileLinks);
    await browser.close();
})();