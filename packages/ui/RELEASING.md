# Releasing @theopenlane/ui

The console uses `packages/ui` straight from source, so console changes never need a release. A release only matters for
apps that install `@theopenlane/ui` from npm.

## What gets published

Every export in `package.json` except the ones listed in `UNPUBLISHED_EXPORTS` (`scripts/publish-surface.mts`) and the
`./components/*` editor exports, plus `styles.css`. The data-table exports and the Plate editor stay console-only because
they depend on console GraphQL types.

Build it locally to see exactly what would ship:

```sh
bun run --cwd packages/ui build:package
cd packages/ui/dist && npm pack --dry-run
```

The build fails if a published file imports a package that is not declared in `package.json`, imports an unpublished
export, or uses client-only React APIs without `'use client'`.

## Cutting a release

1. Merge the changes to `main`.
2. Tag the commit and push the tag:

   ```sh
   git tag ui-v0.2.0
   git push origin ui-v0.2.0
   ```

In `.github/workflows/publish-ui.yml`, the `build` job builds and checks the package with the tag's version, and the
`publish` job then publishes exactly that build. Only `publish` can get an npm token, and it runs no repository code. A
version with a suffix (`ui-v0.3.0-rc.1`) goes to the `next` dist-tag instead of `latest`.

Versions 0.1.0 to 0.1.2 already exist on npm, so the first release from this workflow has to be 0.2.0 or later.

## One-time setup

Publishing uses npm trusted publishing, so there is no npm token. Before the first tag:

1. **npmjs.com**: `@theopenlane/ui` → Settings → Trusted publishing → GitHub Actions, with organization `theopenlane`,
   repository `openlane-ui`, workflow `publish-ui.yml` and environment `npm`.
2. **GitHub** (repo admin): Settings → Environments → create `npm`, and limit its deployment tags to `ui-v*`.
3. **GitHub** (repo admin): Settings → Rules → add a tag ruleset for `ui-v*` so only maintainers can create those tags.
