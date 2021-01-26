/* eslint-disable import/no-unresolved, global-require, @typescript-eslint/no-var-requires , import/no-extraneous-dependencies */
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import sourceMaps from "rollup-plugin-sourcemaps";
import camelCase from "lodash.camelcase";
import typescriptPlugin from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import { parse, join } from "path";
import bundleSize from "rollup-plugin-bundle-size";
import typescript from "typescript";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), { encoding: "utf8" }));

const libraryName = parse(pkg.main).name;

function addMinExtension(path) {
  const { dir, name, ext } = parse(path);
  return `${dir}/${name}.min${ext}`;
}

export default {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: "cjs", sourcemap: true },
    { file: addMinExtension(pkg.main), name: camelCase(libraryName), format: "cjs", sourcemap: true, plugins: [terser()] },
    { file: pkg.module, format: "esm", sourcemap: true },
    { file: addMinExtension(pkg.module), format: "esm", sourcemap: true, plugins: [terser()] },
    { file: pkg["umd:main"], name: camelCase(libraryName), format: "umd", sourcemap: true },
    { file: addMinExtension(pkg["umd:main"]), name: camelCase(libraryName), format: "umd", sourcemap: true, plugins: [terser()] },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [...Object.keys(pkg.dependencies || {})],
  watch: {
    include: "src/**",
  },
  plugins: [
    bundleSize(),
    json(),
    // Compile TypeScript files
    typescriptPlugin({ useTsconfigDeclarationDir: true, typescript }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps(),
  ],
};
