/// <reference types="node" />
// Spec 0017 SDK-4, spec 0014 CNF-7: Vitest's global setup. When the run list holds a scenario that requires a project,
// the running server makes one, and its JSON is the only copy of the keys. With no such scenario this does nothing.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";
import type { BootstrappedProject, Scenario } from "./runner.js";
import generated from "./scenarios.generated.json" with { type: "json" };

declare module "vitest" {
  export interface ProvidedContext {
    project: BootstrappedProject | undefined;
  }
}

const composeFile = fileURLToPath(
  new URL("../../../.orvano/api/conformance/compose.yaml", import.meta.url),
);

/** Runs once per Vitest project, so each runtime gets a project of its own. */
export function setup(project: TestProject): void {
  const { scenarios } = generated as { scenarios: Scenario[] };
  if (!scenarios.some((scenario) => scenario.requires.includes("project"))) return;
  const origins: string[] = [];
  const output = execFileSync(
    "docker",
    [
      "compose",
      "--file",
      composeFile,
      "exec",
      "-T",
      "orvano",
      "/app/orvano",
      "admin",
      "bootstrap-project",
      "--owner-email",
      "conformance@orvano.test",
      "--organization",
      "Conformance",
      "--project",
      project.name,
      ...origins,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      // `exec` only finds the running container, but Compose reads the whole file first, and the file needs a tag.
      env: { ...process.env, ORVANO_IMAGE_TAG: process.env["ORVANO_IMAGE_TAG"] ?? "unused" },
    },
  );
  project.provide("project", JSON.parse(output) as BootstrappedProject);
}
