_ = require 'lodash'

###
Virtual method table implementation for dynamic dispatch.

  selector: Function - When a function is called from the vtable, the `self`
    argument (conventionally, the first argument) is provided to `selector` as
    an argument. The result is a key which is used to index into `extensions`.
    If `extensions` associates the key with an extension type, the extension's
    method is invoked.
  base: Object - The base prototype for dispatch; this prototype's
    implementation is invoked when `selector` does not produce a registered
    extension key.
  extensions: { String -> Object } - Maps keys to extension prototypes.
###
makeVTable = (selector, base, extensions) ->
  extensionKeys = _.keys extensions

  _ base
    .methods()
    .map (key) ->
      result = [key]
      result.push (self, args...) ->
        ext = extensions[selector self]
        if ext?[key]?
        then ext[key] self, args...
        else base[key] self, args...
      return result
    .zipObject()
    .value()

module.exports = makeVTable