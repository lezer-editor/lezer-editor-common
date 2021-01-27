import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: ["./src/index.ts"],
    output: [{
      format: "cjs",
      exports: "auto",
      file: "./dist/index.cjs"
    },
    {
      format: "es",
      exports: "auto",
      file: "./dist/index.js"
    }],
    external(id) {
      return !/^[\.\/]/.test(id)
    },
    plugins: [
      nodeResolve(),
      typescript(),
      commonjs()
    ]
  }]