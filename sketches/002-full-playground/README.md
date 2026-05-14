## Variant: Full Playground

### Design stance
릴리즈 상세 페이지를 “Impact Playground”로 전환해 설정 patch, TUI 예상 결과, 영향도 점수를 한 화면에서 깊게 보여준다.

### Key choices
- Layout: 좌측 scenario navigator + 우측 full workbench
- Typography: 어두운 tool UI, 코드와 터미널 중심
- Color: high-contrast dark UI with cyan/green terminal accents
- Interaction: scenario 선택, Before/After, Run/Result 탭으로 확장 가능

### Trade-offs
- Strong at: 제품 정체성이 가장 강함, 복잡한 릴리즈를 설명하기 좋음
- Weak at: 기존 목록 UI와 별도 상세 페이지가 필요하고 구현량이 가장 큼

### Best for
- `/releases/[version]` 상세 페이지
- env/config/permission/MCP 변화처럼 설명할 내용이 많은 릴리즈
