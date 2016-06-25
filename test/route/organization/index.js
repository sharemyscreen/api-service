const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const fixture = require('../../fixture/organization/index.json');
const common = require('sharemyscreen-common');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const apiSrv = supertest(url);

var user1;
var user2;
var org;

describe('Testing organization routes /v1/organization/*', function () {
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
  });

  describe('Testing organization creation (POST /v1/organization)', function () {
    it('Should create a new organization', function (done) {
      apiSrv
        .post('/v1/organization')
        .send({name: fixture.org})
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(201)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.public_id).to.not.be.undefined;
            expect(res.body.name).to.equal(fixture.org);
            expect(res.body.owner.public_id).to.equal(user1.publicId);
            expect(res.body.creator.public_id).to.equal(user1.publicId);
            expect(res.body.members).to.have.lengthOf(1);
            expect(res.body.members[0].public_id).to.equal(user1.publicId);
            common.userModel.getByPublicId(user1.publicId, function (err, fUser) {
              if (err) {
                done(err);
              } else {
                expect(fUser.organizations).to.have.lengthOf(1);
                user1 = fUser;
                org = res.body;
                done();
              }
            });
          }
        });
    });

    it('Should reply an error if no name supplied', function (done) {
      apiSrv
        .post('/v1/organization')
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
  });

  describe('Testing get user organization information (GET /v1/organization)', function () {
    it('Should reply user organizations information', function (done) {
      apiSrv
        .get('/v1/organization')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0].name).to.equal(fixture.org);
            expect(res.body[0].owner.public_id).to.equal(user1.publicId);
            expect(res.body[0].creator.public_id).to.equal(user1.publicId);
            expect(res.body[0].members).to.have.lengthOf(1);
            expect(res.body[0].members[0].public_id).to.equal(user1.publicId);
            done();
          }
        });
    });
  });

  describe('Testing get organization information (GET /v1/organization/{public-id}', function () {
    it('Should reply the organization information', function (done) {
      apiSrv
        .get('/v1/organization/' + org.public_id)
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.name).to.equal(fixture.org);
            expect(res.body.owner.public_id).to.equal(user1.publicId);
            expect(res.body.creator.public_id).to.equal(user1.publicId);
            expect(res.body.members).to.be.undefined;
            done();
          }
        });
    });

    it('Should reply organization not found if bad public Id', function (done) {
      apiSrv
        .get('/v1/organization/toto')
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
  });

  describe('Testing update organization name (PATCH /v1/organization/{public-id})', function () {
    it('Should update organization name', function (done) {
      apiSrv
        .patch('/v1/organization/' + org.public_id)
        .send({name: fixture.nOrg})
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.name).to.equal(fixture.nOrg);
            expect(res.body.owner.public_id).to.equal(user1.publicId);
            expect(res.body.creator.public_id).to.equal(user1.publicId);
            expect(res.body.members).to.have.lengthOf(1);
            expect(res.body.members[0].public_id).to.equal(user1.publicId);
            done();
          }
        });
    });

    it('Should reply an error when no name supplied', function (done) {
      apiSrv
        .patch('/v1/organization/' + org.public_id)
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

    it('Should reply an error when user not the owner of the organization', function (done) {
      apiSrv
        .patch('/v1/organization/' + org.public_id)
        .send({name: fixture.nOrg})
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

    it('Should reply an error when bad publicId', function (done) {
      apiSrv
        .patch('/v1/organization/toto')
        .send({name: fixture.nOrg})
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
  });

  describe('Testing organization deletion (DELETE /v1/organization/{public-id}', function () {
    it('Should reply an error when user not the owner of the organization', function (done) {
      apiSrv
        .delete('/v1/organization/' + org.public_id)
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

    it('Should delete the organization', function (done) {
      apiSrv
        .delete('/v1/organization/' + org.public_id)
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            common.organizationModel.getByPublicId(org.public_id, function (err, fOrg) {
              if (err) {
                done(err);
              } else {
                expect(fOrg).to.be.null;
                common.userModel.getByPublicId(user1.publicId, function (err, fUser) {
                  if (err) {
                    done(err);
                  } else {
                    expect(fUser.organizations).to.have.lengthOf(0);
                    done();
                  }
                });
              }
            });
          }
        });
    });

    it('Should reply an error when bad publicId', function (done) {
      apiSrv
        .delete('/v1/organization/toto')
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
  });
});
