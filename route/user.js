const httpHelper = require('sharemyscreen-http-helper');
const common = require('sharemyscreen-common');

function registerRoute (router) {
  router.get('/users/:id', getUserInfo);
  router.patch('/users/me', updateUser);
  router.delete('/users/me', deleteUser);

  router.get('/users/search/:email', searchUser);
}

function getUserInfo (req, res, next) {
  if (req.params.id === 'me') {
    req.params.id = req.user.publicId;
  }
  common.userModel.getByPublicId(req.params.id, true, function (err, fUser) {
    if (err) {
      next(err);
    } else if (fUser == null) {
      httpHelper.sendReply(res, httpHelper.error.userNotFound());
    } else {
      httpHelper.sendReply(res, 200, fUser.safePrint(), next);
    }
  });
}

function updateUser (req, res, next) {
  if (req.body.email !== undefined && req.user.password === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidUpdate());
  } else {
    const me = req.user;
    me.email = req.body.email || me.email;
    me.firstName = req.body.first_name || me.firstName;
    me.lastName = req.body.last_name || me.lastName;
    me.save(function (err) {
      if (err) {
        next(err);
      } else {
        httpHelper.sendReply(res, 200, me.safePrint(), next);
      }
    });
  }
}

function deleteUser (req, res, next) {
  common.accessTokenModel.deleteTokenForUser(req.user, function (err) {
    if (err) {
      next(err);
    } else {
      common.refreshTokenModel.deleteTokenForUser(req.user, function (err) {
        if (err) {
          next(err);
        } else {
          req.user.remove(function (err) {
            if (err) {
              next(err);
            } else {
              httpHelper.sendReply(res, 200, {}, next);
            }
          });
        }
      });
    }
  });
}

function searchUser (req, res, next) {
  common.userModel.getByPartialEmail(req.params.email, 10, function (err, fUsers) {
    if (err) {
      next(err);
    } else {
      var reply = [];
      fUsers.forEach(function (user) {
        reply.push(user.safePrintMember());
      });
      httpHelper.sendReply(res, 200, reply, next);
    }
  });
}

module.exports.registerRoute = registerRoute;
