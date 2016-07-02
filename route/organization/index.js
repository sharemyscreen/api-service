const passport = require('passport');
const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');
const mqMaster = require('../../mq/master');
const organizationMember = require('./member');

function registerRoute (router) {
  router.post('/organizations', passport.authenticate('bearer', { session: false }), createOrganization);
  router.get('/organizations', passport.authenticate('bearer', { session: false }), getUserOrganization);

  router.get('/organizations/:id', passport.authenticate('bearer', { session: false }), getOrganizationInformation);
  router.patch('/organizations/:id', passport.authenticate('bearer', { session: false }), updateOrganization);
  router.delete('/organizations/:id', passport.authenticate('bearer', { session: false }), deleteOrganization);

  organizationMember.registerRoute(router);
}

function getUserOrganization (req, res, next) {
  var reply = [];
  if (req.user.organizations.length > 0) {
    req.user.organizations.forEach(function (organization, i) {
      common.organizationModel.getByIdDepth(organization, function (err, fOrg) {
        if (err) {
          next(err);
        } else {
          reply.push(fOrg.safePrint(true));
          if (i === req.user.organizations.length - 1) {
            httpHelper.sendReply(res, 200, reply, next);
          }
        }
      });
    });
  } else {
    httpHelper.sendReply(res, 200, reply, next);
  }
}

function getOrganizationInformation (req, res, next) {
  common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg) {
      httpHelper.sendReply(res, 200, fOrg.safePrint(false), next);
    } else {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    }
  });
}

function createOrganization (req, res, next) {
  if (req.body.name === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidRequestError());
  } else {
    common.organizationModel.createNew(req.body.name, req.user, function (err, cOrg) {
      if (err) {
        next(err);
      } else {
        mqMaster.notifyOrganizationCreation(cOrg.safePrint(false));
        httpHelper.sendReply(res, 201, cOrg.safePrint(true), next);
      }
    });
  }
}

function updateOrganization (req, res, next) {
  if (req.body.name === undefined) {
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
        fOrg.name = req.body.name;
        fOrg.save(function (err) {
          if (err) {
            next(err);
          } else {
            httpHelper.sendReply(res, 200, fOrg.safePrint(true), next);
          }
        });
      }
    });
  }
}

function deleteOrganization (req, res, next) {
  common.organizationModel.getByPublicId(req.params.id, function (err, fOrg) {
    if (err) {
      next(err);
    } else if (fOrg == null) {
      httpHelper.sendReply(res, httpHelper.error.organizationNotFound());
    } else if (fOrg.owner.publicId !== req.user.publicId) {
      httpHelper.sendReply(res, httpHelper.error.unauthorizedOrganizationAction());
    } else {
      fOrg.destroy(function (err) {
        if (err) {
          next(err);
        } else {
          mqMaster.notifyOrganizationDeletion(fOrg.safePrint(false));
          httpHelper.sendReply(res, 200, {}, next);
        }
      });
    }
  });
}

module.exports.registerRoute = registerRoute;
