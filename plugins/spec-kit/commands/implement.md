---
description: 작업 목록에 따라 실제 구현 시작
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, SlashCommand]
argument-hint: <task-focus | 작업 초점>
---

# Implement Tasks

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

⚠️ **커맨드 구분**: 이것은 **플러그인 커맨드** (/spec-kit:implement)입니다. 정보 수집과 사용자 논의를 담당합니다. 실제 파일 생성/업데이트는 GitHub Spec-Kit CLI 커맨드 (/speckit.implement)가 수행합니다.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 작업 확인, 진행 상황 보고, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

작업 목록(tasks)을 기반으로 실제 코드 구현을 시작합니다.

## Prerequisites

작업 목록이 먼저 존재해야 합니다:

```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# 작업 목록 파일 확인
cat "specs/$CURRENT_BRANCH/tasks.md"
```

없다면 `/spec-kit:tasks`를 먼저 실행하세요.

## Step 1: Git 변경사항 확인

구현 시작 전에 현재 작업 디렉토리의 변경사항과 브랜치 퍼블리쉬 상태를 확인합니다:

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
        "description": "구현 작업을 진행하고 나중에 모든 변경사항을 함께 처리합니다."
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
        "description": "구현 작업을 진행하고 나중에 모든 변경사항을 함께 커밋합니다."
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

## Step 2: Review Tasks and Check Project Status

작업 목록을 읽고:
- 다음 작업 식별 (완료되지 않은 첫 번째 작업)
- 의존성 확인 (차단 작업 없는지)
- 수용 기준 확인

**⚠️ 프로젝트 상태 체크:**

구현 시작 전에 프로젝트 상태를 확인하세요:

```bash
# Open Questions 체크
cat "specs/$CURRENT_BRANCH/spec.md" | grep -A 5 "Open Questions"
cat "specs/$CURRENT_BRANCH/plan.md" | grep -A 5 "Open Technical Questions"
```

**만약 Open Questions가 있다면:**

AskUserQuestion 도구를 사용하여 사용자에게 경고 및 확인:

```json
{
  "questions": [{
    "question": "⚠️ 명세나 계획에 미해결 질문이 있습니다! 구현을 시작하기 전에 /spec-kit:clarify를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다. 어떻게 하시겠습니까?",
    "header": "Open Questions 경고",
    "multiSelect": false,
    "options": [
      {
        "label": "먼저 명확화 (/spec-kit:clarify)",
        "description": "권장 옵션입니다. 모호한 부분을 먼저 명확히 하여 잘못된 방향으로 코드를 작성하는 것을 방지합니다."
      },
      {
        "label": "그래도 계속 진행",
        "description": "위험: 명확하지 않은 요구사항으로 구현하면 나중에 대규모 리팩토링이 필요할 수 있습니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"먼저 명확화"** 선택 시 → `/spec-kit:clarify`를 먼저 실행하도록 안내
- **"그래도 계속 진행"** 선택 시 → Step 3으로 계속 진행 (위험 감수)

**💡 권장사항:**

정기적으로 전체 상황을 파악하려면 `/spec-kit:analyze`를 실행하세요.
- 진행률 확인
- 차단 요소 식별
- 다음 액션 파악

## Step 3: Confirm Task

사용자에게 확인:

```
다음 작업을 시작할까요?

**Task [번호]: [작업명]**

Description: [작업 설명]

Acceptance Criteria:
- [ ] [기준 1]
- [ ] [기준 2]

Estimate: [시간]

