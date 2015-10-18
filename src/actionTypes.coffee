module.exports =
  ###
  Progress the `timelines` on `entity` by `delta`.

    timelines: [String]
    entity: String
    delta: Number
  ###
  ProgressEntityTimeline: 'ProgressEntityTimeline'

  ###
  Adds a new trigger to `timeline` with specified `position` and `action`. The
    `action` function expects the id of the invoking entity as an argument.

    timeline: String
    position: Float
    action: Function
  ###
  AddTrigger: 'AddTrigger'

  ###
  Adds a new `mapping` function to a `timeline`. The `mapping` function expects
    three arguments: the timeline's updated progress, the timeline's previous
    progress, and the id of the invoking entity.

    timeline: String
    mapping: Function
  ###
  AddMapping: 'AddMapping'

  ###
  Adds a new entity.
  ###
  AddEntity: 'AddEntity'

  ###
  Adds a new timeline with the provided `length`.

    length: Number
  ###
  AddTimeline: 'AddTimeline'

  ###
  Attaches the `entity` with the provided id to the `timeline` with the
    provided timeline id.

    entity: String
    timeline: String
  ###
  AttachEntityToTimeline: 'AttachEntityToTimeline'

  ###
  Updates `entity`'s `data` property with `changes` (which are applied to the
    existing `data` via `updeep`).

    entity: String
    changes: Object
  ###
  UpdateEntityData: 'UpdateEntityData'