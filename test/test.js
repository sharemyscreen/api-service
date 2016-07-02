const apiApp = require('../');
const config = require('config');
const requireDir = require('require-dir');
const mongoose = require('mongoose');

before(function (done) {
  mongoose.connection.on('error', function (err) {
    console.error('Unable to connect to the database ...');
    console.error(err);
    done(err);
  });

  mongoose.connection.on('open', function () {
    console.log('Connection success !');

    console.log('Dropping test database ...');
    mongoose.connection.db.dropDatabase(function (err) {
      if (err) {
        done(err);
      } else {
        console.log('Database dropped');
        const app = apiApp.getApp(true);

        app.mqMaster.bind(config.get('mqMaster.port'));
        console.log('MQ master bound on ' + config.get('mqMaster.port'));

        app.listen(config.get('server.port'), function () {
          done();
        });
      }
    });
  });

  const connectionStr = 'mongodb://' + config.get('dbConfig.host') + ':' +
    config.get('dbConfig.port') + '/' +
    config.get('test.dbConfig.dbName');
  mongoose.connect(connectionStr);
});

describe('Testing api service', function () {
  describe('Testing routes', function () {
    requireDir('./route');
  });
});