계속 진행하시겠습니까? (예/아니오)
```

## Step 4: Implement

작업 수용 기준을 하나씩 달성:

1. **필요한 파일 읽기**
   ```bash
   # 관련 파일 탐색
   grep -r "function_name" src/
   ```

2. **코드 작성/수정**
   - Write 또는 Edit 도구 사용
   - 헌법의 코드 품질 기준 준수
   - 계획의 아키텍처 패턴 따르기

3. **테스트 작성**
   - 유닛 테스트
   - 통합 테스트 (필요시)

4. **검증**
   ```bash
   # 테스트 실행
   npm test

   # 린트
   npm run lint

   # 타입 체크 (TypeScript의 경우)
   npm run type-check
   ```

## Step 5: Update Progress

작업 완료 시 tasks.md 업데이트:

```bash
# 현재 브랜치의 tasks.md 체크박스를 완료로 표시
# specs/$CURRENT_BRANCH/tasks.md
# - [ ] Task X → - [x] Task X
```

## Step 6: Review Acceptance Criteria

모든 수용 기준이 충족되었는지 확인:
- [ ] 기능 동작 확인
- [ ] 테스트 통과
- [ ] 코드 품질 기준 충족
- [ ] 문서 업데이트 (필요시)

## Step 7: Commit (Optional)

**⚠️ git commit 전 품질 체크:**

git commit하기 전에 기본 품질을 확인하세요:

```bash
# 기본 품질 체크
npm run lint
npm test
```

**💡 git commit 옵션 선택:**

다음 중 하나를 선택하세요:

```
📋 **git commit 방법 선택**

다음 중 어떻게 진행하시겠습니까?

1. 품질 게이트 실행 후 git commit (권장)
   - `/spec-kit:checklist` 실행
   - Pre-Merge Checklist 통과 확인
   - 통과 시 git commit 진행
   - 적합한 경우:
     • 핵심 기능 구현 완료
     • 여러 작업 완료
     • PR 생성 예정
     • 릴리스 준비

2. 바로 git commit
   - 기본 품질 체크(lint, test)만 확인
   - 빠르게 진행
   - 적합한 경우:
     • 작은 수정
     • 진행 중 작업 저장
     • 실험적 변경

3. git commit 하지 않음
   - 다음 작업 계속 진행
   - 여러 작업을 모아서 git commit

선택: [1/2/3]
```

**선택에 따른 진행:**

- **선택 1**: `/spec-kit:checklist`를 먼저 실행하도록 안내
  - 체크리스트 통과 후 git commit 진행

- **선택 2**: 바로 git commit 진행
  ```bash
  git add .
  git commit -m "feat: [작업 설명]"
  ```

- **선택 3**: git commit 건너뛰고 다음 단계로

## Step 8: Save Draft and Execute Spec-Kit Command

### 8.1 수집된 정보를 Draft 파일로 저장

먼저 Task 정보를 기반으로 draft 파일명을 생성합니다:

**Draft 파일명 생성 규칙:**

tasks.md 파일의 Phase, Task 번호, 작업명을 사용하여 고유한 파일명 생성:

```
Format: [phase]-[task-id]-[작업명-slug]-draft.md

실제 tasks.md 예시:
## Phase 1: Setup
- [ ] T001 [US1] Assets/App/Core/ 폴더 구조 생성
  → p1-t001-assets-app-core-draft.md

## Phase 2: Implementation
- [ ] T010 [US2] Currency 모듈 분석
  → p2-t010-currency-draft.md

## Phase 3: Testing
- [ ] T015 [US2] Currency 보안 검증 (Cheat Engine 테스트)
  → p3-t015-currency-cheat-engine-draft.md
```

**파일명 생성 단계:**

1. **Phase 번호 추출**:
   - tasks.md에서 `## Phase X:` 헤더 찾기
   - Phase 번호를 "p" + 숫자로 변환 (Phase 1 → p1, Phase 2 → p2)
   - Phase 정보가 없으면 "p0" 사용

2. **Task ID 추출** (예: "T001", "T010"):
   - tasks.md에서 `- [ ] T001 [태그] 작업명` 형식 파싱
   - Task ID를 소문자로 변환 (T001 → t001)

3. **태그 제거**:
   - 대괄호 안의 태그들 제거 (예: [US1], [P], [US2])
   - 남은 작업명만 사용

4. **작업명을 slug로 변환** (영문으로만):
   - 소문자로 변환 (영문만)
   - 공백을 하이픈(`-`)으로 변경
   - 특수문자 제거 (괄호, 슬래시, 콜론 등)
   - **영문, 숫자, 하이픈만 유지 (한글 제거)**
   - 연속된 하이픈을 하나로 축약
   - 최대 60자로 제한

