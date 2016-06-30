const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');
const organizationMember = require('./member');

function registerRoute (router) {
  router.post('/organizations', createOrganization);
  router.get('/organizations', getUserOrganization);

  router.get('/organizations/:id', getOrganizationInformation);
  router.patch('/organizations/:id', updateOrganization);
  router.delete('/organizations/:id', deleteOrganization);

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
          httpHelper.sendReply(res, 200, {}, next);
        }
      });
    }
  });
}

module.exports.registerRoute = registerRoute;
