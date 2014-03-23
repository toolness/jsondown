module.exports = function niceStringify(obj) {
  return '{\n' + Object.keys(obj).map(function(key, i) {
    return (i ? ', ' : '  ') + JSON.stringify(key) + ': ' +
           JSON.stringify(obj[key]) + '\n';
  }).join('') + '}\n';
};
