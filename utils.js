const clickNotNow = async (page) => {
    await page.waitForXPath("//button[contains(., 'Not Now')]");
    const [button] = await page.$x("//button[contains(., 'Not Now')]");
    button && await button.click();
}

exports.loginInsta = async (page, config, secret) => {
    await page.goto(config.homeurl, { waitUntil: 'networkidle2' });
    await page.waitForSelector("input[name*='username']");
    await page.type("input[name*='username']", secret.username);
    await page.type("input[name*='password']", secret.password);
    await page.click('[type="submit"]');
    await clickNotNow(page);
    await clickNotNow(page);
}

const getComment = (config) => {
    const {comments, smileys} = config;
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    const smileyString = [0,1,2,3,4].map(_=>smileys[Math.floor(Math.random() * smileys.length)]).join('');
    return randomComment.split(":smileys:").join(smileyString);
}

exports.postComment = async (page, comment) => {
    const comment = getComment(config);
    await page.type("textarea", comment);
    const [button] = await page.$x("//button[contains(., 'Post')]");
    await page.waitFor(Math.random()*1000+1000);
    button && await button.click();
    await page.waitFor(Math.random()*2000+2000);
}