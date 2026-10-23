/// <reference types="node" />
// Spec 0005 KEY-1: the browser and React Native guard throws on import and stubs every public value name.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as entry from "../src/index.js";

const guardSource = readFileSync(new URL("../src/browser-guard.ts", import.meta.url), "utf8");

describe("the browser guard", () => {
  it("throws on import, naming the package to use instead", async () => {
    await expect(import("../src/browser-guard.js")).rejects.toThrow(
      /must never ship to a browser or a device\. Use @orvano\/client there\./,
    );
  });

  it("exports a stub for every value the real entry exports", () => {
    const stubs = [...guardSource.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(
      (found) => found[1],
    );
    expect(new Set(stubs)).toEqual(new Set(Object.keys(entry)));
  });
});
