# Auto Release Manager

[English Documentation](README.md)

> 지능형 감지 및 크로스 플랫폼 지원으로 모든 프로젝트 타입의 버전 업데이트 및 릴리즈를 자동화합니다.

## 개요

Auto Release Manager는 다양한 프로젝트 타입에서 전체 릴리즈 워크플로우를 간소화하는 Claude Code 스킬입니다. 프로젝트 타입을 자동으로 감지하고, 적절한 형식으로 버전 파일을 업데이트하며, 커밋에서 CHANGELOG를 생성하고, Git 작업을 처리합니다—모두 크로스 플랫폼 호환성을 갖추고 있습니다.

## 기능

✨ **범용 프로젝트 지원**
- Node.js, Python, Rust, Go
- Unity, Unreal Engine, Godot
- Claude Code 플러그인, VS Code 확장
- VERSION 파일을 사용하는 일반 프로젝트

🔍 **지능형 감지**
- 프로젝트 타입 자동 식별
- 모든 버전 파일 자동 검색
- 현재 버전 감지

📝 **스마트 버전 관리**
- 다양한 파일 형식 업데이트 (JSON, TOML, YAML, Unity 에셋)
- Semantic versioning 지원 (MAJOR.MINOR.PATCH)
- Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)

📋 **자동 CHANGELOG**
- Git 커밋 히스토리에서 생성
- Conventional Commits 파싱
- 타입별로 변경사항 그룹화

🚀 **Git 자동화**
- 크로스 플랫폼 Git 작업
- 커밋, 태그, 푸시 워크플로우
- 에러 핸들링 및 검증

## 지원하는 프로젝트 타입

| 프로젝트 타입 | 버전 파일 | 형식 |
|--------------|----------|------|
| Node.js | `package.json` | JSON |
| Python | `pyproject.toml`, `setup.py` | TOML, Python |
| Rust | `Cargo.toml` | TOML |
| Go | `VERSION` | Plain text |
| Unity | `version.json` + `ProjectSettings.asset` | JSON + YAML |
| Unreal | `*.uproject` | JSON |
| Claude 플러그인 | `.claude-plugin/plugin.json` | JSON |
| VS Code 확장 | `package.json` | JSON |
| 브라우저 확장 | `manifest.json` | JSON |
| 일반 | `VERSION` | Plain text |

## 요구사항

- **Python 3.11+** (내장 `tomllib`를 사용한 TOML 파싱용)
- Git (버전 관리 작업용)
- Claude Code CLI

## 설치

```bash
# 마켓플레이스에서 설치
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
/plugin install auto-release-manager@dev-gom-plugins

# 또는 직접 설치
/plugin add https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/auto-release-manager
```

## 사용법

### 기본 사용법

Claude에게 릴리즈를 처리하도록 요청하기만 하면 됩니다:

```
"패치 버전 올리고 릴리즈 만들어줘"
"v1.0.3으로 업데이트해줘"
"Unity 버전 1.5.0으로 릴리즈 만들어줘"
```

Claude가 자동으로:
1. 프로젝트 타입 감지
2. 버전 계산 또는 지정된 버전 사용
3. 관련된 모든 버전 파일 업데이트
4. CHANGELOG 생성 (선택사항)
5. Git 작업 처리 (커밋, 태그, 푸시)

### 사용 예시

**Node.js 프로젝트:**
```
사용자: "마이너 버전 1.3.0으로 올리고 푸시해줘"

Claude:
✓ 감지됨: Node.js 프로젝트 (package.json)
✓ package.json 업데이트: 1.2.5 → 1.3.0
✓ CHANGELOG 항목 생성됨
✓ 변경사항 커밋됨
✓ 태그 v1.3.0 생성됨
✓ origin에 푸시됨
```

