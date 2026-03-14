---
'create-rn-miniapp': patch
'@create-rn-miniapp/scaffold-templates': patch
---

Improve the generated workspace docs so optional guidance only shows up when that workspace actually exists.

Generated apps now add backoffice React guidance and server-provider engineering docs only when `backoffice` or a specific `server` provider is selected, instead of always shipping those references in the base template.

Refactor the `create-rn-miniapp` source tree to reduce oversized root files by moving provider, patching, scaffold, and template logic into dedicated directories, colocating their tests, and removing non-`index` barrel files.
