# Code Complexity Monitor

> **언어**: [English](README.md) | [한국어](README.ko.md)

코드 복잡도 지표를 모니터링하고 임계값을 초과하면 경고합니다.

## 주요 기능

- 📊 **순환 복잡도** 계산 (결정 지점)
- 📏 **함수 길이** 확인 (함수당 줄 수)
- 📄 **파일 길이** 모니터링 (파일당 줄 수)
- 🏗️ **중첩 깊이** 추적 (깊게 중첩된 코드)
- ⚡ Edit/Write 작업 후 실시간 피드백
- 📝 모든 문제를 `.complexity-log.txt`에 로깅
- 🎯 변경된 파일만 분석 (성능 최적화)

## 동작 원리

이 플러그인은 **PostToolUse hook** (Edit|Write)을 사용하여 코드 수정 후 실행됩니다.

1. `git status --porcelain`을 사용하여 변경된 파일 감지
2. 코드 파일만 필터링 (JS, TS, Python, Java, Go, C++)
3. 각 파일에 대해:
   - 순환 복잡도 계산
   - 함수 길이 측정
   - 파일 길이 확인
   - 중첩 깊이 분석
4. 임계값과 비교
5. 문제 보고 및 로그 파일에 저장

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

복잡도 문제가 감지되면:

```
⚠️ Complexity Monitor found 3 issue(s) in 2 file(s) (2 warnings, 1 info). Check .complexity-log.txt
```

### .complexity-log.txt

```
[2025-10-14 12:34:56]
src/utils.js:
  - Function 'processData' has complexity 15 (threshold: 10)
  - Max nesting depth is 6 (threshold: 4)

src/handlers.js:
  - Function 'handleRequest' has 75 lines (threshold: 50)
```

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

플러그인의 동작은 `hooks/hooks.json` 파일의 `configuration` 섹션에서 설정할 수 있습니다.

### 사용 가능한 설정 옵션

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

1. **hook이 트리거되는지 확인**: Edit/Write 후에만 실행됩니다
2. **코드 파일 확인**: 지원되는 확장자여야 합니다
3. **변경사항 확인**: git을 사용하여 변경된 파일을 감지합니다

### 오탐이 발생하나요?

1. **임계값을 조정**하여 프로젝트에 맞추세요
2. **생성된 파일 제외**: `getChangedFiles()` 수정
3. **실제 코드 검토** - 때로는 복잡도를 피할 수 없습니다

## 관련 플러그인

- **TODO Collector** - TODO 코멘트 추적
- **Git Auto-Backup** - 변경사항 자동 커밋
- **Session File Tracker** - 파일 작업 요약

## 기술 세부사항

### 스크립트 위치
`plugins/hook-complexity-monitor/scripts/check-complexity.js`

### Hook 타입
`PostToolUse` - Edit/Write 작업 후 실행

### 의존성
- Node.js
- Git (변경 감지용)

### 타임아웃
15초

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
