---
description: spec-kit 프로젝트 초기화 및 CLI 설치 확인
allowed-tools: [Bash, AskUserQuestion]
argument-hint: <project-name | 프로젝트명>
---

# Initialize spec-kit Project

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). The user input is the project name.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 설치 가이드, 초기화 메시지, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

GitHub Spec-Kit을 사용하여 명세 주도 개발(SDD) 프로젝트를 초기화합니다.

## Step 0: Check Existing Installation

먼저 `.specify/` 디렉토리가 이미 존재하는지 확인:

```bash
ls -la .specify/
```

**이미 초기화된 경우:**

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "이미 spec-kit 프로젝트가 초기화되어 있습니다. 어떻게 하시겠습니까?",
    "header": "재초기화",
    "multiSelect": false,
    "options": [
      {
        "label": "새로 초기화 (기존 데이터 삭제)",
        "description": ".specify/ 폴더를 삭제하고 처음부터 다시 초기화합니다. 기존의 constitution, specification, plan, tasks 파일이 모두 삭제됩니다."
      },
      {
        "label": "취소 (기존 설정 유지)",
        "description": "초기화를 취소하고 기존 spec-kit 프로젝트를 그대로 사용합니다."
      }
    ]
  }]
}
```

- **"새로 초기화"** 선택 시: Step 1으로 진행
- **"취소"** 선택 시: 아래 "Step 0.1: 기존 프로젝트 상태 확인"으로 진행

**초기화되지 않은 경우:**

바로 Step 1으로 진행

## Step 0.1: 기존 프로젝트 상태 확인

사용자가 "취소"를 선택한 경우, 현재 프로젝트의 상태를 확인하고 다음 작업을 안내합니다.

### 1. 프로젝트 구조 표시

```bash
tree -L 2 .specify/
```

또는 Windows의 경우:

```bash
ls -R .specify/ | head -30
```

### 2. 각 파일 존재 여부 확인

```bash
ls -lh .specify/memory/constitution.md 2>/dev/null && echo "✅ Constitution" || echo "❌ Constitution"
ls -lh .specify/memory/specification.md 2>/dev/null && echo "✅ Specification" || echo "❌ Specification"
ls -lh .specify/memory/plan.md 2>/dev/null && echo "✅ Plan" || echo "❌ Plan"
ls -lh .specify/memory/tasks.md 2>/dev/null && echo "✅ Tasks" || echo "❌ Tasks"
```

### 3. 진행 상태 분석 및 다음 작업 안내

파일 존재 여부에 따라 다음 작업을 안내:

**Constitution이 없는 경우:**
```
📋 현재 상태: spec-kit이 초기화되었지만 아직 프로젝트 원칙이 정의되지 않았습니다.

🚀 다음 작업:
   /spec-kit:constitution

   프로젝트의 핵심 원칙과 기준을 정의하세요.
```

**Constitution은 있지만 Specification이 없는 경우:**
```
📋 현재 상태: 프로젝트 원칙이 정의되었습니다.

✅ 완료: Constitution
❌ 대기: Specification → Plan → Tasks → Implementation

🚀 다음 작업:
   /spec-kit:specify <기능 설명>

   구현할 기능의 요구사항을 정의하세요.
   예: /spec-kit:specify Add user authentication with OAuth2
```

**Specification은 있지만 Plan이 없는 경우:**
```
📋 현재 상태: 기능 명세가 작성되었습니다.

✅ 완료: Constitution, Specification
❌ 대기: Plan → Tasks → Implementation

🚀 다음 작업:
   /spec-kit:plan

   명세를 기반으로 기술 구현 계획을 수립하세요.
```

**Plan은 있지만 Tasks가 없는 경우:**
```
📋 현재 상태: 기술 계획이 수립되었습니다.

✅ 완료: Constitution, Specification, Plan
❌ 대기: Tasks → Implementation

🚀 다음 작업:
   /spec-kit:tasks

   계획을 실행 가능한 작업으로 분해하세요.
```

**Tasks까지 있는 경우:**
```
📋 현재 상태: 모든 계획 단계가 완료되었습니다!

✅ 완료: Constitution, Specification, Plan, Tasks
🎯 준비됨: Implementation

🚀 다음 작업:
   /spec-kit:implement

   정의된 작업을 기반으로 구현을 시작하세요.

💡 또는 다음 명령어들을 사용할 수 있습니다:
   - /spec-kit:clarify : 모호한 부분 명확화
   - /spec-kit:analyze : 프로젝트 상태 분석
   - /spec-kit:checklist : 품질 게이트 체크리스트 실행
```

### 4. 명령어 종료

기존 프로젝트 상태를 확인하고 안내한 후 초기화 명령어를 종료합니다.

새로 초기화하려면 다시 `/spec-kit:init`을 실행하고 "새로 초기화"를 선택하세요.

## Step 1: Installation Check

먼저 필수 도구가 설치되어 있는지 확인:

```bash
uv --version
```

```bash
uv tool list | grep specify
```

**모두 설치됨:**
```
✅ uv: OK (version X.X.X)
✅ specify CLI: OK
   specify-cli v{version}
   - specify.exe

→ 프로젝트 초기화 준비 완료
```

**일부 미설치:**
- `/spec-kit:check` 명령으로 상세 확인 및 설치 안내를 받으세요

## Step 2: Project Initialization

프로젝트를 초기화합니다. 사용자에게 프로젝트 이름을 물어본 후:

**Git Bash (Windows 권장):**
```bash
# 현재 디렉토리에 초기화 (대화세션 중 사용)
PYTHONIOENCODING=utf-8 specify init --here --force --script ps --ai claude

