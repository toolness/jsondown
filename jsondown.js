var util = require('util');
var fs = require('fs');
var MemDOWN = require('memdown');

function noop() {}

function JsonDOWN(location) {
  if (!(this instanceof JsonDOWN))
    return new JsonDOWN(location);
  MemDOWN.call(this, location);
  this._isLoadingFromFile = false;
  this._isWriting = false;
  this._queuedWrites = [];
}

util.inherits(JsonDOWN, MemDOWN);

JsonDOWN.prototype._open = function(options, cb) {
  fs.readFile(this.location, 'utf-8', function(err, data) {
    if (err) {
      if (err.code == 'ENOENT') return cb(null, this);
      return cb(err);
    }
    try {
      data = JSON.parse(data);
    } catch (e) {
      return cb(new Error('Error parsing JSON in ' + this.location +
                          ': ' + e.message));
    }
    this._isLoadingFromFile = true;
    this._batch(Object.keys(data).filter(function(key) {
      return /^\$/.test(key);
    }).map(function(key) {
      return {
        type: 'put',
        key: key.slice(1),
        value: data[key]
      };
    }), {}, noop);
    this._isLoadingFromFile = false;
    cb(null, this);
  }.bind(this));
};

JsonDOWN.prototype._writeToDisk = function(cb) {
  if (this._isWriting)
    return this._queuedWrites.push(cb);
  this._isWriting = true;
  fs.writeFile(this.location, JSON.stringify(this._store, null, 2), {
    encoding: 'utf-8'
  }, function(err) {
    var queuedWrites = this._queuedWrites.splice(0);
    this._isWriting = false;
    if (queuedWrites.length)
      this._writeToDisk(function(err) {
        queuedWrites.forEach(function(cb) { cb(err); });
      });
    cb(err);
  }.bind(this));
};

JsonDOWN.prototype._put = function(key, value, options, cb) {
  MemDOWN.prototype._put.call(this, key, value, options, noop);
  if (!this._isLoadingFromFile) this._writeToDisk(cb);
};

JsonDOWN.prototype._del = function(key, options, cb) {
  MemDOWN.prototype._del.call(this, key, options, noop);
  this._writeToDisk(cb);
};

module.exports = JsonDOWN;
