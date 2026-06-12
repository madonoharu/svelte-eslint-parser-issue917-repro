# svelte-eslint-parser issue #917 reproduction

Minimal reproduction for https://github.com/sveltejs/svelte-eslint-parser/issues/917

In a monorepo where the package's `eslint.config.js` imports a shared root config
(`import rootConfig from '../eslint.config.js'`) and the svelte block uses
`tseslint.parser` (the `typescript-eslint` meta-package re-export), the type of a
store subscription (`$data`) fails to resolve in `.svelte` templates:
`{#each $data.tags as tag}` infers `tag` as `unknown` and
`@typescript-eslint/no-unsafe-member-access` reports
"member access .tags on a type that cannot be resolved".

## Steps

```sh
pnpm install
cd pkg
pnpm run lint
```

## Expected

No error — `tag` should be inferred as `string` in [`pkg/src/repro.svelte`](./pkg/src/repro.svelte).

## Actual

```
pkg/src/repro.svelte
  7:14  error  Unsafe member access .tags on a type that cannot be resolved  @typescript-eslint/no-unsafe-member-access
  8:13  error  Invalid type "unknown" of template literal expression         @typescript-eslint/restrict-template-expressions
```

## Root cause (summary)

1. typescript-eslint v8's `configs` getter registers the directory of any stack
   frame named `eslint.config.*` as a candidate `tsconfigRootDir` on every
   `tseslint.configs.*` access. With a root config and a package config, **two
   candidates** get registered.
2. svelte-eslint-parser's `isTSESLintParserObject` probes the parser with
   `value.parseForESLint("", {})` — empty options, no `tsconfigRootDir`.
3. typescript-estree's `getInferredTSConfigRootDir()` **throws** when there are
   two candidates and no explicit `tsconfigRootDir`.
4. The probe's `catch { return false; }` swallows the error, the parser is
   misclassified as "not @typescript-eslint/parser", and template-side type
   integration is silently disabled.

The probe only runs because `tseslint.parser` is a thin wrapper exposing just
`parseForESLint` and `meta`, so the non-throwing duck-type check
(`maybeTSESLintParserObject`, which looks for `parse` / `createProgram` /
`clearCaches` / `version`) fails first.

## Knobs that flip the bug (all verified)

| Change | Result |
| --- | --- |
| Use raw `@typescript-eslint/parser` instead of `tseslint.parser` | fixed (duck check passes, probe never runs) |
| Rename root config to `eslint.base.js` | fixed (only one candidate registered) |
| Root config stops accessing `tseslint.configs.*` | fixed (only one candidate) |
| Patch probe to `parseForESLint("", { tsconfigRootDir: process.cwd() })` | fixed |
| Make the root config import a pure side-effect (`rootConfig` unused) | still broken |
| Set `tsconfigRootDir` explicitly in any/all configs | still broken (probe uses its own empty options) |
| Install `svelte` at the workspace root | still broken |
| Upgrade ESLint 9 → 10 | still broken |

## Workarounds

- **Recommended:** pass the raw parser: `import tsParser from '@typescript-eslint/parser'` and use `parserOptions: { parser: tsParser }` in the svelte block.
- Alternative: rename the shared root config so its filename doesn't match `eslint.config.*` (e.g. `eslint.base.js`).
