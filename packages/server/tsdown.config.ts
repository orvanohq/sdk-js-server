import { readFileSync } from "node:fs";
import { defineConfig, type UserConfig } from "tsdown";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

// Spec 0005 BLD-1 to BLD-3: ESM only, one output file per source module, no Node built ins, declarations from
// isolatedDeclarations, publint and are-the-types-wrong on every build. The exports map is written by hand (NPM-2).
const config: UserConfig = defineConfig({
  entry: ["src/index.ts", "src/browser-guard.ts"],
  format: "esm",
  unbundle: true,
  platform: "neutral",
  target: "es2022",
  dts: true,
  sourcemap: true,
  minify: false,
  fixedExtension: false,
  exports: false,
  define: { __ORVANO_SDK_VERSION__: JSON.stringify(version) },
  publint: { level: "error" },
  attw: { profile: "esm-only", level: "error" },
});

export default config;
