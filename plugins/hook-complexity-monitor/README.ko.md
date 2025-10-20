# Code Complexity Monitor

> **언어**: [English](README.md) | [한국어](README.ko.md)

코드 복잡도 지표를 모니터링하고 임계값을 초과하면 경고합니다.

## 주요 기능

- 📊 **순환 복잡도** 계산 (결정 지점)
- 📏 **함수 길이** 확인 (함수당 줄 수)
- 📄 **파일 길이** 모니터링 (파일당 줄 수)
- 🏗️ 정확한 줄 번호와 함께 **중첩 깊이** 추적
- 🌐 전용 analyzer가 있는 **11개 프로그래밍 언어** 지원
- 🔄 해결된 문제를 로그에서 **자동 삭제**
- ⚡ Edit/Write 작업 후 실시간 분석
- 📝 클릭 가능한 링크가 있는 지속적인 로그(`.complexity-log.md`) 유지
- 🎯 수정한 파일만 분석

## 동작 원리

이 플러그인은 포괄적인 복잡도 추적을 위해 **세 개의 hook**을 사용합니다:

### SessionStart Hook (`init-config.js`)
세션 시작 시 실행:
1. `plugin.json`에서 플러그인 버전 읽기
2. `.plugin-config/hook-complexity-monitor.json` 설정 파일 존재 확인
3. 설정 파일이 있으면 `_pluginVersion`과 현재 플러그인 버전 비교
4. 버전이 일치하면 즉시 종료 (빠름!)
5. 버전이 다르면 자동 마이그레이션 수행:
   - 기존 사용자 설정과 새 기본 필드 병합
   - 모든 사용자 커스텀 설정 보존
   - `_pluginVersion`을 현재 버전으로 업데이트
6. 설정 파일이 없으면 기본 설정으로 생성

### PostToolUse Hook (`check-complexity.js`)
Write 또는 Edit 작업 직후 실행:
1. hook 입력(stdin)으로부터 수정된 파일 경로 수신
2. 파일이 지원되는 확장자를 가지고 있는지 확인 (JS, TS, Python, Java 등)
3. registry에서 적절한 언어 analyzer 선택
4. 파일 분석:
   - 언어별 패턴을 사용하여 함수 추출
   - 함수당 순환 복잡도 계산
   - 함수 길이 측정
   - 파일 길이 확인
   - 정확한 줄 추적과 함께 중첩 깊이 분석
5. 지표를 임계값과 비교
6. 세션 파일(`.state/complexity-session.json`)에 문제 저장
7. 문제가 없어도 분석된 파일 기록

### Stop Hook (`finalize-session.js`)
Claude Code 세션이 끝날 때 실행:
1. `.state/complexity-session.json`에서 세션 데이터 로드
2. 기존 로그와 병합하여 파일 항목 업데이트
3. 해결된 문제 자동 삭제 (빈 문제 배열이 있는 파일)
4. 클릭 가능한 파일 링크가 있는 `.complexity-log.md` 생성/업데이트
5. 세션 파일 정리

## 설치

```bash
/plugin install hook-complexity-monitor@dev-gom-plugins
```

## 기본 임계값

```javascript
const THRESHOLDS = {
  cyclomaticComplexity: 10,  // 함수당 최대 결정 지점
  functionLength: 50,         // 함수당 최대 줄 수
  fileLength: 500,           // 파일당 최대 줄 수
  nesting: 4                 // 최대 중첩 깊이
};
```

## 출력 예시

### 세션 중 (PostToolUse Hook)
파일 편집 후 문제는 세션 파일에 자동으로 추적됩니다.

### 세션 종료 시 (Stop Hook)
통합 로그가 생성/업데이트됩니다:

### .complexity-log.md

```markdown
# Code Complexity Issues

Last Updated: 2025-10-14 03:45:12

## Issues by File

### [utils.js](./src/utils.js#L45)

- Function 'processData' has complexity 15 (threshold: 10)
- Max nesting depth is 6 (threshold: 4) starts at line 53

### [handlers.js](./src/handlers.js#L23)

- Function 'handleRequest' has 75 lines (threshold: 50)
```

**참고**: 문제를 수정하면 다음 세션 종료 시 로그에서 자동으로 사라집니다.

## 지표 설명

### 순환 복잡도 (Cyclomatic Complexity)

코드의 결정 지점 수를 측정합니다:
- 각 `if`, `else if`, `while`, `for`, `case`는 1 추가
- 각 `&&`, `||`, `?`는 1 추가
- 각 `catch`는 1 추가

