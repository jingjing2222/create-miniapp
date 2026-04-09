# Feedback And Loading

이 파일은 action / feedback 계열 canonical leaf를 고르는 routing note다.

## Canonical lookup order

- `generated/llms.txt`에서 action / feedback leaf slug와 canonical heading 후보를 먼저 찾는다.
- 후보가 정해지면 `generated/llms-full.txt`에서 해당 heading의 examples / interface section만 읽는다.

## Canonical leaf docs

- `button`: `generated/llms.txt`의 `Button` leaf, details는 `generated/llms-full.txt`의 `# Button` section
- `text-button`: `generated/llms.txt`의 `Text Button` leaf, details는 `generated/llms-full.txt`의 `# Text Button` section
- `icon-button`: `generated/llms.txt`의 `Icon Button` leaf, details는 `generated/llms-full.txt`의 `# Icon Button` section
- `dialog`: `generated/llms.txt`의 `Dialog` leaf, details는 `generated/llms-full.txt`의 `# Dialog` section
- `toast`: `generated/llms.txt`의 `Toast` leaf, details는 `generated/llms-full.txt`의 `# Toast` section
- `loader`: `generated/llms.txt`의 `Loader` leaf, details는 `generated/llms-full.txt`의 `# Loader` section
- `skeleton`: `generated/llms.txt`의 `Skeleton` leaf, details는 `generated/llms-full.txt`의 `# Skeleton` section
- `progress-bar`: `generated/llms.txt`의 `ProgressBar` leaf, details는 `generated/llms-full.txt`의 `# ProgressBar` section
- `result`: `generated/llms.txt`의 `Result` leaf, details는 `generated/llms-full.txt`의 `# Result` section
- `error-page`: `generated/llms.txt`의 `ErrorPage` leaf, details는 `generated/llms-full.txt`의 `# ErrorPage` section

## Comparison prompts

- `button` vs `text-button` vs `icon-button`: emphasis, icon-only affordance, disabled/loading behavior를 비교한다.
- `dialog` vs `toast` vs `result` vs `error-page`: blocking 여부, page-level 결과 여부, status-code semantics 여부를 비교한다.
- `loader` vs `skeleton`: 실제 콘텐츠를 대체하는 placeholder인지 단순 대기 스피너인지 비교한다.
- `progress-bar`: 수치형 진행률이 있을 때만 leaf docs를 추가로 읽는다.

## answer reminders

- loading, error, empty, disabled, a11y를 항상 같이 적는다.
- 버튼류는 loading과 disabled 동작을 같이 설계한다.
