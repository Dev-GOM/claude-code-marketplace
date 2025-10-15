# TODO Collector

> **언어**: [English](README.md) | [한국어](README.ko.md)

프로젝트 전체를 스캔하여 모든 TODO, FIXME, HACK, XXX, NOTE, BUG 코멘트를 수집합니다.

## 주요 기능

- 🔍 모든 소스 파일에서 TODO 스타일 코멘트 스캔
- 📊 다양한 코멘트 타입 지원: TODO, FIXME, HACK, BUG, XXX, NOTE
- 🌐 여러 프로그래밍 언어 지원 (JS, TS, Python, Java, Go, C++ 등)
- 📝 두 가지 리포트 형식 생성:
  - `.todos-report.md` - 클릭 가능한 파일 링크가 포함된 상세 마크다운 리포트
  - `.todos.txt` - 간단한 텍스트 목록
- 📂 코멘트 타입과 파일별로 그룹화
- 🚫 `node_modules`, `dist`, `build` 등 일반적인 디렉토리 자동 제외
- ⚡ 변경사항이 있을 때만 실행

## 동작 원리

이 플러그인은 **Stop hook**을 사용하여 Claude Code 세션이 끝날 때 실행됩니다.

1. 커밋되지 않은 변경사항 확인 (`git status --porcelain`)
2. 변경사항이 없으면 스캔 건너뛰기 (성능 최적화)
3. 프로젝트 디렉토리 재귀적으로 탐색
4. 정규식 패턴을 사용하여 TODO 스타일 코멘트 스캔
5. 코멘트 텍스트와 위치(파일, 줄 번호) 추출
6. 타입과 파일별로 그룹화 및 정렬
7. 클릭 가능한 파일 링크가 포함된 리포트 생성
8. 세션에 요약 표시

## 설치

```bash
/plugin install hook-todo-collector@dev-gom-plugins
```

## 사용법

설치 후 자동으로 작동합니다. 세션이 끝나면:

```
📋 TODO Collector found 12 item(s) (TODO: 5, FIXME: 3, BUG: 2, HACK: 1, NOTE: 1). Report saved to .todos-report.md
```

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

플러그인의 동작은 `hooks/hooks.json` 파일의 `configuration` 섹션에서 설정할 수 있습니다.

### 사용 가능한 설정 옵션

#### `outputDirectory`
- **설명**: 리포트 파일을 저장할 디렉토리 경로
- **기본값**: `""` (프로젝트 루트)
- **예시**: `"docs"`, `".claude-output"`

#### `commentTypes`
- **설명**: 검색할 코멘트 타입 목록
- **기본값**: `["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE"]`
- **예시**: `["TODO", "FIXME", "IMPORTANT", "REVIEW"]`

#### `outputFormats`
- **설명**: 생성할 리포트 파일 목록
- **기본값**: `[".todos-report.md", ".todos.txt"]`
- **예시**: `[".todos-report.md"]` (마크다운만)

#### `supportedExtensions`
- **설명**: 스캔할 파일 확장자 목록
- **기본값**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".c", ".cpp", ".rs", ".rb", ".php", ".swift"]`
- **예시**: 배열에 확장자 추가/제거

#### `excludeDirs`
- **설명**: 스캔에서 제외할 디렉토리 목록
- **기본값**: `["node_modules", "dist", "build", ".git", "coverage", ".next"]`
- **예시**: 배열에 디렉토리 추가

### 설정 변경 방법

`plugins/hook-todo-collector/hooks/hooks.json` 파일을 편집하세요:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": "",
    "commentTypes": ["TODO", "FIXME", "HACK", "BUG", "XXX", "NOTE", "IMPORTANT"],
    "outputFormats": [".todos-report.md", ".todos.txt"],
    "supportedExtensions": [
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".go", ".c", ".cpp",
      ".rs", ".rb", ".php", ".swift",
      ".kt", ".scala"
    ],
    "excludeDirs": [
      "node_modules", "dist", "build",
      ".git", "coverage", ".next",
      "vendor", "target"
    ]
  }
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

플러그인은 성능을 위해 최적화되어 있습니다:
- **변경사항이 없으면** 스캔 건너뛰기
- 일반적인 빌드/의존성 디렉토리 **제외**
- 모든 파일을 메모리에 로드하지 않고 **스트리밍**
- **일반적인 스캔 시간**: 1000+ 파일 프로젝트에서 2초 미만

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

1. **변경사항 확인**:
   ```bash
   git status
   ```
   플러그인은 변경사항이 있을 때만 실행됩니다.

2. **플러그인 설치 확인**:
   ```bash
   /plugin
   ```

3. **파일 권한 확인**:
   플러그인이 프로젝트 루트에 쓸 수 있는지 확인하세요.

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
`plugins/hook-todo-collector/scripts/collect-todos.js`

### Hook 타입
`Stop` - 세션 종료 시 실행

### 의존성
- Node.js
- Git (변경 감지용)

### 타임아웃
15초

## 기여하기

기여 환영합니다! 아이디어:
- 더 많은 언어 지원
- 이슈 트래커 통합
- TODO 우선순위 레벨
- 오래된 TODO 감지

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
