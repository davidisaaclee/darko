mapAssign = require '../src/util/mapAssign'

describe 'mapAssign', () ->
  it 'can modify shallow properties', () ->
    src = a: 0
    result = mapAssign src, 'a', () -> 1

    expect result
      .toEqual a: 1

  it 'can assign shallow properties', () ->
    src = {}
    result = mapAssign src, 'a', () -> 1

    expect result
      .toEqual a: 1


  it 'can assign deep properties to existing properties', () ->
    src = a: {}
    result = mapAssign src, 'a.b', () -> 0

    expect result
      .toEqual a: {b: 0}


  it 'can assign deep properties to nonexistant properties', () ->
    src = {}
    result = mapAssign src, 'a.b', () -> 0

    expect result
      .toEqual a: {b: 0}


  it 'can assign over objects', () ->
    src =
      a: 1
      b: 2
      c: 3
    result = mapAssign src, '*', () -> 0

    expect result
      .toEqual
        a: 0
        b: 0
        c: 0


  it 'can fuck w wildcards', () ->
    src =
      '10':
        '1': '+'
        '2': '-'
      '20':
        '3': '-'
        '4': '+'

    expected =
      '10':
        '1': 11
        '2': 8
      '20':
        '3': 17
        '4': 24

    result = mapAssign src, '*.*', (value, wildcardValues, wildcards) ->
      rand0 = parseInt wildcards[0]
      rand1 = parseInt wildcards[1]

      expect wildcardValues[0]
        .toBe src[wildcards[0]]
      expect wildcardValues[1]
        .toBe src[wildcards[0]][wildcards[1]]

      switch value
        when '+'
          return rand0 + rand1

        when '-'
          return rand0 - rand1

        else
          expect true
            .toBe false

    expect result
      .toEqual expected