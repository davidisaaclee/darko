// Generated by CoffeeScript 1.9.2
(function() {
  var clamp;

  module.exports = clamp = function(low, high, n) {
    var fn;
    fn = function(n) {
      return Math.min(high, Math.max(low, n));
    };
    if (n != null) {
      return fn(n);
    } else {
      return fn;
    }
  };

}).call(this);

//# sourceMappingURL=clamp.js.map