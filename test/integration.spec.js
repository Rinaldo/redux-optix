import * as R from "ramda"
import * as L from "partial.lenses"
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
  loadingState: 0,
}

const { actions, types, reducer } = createOptix({
  setUserName: {
    path: "user.name",
  },
  addTodo: {
    path: ["user", "todos"],
    handler: R.append, // vanilla: todo => todos => [...todos, todo]
  },
  updateTodo1: {
    arity: 2,
    path: ["user", "todos"],
    handler: (text, id) => R.map(todo => (todo.id === id ? { ...todo, text } : todo)),
  },
  updateTodo2: {
    arity: 2,
    handler: (text, id) => L.set(["user", "todos", L.find(todo => todo.id === id), "text"], text),
  },
  deleteTodo: {
    path: ["user", "todos"],
    handler: R.compose(R.reject, R.propEq("id")),
  },
  fetchRequest: {
    path: ["request", "status"],
    always: "LOADING",
  },
  fetchSuccess1: {
    path: "request",
    handler: data => request => ({ ...request, data, status: "DONE" }),
  },
  fetchSuccess2: {
    batch: [
      { path: ["request", "data"] },
      { path: ["request", "status"], always: "DONE" },
      { path: "loadingState", handler: () => R.dec },
    ],
  },
  fetchSuccess3: {
    path: "request",
    batch: [
      { suffix: "data" },
      { suffix: "status", always: "DONE" },
      { path: "loadingState", handler: () => R.dec },
    ],
  },
  incrementUpToTen: {
    path: "counter",
    arity: 0,
    handler: R.inc,
    validate: ({ slice }) => slice < 10,
  },
})

