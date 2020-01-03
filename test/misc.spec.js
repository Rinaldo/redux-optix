import { createOptix } from "../src"

describe("Arguments and options handling", () => {
  it("requires an actionMap argument", () => {
    expect(() => createOptix()).toThrow()
    expect(() => createOptix(null)).toThrow()
    expect(() => createOptix("foo")).toThrow()
  })

  it("requires the config options to be of the correct type", () => {
    expect(() =>
      createOptix({
        someAction: { arity: 1.5 },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { arity: 7 },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { handler: "foo" },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { payloadCreator: "foo" },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { metaCreator: "foo" },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { path: {} },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { batch: {} },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: { validate: {} },
      })
    ).toThrow()
    expect(() =>
      createOptix({
        someAction: "foo",
      })
    ).toThrow()
  })

  it("requires formatActionTypes to be a one-to-one function for the set of action names", () => {
    expect(() =>
      createOptix(
        {
          someAction: {},
          SomeAction: {},
        },
        { formatActionTypes: type => type.toUpperCase() }
      )
    ).toThrow()
  })
})
