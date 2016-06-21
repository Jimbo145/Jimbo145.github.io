// LIBRARIES
// ===================================================
var $ = require('gulp-load-plugins')();
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var headerFooter = require('gulp-headerFooter');
var rimraf = require('rimraf');
var sequence = require('run-sequence');
var webserver = require('gulp-webserver');

// FILE PATHS
// ===================================================
var paths = {
    assets: [
        './client/**/*.*',
        '!./client/assets/{js}/**/*.*'
    ],
    angularJS: [
        'node_modules/angular/angular.js',
        'node_modules/angular-animate/angular-animate.js',
        'node_modules/angular-cookies/angular-cookies.js',
        'node_modules/angular-resource/angular-resource.js',
        'node_modules/angular-sanitize/angular-sanitize.js'
    ],
    // These files include Foundation for Apps and its dependencies (except angular)
    foundationJS: [
        'node_modules/foundation-sites/dist/foundation.js'
    ],
    foundationCSS: [
        'client/assets/css/foundation.css',
    ],
    thirdPartyJS: [
        'node_modules/foundation-sites/vendor/jquery/dist/jquery.js',
        'node_modules/angular-foundation-6/dist/angular-foundation.js'
    ],
    colePickering: [
        'client/assets/js/app.js',
    ]
};

// TASKS
// ===================================================

// Add dependency injection annotations to the source
gulp.task('annotate', function () {
    // todo: change 'your-file-before-annotation' and 'your-non-minified-file' to appropriate file names
    return gulp.src('build/assets/js/cole-pickering.pre.js')
        .pipe($.concat('cole-pickering.js'))
        .pipe($.ngAnnotate({single_quotes: true}))
        .pipe(gulp.dest('./build/assets/js/'));
});

// Builds your entire app once, without starting a server
gulp.task('build', function (cb) {
    sequence('clean', 'sass', 'checkCodeStyle', 'concat', 'copy', 'annotate', 'uglify', cb);
});

// Builds your entire app once, without starting a server
gulp.task('build:noChecks', function (cb) {
    sequence('clean', 'sass', 'concat', 'annotate', 'uglify', cb);
});

// Cleans the build directory
gulp.task('clean', function (cb) {
    rimraf('./build', cb);
});

// top level copy
gulp.task('copy', function (cb) {
     sequence('copy:client', 'copy:foundation', 'copy:thirdParty', cb);
});

// Copies everything in the client folder except templates, Sass, and JS
gulp.task('copy:client', function () {
    return gulp.src(paths.assets, {
            base: './client/'
        })
        .pipe(gulp.dest('./build'))
        ;
});

// Compiles the Foundation for Apps directive partials into a single JavaScript file
gulp.task('copy:foundation', function (cb) {
    gulp.src('node_modules/foundation-sites/js/angular/components/**/*.html')
        .pipe($.ngHtml2js({
            prefix: 'components/',
            moduleName: 'foundation',
            declareModule: false
        }))
        .pipe($.uglify())
        .pipe($.concat('templates.js'))
        .pipe(gulp.dest('./build/assets/js'))
    ;

    //css
    gulp.src(paths.foundationCSS)
        .pipe(gulp.dest('./build/assets/css'))
    ;
    cb();
});

gulp.task('copy:thirdParty', function (cb) {
    gulp.src(paths.thirdPartyJS)
        .pipe(gulp.dest('./build/assets/js'));
    ;
    cb();
});



gulp.task('checkCodeStyle', function (cb) {
    sequence('codeStyle:lint', cb);
});

gulp.task('codeStyle:lint', function () {
    return gulp.src([
            'client/assets/js/**/*.js',
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Concatenates all the source files
gulp.task('concat:application', function (cb) {
    var headerText = "(function(){\n    'use strict';\n\n";
    var footerText = "\n\n}());";

    // todo: change 'your-file-before-annotation' to the file name
    return gulp.src(paths.colePickering)
        .pipe($.concat('cole-pickering.pre.js'))
        .pipe(headerFooter.header(headerText))
        .pipe(headerFooter.footer(footerText))
        .pipe(gulp.dest('./build/assets/js/'))
});

// todo: top level concat
gulp.task('concat', function (cb) {
    sequence('concat:angular', 'concat:foundation', 'concat:application', cb);
});

// concatenate angular paths into a single file
gulp.task('concat:angular', function () {
    return gulp.src(paths.angularJS)
        .pipe($.uglify())
        .pipe($.concat('angular.js'))
        .pipe(gulp.dest('./build/assets/js'))
        ;
});

// Compiles Sass
gulp.task('sass', function (cb) {
    gulp.src('./scss/cole-pickering.scss')
        .pipe($.sass({
            includePaths: paths.sass,
            outputStyle: 'nested',
            errLogToConsole: true
        }))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions', 'ie 10']
        }))
        .pipe(gulp.dest('./build/assets/css'))
        // create minified css
        .pipe($.concat( 'cole-pickering.min.css'))
        .pipe(gulp.dest('./build/assets/css'))
    ;

    // add more sass file compilations here
    cb();
});


// concatenate foundation for apps paths into a single file
gulp.task('concat:foundation', function () {
    return gulp.src(paths.foundationJS)
        .pipe($.uglify())
        .pipe($.concat('foundation.js'))
        .pipe(gulp.dest('./build/assets/js'))
        ;
});

// Compiles and copies the angular JavaScript
gulp.task('uglify:angular', function (cb) {
    return gulp.src(paths.angularJS)
        .pipe($.concat('angular.js'))
        .pipe(gulp.dest('./build/assets/js/'))
        ;
});

// Uglifies the application
gulp.task('uglify', function (cb) {
    sequence('uglify:angular', cb);
});

// Starts a test server, which you can view at http://localhost:8079
gulp.task('server', ['build'], function () {
    gulp.src('./build')
        .pipe($.webserver({
            port: 8079,
            host: 'localhost',
            fallback: 'index.html',
            livereload: false,
            open: false
        }))
    ;
});

gulp.task('default', ['server'], function () {
    // Watch JavaScript
    //gulp.watch(['./client/assets/js/**/*', './js/**/*'], ['build']);

    // Watch static files
    //gulp.watch(['./client/**/*.*', '!./client/templates/**/*.*', '!./client/assets/{scss,js}/**/*.*'], ['copy:client']);
}); 
