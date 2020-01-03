import { createOptix } from "../src"

const initialState = {
  otherKey: [],
  nested: {
    array: [
      {
        val: "init",
        otherVal: "other",
      },
    ],
  },
}

const updatedState = update => ({
  ...initialState,
  nested: {
    ...initialState.nested,
    array: [
      {
        val: update,
        otherVal: "other",
      },
    ],
  },
})

describe("The reducer related properties", () => {
  describe("The default reducer", () => {
    it("constructs a correct pathless reducer", () => {
      const simpleInitialState = ["initial"]
      const { reducer, actions } = createOptix(
        {
          default: {},
        },
        { initialState: simpleInitialState }
      )
      const unhandledAction = { type: "unhandled" }
      const payload = ["test"]
      const action = actions.default(payload)
      expect(reducer(undefined, unhandledAction)).toBe(simpleInitialState)
      expect(reducer(undefined, action)).toBe(payload)
    })

    it("constructs a correct reducer with a path", () => {
      const { reducer, actions } = createOptix(
        {
          withPath: {
            path: ["nested", "array", 0, "val"],
          },
        },
        { initialState }
      )
      const unhandledAction = { type: "unhandled" }
      const payload = "test"
      const action = actions.withPath(payload)
      expect(reducer(undefined, unhandledAction)).toBe(initialState)
      const newState = reducer(undefined, action)
      expect(newState).toEqual(updatedState("test"))
      expect(newState).not.toBe(initialState)
      expect(newState.otherKey).toBe(initialState.otherKey)
      expect(newState.nested).not.toBe(initialState.nested)
      expect(newState.nested.array).not.toBe(initialState.nested.array)
      expect(newState.nested.array[0]).not.toBe(initialState.nested.array[0])
    })

    it("supports string path shorthand", () => {
      const { reducer, actions } = createOptix(
        {
          withPath: {
            path: "nested.array[0].val",
          },
        },
        { initialState }
      )
      const unhandledAction = { type: "unhandled" }
      const payload = "test"
      const action = actions.withPath(payload)
      expect(reducer(undefined, unhandledAction)).toBe(initialState)
      const newState = reducer(undefined, action)
      expect(newState).toEqual(updatedState("test"))
      expect(newState).not.toBe(initialState)
      expect(newState.otherKey).toBe(initialState.otherKey)
      expect(newState.nested).not.toBe(initialState.nested)
      expect(newState.nested.array).not.toBe(initialState.nested.array)
      expect(newState.nested.array[0]).not.toBe(initialState.nested.array[0])
    })

    it("supports path and suffix", () => {
      const { reducer, actions } = createOptix(
        {
          withPath: {
            path: ["nested"],
            suffix: "array[0].val",
          },
        },
        { initialState }
      )
      const unhandledAction = { type: "unhandled" }
      const payload = "test"
      const action = actions.withPath(payload)
      expect(reducer(undefined, unhandledAction)).toBe(initialState)
      const newState = reducer(undefined, action)
      expect(newState).toEqual(updatedState("test"))
      expect(newState).not.toBe(initialState)
      expect(newState.otherKey).toBe(initialState.otherKey)
      expect(newState.nested).not.toBe(initialState.nested)
      expect(newState.nested.array).not.toBe(initialState.nested.array)
      expect(newState.nested.array[0]).not.toBe(initialState.nested.array[0])
    })

    it("supports creating a new key", () => {
      const { reducer, actions } = createOptix(
        {
          withPath: {
            path: ["nested", "newKey"],
          },
        },
        { initialState }
      )
      const unhandledAction = { type: "unhandled" }
      const payload = "test"
      const action = actions.withPath(payload)
      expect(reducer(undefined, unhandledAction)).toBe(initialState)
      const newState = reducer(undefined, action)
      expect(newState).toEqual({
        ...initialState,
        nested: {
          ...initialState.nested,
          newKey: "test",
        },
      })
      expect(newState).not.toBe(initialState)
      expect(newState.otherKey).toBe(initialState.otherKey)
      expect(newState.nested).not.toBe(initialState.nested)
      expect(newState.nested.array).toBe(initialState.nested.array)
    })

    it("does not support creating multiple keys (due to the ambiguity invlolved in doing so)", () => {
      const { reducer, actions } = createOptix(
        {
          shouldThrow: {
            path: ["nested", "newKey", "newNested"],
          },
        },
        { initialState }
      )
      expect(() => reducer(undefined, actions.shouldThrow())).toThrow()
    })
  })

  describe("The handler property", () => {
    const innerHandler = jest.fn().mockReturnValue("test")
    const handler = jest.fn().mockReturnValue(innerHandler)

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it("calls the handler with default arity", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            path: ["nested", "array", 0, "val"],
            handler,
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction("test"))
      expect(newState).toEqual(updatedState("test"))
      expect(handler).toHaveBeenCalledTimes(1)
      const handlerArgs = handler.mock.calls[0]
      expect(handlerArgs).toHaveLength(1)
      expect(handlerArgs[0]).toBe("test")
      expect(innerHandler).toHaveBeenCalledTimes(1)
      const innerHandlerArgs = innerHandler.mock.calls[0]
      expect(innerHandlerArgs).toHaveLength(1)
      expect(innerHandlerArgs[0]).toBe("init")
    })

    it("calls the handler with arity 1 if payloadCreator is defined", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            payloadCreator: x => x,
            path: ["nested", "array", 0, "val"],
            handler,
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction("test"))
      expect(newState).toEqual(updatedState("test"))
      expect(handler).toHaveBeenCalledTimes(1)
      const handlerArgs = handler.mock.calls[0]
      expect(handlerArgs).toHaveLength(1)
      expect(handlerArgs[0]).toBe("test")
      expect(innerHandler).toHaveBeenCalledTimes(1)
      const innerHandlerArgs = innerHandler.mock.calls[0]
      expect(innerHandlerArgs).toHaveLength(1)
      expect(innerHandlerArgs[0]).toBe("init")
    })

    it("calls the handler with arity 2 if metaCreator is defined", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            metaCreator: (x, y) => y,
            path: ["nested", "array", 0, "val"],
            handler,
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction("test", "test2"))
      expect(newState).toEqual(updatedState("test"))
      expect(handler).toHaveBeenCalledTimes(1)
      const handlerArgs = handler.mock.calls[0]
      expect(handlerArgs).toHaveLength(2)
      expect(handlerArgs[0]).toBe("test")
      expect(handlerArgs[1]).toBe("test2")
      expect(innerHandler).toHaveBeenCalledTimes(1)
      const innerHandlerArgs = innerHandler.mock.calls[0]
      expect(innerHandlerArgs).toHaveLength(1)
      expect(innerHandlerArgs[0]).toBe("init")
    })

    it("calls the handler with whatever arity is specified regardless of payloadCreator or metaCreator", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            arity: 0,
            metaCreator: (x, y) => y,
            path: ["nested", "array", 0, "val"],
            handler,
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction("test", "test2"))
      expect(newState).toEqual(updatedState("test"))
      expect(handler).toHaveBeenCalledTimes(1)
      const handlerArgs = handler.mock.calls[0]
      expect(handlerArgs).toHaveLength(0)
      expect(innerHandler).toHaveBeenCalledTimes(1)
      const innerHandlerArgs = innerHandler.mock.calls[0]
      expect(innerHandlerArgs).toHaveLength(1)
      expect(innerHandlerArgs[0]).toBe("init")
    })
  })

  describe("The always property", () => {
    it("always returns the specified value", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            path: ["nested", "array", 0, "val"],
            always: "test",
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction("test", "test2"))
      expect(newState).toEqual(updatedState("test"))
    })

    it("works with simple state", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            always: "test",
          },
        },
        { initialState: "init" }
      )
      const newState = reducer(undefined, actions.someAction())
      expect(newState).toEqual("test")
    })
  })

  describe("The batch property", () => {
    it("supports updating different slices of state", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            batch: [{ path: "otherKey" }, { path: "nested.array" }],
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction(["test"]))
      expect(newState).toEqual({
        otherKey: ["test"],
        nested: {
          array: ["test"],
        },
      })
    })

    it("shares properties defined on the top level between items in the batch", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            handler: item => array => array.concat(item),
            batch: [{ path: "otherKey" }, { path: "nested.array" }],
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction(["test"]))
      expect(newState).toEqual({
        otherKey: ["test"],
        nested: {
          array: [...initialState.nested.array, "test"],
        },
      })
    })

    it("batch properties override top level properties", () => {
      const { reducer, actions } = createOptix(
        {
          someAction: {
            handler: item => array => array.concat(item),
            batch: [{ path: "otherKey" }, { path: "nested.array", handler: () => () => [] }],
          },
        },
        { initialState }
      )
      const newState = reducer(undefined, actions.someAction(["test"]))
      expect(newState).toEqual({
        otherKey: ["test"],
        nested: {
          array: [],
        },
      })
    })
  })
})
