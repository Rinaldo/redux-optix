import { getFullPath, getSlice } from "./utils"

export const actionCreatorCreator = (actionType, config) => {
  const { arity, handler, always, payloadCreator, metaCreator, validate } = config
  const path = getFullPath(config)

  let actionCreator
  if (metaCreator && payloadCreator) {
    actionCreator = (...args) => ({
      type: actionType,
      payload: payloadCreator(...args),
      meta: metaCreator(...args),
    })
    Object.defineProperty(actionCreator, "length", {
      value: Math.max(payloadCreator.length, metaCreator.length),
    })
  } else if (metaCreator) {
    actionCreator = (...args) => ({
      type: actionType,
      payload: args[0],
      meta: metaCreator(...args),
    })
    Object.defineProperty(actionCreator, "length", { value: Math.max(1, metaCreator.length) })
  } else if (payloadCreator) {
    actionCreator = (...args) => ({
      type: actionType,
      payload: payloadCreator(...args),
    })
    Object.defineProperty(actionCreator, "length", { value: payloadCreator.length })
  } else if (
    arity === 0 ||
    (arity === undefined && always !== undefined && handler === undefined)
  ) {
    actionCreator = () => ({
      type: actionType,
    })
  } else if (arity === 1 || arity === undefined) {
    actionCreator = payload => ({
      type: actionType,
      payload,
    })
  } else if (arity === 2) {
    actionCreator = (payload, meta) => ({
      type: actionType,
      payload,
      meta,
    })
  } else {
    throw Error(`no 'f' in way`)
  }

  if (validate) {
    const creator = actionCreator
    actionCreator = (...args) => (dispatch, getState, extra) => {
      const action = creator(...args)
      const params = {
        payload: action.payload,
        meta: action.meta,
        extra,
        get state() {
          return getState()
        },
        get slice() {
          return getSlice(path, getState())
        },
      }
      try {
        const validationResult = validate(params)
        if (
          validationResult &&
          typeof validationResult === "object" &&
          typeof validationResult.then === "function"
        ) {
          return validationResult
            .then(bool => (bool ? dispatch(action) : false))
            .catch(err => {
              console.error(`Error validating ${actionType}`, err)
              return false
            })
        }
        return validationResult ? dispatch(action) : false
      } catch (err) {
        console.error(`Error validating ${actionType}`, err)
        return false
      }
    }
    Object.defineProperty(actionCreator, "length", { value: creator.length })
  }

  actionCreator.toString = () => actionType
  return actionCreator
}
