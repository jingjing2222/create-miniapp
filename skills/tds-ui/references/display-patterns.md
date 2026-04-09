# Display Patterns

이 파일은 display 계열에서 어떤 canonical leaf를 열어야 하는지 빠르게 정리한 routing note다.

## Canonical lookup order

- `generated/llms.txt`에서 display / visual utility leaf slug와 canonical heading 후보를 먼저 찾는다.
- 후보가 정해지면 `generated/llms-full.txt`에서 해당 heading의 examples / interface section만 읽는다.

- `amount-top`: 금액 hero. `generated/llms.txt`의 `AmountTop` leaf, details는 `generated/llms-full.txt`의 `# AmountTop` section
- `asset`: 이미지/아이콘/Lottie frame surface. `generated/llms.txt`의 `Asset` leaf, details는 `generated/llms-full.txt`의 `# Asset` section
- `badge`: 상태 chip, 강조 라벨. `generated/llms.txt`의 `Badge` leaf, details는 `generated/llms-full.txt`의 `# Badge` section
- `bottom-info`: 하단 안내, 면책, 법적 고지. `generated/llms.txt`의 `Bottom Info` leaf, details는 `generated/llms-full.txt`의 `# Bottom Info` section
- `carousel`: 가로 스와이프 카드/배너. `generated/llms.txt`의 `Carousel` leaf, details는 `generated/llms-full.txt`의 `# Carousel` section
- `chart`: 막대 차트. `generated/llms.txt`의 `BarChart` leaf, details는 `generated/llms-full.txt`의 `# BarChart (/tds-react-native/components/Chart/bar-chart/)` section
- `gradient`: gradient visual utility. `generated/llms.txt`의 `Gradient` leaf, details는 `generated/llms-full.txt`의 `# Gradient` section
- `highlight`: 온보딩/튜토리얼 강조. `generated/llms.txt`의 `Highlight` leaf, details는 `generated/llms-full.txt`의 `# Highlight` section
- `post`: 공지, 이벤트, 장문 본문. `generated/llms.txt`의 `Post` leaf, details는 `generated/llms-full.txt`의 `# Post` section
- `shadow`: shadow visual utility. `generated/llms.txt`의 `Shadow` leaf, details는 `generated/llms-full.txt`의 `# Shadow` section

색상/타이포 토큰까지 같이 봐야 하면 `generated/llms.txt`에서 `Colors`, `Typography` leaf를 먼저 찾고, 이어서 `generated/llms-full.txt`의 `# Colors`, `# Typography` section을 읽는다.

## quick comparisons

- `bottom-info` vs `post`: 둘 다 leaf docs를 열고, 짧은 하단 고지인지 장문 본문인지 먼저 구분한다.
- `asset`: frame shape와 resource 종류를 leaf examples / interface에서 확인한다.
- `badge`: size, tone, typography를 leaf docs에서 확인한다.
