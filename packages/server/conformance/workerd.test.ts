/// <reference types="node" />
// Spec 0014 AC-17, AC-18, CNF-5, spec 0005 SQA-3: every server scenario inside workerd. The worker bundle runs under
// Miniflare; this Node side only hands it one scenario at a time and checks the answer.
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { notRun, type Scenario } from "./runner.js";
import generated from "./scenarios.generated.json" with { type: "json" };
import skips from "./skip.json" with { type: "json" };

const config = inject("conformance");
const project = inject("project");
const scenarios = (generated as { scenarios: Scenario[] }).scenarios;
const skipList = skips as { id: string; reason: string; issue: string }[];
const ran = new Set<string>();
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

let miniflare: Miniflare | undefined;

beforeAll(async () => {
  const bundle = await build({
    entryPoints: [new URL("./worker.ts", import.meta.url).pathname],
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    define: { __ORVANO_SDK_VERSION__: JSON.stringify(version) },
  });
  const script = bundle.outputFiles[0]?.text ?? "";
  miniflare = new Miniflare({ modules: true, script, compatibilityDate: "2026-07-01" });
  await miniflare.ready;
}, 60_000);

afterAll(async () => {
  await miniflare?.dispose();
});

describe(`0014 AC-17, AC-18: @orvano/server conformance in workerd`, () => {
  for (const scenario of scenarios) {
    const skipped = skipList.some((skip) => skip.id === scenario.id);
    it.skipIf(skipped)(`${scenario.id}: ${scenario.title}`, async () => {
      ran.add(scenario.id);
      if (miniflare === undefined) throw new Error("Miniflare did not start.");
      const answer = await miniflare.dispatchFetch("http://worker/run", {
        method: "POST",
        body: JSON.stringify({
          scenario,
          stubUrl: config.stubUrl,
          liveUrl: config.liveUrl,
          project,
        }),
      });
      expect(await answer.json()).toEqual([]);
    });
  }

  // CNF-8. Set ORVANO_CONFORMANCE_PARTIAL=1 when you run a few scenarios with -t; CI never sets it.
  afterAll(() => {
    if (config.partial) return;
    const problems = notRun(scenarios, ran, skipList);
    if (problems.length > 0) throw new Error(`0014 CNF-8: ${problems.join(" ")}`);
  });
});
