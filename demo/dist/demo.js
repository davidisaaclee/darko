(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _, canvas, container, diffKeys, draw, k, offset, randomColor, reducer, redux, ref, setup, setupInteractions, setupTimelines, translate3d, update, wrap;

_ = require('lodash');

redux = require('redux');

k = require('../../src/ActionTypes');

reducer = require('../../src/reducers/base');

ref = require('../../src/util/cssHelpers'), translate3d = ref.translate3d, offset = ref.offset;

wrap = require('../../src/util/wrap');

container = document.getElementById('container');

canvas = document.createElement('canvas');

canvas.width = container.offsetWidth;

canvas.height = container.offsetHeight;

container.appendChild(canvas);

update = function(state, dispatch) {
  (Object.keys(state.entities.dict)).forEach(function(key) {
    if (state.entities.dict[key].attachedTimelines.length === 0) {
      return dispatch({
        type: k.AttachEntityToTimeline,
        data: {
          entity: key,
          timeline: 'timeline-0'
        }
      });
    }
  });
  return draw(canvas.getContext('2d'), state.entities);
};

draw = function(ctx, entities) {
  var getPosition;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  getPosition = function(entity) {
    var p;
    if (entity != null) {
      p = entities.dict[entity].data.position;
      return {
        x: p.x * ctx.canvas.width,
        y: p.y * ctx.canvas.height
      };
    } else {
      return entity;
    }
  };
  Object.keys(entities.dict).forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    return ctx.lineTo(pos.x, pos.y);
  });
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
  return Object.keys(entities.dict).forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 10, 10, 45 * Math.PI / 180, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = entities.dict[key].data.strokeColor;
    ctx.strokeStyle = null;
    return ctx.fill();
  });
};

diffKeys = function(previous, current) {
  return {
    added: (Object.keys(current)).filter(function(key) {
      return previous[key] == null;
    }),
    removed: (Object.keys(previous)).filter(function(key) {
      return current[key] == null;
    })
  };
};

setup = function() {
  var store;
  store = redux.createStore(reducer);
  setupTimelines(store.dispatch);
  setupInteractions(store.dispatch, store);
  return store.subscribe(function() {
    return update(store.getState(), store.dispatch);
  });
};

setupTimelines = function(dispatch) {
  dispatch({
    type: k.AddTimeline,
    data: {
      length: 1,
      shouldLoop: true
    }
  });
  dispatch({
    type: k.AddMapping,
    data: {
      timeline: 'timeline-0',
      mapping: function(progress, entityId, entityData) {
        return _.assign({}, entityData, {
          position: {
            x: 0.5 * ((Math.sin(progress * (75 / Math.PI))) + 1),
            y: 0.5 * ((Math.sin(progress * (50 / Math.PI))) + 1)
          }
        });
      }
    }
  });
  return dispatch({
    type: k.AddTrigger,
    data: {
      timeline: 'timeline-0',
      position: 0.5,
      action: function(progress, entityId, entityData) {
        return _.assign({}, entityData, {
          strokeColor: randomColor()
        });
      }
    }
  });
};

setupInteractions = function(dispatch, store) {
  var addEntityButton, animationOffset, getTimelineValue, isAnimating, previousSliderValue, progressTimeline, time, timelineSlider, updateTimeline;
  addEntityButton = document.getElementById('add-entity');
  addEntityButton.addEventListener('click', function() {
    return dispatch({
      type: k.AddEntity,
      data: {
        initialData: {
          strokeColor: 'black',
          position: {
            x: 0,
            y: 0
          }
        }
      }
    });
  });
  timelineSlider = document.getElementById('timeline-slider');
  getTimelineValue = function() {
    return timelineSlider.value / 100;
  };
  previousSliderValue = getTimelineValue();
  progressTimeline = function() {
    var v;
    v = getTimelineValue();
    Object.keys(store.getState().entities.dict).forEach(function(entityId) {
      return dispatch({
        type: k.ProgressEntityTimeline,
        data: {
          entity: entityId,
          timelines: ['timeline-0'],
          delta: v - previousSliderValue
        }
      });
    });
    return previousSliderValue = v;
  };
  timelineSlider.addEventListener('input', progressTimeline);
  timelineSlider.addEventListener('change', progressTimeline);
  isAnimating = true;
  animationOffset = 0;
  time = 0;
  updateTimeline = function(t) {
    time = t;
    window.requestAnimationFrame(updateTimeline);
    if (isAnimating) {
      timelineSlider.value = wrap(0, 100, Math.floor((animationOffset + t) / 30));
      return progressTimeline();
    }
  };
  timelineSlider.addEventListener('mousedown', function() {
    return isAnimating = false;
  });
  document.addEventListener('mouseup', function() {
    if (!isAnimating) {
      isAnimating = true;
      animationOffset = timelineSlider.value * 30 - time;
      return updateTimeline();
    }
  });
  return updateTimeline();
};

setup();

