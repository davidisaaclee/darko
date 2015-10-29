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
  #
  #   entity: String
  #   timeline: String
  #   [progress: Number = 0]
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