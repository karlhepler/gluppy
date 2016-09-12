'use strict';

let gulp = require('gulp');
let plugins = require('./libs/plugins');
let defaults = require('./libs/defaults');
let options;

/**
 * Gluppy!
 *
 * @param  {object} paths
 * @param  {object} config
 */
module.exports = function gluppy(paths, config) {
    // Make sure the paths object is correctly formatted
    enforcePaths(paths);

    // Define options as an extension of config & defaults
    options = plugins.extend(true, {}, defaults, config || {});
    
    // Set the plumber error handler
    options.plumber.errorHandler = handleGulpErrors;

    // Set the paths on options
    options.paths = paths;

    // Create the tasks
    gulp.task('default', compile);
    gulp.task('watch', ['default'], watch);
};

/**
 * Compile the scripts
 *
 * @return {stream}
 */
function compile() {
    const filter = {
        src: plugins.filter(options.paths.src, { restore: true })
    };

    return gulp.src(bowerFiles().concat(options.paths.src))

        // Handle all errors via plumber - preventing broken pipes
        .pipe(plugins.plumber(options.plumber))

        // Source files only
        .pipe(filter.src)

        // Initialize Source Maps
        .pipe(plugins.gif(isDev() || useSourcemaps(),
            plugins.sourcemaps.init()
        ))

        // Only pass through changed files
        .pipe(plugins.cached('scripts'))

        // JS Hint
        .pipe(plugins.jshint(options.jshint))
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'))

        // Compile ES2015
        .pipe(plugins.babel({
            presets: ['es2015']
        }))

        // Bring back all files
        .pipe(plugins.remember('scripts'))

        // Restore everything
        .pipe(filter.src.restore)

        // Concatinate all files for dist
        .pipe(plugins.gif(isDist(),
            plugins.concat(plugins.path.basename(options.paths.dest.dist))
        ))

        // Concatinate all files for dev
        .pipe(plugins.gif(isDev(),
            plugins.concat(plugins.path.basename(options.paths.dest.dev))
        ))

        // Minify them in production
        .pipe(plugins.gif(isDist(),
            plugins.uglify(options.uglify)
        ))

        // Write the sourcemaps
        .pipe(plugins.gif(isDev() || useSourcemaps(),
            plugins.sourcemaps.write()
        ))

        // Save the file for dist
        .pipe(plugins.gif(isDist(),
            gulp.dest(plugins.path.dirname(options.paths.dest.dist))
        ))

        // Save the file for dev
        .pipe(plugins.gif(isDev(),
            gulp.dest(plugins.path.dirname(options.paths.dest.dev))
        ))

        // Notify of completion
        .pipe(plugins.notify({
            title: 'Scripts Compiled',
            message: `Environment: ${isDist() ? 'Distribution' : 'Development'}`
        }));
}

/**
 * Watch for changes!
 *
 * @return {void}
 */
function watch() {
    // Start browserSync
    plugins.browserSync.init(options.browserSync);

    // Build when the scripts change
    gulp.watch(options.paths.src, ['default'])
        .on('change', function scriptsChanged(event) {
            // Clear caches if something is deleted
            if (event.type == 'deleted') {
                delete plugins.cached.caches['scripts'][event.path];
                plugins.remember.forget('scripts', event.path);
            }
        });

    // Build when bower changes,
    // only if we haven't disabled includes
    if (! isRunningSolo()) {
        gulp.watch(bowerFiles(), ['default']);
    }

    // Reload the browser after the builds change
    gulp.watch([options.paths.dest.dev, options.paths.dest.dist], plugins.browserSync.reload)
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

/**
 * Handle gulp errors!
 */
function handleGulpErrors(error) {
    // Configure the error message
    plugins.notify.onError({
        title: `${error.name}: ${error.plugin}`,
        message: `
----------------------
<%= error.message %>
<%= error.fileName %>
----------------------
<%= error.cause %>
        `,
    })(error);

    // Tell gulp to go to the end
    this.emit('end');
}

/**
 * Make sure the paths are set properly
 *
 * @param  {object} paths
 *
 * @return {void}
 *
 * @throws {exception} If paths are invalid
 */
function enforcePaths(paths) {
    if (! pathsAreValid(paths)) {
        throw `------------------------------------
Paths must be relative and
must set in the following format:
------------------------------------
{
    src: <string|array>,
    dest {
        dev: <string>,
        dist: <string>
    }
}
------------------------------------`;
    }
}

/**
 * Determine if the paths are valid
 *
 * @param  {object} paths
 *
 * @return {boolean}
 */
function pathsAreValid(paths) {
    // Get the result of the formatting checks
    let formatResult = typeof paths === 'object'
        && (typeof paths.src === 'string' || Array.isArray(paths.src))
        && typeof paths.dest === 'object'
        && typeof paths.dest.dev === 'string'
        && typeof paths.dest.dist === 'string';

    // If the formatting checks failed, return false
    if (! formatResult) {
        return false;
    }

    // Create a relative paths array
    // based on the src paths
    let relativePaths = Array.isArray(paths.src) ? paths.src : [paths.src];

    // Push in dest paths
    relativePaths.push(paths.dest.dev);
    relativePaths.push(paths.dest.dist);

    // Go through each relative path & return false if it's absolute
    for (var i = 0; i < relativePaths.length; i++) {
        if (plugins.path.isAbsolute(relativePaths[i])) {
            return false;
        }
    }

    // We got this far, so we're good!
    return true;
}

/**
 * Determine if this is dist
 *
 * @return {Boolean}
 */
function isDist() {
    return plugins.yargs.argv.distribution
        || plugins.yargs.argv.distro
        || plugins.yargs.argv.dist;
}

/**
 * Determine if this is dev
 *
 * @return {Boolean}
 */
function isDev() {
    return !isDist();
}

/**
 * Determine if we need to use sourcemaps
 *
 * @return {Boolean}
 */
function useSourcemaps() {
    return plugins.yargs.argv.sourcemaps;
}

/**
 * Get the bower files
 *
 * @return {array}
 */
function bowerFiles() {
    // Return an empty array if we have disabled includes
    if (isRunningSolo()) {
        return [];
    }

    return plugins.bower(options.bower).map(function(path) {
        return plugins.path.relative(process.cwd(), path);
    })
}

/**
 * Determine if we should ignore includes
 * during the compilation process
 *
 * @return {boolean}
 */
function isRunningSolo() {
    return plugins.yargs.argv.solo;
}
