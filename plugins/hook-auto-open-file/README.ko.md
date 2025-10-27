# VS Code 파일 자동 열기

> **언어**: [English](README.md) | [한국어](README.ko.md)

> Claude Code가 파일을 생성하거나 수정할 때 VS Code에서 자동으로 열어줍니다.

## 주요 기능

- 🚀 **즉시 파일 접근**: 파일 생성/수정 즉시 VS Code에서 자동으로 열기
- 🎯 **스마트 필터링**: 코드 파일만 선택적으로 열기 (확장자 설정 가능)
- 🚫 **자동 제외**: node_modules, .git, dist 등 빌드 디렉토리 자동 스킵
- ⚙️ **고도로 커스터마이징 가능**: 파일 확장자, 제외 디렉토리, 창 동작 설정
- 🔄 **매끄러운 통합**: 백그라운드에서 조용히 작동하여 작업 흐름 방해 없음
- 💻 **크로스 플랫폼**: Windows, macOS, Linux 모두 지원

## 작동 원리

이 플러그인은 **2단계 훅 방식**을 사용합니다:

### 1단계: 설정 초기화 (SessionStart Hook)
- 세션 시작 시 실행
- `.plugin-config/hook-auto-open-file.json` 설정 파일 생성 (없는 경우)
- 파일 확장자 및 제외 디렉토리에 대한 사용자 설정 로드

### 2단계: 파일 자동 열기 (PostToolUse Hook)
- 모든 `Write` 또는 `Edit` 작업 후 실행
- 도구 입력에서 파일 경로 추출
- 파일이 설정된 기준(확장자, 디렉토리)과 일치하는지 확인
- `code` CLI 명령어로 VS Code에서 파일 열기
- 조용한 실행 (사용자 방해 없음)

## 설치

```bash
/plugin install hook-auto-open-file@dev-gom-plugins
```

## 사전 요구사항

**VS Code CLI가 설치되어 PATH에 등록되어 있어야 합니다**

확인 방법:

```bash
code --version
```

설치되지 않은 경우 다음 단계를 따르세요:

### Windows
VS Code 설치 시 자동으로 `code`가 PATH에 추가됩니다. 작동하지 않는 경우:
1. VS Code 열기
2. `Ctrl+Shift+P` 누르기
3. "Shell Command: Install 'code' command in PATH" 입력

### macOS
1. VS Code 열기
2. `Cmd+Shift+P` 누르기
3. "Shell Command: Install 'code' command in PATH" 입력

### Linux
보통 자동으로 설치됩니다. 안 되는 경우:

```bash
sudo ln -s /usr/share/code/bin/code /usr/local/bin/code
```

## 사용법

설치 후 자동으로 작동합니다:

1. Claude Code가 파일을 생성하거나 수정
2. 파일이 즉시 VS Code에서 열림
3. 바로 편집 시작 가능

### 예시 워크플로우

```
사용자: "Button.tsx라는 React 컴포넌트를 만들어줘"
Claude: [Button.tsx 생성]
→ 파일이 자동으로 VS Code에서 열림 ✨
```

## 설정

프로젝트 루트의 `.plugin-config/hook-auto-open-file.json` 파일을 편집하세요:

```json
{
  "enabled": true,
  "openInNewWindow": false,
  "focusEditor": true,
  "jumpToLine": true,
  "codeExtensions": [
    ".js", ".ts", ".jsx", ".tsx",
    ".py", ".java", ".cpp", ".c", ".cs",
    ".go", ".rs", ".rb", ".php", ".swift",
    ".kt", ".scala", ".r", ".m", ".h", ".hpp",
    ".sql", ".sh", ".bash", ".ps1",
    ".html", ".css", ".scss", ".sass", ".less",
    ".json", ".yaml", ".yml", ".toml", ".xml",
    ".md", ".txt", ".env"
  ],
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out",
    ".nuxt"
  ]
}
```

### 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | boolean | `true` | 플러그인 활성화/비활성화 |
| `openInNewWindow` | boolean | `false` | 새 VS Code 창에서 파일 열기 |
| `focusEditor` | boolean | `true` | 파일 열기 후 에디터 포커스 |
| `jumpToLine` | boolean | `true` | 특정 줄로 이동 (지원 시) |
| `codeExtensions` | string[] | (위 참조) | 자동으로 열 파일 확장자 |
| `excludeDirs` | string[] | (위 참조) | 제외할 디렉토리 |

### 커스터마이징 예제

**TypeScript 파일만 열기:**

```json
{
  "codeExtensions": [".ts", ".tsx"]
}
```

**특정 프로젝트 디렉토리 제외:**

```json
{
  "excludeDirs": [
    "node_modules",
    ".git",
    "vendor",
    "tmp"
  ]
}
```

**플러그인 일시 비활성화:**

```json
{
  "enabled": false
}
```

## 문제 해결

### 파일이 열리지 않음

**문제**: 파일은 생성되지만 VS Code에서 열리지 않음

**해결책**:
1. VS Code CLI 설치 확인: `code --version`
2. 설정에서 플러그인이 활성화되어 있는지 확인
3. 파일 확장자가 `codeExtensions` 목록에 있는지 확인
4. 파일이 제외 디렉토리에 있지 않은지 확인

### VS Code가 새 창으로 열림

**문제**: 파일마다 새 VS Code 창이 열림

**해결책**: 설정에서 `openInNewWindow: false`로 설정

### 성능 영향

**문제**: 성능에 영향이 걱정됨

**답변**: 플러그인은 최소한의 영향을 위해 최적화되어 있습니다:
- 백그라운드 실행 (3초 타임아웃)
- 조용한 실행 (출력 없음)
- VS Code CLI를 사용할 수 없는 경우 우아하게 실패
- `Write` 및 `Edit` 작업만 처리

## 고급 사용법

### 특정 줄에서 파일 열기

현재 기본 설정에서는 지원되지 않지만, 플러그인을 수정하여 줄 번호 지원을 추가할 수 있습니다:

```javascript
// auto-open-file.js에서
command += ` -g "${filePath}:${lineNumber}"`;
```

### 다른 에디터 지원

`auto-open-file.js`를 수정하여 다른 에디터를 지원할 수 있습니다:

```javascript
// IntelliJ IDEA
exec(`idea "${filePath}"`);

// Sublime Text
exec(`subl "${filePath}"`);

// Vim
exec(`vim "${filePath}"`);
```

## 라이선스

MIT

## 제작자

**Dev GOM**
- GitHub: [@Dev-GOM](https://github.com/Dev-GOM)
- 마켓플레이스: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)

## 버전

1.0.0 - 최초 릴리스

## 변경 이력

### 1.0.0 (2025-10-23)
- ✨ 최초 릴리스
- 🚀 Write/Edit 시 VS Code에서 파일 자동 열기
- ⚙️ 파일 확장자 및 제외 디렉토리 설정 가능
- 💻 크로스 플랫폼 지원 (Windows, macOS, Linux)
