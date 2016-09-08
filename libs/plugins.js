module.exports = require('gulp-load-plugins')({
    DEBUG: false,
    pattern: [
        'gulp-*',
        'yargs',
        'extend',
        'browser-sync',
        'bower-files',
        'path'
    ],
    scope: ['dependencies'],
    rename: {
        'gulp-if': 'gif',
        'bower-files': 'bower'
    }
});
