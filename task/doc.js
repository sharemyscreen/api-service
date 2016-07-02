const fs = require('fs');
const gulp = require('gulp');
const docGen = require('api-doc-generator');

gulp.task('doc', function (done) {
  const pkg = JSON.parse(fs.readFileSync('./package.json'));

  docGen.generateDocumentation('./api-service.yaml', './CHANGELOG.md', pkg.version, './doc/', done);
});
