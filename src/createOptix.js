import { id, validateConfig, validateOptions } from "./utils"
import { actionCreatorCreator } from "./actionCreatorCreator"
import { caseReducerCreator, reducerCreator } from "./reducerCreator"

export const createOptix = (actionMap, options = {}) => {
  validateOptions(options)
  if (!actionMap || typeof actionMap !== "object") {
    throw Error("actionMap parameter is required")
  }
  const { formatActionTypes = id, initialState } = options
  const condensed = Object.entries(actionMap).reduce(
    (acc, [actionName, config]) => {
      validateConfig(config, actionName)
      const actionType = formatActionTypes(actionName)
      const actionCreator = actionCreatorCreator(actionType, config)
      const caseReducer = caseReducerCreator(config)

      if (acc.caseReducers[actionType]) {
        throw Error(
          `Duplicate action type detected: ${actionType}\nformatActionTypes must return unique types.`
        )
      }
      return {
        actions: { ...acc.actions, [actionName]: actionCreator },
        types: { ...acc.types, [actionName]: actionType },
        caseReducers: { ...acc.caseReducers, [actionType]: caseReducer },
      }
    },
    {
      actions: {},
      types: {},
      caseReducers: {},
    }
  )

  return {
    actions: condensed.actions,
    types: condensed.types,
    reducer: reducerCreator(condensed.caseReducers, initialState),
  }
}
