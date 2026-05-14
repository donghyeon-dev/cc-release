## Variant: Guided Diff Wizard

### Design stance
릴리즈 문장을 단계형 가이드로 바꿔 “무슨 설정을 왜 넣는지”를 친절하게 설명한다.

### Key choices
- Layout: 4-step wizard + editor/TUI preview
- Typography: 설명형 product UI, 코드와 터미널은 보조
- Color: 밝은 glass card + indigo accent
- Interaction: 단계 진행, Before/After/Diff segment로 확장 가능

### Trade-offs
- Strong at: 사용자 교육, 안전한 설정 적용 설명, 신규 사용자 친화성
- Weak at: power user에게는 약간 장황할 수 있음

### Best for
- env/config 기능의 “적용 방법” 설명
- 릴리즈 노트 문장만으로 이해하기 어려운 변경사항