**예시**:
```javascript
function complexFunction(x, y) {  // 복잡도 = 1 (기본)
  if (x > 0) {                    // +1 = 2
    if (y > 0) {                  // +1 = 3
      return x + y;
    }
  }
  return 0;
}
// 총 복잡도: 3
```

**임계값**: 10 (초과 시 경고)

### 함수 길이

함수의 코드 줄 수를 셉니다.

**임계값**: 50줄 (초과 시 정보)

### 파일 길이

파일의 총 줄 수를 셉니다.

**임계값**: 500줄 (초과 시 경고)

### 중첩 깊이

코드 블록이 얼마나 깊게 중첩되어 있는지 측정합니다.

**예시**:
```javascript
function deeplyNested() {
  if (condition1) {         // 깊이 1
    while (condition2) {    // 깊이 2
      for (let i = 0; i < 10; i++) {  // 깊이 3
        if (condition3) {   // 깊이 4
          if (condition4) { // 깊이 5 ⚠️ 임계값 초과
            // 코드
          }
        }
      }
    }
  }
}
```

**임계값**: 4단계 (초과 시 경고)

## 환경 설정

플러그인은 첫 실행 시 `.plugin-config/hook-complexity-monitor.json` 설정 파일을 자동으로 생성합니다.

### 자동 설정 마이그레이션

플러그인 업데이트 시 설정이 자동으로 마이그레이션됩니다:
- ✅ **사용자 설정 보존**
- ✅ **새 설정 필드 자동 추가** (기본값 적용)
- ✅ **버전 추적** (`_pluginVersion` 필드 사용)
- ✅ **수동 작업 불필요**

### 사용 가능한 설정 옵션

#### `showLogs`
- **설명**: 복잡도 모니터 메시지를 콘솔에 표시
- **기본값**: `false`
- **예시**: `true` (복잡도 분석 결과 표시)

#### `thresholds`
- **설명**: 코드 복잡도 임계값 설정
- **기본값**:
  ```json
  {
    "cyclomaticComplexity": 10, // 함수당 최대 결정 지점
    "functionLength": 50,       // 함수당 최대 줄 수
    "fileLength": 500,          // 파일당 최대 줄 수
    "nesting": 4                // 최대 중첩 깊이
  }
  ```

#### `supportedExtensions`
- **설명**: 분석할 파일 확장자 목록
- **기본값**: `[".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".c", ".cpp", ".cs", ".rb", ".php", ".rs", ".swift", ".kt", ".kts"]`

#### `outputDirectory`
- **설명**: 로그 파일을 저장할 디렉토리 경로
- **기본값**: `""` (프로젝트 루트)

#### `logFile`
- **설명**: 복잡도 로그 파일명
- **기본값**: `".complexity-log.md"`

#### `severityLevels`
- **설명**: 각 지표의 심각도 수준 (warning/info)
- **기본값**:
  ```json
  {
    "complexity": "warning",
    "nesting": "warning",
    "fileLength": "warning",
    "functionLength": "info"
  }
  ```

### 설정 변경 방법

`plugins/hook-complexity-monitor/hooks/hooks.json` 파일을 편집하세요:

```json
{
  "hooks": { ... },
  "configuration": {
    "outputDirectory": ".claude-logs",
    "thresholds": {
      "cyclomaticComplexity": 15,
      "functionLength": 100,
      "fileLength": 1000,
      "nesting": 5
    },
    "supportedExtensions": [
      ".js", ".jsx", ".ts", ".tsx",
      ".py", ".java", ".go", ".c", ".cpp",
      ".rs", ".rb"
    ],
    "logFile": ".complexity-log.md",
    "severityLevels": {
      "complexity": "warning",
      "nesting": "warning",
      "fileLength": "info",
      "functionLength": "info"
    }
  }
}
```

### 설정 우선순위

`outputDirectory`는 다음 순서로 결정됩니다:
1. `hooks.json`의 `configuration.outputDirectory`
2. 환경 변수 `COMPLEXITY_LOG_DIR`
3. 환경 변수 `CLAUDE_PLUGIN_OUTPUT_DIR`
4. 기본값 (프로젝트 루트)

## 문제 심각도 수준

- **Warning** 🔴: 순환 복잡도, 중첩 깊이, 파일 길이
- **Info** 🔵: 함수 길이

## 모범 사례

### .gitignore에 추가

```gitignore
.complexity-log.txt
```

### 결과 해석

