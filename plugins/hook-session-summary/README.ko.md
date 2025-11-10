# Session File Tracker

> **언어**: [English](README.md) | [한국어](README.ko.md)

> 세션 동안의 모든 파일 작업을 실시간으로 추적하고 요약 리포트를 생성합니다.

## Features

- 📊 모든 Read/Write/Edit 작업을 실시간 추적
- 📁 디렉토리 트리 형태로 시각화
- ✓ 파일별 작업 유형 분류 (Created/Updated, Modified, Read)
- 🔍 2단계 추적 시스템으로 최대 안정성 보장
- 📝 `.session-summary.md` 리포트 자동 생성
- 🚀 무음 추적 (작업 중 방해 없음)

## How it Works

이 플러그인은 **3단계 추적 방식**을 사용하여 최대 안정성을 보장합니다:

### 0단계: 설정 초기화 (SessionStart Hook)
- 세션 시작 시 실행
- `plugin.json`에서 플러그인 버전 읽기
- `.plugin-config/hook-session-summary.json`에 설정 파일이 있는지 확인
- 버전이 다른 경우 자동 마이그레이션 수행
- 설정 파일이 없으면 기본 설정으로 생성

### 1단계: 실시간 추적 (PostToolUse Hook)
- `Write`, `Edit`, `Read`, `NotebookEdit` 작업 후마다 실행
- 파일 경로와 작업 타입 기록
- `.session-operations.json`에 누적 저장

### 2단계: 요약 생성 (Stop Hook)
- Claude Code 세션 종료 시 실행
- `.session-operations.json`에서 누적된 작업 읽기
- 파일별 작업 분류:
  - **Write** → Created/Updated ✓
  - **Edit** → Modified ✓
  - **Read** → Read 📖
- 디렉토리 트리 구조로 변환
- `.session-summary.md`에 저장
- 다음 세션을 위해 추적 파일 정리

## Installation

```bash
/plugin install hook-session-summary@dev-gom-plugins
```

## Usage

이 플러그인은 자동으로 실행됩니다. 세션을 종료할 때마다 `.session-summary.md` 파일이 프로젝트 루트에 생성됩니다.

세션 종료 시:

```
📊 Session Summary: 9 files tracked (2 created/updated, 5 modified, 2 read). Saved to .session-summary.md
```

## Example Output

### .session-summary.md (상세 리포트)

```markdown
# Session Summary

**Total Files**: 9
- Created/Updated: 2
- Modified: 5
- Read: 2

## Files Modified

claude-code-marketplace/
├── plugins/
│   ├── hook-todo-collector/scripts/collect-todos.js [Modified ✓]
│   ├── hook-complexity-monitor/scripts/check-complexity.js [Modified ✓]
│   ├── hook-git-auto-backup/scripts/backup.js [Modified ✓]
│   └── hook-auto-docs/scripts/update-docs.js [Modified ✓]
├── test/
│   ├── hook-test.js [Modified ✓]
│   ├── test.js [Created/Updated ✓]
│   └── test.py [Created/Updated ✓]
├── HOOK_OUTPUT_BEHAVIOR.md [Created/Updated ✓]
└── README.md [Modified ✓]

*Generated: 2025-10-14 12:34:56*
```

## 환경 설정

플러그인은 첫 실행 시 `.plugin-config/hook-session-summary.json`에 설정 파일을 자동으로 생성합니다.

### 자동 설정 마이그레이션

플러그인을 업데이트하면 설정이 자동으로 마이그레이션됩니다:
- ✅ **사용자 설정 보존**
- ✅ **새 설정 필드 자동 추가** (기본값 사용)
- ✅ **버전 추적** (`_pluginVersion` 필드)
- ✅ **수동 작업 불필요**

### 사용 가능한 설정 옵션

#### `showLogs`
- **설명**: 콘솔에 세션 요약 메시지 표시
- **기본값**: `false`
- **예시**: `true` (파일 추적 확인 메시지 표시)

#### `outputDirectory`
- **설명**: 요약 파일을 저장할 디렉토리 경로
- **기본값**: `""` (프로젝트 루트)
- **예시**: `"docs/sessions"`, `".claude-sessions"`

#### `outputFile`
- **설명**: 세션 요약 파일명
- **기본값**: `".session-summary.md"`
- **예시**: `"session-report.md"`

#### `trackedTools`
- **설명**: 추적할 도구 목록
- **기본값**: `["Write", "Edit", "Read", "NotebookEdit"]`
- **예시**: `["Write", "Edit"]` (Write와 Edit만 추적)

#### `operationPriority`
- **설명**: 동일 파일에 여러 작업이 있을 때 우선순위
- **기본값**: `["Write", "Edit", "Read"]`
- **설명**: Write > Edit > Read 순으로 표시

#### `includeTimestamp`
- **설명**: 요약에 타임스탬프 포함
- **기본값**: `true`

#### `treeVisualization`
- **설명**: 디렉토리 트리 형태로 표시
- **기본값**: `true`

#### `statistics`
- **설명**: 통계 정보 표시 옵션
- **기본값**:
  ```json
  {
    "totalFiles": true,
    "byOperationType": true,
    "byFileExtension": false
  }
  ```

### 설정 변경 방법

`.plugin-config/hook-session-summary.json` 파일을 편집하세요:

```json
{
  "showLogs": false,
  "outputDirectory": ".claude-sessions",
  "outputFile": ".session-summary.md",
  "trackedTools": ["Write", "Edit", "Read", "NotebookEdit"],
  "operationPriority": ["Write", "Edit", "Read"],
  "includeTimestamp": true,
  "treeVisualization": true,
  "statistics": {
    "totalFiles": true,
    "byOperationType": true,
    "byFileExtension": false
  }
}
```

### 설정 우선순위

