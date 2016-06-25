const httpHelper = require('sharemyscreen-http-helper');
const common = require('sharemyscreen-common');

function registerRoute (router) {
  router.post('/organization', createOrganization);
  router.get('/organization', getUserOrganization);

  router.get('/organization/:id', getOrganizationInformation);
  router.patch('/organization/:id', updateOrganization);
  router.delete('/organization/:id', deleteOrganization);
}

function getUserOrganization (req, res, next) {
  var reply = [];
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
        httpHelper.sendReply(res, httpHelper.error.unauthorizedUpdate());
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
      httpHelper.sendReply(res, httpHelper.error.unauthorizedUpdate());
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
