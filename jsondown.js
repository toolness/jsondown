var util = require('util');
var os = require('os');
var MemDOWN = require('memdown');
var fs = (os.hostname() === 'runtime') ?
  require('./runtime-fs') :
  require('fs')

function noop() {}

function JsonDOWN(location) {
  if (!(this instanceof JsonDOWN))
    return new JsonDOWN(location);

  // Memdown keeps the data in global cache, so we need to
  // delete that data to make sure it doesn't override what we
  // read from disk
  MemDOWN.destroy.call(this, location, noop);

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
        key = Buffer.from(JSON.parse(key));
      } catch (e) {
        throw new Error('Error parsing key ' + JSON.stringify(key) +
                        ' as a buffer');
      }
    }
    if (typeof(value) != 'string') {
      try {
        value = Buffer.from(value);
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
  const data = {}
  this._store[this._location].forEach((key, value) => {
    data[serializeKey(key)] = serializeValue(value)
  })
  // TODO write each line so we don't need to store it in memory again
  fs.writeFile(this.location, JSON.stringify(data), {
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

function serializeKey (key) {
  if (typeof key === 'string') {
    return '$' + key;
  } else if (Buffer.isBuffer(key)) {
    return JSON.stringify(Array.prototype.slice.call(key, 0));
  } else {
    return key.toString();
  }
}

function serializeValue (value) {
  if (typeof value === 'string') {
    return value;
  } else if (Buffer.isBuffer(value)) {
    return Array.prototype.slice.call(value, 0);
  } else {
    return value.toString();
  }
}

module.exports = JsonDOWN;
