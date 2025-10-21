# TODO Collector

> **언어**: [English](README.md) | [한국어](README.ko.md)

> 수정한 파일에서 TODO 코멘트를 추적하고 Claude Code 세션 중 변경사항을 감지합니다.

## 주요 기능

- 🔍 수정한 파일에서 TODO 스타일 코멘트 추적
- 📊 다양한 코멘트 타입 지원: TODO, FIXME, HACK, BUG, XXX, NOTE
- 🌐 여러 프로그래밍 언어 지원 (JS, TS, Python, Java, Go, C++ 등)
- 📝 클릭 가능한 파일 링크가 포함된 상세 마크다운 리포트 생성: `.todos-report.md`
- 📂 코멘트 타입과 파일별로 그룹화
- 🔄 추가 및 제거된 TODO 자동 감지
- ⚡ 수정한 파일만 스캔 (성능 최적화)
- 🚫 `node_modules`, `dist`, `build` 등 일반적인 디렉토리 자동 제외

## 동작 원리

이 플러그인은 **세 개의 hook**을 사용하여 지능적으로 TODO를 추적합니다:

### SessionStart Hook (`init-config.js`)
세션 시작 시 실행:
1. `plugin.json`에서 플러그인 버전 읽기
2. `.plugin-config/hook-todo-collector.json` 설정 파일 존재 확인
3. 설정 파일이 있으면 `_pluginVersion`과 현재 플러그인 버전 비교
4. 버전이 일치하면 즉시 종료 (빠름!)
5. 버전이 다르면 자동 마이그레이션 수행:
   - 기존 사용자 설정과 새 기본 필드 병합
   - 모든 사용자 커스텀 설정 보존
   - `_pluginVersion`을 현재 버전으로 업데이트
6. 설정 파일이 없으면 기본 설정으로 생성

### PostToolUse Hook (`track-todos.js`)
Write, Edit, NotebookEdit 작업 후 실행:
1. 수정된 파일 경로 캡처
2. 추적 파일(`.state/todo-changed-files.json`)에 기록
3. TODO 스캔을 위한 유효한 확장자를 가진 파일만 추적

### Stop Hook (`collect-todos.js`)
Claude Code 세션이 끝날 때 실행:
1. 세션 중 수정된 파일 목록 로드
2. 수정된 파일이 없으면 조용히 종료 (스캔 불필요)
3. 수정된 파일만 TODO 스타일 코멘트 스캔
4. 이전 TODO 상태와 비교하여 변경사항 감지
5. 추가되거나 제거된 TODO 식별
6. TODO 상태 업데이트 및 리포트 생성
7. 요약 표시: "📋 TODO Collector: 3 added ✅, 1 removed ❌ in 2 file(s). Total: 15 TODO(s)"
8. 추적 파일 정리

## 설치

```bash
/plugin install hook-todo-collector@dev-gom-plugins
```

## 사용법

설치 후 자동으로 작동합니다:

1. **세션 중**: 파일을 Write 또는 Edit하면 자동으로 추적됩니다
2. **세션 종료 시**: 수정된 파일을 스캔하고 변경사항을 표시합니다:

```
📋 TODO Collector: 3 added ✅, 1 removed ❌ in 2 file(s). Total: 15 TODO(s)
```

**참고**: 파일이 수정되지 않았거나 TODO 변경사항이 감지되지 않으면 플러그인은 조용히 종료됩니다.

## 지원하는 코멘트 형식

### JavaScript/TypeScript
```javascript
// TODO: 사용자 인증 구현
// FIXME: 이벤트 핸들러의 메모리 누수
// HACK: API 버그에 대한 임시 해결책
// BUG: 엣지 케이스에서 잘못된 계산
// XXX: 리팩토링 필요
// NOTE: 하위 호환성을 위한 것
```

### Python
```python
# TODO: 에러 핸들링 추가
# FIXME: 성능 병목 현상
```

### 여러 줄 코멘트
```javascript
/* TODO: 여러 줄에 걸쳐 있는
   TODO 코멘트입니다 */
```

## 출력 예시

### .todos-report.md (상세 리포트)

```markdown
# TODO Report

**Total Items**: 12
- TODO: 5
- FIXME: 3
- BUG: 2
- HACK: 1
- NOTE: 1

---

## TODO (5)

### [src/auth.js:23](src/auth.js:23)
사용자 인증 구현

### [src/api.js:45](src/api.js:45)
속도 제한 추가

...
```

