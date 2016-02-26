var CFG = require('./cfg.json');

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({rename: {'gulp-file-include': 'fileinclude'}}),
    fs = require('fs');

gulp.task('bower', gulp.series(
  $.shell.task(['bower install']),
  function copy_bower_files() {
    var bower = require('./bower.json');
    var path = CFG.PATH_SRC + 'vendor';
    var bower_item_files = [];
    for( var bower_item in bower.dependencies ) {
      var bower_item_data = require('./bower_components/' + bower_item + '/bower.json');
      var bower_item_src = [].concat(bower_item_data.main);
      var bower_item_file = 'bower_components/' + bower_item + '/' + bower_item_src[0];
      bower_item_files.push(bower_item_file);
    }
    return gulp.src(bower_item_files)
    .pipe(gulp.dest(function(file) {
      return file.extname == '.js' ? path + '/js' :
        file.extname == '.css' ? path + '/css' : path;
    }));
  }
));

gulp.task('style', function() {
  var autoprefixer = require('autoprefixer');
  return gulp.src(CFG.PATH_SRC + 'less/style.less')
    .pipe($.sourcemaps.init())
    .pipe($.less())
    .pipe($.postcss([ autoprefixer({ browsers: ['last 4 versions'] }) ]))
    .pipe($.cssnano())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(CFG.PATH_DIST + CFG.DIST_DIR_CSS));
});

gulp.task('imgmin', function() {
  var pngquant = require('imagemin-pngquant');
  return gulp.src(CFG.PATH_SRC + 'images/**')
    .pipe($.newer(CFG.PATH_DIST + CFG.DIST_DIR_IMG))
    .pipe($.imagemin({
        progressive: true,
        use: [pngquant()]
    }))
    .pipe(gulp.dest(CFG.PATH_DIST + CFG.DIST_DIR_IMG));
});

gulp.task('html', function() {
  return gulp.src(CFG.PATH_SRC + 'html/*.html')
    .pipe($.fileinclude({
      prefix: '@@',
      basepath: '@file',
      context: {
        path: CFG.PATH_IN_FILES,
        csspath: CFG.PATH_IN_FILES + CFG.DIST_DIR_CSS,
        jspath: CFG.PATH_IN_FILES + CFG.DIST_DIR_JS,
        jquery: CFG.OPTIONS.JQUERY,
        jquery_version: CFG.OPTIONS.JQUERY_VERSION
      }
    }))
    .pipe(gulp.dest(CFG.PATH_DIST));
});

gulp.task('js', function() {
  return gulp.src(CFG.PATH_SRC + 'js/main.js')
    .pipe($.fileinclude())
    .pipe($.uglify())
    .pipe(gulp.dest(CFG.PATH_DIST + CFG.DIST_DIR_JS));
});

gulp.task('assets', function() {
  return gulp.src(CFG.PATH_SRC + 'assets/**/*.*')
    .pipe(gulp.dest(CFG.PATH_DIST));
});

gulp.task('watch', function() {
  gulp.watch(CFG.PATH_SRC + 'images/**', gulp.series('imgmin'));
  gulp.watch(CFG.PATH_SRC + 'html/**/*.html', gulp.series('html'));
  gulp.watch(CFG.PATH_SRC + 'less/**/*.less', gulp.series('style'));
  gulp.watch(CFG.PATH_SRC + 'js/**/*.js', gulp.series('js'));
  gulp.watch(CFG.PATH_SRC + 'assets/**/*.*', gulp.series('assets'));
});

gulp.task('serve', gulp.parallel(
  ['watch'], 
  function() {
    var browserSync = require('browser-sync').create();
    browserSync.init({server: CFG.PATH_DIST});
    browserSync.watch(CFG.PATH_DIST + '**/*.*').on('change', browserSync.reload);
  }
));

gulp.task('path', function(cb) {
  fs.writeFileSync(CFG.PATH_SRC + 'less/_path.less', '@path_prefix: "' + CFG.PATH_IN_FILES + '";');
  cb();
});

gulp.task('build', gulp.parallel(
  'style', 'html', 'imgmin', 'js', 'assets'
));

gulp.task('init', gulp.series(
  gulp.parallel('bower', 'path'), 
  'build'
));

gulp.task('default', function(cb) {
  console.log('-----------------------------------------------------------');
  console.log('gulp init    install bower components');
  console.log('             copy bower files, build html, css and js files');
  console.log('             copy all files from assets to public');
  console.log('-----------------------------------------------------------');
  console.log('gulp serve   run browser-sync');
  console.log('             run html, css and js watchers');
  console.log('-----------------------------------------------------------');
  cb();
});