const gulp = require('gulp');
const shell = require('gulp-shell');

gulp.task('update', shell.task(['npm  update sharemyscreen-common', 'npm  update sharemyscreen-http-helper']));
