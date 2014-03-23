var util = require('util');
var fs = require('fs');
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN;

// Prefix key with '_' to avoid key='__proto__' type shenanigans.
var KEY_PREFIX = '_';

function JsonDOWN(location) {
  if (!(this instanceof JsonDOWN))
    return new JsonDOWN(location);
  AbstractLevelDOWN.call(this, location);
}

util.inherits(JsonDOWN, AbstractLevelDOWN);

JsonDOWN.prototype._open = function(options, cb) {
  this._store = {};
  fs.readFile(this.location, 'utf-8', function(err, data) {
    if (err) {
      if (err.code == 'ENOENT') return cb(null, this);
      return cb(err);
    }
    try {
      this._store = JSON.parse(data);
    } catch (e) {
      return cb(new Error('Error parsing JSON in ' + this.location +
                          ': ' + e.message));
    }
    cb(null, this);
  }.bind(this));
};

JsonDOWN.prototype._writeToDisk = function(cb) {
  fs.writeFile(this.location, JSON.stringify(this._store, null, 2), {
    encoding: 'utf-8'
  }, cb);
};

JsonDOWN.prototype._put = function(key, value, options, cb) {
  this._store[KEY_PREFIX + key] = value;
  this._writeToDisk(cb);
};

JsonDOWN.prototype._get = function(key, options, cb) {
  var value = this._store[KEY_PREFIX + key];
  if (value === undefined)
    return process.nextTick(function() { cb(new Error('NotFound')); });
  process.nextTick(function() { cb(null, value); });
};

JsonDOWN.prototype._del = function(key, options, cb) {
  delete this._store[KEY_PREFIX + key];
  this._writeToDisk(cb);
};

JsonDOWN.create = function(location) {
  return new JsonDOWN(location);
};

module.exports = JsonDOWN;
