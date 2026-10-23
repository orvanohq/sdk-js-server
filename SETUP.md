# Set up this repo

You made this repo from `orvanohq/sdk-template-typescript` (spec 0010 TPL-4). Work through this list, then delete this file.

## Placeholders to fill in

- `{{PRODUCT_NAME}}` in `NOTICE` and `README.md`: the repo's name from spec 0009 LIC-2's table
- `{{PACKAGE_NAME}}` in `README.md`: the package name from spec 0007 REP-3
- The package name and description in the language manifest: each published package's `packages/*/package.json` (`name`, `description`, `repository`)

## Steps

1. Make the repo **public** from the start ("Use this template" with visibility public). On GitHub Free, its
   ruleset, CodeQL, and secret scanning need that.
2. Fill in the placeholders above.
3. From a clone of `orvanohq/orvano`, apply the settings (a template doesn't copy rulesets or settings):

   ```bash
   node tooling/scripts/github-settings.mjs orvanohq/<this-repo> --profile sdk-typescript --apply
   ```

4. Open a first PR. Its green CI is the proof these starter files work (spec 0008 KIT-3).
5. Delete this file.

CI calls the core's shared workflows at `cb12f1df33e00f892de7040a05e3ab17cf9410d4` (`main` as of 2026-10-18). Move that pin forward with the
core.

## Common files

Every SDK repo has these at its root:

- `.editorconfig`, `.gitattributes`: the same basics as the core repo (spec 0008 FMT-4, GIT-4)
- `LICENSE`, `NOTICE`: Apache 2.0 (spec 0009 LIC-1, LIC-2). Replace `{{PRODUCT_NAME}}` in `NOTICE` with the repo's
  name from spec 0009 LIC-2's table (for example `Orvano .NET Server SDK`); leave `LICENSE` exactly as it is
- `.github/dependency-review-config.yml`: the SDK license lists (spec 0009 DEP-8); keep only your repo's exceptions
- `typos.toml`: keep only the excludes that exist in your repo
- `.github/pull_request_template.md`: keep the blocks that fit the SDK (Security always stays, PRT-1)
- `.github/dependabot.yml`: the ecosystems the repo uses (the export keeps the language's and `github-actions`)
- `.github/zizmor.yml`: the same zizmor settings as the core repo
- `.github/CODEOWNERS`: added by the export (spec 0010 OWN-1)
- `.github/workflows/ci.yml`: calls the shared workflows at a pinned core SHA (KIT-1). The export sets the language,
  the SHA, and its date; move the pin forward with the core
- `.github/workflows/codeql.yml` (not for Dart) and `.github/workflows/dependency-review.yml`: the security checks
  the repo's `main` ruleset requires (spec 0010 TPL-5, RUL-3). Both need a public repo on GitHub Free

Community files (security policy, code of conduct, support, contributing, and issue forms) come from the org's
`orvanohq/.github` repo, so an SDK repo doesn't carry its own (spec 0010 COM-4, ISS-3).

## TypeScript SDK starter

For each TypeScript SDK repo (spec 0005, names from spec 0007 REP-3): `sdk-js` (`@orvano/client`), `sdk-js-server`
(`@orvano/server`), and `sdk-nextjs` (`@orvano/nextjs`). Each keeps its package under `packages/`.

At the repo root:

- `package.json`: merge the scripts and dev tools into yours. Each published package's own `package.json` sets
  `"license": "Apache-2.0"` and `"files": ["dist", "NOTICE"]`, with a copy of `NOTICE` beside it (spec 0009 LIC-6). Versions match the core repo's TL-4 pins; move them
  together (the Dependabot `toolchain` group, DPB-2).
- `pnpm-workspace.yaml`, `tsconfig.base.json` (TYP-1; each package's `tsconfig.json` extends it)
- `vite.config.ts`, `.oxlintrc.json`: Oxfmt, Oxlint, and the staged map (FMT-1, LNT-1, HOK-2)
- `eslint.config.ts`: typescript-eslint strict type checked plus the spec 0005 restrictions (RTM-2, RTM-4, RTM-6,
  KEY-5, NXT-5, SDK-4, SDK-6, the Replaces list). `packages/*/src/env.ts` is NXT-5's one home.
- `.size-limit.json`: SIZ-1's budgets through esbuild. Add one entry per service.
- `.vite-hooks/pre-commit` (commit it with the executable bit) and `tooling/scripts/prepare.mjs` (HOK-1)
- `.node-version` from the core repo (`24.22.0`)

CI: `sdk-typescript.yml` (KIT-1) runs `pnpm check`, the build, publint and are-the-types-wrong, tests, size, and audit.
