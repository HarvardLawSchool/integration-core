# Integration Core

Generic shared-package repo for `integration-template`

Public visibility for raw-imports (see README `integration-template` for usage)

Release-version-adoption is opt-in except for `deploy-integration.yml` (see note
there). For new releases please tag and notify devs:

Show current tags:

```bash
git tag -l
```

Bump (after commit):

```bash
git tag v0.1.0 && git push origin v0.1.0
```

## Shared CI

[`ci-integration.yml`](.github/workflows/ci-integration.yml) is the shared CI
for integrations, used from `@main`. It also runs on this repo's PRs. Changes
take effect across integrations on merge; see the header comment there for how
to test a change first.