# 새 디렉토리 생성
PYTHONIOENCODING=utf-8 specify init <project-name> --force --script ps --ai claude
```

**Windows CMD:**
```cmd
# 현재 디렉토리에 초기화 (대화세션 중 사용)
set PYTHONIOENCODING=utf-8 && specify init --here --force --script ps --ai claude

# 새 디렉토리 생성
set PYTHONIOENCODING=utf-8 && specify init <project-name> --force --script ps --ai claude
```

**Windows PowerShell:**
```powershell
# 현재 디렉토리에 초기화 (대화세션 중 사용)
$env:PYTHONIOENCODING="utf-8"; specify init --here --force --script ps --ai claude

# 새 디렉토리 생성
$env:PYTHONIOENCODING="utf-8"; specify init <project-name> --force --script ps --ai claude
```

**macOS/Linux:**
```bash
# 현재 디렉토리에 초기화
PYTHONIOENCODING=utf-8 specify init --here --force --script sh --ai claude

# 새 디렉토리 생성
PYTHONIOENCODING=utf-8 specify init <project-name> --force --script sh --ai claude
```

**주요 옵션 설명:**
- `--here`: 현재 디렉토리에 초기화
- `--force`: **필수** - 대화세션 중 초기화 시 확인 프롬프트 건너뛰기
- `--script ps`: PowerShell 스크립트 사용 (Windows 권장)
- `--script sh`: Shell 스크립트 사용 (Unix/macOS/Git Bash)
- `--ai claude`: Claude Code 사용 (기본)
- `--no-git`: Git 초기화 건너뛰기 (선택)
- `--debug`: 디버그 출력 활성화 (선택)

**중요**: `--force` 없이 실행하면 대화형 확인 프롬프트가 나타나 Claude Code 세션이 중단됩니다.

**성공 시 안내:**

spec-kit CLI가 초기화 메시지를 출력한 후, 다음과 같이 안내합니다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 spec-kit 프로젝트 초기화 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 생성된 구조:
.specify/
├── memory/
│   ├── constitution.md  # 프로젝트 원칙
│   ├── specification.md # 기능 명세
│   ├── plan.md         # 기술 계획
│   └── tasks.md        # 작업 목록
└── config.json

.claude/commands/
├── speckit.constitution.md
├── speckit.specify.md
├── speckit.plan.md
├── speckit.tasks.md
├── speckit.implement.md
├── speckit.clarify.md
├── speckit.analyze.md
└── speckit.checklist.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  중요: Claude Code를 재시작해야 새로운 명령어들이 로드됩니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 권장 워크플로우 (재시작 후):

🔰 초보자 / 가이드가 필요한 경우:
   대화형 플러그인을 사용하세요. Claude가 질문하며 단계별로 안내합니다.

   1️⃣  /spec-kit:constitution  ← 프로젝트 원칙 수립 (Q&A 가이드)
   2️⃣  /spec-kit:specify       ← 기능 명세 작성 (Q&A 가이드)
   3️⃣  /spec-kit:plan          ← 기술 계획 수립 (Q&A 가이드)
   4️⃣  /spec-kit:tasks         ← 작업 분해 (Q&A 가이드)
   5️⃣  /spec-kit:implement     ← 구현 시작 (Q&A 가이드)

⚡ 숙련자 / 빠른 실행이 필요한 경우:
   spec-kit 명령어를 직접 사용하세요. 즉시 파일을 생성/수정합니다.

   1️⃣  /speckit.constitution   ← 헌법 파일 직접 생성
   2️⃣  /speckit.specify        ← 명세 파일 직접 생성
   3️⃣  /speckit.plan           ← 계획 파일 직접 생성
   4️⃣  /speckit.tasks          ← 작업 파일 직접 생성
   5️⃣  /speckit.implement      ← 구현 직접 시작

💡 차이점:
   • /spec-kit:*   = 대화형 가이드 → 정보 수집 → /speckit.* 자동 호출
   • /speckit.*    = 즉시 실행 (가이드 없음)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 추천: 처음이라면 /spec-kit:constitution 으로 시작하세요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## If NOT Ready

### uv가 없는 경우

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

설치 후: 터미널 재시작 → `uv --version` 확인 → `/spec-kit:init` 재실행

### specify CLI가 없는 경우

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

설치 후: `uv tool list | grep specify`로 확인 → `/spec-kit:init` 재실행

**PATH 설정** (선택사항):
```bash
uv tool update-shell
# 터미널 재시작 후 specify 명령 사용 가능
```

## Troubleshooting

### "specify: command not found" 또는 인코딩 오류

**방법 1**: 전체 경로 사용 (가장 확실)

**Windows (CMD):**
```cmd
set PYTHONIOENCODING=utf-8 && "%USERPROFILE%\.local\bin\specify.exe" init --here --force --script ps --ai claude
```

**Windows (PowerShell):**
```powershell
$env:PYTHONIOENCODING="utf-8"; & "$env:USERPROFILE\.local\bin\specify.exe" init --here --force --script ps --ai claude
```

**Git Bash:**
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify init --here --force --script ps --ai claude
```

**macOS/Linux:**
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify init --here --force --script sh --ai claude
```

**방법 2**: PATH 설정

```bash
uv tool update-shell
# 터미널 재시작 후 다시 시도
```

설치 확인:
```bash
uv tool list | grep specify
```

### 다른 AI 사용

Specify는 여러 AI를 지원합니다:
- `--ai claude`: Claude Code (기본 권장)
- `--ai cursor-agent`: Cursor
- `--ai windsurf`: Windsurf
- `--ai copilot`: GitHub Copilot
- `--ai gemini`: Google Gemini

예시:
```bash
PYTHONIOENCODING=utf-8 specify init my-project --ai cursor-agent
```