### .todos.txt (간단한 목록)

```
TODO (src/auth.js:23): 사용자 인증 구현
TODO (src/api.js:45): 속도 제한 추가
FIXME (src/handlers.js:67): 이벤트 핸들러의 메모리 누수
...
```

## 환경 설정

플러그인은 첫 실행 시 `.plugin-config/hook-todo-collector.json`에 설정 파일을 자동으로 생성합니다.

### 자동 설정 마이그레이션

플러그인을 업데이트하면 설정이 자동으로 마이그레이션됩니다:
- ✅ **사용자 설정 보존**
- ✅ **새 설정 필드 자동 추가** (기본값 사용)
- ✅ **버전 추적** (`_pluginVersion` 필드)
- ✅ **수동 작업 불필요**

### 사용 가능한 설정 옵션

#### `showLogs`
- **설명**: 콘솔에 TODO 수집 메시지 표시
- **기본값**: `true`
- **예시**: `false` (무음 모드)

#### `outputDirectory`
- **설명**: 리포트 파일을 저장할 디렉토리 경로
- **기본값**: `""` (프로젝트 루트)
- **예시**: `"docs"`, `".claude-output"`

#### `outputFile`
- **설명**: TODO 리포트 출력 파일명
- **기본값**: `""` (`.{프로젝트명}-todos-report.md` 사용)
- **예시**: `"todo-report.md"`, `"todos.md"`

#### `includeDirs`
- **설명**: 스캔할 디렉토리 목록 (비어있으면 전체 스캔)
- **기본값**: `[]` (전체 프로젝트 스캔)
- **예시**: `["src", "lib", "components"]` (이 디렉토리들만 스캔)

#### `excludeDirs`
- **설명**: 스캔에서 제외할 디렉토리 목록
- **기본값**: `["node_modules", "dist", "build", ".git", "coverage", ".next", ".nuxt", "out", "vendor", ".snapshots", ".claude-plugin"]`
- **예시**: 제외할 디렉토리 추가