5. **최종 파일명 조합**:
   - `[phase]-[task-id-소문자]-[slug]-draft.md`

**예시 코드 (참고용):**
```javascript
// tasks.md 내용 예시:
// ## Phase 2: Implementation
// - [ ] T010 [US2] Currency 모듈 분석

const taskLine = "- [ ] T010 [US2] Currency 모듈 분석";
const phaseHeader = "## Phase 2: Implementation";

// 1. Phase 번호 추출
const phaseMatch = phaseHeader.match(/Phase\s+(\d+)/i);
const phaseNum = phaseMatch ? phaseMatch[1] : '0';
const phase = `p${phaseNum}`;
// 결과: "p2"

// 2. Task ID 추출
const taskIdMatch = taskLine.match(/T\d+/);
const taskId = taskIdMatch ? taskIdMatch[0].toLowerCase() : 'task';
// 결과: "t010"

// 3. 태그 제거 및 작업명 추출
const taskNameMatch = taskLine.match(/\]\s*(.+)$/);
let taskName = taskNameMatch ? taskNameMatch[1] : '';
// 대괄호 안의 태그들 모두 제거
taskName = taskName.replace(/\[.*?\]\s*/g, '').trim();
// 결과: "Currency 모듈 분석"

// 4. Slug 생성 (영문으로만)
const slug = taskName
  .toLowerCase()                          // 영문만 소문자로
  .replace(/[/()\[\]<>:;,'"]/g, '')      // 특수문자 제거
  .replace(/\s+/g, '-')                   // 공백을 하이픈으로
  .replace(/[^a-z0-9-]/g, '')             // 영문, 숫자, 하이픈만 유지 (한글 제거)
  .replace(/-+/g, '-')                    // 연속 하이픈 축약
  .replace(/^-|-$/g, '')                  // 시작/끝 하이픈 제거
  .substring(0, 60);                      // 최대 60자
// 결과: "currency"

const draftFileName = `${phase}-${taskId}-${slug}-draft.md`;
// 최종 결과: "p2-t010-currency-draft.md"
```

**Draft 디렉토리 생성:**

```bash
# drafts 디렉토리 생성
mkdir -p "specs/$CURRENT_BRANCH/drafts"
```

Write 도구를 사용하여 수집된 정보를 **생성한 파일명**으로 저장합니다:

```
파일 경로: specs/$CURRENT_BRANCH/drafts/[phase]-[task-id]-[slug]-draft.md
예시: specs/$CURRENT_BRANCH/drafts/p2-t010-currency-draft.md
```

```markdown
# Implement Draft

## Current Task

### Task [번호]: [작업명]

**Description**: [Step 2-3에서 확인한 작업 설명]

**Acceptance Criteria**:
- [기준 1]
- [기준 2]

**Estimate**: [시간]

**Dependencies**: [의존성 정보]

## Related Files
[Step 4에서 확인한 관련 파일들...]

## Implementation Approach
[사용자와 논의한 구현 방향...]

## Test Plan
[작성할 테스트 계획...]

## Quality Checks
[Step 6에서 확인할 품질 기준들...]
```

### 8.2 Spec-Kit 명령 실행

**⚠️ CRITICAL - MUST USE SLASHCOMMAND TOOL**:

You **MUST** now use the **SlashCommand tool** to execute the `/speckit.implement` command. This is a required step - do not skip it!

Call the SlashCommand tool with the following command parameter:
- Replace `$CURRENT_BRANCH` with the actual branch name
- Replace `$DRAFT_FILE_NAME` with the generated draft file name from Step 8.1 (예: `p1-t001-setup-database-draft.md`)

```
/speckit.implement INSTRUCTION: This command is being called from /spec-kit:implement plugin. Current branch is "$CURRENT_BRANCH" and draft at "specs/$CURRENT_BRANCH/drafts/$DRAFT_FILE_NAME". Read draft. Draft contains ALL task details, implementation approach, and quality checks. Skip discussion and confirmation steps (Step 2-3) and proceed directly to Step 4 (Implement). After completing implementation, update "specs/$CURRENT_BRANCH/tasks.md". **CRITICAL - MUST FOLLOW:** 1. LANGUAGE: Process ALL content in user's system language. 2. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. 3. TASK UPDATE: Mark completed tasks in tasks.md file.
```

