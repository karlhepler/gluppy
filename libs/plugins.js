module.exports = require('gulp-load-plugins')({
    DEBUG: false,
    pattern: [
        'gulp-*',
        'yargs',
        'extend',
        'browser-sync',
        'main-bower-files',
        'path'
    ],
    scope: ['dependencies'],
    rename: {
        'gulp-if': 'gif',
        'main-bower-files': 'bower'
    }
});
