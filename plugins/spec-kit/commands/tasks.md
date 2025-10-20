---
description: 구현 계획을 실행 가능한 작업(Tasks)으로 분해
allowed-tools: [Read, Write, Bash, AskUserQuestion, SlashCommand]
argument-hint: <additional-context | 추가 컨텍스트>
---

# Break Down Plan into Tasks

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

⚠️ **커맨드 구분**: 이것은 **플러그인 커맨드** (/spec-kit:tasks)입니다. 정보 수집과 사용자 논의를 담당합니다. 실제 파일 생성/업데이트는 GitHub Spec-Kit CLI 커맨드 (/speckit.tasks)가 수행합니다.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 작업 분해 가이드, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

기술 계획을 작고 실행 가능한 작업으로 분해하여 단계별 구현 가이드를 만듭니다.

## Prerequisites

계획이 먼저 존재해야 합니다:

```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# 계획 파일 확인
cat "specs/$CURRENT_BRANCH/plan.md"
```

없다면 `/spec-kit:plan`을 먼저 실행하세요.

## Step 1: Git 변경사항 확인

작업 분해 전에 현재 작업 디렉토리의 변경사항과 브랜치 퍼블리쉬 상태를 확인합니다:

```bash
# 변경사항 확인
git status --short

# Upstream 브랜치 확인 (퍼블리쉬 여부)
git rev-parse --abbrev-ref @{upstream} 2>/dev/null
```

### 시나리오 A: 변경사항이 없는 경우

즉시 Step 2로 이동

### 시나리오 B: 변경사항 있음 + Upstream 브랜치 없음 (미퍼블리쉬)

브랜치가 아직 원격에 퍼블리쉬되지 않은 상태에서 변경사항이 있는 경우, AskUserQuestion 도구를 사용하여 사용자에게 Git 변경사항 처리 방법을 확인합니다.

**질문 가이드라인:**
"현재 작업 디렉토리에 변경되지 않은 파일이 있고, 브랜치가 아직 퍼블리쉬되지 않았습니다. 어떻게 처리하시겠습니까?"

**선택 가능한 옵션:**

1. **퍼블리쉬 + 커밋**
   - 현재 변경사항을 커밋하고 브랜치를 원격 저장소에 퍼블리쉬
   - 팀과 공유하거나 백업이 필요한 경우 권장
   - 진행: 커밋 메시지 요청 → `git add -A && git commit -m "[메시지]"` → `git push -u origin [브랜치명]` → Step 2

2. **로컬에만 커밋**
   - 변경사항을 커밋하지만 브랜치는 로컬에만 유지
   - 아직 공유할 준비가 안 된 경우 사용
   - 진행: 커밋 메시지 요청 → `git add -A && git commit -m "[메시지]"` → Step 2

3. **나중에 결정**
   - 작업 분해를 진행하고 나중에 모든 변경사항을 함께 처리
   - 진행: 즉시 Step 2로 이동

### 시나리오 C: 변경사항 있음 + Upstream 브랜치 있음 (이미 퍼블리쉬됨)

브랜치가 이미 원격에 퍼블리쉬된 상태에서 변경사항이 있는 경우, AskUserQuestion 도구를 사용하여 사용자에게 Git 변경사항 처리 방법을 확인합니다.

**질문 가이드라인:**
"현재 작업 디렉토리에 변경되지 않은 파일이 있습니다. 먼저 커밋하시겠습니까?"

**선택 가능한 옵션:**

1. **커밋하기**
   - 현재 변경사항을 커밋하고 원격 브랜치에 푸쉬
   - 작업을 명확하게 분리 가능
   - 진행: 커밋 메시지 요청 → `git add -A && git commit -m "[메시지]"` → `git push` → Step 2

2. **나중에 결정**
   - 작업 분해를 진행하고 나중에 모든 변경사항을 함께 커밋
   - 진행: 즉시 Step 2로 이동

---

## Step 2: Check Existing File and Choose Update Mode

기존 작업 목록 파일 확인:

```bash
# 작업 목록 파일 확인
cat "specs/$CURRENT_BRANCH/tasks.md"
```

