// Generated by CoffeeScript 1.9.2
(function() {
  var buildObjectWithPropertyKey;

  module.exports = buildObjectWithPropertyKey = function(keyProp) {
    return function(obj, element) {
      obj[element[keyProp]] = element;
      return obj;
    };
  };

}).call(this);

//# sourceMappingURL=buildObjectWithPropertyKey.js.map
