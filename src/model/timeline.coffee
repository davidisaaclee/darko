Model = require './model'

###
# Represents a timeline model.
# These timeline models are referenced by entities; so they only hold
#   information applicable to any attached entity - such as triggers,
#   mappings, and timeline length.
Timeline ::=
  # Progress along the timeline is scaled by its `length`.
  # If timeline A has 2x the length of timeline B, it should take twice as long
  #   to progress along A as to progress along B.
  length: Number

  # A list of this timeline's triggers. The order of this list designates the
  #   order in which the triggers at the same position will be called.
  triggers: [Trigger]

  # A list of this timeline's mappings. The order of this list designates the
  #   order in which the mappings are invoked.
  # These mappings are called on an `Entity` every time the `Entity` progresses
  #   along the timeline.
  mappings: [Mapping]
###
class Timeline extends Model
  constructor: (@length = 1, @triggers = [], @mappings = []) ->