randomColor = function() {
  var random8bit;
  random8bit = function() {
    return Math.floor(Math.random() * 256);
  };
  return "rgba(" + (random8bit()) + ", " + (random8bit()) + ", " + (random8bit()) + ", 1)";
};


},{"../../src/ActionTypes":91,"../../src/reducers/base":92,"../../src/util/cssHelpers":97,"../../src/util/wrap":99,"lodash":"lodash","redux":"redux"}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],4:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":9,"../internal/baseEach":16,"../internal/createForEach":40}],5:[function(require,module,exports){
var arrayMap = require('../internal/arrayMap'),
    baseCallback = require('../internal/baseCallback'),
    baseMap = require('../internal/baseMap'),
    isArray = require('../lang/isArray');

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"../internal/arrayMap":11,"../internal/baseCallback":14,"../internal/baseMap":27,"../lang/isArray":61}],6:[function(require,module,exports){
var arrayFilter = require('../internal/arrayFilter'),
    baseCallback = require('../internal/baseCallback'),
    baseFilter = require('../internal/baseFilter'),
    isArray = require('../lang/isArray');

/**
 * The opposite of `_.filter`; this method returns the elements of `collection`
 * that `predicate` does **not** return truthy for.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * _.reject([1, 2, 3, 4], function(n) {
 *   return n % 2 == 0;
 * });
 * // => [1, 3]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': false },
 *   { 'user': 'fred',   'age': 40, 'active': true }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
 * // => ['barney']
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.pluck(_.reject(users, 'active', false), 'user');
 * // => ['fred']
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.reject(users, 'active'), 'user');
 * // => ['barney']
 */
function reject(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  predicate = baseCallback(predicate, thisArg, 3);
  return func(collection, function(value, index, collection) {
    return !predicate(value, index, collection);
  });
}

module.exports = reject;

},{"../internal/arrayFilter":10,"../internal/baseCallback":14,"../internal/baseFilter":17,"../lang/isArray":61}],7:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],8:[function(require,module,exports){
(function (global){
var cachePush = require('./cachePush'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./cachePush":36,"./getNative":47}],9:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],10:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],11:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],12:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],13:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],14:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    property = require('../utility/property');

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":72,"../utility/property":73,"./baseMatches":28,"./baseMatchesProperty":29,"./bindCallback":34}],15:[function(require,module,exports){
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.difference` which accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values) {
  var length = array ? array.length : 0,
      result = [];

  if (!length) {
    return result;
  }
  var index = -1,
      indexOf = baseIndexOf,
      isCommon = true,
      cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
      valuesLength = values.length;

  if (cache) {
    indexOf = cacheIndexOf;
    isCommon = false;
    values = cache;
  }
  outer:
  while (++index < length) {
    var value = array[index];

    if (isCommon && value === value) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (indexOf(values, value, 0) < 0) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"./baseIndexOf":23,"./cacheIndexOf":35,"./createCache":39}],16:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":21,"./createBaseEach":37}],17:[function(require,module,exports){
var baseEach = require('./baseEach');

/**
 * The base implementation of `_.filter` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"./baseEach":16}],18:[function(require,module,exports){
var arrayPush = require('./arrayPush'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"../lang/isArguments":60,"../lang/isArray":61,"./arrayPush":12,"./isArrayLike":49,"./isObjectLike":53}],19:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":38}],20:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":68,"./baseFor":19}],21:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":67,"./baseFor":19}],22:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./toObject":58}],23:[function(require,module,exports){
var indexOfNaN = require('./indexOfNaN');

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"./indexOfNaN":48}],24:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":64,"./baseIsEqualDeep":25,"./isObjectLike":53}],25:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":61,"../lang/isTypedArray":66,"./equalArrays":42,"./equalByTag":43,"./equalObjects":44}],26:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":24,"./toObject":58}],27:[function(require,module,exports){
var baseEach = require('./baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./baseEach":16,"./isArrayLike":49}],28:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    getMatchData = require('./getMatchData'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"./baseIsMatch":26,"./getMatchData":46,"./toObject":58}],29:[function(require,module,exports){
var baseGet = require('./baseGet'),
    baseIsEqual = require('./baseIsEqual'),
    baseSlice = require('./baseSlice'),
    isArray = require('../lang/isArray'),
    isKey = require('./isKey'),
    isStrictComparable = require('./isStrictComparable'),
    last = require('../array/last'),
    toObject = require('./toObject'),
    toPath = require('./toPath');

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"../array/last":3,"../lang/isArray":61,"./baseGet":22,"./baseIsEqual":24,"./baseSlice":32,"./isKey":51,"./isStrictComparable":54,"./toObject":58,"./toPath":59}],30:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],31:[function(require,module,exports){
var baseGet = require('./baseGet'),
    toPath = require('./toPath');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"./baseGet":22,"./toPath":59}],32:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],33:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],34:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":72}],35:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"../lang/isObject":64}],36:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"../lang/isObject":64}],37:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":45,"./isLength":52,"./toObject":58}],38:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":58}],39:[function(require,module,exports){
(function (global){
var SetCache = require('./SetCache'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./SetCache":8,"./getNative":47}],40:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":61,"./bindCallback":34}],41:[function(require,module,exports){
var baseCallback = require('./baseCallback'),
    baseForOwn = require('./baseForOwn');

/**
 * Creates a function for `_.mapKeys` or `_.mapValues`.
 *
 * @private
 * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
 * @returns {Function} Returns the new map function.
 */
function createObjectMapper(isMapKeys) {
  return function(object, iteratee, thisArg) {
    var result = {};
    iteratee = baseCallback(iteratee, thisArg, 3);

    baseForOwn(object, function(value, key, object) {
      var mapped = iteratee(value, key, object);
      key = isMapKeys ? mapped : key;
      value = isMapKeys ? value : mapped;
      result[key] = value;
    });
    return result;
  };
}

module.exports = createObjectMapper;

},{"./baseCallback":14,"./baseForOwn":21}],42:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":13}],43:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],44:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":67}],45:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":30}],46:[function(require,module,exports){
var isStrictComparable = require('./isStrictComparable'),
    pairs = require('../object/pairs');

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"../object/pairs":71,"./isStrictComparable":54}],47:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":63}],48:[function(require,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],49:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":45,"./isLength":52}],50:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],51:[function(require,module,exports){
var isArray = require('../lang/isArray'),
    toObject = require('./toObject');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"../lang/isArray":61,"./toObject":58}],52:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],53:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],54:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"../lang/isObject":64}],55:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * A specialized version of `_.pick` which picks `object` properties specified
 * by `props`.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property names to pick.
 * @returns {Object} Returns the new object.
 */
function pickByArray(object, props) {
  object = toObject(object);

  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index];
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
}

module.exports = pickByArray;

},{"./toObject":58}],56:[function(require,module,exports){
var baseForIn = require('./baseForIn');

/**
 * A specialized version of `_.pick` which picks `object` properties `predicate`
 * returns truthy for.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Object} Returns the new object.
 */
function pickByCallback(object, predicate) {
  var result = {};
  baseForIn(object, function(value, key, object) {
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

module.exports = pickByCallback;

},{"./baseForIn":20}],57:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":60,"../lang/isArray":61,"../object/keysIn":68,"./isIndex":50,"./isLength":52}],58:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":64}],59:[function(require,module,exports){
var baseToString = require('./baseToString'),
    isArray = require('../lang/isArray');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"../lang/isArray":61,"./baseToString":33}],60:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":49,"../internal/isObjectLike":53}],61:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":47,"../internal/isLength":52,"../internal/isObjectLike":53}],62:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":64}],63:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":53,"./isFunction":62}],64:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],65:[function(require,module,exports){
var baseForIn = require('../internal/baseForIn'),
    isArguments = require('./isArguments'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"../internal/baseForIn":20,"../internal/isObjectLike":53,"./isArguments":60}],66:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":52,"../internal/isObjectLike":53}],67:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":47,"../internal/isArrayLike":49,"../internal/shimKeys":57,"../lang/isObject":64}],68:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":50,"../internal/isLength":52,"../lang/isArguments":60,"../lang/isArray":61,"../lang/isObject":64}],69:[function(require,module,exports){
var createObjectMapper = require('../internal/createObjectMapper');

/**
 * Creates an object with the same keys as `object` and values generated by
 * running each own enumerable property of `object` through `iteratee`. The
 * iteratee function is bound to `thisArg` and invoked with three arguments:
 * (value, key, object).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Object} Returns the new mapped object.
 * @example
 *
 * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
 *   return n * 3;
 * });
 * // => { 'a': 3, 'b': 6 }
 *
 * var users = {
 *   'fred':    { 'user': 'fred',    'age': 40 },
 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
 * };
 *
 * // using the `_.property` callback shorthand
 * _.mapValues(users, 'age');
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 */
var mapValues = createObjectMapper();

module.exports = mapValues;

},{"../internal/createObjectMapper":41}],70:[function(require,module,exports){
var arrayMap = require('../internal/arrayMap'),
    baseDifference = require('../internal/baseDifference'),
    baseFlatten = require('../internal/baseFlatten'),
    bindCallback = require('../internal/bindCallback'),
    keysIn = require('./keysIn'),
    pickByArray = require('../internal/pickByArray'),
    pickByCallback = require('../internal/pickByCallback'),
    restParam = require('../function/restParam');

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable properties of `object` that are not omitted.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to omit, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.omit(object, 'age');
 * // => { 'user': 'fred' }
 *
 * _.omit(object, _.isNumber);
 * // => { 'user': 'fred' }
 */
var omit = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  if (typeof props[0] != 'function') {
    var props = arrayMap(baseFlatten(props), String);
    return pickByArray(object, baseDifference(keysIn(object), props));
  }
  var predicate = bindCallback(props[0], props[1], 3);
  return pickByCallback(object, function(value, key, object) {
    return !predicate(value, key, object);
  });
});

module.exports = omit;

},{"../function/restParam":7,"../internal/arrayMap":11,"../internal/baseDifference":15,"../internal/baseFlatten":18,"../internal/bindCallback":34,"../internal/pickByArray":55,"../internal/pickByCallback":56,"./keysIn":68}],71:[function(require,module,exports){
var keys = require('./keys'),
    toObject = require('../internal/toObject');

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"../internal/toObject":58,"./keys":67}],72:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],73:[function(require,module,exports){
var baseProperty = require('../internal/baseProperty'),
    basePropertyDeep = require('../internal/basePropertyDeep'),
    isKey = require('../internal/isKey');

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"../internal/baseProperty":30,"../internal/basePropertyDeep":31,"../internal/isKey":51}],74:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _freeze = require('./freeze');

/**
 * Returns a function that always returns the supplied value.
 *
 * Useful for replacing an object outright rather than merging it.
 *
 * @function
 * @sig a -> (* -> a)
 * @memberOf u
 * @param  {*} value what to return from returned function.
 * @return {function} a new function that will always return value.
 *
 * @example
 * var alwaysFour = u.constant(4);
 * expect(alwaysFour(32)).toEqual(4);
 *
 * @example
 * var user = {
 *   name: 'Mitch',
 *   favorites: {
 *     band: 'Nirvana',
 *     movie: 'The Matrix'
 *   }
 * };
 *
 * var newFavorites = {
 *   band: 'Coldplay'
 * };
 *
 * var result = u({ favorites: u.constant(newFavorites) }, user);
 *
 * expect(result).toEqual({ name: 'Mitch', favorites: { band: 'Coldplay' } });
 */

var _freeze2 = _interopRequireDefault(_freeze);

function constant(value) {
  var frozen = _freeze2['default'](value);
  return function () {
    return frozen;
  };
}

exports['default'] = constant;
module.exports = exports['default'];
},{"./freeze":75}],75:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
function isFreezable(object) {
  if (object === null) return false;

  return Array.isArray(object) || typeof object === 'object';
}

function needsFreezing(object) {
  return isFreezable(object) && !Object.isFrozen(object);
}

function recur(object) {
  Object.freeze(object);

  Object.keys(object).forEach(function (key) {
    var value = object[key];
    if (needsFreezing(value)) {
      recur(value);
    }
  });

  return object;
}

/**
 * Deeply freeze a plain javascript object.
 *
 * If `process.env.NODE_ENV === 'production'`, this returns the original object
 * witout freezing.
 *
 * @function
 * @sig a -> a
 * @param  {object} object Object to freeze.
 * @return {object} Frozen object, unless in production, then the same object.
 */
function freeze(object) {
  if (process.env.NODE_ENV === 'production') {
    return object;
  }

  if (needsFreezing(object)) {
    recur(object);
  }

  return object;
}

exports['default'] = freeze;
module.exports = exports['default'];
}).call(this,require('_process'))

},{"_process":2}],76:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ifElse = require('./ifElse');

var _ifElse2 = _interopRequireDefault(_ifElse);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

exports['default'] = _utilCurry2['default'](function (predicate, trueUpdates, object) {
  return _ifElse2['default'](predicate, trueUpdates, function (x) {
    return x;
  }, object);
});
module.exports = exports['default'];
},{"./ifElse":77,"./util/curry":85}],77:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function updateIfElse(predicate, trueUpdates, falseUpdates, object) {
  var test = typeof predicate === 'function' ? predicate(object) : predicate;

  var updates = test ? trueUpdates : falseUpdates;

  return _update2['default'](updates, object);
}

exports['default'] = _wrap2['default'](updateIfElse);
module.exports = exports['default'];
},{"./update":83,"./wrap":90}],78:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constant = require('./constant');

var _constant2 = _interopRequireDefault(_constant);

var _freeze = require('./freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _is = require('./is');

var _is2 = _interopRequireDefault(_is);

var _if2 = require('./if');

var _if3 = _interopRequireDefault(_if2);

var _ifElse = require('./ifElse');

var _ifElse2 = _interopRequireDefault(_ifElse);

var _map = require('./map');

var _map2 = _interopRequireDefault(_map);

var _omit = require('./omit');

var _omit2 = _interopRequireDefault(_omit);

var _reject = require('./reject');

var _reject2 = _interopRequireDefault(_reject);

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _updateIn = require('./updateIn');

var _updateIn2 = _interopRequireDefault(_updateIn);

var _withDefault = require('./withDefault');

var _withDefault2 = _interopRequireDefault(_withDefault);

var _utilCurry = require('./util/curry');

var u = _update2['default'];

u._ = _utilCurry._;
u.constant = _constant2['default'];
u['if'] = _if3['default'];
u.ifElse = _ifElse2['default'];
u.is = _is2['default'];
u.freeze = _freeze2['default'];
u.map = _map2['default'];
u.omit = _omit2['default'];
u.reject = _reject2['default'];
u.update = _update2['default'];
u.updateIn = _updateIn2['default'];
u.withDefault = _withDefault2['default'];

exports['default'] = u;
module.exports = exports['default'];
},{"./constant":74,"./freeze":75,"./if":76,"./ifElse":77,"./is":79,"./map":80,"./omit":81,"./reject":82,"./update":83,"./updateIn":84,"./util/curry":85,"./withDefault":89}],79:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilSplitPath = require('./util/splitPath');

var _utilSplitPath2 = _interopRequireDefault(_utilSplitPath);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

function is(path, predicate, object) {
  var parts = _utilSplitPath2['default'](path);

  var rest = object;
  var part = undefined;
  for (var _iterator = parts, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    if (_isArray) {
      if (_i >= _iterator.length) break;
      part = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      part = _i.value;
    }

    if (typeof rest === 'undefined') return false;
    rest = rest[part];
  }

  if (typeof predicate === 'function') {
    return predicate(rest);
  }

  return predicate === rest;
}

exports['default'] = _utilCurry2['default'](is);
module.exports = exports['default'];
},{"./util/curry":85,"./util/splitPath":88}],80:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _lodashCollectionForEach = require('lodash/collection/forEach');

var _lodashCollectionForEach2 = _interopRequireDefault(_lodashCollectionForEach);

var _lodashCollectionMap = require('lodash/collection/map');

var _lodashCollectionMap2 = _interopRequireDefault(_lodashCollectionMap);

var _lodashObjectMapValues = require('lodash/object/mapValues');

var _lodashObjectMapValues2 = _interopRequireDefault(_lodashObjectMapValues);

function shallowEqual(object, otherObject) {
  var equal = true;
  _lodashCollectionForEach2['default'](otherObject, function (value, key) {
    if (value !== object[key]) {
      equal = false;

      // exit early
      return false;
    }
  });

  return equal;
}

function map(iteratee, object) {
  var updater = typeof iteratee === 'function' ? iteratee : _update2['default'](iteratee);

  var mapper = Array.isArray(object) ? _lodashCollectionMap2['default'] : _lodashObjectMapValues2['default'];

  var newObject = mapper(object, updater);
  var equal = shallowEqual(object, newObject);

  return equal ? object : newObject;
}

exports['default'] = _wrap2['default'](map);
module.exports = exports['default'];
},{"./update":83,"./wrap":90,"lodash/collection/forEach":4,"lodash/collection/map":5,"lodash/object/mapValues":69}],81:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashObjectOmit = require('lodash/object/omit');

var _lodashObjectOmit2 = _interopRequireDefault(_lodashObjectOmit);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function omit(predicate, collection) {
  return _lodashObjectOmit2['default'](collection, predicate);
}

exports['default'] = _wrap2['default'](omit);
module.exports = exports['default'];
},{"./wrap":90,"lodash/object/omit":70}],82:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashCollectionReject = require('lodash/collection/reject');

var _lodashCollectionReject2 = _interopRequireDefault(_lodashCollectionReject);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function reject(predicate, collection) {
  return _lodashCollectionReject2['default'](collection, predicate);
}

exports['default'] = _wrap2['default'](reject);
module.exports = exports['default'];
},{"./wrap":90,"lodash/collection/reject":6}],83:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _utilIsEmpty = require('./util/isEmpty');

var _utilIsEmpty2 = _interopRequireDefault(_utilIsEmpty);

var _utilDefaultObject = require('./util/defaultObject');

var _utilDefaultObject2 = _interopRequireDefault(_utilDefaultObject);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

function reduce(object, callback, initialValue) {
  return Object.keys(object).reduce(function (acc, key) {
    return callback(acc, object[key], key);
  }, initialValue);
}

function resolveUpdates(updates, object) {
  return reduce(updates, function (acc, value, key) {
    var updatedValue = value;

    if (!Array.isArray(value) && value !== null && typeof value === 'object') {
      updatedValue = update(value, object[key]);
    } else if (typeof value === 'function') {
      updatedValue = value(object[key]);
    }

    if (object[key] !== updatedValue) {
      acc[key] = updatedValue;
    }

    return acc;
  }, {});
}

function updateArray(updates, object) {
  var newArray = [].concat(object);

  Object.keys(updates).forEach(function (key) {
    newArray[key] = updates[key];
  });

  return newArray;
}

/**
 * Recursively update an object or array.
 *
 * Can update with values:
 * update({ foo: 3 }, { foo: 1, bar: 2 });
 * // => { foo: 3, bar: 2 }
 *
 * Or with a function:
 * update({ foo: x => (x + 1) }, { foo: 2 });
 * // => { foo: 3 }
 *
 * @function
 * @name update
 * @param {Object|Function} updates
 * @param {Object|Array}    object to update
 * @return {Object|Array}   new object with modifications
 */
function update(updates, object) {
  if (typeof updates === 'function') {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return updates.apply(undefined, [object].concat(args));
  }

  if (!_lodashLangIsPlainObject2['default'](updates)) {
    return updates;
  }

  var defaultedObject = _utilDefaultObject2['default'](object, updates);

  var resolvedUpdates = resolveUpdates(updates, defaultedObject);

  if (_utilIsEmpty2['default'](resolvedUpdates)) {
    return defaultedObject;
  }

  if (Array.isArray(defaultedObject)) {
    return updateArray(resolvedUpdates, defaultedObject);
  }

  return _extends({}, defaultedObject, resolvedUpdates);
}

exports['default'] = _wrap2['default'](update, 2);
module.exports = exports['default'];
},{"./util/defaultObject":86,"./util/isEmpty":87,"./wrap":90,"lodash/lang/isPlainObject":65}],84:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

var _update2 = require('./update');

var _update3 = _interopRequireDefault(_update2);

var _map = require('./map');

var _map2 = _interopRequireDefault(_map);

var _utilSplitPath = require('./util/splitPath');

var _utilSplitPath2 = _interopRequireDefault(_utilSplitPath);

var wildcard = '*';

function reducePath(acc, key) {
  var _ref;

  if (key === wildcard) {
    return function (value) {
      var _update;

      return Object.prototype.hasOwnProperty.call(value, wildcard) ?
      // If we actually have wildcard as a property, update that
      _update3['default']((_update = {}, _update[wildcard] = acc, _update), value) :
      // Otherwise map over all properties
      _map2['default'](acc, value);
    };
  }

  return (_ref = {}, _ref[key] = acc, _ref);
}

function updateIn(path, value, object) {
  var parts = _utilSplitPath2['default'](path);
  var updates = parts.reduceRight(reducePath, value);

  return _update3['default'](updates, object);
}

exports['default'] = _utilCurry2['default'](updateIn);
module.exports = exports['default'];
},{"./map":80,"./update":83,"./util/curry":85,"./util/splitPath":88}],85:[function(require,module,exports){
/* eslint no-shadow:0, no-param-reassign:0 */
'use strict';

exports.__esModule = true;
exports.curry1 = curry1;
exports.curry2 = curry2;
exports.curry3 = curry3;
exports.curry4 = curry4;
exports['default'] = curry;
var _ = '@@updeep/placeholder';

exports._ = _;
function countArguments(args, max) {
  var n = args.length;
  if (n > max) n = max;

  while (args[n - 1] === _) {
    n--;
  }

  return n;
}

function curry1(fn) {
  return function curried(a) {
    for (var _len = arguments.length, _ref = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      _ref[_key - 1] = arguments[_key];
    }

    var b = _ref[0],
        c = _ref[1];

    var n = countArguments(arguments);

    if (n >= 1) return fn(a, b, c);
    return curried;
  };
}

function curry2(fn) {
  return function curried(a, b) {
    for (var _len2 = arguments.length, _ref2 = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      _ref2[_key2 - 2] = arguments[_key2];
    }

    var c = _ref2[0],
        d = _ref2[1];

    var n = countArguments(arguments, 2);

    if (b === _ || c === _ || d === _) {
      throw new Error('Can only use placeholder on first argument of this function.');
    }

    if (n >= 2) {
      if (a === _) return curry1(function (a, c, d) {
        return fn(a, b, c, d);
      });
      return fn(a, b, c, d);
    }

    if (n === 1) return curry1(function (b, c, d) {
      return fn(a, b, c, d);
    });
    return curried;
  };
}

function curry3(fn) {
  return function curried(a, b, c) {
    for (var _len3 = arguments.length, _ref3 = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
      _ref3[_key3 - 3] = arguments[_key3];
    }

    var d = _ref3[0],
        e = _ref3[1];

    var n = countArguments(arguments, 3);

    if (c === _ || d === _ || e === _) {
      throw new Error('Can only use placeholder on first or second argument of this function.');
    }

    if (n >= 3) {
      if (a === _) {
        if (b === _) return curry2(function (a, b, d, e) {
          return fn(a, b, c, d, e);
        });
        return curry1(function (a, d, e) {
          return fn(a, b, c, d, e);
        });
      }
      if (b === _) return curry1(function (b, d, e) {
        return fn(a, b, c, d, e);
      });
      return fn(a, b, c, d, e);
    }

    if (n === 2) {
      if (a === _) return curry2(function (a, c, d, e) {
        return fn(a, b, c, d, e);
      });
      return curry1(function (c, d, e) {
        return fn(a, b, c, d, e);
      });
    }

    if (n === 1) return curry2(function (b, c, d, e) {
      return fn(a, b, c, d, e);
    });

    return curried;
  };
}

function curry4(fn) {
  return function curried(a, b, c, d) {
    for (var _len4 = arguments.length, _ref4 = Array(_len4 > 4 ? _len4 - 4 : 0), _key4 = 4; _key4 < _len4; _key4++) {
      _ref4[_key4 - 4] = arguments[_key4];
    }

    var e = _ref4[0],
        f = _ref4[1];

    var n = countArguments(arguments, 4);

    if (d === _ || e === _ || f === _) {
      throw new Error('Can only use placeholder on first, second or third argument of this function.');
    }

    if (n >= 4) {
      if (a === _) {
        if (b === _) {
          if (c === _) return curry3(function (a, b, c, e, f) {
            return fn(a, b, c, d, e, f);
          });
          return curry2(function (a, b, e, f) {
            return fn(a, b, c, d, e, f);
          });
        }
        if (c === _) return curry2(function (a, c, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry1(function (a, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (b === _) {
        if (c === _) return curry2(function (b, c, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry1(function (b, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (c === _) return curry1(function (c, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return fn(a, b, c, d, e, f);
    }

    if (n === 3) {
      if (a === _) {
        if (b === _) return curry3(function (a, b, d, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry2(function (a, d, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (b === _) return curry2(function (b, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return curry1(function (d, e, f) {
        return fn(a, b, c, d, e, f);
      });
    }

    if (n === 2) {
      if (a === _) return curry3(function (a, c, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return curry2(function (c, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
    }

    if (n === 1) return curry3(function (b, c, d, e, f) {
      return fn(a, b, c, d, e, f);
    });
    return curried;
  };
}

function curry(fn) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? fn.length : arguments[1];
  return (function () {
    return [fn, curry1, curry2, curry3, curry4][length](fn);
  })();
}
},{}],86:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _isEmpty = require('./isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  var x = parseFloat(value);
  return (x | 0) === x;
}

function isArrayUpdate(updates) {
  for (var _iterator = Object.keys(updates), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var updateKey = _ref;

    if (!isInt(updateKey)) {
      return false;
    }
  }

  return true;
}

function arrayOrObject(updates) {
  if (!_isEmpty2['default'](updates) && isArrayUpdate(updates)) {
    return [];
  }

  return {};
}

function defaultObject(object, updates) {
  if (typeof object === 'undefined' || object === null) {
    return arrayOrObject(updates);
  }

  return object;
}

exports['default'] = defaultObject;
module.exports = exports['default'];
},{"./isEmpty":87}],87:[function(require,module,exports){
"use strict";

exports.__esModule = true;
function isEmpty(object) {
  return !Object.keys(object).length;
}

exports["default"] = isEmpty;
module.exports = exports["default"];
},{}],88:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = splitPath;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashCollectionReject = require('lodash/collection/reject');

var _lodashCollectionReject2 = _interopRequireDefault(_lodashCollectionReject);

function splitPath(path) {
  return Array.isArray(path) ? path : _lodashCollectionReject2['default'](path.split('.'), function (x) {
    return !x;
  });
}

module.exports = exports['default'];
},{"lodash/collection/reject":6}],89:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

function withDefault(defaultValue, updates, object) {
  if (typeof object === 'undefined') {
    return _update2['default'](updates, defaultValue);
  }

  return _update2['default'](updates, object);
}

exports['default'] = _utilCurry2['default'](withDefault);
module.exports = exports['default'];
},{"./update":83,"./util/curry":85}],90:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = wrap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

var _freeze = require('./freeze');

var _freeze2 = _interopRequireDefault(_freeze);

function wrap(func) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? func.length : arguments[1];
  return (function () {
    return _utilCurry2['default'](function () {
      return _freeze2['default'](func.apply(undefined, arguments));
    }, length);
  })();
}

module.exports = exports['default'];
},{"./freeze":75,"./util/curry":85}],91:[function(require,module,exports){
var actions;

actions = ['ProgressEntityTimeline', 'AddTrigger', 'AddMapping', 'AddEntity', 'AddTimeline', 'SetTimelineLoop', 'AttachEntityToTimeline', 'UpdateEntityData'];

module.exports = actions.reduce((function(acc, actionType) {
  acc[actionType] = actionType;
  return acc;
}), {});


},{}],92:[function(require,module,exports){
var _, addChildReducers, clamp, entitiesReducer, k, mapAssign, reducer, timelinesReducer, updeep, wrap,
  slice = [].slice;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

clamp = require('../util/clamp');

wrap = require('../util/wrap');

timelinesReducer = require('./timelines');

entitiesReducer = require('./entities');

reducer = function(state, action) {
  var applyTrigger, dataChanges, delta, entity, entityChanges, entityObj, newTimelines, oldTimelines, progress, reduceTriggers, ref, ref1, timeline, timelines, triggerChanges, updatedState;
  if (state == null) {
    state = {};
  }
  switch (action.type) {
    case k.ProgressEntityTimeline:
      ref = action.data, entity = ref.entity, timelines = ref.timelines, delta = ref.delta;

      /*
      1. Update progress on entity-timeline relation.
      2. Check if the progress update triggered any triggers. Perform those
         triggers.
      3. Update all mappings. (TODO: Change this to only updating updated
         timelines' mappings.)
       */
      entityObj = state.entities.dict[entity];
      entityChanges = {
        attachedTimelines: updeep.map(function(attachedTimeline) {
          var newProgress, oldProgress, progressDelta, timelineObj;
          if (_.contains(timelines, attachedTimeline.id)) {
            timelineObj = state.timelines.dict[attachedTimeline.id];
            progressDelta = delta / timelineObj.length;
            oldProgress = attachedTimeline.progress;
            newProgress = timelineObj.shouldLoop ? wrap(0, 1, oldProgress + progressDelta) : clamp(0, 1, oldProgress + progressDelta);
            return updeep.update({
              progress: newProgress
            }, attachedTimeline);
          } else {
            return attachedTimeline;
          }
        })
      };
      updatedState = updeep.updateIn("entities.dict." + entity, entityChanges, state);
      newTimelines = updatedState.entities.dict[entity].attachedTimelines;
      oldTimelines = state.entities.dict[entity].attachedTimelines;
      applyTrigger = function(newProgress, oldProgress) {
        return function(entityData, trigger) {
          var shouldPerformTrigger;
          shouldPerformTrigger = (function() {
            var ref1, ref2;
            switch (false) {
              case !_.isNumber(trigger.position):
                return ((oldProgress < (ref1 = trigger.position) && ref1 <= newProgress)) || ((newProgress < (ref2 = trigger.position) && ref2 <= oldProgress));
              case !_.isFunction(trigger.position):
                return trigger.position(newProgress, oldProgress);
              default:
                console.warn('Invalid trigger position on trigger', trigger);
                return false;
            }
          })();
          if (shouldPerformTrigger) {
            return _.assign({}, entityData, trigger.action(newProgress, entity, entityData));
          } else {
            return entityData;
          }
        };
      };
      reduceTriggers = function(data, __, i) {
        var applyThisTrigger, newProgress, oldProgress, timelineObj;
        timelineObj = updatedState.timelines.dict[newTimelines[i].id];
        newProgress = newTimelines[i].progress;
        oldProgress = oldTimelines[i].progress;
        applyThisTrigger = applyTrigger(newProgress, oldProgress);
        return timelineObj.triggers.reduce(applyThisTrigger, data);
      };
      triggerChanges = {
        data: newTimelines.reduce(reduceTriggers, updatedState.entities.dict[entity].data)
      };
      updatedState = updeep.updateIn("entities.dict." + entity, triggerChanges, updatedState);
      dataChanges = {
        data: (function() {
          var applyMapping;
          entityObj = updatedState.entities.dict[entity];
          applyMapping = function(progress) {
            return function(entityData, mapping) {
              return _.assign({}, entityData, mapping(progress, entity, entityData));
            };
          };
          return entityObj.attachedTimelines.reduce((function(data, attachedTimeline, idx) {
            var newProgress, timeline, updatedEntityObj;
            timeline = state.timelines.dict[attachedTimeline.id];
            updatedEntityObj = updatedState.entities.dict[entity];
            newProgress = updatedEntityObj.attachedTimelines[idx].progress;
            return timeline.mappings.reduce(applyMapping(newProgress), data);
          }), entityObj.data);
        })()
      };
      return updeep.updateIn("entities.dict." + entity, dataChanges, updatedState);
    case k.AttachEntityToTimeline:
      ref1 = action.data, entity = ref1.entity, timeline = ref1.timeline, progress = ref1.progress;
      return mapAssign(_.cloneDeep(state), "entities.dict." + entity + ".attachedTimelines", function(oldAttachedTimelines) {
        var checkTimeline, isTimelineAlreadyAttached, newAttachedTimeline;
        checkTimeline = function(tmln) {
          return tmln.id !== timeline;
        };
        isTimelineAlreadyAttached = _.all(oldAttachedTimelines, checkTimeline);
        if (isTimelineAlreadyAttached) {
          if (progress == null) {
            progress = 0;
          }
          newAttachedTimeline = {
            id: timeline,
            progress: progress
          };
          return slice.call(oldAttachedTimelines).concat([newAttachedTimeline]);
        } else {
          return oldAttachedTimelines;
        }
      });
    default:
      return state;
  }
};

module.exports = addChildReducers(reducer, {
  'timelines': timelinesReducer,
  'entities': entitiesReducer
});


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/clamp":96,"../util/mapAssign":98,"../util/wrap":99,"./entities":93,"./timelines":94,"lodash":"lodash","updeep":78}],93:[function(require,module,exports){
var _, addChildReducers, k, makeNewEntity, mapAssign, reducer, updeep;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

makeNewEntity = function(initialData) {
  if (initialData == null) {
    initialData = {};
  }
  return {
    attachedTimelines: [],
    data: initialData
  };
};

reducer = function(state, action) {
  var changes, entity, id, initialData, name, ref, ref1, stateChanges;
  if (state == null) {
    state = {
      dict: {},
      _spawnedCount: 0
    };
  }
  switch (action.type) {
    case k.AddEntity:
      if (action.data != null) {
        ref = action.data, name = ref.name, initialData = ref.initialData;
      }
      id = "entity-" + state._spawnedCount;
      changes = {
        dict: {},
        _spawnedCount: state._spawnedCount + 1
      };
      changes.dict[id] = makeNewEntity(initialData);
      if (name != null) {
        changes.dict[id].name = name;
      }
      return updeep(changes, state);
    case k.UpdateEntityData:
      ref1 = action.data, entity = ref1.entity, changes = ref1.changes;
      if (state.dict[entity] != null) {
        stateChanges = {
          dict: {}
        };
        stateChanges.dict[entity] = {
          data: changes
        };
        return updeep(stateChanges, state);
      } else {
        throw new Error("Attempted to update non-existant entity " + entity + ".");
      }
      break;
    default:
      return state;
  }
};

module.exports = reducer;


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/mapAssign":98,"lodash":"lodash","updeep":78}],94:[function(require,module,exports){
var _, addChildReducers, k, mapAssign, reducer, updeep,
  slice = [].slice;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

reducer = function(state, action) {
  var changes, length, mapping, position, ref, ref1, ref2, ref3, shouldLoop, timeline;
  if (state == null) {
    state = {
      dict: {},
      _spawnedCount: 0
    };
  }
  switch (action.type) {
    case k.AddTimeline:
      ref = _.defaults(action.data, {
        length: 1,
        shouldLoop: false
      }), length = ref.length, shouldLoop = ref.shouldLoop;
      changes = {
        dict: {},
        _spawnedCount: state._spawnedCount + 1
      };
      changes.dict["timeline-" + state._spawnedCount] = {
        length: length,
        shouldLoop: shouldLoop,
        triggers: [],
        mappings: []
      };
      return updeep(changes, state);
    case k.AddTrigger:
      ref1 = action.data, timeline = ref1.timeline, position = ref1.position, action = ref1.action;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".triggers", function(oldTriggers) {
        return slice.call(oldTriggers).concat([{
            position: position,
            action: action
          }]);
      });
    case k.AddMapping:
      ref2 = action.data, timeline = ref2.timeline, mapping = ref2.mapping;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".mappings", function(oldMappings) {
        return slice.call(oldMappings).concat([mapping]);
      });
    case k.SetTimelineLoop:
      ref3 = action.data, timeline = ref3.timeline, shouldLoop = ref3.shouldLoop;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".shouldLoop", function() {
        return shouldLoop;
      });
    default:
      return state;
  }
};

module.exports = reducer;


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/mapAssign":98,"lodash":"lodash","updeep":78}],95:[function(require,module,exports){
var _, addChildReducers;

_ = require('lodash');

module.exports = addChildReducers = function(baseReducer, childReducers) {
  if (childReducers == null) {
    childReducers = {};
  }
  return function(state, action) {
    var reduceOverChildren, result;
    if (state == null) {
      state = {};
    }
    reduceOverChildren = function(acc, key) {
      var changedState;
      changedState = {};
      changedState[key] = childReducers[key](acc[key], action);
      return _.assign({}, acc, changedState);
    };
    result = Object.keys(childReducers).reduce(reduceOverChildren, state);
    result = baseReducer(result, action);
    Object.freeze(result);
    return result;
  };
};


},{"lodash":"lodash"}],96:[function(require,module,exports){
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


},{}],97:[function(require,module,exports){
var offset, translate3d;

translate3d = function(x, y, z, element) {
  return ['-webkit-', '-moz-', '-o-', ''].forEach(function(prefix) {
    return element.style[prefix + "transform"] = "translate3d(" + x + ", " + y + ", " + z + ")";
  });
};

offset = function(left, top, element) {
  element.left = left;
  return element.top = top;
};

module.exports = {
  'translate3d': translate3d
};


},{}],98:[function(require,module,exports){

/*
Utility for mapping `Object.assign()` over arrays and objects.

@param obj [Object] Source object to map over and mutate.
@param path [String] Property path for mapping; can include property names,
  array indices (as numerals), and wildcards (`*`), delimited by `.`.
@param makeValue [Function] Function to determine new value to be placed at
  `path`. Parameters are:
    value - The current value at `path`, or `undefined` if path doesn't exist
      yet.
    wildcardValues - An array of values at each subpath ending in a wildcard,
      based on the current iteration.
    wildcards - An array of property names or indices of the wildcards, based
      on the current iteration.

@example

    obj =
      a: 1
      b: [
        {c: {p1: 1}}
        {c: {p2: 2, p3: 3}}
      ]

    result =
      mapAssign obj, 'b.*.c.*', (value, wildcardsValues, wildcards) ->
        console.log '=========='
        console.log 'value:', value
        console.log 'wildcardValues:', wildcardValues
        console.log 'wildcards:', wildcards
        return value + 1

     * Output:
     * ==========
     * value: 1
     * wildcardValues: [{c: {p1: 1}}, 1]
     * wildcards: [0, 'p1']
     * ==========
     * value: 2
     * wildcardValues: [{c: {p2: 2, p3: 3}}, 2]
     * wildcards: [0, 'p2']
     * ==========
     * value: 3
     * wildcardValues: [{c: {p2: 2, p3: 3}}, 3]
     * wildcards: [1, 'p3']


     * true
    result ==
      a: 1
      b: [
        {c: {p1: 2}}
        {c: {p2: 3, p3: 4}}
      ]
 */
var mapAssign,
  slice = [].slice;

module.exports = mapAssign = function(obj, pathString, makeValue) {
  var r;
  r = function(path, node, wildcardValues, wildcards) {
    var _, elm, first, i, j, key, keys, len, newWildcardValues, newWildcards, next, ref, results, results1, tail;
    if (wildcardValues == null) {
      wildcardValues = [];
    }
    if (wildcards == null) {
      wildcards = [];
    }
    if (path.length === 0) {
      return node;
    }
    if (node == null) {
      return {
        node: node,
        wildcardValues: wildcardValues,
        wildcards: wildcards
      };
    }
    first = path[0], tail = 2 <= path.length ? slice.call(path, 1) : [];
    next = tail[0], _ = 2 <= tail.length ? slice.call(tail, 1) : [];
    switch (first) {
      case '*':
        keys = node.constructor === Array ? (function() {
          results = [];
          for (var i = 0, ref = node.length; 0 <= ref ? i < ref : i > ref; 0 <= ref ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this) : Object.keys(node);
        results1 = [];
        for (j = 0, len = keys.length; j < len; j++) {
          key = keys[j];
          elm = node[key];
          newWildcardValues = slice.call(wildcardValues).concat([elm]);
          newWildcards = slice.call(wildcards).concat([key]);
          if (next != null) {
            results1.push(r(tail, elm, newWildcardValues, newWildcards));
          } else {
            results1.push(node[key] = makeValue(elm, newWildcardValues, newWildcards));
          }
        }
        return results1;
        break;
      default:
        key = node.constructor === Array ? (function() {
          var e, error;
          try {
            return parseInt(elm);
          } catch (error) {
            e = error;
            throw new Error('Attempted to index into an array with a non-integer value.');
          }
        })() : first;
        if (next != null) {
          elm = node[key] != null ? node[key] : (function() {
            node[key] = !isNaN(next) ? [] : {};
            return node[key];
          })();
          return r(tail, elm, wildcardValues, wildcards);
        } else {
          return node[key] = makeValue(node[key], wildcardValues, wildcards);
        }
    }
  };
  r(pathString.split('.'), obj);
  return obj;
};


},{}],99:[function(require,module,exports){
var wrap;

module.exports = wrap = function(low, high, n) {
  var fn;
  fn = function(n) {
    var range, t;
    range = high - low;
    t = n - low;
    while (t < 0) {
      t += range;
    }
    t = t % range;
    return t + low;
  };
  if (n != null) {
    return fn(n);
  } else {
    return fn;
  }
};


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9kZW1vL3NyYy9kZW1vLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2FycmF5L2xhc3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2NvbGxlY3Rpb24vZm9yRWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9tYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2NvbGxlY3Rpb24vcmVqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mdW5jdGlvbi9yZXN0UGFyYW0uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL1NldENhY2hlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheU1hcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlQdXNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheVNvbWUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VDYWxsYmFjay5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZURpZmZlcmVuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRmxhdHRlbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvckluLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRm9yT3duLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlR2V0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlSW5kZXhPZi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc0VxdWFsRGVlcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzTWF0Y2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VNYXRjaGVzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWF0Y2hlc1Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VQcm9wZXJ0eURlZXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VTbGljZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iaW5kQ2FsbGJhY2suanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NhY2hlSW5kZXhPZi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY2FjaGVQdXNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVCYXNlRWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUZvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQ2FjaGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZU9iamVjdE1hcHBlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZXF1YWxBcnJheXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsQnlUYWcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsT2JqZWN0cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZ2V0TGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXRNYXRjaERhdGEuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldE5hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaW5kZXhPZk5hTi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNBcnJheUxpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzS2V5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc1N0cmljdENvbXBhcmFibGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3BpY2tCeUFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9waWNrQnlDYWxsYmFjay5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvc2hpbUtleXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3RvT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90b1BhdGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzTmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNUeXBlZEFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L2tleXNJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L21hcFZhbHVlcy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L29taXQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9wYWlycy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdXRpbGl0eS9pZGVudGl0eS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdXRpbGl0eS9wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9jb25zdGFudC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9mcmVlemUuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvaWYuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvaWZFbHNlLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2lzLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L21hcC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9vbWl0LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3JlamVjdC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC91cGRhdGUuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXBkYXRlSW4uanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXRpbC9jdXJyeS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC91dGlsL2RlZmF1bHRPYmplY3QuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXRpbC9pc0VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3V0aWwvc3BsaXRQYXRoLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3dpdGhEZWZhdWx0LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3dyYXAuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvQWN0aW9uVHlwZXMuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3JlZHVjZXJzL2Jhc2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3JlZHVjZXJzL2VudGl0aWVzLmNvZmZlZSIsIi9Vc2Vycy9kYXZpZC9Eb2N1bWVudHMvV29yay9ob25leXBvd2VyL3NyYy9yZWR1Y2Vycy90aW1lbGluZXMuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3V0aWwvYWRkQ2hpbGRSZWR1Y2Vycy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC9jbGFtcC5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC9jc3NIZWxwZXJzLmNvZmZlZSIsIi9Vc2Vycy9kYXZpZC9Eb2N1bWVudHMvV29yay9ob25leXBvd2VyL3NyYy91dGlsL21hcEFzc2lnbi5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC93cmFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSOztBQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7QUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLHVCQUFSOztBQUNKLE9BQUEsR0FBVSxPQUFBLENBQVEseUJBQVI7O0FBRVYsTUFBd0IsT0FBQSxDQUFRLDJCQUFSLENBQXhCLEVBQUMsa0JBQUEsV0FBRCxFQUFjLGFBQUE7O0FBRWQsSUFBQSxHQUFPLE9BQUEsQ0FBUSxxQkFBUjs7QUFFUCxTQUFBLEdBQVksUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEI7O0FBQ1osTUFBQSxHQUFTLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCOztBQUNULE1BQU0sQ0FBQyxLQUFQLEdBQWUsU0FBUyxDQUFDOztBQUN6QixNQUFNLENBQUMsTUFBUCxHQUFnQixTQUFTLENBQUM7O0FBQzFCLFNBQVMsQ0FBQyxXQUFWLENBQXNCLE1BQXRCOztBQUdBLE1BQUEsR0FBUyxTQUFDLEtBQUQsRUFBUSxRQUFSO0VBQ1AsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBM0IsQ0FBRCxDQUFpQyxDQUFDLE9BQWxDLENBQTBDLFNBQUMsR0FBRDtJQUN4QyxJQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSyxDQUFBLEdBQUEsQ0FBSSxDQUFDLGlCQUFpQixDQUFDLE1BQTNDLEtBQXFELENBQXhEO2FBQ0UsUUFBQSxDQUNFO1FBQUEsSUFBQSxFQUFNLENBQUMsQ0FBQyxzQkFBUjtRQUNBLElBQUEsRUFDRTtVQUFBLE1BQUEsRUFBUSxHQUFSO1VBQ0EsUUFBQSxFQUFVLFlBRFY7U0FGRjtPQURGLEVBREY7O0VB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUMsR0FBRCxFQUFNLElBQU4sRUFBWSxDQUFaO0FBQ3RCLE1BQUE7RUFBQSxFQUFBLEdBQUssU0FBQyxDQUFEO0FBQ0gsUUFBQTtJQUFBLEtBQUEsR0FBUSxJQUFBLEdBQU87SUFDZixDQUFBLEdBQUksQ0FBQSxHQUFJO0FBQ1IsV0FBTSxDQUFBLEdBQUksQ0FBVjtNQUNFLENBQUEsSUFBSztJQURQO0lBRUEsQ0FBQSxHQUFJLENBQUEsR0FBSTtBQUNSLFdBQU8sQ0FBQSxHQUFJO0VBTlI7RUFRTCxJQUFHLFNBQUg7V0FDSyxFQUFBLENBQUcsQ0FBSCxFQURMO0dBQUEsTUFBQTtXQUVLLEdBRkw7O0FBVHNCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG5yZWR1eCA9IHJlcXVpcmUgJ3JlZHV4J1xuayA9IHJlcXVpcmUgJy4uLy4uL3NyYy9BY3Rpb25UeXBlcydcbnJlZHVjZXIgPSByZXF1aXJlICcuLi8uLi9zcmMvcmVkdWNlcnMvYmFzZSdcblxue3RyYW5zbGF0ZTNkLCBvZmZzZXR9ID0gcmVxdWlyZSAnLi4vLi4vc3JjL3V0aWwvY3NzSGVscGVycydcblxud3JhcCA9IHJlcXVpcmUgJy4uLy4uL3NyYy91dGlsL3dyYXAnXG5cbmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdjb250YWluZXInXG5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdjYW52YXMnXG5jYW52YXMud2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGhcbmNhbnZhcy5oZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0XG5jb250YWluZXIuYXBwZW5kQ2hpbGQgY2FudmFzXG5cblxudXBkYXRlID0gKHN0YXRlLCBkaXNwYXRjaCkgLT5cbiAgKE9iamVjdC5rZXlzIHN0YXRlLmVudGl0aWVzLmRpY3QpLmZvckVhY2ggKGtleSkgLT5cbiAgICBpZiBzdGF0ZS5lbnRpdGllcy5kaWN0W2tleV0uYXR0YWNoZWRUaW1lbGluZXMubGVuZ3RoIGlzIDBcbiAgICAgIGRpc3BhdGNoXG4gICAgICAgIHR5cGU6IGsuQXR0YWNoRW50aXR5VG9UaW1lbGluZVxuICAgICAgICBkYXRhOlxuICAgICAgICAgIGVudGl0eToga2V5XG4gICAgICAgICAgdGltZWxpbmU6ICd0aW1lbGluZS0wJ1xuXG4gIGRyYXcgKGNhbnZhcy5nZXRDb250ZXh0ICcyZCcpLCBzdGF0ZS5lbnRpdGllc1xuXG5cbmRyYXcgPSAoY3R4LCBlbnRpdGllcykgLT5cbiAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjdHguY2FudmFzLndpZHRoLCBjdHguY2FudmFzLmhlaWdodCk7XG4gIGN0eC5iZWdpblBhdGgoKVxuXG4gIGdldFBvc2l0aW9uID0gKGVudGl0eSkgLT5cbiAgICBpZiBlbnRpdHk/XG4gICAgICBwID0gZW50aXRpZXMuZGljdFtlbnRpdHldLmRhdGEucG9zaXRpb25cbiAgICAgIHg6IHAueCAqIGN0eC5jYW52YXMud2lkdGhcbiAgICAgIHk6IHAueSAqIGN0eC5jYW52YXMuaGVpZ2h0XG4gICAgZWxzZSBlbnRpdHlcblxuICBPYmplY3Qua2V5cyBlbnRpdGllcy5kaWN0XG4gICAgLmZvckVhY2ggKGtleSwgaWR4LCBhcnIpIC0+XG4gICAgICBwb3MgPSBnZXRQb3NpdGlvbiBrZXlcbiAgICAgIGN0eC5saW5lVG8gcG9zLngsIHBvcy55XG4gIGN0eC5jbG9zZVBhdGgoKVxuICBjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnXG4gIGN0eC5zdHJva2UoKVxuXG4gIE9iamVjdC5rZXlzIGVudGl0aWVzLmRpY3RcbiAgICAuZm9yRWFjaCAoa2V5LCBpZHgsIGFycikgLT5cbiAgICAgIHBvcyA9IGdldFBvc2l0aW9uIGtleVxuICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICBjdHguZWxsaXBzZSBwb3MueCwgcG9zLnksIDEwLCAxMCwgNDUgKiBNYXRoLlBJLzE4MCwgMCwgMiAqIE1hdGguUElcbiAgICAgIGN0eC5jbG9zZVBhdGgoKVxuICAgICAgY3R4LmZpbGxTdHlsZSA9IGVudGl0aWVzLmRpY3Rba2V5XS5kYXRhLnN0cm9rZUNvbG9yXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSBudWxsXG4gICAgICBjdHguZmlsbCgpXG5cblxuXG5kaWZmS2V5cyA9IChwcmV2aW91cywgY3VycmVudCkgLT5cbiAgYWRkZWQ6IChPYmplY3Qua2V5cyBjdXJyZW50KS5maWx0ZXIgKGtleSkgLT4gbm90IHByZXZpb3VzW2tleV0/XG4gIHJlbW92ZWQ6IChPYmplY3Qua2V5cyBwcmV2aW91cykuZmlsdGVyIChrZXkpIC0+IG5vdCBjdXJyZW50W2tleV0/XG5cbnNldHVwID0gKCkgLT5cbiAgc3RvcmUgPSByZWR1eC5jcmVhdGVTdG9yZSByZWR1Y2VyXG5cbiAgc2V0dXBUaW1lbGluZXMgc3RvcmUuZGlzcGF0Y2hcbiAgc2V0dXBJbnRlcmFjdGlvbnMgc3RvcmUuZGlzcGF0Y2gsIHN0b3JlXG5cbiAgc3RvcmUuc3Vic2NyaWJlICgpIC0+XG4gICAgdXBkYXRlIHN0b3JlLmdldFN0YXRlKCksIHN0b3JlLmRpc3BhdGNoXG5cbnNldHVwVGltZWxpbmVzID0gKGRpc3BhdGNoKSAtPlxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVGltZWxpbmVcbiAgICBkYXRhOlxuICAgICAgbGVuZ3RoOiAxXG4gICAgICBzaG91bGRMb29wOiB0cnVlXG5cbiAgZGlzcGF0Y2hcbiAgICB0eXBlOiBrLkFkZE1hcHBpbmdcbiAgICBkYXRhOlxuICAgICAgdGltZWxpbmU6ICd0aW1lbGluZS0wJ1xuICAgICAgbWFwcGluZzogKHByb2dyZXNzLCBlbnRpdHlJZCwgZW50aXR5RGF0YSkgLT5cbiAgICAgICAgXy5hc3NpZ24ge30sIGVudGl0eURhdGEsXG4gICAgICAgICAgcG9zaXRpb246XG4gICAgICAgICAgICB4OiAwLjUgKiAoKE1hdGguc2luIChwcm9ncmVzcyAqICg3NSAvIE1hdGguUEkpKSkgKyAxKVxuICAgICAgICAgICAgeTogMC41ICogKChNYXRoLnNpbiAocHJvZ3Jlc3MgKiAoNTAgLyBNYXRoLlBJKSkpICsgMSlcblxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVHJpZ2dlclxuICAgIGRhdGE6XG4gICAgICB0aW1lbGluZTogJ3RpbWVsaW5lLTAnXG4gICAgICBwb3NpdGlvbjogMC41XG4gICAgICBhY3Rpb246IChwcm9ncmVzcywgZW50aXR5SWQsIGVudGl0eURhdGEpIC0+XG4gICAgICAgIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLFxuICAgICAgICAgIHN0cm9rZUNvbG9yOiByYW5kb21Db2xvcigpXG5cbnNldHVwSW50ZXJhY3Rpb25zID0gKGRpc3BhdGNoLCBzdG9yZSkgLT5cbiAgYWRkRW50aXR5QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2FkZC1lbnRpdHknXG4gIGFkZEVudGl0eUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsICgpIC0+XG4gICAgZGlzcGF0Y2hcbiAgICAgIHR5cGU6IGsuQWRkRW50aXR5XG4gICAgICBkYXRhOlxuICAgICAgICBpbml0aWFsRGF0YTpcbiAgICAgICAgICBzdHJva2VDb2xvcjogJ2JsYWNrJ1xuICAgICAgICAgIHBvc2l0aW9uOlxuICAgICAgICAgICAgeDogMFxuICAgICAgICAgICAgeTogMFxuXG4gIHRpbWVsaW5lU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3RpbWVsaW5lLXNsaWRlcidcbiAgZ2V0VGltZWxpbmVWYWx1ZSA9ICgpIC0+IHRpbWVsaW5lU2xpZGVyLnZhbHVlIC8gMTAwXG5cbiAgcHJldmlvdXNTbGlkZXJWYWx1ZSA9IGdldFRpbWVsaW5lVmFsdWUoKVxuICBwcm9ncmVzc1RpbWVsaW5lID0gKCkgLT5cbiAgICB2ID0gZ2V0VGltZWxpbmVWYWx1ZSgpXG4gICAgT2JqZWN0LmtleXMgc3RvcmUuZ2V0U3RhdGUoKS5lbnRpdGllcy5kaWN0XG4gICAgICAuZm9yRWFjaCAoZW50aXR5SWQpIC0+XG4gICAgICAgIGRpc3BhdGNoXG4gICAgICAgICAgdHlwZTogay5Qcm9ncmVzc0VudGl0eVRpbWVsaW5lXG4gICAgICAgICAgZGF0YTpcbiAgICAgICAgICAgIGVudGl0eTogZW50aXR5SWRcbiAgICAgICAgICAgIHRpbWVsaW5lczogWyd0aW1lbGluZS0wJ11cbiAgICAgICAgICAgIGRlbHRhOiB2IC0gcHJldmlvdXNTbGlkZXJWYWx1ZVxuICAgIHByZXZpb3VzU2xpZGVyVmFsdWUgPSB2XG5cbiAgdGltZWxpbmVTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lciAnaW5wdXQnLCBwcm9ncmVzc1RpbWVsaW5lXG4gIHRpbWVsaW5lU2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ2NoYW5nZScsIHByb2dyZXNzVGltZWxpbmVcblxuICBpc0FuaW1hdGluZyA9IHRydWVcbiAgYW5pbWF0aW9uT2Zmc2V0ID0gMFxuICB0aW1lID0gMFxuICB1cGRhdGVUaW1lbGluZSA9ICh0KSAtPlxuICAgIHRpbWUgPSB0XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB1cGRhdGVUaW1lbGluZVxuICAgIGlmIGlzQW5pbWF0aW5nXG4gICAgICB0aW1lbGluZVNsaWRlci52YWx1ZSA9IHdyYXAgMCwgMTAwLCBNYXRoLmZsb29yICgoYW5pbWF0aW9uT2Zmc2V0ICsgdCkgLyAzMClcbiAgICAgIGRvIHByb2dyZXNzVGltZWxpbmVcblxuXG4gIHRpbWVsaW5lU2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsICgpIC0+XG4gICAgaXNBbmltYXRpbmcgPSBmYWxzZVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCAoKSAtPlxuICAgIGlmIG5vdCBpc0FuaW1hdGluZ1xuICAgICAgaXNBbmltYXRpbmcgPSB0cnVlXG4gICAgICBhbmltYXRpb25PZmZzZXQgPSB0aW1lbGluZVNsaWRlci52YWx1ZSAqIDMwIC0gdGltZVxuICAgICAgZG8gdXBkYXRlVGltZWxpbmVcblxuICBkbyB1cGRhdGVUaW1lbGluZVxuXG5kbyBzZXR1cFxuXG5cblxuIyAtLS0gSGVscGVyc1xuXG5yYW5kb21Db2xvciA9ICgpIC0+XG4gIHJhbmRvbThiaXQgPSAoKSAtPlxuICAgIE1hdGguZmxvb3IgKE1hdGgucmFuZG9tKCkgKiAyNTYpXG5cbiAgXCJcIlwiXG4gIHJnYmEoI3tyYW5kb204Yml0KCl9LCBcXFxuICAgICAgICN7cmFuZG9tOGJpdCgpfSwgXFxcbiAgICAgICAje3JhbmRvbThiaXQoKX0sIFxcXG4gICAgICAgMSlcbiAgXCJcIlwiIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKipcbiAqIEdldHMgdGhlIGxhc3QgZWxlbWVudCBvZiBgYXJyYXlgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgQXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBsYXN0IGVsZW1lbnQgb2YgYGFycmF5YC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5sYXN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiAzXG4gKi9cbmZ1bmN0aW9uIGxhc3QoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgcmV0dXJuIGxlbmd0aCA/IGFycmF5W2xlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxhc3Q7XG4iLCJ2YXIgYXJyYXlFYWNoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXJyYXlFYWNoJyksXG4gICAgYmFzZUVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRWFjaCcpLFxuICAgIGNyZWF0ZUZvckVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVGb3JFYWNoJyk7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBgY29sbGVjdGlvbmAgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3IgZWFjaCBlbGVtZW50LlxuICogVGhlIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOlxuICogKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLiBJdGVyYXRlZSBmdW5jdGlvbnMgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5XG4gKiBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqICoqTm90ZToqKiBBcyB3aXRoIG90aGVyIFwiQ29sbGVjdGlvbnNcIiBtZXRob2RzLCBvYmplY3RzIHdpdGggYSBcImxlbmd0aFwiIHByb3BlcnR5XG4gKiBhcmUgaXRlcmF0ZWQgbGlrZSBhcnJheXMuIFRvIGF2b2lkIHRoaXMgYmVoYXZpb3IgYF8uZm9ySW5gIG9yIGBfLmZvck93bmBcbiAqIG1heSBiZSB1c2VkIGZvciBvYmplY3QgaXRlcmF0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAYWxpYXMgZWFjaFxuICogQGNhdGVnb3J5IENvbGxlY3Rpb25cbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaXRlcmF0ZWU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgaXRlcmF0ZWVgLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfKFsxLCAyXSkuZm9yRWFjaChmdW5jdGlvbihuKSB7XG4gKiAgIGNvbnNvbGUubG9nKG4pO1xuICogfSkudmFsdWUoKTtcbiAqIC8vID0+IGxvZ3MgZWFjaCB2YWx1ZSBmcm9tIGxlZnQgdG8gcmlnaHQgYW5kIHJldHVybnMgdGhlIGFycmF5XG4gKlxuICogXy5mb3JFYWNoKHsgJ2EnOiAxLCAnYic6IDIgfSwgZnVuY3Rpb24obiwga2V5KSB7XG4gKiAgIGNvbnNvbGUubG9nKG4sIGtleSk7XG4gKiB9KTtcbiAqIC8vID0+IGxvZ3MgZWFjaCB2YWx1ZS1rZXkgcGFpciBhbmQgcmV0dXJucyB0aGUgb2JqZWN0IChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbnZhciBmb3JFYWNoID0gY3JlYXRlRm9yRWFjaChhcnJheUVhY2gsIGJhc2VFYWNoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JFYWNoO1xuIiwidmFyIGFycmF5TWFwID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXJyYXlNYXAnKSxcbiAgICBiYXNlQ2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlQ2FsbGJhY2snKSxcbiAgICBiYXNlTWFwID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZU1hcCcpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHZhbHVlcyBieSBydW5uaW5nIGVhY2ggZWxlbWVudCBpbiBgY29sbGVjdGlvbmAgdGhyb3VnaFxuICogYGl0ZXJhdGVlYC4gVGhlIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWVcbiAqIGFyZ3VtZW50czogKHZhbHVlLCBpbmRleHxrZXksIGNvbGxlY3Rpb24pLlxuICpcbiAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGl0ZXJhdGVlYCB0aGUgY3JlYXRlZCBgXy5wcm9wZXJ0eWBcbiAqIHN0eWxlIGNhbGxiYWNrIHJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIElmIGEgdmFsdWUgaXMgYWxzbyBwcm92aWRlZCBmb3IgYHRoaXNBcmdgIHRoZSBjcmVhdGVkIGBfLm1hdGNoZXNQcm9wZXJ0eWBcbiAqIHN0eWxlIGNhbGxiYWNrIHJldHVybnMgYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgYSBtYXRjaGluZyBwcm9wZXJ0eVxuICogdmFsdWUsIGVsc2UgYGZhbHNlYC5cbiAqXG4gKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBpdGVyYXRlZWAgdGhlIGNyZWF0ZWQgYF8ubWF0Y2hlc2Agc3R5bGVcbiAqIGNhbGxiYWNrIHJldHVybnMgYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuXG4gKiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqXG4gKiBNYW55IGxvZGFzaCBtZXRob2RzIGFyZSBndWFyZGVkIHRvIHdvcmsgYXMgaXRlcmF0ZWVzIGZvciBtZXRob2RzIGxpa2VcbiAqIGBfLmV2ZXJ5YCwgYF8uZmlsdGVyYCwgYF8ubWFwYCwgYF8ubWFwVmFsdWVzYCwgYF8ucmVqZWN0YCwgYW5kIGBfLnNvbWVgLlxuICpcbiAqIFRoZSBndWFyZGVkIG1ldGhvZHMgYXJlOlxuICogYGFyeWAsIGBjYWxsYmFja2AsIGBjaHVua2AsIGBjbG9uZWAsIGBjcmVhdGVgLCBgY3VycnlgLCBgY3VycnlSaWdodGAsXG4gKiBgZHJvcGAsIGBkcm9wUmlnaHRgLCBgZXZlcnlgLCBgZmlsbGAsIGBmbGF0dGVuYCwgYGludmVydGAsIGBtYXhgLCBgbWluYCxcbiAqIGBwYXJzZUludGAsIGBzbGljZWAsIGBzb3J0QnlgLCBgdGFrZWAsIGB0YWtlUmlnaHRgLCBgdGVtcGxhdGVgLCBgdHJpbWAsXG4gKiBgdHJpbUxlZnRgLCBgdHJpbVJpZ2h0YCwgYHRydW5jYCwgYHJhbmRvbWAsIGByYW5nZWAsIGBzYW1wbGVgLCBgc29tZWAsXG4gKiBgc3VtYCwgYHVuaXFgLCBhbmQgYHdvcmRzYFxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAYWxpYXMgY29sbGVjdFxuICogQGNhdGVnb3J5IENvbGxlY3Rpb25cbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZFxuICogIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGl0ZXJhdGVlYC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gdGltZXNUaHJlZShuKSB7XG4gKiAgIHJldHVybiBuICogMztcbiAqIH1cbiAqXG4gKiBfLm1hcChbMSwgMl0sIHRpbWVzVGhyZWUpO1xuICogLy8gPT4gWzMsIDZdXG4gKlxuICogXy5tYXAoeyAnYSc6IDEsICdiJzogMiB9LCB0aW1lc1RocmVlKTtcbiAqIC8vID0+IFszLCA2XSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIHZhciB1c2VycyA9IFtcbiAqICAgeyAndXNlcic6ICdiYXJuZXknIH0sXG4gKiAgIHsgJ3VzZXInOiAnZnJlZCcgfVxuICogXTtcbiAqXG4gKiAvLyB1c2luZyB0aGUgYF8ucHJvcGVydHlgIGNhbGxiYWNrIHNob3J0aGFuZFxuICogXy5tYXAodXNlcnMsICd1c2VyJyk7XG4gKiAvLyA9PiBbJ2Jhcm5leScsICdmcmVkJ11cbiAqL1xuZnVuY3Rpb24gbWFwKGNvbGxlY3Rpb24sIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gIHZhciBmdW5jID0gaXNBcnJheShjb2xsZWN0aW9uKSA/IGFycmF5TWFwIDogYmFzZU1hcDtcbiAgaXRlcmF0ZWUgPSBiYXNlQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpO1xuICByZXR1cm4gZnVuYyhjb2xsZWN0aW9uLCBpdGVyYXRlZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwO1xuIiwidmFyIGFycmF5RmlsdGVyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXJyYXlGaWx0ZXInKSxcbiAgICBiYXNlQ2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlQ2FsbGJhY2snKSxcbiAgICBiYXNlRmlsdGVyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUZpbHRlcicpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKTtcblxuLyoqXG4gKiBUaGUgb3Bwb3NpdGUgb2YgYF8uZmlsdGVyYDsgdGhpcyBtZXRob2QgcmV0dXJucyB0aGUgZWxlbWVudHMgb2YgYGNvbGxlY3Rpb25gXG4gKiB0aGF0IGBwcmVkaWNhdGVgIGRvZXMgKipub3QqKiByZXR1cm4gdHJ1dGh5IGZvci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IENvbGxlY3Rpb25cbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtwcmVkaWNhdGU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWRcbiAqICBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBwcmVkaWNhdGVgLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgZmlsdGVyZWQgYXJyYXkuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ucmVqZWN0KFsxLCAyLCAzLCA0XSwgZnVuY3Rpb24obikge1xuICogICByZXR1cm4gbiAlIDIgPT0gMDtcbiAqIH0pO1xuICogLy8gPT4gWzEsIDNdXG4gKlxuICogdmFyIHVzZXJzID0gW1xuICogICB7ICd1c2VyJzogJ2Jhcm5leScsICdhZ2UnOiAzNiwgJ2FjdGl2ZSc6IGZhbHNlIH0sXG4gKiAgIHsgJ3VzZXInOiAnZnJlZCcsICAgJ2FnZSc6IDQwLCAnYWN0aXZlJzogdHJ1ZSB9XG4gKiBdO1xuICpcbiAqIC8vIHVzaW5nIHRoZSBgXy5tYXRjaGVzYCBjYWxsYmFjayBzaG9ydGhhbmRcbiAqIF8ucGx1Y2soXy5yZWplY3QodXNlcnMsIHsgJ2FnZSc6IDQwLCAnYWN0aXZlJzogdHJ1ZSB9KSwgJ3VzZXInKTtcbiAqIC8vID0+IFsnYmFybmV5J11cbiAqXG4gKiAvLyB1c2luZyB0aGUgYF8ubWF0Y2hlc1Byb3BlcnR5YCBjYWxsYmFjayBzaG9ydGhhbmRcbiAqIF8ucGx1Y2soXy5yZWplY3QodXNlcnMsICdhY3RpdmUnLCBmYWxzZSksICd1c2VyJyk7XG4gKiAvLyA9PiBbJ2ZyZWQnXVxuICpcbiAqIC8vIHVzaW5nIHRoZSBgXy5wcm9wZXJ0eWAgY2FsbGJhY2sgc2hvcnRoYW5kXG4gKiBfLnBsdWNrKF8ucmVqZWN0KHVzZXJzLCAnYWN0aXZlJyksICd1c2VyJyk7XG4gKiAvLyA9PiBbJ2Jhcm5leSddXG4gKi9cbmZ1bmN0aW9uIHJlamVjdChjb2xsZWN0aW9uLCBwcmVkaWNhdGUsIHRoaXNBcmcpIHtcbiAgdmFyIGZ1bmMgPSBpc0FycmF5KGNvbGxlY3Rpb24pID8gYXJyYXlGaWx0ZXIgOiBiYXNlRmlsdGVyO1xuICBwcmVkaWNhdGUgPSBiYXNlQ2FsbGJhY2socHJlZGljYXRlLCB0aGlzQXJnLCAzKTtcbiAgcmV0dXJuIGZ1bmMoY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuICFwcmVkaWNhdGUodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVqZWN0O1xuIiwiLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlXG4gKiBjcmVhdGVkIGZ1bmN0aW9uIGFuZCBhcmd1bWVudHMgZnJvbSBgc3RhcnRgIGFuZCBiZXlvbmQgcHJvdmlkZWQgYXMgYW4gYXJyYXkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGlzIGJhc2VkIG9uIHRoZSBbcmVzdCBwYXJhbWV0ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9GdW5jdGlvbnMvcmVzdF9wYXJhbWV0ZXJzKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBhcHBseSBhIHJlc3QgcGFyYW1ldGVyIHRvLlxuICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydD1mdW5jLmxlbmd0aC0xXSBUaGUgc3RhcnQgcG9zaXRpb24gb2YgdGhlIHJlc3QgcGFyYW1ldGVyLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBzYXkgPSBfLnJlc3RQYXJhbShmdW5jdGlvbih3aGF0LCBuYW1lcykge1xuICogICByZXR1cm4gd2hhdCArICcgJyArIF8uaW5pdGlhbChuYW1lcykuam9pbignLCAnKSArXG4gKiAgICAgKF8uc2l6ZShuYW1lcykgPiAxID8gJywgJiAnIDogJycpICsgXy5sYXN0KG5hbWVzKTtcbiAqIH0pO1xuICpcbiAqIHNheSgnaGVsbG8nLCAnZnJlZCcsICdiYXJuZXknLCAncGViYmxlcycpO1xuICogLy8gPT4gJ2hlbGxvIGZyZWQsIGJhcm5leSwgJiBwZWJibGVzJ1xuICovXG5mdW5jdGlvbiByZXN0UGFyYW0oZnVuYywgc3RhcnQpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgc3RhcnQgPSBuYXRpdmVNYXgoc3RhcnQgPT09IHVuZGVmaW5lZCA/IChmdW5jLmxlbmd0aCAtIDEpIDogKCtzdGFydCB8fCAwKSwgMCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gbmF0aXZlTWF4KGFyZ3MubGVuZ3RoIC0gc3RhcnQsIDApLFxuICAgICAgICByZXN0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICByZXN0W2luZGV4XSA9IGFyZ3Nbc3RhcnQgKyBpbmRleF07XG4gICAgfVxuICAgIHN3aXRjaCAoc3RhcnQpIHtcbiAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCByZXN0KTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmdzWzBdLCBhcmdzWzFdLCByZXN0KTtcbiAgICB9XG4gICAgdmFyIG90aGVyQXJncyA9IEFycmF5KHN0YXJ0ICsgMSk7XG4gICAgaW5kZXggPSAtMTtcbiAgICB3aGlsZSAoKytpbmRleCA8IHN0YXJ0KSB7XG4gICAgICBvdGhlckFyZ3NbaW5kZXhdID0gYXJnc1tpbmRleF07XG4gICAgfVxuICAgIG90aGVyQXJnc1tzdGFydF0gPSByZXN0O1xuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIG90aGVyQXJncyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzdFBhcmFtO1xuIiwidmFyIGNhY2hlUHVzaCA9IHJlcXVpcmUoJy4vY2FjaGVQdXNoJyksXG4gICAgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9nZXROYXRpdmUnKTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBTZXQgPSBnZXROYXRpdmUoZ2xvYmFsLCAnU2V0Jyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqXG4gKiBDcmVhdGVzIGEgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIHVuaXF1ZSB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIFNldENhY2hlKHZhbHVlcykge1xuICB2YXIgbGVuZ3RoID0gdmFsdWVzID8gdmFsdWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5kYXRhID0geyAnaGFzaCc6IG5hdGl2ZUNyZWF0ZShudWxsKSwgJ3NldCc6IG5ldyBTZXQgfTtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgdGhpcy5wdXNoKHZhbHVlc1tsZW5ndGhdKTtcbiAgfVxufVxuXG4vLyBBZGQgZnVuY3Rpb25zIHRvIHRoZSBgU2V0YCBjYWNoZS5cblNldENhY2hlLnByb3RvdHlwZS5wdXNoID0gY2FjaGVQdXNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldENhY2hlO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uZm9yRWFjaGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYGFycmF5YC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlFYWNoKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGlmIChpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkgPT09IGZhbHNlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5RWFjaDtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmZpbHRlcmAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgZmlsdGVyZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5RmlsdGVyKGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICByZXNJbmRleCA9IC0xLFxuICAgICAgcmVzdWx0ID0gW107XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgcmVzdWx0WysrcmVzSW5kZXhdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlGaWx0ZXI7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5tYXBgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhcnJheU1hcChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5TWFwO1xuIiwiLyoqXG4gKiBBcHBlbmRzIHRoZSBlbGVtZW50cyBvZiBgdmFsdWVzYCB0byBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gYXBwZW5kLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UHVzaChhcnJheSwgdmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgIG9mZnNldCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W29mZnNldCArIGluZGV4XSA9IHZhbHVlc1tpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5UHVzaDtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLnNvbWVgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbnkgZWxlbWVudCBwYXNzZXMgdGhlIHByZWRpY2F0ZSBjaGVjayxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5U29tZShhcnJheSwgcHJlZGljYXRlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKHByZWRpY2F0ZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlTb21lO1xuIiwidmFyIGJhc2VNYXRjaGVzID0gcmVxdWlyZSgnLi9iYXNlTWF0Y2hlcycpLFxuICAgIGJhc2VNYXRjaGVzUHJvcGVydHkgPSByZXF1aXJlKCcuL2Jhc2VNYXRjaGVzUHJvcGVydHknKSxcbiAgICBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuL2JpbmRDYWxsYmFjaycpLFxuICAgIGlkZW50aXR5ID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9pZGVudGl0eScpLFxuICAgIHByb3BlcnR5ID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wcm9wZXJ0eScpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmNhbGxiYWNrYCB3aGljaCBzdXBwb3J0cyBzcGVjaWZ5aW5nIHRoZVxuICogbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSBbZnVuYz1fLmlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjYWxsYmFjay5cbiAqL1xuZnVuY3Rpb24gYmFzZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGZ1bmM7XG4gIGlmICh0eXBlID09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdGhpc0FyZyA9PT0gdW5kZWZpbmVkXG4gICAgICA/IGZ1bmNcbiAgICAgIDogYmluZENhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KTtcbiAgfVxuICBpZiAoZnVuYyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIGlmICh0eXBlID09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGJhc2VNYXRjaGVzKGZ1bmMpO1xuICB9XG4gIHJldHVybiB0aGlzQXJnID09PSB1bmRlZmluZWRcbiAgICA/IHByb3BlcnR5KGZ1bmMpXG4gICAgOiBiYXNlTWF0Y2hlc1Byb3BlcnR5KGZ1bmMsIHRoaXNBcmcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDYWxsYmFjaztcbiIsInZhciBiYXNlSW5kZXhPZiA9IHJlcXVpcmUoJy4vYmFzZUluZGV4T2YnKSxcbiAgICBjYWNoZUluZGV4T2YgPSByZXF1aXJlKCcuL2NhY2hlSW5kZXhPZicpLFxuICAgIGNyZWF0ZUNhY2hlID0gcmVxdWlyZSgnLi9jcmVhdGVDYWNoZScpO1xuXG4vKiogVXNlZCBhcyB0aGUgc2l6ZSB0byBlbmFibGUgbGFyZ2UgYXJyYXkgb3B0aW1pemF0aW9ucy4gKi9cbnZhciBMQVJHRV9BUlJBWV9TSVpFID0gMjAwO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmRpZmZlcmVuY2VgIHdoaWNoIGFjY2VwdHMgYSBzaW5nbGUgYXJyYXlcbiAqIG9mIHZhbHVlcyB0byBleGNsdWRlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaW5zcGVjdC5cbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBUaGUgdmFsdWVzIHRvIGV4Y2x1ZGUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBhcnJheSBvZiBmaWx0ZXJlZCB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIGJhc2VEaWZmZXJlbmNlKGFycmF5LCB2YWx1ZXMpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIGlmICghbGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGluZGV4T2YgPSBiYXNlSW5kZXhPZixcbiAgICAgIGlzQ29tbW9uID0gdHJ1ZSxcbiAgICAgIGNhY2hlID0gKGlzQ29tbW9uICYmIHZhbHVlcy5sZW5ndGggPj0gTEFSR0VfQVJSQVlfU0laRSkgPyBjcmVhdGVDYWNoZSh2YWx1ZXMpIDogbnVsbCxcbiAgICAgIHZhbHVlc0xlbmd0aCA9IHZhbHVlcy5sZW5ndGg7XG5cbiAgaWYgKGNhY2hlKSB7XG4gICAgaW5kZXhPZiA9IGNhY2hlSW5kZXhPZjtcbiAgICBpc0NvbW1vbiA9IGZhbHNlO1xuICAgIHZhbHVlcyA9IGNhY2hlO1xuICB9XG4gIG91dGVyOlxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcblxuICAgIGlmIChpc0NvbW1vbiAmJiB2YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgIHZhciB2YWx1ZXNJbmRleCA9IHZhbHVlc0xlbmd0aDtcbiAgICAgIHdoaWxlICh2YWx1ZXNJbmRleC0tKSB7XG4gICAgICAgIGlmICh2YWx1ZXNbdmFsdWVzSW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGluZGV4T2YodmFsdWVzLCB2YWx1ZSwgMCkgPCAwKSB7XG4gICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZURpZmZlcmVuY2U7XG4iLCJ2YXIgYmFzZUZvck93biA9IHJlcXVpcmUoJy4vYmFzZUZvck93bicpLFxuICAgIGNyZWF0ZUJhc2VFYWNoID0gcmVxdWlyZSgnLi9jcmVhdGVCYXNlRWFjaCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvckVhY2hgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAqL1xudmFyIGJhc2VFYWNoID0gY3JlYXRlQmFzZUVhY2goYmFzZUZvck93bik7XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUVhY2g7XG4iLCJ2YXIgYmFzZUVhY2ggPSByZXF1aXJlKCcuL2Jhc2VFYWNoJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZmlsdGVyYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgZmlsdGVyZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGaWx0ZXIoY29sbGVjdGlvbiwgcHJlZGljYXRlKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgYmFzZUVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pKSB7XG4gICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRmlsdGVyO1xuIiwidmFyIGFycmF5UHVzaCA9IHJlcXVpcmUoJy4vYXJyYXlQdXNoJyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZmxhdHRlbmAgd2l0aCBhZGRlZCBzdXBwb3J0IGZvciByZXN0cmljdGluZ1xuICogZmxhdHRlbmluZyBhbmQgc3BlY2lmeWluZyB0aGUgc3RhcnQgaW5kZXguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBmbGF0dGVuLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNEZWVwXSBTcGVjaWZ5IGEgZGVlcCBmbGF0dGVuLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNTdHJpY3RdIFJlc3RyaWN0IGZsYXR0ZW5pbmcgdG8gYXJyYXlzLWxpa2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtyZXN1bHQ9W11dIFRoZSBpbml0aWFsIHJlc3VsdCB2YWx1ZS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZsYXR0ZW5lZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYmFzZUZsYXR0ZW4oYXJyYXksIGlzRGVlcCwgaXNTdHJpY3QsIHJlc3VsdCkge1xuICByZXN1bHQgfHwgKHJlc3VsdCA9IFtdKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSkgJiZcbiAgICAgICAgKGlzU3RyaWN0IHx8IGlzQXJyYXkodmFsdWUpIHx8IGlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgZmxhdHRlbiBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICAgICAgYmFzZUZsYXR0ZW4odmFsdWUsIGlzRGVlcCwgaXNTdHJpY3QsIHJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheVB1c2gocmVzdWx0LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNTdHJpY3QpIHtcbiAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGbGF0dGVuO1xuIiwidmFyIGNyZWF0ZUJhc2VGb3IgPSByZXF1aXJlKCcuL2NyZWF0ZUJhc2VGb3InKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgYmFzZUZvckluYCBhbmQgYGJhc2VGb3JPd25gIHdoaWNoIGl0ZXJhdGVzXG4gKiBvdmVyIGBvYmplY3RgIHByb3BlcnRpZXMgcmV0dXJuZWQgYnkgYGtleXNGdW5jYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvclxuICogZWFjaCBwcm9wZXJ0eS4gSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5XG4gKiByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBrZXlzRnVuYyBUaGUgZnVuY3Rpb24gdG8gZ2V0IHRoZSBrZXlzIG9mIGBvYmplY3RgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xudmFyIGJhc2VGb3IgPSBjcmVhdGVCYXNlRm9yKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvcjtcbiIsInZhciBiYXNlRm9yID0gcmVxdWlyZSgnLi9iYXNlRm9yJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvckluYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlRm9ySW4ob2JqZWN0LCBpdGVyYXRlZSkge1xuICByZXR1cm4gYmFzZUZvcihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzSW4pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3JJbjtcbiIsInZhciBiYXNlRm9yID0gcmVxdWlyZSgnLi9iYXNlRm9yJyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yT3duYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlRm9yT3duKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgcmV0dXJuIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5cyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvck93bjtcbiIsInZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgZ2V0YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0cmluZyBwYXRoc1xuICogYW5kIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge0FycmF5fSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhdGhLZXldIFRoZSBrZXkgcmVwcmVzZW50YXRpb24gb2YgcGF0aC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSByZXNvbHZlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYmFzZUdldChvYmplY3QsIHBhdGgsIHBhdGhLZXkpIHtcbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChwYXRoS2V5ICE9PSB1bmRlZmluZWQgJiYgcGF0aEtleSBpbiB0b09iamVjdChvYmplY3QpKSB7XG4gICAgcGF0aCA9IFtwYXRoS2V5XTtcbiAgfVxuICB2YXIgaW5kZXggPSAwLFxuICAgICAgbGVuZ3RoID0gcGF0aC5sZW5ndGg7XG5cbiAgd2hpbGUgKG9iamVjdCAhPSBudWxsICYmIGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgb2JqZWN0ID0gb2JqZWN0W3BhdGhbaW5kZXgrK11dO1xuICB9XG4gIHJldHVybiAoaW5kZXggJiYgaW5kZXggPT0gbGVuZ3RoKSA/IG9iamVjdCA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0O1xuIiwidmFyIGluZGV4T2ZOYU4gPSByZXF1aXJlKCcuL2luZGV4T2ZOYU4nKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pbmRleE9mYCB3aXRob3V0IHN1cHBvcnQgZm9yIGJpbmFyeSBzZWFyY2hlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gKiBAcGFyYW0ge251bWJlcn0gZnJvbUluZGV4IFRoZSBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIHZhbHVlLCBlbHNlIGAtMWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJbmRleE9mKGFycmF5LCB2YWx1ZSwgZnJvbUluZGV4KSB7XG4gIGlmICh2YWx1ZSAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gaW5kZXhPZk5hTihhcnJheSwgZnJvbUluZGV4KTtcbiAgfVxuICB2YXIgaW5kZXggPSBmcm9tSW5kZXggLSAxLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5W2luZGV4XSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJbmRleE9mO1xuIiwidmFyIGJhc2VJc0VxdWFsRGVlcCA9IHJlcXVpcmUoJy4vYmFzZUlzRXF1YWxEZWVwJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0VxdWFsYCB3aXRob3V0IHN1cHBvcnQgZm9yIGB0aGlzYCBiaW5kaW5nXG4gKiBgY3VzdG9taXplcmAgZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHsqfSBvdGhlciBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0FdIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQl0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNFcXVhbCh2YWx1ZSwgb3RoZXIsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIGlmICh2YWx1ZSA9PT0gb3RoZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodmFsdWUgPT0gbnVsbCB8fCBvdGhlciA9PSBudWxsIHx8ICghaXNPYmplY3QodmFsdWUpICYmICFpc09iamVjdExpa2Uob3RoZXIpKSkge1xuICAgIHJldHVybiB2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyO1xuICB9XG4gIHJldHVybiBiYXNlSXNFcXVhbERlZXAodmFsdWUsIG90aGVyLCBiYXNlSXNFcXVhbCwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0VxdWFsO1xuIiwidmFyIGVxdWFsQXJyYXlzID0gcmVxdWlyZSgnLi9lcXVhbEFycmF5cycpLFxuICAgIGVxdWFsQnlUYWcgPSByZXF1aXJlKCcuL2VxdWFsQnlUYWcnKSxcbiAgICBlcXVhbE9iamVjdHMgPSByZXF1aXJlKCcuL2VxdWFsT2JqZWN0cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbGAgZm9yIGFycmF5cyBhbmQgb2JqZWN0cyB3aGljaCBwZXJmb3Jtc1xuICogZGVlcCBjb21wYXJpc29ucyBhbmQgdHJhY2tzIHRyYXZlcnNlZCBvYmplY3RzIGVuYWJsaW5nIG9iamVjdHMgd2l0aCBjaXJjdWxhclxuICogcmVmZXJlbmNlcyB0byBiZSBjb21wYXJlZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIG9iamVjdHMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzRXF1YWxEZWVwKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgdmFyIG9iaklzQXJyID0gaXNBcnJheShvYmplY3QpLFxuICAgICAgb3RoSXNBcnIgPSBpc0FycmF5KG90aGVyKSxcbiAgICAgIG9ialRhZyA9IGFycmF5VGFnLFxuICAgICAgb3RoVGFnID0gYXJyYXlUYWc7XG5cbiAgaWYgKCFvYmpJc0Fycikge1xuICAgIG9ialRhZyA9IG9ialRvU3RyaW5nLmNhbGwob2JqZWN0KTtcbiAgICBpZiAob2JqVGFnID09IGFyZ3NUYWcpIHtcbiAgICAgIG9ialRhZyA9IG9iamVjdFRhZztcbiAgICB9IGVsc2UgaWYgKG9ialRhZyAhPSBvYmplY3RUYWcpIHtcbiAgICAgIG9iaklzQXJyID0gaXNUeXBlZEFycmF5KG9iamVjdCk7XG4gICAgfVxuICB9XG4gIGlmICghb3RoSXNBcnIpIHtcbiAgICBvdGhUYWcgPSBvYmpUb1N0cmluZy5jYWxsKG90aGVyKTtcbiAgICBpZiAob3RoVGFnID09IGFyZ3NUYWcpIHtcbiAgICAgIG90aFRhZyA9IG9iamVjdFRhZztcbiAgICB9IGVsc2UgaWYgKG90aFRhZyAhPSBvYmplY3RUYWcpIHtcbiAgICAgIG90aElzQXJyID0gaXNUeXBlZEFycmF5KG90aGVyKTtcbiAgICB9XG4gIH1cbiAgdmFyIG9iaklzT2JqID0gb2JqVGFnID09IG9iamVjdFRhZyxcbiAgICAgIG90aElzT2JqID0gb3RoVGFnID09IG9iamVjdFRhZyxcbiAgICAgIGlzU2FtZVRhZyA9IG9ialRhZyA9PSBvdGhUYWc7XG5cbiAgaWYgKGlzU2FtZVRhZyAmJiAhKG9iaklzQXJyIHx8IG9iaklzT2JqKSkge1xuICAgIHJldHVybiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIG9ialRhZyk7XG4gIH1cbiAgaWYgKCFpc0xvb3NlKSB7XG4gICAgdmFyIG9iaklzV3JhcHBlZCA9IG9iaklzT2JqICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnX193cmFwcGVkX18nKSxcbiAgICAgICAgb3RoSXNXcmFwcGVkID0gb3RoSXNPYmogJiYgaGFzT3duUHJvcGVydHkuY2FsbChvdGhlciwgJ19fd3JhcHBlZF9fJyk7XG5cbiAgICBpZiAob2JqSXNXcmFwcGVkIHx8IG90aElzV3JhcHBlZCkge1xuICAgICAgcmV0dXJuIGVxdWFsRnVuYyhvYmpJc1dyYXBwZWQgPyBvYmplY3QudmFsdWUoKSA6IG9iamVjdCwgb3RoSXNXcmFwcGVkID8gb3RoZXIudmFsdWUoKSA6IG90aGVyLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG4gICAgfVxuICB9XG4gIGlmICghaXNTYW1lVGFnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIEFzc3VtZSBjeWNsaWMgdmFsdWVzIGFyZSBlcXVhbC5cbiAgLy8gRm9yIG1vcmUgaW5mb3JtYXRpb24gb24gZGV0ZWN0aW5nIGNpcmN1bGFyIHJlZmVyZW5jZXMgc2VlIGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jSk8uXG4gIHN0YWNrQSB8fCAoc3RhY2tBID0gW10pO1xuICBzdGFja0IgfHwgKHN0YWNrQiA9IFtdKTtcblxuICB2YXIgbGVuZ3RoID0gc3RhY2tBLmxlbmd0aDtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgaWYgKHN0YWNrQVtsZW5ndGhdID09IG9iamVjdCkge1xuICAgICAgcmV0dXJuIHN0YWNrQltsZW5ndGhdID09IG90aGVyO1xuICAgIH1cbiAgfVxuICAvLyBBZGQgYG9iamVjdGAgYW5kIGBvdGhlcmAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICBzdGFja0EucHVzaChvYmplY3QpO1xuICBzdGFja0IucHVzaChvdGhlcik7XG5cbiAgdmFyIHJlc3VsdCA9IChvYmpJc0FyciA/IGVxdWFsQXJyYXlzIDogZXF1YWxPYmplY3RzKShvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcblxuICBzdGFja0EucG9wKCk7XG4gIHN0YWNrQi5wb3AoKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0VxdWFsRGVlcDtcbiIsInZhciBiYXNlSXNFcXVhbCA9IHJlcXVpcmUoJy4vYmFzZUlzRXF1YWwnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc01hdGNoYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge0FycmF5fSBtYXRjaERhdGEgVGhlIHByb3BlcnkgbmFtZXMsIHZhbHVlcywgYW5kIGNvbXBhcmUgZmxhZ3MgdG8gbWF0Y2guXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgb2JqZWN0YCBpcyBhIG1hdGNoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc01hdGNoKG9iamVjdCwgbWF0Y2hEYXRhLCBjdXN0b21pemVyKSB7XG4gIHZhciBpbmRleCA9IG1hdGNoRGF0YS5sZW5ndGgsXG4gICAgICBsZW5ndGggPSBpbmRleCxcbiAgICAgIG5vQ3VzdG9taXplciA9ICFjdXN0b21pemVyO1xuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiAhbGVuZ3RoO1xuICB9XG4gIG9iamVjdCA9IHRvT2JqZWN0KG9iamVjdCk7XG4gIHdoaWxlIChpbmRleC0tKSB7XG4gICAgdmFyIGRhdGEgPSBtYXRjaERhdGFbaW5kZXhdO1xuICAgIGlmICgobm9DdXN0b21pemVyICYmIGRhdGFbMl0pXG4gICAgICAgICAgPyBkYXRhWzFdICE9PSBvYmplY3RbZGF0YVswXV1cbiAgICAgICAgICA6ICEoZGF0YVswXSBpbiBvYmplY3QpXG4gICAgICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGRhdGEgPSBtYXRjaERhdGFbaW5kZXhdO1xuICAgIHZhciBrZXkgPSBkYXRhWzBdLFxuICAgICAgICBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICBzcmNWYWx1ZSA9IGRhdGFbMV07XG5cbiAgICBpZiAobm9DdXN0b21pemVyICYmIGRhdGFbMl0pIHtcbiAgICAgIGlmIChvYmpWYWx1ZSA9PT0gdW5kZWZpbmVkICYmICEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIob2JqVmFsdWUsIHNyY1ZhbHVlLCBrZXkpIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKCEocmVzdWx0ID09PSB1bmRlZmluZWQgPyBiYXNlSXNFcXVhbChzcmNWYWx1ZSwgb2JqVmFsdWUsIGN1c3RvbWl6ZXIsIHRydWUpIDogcmVzdWx0KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc01hdGNoO1xuIiwidmFyIGJhc2VFYWNoID0gcmVxdWlyZSgnLi9iYXNlRWFjaCcpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi9pc0FycmF5TGlrZScpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1hcGAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFjayBzaG9ydGhhbmRzXG4gKiBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBiYXNlTWFwKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcmVzdWx0ID0gaXNBcnJheUxpa2UoY29sbGVjdGlvbikgPyBBcnJheShjb2xsZWN0aW9uLmxlbmd0aCkgOiBbXTtcblxuICBiYXNlRWFjaChjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKSB7XG4gICAgcmVzdWx0WysraW5kZXhdID0gaXRlcmF0ZWUodmFsdWUsIGtleSwgY29sbGVjdGlvbik7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNYXA7XG4iLCJ2YXIgYmFzZUlzTWF0Y2ggPSByZXF1aXJlKCcuL2Jhc2VJc01hdGNoJyksXG4gICAgZ2V0TWF0Y2hEYXRhID0gcmVxdWlyZSgnLi9nZXRNYXRjaERhdGEnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5tYXRjaGVzYCB3aGljaCBkb2VzIG5vdCBjbG9uZSBgc291cmNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBtYXRjaC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlTWF0Y2hlcyhzb3VyY2UpIHtcbiAgdmFyIG1hdGNoRGF0YSA9IGdldE1hdGNoRGF0YShzb3VyY2UpO1xuICBpZiAobWF0Y2hEYXRhLmxlbmd0aCA9PSAxICYmIG1hdGNoRGF0YVswXVsyXSkge1xuICAgIHZhciBrZXkgPSBtYXRjaERhdGFbMF1bMF0sXG4gICAgICAgIHZhbHVlID0gbWF0Y2hEYXRhWzBdWzFdO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmplY3Rba2V5XSA9PT0gdmFsdWUgJiYgKHZhbHVlICE9PSB1bmRlZmluZWQgfHwgKGtleSBpbiB0b09iamVjdChvYmplY3QpKSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIGJhc2VJc01hdGNoKG9iamVjdCwgbWF0Y2hEYXRhKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWF0Y2hlcztcbiIsInZhciBiYXNlR2V0ID0gcmVxdWlyZSgnLi9iYXNlR2V0JyksXG4gICAgYmFzZUlzRXF1YWwgPSByZXF1aXJlKCcuL2Jhc2VJc0VxdWFsJyksXG4gICAgYmFzZVNsaWNlID0gcmVxdWlyZSgnLi9iYXNlU2xpY2UnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNLZXkgPSByZXF1aXJlKCcuL2lzS2V5JyksXG4gICAgaXNTdHJpY3RDb21wYXJhYmxlID0gcmVxdWlyZSgnLi9pc1N0cmljdENvbXBhcmFibGUnKSxcbiAgICBsYXN0ID0gcmVxdWlyZSgnLi4vYXJyYXkvbGFzdCcpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpLFxuICAgIHRvUGF0aCA9IHJlcXVpcmUoJy4vdG9QYXRoJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWF0Y2hlc1Byb3BlcnR5YCB3aGljaCBkb2VzIG5vdCBjbG9uZSBgc3JjVmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHBhcmFtIHsqfSBzcmNWYWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlTWF0Y2hlc1Byb3BlcnR5KHBhdGgsIHNyY1ZhbHVlKSB7XG4gIHZhciBpc0FyciA9IGlzQXJyYXkocGF0aCksXG4gICAgICBpc0NvbW1vbiA9IGlzS2V5KHBhdGgpICYmIGlzU3RyaWN0Q29tcGFyYWJsZShzcmNWYWx1ZSksXG4gICAgICBwYXRoS2V5ID0gKHBhdGggKyAnJyk7XG5cbiAgcGF0aCA9IHRvUGF0aChwYXRoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIga2V5ID0gcGF0aEtleTtcbiAgICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuICAgIGlmICgoaXNBcnIgfHwgIWlzQ29tbW9uKSAmJiAhKGtleSBpbiBvYmplY3QpKSB7XG4gICAgICBvYmplY3QgPSBwYXRoLmxlbmd0aCA9PSAxID8gb2JqZWN0IDogYmFzZUdldChvYmplY3QsIGJhc2VTbGljZShwYXRoLCAwLCAtMSkpO1xuICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGtleSA9IGxhc3QocGF0aCk7XG4gICAgICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0W2tleV0gPT09IHNyY1ZhbHVlXG4gICAgICA/IChzcmNWYWx1ZSAhPT0gdW5kZWZpbmVkIHx8IChrZXkgaW4gb2JqZWN0KSlcbiAgICAgIDogYmFzZUlzRXF1YWwoc3JjVmFsdWUsIG9iamVjdFtrZXldLCB1bmRlZmluZWQsIHRydWUpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNYXRjaGVzUHJvcGVydHk7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VQcm9wZXJ0eTtcbiIsInZhciBiYXNlR2V0ID0gcmVxdWlyZSgnLi9iYXNlR2V0JyksXG4gICAgdG9QYXRoID0gcmVxdWlyZSgnLi90b1BhdGgnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VQcm9wZXJ0eWAgd2hpY2ggc3VwcG9ydHMgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHlEZWVwKHBhdGgpIHtcbiAgdmFyIHBhdGhLZXkgPSAocGF0aCArICcnKTtcbiAgcGF0aCA9IHRvUGF0aChwYXRoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBiYXNlR2V0KG9iamVjdCwgcGF0aCwgcGF0aEtleSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVByb3BlcnR5RGVlcDtcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uc2xpY2VgIHdpdGhvdXQgYW4gaXRlcmF0ZWUgY2FsbCBndWFyZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNsaWNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydD0wXSBUaGUgc3RhcnQgcG9zaXRpb24uXG4gKiBAcGFyYW0ge251bWJlcn0gW2VuZD1hcnJheS5sZW5ndGhdIFRoZSBlbmQgcG9zaXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHNsaWNlIG9mIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VTbGljZShhcnJheSwgc3RhcnQsIGVuZCkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICBzdGFydCA9IHN0YXJ0ID09IG51bGwgPyAwIDogKCtzdGFydCB8fCAwKTtcbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gLXN0YXJ0ID4gbGVuZ3RoID8gMCA6IChsZW5ndGggKyBzdGFydCk7XG4gIH1cbiAgZW5kID0gKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IGxlbmd0aCkgPyBsZW5ndGggOiAoK2VuZCB8fCAwKTtcbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuZ3RoO1xuICB9XG4gIGxlbmd0aCA9IHN0YXJ0ID4gZW5kID8gMCA6ICgoZW5kIC0gc3RhcnQpID4+PiAwKTtcbiAgc3RhcnQgPj4+PSAwO1xuXG4gIHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBhcnJheVtpbmRleCArIHN0YXJ0XTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VTbGljZTtcbiIsIi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyBpZiBpdCdzIG5vdCBvbmUuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZFxuICogZm9yIGBudWxsYCBvciBgdW5kZWZpbmVkYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogKHZhbHVlICsgJycpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsInZhciBpZGVudGl0eSA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvaWRlbnRpdHknKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VDYWxsYmFja2Agd2hpY2ggb25seSBzdXBwb3J0cyBgdGhpc2AgYmluZGluZ1xuICogYW5kIHNwZWNpZnlpbmcgdGhlIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGJpbmQuXG4gKiBAcGFyYW0geyp9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjYWxsYmFjay5cbiAqL1xuZnVuY3Rpb24gYmluZENhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIGlmICh0aGlzQXJnID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZnVuYztcbiAgfVxuICBzd2l0Y2ggKGFyZ0NvdW50KSB7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgICBjYXNlIDQ6IHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA1OiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyLCBrZXksIG9iamVjdCwgc291cmNlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiaW5kQ2FsbGJhY2s7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgaW4gYGNhY2hlYCBtaW1pY2tpbmcgdGhlIHJldHVybiBzaWduYXR1cmUgb2ZcbiAqIGBfLmluZGV4T2ZgIGJ5IHJldHVybmluZyBgMGAgaWYgdGhlIHZhbHVlIGlzIGZvdW5kLCBlbHNlIGAtMWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBjYWNoZSBUaGUgY2FjaGUgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYDBgIGlmIGB2YWx1ZWAgaXMgZm91bmQsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gY2FjaGVJbmRleE9mKGNhY2hlLCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IGNhY2hlLmRhdGEsXG4gICAgICByZXN1bHQgPSAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnIHx8IGlzT2JqZWN0KHZhbHVlKSkgPyBkYXRhLnNldC5oYXModmFsdWUpIDogZGF0YS5oYXNoW3ZhbHVlXTtcblxuICByZXR1cm4gcmVzdWx0ID8gMCA6IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhY2hlSW5kZXhPZjtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqXG4gKiBBZGRzIGB2YWx1ZWAgdG8gdGhlIGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBwdXNoXG4gKiBAbWVtYmVyT2YgU2V0Q2FjaGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBjYWNoZVB1c2godmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLmRhdGE7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHwgaXNPYmplY3QodmFsdWUpKSB7XG4gICAgZGF0YS5zZXQuYWRkKHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBkYXRhLmhhc2hbdmFsdWVdID0gdHJ1ZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhY2hlUHVzaDtcbiIsInZhciBnZXRMZW5ndGggPSByZXF1aXJlKCcuL2dldExlbmd0aCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgYmFzZUVhY2hgIG9yIGBiYXNlRWFjaFJpZ2h0YCBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZWFjaEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VFYWNoKGVhY2hGdW5jLCBmcm9tUmlnaHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKSB7XG4gICAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBnZXRMZW5ndGgoY29sbGVjdGlvbikgOiAwO1xuICAgIGlmICghaXNMZW5ndGgobGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGVhY2hGdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKTtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gZnJvbVJpZ2h0ID8gbGVuZ3RoIDogLTEsXG4gICAgICAgIGl0ZXJhYmxlID0gdG9PYmplY3QoY29sbGVjdGlvbik7XG5cbiAgICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2luZGV4XSwgaW5kZXgsIGl0ZXJhYmxlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUJhc2VFYWNoO1xuIiwidmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBiYXNlIGZ1bmN0aW9uIGZvciBgXy5mb3JJbmAgb3IgYF8uZm9ySW5SaWdodGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYmFzZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmFzZUZvcihmcm9tUmlnaHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCwgaXRlcmF0ZWUsIGtleXNGdW5jKSB7XG4gICAgdmFyIGl0ZXJhYmxlID0gdG9PYmplY3Qob2JqZWN0KSxcbiAgICAgICAgcHJvcHMgPSBrZXlzRnVuYyhvYmplY3QpLFxuICAgICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICAgIGluZGV4ID0gZnJvbVJpZ2h0ID8gbGVuZ3RoIDogLTE7XG5cbiAgICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICAgIGlmIChpdGVyYXRlZShpdGVyYWJsZVtrZXldLCBrZXksIGl0ZXJhYmxlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQmFzZUZvcjtcbiIsInZhciBTZXRDYWNoZSA9IHJlcXVpcmUoJy4vU2V0Q2FjaGUnKSxcbiAgICBnZXROYXRpdmUgPSByZXF1aXJlKCcuL2dldE5hdGl2ZScpO1xuXG4vKiogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIFNldCA9IGdldE5hdGl2ZShnbG9iYWwsICdTZXQnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVDcmVhdGUgPSBnZXROYXRpdmUoT2JqZWN0LCAnY3JlYXRlJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBTZXRgIGNhY2hlIG9iamVjdCB0byBvcHRpbWl6ZSBsaW5lYXIgc2VhcmNoZXMgb2YgbGFyZ2UgYXJyYXlzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbdmFsdWVzXSBUaGUgdmFsdWVzIHRvIGNhY2hlLlxuICogQHJldHVybnMge251bGx8T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgY2FjaGUgb2JqZWN0IGlmIGBTZXRgIGlzIHN1cHBvcnRlZCwgZWxzZSBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNhY2hlKHZhbHVlcykge1xuICByZXR1cm4gKG5hdGl2ZUNyZWF0ZSAmJiBTZXQpID8gbmV3IFNldENhY2hlKHZhbHVlcykgOiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNhY2hlO1xuIiwidmFyIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiBmb3IgYF8uZm9yRWFjaGAgb3IgYF8uZm9yRWFjaFJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gYXJyYXlGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYW4gYXJyYXkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGVhY2ggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZvckVhY2goYXJyYXlGdW5jLCBlYWNoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUsIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBpdGVyYXRlZSA9PSAnZnVuY3Rpb24nICYmIHRoaXNBcmcgPT09IHVuZGVmaW5lZCAmJiBpc0FycmF5KGNvbGxlY3Rpb24pKVxuICAgICAgPyBhcnJheUZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpXG4gICAgICA6IGVhY2hGdW5jKGNvbGxlY3Rpb24sIGJpbmRDYWxsYmFjayhpdGVyYXRlZSwgdGhpc0FyZywgMykpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZvckVhY2g7XG4iLCJ2YXIgYmFzZUNhbGxiYWNrID0gcmVxdWlyZSgnLi9iYXNlQ2FsbGJhY2snKSxcbiAgICBiYXNlRm9yT3duID0gcmVxdWlyZSgnLi9iYXNlRm9yT3duJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGZvciBgXy5tYXBLZXlzYCBvciBgXy5tYXBWYWx1ZXNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc01hcEtleXNdIFNwZWNpZnkgbWFwcGluZyBrZXlzIGluc3RlYWQgb2YgdmFsdWVzLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgbWFwIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVPYmplY3RNYXBwZXIoaXNNYXBLZXlzKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGl0ZXJhdGVlID0gYmFzZUNhbGxiYWNrKGl0ZXJhdGVlLCB0aGlzQXJnLCAzKTtcblxuICAgIGJhc2VGb3JPd24ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgICAgIHZhciBtYXBwZWQgPSBpdGVyYXRlZSh2YWx1ZSwga2V5LCBvYmplY3QpO1xuICAgICAga2V5ID0gaXNNYXBLZXlzID8gbWFwcGVkIDoga2V5O1xuICAgICAgdmFsdWUgPSBpc01hcEtleXMgPyB2YWx1ZSA6IG1hcHBlZDtcbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVPYmplY3RNYXBwZXI7XG4iLCJ2YXIgYXJyYXlTb21lID0gcmVxdWlyZSgnLi9hcnJheVNvbWUnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsRGVlcGAgZm9yIGFycmF5cyB3aXRoIHN1cHBvcnQgZm9yXG4gKiBwYXJ0aWFsIGRlZXAgY29tcGFyaXNvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtBcnJheX0gb3RoZXIgVGhlIG90aGVyIGFycmF5IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgYXJyYXlzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0JdIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBhcnJheXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gZXF1YWxBcnJheXMoYXJyYXksIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgYXJyTGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgb3RoTGVuZ3RoID0gb3RoZXIubGVuZ3RoO1xuXG4gIGlmIChhcnJMZW5ndGggIT0gb3RoTGVuZ3RoICYmICEoaXNMb29zZSAmJiBvdGhMZW5ndGggPiBhcnJMZW5ndGgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIElnbm9yZSBub24taW5kZXggcHJvcGVydGllcy5cbiAgd2hpbGUgKCsraW5kZXggPCBhcnJMZW5ndGgpIHtcbiAgICB2YXIgYXJyVmFsdWUgPSBhcnJheVtpbmRleF0sXG4gICAgICAgIG90aFZhbHVlID0gb3RoZXJbaW5kZXhdLFxuICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcihpc0xvb3NlID8gb3RoVmFsdWUgOiBhcnJWYWx1ZSwgaXNMb29zZSA/IGFyclZhbHVlIDogb3RoVmFsdWUsIGluZGV4KSA6IHVuZGVmaW5lZDtcblxuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICBpZiAoaXNMb29zZSkge1xuICAgICAgaWYgKCFhcnJheVNvbWUob3RoZXIsIGZ1bmN0aW9uKG90aFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyVmFsdWUgPT09IG90aFZhbHVlIHx8IGVxdWFsRnVuYyhhcnJWYWx1ZSwgb3RoVmFsdWUsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICAgICAgICB9KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghKGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fCBlcXVhbEZ1bmMoYXJyVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsQXJyYXlzO1xuIiwiLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGJvb2xUYWcgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXScsXG4gICAgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgcmVnZXhwVGFnID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBjb21wYXJpbmcgb2JqZWN0cyBvZlxuICogdGhlIHNhbWUgYHRvU3RyaW5nVGFnYC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBvbmx5IHN1cHBvcnRzIGNvbXBhcmluZyB2YWx1ZXMgd2l0aCB0YWdzIG9mXG4gKiBgQm9vbGVhbmAsIGBEYXRlYCwgYEVycm9yYCwgYE51bWJlcmAsIGBSZWdFeHBgLCBvciBgU3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgYHRvU3RyaW5nVGFnYCBvZiB0aGUgb2JqZWN0cyB0byBjb21wYXJlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsQnlUYWcob2JqZWN0LCBvdGhlciwgdGFnKSB7XG4gIHN3aXRjaCAodGFnKSB7XG4gICAgY2FzZSBib29sVGFnOlxuICAgIGNhc2UgZGF0ZVRhZzpcbiAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtYmVycywgZGF0ZXMgdG8gbWlsbGlzZWNvbmRzIGFuZCBib29sZWFuc1xuICAgICAgLy8gdG8gYDFgIG9yIGAwYCB0cmVhdGluZyBpbnZhbGlkIGRhdGVzIGNvZXJjZWQgdG8gYE5hTmAgYXMgbm90IGVxdWFsLlxuICAgICAgcmV0dXJuICtvYmplY3QgPT0gK290aGVyO1xuXG4gICAgY2FzZSBlcnJvclRhZzpcbiAgICAgIHJldHVybiBvYmplY3QubmFtZSA9PSBvdGhlci5uYW1lICYmIG9iamVjdC5tZXNzYWdlID09IG90aGVyLm1lc3NhZ2U7XG5cbiAgICBjYXNlIG51bWJlclRhZzpcbiAgICAgIC8vIFRyZWF0IGBOYU5gIHZzLiBgTmFOYCBhcyBlcXVhbC5cbiAgICAgIHJldHVybiAob2JqZWN0ICE9ICtvYmplY3QpXG4gICAgICAgID8gb3RoZXIgIT0gK290aGVyXG4gICAgICAgIDogb2JqZWN0ID09ICtvdGhlcjtcblxuICAgIGNhc2UgcmVnZXhwVGFnOlxuICAgIGNhc2Ugc3RyaW5nVGFnOlxuICAgICAgLy8gQ29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyBhbmQgdHJlYXQgc3RyaW5ncyBwcmltaXRpdmVzIGFuZCBzdHJpbmdcbiAgICAgIC8vIG9iamVjdHMgYXMgZXF1YWwuIFNlZSBodHRwczovL2VzNS5naXRodWIuaW8vI3gxNS4xMC42LjQgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgIHJldHVybiBvYmplY3QgPT0gKG90aGVyICsgJycpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbEJ5VGFnO1xuIiwidmFyIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsRGVlcGAgZm9yIG9iamVjdHMgd2l0aCBzdXBwb3J0IGZvclxuICogcGFydGlhbCBkZWVwIGNvbXBhcmlzb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgdmFsdWVzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0JdIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsT2JqZWN0cyhvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBvYmpQcm9wcyA9IGtleXMob2JqZWN0KSxcbiAgICAgIG9iakxlbmd0aCA9IG9ialByb3BzLmxlbmd0aCxcbiAgICAgIG90aFByb3BzID0ga2V5cyhvdGhlciksXG4gICAgICBvdGhMZW5ndGggPSBvdGhQcm9wcy5sZW5ndGg7XG5cbiAgaWYgKG9iakxlbmd0aCAhPSBvdGhMZW5ndGggJiYgIWlzTG9vc2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGluZGV4ID0gb2JqTGVuZ3RoO1xuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIHZhciBrZXkgPSBvYmpQcm9wc1tpbmRleF07XG4gICAgaWYgKCEoaXNMb29zZSA/IGtleSBpbiBvdGhlciA6IGhhc093blByb3BlcnR5LmNhbGwob3RoZXIsIGtleSkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHZhciBza2lwQ3RvciA9IGlzTG9vc2U7XG4gIHdoaWxlICgrK2luZGV4IDwgb2JqTGVuZ3RoKSB7XG4gICAga2V5ID0gb2JqUHJvcHNbaW5kZXhdO1xuICAgIHZhciBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICBvdGhWYWx1ZSA9IG90aGVyW2tleV0sXG4gICAgICAgIHJlc3VsdCA9IGN1c3RvbWl6ZXIgPyBjdXN0b21pemVyKGlzTG9vc2UgPyBvdGhWYWx1ZSA6IG9ialZhbHVlLCBpc0xvb3NlPyBvYmpWYWx1ZSA6IG90aFZhbHVlLCBrZXkpIDogdW5kZWZpbmVkO1xuXG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgaWYgKCEocmVzdWx0ID09PSB1bmRlZmluZWQgPyBlcXVhbEZ1bmMob2JqVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikgOiByZXN1bHQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHNraXBDdG9yIHx8IChza2lwQ3RvciA9IGtleSA9PSAnY29uc3RydWN0b3InKTtcbiAgfVxuICBpZiAoIXNraXBDdG9yKSB7XG4gICAgdmFyIG9iakN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgIG90aEN0b3IgPSBvdGhlci5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIE5vbiBgT2JqZWN0YCBvYmplY3QgaW5zdGFuY2VzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWFsLlxuICAgIGlmIChvYmpDdG9yICE9IG90aEN0b3IgJiZcbiAgICAgICAgKCdjb25zdHJ1Y3RvcicgaW4gb2JqZWN0ICYmICdjb25zdHJ1Y3RvcicgaW4gb3RoZXIpICYmXG4gICAgICAgICEodHlwZW9mIG9iakN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBvYmpDdG9yIGluc3RhbmNlb2Ygb2JqQ3RvciAmJlxuICAgICAgICAgIHR5cGVvZiBvdGhDdG9yID09ICdmdW5jdGlvbicgJiYgb3RoQ3RvciBpbnN0YW5jZW9mIG90aEN0b3IpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsT2JqZWN0cztcbiIsInZhciBiYXNlUHJvcGVydHkgPSByZXF1aXJlKCcuL2Jhc2VQcm9wZXJ0eScpO1xuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldExlbmd0aDtcbiIsInZhciBpc1N0cmljdENvbXBhcmFibGUgPSByZXF1aXJlKCcuL2lzU3RyaWN0Q29tcGFyYWJsZScpLFxuICAgIHBhaXJzID0gcmVxdWlyZSgnLi4vb2JqZWN0L3BhaXJzJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgcHJvcGVyeSBuYW1lcywgdmFsdWVzLCBhbmQgY29tcGFyZSBmbGFncyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBtYXRjaCBkYXRhIG9mIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBnZXRNYXRjaERhdGEob2JqZWN0KSB7XG4gIHZhciByZXN1bHQgPSBwYWlycyhvYmplY3QpLFxuICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcblxuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICByZXN1bHRbbGVuZ3RoXVsyXSA9IGlzU3RyaWN0Q29tcGFyYWJsZShyZXN1bHRbbGVuZ3RoXVsxXSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRNYXRjaERhdGE7XG4iLCJ2YXIgaXNOYXRpdmUgPSByZXF1aXJlKCcuLi9sYW5nL2lzTmF0aXZlJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGZ1bmN0aW9uIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZCB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZnVuY3Rpb24gaWYgaXQncyBuYXRpdmUsIGVsc2UgYHVuZGVmaW5lZGAuXG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZShvYmplY3QsIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICByZXR1cm4gaXNOYXRpdmUodmFsdWUpID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TmF0aXZlO1xuIiwiLyoqXG4gKiBHZXRzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBgTmFOYCBpcyBmb3VuZCBpbiBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHtudW1iZXJ9IGZyb21JbmRleCBUaGUgaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIGBOYU5gLCBlbHNlIGAtMWAuXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2ZOYU4oYXJyYXksIGZyb21JbmRleCwgZnJvbVJpZ2h0KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICBpbmRleCA9IGZyb21JbmRleCArIChmcm9tUmlnaHQgPyAwIDogLTEpO1xuXG4gIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgdmFyIG90aGVyID0gYXJyYXlbaW5kZXhdO1xuICAgIGlmIChvdGhlciAhPT0gb3RoZXIpIHtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluZGV4T2ZOYU47XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCIvKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXlxcZCskLztcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YWx1ZSA9ICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHwgcmVJc1VpbnQudGVzdCh2YWx1ZSkpID8gK3ZhbHVlIDogLTE7XG4gIGxlbmd0aCA9IGxlbmd0aCA9PSBudWxsID8gTUFYX1NBRkVfSU5URUdFUiA6IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPCBsZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJbmRleDtcbiIsInZhciBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIHByb3BlcnR5IG5hbWVzIHdpdGhpbiBwcm9wZXJ0eSBwYXRocy4gKi9cbnZhciByZUlzRGVlcFByb3AgPSAvXFwufFxcWyg/OlteW1xcXV0qfChbXCInXSkoPzooPyFcXDEpW15cXG5cXFxcXXxcXFxcLikqP1xcMSlcXF0vLFxuICAgIHJlSXNQbGFpblByb3AgPSAvXlxcdyokLztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUgYW5kIG5vdCBhIHByb3BlcnR5IHBhdGguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcXVlcnkga2V5cyBvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcHJvcGVydHkgbmFtZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0tleSh2YWx1ZSwgb2JqZWN0KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICBpZiAoKHR5cGUgPT0gJ3N0cmluZycgJiYgcmVJc1BsYWluUHJvcC50ZXN0KHZhbHVlKSkgfHwgdHlwZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgcmVzdWx0ID0gIXJlSXNEZWVwUHJvcC50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIHJlc3VsdCB8fCAob2JqZWN0ICE9IG51bGwgJiYgdmFsdWUgaW4gdG9PYmplY3Qob2JqZWN0KSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNLZXk7XG4iLCIvKipcbiAqIFVzZWQgYXMgdGhlIFttYXhpbXVtIGxlbmd0aF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtbnVtYmVyLm1heF9zYWZlX2ludGVnZXIpXG4gKiBvZiBhbiBhcnJheS1saWtlIHZhbHVlLlxuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3Igc3RyaWN0IGVxdWFsaXR5IGNvbXBhcmlzb25zLCBpLmUuIGA9PT1gLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlmIHN1aXRhYmxlIGZvciBzdHJpY3RcbiAqICBlcXVhbGl0eSBjb21wYXJpc29ucywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc1N0cmljdENvbXBhcmFibGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSB2YWx1ZSAmJiAhaXNPYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3RyaWN0Q29tcGFyYWJsZTtcbiIsInZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ucGlja2Agd2hpY2ggcGlja3MgYG9iamVjdGAgcHJvcGVydGllcyBzcGVjaWZpZWRcbiAqIGJ5IGBwcm9wc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBwcm9wcyBUaGUgcHJvcGVydHkgbmFtZXMgdG8gcGljay5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHBpY2tCeUFycmF5KG9iamVjdCwgcHJvcHMpIHtcbiAgb2JqZWN0ID0gdG9PYmplY3Qob2JqZWN0KTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IHt9O1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBpZiAoa2V5IGluIG9iamVjdCkge1xuICAgICAgcmVzdWx0W2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwaWNrQnlBcnJheTtcbiIsInZhciBiYXNlRm9ySW4gPSByZXF1aXJlKCcuL2Jhc2VGb3JJbicpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5waWNrYCB3aGljaCBwaWNrcyBgb2JqZWN0YCBwcm9wZXJ0aWVzIGBwcmVkaWNhdGVgXG4gKiByZXR1cm5zIHRydXRoeSBmb3IuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHBpY2tCeUNhbGxiYWNrKG9iamVjdCwgcHJlZGljYXRlKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgYmFzZUZvckluKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwga2V5LCBvYmplY3QpKSB7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGlja0J5Q2FsbGJhY2s7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuL2lzSW5kZXgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBjcmVhdGVzIGFuIGFycmF5IG9mIHRoZVxuICogb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIHNoaW1LZXlzKG9iamVjdCkge1xuICB2YXIgcHJvcHMgPSBrZXlzSW4ob2JqZWN0KSxcbiAgICAgIHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgbGVuZ3RoID0gcHJvcHNMZW5ndGggJiYgb2JqZWN0Lmxlbmd0aDtcblxuICB2YXIgYWxsb3dJbmRleGVzID0gISFsZW5ndGggJiYgaXNMZW5ndGgobGVuZ3RoKSAmJlxuICAgIChpc0FycmF5KG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoKytpbmRleCA8IHByb3BzTGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBpZiAoKGFsbG93SW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgfHwgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpbUtleXM7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBvYmplY3QgaWYgaXQncyBub3Qgb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiB0b09iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3QodmFsdWUpID8gdmFsdWUgOiBPYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvT2JqZWN0O1xuIiwidmFyIGJhc2VUb1N0cmluZyA9IHJlcXVpcmUoJy4vYmFzZVRvU3RyaW5nJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVQcm9wTmFtZSA9IC9bXi5bXFxdXSt8XFxbKD86KC0/XFxkKyg/OlxcLlxcZCspPyl8KFtcIiddKSgoPzooPyFcXDIpW15cXG5cXFxcXXxcXFxcLikqPylcXDIpXFxdL2c7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGJhY2tzbGFzaGVzIGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlRXNjYXBlQ2hhciA9IC9cXFxcKFxcXFwpPy9nO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gcHJvcGVydHkgcGF0aCBhcnJheSBpZiBpdCdzIG5vdCBvbmUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIHRvUGF0aCh2YWx1ZSkge1xuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBiYXNlVG9TdHJpbmcodmFsdWUpLnJlcGxhY2UocmVQcm9wTmFtZSwgZnVuY3Rpb24obWF0Y2gsIG51bWJlciwgcXVvdGUsIHN0cmluZykge1xuICAgIHJlc3VsdC5wdXNoKHF1b3RlID8gc3RyaW5nLnJlcGxhY2UocmVFc2NhcGVDaGFyLCAnJDEnKSA6IChudW1iZXIgfHwgbWF0Y2gpKTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9QYXRoO1xuIiwidmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSkgJiZcbiAgICBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiYgIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FyZ3VtZW50cztcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUlzQXJyYXkgPSBnZXROYXRpdmUoQXJyYXksICdpc0FycmF5Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJyYXlUYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXk7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Z1bmN0aW9uKC9hYmMvKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGhlIHVzZSBvZiBgT2JqZWN0I3RvU3RyaW5nYCBhdm9pZHMgaXNzdWVzIHdpdGggdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gIC8vIGluIG9sZGVyIHZlcnNpb25zIG9mIENocm9tZSBhbmQgU2FmYXJpIHdoaWNoIHJldHVybiAnZnVuY3Rpb24nIGZvciByZWdleGVzXG4gIC8vIGFuZCBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMuXG4gIHJldHVybiBpc09iamVjdCh2YWx1ZSkgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gZnVuY1RhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGhvc3QgY29uc3RydWN0b3JzIChTYWZhcmkgPiA1KS4gKi9cbnZhciByZUlzSG9zdEN0b3IgPSAvXlxcW29iamVjdCAuKz9Db25zdHJ1Y3RvclxcXSQvO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZuVG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUuICovXG52YXIgcmVJc05hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBmblRvU3RyaW5nLmNhbGwoaGFzT3duUHJvcGVydHkpLnJlcGxhY2UoL1tcXFxcXiQuKis/KClbXFxde318XS9nLCAnXFxcXCQmJylcbiAgLnJlcGxhY2UoL2hhc093blByb3BlcnR5fChmdW5jdGlvbikuKj8oPz1cXFxcXFwoKXwgZm9yIC4rPyg/PVxcXFxcXF0pL2csICckMS4qPycpICsgJyQnXG4pO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTmF0aXZlKEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzTmF0aXZlKF8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgcmV0dXJuIHJlSXNOYXRpdmUudGVzdChmblRvU3RyaW5nLmNhbGwodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiByZUlzSG9zdEN0b3IudGVzdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNOYXRpdmU7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gQXZvaWQgYSBWOCBKSVQgYnVnIGluIENocm9tZSAxOS0yMC5cbiAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwidmFyIGJhc2VGb3JJbiA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VGb3JJbicpLFxuICAgIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9pc0FyZ3VtZW50cycpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCB0aGF0IGlzLCBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGVcbiAqIGBPYmplY3RgIGNvbnN0cnVjdG9yIG9yIG9uZSB3aXRoIGEgYFtbUHJvdG90eXBlXV1gIG9mIGBudWxsYC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgYXNzdW1lcyBvYmplY3RzIGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yXG4gKiBoYXZlIG5vIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqIH1cbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QobmV3IEZvbyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoeyAneCc6IDAsICd5JzogMCB9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoT2JqZWN0LmNyZWF0ZShudWxsKSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgdmFyIEN0b3I7XG5cbiAgLy8gRXhpdCBlYXJseSBmb3Igbm9uIGBPYmplY3RgIG9iamVjdHMuXG4gIGlmICghKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gb2JqZWN0VGFnICYmICFpc0FyZ3VtZW50cyh2YWx1ZSkpIHx8XG4gICAgICAoIWhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjb25zdHJ1Y3RvcicpICYmIChDdG9yID0gdmFsdWUuY29uc3RydWN0b3IsIHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgIShDdG9yIGluc3RhbmNlb2YgQ3RvcikpKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBJRSA8IDkgaXRlcmF0ZXMgaW5oZXJpdGVkIHByb3BlcnRpZXMgYmVmb3JlIG93biBwcm9wZXJ0aWVzLiBJZiB0aGUgZmlyc3RcbiAgLy8gaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZFxuICAvLyBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gIHZhciByZXN1bHQ7XG4gIC8vIEluIG1vc3QgZW52aXJvbm1lbnRzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzIGFyZSBpdGVyYXRlZCBiZWZvcmVcbiAgLy8gaXRzIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJZiB0aGUgbGFzdCBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3Qnc1xuICAvLyBvd24gcHJvcGVydHkgdGhlbiB0aGVyZSBhcmUgbm8gaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAgYmFzZUZvckluKHZhbHVlLCBmdW5jdGlvbihzdWJWYWx1ZSwga2V5KSB7XG4gICAgcmVzdWx0ID0ga2V5O1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdCA9PT0gdW5kZWZpbmVkIHx8IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHJlc3VsdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNQbGFpbk9iamVjdDtcbiIsInZhciBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nLFxuICAgIGJvb2xUYWcgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgbWFwVGFnID0gJ1tvYmplY3QgTWFwXScsXG4gICAgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgcmVnZXhwVGFnID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgc2V0VGFnID0gJ1tvYmplY3QgU2V0XScsXG4gICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXScsXG4gICAgd2Vha01hcFRhZyA9ICdbb2JqZWN0IFdlYWtNYXBdJztcblxudmFyIGFycmF5QnVmZmVyVGFnID0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJyxcbiAgICBmbG9hdDMyVGFnID0gJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgZmxvYXQ2NFRhZyA9ICdbb2JqZWN0IEZsb2F0NjRBcnJheV0nLFxuICAgIGludDhUYWcgPSAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICBpbnQxNlRhZyA9ICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICBpbnQzMlRhZyA9ICdbb2JqZWN0IEludDMyQXJyYXldJyxcbiAgICB1aW50OFRhZyA9ICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICB1aW50OENsYW1wZWRUYWcgPSAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nLFxuICAgIHVpbnQxNlRhZyA9ICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgdWludDMyVGFnID0gJ1tvYmplY3QgVWludDMyQXJyYXldJztcblxuLyoqIFVzZWQgdG8gaWRlbnRpZnkgYHRvU3RyaW5nVGFnYCB2YWx1ZXMgb2YgdHlwZWQgYXJyYXlzLiAqL1xudmFyIHR5cGVkQXJyYXlUYWdzID0ge307XG50eXBlZEFycmF5VGFnc1tmbG9hdDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Zsb2F0NjRUYWddID1cbnR5cGVkQXJyYXlUYWdzW2ludDhUYWddID0gdHlwZWRBcnJheVRhZ3NbaW50MTZUYWddID1cbnR5cGVkQXJyYXlUYWdzW2ludDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQ4VGFnXSA9XG50eXBlZEFycmF5VGFnc1t1aW50OENsYW1wZWRUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1t1aW50MzJUYWddID0gdHJ1ZTtcbnR5cGVkQXJyYXlUYWdzW2FyZ3NUYWddID0gdHlwZWRBcnJheVRhZ3NbYXJyYXlUYWddID1cbnR5cGVkQXJyYXlUYWdzW2FycmF5QnVmZmVyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Jvb2xUYWddID1cbnR5cGVkQXJyYXlUYWdzW2RhdGVUYWddID0gdHlwZWRBcnJheVRhZ3NbZXJyb3JUYWddID1cbnR5cGVkQXJyYXlUYWdzW2Z1bmNUYWddID0gdHlwZWRBcnJheVRhZ3NbbWFwVGFnXSA9XG50eXBlZEFycmF5VGFnc1tudW1iZXJUYWddID0gdHlwZWRBcnJheVRhZ3Nbb2JqZWN0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tyZWdleHBUYWddID0gdHlwZWRBcnJheVRhZ3Nbc2V0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tzdHJpbmdUYWddID0gdHlwZWRBcnJheVRhZ3Nbd2Vha01hcFRhZ10gPSBmYWxzZTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIHR5cGVkIGFycmF5LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzVHlwZWRBcnJheShuZXcgVWludDhBcnJheSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkoW10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgISF0eXBlZEFycmF5VGFnc1tvYmpUb1N0cmluZy5jYWxsKHZhbHVlKV07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNUeXBlZEFycmF5O1xuIiwidmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2dldE5hdGl2ZScpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKSxcbiAgICBzaGltS2V5cyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3NoaW1LZXlzJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlS2V5cyA9IGdldE5hdGl2ZShPYmplY3QsICdrZXlzJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuIFNlZSB0aGVcbiAqIFtFUyBzcGVjXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3Qua2V5cylcbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5cyhuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqXG4gKiBfLmtleXMoJ2hpJyk7XG4gKiAvLyA9PiBbJzAnLCAnMSddXG4gKi9cbnZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgQ3RvciA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0LmNvbnN0cnVjdG9yO1xuICBpZiAoKHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUgPT09IG9iamVjdCkgfHxcbiAgICAgICh0eXBlb2Ygb2JqZWN0ICE9ICdmdW5jdGlvbicgJiYgaXNBcnJheUxpa2Uob2JqZWN0KSkpIHtcbiAgICByZXR1cm4gc2hpbUtleXMob2JqZWN0KTtcbiAgfVxuICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSA/IG5hdGl2ZUtleXMob2JqZWN0KSA6IFtdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzO1xuIiwidmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNJbmRleCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzSW4obmV3IEZvbyk7XG4gKiAvLyA9PiBbJ2EnLCAnYicsICdjJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xuZnVuY3Rpb24ga2V5c0luKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG4gIH1cbiAgdmFyIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7XG4gIGxlbmd0aCA9IChsZW5ndGggJiYgaXNMZW5ndGgobGVuZ3RoKSAmJlxuICAgIChpc0FycmF5KG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSkgJiYgbGVuZ3RoKSB8fCAwO1xuXG4gIHZhciBDdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgaW5kZXggPSAtMSxcbiAgICAgIGlzUHJvdG8gPSB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlID09PSBvYmplY3QsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpLFxuICAgICAgc2tpcEluZGV4ZXMgPSBsZW5ndGggPiAwO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IChpbmRleCArICcnKTtcbiAgfVxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgaWYgKCEoc2tpcEluZGV4ZXMgJiYgaXNJbmRleChrZXksIGxlbmd0aCkpICYmXG4gICAgICAgICEoa2V5ID09ICdjb25zdHJ1Y3RvcicgJiYgKGlzUHJvdG8gfHwgIWhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5c0luO1xuIiwidmFyIGNyZWF0ZU9iamVjdE1hcHBlciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZU9iamVjdE1hcHBlcicpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gb2JqZWN0IHdpdGggdGhlIHNhbWUga2V5cyBhcyBgb2JqZWN0YCBhbmQgdmFsdWVzIGdlbmVyYXRlZCBieVxuICogcnVubmluZyBlYWNoIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG9mIGBvYmplY3RgIHRocm91Z2ggYGl0ZXJhdGVlYC4gVGhlXG4gKiBpdGVyYXRlZSBmdW5jdGlvbiBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6XG4gKiAodmFsdWUsIGtleSwgb2JqZWN0KS5cbiAqXG4gKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBpdGVyYXRlZWAgdGhlIGNyZWF0ZWQgYF8ucHJvcGVydHlgXG4gKiBzdHlsZSBjYWxsYmFjayByZXR1cm5zIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBJZiBhIHZhbHVlIGlzIGFsc28gcHJvdmlkZWQgZm9yIGB0aGlzQXJnYCB0aGUgY3JlYXRlZCBgXy5tYXRjaGVzUHJvcGVydHlgXG4gKiBzdHlsZSBjYWxsYmFjayByZXR1cm5zIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGEgbWF0Y2hpbmcgcHJvcGVydHlcbiAqIHZhbHVlLCBlbHNlIGBmYWxzZWAuXG4gKlxuICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgaXRlcmF0ZWVgIHRoZSBjcmVhdGVkIGBfLm1hdGNoZXNgIHN0eWxlXG4gKiBjYWxsYmFjayByZXR1cm5zIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlblxuICogb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufE9iamVjdHxzdHJpbmd9IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZFxuICogIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGl0ZXJhdGVlYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLm1hcFZhbHVlcyh7ICdhJzogMSwgJ2InOiAyIH0sIGZ1bmN0aW9uKG4pIHtcbiAqICAgcmV0dXJuIG4gKiAzO1xuICogfSk7XG4gKiAvLyA9PiB7ICdhJzogMywgJ2InOiA2IH1cbiAqXG4gKiB2YXIgdXNlcnMgPSB7XG4gKiAgICdmcmVkJzogICAgeyAndXNlcic6ICdmcmVkJywgICAgJ2FnZSc6IDQwIH0sXG4gKiAgICdwZWJibGVzJzogeyAndXNlcic6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICogfTtcbiAqXG4gKiAvLyB1c2luZyB0aGUgYF8ucHJvcGVydHlgIGNhbGxiYWNrIHNob3J0aGFuZFxuICogXy5tYXBWYWx1ZXModXNlcnMsICdhZ2UnKTtcbiAqIC8vID0+IHsgJ2ZyZWQnOiA0MCwgJ3BlYmJsZXMnOiAxIH0gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIG1hcFZhbHVlcyA9IGNyZWF0ZU9iamVjdE1hcHBlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcFZhbHVlcztcbiIsInZhciBhcnJheU1hcCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2FycmF5TWFwJyksXG4gICAgYmFzZURpZmZlcmVuY2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRGlmZmVyZW5jZScpLFxuICAgIGJhc2VGbGF0dGVuID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUZsYXR0ZW4nKSxcbiAgICBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iaW5kQ2FsbGJhY2snKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuL2tleXNJbicpLFxuICAgIHBpY2tCeUFycmF5ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcGlja0J5QXJyYXknKSxcbiAgICBwaWNrQnlDYWxsYmFjayA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3BpY2tCeUNhbGxiYWNrJyksXG4gICAgcmVzdFBhcmFtID0gcmVxdWlyZSgnLi4vZnVuY3Rpb24vcmVzdFBhcmFtJyk7XG5cbi8qKlxuICogVGhlIG9wcG9zaXRlIG9mIGBfLnBpY2tgOyB0aGlzIG1ldGhvZCBjcmVhdGVzIGFuIG9iamVjdCBjb21wb3NlZCBvZiB0aGVcbiAqIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBgb2JqZWN0YCB0aGF0IGFyZSBub3Qgb21pdHRlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgc291cmNlIG9iamVjdC5cbiAqIEBwYXJhbSB7RnVuY3Rpb258Li4uKHN0cmluZ3xzdHJpbmdbXSl9IFtwcmVkaWNhdGVdIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlclxuICogIGl0ZXJhdGlvbiBvciBwcm9wZXJ0eSBuYW1lcyB0byBvbWl0LCBzcGVjaWZpZWQgYXMgaW5kaXZpZHVhbCBwcm9wZXJ0eVxuICogIG5hbWVzIG9yIGFycmF5cyBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgcHJlZGljYXRlYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG5ldyBvYmplY3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICd1c2VyJzogJ2ZyZWQnLCAnYWdlJzogNDAgfTtcbiAqXG4gKiBfLm9taXQob2JqZWN0LCAnYWdlJyk7XG4gKiAvLyA9PiB7ICd1c2VyJzogJ2ZyZWQnIH1cbiAqXG4gKiBfLm9taXQob2JqZWN0LCBfLmlzTnVtYmVyKTtcbiAqIC8vID0+IHsgJ3VzZXInOiAnZnJlZCcgfVxuICovXG52YXIgb21pdCA9IHJlc3RQYXJhbShmdW5jdGlvbihvYmplY3QsIHByb3BzKSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICBpZiAodHlwZW9mIHByb3BzWzBdICE9ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgcHJvcHMgPSBhcnJheU1hcChiYXNlRmxhdHRlbihwcm9wcyksIFN0cmluZyk7XG4gICAgcmV0dXJuIHBpY2tCeUFycmF5KG9iamVjdCwgYmFzZURpZmZlcmVuY2Uoa2V5c0luKG9iamVjdCksIHByb3BzKSk7XG4gIH1cbiAgdmFyIHByZWRpY2F0ZSA9IGJpbmRDYWxsYmFjayhwcm9wc1swXSwgcHJvcHNbMV0sIDMpO1xuICByZXR1cm4gcGlja0J5Q2FsbGJhY2sob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgICByZXR1cm4gIXByZWRpY2F0ZSh2YWx1ZSwga2V5LCBvYmplY3QpO1xuICB9KTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9taXQ7XG4iLCJ2YXIga2V5cyA9IHJlcXVpcmUoJy4va2V5cycpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvdG9PYmplY3QnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgdHdvIGRpbWVuc2lvbmFsIGFycmF5IG9mIHRoZSBrZXktdmFsdWUgcGFpcnMgZm9yIGBvYmplY3RgLFxuICogZS5nLiBgW1trZXkxLCB2YWx1ZTFdLCBba2V5MiwgdmFsdWUyXV1gLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBhcnJheSBvZiBrZXktdmFsdWUgcGFpcnMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ucGFpcnMoeyAnYmFybmV5JzogMzYsICdmcmVkJzogNDAgfSk7XG4gKiAvLyA9PiBbWydiYXJuZXknLCAzNl0sIFsnZnJlZCcsIDQwXV0gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xuZnVuY3Rpb24gcGFpcnMob2JqZWN0KSB7XG4gIG9iamVjdCA9IHRvT2JqZWN0KG9iamVjdCk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBwcm9wcyA9IGtleXMob2JqZWN0KSxcbiAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIHJlc3VsdFtpbmRleF0gPSBba2V5LCBvYmplY3Rba2V5XV07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYWlycztcbiIsIi8qKlxuICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgZmlyc3QgYXJndW1lbnQgcHJvdmlkZWQgdG8gaXQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXR5XG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gKlxuICogXy5pZGVudGl0eShvYmplY3QpID09PSBvYmplY3Q7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpZGVudGl0eTtcbiIsInZhciBiYXNlUHJvcGVydHkgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlUHJvcGVydHknKSxcbiAgICBiYXNlUHJvcGVydHlEZWVwID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZVByb3BlcnR5RGVlcCcpLFxuICAgIGlzS2V5ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNLZXknKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBwcm9wZXJ0eSB2YWx1ZSBhdCBgcGF0aGAgb24gYVxuICogZ2l2ZW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0eVxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0cyA9IFtcbiAqICAgeyAnYSc6IHsgJ2InOiB7ICdjJzogMiB9IH0gfSxcbiAqICAgeyAnYSc6IHsgJ2InOiB7ICdjJzogMSB9IH0gfVxuICogXTtcbiAqXG4gKiBfLm1hcChvYmplY3RzLCBfLnByb3BlcnR5KCdhLmIuYycpKTtcbiAqIC8vID0+IFsyLCAxXVxuICpcbiAqIF8ucGx1Y2soXy5zb3J0Qnkob2JqZWN0cywgXy5wcm9wZXJ0eShbJ2EnLCAnYicsICdjJ10pKSwgJ2EuYi5jJyk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqL1xuZnVuY3Rpb24gcHJvcGVydHkocGF0aCkge1xuICByZXR1cm4gaXNLZXkocGF0aCkgPyBiYXNlUHJvcGVydHkocGF0aCkgOiBiYXNlUHJvcGVydHlEZWVwKHBhdGgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb3BlcnR5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfZnJlZXplID0gcmVxdWlyZSgnLi9mcmVlemUnKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGUgc3VwcGxpZWQgdmFsdWUuXG4gKlxuICogVXNlZnVsIGZvciByZXBsYWNpbmcgYW4gb2JqZWN0IG91dHJpZ2h0IHJhdGhlciB0aGFuIG1lcmdpbmcgaXQuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAc2lnIGEgLT4gKCogLT4gYSlcbiAqIEBtZW1iZXJPZiB1XG4gKiBAcGFyYW0gIHsqfSB2YWx1ZSB3aGF0IHRvIHJldHVybiBmcm9tIHJldHVybmVkIGZ1bmN0aW9uLlxuICogQHJldHVybiB7ZnVuY3Rpb259IGEgbmV3IGZ1bmN0aW9uIHRoYXQgd2lsbCBhbHdheXMgcmV0dXJuIHZhbHVlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWx3YXlzRm91ciA9IHUuY29uc3RhbnQoNCk7XG4gKiBleHBlY3QoYWx3YXlzRm91cigzMikpLnRvRXF1YWwoNCk7XG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciB1c2VyID0ge1xuICogICBuYW1lOiAnTWl0Y2gnLFxuICogICBmYXZvcml0ZXM6IHtcbiAqICAgICBiYW5kOiAnTmlydmFuYScsXG4gKiAgICAgbW92aWU6ICdUaGUgTWF0cml4J1xuICogICB9XG4gKiB9O1xuICpcbiAqIHZhciBuZXdGYXZvcml0ZXMgPSB7XG4gKiAgIGJhbmQ6ICdDb2xkcGxheSdcbiAqIH07XG4gKlxuICogdmFyIHJlc3VsdCA9IHUoeyBmYXZvcml0ZXM6IHUuY29uc3RhbnQobmV3RmF2b3JpdGVzKSB9LCB1c2VyKTtcbiAqXG4gKiBleHBlY3QocmVzdWx0KS50b0VxdWFsKHsgbmFtZTogJ01pdGNoJywgZmF2b3JpdGVzOiB7IGJhbmQ6ICdDb2xkcGxheScgfSB9KTtcbiAqL1xuXG52YXIgX2ZyZWV6ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mcmVlemUpO1xuXG5mdW5jdGlvbiBjb25zdGFudCh2YWx1ZSkge1xuICB2YXIgZnJvemVuID0gX2ZyZWV6ZTJbJ2RlZmF1bHQnXSh2YWx1ZSk7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZyb3plbjtcbiAgfTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gY29uc3RhbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5mdW5jdGlvbiBpc0ZyZWV6YWJsZShvYmplY3QpIHtcbiAgaWYgKG9iamVjdCA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBBcnJheS5pc0FycmF5KG9iamVjdCkgfHwgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCc7XG59XG5cbmZ1bmN0aW9uIG5lZWRzRnJlZXppbmcob2JqZWN0KSB7XG4gIHJldHVybiBpc0ZyZWV6YWJsZShvYmplY3QpICYmICFPYmplY3QuaXNGcm96ZW4ob2JqZWN0KTtcbn1cblxuZnVuY3Rpb24gcmVjdXIob2JqZWN0KSB7XG4gIE9iamVjdC5mcmVlemUob2JqZWN0KTtcblxuICBPYmplY3Qua2V5cyhvYmplY3QpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldO1xuICAgIGlmIChuZWVkc0ZyZWV6aW5nKHZhbHVlKSkge1xuICAgICAgcmVjdXIodmFsdWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxuLyoqXG4gKiBEZWVwbHkgZnJlZXplIGEgcGxhaW4gamF2YXNjcmlwdCBvYmplY3QuXG4gKlxuICogSWYgYHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbidgLCB0aGlzIHJldHVybnMgdGhlIG9yaWdpbmFsIG9iamVjdFxuICogd2l0b3V0IGZyZWV6aW5nLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHNpZyBhIC0+IGFcbiAqIEBwYXJhbSAge29iamVjdH0gb2JqZWN0IE9iamVjdCB0byBmcmVlemUuXG4gKiBAcmV0dXJuIHtvYmplY3R9IEZyb3plbiBvYmplY3QsIHVubGVzcyBpbiBwcm9kdWN0aW9uLCB0aGVuIHRoZSBzYW1lIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gZnJlZXplKG9iamVjdCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBpZiAobmVlZHNGcmVlemluZyhvYmplY3QpKSB7XG4gICAgcmVjdXIob2JqZWN0KTtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZyZWV6ZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2lmRWxzZSA9IHJlcXVpcmUoJy4vaWZFbHNlJyk7XG5cbnZhciBfaWZFbHNlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lmRWxzZSk7XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciBfdXRpbEN1cnJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxDdXJyeSk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF91dGlsQ3VycnkyWydkZWZhdWx0J10oZnVuY3Rpb24gKHByZWRpY2F0ZSwgdHJ1ZVVwZGF0ZXMsIG9iamVjdCkge1xuICByZXR1cm4gX2lmRWxzZTJbJ2RlZmF1bHQnXShwcmVkaWNhdGUsIHRydWVVcGRhdGVzLCBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB4O1xuICB9LCBvYmplY3QpO1xufSk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91cGRhdGUgPSByZXF1aXJlKCcuL3VwZGF0ZScpO1xuXG52YXIgX3VwZGF0ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGUpO1xuXG52YXIgX3dyYXAgPSByZXF1aXJlKCcuL3dyYXAnKTtcblxudmFyIF93cmFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dyYXApO1xuXG5mdW5jdGlvbiB1cGRhdGVJZkVsc2UocHJlZGljYXRlLCB0cnVlVXBkYXRlcywgZmFsc2VVcGRhdGVzLCBvYmplY3QpIHtcbiAgdmFyIHRlc3QgPSB0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nID8gcHJlZGljYXRlKG9iamVjdCkgOiBwcmVkaWNhdGU7XG5cbiAgdmFyIHVwZGF0ZXMgPSB0ZXN0ID8gdHJ1ZVVwZGF0ZXMgOiBmYWxzZVVwZGF0ZXM7XG5cbiAgcmV0dXJuIF91cGRhdGUyWydkZWZhdWx0J10odXBkYXRlcywgb2JqZWN0KTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3dyYXAyWydkZWZhdWx0J10odXBkYXRlSWZFbHNlKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NvbnN0YW50ID0gcmVxdWlyZSgnLi9jb25zdGFudCcpO1xuXG52YXIgX2NvbnN0YW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NvbnN0YW50KTtcblxudmFyIF9mcmVlemUgPSByZXF1aXJlKCcuL2ZyZWV6ZScpO1xuXG52YXIgX2ZyZWV6ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mcmVlemUpO1xuXG52YXIgX2lzID0gcmVxdWlyZSgnLi9pcycpO1xuXG52YXIgX2lzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lzKTtcblxudmFyIF9pZjIgPSByZXF1aXJlKCcuL2lmJyk7XG5cbnZhciBfaWYzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaWYyKTtcblxudmFyIF9pZkVsc2UgPSByZXF1aXJlKCcuL2lmRWxzZScpO1xuXG52YXIgX2lmRWxzZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pZkVsc2UpO1xuXG52YXIgX21hcCA9IHJlcXVpcmUoJy4vbWFwJyk7XG5cbnZhciBfbWFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX21hcCk7XG5cbnZhciBfb21pdCA9IHJlcXVpcmUoJy4vb21pdCcpO1xuXG52YXIgX29taXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfb21pdCk7XG5cbnZhciBfcmVqZWN0ID0gcmVxdWlyZSgnLi9yZWplY3QnKTtcblxudmFyIF9yZWplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVqZWN0KTtcblxudmFyIF91cGRhdGUgPSByZXF1aXJlKCcuL3VwZGF0ZScpO1xuXG52YXIgX3VwZGF0ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGUpO1xuXG52YXIgX3VwZGF0ZUluID0gcmVxdWlyZSgnLi91cGRhdGVJbicpO1xuXG52YXIgX3VwZGF0ZUluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZUluKTtcblxudmFyIF93aXRoRGVmYXVsdCA9IHJlcXVpcmUoJy4vd2l0aERlZmF1bHQnKTtcblxudmFyIF93aXRoRGVmYXVsdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93aXRoRGVmYXVsdCk7XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciB1ID0gX3VwZGF0ZTJbJ2RlZmF1bHQnXTtcblxudS5fID0gX3V0aWxDdXJyeS5fO1xudS5jb25zdGFudCA9IF9jb25zdGFudDJbJ2RlZmF1bHQnXTtcbnVbJ2lmJ10gPSBfaWYzWydkZWZhdWx0J107XG51LmlmRWxzZSA9IF9pZkVsc2UyWydkZWZhdWx0J107XG51LmlzID0gX2lzMlsnZGVmYXVsdCddO1xudS5mcmVlemUgPSBfZnJlZXplMlsnZGVmYXVsdCddO1xudS5tYXAgPSBfbWFwMlsnZGVmYXVsdCddO1xudS5vbWl0ID0gX29taXQyWydkZWZhdWx0J107XG51LnJlamVjdCA9IF9yZWplY3QyWydkZWZhdWx0J107XG51LnVwZGF0ZSA9IF91cGRhdGUyWydkZWZhdWx0J107XG51LnVwZGF0ZUluID0gX3VwZGF0ZUluMlsnZGVmYXVsdCddO1xudS53aXRoRGVmYXVsdCA9IF93aXRoRGVmYXVsdDJbJ2RlZmF1bHQnXTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gdTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3V0aWxTcGxpdFBhdGggPSByZXF1aXJlKCcuL3V0aWwvc3BsaXRQYXRoJyk7XG5cbnZhciBfdXRpbFNwbGl0UGF0aDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsU3BsaXRQYXRoKTtcblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIF91dGlsQ3VycnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbEN1cnJ5KTtcblxuZnVuY3Rpb24gaXMocGF0aCwgcHJlZGljYXRlLCBvYmplY3QpIHtcbiAgdmFyIHBhcnRzID0gX3V0aWxTcGxpdFBhdGgyWydkZWZhdWx0J10ocGF0aCk7XG5cbiAgdmFyIHJlc3QgPSBvYmplY3Q7XG4gIHZhciBwYXJ0ID0gdW5kZWZpbmVkO1xuICBmb3IgKHZhciBfaXRlcmF0b3IgPSBwYXJ0cywgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5KF9pdGVyYXRvciksIF9pID0gMCwgX2l0ZXJhdG9yID0gX2lzQXJyYXkgPyBfaXRlcmF0b3IgOiBfaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSgpOzspIHtcbiAgICBpZiAoX2lzQXJyYXkpIHtcbiAgICAgIGlmIChfaSA+PSBfaXRlcmF0b3IubGVuZ3RoKSBicmVhaztcbiAgICAgIHBhcnQgPSBfaXRlcmF0b3JbX2krK107XG4gICAgfSBlbHNlIHtcbiAgICAgIF9pID0gX2l0ZXJhdG9yLm5leHQoKTtcbiAgICAgIGlmIChfaS5kb25lKSBicmVhaztcbiAgICAgIHBhcnQgPSBfaS52YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHJlc3QgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG4gICAgcmVzdCA9IHJlc3RbcGFydF07XG4gIH1cblxuICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBwcmVkaWNhdGUocmVzdCk7XG4gIH1cblxuICByZXR1cm4gcHJlZGljYXRlID09PSByZXN0O1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfdXRpbEN1cnJ5MlsnZGVmYXVsdCddKGlzKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3VwZGF0ZSA9IHJlcXVpcmUoJy4vdXBkYXRlJyk7XG5cbnZhciBfdXBkYXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZSk7XG5cbnZhciBfd3JhcCA9IHJlcXVpcmUoJy4vd3JhcCcpO1xuXG52YXIgX3dyYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd3JhcCk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvbkZvckVhY2ggPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9mb3JFYWNoJyk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvbkZvckVhY2gyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoQ29sbGVjdGlvbkZvckVhY2gpO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25NYXAgPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9tYXAnKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uTWFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaENvbGxlY3Rpb25NYXApO1xuXG52YXIgX2xvZGFzaE9iamVjdE1hcFZhbHVlcyA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvbWFwVmFsdWVzJyk7XG5cbnZhciBfbG9kYXNoT2JqZWN0TWFwVmFsdWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaE9iamVjdE1hcFZhbHVlcyk7XG5cbmZ1bmN0aW9uIHNoYWxsb3dFcXVhbChvYmplY3QsIG90aGVyT2JqZWN0KSB7XG4gIHZhciBlcXVhbCA9IHRydWU7XG4gIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaDJbJ2RlZmF1bHQnXShvdGhlck9iamVjdCwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodmFsdWUgIT09IG9iamVjdFtrZXldKSB7XG4gICAgICBlcXVhbCA9IGZhbHNlO1xuXG4gICAgICAvLyBleGl0IGVhcmx5XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZXF1YWw7XG59XG5cbmZ1bmN0aW9uIG1hcChpdGVyYXRlZSwgb2JqZWN0KSB7XG4gIHZhciB1cGRhdGVyID0gdHlwZW9mIGl0ZXJhdGVlID09PSAnZnVuY3Rpb24nID8gaXRlcmF0ZWUgOiBfdXBkYXRlMlsnZGVmYXVsdCddKGl0ZXJhdGVlKTtcblxuICB2YXIgbWFwcGVyID0gQXJyYXkuaXNBcnJheShvYmplY3QpID8gX2xvZGFzaENvbGxlY3Rpb25NYXAyWydkZWZhdWx0J10gOiBfbG9kYXNoT2JqZWN0TWFwVmFsdWVzMlsnZGVmYXVsdCddO1xuXG4gIHZhciBuZXdPYmplY3QgPSBtYXBwZXIob2JqZWN0LCB1cGRhdGVyKTtcbiAgdmFyIGVxdWFsID0gc2hhbGxvd0VxdWFsKG9iamVjdCwgbmV3T2JqZWN0KTtcblxuICByZXR1cm4gZXF1YWwgPyBvYmplY3QgOiBuZXdPYmplY3Q7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF93cmFwMlsnZGVmYXVsdCddKG1hcCk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9sb2Rhc2hPYmplY3RPbWl0ID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9vbWl0Jyk7XG5cbnZhciBfbG9kYXNoT2JqZWN0T21pdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hPYmplY3RPbWl0KTtcblxudmFyIF93cmFwID0gcmVxdWlyZSgnLi93cmFwJyk7XG5cbnZhciBfd3JhcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93cmFwKTtcblxuZnVuY3Rpb24gb21pdChwcmVkaWNhdGUsIGNvbGxlY3Rpb24pIHtcbiAgcmV0dXJuIF9sb2Rhc2hPYmplY3RPbWl0MlsnZGVmYXVsdCddKGNvbGxlY3Rpb24sIHByZWRpY2F0ZSk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF93cmFwMlsnZGVmYXVsdCddKG9taXQpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvblJlamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC9jb2xsZWN0aW9uL3JlamVjdCcpO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25SZWplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoQ29sbGVjdGlvblJlamVjdCk7XG5cbnZhciBfd3JhcCA9IHJlcXVpcmUoJy4vd3JhcCcpO1xuXG52YXIgX3dyYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd3JhcCk7XG5cbmZ1bmN0aW9uIHJlamVjdChwcmVkaWNhdGUsIGNvbGxlY3Rpb24pIHtcbiAgcmV0dXJuIF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0MlsnZGVmYXVsdCddKGNvbGxlY3Rpb24sIHByZWRpY2F0ZSk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF93cmFwMlsnZGVmYXVsdCddKHJlamVjdCk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF93cmFwID0gcmVxdWlyZSgnLi93cmFwJyk7XG5cbnZhciBfd3JhcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93cmFwKTtcblxudmFyIF91dGlsSXNFbXB0eSA9IHJlcXVpcmUoJy4vdXRpbC9pc0VtcHR5Jyk7XG5cbnZhciBfdXRpbElzRW1wdHkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbElzRW1wdHkpO1xuXG52YXIgX3V0aWxEZWZhdWx0T2JqZWN0ID0gcmVxdWlyZSgnLi91dGlsL2RlZmF1bHRPYmplY3QnKTtcblxudmFyIF91dGlsRGVmYXVsdE9iamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsRGVmYXVsdE9iamVjdCk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzUGxhaW5PYmplY3QgPSByZXF1aXJlKCdsb2Rhc2gvbGFuZy9pc1BsYWluT2JqZWN0Jyk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzUGxhaW5PYmplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoTGFuZ0lzUGxhaW5PYmplY3QpO1xuXG5mdW5jdGlvbiByZWR1Y2Uob2JqZWN0LCBjYWxsYmFjaywgaW5pdGlhbFZhbHVlKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICByZXR1cm4gY2FsbGJhY2soYWNjLCBvYmplY3Rba2V5XSwga2V5KTtcbiAgfSwgaW5pdGlhbFZhbHVlKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVVwZGF0ZXModXBkYXRlcywgb2JqZWN0KSB7XG4gIHJldHVybiByZWR1Y2UodXBkYXRlcywgZnVuY3Rpb24gKGFjYywgdmFsdWUsIGtleSkge1xuICAgIHZhciB1cGRhdGVkVmFsdWUgPSB2YWx1ZTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdXBkYXRlZFZhbHVlID0gdXBkYXRlKHZhbHVlLCBvYmplY3Rba2V5XSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHVwZGF0ZWRWYWx1ZSA9IHZhbHVlKG9iamVjdFtrZXldKTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0W2tleV0gIT09IHVwZGF0ZWRWYWx1ZSkge1xuICAgICAgYWNjW2tleV0gPSB1cGRhdGVkVmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBcnJheSh1cGRhdGVzLCBvYmplY3QpIHtcbiAgdmFyIG5ld0FycmF5ID0gW10uY29uY2F0KG9iamVjdCk7XG5cbiAgT2JqZWN0LmtleXModXBkYXRlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgbmV3QXJyYXlba2V5XSA9IHVwZGF0ZXNba2V5XTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHVwZGF0ZSBhbiBvYmplY3Qgb3IgYXJyYXkuXG4gKlxuICogQ2FuIHVwZGF0ZSB3aXRoIHZhbHVlczpcbiAqIHVwZGF0ZSh7IGZvbzogMyB9LCB7IGZvbzogMSwgYmFyOiAyIH0pO1xuICogLy8gPT4geyBmb286IDMsIGJhcjogMiB9XG4gKlxuICogT3Igd2l0aCBhIGZ1bmN0aW9uOlxuICogdXBkYXRlKHsgZm9vOiB4ID0+ICh4ICsgMSkgfSwgeyBmb286IDIgfSk7XG4gKiAvLyA9PiB7IGZvbzogMyB9XG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAbmFtZSB1cGRhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSB1cGRhdGVzXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gICAgb2JqZWN0IHRvIHVwZGF0ZVxuICogQHJldHVybiB7T2JqZWN0fEFycmF5fSAgIG5ldyBvYmplY3Qgd2l0aCBtb2RpZmljYXRpb25zXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZSh1cGRhdGVzLCBvYmplY3QpIHtcbiAgaWYgKHR5cGVvZiB1cGRhdGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMiA/IF9sZW4gLSAyIDogMCksIF9rZXkgPSAyOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAyXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXBkYXRlcy5hcHBseSh1bmRlZmluZWQsIFtvYmplY3RdLmNvbmNhdChhcmdzKSk7XG4gIH1cblxuICBpZiAoIV9sb2Rhc2hMYW5nSXNQbGFpbk9iamVjdDJbJ2RlZmF1bHQnXSh1cGRhdGVzKSkge1xuICAgIHJldHVybiB1cGRhdGVzO1xuICB9XG5cbiAgdmFyIGRlZmF1bHRlZE9iamVjdCA9IF91dGlsRGVmYXVsdE9iamVjdDJbJ2RlZmF1bHQnXShvYmplY3QsIHVwZGF0ZXMpO1xuXG4gIHZhciByZXNvbHZlZFVwZGF0ZXMgPSByZXNvbHZlVXBkYXRlcyh1cGRhdGVzLCBkZWZhdWx0ZWRPYmplY3QpO1xuXG4gIGlmIChfdXRpbElzRW1wdHkyWydkZWZhdWx0J10ocmVzb2x2ZWRVcGRhdGVzKSkge1xuICAgIHJldHVybiBkZWZhdWx0ZWRPYmplY3Q7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShkZWZhdWx0ZWRPYmplY3QpKSB7XG4gICAgcmV0dXJuIHVwZGF0ZUFycmF5KHJlc29sdmVkVXBkYXRlcywgZGVmYXVsdGVkT2JqZWN0KTtcbiAgfVxuXG4gIHJldHVybiBfZXh0ZW5kcyh7fSwgZGVmYXVsdGVkT2JqZWN0LCByZXNvbHZlZFVwZGF0ZXMpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfd3JhcDJbJ2RlZmF1bHQnXSh1cGRhdGUsIDIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciBfdXRpbEN1cnJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxDdXJyeSk7XG5cbnZhciBfdXBkYXRlMiA9IHJlcXVpcmUoJy4vdXBkYXRlJyk7XG5cbnZhciBfdXBkYXRlMyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZTIpO1xuXG52YXIgX21hcCA9IHJlcXVpcmUoJy4vbWFwJyk7XG5cbnZhciBfbWFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX21hcCk7XG5cbnZhciBfdXRpbFNwbGl0UGF0aCA9IHJlcXVpcmUoJy4vdXRpbC9zcGxpdFBhdGgnKTtcblxudmFyIF91dGlsU3BsaXRQYXRoMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxTcGxpdFBhdGgpO1xuXG52YXIgd2lsZGNhcmQgPSAnKic7XG5cbmZ1bmN0aW9uIHJlZHVjZVBhdGgoYWNjLCBrZXkpIHtcbiAgdmFyIF9yZWY7XG5cbiAgaWYgKGtleSA9PT0gd2lsZGNhcmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICB2YXIgX3VwZGF0ZTtcblxuICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgd2lsZGNhcmQpID9cbiAgICAgIC8vIElmIHdlIGFjdHVhbGx5IGhhdmUgd2lsZGNhcmQgYXMgYSBwcm9wZXJ0eSwgdXBkYXRlIHRoYXRcbiAgICAgIF91cGRhdGUzWydkZWZhdWx0J10oKF91cGRhdGUgPSB7fSwgX3VwZGF0ZVt3aWxkY2FyZF0gPSBhY2MsIF91cGRhdGUpLCB2YWx1ZSkgOlxuICAgICAgLy8gT3RoZXJ3aXNlIG1hcCBvdmVyIGFsbCBwcm9wZXJ0aWVzXG4gICAgICBfbWFwMlsnZGVmYXVsdCddKGFjYywgdmFsdWUpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gKF9yZWYgPSB7fSwgX3JlZltrZXldID0gYWNjLCBfcmVmKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW4ocGF0aCwgdmFsdWUsIG9iamVjdCkge1xuICB2YXIgcGFydHMgPSBfdXRpbFNwbGl0UGF0aDJbJ2RlZmF1bHQnXShwYXRoKTtcbiAgdmFyIHVwZGF0ZXMgPSBwYXJ0cy5yZWR1Y2VSaWdodChyZWR1Y2VQYXRoLCB2YWx1ZSk7XG5cbiAgcmV0dXJuIF91cGRhdGUzWydkZWZhdWx0J10odXBkYXRlcywgb2JqZWN0KTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3V0aWxDdXJyeTJbJ2RlZmF1bHQnXSh1cGRhdGVJbik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIvKiBlc2xpbnQgbm8tc2hhZG93OjAsIG5vLXBhcmFtLXJlYXNzaWduOjAgKi9cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuY3VycnkxID0gY3VycnkxO1xuZXhwb3J0cy5jdXJyeTIgPSBjdXJyeTI7XG5leHBvcnRzLmN1cnJ5MyA9IGN1cnJ5MztcbmV4cG9ydHMuY3Vycnk0ID0gY3Vycnk0O1xuZXhwb3J0c1snZGVmYXVsdCddID0gY3Vycnk7XG52YXIgXyA9ICdAQHVwZGVlcC9wbGFjZWhvbGRlcic7XG5cbmV4cG9ydHMuXyA9IF87XG5mdW5jdGlvbiBjb3VudEFyZ3VtZW50cyhhcmdzLCBtYXgpIHtcbiAgdmFyIG4gPSBhcmdzLmxlbmd0aDtcbiAgaWYgKG4gPiBtYXgpIG4gPSBtYXg7XG5cbiAgd2hpbGUgKGFyZ3NbbiAtIDFdID09PSBfKSB7XG4gICAgbi0tO1xuICB9XG5cbiAgcmV0dXJuIG47XG59XG5cbmZ1bmN0aW9uIGN1cnJ5MShmbikge1xuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZChhKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIF9yZWYgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBfcmVmW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICB2YXIgYiA9IF9yZWZbMF0sXG4gICAgICAgIGMgPSBfcmVmWzFdO1xuXG4gICAgdmFyIG4gPSBjb3VudEFyZ3VtZW50cyhhcmd1bWVudHMpO1xuXG4gICAgaWYgKG4gPj0gMSkgcmV0dXJuIGZuKGEsIGIsIGMpO1xuICAgIHJldHVybiBjdXJyaWVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjdXJyeTIoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJpZWQoYSwgYikge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgX3JlZjIgPSBBcnJheShfbGVuMiA+IDIgPyBfbGVuMiAtIDIgOiAwKSwgX2tleTIgPSAyOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICBfcmVmMltfa2V5MiAtIDJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG5cbiAgICB2YXIgYyA9IF9yZWYyWzBdLFxuICAgICAgICBkID0gX3JlZjJbMV07XG5cbiAgICB2YXIgbiA9IGNvdW50QXJndW1lbnRzKGFyZ3VtZW50cywgMik7XG5cbiAgICBpZiAoYiA9PT0gXyB8fCBjID09PSBfIHx8IGQgPT09IF8pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgdXNlIHBsYWNlaG9sZGVyIG9uIGZpcnN0IGFyZ3VtZW50IG9mIHRoaXMgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKG4gPj0gMikge1xuICAgICAgaWYgKGEgPT09IF8pIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGEsIGMsIGQpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCk7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDEpIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGIsIGMsIGQpIHtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY3VycmllZDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3VycnkzKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjdXJyaWVkKGEsIGIsIGMpIHtcbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIF9yZWYzID0gQXJyYXkoX2xlbjMgPiAzID8gX2xlbjMgLSAzIDogMCksIF9rZXkzID0gMzsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgX3JlZjNbX2tleTMgLSAzXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgfVxuXG4gICAgdmFyIGQgPSBfcmVmM1swXSxcbiAgICAgICAgZSA9IF9yZWYzWzFdO1xuXG4gICAgdmFyIG4gPSBjb3VudEFyZ3VtZW50cyhhcmd1bWVudHMsIDMpO1xuXG4gICAgaWYgKGMgPT09IF8gfHwgZCA9PT0gXyB8fCBlID09PSBfKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IHVzZSBwbGFjZWhvbGRlciBvbiBmaXJzdCBvciBzZWNvbmQgYXJndW1lbnQgb2YgdGhpcyBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICBpZiAobiA+PSAzKSB7XG4gICAgICBpZiAoYSA9PT0gXykge1xuICAgICAgICBpZiAoYiA9PT0gXykgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYSwgYiwgZCwgZSkge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGEsIGQsIGUpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGIgPT09IF8pIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGIsIGQsIGUpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDIpIHtcbiAgICAgIGlmIChhID09PSBfKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChhLCBjLCBkLCBlKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYywgZCwgZSkge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMSkgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYiwgYywgZCwgZSkge1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGN1cnJpZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGN1cnJ5NChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZChhLCBiLCBjLCBkKSB7XG4gICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBfcmVmNCA9IEFycmF5KF9sZW40ID4gNCA/IF9sZW40IC0gNCA6IDApLCBfa2V5NCA9IDQ7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgIF9yZWY0W19rZXk0IC0gNF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgIH1cblxuICAgIHZhciBlID0gX3JlZjRbMF0sXG4gICAgICAgIGYgPSBfcmVmNFsxXTtcblxuICAgIHZhciBuID0gY291bnRBcmd1bWVudHMoYXJndW1lbnRzLCA0KTtcblxuICAgIGlmIChkID09PSBfIHx8IGUgPT09IF8gfHwgZiA9PT0gXykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSB1c2UgcGxhY2Vob2xkZXIgb24gZmlyc3QsIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudCBvZiB0aGlzIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmIChuID49IDQpIHtcbiAgICAgIGlmIChhID09PSBfKSB7XG4gICAgICAgIGlmIChiID09PSBfKSB7XG4gICAgICAgICAgaWYgKGMgPT09IF8pIHJldHVybiBjdXJyeTMoZnVuY3Rpb24gKGEsIGIsIGMsIGUsIGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChhLCBiLCBlLCBmKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGMgPT09IF8pIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGEsIGMsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChhLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChiID09PSBfKSB7XG4gICAgICAgIGlmIChjID09PSBfKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChiLCBjLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYiwgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoYyA9PT0gXykgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYywgZSwgZikge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMykge1xuICAgICAgaWYgKGEgPT09IF8pIHtcbiAgICAgICAgaWYgKGIgPT09IF8pIHJldHVybiBjdXJyeTMoZnVuY3Rpb24gKGEsIGIsIGQsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChhLCBkLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChiID09PSBfKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChiLCBkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMikge1xuICAgICAgaWYgKGEgPT09IF8pIHJldHVybiBjdXJyeTMoZnVuY3Rpb24gKGEsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChjLCBkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChuID09PSAxKSByZXR1cm4gY3VycnkzKGZ1bmN0aW9uIChiLCBjLCBkLCBlLCBmKSB7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGN1cnJpZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGN1cnJ5KGZuKSB7XG4gIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBmbi5sZW5ndGggOiBhcmd1bWVudHNbMV07XG4gIHJldHVybiAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbZm4sIGN1cnJ5MSwgY3VycnkyLCBjdXJyeTMsIGN1cnJ5NF1bbGVuZ3RoXShmbik7XG4gIH0pKCk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfaXNFbXB0eSA9IHJlcXVpcmUoJy4vaXNFbXB0eScpO1xuXG52YXIgX2lzRW1wdHkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaXNFbXB0eSk7XG5cbmZ1bmN0aW9uIGlzSW50KHZhbHVlKSB7XG4gIGlmIChpc05hTih2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHggPSBwYXJzZUZsb2F0KHZhbHVlKTtcbiAgcmV0dXJuICh4IHwgMCkgPT09IHg7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlVcGRhdGUodXBkYXRlcykge1xuICBmb3IgKHZhciBfaXRlcmF0b3IgPSBPYmplY3Qua2V5cyh1cGRhdGVzKSwgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5KF9pdGVyYXRvciksIF9pID0gMCwgX2l0ZXJhdG9yID0gX2lzQXJyYXkgPyBfaXRlcmF0b3IgOiBfaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSgpOzspIHtcbiAgICB2YXIgX3JlZjtcblxuICAgIGlmIChfaXNBcnJheSkge1xuICAgICAgaWYgKF9pID49IF9pdGVyYXRvci5sZW5ndGgpIGJyZWFrO1xuICAgICAgX3JlZiA9IF9pdGVyYXRvcltfaSsrXTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2kgPSBfaXRlcmF0b3IubmV4dCgpO1xuICAgICAgaWYgKF9pLmRvbmUpIGJyZWFrO1xuICAgICAgX3JlZiA9IF9pLnZhbHVlO1xuICAgIH1cblxuICAgIHZhciB1cGRhdGVLZXkgPSBfcmVmO1xuXG4gICAgaWYgKCFpc0ludCh1cGRhdGVLZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGFycmF5T3JPYmplY3QodXBkYXRlcykge1xuICBpZiAoIV9pc0VtcHR5MlsnZGVmYXVsdCddKHVwZGF0ZXMpICYmIGlzQXJyYXlVcGRhdGUodXBkYXRlcykpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4ge307XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRPYmplY3Qob2JqZWN0LCB1cGRhdGVzKSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAndW5kZWZpbmVkJyB8fCBvYmplY3QgPT09IG51bGwpIHtcbiAgICByZXR1cm4gYXJyYXlPck9iamVjdCh1cGRhdGVzKTtcbiAgfVxuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGRlZmF1bHRPYmplY3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmZ1bmN0aW9uIGlzRW1wdHkob2JqZWN0KSB7XG4gIHJldHVybiAhT2JqZWN0LmtleXMob2JqZWN0KS5sZW5ndGg7XG59XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gaXNFbXB0eTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3BsaXRQYXRoO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvblJlamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC9jb2xsZWN0aW9uL3JlamVjdCcpO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25SZWplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoQ29sbGVjdGlvblJlamVjdCk7XG5cbmZ1bmN0aW9uIHNwbGl0UGF0aChwYXRoKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aCA6IF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0MlsnZGVmYXVsdCddKHBhdGguc3BsaXQoJy4nKSwgZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gIXg7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91cGRhdGUgPSByZXF1aXJlKCcuL3VwZGF0ZScpO1xuXG52YXIgX3VwZGF0ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGUpO1xuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgX3V0aWxDdXJyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsQ3VycnkpO1xuXG5mdW5jdGlvbiB3aXRoRGVmYXVsdChkZWZhdWx0VmFsdWUsIHVwZGF0ZXMsIG9iamVjdCkge1xuICBpZiAodHlwZW9mIG9iamVjdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gX3VwZGF0ZTJbJ2RlZmF1bHQnXSh1cGRhdGVzLCBkZWZhdWx0VmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIF91cGRhdGUyWydkZWZhdWx0J10odXBkYXRlcywgb2JqZWN0KTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3V0aWxDdXJyeTJbJ2RlZmF1bHQnXSh3aXRoRGVmYXVsdCk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB3cmFwO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciBfdXRpbEN1cnJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxDdXJyeSk7XG5cbnZhciBfZnJlZXplID0gcmVxdWlyZSgnLi9mcmVlemUnKTtcblxudmFyIF9mcmVlemUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZnJlZXplKTtcblxuZnVuY3Rpb24gd3JhcChmdW5jKSB7XG4gIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBmdW5jLmxlbmd0aCA6IGFyZ3VtZW50c1sxXTtcbiAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF91dGlsQ3VycnkyWydkZWZhdWx0J10oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF9mcmVlemUyWydkZWZhdWx0J10oZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cykpO1xuICAgIH0sIGxlbmd0aCk7XG4gIH0pKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsImFjdGlvbnMgPSBbXG4gICMgUHJvZ3Jlc3MgdGhlIGB0aW1lbGluZXNgIG9uIGBlbnRpdHlgIGJ5IGBkZWx0YWAuXG4gICNcbiAgIyAgIHRpbWVsaW5lczogW1N0cmluZ11cbiAgIyAgIGVudGl0eTogU3RyaW5nXG4gICMgICBkZWx0YTogTnVtYmVyXG4gICdQcm9ncmVzc0VudGl0eVRpbWVsaW5lJ1xuXG4gICMgQWRkcyBhIG5ldyB0cmlnZ2VyIHRvIGB0aW1lbGluZWAgd2l0aCBzcGVjaWZpZWQgYHBvc2l0aW9uYCBhbmQgYGFjdGlvbmAuIFRoZVxuICAjICAgYGFjdGlvbmAgZnVuY3Rpb24gZXhwZWN0cyB0aGUgaWQgb2YgdGhlIGludm9raW5nIGVudGl0eSBhcyBhbiBhcmd1bWVudC5cbiAgI1xuICAjICAgdGltZWxpbmU6IFN0cmluZ1xuICAjICAgcG9zaXRpb246IEZsb2F0XG4gICMgICBhY3Rpb246IEZ1bmN0aW9uXG4gICdBZGRUcmlnZ2VyJ1xuXG4gICMgQWRkcyBhIG5ldyBgbWFwcGluZ2AgZnVuY3Rpb24gdG8gYSBgdGltZWxpbmVgLiBBIGBtYXBwaW5nYCBmdW5jdGlvbiBtb2RpZmllc1xuICAjICAgYW4gZW50aXR5J3MgYGRhdGFgIGZpZWxkLCBiYXNlZCBvbiBhbiBhdHRhY2hlZCBgdGltZWxpbmVgJ3MgcHJvZ3Jlc3MuXG4gICMgVGhlIGBtYXBwaW5nYCBmdW5jdGlvbiBleHBlY3RzIGZvdXIgYXJndW1lbnRzOlxuICAjICAgcHJvZ3Jlc3M6IEZsb2F0IC0gdGhlIHRpbWVsaW5lJ3MgdXBkYXRlZCBwcm9ncmVzc1xuICAjICAgZW50aXR5OiB0aGUgaWQgb2YgdGhlIGludm9raW5nIGVudGl0eVxuICAjICAgZGF0YTogdGhlIGN1cnJlbnQgYGRhdGFgIGZpZWxkIG9mIHRoZSBpbnZva2luZyBlbnRpdHlcbiAgIyBUaGUgYG1hcHBpbmdgIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gYW4gb2JqZWN0IG9mIGNoYW5nZXMgdG8gdGhlIGV4aXN0aW5nXG4gICMgICBgZGF0YWAgZmllbGQuXG4gICNcbiAgIyAgdGltZWxpbmU6IFN0cmluZ1xuICAjICBtYXBwaW5nOiBGdW5jdGlvblxuICAnQWRkTWFwcGluZydcblxuICAjIEFkZHMgYSBuZXcgZW50aXR5LCB3aXRoIGFuIG9wdGlvbmFsIGluaXRpYWwgYGRhdGFgIGZpZWxkIGFuZCBvcHRpb25hbCBgbmFtZWBcbiAgIyAgIGZpZWxkLlxuICAjXG4gICMgICBpbml0aWFsRGF0YTogT2JqZWN0XG4gICMgICBuYW1lOiBTdHJpbmdcbiAgJ0FkZEVudGl0eSdcblxuICAjIEFkZHMgYSBuZXcgdGltZWxpbmUgd2l0aCB0aGUgcHJvdmlkZWQgYGxlbmd0aGAsIGFuZCBvcHRpb25hbGx5IHdoZXRoZXIgdGhlXG4gICMgICB0aW1lbGluZSBgc2hvdWxkTG9vcGAuXG4gICNcbiAgIyAgIGxlbmd0aDogTnVtYmVyXG4gICMgICBzaG91bGRMb29wOiBCb29sZWFuICMgVE9ETzogRG9lcyBpdCBtYWtlIHNlbnNlIHRvIGhhdmUgdGhpcyBsb29wIHBhcmFtZXRlcj9cbiAgIyAgICAgICAgICAgICAgICAgICAgICAgIyAgICAgICBTZWVtcyBsaWtlIGl0IHNob3VsZCBqdXN0IHJlbWFpbiBhbiBhY3Rpb24uXG4gICdBZGRUaW1lbGluZSdcblxuICAjIFNldCBhIHRpbWVsaW5lIHRvIGxvb3Agb3Igbm90IGxvb3AuXG4gICNcbiAgIyAgIHRpbWVsaW5lOiBTdHJpbmdcbiAgIyAgIHNob3VsZExvb3A6IEJvb2xlYW5cbiAgJ1NldFRpbWVsaW5lTG9vcCdcblxuICAjIEF0dGFjaGVzIHRoZSBgZW50aXR5YCB3aXRoIHRoZSBwcm92aWRlZCBpZCB0byB0aGUgYHRpbWVsaW5lYCB3aXRoIHRoZVxuICAjICAgcHJvdmlkZWQgdGltZWxpbmUgaWQuXG4gICNcbiAgIyAgIGVudGl0eTogU3RyaW5nXG4gICMgICB0aW1lbGluZTogU3RyaW5nXG4gICdBdHRhY2hFbnRpdHlUb1RpbWVsaW5lJ1xuXG4gICMgVXBkYXRlcyBgZW50aXR5YCdzIGBkYXRhYCBwcm9wZXJ0eSB3aXRoIGBjaGFuZ2VzYCAod2hpY2ggYXJlIGFwcGxpZWQgdG8gdGhlXG4gICMgICBleGlzdGluZyBgZGF0YWAgdmlhIGB1cGRlZXBgKS5cbiAgI1xuICAjICAgZW50aXR5OiBTdHJpbmdcbiAgIyAgIGNoYW5nZXM6IE9iamVjdFxuICAnVXBkYXRlRW50aXR5RGF0YSdcbl1cblxubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zLnJlZHVjZSAoKGFjYywgYWN0aW9uVHlwZSkgLT5cbiAgYWNjW2FjdGlvblR5cGVdID0gYWN0aW9uVHlwZVxuICByZXR1cm4gYWNjKSwge30iLCJfID0gcmVxdWlyZSAnbG9kYXNoJ1xudXBkZWVwID0gcmVxdWlyZSAndXBkZWVwJ1xuayA9IHJlcXVpcmUgJy4uL0FjdGlvblR5cGVzJ1xuXG5tYXBBc3NpZ24gPSByZXF1aXJlICcuLi91dGlsL21hcEFzc2lnbidcbmFkZENoaWxkUmVkdWNlcnMgPSByZXF1aXJlICcuLi91dGlsL2FkZENoaWxkUmVkdWNlcnMnXG5cbmNsYW1wID0gcmVxdWlyZSAnLi4vdXRpbC9jbGFtcCdcbndyYXAgPSByZXF1aXJlICcuLi91dGlsL3dyYXAnXG5cbnRpbWVsaW5lc1JlZHVjZXIgPSByZXF1aXJlICcuL3RpbWVsaW5lcydcbmVudGl0aWVzUmVkdWNlciA9IHJlcXVpcmUgJy4vZW50aXRpZXMnXG5cblxucmVkdWNlciA9IChzdGF0ZSA9IHt9LCBhY3Rpb24pIC0+XG4gIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgIHdoZW4gay5Qcm9ncmVzc0VudGl0eVRpbWVsaW5lXG4gICAgICB7ZW50aXR5LCB0aW1lbGluZXMsIGRlbHRhfSA9IGFjdGlvbi5kYXRhXG5cbiAgICAgICMjI1xuICAgICAgMS4gVXBkYXRlIHByb2dyZXNzIG9uIGVudGl0eS10aW1lbGluZSByZWxhdGlvbi5cbiAgICAgIDIuIENoZWNrIGlmIHRoZSBwcm9ncmVzcyB1cGRhdGUgdHJpZ2dlcmVkIGFueSB0cmlnZ2Vycy4gUGVyZm9ybSB0aG9zZVxuICAgICAgICAgdHJpZ2dlcnMuXG4gICAgICAzLiBVcGRhdGUgYWxsIG1hcHBpbmdzLiAoVE9ETzogQ2hhbmdlIHRoaXMgdG8gb25seSB1cGRhdGluZyB1cGRhdGVkXG4gICAgICAgICB0aW1lbGluZXMnIG1hcHBpbmdzLilcbiAgICAgICMjI1xuXG4gICAgICAjIDEuIFVwZGF0ZSBwcm9ncmVzcyBvbiBlbnRpdHktdGltZWxpbmUgcmVsYXRpb24uXG4gICAgICBlbnRpdHlPYmogPSBzdGF0ZS5lbnRpdGllcy5kaWN0W2VudGl0eV1cblxuICAgICAgZW50aXR5Q2hhbmdlcyA9XG4gICAgICAgIGF0dGFjaGVkVGltZWxpbmVzOiB1cGRlZXAubWFwIChhdHRhY2hlZFRpbWVsaW5lKSAtPlxuICAgICAgICAgIGlmIF8uY29udGFpbnMgdGltZWxpbmVzLCBhdHRhY2hlZFRpbWVsaW5lLmlkXG4gICAgICAgICAgICB0aW1lbGluZU9iaiA9IHN0YXRlLnRpbWVsaW5lcy5kaWN0W2F0dGFjaGVkVGltZWxpbmUuaWRdXG4gICAgICAgICAgICBwcm9ncmVzc0RlbHRhID0gZGVsdGEgLyB0aW1lbGluZU9iai5sZW5ndGhcbiAgICAgICAgICAgIG9sZFByb2dyZXNzID0gYXR0YWNoZWRUaW1lbGluZS5wcm9ncmVzc1xuICAgICAgICAgICAgbmV3UHJvZ3Jlc3MgPVxuICAgICAgICAgICAgICBpZiB0aW1lbGluZU9iai5zaG91bGRMb29wXG4gICAgICAgICAgICAgIHRoZW4gd3JhcCAwLCAxLCBvbGRQcm9ncmVzcyArIHByb2dyZXNzRGVsdGFcbiAgICAgICAgICAgICAgZWxzZSBjbGFtcCAwLCAxLCBvbGRQcm9ncmVzcyArIHByb2dyZXNzRGVsdGFcblxuICAgICAgICAgICAgdXBkZWVwLnVwZGF0ZSB7cHJvZ3Jlc3M6IG5ld1Byb2dyZXNzfSwgYXR0YWNoZWRUaW1lbGluZVxuXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgYXR0YWNoZWRUaW1lbGluZVxuXG4gICAgICB1cGRhdGVkU3RhdGUgPVxuICAgICAgICB1cGRlZXAudXBkYXRlSW4gXCJlbnRpdGllcy5kaWN0LiN7ZW50aXR5fVwiLFxuICAgICAgICAgIGVudGl0eUNoYW5nZXMsXG4gICAgICAgICAgc3RhdGVcblxuXG4gICAgICAjIDIuIENoZWNrIGlmIHRoZSBwcm9ncmVzcyB1cGRhdGUgdHJpZ2dlcmVkIGFueSB0cmlnZ2Vycy5cbiAgICAgICMgICAgUGVyZm9ybSB0aG9zZSB0cmlnZ2Vycy5cbiAgICAgIG5ld1RpbWVsaW5lcyA9XG4gICAgICAgIHVwZGF0ZWRTdGF0ZS5lbnRpdGllcy5kaWN0W2VudGl0eV0uYXR0YWNoZWRUaW1lbGluZXNcbiAgICAgIG9sZFRpbWVsaW5lcyA9XG4gICAgICAgIHN0YXRlLmVudGl0aWVzLmRpY3RbZW50aXR5XS5hdHRhY2hlZFRpbWVsaW5lc1xuXG4gICAgICBhcHBseVRyaWdnZXIgPSAobmV3UHJvZ3Jlc3MsIG9sZFByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgdHJpZ2dlcikgLT5cbiAgICAgICAgc2hvdWxkUGVyZm9ybVRyaWdnZXIgPSBzd2l0Y2hcbiAgICAgICAgICB3aGVuIF8uaXNOdW1iZXIgdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgKG9sZFByb2dyZXNzIDwgdHJpZ2dlci5wb3NpdGlvbiA8PSBuZXdQcm9ncmVzcykgb3JcbiAgICAgICAgICAgIChuZXdQcm9ncmVzcyA8IHRyaWdnZXIucG9zaXRpb24gPD0gb2xkUHJvZ3Jlc3MpXG4gICAgICAgICAgd2hlbiBfLmlzRnVuY3Rpb24gdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgdHJpZ2dlci5wb3NpdGlvbiBuZXdQcm9ncmVzcywgb2xkUHJvZ3Jlc3NcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4gJ0ludmFsaWQgdHJpZ2dlciBwb3NpdGlvbiBvbiB0cmlnZ2VyJywgdHJpZ2dlclxuICAgICAgICAgICAgZmFsc2VcblxuICAgICAgICBpZiBzaG91bGRQZXJmb3JtVHJpZ2dlclxuICAgICAgICB0aGVuIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLCAodHJpZ2dlci5hY3Rpb24gbmV3UHJvZ3Jlc3MsIGVudGl0eSwgZW50aXR5RGF0YSlcbiAgICAgICAgZWxzZSBlbnRpdHlEYXRhXG5cbiAgICAgIHJlZHVjZVRyaWdnZXJzID0gKGRhdGEsIF9fLCBpKSAtPlxuICAgICAgICB0aW1lbGluZU9iaiA9IHVwZGF0ZWRTdGF0ZS50aW1lbGluZXMuZGljdFtuZXdUaW1lbGluZXNbaV0uaWRdXG4gICAgICAgIG5ld1Byb2dyZXNzID0gbmV3VGltZWxpbmVzW2ldLnByb2dyZXNzXG4gICAgICAgIG9sZFByb2dyZXNzID0gb2xkVGltZWxpbmVzW2ldLnByb2dyZXNzXG5cbiAgICAgICAgYXBwbHlUaGlzVHJpZ2dlciA9IGFwcGx5VHJpZ2dlciBuZXdQcm9ncmVzcywgb2xkUHJvZ3Jlc3NcbiAgICAgICAgdGltZWxpbmVPYmoudHJpZ2dlcnMucmVkdWNlIGFwcGx5VGhpc1RyaWdnZXIsIGRhdGFcblxuICAgICAgdHJpZ2dlckNoYW5nZXMgPVxuICAgICAgICBkYXRhOlxuICAgICAgICAgIG5ld1RpbWVsaW5lcy5yZWR1Y2UgcmVkdWNlVHJpZ2dlcnMsXG4gICAgICAgICAgICB1cGRhdGVkU3RhdGUuZW50aXRpZXMuZGljdFtlbnRpdHldLmRhdGFcblxuICAgICAgdXBkYXRlZFN0YXRlID0gdXBkZWVwLnVwZGF0ZUluIFwiZW50aXRpZXMuZGljdC4je2VudGl0eX1cIixcbiAgICAgICAgdHJpZ2dlckNoYW5nZXMsXG4gICAgICAgIHVwZGF0ZWRTdGF0ZVxuXG5cbiAgICAgICMgMy4gVXBkYXRlIGFsbCBtYXBwaW5ncy5cbiAgICAgIGRhdGFDaGFuZ2VzID1cbiAgICAgICAgZGF0YTogZG8gLT5cbiAgICAgICAgICBlbnRpdHlPYmogPSB1cGRhdGVkU3RhdGUuZW50aXRpZXMuZGljdFtlbnRpdHldXG4gICAgICAgICAgYXBwbHlNYXBwaW5nID0gKHByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgbWFwcGluZykgLT5cbiAgICAgICAgICAgIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLFxuICAgICAgICAgICAgICBtYXBwaW5nIHByb2dyZXNzLCBlbnRpdHksIGVudGl0eURhdGFcblxuICAgICAgICAgICMgZm9yIGV2ZXJ5IGF0dGFjaGVkIHRpbWVsaW5lLi4uXG4gICAgICAgICAgZW50aXR5T2JqLmF0dGFjaGVkVGltZWxpbmVzLnJlZHVjZSAoKGRhdGEsIGF0dGFjaGVkVGltZWxpbmUsIGlkeCkgLT5cbiAgICAgICAgICAgICMgLi4uIGFwcGx5IGV2ZXJ5IG1hcHBpbmcsIHRocmVhZGluZyB0aGUgYGRhdGFgIHRocm91Z2hcbiAgICAgICAgICAgIHRpbWVsaW5lID0gc3RhdGUudGltZWxpbmVzLmRpY3RbYXR0YWNoZWRUaW1lbGluZS5pZF1cbiAgICAgICAgICAgIHVwZGF0ZWRFbnRpdHlPYmogPSB1cGRhdGVkU3RhdGUuZW50aXRpZXMuZGljdFtlbnRpdHldXG4gICAgICAgICAgICBuZXdQcm9ncmVzcyA9IHVwZGF0ZWRFbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXNbaWR4XS5wcm9ncmVzc1xuICAgICAgICAgICAgdGltZWxpbmUubWFwcGluZ3MucmVkdWNlIChhcHBseU1hcHBpbmcgbmV3UHJvZ3Jlc3MpLCBkYXRhKSwgZW50aXR5T2JqLmRhdGFcblxuICAgICAgdXBkZWVwLnVwZGF0ZUluIFwiZW50aXRpZXMuZGljdC4je2VudGl0eX1cIixcbiAgICAgICAgZGF0YUNoYW5nZXMsXG4gICAgICAgIHVwZGF0ZWRTdGF0ZVxuXG5cbiAgICB3aGVuIGsuQXR0YWNoRW50aXR5VG9UaW1lbGluZVxuICAgICAge2VudGl0eSwgdGltZWxpbmUsIHByb2dyZXNzfSA9IGFjdGlvbi5kYXRhXG4gICAgICBtYXBBc3NpZ24gKF8uY2xvbmVEZWVwIHN0YXRlKSxcbiAgICAgICAgXCJlbnRpdGllcy5kaWN0LiN7ZW50aXR5fS5hdHRhY2hlZFRpbWVsaW5lc1wiLFxuICAgICAgICAob2xkQXR0YWNoZWRUaW1lbGluZXMpIC0+XG4gICAgICAgICAgY2hlY2tUaW1lbGluZSA9ICh0bWxuKSAtPiB0bWxuLmlkIGlzbnQgdGltZWxpbmVcbiAgICAgICAgICBpc1RpbWVsaW5lQWxyZWFkeUF0dGFjaGVkID0gXy5hbGwgb2xkQXR0YWNoZWRUaW1lbGluZXMsIGNoZWNrVGltZWxpbmVcbiAgICAgICAgICBpZiBpc1RpbWVsaW5lQWxyZWFkeUF0dGFjaGVkXG4gICAgICAgICAgICBpZiBub3QgcHJvZ3Jlc3M/XG4gICAgICAgICAgICAgIHByb2dyZXNzID0gMFxuICAgICAgICAgICAgbmV3QXR0YWNoZWRUaW1lbGluZSA9XG4gICAgICAgICAgICAgIGlkOiB0aW1lbGluZVxuICAgICAgICAgICAgICBwcm9ncmVzczogcHJvZ3Jlc3NcbiAgICAgICAgICAgIFtvbGRBdHRhY2hlZFRpbWVsaW5lcy4uLiwgbmV3QXR0YWNoZWRUaW1lbGluZV1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBvbGRBdHRhY2hlZFRpbWVsaW5lc1xuXG5cblxuICAgIGVsc2Ugc3RhdGVcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZENoaWxkUmVkdWNlcnMgcmVkdWNlcixcbiAgJ3RpbWVsaW5lcyc6IHRpbWVsaW5lc1JlZHVjZXJcbiAgJ2VudGl0aWVzJzogZW50aXRpZXNSZWR1Y2VyIiwiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbnVwZGVlcCA9IHJlcXVpcmUgJ3VwZGVlcCdcbmsgPSByZXF1aXJlICcuLi9BY3Rpb25UeXBlcydcbm1hcEFzc2lnbiA9IHJlcXVpcmUgJy4uL3V0aWwvbWFwQXNzaWduJ1xuYWRkQ2hpbGRSZWR1Y2VycyA9IHJlcXVpcmUgJy4uL3V0aWwvYWRkQ2hpbGRSZWR1Y2VycydcblxubWFrZU5ld0VudGl0eSA9IChpbml0aWFsRGF0YSA9IHt9KSAtPlxuICBhdHRhY2hlZFRpbWVsaW5lczogW11cbiAgZGF0YTogaW5pdGlhbERhdGFcblxucmVkdWNlciA9IChzdGF0ZSA9IHtkaWN0OiB7fSwgX3NwYXduZWRDb3VudDogMH0sIGFjdGlvbikgLT5cbiAgc3dpdGNoIGFjdGlvbi50eXBlXG4gICAgd2hlbiBrLkFkZEVudGl0eVxuICAgICAgIyBUT0RPOiBjbGVhbmVyIHdheSB0byBlbmFibGUgb3B0aW9uYWwgZGF0YVxuICAgICAgaWYgYWN0aW9uLmRhdGE/XG4gICAgICAgIHtuYW1lLCBpbml0aWFsRGF0YX0gPSBhY3Rpb24uZGF0YVxuXG4gICAgICBpZCA9IFwiZW50aXR5LSN7c3RhdGUuX3NwYXduZWRDb3VudH1cIlxuXG4gICAgICBjaGFuZ2VzID1cbiAgICAgICAgZGljdDoge31cbiAgICAgICAgX3NwYXduZWRDb3VudDogc3RhdGUuX3NwYXduZWRDb3VudCArIDFcbiAgICAgIGNoYW5nZXMuZGljdFtpZF0gPSBtYWtlTmV3RW50aXR5IGluaXRpYWxEYXRhXG5cbiAgICAgIGlmIG5hbWU/XG4gICAgICAgIGNoYW5nZXMuZGljdFtpZF0ubmFtZSA9IG5hbWVcblxuICAgICAgdXBkZWVwIGNoYW5nZXMsIHN0YXRlXG5cbiAgICB3aGVuIGsuVXBkYXRlRW50aXR5RGF0YVxuICAgICAge2VudGl0eSwgY2hhbmdlc30gPSBhY3Rpb24uZGF0YVxuXG4gICAgICBpZiBzdGF0ZS5kaWN0W2VudGl0eV0/XG4gICAgICAgIHN0YXRlQ2hhbmdlcyA9IGRpY3Q6IHt9XG4gICAgICAgIHN0YXRlQ2hhbmdlcy5kaWN0W2VudGl0eV0gPVxuICAgICAgICAgIGRhdGE6IGNoYW5nZXNcblxuICAgICAgICB1cGRlZXAgc3RhdGVDaGFuZ2VzLCBzdGF0ZVxuXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIkF0dGVtcHRlZCB0byB1cGRhdGUgbm9uLWV4aXN0YW50IGVudGl0eSAje2VudGl0eX0uXCJcblxuICAgIGVsc2Ugc3RhdGVcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjZXIiLCJfID0gcmVxdWlyZSAnbG9kYXNoJ1xudXBkZWVwID0gcmVxdWlyZSAndXBkZWVwJ1xuayA9IHJlcXVpcmUgJy4uL0FjdGlvblR5cGVzJ1xubWFwQXNzaWduID0gcmVxdWlyZSAnLi4vdXRpbC9tYXBBc3NpZ24nXG5hZGRDaGlsZFJlZHVjZXJzID0gcmVxdWlyZSAnLi4vdXRpbC9hZGRDaGlsZFJlZHVjZXJzJ1xuXG5yZWR1Y2VyID0gKHN0YXRlID0ge2RpY3Q6IHt9LCBfc3Bhd25lZENvdW50OiAwfSwgYWN0aW9uKSAtPlxuICBzd2l0Y2ggYWN0aW9uLnR5cGVcbiAgICB3aGVuIGsuQWRkVGltZWxpbmVcbiAgICAgIHtsZW5ndGgsIHNob3VsZExvb3B9ID0gXy5kZWZhdWx0cyBhY3Rpb24uZGF0YSxcbiAgICAgICAgbGVuZ3RoOiAxXG4gICAgICAgIHNob3VsZExvb3A6IGZhbHNlXG5cbiAgICAgIGNoYW5nZXMgPVxuICAgICAgICBkaWN0OiB7fVxuICAgICAgICBfc3Bhd25lZENvdW50OiBzdGF0ZS5fc3Bhd25lZENvdW50ICsgMVxuICAgICAgIyBuZXcgZW50aXR5XG4gICAgICBjaGFuZ2VzLmRpY3RbXCJ0aW1lbGluZS0je3N0YXRlLl9zcGF3bmVkQ291bnR9XCJdID1cbiAgICAgICAgbGVuZ3RoOiBsZW5ndGhcbiAgICAgICAgc2hvdWxkTG9vcDogc2hvdWxkTG9vcFxuICAgICAgICB0cmlnZ2VyczogW11cbiAgICAgICAgbWFwcGluZ3M6IFtdXG5cbiAgICAgIHVwZGVlcCBjaGFuZ2VzLCBzdGF0ZVxuXG5cbiAgICB3aGVuIGsuQWRkVHJpZ2dlclxuICAgICAge3RpbWVsaW5lLCBwb3NpdGlvbiwgYWN0aW9ufSA9IGFjdGlvbi5kYXRhXG4gICAgICBtYXBBc3NpZ24gKF8uY2xvbmVEZWVwIHN0YXRlKSxcbiAgICAgICAgXCJkaWN0LiN7dGltZWxpbmV9LnRyaWdnZXJzXCIsXG4gICAgICAgIChvbGRUcmlnZ2VycykgLT4gW29sZFRyaWdnZXJzLi4uLCB7cG9zaXRpb246IHBvc2l0aW9uLCBhY3Rpb246IGFjdGlvbn1dXG5cblxuICAgIHdoZW4gay5BZGRNYXBwaW5nXG4gICAgICB7dGltZWxpbmUsIG1hcHBpbmd9ID0gYWN0aW9uLmRhdGFcbiAgICAgIG1hcEFzc2lnbiAoXy5jbG9uZURlZXAgc3RhdGUpLFxuICAgICAgICBcImRpY3QuI3t0aW1lbGluZX0ubWFwcGluZ3NcIixcbiAgICAgICAgKG9sZE1hcHBpbmdzKSAtPiBbb2xkTWFwcGluZ3MuLi4sIG1hcHBpbmddXG5cblxuICAgIHdoZW4gay5TZXRUaW1lbGluZUxvb3BcbiAgICAgIHt0aW1lbGluZSwgc2hvdWxkTG9vcH0gPSBhY3Rpb24uZGF0YVxuICAgICAgbWFwQXNzaWduIChfLmNsb25lRGVlcCBzdGF0ZSksXG4gICAgICAgIFwiZGljdC4je3RpbWVsaW5lfS5zaG91bGRMb29wXCIsXG4gICAgICAgICgpIC0+IHNob3VsZExvb3BcblxuICAgIGVsc2Ugc3RhdGVcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2VyIiwiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRDaGlsZFJlZHVjZXJzID0gKGJhc2VSZWR1Y2VyLCBjaGlsZFJlZHVjZXJzID0ge30pIC0+XG4gIChzdGF0ZSA9IHt9LCBhY3Rpb24pIC0+XG4gICAgIyBgYWNjYCB3aWxsIGhvbGQgb3VyIHN0YXRlIGFzIGl0IGdldHMgdXBkYXRlZCBieSBlYWNoIHJlZHVjZXJcbiAgICAjIGBrZXlgIGlzIHRoZSBrZXkgb2YgdGhlIHJlZHVjZXIsIGFzIHdlbGwgYXMgdGhlIHN1YnN0YXRlJ3MgcGF0aFxuICAgIHJlZHVjZU92ZXJDaGlsZHJlbiA9IChhY2MsIGtleSkgLT5cbiAgICAgIGNoYW5nZWRTdGF0ZSA9IHt9XG4gICAgICBjaGFuZ2VkU3RhdGVba2V5XSA9IGNoaWxkUmVkdWNlcnNba2V5XSBhY2Nba2V5XSwgYWN0aW9uXG5cbiAgICAgIF8uYXNzaWduIHt9LCBhY2MsIGNoYW5nZWRTdGF0ZVxuXG4gICAgIyB0aGlzIHdheSBtaWdodCBiZSBmYXN0ZXJcbiAgICAjICAgXy5hc3NpZ24gYWNjLCBjaGFuZ2VkU3RhdGVcbiAgICAjIHN0YXRlID0gXy5hc3NpZ24ge30sIHN0YXRlXG5cbiAgICByZXN1bHQgPSBPYmplY3Qua2V5cyBjaGlsZFJlZHVjZXJzXG4gICAgICAucmVkdWNlIHJlZHVjZU92ZXJDaGlsZHJlbiwgc3RhdGVcblxuICAgIHJlc3VsdCA9IGJhc2VSZWR1Y2VyIHJlc3VsdCwgYWN0aW9uXG5cbiAgICAjIGZyZWV6ZSB0aGlzIHRvIGVuc3VyZSB3ZSdyZSBub3QgYWNjaWRlbnRhbGx5IG11dGF0aW5nXG4gICAgT2JqZWN0LmZyZWV6ZSByZXN1bHRcbiAgICByZXR1cm4gcmVzdWx0IiwibW9kdWxlLmV4cG9ydHMgPSBjbGFtcCA9IChsb3csIGhpZ2gsIG4pIC0+XG4gIGZuID0gKG4pIC0+IE1hdGgubWluIGhpZ2gsIChNYXRoLm1heCBsb3csIG4pXG5cbiAgaWYgbj9cbiAgdGhlbiBmbiBuXG4gIGVsc2UgZm4iLCJ0cmFuc2xhdGUzZCA9ICh4LCB5LCB6LCBlbGVtZW50KSAtPlxuICBbJy13ZWJraXQtJywgJy1tb3otJywgJy1vLScsICcnXS5mb3JFYWNoIChwcmVmaXgpIC0+XG4gICAgZWxlbWVudC5zdHlsZVtcIiN7cHJlZml4fXRyYW5zZm9ybVwiXSA9IFwidHJhbnNsYXRlM2QoI3t4fSwgI3t5fSwgI3t6fSlcIlxuXG5vZmZzZXQgPSAobGVmdCwgdG9wLCBlbGVtZW50KSAtPlxuICBlbGVtZW50LmxlZnQgPSBsZWZ0XG4gIGVsZW1lbnQudG9wID0gdG9wXG5cblxubW9kdWxlLmV4cG9ydHMgPVxuICAndHJhbnNsYXRlM2QnOiB0cmFuc2xhdGUzZCIsIiMgVE9ETzogU2hvdWxkIHdlIGJlIHVzaW5nIHVwZGVlcCBpbnN0ZWFkP1xuIyBodHRwczovL2dpdGh1Yi5jb20vc3Vic3RhbnRpYWwvdXBkZWVwXG4jIE1hcHBpbmcgb3ZlciBkZWVwIG9iamVjdHMgLyBhcnJheXMgc2VlbXMgcHJldHR5IGN1bWJlcnNvbWUgY29tcGFyZWQgdG9cbiMgICBgbWFwQXNzaWduKClgJ3Mgd2lsZGNhcmQgcGFyYWRpZ207IGJ1dCB0aGUgd2lsZGNhcmRzIG1pZ2h0IGJlIGxlc3MgZWZmaWNpZW50XG4jICAgdGhhbiBgdXBkZWVwYCdzIGBtYXAoKWAuXG4jIGB1cGRlZXBgIGFsc28gc2VlbXMgYmV0dGVyIGZvciBlZGl0aW5nIG11bHRpcGxlIHBhdGhzLlxuI1xuIyBJJ20gdXNpbmcgYSBtaXggZm9yIG5vdy4gYG1hcEFzc2lnbigpYCBzZWVtcyBwcmV0dHkgY29udmVuaWVudCB3aGVuIGVkaXRpbmcgYVxuIyAgIHNpbmdsZSB2YWx1ZSBwYXRoLlxuXG4jIyNcblV0aWxpdHkgZm9yIG1hcHBpbmcgYE9iamVjdC5hc3NpZ24oKWAgb3ZlciBhcnJheXMgYW5kIG9iamVjdHMuXG5cbkBwYXJhbSBvYmogW09iamVjdF0gU291cmNlIG9iamVjdCB0byBtYXAgb3ZlciBhbmQgbXV0YXRlLlxuQHBhcmFtIHBhdGggW1N0cmluZ10gUHJvcGVydHkgcGF0aCBmb3IgbWFwcGluZzsgY2FuIGluY2x1ZGUgcHJvcGVydHkgbmFtZXMsXG4gIGFycmF5IGluZGljZXMgKGFzIG51bWVyYWxzKSwgYW5kIHdpbGRjYXJkcyAoYCpgKSwgZGVsaW1pdGVkIGJ5IGAuYC5cbkBwYXJhbSBtYWtlVmFsdWUgW0Z1bmN0aW9uXSBGdW5jdGlvbiB0byBkZXRlcm1pbmUgbmV3IHZhbHVlIHRvIGJlIHBsYWNlZCBhdFxuICBgcGF0aGAuIFBhcmFtZXRlcnMgYXJlOlxuICAgIHZhbHVlIC0gVGhlIGN1cnJlbnQgdmFsdWUgYXQgYHBhdGhgLCBvciBgdW5kZWZpbmVkYCBpZiBwYXRoIGRvZXNuJ3QgZXhpc3RcbiAgICAgIHlldC5cbiAgICB3aWxkY2FyZFZhbHVlcyAtIEFuIGFycmF5IG9mIHZhbHVlcyBhdCBlYWNoIHN1YnBhdGggZW5kaW5nIGluIGEgd2lsZGNhcmQsXG4gICAgICBiYXNlZCBvbiB0aGUgY3VycmVudCBpdGVyYXRpb24uXG4gICAgd2lsZGNhcmRzIC0gQW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgb3IgaW5kaWNlcyBvZiB0aGUgd2lsZGNhcmRzLCBiYXNlZFxuICAgICAgb24gdGhlIGN1cnJlbnQgaXRlcmF0aW9uLlxuXG5AZXhhbXBsZVxuXG4gICAgb2JqID1cbiAgICAgIGE6IDFcbiAgICAgIGI6IFtcbiAgICAgICAge2M6IHtwMTogMX19XG4gICAgICAgIHtjOiB7cDI6IDIsIHAzOiAzfX1cbiAgICAgIF1cblxuICAgIHJlc3VsdCA9XG4gICAgICBtYXBBc3NpZ24gb2JqLCAnYi4qLmMuKicsICh2YWx1ZSwgd2lsZGNhcmRzVmFsdWVzLCB3aWxkY2FyZHMpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nICc9PT09PT09PT09J1xuICAgICAgICBjb25zb2xlLmxvZyAndmFsdWU6JywgdmFsdWVcbiAgICAgICAgY29uc29sZS5sb2cgJ3dpbGRjYXJkVmFsdWVzOicsIHdpbGRjYXJkVmFsdWVzXG4gICAgICAgIGNvbnNvbGUubG9nICd3aWxkY2FyZHM6Jywgd2lsZGNhcmRzXG4gICAgICAgIHJldHVybiB2YWx1ZSArIDFcblxuICAgICMgT3V0cHV0OlxuICAgICMgPT09PT09PT09PVxuICAgICMgdmFsdWU6IDFcbiAgICAjIHdpbGRjYXJkVmFsdWVzOiBbe2M6IHtwMTogMX19LCAxXVxuICAgICMgd2lsZGNhcmRzOiBbMCwgJ3AxJ11cbiAgICAjID09PT09PT09PT1cbiAgICAjIHZhbHVlOiAyXG4gICAgIyB3aWxkY2FyZFZhbHVlczogW3tjOiB7cDI6IDIsIHAzOiAzfX0sIDJdXG4gICAgIyB3aWxkY2FyZHM6IFswLCAncDInXVxuICAgICMgPT09PT09PT09PVxuICAgICMgdmFsdWU6IDNcbiAgICAjIHdpbGRjYXJkVmFsdWVzOiBbe2M6IHtwMjogMiwgcDM6IDN9fSwgM11cbiAgICAjIHdpbGRjYXJkczogWzEsICdwMyddXG5cblxuICAgICMgdHJ1ZVxuICAgIHJlc3VsdCA9PVxuICAgICAgYTogMVxuICAgICAgYjogW1xuICAgICAgICB7Yzoge3AxOiAyfX1cbiAgICAgICAge2M6IHtwMjogMywgcDM6IDR9fVxuICAgICAgXVxuXG4jIyNcblxubW9kdWxlLmV4cG9ydHMgPSBtYXBBc3NpZ24gPSAob2JqLCBwYXRoU3RyaW5nLCBtYWtlVmFsdWUpIC0+XG4gIHIgPSAocGF0aCwgbm9kZSwgd2lsZGNhcmRWYWx1ZXMgPSBbXSwgd2lsZGNhcmRzID0gW10pIC0+XG4gICAgaWYgcGF0aC5sZW5ndGggaXMgMFxuICAgICAgcmV0dXJuIG5vZGVcblxuICAgIGlmIG5vdCBub2RlP1xuICAgICAgIyBwYXNzIHRocm91Z2hcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgd2lsZGNhcmRWYWx1ZXM6IHdpbGRjYXJkVmFsdWVzXG4gICAgICAgIHdpbGRjYXJkczogd2lsZGNhcmRzXG4gICAgICB9XG5cblxuICAgIFtmaXJzdCwgdGFpbC4uLl0gPSBwYXRoXG4gICAgW25leHQsIF8uLi5dID0gdGFpbFxuXG4gICAgc3dpdGNoIGZpcnN0XG4gICAgICAjIFdpbGRjYXJkIHRhZ1xuICAgICAgd2hlbiAnKidcbiAgICAgICAga2V5cyA9XG4gICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3RvciBpcyBBcnJheVxuICAgICAgICAgIHRoZW4gWzAuLi5ub2RlLmxlbmd0aF1cbiAgICAgICAgICBlbHNlIE9iamVjdC5rZXlzIG5vZGVcblxuXG4gICAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICAgIGVsbSA9IG5vZGVba2V5XVxuICAgICAgICAgIG5ld1dpbGRjYXJkVmFsdWVzID0gW3dpbGRjYXJkVmFsdWVzLi4uLCBlbG1dXG4gICAgICAgICAgbmV3V2lsZGNhcmRzID0gW3dpbGRjYXJkcy4uLiwga2V5XVxuXG4gICAgICAgICAgaWYgbmV4dD9cbiAgICAgICAgICAgICMgd2UgYXJlbid0IGFzc2lnbmluZyB5ZXQ7IGp1c3QgcmVjdXJcbiAgICAgICAgICAgIHIgdGFpbCwgZWxtLCBuZXdXaWxkY2FyZFZhbHVlcywgbmV3V2lsZGNhcmRzXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgIyBubyBtb3JlIHRhZ3M7IHNvIGdvIGFoZWFkIGFuZCBhc3NpZ25cbiAgICAgICAgICAgIG5vZGVba2V5XSA9IG1ha2VWYWx1ZSBlbG0sIG5ld1dpbGRjYXJkVmFsdWVzLCBuZXdXaWxkY2FyZHNcblxuICAgICAgIyBOb3JtYWwgdGFnXG4gICAgICBlbHNlXG4gICAgICAgIGtleSA9XG4gICAgICAgICAgaWYgbm9kZS5jb25zdHJ1Y3RvciBpcyBBcnJheVxuICAgICAgICAgIHRoZW4gZG8gLT5cbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBwYXJzZUludCBlbG1cbiAgICAgICAgICAgIGNhdGNoIGVcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yICdBdHRlbXB0ZWQgdG8gaW5kZXggaW50byBhbiBhcnJheSB3aXRoIGEgbm9uLWludGVnZXIgdmFsdWUuJ1xuICAgICAgICAgIGVsc2UgZmlyc3RcblxuICAgICAgICBpZiBuZXh0P1xuICAgICAgICAgICMgd2UgYXJlbid0IGFzc2lnbmluZyB5ZXQ7IGp1c3QgcmVjdXJcblxuICAgICAgICAgICMgZ2V0IGVsZW1lbnQsIG1ha2luZyBuZXcgbm9kZSBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBlbG0gPVxuICAgICAgICAgICAgaWYgbm9kZVtrZXldP1xuICAgICAgICAgICAgdGhlbiBub2RlW2tleV1cbiAgICAgICAgICAgIGVsc2UgZG8gLT5cbiAgICAgICAgICAgICAgIyBpcyBgbmV4dGAgZm9ybWF0dGVkIGFzIGEgbnVtYmVyLFxuICAgICAgICAgICAgICAjICAgYW5kIHNvIHJlcXVpcmluZyBhbiBhcnJheT9cbiAgICAgICAgICAgICAgbm9kZVtrZXldID1cbiAgICAgICAgICAgICAgICAjIChub3QgKGlzIG5vdCBhIG51bWJlcikgPT0gaXMgYSBudW1iZXIpXG4gICAgICAgICAgICAgICAgaWYgbm90IGlzTmFOIG5leHRcbiAgICAgICAgICAgICAgICB0aGVuIFtdXG4gICAgICAgICAgICAgICAgZWxzZSB7fVxuICAgICAgICAgICAgICByZXR1cm4gbm9kZVtrZXldXG5cbiAgICAgICAgICByIHRhaWwsIGVsbSwgd2lsZGNhcmRWYWx1ZXMsIHdpbGRjYXJkc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgIyBubyBtb3JlIHRhZ3M7IHNvIGdvIGFoZWFkIGFuZCBhc3NpZ25cbiAgICAgICAgICBub2RlW2tleV0gPSBtYWtlVmFsdWUgbm9kZVtrZXldLCB3aWxkY2FyZFZhbHVlcywgd2lsZGNhcmRzXG5cbiAgciAocGF0aFN0cmluZy5zcGxpdCAnLicpLCBvYmpcbiAgcmV0dXJuIG9iaiIsIiMgVE9ETzogc2hvdWxkIHByb2JhYmx5IHRlc3QgdGhpc1xubW9kdWxlLmV4cG9ydHMgPSB3cmFwID0gKGxvdywgaGlnaCwgbikgLT5cbiAgZm4gPSAobikgLT5cbiAgICByYW5nZSA9IGhpZ2ggLSBsb3dcbiAgICB0ID0gbiAtIGxvd1xuICAgIHdoaWxlIHQgPCAwXG4gICAgICB0ICs9IHJhbmdlXG4gICAgdCA9IHQgJSByYW5nZVxuICAgIHJldHVybiB0ICsgbG93XG5cbiAgaWYgbj9cbiAgdGhlbiBmbiBuXG4gIGVsc2UgZm4iXX0=