### If File Exists - Choose Update Mode

기존 작업 목록 파일이 존재하는 경우, AskUserQuestion 도구를 사용하여 사용자에게 업데이트 방법을 확인합니다.

**질문 가이드라인:**
"기존 작업 목록 파일이 존재합니다. 어떻게 업데이트하시겠습니까?"

**선택 가능한 옵션:**

1. **완전 재생성 (Full Regeneration)**
   - 처음부터 모든 정보를 다시 수집하여 새로 작성
   - 계획이 크게 변경되어 작업 구조가 완전히 바뀌었을 때 추천
   - 진행: Step 3부터 정상 진행 (완전 재작성)

2. **부분 업데이트 (Incremental Update)**
   - 기존 작업 목록을 유지하고 변경/추가할 부분만 질문
   - 특정 Phase에 새 작업 추가, 일부 작업의 수용 기준 변경 등 일부 내용만 업데이트할 때 추천
   - 진행: 기존 작업 목록 표시 + "어떤 부분을 업데이트하시겠습니까?" 질문 + 변경사항만 수집 후 merge

### If File Not Exists

Step 3부터 정상 진행 (처음 작성)

---

## Step 3: Review Plan and Check Prerequisites

계획의 구현 전략(Implementation Strategy)을 집중적으로 검토:
- 각 단계(Phase)의 작업들
- 완료 기준
- 의존성

**⚠️ 사전 체크:**

작업 분해 전에 명세와 계획의 완성도를 확인하세요:

```bash
# specification.md와 plan.md에서 Open Questions 체크
cat "specs/$CURRENT_BRANCH/spec.md" | grep -A 10 "Open Questions"
cat "specs/$CURRENT_BRANCH/plan.md" | grep -A 10 "Open Technical Questions"
```

**만약 Open Questions가 있다면:**

```
⚠️ **경고**: 명세나 계획에 미해결 질문이 있습니다!

작업을 분해하기 전에 `/spec-kit:clarify`를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다.

명확하지 않은 요구사항으로 작업을 분해하면:
- 불완전한 작업 정의
- 잘못된 의존성 파악
- 구현 중 방향 전환 필요
- 시간 낭비

그래도 계속 진행하시겠습니까? (예/아니오)
```

사용자가 "아니오"를 선택하면 `/spec-kit:clarify`를 먼저 실행하도록 안내하세요.

## Step 4: 추가 컨텍스트 수집

**GitHub Spec-Kit CLI는 spec.md와 plan.md를 자동으로 파싱하여 작업을 생성합니다.**

이 단계에서는 자동 생성 시 추가로 고려할 사항만 수집합니다.

### 4.1 사용자 언어 감지

먼저 사용자의 언어를 감지하여 변수에 저장:

```bash
# 시스템 언어 감지
if [[ "$LANG" == ko* ]] || [[ "$LC_ALL" == ko* ]]; then
  LANGUAGE="ko"
elif [[ "$LANG" == ja* ]] || [[ "$LC_ALL" == ja* ]]; then
  LANGUAGE="ja"
else
  LANGUAGE="en"
fi

# 또는 사용자의 최근 대화 언어 패턴 분석
# 한글이 포함되어 있으면 "ko", 일본어면 "ja", 그 외 "en"
```

### 4.2 추가 컨텍스트 수집 (선택적)

사용자에게 다음을 확인:

**"spec.md와 plan.md를 기반으로 작업을 자동 생성합니다. 추가로 고려할 사항이 있나요?"**

필요시 AskUserQuestion 도구를 사용하여 다음 항목들을 질문할 수 있습니다:

- **특정 작업 포함**: 자동 생성 외에 반드시 포함해야 할 작업이나 단계
  - 예: "데이터베이스 마이그레이션 스크립트", "CI/CD 파이프라인 설정"

- **특정 작업 제외**: 생성 시 건너뛰어야 할 작업이나 단계
  - 예: "Docker 설정", "문서화 작업"