**순환 복잡도 > 10**:
- 함수를 더 작은 함수로 분리 고려
- 복잡한 조건문을 이름 있는 함수로 추출
- 조기 반환을 사용하여 중첩 감소

**중첩 깊이 > 4**:
- 중첩된 블록을 별도 함수로 추출
- 조기 반환/continue 사용
- 조건 로직을 평탄화

**함수 길이 > 50**:
- 더 작고 집중된 함수로 분할
- 재사용 가능한 로직 추출
- 단일 책임 원칙 적용

**파일 길이 > 500**:
- 여러 파일로 분할
- 기능/도메인별로 구성
- 모듈 구조 고려

### 경고를 무시해야 할 때

임계값을 초과하는 정당한 이유:
- 생성된 코드 (파서, 설정 파일)
- 단순화할 수 없는 복잡한 알고리즘
- 많은 케이스가 있는 상태 머신
- 점진적으로 리팩토링 중인 레거시 코드

## 문제 해결

### 플러그인이 실행되지 않나요?

1. **hook이 트리거되는지 확인**: Edit/Write 작업 후에만 실행됩니다
2. **코드 파일 확인**: 지원되는 확장자여야 합니다
3. **파일 경로 확인**: 플러그인은 hook 입력으로부터 파일 경로를 받습니다 (git이 아님)

### 오탐이 발생하나요?

1. **임계값을 조정**하여 프로젝트에 맞추세요
2. **생성된 파일 제외**: `getChangedFiles()` 수정
3. **실제 코드 검토** - 때로는 복잡도를 피할 수 없습니다

## 관련 플러그인

- **TODO Collector** - TODO 코멘트 추적
- **Git Auto-Backup** - 변경사항 자동 커밋
- **Session File Tracker** - 파일 작업 요약

## 지원 언어

플러그인은 다음 언어를 위한 전문 analyzer를 포함합니다:
- **JavaScript/TypeScript** (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`)
- **Python** (`.py`) - 들여쓰기 기반 중첩 사용
- **Java** (`.java`)
- **Go** (`.go`)
- **C/C++** (`.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`)
- **C#** (`.cs`)
- **Rust** (`.rs`)
- **Swift** (`.swift`)
- **Kotlin** (`.kt`, `.kts`)
- **Ruby** (`.rb`) - `end` 키워드 추적 사용
- **PHP** (`.php`)

각 analyzer는 정확한 함수 추출과 복잡도 계산을 위해 언어별 구문을 이해합니다.

## 기술 세부사항

### 스크립트 위치
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-complexity-monitor/scripts/init-config.js` - 설정 초기화
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-complexity-monitor/scripts/check-complexity.js` - 수정된 파일 분석
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-complexity-monitor/scripts/finalize-session.js` - 최종 로그 생성
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-complexity-monitor/scripts/analyzers/` - 언어별 analyzer

### Analyzer 아키텍처
- **Base Analyzer**: analyzer 인터페이스를 정의하는 추상 클래스
- **BraceBasedAnalyzer**: brace 기반 언어를 위한 공통 로직
- **Language Analyzers**: JavaScript, Python, Java, Go, C/C++, C#, Rust, Swift, Kotlin, Ruby, PHP

### Hook 타입
- **SessionStart** - 세션 시작 시 설정 초기화
- **PostToolUse** (Write|Edit) - 실시간으로 파일 분석
- **Stop** - 복잡도 로그를 통합 및 업데이트

### 상태 파일
- `.state/${PROJECT_NAME}-complexity-session.json` - 세션 중 문제 추적
- 세션 종료 시 자동으로 정리됨

**참고**: 상태 파일은 프로젝트 디렉토리 이름을 사용하여 프로젝트별로 격리되어 여러 프로젝트 간 충돌을 방지합니다.

### 의존성
- Node.js

### 타임아웃
- PostToolUse: 15초
- Stop: 10초

## 버전

**현재 버전**: 1.1.1

## 변경 이력

### v1.1.1 (2025-10-20)
- 🐛 **버그 수정**: 복잡도 로그 파일이 없을 때 전체 프로젝트 스캔 수행
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 자동 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 스코핑**: 프로젝트명 기반 state 파일로 충돌 방지
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신이면 SessionStart 훅 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 경로 처리 개선
- 🔍 **스마트 필터링**: includeDirs, excludeDirs, includeExtensions, excludeExtensions 설정 추가
- 📁 **선택적 스캔**: 분석할 디렉토리와 파일 타입 커스터마이즈

### v1.0.0
- 최초 릴리스

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
