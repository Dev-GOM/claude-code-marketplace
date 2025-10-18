# Auto Documentation Generator

> **언어**: [English](README.md) | [한국어](README.ko.md)

프로젝트 구조를 자동으로 스캔하고 문서화합니다.

## 주요 기능

- 📁 **프로젝트 구조 스캔**: 전체 디렉토리 트리 자동 생성
- 📦 **package.json 정보 추출**: 프로젝트 이름, 버전, 스크립트, 의존성
- 🔗 **클릭 가능한 링크**: 각 파일로 바로 이동 가능
- ⚡ **스마트 스캔**: 첫 실행 시 전체 스캔, 이후 변경된 파일만 추적
- 🚫 **자동 제외**: node_modules, .git, dist 등 불필요한 디렉토리 제외
- 📝 **단일 문서 생성**: `.project-structure.md`에 모든 정보 통합

## 동작 원리

이 플러그인은 **2단계 추적 방식**을 사용합니다:

### 1단계: 실시간 파일 변경 추적 (PostToolUse Hook)
- `Write` 작업 후마다 실행
- 변경된 파일 경로를 `.structure-changes.json`에 기록
- 무음 실행 (사용자 방해 없음)

### 2단계: 구조 문서 생성 (Stop Hook)
- Claude Code 세션 종료 시 실행
- 변경사항이 있거나 첫 실행인 경우:
  1. 프로젝트 전체 디렉토리 스캔
  2. `package.json`에서 정보 추출
  3. 디렉토리 트리 생성 (클릭 가능한 파일 링크 포함)
  4. `.project-structure.md`에 저장
  5. 현재 파일 목록을 `.structure-state.json`에 저장

## 설치

```bash
/plugin install hook-auto-docs@dev-gom-plugins
```

## 사용법

설치 후 자동으로 작동합니다. 세션이 끝나면:

```
📚 Auto-Docs: Generated project structure documentation (245 files)
```

또는:

```
📚 Auto-Docs: Updated project structure (5 file(s) changed)
```

## 생성되는 파일

### .project-structure.md

프로젝트 전체 구조를 담은 문서:

```markdown
# Project Structure

**Generated**: 2025-10-15 14:30:00

## Project Information

- **Name**: claude-code-marketplace
- **Version**: 1.0.0
- **Description**: Claude Code plugin marketplace

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests

## Dependencies

### Production (5)

- express: `^4.18.0`
- dotenv: `^16.0.0`

### Development (3)

- eslint: `^8.0.0`
- prettier: `^2.8.0`

## Directory Structure

claude-code-marketplace/
├── [.gitignore](.gitignore)
├── [package.json](package.json)
├── [README.md](README.md)
├── plugins/
│   ├── hook-auto-docs/
│   │   ├── [scripts/track-structure-changes.js](plugins/hook-auto-docs/scripts/track-structure-changes.js)
│   │   ├── [scripts/update-structure-docs.js](plugins/hook-auto-docs/scripts/update-structure-docs.js)
│   │   └── [hooks/hooks.json](plugins/hook-auto-docs/hooks/hooks.json)
│   └── hook-complexity-monitor/
│       └── ...
```

## 환경 설정

플러그인의 동작은 `hooks/hooks.json` 파일의 `configuration` 섹션에서 설정할 수 있습니다.

### 사용 가능한 설정 옵션

#### `outputDirectory`
- **설명**: 생성된 문서를 저장할 디렉토리 경로
- **기본값**: `""` (프로젝트 루트)
- **예시**: `"docs"`, `".claude-output"`

#### `includeDirs`
- **설명**: 스캔할 특정 디렉토리 목록 (비어있으면 전체 프로젝트 스캔)
- **기본값**: `[]` (비어있음 - 제외 디렉토리 외 모든 디렉토리 스캔)
- **예시**: `["src", "lib"]` - `src`와 `lib` 폴더만 스캔
- **사용 사례**: 대규모 프로젝트에서 특정 부분만 문서화하고 싶을 때 유용

#### `excludeDirs`
- **설명**: 프로젝트 구조 스캔 시 제외할 디렉토리 목록 (`includeDirs`가 설정되면 무시됨)
- **기본값**: `["node_modules", ".git", "dist", "build", "coverage", ".next", "out", ".nuxt", "vendor", ".vscode", ".idea"]`
- **예시**: 배열에 디렉토리 추가/제거