**Unity 프로젝트:**
```
사용자: "Unity 버전 2.0.0으로 업데이트해줘"

Claude:
✓ 감지됨: Unity 프로젝트
✓ version.json 업데이트: 1.5.3 → 2.0.0
✓ ProjectSettings.asset에 동기화됨
✓ 두 파일 모두 커밋됨
✓ 태그 v2.0.0 생성됨
```

**Python 프로젝트:**
```
사용자: "패치 버전 올려줘"

Claude:
✓ 감지됨: Python 프로젝트 (pyproject.toml)
✓ 업데이트됨: 0.3.2 → 0.3.3
✓ CHANGELOG.md 업데이트됨
✓ 커밋 및 태그 생성됨
```

### Unity 전용 워크플로우

Unity 프로젝트는 이중 파일 방식을 사용합니다:

1. **`version.json`** - 주 소스 (편집하기 쉬움)
2. **`ProjectSettings/ProjectSettings.asset`** - 자동 동기화 (빌드에서 사용)

스킬이 자동으로:
- version.json 업데이트
- ProjectSettings.asset에 동기화
- 두 파일을 함께 커밋

자세한 내용은 [Unity 가이드](./skills/references/unity-guide.md)를 참고하세요.

### Unreal 전용 워크플로우

Unreal 프로젝트는 `.uproject` 파일을 사용합니다:

- .uproject의 `Version` 필드 업데이트
- Config/DefaultGame.ini에 선택적으로 동기화
- JSON 포맷팅 처리

자세한 내용은 [Unreal 가이드](./skills/references/unreal-guide.md)를 참고하세요.

## 스크립트

모든 스크립트는 크로스 플랫폼(Windows, macOS, Linux)에서 작동합니다:

- **detect_project.py**: 프로젝트 타입 및 버전 파일 자동 감지
- **update_version.py**: 모든 파일 형식에 대한 범용 버전 업데이터
- **sync_unity_version.py**: Unity version.json → ProjectSettings.asset 동기화
- **git_operations.py**: Git 워크플로우 자동화 (커밋, 태그, 푸시)
- **changelog_generator.py**: 커밋에서 CHANGELOG 생성

스크립트는 독립적으로 실행 가능합니다:

```bash
# 프로젝트 감지
python -X utf8 scripts/detect_project.py .

# 버전 업데이트
python -X utf8 scripts/update_version.py package.json 1.3.0

# Unity 동기화
python -X utf8 scripts/sync_unity_version.py

# Git 작업
python -X utf8 scripts/git_operations.py commit "Release v1.3.0"
python -X utf8 scripts/git_operations.py tag v1.3.0
python -X utf8 scripts/git_operations.py push

# CHANGELOG 생성
python -X utf8 scripts/changelog_generator.py 1.3.0 v1.2.0
```

## 요구사항

- Python 3.11+ (스크립트는 표준 라이브러리만 사용, 외부 의존성 없음)
- Git (Git 작업용)
- GitHub CLI (선택사항, GitHub 릴리즈용)

## 버전 히스토리

### 1.0.0 - 2025-01-20

첫 릴리즈

#### Added
- 범용 프로젝트 타입 감지 (Node.js, Python, Rust, Go, Unity, Unreal 등)
- 크로스 플랫폼 버전 업데이트 스크립트
- Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)
- Unreal Engine .uproject 지원
- Conventional Commits에서 CHANGELOG 자동 생성
- Git 워크플로우 자동화
- 포괄적인 문서 및 가이드

## 기여

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](../../CONTRIBUTING.md)를 참고하세요.

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE)를 참고하세요.

## 제작자

**Dev GOM**
- GitHub: [@Dev-GOM](https://github.com/Dev-GOM)
- Marketplace: [claude-code-marketplace](https://github.com/Dev-GOM/claude-code-marketplace)

## 참고

- [프로젝트 타입 레퍼런스](./skills/references/project-types.md)
- [Unity 가이드](./skills/references/unity-guide.md)
- [Unreal 가이드](./skills/references/unreal-guide.md)
