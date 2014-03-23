var fs = require('fs');
var should = require('should');
var levelup = require('levelup');

var JsonDOWN = require('../jsondown');

var LOCATION = '_testdb_JsonDOWN.json';

function removeLocation() {
  if (fs.existsSync(LOCATION)) fs.unlinkSync(LOCATION);
}

function getLocation() {
  return JSON.parse(fs.readFileSync(LOCATION, 'utf-8'));
}

function putLocation(obj) {
  if (typeof(obj) == 'object')
    obj = JSON.stringify(obj);
  fs.writeFileSync(LOCATION, obj, 'utf-8');
}

describe('JsonDOWN', function() {
  beforeEach(removeLocation);
  afterEach(removeLocation);

  it('should raise error on corrupted data', function(done) {
    putLocation('i am not valid json');
    var db = levelup(LOCATION, {db: JsonDOWN});
    db.open();
    db.on('error', function(err) {
      err.message.should.match(/^Error parsing JSON in _testdb/);
      done();      
    });
  });

  it('should get existing keys', function(done) {
    putLocation({'_hey': 'there'});
    var db = levelup(LOCATION, {db: JsonDOWN});
    db.get('hey', function(err, value) {
      if (err) return done(err);
      value.should.eql('there');
      done();
    });
  });

  it('should raise error on nonexistent keys', function(done) {
    var db = levelup(LOCATION, {db: JsonDOWN});
    db.get('nonexistent', function(err, value) {
      err.notFound.should.be.true;
      done();
    });
  });

  it('should delete', function(done) {
    putLocation({'_whats': 'up'});
    var db = levelup(LOCATION, {db: JsonDOWN});
    db.del('whats', function(err) {
      if (err) return done(err);
      getLocation().should.eql({});
      done();
    });
  });

  it('should put', function(done) {
    var db = levelup(LOCATION, {db: JsonDOWN});
    db.put('foo', 'bar', function(err) {
      if (err) return done(err);
      getLocation().should.eql({_foo: 'bar'});
      done();
    });
  });
});
