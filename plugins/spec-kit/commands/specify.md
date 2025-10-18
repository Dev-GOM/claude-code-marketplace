---
description: 기능 명세(Specification) 작성 - WHAT을 정의
allowed-tools: [Read, Write, Bash, AskUserQuestion]
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

## Step -1: 워크플로우 선택

먼저 새 기능 명세를 작성할 것인지, 기존 명세를 수정할 것인지 결정합니다.

### 현재 Git 브랜치 확인

```bash
git branch --show-current
```

### 사용 가능한 기능 목록 확인

```bash
ls -la specs/ 2>/dev/null || echo "No specs directory yet"
```

### 사용자에게 워크플로우 선택 요청

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "어떤 작업을 진행하시겠습니까?",
    "header": "워크플로우 선택",
    "multiSelect": false,
    "options": [
      {
        "label": "새 기능 명세 작성",
        "description": "새로운 기능에 대한 명세를 작성합니다. 새 Git 브랜치와 specs/[브랜치명]/ 디렉토리가 생성됩니다."
      },
      {
        "label": "기존 명세 수정",
        "description": "현재 브랜치의 기존 명세를 수정하거나 업데이트합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**

#### 선택 1: 새 기능 명세 작성

→ **Step 0-A (새 기능)로 이동**

#### 선택 2: 기존 명세 수정

→ **Step 0-B (기존 수정)로 이동**

---

## Step 0-A: 새 기능 생성 워크플로우

사용자가 "새 기능 명세 작성"을 선택한 경우:

### 1. 기능 설명 확인

사용자가 $ARGUMENTS로 기능 설명을 제공했는지 확인:

- **제공됨**: 해당 설명 사용
- **제공 안 됨**: 사용자에게 기능 설명 입력 요청

```
새로운 기능에 대해 설명해 주세요.
예: "Add user authentication with OAuth2"
예: "Implement real-time chat functionality"
```

### 2. Short Name 생성

기능 설명을 분석하여 2-4단어의 간결한 short-name 생성:

- 핵심 키워드 추출
- 동사-명사 형식 선호 (예: "add-user-auth", "fix-payment-bug")
- 기술 용어 보존 (OAuth2, API, JWT 등)

예시:
- "I want to add user authentication" → "user-auth"
- "Implement OAuth2 integration for the API" → "oauth2-api-integration"
- "Create a dashboard for analytics" → "analytics-dashboard"

### 3. create-new-feature 스크립트 실행

GitHub spec-kit CLI의 create-new-feature 스크립트를 실행하여 새 브랜치 생성:

**Windows (Git Bash 권장):**
```bash
FEATURE_DESC="[기능 설명]"
SHORT_NAME="[생성한 short-name]"

# PowerShell 스크립트 실행 (JSON 출력)
powershell -File ".specify/scripts/powershell/create-new-feature.ps1" -Json -ShortName "$SHORT_NAME" "$FEATURE_DESC"
```

**Windows (PowerShell):**
```powershell
.specify\scripts\powershell\create-new-feature.ps1 -Json -ShortName "[생성한 short-name]" "[기능 설명]"
```

스크립트는 다음을 반환합니다 (JSON):
```json
{
  "BRANCH_NAME": "001-user-auth",
  "SPEC_FILE": "/absolute/path/to/specs/001-user-auth/spec.md",
  "FEATURE_NUM": "001",
  "HAS_GIT": true
}
```

### 4. 반환된 정보 파싱

JSON 출력에서 다음 정보 추출:
- `BRANCH_NAME`: 생성된 브랜치 이름 (예: "001-user-auth")
- `SPEC_FILE`: spec.md 파일의 절대 경로
- `FEATURE_NUM`: 기능 번호 (001, 002, ...)

### 5. Step 1로 진행

→ **Step 1 (정보 수집)로 이동**

---

## Step 0-B: 기존 명세 수정 워크플로우

사용자가 "기존 명세 수정"을 선택한 경우:

### 1. 현재 브랜치 확인

```bash
CURRENT_BRANCH=$(git branch --show-current)
echo "현재 브랜치: $CURRENT_BRANCH"
```

### 2. specs 디렉토리에서 브랜치 폴더 찾기

```bash
if [ -d "specs/$CURRENT_BRANCH" ]; then
  FEATURE_DIR="specs/$CURRENT_BRANCH"
  SPEC_FILE="$FEATURE_DIR/spec.md"
else
  echo "⚠️ 현재 브랜치($CURRENT_BRANCH)에 대한 spec 폴더를 찾을 수 없습니다."
  echo ""
  echo "사용 가능한 기능 목록:"
  ls -1 specs/
fi
```

### 3-A. 브랜치 폴더 있는 경우

기존 spec.md 파일 확인:

```bash
cat "$SPEC_FILE"
```

AskUserQuestion 도구로 사용자에게 업데이트 모드 확인:

```json
{
  "questions": [{
    "question": "기존 명세 파일이 존재합니다. 어떻게 업데이트하시겠습니까?",
    "header": "업데이트 모드",
    "multiSelect": false,
    "options": [
      {
        "label": "완전 재생성 (Full Regeneration)",
        "description": "처음부터 모든 정보를 다시 수집하여 새로 작성합니다. 요구사항이 크게 변경되었거나 기능 범위가 완전히 바뀌었을 때 추천합니다."
      },
      {
        "label": "부분 업데이트 (Incremental Update)",
        "description": "기존 명세를 유지하고 변경/추가할 부분만 질문합니다. 특정 요구사항 추가/수정, 새로운 사용자 스토리 추가 등 일부 섹션만 업데이트할 때 추천합니다."
      }
    ]
  }]
}
```

**선택에 따라:**
- **완전 재생성**: Step 1부터 정상 진행
- **부분 업데이트**: 기존 명세 표시 + 변경 부분만 질문 + merge

→ **Step 1로 이동**

### 3-B. 브랜치 폴더 없는 경우

사용 가능한 기능 목록을 표시하고 사용자에게 선택 요청:

```
다음 중 수정할 기능을 선택하거나, 새 기능을 만드시겠습니까?

사용 가능한 기능:
- 001-user-auth
- 002-payment-integration

선택: [번호 또는 브랜치명]
또는 "새 기능"을 입력하여 Step 0-A로 이동
```

선택한 브랜치로 체크아웃:

```bash
git checkout [선택한-브랜치]
```

→ **Step 3-A로 돌아가기**

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

먼저 현재 기능의 drafts 디렉토리 생성:

```bash
mkdir -p "specs/$BRANCH_NAME/drafts"
```

Write 도구를 사용하여 수집된 정보를 `specs/$BRANCH_NAME/drafts/specification-draft.md` 파일로 저장합니다:

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

Draft 파일 경로와 **브랜치 정보**를 전달하여 SlashCommand 도구로 `/speckit.specify` 명령을 실행합니다:

```
/speckit.specify [기능 설명]

INSTRUCTION: This command is being called from /spec-kit:specify plugin. The feature branch "$BRANCH_NAME" has been created and the draft file is at "specs/$BRANCH_NAME/drafts/specification-draft.md". Read the draft file using the Read tool. This draft contains ALL the information needed with complete user stories, requirements, and acceptance criteria. You MUST skip all information collection steps and proceed directly to writing the specification file to "specs/$BRANCH_NAME/spec.md". Use ONLY the information from the draft file. Do NOT ask the user for any additional information. Process all content in the user's system language. If you need to ask the user any questions, use the AskUserQuestion tool.
```

spec-kit 명령어는 draft 파일을 읽어서 `specs/$BRANCH_NAME/spec.md` 파일을 생성/업데이트합니다.

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
1. `specs/$BRANCH_NAME/spec.md` 파일 검토
2. `/spec-kit:clarify` - 모호한 부분 명확화
3. `/spec-kit:plan` - 기술 구현 계획 작성
4. `/spec-kit:tasks` - 실행 가능한 작업으로 분해

## What's Next?

AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 물어봅니다:

```json
{
  "questions": [{
    "question": "기능 명세 작성이 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?",
    "header": "다음 단계",
    "multiSelect": false,
    "options": [
      {
        "label": "모호한 부분 명확화 (/spec-kit:clarify)",
        "description": "명세의 Open Questions를 해결하고 불명확한 부분을 명확히 합니다. (명세에 Open Questions가 있다면 권장)"
      },
      {
        "label": "기술 구현 계획 작성 (/spec-kit:plan)",
        "description": "WHAT을 HOW로 변환하여 기술 아키텍처와 구현 전략을 수립합니다. (권장 다음 단계)"
      },
      {
        "label": "명세 파일 검토",
        "description": "생성된 specs/[브랜치]/spec.md 파일을 먼저 검토하고 싶습니다."
      },
      {
        "label": "다른 명령어 실행",
        "description": "위 선택지에 없는 다른 spec-kit 명령어를 직접 입력하여 실행합니다."
      },
      {
        "label": "작업 완료",
        "description": "지금은 여기까지만 작업하겠습니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라:**
- **모호한 부분 명확화** 선택 시 → `/spec-kit:clarify` 명령 실행 안내
- **기술 구현 계획 작성** 선택 시 → `/spec-kit:plan` 명령 실행 안내
- **명세 파일 검토** 선택 시 → `cat specs/$BRANCH_NAME/spec.md` 실행 후 다시 선택지 제공
- **다른 명령어 실행** 선택 시 → 사용자가 원하는 명령어 입력 요청
- **작업 완료** 선택 시 → 세션 종료

---

**참고**:
- 우리 플러그인(/spec-kit:specify)은 정보 수집 및 브랜치 관리 역할
- 실제 spec.md 파일 생성은 spec-kit 명령어(/speckit.specify)가 담당
- 각 기능은 독립적인 Git 브랜치와 specs/[브랜치명]/ 디렉토리에서 관리됨
