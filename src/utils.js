// Lodash _stringToPath
// https://github.com/lodash/lodash/blob/master/.internal/stringToPath.js
const regPropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|([''])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g
const regEscapeChar = /\\(\\)?/g

// Licia castPath
// https://github.com/liriliri/licia/blob/master/src/c/castPath.js
const castPath = string => {
  if (string === undefined) return []
  if (Array.isArray(string)) return string
  const ret = []
  string.replace(regPropName, (match, number, quote, str) => {
    ret.push(quote ? str.replace(regEscapeChar, "$1") : number || match)
  })
  return ret
}

export const getFullPath = ({ path, suffix }) => castPath(path).concat(castPath(suffix))

export const getSlice = (path, state) =>
  path.length ? path.reduce((slice, key) => slice[key], state) : state

export const id = x => x

const mustBe = (object, propName, ...types) => {
  const prop = object[propName]
  const propType = typeof prop
  if (
    prop !== undefined &&
    !types.some(type => {
      if (type === "array") return Array.isArray(prop)
      if (type === "integer") return Number.isInteger(prop)
      if (type === "object") return prop && propType === type
      return propType === type
    })
  ) {
    throw TypeError(`${propName} must be a ${types.join(" or ")}`)
  }
}

export const validateConfig = (config, actionName) => {
  if (!config || typeof config !== "object") {
    throw TypeError(`config for ${actionName} must be an object`)
  }
  mustBe(config, "arity", "integer")
  mustBe(config, "payloadCreator", "function")
  mustBe(config, "metaCreator", "function")
  mustBe(config, "handler", "function")
  mustBe(config, "path", "string", "array")
  mustBe(config, "suffix", "string", "array")
  mustBe(config, "batch", "array")
  mustBe(config, "validate", "function")

  if (config.batch !== undefined) {
    config.batch.forEach(validateConfig)
  }
  if (config.arity !== undefined && (config.arity < 0 || config.arity > 2)) {
    throw TypeError("arity must be an integer from 0 to 2")
  }
}

export const validateOptions = options => {
  mustBe(options, "formatActionTypes", "function")
}
