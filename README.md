[![Travis](https://secure.travis-ci.org/toolness/jsondown.png)](http://travis-ci.org/toolness/jsondown)

This is a drop-in replacement for [LevelDOWN][] that writes to
a JSON file on disk.

It also retains the contents of the entire JSON file in memory, so
it's only really useful for debugging purposes and/or very small
data stores that need just a pinch of persistence.

## Example

```js
const levelup = require("levelup");
const jsondown = require("jsondown");

const db = levelup(jsondown("./mydata.json"));

db.put("foo", "bar");
```
