actions = [
  # Adds a new trigger to `timeline` with specified `position` and `action`. The
  #   `action` function expects the id of the invoking entity as an argument.
  #
  #   timeline: String
  #   position: Float
  #   action: Function
  'AddTrigger'

  # Adds a new `mapping` function to a `timeline`. A `mapping` function modifies
  #   an entity's `data` field, based on an attached `timeline`'s progress.
  # The `mapping` function expects four arguments:
  #   progress: Float - the timeline's updated progress
  #   entity: the id of the invoking entity
  #   data: the current `data` field of the invoking entity
  # The `mapping` function should return an object of changes to the existing
  #   `data` field.
  #
  #  timeline: String
  #  mapping: Function
  'AddMapping'

  # Adds a new entity, with an optional initial `data` field and optional `name`
  #   field.
  #
  #   [id: String]        # if not supplied, will auto-generate
  #   initialData: Object
  #   name: String
  'AddEntity'

  # Adds a new timeline with the provided `length`, and optionally whether the
  #   timeline `shouldLoop`.
  #
  #   [id: String]        # if not supplied, will auto-generate
  #   length: Number
  #   shouldLoop: Boolean # TODO: Does it make sense to have this loop parameter?
  #                       #       Seems like it should just remain an action.
  'AddTimeline'

  # Set a timeline to loop or not loop.
  #
  #   timeline: String
  #   shouldLoop: Boolean
  'SetTimelineLoop'

  # Attaches the `entity` with the provided id to the `timeline` with the
  #   provided timeline id.
  #
  #   entity: String
  #   timeline: String
  'AttachEntityToTimeline'

  # Updates `entity`'s `data` property with `changes` (which are applied to the
  #   existing `data` via `updeep`).
  #
  #   entity: String
  #   changes: Object
  'UpdateEntityData'

  # Progress the `timeline` on `entity` by `delta`.
  #
  #   timeline: String
  #   entity: String
  #   delta: Number
  'ProgressEntityTimeline'

  # Progress the specified `timeline` by `delta` on all attached entities.
  #
  #   timeline: String
  #   delta: Number
  'ProgressTimeline'
]

module.exports = actions.reduce ((acc, actionType) ->
  acc[actionType] = actionType
  return acc), {}