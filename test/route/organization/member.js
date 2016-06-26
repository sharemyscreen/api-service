const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const fixture = require('../../fixture/organization/member.json');
const common = require('sharemyscreen-common');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const apiSrv = supertest(url);

var user1;
var user2;
var org;

describe('Testing organization routes /v1/organizations/{public-id}/member', function () {
  before(function (done) {
    common.clientModel.createFix(fixture.client.name, fixture.client.key, fixture.client.secret, function (err, cClient) {
      if (err) {
        done(err);
      } else {
        common.userModel.createPassword(fixture.user1.email, fixture.user1.password, fixture.user1.first_name, fixture.user1.last_name, function (err, cUser1) {
          if (err) {
            done(err);
          } else {
            common.userModel.createPassword(fixture.user2.email, fixture.user2.password, fixture.user2.first_name, fixture.user2.last_name, function (err, cUser2) {
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
                        common.organizationModel.createNew(fixture.org, cUser1, function (err, cOrg) {
                          if (err) {
                            done(err);
                          } else {
                            org = cOrg;
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

  describe('Testing get organization members (GET /v1/organizations/{public-id}/members)', function () {
    it('Should display organization members', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/members')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0].public_id).to.equal(user1.publicId);
            done();
          }
        });
    });

    it('Should reply an error if bad organization id', function (done) {
      apiSrv
        .get('/v1/organizations/bad/members')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Unable to find organization');
            done();
          }
        });
    });

    it('Should reply an error if user is not member of the organization', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/members')
        .set('Authorization', 'Bearer ' + fixture.token2)
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(2);
            expect(res.body.message).to.equal('Only organization members can perform this action');
            done();
          }
        });
    });
  });

  describe('Testing invite user to organization (POST /v1/organizations/{public-id}/members', function () {
    it('Should invite user to organization', function (done) {
      apiSrv
        .post('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(2);
            expect(res.body[0].public_id).to.equal(user1.publicId);
            expect(res.body[1].public_id).to.equal(user2.publicId);
            done();
          }
        });
    });

    it('Should reply an error if no user_id supplied', function (done) {
      apiSrv
        .post('/v1/organizations/' + org.publicId + '/members')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(1);
            expect(res.body.message).to.equal('Invalid request');
            done();
          }
        });
    });

    it('Should reply an error if bad organization id', function (done) {
      apiSrv
        .post('/v1/organizations/bad/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Unable to find organization');
            done();
          }
        });
    });

    it('Should reply an error if user is not the owner of the organization', function (done) {
      apiSrv
        .post('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token2)
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Only organization owner can perform this action');
            done();
          }
        });
    });

    it('Should reply an error if bad user_id supplied', function (done) {
      apiSrv
        .post('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: 'badId' })
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

    it('Should reply an error if user is already member of the organization', function (done) {
      apiSrv
        .post('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('User already member of the organization');
            done();
          }
        });
    });
  });

  describe('Testing kick user from organization (DELETE /v1/organizations/{public-id}/members', function () {
    it('Should kick user from organization', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0].public_id).to.equal(user1.publicId);
            done();
          }
        });
    });

    it('Should reply an error if no user_id supplied', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(1);
            expect(res.body.message).to.equal('Invalid request');
            done();
          }
        });
    });

    it('Should reply an error if bad organization id', function (done) {
      apiSrv
        .delete('/v1/organizations/bad/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Unable to find organization');
            done();
          }
        });
    });

    it('Should reply an error if user is not the owner of the organization', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token2)
        .expect(401)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Only organization owner can perform this action');
            done();
          }
        });
    });

    it('Should reply an error if bad user_id supplied', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: 'bad' })
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

    it('Should reply an error if user is not member of the organization', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user2.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(2);
            expect(res.body.message).to.equal('User not member of the organization');
            done();
          }
        });
    });

    it('Should reply an error if user is the owner of the organization', function (done) {
      apiSrv
        .delete('/v1/organizations/' + org.publicId + '/members')
        .send({ user_id: user1.publicId })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(400)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(3);
            expect(res.body.sub_code).to.equal(3);
            expect(res.body.message).to.equal('Owner cannot kick himself from organization');
            done();
          }
        });
    });
  });
});
