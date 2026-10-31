/// <reference types="node" />
// Spec 0014 CNF-5, spec 0005 SQA-3: every server scenario inside Deno or Bun, as the conformance project says.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { inject } from "vitest";
import { describeHosted } from "./hosted.js";

const { runtime } = inject("conformance");
// Deno gets the network and nothing else, so a Node or Deno API the SDK reaches for fails the run.
const command = runtime === "deno" ? ["run", "--allow-net"] : ["run"];

describeHosted("./serve.ts", async (script) => {
  // Outside the repo, so neither runtime picks up its package.json or lock file.
  const directory = await mkdtemp(join(tmpdir(), "orvano-conformance-"));
  const file = join(directory, "worker.mjs");
  await writeFile(file, script);
  const child = spawn(runtime, [...command, file], {
    cwd: directory,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const port = await new Promise<string>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => {
      reject(new Error(`${runtime} exited with ${String(code)} before it listened.`));
    });
    createInterface({ input: child.stdout }).once("line", resolve);
  });
  return {
    run: async (scenario) => {
      const answer = await fetch(`http://127.0.0.1:${port}/run`, {
        method: "POST",
        body: scenario,
      });
      return (await answer.json()) as unknown;
    },
    dispose: async () => {
      child.kill();
      await rm(directory, { recursive: true, force: true });
    },
  };
});
