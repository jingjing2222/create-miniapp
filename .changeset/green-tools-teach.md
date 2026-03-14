---
'create-rn-miniapp': patch
'@create-rn-miniapp/scaffold-templates': patch
---

Improve package manager selection during interactive scaffolding.

`pnpm create rn-miniapp` now defaults to `pnpm` and `yarn create rn-miniapp`
now defaults to `yarn` without showing the package manager prompt first.
`npm create rn-miniapp` keeps the existing package manager selection prompt so
users can choose between `pnpm` and `yarn`.

Update the root README to explain the new invocation-based package manager
behavior and show the matching `npm`, `pnpm`, and `yarn` create commands.