`outputDirectory`는 다음 순서로 결정됩니다:
1. `.plugin-config/hook-session-summary.json`의 `outputDirectory`
2. 환경 변수 `SESSION_SUMMARY_DIR`
3. 환경 변수 `CLAUDE_PLUGIN_OUTPUT_DIR`
4. 기본값 (프로젝트 루트)

## 파일 작업 분류

플러그인은 파일 작업을 다음과 같이 분류합니다:

| 도구 | 작업 유형 | 아이콘 |
|------|----------|-------|
| Write | Created/Updated | ✓ |
| Edit | Modified | ✓ |
| Read | Read | 📖 |
| NotebookEdit | Modified | ✓ |

## Hook Input/Output

### PostToolUse Hook Input

**PostToolUse Hook Input**

파일 작업 후 도구 사용 정보를 받습니다:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "content": "..."
  },
  "hook_event_name": "PostToolUse"
}
```

`track-operation.js` 스크립트:
1. 파일 경로와 작업 타입 추출
2. `.session-operations.json`에 추가
3. 무음으로 리턴 (사용자 메시지 없음)

**Stop Hook**

`session-summary.js` 스크립트:
1. `.session-operations.json` 읽기
2. 디렉토리 트리 요약 생성
3. `.session-summary.md`에 저장
4. 다음 세션을 위해 추적 파일 삭제
5. 사용자에게 완료 메시지 표시

### Supported Tools

- `Write` - 새 파일 생성 또는 전체 덮어쓰기
- `Edit` - 기존 파일의 일부 수정
- `Read` - 파일 읽기 (수정 없음)
- `NotebookEdit` - Jupyter notebook 셀 수정

### 스크립트 위치
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/init-config.js` - 설정 초기화
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/track-operation.js` - 실시간 추적
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-session-summary/scripts/session-summary.js` - 요약 생성

### Hook 타입
- **SessionStart** - 세션 시작 시 설정 초기화
- **PostToolUse** - 파일 작업을 실시간으로 추적
- **Stop** - 세션 종료 시 요약 생성

### 의존성
- Node.js

### Timeout
- PostToolUse: 5초
- Stop: 10초

### 임시 파일
- `.session-operations.json` - 세션 동안 작업 누적 (종료 시 삭제)

## Performance

- **실시간 추적**: 파일 작업당 최소 오버헤드 (< 50ms)
- **메모리 내 누적**: JSON 파일로 영속화
- **빠른 요약 생성**: 대규모 세션도 1초 이내
- **대규모 세션 처리**: 수백 개의 파일 작업도 효율적으로 처리

## Best Practices

### .gitignore에 추가

```gitignore
.session-summary.md
.session-operations.json
```

### 세션 리뷰

세션 요약을 활용하여 작업 내용을 확인하세요:
- 의도한 파일만 수정되었는지 확인
- 실수로 수정된 파일 발견
- 작업 범위 문서화

### Git 커밋 메시지와 함께 사용

세션 요약을 참고하여 더 나은 커밋 메시지 작성:

```bash
# 세션 요약 검토
cat .session-summary.md

# 커밋 메시지 작성에 활용
git commit -m "hook 플러그인 출력 형식 업데이트

- 4개 hook 스크립트를 단일 JSON 출력으로 수정
- HOOK_OUTPUT_BEHAVIOR.md 문서 생성
- README에 개발 가이드라인 추가
"
```

## Limitations

- **Claude Code 도구만 추적**: Bash 명령으로 수정한 파일은 추적되지 않습니다
- **우선순위**: 동일 파일에 여러 작업이 있는 경우 Write > Edit > Read
- **세션 기반 추적**: 추적 파일은 각 세션 종료 시 초기화됩니다

## Troubleshooting

### 요약이 생성되지 않나요?

1. **PostToolUse 훅 확인**:
   파일 작업 후 `track-operation.js`가 실행되는지 확인

2. **추적 파일 확인**:
   세션 중 `.session-operations.json`이 존재하는지 확인

3. **파일 권한 확인**:
   프로젝트 루트에 쓰기 권한이 있는지 확인

### 일부 파일 작업이 누락되었나요?

이 플러그인은 Claude Code 도구로 기록된 작업만 추적합니다:
- ✅ Read, Write, Edit, NotebookEdit 도구
- ❌ Bash 명령으로 수정한 파일
- ❌ 외부 에디터로 수정한 파일

### 디버깅

세션 중 `.session-operations.json`을 확인하여 추적 내용을 확인하세요:

```bash
cat .session-operations.json
```

이 파일은 실시간으로 작업을 누적하며 다음과 같은 항목을 포함해야 합니다:

```json
{
  "/path/to/file.js": ["Write", "Edit"],
  "/path/to/other.py": ["Read"]
}
```

## Related Plugins

- **Git Auto-Backup** - 세션 종료 시 자동 커밋
- **TODO Collector** - TODO 코멘트 수집
- **Complexity Monitor** - 코드 복잡도 모니터링

## Future Improvements

기여 아이디어:
- 세션 시간 추적
- 코드 변경 통계 (추가/삭제된 줄 수)
- 여러 세션에 걸친 추세 분석
- HTML 리포트 생성
- 자동 커밋 메시지 제안

## 버전

**현재 버전**: 1.1.1

## 변경 이력

### v1.1.1 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 사용자 설정 보존하면서 새 필드 추가
- 🏷️ **프로젝트 스코핑**: 출력 파일이 프로젝트 이름을 사용하여 충돌 방지
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart 훅이 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 호환성을 위한 경로 처리 개선

### v1.0.0
- 최초 릴리스

## Contributing

Pull request 환영합니다! [CONTRIBUTING.md](../../CONTRIBUTING.md) 참조

## License

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## Credits

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
