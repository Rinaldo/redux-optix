import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from "redux-thunk"
import { createOptix } from "../src"

const initialState = {
  user: {
    name: "Someone",
    todos: [
      {
        id: 1,
        completed: false,
        text: "Write more tests",
      },
    ],
  },
  request: {
    status: "UNLOADED",
    data: null,
  },
  counter: 0,
}

const setupStore = actionMap => {
  const { actions, reducer } = createOptix(actionMap, { initialState })
  const spyReducer = jest.fn().mockImplementation(reducer)
  const store = createStore(spyReducer, applyMiddleware(thunkMiddleware))
  spyReducer.mockClear()
  jest.spyOn(store, "dispatch")
  return { actions, reducer: spyReducer, store }
}

describe("The validate property", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  beforeEach(() => {
    console.error.mockClear()
  })

  afterAll(() => {
    console.error.mockRestore()
  })

  describe("synchronous validation", () => {
    it("handles validation success", () => {
      const { actions, reducer, store } = setupStore({
        successCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => true,
        },
      })
      store.dispatch(actions.successCase())
      expect(reducer).toHaveBeenCalledTimes(1)
      expect(reducer).toHaveBeenLastCalledWith(initialState, { type: "successCase" })
    })

    it("handles validation failure", () => {
      const { actions, reducer, store } = setupStore({
        failCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => false,
        },
      })
      store.dispatch(actions.failCase())
      expect(reducer).not.toHaveBeenCalled()
    })

    it("handles validation errors", () => {
      const { actions, reducer, store } = setupStore({
        errorCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => {
            throw Error("oh no!")
          },
        },
      })
      store.dispatch(actions.errorCase())
      expect(reducer).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    it("passes the correct arguments to the predicate", () => {
      let validateArg
      const { actions, store } = setupStore({
        argsTest: {
          path: "user.name",
          validate: arg => {
            validateArg = { ...arg }
            return true
          },
        },
      })
      store.dispatch(actions.argsTest("James"))
      expect(Object.keys(validateArg)).toHaveLength(5)
      expect(validateArg).toEqual({
        payload: "James",
        meta: undefined,
        state: initialState,
        slice: "Someone",
        extra: undefined,
      })
    })

    it("dispatches synchronously", () => {
      const { actions, reducer, store } = setupStore({
        increment: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => true,
        },
        decrement: {
          path: "counter",
          handler: () => count => count - 1,
        },
      })
      store.dispatch(actions.increment())
      store.dispatch(actions.decrement())
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer).toHaveBeenNthCalledWith(1, initialState, { type: "increment" })
      expect(reducer).toHaveBeenNthCalledWith(
        2,
        { ...initialState, counter: 1 },
        { type: "decrement" }
      )
    })
  })

  describe("async validation", () => {
    it("handles async validation success", async () => {
      const { actions, reducer, store } = setupStore({
        successCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => Promise.resolve(true),
        },
      })
      await store.dispatch(actions.successCase())
      expect(reducer).toHaveBeenCalledTimes(1)
      expect(reducer).toHaveBeenLastCalledWith(initialState, { type: "successCase" })
    })

    it("handles async validation failure", async () => {
      const { actions, reducer, store } = setupStore({
        failCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => Promise.resolve(false),
        },
      })
      await store.dispatch(actions.failCase())
      expect(reducer).not.toHaveBeenCalled()
    })

    it("handles async validation errors", async () => {
      const { actions, reducer, store } = setupStore({
        errorCase: {
          path: "counter",
          handler: () => count => count + 1,
          validate: () => Promise.reject(Error("oh no!")),
        },
      })
      await store.dispatch(actions.errorCase())
      expect(reducer).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledTimes(1)
    })
  })
})