- **우선순위 조정**: 특정 Phase나 작업의 우선순위 변경
  - 예: "Phase 2를 Phase 1보다 먼저", "User Story 3를 가장 먼저"

- **시간 제약**: 각 작업의 예상 시간 제약
  - 예: "각 작업은 2시간 이내", "전체 구현은 1주일 이내"

- **테스트 전략**: TDD 또는 테스트 작성 방식 선호
  - 예: "TDD 방식으로 테스트 먼저 작성", "각 Phase별 통합 테스트 포함"

- **없음 - 자동 생성** (권장): spec과 plan만으로 충분, 추가 입력 없이 진행

**사용자 응답을 수집하고 관련 정보를 CONTEXT 변수에 저장합니다.**

## Step 5: CLI 호출 및 자동 작업 생성

### 5.1 컨텍스트 준비

Step 4에서 수집한 정보를 정리:

- **언어** (Step 4.1): 사용자 언어 코드 (예: "ko", "en", "ja")
- **추가 컨텍스트** (Step 4.2): 사용자가 제공한 추가 요구사항이나 선호사항

수집한 정보를 자연스러운 문장으로 정리하여 CLI에 전달할 준비를 합니다.

추가 컨텍스트가 없는 경우: "Auto-generate from spec.md and plan.md without additional context."

### 5.2 Spec-Kit CLI 명령 실행

**⚠️ CRITICAL - MUST USE SLASHCOMMAND TOOL**:

You **MUST** now use the **SlashCommand tool** to execute the `/speckit.tasks` command. This is a required step - do not skip it!

Call the SlashCommand tool with the following command parameter (replace $LANGUAGE and $CONTEXT with actual values):

```
/speckit.tasks INSTRUCTION: This command is being called from /spec-kit:tasks plugin. Execute task generation with provided context. LANGUAGE: Process ALL content in $LANGUAGE. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. $CONTEXT
```

**Example:**
```
/speckit.tasks INSTRUCTION: This command is being called from /spec-kit:tasks plugin. Execute task generation with provided context. LANGUAGE: Process ALL content in ko. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. 테스트 우선 개발 적용
```

The spec-kit CLI command will automatically read spec.md and plan.md, parse them, and generate tasks.md.

## Next Steps

작업 목록 생성 후:
1. `specs/$CURRENT_BRANCH/tasks.md` 파일 검토
2. `/spec-kit:implement` - 작업 실행 시작
3. `/spec-kit:analyze` - 진행 상황 분석

## What's Next?

작업 분해가 완료되면, AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 확인합니다.

**질문 가이드라인:**
"작업 분해가 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?"

**선택 가능한 옵션:**

1. **구현 시작 (/spec-kit:implement)**
   - 작업 목록에 따라 실제 구현을 시작 (권장 다음 단계)
   - 진행: `/spec-kit:implement` 명령 실행 안내

2. **작업 목록 분석 (/spec-kit:analyze)**
   - 구현 전에 작업 목록을 먼저 분석하고 검증
   - 진행: `/spec-kit:analyze` 명령 실행 안내

3. **작업 목록 파일 검토**
   - 생성된 specs/[브랜치]/tasks.md 파일을 먼저 검토
   - 진행: `cat "specs/$CURRENT_BRANCH/tasks.md"` 실행 후 다시 선택지 제공

4. **다른 명령어 실행**
   - 위 선택지에 없는 다른 spec-kit 명령어를 직접 입력하여 실행
   - 진행: 사용자가 원하는 명령어 입력 요청

5. **작업 완료**
   - 지금은 여기까지만 작업
   - 진행: 세션 종료

---

**참고**:
- 작업 분해로 모호한 계획이 명확한 실행 단계가 됩니다
- 우리 플러그인(/spec-kit:tasks)은 **사전 검증 및 추가 컨텍스트 수집** 역할
- 실제 파일 생성 및 자동 파싱은 spec-kit 명령어(/speckit.tasks)가 담당
- CLI가 spec.md와 plan.md를 직접 읽고 파싱하여 작업 자동 생성
- 토큰 효율성 극대화: 중복 질문 제거, draft 파일 불필요
