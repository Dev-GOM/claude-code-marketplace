---
description: 명세나 계획의 모호한 부분을 명확히 하고 Open Questions 해결
allowed-tools: [Read, Write, Edit, AskUserQuestion]
argument-hint: <question-or-topic | 질문 또는 주제>
---

# Clarify Specification or Plan

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

⚠️ **커맨드 구분**: 이것은 **플러그인 커맨드** (/spec-kit:clarify)입니다. 정보 수집과 사용자 논의를 담당합니다. 실제 파일 생성/업데이트는 GitHub Spec-Kit CLI 커맨드 (/speckit.clarify)가 수행합니다.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 옵션 제시, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

명세서나 계획서의 모호한 부분, 미해결 질문, 불명확한 요구사항을 사용자와 논의하여 명확히 합니다.

## Purpose

Spec-Kit 문서에서 찾을 수 있는 것들:
- **Open Questions**: 구현 전 해결해야 할 질문
- **모호한 요구사항**: 해석이 여러 가지인 사항
- **누락된 세부사항**: 명시되지 않은 중요 사항
- **상충되는 요구사항**: 서로 충돌하는 조건

## Step 1: Git 변경사항 확인

명확화 작업 전에 현재 작업 디렉토리의 변경사항과 브랜치 퍼블리쉬 상태를 확인합니다:

```bash
# 변경사항 확인
git status --short

# Upstream 브랜치 확인 (퍼블리쉬 여부)
git rev-parse --abbrev-ref @{upstream} 2>/dev/null
```

### 시나리오 A: 변경사항이 없는 경우

즉시 Step 2로 이동

### 시나리오 B: 변경사항 있음 + Upstream 브랜치 없음 (미퍼블리쉬)

