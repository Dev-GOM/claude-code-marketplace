# Claude Dev Helper - 배포 가이드

## 배포 구성

Claude Dev Helper는 **2개의 독립적인 컴포넌트**로 구성됩니다:

### 1. VSCode Extension (vscode-extension/)
- **배포 위치**: Visual Studio Code Marketplace
- **파일**: `claude-dev-helper-{version}.vsix`
- **사용자 설치**: VSCode에서 직접 설치 또는 `.vsix` 파일 다운로드

### 2. Claude Code Plugin (플러그인 루트)
- **배포 위치**: GitHub (claude-code-marketplace)
- **파일**: `plugin.json`, `hooks.json`, `scripts/`, `diff-editor/`
- **사용자 설치**: Claude Code에서 플러그인 마켓플레이스를 통해 설치

---

## 배포 절차

### A. VSCode Extension 배포

#### 옵션 1: Visual Studio Marketplace (권장)

**사전 준비:**
1. Azure DevOps 계정 생성
2. Personal Access Token (PAT) 발급
   - Scope: `Marketplace > Manage`
3. 퍼블리셔 등록
   - ID: `devGOM` (이미 package.json에 설정됨)

**배포 명령:**
```bash
cd plugins/claude-dev-helper/vscode-extension

# vsce 설치 (최초 1회)
npm install -g @vscode/vsce

# 퍼블리셔 로그인
vsce login devGOM

# 배포
vsce publish
```

**자동 버전 증가:**
```bash
# 패치 버전 증가 (0.8.0 → 0.8.1)
vsce publish patch

# 마이너 버전 증가 (0.8.0 → 0.9.0)
vsce publish minor

# 메이저 버전 증가 (0.8.0 → 1.0.0)
vsce publish major
```

#### 옵션 2: GitHub Releases (.vsix 파일 배포)

**패키징:**
```bash
cd plugins/claude-dev-helper/vscode-extension
npm run package
```

**GitHub Release 생성:**
```bash
# 태그 생성
git tag -a vscode-v0.8.0 -m "VSCode Extension v0.8.0"
git push origin vscode-v0.8.0

# GitHub Release 생성
gh release create vscode-v0.8.0 \
  --title "Claude Dev Helper VSCode Extension v0.8.0" \
  --notes "VSCode extension for reviewing git changes" \
  ./claude-dev-helper-0.8.0.vsix
```

**사용자 설치 방법:**
1. GitHub Release에서 `.vsix` 파일 다운로드
2. VSCode에서 설치:
   ```bash
   code --install-extension claude-dev-helper-0.8.0.vsix
   ```
   또는 VSCode UI: `Extensions > ... > Install from VSIX...`

---

### B. Claude Code Plugin 배포

**버전 업데이트:**
```bash
# plugin.json 버전 업데이트
cd plugins/claude-dev-helper
# version: "1.0.0" → "1.1.0"

# marketplace.json 버전 업데이트
cd .claude-plugin
# version: "1.0.0" → "1.1.0"
```

**GitHub 커밋 및 태그:**
```bash
git add -A
git commit -m "feat: claude-dev-helper v1.1.0 - Add VSCode diff integration"

git tag -a plugin-v1.1.0 -m "Claude Code Plugin v1.1.0"
git push origin develop
git push origin plugin-v1.1.0
```

**GitHub Release 생성:**
```bash
gh release create plugin-v1.1.0 \
  --title "Claude Dev Helper Plugin v1.1.0" \
  --notes-file RELEASE_NOTES.md
```

**사용자 설치 방법:**
1. Claude Code에서 플러그인 마켓플레이스 열기
2. "claude-dev-helper" 검색 및 설치
3. VSCode Extension도 함께 설치 안내

---

## 기능 보존 전략

### Browser Diff Editor 보존

**현재 상태:**
- ✅ Browser diff editor 코드 유지 (`diff-editor/`)
- ✅ 별도 명령어로 분리: `showBrowserDiff`
- ✅ VSCode 명령어: "Show Git Diff (Browser)"

**두 가지 Diff 방식 제공:**

| 방식 | 명령어 | 설명 |
|------|--------|------|
| **VSCode Diff** | `claudeDevHelper.showDiff` | VSCode 기본 inline diff (기본) |
| **Browser Diff** | `claudeDevHelper.showBrowserDiff` | 브라우저 기반 Monaco Editor diff |

