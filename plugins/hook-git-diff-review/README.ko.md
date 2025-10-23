# Git Diff Review

> **언어**: [English](README.md) | [한국어](README.ko.md)

> Git 기반 diff 워크플로우로 VS Code Source Control에서 파일 변경사항을 자동으로 스테이징하여 검토합니다. Cursor처럼 줄 단위 또는 전체 변경사항을 수락/거부할 수 있습니다!

## 주요 기능

- 🔄 **자동 스테이징**: 수정된 파일을 VS Code Source Control에 자동으로 스테이징
- 👀 **시각적 Diff**: VS Code 내장 diff 뷰어로 모든 변경사항 검토
- ✅ **줄 단위 제어**: 개별 줄을 수락하거나 거부
- 🎯 **일괄 작업**: 한 번의 클릭으로 모든 변경사항 수락/거부
- 🎨 **제로 설정**: 합리적인 기본값으로 즉시 사용 가능
- ⚙️ **고도로 설정 가능**: 패턴, 디렉토리, 동작 커스터마이징

## 작동 원리

이 플러그인은 Git과 VS Code의 기본 Source Control 패널을 사용하여 **Cursor와 같은 검토 워크플로우**를 만듭니다:

### 워크플로우

```
1. Claude Code가 파일 수정
   ↓
2. PostToolUse 훅이 파일 자동 스테이징 (git add)
   ↓
3. VS Code Source Control 패널에 변경사항 표시
   ↓
4. 변경사항 검토 후 선택:
   ✓ 수락 (개별 줄 또는 전체)
   ✗ 거부 (개별 줄 또는 전체)
```

### 화면 구성

```
VS Code Source Control 패널:

📁 Changes (3개 파일)
  ├── Button.tsx              [Diff 보기] [Stage] [Discard]
  ├── Button.test.tsx         [Diff 보기] [Stage] [Discard]
  └── index.ts                [Diff 보기] [Stage] [Discard]

상단 버튼:
  ✓ Commit        (모든 staged 변경사항 커밋)
  ↶ Discard All   (모든 변경사항 버리기)
  + Stage All     (모든 변경사항 stage)
```

### Diff 뷰

파일을 클릭하면 diff를 볼 수 있습니다:

```typescript
function hello() {
  console.log("Hello");
- console.log("old line");     // ← 빨간색 (삭제됨)
+ console.log("World");        // ← 녹색 (추가됨)
+ return "done";               // ← 녹색 (추가됨)
}

// 컨트롤:
[Stage Change] [Discard Change]   // ← 줄 단위 버튼
[Stage All]    [Discard All]      // ← 파일 단위 버튼
```

## 설치

```bash
/plugin install hook-git-diff-review@dev-gom-plugins
```

## 사전 요구사항

- 프로젝트에 Git 초기화 완료 (`git init`)
- VS Code 또는 Git 통합이 있는 에디터

## 사용법

설치 후 자동으로 작동합니다:

1. **Claude가 파일 수정** → 파일 자동 스테이징
2. **VS Code Source Control 패널 열기** (Ctrl+Shift+G)
3. **파일 클릭**하여 diff 확인
4. **변경사항 수락 또는 거부**:
   - ✓ 줄 단위: "Stage Change" 또는 "Discard Change" 클릭
   - ✓ 파일 단위: "Stage" 또는 "Discard" 버튼 클릭
   - ✓ 전체: "Commit" 또는 "Discard All" 클릭

### 예시 워크플로우

```
사용자: "Button.tsx라는 React 컴포넌트를 만들어줘"

Claude: [Button.tsx 생성]
  ↓
플러그인: [Button.tsx 자동 스테이징]
  ↓
VS Code: "📋 파일이 검토를 위해 스테이징됨: Button.tsx" 알림 표시
  ↓
사용자: Source Control 열기 → Diff 검토 → 수락/거부
```

## 설정

프로젝트 루트의 `.plugin-config/hook-git-diff-review.json` 편집:

```json
{
  "enabled": true,
  "autoStage": true,
  "showNotification": true,
  "onlyTrackedFiles": false,
  "excludePatterns": [
    "*.log",
    "*.tmp",
    ".DS_Store",
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**"
  ],
  "includeDirs": [],
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out"
  ]
}
```

