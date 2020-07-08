const test = require("tape");
const suite = require("abstract-leveldown/test");
const jsonDOWN = require("./jsondown");
const tempy = require("tempy");

suite({
  test,
  factory: () => new jsonDOWN(tempy.directory()),
});
