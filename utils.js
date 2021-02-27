const secret = require('./secret');

var path = require('path');
if (process.pkg) {
    var puppeteer = require(path.resolve(process.cwd(), 'puppeteer'));
} else {
    var puppeteer = require('puppeteer')
};
const config = require('./config');
const fs = require('fs');

const initializeBrowser = async () => {
    const browser = await puppeteer.launch({
        // executablePath: await chromium.executablePath,
        headless: false,
        devtools: false
    });
    console.log(browser);
    const page = (await browser.pages())[0];
    return { browser, page };
}

const loginInsta = async (page) => {
    const { homeurl } = config;
    await page.goto(homeurl, { waitUntil: 'networkidle2' });
    await page.waitForSelector("input[name*='username']");
    await page.type("input[name*='username']", secret.username);
    await page.type("input[name*='password']", secret.password);
    await page.click('[type="submit"]');
    await clickNotNow(page);
    await clickNotNow(page);
}

const promptloginInsta = async (page) =>{
    const { homeurl } = config;
    await page.goto(homeurl, { waitUntil: 'networkidle2' });
}

const clickNotNow = async (page) => {
    await page.waitForXPath("//button[contains(., 'Not Now')]");
    const [button] = await page.$x("//button[contains(., 'Not Now')]");
    button && await button.click();
}

const openTagPage = async (page) => {
    const { tags, tagurl } = config;
    const tagpage = tagurl + tags[Math.floor(Math.random() * tags.length)];
    await page.goto(tagpage, { waitUntil: 'networkidle2' });
}

const openProfilePage = async (page) => {
    const { profile, homeurl } = config;
    const profilePage = homeurl + profile;
    await page.goto(profilePage, { waitUntil: 'networkidle2' });
}

const getDialogLinks = async (page, selector) => {
    const { scrollCount } = config;
    await page.waitForSelector(selector);
    const allLinks = await scrollAndGetLinks(page, scrollCount, selector);
    const ignoreTill = allLinks.lastIndexOf("https://www.instagram.com/directory/hashtags/") + 1;
    return allLinks.splice(ignoreTill);
}

const getFollowers = async (page) => {
    await page.waitForXPath("//a[contains(., 'followers')]",{timeout: 0});
    const [button] = await page.$x("//a[contains(., 'followers')]");
    button && await button.click();
    return await getDialogLinks(page, "div[role=dialog] div div:nth-child(2)");
}

const getPostLikes = async (page, postLink) => {
    await page.goto(postLink, { waitUntil: 'networkidle2' });
    await page.waitForXPath("//button[contains(., ' others')]");
    const [button] = await page.$x("//button[contains(., ' others')]");
    button && await button.click();
    return await getDialogLinks(page, "div[role=dialog] div div:nth-child(2) div");
}

const getPostLinks = async (page, noScroll) => {
    let { posturl, scrollCount } = config;
    noScroll && (scrollCount = 0);
    const allLinks = await scrollAndGetLinks(page, scrollCount);
    const posturlRE = new RegExp(posturl, "g");
    return allLinks.filter(link => link.match(posturlRE));
}

const scrollAndGetLinks = async (page, scrollCount, selector) => {
    return await page.evaluate(async (scrollCount, selector) => {
        let dom = window;
        selector && (dom = document.querySelector(selector));
        console.log(dom)
        const allLinks = await new Promise((resolve, reject) => {
            let count = 0;
            const distance = 1000;
            let allLinks = [];
            const timer = setInterval(() => {
                const htmlCollection = document.getElementsByTagName('a');
                const links = Array.prototype.slice.call(htmlCollection).map(b => b.href);
                allLinks = Array.from(new Set([...allLinks, ...links]));
                count++;
                if (scrollCount < count) {
                    clearInterval(timer);
                    resolve(allLinks);
                }
                dom.scrollBy(0, distance);
            }, Math.random() * 2000 + 2000);
        });
        return allLinks;
    }, scrollCount, selector);
}

const getVisitedPosts = () => {
    const { logFile } = config;
    let visitedPosts = [];
    fs.readFile(logFile, 'utf-8', function(err, content) {
        visitedPosts = content.split('\n').filter(Boolean).map(line => JSON.parse(line));
    });
    return visitedPosts;
}

const getComment = () => {
    const { comments, smileys } = config;
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    const smileyString = [0, 1, 2].map(_ => smileys[Math.floor(Math.random() * smileys.length)]).join('');
    return randomComment.split(":smileys:").join(smileyString);
}

const postComment = async (page) => {
    const comment = getComment();
    await page.type("textarea", comment);
    const [button] = await page.$x("//button[contains(., 'Post')]");
    await page.waitFor(Math.random() * 1000 + 10000);
    button && await button.click();
    await page.waitFor(Math.random() * 2000 + 5000);
}

