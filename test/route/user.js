const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const fixture = require('../fixture/user.json');
const common = require('sharemyscreen-common');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const apiSrv = supertest(url);

var user1;
var user2;

describe('Testing user routes /v1/user/*', function () {
  before(function (done) {
    common.clientModel.createFix(fixture.client.name, fixture.client.key, fixture.client.secret, function (err, cClient) {
      if (err) {
        done(err);
      } else {
        common.userModel.createPassword(fixture.user1.email, fixture.user1.password, fixture.user1.first_name, fixture.user1.last_name, function (err, cUser1) {
          if (err) {
            done(err);
          } else {
            common.userModel.createFacebook(fixture.user2.email, fixture.user2.facebookId, fixture.user2.first_name, fixture.user2.last_name, function (err, cUser2) {
              if (err) {
                done(err);
              } else {
                common.userModel.createPassword(fixture.user3.email, fixture.user3.password, fixture.user3.first_name, fixture.user3.last_name, function (err) {
                  if (err) {
                    done(err);
                  } else {
                    common.accessTokenModel.createFix(cClient, cUser1, fixture.token1, function (err) {
                      if (err) {
                        done(err);
                      } else {
                        common.accessTokenModel.createFix(cClient, cUser2, fixture.token2, function (err) {
                          if (err) {
                            done(err);
                          } else {
                            user1 = cUser1;
                            user2 = cUser2;
                            done();
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  describe('Testing get user information (GET /v1/user/:id)', function () {
    it('Should reply current user information (/me)', function (done) {
      apiSrv
        .get('/v1/user/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.public_id).to.equal(user1.publicId);
            expect(res.body.email).to.equal(user1.email);
            expect(res.body.first_name).to.equal(user1.firstName);
            expect(res.body.last_name).to.equal(user1.lastName);
            done();
          }
        });
    });

    it('Should reply user2 information', function (done) {
      apiSrv
        .get('/v1/user/' + user2.publicId)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.public_id).to.equal(user2.publicId);
            expect(res.body.email).to.equal(user2.email);
            expect(res.body.first_name).to.equal(user2.firstName);
            expect(res.body.last_name).to.equal(user2.lastName);
            done();
          }
        });
    });

    it('Should reply userNotFound when bad id', function (done) {
      apiSrv
        .get('/v1/user/toto')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(2);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Unable to find user');
            done();
          }
        });
    });

    it('Should reply authentication error when missing access token', function (done) {
      apiSrv
        .get('/v1/user/me')
        .set('Content-Type', 'application/json')
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.text).to.equal('Unauthorized');
            done();
          }
        });
    });

    it('Should reply authentication error when bad access token', function (done) {
      apiSrv
        .get('/v1/user/toto')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer Hello')
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.text).to.equal('Unauthorized');
            done();
          }
        });
    });
  });

  describe('Testing update user information (PATCH /v1/user/me)', function () {
    it('Should update user information', function (done) {
      apiSrv
        .patch('/v1/user/me')
        .send({ email: fixture.user1n.email, first_name: fixture.user1n.first_name, last_name: fixture.user1n.last_name })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            common.userModel.getByPublicId(user1.publicId, false, function (err, fUser) {
              if (err) {
                done(err);
              } else {
                expect(fUser.email).to.equal(fixture.user1n.email);
                expect(fUser.firstName).to.equal(fixture.user1n.first_name);
                expect(fUser.lastName).to.equal(fixture.user1n.last_name);
                done();
              }
            });
          }
        });
    });

    it('Should reply error when trying to update email for a facebook account', function (done) {
      apiSrv
        .patch('/v1/user/me')
        .send({ email: fixture.user1n.email, first_name: fixture.user1n.first_name, last_name: fixture.user1n.last_name })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token2)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(4);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('You cannot update email with a external api registration');
            done();
          }
        });
    });
  });

  describe('Testing user search (GET /v1/user/search/:partial_email', function () {
    it('Should reply research result', function (done) {
      apiSrv
        .get('/v1/user/search/z')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(2);
            done();
          }
        });
    });

    it('Should reply research result', function (done) {
      apiSrv
        .get('/v1/user/search/' + fixture.user1n.email)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(1);
            done();
          }
        });
    });

    it('Should reply research result', function (done) {
      apiSrv
        .get('/v1/user/search/toto')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(0);
            done();
          }
        });
    });
  });

  describe('Testing user deletion (DELETE /v1/user/me)', function () {
    it('Should delete the authenticated user', function (done) {
      apiSrv
        .delete('/v1/user/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            common.userModel.getByPublicId(user1.publicId, false, function (err, fUser) {
              if (err) {
                done(err);
              } else {
                expect(fUser).to.be.null;
                done();
              }
            });
          }
        });
    });
  });
});
