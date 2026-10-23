// Spec 0014 AC-17, AC-18, CNF-5: every server scenario, in the runtime this Vitest project sets up. The servers come
// from api/conformance/compose.yaml at the pinned orvano commit (see README.md).
import { afterAll, describe, expect, inject, it } from "vitest";
import { notRun, runScenario, type Scenario, type Servers } from "./runner.js";
import generated from "./scenarios.generated.json" with { type: "json" };
import skips from "./skip.json" with { type: "json" };

declare module "vitest" {
  export interface ProvidedContext {
    conformance: { stubUrl: string; liveUrl: string; runtime: string; partial: boolean };
  }
}

const config = inject("conformance");
const scenarios = (generated as { scenarios: Scenario[] }).scenarios;
const skipList = skips as { id: string; reason: string; issue: string }[];
const servers: Servers = {
  stubUrl: config.stubUrl,
  liveUrl: config.liveUrl,
  fetch: (request) => globalThis.fetch(request),
};
const ran = new Set<string>();

describe(`0014 AC-17, AC-18: @orvano/server conformance in ${config.runtime}`, () => {
  for (const scenario of scenarios) {
    const skipped = skipList.some((skip) => skip.id === scenario.id);
    it.skipIf(skipped)(`${scenario.id}: ${scenario.title}`, async () => {
      ran.add(scenario.id);
      expect(await runScenario(scenario, servers)).toEqual([]);
    });
  }

  // CNF-8. Set ORVANO_CONFORMANCE_PARTIAL=1 when you run a few scenarios with -t; CI never sets it.
  afterAll(() => {
    if (config.partial) return;
    const problems = notRun(scenarios, ran, skipList);
    if (problems.length > 0) throw new Error(`0014 CNF-8: ${problems.join(" ")}`);
  });
});
