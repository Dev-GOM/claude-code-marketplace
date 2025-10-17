---
description: spec-kit CLI 설치 상태 및 프로젝트 설정 확인
allowed-tools: [Bash]
---

# Check spec-kit Installation & Project Status

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 설치 가이드, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

spec-kit 환경이 올바르게 설정되었는지 확인합니다.

## Step 1: CLI Installation Check

먼저 `uv`가 설치되어 있는지 확인:

```bash
uv --version
```

**설치됨:**
```
✅ uv: Installed (version X.X.X)
```

**미설치:**
```
❌ uv: Not installed

Install uv:
- macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
- Windows: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

Next: 설치 후 터미널 재시작 → /spec-kit:check 재실행
```

다음으로 `specify` CLI가 설치되어 있는지 확인:

```bash
uv tool list | grep specify
```

**설치됨:**
```
✅ specify CLI: Installed

출력 예시:
specify-cli v{version}
- specify.exe
```

설치가 확인되면 `specify check` 명령으로 환경을 테스트:

```bash
PYTHONIOENCODING=utf-8 specify check
```

**정상 작동 시 마지막에 표시:**
```
Specify CLI is ready to use!
```

✅ 이 메시지가 보이면 프로젝트 초기화 준비 완료

**미설치:**
```
❌ specify CLI: Not installed
(uv tool list에 specify가 없음)

Install specify CLI:
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

Next Steps:
1. 터미널 재시작
2. /spec-kit:init 실행하여 프로젝트 초기화
```

**중요**: Git Bash에서는 `PYTHONIOENCODING=utf-8` 접두사가 필요합니다 (Windows cp949 인코딩 문제 해결)

## Step 2: Project Setup Check

CLI가 준비되었다면 프로젝트 초기화 상태 확인:

```bash
ls -la .specify/
```

**Initialized:**
```
✅ **Project Setup**
✅ .specify/ directory found
✅ Project is initialized

Existing files:
- constitution.md
- specification.md
- plan.md
- tasks.md

Next: /speckit:specify, /speckit:plan, /speckit:implement
```

**Not Initialized:**
```
ℹ️  **Project Setup**
⚠️ .specify/ not found
⚠️ Project not initialized

Next: /speckit:init
```

## Troubleshooting

### "specify: command not found" 또는 인코딩 오류

**방법 1**: 전체 경로 사용 (가장 확실)

**Windows (CMD):**
```cmd
set PYTHONIOENCODING=utf-8 && "%USERPROFILE%\.local\bin\specify.exe" check
```

**Windows (PowerShell):**
```powershell
$env:PYTHONIOENCODING="utf-8"; & "$env:USERPROFILE\.local\bin\specify.exe" check
```

**Git Bash:**
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify check
```

**macOS/Linux:**
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify check
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
