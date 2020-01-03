# Redux Optix

`npm install redux-optix`

**Lens inspired, declarative way of generating action creators and reducers**

Redux Optix is a tool that generates a set of Redux action creators and a reducer with a simple, declarative syntax. Redux Optix sets intelligent defaults and works well with data-last functions of libraries like [Ramda](https://ramdajs.com/) so that even complex actions need only minimal configuration. Redux Optix is designed to generate the entire set of actions and the root reducer for an application. Working with a single reducer makes it easy to see the full effects of an action and sidesteps issues with [sharing data between slice reducers](https://redux.js.org/recipes/structuring-reducers/beyond-combinereducers). The lens-inspired syntax makes performing atomic updates on deeply nested parts of state easy.

## Redux Optix By Example

```javascript
import * as R from 'ramda'
import * as L from 'partial.lenses'
import { createStore } from 'redux'
import { createOptix } from 'redux-optics'

const actionMap = {

  setUserName: {
    path: ['user', 'name']
  },

  addTodo: {
    path: ['user', 'todos'],
    handler: R.append // vanilla-js: todo => todos => [...todos, todo]
  },

  updateTodoText1: {
    arity: 2,
    path: ['user', 'todos'],
    handler: (text, id) => R.map(todo => todo.id === id ? { ...todo, text } : todo)
  },

  updateTodoText2: {
    arity: 2,
    handler: (text, id) => L.set(['user', 'todos', L.find(todo => todo.id === id), 'text'], text)
  },

  fetchRequest: {
    path: ['request', 'status'],
    always: 'LOADING'
  },

  fetchSuccess1: {
    path: 'request',
    handler: data => requestState => ({
      ...requestState,
      status: 'DONE',
      data
    })
  },

  fetchSuccess2: {
    batch: [
      { path: ['request', 'status'], always: 'DONE' },
      { path: ['request', 'data'] }
    ]
  },

  fetchSuccess3: {
    path: 'request',
    batch: [
      { suffix: 'status', always: 'DONE' },
      { suffix: 'data' }
    ]
  },

  incrementUpToTen: {
    path: 'counter',
    arity: 0,
    handler: R.inc,
    validate: ({ slice }) => slice < 10
  }

})

const initialState = {
  user: {
    name: 'Someone',
    todos: [
      {
        id: 1,
        completed: true,
        text: 'Write basic documentation',
      },
      {
        id: 2,
        completed: false,
        text: 'Write more tests',
      },
    ],
  },
  request: {
    status: 'UNLOADED',
    data: null
  },
  counter: 0
}

const { reducer, actions, types } = createOptix(actionMap, { initialState })
```

#### A Basic Action

```javascript
setUserName: {
  path: ["user", "name"]
}
```

Redux Optix sets defaults to cover the most common use-cases with minimal configuration. With just the [path](#path) specified, Redux Optix generates an action creator that takes one argument and a reducer that sets the value at the path to that argument. The path can either be an array or a string.

#### Adding a handler

```javascript
addTodo: {
  path: ['user', 'todos'],
  handler: R.append // vanilla-js: todo => todos => [...todos, todo]
}
```

The [handler](#handler) property specifies the behavior of the reducer for the action. The handler is a higher-order function that is invoked with the contents of the action, then with a slice of state, and returns a new value for that slice. Redux Optix is designed to work well with the data-last functions of libraries such as [Ramda](https://ramdajs.com/) as well as hand-written functions.

#### More Complex Actions

```javascript
updateTodoText1: {
  arity: 2,
  path: ['user', 'todos'],
  handler: (text, id) => R.map(todo => todo.id === id ? { ...todo, text } : todo)
}
```

Specifying an [arity](#arity) of 2 will generate an action creator that takes two arguments and sets them as payload and meta keys. More customized action creators taking any number of arguments can be defined by using the [payloadCreator](#payloadCreator) and [metaCreator](#metaCreator) properties.

#### More Complex Actions Using Lenses

```javascript
updateTodoText2: {
  arity: 2,
  handler: (text, id) => L.set(['user', 'todos', L.find(todo => todo.id === id), 'text'], text)
}
```

If no path is specified, then the entire state is passed to the handler. This is useful when using lenses, which separate the logic of accessing a piece of state from the logic of updating it. See [Partial Lenses](https://github.com/calmm-js/partial.lenses) for more details.

#### Always

```javascript
fetchRequest: {
  path: ['request', 'status'],
  always: 'LOADING'
}
```

Some actions always set the same value into state. For those cases, use the [always](#always) property instead of a handler.

#### Updating Multiple Pieces of State

```javascript
fetchSuccess1: {
  path: 'request',
  handler: data => requestState => ({
    ...requestState,
    status: 'DONE',
    data
  })
}
```

In many cases multiple keys in state need to be updated in response to one action. One way to handle this is to use the spread operator. Note the function signature which takes the action payload and then the slice of state.

#### Updating Multiple Pieaces of State with Batch

```javascript
fetchSuccess2: {
  batch: [
    { path: ['request' 'status'], always: 'DONE' },
    { path: ['request' 'data'] }
  ]
}
```

A [batch](#batch) operation can be used to update separate pieces of state. Each item in the batch has the standard defaults and supports all of the reducer related properties.

#### Sharing Properties Between Batches

```javascript
fetchSuccess3: {
  path: 'request',
  batch: [
    { suffix: 'status', always: 'DONE' },
    { suffix: 'data' }
  ]
}
```

Any properties specified on the top level will be merged with the batch properties. In this case the [path](#path) will be shared between the two batches and the [suffix](#suffix) property will be appended to the shared path.

#### validating actions

```javascript
incrementUpToTen: {
  path: 'counter',
  arity: 0,
  handler: R.inc,
  validate: ({ slice }) => slice < 10
}
```

Actions can be [validated](#validate) with a predicate function that has access to state, slice, payload, and meta. The action will only be dispatched if the predicate function returns true. Async predicates are also supported.

## API Reference

### `createOptix`

The sole export of Redux Optix. It takes 1-2 arguments, `actionMap` and `options`. It returns an object with the following properties:

- `actions`: An object with the same keys as `actionMap`. The value of each key is an action creator with a `toString` method that returns the action type.
- `types`: An object with the same keys as `actionMap`. The value of each key is the action type.
- `reducer`: Reducer function that handles all actions specified in `actionMap`.

### `actionMap`

The actionMap is an object where each key is the name of an action creator and each value is a config object that may contain the following properties:

- #### `handler`

  `() => stateSlice => newStateSlice`  
  `payload => stateSlice => newStateSlice`  
  `(payload, meta) => stateSlice => newStateSlice`  
  `handler` updates the piece of state at the path specified (or the entire state if no path is specified). It is first called with some number of arguments from the action, then with the piece of state, and returns an update to that piece of state. The number of arguments `handler` is called with can be set with `arity` to ensure the right number of arguments are fed to auto-curried functions. The default value is `payload => () => payload`.

- #### `always`

  `any`  
  `always` is a shorthand for setting state to a constant value. If both `handler` and `always` are specified, `handler` takes precedence. `always` is ignored if set to `undefined`.

- #### `arity`

  `0 | 1 | 2`  
  `arity` determines how many arguments the `handler` function is initially called with. If neither `payloadCreator` nor `metaCreator` are specified, it also sets the arity of the default action creator. If `metaCreator` is specified, the default value is 2. If `always` is specified and `handler` is not, it is 0. In all other cases the default value is 1.

- #### `payloadCreator`

  `(...args) => payload`  
  `payloadCreator` is a function that takes any number of arguments and returns a value for the action payload. If `arity` is 1 or 2 the default value is a function that returns its first argument.

- #### `metaCreator`

  `(...args) => meta`  
  `metaCreator` is similar to `payloadCreator`. It is a function that takes any number of arguments (the same arguments as the `payloadCreator`) and returns a value for the action's meta property. If `arity` is 2 the default value is a function that returns its second argument.

- #### `path`

  `string | Array<string>`  
  `path` specifies a path into the state object. The value at that path will be passed to the `handler` function. `path` can be an array of keys or a string containing multiple keys, i.e. `'user.todos[0].text'`. If `path` is empty or undefined then the entire state will be passed to the `handler` function.

- #### `suffix`

  `string | Array<string>`  
  `suffix` specifies a partial path that will be appended to the value of `path`.

- #### `batch`

  `Array<Properties>`  
  `batch` is used to perform updates on multiple pieces of state. Any properties specified outside `batch` will be merged with the `batch` properties. `batch` supports `handler`, `always`, `arity`, `path`, and `suffix`.

- #### `validate`

  `(params: ValidateParams) => boolean | Promise<boolean>`

  > [Redux Thunk](https://github.com/reduxjs/redux-thunk) is required to use the `validate` property

  `validate` is a predicate function that prevents invalid actions from being dispatched. `validate` replaces the plain action creator normally returned by `createOptix` with a thunk that dispatches the underlying action if validation succeeds. The thunk returns the dispatched action if validation succeeds and false if it fails. Validation is run synchronously unless an async predicate is used. In the case of an async predicate the thunk will return a promise for either the dispatched action or false.

  - `ValidateParams`

    - `state`: the full state object
    - `slice`: the piece of state found at the resolved `path`
    - `payload`: the action's payload property
    - `meta`: the action's meta property
    - `extra`: Redux Thunk's [extra argument](#https://github.com/reduxjs/redux-thunk#injecting-a-custom-argument)

    > Note: the `state` and `slice` params are getters so state can be accessed asynchronously.

### `options`

The options object may contain the following properties:

- #### `initialState`

  `any`
  `initialState` defines the initial state of the reducer.

- #### `formatActionTypes`
  `(actionCreatorName: string) => string`
  `formatActionTypes` is a function that maps action creator names to action types. The default value is the identity function.
  ```javascript
  // CONSTANT_CASE action types example
  const options = { formatActionTypes: name => _.snakeCase(name).toUpperCase() }
  ```

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
const initialState = "STOPPED"

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

const { reducer, actions, types } = createOptix(mediaMachine, { initialState })
```

## FAQ

#### Is Redux Optix FSA Compliant?

Yes!

#### Why use Redux Optix over other Redux helper libraries?

- Action-Centric: All state updates for a given action are colocated, avoiding issues with [sharing data between slice reducers](https://redux.js.org/recipes/structuring-reducers/beyond-combinereducers)
- Less Boilerplate: A path is all that is needed to define an action creator and reducer case for a simple setter
- Ramda Compatible: Functions like `R.append`, `R.filter`, and `R.inc` can be used directly as handlers

#### What if I like `combineReducers` or I only want to use Redux Optix in one part of my Redux state?

That's ok! Redux Optix just generates a reducer and some actions. The generated reducer can be used with `combineReducers` or any other Redux helper function.

#### How does Redux Optix scale as an application grows?

Redux Optix scales very well. Different actions can be written in different files and then imported and combined into one `actionMap` object. Parts of the `actionMap` object can easily be split up and regrouped as desired without changing many imports as all action creators are generated from the one `createOptix` call.

## License

MIT
