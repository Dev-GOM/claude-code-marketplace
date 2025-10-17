---
description: 기능 명세(Specification) 작성 - WHAT을 정의
allowed-tools: [Read, Write, Bash]
---

# Write Feature Specification

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

기능의 요구사항, 수용 기준, 사용자 흐름을 정의합니다. HOW가 아닌 WHAT에 집중합니다.

## Prerequisites

헌법이 먼저 존재해야 합니다:

```bash
cat .specify/memory/constitution.md
```

없다면 `/spec-kit:constitution`을 먼저 실행하세요.

## Step 1: Gather Requirements

사용자와 대화하며 다음을 파악:

1. **기능이 무엇인가?**
   - 고수준 설명
   - 사용자 대면 vs 내부 기능

2. **누가 필요로 하는가?**
   - 대상 사용자/페르소나
   - 사용 사례

3. **왜 필요한가?**
   - 해결하려는 문제
   - 가치 제안

4. **성공은 어떤 모습인가?**
   - 기대 결과
   - 측정 가능한 목표

5. **제약사항은?**
   - 기술적 제한
   - 비즈니스 요구사항
   - 일정/예산

## Step 2: Structure Specification

사용자와 함께 다음 구조로 명세 내용을 정리합니다:

### Specification Template

```markdown
# Feature: [Feature Name]

## Overview

[1-2 문단 요약: 기능 설명과 중요성]

## User Stories

### Primary Stories

As a [사용자 유형],
I want [목표/욕구],
So that [이점/가치].

[3-5개 주요 사용자 스토리]

### Secondary Stories

[부가 사용자 스토리]

## Requirements

### Functional Requirements

#### Must Have (P0)

1. **[기능명]**
   - [구체적 요구사항]
   - [구체적 요구사항]

#### Should Have (P1)

[중요하지만 필수는 아닌 기능]

#### Could Have (P2)

[있으면 좋은 기능]

### Non-Functional Requirements

#### Performance
- [성능 요구사항]

#### Scalability
- [확장성 요구사항]

#### Accessibility
- [접근성 요구사항]

#### Security
- [보안 요구사항]

#### Usability
- [사용성 요구사항]

## User Interface

### Key Screens

[와이어프레임 또는 텍스트 기반 UI 설명]

## User Flows

### Flow 1: [흐름명]

1. [단계]
2. [단계]
...

## Acceptance Criteria

- [ ] [테스트 가능한 기준]
- [ ] [테스트 가능한 기준]
...

## Edge Cases & Constraints

### Edge Cases
1. [엣지 케이스]

### Constraints
1. [제약사항]

## Dependencies

### Internal
- [내부 의존성]

### External
- [외부 의존성]

## Out of Scope (V1)

명시적으로 포함되지 않는 것:
- ❌ [제외 항목]
- ❌ [제외 항목]

## Success Metrics

### Adoption Metrics
- [채택 지표]

### Engagement Metrics
- [참여 지표]

### Performance Metrics
- [성능 지표]

### Quality Metrics
- [품질 지표]

## Risks & Mitigations

### Risk 1: [위험]
**Mitigation**: [완화 전략]

## Open Questions

[구현 전 해결해야 할 질문들]

---
**Version**: 1.0
**Created**: [Date]
**Status**: Draft | In Review | Approved
```

## Step 3: Validate Against Constitution

명세가 헌법과 부합하는지 검증:

```bash
cat .specify/memory/constitution.md
```

헌법의 원칙, 성능 예산, 보안 요구사항, 접근성 기준 등이 명세에 반영되었는지 확인.

충돌 시 사용자와 논의:
- 기능 수정
- 선택적 기능으로 변경
- 헌법 업데이트 (우선순위 변경 시)

## Step 4: Review & Approve

1. 완전성 검토 (모든 요구사항 캡처됨?)
2. 수용 기준 명확성 검토
3. 엣지 케이스 식별 확인
4. 상태를 "Approved"로 업데이트

## Step 5: Spec-Kit 명령 실행

모든 정보가 확인되면, 수집한 내용을 정리하여 spec-kit 명령어에 전달합니다:

**수집된 정보 정리:**
Step 1에서 수집한 모든 답변과 Step 2에서 구조화한 내용을 다음 형식으로 정리:

```
기능명: [답변]
대상 사용자: [답변]
해결하려는 문제: [답변]
성공 기준: [답변]
제약사항: [답변]

User Stories:
- As a [사용자], I want [목표], So that [이점]
- ...

Must Have 요구사항:
1. [요구사항]
2. ...

Should Have 요구사항:
1. [요구사항]
...

수용 기준:
- [기준 1]
- [기준 2]
...
```

**SlashCommand 도구로 실행:**
정리된 정보를 인자로 전달하여 `/speckit.specify` 명령을 실행합니다:

```
/speckit.specify <위에서 정리한 정보 전체 + 사용자의 시스템 언어로 모든 내용을 작성하세요>
```

spec-kit 명령어는 이 정보를 받아서 사용자의 시스템 언어로 `.specify/memory/specification.md` 파일을 생성/업데이트합니다.

## Common Mistakes to Avoid

❌ **너무 모호함**: "사용자가 사진을 정리할 수 있다"
✅ **구체적**: "사용자가 드래그 앤 드롭으로 앨범 간 사진을 이동할 수 있으며, 시각적 피드백과 실행 취소 기능 제공"

❌ **기술적 세부사항**: "React DnD로 구현"
✅ **요구사항 중심**: "사용자가 사진을 재정렬할 수 있다 (구현 세부사항은 /spec-kit:plan에서)"

## Next Steps

명세 생성 후:
1. `.specify/memory/specification.md` 파일 검토
2. `/spec-kit:clarify` - 모호한 부분 명확화
3. `/spec-kit:plan` - 기술 구현 계획 작성
4. `/spec-kit:tasks` - 실행 가능한 작업으로 분해

---

**참고**:
- 우리 플러그인(/spec-kit:specify)은 정보 수집 역할
- 실제 파일 생성은 spec-kit 명령어(/speckit.specify)가 담당
