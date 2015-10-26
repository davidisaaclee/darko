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
  ctx.clearRect 0, 0, ctx.canvas.width, ctx.canvas.height
  ctx.beginPath()

  getPosition = (entityId) ->
    if entityId?
      p = entities.dict[entityId].data.position
      x: p.x * ctx.canvas.width
      y: p.y * ctx.canvas.height
    else entityId

  entityKeys = Object.keys entities.dict

  entityKeys
    .forEach (key, idx, arr) ->
      pos = getPosition key
      ctx.lineTo pos.x, pos.y
  ctx.closePath()
  ctx.strokeStyle = 'white'
  ctx.stroke()

  entityKeys
    .forEach (key, idx, arr) ->
      pos = getPosition key
      ctx.beginPath()
      ctx.ellipse pos.x, pos.y, 10, 10, 45 * Math.PI/180, 0, 2 * Math.PI
      ctx.closePath()
      ctx.fillStyle = entities.dict[key].data.strokeColor
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
  # Adding entities
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


  # Timeline slider
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
            timeline: 'timeline-0'
            delta: v - previousSliderValue
    previousSliderValue = v

  timelineSlider.addEventListener 'input', progressTimeline
  timelineSlider.addEventListener 'change', progressTimeline

  # Time control of slider
  isAnimating = true
  animationOffset = 0
  time = 0
  updateTimeline = (t) ->
    time = t
    window.requestAnimationFrame updateTimeline
    if isAnimating
      timelineSlider.value = wrap 0, 100, Math.floor ((animationOffset + t) / 40)
      do progressTimeline


  stopAnimation = () ->
    isAnimating = false

  startAnimation = () ->
    if not isAnimating
      isAnimating = true
      animationOffset = timelineSlider.value * 30 - time

  # User-editing override of time control
  # timelineSlider.addEventListener 'mousedown', stopAnimation
  # document.addEventListener 'mouseup', startAnimation

  # Gesture control of slider
  canvas = document.querySelector 'canvas'
  startPoint = null

  timeoutId = null
  shouldMakeNewEntity = true

  down = (pt) ->
    shouldMakeNewEntity = true
    if timeoutId?
      clearTimeout timeoutId
      timeoutId = null
    timeoutId = setTimeout (() ->
      shouldMakeNewEntity = false), 100
    startPoint = pt

  move = (pt) ->
    if not shouldMakeNewEntity
      stopAnimation()
      timelineSlider.value = wrap 0, 100, (pt.x - startPoint.x) / 3
      do progressTimeline

  up = (pt) ->
    if shouldMakeNewEntity
      dispatch
        type: k.AddEntity
        data:
          initialData:
            strokeColor: 'black'
            position:
              x: 0
              y: 0

    startAnimation()

  canvas.addEventListener 'touchstart', (evt) ->
    evt.preventDefault()
    down
      x: evt.touches[0].clientX
      y: evt.touches[0].clientY
  canvas.addEventListener 'touchmove', (evt) ->
    evt.preventDefault()
    move
      x: evt.touches[0].clientX
      y: evt.touches[0].clientY
  canvas.addEventListener 'touchend', (evt) ->
    up()

  mouseIsDown = false
  canvas.addEventListener 'mousedown', (evt) ->
    mouseIsDown = true
    down
      x: evt.clientX
      y: evt.clientY
  canvas.addEventListener 'mousemove', (evt) ->
    if mouseIsDown
      move
        x: evt.clientX
        y: evt.clientY
  canvas.addEventListener 'mouseup', (evt) ->
    mouseIsDown = false
    up()



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

resizeCanvas = () ->
  canvas = document.querySelector 'canvas'
  bcr = canvas.parentNode.getBoundingClientRect()
  canvas.width = bcr.width
  canvas.height = bcr.height

window.addEventListener 'resize', resizeCanvas, false
do resizeCanvas