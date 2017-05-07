var gulp = require('gulp');
var minify = require('gulp-minify');

gulp.task('compress', function() {
  gulp.src('dist/bundles/*.js')
    .pipe(minify({
        noSource: true,
        ext: {
            min:'.min.js'
        }
    }))
    .pipe(gulp.dest('dist/bundles/'))
});
