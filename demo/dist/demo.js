(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _, canvas, container, diffKeys, draw, k, offset, randomColor, reducer, redux, ref, resizeCanvas, setup, setupInteractions, setupTimelines, translate3d, update, wrap;

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
  var entityKeys, getPosition;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  getPosition = function(entityId) {
    var p;
    if (entityId != null) {
      p = entities.dict[entityId].data.position;
      return {
        x: p.x * ctx.canvas.width,
        y: p.y * ctx.canvas.height
      };
    } else {
      return entityId;
    }
  };
  entityKeys = Object.keys(entities.dict);
  entityKeys.forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    return ctx.lineTo(pos.x, pos.y);
  });
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
  return entityKeys.forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 10, 10, 45 * Math.PI / 180, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = entities.dict[key].data.strokeColor;
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
  var addEntityButton, animationOffset, down, getTimelineValue, isAnimating, mouseIsDown, move, previousSliderValue, progressTimeline, shouldMakeNewEntity, startAnimation, startPoint, stopAnimation, time, timelineSlider, timeoutId, up, updateTimeline;
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
          timeline: 'timeline-0',
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
      timelineSlider.value = wrap(0, 100, Math.floor((animationOffset + t) / 40));
      return progressTimeline();
    }
  };
  stopAnimation = function() {
    return isAnimating = false;
  };
  startAnimation = function() {
    if (!isAnimating) {
      isAnimating = true;
      return animationOffset = timelineSlider.value * 30 - time;
    }
  };
  canvas = document.querySelector('canvas');
  startPoint = null;
  timeoutId = null;
  shouldMakeNewEntity = true;
  down = function(pt) {
    shouldMakeNewEntity = true;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    timeoutId = setTimeout((function() {
      return shouldMakeNewEntity = false;
    }), 100);
    return startPoint = pt;
  };
  move = function(pt) {
    if (!shouldMakeNewEntity) {
      stopAnimation();
      timelineSlider.value = wrap(0, 100, (pt.x - startPoint.x) / 3);
      return progressTimeline();
    }
  };
  up = function(pt) {
    if (shouldMakeNewEntity) {
      dispatch({
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
    }
    return startAnimation();
  };
  canvas.addEventListener('touchstart', function(evt) {
    evt.preventDefault();
    return down({
      x: evt.touches[0].clientX,
      y: evt.touches[0].clientY
    });
  });
  canvas.addEventListener('touchmove', function(evt) {
    evt.preventDefault();
    return move({
      x: evt.touches[0].clientX,
      y: evt.touches[0].clientY
    });
  });
  canvas.addEventListener('touchend', function(evt) {
    return up();
  });
  mouseIsDown = false;
  canvas.addEventListener('mousedown', function(evt) {
    mouseIsDown = true;
    return down({
      x: evt.clientX,
      y: evt.clientY
    });
  });
  canvas.addEventListener('mousemove', function(evt) {
    if (mouseIsDown) {
      return move({
        x: evt.clientX,
        y: evt.clientY
      });
    }
  });
  canvas.addEventListener('mouseup', function(evt) {
    mouseIsDown = false;
    return up();
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

resizeCanvas = function() {
  var bcr;
  canvas = document.querySelector('canvas');
  bcr = canvas.parentNode.getBoundingClientRect();
  canvas.width = bcr.width;
  return canvas.height = bcr.height;
};

window.addEventListener('resize', resizeCanvas, false);

resizeCanvas();


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

actions = ['AddTrigger', 'AddMapping', 'AddEntity', 'AddTimeline', 'SetTimelineLoop', 'AttachEntityToTimeline', 'UpdateEntityData', 'ProgressEntityTimeline', 'ProgressTimeline'];

module.exports = actions.reduce((function(acc, actionType) {
  acc[actionType] = actionType;
  return acc;
}), {});


},{}],92:[function(require,module,exports){
var _, addChildReducers, batchProgress, clamp, entitiesReducer, k, mapAssign, reducer, timelinesReducer, updeep, wrap,
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


/*
state ::= State
progressInfo ::= { timelineId -> {delta: Float, entities: [entityId]} } # for specific entities
               | { timelineId -> {delta: Float} } # for all attached entities
 */

batchProgress = function(state, progressInfo) {
  var state_, state__;
  state_ = mapAssign(_.cloneDeep(state), 'entities.dict.*.attachedTimelines.*.progress', function(oldProgress, arg, arg1) {
    var entityId, entityObj, newProgress, progressDelta, ref, shouldUpdate, timelineIdx, timelineModel, timelineObj;
    entityObj = arg[0], timelineObj = arg[1];
    entityId = arg1[0], timelineIdx = arg1[1];
    timelineModel = state.timelines.dict[timelineObj.timeline];
    shouldUpdate = ((ref = progressInfo[timelineObj.timeline]) != null ? ref.entities : void 0) != null ? _.contains(entityId, progressInfo[timelineObj.timeline].entities) : progressInfo[timelineObj.timeline] != null;
    progressDelta = shouldUpdate ? progressInfo[timelineObj.timeline].delta / timelineModel.length : 0;
    newProgress = timelineModel.shouldLoop ? wrap(0, 1, oldProgress + progressDelta) : clamp(0, 1, oldProgress + progressDelta);
    return newProgress;
  });
  state__ = mapAssign(state_, 'entities.dict.*.data', function(previousData, arg, arg1) {
    var applyTrigger, entityId, entityObj, newTimelines, oldTimelines, reduceTriggers, triggersToInvoke;
    entityObj = arg[0];
    entityId = arg1[0];
    oldTimelines = state.entities.dict[entityId].attachedTimelines;
    newTimelines = entityObj.attachedTimelines;
    reduceTriggers = function(data, __, i) {
      var applyThisTrigger, newProgress, oldProgress, timelineObj;
      timelineObj = state_.timelines.dict[newTimelines[i].timeline];
      newProgress = newTimelines[i].progress;
      oldProgress = oldTimelines[i].progress;
      applyThisTrigger = applyTrigger(newProgress, oldProgress);
      return timelineObj.triggers.reduce(applyThisTrigger, data);
    };
    applyTrigger = function(newProgress, oldProgress) {
      return function(entityData, trigger) {
        var shouldPerformTrigger;
        shouldPerformTrigger = (function() {
          var ref, ref1;
          switch (false) {
            case !_.isNumber(trigger.position):
              return ((oldProgress < (ref = trigger.position) && ref <= newProgress)) || ((newProgress < (ref1 = trigger.position) && ref1 <= oldProgress));
            case !_.isFunction(trigger.position):
              return trigger.position(newProgress, oldProgress);
            default:
              console.warn('Invalid trigger position on trigger', trigger);
              return false;
          }
        })();
        if (shouldPerformTrigger) {
          return _.assign({}, entityData, trigger.action(newProgress, entityId, entityData));
        } else {
          return entityData;
        }
      };
    };
    triggersToInvoke = _(newTimelines).map(function(attachedTimeline, idx) {
      var newProgress, oldProgress;
      oldProgress = oldTimelines[idx].progress;
      newProgress = newTimelines[idx].progress;
      return state_.timelines.dict[attachedTimeline.timeline].triggers.filter(function(trigger) {
        var ref, ref1;
        switch (false) {
          case !_.isNumber(trigger.position):
            return ((oldProgress < (ref = trigger.position) && ref <= newProgress)) || ((newProgress < (ref1 = trigger.position) && ref1 <= oldProgress));
          case !_.isFunction(trigger.position):
            return trigger.position(newProgress, oldProgress);
          default:
            console.warn('Invalid trigger position on trigger', trigger);
            return false;
        }
      }).map(function(trigger) {
        return {
          trigger: trigger,
          oldProgress: oldProgress,
          newProgress: newProgress
        };
      });
    }).reduce((function(p, e) {
      return Array.prototype.concat(p, e);
    }), []);
    return _(triggersToInvoke).sortByOrder(function(arg2) {
      var newProgress, oldProgress, sign, trigger;
      trigger = arg2.trigger, oldProgress = arg2.oldProgress, newProgress = arg2.newProgress;
      switch (false) {
        case !_.isNumber(trigger.position):
          sign = function(x) {
            if (x > 0) {
              return 1;
            } else if (x < 0) {
              return -1;
            } else {
              return 0;
            }
          };
          return trigger.position * sign(newProgress - oldProgress);
        default:
          throw new Error('Invalid trigger position on trigger: ' + trigger.position);
      }
    }).reduce((function(data, arg2) {
      var newProgress, trigger;
      trigger = arg2.trigger, newProgress = arg2.newProgress;
      return _.assign({}, data, trigger.action(newProgress, entityId, data));
    }), entityObj.data);
  });
  return mapAssign(state__, 'entities.dict.*.data', function(previousData, arg, arg1) {
    var applyMapping, entityId, entityObj, r;
    entityObj = arg[0];
    entityId = arg1[0];
    applyMapping = function(progress) {
      return function(entityData, mapping) {
        return _.assign({}, entityData, mapping(progress, entityId, entityData));
      };
    };
    return r = entityObj.attachedTimelines.reduce((function(data, attachedTimeline, idx) {
      var newProgress, timeline, updatedEntityObj;
      timeline = state__.timelines.dict[attachedTimeline.timeline];
      updatedEntityObj = state__.entities.dict[entityId];
      newProgress = updatedEntityObj.attachedTimelines[idx].progress;
      return timeline.mappings.reduce(applyMapping(newProgress), data);
    }), entityObj.data);
  });
};

reducer = function(state, action) {
  var delta, entity, progress, progressInfo, ref, ref1, ref2, timeline;
  if (state == null) {
    state = {};
  }
  switch (action.type) {
    case k.ProgressTimeline:
      ref = action.data, timeline = ref.timeline, delta = ref.delta;
      progressInfo = {};
      progressInfo[timeline] = {
        delta: delta
      };
      return batchProgress(state, progressInfo);
    case k.ProgressEntityTimeline:
      ref1 = action.data, entity = ref1.entity, timeline = ref1.timeline, delta = ref1.delta;
      progressInfo = {};
      progressInfo[timeline] = {
        entities: [entity],
        delta: delta
      };
      return batchProgress(state, progressInfo);
    case k.AttachEntityToTimeline:
      ref2 = action.data, entity = ref2.entity, timeline = ref2.timeline, progress = ref2.progress;
      return mapAssign(_.cloneDeep(state), "entities.dict." + entity + ".attachedTimelines", function(oldAttachedTimelines) {
        var checkTimeline, isTimelineAlreadyAttached, newAttachedTimeline;
        checkTimeline = function(tmln) {
          return tmln.timeline !== timeline;
        };
        isTimelineAlreadyAttached = _.all(oldAttachedTimelines, checkTimeline);
        if (isTimelineAlreadyAttached) {
          if (progress == null) {
            progress = 0;
          }
          newAttachedTimeline = {
            timeline: timeline,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vZGVtby9zcmMvZGVtby5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9hcnJheS9sYXN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9jb2xsZWN0aW9uL2ZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2NvbGxlY3Rpb24vbWFwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9jb2xsZWN0aW9uL3JlamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vcmVzdFBhcmFtLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9TZXRDYWNoZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheUZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5UHVzaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlTb21lLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQ2FsbGJhY2suanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VEaWZmZXJlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZsYXR0ZW4uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3JJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvck93bi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUdldC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUluZGV4T2YuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc0VxdWFsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlSXNFcXVhbERlZXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc01hdGNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWFwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZU1hdGNoZXNQcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlUHJvcGVydHlEZWVwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlU2xpY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VUb1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmluZENhbGxiYWNrLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jYWNoZUluZGV4T2YuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NhY2hlUHVzaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUJhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUNhY2hlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVGb3JFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVPYmplY3RNYXBwZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsQXJyYXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbEJ5VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbE9iamVjdHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldExlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZ2V0TWF0Y2hEYXRhLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXROYXRpdmUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2luZGV4T2ZOYU4uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzQXJyYXlMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0tleS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzT2JqZWN0TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNTdHJpY3RDb21wYXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9waWNrQnlBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcGlja0J5Q2FsbGJhY2suanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3NoaW1LZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90b09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvdG9QYXRoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzQXJndW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzQXJyYXkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc05hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzVHlwZWRBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L2tleXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9rZXlzSW4uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9tYXBWYWx1ZXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9vbWl0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3QvcGFpcnMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3V0aWxpdHkvaWRlbnRpdHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3V0aWxpdHkvcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvY29uc3RhbnQuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvZnJlZXplLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2lmLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2lmRWxzZS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9pcy5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9tYXAuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3Qvb21pdC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9yZWplY3QuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3VwZGF0ZUluLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3V0aWwvY3VycnkuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXRpbC9kZWZhdWx0T2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3V0aWwvaXNFbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC91dGlsL3NwbGl0UGF0aC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC93aXRoRGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC93cmFwLmpzIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2RhcmtvL3NyYy9BY3Rpb25UeXBlcy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vc3JjL3JlZHVjZXJzL2Jhc2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2RhcmtvL3NyYy9yZWR1Y2Vycy9lbnRpdGllcy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vc3JjL3JlZHVjZXJzL3RpbWVsaW5lcy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vc3JjL3V0aWwvYWRkQ2hpbGRSZWR1Y2Vycy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vc3JjL3V0aWwvY2xhbXAuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2RhcmtvL3NyYy91dGlsL2Nzc0hlbHBlcnMuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2RhcmtvL3NyYy91dGlsL21hcEFzc2lnbi5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvZGFya28vc3JjL3V0aWwvd3JhcC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUjs7QUFDSixLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0FBQ1IsQ0FBQSxHQUFJLE9BQUEsQ0FBUSx1QkFBUjs7QUFDSixPQUFBLEdBQVUsT0FBQSxDQUFRLHlCQUFSOztBQUVWLE1BQXdCLE9BQUEsQ0FBUSwyQkFBUixDQUF4QixFQUFDLGtCQUFBLFdBQUQsRUFBYyxhQUFBOztBQUVkLElBQUEsR0FBTyxPQUFBLENBQVEscUJBQVI7O0FBRVAsU0FBQSxHQUFZLFFBQVEsQ0FBQyxjQUFULENBQXdCLFdBQXhCOztBQUNaLE1BQUEsR0FBUyxRQUFRLENBQUMsYUFBVCxDQUF1QixRQUF2Qjs7QUFDVCxNQUFNLENBQUMsS0FBUCxHQUFlLFNBQVMsQ0FBQzs7QUFDekIsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsU0FBUyxDQUFDOztBQUMxQixTQUFTLENBQUMsV0FBVixDQUFzQixNQUF0Qjs7QUFHQSxNQUFBLEdBQVMsU0FBQyxLQUFELEVBQVEsUUFBUjtFQUNQLENBQUMsTUFBTSxDQUFDLElBQVAsQ0FBWSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQTNCLENBQUQsQ0FBaUMsQ0FBQyxPQUFsQyxDQUEwQyxTQUFDLEdBQUQ7SUFDeEMsSUFBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUssQ0FBQSxHQUFBLENBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUEzQyxLQUFxRCxDQUF4RDthQUNFLFFBQUEsQ0FDRTtRQUFBLElBQUEsRUFBTSxDQUFDLENBQUMsc0JBQVI7UUFDQSxJQUFBLEVBQ0U7VUFBQSxNQUFBLEVBQVEsR0FBUjtVQUNBLFFBQUEsRUFBVSxZQURWO1NBRkY7T0FERixFQURGOztFQUR3QyxDQUExQztTQVFBLElBQUEsQ0FBTSxNQUFNLENBQUMsVUFBUCxDQUFrQixJQUFsQixDQUFOLEVBQStCLEtBQUssQ0FBQyxRQUFyQztBQVRPOztBQVlULElBQUEsR0FBTyxTQUFDLEdBQUQsRUFBTSxRQUFOO0FBQ0wsTUFBQTtFQUFBLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixHQUFHLENBQUMsTUFBTSxDQUFDLEtBQS9CLEVBQXNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBakQ7RUFDQSxHQUFHLENBQUMsU0FBSixDQUFBO0VBRUEsV0FBQSxHQUFjLFNBQUMsUUFBRDtBQUNaLFFBQUE7SUFBQSxJQUFHLGdCQUFIO01BQ0UsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxJQUFLLENBQUEsUUFBQSxDQUFTLENBQUMsSUFBSSxDQUFDO2FBQ2pDO1FBQUEsQ0FBQSxFQUFHLENBQUMsQ0FBQyxDQUFGLEdBQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFwQjtRQUNBLENBQUEsRUFBRyxDQUFDLENBQUMsQ0FBRixHQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFEcEI7UUFGRjtLQUFBLE1BQUE7YUFJSyxTQUpMOztFQURZO0VBT2QsVUFBQSxHQUFhLE1BQU0sQ0FBQyxJQUFQLENBQVksUUFBUSxDQUFDLElBQXJCO0VBRWIsVUFDRSxDQUFDLE9BREgsQ0FDVyxTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWDtBQUNQLFFBQUE7SUFBQSxHQUFBLEdBQU0sV0FBQSxDQUFZLEdBQVo7V0FDTixHQUFHLENBQUMsTUFBSixDQUFXLEdBQUcsQ0FBQyxDQUFmLEVBQWtCLEdBQUcsQ0FBQyxDQUF0QjtFQUZPLENBRFg7RUFJQSxHQUFHLENBQUMsU0FBSixDQUFBO0VBQ0EsR0FBRyxDQUFDLFdBQUosR0FBa0I7RUFDbEIsR0FBRyxDQUFDLE1BQUosQ0FBQTtTQUVBLFVBQ0UsQ0FBQyxPQURILENBQ1csU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7QUFDUCxRQUFBO0lBQUEsR0FBQSxHQUFNLFdBQUEsQ0FBWSxHQUFaO0lBQ04sR0FBRyxDQUFDLFNBQUosQ0FBQTtJQUNBLEdBQUcsQ0FBQyxPQUFKLENBQVksR0FBRyxDQUFDLENBQWhCLEVBQW1CLEdBQUcsQ0FBQyxDQUF2QixFQUEwQixFQUExQixFQUE4QixFQUE5QixFQUFrQyxFQUFBLEdBQUssSUFBSSxDQUFDLEVBQVYsR0FBYSxHQUEvQyxFQUFvRCxDQUFwRCxFQUF1RCxDQUFBLEdBQUksSUFBSSxDQUFDLEVBQWhFO0lBQ0EsR0FBRyxDQUFDLFNBQUosQ0FBQTtJQUNBLEdBQUcsQ0FBQyxTQUFKLEdBQWdCLFFBQVEsQ0FBQyxJQUFLLENBQUEsR0FBQSxDQUFJLENBQUMsSUFBSSxDQUFDO1dBQ3hDLEdBQUcsQ0FBQyxJQUFKLENBQUE7RUFOTyxDQURYO0FBckJLOztBQWdDUCxRQUFBLEdBQVcsU0FBQyxRQUFELEVBQVcsT0FBWDtTQUNUO0lBQUEsS0FBQSxFQUFPLENBQUMsTUFBTSxDQUFDLElBQVAsQ0FBWSxPQUFaLENBQUQsQ0FBcUIsQ0FBQyxNQUF0QixDQUE2QixTQUFDLEdBQUQ7YUFBYTtJQUFiLENBQTdCLENBQVA7SUFDQSxPQUFBLEVBQVMsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLFFBQVosQ0FBRCxDQUFzQixDQUFDLE1BQXZCLENBQThCLFNBQUMsR0FBRDthQUFhO0lBQWIsQ0FBOUIsQ0FEVDs7QUFEUzs7QUFLWCxLQUFBLEdBQVEsU0FBQTtBQUNOLE1BQUE7RUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsT0FBbEI7RUFFUixjQUFBLENBQWUsS0FBSyxDQUFDLFFBQXJCO0VBQ0EsaUJBQUEsQ0FBa0IsS0FBSyxDQUFDLFFBQXhCLEVBQWtDLEtBQWxDO1NBRUEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsU0FBQTtXQUNkLE1BQUEsQ0FBTyxLQUFLLENBQUMsUUFBTixDQUFBLENBQVAsRUFBeUIsS0FBSyxDQUFDLFFBQS9CO0VBRGMsQ0FBaEI7QUFOTTs7QUFVUixjQUFBLEdBQWlCLFNBQUMsUUFBRDtFQUNmLFFBQUEsQ0FDRTtJQUFBLElBQUEsRUFBTSxDQUFDLENBQUMsV0FBUjtJQUNBLElBQUEsRUFDRTtNQUFBLE1BQUEsRUFBUSxDQUFSO01BQ0EsVUFBQSxFQUFZLElBRFo7S0FGRjtHQURGO0VBTUEsUUFBQSxDQUNFO0lBQUEsSUFBQSxFQUFNLENBQUMsQ0FBQyxVQUFSO0lBQ0EsSUFBQSxFQUNFO01BQUEsUUFBQSxFQUFVLFlBQVY7TUFDQSxPQUFBLEVBQVMsU0FBQyxRQUFELEVBQVcsUUFBWCxFQUFxQixVQUFyQjtlQUNQLENBQUMsQ0FBQyxNQUFGLENBQVMsRUFBVCxFQUFhLFVBQWIsRUFDRTtVQUFBLFFBQUEsRUFDRTtZQUFBLENBQUEsRUFBRyxHQUFBLEdBQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFMLENBQVUsUUFBQSxHQUFXLENBQUMsRUFBQSxHQUFLLElBQUksQ0FBQyxFQUFYLENBQXJCLENBQUQsQ0FBQSxHQUF5QyxDQUExQyxDQUFUO1lBQ0EsQ0FBQSxFQUFHLEdBQUEsR0FBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBVSxRQUFBLEdBQVcsQ0FBQyxFQUFBLEdBQUssSUFBSSxDQUFDLEVBQVgsQ0FBckIsQ0FBRCxDQUFBLEdBQXlDLENBQTFDLENBRFQ7V0FERjtTQURGO01BRE8sQ0FEVDtLQUZGO0dBREY7U0FVQSxRQUFBLENBQ0U7SUFBQSxJQUFBLEVBQU0sQ0FBQyxDQUFDLFVBQVI7SUFDQSxJQUFBLEVBQ0U7TUFBQSxRQUFBLEVBQVUsWUFBVjtNQUNBLFFBQUEsRUFBVSxHQURWO01BRUEsTUFBQSxFQUFRLFNBQUMsUUFBRCxFQUFXLFFBQVgsRUFBcUIsVUFBckI7ZUFDTixDQUFDLENBQUMsTUFBRixDQUFTLEVBQVQsRUFBYSxVQUFiLEVBQ0U7VUFBQSxXQUFBLEVBQWEsV0FBQSxDQUFBLENBQWI7U0FERjtNQURNLENBRlI7S0FGRjtHQURGO0FBakJlOztBQTJCakIsaUJBQUEsR0FBb0IsU0FBQyxRQUFELEVBQVcsS0FBWDtBQUVsQixNQUFBO0VBQUEsZUFBQSxHQUFrQixRQUFRLENBQUMsY0FBVCxDQUF3QixZQUF4QjtFQUNsQixlQUFlLENBQUMsZ0JBQWhCLENBQWlDLE9BQWpDLEVBQTBDLFNBQUE7V0FDeEMsUUFBQSxDQUNFO01BQUEsSUFBQSxFQUFNLENBQUMsQ0FBQyxTQUFSO01BQ0EsSUFBQSxFQUNFO1FBQUEsV0FBQSxFQUNFO1VBQUEsV0FBQSxFQUFhLE9BQWI7VUFDQSxRQUFBLEVBQ0U7WUFBQSxDQUFBLEVBQUcsQ0FBSDtZQUNBLENBQUEsRUFBRyxDQURIO1dBRkY7U0FERjtPQUZGO0tBREY7RUFEd0MsQ0FBMUM7RUFZQSxjQUFBLEdBQWlCLFFBQVEsQ0FBQyxjQUFULENBQXdCLGlCQUF4QjtFQUNqQixnQkFBQSxHQUFtQixTQUFBO1dBQU0sY0FBYyxDQUFDLEtBQWYsR0FBdUI7RUFBN0I7RUFFbkIsbUJBQUEsR0FBc0IsZ0JBQUEsQ0FBQTtFQUN0QixnQkFBQSxHQUFtQixTQUFBO0FBQ2pCLFFBQUE7SUFBQSxDQUFBLEdBQUksZ0JBQUEsQ0FBQTtJQUNKLE1BQU0sQ0FBQyxJQUFQLENBQVksS0FBSyxDQUFDLFFBQU4sQ0FBQSxDQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUF0QyxDQUNFLENBQUMsT0FESCxDQUNXLFNBQUMsUUFBRDthQUNQLFFBQUEsQ0FDRTtRQUFBLElBQUEsRUFBTSxDQUFDLENBQUMsc0JBQVI7UUFDQSxJQUFBLEVBQ0U7VUFBQSxNQUFBLEVBQVEsUUFBUjtVQUNBLFFBQUEsRUFBVSxZQURWO1VBRUEsS0FBQSxFQUFPLENBQUEsR0FBSSxtQkFGWDtTQUZGO09BREY7SUFETyxDQURYO1dBUUEsbUJBQUEsR0FBc0I7RUFWTDtFQVluQixjQUFjLENBQUMsZ0JBQWYsQ0FBZ0MsT0FBaEMsRUFBeUMsZ0JBQXpDO0VBQ0EsY0FBYyxDQUFDLGdCQUFmLENBQWdDLFFBQWhDLEVBQTBDLGdCQUExQztFQUdBLFdBQUEsR0FBYztFQUNkLGVBQUEsR0FBa0I7RUFDbEIsSUFBQSxHQUFPO0VBQ1AsY0FBQSxHQUFpQixTQUFDLENBQUQ7SUFDZixJQUFBLEdBQU87SUFDUCxNQUFNLENBQUMscUJBQVAsQ0FBNkIsY0FBN0I7SUFDQSxJQUFHLFdBQUg7TUFDRSxjQUFjLENBQUMsS0FBZixHQUF1QixJQUFBLENBQUssQ0FBTCxFQUFRLEdBQVIsRUFBYSxJQUFJLENBQUMsS0FBTCxDQUFZLENBQUMsZUFBQSxHQUFrQixDQUFuQixDQUFBLEdBQXdCLEVBQXBDLENBQWI7YUFDcEIsZ0JBQUgsQ0FBQSxFQUZGOztFQUhlO0VBUWpCLGFBQUEsR0FBZ0IsU0FBQTtXQUNkLFdBQUEsR0FBYztFQURBO0VBR2hCLGNBQUEsR0FBaUIsU0FBQTtJQUNmLElBQUcsQ0FBSSxXQUFQO01BQ0UsV0FBQSxHQUFjO2FBQ2QsZUFBQSxHQUFrQixjQUFjLENBQUMsS0FBZixHQUF1QixFQUF2QixHQUE0QixLQUZoRDs7RUFEZTtFQVVqQixNQUFBLEdBQVMsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsUUFBdkI7RUFDVCxVQUFBLEdBQWE7RUFFYixTQUFBLEdBQVk7RUFDWixtQkFBQSxHQUFzQjtFQUV0QixJQUFBLEdBQU8sU0FBQyxFQUFEO0lBQ0wsbUJBQUEsR0FBc0I7SUFDdEIsSUFBRyxpQkFBSDtNQUNFLFlBQUEsQ0FBYSxTQUFiO01BQ0EsU0FBQSxHQUFZLEtBRmQ7O0lBR0EsU0FBQSxHQUFZLFVBQUEsQ0FBVyxDQUFDLFNBQUE7YUFDdEIsbUJBQUEsR0FBc0I7SUFEQSxDQUFELENBQVgsRUFDb0IsR0FEcEI7V0FFWixVQUFBLEdBQWE7RUFQUjtFQVNQLElBQUEsR0FBTyxTQUFDLEVBQUQ7SUFDTCxJQUFHLENBQUksbUJBQVA7TUFDRSxhQUFBLENBQUE7TUFDQSxjQUFjLENBQUMsS0FBZixHQUF1QixJQUFBLENBQUssQ0FBTCxFQUFRLEdBQVIsRUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFILEdBQU8sVUFBVSxDQUFDLENBQW5CLENBQUEsR0FBd0IsQ0FBckM7YUFDcEIsZ0JBQUgsQ0FBQSxFQUhGOztFQURLO0VBTVAsRUFBQSxHQUFLLFNBQUMsRUFBRDtJQUNILElBQUcsbUJBQUg7TUFDRSxRQUFBLENBQ0U7UUFBQSxJQUFBLEVBQU0sQ0FBQyxDQUFDLFNBQVI7UUFDQSxJQUFBLEVBQ0U7VUFBQSxXQUFBLEVBQ0U7WUFBQSxXQUFBLEVBQWEsT0FBYjtZQUNBLFFBQUEsRUFDRTtjQUFBLENBQUEsRUFBRyxDQUFIO2NBQ0EsQ0FBQSxFQUFHLENBREg7YUFGRjtXQURGO1NBRkY7T0FERixFQURGOztXQVVBLGNBQUEsQ0FBQTtFQVhHO0VBYUwsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFlBQXhCLEVBQXNDLFNBQUMsR0FBRDtJQUNwQyxHQUFHLENBQUMsY0FBSixDQUFBO1dBQ0EsSUFBQSxDQUNFO01BQUEsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBbEI7TUFDQSxDQUFBLEVBQUcsR0FBRyxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxPQURsQjtLQURGO0VBRm9DLENBQXRDO0VBS0EsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFdBQXhCLEVBQXFDLFNBQUMsR0FBRDtJQUNuQyxHQUFHLENBQUMsY0FBSixDQUFBO1dBQ0EsSUFBQSxDQUNFO01BQUEsQ0FBQSxFQUFHLEdBQUcsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBbEI7TUFDQSxDQUFBLEVBQUcsR0FBRyxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxPQURsQjtLQURGO0VBRm1DLENBQXJDO0VBS0EsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFVBQXhCLEVBQW9DLFNBQUMsR0FBRDtXQUNsQyxFQUFBLENBQUE7RUFEa0MsQ0FBcEM7RUFHQSxXQUFBLEdBQWM7RUFDZCxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsV0FBeEIsRUFBcUMsU0FBQyxHQUFEO0lBQ25DLFdBQUEsR0FBYztXQUNkLElBQUEsQ0FDRTtNQUFBLENBQUEsRUFBRyxHQUFHLENBQUMsT0FBUDtNQUNBLENBQUEsRUFBRyxHQUFHLENBQUMsT0FEUDtLQURGO0VBRm1DLENBQXJDO0VBS0EsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFdBQXhCLEVBQXFDLFNBQUMsR0FBRDtJQUNuQyxJQUFHLFdBQUg7YUFDRSxJQUFBLENBQ0U7UUFBQSxDQUFBLEVBQUcsR0FBRyxDQUFDLE9BQVA7UUFDQSxDQUFBLEVBQUcsR0FBRyxDQUFDLE9BRFA7T0FERixFQURGOztFQURtQyxDQUFyQztFQUtBLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixTQUF4QixFQUFtQyxTQUFDLEdBQUQ7SUFDakMsV0FBQSxHQUFjO1dBQ2QsRUFBQSxDQUFBO0VBRmlDLENBQW5DO1NBTUcsY0FBSCxDQUFBO0FBM0hrQjs7QUE2SGpCLEtBQUgsQ0FBQTs7QUFNQSxXQUFBLEdBQWMsU0FBQTtBQUNaLE1BQUE7RUFBQSxVQUFBLEdBQWEsU0FBQTtXQUNYLElBQUksQ0FBQyxLQUFMLENBQVksSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLEdBQTVCO0VBRFc7U0FHYixPQUFBLEdBQ00sQ0FBQyxVQUFBLENBQUEsQ0FBRCxDQUROLEdBQ29CLElBRHBCLEdBRU0sQ0FBQyxVQUFBLENBQUEsQ0FBRCxDQUZOLEdBRW9CLElBRnBCLEdBR00sQ0FBQyxVQUFBLENBQUEsQ0FBRCxDQUhOLEdBR29CO0FBUFI7O0FBV2QsWUFBQSxHQUFlLFNBQUE7QUFDYixNQUFBO0VBQUEsTUFBQSxHQUFTLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCO0VBQ1QsR0FBQSxHQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMscUJBQWxCLENBQUE7RUFDTixNQUFNLENBQUMsS0FBUCxHQUFlLEdBQUcsQ0FBQztTQUNuQixNQUFNLENBQUMsTUFBUCxHQUFnQixHQUFHLENBQUM7QUFKUDs7QUFNZixNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsWUFBbEMsRUFBZ0QsS0FBaEQ7O0FBQ0csWUFBSCxDQUFBOzs7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUNSLFdBQU8sQ0FBQSxHQUFJO0VBTlI7RUFRTCxJQUFHLFNBQUg7V0FDSyxFQUFBLENBQUcsQ0FBSCxFQURMO0dBQUEsTUFBQTtXQUVLLEdBRkw7O0FBVHNCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG5yZWR1eCA9IHJlcXVpcmUgJ3JlZHV4J1xuayA9IHJlcXVpcmUgJy4uLy4uL3NyYy9BY3Rpb25UeXBlcydcbnJlZHVjZXIgPSByZXF1aXJlICcuLi8uLi9zcmMvcmVkdWNlcnMvYmFzZSdcblxue3RyYW5zbGF0ZTNkLCBvZmZzZXR9ID0gcmVxdWlyZSAnLi4vLi4vc3JjL3V0aWwvY3NzSGVscGVycydcblxud3JhcCA9IHJlcXVpcmUgJy4uLy4uL3NyYy91dGlsL3dyYXAnXG5cbmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdjb250YWluZXInXG5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdjYW52YXMnXG5jYW52YXMud2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGhcbmNhbnZhcy5oZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0XG5jb250YWluZXIuYXBwZW5kQ2hpbGQgY2FudmFzXG5cblxudXBkYXRlID0gKHN0YXRlLCBkaXNwYXRjaCkgLT5cbiAgKE9iamVjdC5rZXlzIHN0YXRlLmVudGl0aWVzLmRpY3QpLmZvckVhY2ggKGtleSkgLT5cbiAgICBpZiBzdGF0ZS5lbnRpdGllcy5kaWN0W2tleV0uYXR0YWNoZWRUaW1lbGluZXMubGVuZ3RoIGlzIDBcbiAgICAgIGRpc3BhdGNoXG4gICAgICAgIHR5cGU6IGsuQXR0YWNoRW50aXR5VG9UaW1lbGluZVxuICAgICAgICBkYXRhOlxuICAgICAgICAgIGVudGl0eToga2V5XG4gICAgICAgICAgdGltZWxpbmU6ICd0aW1lbGluZS0wJ1xuXG4gIGRyYXcgKGNhbnZhcy5nZXRDb250ZXh0ICcyZCcpLCBzdGF0ZS5lbnRpdGllc1xuXG5cbmRyYXcgPSAoY3R4LCBlbnRpdGllcykgLT5cbiAgY3R4LmNsZWFyUmVjdCAwLCAwLCBjdHguY2FudmFzLndpZHRoLCBjdHguY2FudmFzLmhlaWdodFxuICBjdHguYmVnaW5QYXRoKClcblxuICBnZXRQb3NpdGlvbiA9IChlbnRpdHlJZCkgLT5cbiAgICBpZiBlbnRpdHlJZD9cbiAgICAgIHAgPSBlbnRpdGllcy5kaWN0W2VudGl0eUlkXS5kYXRhLnBvc2l0aW9uXG4gICAgICB4OiBwLnggKiBjdHguY2FudmFzLndpZHRoXG4gICAgICB5OiBwLnkgKiBjdHguY2FudmFzLmhlaWdodFxuICAgIGVsc2UgZW50aXR5SWRcblxuICBlbnRpdHlLZXlzID0gT2JqZWN0LmtleXMgZW50aXRpZXMuZGljdFxuXG4gIGVudGl0eUtleXNcbiAgICAuZm9yRWFjaCAoa2V5LCBpZHgsIGFycikgLT5cbiAgICAgIHBvcyA9IGdldFBvc2l0aW9uIGtleVxuICAgICAgY3R4LmxpbmVUbyBwb3MueCwgcG9zLnlcbiAgY3R4LmNsb3NlUGF0aCgpXG4gIGN0eC5zdHJva2VTdHlsZSA9ICd3aGl0ZSdcbiAgY3R4LnN0cm9rZSgpXG5cbiAgZW50aXR5S2V5c1xuICAgIC5mb3JFYWNoIChrZXksIGlkeCwgYXJyKSAtPlxuICAgICAgcG9zID0gZ2V0UG9zaXRpb24ga2V5XG4gICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgIGN0eC5lbGxpcHNlIHBvcy54LCBwb3MueSwgMTAsIDEwLCA0NSAqIE1hdGguUEkvMTgwLCAwLCAyICogTWF0aC5QSVxuICAgICAgY3R4LmNsb3NlUGF0aCgpXG4gICAgICBjdHguZmlsbFN0eWxlID0gZW50aXRpZXMuZGljdFtrZXldLmRhdGEuc3Ryb2tlQ29sb3JcbiAgICAgIGN0eC5maWxsKClcblxuXG5cbmRpZmZLZXlzID0gKHByZXZpb3VzLCBjdXJyZW50KSAtPlxuICBhZGRlZDogKE9iamVjdC5rZXlzIGN1cnJlbnQpLmZpbHRlciAoa2V5KSAtPiBub3QgcHJldmlvdXNba2V5XT9cbiAgcmVtb3ZlZDogKE9iamVjdC5rZXlzIHByZXZpb3VzKS5maWx0ZXIgKGtleSkgLT4gbm90IGN1cnJlbnRba2V5XT9cblxuXG5zZXR1cCA9ICgpIC0+XG4gIHN0b3JlID0gcmVkdXguY3JlYXRlU3RvcmUgcmVkdWNlclxuXG4gIHNldHVwVGltZWxpbmVzIHN0b3JlLmRpc3BhdGNoXG4gIHNldHVwSW50ZXJhY3Rpb25zIHN0b3JlLmRpc3BhdGNoLCBzdG9yZVxuXG4gIHN0b3JlLnN1YnNjcmliZSAoKSAtPlxuICAgIHVwZGF0ZSBzdG9yZS5nZXRTdGF0ZSgpLCBzdG9yZS5kaXNwYXRjaFxuXG5cbnNldHVwVGltZWxpbmVzID0gKGRpc3BhdGNoKSAtPlxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVGltZWxpbmVcbiAgICBkYXRhOlxuICAgICAgbGVuZ3RoOiAxXG4gICAgICBzaG91bGRMb29wOiB0cnVlXG5cbiAgZGlzcGF0Y2hcbiAgICB0eXBlOiBrLkFkZE1hcHBpbmdcbiAgICBkYXRhOlxuICAgICAgdGltZWxpbmU6ICd0aW1lbGluZS0wJ1xuICAgICAgbWFwcGluZzogKHByb2dyZXNzLCBlbnRpdHlJZCwgZW50aXR5RGF0YSkgLT5cbiAgICAgICAgXy5hc3NpZ24ge30sIGVudGl0eURhdGEsXG4gICAgICAgICAgcG9zaXRpb246XG4gICAgICAgICAgICB4OiAwLjUgKiAoKE1hdGguc2luIChwcm9ncmVzcyAqICg3NSAvIE1hdGguUEkpKSkgKyAxKVxuICAgICAgICAgICAgeTogMC41ICogKChNYXRoLnNpbiAocHJvZ3Jlc3MgKiAoNTAgLyBNYXRoLlBJKSkpICsgMSlcblxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVHJpZ2dlclxuICAgIGRhdGE6XG4gICAgICB0aW1lbGluZTogJ3RpbWVsaW5lLTAnXG4gICAgICBwb3NpdGlvbjogMC41XG4gICAgICBhY3Rpb246IChwcm9ncmVzcywgZW50aXR5SWQsIGVudGl0eURhdGEpIC0+XG4gICAgICAgIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLFxuICAgICAgICAgIHN0cm9rZUNvbG9yOiByYW5kb21Db2xvcigpXG5cblxuc2V0dXBJbnRlcmFjdGlvbnMgPSAoZGlzcGF0Y2gsIHN0b3JlKSAtPlxuICAjIEFkZGluZyBlbnRpdGllc1xuICBhZGRFbnRpdHlCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnYWRkLWVudGl0eSdcbiAgYWRkRW50aXR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgKCkgLT5cbiAgICBkaXNwYXRjaFxuICAgICAgdHlwZTogay5BZGRFbnRpdHlcbiAgICAgIGRhdGE6XG4gICAgICAgIGluaXRpYWxEYXRhOlxuICAgICAgICAgIHN0cm9rZUNvbG9yOiAnYmxhY2snXG4gICAgICAgICAgcG9zaXRpb246XG4gICAgICAgICAgICB4OiAwXG4gICAgICAgICAgICB5OiAwXG5cblxuICAjIFRpbWVsaW5lIHNsaWRlclxuICB0aW1lbGluZVNsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd0aW1lbGluZS1zbGlkZXInXG4gIGdldFRpbWVsaW5lVmFsdWUgPSAoKSAtPiB0aW1lbGluZVNsaWRlci52YWx1ZSAvIDEwMFxuXG4gIHByZXZpb3VzU2xpZGVyVmFsdWUgPSBnZXRUaW1lbGluZVZhbHVlKClcbiAgcHJvZ3Jlc3NUaW1lbGluZSA9ICgpIC0+XG4gICAgdiA9IGdldFRpbWVsaW5lVmFsdWUoKVxuICAgIE9iamVjdC5rZXlzIHN0b3JlLmdldFN0YXRlKCkuZW50aXRpZXMuZGljdFxuICAgICAgLmZvckVhY2ggKGVudGl0eUlkKSAtPlxuICAgICAgICBkaXNwYXRjaFxuICAgICAgICAgIHR5cGU6IGsuUHJvZ3Jlc3NFbnRpdHlUaW1lbGluZVxuICAgICAgICAgIGRhdGE6XG4gICAgICAgICAgICBlbnRpdHk6IGVudGl0eUlkXG4gICAgICAgICAgICB0aW1lbGluZTogJ3RpbWVsaW5lLTAnXG4gICAgICAgICAgICBkZWx0YTogdiAtIHByZXZpb3VzU2xpZGVyVmFsdWVcbiAgICBwcmV2aW91c1NsaWRlclZhbHVlID0gdlxuXG4gIHRpbWVsaW5lU2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ2lucHV0JywgcHJvZ3Jlc3NUaW1lbGluZVxuICB0aW1lbGluZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnLCBwcm9ncmVzc1RpbWVsaW5lXG5cbiAgIyBUaW1lIGNvbnRyb2wgb2Ygc2xpZGVyXG4gIGlzQW5pbWF0aW5nID0gdHJ1ZVxuICBhbmltYXRpb25PZmZzZXQgPSAwXG4gIHRpbWUgPSAwXG4gIHVwZGF0ZVRpbWVsaW5lID0gKHQpIC0+XG4gICAgdGltZSA9IHRcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHVwZGF0ZVRpbWVsaW5lXG4gICAgaWYgaXNBbmltYXRpbmdcbiAgICAgIHRpbWVsaW5lU2xpZGVyLnZhbHVlID0gd3JhcCAwLCAxMDAsIE1hdGguZmxvb3IgKChhbmltYXRpb25PZmZzZXQgKyB0KSAvIDQwKVxuICAgICAgZG8gcHJvZ3Jlc3NUaW1lbGluZVxuXG5cbiAgc3RvcEFuaW1hdGlvbiA9ICgpIC0+XG4gICAgaXNBbmltYXRpbmcgPSBmYWxzZVxuXG4gIHN0YXJ0QW5pbWF0aW9uID0gKCkgLT5cbiAgICBpZiBub3QgaXNBbmltYXRpbmdcbiAgICAgIGlzQW5pbWF0aW5nID0gdHJ1ZVxuICAgICAgYW5pbWF0aW9uT2Zmc2V0ID0gdGltZWxpbmVTbGlkZXIudmFsdWUgKiAzMCAtIHRpbWVcblxuICAjIFVzZXItZWRpdGluZyBvdmVycmlkZSBvZiB0aW1lIGNvbnRyb2xcbiAgIyB0aW1lbGluZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBzdG9wQW5pbWF0aW9uXG4gICMgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcsIHN0YXJ0QW5pbWF0aW9uXG5cbiAgIyBHZXN0dXJlIGNvbnRyb2wgb2Ygc2xpZGVyXG4gIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJ2NhbnZhcydcbiAgc3RhcnRQb2ludCA9IG51bGxcblxuICB0aW1lb3V0SWQgPSBudWxsXG4gIHNob3VsZE1ha2VOZXdFbnRpdHkgPSB0cnVlXG5cbiAgZG93biA9IChwdCkgLT5cbiAgICBzaG91bGRNYWtlTmV3RW50aXR5ID0gdHJ1ZVxuICAgIGlmIHRpbWVvdXRJZD9cbiAgICAgIGNsZWFyVGltZW91dCB0aW1lb3V0SWRcbiAgICAgIHRpbWVvdXRJZCA9IG51bGxcbiAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0ICgoKSAtPlxuICAgICAgc2hvdWxkTWFrZU5ld0VudGl0eSA9IGZhbHNlKSwgMTAwXG4gICAgc3RhcnRQb2ludCA9IHB0XG5cbiAgbW92ZSA9IChwdCkgLT5cbiAgICBpZiBub3Qgc2hvdWxkTWFrZU5ld0VudGl0eVxuICAgICAgc3RvcEFuaW1hdGlvbigpXG4gICAgICB0aW1lbGluZVNsaWRlci52YWx1ZSA9IHdyYXAgMCwgMTAwLCAocHQueCAtIHN0YXJ0UG9pbnQueCkgLyAzXG4gICAgICBkbyBwcm9ncmVzc1RpbWVsaW5lXG5cbiAgdXAgPSAocHQpIC0+XG4gICAgaWYgc2hvdWxkTWFrZU5ld0VudGl0eVxuICAgICAgZGlzcGF0Y2hcbiAgICAgICAgdHlwZTogay5BZGRFbnRpdHlcbiAgICAgICAgZGF0YTpcbiAgICAgICAgICBpbml0aWFsRGF0YTpcbiAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAnYmxhY2snXG4gICAgICAgICAgICBwb3NpdGlvbjpcbiAgICAgICAgICAgICAgeDogMFxuICAgICAgICAgICAgICB5OiAwXG5cbiAgICBzdGFydEFuaW1hdGlvbigpXG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ3RvdWNoc3RhcnQnLCAoZXZ0KSAtPlxuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG93blxuICAgICAgeDogZXZ0LnRvdWNoZXNbMF0uY2xpZW50WFxuICAgICAgeTogZXZ0LnRvdWNoZXNbMF0uY2xpZW50WVxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lciAndG91Y2htb3ZlJywgKGV2dCkgLT5cbiAgICBldnQucHJldmVudERlZmF1bHQoKVxuICAgIG1vdmVcbiAgICAgIHg6IGV2dC50b3VjaGVzWzBdLmNsaWVudFhcbiAgICAgIHk6IGV2dC50b3VjaGVzWzBdLmNsaWVudFlcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ3RvdWNoZW5kJywgKGV2dCkgLT5cbiAgICB1cCgpXG5cbiAgbW91c2VJc0Rvd24gPSBmYWxzZVxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgKGV2dCkgLT5cbiAgICBtb3VzZUlzRG93biA9IHRydWVcbiAgICBkb3duXG4gICAgICB4OiBldnQuY2xpZW50WFxuICAgICAgeTogZXZ0LmNsaWVudFlcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlbW92ZScsIChldnQpIC0+XG4gICAgaWYgbW91c2VJc0Rvd25cbiAgICAgIG1vdmVcbiAgICAgICAgeDogZXZ0LmNsaWVudFhcbiAgICAgICAgeTogZXZ0LmNsaWVudFlcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCAoZXZ0KSAtPlxuICAgIG1vdXNlSXNEb3duID0gZmFsc2VcbiAgICB1cCgpXG5cblxuXG4gIGRvIHVwZGF0ZVRpbWVsaW5lXG5cbmRvIHNldHVwXG5cblxuXG4jIC0tLSBIZWxwZXJzXG5cbnJhbmRvbUNvbG9yID0gKCkgLT5cbiAgcmFuZG9tOGJpdCA9ICgpIC0+XG4gICAgTWF0aC5mbG9vciAoTWF0aC5yYW5kb20oKSAqIDI1NilcblxuICBcIlwiXCJcbiAgcmdiYSgje3JhbmRvbThiaXQoKX0sIFxcXG4gICAgICAgI3tyYW5kb204Yml0KCl9LCBcXFxuICAgICAgICN7cmFuZG9tOGJpdCgpfSwgXFxcbiAgICAgICAxKVxuICBcIlwiXCJcblxucmVzaXplQ2FudmFzID0gKCkgLT5cbiAgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciAnY2FudmFzJ1xuICBiY3IgPSBjYW52YXMucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICBjYW52YXMud2lkdGggPSBiY3Iud2lkdGhcbiAgY2FudmFzLmhlaWdodCA9IGJjci5oZWlnaHRcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ3Jlc2l6ZScsIHJlc2l6ZUNhbnZhcywgZmFsc2VcbmRvIHJlc2l6ZUNhbnZhcyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyoqXG4gKiBHZXRzIHRoZSBsYXN0IGVsZW1lbnQgb2YgYGFycmF5YC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEFycmF5XG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbGFzdCBlbGVtZW50IG9mIGBhcnJheWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ubGFzdChbMSwgMiwgM10pO1xuICogLy8gPT4gM1xuICovXG5mdW5jdGlvbiBsYXN0KGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDA7XG4gIHJldHVybiBsZW5ndGggPyBhcnJheVtsZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsYXN0O1xuIiwidmFyIGFycmF5RWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2FycmF5RWFjaCcpLFxuICAgIGJhc2VFYWNoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUVhY2gnKSxcbiAgICBjcmVhdGVGb3JFYWNoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY3JlYXRlRm9yRWFjaCcpO1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgYGNvbGxlY3Rpb25gIGludm9raW5nIGBpdGVyYXRlZWAgZm9yIGVhY2ggZWxlbWVudC5cbiAqIFRoZSBgaXRlcmF0ZWVgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czpcbiAqICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS4gSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseVxuICogYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiAqKk5vdGU6KiogQXMgd2l0aCBvdGhlciBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcywgb2JqZWN0cyB3aXRoIGEgXCJsZW5ndGhcIiBwcm9wZXJ0eVxuICogYXJlIGl0ZXJhdGVkIGxpa2UgYXJyYXlzLiBUbyBhdm9pZCB0aGlzIGJlaGF2aW9yIGBfLmZvckluYCBvciBgXy5mb3JPd25gXG4gKiBtYXkgYmUgdXNlZCBmb3Igb2JqZWN0IGl0ZXJhdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGFsaWFzIGVhY2hcbiAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2l0ZXJhdGVlPV8uaWRlbnRpdHldIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGl0ZXJhdGVlYC5cbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXyhbMSwgMl0pLmZvckVhY2goZnVuY3Rpb24obikge1xuICogICBjb25zb2xlLmxvZyhuKTtcbiAqIH0pLnZhbHVlKCk7XG4gKiAvLyA9PiBsb2dzIGVhY2ggdmFsdWUgZnJvbSBsZWZ0IHRvIHJpZ2h0IGFuZCByZXR1cm5zIHRoZSBhcnJheVxuICpcbiAqIF8uZm9yRWFjaCh7ICdhJzogMSwgJ2InOiAyIH0sIGZ1bmN0aW9uKG4sIGtleSkge1xuICogICBjb25zb2xlLmxvZyhuLCBrZXkpO1xuICogfSk7XG4gKiAvLyA9PiBsb2dzIGVhY2ggdmFsdWUta2V5IHBhaXIgYW5kIHJldHVybnMgdGhlIG9iamVjdCAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG52YXIgZm9yRWFjaCA9IGNyZWF0ZUZvckVhY2goYXJyYXlFYWNoLCBiYXNlRWFjaCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZm9yRWFjaDtcbiIsInZhciBhcnJheU1hcCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2FycmF5TWFwJyksXG4gICAgYmFzZUNhbGxiYWNrID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUNhbGxiYWNrJyksXG4gICAgYmFzZU1hcCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VNYXAnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB2YWx1ZXMgYnkgcnVubmluZyBlYWNoIGVsZW1lbnQgaW4gYGNvbGxlY3Rpb25gIHRocm91Z2hcbiAqIGBpdGVyYXRlZWAuIFRoZSBgaXRlcmF0ZWVgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlXG4gKiBhcmd1bWVudHM6ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAqXG4gKiBJZiBhIHByb3BlcnR5IG5hbWUgaXMgcHJvdmlkZWQgZm9yIGBpdGVyYXRlZWAgdGhlIGNyZWF0ZWQgYF8ucHJvcGVydHlgXG4gKiBzdHlsZSBjYWxsYmFjayByZXR1cm5zIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBJZiBhIHZhbHVlIGlzIGFsc28gcHJvdmlkZWQgZm9yIGB0aGlzQXJnYCB0aGUgY3JlYXRlZCBgXy5tYXRjaGVzUHJvcGVydHlgXG4gKiBzdHlsZSBjYWxsYmFjayByZXR1cm5zIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGEgbWF0Y2hpbmcgcHJvcGVydHlcbiAqIHZhbHVlLCBlbHNlIGBmYWxzZWAuXG4gKlxuICogSWYgYW4gb2JqZWN0IGlzIHByb3ZpZGVkIGZvciBgaXRlcmF0ZWVgIHRoZSBjcmVhdGVkIGBfLm1hdGNoZXNgIHN0eWxlXG4gKiBjYWxsYmFjayByZXR1cm5zIGB0cnVlYCBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBnaXZlblxuICogb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKlxuICogTWFueSBsb2Rhc2ggbWV0aG9kcyBhcmUgZ3VhcmRlZCB0byB3b3JrIGFzIGl0ZXJhdGVlcyBmb3IgbWV0aG9kcyBsaWtlXG4gKiBgXy5ldmVyeWAsIGBfLmZpbHRlcmAsIGBfLm1hcGAsIGBfLm1hcFZhbHVlc2AsIGBfLnJlamVjdGAsIGFuZCBgXy5zb21lYC5cbiAqXG4gKiBUaGUgZ3VhcmRlZCBtZXRob2RzIGFyZTpcbiAqIGBhcnlgLCBgY2FsbGJhY2tgLCBgY2h1bmtgLCBgY2xvbmVgLCBgY3JlYXRlYCwgYGN1cnJ5YCwgYGN1cnJ5UmlnaHRgLFxuICogYGRyb3BgLCBgZHJvcFJpZ2h0YCwgYGV2ZXJ5YCwgYGZpbGxgLCBgZmxhdHRlbmAsIGBpbnZlcnRgLCBgbWF4YCwgYG1pbmAsXG4gKiBgcGFyc2VJbnRgLCBgc2xpY2VgLCBgc29ydEJ5YCwgYHRha2VgLCBgdGFrZVJpZ2h0YCwgYHRlbXBsYXRlYCwgYHRyaW1gLFxuICogYHRyaW1MZWZ0YCwgYHRyaW1SaWdodGAsIGB0cnVuY2AsIGByYW5kb21gLCBgcmFuZ2VgLCBgc2FtcGxlYCwgYHNvbWVgLFxuICogYHN1bWAsIGB1bmlxYCwgYW5kIGB3b3Jkc2BcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGFsaWFzIGNvbGxlY3RcbiAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbaXRlcmF0ZWU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWRcbiAqICBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIHRpbWVzVGhyZWUobikge1xuICogICByZXR1cm4gbiAqIDM7XG4gKiB9XG4gKlxuICogXy5tYXAoWzEsIDJdLCB0aW1lc1RocmVlKTtcbiAqIC8vID0+IFszLCA2XVxuICpcbiAqIF8ubWFwKHsgJ2EnOiAxLCAnYic6IDIgfSwgdGltZXNUaHJlZSk7XG4gKiAvLyA9PiBbMywgNl0gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqXG4gKiB2YXIgdXNlcnMgPSBbXG4gKiAgIHsgJ3VzZXInOiAnYmFybmV5JyB9LFxuICogICB7ICd1c2VyJzogJ2ZyZWQnIH1cbiAqIF07XG4gKlxuICogLy8gdXNpbmcgdGhlIGBfLnByb3BlcnR5YCBjYWxsYmFjayBzaG9ydGhhbmRcbiAqIF8ubWFwKHVzZXJzLCAndXNlcicpO1xuICogLy8gPT4gWydiYXJuZXknLCAnZnJlZCddXG4gKi9cbmZ1bmN0aW9uIG1hcChjb2xsZWN0aW9uLCBpdGVyYXRlZSwgdGhpc0FyZykge1xuICB2YXIgZnVuYyA9IGlzQXJyYXkoY29sbGVjdGlvbikgPyBhcnJheU1hcCA6IGJhc2VNYXA7XG4gIGl0ZXJhdGVlID0gYmFzZUNhbGxiYWNrKGl0ZXJhdGVlLCB0aGlzQXJnLCAzKTtcbiAgcmV0dXJuIGZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcDtcbiIsInZhciBhcnJheUZpbHRlciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2FycmF5RmlsdGVyJyksXG4gICAgYmFzZUNhbGxiYWNrID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUNhbGxiYWNrJyksXG4gICAgYmFzZUZpbHRlciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VGaWx0ZXInKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5Jyk7XG5cbi8qKlxuICogVGhlIG9wcG9zaXRlIG9mIGBfLmZpbHRlcmA7IHRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGVsZW1lbnRzIG9mIGBjb2xsZWN0aW9uYFxuICogdGhhdCBgcHJlZGljYXRlYCBkb2VzICoqbm90KiogcmV0dXJuIHRydXRoeSBmb3IuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbcHJlZGljYXRlPV8uaWRlbnRpdHldIFRoZSBmdW5jdGlvbiBpbnZva2VkXG4gKiAgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgcHJlZGljYXRlYC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZpbHRlcmVkIGFycmF5LlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnJlamVjdChbMSwgMiwgMywgNF0sIGZ1bmN0aW9uKG4pIHtcbiAqICAgcmV0dXJuIG4gJSAyID09IDA7XG4gKiB9KTtcbiAqIC8vID0+IFsxLCAzXVxuICpcbiAqIHZhciB1c2VycyA9IFtcbiAqICAgeyAndXNlcic6ICdiYXJuZXknLCAnYWdlJzogMzYsICdhY3RpdmUnOiBmYWxzZSB9LFxuICogICB7ICd1c2VyJzogJ2ZyZWQnLCAgICdhZ2UnOiA0MCwgJ2FjdGl2ZSc6IHRydWUgfVxuICogXTtcbiAqXG4gKiAvLyB1c2luZyB0aGUgYF8ubWF0Y2hlc2AgY2FsbGJhY2sgc2hvcnRoYW5kXG4gKiBfLnBsdWNrKF8ucmVqZWN0KHVzZXJzLCB7ICdhZ2UnOiA0MCwgJ2FjdGl2ZSc6IHRydWUgfSksICd1c2VyJyk7XG4gKiAvLyA9PiBbJ2Jhcm5leSddXG4gKlxuICogLy8gdXNpbmcgdGhlIGBfLm1hdGNoZXNQcm9wZXJ0eWAgY2FsbGJhY2sgc2hvcnRoYW5kXG4gKiBfLnBsdWNrKF8ucmVqZWN0KHVzZXJzLCAnYWN0aXZlJywgZmFsc2UpLCAndXNlcicpO1xuICogLy8gPT4gWydmcmVkJ11cbiAqXG4gKiAvLyB1c2luZyB0aGUgYF8ucHJvcGVydHlgIGNhbGxiYWNrIHNob3J0aGFuZFxuICogXy5wbHVjayhfLnJlamVjdCh1c2VycywgJ2FjdGl2ZScpLCAndXNlcicpO1xuICogLy8gPT4gWydiYXJuZXknXVxuICovXG5mdW5jdGlvbiByZWplY3QoY29sbGVjdGlvbiwgcHJlZGljYXRlLCB0aGlzQXJnKSB7XG4gIHZhciBmdW5jID0gaXNBcnJheShjb2xsZWN0aW9uKSA/IGFycmF5RmlsdGVyIDogYmFzZUZpbHRlcjtcbiAgcHJlZGljYXRlID0gYmFzZUNhbGxiYWNrKHByZWRpY2F0ZSwgdGhpc0FyZywgMyk7XG4gIHJldHVybiBmdW5jKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgIHJldHVybiAhcHJlZGljYXRlKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlamVjdDtcbiIsIi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZVxuICogY3JlYXRlZCBmdW5jdGlvbiBhbmQgYXJndW1lbnRzIGZyb20gYHN0YXJ0YCBhbmQgYmV5b25kIHByb3ZpZGVkIGFzIGFuIGFycmF5LlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBiYXNlZCBvbiB0aGUgW3Jlc3QgcGFyYW1ldGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL3Jlc3RfcGFyYW1ldGVycykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc2F5ID0gXy5yZXN0UGFyYW0oZnVuY3Rpb24od2hhdCwgbmFtZXMpIHtcbiAqICAgcmV0dXJuIHdoYXQgKyAnICcgKyBfLmluaXRpYWwobmFtZXMpLmpvaW4oJywgJykgK1xuICogICAgIChfLnNpemUobmFtZXMpID4gMSA/ICcsICYgJyA6ICcnKSArIF8ubGFzdChuYW1lcyk7XG4gKiB9KTtcbiAqXG4gKiBzYXkoJ2hlbGxvJywgJ2ZyZWQnLCAnYmFybmV5JywgJ3BlYmJsZXMnKTtcbiAqIC8vID0+ICdoZWxsbyBmcmVkLCBiYXJuZXksICYgcGViYmxlcydcbiAqL1xuZnVuY3Rpb24gcmVzdFBhcmFtKGZ1bmMsIHN0YXJ0KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHN0YXJ0ID0gbmF0aXZlTWF4KHN0YXJ0ID09PSB1bmRlZmluZWQgPyAoZnVuYy5sZW5ndGggLSAxKSA6ICgrc3RhcnQgfHwgMCksIDApO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IG5hdGl2ZU1heChhcmdzLmxlbmd0aCAtIHN0YXJ0LCAwKSxcbiAgICAgICAgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgcmVzdFtpbmRleF0gPSBhcmdzW3N0YXJ0ICsgaW5kZXhdO1xuICAgIH1cbiAgICBzd2l0Y2ggKHN0YXJ0KSB7XG4gICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgcmVzdCk7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgcmVzdCk7XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJnc1sxXSwgcmVzdCk7XG4gICAgfVxuICAgIHZhciBvdGhlckFyZ3MgPSBBcnJheShzdGFydCArIDEpO1xuICAgIGluZGV4ID0gLTE7XG4gICAgd2hpbGUgKCsraW5kZXggPCBzdGFydCkge1xuICAgICAgb3RoZXJBcmdzW2luZGV4XSA9IGFyZ3NbaW5kZXhdO1xuICAgIH1cbiAgICBvdGhlckFyZ3Nbc3RhcnRdID0gcmVzdDtcbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc3RQYXJhbTtcbiIsInZhciBjYWNoZVB1c2ggPSByZXF1aXJlKCcuL2NhY2hlUHVzaCcpLFxuICAgIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4vZ2V0TmF0aXZlJyk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgU2V0ID0gZ2V0TmF0aXZlKGdsb2JhbCwgJ1NldCcpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUNyZWF0ZSA9IGdldE5hdGl2ZShPYmplY3QsICdjcmVhdGUnKTtcblxuLyoqXG4gKlxuICogQ3JlYXRlcyBhIGNhY2hlIG9iamVjdCB0byBzdG9yZSB1bmlxdWUgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbdmFsdWVzXSBUaGUgdmFsdWVzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBTZXRDYWNoZSh2YWx1ZXMpIHtcbiAgdmFyIGxlbmd0aCA9IHZhbHVlcyA/IHZhbHVlcy5sZW5ndGggOiAwO1xuXG4gIHRoaXMuZGF0YSA9IHsgJ2hhc2gnOiBuYXRpdmVDcmVhdGUobnVsbCksICdzZXQnOiBuZXcgU2V0IH07XG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIHRoaXMucHVzaCh2YWx1ZXNbbGVuZ3RoXSk7XG4gIH1cbn1cblxuLy8gQWRkIGZ1bmN0aW9ucyB0byB0aGUgYFNldGAgY2FjaGUuXG5TZXRDYWNoZS5wcm90b3R5cGUucHVzaCA9IGNhY2hlUHVzaDtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXRDYWNoZTtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmZvckVhY2hgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5RWFjaChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUVhY2g7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5maWx0ZXJgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZpbHRlcmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhcnJheUZpbHRlcihhcnJheSwgcHJlZGljYXRlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgcmVzSW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuICAgIGlmIChwcmVkaWNhdGUodmFsdWUsIGluZGV4LCBhcnJheSkpIHtcbiAgICAgIHJlc3VsdFsrK3Jlc0luZGV4XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5RmlsdGVyO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWFwYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlNYXAoYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheU1hcDtcbiIsIi8qKlxuICogQXBwZW5kcyB0aGUgZWxlbWVudHMgb2YgYHZhbHVlc2AgdG8gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBUaGUgdmFsdWVzIHRvIGFwcGVuZC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheVB1c2goYXJyYXksIHZhbHVlcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICBvZmZzZXQgPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtvZmZzZXQgKyBpbmRleF0gPSB2YWx1ZXNbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVB1c2g7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5zb21lYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGVsZW1lbnQgcGFzc2VzIHRoZSBwcmVkaWNhdGUgY2hlY2ssXG4gKiAgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBhcnJheVNvbWUoYXJyYXksIHByZWRpY2F0ZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5U29tZTtcbiIsInZhciBiYXNlTWF0Y2hlcyA9IHJlcXVpcmUoJy4vYmFzZU1hdGNoZXMnKSxcbiAgICBiYXNlTWF0Y2hlc1Byb3BlcnR5ID0gcmVxdWlyZSgnLi9iYXNlTWF0Y2hlc1Byb3BlcnR5JyksXG4gICAgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi9iaW5kQ2FsbGJhY2snKSxcbiAgICBpZGVudGl0eSA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvaWRlbnRpdHknKSxcbiAgICBwcm9wZXJ0eSA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHJvcGVydHknKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jYWxsYmFja2Agd2hpY2ggc3VwcG9ydHMgc3BlY2lmeWluZyB0aGVcbiAqIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gW2Z1bmM9Xy5pZGVudGl0eV0gVGhlIHZhbHVlIHRvIGNvbnZlcnQgdG8gYSBjYWxsYmFjay5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY2FsbGJhY2suXG4gKi9cbmZ1bmN0aW9uIGJhc2VDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBmdW5jO1xuICBpZiAodHlwZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHRoaXNBcmcgPT09IHVuZGVmaW5lZFxuICAgICAgPyBmdW5jXG4gICAgICA6IGJpbmRDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCk7XG4gIH1cbiAgaWYgKGZ1bmMgPT0gbnVsbCkge1xuICAgIHJldHVybiBpZGVudGl0eTtcbiAgfVxuICBpZiAodHlwZSA9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBiYXNlTWF0Y2hlcyhmdW5jKTtcbiAgfVxuICByZXR1cm4gdGhpc0FyZyA9PT0gdW5kZWZpbmVkXG4gICAgPyBwcm9wZXJ0eShmdW5jKVxuICAgIDogYmFzZU1hdGNoZXNQcm9wZXJ0eShmdW5jLCB0aGlzQXJnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ2FsbGJhY2s7XG4iLCJ2YXIgYmFzZUluZGV4T2YgPSByZXF1aXJlKCcuL2Jhc2VJbmRleE9mJyksXG4gICAgY2FjaGVJbmRleE9mID0gcmVxdWlyZSgnLi9jYWNoZUluZGV4T2YnKSxcbiAgICBjcmVhdGVDYWNoZSA9IHJlcXVpcmUoJy4vY3JlYXRlQ2FjaGUnKTtcblxuLyoqIFVzZWQgYXMgdGhlIHNpemUgdG8gZW5hYmxlIGxhcmdlIGFycmF5IG9wdGltaXphdGlvbnMuICovXG52YXIgTEFSR0VfQVJSQVlfU0laRSA9IDIwMDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5kaWZmZXJlbmNlYCB3aGljaCBhY2NlcHRzIGEgc2luZ2xlIGFycmF5XG4gKiBvZiB2YWx1ZXMgdG8gZXhjbHVkZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBleGNsdWRlLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkgb2YgZmlsdGVyZWQgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBiYXNlRGlmZmVyZW5jZShhcnJheSwgdmFsdWVzKSB7XG4gIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICBpZiAoIWxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBpbmRleE9mID0gYmFzZUluZGV4T2YsXG4gICAgICBpc0NvbW1vbiA9IHRydWUsXG4gICAgICBjYWNoZSA9IChpc0NvbW1vbiAmJiB2YWx1ZXMubGVuZ3RoID49IExBUkdFX0FSUkFZX1NJWkUpID8gY3JlYXRlQ2FjaGUodmFsdWVzKSA6IG51bGwsXG4gICAgICB2YWx1ZXNMZW5ndGggPSB2YWx1ZXMubGVuZ3RoO1xuXG4gIGlmIChjYWNoZSkge1xuICAgIGluZGV4T2YgPSBjYWNoZUluZGV4T2Y7XG4gICAgaXNDb21tb24gPSBmYWxzZTtcbiAgICB2YWx1ZXMgPSBjYWNoZTtcbiAgfVxuICBvdXRlcjpcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG5cbiAgICBpZiAoaXNDb21tb24gJiYgdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICB2YXIgdmFsdWVzSW5kZXggPSB2YWx1ZXNMZW5ndGg7XG4gICAgICB3aGlsZSAodmFsdWVzSW5kZXgtLSkge1xuICAgICAgICBpZiAodmFsdWVzW3ZhbHVlc0luZGV4XSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChpbmRleE9mKHZhbHVlcywgdmFsdWUsIDApIDwgMCkge1xuICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VEaWZmZXJlbmNlO1xuIiwidmFyIGJhc2VGb3JPd24gPSByZXF1aXJlKCcuL2Jhc2VGb3JPd24nKSxcbiAgICBjcmVhdGVCYXNlRWFjaCA9IHJlcXVpcmUoJy4vY3JlYXRlQmFzZUVhY2gnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JFYWNoYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKi9cbnZhciBiYXNlRWFjaCA9IGNyZWF0ZUJhc2VFYWNoKGJhc2VGb3JPd24pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VFYWNoO1xuIiwidmFyIGJhc2VFYWNoID0gcmVxdWlyZSgnLi9iYXNlRWFjaCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZpbHRlcmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZpbHRlcmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBiYXNlRmlsdGVyKGNvbGxlY3Rpb24sIHByZWRpY2F0ZSkge1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGJhc2VFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgIGlmIChwcmVkaWNhdGUodmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSkge1xuICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZpbHRlcjtcbiIsInZhciBhcnJheVB1c2ggPSByZXF1aXJlKCcuL2FycmF5UHVzaCcpLFxuICAgIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZsYXR0ZW5gIHdpdGggYWRkZWQgc3VwcG9ydCBmb3IgcmVzdHJpY3RpbmdcbiAqIGZsYXR0ZW5pbmcgYW5kIHNwZWNpZnlpbmcgdGhlIHN0YXJ0IGluZGV4LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgZmxhdHRlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzU3RyaWN0XSBSZXN0cmljdCBmbGF0dGVuaW5nIHRvIGFycmF5cy1saWtlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbcmVzdWx0PVtdXSBUaGUgaW5pdGlhbCByZXN1bHQgdmFsdWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmbGF0dGVuZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGbGF0dGVuKGFycmF5LCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpIHtcbiAgcmVzdWx0IHx8IChyZXN1bHQgPSBbXSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpICYmXG4gICAgICAgIChpc1N0cmljdCB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc0FyZ3VtZW50cyh2YWx1ZSkpKSB7XG4gICAgICBpZiAoaXNEZWVwKSB7XG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICAgIGJhc2VGbGF0dGVuKHZhbHVlLCBpc0RlZXAsIGlzU3RyaWN0LCByZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXlQdXNoKHJlc3VsdCwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzU3RyaWN0KSB7XG4gICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRmxhdHRlbjtcbiIsInZhciBjcmVhdGVCYXNlRm9yID0gcmVxdWlyZSgnLi9jcmVhdGVCYXNlRm9yJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGJhc2VGb3JJbmAgYW5kIGBiYXNlRm9yT3duYCB3aGljaCBpdGVyYXRlc1xuICogb3ZlciBgb2JqZWN0YCBwcm9wZXJ0aWVzIHJldHVybmVkIGJ5IGBrZXlzRnVuY2AgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3JcbiAqIGVhY2ggcHJvcGVydHkuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseVxuICogcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtGdW5jdGlvbn0ga2V5c0Z1bmMgVGhlIGZ1bmN0aW9uIHRvIGdldCB0aGUga2V5cyBvZiBgb2JqZWN0YC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbnZhciBiYXNlRm9yID0gY3JlYXRlQmFzZUZvcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3I7XG4iLCJ2YXIgYmFzZUZvciA9IHJlcXVpcmUoJy4vYmFzZUZvcicpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzSW4nKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JJbmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvckluKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgcmV0dXJuIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5c0luKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9ySW47XG4iLCJ2YXIgYmFzZUZvciA9IHJlcXVpcmUoJy4vYmFzZUZvcicpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvck93bmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBiYXNlRm9yKG9iamVjdCwgaXRlcmF0ZWUsIGtleXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3JPd247XG4iLCJ2YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldGAgd2l0aG91dCBzdXBwb3J0IGZvciBzdHJpbmcgcGF0aHNcbiAqIGFuZCBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheX0gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXRoS2V5XSBUaGUga2V5IHJlcHJlc2VudGF0aW9uIG9mIHBhdGguXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcmVzb2x2ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGJhc2VHZXQob2JqZWN0LCBwYXRoLCBwYXRoS2V5KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAocGF0aEtleSAhPT0gdW5kZWZpbmVkICYmIHBhdGhLZXkgaW4gdG9PYmplY3Qob2JqZWN0KSkge1xuICAgIHBhdGggPSBbcGF0aEtleV07XG4gIH1cbiAgdmFyIGluZGV4ID0gMCxcbiAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuXG4gIHdoaWxlIChvYmplY3QgIT0gbnVsbCAmJiBpbmRleCA8IGxlbmd0aCkge1xuICAgIG9iamVjdCA9IG9iamVjdFtwYXRoW2luZGV4KytdXTtcbiAgfVxuICByZXR1cm4gKGluZGV4ICYmIGluZGV4ID09IGxlbmd0aCkgPyBvYmplY3QgOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUdldDtcbiIsInZhciBpbmRleE9mTmFOID0gcmVxdWlyZSgnLi9pbmRleE9mTmFOJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaW5kZXhPZmAgd2l0aG91dCBzdXBwb3J0IGZvciBiaW5hcnkgc2VhcmNoZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHBhcmFtIHtudW1iZXJ9IGZyb21JbmRleCBUaGUgaW5kZXggdG8gc2VhcmNoIGZyb20uXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBiYXNlSW5kZXhPZihhcnJheSwgdmFsdWUsIGZyb21JbmRleCkge1xuICBpZiAodmFsdWUgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIGluZGV4T2ZOYU4oYXJyYXksIGZyb21JbmRleCk7XG4gIH1cbiAgdmFyIGluZGV4ID0gZnJvbUluZGV4IC0gMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGlmIChhcnJheVtpbmRleF0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSW5kZXhPZjtcbiIsInZhciBiYXNlSXNFcXVhbERlZXAgPSByZXF1aXJlKCcuL2Jhc2VJc0VxdWFsRGVlcCcpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNFcXVhbGAgd2l0aG91dCBzdXBwb3J0IGZvciBgdGhpc2AgYmluZGluZ1xuICogYGN1c3RvbWl6ZXJgIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgdmFsdWVzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0JdIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzRXF1YWwodmFsdWUsIG90aGVyLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICBpZiAodmFsdWUgPT09IG90aGVyKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwgfHwgb3RoZXIgPT0gbnVsbCB8fCAoIWlzT2JqZWN0KHZhbHVlKSAmJiAhaXNPYmplY3RMaWtlKG90aGVyKSkpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IHZhbHVlICYmIG90aGVyICE9PSBvdGhlcjtcbiAgfVxuICByZXR1cm4gYmFzZUlzRXF1YWxEZWVwKHZhbHVlLCBvdGhlciwgYmFzZUlzRXF1YWwsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSXNFcXVhbDtcbiIsInZhciBlcXVhbEFycmF5cyA9IHJlcXVpcmUoJy4vZXF1YWxBcnJheXMnKSxcbiAgICBlcXVhbEJ5VGFnID0gcmVxdWlyZSgnLi9lcXVhbEJ5VGFnJyksXG4gICAgZXF1YWxPYmplY3RzID0gcmVxdWlyZSgnLi9lcXVhbE9iamVjdHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNUeXBlZEFycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc1R5cGVkQXJyYXknKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxgIGZvciBhcnJheXMgYW5kIG9iamVjdHMgd2hpY2ggcGVyZm9ybXNcbiAqIGRlZXAgY29tcGFyaXNvbnMgYW5kIHRyYWNrcyB0cmF2ZXJzZWQgb2JqZWN0cyBlbmFibGluZyBvYmplY3RzIHdpdGggY2lyY3VsYXJcbiAqIHJlZmVyZW5jZXMgdG8gYmUgY29tcGFyZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyBvYmplY3RzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0I9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0VxdWFsRGVlcChvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBvYmpJc0FyciA9IGlzQXJyYXkob2JqZWN0KSxcbiAgICAgIG90aElzQXJyID0gaXNBcnJheShvdGhlciksXG4gICAgICBvYmpUYWcgPSBhcnJheVRhZyxcbiAgICAgIG90aFRhZyA9IGFycmF5VGFnO1xuXG4gIGlmICghb2JqSXNBcnIpIHtcbiAgICBvYmpUYWcgPSBvYmpUb1N0cmluZy5jYWxsKG9iamVjdCk7XG4gICAgaWYgKG9ialRhZyA9PSBhcmdzVGFnKSB7XG4gICAgICBvYmpUYWcgPSBvYmplY3RUYWc7XG4gICAgfSBlbHNlIGlmIChvYmpUYWcgIT0gb2JqZWN0VGFnKSB7XG4gICAgICBvYmpJc0FyciA9IGlzVHlwZWRBcnJheShvYmplY3QpO1xuICAgIH1cbiAgfVxuICBpZiAoIW90aElzQXJyKSB7XG4gICAgb3RoVGFnID0gb2JqVG9TdHJpbmcuY2FsbChvdGhlcik7XG4gICAgaWYgKG90aFRhZyA9PSBhcmdzVGFnKSB7XG4gICAgICBvdGhUYWcgPSBvYmplY3RUYWc7XG4gICAgfSBlbHNlIGlmIChvdGhUYWcgIT0gb2JqZWN0VGFnKSB7XG4gICAgICBvdGhJc0FyciA9IGlzVHlwZWRBcnJheShvdGhlcik7XG4gICAgfVxuICB9XG4gIHZhciBvYmpJc09iaiA9IG9ialRhZyA9PSBvYmplY3RUYWcsXG4gICAgICBvdGhJc09iaiA9IG90aFRhZyA9PSBvYmplY3RUYWcsXG4gICAgICBpc1NhbWVUYWcgPSBvYmpUYWcgPT0gb3RoVGFnO1xuXG4gIGlmIChpc1NhbWVUYWcgJiYgIShvYmpJc0FyciB8fCBvYmpJc09iaikpIHtcbiAgICByZXR1cm4gZXF1YWxCeVRhZyhvYmplY3QsIG90aGVyLCBvYmpUYWcpO1xuICB9XG4gIGlmICghaXNMb29zZSkge1xuICAgIHZhciBvYmpJc1dyYXBwZWQgPSBvYmpJc09iaiAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ19fd3JhcHBlZF9fJyksXG4gICAgICAgIG90aElzV3JhcHBlZCA9IG90aElzT2JqICYmIGhhc093blByb3BlcnR5LmNhbGwob3RoZXIsICdfX3dyYXBwZWRfXycpO1xuXG4gICAgaWYgKG9iaklzV3JhcHBlZCB8fCBvdGhJc1dyYXBwZWQpIHtcbiAgICAgIHJldHVybiBlcXVhbEZ1bmMob2JqSXNXcmFwcGVkID8gb2JqZWN0LnZhbHVlKCkgOiBvYmplY3QsIG90aElzV3JhcHBlZCA/IG90aGVyLnZhbHVlKCkgOiBvdGhlciwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xuICAgIH1cbiAgfVxuICBpZiAoIWlzU2FtZVRhZykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBBc3N1bWUgY3ljbGljIHZhbHVlcyBhcmUgZXF1YWwuXG4gIC8vIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGRldGVjdGluZyBjaXJjdWxhciByZWZlcmVuY2VzIHNlZSBodHRwczovL2VzNS5naXRodWIuaW8vI0pPLlxuICBzdGFja0EgfHwgKHN0YWNrQSA9IFtdKTtcbiAgc3RhY2tCIHx8IChzdGFja0IgPSBbXSk7XG5cbiAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIGlmIChzdGFja0FbbGVuZ3RoXSA9PSBvYmplY3QpIHtcbiAgICAgIHJldHVybiBzdGFja0JbbGVuZ3RoXSA9PSBvdGhlcjtcbiAgICB9XG4gIH1cbiAgLy8gQWRkIGBvYmplY3RgIGFuZCBgb3RoZXJgIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgc3RhY2tBLnB1c2gob2JqZWN0KTtcbiAgc3RhY2tCLnB1c2gob3RoZXIpO1xuXG4gIHZhciByZXN1bHQgPSAob2JqSXNBcnIgPyBlcXVhbEFycmF5cyA6IGVxdWFsT2JqZWN0cykob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG5cbiAgc3RhY2tBLnBvcCgpO1xuICBzdGFja0IucG9wKCk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSXNFcXVhbERlZXA7XG4iLCJ2YXIgYmFzZUlzRXF1YWwgPSByZXF1aXJlKCcuL2Jhc2VJc0VxdWFsJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNNYXRjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtBcnJheX0gbWF0Y2hEYXRhIFRoZSBwcm9wZXJ5IG5hbWVzLCB2YWx1ZXMsIGFuZCBjb21wYXJlIGZsYWdzIHRvIG1hdGNoLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYG9iamVjdGAgaXMgYSBtYXRjaCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNNYXRjaChvYmplY3QsIG1hdGNoRGF0YSwgY3VzdG9taXplcikge1xuICB2YXIgaW5kZXggPSBtYXRjaERhdGEubGVuZ3RoLFxuICAgICAgbGVuZ3RoID0gaW5kZXgsXG4gICAgICBub0N1c3RvbWl6ZXIgPSAhY3VzdG9taXplcjtcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gIWxlbmd0aDtcbiAgfVxuICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIHZhciBkYXRhID0gbWF0Y2hEYXRhW2luZGV4XTtcbiAgICBpZiAoKG5vQ3VzdG9taXplciAmJiBkYXRhWzJdKVxuICAgICAgICAgID8gZGF0YVsxXSAhPT0gb2JqZWN0W2RhdGFbMF1dXG4gICAgICAgICAgOiAhKGRhdGFbMF0gaW4gb2JqZWN0KVxuICAgICAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBkYXRhID0gbWF0Y2hEYXRhW2luZGV4XTtcbiAgICB2YXIga2V5ID0gZGF0YVswXSxcbiAgICAgICAgb2JqVmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgc3JjVmFsdWUgPSBkYXRhWzFdO1xuXG4gICAgaWYgKG5vQ3VzdG9taXplciAmJiBkYXRhWzJdKSB7XG4gICAgICBpZiAob2JqVmFsdWUgPT09IHVuZGVmaW5lZCAmJiAhKGtleSBpbiBvYmplY3QpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHJlc3VsdCA9IGN1c3RvbWl6ZXIgPyBjdXN0b21pemVyKG9ialZhbHVlLCBzcmNWYWx1ZSwga2V5KSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmICghKHJlc3VsdCA9PT0gdW5kZWZpbmVkID8gYmFzZUlzRXF1YWwoc3JjVmFsdWUsIG9ialZhbHVlLCBjdXN0b21pemVyLCB0cnVlKSA6IHJlc3VsdCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlSXNNYXRjaDtcbiIsInZhciBiYXNlRWFjaCA9IHJlcXVpcmUoJy4vYmFzZUVhY2gnKSxcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5tYXBgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICogYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYmFzZU1hcChjb2xsZWN0aW9uLCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IGlzQXJyYXlMaWtlKGNvbGxlY3Rpb24pID8gQXJyYXkoY29sbGVjdGlvbi5sZW5ndGgpIDogW107XG5cbiAgYmFzZUVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbGVjdGlvbikge1xuICAgIHJlc3VsdFsrK2luZGV4XSA9IGl0ZXJhdGVlKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWFwO1xuIiwidmFyIGJhc2VJc01hdGNoID0gcmVxdWlyZSgnLi9iYXNlSXNNYXRjaCcpLFxuICAgIGdldE1hdGNoRGF0YSA9IHJlcXVpcmUoJy4vZ2V0TWF0Y2hEYXRhJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWF0Y2hlc2Agd2hpY2ggZG9lcyBub3QgY2xvbmUgYHNvdXJjZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIG9iamVjdCBvZiBwcm9wZXJ0eSB2YWx1ZXMgdG8gbWF0Y2guXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZU1hdGNoZXMoc291cmNlKSB7XG4gIHZhciBtYXRjaERhdGEgPSBnZXRNYXRjaERhdGEoc291cmNlKTtcbiAgaWYgKG1hdGNoRGF0YS5sZW5ndGggPT0gMSAmJiBtYXRjaERhdGFbMF1bMl0pIHtcbiAgICB2YXIga2V5ID0gbWF0Y2hEYXRhWzBdWzBdLFxuICAgICAgICB2YWx1ZSA9IG1hdGNoRGF0YVswXVsxXTtcblxuICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqZWN0W2tleV0gPT09IHZhbHVlICYmICh2YWx1ZSAhPT0gdW5kZWZpbmVkIHx8IChrZXkgaW4gdG9PYmplY3Qob2JqZWN0KSkpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBiYXNlSXNNYXRjaChvYmplY3QsIG1hdGNoRGF0YSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZU1hdGNoZXM7XG4iLCJ2YXIgYmFzZUdldCA9IHJlcXVpcmUoJy4vYmFzZUdldCcpLFxuICAgIGJhc2VJc0VxdWFsID0gcmVxdWlyZSgnLi9iYXNlSXNFcXVhbCcpLFxuICAgIGJhc2VTbGljZSA9IHJlcXVpcmUoJy4vYmFzZVNsaWNlJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzS2V5ID0gcmVxdWlyZSgnLi9pc0tleScpLFxuICAgIGlzU3RyaWN0Q29tcGFyYWJsZSA9IHJlcXVpcmUoJy4vaXNTdHJpY3RDb21wYXJhYmxlJyksXG4gICAgbGFzdCA9IHJlcXVpcmUoJy4uL2FycmF5L2xhc3QnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKSxcbiAgICB0b1BhdGggPSByZXF1aXJlKCcuL3RvUGF0aCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1hdGNoZXNQcm9wZXJ0eWAgd2hpY2ggZG9lcyBub3QgY2xvbmUgYHNyY1ZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEBwYXJhbSB7Kn0gc3JjVmFsdWUgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZU1hdGNoZXNQcm9wZXJ0eShwYXRoLCBzcmNWYWx1ZSkge1xuICB2YXIgaXNBcnIgPSBpc0FycmF5KHBhdGgpLFxuICAgICAgaXNDb21tb24gPSBpc0tleShwYXRoKSAmJiBpc1N0cmljdENvbXBhcmFibGUoc3JjVmFsdWUpLFxuICAgICAgcGF0aEtleSA9IChwYXRoICsgJycpO1xuXG4gIHBhdGggPSB0b1BhdGgocGF0aCk7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGtleSA9IHBhdGhLZXk7XG4gICAgb2JqZWN0ID0gdG9PYmplY3Qob2JqZWN0KTtcbiAgICBpZiAoKGlzQXJyIHx8ICFpc0NvbW1vbikgJiYgIShrZXkgaW4gb2JqZWN0KSkge1xuICAgICAgb2JqZWN0ID0gcGF0aC5sZW5ndGggPT0gMSA/IG9iamVjdCA6IGJhc2VHZXQob2JqZWN0LCBiYXNlU2xpY2UocGF0aCwgMCwgLTEpKTtcbiAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBrZXkgPSBsYXN0KHBhdGgpO1xuICAgICAgb2JqZWN0ID0gdG9PYmplY3Qob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFtrZXldID09PSBzcmNWYWx1ZVxuICAgICAgPyAoc3JjVmFsdWUgIT09IHVuZGVmaW5lZCB8fCAoa2V5IGluIG9iamVjdCkpXG4gICAgICA6IGJhc2VJc0VxdWFsKHNyY1ZhbHVlLCBvYmplY3Rba2V5XSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWF0Y2hlc1Byb3BlcnR5O1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlUHJvcGVydHk7XG4iLCJ2YXIgYmFzZUdldCA9IHJlcXVpcmUoJy4vYmFzZUdldCcpLFxuICAgIHRvUGF0aCA9IHJlcXVpcmUoJy4vdG9QYXRoJyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlUHJvcGVydHlgIHdoaWNoIHN1cHBvcnRzIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVByb3BlcnR5RGVlcChwYXRoKSB7XG4gIHZhciBwYXRoS2V5ID0gKHBhdGggKyAnJyk7XG4gIHBhdGggPSB0b1BhdGgocGF0aCk7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gYmFzZUdldChvYmplY3QsIHBhdGgsIHBhdGhLZXkpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VQcm9wZXJ0eURlZXA7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnNsaWNlYCB3aXRob3V0IGFuIGl0ZXJhdGVlIGNhbGwgZ3VhcmQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzbGljZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9MF0gVGhlIHN0YXJ0IHBvc2l0aW9uLlxuICogQHBhcmFtIHtudW1iZXJ9IFtlbmQ9YXJyYXkubGVuZ3RoXSBUaGUgZW5kIHBvc2l0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBzbGljZSBvZiBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBiYXNlU2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgc3RhcnQgPSBzdGFydCA9PSBudWxsID8gMCA6ICgrc3RhcnQgfHwgMCk7XG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IC1zdGFydCA+IGxlbmd0aCA/IDAgOiAobGVuZ3RoICsgc3RhcnQpO1xuICB9XG4gIGVuZCA9IChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiBsZW5ndGgpID8gbGVuZ3RoIDogKCtlbmQgfHwgMCk7XG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlbmd0aDtcbiAgfVxuICBsZW5ndGggPSBzdGFydCA+IGVuZCA/IDAgOiAoKGVuZCAtIHN0YXJ0KSA+Pj4gMCk7XG4gIHN0YXJ0ID4+Pj0gMDtcblxuICB2YXIgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gYXJyYXlbaW5kZXggKyBzdGFydF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlU2xpY2U7XG4iLCIvKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgaWYgaXQncyBub3Qgb25lLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWRcbiAqIGZvciBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBiYXNlVG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6ICh2YWx1ZSArICcnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVG9TdHJpbmc7XG4iLCJ2YXIgaWRlbnRpdHkgPSByZXF1aXJlKCcuLi91dGlsaXR5L2lkZW50aXR5Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlQ2FsbGJhY2tgIHdoaWNoIG9ubHkgc3VwcG9ydHMgYHRoaXNgIGJpbmRpbmdcbiAqIGFuZCBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICogQHBhcmFtIHsqfSB0aGlzQXJnIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY2FsbGJhY2suXG4gKi9cbmZ1bmN0aW9uIGJpbmRDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBpZGVudGl0eTtcbiAgfVxuICBpZiAodGhpc0FyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgc3dpdGNoIChhcmdDb3VudCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSkge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgb3RoZXIsIGtleSwgb2JqZWN0LCBzb3VyY2UpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZENhbGxiYWNrO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGluIGBjYWNoZWAgbWltaWNraW5nIHRoZSByZXR1cm4gc2lnbmF0dXJlIG9mXG4gKiBgXy5pbmRleE9mYCBieSByZXR1cm5pbmcgYDBgIGlmIHRoZSB2YWx1ZSBpcyBmb3VuZCwgZWxzZSBgLTFgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gY2FjaGUgVGhlIGNhY2hlIHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNlYXJjaCBmb3IuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIGAwYCBpZiBgdmFsdWVgIGlzIGZvdW5kLCBlbHNlIGAtMWAuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlSW5kZXhPZihjYWNoZSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSBjYWNoZS5kYXRhLFxuICAgICAgcmVzdWx0ID0gKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCBpc09iamVjdCh2YWx1ZSkpID8gZGF0YS5zZXQuaGFzKHZhbHVlKSA6IGRhdGEuaGFzaFt2YWx1ZV07XG5cbiAgcmV0dXJuIHJlc3VsdCA/IDAgOiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYWNoZUluZGV4T2Y7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQWRkcyBgdmFsdWVgIHRvIHRoZSBjYWNoZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgcHVzaFxuICogQG1lbWJlck9mIFNldENhY2hlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVQdXNoKHZhbHVlKSB7XG4gIHZhciBkYXRhID0gdGhpcy5kYXRhO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnIHx8IGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIGRhdGEuc2V0LmFkZCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZGF0YS5oYXNoW3ZhbHVlXSA9IHRydWU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYWNoZVB1c2g7XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYGJhc2VFYWNoYCBvciBgYmFzZUVhY2hSaWdodGAgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRWFjaChlYWNoRnVuYywgZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBpdGVyYXRlZSkge1xuICAgIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uID8gZ2V0TGVuZ3RoKGNvbGxlY3Rpb24pIDogMDtcbiAgICBpZiAoIWlzTGVuZ3RoKGxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBlYWNoRnVuYyhjb2xsZWN0aW9uLCBpdGVyYXRlZSk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IGZyb21SaWdodCA/IGxlbmd0aCA6IC0xLFxuICAgICAgICBpdGVyYWJsZSA9IHRvT2JqZWN0KGNvbGxlY3Rpb24pO1xuXG4gICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgIGlmIChpdGVyYXRlZShpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRWFjaDtcbiIsInZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYmFzZSBmdW5jdGlvbiBmb3IgYF8uZm9ySW5gIG9yIGBfLmZvckluUmlnaHRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VGb3IoZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzRnVuYykge1xuICAgIHZhciBpdGVyYWJsZSA9IHRvT2JqZWN0KG9iamVjdCksXG4gICAgICAgIHByb3BzID0ga2V5c0Z1bmMob2JqZWN0KSxcbiAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgICBpbmRleCA9IGZyb21SaWdodCA/IGxlbmd0aCA6IC0xO1xuXG4gICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVba2V5XSwga2V5LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUJhc2VGb3I7XG4iLCJ2YXIgU2V0Q2FjaGUgPSByZXF1aXJlKCcuL1NldENhY2hlJyksXG4gICAgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9nZXROYXRpdmUnKTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBTZXQgPSBnZXROYXRpdmUoZ2xvYmFsLCAnU2V0Jyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgU2V0YCBjYWNoZSBvYmplY3QgdG8gb3B0aW1pemUgbGluZWFyIHNlYXJjaGVzIG9mIGxhcmdlIGFycmF5cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAqIEByZXR1cm5zIHtudWxsfE9iamVjdH0gUmV0dXJucyB0aGUgbmV3IGNhY2hlIG9iamVjdCBpZiBgU2V0YCBpcyBzdXBwb3J0ZWQsIGVsc2UgYG51bGxgLlxuICovXG5mdW5jdGlvbiBjcmVhdGVDYWNoZSh2YWx1ZXMpIHtcbiAgcmV0dXJuIChuYXRpdmVDcmVhdGUgJiYgU2V0KSA/IG5ldyBTZXRDYWNoZSh2YWx1ZXMpIDogbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVDYWNoZTtcbiIsInZhciBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuL2JpbmRDYWxsYmFjaycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gZm9yIGBfLmZvckVhY2hgIG9yIGBfLmZvckVhY2hSaWdodGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGFycmF5RnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGFuIGFycmF5LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZWFjaEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhIGNvbGxlY3Rpb24uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBlYWNoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVGb3JFYWNoKGFycmF5RnVuYywgZWFjaEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgaXRlcmF0ZWUgPT0gJ2Z1bmN0aW9uJyAmJiB0aGlzQXJnID09PSB1bmRlZmluZWQgJiYgaXNBcnJheShjb2xsZWN0aW9uKSlcbiAgICAgID8gYXJyYXlGdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKVxuICAgICAgOiBlYWNoRnVuYyhjb2xsZWN0aW9uLCBiaW5kQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVGb3JFYWNoO1xuIiwidmFyIGJhc2VDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmFzZUNhbGxiYWNrJyksXG4gICAgYmFzZUZvck93biA9IHJlcXVpcmUoJy4vYmFzZUZvck93bicpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiBmb3IgYF8ubWFwS2V5c2Agb3IgYF8ubWFwVmFsdWVzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtib29sZWFufSBbaXNNYXBLZXlzXSBTcGVjaWZ5IG1hcHBpbmcga2V5cyBpbnN0ZWFkIG9mIHZhbHVlcy5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IG1hcCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlT2JqZWN0TWFwcGVyKGlzTWFwS2V5cykge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBpdGVyYXRlZSwgdGhpc0FyZykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBpdGVyYXRlZSA9IGJhc2VDYWxsYmFjayhpdGVyYXRlZSwgdGhpc0FyZywgMyk7XG5cbiAgICBiYXNlRm9yT3duKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgICB2YXIgbWFwcGVkID0gaXRlcmF0ZWUodmFsdWUsIGtleSwgb2JqZWN0KTtcbiAgICAgIGtleSA9IGlzTWFwS2V5cyA/IG1hcHBlZCA6IGtleTtcbiAgICAgIHZhbHVlID0gaXNNYXBLZXlzID8gdmFsdWUgOiBtYXBwZWQ7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlT2JqZWN0TWFwcGVyO1xuIiwidmFyIGFycmF5U29tZSA9IHJlcXVpcmUoJy4vYXJyYXlTb21lJyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBhcnJheXMgd2l0aCBzdXBwb3J0IGZvclxuICogcGFydGlhbCBkZWVwIGNvbXBhcmlzb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7QXJyYXl9IG90aGVyIFRoZSBvdGhlciBhcnJheSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIGFycmF5cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXJyYXlzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsQXJyYXlzKGFycmF5LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGFyckxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIG90aExlbmd0aCA9IG90aGVyLmxlbmd0aDtcblxuICBpZiAoYXJyTGVuZ3RoICE9IG90aExlbmd0aCAmJiAhKGlzTG9vc2UgJiYgb3RoTGVuZ3RoID4gYXJyTGVuZ3RoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBJZ25vcmUgbm9uLWluZGV4IHByb3BlcnRpZXMuXG4gIHdoaWxlICgrK2luZGV4IDwgYXJyTGVuZ3RoKSB7XG4gICAgdmFyIGFyclZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICBvdGhWYWx1ZSA9IG90aGVyW2luZGV4XSxcbiAgICAgICAgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIoaXNMb29zZSA/IG90aFZhbHVlIDogYXJyVmFsdWUsIGlzTG9vc2UgPyBhcnJWYWx1ZSA6IG90aFZhbHVlLCBpbmRleCkgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgaWYgKGlzTG9vc2UpIHtcbiAgICAgIGlmICghYXJyYXlTb21lKG90aGVyLCBmdW5jdGlvbihvdGhWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fCBlcXVhbEZ1bmMoYXJyVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICAgICAgfSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIShhcnJWYWx1ZSA9PT0gb3RoVmFsdWUgfHwgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbEFycmF5cztcbiIsIi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3IgY29tcGFyaW5nIG9iamVjdHMgb2ZcbiAqIHRoZSBzYW1lIGB0b1N0cmluZ1RhZ2AuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gb25seSBzdXBwb3J0cyBjb21wYXJpbmcgdmFsdWVzIHdpdGggdGFncyBvZlxuICogYEJvb2xlYW5gLCBgRGF0ZWAsIGBFcnJvcmAsIGBOdW1iZXJgLCBgUmVnRXhwYCwgb3IgYFN0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGB0b1N0cmluZ1RhZ2Agb2YgdGhlIG9iamVjdHMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIHRhZykge1xuICBzd2l0Y2ggKHRhZykge1xuICAgIGNhc2UgYm9vbFRhZzpcbiAgICBjYXNlIGRhdGVUYWc6XG4gICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmQgYm9vbGVhbnNcbiAgICAgIC8vIHRvIGAxYCBvciBgMGAgdHJlYXRpbmcgaW52YWxpZCBkYXRlcyBjb2VyY2VkIHRvIGBOYU5gIGFzIG5vdCBlcXVhbC5cbiAgICAgIHJldHVybiArb2JqZWN0ID09ICtvdGhlcjtcblxuICAgIGNhc2UgZXJyb3JUYWc6XG4gICAgICByZXR1cm4gb2JqZWN0Lm5hbWUgPT0gb3RoZXIubmFtZSAmJiBvYmplY3QubWVzc2FnZSA9PSBvdGhlci5tZXNzYWdlO1xuXG4gICAgY2FzZSBudW1iZXJUYWc6XG4gICAgICAvLyBUcmVhdCBgTmFOYCB2cy4gYE5hTmAgYXMgZXF1YWwuXG4gICAgICByZXR1cm4gKG9iamVjdCAhPSArb2JqZWN0KVxuICAgICAgICA/IG90aGVyICE9ICtvdGhlclxuICAgICAgICA6IG9iamVjdCA9PSArb3RoZXI7XG5cbiAgICBjYXNlIHJlZ2V4cFRhZzpcbiAgICBjYXNlIHN0cmluZ1RhZzpcbiAgICAgIC8vIENvZXJjZSByZWdleGVzIHRvIHN0cmluZ3MgYW5kIHRyZWF0IHN0cmluZ3MgcHJpbWl0aXZlcyBhbmQgc3RyaW5nXG4gICAgICAvLyBvYmplY3RzIGFzIGVxdWFsLiBTZWUgaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMTAuNi40IGZvciBtb3JlIGRldGFpbHMuXG4gICAgICByZXR1cm4gb2JqZWN0ID09IChvdGhlciArICcnKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXF1YWxCeVRhZztcbiIsInZhciBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBvYmplY3RzIHdpdGggc3VwcG9ydCBmb3JcbiAqIHBhcnRpYWwgZGVlcCBjb21wYXJpc29ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbE9iamVjdHMob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgb2JqUHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICBvYmpMZW5ndGggPSBvYmpQcm9wcy5sZW5ndGgsXG4gICAgICBvdGhQcm9wcyA9IGtleXMob3RoZXIpLFxuICAgICAgb3RoTGVuZ3RoID0gb3RoUHJvcHMubGVuZ3RoO1xuXG4gIGlmIChvYmpMZW5ndGggIT0gb3RoTGVuZ3RoICYmICFpc0xvb3NlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBpbmRleCA9IG9iakxlbmd0aDtcbiAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICB2YXIga2V5ID0gb2JqUHJvcHNbaW5kZXhdO1xuICAgIGlmICghKGlzTG9vc2UgPyBrZXkgaW4gb3RoZXIgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG90aGVyLCBrZXkpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICB2YXIgc2tpcEN0b3IgPSBpc0xvb3NlO1xuICB3aGlsZSAoKytpbmRleCA8IG9iakxlbmd0aCkge1xuICAgIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICB2YXIgb2JqVmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltrZXldLFxuICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcihpc0xvb3NlID8gb3RoVmFsdWUgOiBvYmpWYWx1ZSwgaXNMb29zZT8gb2JqVmFsdWUgOiBvdGhWYWx1ZSwga2V5KSA6IHVuZGVmaW5lZDtcblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIGlmICghKHJlc3VsdCA9PT0gdW5kZWZpbmVkID8gZXF1YWxGdW5jKG9ialZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIDogcmVzdWx0KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBza2lwQ3RvciB8fCAoc2tpcEN0b3IgPSBrZXkgPT0gJ2NvbnN0cnVjdG9yJyk7XG4gIH1cbiAgaWYgKCFza2lwQ3Rvcikge1xuICAgIHZhciBvYmpDdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICBvdGhDdG9yID0gb3RoZXIuY29uc3RydWN0b3I7XG5cbiAgICAvLyBOb24gYE9iamVjdGAgb2JqZWN0IGluc3RhbmNlcyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVhbC5cbiAgICBpZiAob2JqQ3RvciAhPSBvdGhDdG9yICYmXG4gICAgICAgICgnY29uc3RydWN0b3InIGluIG9iamVjdCAmJiAnY29uc3RydWN0b3InIGluIG90aGVyKSAmJlxuICAgICAgICAhKHR5cGVvZiBvYmpDdG9yID09ICdmdW5jdGlvbicgJiYgb2JqQ3RvciBpbnN0YW5jZW9mIG9iakN0b3IgJiZcbiAgICAgICAgICB0eXBlb2Ygb3RoQ3RvciA9PSAnZnVuY3Rpb24nICYmIG90aEN0b3IgaW5zdGFuY2VvZiBvdGhDdG9yKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbE9iamVjdHM7XG4iLCJ2YXIgYmFzZVByb3BlcnR5ID0gcmVxdWlyZSgnLi9iYXNlUHJvcGVydHknKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRMZW5ndGg7XG4iLCJ2YXIgaXNTdHJpY3RDb21wYXJhYmxlID0gcmVxdWlyZSgnLi9pc1N0cmljdENvbXBhcmFibGUnKSxcbiAgICBwYWlycyA9IHJlcXVpcmUoJy4uL29iamVjdC9wYWlycycpO1xuXG4vKipcbiAqIEdldHMgdGhlIHByb3BlcnkgbmFtZXMsIHZhbHVlcywgYW5kIGNvbXBhcmUgZmxhZ3Mgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbWF0Y2ggZGF0YSBvZiBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gZ2V0TWF0Y2hEYXRhKG9iamVjdCkge1xuICB2YXIgcmVzdWx0ID0gcGFpcnMob2JqZWN0KSxcbiAgICAgIGxlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG5cbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgcmVzdWx0W2xlbmd0aF1bMl0gPSBpc1N0cmljdENvbXBhcmFibGUocmVzdWx0W2xlbmd0aF1bMV0pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TWF0Y2hEYXRhO1xuIiwidmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnLi4vbGFuZy9pc05hdGl2ZScpO1xuXG4vKipcbiAqIEdldHMgdGhlIG5hdGl2ZSBmdW5jdGlvbiBhdCBga2V5YCBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBtZXRob2QgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZ1bmN0aW9uIGlmIGl0J3MgbmF0aXZlLCBlbHNlIGB1bmRlZmluZWRgLlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmUob2JqZWN0LCBrZXkpIHtcbiAgdmFyIHZhbHVlID0gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgcmV0dXJuIGlzTmF0aXZlKHZhbHVlKSA/IHZhbHVlIDogdW5kZWZpbmVkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE5hdGl2ZTtcbiIsIi8qKlxuICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYE5hTmAgaXMgZm91bmQgaW4gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCBgTmFOYCwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgsIGZyb21SaWdodCkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgaW5kZXggPSBmcm9tSW5kZXggKyAoZnJvbVJpZ2h0ID8gMCA6IC0xKTtcblxuICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgIHZhciBvdGhlciA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAob3RoZXIgIT09IG90aGVyKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbmRleE9mTmFOO1xuIiwidmFyIGdldExlbmd0aCA9IHJlcXVpcmUoJy4vZ2V0TGVuZ3RoJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIGlzTGVuZ3RoKGdldExlbmd0aCh2YWx1ZSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXlMaWtlO1xuIiwiLyoqIFVzZWQgdG8gZGV0ZWN0IHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLiAqL1xudmFyIHJlSXNVaW50ID0gL15cXGQrJC87XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgW21heGltdW0gbGVuZ3RoXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1udW1iZXIubWF4X3NhZmVfaW50ZWdlcilcbiAqIG9mIGFuIGFycmF5LWxpa2UgdmFsdWUuXG4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgaW5kZXguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGg9TUFYX1NBRkVfSU5URUdFUl0gVGhlIHVwcGVyIGJvdW5kcyBvZiBhIHZhbGlkIGluZGV4LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0luZGV4KHZhbHVlLCBsZW5ndGgpIHtcbiAgdmFsdWUgPSAodHlwZW9mIHZhbHVlID09ICdudW1iZXInIHx8IHJlSXNVaW50LnRlc3QodmFsdWUpKSA/ICt2YWx1ZSA6IC0xO1xuICBsZW5ndGggPSBsZW5ndGggPT0gbnVsbCA/IE1BWF9TQUZFX0lOVEVHRVIgOiBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzSW5kZXg7XG4iLCJ2YXIgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVJc0RlZXBQcm9wID0gL1xcLnxcXFsoPzpbXltcXF1dKnwoW1wiJ10pKD86KD8hXFwxKVteXFxuXFxcXF18XFxcXC4pKj9cXDEpXFxdLyxcbiAgICByZUlzUGxhaW5Qcm9wID0gL15cXHcqJC87XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwcm9wZXJ0eSBuYW1lIGFuZCBub3QgYSBwcm9wZXJ0eSBwYXRoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5IGtleXMgb24uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNLZXkodmFsdWUsIG9iamVjdCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKCh0eXBlID09ICdzdHJpbmcnICYmIHJlSXNQbGFpblByb3AudGVzdCh2YWx1ZSkpIHx8IHR5cGUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICFyZUlzRGVlcFByb3AudGVzdCh2YWx1ZSk7XG4gIHJldHVybiByZXN1bHQgfHwgKG9iamVjdCAhPSBudWxsICYmIHZhbHVlIGluIHRvT2JqZWN0KG9iamVjdCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzS2V5O1xuIiwiLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgYmFzZWQgb24gW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0xlbmd0aDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUgZm9yIHN0cmljdCBlcXVhbGl0eSBjb21wYXJpc29ucywgaS5lLiBgPT09YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpZiBzdWl0YWJsZSBmb3Igc3RyaWN0XG4gKiAgZXF1YWxpdHkgY29tcGFyaXNvbnMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNTdHJpY3RDb21wYXJhYmxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gdmFsdWUgJiYgIWlzT2JqZWN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N0cmljdENvbXBhcmFibGU7XG4iLCJ2YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLnBpY2tgIHdoaWNoIHBpY2tzIGBvYmplY3RgIHByb3BlcnRpZXMgc3BlY2lmaWVkXG4gKiBieSBgcHJvcHNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHBpY2suXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBwaWNrQnlBcnJheShvYmplY3QsIHByb3BzKSB7XG4gIG9iamVjdCA9IHRvT2JqZWN0KG9iamVjdCk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICByZXN1bHQgPSB7fTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGlja0J5QXJyYXk7XG4iLCJ2YXIgYmFzZUZvckluID0gcmVxdWlyZSgnLi9iYXNlRm9ySW4nKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ucGlja2Agd2hpY2ggcGlja3MgYG9iamVjdGAgcHJvcGVydGllcyBgcHJlZGljYXRlYFxuICogcmV0dXJucyB0cnV0aHkgZm9yLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBwaWNrQnlDYWxsYmFjayhvYmplY3QsIHByZWRpY2F0ZSkge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIGJhc2VGb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgIGlmIChwcmVkaWNhdGUodmFsdWUsIGtleSwgb2JqZWN0KSkge1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBpY2tCeUNhbGxiYWNrO1xuIiwidmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi9pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBPYmplY3Qua2V5c2Agd2hpY2ggY3JlYXRlcyBhbiBhcnJheSBvZiB0aGVcbiAqIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBzaGltS2V5cyhvYmplY3QpIHtcbiAgdmFyIHByb3BzID0ga2V5c0luKG9iamVjdCksXG4gICAgICBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgIGxlbmd0aCA9IHByb3BzTGVuZ3RoICYmIG9iamVjdC5sZW5ndGg7XG5cbiAgdmFyIGFsbG93SW5kZXhlcyA9ICEhbGVuZ3RoICYmIGlzTGVuZ3RoKGxlbmd0aCkgJiZcbiAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzQXJndW1lbnRzKG9iamVjdCkpO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcmVzdWx0ID0gW107XG5cbiAgd2hpbGUgKCsraW5kZXggPCBwcm9wc0xlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgaWYgKChhbGxvd0luZGV4ZXMgJiYgaXNJbmRleChrZXksIGxlbmd0aCkpIHx8IGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaW1LZXlzO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYW4gb2JqZWN0IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gdG9PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDogT2JqZWN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b09iamVjdDtcbiIsInZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuL2Jhc2VUb1N0cmluZycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggcHJvcGVydHkgbmFtZXMgd2l0aGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlUHJvcE5hbWUgPSAvW14uW1xcXV0rfFxcWyg/OigtP1xcZCsoPzpcXC5cXGQrKT8pfChbXCInXSkoKD86KD8hXFwyKVteXFxuXFxcXF18XFxcXC4pKj8pXFwyKVxcXS9nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBiYWNrc2xhc2hlcyBpbiBwcm9wZXJ0eSBwYXRocy4gKi9cbnZhciByZUVzY2FwZUNoYXIgPSAvXFxcXChcXFxcKT8vZztcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIHByb3BlcnR5IHBhdGggYXJyYXkgaWYgaXQncyBub3Qgb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG5mdW5jdGlvbiB0b1BhdGgodmFsdWUpIHtcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgYmFzZVRvU3RyaW5nKHZhbHVlKS5yZXBsYWNlKHJlUHJvcE5hbWUsIGZ1bmN0aW9uKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdHJpbmcpIHtcbiAgICByZXN1bHQucHVzaChxdW90ZSA/IHN0cmluZy5yZXBsYWNlKHJlRXNjYXBlQ2hhciwgJyQxJykgOiAobnVtYmVyIHx8IG1hdGNoKSk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvUGF0aDtcbiIsInZhciBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpICYmXG4gICAgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpICYmICFwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCAnY2FsbGVlJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcmd1bWVudHM7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0FycmF5ID0gZ2V0TmF0aXZlKEFycmF5LCAnaXNBcnJheScpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFycmF5VGFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaSB3aGljaCByZXR1cm4gJ2Z1bmN0aW9uJyBmb3IgcmVnZXhlc1xuICAvLyBhbmQgU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLlxuICByZXR1cm4gaXNPYmplY3QodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IGZ1bmNUYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBob3N0IGNvbnN0cnVjdG9ycyAoU2FmYXJpID4gNSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xudmFyIHJlSXNOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgZm5Ub1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZywgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc05hdGl2ZShBcnJheS5wcm90b3R5cGUucHVzaCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05hdGl2ZShfKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHJldHVybiByZUlzTmF0aXZlLnRlc3QoZm5Ub1N0cmluZy5jYWxsKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgcmVJc0hvc3RDdG9yLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsInZhciBiYXNlRm9ySW4gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRm9ySW4nKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgdGhhdCBpcywgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlXG4gKiBgT2JqZWN0YCBjb25zdHJ1Y3RvciBvciBvbmUgd2l0aCBhIGBbW1Byb3RvdHlwZV1dYCBvZiBgbnVsbGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGFzc3VtZXMgb2JqZWN0cyBjcmVhdGVkIGJ5IHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3RvclxuICogaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiB9XG4gKlxuICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHZhciBDdG9yO1xuXG4gIC8vIEV4aXQgZWFybHkgZm9yIG5vbiBgT2JqZWN0YCBvYmplY3RzLlxuICBpZiAoIShpc09iamVjdExpa2UodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdFRhZyAmJiAhaXNBcmd1bWVudHModmFsdWUpKSB8fFxuICAgICAgKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY29uc3RydWN0b3InKSAmJiAoQ3RvciA9IHZhbHVlLmNvbnN0cnVjdG9yLCB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmICEoQ3RvciBpbnN0YW5jZW9mIEN0b3IpKSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gSUUgPCA5IGl0ZXJhdGVzIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGJlZm9yZSBvd24gcHJvcGVydGllcy4gSWYgdGhlIGZpcnN0XG4gIC8vIGl0ZXJhdGVkIHByb3BlcnR5IGlzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWRcbiAgLy8gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICB2YXIgcmVzdWx0O1xuICAvLyBJbiBtb3N0IGVudmlyb25tZW50cyBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcyBhcmUgaXRlcmF0ZWQgYmVmb3JlXG4gIC8vIGl0cyBpbmhlcml0ZWQgcHJvcGVydGllcy4gSWYgdGhlIGxhc3QgaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3NcbiAgLy8gb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gIGJhc2VGb3JJbih2YWx1ZSwgZnVuY3Rpb24oc3ViVmFsdWUsIGtleSkge1xuICAgIHJlc3VsdCA9IGtleTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQgPT09IHVuZGVmaW5lZCB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCByZXN1bHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUGxhaW5PYmplY3Q7XG4iLCJ2YXIgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIG1hcFRhZyA9ICdbb2JqZWN0IE1hcF0nLFxuICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHNldFRhZyA9ICdbb2JqZWN0IFNldF0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nLFxuICAgIHdlYWtNYXBUYWcgPSAnW29iamVjdCBXZWFrTWFwXSc7XG5cbnZhciBhcnJheUJ1ZmZlclRhZyA9ICdbb2JqZWN0IEFycmF5QnVmZmVyXScsXG4gICAgZmxvYXQzMlRhZyA9ICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICBpbnQ4VGFnID0gJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgaW50MTZUYWcgPSAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgdWludDhUYWcgPSAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgdWludDhDbGFtcGVkVGFnID0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgIHVpbnQzMlRhZyA9ICdbb2JqZWN0IFVpbnQzMkFycmF5XSc7XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbnZhciB0eXBlZEFycmF5VGFncyA9IHt9O1xudHlwZWRBcnJheVRhZ3NbZmxvYXQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1tmbG9hdDY0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50OFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDhDbGFtcGVkVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG50eXBlZEFycmF5VGFnc1thcmdzVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2FycmF5VGFnXSA9XG50eXBlZEFycmF5VGFnc1thcnJheUJ1ZmZlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tib29sVGFnXSA9XG50eXBlZEFycmF5VGFnc1tkYXRlVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Vycm9yVGFnXSA9XG50eXBlZEFycmF5VGFnc1tmdW5jVGFnXSA9IHR5cGVkQXJyYXlUYWdzW21hcFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbbnVtYmVyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW29iamVjdFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbcmVnZXhwVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3NldFRhZ10gPVxudHlwZWRBcnJheVRhZ3Nbc3RyaW5nVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3dlYWtNYXBUYWddID0gZmFsc2U7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSB0eXBlZCBhcnJheS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkobmV3IFVpbnQ4QXJyYXkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KFtdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICEhdHlwZWRBcnJheVRhZ3Nbb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZWRBcnJheTtcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKSxcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgc2hpbUtleXMgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9zaGltS2V5cycpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUtleXMgPSBnZXROYXRpdmUoT2JqZWN0LCAna2V5cycpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLiBTZWUgdGhlXG4gKiBbRVMgc3BlY10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LmtleXMpXG4gKiBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXMobmV3IEZvbyk7XG4gKiAvLyA9PiBbJ2EnLCAnYiddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKlxuICogXy5rZXlzKCdoaScpO1xuICogLy8gPT4gWycwJywgJzEnXVxuICovXG52YXIga2V5cyA9ICFuYXRpdmVLZXlzID8gc2hpbUtleXMgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIEN0b3IgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdC5jb25zdHJ1Y3RvcjtcbiAgaWYgKCh0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlID09PSBvYmplY3QpIHx8XG4gICAgICAodHlwZW9mIG9iamVjdCAhPSAnZnVuY3Rpb24nICYmIGlzQXJyYXlMaWtlKG9iamVjdCkpKSB7XG4gICAgcmV0dXJuIHNoaW1LZXlzKG9iamVjdCk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgPyBuYXRpdmVLZXlzKG9iamVjdCkgOiBbXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5cztcbiIsInZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzSW5kZXgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5c0luKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InLCAnYyddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbmZ1bmN0aW9uIGtleXNJbihvYmplY3QpIHtcbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICB9XG4gIHZhciBsZW5ndGggPSBvYmplY3QubGVuZ3RoO1xuICBsZW5ndGggPSAobGVuZ3RoICYmIGlzTGVuZ3RoKGxlbmd0aCkgJiZcbiAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzQXJndW1lbnRzKG9iamVjdCkpICYmIGxlbmd0aCkgfHwgMDtcblxuICB2YXIgQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgIGluZGV4ID0gLTEsXG4gICAgICBpc1Byb3RvID0gdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0LFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKSxcbiAgICAgIHNraXBJbmRleGVzID0gbGVuZ3RoID4gMDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSAoaW5kZXggKyAnJyk7XG4gIH1cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgIGlmICghKHNraXBJbmRleGVzICYmIGlzSW5kZXgoa2V5LCBsZW5ndGgpKSAmJlxuICAgICAgICAhKGtleSA9PSAnY29uc3RydWN0b3InICYmIChpc1Byb3RvIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNJbjtcbiIsInZhciBjcmVhdGVPYmplY3RNYXBwZXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVPYmplY3RNYXBwZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCB3aXRoIHRoZSBzYW1lIGtleXMgYXMgYG9iamVjdGAgYW5kIHZhbHVlcyBnZW5lcmF0ZWQgYnlcbiAqIHJ1bm5pbmcgZWFjaCBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBvZiBgb2JqZWN0YCB0aHJvdWdoIGBpdGVyYXRlZWAuIFRoZVxuICogaXRlcmF0ZWUgZnVuY3Rpb24gaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOlxuICogKHZhbHVlLCBrZXksIG9iamVjdCkuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgaXRlcmF0ZWVgIHRoZSBjcmVhdGVkIGBfLnByb3BlcnR5YFxuICogc3R5bGUgY2FsbGJhY2sgcmV0dXJucyB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogSWYgYSB2YWx1ZSBpcyBhbHNvIHByb3ZpZGVkIGZvciBgdGhpc0FyZ2AgdGhlIGNyZWF0ZWQgYF8ubWF0Y2hlc1Byb3BlcnR5YFxuICogc3R5bGUgY2FsbGJhY2sgcmV0dXJucyBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBhIG1hdGNoaW5nIHByb3BlcnR5XG4gKiB2YWx1ZSwgZWxzZSBgZmFsc2VgLlxuICpcbiAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGl0ZXJhdGVlYCB0aGUgY3JlYXRlZCBgXy5tYXRjaGVzYCBzdHlsZVxuICogY2FsbGJhY2sgcmV0dXJucyBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW5cbiAqIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R8c3RyaW5nfSBbaXRlcmF0ZWU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWRcbiAqICBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5tYXBWYWx1ZXMoeyAnYSc6IDEsICdiJzogMiB9LCBmdW5jdGlvbihuKSB7XG4gKiAgIHJldHVybiBuICogMztcbiAqIH0pO1xuICogLy8gPT4geyAnYSc6IDMsICdiJzogNiB9XG4gKlxuICogdmFyIHVzZXJzID0ge1xuICogICAnZnJlZCc6ICAgIHsgJ3VzZXInOiAnZnJlZCcsICAgICdhZ2UnOiA0MCB9LFxuICogICAncGViYmxlcyc6IHsgJ3VzZXInOiAncGViYmxlcycsICdhZ2UnOiAxIH1cbiAqIH07XG4gKlxuICogLy8gdXNpbmcgdGhlIGBfLnByb3BlcnR5YCBjYWxsYmFjayBzaG9ydGhhbmRcbiAqIF8ubWFwVmFsdWVzKHVzZXJzLCAnYWdlJyk7XG4gKiAvLyA9PiB7ICdmcmVkJzogNDAsICdwZWJibGVzJzogMSB9IChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbnZhciBtYXBWYWx1ZXMgPSBjcmVhdGVPYmplY3RNYXBwZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXBWYWx1ZXM7XG4iLCJ2YXIgYXJyYXlNYXAgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheU1hcCcpLFxuICAgIGJhc2VEaWZmZXJlbmNlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZURpZmZlcmVuY2UnKSxcbiAgICBiYXNlRmxhdHRlbiA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VGbGF0dGVuJyksXG4gICAgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmluZENhbGxiYWNrJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi9rZXlzSW4nKSxcbiAgICBwaWNrQnlBcnJheSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3BpY2tCeUFycmF5JyksXG4gICAgcGlja0J5Q2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9waWNrQnlDYWxsYmFjaycpLFxuICAgIHJlc3RQYXJhbSA9IHJlcXVpcmUoJy4uL2Z1bmN0aW9uL3Jlc3RQYXJhbScpO1xuXG4vKipcbiAqIFRoZSBvcHBvc2l0ZSBvZiBgXy5waWNrYDsgdGhpcyBtZXRob2QgY3JlYXRlcyBhbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlXG4gKiBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYG9iamVjdGAgdGhhdCBhcmUgbm90IG9taXR0ZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufC4uLihzdHJpbmd8c3RyaW5nW10pfSBbcHJlZGljYXRlXSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXJcbiAqICBpdGVyYXRpb24gb3IgcHJvcGVydHkgbmFtZXMgdG8gb21pdCwgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgcHJvcGVydHlcbiAqICBuYW1lcyBvciBhcnJheXMgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYHByZWRpY2F0ZWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJywgJ2FnZSc6IDQwIH07XG4gKlxuICogXy5vbWl0KG9iamVjdCwgJ2FnZScpO1xuICogLy8gPT4geyAndXNlcic6ICdmcmVkJyB9XG4gKlxuICogXy5vbWl0KG9iamVjdCwgXy5pc051bWJlcik7XG4gKiAvLyA9PiB7ICd1c2VyJzogJ2ZyZWQnIH1cbiAqL1xudmFyIG9taXQgPSByZXN0UGFyYW0oZnVuY3Rpb24ob2JqZWN0LCBwcm9wcykge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBwcm9wc1swXSAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIHByb3BzID0gYXJyYXlNYXAoYmFzZUZsYXR0ZW4ocHJvcHMpLCBTdHJpbmcpO1xuICAgIHJldHVybiBwaWNrQnlBcnJheShvYmplY3QsIGJhc2VEaWZmZXJlbmNlKGtleXNJbihvYmplY3QpLCBwcm9wcykpO1xuICB9XG4gIHZhciBwcmVkaWNhdGUgPSBiaW5kQ2FsbGJhY2socHJvcHNbMF0sIHByb3BzWzFdLCAzKTtcbiAgcmV0dXJuIHBpY2tCeUNhbGxiYWNrKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gICAgcmV0dXJuICFwcmVkaWNhdGUodmFsdWUsIGtleSwgb2JqZWN0KTtcbiAgfSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBvbWl0O1xuIiwidmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHR3byBkaW1lbnNpb25hbCBhcnJheSBvZiB0aGUga2V5LXZhbHVlIHBhaXJzIGZvciBgb2JqZWN0YCxcbiAqIGUuZy4gYFtba2V5MSwgdmFsdWUxXSwgW2tleTIsIHZhbHVlMl1dYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkgb2Yga2V5LXZhbHVlIHBhaXJzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnBhaXJzKHsgJ2Jhcm5leSc6IDM2LCAnZnJlZCc6IDQwIH0pO1xuICogLy8gPT4gW1snYmFybmV5JywgMzZdLCBbJ2ZyZWQnLCA0MF1dIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbmZ1bmN0aW9uIHBhaXJzKG9iamVjdCkge1xuICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICByZXN1bHRbaW5kZXhdID0gW2tleSwgb2JqZWN0W2tleV1dO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFpcnM7XG4iLCIvKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IHByb3ZpZGVkIHRvIGl0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0eVxuICogQHBhcmFtIHsqfSB2YWx1ZSBBbnkgdmFsdWUuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICpcbiAqIF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0O1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaWRlbnRpdHk7XG4iLCJ2YXIgYmFzZVByb3BlcnR5ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZVByb3BlcnR5JyksXG4gICAgYmFzZVByb3BlcnR5RGVlcCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VQcm9wZXJ0eURlZXAnKSxcbiAgICBpc0tleSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzS2V5Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgcHJvcGVydHkgdmFsdWUgYXQgYHBhdGhgIG9uIGFcbiAqIGdpdmVuIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdHlcbiAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdHMgPSBbXG4gKiAgIHsgJ2EnOiB7ICdiJzogeyAnYyc6IDIgfSB9IH0sXG4gKiAgIHsgJ2EnOiB7ICdiJzogeyAnYyc6IDEgfSB9IH1cbiAqIF07XG4gKlxuICogXy5tYXAob2JqZWN0cywgXy5wcm9wZXJ0eSgnYS5iLmMnKSk7XG4gKiAvLyA9PiBbMiwgMV1cbiAqXG4gKiBfLnBsdWNrKF8uc29ydEJ5KG9iamVjdHMsIF8ucHJvcGVydHkoWydhJywgJ2InLCAnYyddKSksICdhLmIuYycpO1xuICogLy8gPT4gWzEsIDJdXG4gKi9cbmZ1bmN0aW9uIHByb3BlcnR5KHBhdGgpIHtcbiAgcmV0dXJuIGlzS2V5KHBhdGgpID8gYmFzZVByb3BlcnR5KHBhdGgpIDogYmFzZVByb3BlcnR5RGVlcChwYXRoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9wZXJ0eTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2ZyZWV6ZSA9IHJlcXVpcmUoJy4vZnJlZXplJyk7XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhlIHN1cHBsaWVkIHZhbHVlLlxuICpcbiAqIFVzZWZ1bCBmb3IgcmVwbGFjaW5nIGFuIG9iamVjdCBvdXRyaWdodCByYXRoZXIgdGhhbiBtZXJnaW5nIGl0LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHNpZyBhIC0+ICgqIC0+IGEpXG4gKiBAbWVtYmVyT2YgdVxuICogQHBhcmFtICB7Kn0gdmFsdWUgd2hhdCB0byByZXR1cm4gZnJvbSByZXR1cm5lZCBmdW5jdGlvbi5cbiAqIEByZXR1cm4ge2Z1bmN0aW9ufSBhIG5ldyBmdW5jdGlvbiB0aGF0IHdpbGwgYWx3YXlzIHJldHVybiB2YWx1ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFsd2F5c0ZvdXIgPSB1LmNvbnN0YW50KDQpO1xuICogZXhwZWN0KGFsd2F5c0ZvdXIoMzIpKS50b0VxdWFsKDQpO1xuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgdXNlciA9IHtcbiAqICAgbmFtZTogJ01pdGNoJyxcbiAqICAgZmF2b3JpdGVzOiB7XG4gKiAgICAgYmFuZDogJ05pcnZhbmEnLFxuICogICAgIG1vdmllOiAnVGhlIE1hdHJpeCdcbiAqICAgfVxuICogfTtcbiAqXG4gKiB2YXIgbmV3RmF2b3JpdGVzID0ge1xuICogICBiYW5kOiAnQ29sZHBsYXknXG4gKiB9O1xuICpcbiAqIHZhciByZXN1bHQgPSB1KHsgZmF2b3JpdGVzOiB1LmNvbnN0YW50KG5ld0Zhdm9yaXRlcykgfSwgdXNlcik7XG4gKlxuICogZXhwZWN0KHJlc3VsdCkudG9FcXVhbCh7IG5hbWU6ICdNaXRjaCcsIGZhdm9yaXRlczogeyBiYW5kOiAnQ29sZHBsYXknIH0gfSk7XG4gKi9cblxudmFyIF9mcmVlemUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZnJlZXplKTtcblxuZnVuY3Rpb24gY29uc3RhbnQodmFsdWUpIHtcbiAgdmFyIGZyb3plbiA9IF9mcmVlemUyWydkZWZhdWx0J10odmFsdWUpO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmcm96ZW47XG4gIH07XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGNvbnN0YW50O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZnVuY3Rpb24gaXNGcmVlemFibGUob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmplY3QpIHx8IHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnO1xufVxuXG5mdW5jdGlvbiBuZWVkc0ZyZWV6aW5nKG9iamVjdCkge1xuICByZXR1cm4gaXNGcmVlemFibGUob2JqZWN0KSAmJiAhT2JqZWN0LmlzRnJvemVuKG9iamVjdCk7XG59XG5cbmZ1bmN0aW9uIHJlY3VyKG9iamVjdCkge1xuICBPYmplY3QuZnJlZXplKG9iamVjdCk7XG5cbiAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3Rba2V5XTtcbiAgICBpZiAobmVlZHNGcmVlemluZyh2YWx1ZSkpIHtcbiAgICAgIHJlY3VyKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmplY3Q7XG59XG5cbi8qKlxuICogRGVlcGx5IGZyZWV6ZSBhIHBsYWluIGphdmFzY3JpcHQgb2JqZWN0LlxuICpcbiAqIElmIGBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nYCwgdGhpcyByZXR1cm5zIHRoZSBvcmlnaW5hbCBvYmplY3RcbiAqIHdpdG91dCBmcmVlemluZy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBzaWcgYSAtPiBhXG4gKiBAcGFyYW0gIHtvYmplY3R9IG9iamVjdCBPYmplY3QgdG8gZnJlZXplLlxuICogQHJldHVybiB7b2JqZWN0fSBGcm96ZW4gb2JqZWN0LCB1bmxlc3MgaW4gcHJvZHVjdGlvbiwgdGhlbiB0aGUgc2FtZSBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGZyZWV6ZShvYmplY3QpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgaWYgKG5lZWRzRnJlZXppbmcob2JqZWN0KSkge1xuICAgIHJlY3VyKG9iamVjdCk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmcmVlemU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9pZkVsc2UgPSByZXF1aXJlKCcuL2lmRWxzZScpO1xuXG52YXIgX2lmRWxzZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pZkVsc2UpO1xuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgX3V0aWxDdXJyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsQ3VycnkpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfdXRpbEN1cnJ5MlsnZGVmYXVsdCddKGZ1bmN0aW9uIChwcmVkaWNhdGUsIHRydWVVcGRhdGVzLCBvYmplY3QpIHtcbiAgcmV0dXJuIF9pZkVsc2UyWydkZWZhdWx0J10ocHJlZGljYXRlLCB0cnVlVXBkYXRlcywgZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfSwgb2JqZWN0KTtcbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXBkYXRlID0gcmVxdWlyZSgnLi91cGRhdGUnKTtcblxudmFyIF91cGRhdGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlKTtcblxudmFyIF93cmFwID0gcmVxdWlyZSgnLi93cmFwJyk7XG5cbnZhciBfd3JhcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93cmFwKTtcblxuZnVuY3Rpb24gdXBkYXRlSWZFbHNlKHByZWRpY2F0ZSwgdHJ1ZVVwZGF0ZXMsIGZhbHNlVXBkYXRlcywgb2JqZWN0KSB7XG4gIHZhciB0ZXN0ID0gdHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJyA/IHByZWRpY2F0ZShvYmplY3QpIDogcHJlZGljYXRlO1xuXG4gIHZhciB1cGRhdGVzID0gdGVzdCA/IHRydWVVcGRhdGVzIDogZmFsc2VVcGRhdGVzO1xuXG4gIHJldHVybiBfdXBkYXRlMlsnZGVmYXVsdCddKHVwZGF0ZXMsIG9iamVjdCk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF93cmFwMlsnZGVmYXVsdCddKHVwZGF0ZUlmRWxzZSk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jb25zdGFudCA9IHJlcXVpcmUoJy4vY29uc3RhbnQnKTtcblxudmFyIF9jb25zdGFudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jb25zdGFudCk7XG5cbnZhciBfZnJlZXplID0gcmVxdWlyZSgnLi9mcmVlemUnKTtcblxudmFyIF9mcmVlemUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZnJlZXplKTtcblxudmFyIF9pcyA9IHJlcXVpcmUoJy4vaXMnKTtcblxudmFyIF9pczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pcyk7XG5cbnZhciBfaWYyID0gcmVxdWlyZSgnLi9pZicpO1xuXG52YXIgX2lmMyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lmMik7XG5cbnZhciBfaWZFbHNlID0gcmVxdWlyZSgnLi9pZkVsc2UnKTtcblxudmFyIF9pZkVsc2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaWZFbHNlKTtcblxudmFyIF9tYXAgPSByZXF1aXJlKCcuL21hcCcpO1xuXG52YXIgX21hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9tYXApO1xuXG52YXIgX29taXQgPSByZXF1aXJlKCcuL29taXQnKTtcblxudmFyIF9vbWl0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX29taXQpO1xuXG52YXIgX3JlamVjdCA9IHJlcXVpcmUoJy4vcmVqZWN0Jyk7XG5cbnZhciBfcmVqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlamVjdCk7XG5cbnZhciBfdXBkYXRlID0gcmVxdWlyZSgnLi91cGRhdGUnKTtcblxudmFyIF91cGRhdGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlKTtcblxudmFyIF91cGRhdGVJbiA9IHJlcXVpcmUoJy4vdXBkYXRlSW4nKTtcblxudmFyIF91cGRhdGVJbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGVJbik7XG5cbnZhciBfd2l0aERlZmF1bHQgPSByZXF1aXJlKCcuL3dpdGhEZWZhdWx0Jyk7XG5cbnZhciBfd2l0aERlZmF1bHQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd2l0aERlZmF1bHQpO1xuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgdSA9IF91cGRhdGUyWydkZWZhdWx0J107XG5cbnUuXyA9IF91dGlsQ3VycnkuXztcbnUuY29uc3RhbnQgPSBfY29uc3RhbnQyWydkZWZhdWx0J107XG51WydpZiddID0gX2lmM1snZGVmYXVsdCddO1xudS5pZkVsc2UgPSBfaWZFbHNlMlsnZGVmYXVsdCddO1xudS5pcyA9IF9pczJbJ2RlZmF1bHQnXTtcbnUuZnJlZXplID0gX2ZyZWV6ZTJbJ2RlZmF1bHQnXTtcbnUubWFwID0gX21hcDJbJ2RlZmF1bHQnXTtcbnUub21pdCA9IF9vbWl0MlsnZGVmYXVsdCddO1xudS5yZWplY3QgPSBfcmVqZWN0MlsnZGVmYXVsdCddO1xudS51cGRhdGUgPSBfdXBkYXRlMlsnZGVmYXVsdCddO1xudS51cGRhdGVJbiA9IF91cGRhdGVJbjJbJ2RlZmF1bHQnXTtcbnUud2l0aERlZmF1bHQgPSBfd2l0aERlZmF1bHQyWydkZWZhdWx0J107XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91dGlsU3BsaXRQYXRoID0gcmVxdWlyZSgnLi91dGlsL3NwbGl0UGF0aCcpO1xuXG52YXIgX3V0aWxTcGxpdFBhdGgyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbFNwbGl0UGF0aCk7XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciBfdXRpbEN1cnJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxDdXJyeSk7XG5cbmZ1bmN0aW9uIGlzKHBhdGgsIHByZWRpY2F0ZSwgb2JqZWN0KSB7XG4gIHZhciBwYXJ0cyA9IF91dGlsU3BsaXRQYXRoMlsnZGVmYXVsdCddKHBhdGgpO1xuXG4gIHZhciByZXN0ID0gb2JqZWN0O1xuICB2YXIgcGFydCA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgX2l0ZXJhdG9yID0gcGFydHMsIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheShfaXRlcmF0b3IpLCBfaSA9IDAsIF9pdGVyYXRvciA9IF9pc0FycmF5ID8gX2l0ZXJhdG9yIDogX2l0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0oKTs7KSB7XG4gICAgaWYgKF9pc0FycmF5KSB7XG4gICAgICBpZiAoX2kgPj0gX2l0ZXJhdG9yLmxlbmd0aCkgYnJlYWs7XG4gICAgICBwYXJ0ID0gX2l0ZXJhdG9yW19pKytdO1xuICAgIH0gZWxzZSB7XG4gICAgICBfaSA9IF9pdGVyYXRvci5uZXh0KCk7XG4gICAgICBpZiAoX2kuZG9uZSkgYnJlYWs7XG4gICAgICBwYXJ0ID0gX2kudmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiByZXN0ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIGZhbHNlO1xuICAgIHJlc3QgPSByZXN0W3BhcnRdO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcHJlZGljYXRlKHJlc3QpO1xuICB9XG5cbiAgcmV0dXJuIHByZWRpY2F0ZSA9PT0gcmVzdDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3V0aWxDdXJyeTJbJ2RlZmF1bHQnXShpcyk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91cGRhdGUgPSByZXF1aXJlKCcuL3VwZGF0ZScpO1xuXG52YXIgX3VwZGF0ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGUpO1xuXG52YXIgX3dyYXAgPSByZXF1aXJlKCcuL3dyYXAnKTtcblxudmFyIF93cmFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dyYXApO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoID0gcmVxdWlyZSgnbG9kYXNoL2NvbGxlY3Rpb24vZm9yRWFjaCcpO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uTWFwID0gcmVxdWlyZSgnbG9kYXNoL2NvbGxlY3Rpb24vbWFwJyk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvbk1hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hDb2xsZWN0aW9uTWFwKTtcblxudmFyIF9sb2Rhc2hPYmplY3RNYXBWYWx1ZXMgPSByZXF1aXJlKCdsb2Rhc2gvb2JqZWN0L21hcFZhbHVlcycpO1xuXG52YXIgX2xvZGFzaE9iamVjdE1hcFZhbHVlczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hPYmplY3RNYXBWYWx1ZXMpO1xuXG5mdW5jdGlvbiBzaGFsbG93RXF1YWwob2JqZWN0LCBvdGhlck9iamVjdCkge1xuICB2YXIgZXF1YWwgPSB0cnVlO1xuICBfbG9kYXNoQ29sbGVjdGlvbkZvckVhY2gyWydkZWZhdWx0J10ob3RoZXJPYmplY3QsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHZhbHVlICE9PSBvYmplY3Rba2V5XSkge1xuICAgICAgZXF1YWwgPSBmYWxzZTtcblxuICAgICAgLy8gZXhpdCBlYXJseVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGVxdWFsO1xufVxuXG5mdW5jdGlvbiBtYXAoaXRlcmF0ZWUsIG9iamVjdCkge1xuICB2YXIgdXBkYXRlciA9IHR5cGVvZiBpdGVyYXRlZSA9PT0gJ2Z1bmN0aW9uJyA/IGl0ZXJhdGVlIDogX3VwZGF0ZTJbJ2RlZmF1bHQnXShpdGVyYXRlZSk7XG5cbiAgdmFyIG1hcHBlciA9IEFycmF5LmlzQXJyYXkob2JqZWN0KSA/IF9sb2Rhc2hDb2xsZWN0aW9uTWFwMlsnZGVmYXVsdCddIDogX2xvZGFzaE9iamVjdE1hcFZhbHVlczJbJ2RlZmF1bHQnXTtcblxuICB2YXIgbmV3T2JqZWN0ID0gbWFwcGVyKG9iamVjdCwgdXBkYXRlcik7XG4gIHZhciBlcXVhbCA9IHNoYWxsb3dFcXVhbChvYmplY3QsIG5ld09iamVjdCk7XG5cbiAgcmV0dXJuIGVxdWFsID8gb2JqZWN0IDogbmV3T2JqZWN0O1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfd3JhcDJbJ2RlZmF1bHQnXShtYXApO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfbG9kYXNoT2JqZWN0T21pdCA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3Qvb21pdCcpO1xuXG52YXIgX2xvZGFzaE9iamVjdE9taXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoT2JqZWN0T21pdCk7XG5cbnZhciBfd3JhcCA9IHJlcXVpcmUoJy4vd3JhcCcpO1xuXG52YXIgX3dyYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd3JhcCk7XG5cbmZ1bmN0aW9uIG9taXQocHJlZGljYXRlLCBjb2xsZWN0aW9uKSB7XG4gIHJldHVybiBfbG9kYXNoT2JqZWN0T21pdDJbJ2RlZmF1bHQnXShjb2xsZWN0aW9uLCBwcmVkaWNhdGUpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfd3JhcDJbJ2RlZmF1bHQnXShvbWl0KTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25SZWplY3QgPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9yZWplY3QnKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaENvbGxlY3Rpb25SZWplY3QpO1xuXG52YXIgX3dyYXAgPSByZXF1aXJlKCcuL3dyYXAnKTtcblxudmFyIF93cmFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dyYXApO1xuXG5mdW5jdGlvbiByZWplY3QocHJlZGljYXRlLCBjb2xsZWN0aW9uKSB7XG4gIHJldHVybiBfbG9kYXNoQ29sbGVjdGlvblJlamVjdDJbJ2RlZmF1bHQnXShjb2xsZWN0aW9uLCBwcmVkaWNhdGUpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfd3JhcDJbJ2RlZmF1bHQnXShyZWplY3QpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfd3JhcCA9IHJlcXVpcmUoJy4vd3JhcCcpO1xuXG52YXIgX3dyYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd3JhcCk7XG5cbnZhciBfdXRpbElzRW1wdHkgPSByZXF1aXJlKCcuL3V0aWwvaXNFbXB0eScpO1xuXG52YXIgX3V0aWxJc0VtcHR5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxJc0VtcHR5KTtcblxudmFyIF91dGlsRGVmYXVsdE9iamVjdCA9IHJlcXVpcmUoJy4vdXRpbC9kZWZhdWx0T2JqZWN0Jyk7XG5cbnZhciBfdXRpbERlZmF1bHRPYmplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbERlZmF1bHRPYmplY3QpO1xuXG52YXIgX2xvZGFzaExhbmdJc1BsYWluT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoL2xhbmcvaXNQbGFpbk9iamVjdCcpO1xuXG52YXIgX2xvZGFzaExhbmdJc1BsYWluT2JqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaExhbmdJc1BsYWluT2JqZWN0KTtcblxuZnVuY3Rpb24gcmVkdWNlKG9iamVjdCwgY2FsbGJhY2ssIGluaXRpYWxWYWx1ZSkge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywga2V5KSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKGFjYywgb2JqZWN0W2tleV0sIGtleSk7XG4gIH0sIGluaXRpYWxWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVVcGRhdGVzKHVwZGF0ZXMsIG9iamVjdCkge1xuICByZXR1cm4gcmVkdWNlKHVwZGF0ZXMsIGZ1bmN0aW9uIChhY2MsIHZhbHVlLCBrZXkpIHtcbiAgICB2YXIgdXBkYXRlZFZhbHVlID0gdmFsdWU7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHVwZGF0ZWRWYWx1ZSA9IHVwZGF0ZSh2YWx1ZSwgb2JqZWN0W2tleV0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB1cGRhdGVkVmFsdWUgPSB2YWx1ZShvYmplY3Rba2V5XSk7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdFtrZXldICE9PSB1cGRhdGVkVmFsdWUpIHtcbiAgICAgIGFjY1trZXldID0gdXBkYXRlZFZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQXJyYXkodXBkYXRlcywgb2JqZWN0KSB7XG4gIHZhciBuZXdBcnJheSA9IFtdLmNvbmNhdChvYmplY3QpO1xuXG4gIE9iamVjdC5rZXlzKHVwZGF0ZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIG5ld0FycmF5W2tleV0gPSB1cGRhdGVzW2tleV07XG4gIH0pO1xuXG4gIHJldHVybiBuZXdBcnJheTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSB1cGRhdGUgYW4gb2JqZWN0IG9yIGFycmF5LlxuICpcbiAqIENhbiB1cGRhdGUgd2l0aCB2YWx1ZXM6XG4gKiB1cGRhdGUoeyBmb286IDMgfSwgeyBmb286IDEsIGJhcjogMiB9KTtcbiAqIC8vID0+IHsgZm9vOiAzLCBiYXI6IDIgfVxuICpcbiAqIE9yIHdpdGggYSBmdW5jdGlvbjpcbiAqIHVwZGF0ZSh7IGZvbzogeCA9PiAoeCArIDEpIH0sIHsgZm9vOiAyIH0pO1xuICogLy8gPT4geyBmb286IDMgfVxuICpcbiAqIEBmdW5jdGlvblxuICogQG5hbWUgdXBkYXRlXG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gdXBkYXRlc1xuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9ICAgIG9iamVjdCB0byB1cGRhdGVcbiAqIEByZXR1cm4ge09iamVjdHxBcnJheX0gICBuZXcgb2JqZWN0IHdpdGggbW9kaWZpY2F0aW9uc1xuICovXG5mdW5jdGlvbiB1cGRhdGUodXBkYXRlcywgb2JqZWN0KSB7XG4gIGlmICh0eXBlb2YgdXBkYXRlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDIgPyBfbGVuIC0gMiA6IDApLCBfa2V5ID0gMjsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMl0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHVwZGF0ZXMuYXBwbHkodW5kZWZpbmVkLCBbb2JqZWN0XS5jb25jYXQoYXJncykpO1xuICB9XG5cbiAgaWYgKCFfbG9kYXNoTGFuZ0lzUGxhaW5PYmplY3QyWydkZWZhdWx0J10odXBkYXRlcykpIHtcbiAgICByZXR1cm4gdXBkYXRlcztcbiAgfVxuXG4gIHZhciBkZWZhdWx0ZWRPYmplY3QgPSBfdXRpbERlZmF1bHRPYmplY3QyWydkZWZhdWx0J10ob2JqZWN0LCB1cGRhdGVzKTtcblxuICB2YXIgcmVzb2x2ZWRVcGRhdGVzID0gcmVzb2x2ZVVwZGF0ZXModXBkYXRlcywgZGVmYXVsdGVkT2JqZWN0KTtcblxuICBpZiAoX3V0aWxJc0VtcHR5MlsnZGVmYXVsdCddKHJlc29sdmVkVXBkYXRlcykpIHtcbiAgICByZXR1cm4gZGVmYXVsdGVkT2JqZWN0O1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVmYXVsdGVkT2JqZWN0KSkge1xuICAgIHJldHVybiB1cGRhdGVBcnJheShyZXNvbHZlZFVwZGF0ZXMsIGRlZmF1bHRlZE9iamVjdCk7XG4gIH1cblxuICByZXR1cm4gX2V4dGVuZHMoe30sIGRlZmF1bHRlZE9iamVjdCwgcmVzb2x2ZWRVcGRhdGVzKTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3dyYXAyWydkZWZhdWx0J10odXBkYXRlLCAyKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgX3V0aWxDdXJyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsQ3VycnkpO1xuXG52YXIgX3VwZGF0ZTIgPSByZXF1aXJlKCcuL3VwZGF0ZScpO1xuXG52YXIgX3VwZGF0ZTMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGRhdGUyKTtcblxudmFyIF9tYXAgPSByZXF1aXJlKCcuL21hcCcpO1xuXG52YXIgX21hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9tYXApO1xuXG52YXIgX3V0aWxTcGxpdFBhdGggPSByZXF1aXJlKCcuL3V0aWwvc3BsaXRQYXRoJyk7XG5cbnZhciBfdXRpbFNwbGl0UGF0aDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsU3BsaXRQYXRoKTtcblxudmFyIHdpbGRjYXJkID0gJyonO1xuXG5mdW5jdGlvbiByZWR1Y2VQYXRoKGFjYywga2V5KSB7XG4gIHZhciBfcmVmO1xuXG4gIGlmIChrZXkgPT09IHdpbGRjYXJkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdmFyIF91cGRhdGU7XG5cbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHdpbGRjYXJkKSA/XG4gICAgICAvLyBJZiB3ZSBhY3R1YWxseSBoYXZlIHdpbGRjYXJkIGFzIGEgcHJvcGVydHksIHVwZGF0ZSB0aGF0XG4gICAgICBfdXBkYXRlM1snZGVmYXVsdCddKChfdXBkYXRlID0ge30sIF91cGRhdGVbd2lsZGNhcmRdID0gYWNjLCBfdXBkYXRlKSwgdmFsdWUpIDpcbiAgICAgIC8vIE90aGVyd2lzZSBtYXAgb3ZlciBhbGwgcHJvcGVydGllc1xuICAgICAgX21hcDJbJ2RlZmF1bHQnXShhY2MsIHZhbHVlKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIChfcmVmID0ge30sIF9yZWZba2V5XSA9IGFjYywgX3JlZik7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUluKHBhdGgsIHZhbHVlLCBvYmplY3QpIHtcbiAgdmFyIHBhcnRzID0gX3V0aWxTcGxpdFBhdGgyWydkZWZhdWx0J10ocGF0aCk7XG4gIHZhciB1cGRhdGVzID0gcGFydHMucmVkdWNlUmlnaHQocmVkdWNlUGF0aCwgdmFsdWUpO1xuXG4gIHJldHVybiBfdXBkYXRlM1snZGVmYXVsdCddKHVwZGF0ZXMsIG9iamVjdCk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF91dGlsQ3VycnkyWydkZWZhdWx0J10odXBkYXRlSW4pO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiLyogZXNsaW50IG5vLXNoYWRvdzowLCBuby1wYXJhbS1yZWFzc2lnbjowICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLmN1cnJ5MSA9IGN1cnJ5MTtcbmV4cG9ydHMuY3VycnkyID0gY3VycnkyO1xuZXhwb3J0cy5jdXJyeTMgPSBjdXJyeTM7XG5leHBvcnRzLmN1cnJ5NCA9IGN1cnJ5NDtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGN1cnJ5O1xudmFyIF8gPSAnQEB1cGRlZXAvcGxhY2Vob2xkZXInO1xuXG5leHBvcnRzLl8gPSBfO1xuZnVuY3Rpb24gY291bnRBcmd1bWVudHMoYXJncywgbWF4KSB7XG4gIHZhciBuID0gYXJncy5sZW5ndGg7XG4gIGlmIChuID4gbWF4KSBuID0gbWF4O1xuXG4gIHdoaWxlIChhcmdzW24gLSAxXSA9PT0gXykge1xuICAgIG4tLTtcbiAgfVxuXG4gIHJldHVybiBuO1xufVxuXG5mdW5jdGlvbiBjdXJyeTEoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJpZWQoYSkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBfcmVmID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgX3JlZltfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgdmFyIGIgPSBfcmVmWzBdLFxuICAgICAgICBjID0gX3JlZlsxXTtcblxuICAgIHZhciBuID0gY291bnRBcmd1bWVudHMoYXJndW1lbnRzKTtcblxuICAgIGlmIChuID49IDEpIHJldHVybiBmbihhLCBiLCBjKTtcbiAgICByZXR1cm4gY3VycmllZDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3VycnkyKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjdXJyaWVkKGEsIGIpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIF9yZWYyID0gQXJyYXkoX2xlbjIgPiAyID8gX2xlbjIgLSAyIDogMCksIF9rZXkyID0gMjsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgX3JlZjJbX2tleTIgLSAyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgfVxuXG4gICAgdmFyIGMgPSBfcmVmMlswXSxcbiAgICAgICAgZCA9IF9yZWYyWzFdO1xuXG4gICAgdmFyIG4gPSBjb3VudEFyZ3VtZW50cyhhcmd1bWVudHMsIDIpO1xuXG4gICAgaWYgKGIgPT09IF8gfHwgYyA9PT0gXyB8fCBkID09PSBfKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IHVzZSBwbGFjZWhvbGRlciBvbiBmaXJzdCBhcmd1bWVudCBvZiB0aGlzIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmIChuID49IDIpIHtcbiAgICAgIGlmIChhID09PSBfKSByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChhLCBjLCBkKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQpO1xuICAgIH1cblxuICAgIGlmIChuID09PSAxKSByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChiLCBjLCBkKSB7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGN1cnJpZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGN1cnJ5Myhmbikge1xuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZChhLCBiLCBjKSB7XG4gICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBfcmVmMyA9IEFycmF5KF9sZW4zID4gMyA/IF9sZW4zIC0gMyA6IDApLCBfa2V5MyA9IDM7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIF9yZWYzW19rZXkzIC0gM10gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgIH1cblxuICAgIHZhciBkID0gX3JlZjNbMF0sXG4gICAgICAgIGUgPSBfcmVmM1sxXTtcblxuICAgIHZhciBuID0gY291bnRBcmd1bWVudHMoYXJndW1lbnRzLCAzKTtcblxuICAgIGlmIChjID09PSBfIHx8IGQgPT09IF8gfHwgZSA9PT0gXykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSB1c2UgcGxhY2Vob2xkZXIgb24gZmlyc3Qgb3Igc2Vjb25kIGFyZ3VtZW50IG9mIHRoaXMgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKG4gPj0gMykge1xuICAgICAgaWYgKGEgPT09IF8pIHtcbiAgICAgICAgaWYgKGIgPT09IF8pIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGEsIGIsIGQsIGUpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChhLCBkLCBlKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChiID09PSBfKSByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChiLCBkLCBlKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgIH1cblxuICAgIGlmIChuID09PSAyKSB7XG4gICAgICBpZiAoYSA9PT0gXykgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYSwgYywgZCwgZSkge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGMsIGQsIGUpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDEpIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGIsIGMsIGQsIGUpIHtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjdXJyaWVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjdXJyeTQoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJpZWQoYSwgYiwgYywgZCkge1xuICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgX3JlZjQgPSBBcnJheShfbGVuNCA+IDQgPyBfbGVuNCAtIDQgOiAwKSwgX2tleTQgPSA0OyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICBfcmVmNFtfa2V5NCAtIDRdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICB9XG5cbiAgICB2YXIgZSA9IF9yZWY0WzBdLFxuICAgICAgICBmID0gX3JlZjRbMV07XG5cbiAgICB2YXIgbiA9IGNvdW50QXJndW1lbnRzKGFyZ3VtZW50cywgNCk7XG5cbiAgICBpZiAoZCA9PT0gXyB8fCBlID09PSBfIHx8IGYgPT09IF8pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgdXNlIHBsYWNlaG9sZGVyIG9uIGZpcnN0LCBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnQgb2YgdGhpcyBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICBpZiAobiA+PSA0KSB7XG4gICAgICBpZiAoYSA9PT0gXykge1xuICAgICAgICBpZiAoYiA9PT0gXykge1xuICAgICAgICAgIGlmIChjID09PSBfKSByZXR1cm4gY3VycnkzKGZ1bmN0aW9uIChhLCBiLCBjLCBlLCBmKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYSwgYiwgZSwgZikge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjID09PSBfKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChhLCBjLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYSwgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoYiA9PT0gXykge1xuICAgICAgICBpZiAoYyA9PT0gXykgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYiwgYywgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGIsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGMgPT09IF8pIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGMsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDMpIHtcbiAgICAgIGlmIChhID09PSBfKSB7XG4gICAgICAgIGlmIChiID09PSBfKSByZXR1cm4gY3VycnkzKGZ1bmN0aW9uIChhLCBiLCBkLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYSwgZCwgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoYiA9PT0gXykgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYiwgZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDIpIHtcbiAgICAgIGlmIChhID09PSBfKSByZXR1cm4gY3VycnkzKGZ1bmN0aW9uIChhLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYywgZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMSkgcmV0dXJuIGN1cnJ5MyhmdW5jdGlvbiAoYiwgYywgZCwgZSwgZikge1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH0pO1xuICAgIHJldHVybiBjdXJyaWVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjdXJyeShmbikge1xuICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gZm4ubGVuZ3RoIDogYXJndW1lbnRzWzFdO1xuICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW2ZuLCBjdXJyeTEsIGN1cnJ5MiwgY3VycnkzLCBjdXJyeTRdW2xlbmd0aF0oZm4pO1xuICB9KSgpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2lzRW1wdHkgPSByZXF1aXJlKCcuL2lzRW1wdHknKTtcblxudmFyIF9pc0VtcHR5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lzRW1wdHkpO1xuXG5mdW5jdGlvbiBpc0ludCh2YWx1ZSkge1xuICBpZiAoaXNOYU4odmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciB4ID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gIHJldHVybiAoeCB8IDApID09PSB4O1xufVxuXG5mdW5jdGlvbiBpc0FycmF5VXBkYXRlKHVwZGF0ZXMpIHtcbiAgZm9yICh2YXIgX2l0ZXJhdG9yID0gT2JqZWN0LmtleXModXBkYXRlcyksIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheShfaXRlcmF0b3IpLCBfaSA9IDAsIF9pdGVyYXRvciA9IF9pc0FycmF5ID8gX2l0ZXJhdG9yIDogX2l0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0oKTs7KSB7XG4gICAgdmFyIF9yZWY7XG5cbiAgICBpZiAoX2lzQXJyYXkpIHtcbiAgICAgIGlmIChfaSA+PSBfaXRlcmF0b3IubGVuZ3RoKSBicmVhaztcbiAgICAgIF9yZWYgPSBfaXRlcmF0b3JbX2krK107XG4gICAgfSBlbHNlIHtcbiAgICAgIF9pID0gX2l0ZXJhdG9yLm5leHQoKTtcbiAgICAgIGlmIChfaS5kb25lKSBicmVhaztcbiAgICAgIF9yZWYgPSBfaS52YWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgdXBkYXRlS2V5ID0gX3JlZjtcblxuICAgIGlmICghaXNJbnQodXBkYXRlS2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBhcnJheU9yT2JqZWN0KHVwZGF0ZXMpIHtcbiAgaWYgKCFfaXNFbXB0eTJbJ2RlZmF1bHQnXSh1cGRhdGVzKSAmJiBpc0FycmF5VXBkYXRlKHVwZGF0ZXMpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIHt9O1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0T2JqZWN0KG9iamVjdCwgdXBkYXRlcykge1xuICBpZiAodHlwZW9mIG9iamVjdCA9PT0gJ3VuZGVmaW5lZCcgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGFycmF5T3JPYmplY3QodXBkYXRlcyk7XG4gIH1cblxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBkZWZhdWx0T2JqZWN0O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5mdW5jdGlvbiBpc0VtcHR5KG9iamVjdCkge1xuICByZXR1cm4gIU9iamVjdC5rZXlzKG9iamVjdCkubGVuZ3RoO1xufVxuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGlzRW1wdHk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHNwbGl0UGF0aDtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25SZWplY3QgPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9yZWplY3QnKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaENvbGxlY3Rpb25SZWplY3QpO1xuXG5mdW5jdGlvbiBzcGxpdFBhdGgocGF0aCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXRoKSA/IHBhdGggOiBfbG9kYXNoQ29sbGVjdGlvblJlamVjdDJbJ2RlZmF1bHQnXShwYXRoLnNwbGl0KCcuJyksIGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuICF4O1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXBkYXRlID0gcmVxdWlyZSgnLi91cGRhdGUnKTtcblxudmFyIF91cGRhdGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlKTtcblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIF91dGlsQ3VycnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbEN1cnJ5KTtcblxuZnVuY3Rpb24gd2l0aERlZmF1bHQoZGVmYXVsdFZhbHVlLCB1cGRhdGVzLCBvYmplY3QpIHtcbiAgaWYgKHR5cGVvZiBvYmplY3QgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIF91cGRhdGUyWydkZWZhdWx0J10odXBkYXRlcywgZGVmYXVsdFZhbHVlKTtcbiAgfVxuXG4gIHJldHVybiBfdXBkYXRlMlsnZGVmYXVsdCddKHVwZGF0ZXMsIG9iamVjdCk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF91dGlsQ3VycnkyWydkZWZhdWx0J10od2l0aERlZmF1bHQpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gd3JhcDtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgX3V0aWxDdXJyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsQ3VycnkpO1xuXG52YXIgX2ZyZWV6ZSA9IHJlcXVpcmUoJy4vZnJlZXplJyk7XG5cbnZhciBfZnJlZXplMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZyZWV6ZSk7XG5cbmZ1bmN0aW9uIHdyYXAoZnVuYykge1xuICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gZnVuYy5sZW5ndGggOiBhcmd1bWVudHNbMV07XG4gIHJldHVybiAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfdXRpbEN1cnJ5MlsnZGVmYXVsdCddKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfZnJlZXplMlsnZGVmYXVsdCddKGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpKTtcbiAgICB9LCBsZW5ndGgpO1xuICB9KSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJhY3Rpb25zID0gW1xuICAjIEFkZHMgYSBuZXcgdHJpZ2dlciB0byBgdGltZWxpbmVgIHdpdGggc3BlY2lmaWVkIGBwb3NpdGlvbmAgYW5kIGBhY3Rpb25gLiBUaGVcbiAgIyAgIGBhY3Rpb25gIGZ1bmN0aW9uIGV4cGVjdHMgdGhlIGlkIG9mIHRoZSBpbnZva2luZyBlbnRpdHkgYXMgYW4gYXJndW1lbnQuXG4gICNcbiAgIyAgIHRpbWVsaW5lOiBTdHJpbmdcbiAgIyAgIHBvc2l0aW9uOiBGbG9hdFxuICAjICAgYWN0aW9uOiBGdW5jdGlvblxuICAnQWRkVHJpZ2dlcidcblxuICAjIEFkZHMgYSBuZXcgYG1hcHBpbmdgIGZ1bmN0aW9uIHRvIGEgYHRpbWVsaW5lYC4gQSBgbWFwcGluZ2AgZnVuY3Rpb24gbW9kaWZpZXNcbiAgIyAgIGFuIGVudGl0eSdzIGBkYXRhYCBmaWVsZCwgYmFzZWQgb24gYW4gYXR0YWNoZWQgYHRpbWVsaW5lYCdzIHByb2dyZXNzLlxuICAjIFRoZSBgbWFwcGluZ2AgZnVuY3Rpb24gZXhwZWN0cyBmb3VyIGFyZ3VtZW50czpcbiAgIyAgIHByb2dyZXNzOiBGbG9hdCAtIHRoZSB0aW1lbGluZSdzIHVwZGF0ZWQgcHJvZ3Jlc3NcbiAgIyAgIGVudGl0eTogdGhlIGlkIG9mIHRoZSBpbnZva2luZyBlbnRpdHlcbiAgIyAgIGRhdGE6IHRoZSBjdXJyZW50IGBkYXRhYCBmaWVsZCBvZiB0aGUgaW52b2tpbmcgZW50aXR5XG4gICMgVGhlIGBtYXBwaW5nYCBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIGFuIG9iamVjdCBvZiBjaGFuZ2VzIHRvIHRoZSBleGlzdGluZ1xuICAjICAgYGRhdGFgIGZpZWxkLlxuICAjXG4gICMgIHRpbWVsaW5lOiBTdHJpbmdcbiAgIyAgbWFwcGluZzogRnVuY3Rpb25cbiAgJ0FkZE1hcHBpbmcnXG5cbiAgIyBBZGRzIGEgbmV3IGVudGl0eSwgd2l0aCBhbiBvcHRpb25hbCBpbml0aWFsIGBkYXRhYCBmaWVsZCBhbmQgb3B0aW9uYWwgYG5hbWVgXG4gICMgICBmaWVsZC5cbiAgI1xuICAjICAgaW5pdGlhbERhdGE6IE9iamVjdFxuICAjICAgbmFtZTogU3RyaW5nXG4gICdBZGRFbnRpdHknXG5cbiAgIyBBZGRzIGEgbmV3IHRpbWVsaW5lIHdpdGggdGhlIHByb3ZpZGVkIGBsZW5ndGhgLCBhbmQgb3B0aW9uYWxseSB3aGV0aGVyIHRoZVxuICAjICAgdGltZWxpbmUgYHNob3VsZExvb3BgLlxuICAjXG4gICMgICBsZW5ndGg6IE51bWJlclxuICAjICAgc2hvdWxkTG9vcDogQm9vbGVhbiAjIFRPRE86IERvZXMgaXQgbWFrZSBzZW5zZSB0byBoYXZlIHRoaXMgbG9vcCBwYXJhbWV0ZXI/XG4gICMgICAgICAgICAgICAgICAgICAgICAgICMgICAgICAgU2VlbXMgbGlrZSBpdCBzaG91bGQganVzdCByZW1haW4gYW4gYWN0aW9uLlxuICAnQWRkVGltZWxpbmUnXG5cbiAgIyBTZXQgYSB0aW1lbGluZSB0byBsb29wIG9yIG5vdCBsb29wLlxuICAjXG4gICMgICB0aW1lbGluZTogU3RyaW5nXG4gICMgICBzaG91bGRMb29wOiBCb29sZWFuXG4gICdTZXRUaW1lbGluZUxvb3AnXG5cbiAgIyBBdHRhY2hlcyB0aGUgYGVudGl0eWAgd2l0aCB0aGUgcHJvdmlkZWQgaWQgdG8gdGhlIGB0aW1lbGluZWAgd2l0aCB0aGVcbiAgIyAgIHByb3ZpZGVkIHRpbWVsaW5lIGlkLlxuICAjXG4gICMgICBlbnRpdHk6IFN0cmluZ1xuICAjICAgdGltZWxpbmU6IFN0cmluZ1xuICAnQXR0YWNoRW50aXR5VG9UaW1lbGluZSdcblxuICAjIFVwZGF0ZXMgYGVudGl0eWAncyBgZGF0YWAgcHJvcGVydHkgd2l0aCBgY2hhbmdlc2AgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICAjICAgZXhpc3RpbmcgYGRhdGFgIHZpYSBgdXBkZWVwYCkuXG4gICNcbiAgIyAgIGVudGl0eTogU3RyaW5nXG4gICMgICBjaGFuZ2VzOiBPYmplY3RcbiAgJ1VwZGF0ZUVudGl0eURhdGEnXG5cbiAgIyBQcm9ncmVzcyB0aGUgYHRpbWVsaW5lYCBvbiBgZW50aXR5YCBieSBgZGVsdGFgLlxuICAjXG4gICMgICB0aW1lbGluZTogU3RyaW5nXG4gICMgICBlbnRpdHk6IFN0cmluZ1xuICAjICAgZGVsdGE6IE51bWJlclxuICAnUHJvZ3Jlc3NFbnRpdHlUaW1lbGluZSdcblxuICAjIFByb2dyZXNzIHRoZSBzcGVjaWZpZWQgYHRpbWVsaW5lYCBieSBgZGVsdGFgIG9uIGFsbCBhdHRhY2hlZCBlbnRpdGllcy5cbiAgI1xuICAjICAgdGltZWxpbmU6IFN0cmluZ1xuICAjICAgZGVsdGE6IE51bWJlclxuICAnUHJvZ3Jlc3NUaW1lbGluZSdcbl1cblxubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zLnJlZHVjZSAoKGFjYywgYWN0aW9uVHlwZSkgLT5cbiAgYWNjW2FjdGlvblR5cGVdID0gYWN0aW9uVHlwZVxuICByZXR1cm4gYWNjKSwge30iLCJfID0gcmVxdWlyZSAnbG9kYXNoJ1xudXBkZWVwID0gcmVxdWlyZSAndXBkZWVwJ1xuayA9IHJlcXVpcmUgJy4uL0FjdGlvblR5cGVzJ1xuXG5tYXBBc3NpZ24gPSByZXF1aXJlICcuLi91dGlsL21hcEFzc2lnbidcbmFkZENoaWxkUmVkdWNlcnMgPSByZXF1aXJlICcuLi91dGlsL2FkZENoaWxkUmVkdWNlcnMnXG5cbmNsYW1wID0gcmVxdWlyZSAnLi4vdXRpbC9jbGFtcCdcbndyYXAgPSByZXF1aXJlICcuLi91dGlsL3dyYXAnXG5cbnRpbWVsaW5lc1JlZHVjZXIgPSByZXF1aXJlICcuL3RpbWVsaW5lcydcbmVudGl0aWVzUmVkdWNlciA9IHJlcXVpcmUgJy4vZW50aXRpZXMnXG5cbiMjI1xuc3RhdGUgOjo9IFN0YXRlXG5wcm9ncmVzc0luZm8gOjo9IHsgdGltZWxpbmVJZCAtPiB7ZGVsdGE6IEZsb2F0LCBlbnRpdGllczogW2VudGl0eUlkXX0gfSAjIGZvciBzcGVjaWZpYyBlbnRpdGllc1xuICAgICAgICAgICAgICAgfCB7IHRpbWVsaW5lSWQgLT4ge2RlbHRhOiBGbG9hdH0gfSAjIGZvciBhbGwgYXR0YWNoZWQgZW50aXRpZXNcbiMjI1xuYmF0Y2hQcm9ncmVzcyA9IChzdGF0ZSwgcHJvZ3Jlc3NJbmZvKSAtPlxuICBzdGF0ZV8gPSBtYXBBc3NpZ24gKF8uY2xvbmVEZWVwIHN0YXRlKSxcbiAgICAnZW50aXRpZXMuZGljdC4qLmF0dGFjaGVkVGltZWxpbmVzLioucHJvZ3Jlc3MnLFxuICAgIChvbGRQcm9ncmVzcywgW2VudGl0eU9iaiwgdGltZWxpbmVPYmpdLCBbZW50aXR5SWQsIHRpbWVsaW5lSWR4XSkgLT5cbiAgICAgIHRpbWVsaW5lTW9kZWwgPSBzdGF0ZS50aW1lbGluZXMuZGljdFt0aW1lbGluZU9iai50aW1lbGluZV1cblxuICAgICAgc2hvdWxkVXBkYXRlID1cbiAgICAgICAgaWYgcHJvZ3Jlc3NJbmZvW3RpbWVsaW5lT2JqLnRpbWVsaW5lXT8uZW50aXRpZXM/XG4gICAgICAgIHRoZW4gXy5jb250YWlucyBlbnRpdHlJZCwgcHJvZ3Jlc3NJbmZvW3RpbWVsaW5lT2JqLnRpbWVsaW5lXS5lbnRpdGllc1xuICAgICAgICBlbHNlIHByb2dyZXNzSW5mb1t0aW1lbGluZU9iai50aW1lbGluZV0/XG5cbiAgICAgIHByb2dyZXNzRGVsdGEgPVxuICAgICAgICBpZiBzaG91bGRVcGRhdGVcbiAgICAgICAgdGhlbiBwcm9ncmVzc0luZm9bdGltZWxpbmVPYmoudGltZWxpbmVdLmRlbHRhIC8gdGltZWxpbmVNb2RlbC5sZW5ndGhcbiAgICAgICAgZWxzZSAwXG5cbiAgICAgIG5ld1Byb2dyZXNzID1cbiAgICAgICAgaWYgdGltZWxpbmVNb2RlbC5zaG91bGRMb29wXG4gICAgICAgIHRoZW4gd3JhcCAwLCAxLCBvbGRQcm9ncmVzcyArIHByb2dyZXNzRGVsdGFcbiAgICAgICAgZWxzZSBjbGFtcCAwLCAxLCBvbGRQcm9ncmVzcyArIHByb2dyZXNzRGVsdGFcblxuICAgICAgcmV0dXJuIG5ld1Byb2dyZXNzXG5cbiAgc3RhdGVfXyA9IG1hcEFzc2lnbiBzdGF0ZV8sXG4gICAgJ2VudGl0aWVzLmRpY3QuKi5kYXRhJyxcbiAgICAocHJldmlvdXNEYXRhLCBbZW50aXR5T2JqXSwgW2VudGl0eUlkXSkgLT5cbiAgICAgIG9sZFRpbWVsaW5lcyA9IHN0YXRlLmVudGl0aWVzLmRpY3RbZW50aXR5SWRdLmF0dGFjaGVkVGltZWxpbmVzXG4gICAgICBuZXdUaW1lbGluZXMgPSBlbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXNcblxuICAgICAgcmVkdWNlVHJpZ2dlcnMgPSAoZGF0YSwgX18sIGkpIC0+XG4gICAgICAgIHRpbWVsaW5lT2JqID0gc3RhdGVfLnRpbWVsaW5lcy5kaWN0W25ld1RpbWVsaW5lc1tpXS50aW1lbGluZV1cbiAgICAgICAgbmV3UHJvZ3Jlc3MgPSBuZXdUaW1lbGluZXNbaV0ucHJvZ3Jlc3NcbiAgICAgICAgb2xkUHJvZ3Jlc3MgPSBvbGRUaW1lbGluZXNbaV0ucHJvZ3Jlc3NcblxuICAgICAgICBhcHBseVRoaXNUcmlnZ2VyID0gYXBwbHlUcmlnZ2VyIG5ld1Byb2dyZXNzLCBvbGRQcm9ncmVzc1xuICAgICAgICB0aW1lbGluZU9iai50cmlnZ2Vycy5yZWR1Y2UgYXBwbHlUaGlzVHJpZ2dlciwgZGF0YVxuXG4gICAgICBhcHBseVRyaWdnZXIgPSAobmV3UHJvZ3Jlc3MsIG9sZFByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgdHJpZ2dlcikgLT5cbiAgICAgICAgc2hvdWxkUGVyZm9ybVRyaWdnZXIgPSBzd2l0Y2hcbiAgICAgICAgICB3aGVuIF8uaXNOdW1iZXIgdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgKG9sZFByb2dyZXNzIDwgdHJpZ2dlci5wb3NpdGlvbiA8PSBuZXdQcm9ncmVzcykgb3JcbiAgICAgICAgICAgIChuZXdQcm9ncmVzcyA8IHRyaWdnZXIucG9zaXRpb24gPD0gb2xkUHJvZ3Jlc3MpXG4gICAgICAgICAgd2hlbiBfLmlzRnVuY3Rpb24gdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgdHJpZ2dlci5wb3NpdGlvbiBuZXdQcm9ncmVzcywgb2xkUHJvZ3Jlc3NcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4gJ0ludmFsaWQgdHJpZ2dlciBwb3NpdGlvbiBvbiB0cmlnZ2VyJywgdHJpZ2dlclxuICAgICAgICAgICAgZmFsc2VcblxuICAgICAgICBpZiBzaG91bGRQZXJmb3JtVHJpZ2dlclxuICAgICAgICB0aGVuIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLCAodHJpZ2dlci5hY3Rpb24gbmV3UHJvZ3Jlc3MsIGVudGl0eUlkLCBlbnRpdHlEYXRhKVxuICAgICAgICBlbHNlIGVudGl0eURhdGFcblxuICAgICAgIyBOT1RFOiBkb2VzIG5vdCByZXNwZWN0IHRyaWdnZXIgcG9zaXRpb24gYWNyb3NzIGVudGl0aWVzIC1cbiAgICAgICMgICBidXQgaWYgYE1hcHBpbmdgcyB0cnVseSBkbyBub3QgbW9kaWZ5IGFueXRoaW5nIGJ1dCBlbnRpdHkgZGF0YSxcbiAgICAgICMgICB0aGlzIHNob3VsZG4ndCBiZSBhIHByb2JsZW0uLi5cbiAgICAgICMgbmV3VGltZWxpbmVzLnJlZHVjZSByZWR1Y2VUcmlnZ2VycyxcbiAgICAgICMgICBzdGF0ZV8uZW50aXRpZXMuZGljdFtlbnRpdHlJZF0uZGF0YVxuXG4gICAgICB0cmlnZ2Vyc1RvSW52b2tlID0gXyBuZXdUaW1lbGluZXNcbiAgICAgICAgLm1hcCAoYXR0YWNoZWRUaW1lbGluZSwgaWR4KSAtPlxuICAgICAgICAgIG9sZFByb2dyZXNzID0gb2xkVGltZWxpbmVzW2lkeF0ucHJvZ3Jlc3NcbiAgICAgICAgICBuZXdQcm9ncmVzcyA9IG5ld1RpbWVsaW5lc1tpZHhdLnByb2dyZXNzXG5cbiAgICAgICAgICBzdGF0ZV8udGltZWxpbmVzLmRpY3RbYXR0YWNoZWRUaW1lbGluZS50aW1lbGluZV0udHJpZ2dlcnNcbiAgICAgICAgICAgIC5maWx0ZXIgKHRyaWdnZXIpIC0+XG4gICAgICAgICAgICAgIHN3aXRjaFxuICAgICAgICAgICAgICAgIHdoZW4gXy5pc051bWJlciB0cmlnZ2VyLnBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICAob2xkUHJvZ3Jlc3MgPCB0cmlnZ2VyLnBvc2l0aW9uIDw9IG5ld1Byb2dyZXNzKSBvclxuICAgICAgICAgICAgICAgICAgKG5ld1Byb2dyZXNzIDwgdHJpZ2dlci5wb3NpdGlvbiA8PSBvbGRQcm9ncmVzcylcbiAgICAgICAgICAgICAgICB3aGVuIF8uaXNGdW5jdGlvbiB0cmlnZ2VyLnBvc2l0aW9uXG4gICAgICAgICAgICAgICAgICB0cmlnZ2VyLnBvc2l0aW9uIG5ld1Byb2dyZXNzLCBvbGRQcm9ncmVzc1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiAnSW52YWxpZCB0cmlnZ2VyIHBvc2l0aW9uIG9uIHRyaWdnZXInLCB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgLm1hcCAodHJpZ2dlcikgLT5cbiAgICAgICAgICAgICAgdHJpZ2dlcjogdHJpZ2dlclxuICAgICAgICAgICAgICBvbGRQcm9ncmVzczogb2xkUHJvZ3Jlc3NcbiAgICAgICAgICAgICAgbmV3UHJvZ3Jlc3M6IG5ld1Byb2dyZXNzXG4gICAgICAgIC5yZWR1Y2UgKChwLCBlKSAtPiBBcnJheS5wcm90b3R5cGUuY29uY2F0IHAsIGUpLCBbXVxuXG4gICAgICBfIHRyaWdnZXJzVG9JbnZva2VcbiAgICAgICAgLnNvcnRCeU9yZGVyICh7dHJpZ2dlciwgb2xkUHJvZ3Jlc3MsIG5ld1Byb2dyZXNzfSkgLT5cbiAgICAgICAgICBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gXy5pc051bWJlciB0cmlnZ2VyLnBvc2l0aW9uXG4gICAgICAgICAgICAgIHNpZ24gPSAoeCkgLT4gaWYgeCA+IDAgdGhlbiAxIGVsc2UgaWYgeCA8IDAgdGhlbiAtMSBlbHNlIDBcbiAgICAgICAgICAgICAgdHJpZ2dlci5wb3NpdGlvbiAqIHNpZ24gKG5ld1Byb2dyZXNzIC0gb2xkUHJvZ3Jlc3MpXG4gICAgICAgICAgICAjIHdoZW4gXy5pc0Z1bmN0aW9uIHRyaWdnZXIucG9zaXRpb25cbiAgICAgICAgICAgICMgICAjIGZ1biBzdHVmZmZmZmYgbGV0J3MgZmluZCB0aGF0IGNyb3NzaW5nIHBvaW50IGkgZ3Vlc3M/XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAnSW52YWxpZCB0cmlnZ2VyIHBvc2l0aW9uIG9uIHRyaWdnZXI6ICcgKyB0cmlnZ2VyLnBvc2l0aW9uXG4gICAgICAgIC5yZWR1Y2UgKChkYXRhLCB7dHJpZ2dlciwgbmV3UHJvZ3Jlc3N9KSAtPlxuICAgICAgICAgIF8uYXNzaWduIHt9LCBkYXRhLCAodHJpZ2dlci5hY3Rpb24gbmV3UHJvZ3Jlc3MsIGVudGl0eUlkLCBkYXRhKSksXG4gICAgICAgICAgZW50aXR5T2JqLmRhdGFcblxuICBtYXBBc3NpZ24gc3RhdGVfXyxcbiAgICAnZW50aXRpZXMuZGljdC4qLmRhdGEnLFxuICAgIChwcmV2aW91c0RhdGEsIFtlbnRpdHlPYmpdLCBbZW50aXR5SWRdKSAtPlxuICAgICAgYXBwbHlNYXBwaW5nID0gKHByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgbWFwcGluZykgLT5cbiAgICAgICAgXy5hc3NpZ24ge30sIGVudGl0eURhdGEsXG4gICAgICAgICAgbWFwcGluZyBwcm9ncmVzcywgZW50aXR5SWQsIGVudGl0eURhdGFcblxuICAgICAgIyBmb3IgZXZlcnkgYXR0YWNoZWQgdGltZWxpbmUuLi5cbiAgICAgIHIgPSBlbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXMucmVkdWNlICgoZGF0YSwgYXR0YWNoZWRUaW1lbGluZSwgaWR4KSAtPlxuICAgICAgICAjIC4uLiBhcHBseSBldmVyeSBtYXBwaW5nLCB0aHJlYWRpbmcgdGhlIGBkYXRhYCB0aHJvdWdoXG4gICAgICAgIHRpbWVsaW5lID0gc3RhdGVfXy50aW1lbGluZXMuZGljdFthdHRhY2hlZFRpbWVsaW5lLnRpbWVsaW5lXVxuICAgICAgICB1cGRhdGVkRW50aXR5T2JqID0gc3RhdGVfXy5lbnRpdGllcy5kaWN0W2VudGl0eUlkXVxuICAgICAgICBuZXdQcm9ncmVzcyA9IHVwZGF0ZWRFbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXNbaWR4XS5wcm9ncmVzc1xuICAgICAgICB0aW1lbGluZS5tYXBwaW5ncy5yZWR1Y2UgKGFwcGx5TWFwcGluZyBuZXdQcm9ncmVzcyksIGRhdGEpLCBlbnRpdHlPYmouZGF0YVxuXG5cblxucmVkdWNlciA9IChzdGF0ZSA9IHt9LCBhY3Rpb24pIC0+XG4gIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgIHdoZW4gay5Qcm9ncmVzc1RpbWVsaW5lXG4gICAgICB7dGltZWxpbmUsIGRlbHRhfSA9IGFjdGlvbi5kYXRhXG5cbiAgICAgIHByb2dyZXNzSW5mbyA9IHt9XG4gICAgICBwcm9ncmVzc0luZm9bdGltZWxpbmVdID1cbiAgICAgICAgZGVsdGE6IGRlbHRhXG5cbiAgICAgIGJhdGNoUHJvZ3Jlc3Mgc3RhdGUsIHByb2dyZXNzSW5mb1xuXG5cbiAgICB3aGVuIGsuUHJvZ3Jlc3NFbnRpdHlUaW1lbGluZVxuICAgICAge2VudGl0eSwgdGltZWxpbmUsIGRlbHRhfSA9IGFjdGlvbi5kYXRhXG5cbiAgICAgIHByb2dyZXNzSW5mbyA9IHt9XG4gICAgICBwcm9ncmVzc0luZm9bdGltZWxpbmVdID1cbiAgICAgICAgZW50aXRpZXM6IFtlbnRpdHldXG4gICAgICAgIGRlbHRhOiBkZWx0YVxuICAgICAgYmF0Y2hQcm9ncmVzcyBzdGF0ZSwgcHJvZ3Jlc3NJbmZvXG5cblxuICAgIHdoZW4gay5BdHRhY2hFbnRpdHlUb1RpbWVsaW5lXG4gICAgICB7ZW50aXR5LCB0aW1lbGluZSwgcHJvZ3Jlc3N9ID0gYWN0aW9uLmRhdGFcblxuICAgICAgbWFwQXNzaWduIChfLmNsb25lRGVlcCBzdGF0ZSksXG4gICAgICAgIFwiZW50aXRpZXMuZGljdC4je2VudGl0eX0uYXR0YWNoZWRUaW1lbGluZXNcIixcbiAgICAgICAgKG9sZEF0dGFjaGVkVGltZWxpbmVzKSAtPlxuICAgICAgICAgIGNoZWNrVGltZWxpbmUgPSAodG1sbikgLT4gdG1sbi50aW1lbGluZSBpc250IHRpbWVsaW5lXG4gICAgICAgICAgaXNUaW1lbGluZUFscmVhZHlBdHRhY2hlZCA9IF8uYWxsIG9sZEF0dGFjaGVkVGltZWxpbmVzLCBjaGVja1RpbWVsaW5lXG4gICAgICAgICAgaWYgaXNUaW1lbGluZUFscmVhZHlBdHRhY2hlZFxuICAgICAgICAgICAgaWYgbm90IHByb2dyZXNzP1xuICAgICAgICAgICAgICBwcm9ncmVzcyA9IDBcbiAgICAgICAgICAgIG5ld0F0dGFjaGVkVGltZWxpbmUgPVxuICAgICAgICAgICAgICB0aW1lbGluZTogdGltZWxpbmVcbiAgICAgICAgICAgICAgcHJvZ3Jlc3M6IHByb2dyZXNzXG4gICAgICAgICAgICBbb2xkQXR0YWNoZWRUaW1lbGluZXMuLi4sIG5ld0F0dGFjaGVkVGltZWxpbmVdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgb2xkQXR0YWNoZWRUaW1lbGluZXNcblxuXG5cbiAgICBlbHNlIHN0YXRlXG5cblxubW9kdWxlLmV4cG9ydHMgPSBhZGRDaGlsZFJlZHVjZXJzIHJlZHVjZXIsXG4gICd0aW1lbGluZXMnOiB0aW1lbGluZXNSZWR1Y2VyXG4gICdlbnRpdGllcyc6IGVudGl0aWVzUmVkdWNlciIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG51cGRlZXAgPSByZXF1aXJlICd1cGRlZXAnXG5rID0gcmVxdWlyZSAnLi4vQWN0aW9uVHlwZXMnXG5tYXBBc3NpZ24gPSByZXF1aXJlICcuLi91dGlsL21hcEFzc2lnbidcbmFkZENoaWxkUmVkdWNlcnMgPSByZXF1aXJlICcuLi91dGlsL2FkZENoaWxkUmVkdWNlcnMnXG5cbm1ha2VOZXdFbnRpdHkgPSAoaW5pdGlhbERhdGEgPSB7fSkgLT5cbiAgYXR0YWNoZWRUaW1lbGluZXM6IFtdXG4gIGRhdGE6IGluaXRpYWxEYXRhXG5cbnJlZHVjZXIgPSAoc3RhdGUgPSB7ZGljdDoge30sIF9zcGF3bmVkQ291bnQ6IDB9LCBhY3Rpb24pIC0+XG4gIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgIHdoZW4gay5BZGRFbnRpdHlcbiAgICAgICMgVE9ETzogY2xlYW5lciB3YXkgdG8gZW5hYmxlIG9wdGlvbmFsIGRhdGFcbiAgICAgIGlmIGFjdGlvbi5kYXRhP1xuICAgICAgICB7bmFtZSwgaW5pdGlhbERhdGF9ID0gYWN0aW9uLmRhdGFcblxuICAgICAgaWQgPSBcImVudGl0eS0je3N0YXRlLl9zcGF3bmVkQ291bnR9XCJcblxuICAgICAgY2hhbmdlcyA9XG4gICAgICAgIGRpY3Q6IHt9XG4gICAgICAgIF9zcGF3bmVkQ291bnQ6IHN0YXRlLl9zcGF3bmVkQ291bnQgKyAxXG4gICAgICBjaGFuZ2VzLmRpY3RbaWRdID0gbWFrZU5ld0VudGl0eSBpbml0aWFsRGF0YVxuXG4gICAgICBpZiBuYW1lP1xuICAgICAgICBjaGFuZ2VzLmRpY3RbaWRdLm5hbWUgPSBuYW1lXG5cbiAgICAgIHVwZGVlcCBjaGFuZ2VzLCBzdGF0ZVxuXG4gICAgd2hlbiBrLlVwZGF0ZUVudGl0eURhdGFcbiAgICAgIHtlbnRpdHksIGNoYW5nZXN9ID0gYWN0aW9uLmRhdGFcblxuICAgICAgaWYgc3RhdGUuZGljdFtlbnRpdHldP1xuICAgICAgICBzdGF0ZUNoYW5nZXMgPSBkaWN0OiB7fVxuICAgICAgICBzdGF0ZUNoYW5nZXMuZGljdFtlbnRpdHldID1cbiAgICAgICAgICBkYXRhOiBjaGFuZ2VzXG5cbiAgICAgICAgdXBkZWVwIHN0YXRlQ2hhbmdlcywgc3RhdGVcblxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIG5vbi1leGlzdGFudCBlbnRpdHkgI3tlbnRpdHl9LlwiXG5cbiAgICBlbHNlIHN0YXRlXG5cblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2VyIiwiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbnVwZGVlcCA9IHJlcXVpcmUgJ3VwZGVlcCdcbmsgPSByZXF1aXJlICcuLi9BY3Rpb25UeXBlcydcbm1hcEFzc2lnbiA9IHJlcXVpcmUgJy4uL3V0aWwvbWFwQXNzaWduJ1xuYWRkQ2hpbGRSZWR1Y2VycyA9IHJlcXVpcmUgJy4uL3V0aWwvYWRkQ2hpbGRSZWR1Y2VycydcblxucmVkdWNlciA9IChzdGF0ZSA9IHtkaWN0OiB7fSwgX3NwYXduZWRDb3VudDogMH0sIGFjdGlvbikgLT5cbiAgc3dpdGNoIGFjdGlvbi50eXBlXG4gICAgd2hlbiBrLkFkZFRpbWVsaW5lXG4gICAgICB7bGVuZ3RoLCBzaG91bGRMb29wfSA9IF8uZGVmYXVsdHMgYWN0aW9uLmRhdGEsXG4gICAgICAgIGxlbmd0aDogMVxuICAgICAgICBzaG91bGRMb29wOiBmYWxzZVxuXG4gICAgICBjaGFuZ2VzID1cbiAgICAgICAgZGljdDoge31cbiAgICAgICAgX3NwYXduZWRDb3VudDogc3RhdGUuX3NwYXduZWRDb3VudCArIDFcbiAgICAgICMgbmV3IGVudGl0eVxuICAgICAgY2hhbmdlcy5kaWN0W1widGltZWxpbmUtI3tzdGF0ZS5fc3Bhd25lZENvdW50fVwiXSA9XG4gICAgICAgIGxlbmd0aDogbGVuZ3RoXG4gICAgICAgIHNob3VsZExvb3A6IHNob3VsZExvb3BcbiAgICAgICAgdHJpZ2dlcnM6IFtdXG4gICAgICAgIG1hcHBpbmdzOiBbXVxuXG4gICAgICB1cGRlZXAgY2hhbmdlcywgc3RhdGVcblxuXG4gICAgd2hlbiBrLkFkZFRyaWdnZXJcbiAgICAgIHt0aW1lbGluZSwgcG9zaXRpb24sIGFjdGlvbn0gPSBhY3Rpb24uZGF0YVxuICAgICAgbWFwQXNzaWduIChfLmNsb25lRGVlcCBzdGF0ZSksXG4gICAgICAgIFwiZGljdC4je3RpbWVsaW5lfS50cmlnZ2Vyc1wiLFxuICAgICAgICAob2xkVHJpZ2dlcnMpIC0+IFtvbGRUcmlnZ2Vycy4uLiwge3Bvc2l0aW9uOiBwb3NpdGlvbiwgYWN0aW9uOiBhY3Rpb259XVxuXG5cbiAgICB3aGVuIGsuQWRkTWFwcGluZ1xuICAgICAge3RpbWVsaW5lLCBtYXBwaW5nfSA9IGFjdGlvbi5kYXRhXG4gICAgICBtYXBBc3NpZ24gKF8uY2xvbmVEZWVwIHN0YXRlKSxcbiAgICAgICAgXCJkaWN0LiN7dGltZWxpbmV9Lm1hcHBpbmdzXCIsXG4gICAgICAgIChvbGRNYXBwaW5ncykgLT4gW29sZE1hcHBpbmdzLi4uLCBtYXBwaW5nXVxuXG5cbiAgICB3aGVuIGsuU2V0VGltZWxpbmVMb29wXG4gICAgICB7dGltZWxpbmUsIHNob3VsZExvb3B9ID0gYWN0aW9uLmRhdGFcbiAgICAgIG1hcEFzc2lnbiAoXy5jbG9uZURlZXAgc3RhdGUpLFxuICAgICAgICBcImRpY3QuI3t0aW1lbGluZX0uc2hvdWxkTG9vcFwiLFxuICAgICAgICAoKSAtPiBzaG91bGRMb29wXG5cbiAgICBlbHNlIHN0YXRlXG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlciIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG5cbm1vZHVsZS5leHBvcnRzID0gYWRkQ2hpbGRSZWR1Y2VycyA9IChiYXNlUmVkdWNlciwgY2hpbGRSZWR1Y2VycyA9IHt9KSAtPlxuICAoc3RhdGUgPSB7fSwgYWN0aW9uKSAtPlxuICAgICMgYGFjY2Agd2lsbCBob2xkIG91ciBzdGF0ZSBhcyBpdCBnZXRzIHVwZGF0ZWQgYnkgZWFjaCByZWR1Y2VyXG4gICAgIyBga2V5YCBpcyB0aGUga2V5IG9mIHRoZSByZWR1Y2VyLCBhcyB3ZWxsIGFzIHRoZSBzdWJzdGF0ZSdzIHBhdGhcbiAgICByZWR1Y2VPdmVyQ2hpbGRyZW4gPSAoYWNjLCBrZXkpIC0+XG4gICAgICBjaGFuZ2VkU3RhdGUgPSB7fVxuICAgICAgY2hhbmdlZFN0YXRlW2tleV0gPSBjaGlsZFJlZHVjZXJzW2tleV0gYWNjW2tleV0sIGFjdGlvblxuXG4gICAgICBfLmFzc2lnbiB7fSwgYWNjLCBjaGFuZ2VkU3RhdGVcblxuICAgICMgdGhpcyB3YXkgbWlnaHQgYmUgZmFzdGVyXG4gICAgIyAgIF8uYXNzaWduIGFjYywgY2hhbmdlZFN0YXRlXG4gICAgIyBzdGF0ZSA9IF8uYXNzaWduIHt9LCBzdGF0ZVxuXG4gICAgcmVzdWx0ID0gT2JqZWN0LmtleXMgY2hpbGRSZWR1Y2Vyc1xuICAgICAgLnJlZHVjZSByZWR1Y2VPdmVyQ2hpbGRyZW4sIHN0YXRlXG5cbiAgICByZXN1bHQgPSBiYXNlUmVkdWNlciByZXN1bHQsIGFjdGlvblxuXG4gICAgIyBmcmVlemUgdGhpcyB0byBlbnN1cmUgd2UncmUgbm90IGFjY2lkZW50YWxseSBtdXRhdGluZ1xuICAgIE9iamVjdC5mcmVlemUgcmVzdWx0XG4gICAgcmV0dXJuIHJlc3VsdCIsIm1vZHVsZS5leHBvcnRzID0gY2xhbXAgPSAobG93LCBoaWdoLCBuKSAtPlxuICBmbiA9IChuKSAtPiBNYXRoLm1pbiBoaWdoLCAoTWF0aC5tYXggbG93LCBuKVxuXG4gIGlmIG4/XG4gIHRoZW4gZm4gblxuICBlbHNlIGZuIiwidHJhbnNsYXRlM2QgPSAoeCwgeSwgeiwgZWxlbWVudCkgLT5cbiAgWyctd2Via2l0LScsICctbW96LScsICctby0nLCAnJ10uZm9yRWFjaCAocHJlZml4KSAtPlxuICAgIGVsZW1lbnQuc3R5bGVbXCIje3ByZWZpeH10cmFuc2Zvcm1cIl0gPSBcInRyYW5zbGF0ZTNkKCN7eH0sICN7eX0sICN7en0pXCJcblxub2Zmc2V0ID0gKGxlZnQsIHRvcCwgZWxlbWVudCkgLT5cbiAgZWxlbWVudC5sZWZ0ID0gbGVmdFxuICBlbGVtZW50LnRvcCA9IHRvcFxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgJ3RyYW5zbGF0ZTNkJzogdHJhbnNsYXRlM2QiLCIjIFRPRE86IFNob3VsZCB3ZSBiZSB1c2luZyB1cGRlZXAgaW5zdGVhZD9cbiMgaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YW50aWFsL3VwZGVlcFxuIyBNYXBwaW5nIG92ZXIgZGVlcCBvYmplY3RzIC8gYXJyYXlzIHNlZW1zIHByZXR0eSBjdW1iZXJzb21lIGNvbXBhcmVkIHRvXG4jICAgYG1hcEFzc2lnbigpYCdzIHdpbGRjYXJkIHBhcmFkaWdtOyBidXQgdGhlIHdpbGRjYXJkcyBtaWdodCBiZSBsZXNzIGVmZmljaWVudFxuIyAgIHRoYW4gYHVwZGVlcGAncyBgbWFwKClgLlxuIyBgdXBkZWVwYCBhbHNvIHNlZW1zIGJldHRlciBmb3IgZWRpdGluZyBtdWx0aXBsZSBwYXRocy5cbiNcbiMgSSdtIHVzaW5nIGEgbWl4IGZvciBub3cuIGBtYXBBc3NpZ24oKWAgc2VlbXMgcHJldHR5IGNvbnZlbmllbnQgd2hlbiBlZGl0aW5nIGFcbiMgICBzaW5nbGUgdmFsdWUgcGF0aC5cblxuIyMjXG5VdGlsaXR5IGZvciBtYXBwaW5nIGBPYmplY3QuYXNzaWduKClgIG92ZXIgYXJyYXlzIGFuZCBvYmplY3RzLlxuXG5AcGFyYW0gb2JqIFtPYmplY3RdIFNvdXJjZSBvYmplY3QgdG8gbWFwIG92ZXIgYW5kIG11dGF0ZS5cbkBwYXJhbSBwYXRoIFtTdHJpbmddIFByb3BlcnR5IHBhdGggZm9yIG1hcHBpbmc7IGNhbiBpbmNsdWRlIHByb3BlcnR5IG5hbWVzLFxuICBhcnJheSBpbmRpY2VzIChhcyBudW1lcmFscyksIGFuZCB3aWxkY2FyZHMgKGAqYCksIGRlbGltaXRlZCBieSBgLmAuXG5AcGFyYW0gbWFrZVZhbHVlIFtGdW5jdGlvbl0gRnVuY3Rpb24gdG8gZGV0ZXJtaW5lIG5ldyB2YWx1ZSB0byBiZSBwbGFjZWQgYXRcbiAgYHBhdGhgLiBQYXJhbWV0ZXJzIGFyZTpcbiAgICB2YWx1ZSAtIFRoZSBjdXJyZW50IHZhbHVlIGF0IGBwYXRoYCwgb3IgYHVuZGVmaW5lZGAgaWYgcGF0aCBkb2Vzbid0IGV4aXN0XG4gICAgICB5ZXQuXG4gICAgd2lsZGNhcmRWYWx1ZXMgLSBBbiBhcnJheSBvZiB2YWx1ZXMgYXQgZWFjaCBzdWJwYXRoIGVuZGluZyBpbiBhIHdpbGRjYXJkLFxuICAgICAgYmFzZWQgb24gdGhlIGN1cnJlbnQgaXRlcmF0aW9uLlxuICAgIHdpbGRjYXJkcyAtIEFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIG9yIGluZGljZXMgb2YgdGhlIHdpbGRjYXJkcywgYmFzZWRcbiAgICAgIG9uIHRoZSBjdXJyZW50IGl0ZXJhdGlvbi5cblxuQGV4YW1wbGVcblxuICAgIG9iaiA9XG4gICAgICBhOiAxXG4gICAgICBiOiBbXG4gICAgICAgIHtjOiB7cDE6IDF9fVxuICAgICAgICB7Yzoge3AyOiAyLCBwMzogM319XG4gICAgICBdXG5cbiAgICByZXN1bHQgPVxuICAgICAgbWFwQXNzaWduIG9iaiwgJ2IuKi5jLionLCAodmFsdWUsIHdpbGRjYXJkc1ZhbHVlcywgd2lsZGNhcmRzKSAtPlxuICAgICAgICBjb25zb2xlLmxvZyAnPT09PT09PT09PSdcbiAgICAgICAgY29uc29sZS5sb2cgJ3ZhbHVlOicsIHZhbHVlXG4gICAgICAgIGNvbnNvbGUubG9nICd3aWxkY2FyZFZhbHVlczonLCB3aWxkY2FyZFZhbHVlc1xuICAgICAgICBjb25zb2xlLmxvZyAnd2lsZGNhcmRzOicsIHdpbGRjYXJkc1xuICAgICAgICByZXR1cm4gdmFsdWUgKyAxXG5cbiAgICAjIE91dHB1dDpcbiAgICAjID09PT09PT09PT1cbiAgICAjIHZhbHVlOiAxXG4gICAgIyB3aWxkY2FyZFZhbHVlczogW3tjOiB7cDE6IDF9fSwgMV1cbiAgICAjIHdpbGRjYXJkczogWzAsICdwMSddXG4gICAgIyA9PT09PT09PT09XG4gICAgIyB2YWx1ZTogMlxuICAgICMgd2lsZGNhcmRWYWx1ZXM6IFt7Yzoge3AyOiAyLCBwMzogM319LCAyXVxuICAgICMgd2lsZGNhcmRzOiBbMCwgJ3AyJ11cbiAgICAjID09PT09PT09PT1cbiAgICAjIHZhbHVlOiAzXG4gICAgIyB3aWxkY2FyZFZhbHVlczogW3tjOiB7cDI6IDIsIHAzOiAzfX0sIDNdXG4gICAgIyB3aWxkY2FyZHM6IFsxLCAncDMnXVxuXG5cbiAgICAjIHRydWVcbiAgICByZXN1bHQgPT1cbiAgICAgIGE6IDFcbiAgICAgIGI6IFtcbiAgICAgICAge2M6IHtwMTogMn19XG4gICAgICAgIHtjOiB7cDI6IDMsIHAzOiA0fX1cbiAgICAgIF1cblxuIyMjXG5cbm1vZHVsZS5leHBvcnRzID0gbWFwQXNzaWduID0gKG9iaiwgcGF0aFN0cmluZywgbWFrZVZhbHVlKSAtPlxuICByID0gKHBhdGgsIG5vZGUsIHdpbGRjYXJkVmFsdWVzID0gW10sIHdpbGRjYXJkcyA9IFtdKSAtPlxuICAgIGlmIHBhdGgubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiBub2RlXG5cbiAgICBpZiBub3Qgbm9kZT9cbiAgICAgICMgcGFzcyB0aHJvdWdoXG4gICAgICByZXR1cm4ge1xuICAgICAgICBub2RlOiBub2RlXG4gICAgICAgIHdpbGRjYXJkVmFsdWVzOiB3aWxkY2FyZFZhbHVlc1xuICAgICAgICB3aWxkY2FyZHM6IHdpbGRjYXJkc1xuICAgICAgfVxuXG5cbiAgICBbZmlyc3QsIHRhaWwuLi5dID0gcGF0aFxuICAgIFtuZXh0LCBfLi4uXSA9IHRhaWxcblxuICAgIHN3aXRjaCBmaXJzdFxuICAgICAgIyBXaWxkY2FyZCB0YWdcbiAgICAgIHdoZW4gJyonXG4gICAgICAgIGtleXMgPVxuICAgICAgICAgIGlmIG5vZGUuY29uc3RydWN0b3IgaXMgQXJyYXlcbiAgICAgICAgICB0aGVuIFswLi4ubm9kZS5sZW5ndGhdXG4gICAgICAgICAgZWxzZSBPYmplY3Qua2V5cyBub2RlXG5cblxuICAgICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgICBlbG0gPSBub2RlW2tleV1cbiAgICAgICAgICBuZXdXaWxkY2FyZFZhbHVlcyA9IFt3aWxkY2FyZFZhbHVlcy4uLiwgZWxtXVxuICAgICAgICAgIG5ld1dpbGRjYXJkcyA9IFt3aWxkY2FyZHMuLi4sIGtleV1cblxuICAgICAgICAgIGlmIG5leHQ/XG4gICAgICAgICAgICAjIHdlIGFyZW4ndCBhc3NpZ25pbmcgeWV0OyBqdXN0IHJlY3VyXG4gICAgICAgICAgICByIHRhaWwsIGVsbSwgbmV3V2lsZGNhcmRWYWx1ZXMsIG5ld1dpbGRjYXJkc1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgbm8gbW9yZSB0YWdzOyBzbyBnbyBhaGVhZCBhbmQgYXNzaWduXG4gICAgICAgICAgICBub2RlW2tleV0gPSBtYWtlVmFsdWUgZWxtLCBuZXdXaWxkY2FyZFZhbHVlcywgbmV3V2lsZGNhcmRzXG5cbiAgICAgICMgTm9ybWFsIHRhZ1xuICAgICAgZWxzZVxuICAgICAgICBrZXkgPVxuICAgICAgICAgIGlmIG5vZGUuY29uc3RydWN0b3IgaXMgQXJyYXlcbiAgICAgICAgICB0aGVuIGRvIC0+XG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgcGFyc2VJbnQgZWxtXG4gICAgICAgICAgICBjYXRjaCBlXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAnQXR0ZW1wdGVkIHRvIGluZGV4IGludG8gYW4gYXJyYXkgd2l0aCBhIG5vbi1pbnRlZ2VyIHZhbHVlLidcbiAgICAgICAgICBlbHNlIGZpcnN0XG5cbiAgICAgICAgaWYgbmV4dD9cbiAgICAgICAgICAjIHdlIGFyZW4ndCBhc3NpZ25pbmcgeWV0OyBqdXN0IHJlY3VyXG5cbiAgICAgICAgICAjIGdldCBlbGVtZW50LCBtYWtpbmcgbmV3IG5vZGUgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgZWxtID1cbiAgICAgICAgICAgIGlmIG5vZGVba2V5XT9cbiAgICAgICAgICAgIHRoZW4gbm9kZVtrZXldXG4gICAgICAgICAgICBlbHNlIGRvIC0+XG4gICAgICAgICAgICAgICMgaXMgYG5leHRgIGZvcm1hdHRlZCBhcyBhIG51bWJlcixcbiAgICAgICAgICAgICAgIyAgIGFuZCBzbyByZXF1aXJpbmcgYW4gYXJyYXk/XG4gICAgICAgICAgICAgIG5vZGVba2V5XSA9XG4gICAgICAgICAgICAgICAgIyAobm90IChpcyBub3QgYSBudW1iZXIpID09IGlzIGEgbnVtYmVyKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBpc05hTiBuZXh0XG4gICAgICAgICAgICAgICAgdGhlbiBbXVxuICAgICAgICAgICAgICAgIGVsc2Uge31cbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVba2V5XVxuXG4gICAgICAgICAgciB0YWlsLCBlbG0sIHdpbGRjYXJkVmFsdWVzLCB3aWxkY2FyZHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICMgbm8gbW9yZSB0YWdzOyBzbyBnbyBhaGVhZCBhbmQgYXNzaWduXG4gICAgICAgICAgbm9kZVtrZXldID0gbWFrZVZhbHVlIG5vZGVba2V5XSwgd2lsZGNhcmRWYWx1ZXMsIHdpbGRjYXJkc1xuXG4gIHIgKHBhdGhTdHJpbmcuc3BsaXQgJy4nKSwgb2JqXG4gIHJldHVybiBvYmoiLCIjIFRPRE86IHNob3VsZCBwcm9iYWJseSB0ZXN0IHRoaXNcbm1vZHVsZS5leHBvcnRzID0gd3JhcCA9IChsb3csIGhpZ2gsIG4pIC0+XG4gIGZuID0gKG4pIC0+XG4gICAgcmFuZ2UgPSBoaWdoIC0gbG93XG4gICAgdCA9IG4gLSBsb3dcbiAgICB3aGlsZSB0IDwgMFxuICAgICAgdCArPSByYW5nZVxuICAgIHQgPSB0ICUgcmFuZ2VcbiAgICByZXR1cm4gdCArIGxvd1xuXG4gIGlmIG4/XG4gIHRoZW4gZm4gblxuICBlbHNlIGZuIl19
