# svelte-eslint-parser issue #917 reproduction

Minimal reproduction for https://github.com/sveltejs/svelte-eslint-parser/issues/917

In a monorepo where the package's `eslint.config.js` imports a shared root config
(`import rootConfig from '../eslint.config.js'`), the type of a store subscription
(`$data`) fails to resolve in `.svelte` templates: `{#each $data.tags as tag}` infers
`tag` as `unknown` and `@typescript-eslint/no-unsafe-member-access` reports
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

## Trigger

The bug is triggered by the `import rootConfig from '../eslint.config.js'` line in
[`pkg/eslint.config.js`](./pkg/eslint.config.js):

- Remove that import (and use `ts.configs.recommendedTypeChecked` directly in `extends`) → **no errors**.
- Keep the import but don't use `rootConfig` anywhere (pure side-effect import) → **errors come back**.

So loading the root flat-config module is what breaks the store type resolution,
not the contents of the resulting ESLint config.

## Notes

- Accessing the same expression in a mustache tag (`{$data.tags[0]}`) resolves to `string` even when the bug is active — only the `{#each}` item is affected by the `unknown` inference (the `no-unsafe-member-access` report appears on the each source).
- Copying the array with a spread (`{#each [...$data.tags] as tag}`) is a workaround.
- Extracting with `$derived($data.tags)` does NOT help; `$derived([...$data.tags])` does.
- Does not reproduce in a single-package (non-monorepo) setup.
