import { createOptix } from "../src"

describe("The action related properties", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("generates an action creator that takes one argument and sets that argument as the payload by default", () => {
    const { actions, types } = createOptix({
      default: {},
    })
    const actionType = types.default
    expect(actionType).toBe("default")

    const actionCreator = actions.default
    const someArg = {}
    expect(actionCreator).toHaveLength(1)
    const action1 = actionCreator(someArg)
    const action2 = actionCreator(someArg, 3, 4, [])
    expect(action1).toEqual({
      type: "default",
      payload: someArg,
    })
    expect(action1.payload).toBe(someArg)
    expect(action1).toEqual(action2)
    expect(actionCreator.toString()).toBe("default")
  })

  it("generates an action creator that takes two arguments when arity of 2 is specified", () => {
    const { actions, types } = createOptix({
      arity2: { arity: 2 },
    })
    const actionType = types.arity2
    expect(actionType).toBe("arity2")

    const actionCreator = actions.arity2
    const someArg = {}
    const someOtherArg = {}
    expect(actionCreator).toHaveLength(2)
    const action1 = actionCreator(someArg, someOtherArg)
    const action2 = actionCreator(someArg, someOtherArg, 3, 4, [])
    expect(action1).toEqual({
      type: "arity2",
      payload: someArg,
      meta: someOtherArg,
    })
    expect(action1.payload).toBe(someArg)
    expect(action1).toEqual(action2)
    expect(actionCreator.toString()).toBe("arity2")
    expect(actionCreator()).toEqual({
      type: "arity2",
      payload: undefined,
      meta: undefined,
    })
  })

  it("generates an action creator that takes no arguments when arity of 0 is specified", () => {
    const { actions, types } = createOptix({
      arity0: { arity: 0 },
    })
    const actionType = types.arity0
    expect(actionType).toBe("arity0")

    const actionCreator = actions.arity0
    expect(actionCreator).toHaveLength(0)
    const action1 = actionCreator()
    const action2 = actionCreator("foo", null, 3, 4, [])
    expect(action1).toEqual({
      type: "arity0",
    })
    expect(action1).toEqual(action2)
    expect(actionCreator.toString()).toBe("arity0")
  })

  it("handles the payloadCreator property correctly", () => {
    const { actions, types } = createOptix({
      withPayloadCreator: { payloadCreator: (a, b, c) => a + b + c },
    })
    const actionType = types.withPayloadCreator
    expect(actionType).toBe("withPayloadCreator")

    const actionCreator = actions.withPayloadCreator
    expect(actionCreator).toHaveLength(3)
    const action = actionCreator("foo", "bar", "baz")
    expect(action).toEqual({
      type: "withPayloadCreator",
      payload: "foobarbaz",
    })
    expect(actionCreator.toString()).toBe("withPayloadCreator")
  })

  it("handles the metaCreator property correctly", () => {
    const { actions, types } = createOptix({
      withMetaCreator: { metaCreator: (a, b, c) => a + b + c },
    })
    const actionType = types.withMetaCreator
    expect(actionType).toBe("withMetaCreator")

    const actionCreator = actions.withMetaCreator
    expect(actionCreator).toHaveLength(3)
    const action = actionCreator("foo", "bar", "baz")
    expect(action).toEqual({
      type: "withMetaCreator",
      payload: "foo",
      meta: "foobarbaz",
    })
    expect(actionCreator.toString()).toBe("withMetaCreator")
  })

  it("handles specifying both the payloadCreator and metaCreator properties correctly", () => {
    const { actions, types } = createOptix({
      withBothCreators: {
        payloadCreator: (a, b) => a + b,
        metaCreator: (a, b, c) => a + b + c,
      },
    })
    const actionType = types.withBothCreators
    expect(actionType).toBe("withBothCreators")

    const actionCreator = actions.withBothCreators
    expect(actionCreator).toHaveLength(3)
    const action = actionCreator("foo", "bar", "baz")
    expect(action).toEqual({
      type: "withBothCreators",
      payload: "foobar",
      meta: "foobarbaz",
    })
    expect(actionCreator.toString()).toBe("withBothCreators")
  })

  it("payloadCreator takes precedence over arity", () => {
    const { actions, types } = createOptix({
      withPayloadAndArity: { payloadCreator: (a, b, c) => a + b + c },
    })
    const actionType = types.withPayloadAndArity
    expect(actionType).toBe("withPayloadAndArity")

    const actionCreator = actions.withPayloadAndArity
    expect(actionCreator).toHaveLength(3)
    const action = actionCreator("foo", "bar", "baz")
    expect(action).toEqual({
      type: "withPayloadAndArity",
      payload: "foobarbaz",
    })
    expect(actionCreator.toString()).toBe("withPayloadAndArity")
  })
})
