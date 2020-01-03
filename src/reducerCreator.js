import { getFullPath } from "./utils"

const pathlessReducerCreator = (arity, handler, always) => {
  if (handler) {
    switch (arity) {
      case 0:
        return state => handler()(state)
      case 1:
        return (state, action) => handler(action.payload)(state)
      case 2:
        return (state, action) => handler(action.payload, action.meta)(state)
      default:
        throw Error(`no 'f' in way`)
    }
  } else if (always !== undefined) {
    return () => always
  } else {
    return (_, action) => action.payload
  }
}

export const caseReducerCreator = config => {
  const path = getFullPath(config)
  const reducerArity = config.arity !== undefined ? config.arity : config.metaCreator ? 2 : 1

  if (config.batch && config.batch.length) {
    const { batch, ...restOfConfig } = config
    return batch
      .map(batchConfig => ({ ...restOfConfig, ...batchConfig }))
      .map(caseReducerCreator)
      .reduceRight((acc, curr) => (state, action) => acc(curr(state, action), action))
  }

  const pathlessReducer = pathlessReducerCreator(reducerArity, config.handler, config.always)

  if (!path.length) {
    return pathlessReducer
  }

  return (state, action) => {
    const newState = Array.isArray(state) ? state.slice() : { ...state }
    let slice = newState
    let i
    let key
    for (key = path[(i = 0)]; i < path.length - 1; key = path[++i]) {
      if (!slice[key] || typeof slice[key] !== "object") {
        throw Error("Cannot create multiple keys")
      }
      slice[key] = Array.isArray(slice[key]) ? slice[key].slice() : { ...slice[key] }
      slice = slice[key]
    }
    slice[key] = pathlessReducer(slice[key], action)
    return newState
  }
}

export const reducerCreator = (caseReducers, initialState) => (state = initialState, action) => {
  const reducer = caseReducers[action.type]
  return reducer ? reducer(state, action) : state
}
