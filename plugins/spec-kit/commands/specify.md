---
description: 기능 명세(Specification) 작성 - WHAT을 정의
allowed-tools: [Read, Write, Bash]
argument-hint: <feature-description | 기능 설명>
---

# Write Feature Specification

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). The user input is the feature description.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

기능의 요구사항, 수용 기준, 사용자 흐름을 정의합니다. HOW가 아닌 WHAT에 집중합니다.

## Prerequisites

헌법이 먼저 존재해야 합니다:

```bash
cat .specify/memory/constitution.md
```

없다면 `/spec-kit:constitution`을 먼저 실행하세요.

## Step 0: Check Existing File and Choose Update Mode

기존 명세 파일 확인:

```bash
cat .specify/memory/specification.md
```

### If File Exists - Choose Update Mode

사용자에게 두 가지 옵션 제공:

**📋 Option 1: 완전 재생성 (Full Regeneration)**
- 처음부터 모든 정보를 다시 수집하여 새로 작성
- 기존 명세는 참고용으로만 활용
- **추천 시점:**
  - 요구사항이 크게 변경되었을 때
  - 기능 범위가 완전히 바뀌었을 때
  - 새로운 관점으로 명세를 다시 작성하고 싶을 때
  - 구조를 완전히 재구성하고 싶을 때

**✏️ Option 2: 부분 업데이트 (Incremental Update)**
- 기존 명세를 보여주고 변경/추가할 부분만 질문
- 기존 내용과 새 내용을 merge하여 업데이트
- **추천 시점:**
  - 특정 요구사항 추가/수정
  - 새로운 사용자 스토리 추가
  - 수용 기준(Acceptance Criteria) 개선
  - UI/UX 플로우 업데이트
  - 일부 섹션 명확화

**사용자 선택에 따라 진행:**
- Option 1 선택 시 → Step 1부터 정상 진행 (완전 재작성)
- Option 2 선택 시 → 기존 명세 표시 + "어떤 부분을 업데이트하시겠습니까?" 질문 + 변경사항만 수집 후 merge

### If File Not Exists

Step 1부터 정상 진행 (처음 작성)

---

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

## Step 5: Save Draft and Execute Spec-Kit Command

### 5.1 수집된 정보를 Draft 파일로 저장

먼저 `.specify/temp/` 디렉토리가 있는지 확인하고 없으면 생성:

```bash
mkdir -p .specify/temp
```

Write 도구를 사용하여 수집된 정보를 `.specify/temp/specification-draft.md` 파일로 저장합니다:

```markdown
# Specification Draft

## Collected Information

### 기능명
[Step 1에서 수집한 답변]

### 대상 사용자
[Step 1에서 수집한 답변]

### 해결하려는 문제
[Step 1에서 수집한 답변]

### 성공 기준
[Step 1에서 수집한 답변]

### 제약사항
[Step 1에서 수집한 답변]

## User Stories

### Primary Stories
[Step 2에서 작성한 주요 스토리들...]

### Secondary Stories
[Step 2에서 작성한 부가 스토리들...]

## Requirements

### Functional Requirements

#### Must Have (P0)
[Step 2에서 작성한 필수 요구사항들...]

#### Should Have (P1)
[Step 2에서 작성한 권장 요구사항들...]

#### Could Have (P2)
[Step 2에서 작성한 선택 요구사항들...]

### Non-Functional Requirements
[Step 2에서 작성한 비기능 요구사항들...]

## User Interface
[Step 2에서 작성한 UI 설명...]

## User Flows
[Step 2에서 작성한 사용자 흐름들...]

## Acceptance Criteria
[Step 2에서 작성한 수용 기준들...]

## Edge Cases & Constraints
[Step 2에서 작성한 엣지 케이스와 제약사항들...]

## Dependencies
[Step 2에서 작성한 의존성들...]

## Out of Scope (V1)
[Step 2에서 작성한 제외 항목들...]

## Success Metrics
[Step 2에서 작성한 성공 지표들...]

## Risks & Mitigations
[Step 2에서 작성한 위험과 완화 전략들...]

## Open Questions
[Step 2에서 작성한 미해결 질문들...]
```

### 5.2 Spec-Kit 명령 실행

Draft 파일 경로를 전달하여 SlashCommand 도구로 `/speckit.specify` 명령을 실행합니다:

```
/speckit.specify .specify/temp/specification-draft.md

INSTRUCTION: Read the draft file at the path above using the Read tool. This draft contains ALL the information needed with complete user stories, requirements, and acceptance criteria. You MUST skip all information collection steps and proceed directly to writing the specification file. Use ONLY the information from the draft file. Do NOT ask the user for any additional information. Process all content in the user's system language.
```

spec-kit 명령어는 draft 파일을 읽어서 `.specify/memory/specification.md` 파일을 생성/업데이트합니다.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

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
