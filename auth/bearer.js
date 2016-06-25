const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const accessTokenModel = require('sharemyscreen-common').accessTokenModel;

function init () {
  passport.use(new BearerStrategy(function (token, done) {
    accessTokenModel.getByToken(token, function (err, fToken) {
      if (err) {
        done(err);
      } else if (fToken == null) {
        done(null, false);
      } else {
        done(null, fToken.user, { client: fToken.client });
      }
    });
  }));
}

module.exports.init = init;
