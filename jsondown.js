const AbstractLevelDOWN = require("abstract-leveldown").AbstractLevelDOWN;
const os = require("os");
const util = require("util");
const path = require("path");
const mkdirp = require("mkdirp");
const MemDOWN = require("memdown");
const fs = require("fs");

function serializeStore(store) {
  var result = {};
  store.forEach((key, value) => {
    result[key] = value;
  });
  return JSON.stringify(result);
}

function jsonToBatchOps(data) {
  if (!data) {
    throw new Error();
  }
  return Object.keys(data).map(function (key) {
    var value = data[key];
    if (typeof value !== "string") {
      try {
        value = new Buffer(value);
      } catch (e) {
        throw new Error(
          "Error parsing value " + JSON.stringify(value) + " as a buffer"
        );
      }
    }
    return {
      type: "put",
      key: key,
      value: value,
    };
  });
}

function reviver(k, v) {
  if (
    v != null &&
    typeof v === "object" &&
    "type" in v &&
    v.type === "Buffer" &&
    "data" in v &&
    Array.isArray(v.data)
  ) {
    return new Buffer(v.data);
  } else {
    return v;
  }
}

function noop() {}

function JsonDOWN(location) {
  if (!(this instanceof JsonDOWN)) return new JsonDOWN(location);
  AbstractLevelDOWN.call(this);
  MemDOWN.call(this);
  this.location = location;
  this._isLoadingFromFile = false;
  this._isWriting = false;
  this._queuedWrites = [];
}

util.inherits(JsonDOWN, MemDOWN);

JsonDOWN.prototype._open = function (options, callback) {
  var self = this;
  var loc =
    this.location.slice(-5) === ".json"
      ? this.location
      : path.join(this.location, "data.json");
  var subdir =
    this.location.slice(-5) === ".json"
      ? this.location.split(path.sep).slice(0, -1).join(path.sep)
      : this.location;

  mkdirp(subdir)
    .then((made) => {
      fs.exists(loc, function (exists) {
        if (!exists && options.createIfMissing === false) {
          callback(
            new Error(loc + " does not exist (createIfMissing is false)")
          );
        } else if (exists && options.errorIfExists) {
          callback(new Error(loc + " exists (errorIfExists is true)"));
        } else if (!exists) {
          fs.open(loc, "w", callback);
        } else {
          fs.readFile(
            loc,
            {
              encoding: "utf-8",
              flag: "r",
            },
            function (err, data) {
              if (err) return callback(err, data);
              try {
                data = JSON.parse(data, reviver);
              } catch (e) {
                return callback(
                  new Error("Error parsing JSON in " + loc + ": " + e.message)
                );
              }
              self._isLoadingFromFile = true;
              try {
                try {
                  self._batch(jsonToBatchOps(data), {}, noop);
                } finally {
                  self._isLoadingFromFile = false;
                }
              } catch (e) {
                return callback(e);
              }
              callback(null, self);
            }
          );
        }
      });
    })
    .catch((errMkdirp) => callback(errMkdirp));
};

JsonDOWN.prototype._close = function (cb) {
  this._writeToDisk(cb);
};

JsonDOWN.prototype._writeToDisk = function (cb) {
  if (this._isWriting) return this._queuedWrites.push(cb);
  this._isWriting = true;
  var loc =
    this.location.slice(-5) === ".json"
      ? this.location
      : path.join(this.location, "data.json");
  fs.writeFile(
    loc,
    serializeStore(this._store),
    {
      encoding: "utf-8",
    },
    function (err) {
      var queuedWrites = this._queuedWrites.splice(0);
      this._isWriting = false;
      if (queuedWrites.length) {
        this._writeToDisk(function (err) {
          queuedWrites.forEach(function (cb) {
            cb(err);
          });
        });
      }
      cb(err);
    }.bind(this)
  );
};

JsonDOWN.prototype._put = function (key, value, options, cb) {
  MemDOWN.prototype._put.call(this, key, value, options, noop);
  if (!this._isLoadingFromFile) this._writeToDisk(cb);
};

JsonDOWN.prototype._batch = function (array, options, cb) {
  MemDOWN.prototype._batch.call(this, array, options, noop);
  if (!this._isLoadingFromFile) this._writeToDisk(cb);
};

JsonDOWN.prototype._del = function (key, options, cb) {
  MemDOWN.prototype._del.call(this, key, options, noop);
  this._writeToDisk(cb);
};

module.exports = JsonDOWN;
