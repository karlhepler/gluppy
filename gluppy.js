'use strict';

var gulp = require('gulp');
var plugins = require('./libs/plugins');
var defaults = require('./libs/defaults');
var options;

/**
 * Define & export GLUPPY!
 *
 * @param  {object} paths
 * @param  {object} config
 *
 * @return {function}
 */
module.exports = function gluppy(paths, config) {
    enforcePaths(paths);

    // Define options as an extension of config & defaults
    options = plugins.extend(true, {}, defaults, config || {});
    
    // Set the plubmer error handler
    options.plumber.errorHandler = handleGulpErrors;

    // Setup options.all, which includes bower plugins
    options.all = plugins.bower(options.bower).dev().ext('js').files.concat(paths.src);

    // Setup options.src & options.dst
    options.src = paths.src;
    options.build = paths.build;

    // Create the tasks
    gulp.task('scripts', compileScripts);
    gulp.task('watch', ['default'], gulpWatch);
    gulp.task('default', ['scripts']);
};

/**
 * Compile the scripts!
 */
function compileScripts() {
    // Set up the filter
    const filter = plugins.filter(options.src, {restore: true});

    // Set easy env ref vars
    const isProd = plugins.yargs.argv.production === true;
    const isDev = !isProd;
    const useSourcemaps = plugins.yargs.argv.sourcemaps === true;

    // COMPILE!
    return gulp.src(options.all)
        // Handle all errors via plumber - preventing broken pipes
        .pipe(plugins.plumber(options.plumber))

        // Only pass through changed files
        .pipe(plugins.cached('scripts'))

        // Filter out all the bower files.
        // We don't need sourcemaps, hinting, or ES2015 for bower files.
        .pipe(filter)

        // JS Hint
        .pipe(plugins.jshint(options.jshint))
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'))

        // Initialize Source Maps
        .pipe(plugins.gif(isDev || useSourcemaps, plugins.sourcemaps.init()))

        // Compile ES2015
        .pipe(plugins.babel({
            presets: ['es2015']
        }))

        // Bring back all of the bower files
        .pipe(filter.restore)

        // Bring back all files, including the files that haven't changed
        .pipe(plugins.remember('scripts'))

        // Concatinate all files
        .pipe(plugins.gif(isProd, plugins.concat(plugins.path.basename(options.build.prod))))
        .pipe(plugins.gif(isDev, plugins.concat(plugins.path.basename(options.build.dev))))

        // Minify the concatinated file
        .pipe(plugins.gif(isProd, plugins.uglify(options.uglify)))

        // Write the sourcemaps
        .pipe(plugins.gif(isDev || useSourcemaps, plugins.sourcemaps.write()))

        // Save the file
        .pipe(plugins.gif(isProd, gulp.dest(plugins.path.dirname(options.build.prod))))
        .pipe(plugins.gif(isDev, gulp.dest(plugins.path.dirname(options.build.dev))))

        // Notify of completion
        .pipe(plugins.notify({
            title: 'Scripts Compiled',
            message: `Environment: ${isProd ? 'Production' : 'Development'}`
        }));
}

/**
 * Watch for changes!
 */
function gulpWatch() {
    // Start browserSync
    plugins.browserSync.init(options.browserSync);

    // Build when the scripts change
    gulp.watch(options.src, ['scripts'])
        .on('change', function scriptsChanged(event) {
            // Clear caches if something is deleted
            if (event.type == 'deleted') {
                delete plugins.cached.caches.scripts[event.path];
                plugins.remember.forget('scripts', event.path);
            }
        });

    // Reload the browser after the builds change
    gulp.watch([options.build.dev, options.build.prod], plugins.browserSync.reload)
}

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
        throw `
            Paths must be relative and
            must set in the following format:

            {
                src: <string|array>,
                build {
                    dev: <string>,
                    prod: <string>
                }
            }
        `;
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
        && typeof paths.build === 'object'
        && typeof paths.build.dev === 'string'
        && typeof paths.build.prod === 'string';

    // If the formatting checks failed, return false
    if (! formatResult) {
        return false;
    }

    // Create a relative paths array
    // based on the src paths
    let relativePaths = Array.isArray(paths.src)
        ? paths.src
        : [paths.src];

    // Push in build paths
    relativePaths.push(paths.build.dev);
    relativePaths.push(paths.build.prod);

    // Go through each relative path & return false if it's absolute
    for (var i = 0; i < relativePaths.length; i++) {
        if (plugins.path.isAbsolute(relativePaths[i])) {
            return false;
        }
    }

    // We got this far, so we're good!
    return true;
}