describe("Integration examples", () => {
  let store

  beforeEach(() => {
    store = createStore(reducer, initialState, applyMiddleware(thunkMiddleware))
  })

  it("configures setUserName correctly", () => {
    const name = "Alice"
    const action = actions.setUserName(name)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.setUserName).toBe("setUserName")
    expect(action).toEqual({
      type: "setUserName",
      payload: name,
    })
    expect(newState).toEqual({
      ...initialState,
      user: {
        ...initialState.user,
        name,
      },
    })
    expect(newState.user.name).toBe(name)
    expect(newState.user).not.toBe(initialState.user)
    expect(newState).not.toBe(initialState)
  })

  it("configures addTodo correctly", () => {
    const todo = {
      id: 2,
      completed: false,
      text: "foo",
    }
    const action = actions.addTodo(todo)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.addTodo).toBe("addTodo")
    expect(action).toEqual({
      type: "addTodo",
      payload: todo,
    })
    expect(newState).toEqual({
      ...initialState,
      user: {
        ...initialState.user,
        todos: [...initialState.user.todos, todo],
      },
    })
    expect(newState.user.todos[1]).toBe(todo)
    expect(newState.user.todos).not.toBe(initialState.user.todos)
    expect(newState.user).not.toBe(initialState.user)
    expect(newState).not.toBe(initialState)
  })

  it("configures updateTodo1 correctly", () => {
    const id = 1
    const newText = "Write even more tests"
    const action = actions.updateTodo1(newText, id)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.updateTodo1).toBe("updateTodo1")
    expect(action).toEqual({
      type: "updateTodo1",
      payload: newText,
      meta: id,
    })
    expect(newState).toEqual({
      ...initialState,
      user: {
        ...initialState.user,
        todos: [
          {
            ...initialState.user.todos[0],
            text: newText,
          },
          ...initialState.user.todos.slice(1),
        ],
      },
    })
    expect(newState.user.todos[0]).not.toBe(initialState.user.todos[0])
    expect(newState.user.todos).not.toBe(initialState.user.todos)
    expect(newState.user).not.toBe(initialState.user)
    expect(newState).not.toBe(initialState)
  })

  it("configures updateTodo2 correctly", () => {
    const id = 1
    const newText = "Write a lot more tests"
    const action = actions.updateTodo2(newText, id)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.updateTodo2).toBe("updateTodo2")
    expect(action).toEqual({
      type: "updateTodo2",
      payload: newText,
      meta: id,
    })
    expect(newState).toEqual({
      ...initialState,
      user: {
        ...initialState.user,
        todos: [
          {
            ...initialState.user.todos[0],
            text: newText,
          },
          ...initialState.user.todos.slice(1),
        ],
      },
    })
    expect(newState.user.todos[0]).not.toBe(initialState.user.todos[0])
    expect(newState.user.todos).not.toBe(initialState.user.todos)
    expect(newState.user).not.toBe(initialState.user)
    expect(newState).not.toBe(initialState)
  })

  it("configures deleteTodo correctly", () => {
    const id = 1
    const action = actions.deleteTodo(id)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.deleteTodo).toBe("deleteTodo")
    expect(action).toEqual({
      type: "deleteTodo",
      payload: id,
    })
    expect(newState).toEqual({
      ...initialState,
      user: {
        ...initialState.user,
        todos: [],
      },
    })
    expect(newState.user.todos).not.toBe(initialState.user.todos)
    expect(newState.user).not.toBe(initialState.user)
    expect(newState).not.toBe(initialState)
  })

  it("configures fetchRequest correctly", () => {
    const action = actions.fetchRequest()
    store.dispatch(action)
    const newState = store.getState()

    expect(types.fetchRequest).toBe("fetchRequest")
    expect(action).toEqual({
      type: "fetchRequest",
    })
    expect(newState).toEqual({
      ...initialState,
      request: {
        ...initialState.request,
        status: "LOADING",
      },
    })
    expect(newState.request).not.toBe(initialState.request)
    expect(newState).not.toBe(initialState)
  })

  it("configures fetchSuccess1 correctly", () => {
    const data = "data"
    const action = actions.fetchSuccess1(data)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.fetchSuccess1).toBe("fetchSuccess1")
    expect(action).toEqual({
      type: "fetchSuccess1",
      payload: data,
    })
    expect(newState).toEqual({
      ...initialState,
      request: {
        ...initialState.request,
        status: "DONE",
        data,
      },
    })
    expect(newState.request).not.toBe(initialState.request)
    expect(newState).not.toBe(initialState)
  })

  it("configures fetchSuccess2 correctly", () => {
    const data = "data"
    const action = actions.fetchSuccess2(data)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.fetchSuccess2).toBe("fetchSuccess2")
    expect(action).toEqual({
      type: "fetchSuccess2",
      payload: data,
    })
    expect(newState).toEqual({
      ...initialState,
      loadingState: initialState.loadingState - 1,
      request: {
        ...initialState.request,
        status: "DONE",
        data,
      },
    })
    expect(newState.request).not.toBe(initialState.request)
    expect(newState).not.toBe(initialState)
  })

  it("configures fetchSuccess3 correctly", () => {
    const data = "data"
    const action = actions.fetchSuccess3(data)
    store.dispatch(action)
    const newState = store.getState()

    expect(types.fetchSuccess3).toBe("fetchSuccess3")
    expect(action).toEqual({
      type: "fetchSuccess3",
      payload: data,
    })
    expect(newState).toEqual({
      ...initialState,
      loadingState: initialState.loadingState - 1,
      request: {
        ...initialState.request,
        status: "DONE",
        data,
      },
    })
    expect(newState.request).not.toBe(initialState.request)
    expect(newState).not.toBe(initialState)
  })

  it("configures incrementUpToTen correctly", () => {
    const thunk = actions.incrementUpToTen()
    const returnVal = store.dispatch(thunk)
    const newState = store.getState()

    expect(types.incrementUpToTen).toBe("incrementUpToTen")
    expect(returnVal).toEqual({
      type: "incrementUpToTen",
    })
    expect(newState).toEqual({
      ...initialState,
      counter: 1,
    })
    expect(newState).not.toBe(initialState)
  })
})