const commentOnPost = async (page, postLink, visitedPosts) => {
    const { logFile } = config;
    let count = 0;
    if (!visitedPosts.find(post => post.postLink === postLink)) {
        await page.goto(postLink, { waitUntil: 'networkidle2' });
        const [profileRef] = await page.$x("//button[contains(., 'Follow')]/../../div[1]/span/a");
        const profileLink = await page.evaluate(el => el.href, profileRef);
        if (!visitedPosts.find(post => post.profileLink === profileLink)) {
            const post = { postLink, profileLink };
            await postComment(page);
            console.log(`Posted ${postLink}`);
            visitedPosts.push(post);
            fs.appendFile(logFile, JSON.stringify(post) + "\n", () => {});
            count++;
        } else {
            console.log(`Skipped ${profileLink}`);
        }
    } else {
        console.log(`Skipped ${postLink}`);
    }
    return count;
}

const commentOnPosts = async (page, postLinks) => {
    const { totalComments } = config;
    const visitedPosts = getVisitedPosts();
    let count = 0;
    console.log("Total Posts Found:", postLinks.length);
    for (postLink of postLinks) {
        try {
            if(!page.isClosed()){
                count += await commentOnPost(page, postLink, visitedPosts);
            }
        } catch (e) { console.log(e, postLink); }
        if (count >= totalComments) break;
    }
    console.log(`Total Comments posted: ${count}`);
}

const likePost = async (page) => {
    await page.waitForSelector("svg");
    await page.waitFor(Math.random() * 5000 + 10000);
    const liked = await page.evaluate(async () => {
        const unLikeButton = document.querySelector("svg[aria-label='Unlike']");
        if (unLikeButton) return false;
        const likeButton = document.querySelector("svg[aria-label='Like']");
        likeButton && likeButton.parentElement.click();
        return true;
    });
    return liked;
}

const likePostsOfProfile = async (page, profileLink, visitedPosts) => {
    const { recentPostsLimit, logFile } = config;
    let count = 0;
    console.log("Visiting profile", profileLink);
    await page.goto(profileLink, { waitUntil: 'networkidle2' });
    let postLinks = await getPostLinks(page, true);
    postLinks = postLinks.slice(0, recentPostsLimit);
    console.log("Total Posts Found:", postLinks.length);
    for (postLink of postLinks) {
        if (!visitedPosts.find(post => post.postLink === postLink)) {
            await page.goto(postLink, { waitUntil: 'networkidle2' });
            const post = { postLink, profileLink };
            const liked = await likePost(page);
            if (liked) {
                console.log(`Liked ${postLink}`);
                visitedPosts.push(post);
                fs.appendFile(logFile, JSON.stringify(post) + "\n", () => {});
                count++;
            } else {
                console.log(`Skipped ${postLink} already liked.`);
            }
        } else {
            console.log(`Skipped ${postLink} already logged.`);
        }
    }
    return count;
}

const likePostsOfProfiles = async (page, profileLinks) => {
    const { totalLikes } = config;
    const visitedPosts = getVisitedPosts();
    let count = 0;
    console.log("Total Profiles Found:", profileLinks.length);
    for (profileLink of profileLinks) {
        try {
            if(!page.isClosed()){
                count += await likePostsOfProfile(page, profileLink, visitedPosts);
            }
        } catch (e) {
            console.log(e, profileLink);
        }
        if (count >= totalLikes) break;
    }
    console.log(`Total Liked: ${count}`);
}

const shareMessageToProfile = async (browser, page, profileLink) => {
    const { message} = config;
    await page.goto(profileLink, { waitUntil: 'networkidle2' });
    const [button] = await page.$x("//button[contains(., 'Message')]");
    if(button){
        await button.click();
        await page.waitFor(Math.random() * 1000 + 1000);
        const [textarea] = await page.$x("//textarea");
        await page.type("textarea", message);
        await page.waitFor(Math.random() * 1000 + 10000);
        const [send] = await page.$x("//button[contains(., 'Send')]");
        send && await send.click();
        await page.waitFor(Math.random() * 2000 + 2000);
        return 1;
    } else{
        return 0;
    }
}

const shareMessageToProfiles = async (browser, page, profileLinks) => {
    let count = 0;
    console.log("Total Profiles Found:", profileLinks.length);
    for (profileLink of profileLinks) {
        try {
            if(!page.isClosed()){
                count += await shareMessageToProfile(browser, page, profileLink);
            }
        } catch (e) {
            console.log(e, profileLink);
        }
    }
    console.log(`Total Messages shared: ${count}`);
}

module.exports = { initializeBrowser, loginInsta, openTagPage, openProfilePage, getFollowers, 
    getPostLinks, commentOnPosts, likePostsOfProfiles, getPostLikes, shareMessageToProfiles,
    promptloginInsta } 