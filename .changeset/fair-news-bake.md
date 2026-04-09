---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

`tds-ui` skill이 TDS 문서를 찾을 때 `llms-full.txt`를 바로 뒤지지 않고, 먼저 `llms.txt` 인덱스로 후보와 docs path를 좁히도록 정리했습니다.

- `SKILL.md`, `AGENTS.md`, decision matrix, category reference가 모두 `llms.txt`를 shortlist 진입점으로 설명하도록 맞췄습니다.
- `llms-full.txt`는 후보가 정해진 뒤 examples, interface, semantics를 확인하는 용도로만 읽도록 계약을 분리했습니다.
- 관련 템플릿 테스트를 보강해 `tds-ui` skill이 index-first, full-on-demand 흐름을 계속 유지하는지 검증합니다.
