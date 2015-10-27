###
# The main state of an interactive scene.
Scene ::=
  timelines:
    # Dictionary mapping unique timeline ID to a timeline model.
    # These timeline models are referenced by entities; so they only hold
    #   information applicable to any attached entity - such as triggers,
    #   mappings, and timeline length.
    dict: { id -> Timeline }

    # Internal; number of times timelines have been spawned.
    # Used for assigning unique timeline IDs.
    _spawnedCount: Number

  entities:
    # Dictionary mapping unique entity ID to an entity model.
    dict: { id -> Entity }

    # Internal; number of times entities have been spawned.
    # Used for assigning unique entity IDs.
    _spawnedCount: Number


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


# An object which can be attached to timelines.
# Holds an arbitrary `data` object, and a list of timelines which modify the
#   `data` object.
Entity ::=
  # A list of timelines which this `Entity` is attached to. The order of this
  #   list designates the order in which triggers / mappings are invoked.
  attachedTimelines: [EntityTimelineRelation]

  # An application-specific container for arbitrary data. Triggers and mappings
  #   serve to modify this object.
  data: Object


# A one-shot modification of an `Entity`'s `data` field.
Trigger ::=
  # Describes when to invoke this `Trigger`.
  # When `position` is a float, the trigger's `action` is performed when
  #   `progress` crosses that float, and the resulting data is merged into the
  #   invoking entity's `data` field.
  # When `position` is a function, it is called on every progress update,
  #   providing as arguments `newProgress, oldProgress`. If the function returns
  #   `true`, the trigger's `action` is performed.
  position: Float | Function

  # A function describing a modification to an attached `Entity`'s `data` field,
  #   called once when `position` is "satisfied".
  action: Mapping


# A function for mapping a `Timeline`'s progress to an entity's `data` field.
Mapping ::= (progress: Float, entityId: String, entityData: Object) -> Object
  progress - The `Timeline`'s most recent progress value.
  entityId - The invoking entity's ID.
  entityData - The invoking entity's most recent `data` field.
  returns: An object of sparse changes for the invoking entity's `data` field.


# Describes an attachment of an `Entity` to a `Timeline`.
EntityTimelineRelation ::=
  # The attached `Timeline`'s unique ID.
  timeline: String

  # The progress along the attached `Timeline`: a number between 0 and 1.
  progress: Float
###


module.exports =
  k: require './ActionTypes'
  reducer: require './reducers/base'