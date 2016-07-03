const passport = require('passport');
const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');

function registerRoute (router) {
  router.get('/organizations/:id/rooms', passport.authenticate('bearer', { session: false }), getRooms);
  router.get('/organizations/:orgid/rooms/:roomid', passport.authenticate('bearer', { session: false }), getRoom);
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

function getRoom (req, res, next) {
  common.organizationModel.getByPublicId(req.params.orgid, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg == null) {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    } else if (req.user.organizations.indexOf(fOrg._id) === -1) {
      httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationDisplay());
    } else {
      var found = false;
      fOrg.rooms.forEach(function (room) {
        if (room.publicId === req.params.roomid) {
          found = true;
          httpHelper.sendReply(res, 200, room.safePrint());
        }
      });
      if (found === false) {
        httpHelper.sendReply(res, httpHelper.error.roomNotFound());
      }
    }
  });
}

module.exports.registerRoute = registerRoute;