#### `includeExtensions`
- **설명**: 스캔할 파일 확장자 목록
- **기본값**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".cs", ".kt", ".kts", ".swift", ".rs", ".scala", ".dart", ".m", ".mm", ".css", ".scss", ".sass", ".less", ".html", ".vue", ".svelte", ".r", ".R", ".jl", ".coffee", ".sh", ".bash", ".ps1", ".toml", ".ini", ".yaml", ".yml"]`
- **예시**: `[".js", ".ts", ".py"]` (이 파일 타입만 스캔)

#### `excludeExtensions`
- **설명**: 스캔에서 제외할 파일 확장자 목록
- **기본값**: `[]` (제외 없음)
- **예시**: `[".min.js", ".bundle.js", ".map"]` (압축 파일 및 맵 파일 제외)

#### `commentTypes`
- **설명**: 검색할 코멘트 타입 목록
- **기본값**: `["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]`
- **예시**: `["TODO", "FIXME", "IMPORTANT", "REVIEW"]`

### 설정 변경 방법

`.plugin-config/hook-todo-collector.json` 파일을 프로젝트 루트에서 편집하세요:

```json
{
  "showLogs": false,
  "outputDirectory": "docs",
  "outputFile": "todos.md",
  "includeDirs": ["src", "lib"],
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    "out",
    "vendor",
    ".snapshots",
    ".claude-plugin"
  ],
  "includeExtensions": [".js", ".ts", ".py"],
  "excludeExtensions": [".min.js", ".bundle.js"],
  "commentTypes": ["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]
}
```

### 설정 우선순위

`outputDirectory`는 다음 순서로 결정됩니다:
1. `hooks.json`의 `configuration.outputDirectory`
2. 환경 변수 `TODO_COLLECTOR_DIR`
3. 환경 변수 `CLAUDE_PLUGIN_OUTPUT_DIR`
4. 기본값 (프로젝트 루트)

## Hook 출력

플러그인은 단일 JSON 요약을 출력합니다:

```javascript
console.log(JSON.stringify({
  systemMessage: '📋 TODO Collector found 12 item(s) (TODO: 5, FIXME: 3). Report saved to .todos-report.md',
  continue: true
}));
```

## 성능

플러그인은 성능을 위해 고도로 최적화되어 있습니다:
- **수정된 파일만 스캔** (전체 프로젝트가 아님)
- **세션 중 수정된 파일이 없으면** 스캔 건너뛰기
- 일반적인 빌드/의존성 디렉토리 **제외**
- **상태 기반 추적** - 실제 변경사항만 리포트
- **일반적인 스캔 시간**: 몇 개의 수정된 파일에 대해 100ms 미만

## 모범 사례

### .gitignore에 추가

```gitignore
.todos-report.md
.todos.txt
```

### 정기 검토

TODO를 검토하고 처리할 시간을 정기적으로 가지세요:
- 주간 리포트 검토
- TODO를 GitHub 이슈로 변환
- 완료된 TODO를 코드에서 제거

### 명명 규칙

일관된 TODO 패턴을 사용하세요:
- `TODO:` - 향후 작업
- `FIXME:` - 수정이 필요한 알려진 버그
- `HACK:` - 임시 해결책
- `BUG:` - 확인된 버그
- `XXX:` - 위험/경고 마커
- `NOTE:` - 중요한 정보

## 문제 해결

### 플러그인이 리포트를 생성하지 않나요?

1. **파일 수정**: 플러그인은 세션 중 수정한 파일만 스캔합니다
   - Write 또는 Edit 도구 사용
   - 파일은 유효한 확장자(`.js`, `.py` 등)를 가져야 합니다

2. **TODO 변경사항 확인**: 파일을 수정했지만 TODO를 추가/제거하지 않았다면 플러그인은 조용히 종료됩니다

3. **플러그인 설치 확인**:
   ```bash
   /plugin
   ```

4. **파일 권한 확인**: 플러그인이 프로젝트 루트에 쓸 수 있는지 확인하세요

### 일부 TODO가 누락되었나요?

1. **코멘트 형식 확인**: 정규식 패턴과 일치해야 합니다
2. **파일 확장자 확인**: `CODE_EXTENSIONS`에 포함되어야 합니다
3. **디렉토리 확인**: `SKIP_DIRS`에 포함되지 않아야 합니다

## 관련 플러그인

- **Git Auto-Backup** - 변경사항 자동 커밋
- **Complexity Monitor** - 코드 복잡도 추적
- **Session File Tracker** - 파일 작업 요약

## 기술 세부사항

### 스크립트 위치
- `plugins/hook-todo-collector/scripts/track-todos.js` - 파일 수정 추적
- `plugins/hook-todo-collector/scripts/collect-todos.js` - TODO 스캔 및 리포트

### Hook 타입
- **PostToolUse** (Write|Edit|NotebookEdit) - 수정된 파일 추적
- **Stop** - 추적된 파일 스캔 및 리포트 생성

### 상태 파일
- `.state/todo-changed-files.json` - 세션 중 수정된 파일 추적
- `.state/todo-state.json` - 변경 감지를 위한 이전 TODO 상태 저장

### 의존성
- Node.js

### 타임아웃
- PostToolUse: 5초
- Stop: 15초

## 기여하기

기여 환영합니다! 아이디어:
- 더 많은 언어 지원
- 이슈 트래커 통합
- TODO 우선순위 레벨
- 오래된 TODO 감지

## 버전

**현재 버전**: 1.2.0

## 변경 이력

### v1.2.0 (2025-10-20)
- 🐛 **버그 수정**: 전체 스캔 로직 개선 - 리포트 파일이 없을 때 즉시 스캔
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 자동 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 스코핑**: 프로젝트명 기반 state 파일로 충돌 방지
- ⚡ **성능**: 설정이 최신이면 SessionStart 훅 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 경로 처리 개선
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚙️ **커스텀 필터링**: `includeDirs`와 `includeExtensions` 설정 추가
- 🔍 **전체 프로젝트 스캔**: 첫 실행 시 자동으로 전체 프로젝트 스캔
- 🔧 **설정 리팩토링**: `.plugin-config/hook-todo-collector.json`으로 설정 이동

### v1.1.1 (2025-10-18)
- `outputFormats` 설정의 빈 배열 처리 버그 수정

### v1.1.0 (2025-10-18)
- 프로젝트 디렉토리 이름을 사용한 프로젝트별 파일 이름 지정 추가
- 여러 프로젝트 간 파일 충돌 방지

### v1.0.0
- 최초 릴리스

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