**명령어 예시:**
```
Phase 1, T001 작업 시:
/speckit.implement INSTRUCTION: This command is being called from /spec-kit:implement plugin. Current branch is "002-core-security" and draft at "specs/002-core-security/drafts/p1-t001-assets-app-core-draft.md". Read draft...

Phase 2, T010 작업 시:
/speckit.implement INSTRUCTION: This command is being called from /spec-kit:implement plugin. Current branch is "002-core-security" and draft at "specs/002-core-security/drafts/p2-t010-currency-draft.md". Read draft...

Phase 3, T015 작업 시:
/speckit.implement INSTRUCTION: This command is being called from /spec-kit:implement plugin. Current branch is "002-core-security" and draft at "specs/002-core-security/drafts/p3-t015-currency-cheat-engine-draft.md". Read draft...
```

The spec-kit command will read the draft file, execute the implementation, and update tasks.md.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

**Draft 파일 관리 이점:**
- 각 task별로 독립적인 draft 파일 보존
- 이전 작업 내용 참조 가능
- 디버깅 및 재실행 시 유용
- 작업 이력 추적 용이

작업 완료 후 다음 작업으로 진행하려면 `/spec-kit:implement`를 재실행하세요.

## Implementation Best Practices

✅ **DO:**
- 작은 단위로 git commit
- 테스트 먼저 작성 (TDD 권장)
- 헌법과 계획 준수
- 명확한 git commit 메시지

❌ **DON'T:**
- 여러 작업을 한 번에
- 테스트 없이 구현
- 계획에서 벗어남
- 문서 업데이트 누락

## Next Steps

구현 진행 중:
1. 작업 완료 후 `specs/$CURRENT_BRANCH/tasks.md` 파일 업데이트 확인
2. `/spec-kit:implement` - 다음 작업 계속 진행
3. `/spec-kit:analyze` - 전체 진행 상황 분석
4. `/spec-kit:checklist` - 품질 게이트 확인

## What's Next?

AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 물어봅니다:

```json
{
  "questions": [{
    "question": "현재 작업이 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?",
    "header": "다음 단계",
    "multiSelect": false,
    "options": [
      {
        "label": "다음 작업 계속 (/spec-kit:implement)",
        "description": "작업 목록의 다음 작업을 계속 구현합니다. (권장)"
      },
      {
        "label": "전체 진행 상황 분석 (/spec-kit:analyze)",
        "description": "현재까지의 구현 진행 상황과 품질을 종합적으로 분석합니다."
      },
      {
        "label": "품질 게이트 확인 (/spec-kit:checklist)",
        "description": "헌법에 정의된 품질 게이트를 확인하고 체크리스트를 실행합니다."
      },
      {
        "label": "작업 목록 확인",
        "description": "현재 작업 진행 상황을 specs/[브랜치]/tasks.md 파일에서 확인합니다."
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
- **다음 작업 계속** 선택 시 → `/spec-kit:implement` 명령 재실행 안내
- **전체 진행 상황 분석** 선택 시 → `/spec-kit:analyze` 명령 실행 안내
- **품질 게이트 확인** 선택 시 → `/spec-kit:checklist` 명령 실행 안내
- **작업 목록 확인** 선택 시 → `cat "specs/$CURRENT_BRANCH/tasks.md"` 실행 후 다시 선택지 제공
- **다른 명령어 실행** 선택 시 → 사용자가 원하는 명령어 입력 요청
- **작업 완료** 선택 시 → 세션 종료

---

**참고**:
- 작업 단위 구현으로 점진적이고 검증 가능한 진행을 보장합니다
- 우리 플러그인(/spec-kit:implement)은 작업 논의 및 방향 설정 역할
- 실제 구현은 spec-kit 명령어(/speckit.implement)가 담당
