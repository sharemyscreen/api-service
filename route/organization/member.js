const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');

function registerRoute (router) {
  router.get('/organizations/:id/members', getMembers);
  router.post('/organizations/:id/members', inviteUser);
  router.delete('/organizations/:id/members/:user_id', kickUser);
}

function getMembers (req, res, next) {
  common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg == null) {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    } else if (req.user.organizations.indexOf(fOrg._id) === -1) {
      httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationDisplay());
    } else {
      httpHelper.sendReply(res, 200, fOrg.safePrint(true).members, next);
    }
  });
}

function inviteUser (req, res, next) {
  if (req.body.user_id === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidRequestError());
  } else {
    common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
      if (err) {
        next(err);
      } else if (fOrg == null) {
        httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
      } else if (fOrg.owner.publicId !== req.user.publicId) {
        httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationAction());
      } else {
        common.userModel.getByPublicId(req.body.user_id, false, function (err, fUser) {
          if (err) {
            next(err);
          } else if (fUser == null) {
            httpHelper.sendReply(res, httpHelper.error.userNotFound());
          } else {
            if (fUser.organizations.indexOf(fOrg._id) !== -1) {
              httpHelper.sendReply(res, httpHelper.error.userAlreadyMember());
            } else {
              fOrg.inviteUser(fUser, function (err) {
                if (err) {
                  next(err);
                } else {
                  httpHelper.sendReply(res, 200, fOrg.safePrint(true).members, next);
                }
              });
            }
          }
        });
      }
    });
  }
}

function kickUser (req, res, next) {
  common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg == null) {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    } else if (fOrg.owner.publicId !== req.user.publicId) {
      httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationAction());
    } else {
      common.userModel.getByPublicId(req.params.user_id, false, function (err, fUser) {
        if (err) {
          next(err);
        } else if (fUser == null) {
          httpHelper.sendReply(res, httpHelper.error.userNotFound());
        } else if (req.user.publicId === fUser.publicId) {
          httpHelper.sendReply(res, httpHelper.error.kickOwnerError());
        } else {
          if (fUser.organizations.indexOf(fOrg._id) === -1) {
            httpHelper.sendReply(res, httpHelper.error.userNotMember());
          } else {
            fOrg.kickUser(fUser, function (err) {
              if (err) {
                next(err);
              } else {
                httpHelper.sendReply(res, 200, fOrg.safePrint(true).members, next);
              }
            });
          }
        }
      });
    }
  });
}

module.exports.registerRoute = registerRoute;
