const passport = require('passport');
const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');

function registerRoute (router) {
  router.get('/organizations/:id/rooms', passport.authenticate('bearer', { session: false }), getRooms);
}

function getRooms (req, res, next) {
  common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg == null) {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    } else if (req.user.organizations.indexOf(fOrg._id) === -1) {
      httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationDisplay());
    } else {
      httpHelper.sendReply(res, 200, fOrg.safePrint().rooms);
    }
  });
}

module.exports.registerRoute = registerRoute;
