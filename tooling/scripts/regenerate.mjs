// Spec 0014 RGN-1 to RGN-3: regenerates this repo's generated code from the orvano commit in orvano-contract.json.
//   pnpm regenerate                  fetch the pinned commit into .orvano/, check the contract hash, run the generator
//   pnpm regenerate --pin <40 hex>   move the pin to that commit first (writes orvano-contract.json)
// CI runs `pnpm regenerate` and then `git diff --exit-code` (the drift check, spec 0005 CGN-3).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const target = "ts-server";
const out = "packages/server";
// What the target owns (GNR-9), formatted after it runs.
const owned = [
  "src/generated",
  "src/runtime",
  "conformance/dispatch.generated.ts",
  "conformance/scenarios.generated.json",
];

const root = new URL("../..", import.meta.url).pathname;
const pinPath = join(root, "orvano-contract.json");
const checkout = join(root, ".orvano");
const commitPattern = /^[0-9a-f]{40}$/;

/**
 * Runs a command and stops with its exit code when it fails.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, quiet?: boolean }} [options]
 * @returns {string}
 */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.quiet === true ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
    env: { ...process.env, ORVANO_SKIP_HOOKS: "1" },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(
      `regenerate: \`${command} ${args.join(" ")}\` failed.${options.quiet === true ? `\n${result.stderr}` : ""}`,
    );
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

/** Fetches one orvano commit into .orvano/ with no token (the repo is public), unless it is already there. */
function fetchCommit(/** @type {string} */ commit) {
  if (!existsSync(join(checkout, ".git"))) run("git", ["init", "-q", checkout]);
  const head = spawnSync("git", ["-C", checkout, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();
  if (head === commit) return;
  run("git", [
    "-C",
    checkout,
    "fetch",
    "-q",
    "--depth",
    "1",
    "https://github.com/orvanohq/orvano",
    commit,
  ]);
  run("git", ["-C", checkout, "checkout", "-q", "--detach", "FETCH_HEAD"]);
}

/** The public contract's version and hash at the checked out commit (RGN-1). */
function contractFacts() {
  const bytes = readFileSync(join(checkout, "api", "openapi.json"));
  const document = /** @type {{ info: { version: string } }} */ (
    JSON.parse(bytes.toString("utf8"))
  );
  return {
    apiVersion: document.info.version,
    contractSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const { values } = parseArgs({ options: { pin: { type: "string" } }, strict: true });

if (values.pin !== undefined) {
  if (!commitPattern.test(values.pin)) {
    console.error("regenerate: --pin needs a 40 character lowercase commit SHA.");
    process.exit(2);
  }
  fetchCommit(values.pin);
  writeFileSync(
    pinPath,
    `${JSON.stringify({ commit: values.pin, ...contractFacts() }, null, 2)}\n`,
  );
}

const pin = /** @type {{ commit: string, apiVersion: string, contractSha256: string }} */ (
  JSON.parse(readFileSync(pinPath, "utf8"))
);
if (!commitPattern.test(pin.commit)) {
  console.error("regenerate: orvano-contract.json needs a 40 character lowercase commit.");
  process.exit(1);
}
fetchCommit(pin.commit);

// RGN-3: the pin must describe the contract at its commit.
const facts = contractFacts();
if (facts.contractSha256 !== pin.contractSha256 || facts.apiVersion !== pin.apiVersion) {
  console.error(
    `regenerate: orvano-contract.json says ${pin.apiVersion} (sha256 ${pin.contractSha256}), but api/openapi.json at ` +
      `${pin.commit} is ${facts.apiVersion} (sha256 ${facts.contractSha256}). Run pnpm regenerate --pin ${pin.commit}.`,
  );
  process.exit(1);
}

run("pnpm", ["install", "--frozen-lockfile", "--filter", "@orvano/sdk-generator..."], {
  cwd: checkout,
  quiet: true,
});
run("node", [
  join(checkout, "api", "generator", "src", "cli.ts"),
  "--target",
  target,
  "--contract",
  join(checkout, "api", "openapi.json"),
  "--out",
  join(root, out),
  "--commit",
  pin.commit,
]);
run("pnpm", ["exec", "vp", "fmt", ...owned.map((path) => join(out, path))]);
console.log(
  `regenerate: ${out} matches orvano ${pin.commit.slice(0, 7)} (contract ${pin.apiVersion}).`,
);
