import { each, get } from "lodash";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import execute from "rollup-plugin-execute";
import fs from "fs";
import typescript from "rollup-plugin-typescript2";

/**
 * Mapping of Obsidian manifest keys to npm package.json paths
 */
const PACKAGE_PATH_BY_MANIFEST_FIELD = {
  id: "name",
  version: "version",
  description: "description",
  author: "author.name",
  authorUrl: "author.url",
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const renderTemplate = (content) => {
  const pkg = JSON.parse(fs.readFileSync("package.json").toString());
  const manifest = JSON.parse(content.toString());

  each(PACKAGE_PATH_BY_MANIFEST_FIELD, (path, field) => {
    manifest[field] = get(pkg, path);
  });

  return JSON.stringify(manifest, null, 2);
};

export default {
  input: "src/main.ts",
  output: {
    dir: "dist",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian"],
  plugins: [
    {
      name: "watch-external",
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      buildStart() {
        this.addWatchFile("src/manifest.json");
        this.addWatchFile("src/style.css");
      },
    },
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    copy({
      targets: [
        {
          src: "src/manifest.json",
          dest: "dist",
          transform: renderTemplate,
        },
        {
          src: "src/style.css",
          dest: "dist",
        },
      ],
    }),
    execute("./install.sh"),
  ],
};