**사용자 선택 방법:**
1. CodeLens: "Show Diff" (기본 = VSCode)
2. Command Palette:
   - "Show Git Diff" → VSCode diff
   - "Show Git Diff (Browser)" → Browser diff

**Browser Diff 활성화:**
```json
// .vscode/settings.json
{
  "claudeDevHelper.defaultDiffMode": "browser" // 향후 추가 가능
}
```

---

## 버전 관리 전략

### Semantic Versioning

**VSCode Extension:**
- 0.8.x: 초기 VSCode diff 통합
- 0.9.x: 기능 추가
- 1.0.0: 안정화 버전

**Claude Code Plugin:**
- 1.x.x: VSCode extension 필수
- 버전 번호는 extension과 독립적

### Git Tag 규칙

```bash
vscode-v0.8.0    # VSCode extension 릴리즈
plugin-v1.1.0    # Claude Code plugin 릴리즈
v1.0.0           # 전체 마켓플레이스 릴리즈
```

---

## 릴리즈 노트 작성 가이드

**VSCode Extension:**
```markdown
# v0.8.0

## Features
- VSCode native inline diff integration
- Auto-detect inline diff mode setting
- Git content provider for HEAD comparison

## Bug Fixes
- Fix Windows path separator for git commands
- Remove custom decorations interfering with VSCode diff

## Breaking Changes
- Removed status bar toggle (use VSCode settings instead)
```

**Claude Code Plugin:**
```markdown
# v1.1.0

## Features
- VSCode Extension integration for better diff viewing
- Two diff modes: VSCode (default) and Browser
- Auto-stage changes hook (optional)

## Requirements
- VSCode Extension: claude-dev-helper@0.8.0+

## Installation
1. Install plugin from Claude Code marketplace
2. Install VSCode extension from VS Marketplace or GitHub Release
```

---

## 사용자 업그레이드 가이드

### 기존 사용자 (Browser Diff 사용 중)

**변경 사항:**
- 기본 diff 방식이 VSCode로 변경
- Browser diff는 여전히 사용 가능

**마이그레이션:**
1. VSCode Extension 설치
2. 설정 확인: `diffEditor.renderSideBySide = false`
3. Browser diff 사용 시: Command Palette에서 "Show Git Diff (Browser)" 선택

### 신규 사용자

**설치 순서:**
1. Claude Code에서 플러그인 설치
2. VSCode Extension 설치 (자동 안내 또는 수동)
3. VSCode Reload
4. 파일 수정 후 CodeLens "Show Diff" 클릭

---

## 체크리스트

### VSCode Extension 배포 전

- [ ] 버전 번호 업데이트 (package.json)
- [ ] CHANGELOG 업데이트
- [ ] README 스크린샷 업데이트
- [ ] 테스트: Windows, macOS, Linux
- [ ] `npm run compile` 성공 확인
- [ ] `npm run package` 성공 확인
- [ ] .vsix 파일 로컬 테스트

### Claude Code Plugin 배포 전

- [ ] 버전 번호 업데이트 (plugin.json, marketplace.json)
- [ ] CHANGELOG 업데이트
- [ ] README 업데이트 (VSCode extension 설치 안내)
- [ ] hooks.json 설정 확인
- [ ] 스크립트 권한 확인 (chmod +x)
- [ ] Git tag 생성

### 배포 후

- [ ] GitHub Release 생성 (VSCode + Plugin)
- [ ] Marketplace에서 설치 테스트
- [ ] README에 설치 링크 업데이트
- [ ] 사용자 문서 업데이트

---

## FAQ

**Q: VSCode Extension 없이 플러그인만 사용할 수 있나요?**
A: 네, Browser Diff 모드로 사용 가능합니다. 하지만 VSCode Extension을 함께 사용하면 더 나은 경험을 제공합니다.

**Q: 두 가지 diff 방식 중 어느 것을 권장하나요?**
A: 대부분의 경우 VSCode Diff를 권장합니다 (빠르고 VSCode 네이티브). Browser Diff는 별도 브라우저에서 보고 싶을 때 유용합니다.

**Q: Browser Diff 서버가 자동으로 시작되나요?**
A: 아니요. Browser Diff를 사용할 때만 서버가 시작됩니다 (사용자 확인 후).

**Q: 버전 관리는 어떻게 하나요?**
A: VSCode Extension과 Plugin은 독립적으로 버전 관리되며, 각각의 Git tag를 사용합니다.
