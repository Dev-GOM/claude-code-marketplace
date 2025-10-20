# Claude Code용 Spec-Kit 통합 플러그인

[English Documentation](README.md)

[GitHub Spec-Kit](https://github.com/github/spec-kit)을 Claude Code와 완벽하게 통합하여 명세 주도 개발(Specification-Driven Development, SDD)을 지원합니다.

## 개요

이 플러그인은 [GitHub의 Spec-Kit](https://github.com/github/spec-kit) 방법론(Methodology)을 Claude Code에 도입하여 구조화된 개발 프로세스(Process)를 가능하게 합니다:

**헌법(Constitution)** → **명세(Specification)** → **계획(Plan)** → **작업(Tasks)** → **구현(Implementation)**

코드부터 작성하지 않고, 무엇을 만들 것인지(명세)와 어떻게 만들 것인지(계획)를 먼저 정의한 후 코드를 작성합니다.

> 💡 **Spec-Kit이란?** 명확한 요구사항과 계획을 구현 전에 정의하도록 돕는 GitHub이 개발한 명세 주도 개발(SDD) 프레임워크(Framework)입니다. 자세한 내용은 [github.com/github/spec-kit](https://github.com/github/spec-kit)에서 확인하세요.

## 주요 기능

- 🎯 **명세 주도 워크플로우(Workflow)**: 아이디어부터 구현까지 체계적인 개발 프로세스
- 📝 **10개의 슬래시 커맨드(Slash Command)**: 각 개발 단계를 위한 직관적인 명령어
- 🔧 **CLI 통합**: 공식 `specify-cli`를 사용하며 설치 가이드 제공
- 📊 **진행 상황 추적**: 프로젝트 상태 및 완료도 분석
- ✅ **품질 게이트(Quality Gate)**: 코드 품질을 위한 자동화된 체크리스트(Checklist)
- ⚠️ **스마트 사전 체크**: 일반적인 실수를 방지하는 자동 경고

## 사전 요구사항

이 플러그인은 외부 도구가 필요합니다:

1. **uv** (Python 패키지 매니저)
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

2. **specify-cli** (GitHub Spec-Kit CLI)
   - 설치: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`

도구가 설치되지 않은 경우 플러그인이 설치 과정을 안내합니다.

## 명령어

### 핵심 워크플로우

| 명령어 | 설명 | 사용 시점 |
|--------|------|-----------|
| `/spec-kit:init` | spec-kit 프로젝트 초기화 | 새 프로젝트 시작 시 |
| `/spec-kit:check` | 설치 상태 확인 | 설정 문제 해결 시 |
| `/spec-kit:constitution` | 프로젝트 원칙 정의 | 기능 작업 전 |
| `/spec-kit:specify` | 기능 명세 작성 | 무엇을 만들지 정의 |
| `/spec-kit:plan` | 기술 계획 작성 | 어떻게 만들지 정의 |
| `/spec-kit:tasks` | 작업으로 분해 | 구현 계획 시 |
| `/spec-kit:implement` | 작업 실행 | 개발 중 |

### 유틸리티 명령어

| 명령어 | 설명 | 사용 시점 |
|--------|------|-----------|
| `/spec-kit:clarify` | 모호한 부분 명확화 | 명세가 불명확할 때 |
| `/spec-kit:analyze` | 프로젝트 상태 분석 | 진행 상황 검토 시 |
| `/spec-kit:checklist` | 품질 게이트 실행 | 커밋/릴리스 전 |

## 워크플로우 예제

```bash
# 1. 프로젝트 초기화
/spec-kit:init

# 2. 프로젝트 헌법 수립 (원칙 & 기준)
/spec-kit:constitution

# 3. 기능 명세 작성 (무엇을 만들 것인가)
/spec-kit:specify

# 4. 기술 계획 작성 (어떻게 만들 것인가)
/spec-kit:plan

# 5. 작업으로 분해
/spec-kit:tasks

# 6. 단계별 구현
/spec-kit:implement

# 7. 품질 게이트 확인
/spec-kit:checklist
```

## 반복적 워크플로우

Spec-Kit은 **반복 설계 기반**입니다. 구현 중 새로운 것을 배우면서 이전 단계를 수정할 수 있습니다.

### 이전 단계를 업데이트해야 할 때

다음의 경우 명세, 계획 또는 헌법을 업데이트해야 합니다:
- 🔍 구현 중 누락된 요구사항 발견
- 💡 프로토타이핑(Prototyping)이나 테스트에서 새로운 인사이트(Insight) 도출
- 🎯 비즈니스 우선순위 변경
- ⚠️ 기술적 제약사항 발견
- 🤔 미해결 질문(Open Questions) 명확화 필요

### 업데이트 방법 (권장 접근법)

#### 1. 명령어 재실행 (권장 방법) ✅

해당 단계의 명령어를 다시 실행하세요. Claude가 컨텍스트를 유지하며 개선을 도와줍니다:

```bash
# 명세 변경이 필요한가요?
/spec-kit:specify

# 기술 계획 수정이 필요한가요?
/spec-kit:plan

# 헌법 업데이트가 필요한가요?
/spec-kit:constitution
```

**이 방법이 최선인 이유:**
- 📝 Claude가 변경 이유를 이해함 (컨텍스트(Context) 보존)
- 🔄 하위 단계에 자동으로 변경사항 반영
- ✅ 일관성 검사 및 검증 내장
- 📋 대화 내 변경 이력 추적

#### 2. Clarify 활용

특정 부분의 모호함을 해결하거나 특정 섹션을 업데이트해야 할 때:

```bash
# 모호한 부분 명확화
/spec-kit:clarify

# 영향받는 단계 재생성
/spec-kit:plan
/spec-kit:tasks
```

**사용 시점:**
- 명세/계획의 특정 부분 명확화 필요
- 미해결 질문(Open Questions) 답변 필요
- 사소한 개선 필요

#### 3. 직접 파일 수정 (신중히 사용)

사소한 외관상 변경만:

```bash
# .specify/memory/ 파일 직접 수정
# - constitution.md
# - specification.md
# - plan.md

# 하위 단계 재생성
/spec-kit:tasks
```

**사용 대상:**
- 오타 수정
- 포맷 조정
- 문구 개선

**피해야 할 경우:**
- 기능 추가/제거
- 요구사항 변경
- 대규모 재구성

### 계단식 업데이트

이전 단계 업데이트 후 하위 단계를 재생성하세요:

```
헌법 변경 → /spec-kit:specify → /spec-kit:plan → /spec-kit:tasks

명세 변경 → /spec-kit:plan → /spec-kit:tasks

계획 변경 → /spec-kit:tasks
```

### 예제: 구현 중 발견

```bash
# 구현 중 명세에서 누락된 중요한 엣지 케이스(Edge Case) 발견

# 1. 새 요구사항으로 명세 업데이트
/spec-kit:specify
"오프라인 모드 처리를 추가해야 합니다..."

# 2. 새 접근법으로 기술 계획 업데이트
/spec-kit:plan

# 3. 새 작업을 포함하도록 tasks 재생성
/spec-kit:tasks

# 4. 업데이트된 계획으로 구현 계속
/spec-kit:implement
```

**핵심 원칙:** 반복을 받아들이세요. 새로운 것을 배웠을 때 명세를 업데이트하는 것이 오래된 요구사항에 맞춰 코딩하는 것보다 낫습니다.

## 프로젝트 구조

초기화 후:

```
your-project/
├── .specify/
│   ├── memory/
│   │   ├── constitution.md   # 프로젝트 원칙
│   │   ├── specification.md  # 기능 요구사항
│   │   ├── plan.md          # 기술 구현 계획
│   │   └── tasks.md         # 실행 가능한 작업 목록
│   └── config.json          # 프로젝트 설정
└── ...
```

## 핵심 개념

### 헌법 (Constitution)
프로젝트의 "권리 장전" - 모든 결정을 안내하는 비협상 가능한 원칙:
- 핵심 가치 (프라이버시, 성능, 접근성)
- 기술 표준 (코드 품질, 테스팅, 보안)
- 품질 게이트(Quality Gate) (머지 전, 릴리스 전 체크리스트)

### 명세 (Specification)
무엇을 만들 것인지 정의:
- 사용자 스토리와 요구사항
- 수용 기준
- UI/UX 흐름
- 성공 지표
- 구현 세부사항은 포함하지 않음

### 계획 (Plan)
어떻게 만들 것인지 정의:
- 아키텍처(Architecture)와 기술 스택(Tech Stack)
- 데이터 모델(Model)과 컴포넌트(Component)
- 구현 단계
- 성능 최적화
- 테스트 전략

### 작업 (Tasks)
계획을 실행 가능한 항목으로 분해:
- 작은 단위 (각 1-4시간)
- 명확한 수용 기준
- 의존성 매핑
- 진행 상황 추적

## 아키텍처(Architecture) 및 토큰 효율성

이 플러그인은 최적의 토큰 효율성을 위해 2계층 아키텍처로 설계되었습니다:

### 2계층 설계

1. **플러그인 명령어** (`/spec-kit:*`)
   - 대화형 가이드 계층
   - 대화를 통해 정보 수집
   - 결과를 `.specify/temp/[명령어]-draft.md`에 저장
   - 파일 경로 + 지시사항만 핵심 명령어에 전달

2. **핵심 명령어** (`/speckit.*` - GitHub Spec-Kit)
   - 실행 계층
   - draft 파일을 직접 읽음
   - `.specify/memory/` 파일 생성/업데이트
   - 사용자 지시사항을 정확히 따름

### 토큰 최적화

긴 텍스트를 명령어 인자로 전달하는 대신:

```bash
# ❌ 비효율적: 모든 내용을 인자로 전달
/speckit.specify "수백 줄의 긴 명세 내용..."

# ✅ 효율적: 파일 경로 + 지시사항만 전달
/speckit.specify .specify/temp/specification-draft.md

INSTRUCTION: draft 파일을 읽고 정보 수집 단계를 건너뛰세요.
draft 파일의 정보만 사용하세요. 추가 정보를 묻지 마세요.
```

**이점:**
- 🚀 **토큰 사용량 감소**: 전체 내용 대신 파일 경로만
- 📁 **재사용 가능한 draft**: 디버깅 및 반복 작업 용이
- 🔄 **깔끔한 워크플로우**: 관심사의 분리
- ⚡ **빠른 실행**: 처리할 컨텍스트 감소

### Draft 파일

모든 플러그인 명령어는 `.specify/temp/`에 draft 파일을 생성합니다:

```
.specify/
├── temp/                      # ← Draft 파일 (임시)
│   ├── constitution-draft.md
│   ├── specification-draft.md
│   ├── plan-draft.md
│   ├── tasks-draft.md
│   ├── implement-draft.md
│   ├── clarify-draft.md
│   ├── analyze-draft.md
│   └── checklist-draft.md
└── memory/                    # ← 최종 파일 (영구)
    ├── constitution.md
    ├── specification.md
    ├── plan.md
    └── tasks.md
```

## 스마트 사전 체크

플러그인은 일반적인 실수를 방지하고 사용자를 더 나은 방법으로 안내하는 자동 사전 체크 기능을 포함합니다.

### 자동 경고

명령어는 진행하기 전에 잠재적 문제를 자동으로 감지합니다:

#### `/spec-kit:plan` - Open Questions 체크
```bash
⚠️ **경고**: 명세에 미해결 질문이 있습니다!

계획을 작성하기 전에 `/spec-kit:clarify`를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다.

명확하지 않은 요구사항으로 계획을 작성하면:
- 잘못된 기술 선택
- 불필요한 재작업
- 구현 중 혼란

그래도 계속 진행하시겠습니까? (예/아니오)
```

#### `/spec-kit:tasks` - 이중 체크
```bash
⚠️ **경고**: 명세나 계획에 미해결 질문이 있습니다!

작업을 분해하기 전에 `/spec-kit:clarify`를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다.

명확하지 않은 요구사항으로 작업을 분해하면:
- 불완전한 작업 정의
- 잘못된 의존성 파악
- 구현 중 방향 전환 필요
- 시간 낭비

그래도 계속 진행하시겠습니까? (예/아니오)
```

#### `/spec-kit:implement` - 프로젝트 상태 체크
```bash
⚠️ **경고**: 명세나 계획에 미해결 질문이 있습니다!

구현을 시작하기 전에 `/spec-kit:clarify`를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다.

명확하지 않은 요구사항으로 구현하면:
- 잘못된 방향으로 코드 작성
- 나중에 대규모 리팩토링 필요
- 시간과 노력 낭비
- 좌절감 증가

그래도 계속 진행하시겠습니까? (예/아니오)
```

### 스마트 커밋 플로우

`/spec-kit:implement` 명령어는 세 가지 커밋 옵션을 제공합니다:

```
📋 **커밋 방법 선택**

다음 중 어떻게 진행하시겠습니까?

1. 품질 게이트 실행 후 커밋 (권장)
   - `/spec-kit:checklist` 실행
   - Pre-Merge Checklist 통과 확인
   - 통과 시 커밋 진행
   - 적합한 경우:
     • 핵심 기능 구현 완료
     • 여러 작업 완료
     • PR 생성 예정
     • 릴리스 준비

2. 바로 커밋
   - 기본 품질 체크(lint, test)만 확인
   - 빠르게 진행
   - 적합한 경우:
     • 작은 수정
     • 진행 중 작업 저장
     • 실험적 변경

3. 커밋하지 않음
   - 다음 작업 계속 진행
   - 여러 작업을 모아서 커밋

선택: [1/2/3]
```

### 스마트 체크의 장점

- 🛡️ **노력 낭비 방지**: 불명확한 요구사항을 조기에 발견
- 🎯 **품질 향상**: 품질 게이트 사용 장려
- 📋 **더 나은 워크플로우**: clarify/checklist 명령어의 적절한 사용 촉진
- 👤 **사용자 제어**: 모든 체크는 선택 가능한 권장사항
- 📖 **명확한 안내**: 구체적인 명령어와 설명 제공

## 장점

✅ **명확성**: 코딩 전에 무엇을 만들지 정확히 파악
✅ **정렬**: 명세, 계획, 코드가 동기화 상태 유지
✅ **품질**: 내장된 품질 게이트로 회귀 방지
✅ **커뮤니케이션**: 명세가 팀 문서 역할
✅ **반복적**: 많은 투자 전에 가정 검증
✅ **토큰 효율적**: 최적화된 아키텍처로 토큰 사용량 최소화

## 문제 해결

### "specify: command not found" 또는 인코딩 오류

`specify` 명령어를 찾을 수 없거나 유니코드 인코딩 오류(특히 Windows에서)가 발생하는 경우, 전체 경로를 사용하세요:

**Windows (CMD)**:
```cmd
set PYTHONIOENCODING=utf-8 && "%USERPROFILE%\.local\bin\specify.exe" [command]
```

**Windows (PowerShell)**:
```powershell
$env:PYTHONIOENCODING="utf-8"; & "$env:USERPROFILE\.local\bin\specify.exe" [command]
```

**macOS/Linux**:
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify [command]
```

**영구 해결** - PATH에 추가:
```bash
uv tool update-shell
# 터미널 재시작
```

### 플러그인이 로드되지 않음

```bash
# 플러그인 설정 확인
cat ~/.claude/plugins.json

# 플러그인 구조 확인
ls -la plugins/spec-kit/.claude-plugin/
```

### CLI가 설치되지 않음

`/spec-kit:check`를 실행하여 진단하고 설치 지침을 받으세요.

## 예제

[examples](examples/) 디렉토리에서 확인:
- 샘플 헌법
- 완전한 명세 예제
- 기술 계획 템플릿(Template)

## 기여

기여를 환영합니다! 다음을 따라주세요:
1. 기존 명령어 스타일 준수 (frontmatter + 간결한 지침)
2. 실제 spec-kit CLI로 테스트
3. 기능 추가 시 README 업데이트

## 리소스

- [GitHub Spec-Kit](https://github.com/github/spec-kit)
- [Claude Code 플러그인](https://docs.claude.com/en/docs/claude-code/plugins)
- [Spec-Kit 문서](https://github.com/github/spec-kit#readme)

## 라이선스

MIT License - [LICENSE](LICENSE) 파일 참조.

## 크레딧

- **GitHub Spec-Kit**: 원본 SDD 방법론 및 CLI
- **Claude Code**: AI 기반 개발 환경
- **플러그인 작성자**: 통합 및 Claude Code 적응

---

**버전**: 2.2.0
**최종 업데이트**: 2025-10-20
**상태**: 베타

## 변경 이력

### v2.2.0 (2025-10-20)
- ✨ **SlashCommand 도구 통합**: 8개 커맨드 파일 모두에서 SlashCommand 도구를 명시적으로 사용하도록 개선 (중요 경고 추가)
- 🚀 **Git 설정 워크플로우**: init 커맨드에 포괄적인 Git 설치 및 GitHub 설정 추가
  - OS에 따라 Git 자동 감지 및 설치 (Windows/macOS/Linux)
  - Git 사용자 정보 대화식 설정
  - GitHub CLI 설치 및 인증
  - `gh repo create --private`로 Private 리포지토리 생성
- 📝 **Phase 기반 Draft 파일명**: implement 커맨드가 phase와 task ID를 포함한 draft 파일 생성
  - 형식: `[phase]-[task-id]-[slug]-draft.md` (예: `p2-t010-currency-draft.md`)
  - 크로스 플랫폼 호환성을 위한 영문 전용 slug 생성
  - 더 나은 파일 구성 및 작업 추적

### v2.0.4 (2025-10-19)
- 🐛 **버그 수정**: SlashCommand 형식 수정 - 8개 명령어 파일 모두에서 명령어와 INSTRUCTION을 한 줄로 통합
- 📝 **명확성 개선**: `/speckit.*` 명령어와 INSTRUCTION 파라미터 사이의 모호한 줄바꿈 제거
- 🔄 **워크플로우 개선**: `/spec-kit:specify` 실행 전 Git 변경사항 확인 - 기존 변경사항 커밋 여부 먼저 묻기
- 🚀 **Git 통합 강화**: `/speckit.specify` 명세 작성 후 브랜치 퍼블리쉬 여부 선택 (퍼블리쉬/로컬 커밋/나중에 결정)
- ♻️ **역할 분리**: 플러그인 커맨드에서 PowerShell 실행 제거 - CLI 커맨드가 담당하여 워크플로우 명확화

### v2.0.3 (2025-10-19)
- 🐛 **버그 수정**: 모든 커맨드 파일에서 중복된 `CURRENT_BRANCH=$(git branch --show-current)` 선언 제거
- 📝 **문서화**: 플러그인 커맨드(`/spec-kit:*`)와 CLI 커맨드(`/speckit.*`) 혼동 방지를 위한 구분 설명 추가
- 🔧 **코드 품질**: 각 커맨드에서 CURRENT_BRANCH를 정확히 한 번만 선언하도록 개선

### v2.0.2 (2025-10-19)
- 📝 **문서화**: 모든 spec-kit 커맨드 INSTRUCTION에 AskUserQuestion 도구 사용 지침 추가
- 🔧 **개선**: GitHub Spec-Kit CLI가 명확화가 필요할 때 AskUserQuestion 사용 가능

### v2.0.1 (2025-10-19)
- 🐛 **버그 수정**: clarify 명령어의 draft 파일 경로를 브랜치 기반 구조로 수정 (`.specify/temp/` 대신 `specs/[브랜치]/drafts/` 사용)
- 📝 **문서화**: clarify.md에서 새 워크플로우의 올바른 파일 경로 참조하도록 업데이트

### v2.0.0 (2025-10-19)
- 🔄 **브랜치 기반 워크플로우**: 브랜치별 기능 명세를 지원하는 완전한 구조 개편
- 📁 **경로 변경**: 기능 파일을 `.specify/memory/`에서 `specs/[브랜치명]/` 구조로 마이그레이션
- ✨ **워크플로우 선택**: specify 명령어가 새 명세 생성 또는 기존 명세 재작성 선택 제공
- 🔗 **PowerShell 통합**: 자동 브랜치 생성을 위한 `create-new-feature.ps1` 스크립트 통합
- 🎯 **브랜치 감지**: 모든 명령어가 현재 브랜치를 자동 감지하고 올바른 명세 파일로 작업
- 📋 **다음 단계 안내**: 모든 명령어에 워크플로우 탐색을 위한 AskUserQuestion 프롬프트 추가
- ⚠️ **주요 변경사항**: 기존 v1.x 사용자는 명세를 새로운 브랜치 기반 구조로 마이그레이션 필요

### v1.3.0 (2025-10-18)
- 🔄 **업데이트 모드 선택(Update Mode Selection)**: 모든 핵심 명령어가 기존 파일을 감지하고 두 가지 업데이트 옵션 제공
- 📋 **완전 재생성(Full Regeneration)**: 요구사항이 크게 변경될 때 처음부터 완전히 다시 작성
- ✏️ **부분 업데이트(Incremental Update)**: 타겟 변경을 위한 병합 기반 업데이트
- 📖 **반복적 워크플로우 문서화(Iterative Workflow Documentation)**: 이전 단계를 언제, 어떻게 업데이트할지에 대한 포괄적인 가이드
- 🎯 **컨텍스트 보존(Context Preservation)**: 명령어 재실행 시 대화 히스토리와 변경 이유 유지
- ⚡ **계단식 업데이트(Cascade Updates)**: 변경 후 하위 단계 업데이트에 대한 명확한 안내

### v1.2.0 (2025-10-18)
- ✨ **스마트 사전 체크(Smart Prerequisite Checks)**: plan, tasks, implement 명령어에서 미해결 질문(Open Questions) 자동 감지
- 🎨 **통합 커밋 플로우(Unified Commit Flow)**: 3가지 명확한 옵션이 있는 단일 결정 포인트 (품질 게이트 + 커밋 / 바로 커밋 / 건너뛰기)
- 📋 **더 나은 UX**: 각 커밋 옵션에 대한 상황별 적절한 안내
- 🛡️ **오류 방지**: 진행하기 전에 불명확한 요구사항에 대해 경고
- 📖 **문서화**: README에 포괄적인 "스마트 사전 체크" 섹션 추가

### v1.1.0 (2025-10-17)
- ✨ **토큰 효율성**: draft 파일을 사용하는 2계층 아키텍처 구현
- 🚀 **성능**: 전체 내용 대신 파일 경로 사용으로 토큰 사용량 감소
- 📁 **Draft 시스템**: 모든 명령어가 `.specify/temp/`에 재사용 가능한 draft 파일 생성
- 📝 **지시사항**: 각 명령어마다 중복 단계를 건너뛰는 정확한 지시사항 추가
- 🌐 **다국어**: 모든 명령어에 대한 시스템 언어 감지 개선

### v1.0.0 (2025-10-16)
- 🎉 최초 릴리스
- 📋 완전한 SDD 워크플로우를 위한 10개 슬래시 명령어
- 🔧 GitHub Spec-Kit CLI와의 통합
