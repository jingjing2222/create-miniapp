---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

Add a generated boundary type checker for tRPC workspaces.

- add a root `boundary-types:check` script only when tRPC is scaffolded
- fail `verify` when `packages/contracts` boundary types are re-declared in other workspaces
- document the generated boundary checker in the tRPC SSOT guide and shared workspace READMEs
