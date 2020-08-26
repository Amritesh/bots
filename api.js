exports.autoScroll = async (page, scrollCount) => {
    return await page.evaluate(async ({scrollCount}) => {
        let allLinks = await new Promise((resolve, reject) => {
            let count = 0;
            let distance = 2000;
            let allLinks = [];
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                count++;
                const htmlCollection = document.getElementsByTagName('a')
                const links = Array.prototype.slice.call( htmlCollection ).map(b=>b.href);
                allLinks = Array.from(new Set([...allLinks, ...links]));
                if(scrollCount<count){
                    clearInterval(timer);
                    resolve(allLinks);
                }
            }, Math.random()*2000+2000);
        });
        return allLinks;
    }, {scrollCount});
}