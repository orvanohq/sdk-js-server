/// <reference types="node" />
// Spec 0014 AC-17, AC-18, CNF-5, spec 0005 SQA-3: every server scenario inside a runtime Vitest doesn't run in. The test
// worker is bundled and started there; this Node side only hands it one scenario at a time and checks the answer.
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { notRun, type Scenario } from "./runner.js";
import generated from "./scenarios.generated.json" with { type: "json" };
import skips from "./skip.json" with { type: "json" };

/** A runtime holding the bundled test worker. */
export interface Host {
  /** Runs one scenario inside the runtime and returns the mismatches it answered. */
  readonly run: (scenario: string) => Promise<unknown>;
  readonly dispose: () => Promise<void>;
}

/** Bundles `entry` (relative to this folder), starts it with `start`, and runs every scenario through it. */
export function describeHosted(entry: string, start: (script: string) => Promise<Host>): void {
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

  let host: Host | undefined;

  beforeAll(async () => {
    const bundle = await build({
      entryPoints: [new URL(entry, import.meta.url).pathname],
      bundle: true,
      write: false,
      format: "esm",
      platform: "neutral",
      target: "es2022",
      define: { __ORVANO_SDK_VERSION__: JSON.stringify(version) },
    });
    host = await start(bundle.outputFiles[0]?.text ?? "");
  }, 60_000);

  afterAll(async () => {
    await host?.dispose();
  });

  describe(`0014 AC-17, AC-18: @orvano/server conformance in ${config.runtime}`, () => {
    for (const scenario of scenarios) {
      const skipped = skipList.some((skip) => skip.id === scenario.id);
      it.skipIf(skipped)(`${scenario.id}: ${scenario.title}`, async () => {
        ran.add(scenario.id);
        if (host === undefined) throw new Error(`${config.runtime} did not start.`);
        const answer = await host.run(
          JSON.stringify({ scenario, stubUrl: config.stubUrl, liveUrl: config.liveUrl, project }),
        );
        expect(answer).toEqual([]);
      });
    }

    // CNF-8. Set ORVANO_CONFORMANCE_PARTIAL=1 when you run a few scenarios with -t; CI never sets it.
    afterAll(() => {
      if (config.partial) return;
      const problems = notRun(scenarios, ran, skipList);
      if (problems.length > 0) throw new Error(`0014 CNF-8: ${problems.join(" ")}`);
    });
  });
}
