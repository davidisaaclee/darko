actions = [
  # Adds a new entity, with an optional initial `data` field and optional `name`
  #   field.
  #
  #   [id: String]          # if not supplied, will auto-generate
  #   [name: String]
  #   initialData: Object
  'AddEntity'

  # Adds the specified timeline to the database.
  #
  #   [id: String]
  #   timeline: Timeline
  'AddTimeline'

  # Set a timeline to loop or not loop.
  #
  #   timeline: String
  #   shouldLoop: Boolean
  'SetTimelineLoop'

  # Attaches the `entity` with the provided id to the `timeline` with the
  #   provided timeline id.
  # Provides support for optionally precise placement of timeline into the
  #   `Entity's` `attachedTimelines` stack. The `stackPosition` parameter
  #   indicates the index at which to insert the new timeline relation. A
  #   `stackPosition` of 0 means that the relation will be pushed onto the head
  #   (top) of the stack.
  #
  #   entity: String
  #   timeline: String
  #   [progress: Number = 0]
  #   [stackPosition: Number = 0]
  'AttachEntityToTimeline'

  # TODO
  # Rearrange an `Entity`'s attached timeline stack.
  #
  #   entity: String
  #   timeline: String
  #   moveToIndex: Integer
  'RearrangeAttachedTimelines'

  # Sets the `localData` property of the entity with id `entity` to `localData`.
  #
  #   entity: String
  #   localData: Object
  'SetEntityLocalData'

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