# Claude Dev Helper

> **언어**: [English](README.md) | [한국어](README.ko.md)

> ⚠️ **실험적 기능**: 이 플러그인은 현재 실험 단계입니다. 일부 기능이 불안정하거나 변경될 수 있습니다.

> Claude Code를 위한 Git diff 리뷰 플러그인 (VSCode 확장 지원)

## 주요 기능

- 📂 **자동 파일 열기** (v1.1.8+): Claude가 파일을 생성/수정하면 VSCode에서 자동으로 열림
- 🎯 **Git Diff 리뷰**: CodeLens 버튼으로 Claude의 코드 변경 검토
- 🌐 **브라우저 Diff 에디터**: Monaco 기반 diff 뷰어
- 🔄 **자동 스테이징** (선택): 수정된 파일 자동 스테이징
- ⚙️ **훅 설정**: 워크플로우 커스터마이징

## 설치 방법

### 1단계: 플러그인 설치

```bash
/plugin install claude-dev-helper@dev-gom-plugins
```

### 2단계: VSCode 확장 설치 (선택, 권장)

향상된 diff 보기를 위해 VSCode 확장 설치:

**방법 A: VS Marketplace** (권장)
- [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=devGOM.claude-dev-helper)에서 설치
- 또는 VSCode Extensions에서 "claude-dev-helper" 검색

**방법 B: GitHub Releases**
1. [Releases](https://github.com/Dev-GOM/claude-code-marketplace/releases)에서 `.vsix` 다운로드
2. 설치: `code --install-extension claude-dev-helper-{version}.vsix`

**방법 C: 소스에서 빌드**
```bash
# vscode-extension 브랜치 클론
git clone -b vscode-extension https://github.com/Dev-GOM/claude-code-marketplace.git
cd claude-code-marketplace/plugins/claude-dev-helper/vscode-extension
npm install
npm run package
code --install-extension claude-dev-helper-0.8.0.vsix
```

### 3단계: VSCode 재시작

```
Ctrl+Shift+P → "Developer: Reload Window"
```

## 사용 방법

### VSCode 확장 사용 (권장)

1. **Claude가 파일 수정**
2. **CodeLens 표시**: "Show Diff" 버튼
3. **클릭하여 보기**: VSCode inline diff 열림
   - 🔴 빨간 줄 = 삭제됨
   - 🟢 초록 줄 = 추가됨

### 브라우저 Diff 에디터 (대안)

```
Ctrl+Shift+P → "Show Git Diff (Browser)"
```

- 브라우저에서 Monaco diff editor 열림
- 모든 변경 파일 검토
- 개별 줄 승인/거부

## 설정

### 자동 파일 열기 설정

플러그인이 프로젝트 루트에 `.plugin-config/claude-dev-helper.json` 파일을 기본 설정으로 자동 생성합니다:

```json
{
  "autoOpen": {
    "enabled": true,
    "focus": false,
    "maxQueueSize": 10
  },
  "_pluginVersion": "1.1.0"
}
```

**설정 항목:**
- `enabled`: 자동 열기 기능 활성화/비활성화 (기본값: true)
- `focus`: 열린 파일로 포커스 이동 여부 (기본값: false - 백그라운드에서 열림)
- `maxQueueSize`: 추적할 최대 파일 수 (기본값: 10)

`.plugin-config/claude-dev-helper.json` 파일을 편집하여 동작을 커스터마이징할 수 있습니다.

### 자동 스테이징 훅 활성화

`plugins/claude-dev-helper/hooks/hooks.json` 편집:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "enabled": true,  // true로 변경
        "matcher": "Write|Edit"
      }
    ]
  }
}
```

### VSCode 설정 (자동 적용)

```json
{
  "diffEditor.renderSideBySide": false  // 인라인 diff 뷰
}
```

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `Show Git Diff` | VSCode 인라인 diff 열기 (기본) |
| `Show Git Diff (Browser)` | 브라우저 diff 에디터 열기 |
| `Enable Inline Diff Mode` | VSCode 인라인 뷰 모드 강제 |

## 요구사항

- Git 초기화된 프로젝트
- VSCode (확장 기능용)
- Node.js (브라우저 diff 서버용)

## 구조

```
브라우저 Diff 모드:
  Claude 파일 수정 → 훅 실행 → 브라우저 열림 → 변경사항 검토

VSCode Diff 모드:
  Claude 파일 수정 → CodeLens 표시 → 클릭 → VSCode diff 열림
```

## 문제 해결

**Q: CodeLens가 보이지 않나요?**
- VSCode 확장이 설치되고 활성화되었는지 확인
- 창 새로고침: `Ctrl+Shift+P` → Reload Window

**Q: 브라우저 diff 서버가 시작되지 않나요?**
- 포트 3456이 사용 가능한지 확인
- 의존성 설치: `cd diff-editor && npm install`

**Q: Diff가 좌우 분할로 표시되나요?**
- 명령 실행: "Enable Inline Diff Mode"
- 또는 VSCode 설정에서 `diffEditor.renderSideBySide: false` 설정

## 개발

개발 및 배포 워크플로우는 [`.claude/PLUGIN_WORKFLOW.md`](../../.claude/PLUGIN_WORKFLOW.md) 참조

## 라이선스

MIT © Dev GOM

## 링크

- **GitHub**: https://github.com/Dev-GOM/claude-code-marketplace
- **Issues**: https://github.com/Dev-GOM/claude-code-marketplace/issues
- **VSCode Extension 브랜치**: https://github.com/Dev-GOM/claude-code-marketplace/tree/vscode-extension
