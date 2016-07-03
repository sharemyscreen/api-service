const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const fixture = require('../../fixture/organization/room.json');
const common = require('sharemyscreen-common');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const apiSrv = supertest(url);

var user1;
var org;
var room;

describe('Testing organization routes /v1/organizations/{public-id}/rooms', function () {
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

  describe('Testing get organization rooms (GET /v1/organizations/{public-id}/rooms)', function () {
    it('Should display organization rooms', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/rooms')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body).to.have.lengthOf(1);
            expect(res.body[0].name).to.equal('general');
            expect(res.body[0].creator.public_id).to.equal(user1.publicId);
            expect(res.body[0].members).to.have.lengthOf(1);
            expect(res.body[0].members[0].public_id).to.equal(user1.publicId);
            room = res.body[0];
            done();
          }
        });
    });

    it('Should reply an error if bad organization id', function (done) {
      apiSrv
        .get('/v1/organizations/bad/rooms')
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
        .get('/v1/organizations/' + org.publicId + '/rooms')
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

  describe('Testing get room information (GET /v1/organization/{public-id}/rooms/{public-id})', function () {
    it('Should display room information', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/rooms/' + room.public_id)
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.name).to.equal('general');
            expect(res.body.creator.public_id).to.equal(user1.publicId);
            expect(res.body.members).to.have.lengthOf(1);
            expect(res.body.members[0].public_id).to.equal(user1.publicId);
            done();
          }
        });
    });

    it('Should reply an error if bad organization id', function (done) {
      apiSrv
        .get('/v1/organizations/bad/rooms/' + room.publicId)
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

    it('Should reply an error if bad room id', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/rooms/bad')
        .set('Authorization', 'Bearer ' + fixture.token1)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            expect(res.body.code).to.equal(4);
            expect(res.body.sub_code).to.equal(1);
            expect(res.body.message).to.equal('Unable to find room');
            done();
          }
        });
    });
    it('Should reply an error if user is nor member of the organization', function (done) {
      apiSrv
        .get('/v1/organizations/' + org.publicId + '/rooms/' + room.publicId)
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
});
