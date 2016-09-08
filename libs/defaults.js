module.exports = {
    jshint: {
        esversion: 6,
        laxbreak: true,
        "-W086": true, // Allow switch/case fall-through
        "-W027": true  // Allow early return before if statements
    },
    plumber: {},
    browserSync: {},
    bower: {},
    uglify: {}
};