### 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | boolean | `true` | 플러그인 활성화/비활성화 |
| `autoStage` | boolean | `true` | 수정된 파일 자동 스테이징 |
| `showNotification` | boolean | `true` | 파일 스테이징 시 알림 표시 |
| `onlyTrackedFiles` | boolean | `false` | Git이 추적 중인 파일만 스테이징 |
| `excludePatterns` | string[] | (위 참조) | 제외할 파일 패턴 |
| `includeDirs` | string[] | `[]` | 이 디렉토리의 파일만 스테이징 (비어있음 = 전체) |
| `excludeDirs` | string[] | (위 참조) | 제외할 디렉토리 |

### 커스터마이징 예제

**알림 비활성화:**
```json
{
  "showNotification": false
}
```

**추적 중인 파일만 스테이징:**
```json
{
  "onlyTrackedFiles": true
}
```

**커스텀 제외 패턴:**
```json
{
  "excludePatterns": [
    "*.log",
    "*.tmp",
    "test/**",
    "docs/**"
  ]
}
```

**특정 디렉토리만 스테이징:**
```json
{
  "includeDirs": ["src", "lib"]
}
```

## VS Code 팁

### 키보드 단축키

- `Ctrl+Shift+G` - Source Control 패널 열기
- `Enter` - 선택한 파일의 diff 보기
- `Ctrl+Enter` - 선택한 파일 stage
- `Alt+Enter` - 선택한 파일 discard

### 분할 Diff 뷰

1. Source Control에서 변경된 파일 클릭
2. diff 에디터를 옆으로 드래그
3. 나란히 비교 보기

### 줄 단위 스테이징

1. Diff 뷰 열기
2. 변경된 줄에 마우스 hover
3. `+` 아이콘 클릭하여 개별 줄 stage
4. `-` 아이콘 클릭하여 unstage

## Cursor와 비교

| 기능 | Cursor | 이 플러그인 |
|------|--------|------------|
| **변경 시 자동 diff** | ✅ | ✅ |
| **줄 단위 수락/거부** | ✅ | ✅ |
| **전체 수락/거부** | ✅ | ✅ |
| **인라인 버튼** | ✅ 에디터 내부 | ✅ Source Control 패널 |
| **제로 설정** | ✅ | ✅ |
| **모든 에디터 지원** | ❌ | ✅ (Git 기반) |

**위치 차이**:
- **Cursor**: 버튼이 에디터 내부에 인라인으로 표시
- **이 플러그인**: 버튼이 VS Code Source Control 패널에 표시

**왜 Source Control 패널인가?**
- ✅ VS Code 기본 기능 (커스텀 UI 불필요)
- ✅ Git을 지원하는 모든 에디터에서 작동
- ✅ 개발자에게 익숙한 인터페이스
- ✅ 완전한 Git 통합

## 문제 해결

### 파일이 스테이징되지 않음

**문제**: 파일이 수정되었지만 Source Control에 나타나지 않음

**해결책**:
1. Git이 초기화되었는지 확인: `git status`
2. 설정에서 플러그인이 활성화되어 있는지 확인
3. 파일이 `excludePatterns`와 일치하는지 확인
4. 파일이 `excludeDirs`에 있지 않은지 확인

### 알림이 너무 많음

**문제**: 모든 파일 변경마다 알림이 표시됨

**해결책**: 설정에서 알림 비활성화:
```json
{
  "showNotification": false
}
```

### 특정 파일만 검토하고 싶음

**문제**: 모든 파일이 스테이징되지만 일부만 검토하고 싶음

**해결책**: `includeDirs` 또는 `excludePatterns` 사용:
```json
{
  "includeDirs": ["src", "lib"],
  "excludePatterns": ["*.test.ts", "*.spec.ts"]
}
```

## 고급 사용법

### Git 워크플로우 통합

이 플러그인은 기존 Git 워크플로우와 완벽하게 통합됩니다:

```bash
# 1. Claude가 파일 수정 → 자동 스테이징
# 2. VS Code에서 검토 → 변경사항 수락/거부
# 3. 수락한 변경사항 커밋
git commit -m "feat: Add new feature"

# 4. 원격 저장소에 푸시
git push
```

### Pre-commit 훅

추가 검증을 위해 Git 훅과 결합:

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm test
npm run lint
```

### 브랜치 전략

1. feature 브랜치에서 작업
2. Claude가 변경 → 자동 스테이징
3. Diff 검토 → 수락/거부
4. 커밋 → 푸시 → PR 생성

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
- 🔄 Write/Edit 작업 시 자동 스테이징
- 👀 VS Code Source Control 통합
- ✅ 줄 단위 및 일괄 수락/거부
- ⚙️ 패턴 및 디렉토리 설정 가능
