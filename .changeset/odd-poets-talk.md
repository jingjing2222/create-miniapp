---
'create-rn-miniapp': patch
'@create-rn-miniapp/scaffold-templates': patch
---

Add npm and bun package manager support to the generator and detect the invoking package manager automatically for `npm create`, `pnpm create`, `yarn create`, and `bun create`.

Improve Firebase provisioning by automating more Google Cloud setup steps, handling Cloud Build API and default build service account detection, and making Firebase Functions scaffolding work more reliably across package managers.

Generate npm-specific `.npmrc` files for root and workspace packages so npm installs and Firebase Functions nested installs can consistently use `legacy-peer-deps` without command-specific flags.

Add `publish:dev` support for timestamped prerelease publishes and update generated provider docs and README guidance to match the new package manager and provisioning flows.
