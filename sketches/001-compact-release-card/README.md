## Variant: Compact Release Card

### Design stance
기존 `ReleaseCard` 안에 “체감하기” 패널을 접어 넣어 현재 목록형 사이트의 흐름을 가장 적게 바꾼다.

### Key choices
- Layout: 기존 릴리즈 카드 아래에 compact split-pane preview를 삽입
- Typography: 현재 사이트와 비슷한 system font + mono code
- Color: 밝은 카드, 우측 TUI만 dark terminal 처리
- Interaction: Before/After toggle이 들어갈 자리만 표현

### Trade-offs
- Strong at: 현재 사이트에 가장 빨리 붙일 수 있음, 사용자 학습 비용 낮음
- Weak at: 복잡한 시나리오가 많아지면 카드가 길어짐

### Best for
- MVP 첫 적용
- 최신 릴리즈 1~3개에만 “체감하기”를 붙이는 경우
