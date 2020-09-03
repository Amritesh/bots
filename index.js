const config = require('./config');
const yargs = require('yargs');
const {commentTags} = require('./commentTags');
const {likePosts} = require('./likePosts');
(async () => {
    const argv = yargs.argv;
    if(argv._.includes('commentTags')) await commentTags(config);
    if(argv._.includes('likePosts')) await likePosts(config);
})();