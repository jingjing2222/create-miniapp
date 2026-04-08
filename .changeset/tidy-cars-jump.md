---
"create-rn-miniapp": patch
---

`tds-ui` skill이 source repo에 llms snapshot을 커밋하지 않고도, 스캐폴딩 시 공식 TDS React Native `llms.txt`, `llms-full.txt`를 설치된 workspace에 내려받아 mirror하도록 정리했습니다.

- source repo의 `skills/tds-ui/generated/`에는 `anomalies.json`만 유지하고, llms snapshot은 install-time download로 전환했습니다.
- skill metadata, AGENTS, references는 공식 URL을 canonical truth source로 두고, 설치된 workspace에서는 `generated/llms*.txt` mirror를 우선 읽도록 정리했습니다.
- create flow에 `tds-ui` llms mirror download hook을 추가하고 관련 회귀 테스트를 갱신했습니다.
