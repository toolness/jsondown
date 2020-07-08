const test = require("tape");
const suite = require("abstract-leveldown/test");
const jsonDOWN = require("./jsondown");
const tempy = require("tempy");

suite({
  test: test,
  snapshots: false,
  seek: false,
  bufferKeys: false,
  factory: function () {
    const dir = tempy.directory();
    return new jsonDOWN(dir);
  },
});

// var test = require("tape"),
//   testCommon = require("abstract-leveldown/test/common"),
//   jsonDOWN = require("./jsondown"),
//   testBuffer = require("fs").readFileSync(__filename),
//   db;
//
// /*** compatibility with basic LevelDOWN API ***/
//
// // require("abstract-leveldown/test/leveldown-test").args(
// //   jsonDOWN,
// //   test,
// //   testCommon
// // );
//
// require("abstract-leveldown/test/open-test").all(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/del-test").all(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/get-test").all(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/put-test").all(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/put-get-del-test").all(
//   jsonDOWN,
//   test,
//   testCommon,
//   testBuffer
// );
//
// require("abstract-leveldown/test/batch-test").all(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/chained-batch-test").all(
//   jsonDOWN,
//   test,
//   testCommon
// );
//
// require("abstract-leveldown/test/close-test").close(jsonDOWN, test, testCommon);
//
// require("abstract-leveldown/test/iterator-test").all(
//   jsonDOWN,
//   test,
//   testCommon
// );
//
// require("abstract-leveldown/test/ranges-test").all(jsonDOWN, test, testCommon);
