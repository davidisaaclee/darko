# TODO
- action for progressing by timeline, not by entity-timeline

- conditional / switching timelines

- higher-level timelines (e.g. spline timelines that already know how to move
  their entities)

- timelines operating on the world (which could just another entity?)

- organize honeypowerspec, actiontypes into separate files

- timeline stacks
  - each entity should interface with timelines through timeline stacks
  - on progress, a timeline stack starts from its top timeline element, and
    reduces down. each element can modify the entity's data, as well as
    modifying the progress delta which is passed onto the next timeline.

    example:
      - interacting with a timeline stack of a single walking timeline
      - push a 'jump' timeline onto the stack
      - 'jump' timeline modifies position data to move character up, but also
        scales progress delta so that the entity "walks" slower during jump

  - one-shot timelines - pop self off stack after hitting a trigger