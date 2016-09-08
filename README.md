# gluppy
A simpler js-only implementation of glup

## Setup Your Gulp File
```javascript
var gluppy = require('../gluppy');

gluppy({
    src: `scripts/**/*.js`,
    build: {
        dev: `build.dev.js`,
        prod: `build.prod.js`
    }
});
```

## Run Gulp

1. Normal development build `gulp`
2. Minified production build `gulp --production`
3. Force sourcemaps on production builds `gulp --production --sourcemaps`
