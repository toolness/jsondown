const test = require("tape");
const suite = require("abstract-leveldown/test");
const JsonDOWN = require("./jsondown");
const tempy = require("tempy");

const testCommon = suite.common({
  test,
  factory: () => new JsonDOWN(tempy.directory()),
});

suite(testCommon);

test("setUp", testCommon.setUp);

test("custom test", function (t) {
  var db = testCommon.factory();
  db.location = db.location + "/data.json";

  // default createIfMissing=true, errorIfExists=false
  db.open(function (err) {
    t.error(err);
    db.close(function () {
      t.end();
    });
  });
});

test("tearDown", testCommon.tearDown);
//
// test('test simple put()', function (t) {
//
//   db.put('foo', 'bar', function (err) {
//     t.error(err)
//     db.get('foo', function (err, value) {
//       t.error(err)
//       var result = value.toString()
//       if (isTypedArray(value)) {
//         result = String.fromCharCode.apply(null, new Uint16Array(value))
//       }
//       t.equal(result, 'bar')
//       t.end()
//     })
//   })
// })
