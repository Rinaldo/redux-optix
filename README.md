# Redux Optix

`npm install redux-optix`

**Generate a set of Redux action creators and a reducer with a simple, lens-inspired syntax**

Redux Optix generates a set of action creators and a reducer from a set of declarative definitions. It sets intelligent defaults and works well with libraries like [Ramda](https://ramdajs.com/) to reduce boilerplate and make even complex actions simple to define. Redux Optix centralizes action logic instead of spreading it across an action creator and one or more reducers. This makes the full effects of actions more clear and sidesteps issues with [sharing data between slice reducers](https://redux.js.org/recipes/structuring-reducers/beyond-combinereducers).

## Refactoring with Redux Optix: Fewer lines, more clarity

> The following examples are adapted from the [Redux TodoMVC Example](https://github.com/reduxjs/redux/tree/master/examples/todomvc). They are functionally equivalent

#### Redux Optix

```javascript
import * as R from "ramda"
import { createStore } from "redux"
import { createOptix } from "redux-optix"
import { VisibilityFilters } from "./somewhere"

const initialState = {
  todos: [],
  visibilityFilter: VisibilityFilters.SHOW_ALL,
}

const actionMap = {
  addTodo: {
    path: "todos",
    handler: text =>
      R.append([
        {
          text,
          id: state.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
          completed: false,
        },
      ]),
  },
  deleteTodo: {
    path: "todos",
    handler: id => R.filter(todo => todo.id !== id),
  },
  editTodo: {
    path: "todos",
    payloadCreator: (id, text) => ({ id, text }),
    handler: ({ id, text }) => R.map(todo => (todo.id === id ? { ...todo, text } : todo)),
  },
  toggleTodo: {
    path: "todos",
    handler: id => R.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
  },
  setVisibilityFilter: {
    path: "visibilityFilter",
  },
}

const { reducer, actions } = createOptix(actionMap, { initialState })

const store = createStore(reducer)
```

#### Vanilla Redux

```javascript
import { combineReducers, createStore } from "redux"
import { VisibilityFilters } from "./somewhere"

const actionTypes = {
  addTodo: "addTodo",
  deleteTodo: "deleteTodo",
  editTodo: "editTodo",
  toggleTodo: "toggleTodo",
  setVisibilityFilter: "setVisibilityFilter",
}

const actions = {
  addTodo: text => ({
    type: actionTypes.addTodo,
    payload: text,
  }),
  deleteTodo: id => ({
    type: actionTypes.toggleTodo,
    payload: id,
  }),
  editTodo: (id, text) => ({
    type: types.editTodo,
    payload: { id, text },
  }),
  toggleTodo: id => ({
    type: actionTypes.toggleTodo,
    payload: id,
  }),
  setVisibilityFilter: filter => ({
    type: actionTypes.setVisibilityFilter,
    payload: filter,
  }),
}

const todosReducer = (state = [], action) => {
  switch (action.type) {
    case actionTypes.addTodo:
      return state.concat([
        {
          text: action.payload,
          id: state.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
          completed: false,
        },
      ])
    case actionTypes.deleteTodo:
      return state.filter(todo => todo.id !== action.payload)
    case actionTypes.editTodo:
      return state.map(todo =>
        todo.id === action.payload.id ? { ...todo, text: action.payload.text } : todo
      )
    case actionTypes.toggleTodo:
      return state.map(todo =>
        todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
      )
    default:
      return state
  }
}

const visibilityFilterReducer = (state = VisibilityFilters.SHOW_ALL, action) => {
  switch (action.type) {
    case actionTypes.setVisibilityFilter:
      return action.payload
    default:
      return state
  }
}

const rootReducer = combineReducers({
  todos,
  visibilityFilter,
})

const store = createStore(rootReducer)
```

## Actions in detail

#### A Basic Action

```javascript
setUserName: {
  path: "user.name"
}
```

Specifying just a [path](#path) will create a setter function due to the defaults on other properties.

#### Defining a handler

```javascript
deleteTodo: {
  path: "todos",
  handler: id => R.filter(todo => todo.id !== id)
}
```

The [handler](#handler) property serves as the case reducer for the action. It is a higher-order function that is called with the the action's payload (and meta if applicable), then with a slice of state, and should return a new value for that slice. Redux Optix works well with the curried, data-last functions of libraries like [Ramda](https://ramdajs.com/). The vanilla js version of this example would be `id => todos => todos.filter(todo => todo.id !== id)`

#### Setting the arity of the default action creator

```javascript
editTodo: {
  arity: 2,
  path: "todos",
  handler: (text, id) => R.map(todo => todo.id === id ? { ...todo, text } : todo)
}
```

The default action creator takes one argument and sets it as the action's payload. Specifying an [arity](#arity) of 2 will generate an action creator that takes two arguments and sets them as the action's payload and meta properties.

#### Defining a customized action creator

```javascript
addTodo: {
  path: "todos",
  payloadCreator: (...words) => words.join(" "),
  metaCreator: (...words) => Math.floor(Math.random() * words.length),
  handler: (text, id) => R.append({ text, id, completed: false })
}
```

More complex action creators taking any number of arguments can be defined by using the [payloadCreator](#payloadCreator) and [metaCreator](#metaCreator) properties. Since both [payloadCreator](#payloadCreator) and [metaCreator](#metaCreator) are specified in this example, [handler](#handler) will be called with 2 arguments.

#### Setting state to a constant

```javascript
fetchRequest: {
  path: "request.status",
  always: "LOADING"
}
```

Shorthand for [always](#always) setting a value into state.

#### Updating multiple pieces with a shorter path

```javascript
fetchSuccess1: {
  path: "request",
  handler: data => R.mergeLeft({ data, status: "DONE" })
}
```

A shorter path gives the handler access to more of the state. The above handler updates both `request.data` and `request.status`.

#### Updating multiple pieces of state with batch

```javascript
fetchSuccess2: {
  batch: [
    { path: "request.status", always: "DONE" },
    { path: "request.data" },
    { path: "loadingState", handler: () => R.dec },
  ]
}
```

A [batch](#batch) reducer operation can be used to update multiple disparate pieces of state.

#### Sharing properties between batches

```javascript
fetchSuccess3: {
  path: "request",
  batch: [
    { suffix: "status", always: "DONE" },
    { suffix: "data" },
    { path: "loadingState", handler: () => R.dec },
  ]
}
```

Any properties specified at the top level will be merged with the batch properties. In this case the [path](#path) `request` will be shared between the first two items and the value of the [suffix](#suffix) property will be appended.

#### validating actions

```javascript
incrementUpToTen: {
  path: "counter",
  arity: 0,
  handler: R.inc,
  validate: ({ slice }) => slice < 10
}
```

Actions can be [validated](#validate) with a predicate function and will only be dispatched if the predicate function returns true. Async predicates are also supported.

## API Reference

### `createOptix`

The one export of Redux Optix. It takes an `actionMap` argument and an optional `options` argument. It returns an object with the following properties:

- `actions`: An object with the same keys as `actionMap`. The value of each key is an action creator with a `toString` method that returns the action type.
- `types`: An object with the same keys as `actionMap`. The value of each key is the action type.
- `reducer`: Reducer function that handles all actions specified in `actionMap`.

### the `actionMap` argument

Each key will name an action creator and each value is an action/reducer definition that may contain the following properties:

#### `handler`

`() => stateSlice => newStateSlice`  
`payload => stateSlice => newStateSlice`  
`(payload, meta) => stateSlice => newStateSlice`

Updates the piece of state at the path specified. It is first called with the contents of the action (see `arity`), then with the piece of state, and should return an update to that piece of state. The default value is `payload => () => payload`.

#### `always`

`any`

Shorthand for setting state to a constant value. `always` is ignored if set to `undefined` or if `handler` is specified.

#### `arity`

`0 | 1 | 2`

Determines how many arguments the `handler` function is initially called with. Also sets the arity of the default action creator if neither `payloadCreator` nor `metaCreator` are specified. If `arity` is 1, the handler is called with the action's payload. If it is 2, the handler is called with both the action's payload and meta properties. The default value is 1 except it's 2 when `metaCreator` is specified and it's 0 when `always` is specified and `handler` is not.

#### `payloadCreator`

`(...args) => payload`

Takes any number of arguments and returns a value for the action payload. If `arity` is 1 or 2 the default value is a function that returns its first argument.

#### `metaCreator`

`(...args) => meta`

Similar to `payloadCreator`. Takes any number of arguments (the same arguments as the `payloadCreator`) and returns a value for the action's meta property. If `arity` is 2 the default value is a function that returns its second argument.

#### `path`

`string | Array<string>`

Specifies a path into the state object. The value at that path will be passed to the `handler` function. `path` can be an array of keys or a string containing one or more keys, i.e. `"user.todos[0].text"`. If `path` is empty or undefined, the entire state will be passed to the `handler` function.

#### `suffix`

`string | Array<string>`

Specifies an additional path that will be appended to the value of `path`.

#### `batch`

`Array<Properties>`

Updates multiple pieces of state. Any properties specified outside `batch` will be merged with (but will not overwrite) the `batch` properties. `batch` supports `handler`, `always`, `arity`, `path`, and `suffix`.

#### `validate`

`(params: ValidateParams) => boolean | Promise<boolean>`

> [Redux Thunk](https://github.com/reduxjs/redux-thunk) is required to use the `validate` property

Predicate function that prevents invalid actions from being dispatched. It replaces the plain action creator normally returned by `createOptix` with a thunk that dispatches the underlying action if validation succeeds. The thunk returns the dispatched action if validation succeeds or false if it fails. The validated action is dispatched synchronously unless an async predicate is used. In the case of an async predicate the thunk will return a promise for either the dispatched action or false.

- `ValidateParams`

  - `state`: the full state object
  - `slice`: the piece of state found at the resolved `path`
  - `payload`: the action's payload property
  - `meta`: the action's meta property
  - `extra`: Redux Thunk's [extra argument](#https://github.com/reduxjs/redux-thunk#injecting-a-custom-argument)

  > Note: the `state` and `slice` params are getters so state can be accessed asynchronously.

### the `options` argument

The options object may contain the following properties:

#### `initialState`

`any`

Defines the initial state of the reducer.

#### `formatActionTypes`

`(actionCreatorName: string) => string`

Customizes generated action types if a format like CONSTANT_CASE is desired.

## Recipes

#### Reusable Action Groups

The following function can be used to generate a reusable set of fetch actions

```javascript
const createFetchActions = (namePrefix, path) => {
  const requestType = namePrefix + "FetchRequest"
  const successType = namePrefix + "FetchSuccess"
  const errorType = namePrefix + "FetchError"
  return {
    [requestType]: {
      path,
      suffix: "status",
      always: "LOADING",
    },
    [successType]: {
      path,
      batch: [{ suffix: "status", always: "DONE" }, { suffix: "data" }],
    },
    [errorType]: {
      path,
      batch: [{ suffix: "status", always: "ERROR" }, { suffix: "error" }],
    },
  }
}

const actionMap = {
  // some other actions
  ...createFetchActions("entitlements", "user.entitlements"),
  ...createFetchActions("savedPosts", "user.savedPosts"),
}
```

#### State Machine

Validations can be used to make a state machine

```javascript
const mediaMachine = {
  play: {
    always: "PLAYING",
    validate: ({ state }) => state === "PAUSED" || state === "STOPPED",
  },
  pause: {
    always: "PAUSED",
    validate: ({ state }) => state === "PLAYING",
  },
  stop: {
    always: "STOPPED",
    validate: ({ state }) => state === "PLAYING" || state === "PAUSED",
  },
}

const { reducer, actions, types } = createOptix(mediaMachine, { initialState: "STOPPED" })
```

## FAQ

#### Is Redux Optix [FSA](https://github.com/redux-utilities/flux-standard-action) Compliant?

Yes!

#### Why use Redux Optix over other Redux helper libraries?

- Action-Centric: All logic for a given action is centralized, avoiding issues with [sharing data between slice reducers](https://redux.js.org/recipes/structuring-reducers/beyond-combinereducers)
- Less Boilerplate: A path is all that is needed to define a a simple setter action
- Optimized for Ramda: Functions like `R.append`, `R.filter`, and `R.inc` can be used directly as handlers

#### What if I like `combineReducers` or I only want to use Redux Optix in one part of my Redux state?

That's ok! Redux Optix just generates some actions and a reducer. The generated reducer can be used with `combineReducers` or any other Redux helper function.

#### How does Redux Optix scale as an application grows?

Redux Optix scales very well. If the `actionMap` object gets too big for one file, different pieces of it can be written in different files and combined using the spread operator before being passed to `createOptix`.

## License

MIT
