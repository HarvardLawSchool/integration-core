# Integration Core

Generic shared-package repo for `integration-template`

Public visibility for raw-imports (see README `integration-template` for usage)

Release-version-adoption is opt-in excpept for `deploy-integration.yml` (see
note there). For new releases please tag and notify devs:

Show current tags:

```bash
git tag -l
```

Bump (after commit):

```bash
git tag v0.1.0 && git push origin v0.1.0
```

Pushing a tag triggers release.yml which stamps the version into deno.base.jsonc
and creates a GitHub Release automatically.

## Dependency sync

deno.jsonc and deno.base.jsonc both declare shared dependency versions. When
bumping a shared dependency, update both files.

## Extends reliability

Deno's extends does not reliably merge arrays or imports. Consumer projects must
declare exclude, unstable, and imports explicitly in their own deno.jsonc — do
not rely on inheriting them from deno.base.jsonc.
