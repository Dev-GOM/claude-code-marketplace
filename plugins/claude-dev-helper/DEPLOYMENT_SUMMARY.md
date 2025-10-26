# Claude Dev Helper - 배포 요약

## 📦 배포 구조

Claude Dev Helper는 **2개의 독립 컴포넌트**로 배포됩니다:

### 1️⃣ VSCode Extension
- **파일**: `claude-dev-helper-0.8.0.vsix`
- **위치**: `plugins/claude-dev-helper/vscode-extension/`
- **배포처**:
  - ✅ **Visual Studio Marketplace** (권장)
  - ✅ **GitHub Releases** (수동 설치용)

### 2️⃣ Claude Code Plugin
- **파일**: 플러그인 루트 전체 (`plugins/claude-dev-helper/`)
- **위치**: GitHub Repository
- **배포처**:
  - ✅ **claude-code-marketplace** (현재 저장소)

---

## 🚀 빠른 배포 가이드

### A. VSCode Extension 배포

#### 옵션 1: VS Marketplace (추천)

```bash
cd plugins/claude-dev-helper/vscode-extension

# 1. vsce 설치 (최초 1회)
npm install -g @vscode/vsce

# 2. 로그인 (Personal Access Token 필요)
vsce login devGOM

# 3. 배포
vsce publish
```

**사전 준비:**
- [ ] Azure DevOps 계정
- [ ] Personal Access Token 발급 (Marketplace > Manage)
- [ ] 퍼블리셔 등록 (devGOM)

#### 옵션 2: GitHub Releases

```bash
cd plugins/claude-dev-helper/vscode-extension

# 1. 패키징
npm run package

# 2. GitHub Release 생성
git tag -a vscode-v0.8.0 -m "VSCode Extension v0.8.0"
git push origin vscode-v0.8.0

gh release create vscode-v0.8.0 \
  --title "Claude Dev Helper VSCode Extension v0.8.0" \
  --notes "VSCode extension for git diff viewing" \
  ./claude-dev-helper-0.8.0.vsix
```

### B. Claude Code Plugin 배포

```bash
# 1. 버전 업데이트
# - plugin.json: version "1.0.0"
# - marketplace.json: version "1.0.0"

# 2. Git 커밋 & 태그
git add -A
git commit -m "feat: claude-dev-helper v1.0.0"
git tag -a plugin-v1.0.0 -m "Claude Code Plugin v1.0.0"

# 3. Push
git push origin develop
git push origin plugin-v1.0.0

# 4. GitHub Release
gh release create plugin-v1.0.0 \
  --title "Claude Dev Helper Plugin v1.0.0" \
  --notes "Git diff integration with VSCode extension"
```

---

## 🔄 Browser Diff Editor 보존

### ✅ 현재 상태
- Browser diff editor 코드 **완전히 보존됨**
- 별도 명령어로 접근 가능
- 자동 실행은 비활성화됨

### 📍 접근 방법

**명령어 팔레트에서:**
```
Ctrl+Shift+P → "Show Git Diff (Browser)"
```

**코드상 위치:**
- 서버: `diff-editor/server.js`
- UI: `diff-editor/public/`
- 명령: `claudeDevHelper.showBrowserDiff`

### 🎯 두 가지 diff 모드 비교

| 특징 | VSCode Diff | Browser Diff |
|------|-------------|--------------|
| **속도** | ⚡ 즉시 | ⏱️ 서버 시작 필요 |
| **UI** | VSCode 네이티브 | Monaco Editor |
| **테마** | VSCode 테마 | 별도 테마 |
| **멀티파일** | 개별 파일 | 모든 파일 한번에 |
| **Accept/Reject** | 수동 (git) | 버튼 클릭 |
| **기본 모드** | ✅ | ❌ |

---

## 📝 배포 전 체크리스트

### VSCode Extension

- [ ] 버전 번호 업데이트 (package.json)
- [ ] TypeScript 컴파일 (`npm run compile`)
- [ ] 패키징 테스트 (`npm run package`)
- [ ] .vsix 로컬 설치 테스트
- [ ] Windows 경로 처리 확인
- [ ] README 스크린샷 업데이트

### Claude Code Plugin

- [ ] plugin.json 버전 업데이트
- [ ] marketplace.json 버전 업데이트
- [ ] README.md 업데이트 (VSCode extension 설치 안내)
- [ ] DEPLOYMENT.md 확인
- [ ] hooks.json 설정 확인
- [ ] diff-editor 서버 테스트

---

## 📄 버전 관리

### Git Tag 규칙

```bash
vscode-v0.8.0     # VSCode extension 릴리즈
plugin-v1.0.0     # Claude Code plugin 릴리즈
v1.0.0            # 전체 마켓플레이스 릴리즈 (선택)
```

### Semantic Versioning

**VSCode Extension:**
- `0.8.x`: 초기 inline diff 기능
- `0.9.x`: 기능 추가
- `1.0.0`: 안정화 버전

**Claude Code Plugin:**
- `1.0.x`: VSCode extension 연동 버전
- 버전은 extension과 독립적

---

## 🎉 배포 후

### 사용자 안내

**플러그인 사용자에게:**
1. Claude Code에서 플러그인 설치
2. VSCode Extension도 함께 설치 필요
3. 두 가지 diff 모드 중 선택 가능

**문서 업데이트:**
- [ ] README에 설치 링크 추가
- [ ] Marketplace 링크 업데이트
- [ ] 사용자 가이드 작성

---

## 🔗 유용한 링크

- **배포 상세 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **VSCode Publishing**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **GitHub**: https://github.com/Dev-GOM/claude-code-marketplace
- **Issues**: https://github.com/Dev-GOM/claude-code-marketplace/issues

---

## ❓ FAQ

**Q: Extension 없이 플러그인만 사용 가능한가요?**
A: 네, Browser Diff 모드로 사용 가능합니다.

**Q: 기존 Browser Diff 기능은 없어지나요?**
A: 아니요, 완전히 보존되며 선택해서 사용할 수 있습니다.

**Q: 어느 모드를 권장하나요?**
A: VSCode Diff를 권장합니다 (빠르고 테마 지원).

**Q: 배포는 어떤 순서로 하나요?**
A: VSCode Extension → Claude Code Plugin 순서로 배포하세요.
