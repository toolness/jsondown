var fs = require('fs');
var should = require('should');
var levelup = require('levelup');
var sinon = require('sinon');

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
    var db = levelup(JsonDOWN(LOCATION), function(err) {
      err.message.should.match(/^Error parsing JSON in _testdb/);
      done();
    });
  });

  it('should raise error on corrupted key', function(done) {
    putLocation({'not_a_buffer': 'nope'});
    var db = levelup(JsonDOWN(LOCATION), function(err) {
      err.message.should.eql('Error parsing key "not_a_buffer" as a buffer');
      done();
    });
  });

  it('should raise error on corrupted value', function(done) {
    putLocation({'$hi': false});
    var db = levelup(JsonDOWN(LOCATION), function(err) {
      err.message.should.eql('Error parsing value false as a buffer');
      done();
    });
  });

  it('should return values as buffers by default', function(done) {
    putLocation({'$hello': 'there'});
    var db = levelup(JsonDOWN(LOCATION));
    db.get('hello', function(err, value) {
      if (err) return done(err);
      value.should.eql(Buffer.from('there', 'utf8'));
      done();
    });
  });

  it('should return string values as strings if asBuffer is set to false', function(done) {
    putLocation({'$hello': 'there'});
    var db = levelup(JsonDOWN(LOCATION));
    db.get('hello', { asBuffer: false }, function(err, value) {
      if (err) return done(err);
      value.should.eql('there');
      done();
    });
  });

  it('should get existing keys', function(done) {
    putLocation({'$hey': 'there'});
    var db = levelup(JsonDOWN(LOCATION));
    db.get('hey', { asBuffer: false }, function(err, value) {
      if (err) return done(err);
      value.should.eql('there');
      done();
    });
  });

  it('should raise error on nonexistent keys', function(done) {
    var db = levelup(JsonDOWN(LOCATION));
    db.get('nonexistent', function(err, value) {
      err.notFound.should.be.true;
      done();
    });
  });

  it('should support binary keys', function(done) {
    putLocation({'[1,2,3]': 'yo'});
    var db = levelup(JsonDOWN(LOCATION));
    db.get(Buffer.from([1,2,3]), { asBuffer: false }, function(err, value) {
      if (err) return done(err);
      value.should.eql('yo');
      done();
    });
  });

  it('should support binary values', function(done) {
    putLocation({'$hello': [1,2,3]});
    var db = levelup(JsonDOWN(LOCATION));
    db.get('hello', function(err, value) {
      if (err) return done(err);
      value.should.eql(Buffer.from([1,2,3]));
      done();
    });
  });

  it('should return binary values as buffers even if asBuffer is set to false', function(done) {
    putLocation({'$hello': [1, 2, 3]});
    var db = levelup(JsonDOWN(LOCATION));
    db.get('hello', { asBuffer: false }, function(err, value) {
      if (err) return done(err);
      value.should.eql(Buffer.from([1, 2, 3]));
      done();
    });
  });

  it('should delete', function(done) {
    putLocation({'$whats': 'up'});
    var db = levelup(JsonDOWN(LOCATION));
    db.del('whats', function(err) {
      if (err) return done(err);
      getLocation().should.eql({});
      done();
    });
  });

  it('should put', function(done) {
    putLocation({});
    var db = levelup(JsonDOWN(LOCATION));
    db.put('foo', 'bar', function(err) {
      if (err) return done(err);
      getLocation().should.eql({$foo: 'bar'});
      done();
    });
  });

  it('should intelligently queue writes', function(done) {
    putLocation({});
    var db = levelup(JsonDOWN(LOCATION));
    sinon.spy(fs, 'writeFile');
    db.put('foo', 'bar');
    db.put('lol', 'cats');
    db.put('silly', 'monkey', function(err) {
      if (err) return done(err);
      getLocation().should.eql({
        $foo: 'bar',
        $lol: 'cats',
        $silly: 'monkey'
      });
      fs.writeFile.callCount.should.eql(2);
      db.del('lol', function(err) {
        getLocation().should.eql({
          $foo: 'bar',
          $silly: 'monkey'
        });
        fs.writeFile.callCount.should.eql(3);
        fs.writeFile.restore();
        done();
      });
    });
  });
});
