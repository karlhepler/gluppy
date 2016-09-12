# gluppy
A simpler js-only implementation of glup

## Setup Your Gulp File
```javascript
var gluppy = require('../gluppy');

// Need to specify the paths
var paths = {
    src: `scripts/**/*.js`,
    dest: {
        dev: `build.dev.js`,
        dist: `build.dist.js`
    }
};

// Check libs/defaults for what can be set
var options = {
    //
};

gluppy(paths, options);
```

## Run Gulp

1. Normal development build `gulp`
2. Minified distribution build `gulp --[distribution|distro|dist]`
3. Force sourcemaps on distribution builds `gulp --[distribution|distro|dist] --sourcemaps`
