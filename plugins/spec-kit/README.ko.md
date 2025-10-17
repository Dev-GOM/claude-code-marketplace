# Claude Code용 Spec-Kit 통합 플러그인

[English Documentation](README.md)

[GitHub Spec-Kit](https://github.com/github/spec-kit)을 Claude Code와 완벽하게 통합하여 명세 주도 개발(Specification-Driven Development, SDD)을 지원합니다.

## 개요

이 플러그인은 [GitHub의 Spec-Kit](https://github.com/github/spec-kit) 방법론을 Claude Code에 도입하여 구조화된 개발 프로세스를 가능하게 합니다:

**헌법** → **명세** → **계획** → **작업** → **구현**

코드부터 작성하지 않고, 무엇을 만들 것인지(명세)와 어떻게 만들 것인지(계획)를 먼저 정의한 후 코드를 작성합니다.

> 💡 **Spec-Kit이란?** 명확한 요구사항과 계획을 구현 전에 정의하도록 돕는 GitHub이 개발한 명세 주도 개발(SDD) 프레임워크입니다. 자세한 내용은 [github.com/github/spec-kit](https://github.com/github/spec-kit)에서 확인하세요.

## 주요 기능

- 🎯 **명세 주도 워크플로우**: 아이디어부터 구현까지 체계적인 개발 프로세스
- 📝 **10개의 슬래시 커맨드**: 각 개발 단계를 위한 직관적인 명령어
- 🔧 **CLI 통합**: 공식 `specify-cli`를 사용하며 설치 가이드 제공
- 📊 **진행 상황 추적**: 프로젝트 상태 및 완료도 분석
- ✅ **품질 게이트**: 코드 품질을 위한 자동화된 체크리스트

## 사전 요구사항

이 플러그인은 외부 도구가 필요합니다:

1. **uv** (Python 패키지 매니저)
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

2. **specify-cli** (GitHub Spec-Kit CLI)
   - 설치: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`

도구가 설치되지 않은 경우 플러그인이 설치 과정을 안내합니다.

## 설치

`.claude/plugins.json`에 추가:

```json
{
  "plugins": [
    {
      "source": "marketplace:spec-kit"
    }
  ]
}
```

또는 GitHub에서 직접 설치:

```json
{
  "plugins": [
    {
      "source": "github:your-username/claude-code-marketplace/plugins/spec-kit"
    }
  ]
}
```

## 명령어

### 핵심 워크플로우

| 명령어 | 설명 | 사용 시점 |
|--------|------|-----------|
| `/speckit:init` | spec-kit 프로젝트 초기화 | 새 프로젝트 시작 시 |
| `/speckit:check` | 설치 상태 확인 | 설정 문제 해결 시 |
| `/speckit:constitution` | 프로젝트 원칙 정의 | 기능 작업 전 |
| `/speckit:specify` | 기능 명세 작성 | 무엇을 만들지 정의 |
| `/speckit:plan` | 기술 계획 작성 | 어떻게 만들지 정의 |
| `/speckit:tasks` | 작업으로 분해 | 구현 계획 시 |
| `/speckit:implement` | 작업 실행 | 개발 중 |

### 유틸리티 명령어

| 명령어 | 설명 | 사용 시점 |
|--------|------|-----------|
| `/speckit:clarify` | 모호한 부분 명확화 | 명세가 불명확할 때 |
| `/speckit:analyze` | 프로젝트 상태 분석 | 진행 상황 검토 시 |
| `/speckit:checklist` | 품질 게이트 실행 | 커밋/릴리스 전 |

## 워크플로우 예제

```bash
# 1. 프로젝트 초기화
/speckit:init

# 2. 프로젝트 헌법 수립 (원칙 & 기준)
/speckit:constitution

# 3. 기능 명세 작성 (무엇을 만들 것인가)
/speckit:specify

# 4. 기술 계획 작성 (어떻게 만들 것인가)
/speckit:plan

# 5. 작업으로 분해
/speckit:tasks

# 6. 단계별 구현
/speckit:implement

# 7. 품질 게이트 확인
/speckit:checklist
```

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
- 품질 게이트 (머지 전, 릴리스 전 체크리스트)

### 명세 (Specification)
무엇을 만들 것인지 정의:
- 사용자 스토리와 요구사항
- 수용 기준
- UI/UX 흐름
- 성공 지표
- 구현 세부사항은 포함하지 않음

### 계획 (Plan)
어떻게 만들 것인지 정의:
- 아키텍처와 기술 스택
- 데이터 모델과 컴포넌트
- 구현 단계
- 성능 최적화
- 테스트 전략

### 작업 (Tasks)
계획을 실행 가능한 항목으로 분해:
- 작은 단위 (각 1-4시간)
- 명확한 수용 기준
- 의존성 매핑
- 진행 상황 추적

## 장점

✅ **명확성**: 코딩 전에 무엇을 만들지 정확히 파악
✅ **정렬**: 명세, 계획, 코드가 동기화 상태 유지
✅ **품질**: 내장된 품질 게이트로 회귀 방지
✅ **커뮤니케이션**: 명세가 팀 문서 역할
✅ **반복적**: 많은 투자 전에 가정 검증

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

`/speckit:check`를 실행하여 진단하고 설치 지침을 받으세요.

## 예제

[examples](examples/) 디렉토리에서 확인:
- 샘플 헌법
- 완전한 명세 예제
- 기술 계획 템플릿

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

**버전**: 1.0.0
**최종 업데이트**: 2025-10-16
**상태**: 베타
