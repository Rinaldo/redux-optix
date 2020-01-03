import babel from "rollup-plugin-babel"
import { terser } from "rollup-plugin-terser"
import pkg from "./package.json"

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
      {
        file: pkg.unpkg,
        format: "umd",
        name: "optix",
      },
    ],
    plugins: [babel()],
  },
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/redux-optix.esm.mjs",
        format: "es",
      },
      {
        file: "dist/redux-optix.umd.min.js",
        format: "umd",
        name: "optix",
      },
    ],
    plugins: [babel(), terser()],
  },
]
