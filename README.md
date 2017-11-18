# jsondown
> An [`abstract-leveldown`](https://github.com/Level/abstract-leveldown) store that writes to a JSON file

[![Travis](https://secure.travis-ci.org/toolness/jsondown.png)](http://travis-ci.org/toolness/jsondown)

`jsondown` retains the contents of the entire JSON file in memory, so
it's only really useful for debugging purposes and/or very small
data stores that need just a pinch of persistence.

## Example

```js
var levelup = require('levelup');
var jsondown = require('jsondown');
var db = levelup(jsondown('./mydata.json'));

db.put('foo', 'bar');
```
