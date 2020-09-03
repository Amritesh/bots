const config = require('./config');
const yargs = require('yargs');
const {commentTags} = require('./commentTags');
(async () => {
    const argv = yargs.argv;
    if(argv._.includes('commentTags')) await commentTags(config)
})();