var should = require('should');

var niceStringify = require('../nice-stringify');

describe('niceStringify()', function() {
  it('should work with empty objects', function() {
    niceStringify({}).should.eql('{\n}\n');
  });

  it('should work with objects w/ 1 key', function() {
    niceStringify({a: 1}).should.eql('{\n  "a": 1\n}\n');
  });

  it('should work with objects w/ 2 keys', function() {
    niceStringify({a: 1, b: 2})
      .should.eql('{\n  "a": 1\n, "b": 2\n}\n');
  });
});