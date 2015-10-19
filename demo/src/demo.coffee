_ = require 'lodash'
redux = require 'redux'
k = require '../../src/ActionTypes'
reducer = require '../../src/reducers/base'

{translate3d, offset} = require '../../src/util/cssHelpers'

wrap = require '../../src/util/wrap'

container = document.getElementById 'container'
canvas = document.createElement 'canvas'
canvas.width = container.offsetWidth
canvas.height = container.offsetHeight
container.appendChild canvas


update = (state, dispatch) ->
  (Object.keys state.entities.dict).forEach (key) ->
    if state.entities.dict[key].attachedTimelines.length is 0
      dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: key
          timeline: 'timeline-0'

  draw (canvas.getContext '2d'), state.entities


draw = (ctx, entities) ->
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath()

  getPosition = (entity) ->
    if entity?
      p = entities.dict[entity].data.position
      x: p.x * ctx.canvas.width
      y: p.y * ctx.canvas.height
    else entity

  Object.keys entities.dict
    .forEach (key, idx, arr) ->
      pos = getPosition key
      ctx.lineTo pos.x, pos.y
  ctx.closePath()
  ctx.strokeStyle = 'white'
  ctx.stroke()

  Object.keys entities.dict
    .forEach (key, idx, arr) ->
      pos = getPosition key
      ctx.beginPath()
      ctx.ellipse pos.x, pos.y, 10, 10, 45 * Math.PI/180, 0, 2 * Math.PI
      ctx.closePath()
      ctx.fillStyle = entities.dict[key].data.strokeColor
      ctx.strokeStyle = null
      ctx.fill()



diffKeys = (previous, current) ->
  added: (Object.keys current).filter (key) -> not previous[key]?
  removed: (Object.keys previous).filter (key) -> not current[key]?

setup = () ->
  store = redux.createStore reducer

  setupTimelines store.dispatch
  setupInteractions store.dispatch, store

  store.subscribe () ->
    update store.getState(), store.dispatch

setupTimelines = (dispatch) ->
  dispatch
    type: k.AddTimeline
    data:
      length: 1
      shouldLoop: true

  dispatch
    type: k.AddMapping
    data:
      timeline: 'timeline-0'
      mapping: (progress, entityId, entityData) ->
        _.assign {}, entityData,
          position:
            x: 0.5 * ((Math.sin (progress * (75 / Math.PI))) + 1)
            y: 0.5 * ((Math.sin (progress * (50 / Math.PI))) + 1)

  dispatch
    type: k.AddTrigger
    data:
      timeline: 'timeline-0'
      position: 0.5
      action: (progress, entityId, entityData) ->
        _.assign {}, entityData,
          strokeColor: randomColor()

setupInteractions = (dispatch, store) ->
  addEntityButton = document.getElementById 'add-entity'
  addEntityButton.addEventListener 'click', () ->
    dispatch
      type: k.AddEntity
      data:
        initialData:
          strokeColor: 'black'
          position:
            x: 0
            y: 0

  timelineSlider = document.getElementById 'timeline-slider'
  getTimelineValue = () -> timelineSlider.value / 100

  previousSliderValue = getTimelineValue()
  progressTimeline = () ->
    v = getTimelineValue()
    Object.keys store.getState().entities.dict
      .forEach (entityId) ->
        dispatch
          type: k.ProgressEntityTimeline
          data:
            entity: entityId
            timelines: ['timeline-0']
            delta: v - previousSliderValue
    previousSliderValue = v

  timelineSlider.addEventListener 'input', progressTimeline
  timelineSlider.addEventListener 'change', progressTimeline

  isAnimating = true
  animationOffset = 0
  time = 0
  updateTimeline = (t) ->
    time = t
    window.requestAnimationFrame updateTimeline
    if isAnimating
      timelineSlider.value = wrap 0, 100, Math.floor ((animationOffset + t) / 30)
      do progressTimeline


  timelineSlider.addEventListener 'mousedown', () ->
    isAnimating = false

  document.addEventListener 'mouseup', () ->
    if not isAnimating
      isAnimating = true
      animationOffset = timelineSlider.value * 30 - time
      do updateTimeline

  do updateTimeline

do setup



# --- Helpers

randomColor = () ->
  random8bit = () ->
    Math.floor (Math.random() * 256)

  """
  rgba(#{random8bit()}, \
       #{random8bit()}, \
       #{random8bit()}, \
       1)
  """