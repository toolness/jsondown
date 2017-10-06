var util = require('util');
var os = require('os');
var MemDOWN = require('memdown');
var fs = (os.hostname() === 'runtime') ?
  require('./runtime-fs') :
  require('fs')


var niceStringify = require('./nice-stringify');

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

JsonDOWN.prototype._jsonToBatchOps = function(data) {
  return Object.keys(data).map(function(key) {
    var value = data[key];
    if (/^\$/.test(key)) {
      key = key.slice(1);
    } else {
      try {
        key = new Buffer(JSON.parse(key));
      } catch (e) {
        throw new Error('Error parsing key ' + JSON.stringify(key) +
                        ' as a buffer');
      }
    }
    if (typeof(value) != 'string') {
      try {
        value = new Buffer(value);
      } catch (e) {
        throw new Error('Error parsing value ' + JSON.stringify(value) +
                        ' as a buffer');
      }
    }
    return {type: 'put', key: key, value: value};
  });
};

JsonDOWN.prototype._open = function(options, cb) {
  fs.readFile(this.location, {encoding: 'utf-8', flag: 'r'}, function(err, data) {
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
    try {
      try {
        this._batch(this._jsonToBatchOps(data), {}, noop);
      } finally {
        this._isLoadingFromFile = false;
      }
    } catch (e) {
      return cb(e);
    }
    cb(null, this);
  }.bind(this));
};

JsonDOWN.prototype._writeToDisk = function(cb) {
  if (this._isWriting)
    return this._queuedWrites.push(cb);
  this._isWriting = true;
  fs.writeFile(this.location, niceStringify(this._store), {
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