브랜치가 아직 원격에 퍼블리쉬되지 않은 상태에서 변경사항이 있는 경우:

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "현재 작업 디렉토리에 변경되지 않은 파일이 있고, 브랜치가 아직 퍼블리쉬되지 않았습니다. 어떻게 처리하시겠습니까?",
    "header": "Git 변경사항",
    "multiSelect": false,
    "options": [
      {
        "label": "퍼블리쉬 + 커밋",
        "description": "현재 변경사항을 커밋하고 브랜치를 원격 저장소에 퍼블리쉬합니다. 팀과 공유하거나 백업이 필요한 경우 권장합니다."
      },
      {
        "label": "로컬에만 커밋",
        "description": "현재 변경사항을 커밋하지만 브랜치는 로컬에만 유지합니다. 아직 공유할 준비가 안 된 경우에 사용합니다."
      },
      {
        "label": "나중에 결정",
        "description": "명확화 작업을 진행하고 나중에 모든 변경사항을 함께 처리합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"퍼블리쉬 + 커밋"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. `git push -u origin [브랜치명]`
  4. Step 2로 이동
- **"로컬에만 커밋"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. Step 2로 이동
- **"나중에 결정"** 선택 시: 즉시 Step 2로 이동

### 시나리오 C: 변경사항 있음 + Upstream 브랜치 있음 (이미 퍼블리쉬됨)

브랜치가 이미 원격에 퍼블리쉬된 상태에서 변경사항이 있는 경우:

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "현재 작업 디렉토리에 변경되지 않은 파일이 있습니다. 먼저 커밋하시겠습니까?",
    "header": "Git 변경사항",
    "multiSelect": false,
    "options": [
      {
        "label": "커밋하기",
        "description": "현재 변경사항을 커밋하고 원격 브랜치에 푸쉬합니다. 작업을 명확하게 분리할 수 있습니다."
      },
      {
        "label": "나중에 결정",
        "description": "명확화 작업을 진행하고 나중에 모든 변경사항을 함께 커밋합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"커밋하기"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. `git push`
  4. Step 2로 이동
- **"나중에 결정"** 선택 시: 즉시 Step 2로 이동

---

## Step 2: Identify Ambiguities

명세와 계획을 읽고 불명확한 부분 식별:

```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# 명세와 계획 읽기
cat "specs/$CURRENT_BRANCH/spec.md"
cat "specs/$CURRENT_BRANCH/plan.md"
```

다음을 찾기:
- "Open Questions" 섹션
- "TBD" 또는 "TODO" 표시
- "Option A/B" 같은 미결정 사항
- 모호한 표현 ("적절한", "충분한", "빠른" 등)

## Step 3: List Issues and Select

발견한 모호한 사항을 리스트로 정리한 후, AskUserQuestion 도구를 사용하여 사용자에게 선택하도록 합니다:

**발견된 이슈 예시:**
```
다음 사항들이 명확하지 않습니다:

1. [명세] - 인증 방식
   Issue: OAuth2 vs JWT 중 어떤 것을 사용할지 미결정

2. [계획] - 데이터베이스 선택
   Issue: PostgreSQL vs MongoDB 선택 필요

3. [명세] - 성능 기준
   Issue: "빠른 응답 시간"이 구체적이지 않음
```

**AskUserQuestion으로 선택:**

```json
{
  "questions": [{
    "question": "명확하지 않은 사항들을 발견했습니다. 어떤 것부터 명확히 하시겠습니까?",
    "header": "명확화 우선순위",
    "multiSelect": false,
    "options": [
      {
        "label": "[명세] 인증 방식 (OAuth2 vs JWT)",
        "description": "사용자 인증 방법을 결정해야 합니다. 보안 요구사항과 사용자 경험에 영향을 미칩니다."
      },
      {
        "label": "[계획] 데이터베이스 선택",
        "description": "PostgreSQL vs MongoDB 중 선택이 필요합니다. 데이터 구조와 쿼리 패턴에 영향을 미칩니다."
      },
      {
        "label": "[명세] 성능 기준 구체화",
        "description": "\"빠른 응답 시간\"을 구체적인 숫자로 정의해야 합니다."
      },
      {
        "label": "모든 이슈를 순서대로 처리",
        "description": "위에서부터 순서대로 모든 이슈를 명확히 합니다."
      }
    ]
  }]
}
```

**참고:** 실제로는 발견된 이슈에 맞춰 options를 동적으로 생성해야 합니다.

## Step 4: Discuss and Resolve

각 이슈에 대해:

1. **배경 설명**: 왜 이것이 중요한가?
2. **옵션 제시**: 가능한 선택지와 장단점
3. **추천**: 헌법과 계획 기반 권장사항
4. **결정**: 사용자 의사결정
5. **영향 분석**: 다른 부분에 미치는 영향

## Step 5: Save Draft and Execute Spec-Kit Command

### 5.1 수집된 정보를 Draft 파일로 저장

먼저 현재 브랜치의 drafts 디렉토리가 있는지 확인하고 없으면 생성:

```bash
mkdir -p "specs/$CURRENT_BRANCH/drafts"
```

Write 도구를 사용하여 수집된 정보를 `specs/$CURRENT_BRANCH/drafts/clarify-draft.md` 파일로 저장합니다:

```markdown
# Clarify Draft

## Resolved Issues

### Issue 1: [명세/계획] - [섹션명]

**Original (모호함)**: [원래 모호했던 내용]

**Resolution (명확함)**: [Step 4에서 명확해진 내용]

**Rationale**: [이렇게 결정한 이유]

**Impact**: [다른 부분에 미치는 영향]

### Issue 2: [명세/계획] - [섹션명]
[Step 2-4에서 해결한 다른 이슈들...]

## Affected Sections

### specification.md
- [섹션명]: [변경 내용]

### plan.md
- [섹션명]: [변경 내용]

## Open Questions to Remove
[Step 4에서 해결된 Open Questions 목록...]

## New Acceptance Criteria
[Step 4에서 추가된 명확한 수용 기준들...]

## Technical Decisions
[Step 4에서 결정된 기술적 선택사항들...]
```

### 5.2 Spec-Kit 명령 실행

Draft 파일 경로를 전달하여 SlashCommand 도구로 `/speckit.clarify` 명령을 실행합니다:

```
/speckit.clarify specs/$CURRENT_BRANCH/drafts/clarify-draft.md INSTRUCTION: Read draft at path above. Draft contains ALL resolved issues with clear resolutions and rationales. Skip identification and discussion steps (Step 2-4) and proceed directly to updating spec.md and plan.md files. **CRITICAL - MUST FOLLOW:** 1. LANGUAGE: Process ALL content in user's system language. 2. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. 3. FILE UPDATE: Remove resolved Open Questions, Add clear requirements, Add specific acceptance criteria, Remove resolved Open Technical Questions, Reflect technical decisions, Record changes in changelog.
```

spec-kit 명령어는 draft 파일을 읽어서 spec.md와 plan.md를 업데이트합니다.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

## Example Clarification

**Before (모호함):**
```
사용자가 사진을 빠르게 업로드할 수 있어야 한다.
```

**Questions:**
- "빠르게"의 기준은?
- 얼마나 많은 사진?
- 진행 표시는?

**After (명확함):**
```
사용자가 한 번에 최대 100장의 사진을 업로드할 수 있어야 한다.
- 각 사진은 20MB 이하
- 업로드 시간: 10MB당 < 2초 (평균 브로드밴드)
- 진행률 바와 현재/총 카운트 표시
- 실패한 사진은 재시도 옵션 제공
```

## When to Use

- 구현 시작 전에
- 리뷰에서 모호함 지적받았을 때
- 팀원들의 해석이 다를 때
- Open Questions가 많을 때

## Next Steps

명확화 후:
1. `specs/$CURRENT_BRANCH/spec.md` 및 `plan.md` 파일 업데이트 확인
2. 필요시 명세 재검토: `/spec-kit:specify`
3. 필요시 계획 업데이트: `/spec-kit:plan`
4. 작업 조정: `/spec-kit:tasks`
5. 구현 진행: `/spec-kit:implement`

## What's Next?

AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 물어봅니다:

```json
{
  "questions": [{
    "question": "명확화 작업이 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?",
    "header": "다음 단계",
    "multiSelect": false,
    "options": [
      {
        "label": "명세 업데이트 (/spec-kit:specify)",
        "description": "명확화된 내용을 반영하여 명세를 업데이트합니다."
      },
      {
        "label": "기술 구현 계획 작성 (/spec-kit:plan)",
        "description": "명세가 충분히 명확하다면 기술 구현 계획을 수립합니다. (권장 다음 단계)"
      },
      {
        "label": "작업 분해 (/spec-kit:tasks)",
        "description": "계획이 이미 있다면 작업 목록을 생성합니다."
      },
      {
        "label": "업데이트된 파일 검토",
        "description": "변경된 spec.md 또는 plan.md 파일을 검토하고 싶습니다."
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
- **명세 업데이트** 선택 시 → `/spec-kit:specify` 명령 실행 안내
- **기술 구현 계획 작성** 선택 시 → `/spec-kit:plan` 명령 실행 안내
- **작업 분해** 선택 시 → `/spec-kit:tasks` 명령 실행 안내
- **업데이트된 파일 검토** 선택 시 → 변경된 파일 표시 후 다시 선택지 제공
- **다른 명령어 실행** 선택 시 → 사용자가 원하는 명령어 입력 요청
- **작업 완료** 선택 시 → 세션 종료

---

**참고**:
- 명확한 명세와 계획은 잘못된 구현을 방지합니다
- 우리 플러그인(/spec-kit:clarify)은 모호한 부분 식별 및 논의 역할
- 실제 문서 업데이트는 spec-kit 명령어(/speckit.clarify)가 담당
