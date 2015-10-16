ObjectSubsetMatcher = require './ObjectSubsetMatcher'

describe 'object subset matcher', () ->
  beforeEach () ->
    # add the matcher to our jasmine instance
    ObjectSubsetMatcher jasmine, 'toMatchObject'

  it 'handles shallow objects', () ->
    foo =
      a: 808
      b: 57473

    goo =
      a: 808

    expect foo
      .toMatchObject goo

  it 'handles deep objects', () ->
    foo =
      x: 909
      y:
        y1: 1
        y2: 2

    goo =
      y:
        y1: 1
        y2: 2

    notMatchGoo1 =
      y1: 1
      y2: 2
    notMatchGoo2 =
      y:
        y1: 2

    expect foo
      .toMatchObject goo
    expect foo
      .toMatchObjectDeep goo
    expect foo
      .not.toMatchObjectDeep notMatchGoo1
    expect foo
      .not.toMatchObjectDeep notMatchGoo2

  it 'handles sparse deep objects', () ->
    foo =
      x: 909
      y:
        y1: 1
        y2: 2

    sparserGoo =
      y:
        y2: 2

    notMatchGoo =
      y2: 2

    expect foo
      .toMatchObjectDeep sparserGoo
    expect foo
      .not.toMatchObjectDeep notMatchGoo


describe 'scope', () ->
  # if we add the matcher to jasmine in one test...
  it 'receives matcher', () ->
    ObjectSubsetMatcher jasmine, 'toMatchObject'
    expect ((expect null).toMatchObject)
      .toBeDefined()

  # ... it shouldn't be available in subsequent tests.
  it 'does not leak', () ->
    expect ((expect null).toMatchObject)
      .toBeUndefined()