#### `includeExtensions`
- **설명**: 포함할 파일 확장자 목록 (비어있으면 제외된 확장자를 제외한 모든 파일 포함)
- **기본값**: `[]` (비어있음 - 제외된 확장자를 제외한 모든 확장자 포함)
- **예시**: `[".js", ".ts", ".jsx", ".tsx"]` - JavaScript/TypeScript 파일만 포함
- **참고**: 점(.)을 포함하거나 제외하고 지정 가능 (`.meta` 또는 `meta`)
- **사용 사례**: 특정 파일 타입에만 집중 (예: 소스 코드만, 설정 파일만)

#### `excludeExtensions`
- **설명**: 프로젝트 구조에서 제외할 파일 확장자 목록 (`includeExtensions`와 함께 작동)
- **기본값**: `[]` (비어있음 - 제외되는 확장자 없음)
- **예시**: `[".meta", ".log", ".tmp"]` - Unity 메타 파일, 로그, 임시 파일 제외
- **참고**: 점(.)을 포함하거나 제외하고 지정 가능 (`.meta` 또는 `meta`)
- **사용 사례**: 불필요한 파일 타입 숨기기 (예: Unity `.meta` 파일, 빌드 산출물)

### 설정 변경 방법

`plugins/hook-auto-docs/hooks/hooks.json` 파일을 편집하세요:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": "docs",
    "includeDirs": ["src", "lib"],
    "excludeDirs": [
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".next",
      "out",
      ".nuxt",
      "vendor",
      ".vscode",
      ".idea",
      "tmp",
      "cache"
    ],
    "includeExtensions": [],
    "excludeExtensions": [".meta", ".log", ".tmp"]
  }
}
```

**필터링 규칙**:
- `includeDirs`가 비어있지 않은 배열로 설정되면, 해당 디렉토리들만 스캔되고 `excludeDirs`는 무시됩니다
- `includeExtensions`가 설정되면 해당 확장자만 먼저 포함한 후, `excludeExtensions`로 추가 필터링합니다
- 두 확장자 필터는 함께 작동하여 (AND 조건) 최대한의 유연성을 제공합니다

### 설정 우선순위

`outputDirectory`는 다음 순서로 결정됩니다:
1. `hooks.json`의 `configuration.outputDirectory`
2. 환경 변수 `AUTO_DOCS_DIR`
3. 환경 변수 `CLAUDE_PLUGIN_OUTPUT_DIR`
4. 기본값 (프로젝트 루트)

## 모범 사례

### .gitignore에 추가

```gitignore
.project-structure.md
.structure-state.json
.structure-changes.json
```

### 정기 검토

생성된 프로젝트 구조 문서를 활용하여:
- 새로운 팀원 온보딩 자료로 사용
- 프로젝트 구조 이해
- 리팩토링 계획 수립

## 출력 파일

| 파일 | 목적 | 커밋? |
|------|------|-------|
| `.project-structure.md` | 프로젝트 구조 문서 | ❌ 선택 |
| `.structure-state.json` | 파일 목록 상태 (내부용) | ❌ 아니오 |
| `.structure-changes.json` | 세션 변경사항 (임시) | ❌ 아니오 |

## 문제 해결

### 플러그인이 문서를 생성하지 않나요?

1. **변경사항 확인**:
   플러그인은 파일이 변경되었을 때만 업데이트합니다.

2. **첫 실행**:
   첫 실행 시 자동으로 전체 구조를 스캔합니다.

3. **파일 권한 확인**:
   플러그인이 프로젝트 루트에 쓰기 권한이 있는지 확인하세요.

### 일부 디렉토리가 누락되었나요?

1. **제외 목록 확인**: `configuration.excludeDirs`에 포함되어 있는지 확인
2. **숨김 디렉토리**: `.`로 시작하는 디렉토리는 자동 제외됩니다

## 성능

- **첫 스캔**: 1000+ 파일 프로젝트도 3초 이내
- **증분 업데이트**: 변경된 파일만 추적하여 빠른 실행
- **메모리 효율**: 파일을 스트리밍 방식으로 처리

## 관련 플러그인

- **Session Summary** - 세션 중 파일 작업 요약
- **TODO Collector** - TODO 코멘트 수집
- **Git Auto-Backup** - 세션 종료 시 자동 커밋

## 기술 세부사항

### 스크립트 위치
- `plugins/hook-auto-docs/scripts/track-structure-changes.js` - 파일 변경 추적
- `plugins/hook-auto-docs/scripts/update-structure-docs.js` - 구조 문서 생성

### Hook 타입
- `PostToolUse` - Write 작업 후 파일 변경 추적
- `Stop` - 세션 종료 시 구조 문서 생성

### 의존성
- Node.js
- Git (선택사항 - 변경 감지용)

### 타임아웃
- PostToolUse: 5초
- Stop: 15초

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
