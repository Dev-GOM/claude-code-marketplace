# Git Auto-Backup

> **언어**: [English](README.md) | [한국어](README.ko.md)

Claude Code 세션이 끝날 때마다 자동으로 git 커밋을 생성하여 작업 손실을 방지합니다.

## 주요 기능

- 🔄 세션 종료 시 모든 변경사항 자동 커밋
- ⏰ 타임스탬프가 포함된 커밋 메시지
- 🎯 실제 변경사항이 있을 때만 커밋
- 🛡️ 안전하고 비침습적
- 📝 Claude Code 작업임을 명확히 표시

## 동작 원리

이 플러그인은 **두 개의 hook**을 사용하여 자동 백업을 수행합니다:

### SessionStart Hook (`init-config.js`)
세션 시작 시 실행:
1. `plugin.json`에서 플러그인 버전 읽기
2. `.plugin-config/hook-git-auto-backup.json` 설정 파일 존재 확인
3. 설정 파일이 있으면 `_pluginVersion`과 현재 플러그인 버전 비교
4. 버전이 일치하면 즉시 종료 (빠름!)
5. 버전이 다르면 자동 마이그레이션 수행:
   - 기존 사용자 설정과 새 기본 필드 병합
   - 모든 사용자 커스텀 설정 보존
   - `_pluginVersion`을 현재 버전으로 업데이트
6. 설정 파일이 없으면 기본 설정으로 생성

### Stop Hook (`backup.js`)
Claude Code 세션이 끝날 때 실행:
1. 현재 디렉토리가 git 저장소인지 확인
2. 커밋되지 않은 변경사항이 있는지 확인 (`git status --porcelain`)
3. 변경사항이 있으면:
   - 모든 변경사항 스테이징 (`git add -A`)
   - 타임스탬프와 함께 커밋 생성
   - 세션에 커밋 해시 표시

## 설치

```bash
/plugin install hook-git-auto-backup@dev-gom-plugins
```

## 사용법

설치 후에는 자동으로 작동합니다. 별도 설정이 필요 없습니다!

Claude Code 세션을 종료하면 변경사항이 있을 경우 다음과 같이 표시됩니다:

```
✓ Git Auto-Backup: Changes committed successfully (a1b2c3d)
```

## 커밋 메시지 예시

```
Auto-backup: 2025-10-14 12:34:56

🤖 Generated with Claude Code Auto-Backup Plugin
```

## 환경 설정

플러그인은 첫 실행 시 `.plugin-config/hook-git-auto-backup.json` 설정 파일을 자동으로 생성합니다.

### 자동 설정 마이그레이션

플러그인 업데이트 시 설정이 자동으로 마이그레이션됩니다:
- ✅ **사용자 설정 보존**
- ✅ **새 설정 필드 자동 추가** (기본값 적용)
- ✅ **버전 추적** (`_pluginVersion` 필드 사용)
- ✅ **수동 작업 불필요**

### 사용 가능한 설정 옵션

#### `showLogs`
- **설명**: 자동 백업 메시지를 콘솔에 표시
- **기본값**: `false`
- **예시**: `true` (백업 확인 메시지 표시)

#### `requireGitRepo`
- **설명**: Git 저장소가 아닐 경우 실행하지 않음
- **기본값**: `true`
- **권장**: `true` (Git 저장소에서만 사용)

#### `commitOnlyIfChanges`
- **설명**: 변경사항이 있을 때만 커밋 생성
- **기본값**: `true`
- **권장**: `true` (빈 커밋 방지)

#### `includeTimestamp`
- **설명**: 커밋 메시지에 타임스탬프 포함
- **기본값**: `true`
- **권장**: `true` (세션 시간 추적)

### 설정 변경 방법

프로젝트 루트의 `.plugin-config/hook-git-auto-backup.json` 파일을 편집하세요:

```json
{
  "showLogs": false,
  "requireGitRepo": true,
  "commitOnlyIfChanges": true,
  "includeTimestamp": true
}
```

### 커밋 메시지 커스터마이즈

커밋 메시지 형식을 변경하려면 `scripts/backup.js` 파일을 편집하세요:

```javascript
const timestamp = config.includeTimestamp
  ? new Date().toISOString().replace('T', ' ').slice(0, 19)
  : '';

const commitMessage = `Auto-backup: ${timestamp}`;
```

## Hook 출력

이 플러그인은 Claude Code Hook 모범 사례에 따라 단일 JSON 결과를 출력합니다:

```javascript
console.log(JSON.stringify({
  systemMessage: '✓ Git Auto-Backup: Changes committed successfully (abc1234)',
  continue: true
}));
```

## 플러그인이 실행되는 경우

- ✅ 세션이 정상적으로 종료될 때
- ✅ Stop hook에 의해 세션이 중단될 때
- ❌ git 저장소가 아닌 경우 실행되지 않음
- ❌ 변경사항이 없는 경우 실행되지 않음

## 모범 사례

### 권장 .gitignore 설정

플러그인이 생성하는 파일들을 `.gitignore`에 추가하세요:

```gitignore
.todos-report.md
.complexity-log.txt
.docs-summary.md
.session-summary.md
```

### 브랜치 작업 시

플러그인은 **현재 브랜치**에 커밋합니다. 세션을 시작하기 전에 올바른 브랜치에 있는지 확인하세요:

```bash
git checkout feature-branch
claude
```

### 자동 커밋 되돌리기

자동 백업 커밋을 취소해야 하는 경우:

```bash
git reset --soft HEAD~1
```

## 문제 해결

### 플러그인이 커밋을 생성하지 않나요?

1. **git 저장소인지 확인**:
   ```bash
   git status
   ```

2. **git 사용자가 설정되어 있는지 확인**:
   ```bash
   git config user.name
   git config user.email
   ```

3. **플러그인이 설치되어 있는지 확인**:
   ```bash
   /plugin
   ```

### 커밋이 너무 자주 생성되나요?

이 플러그인은 세션당 한 번만 커밋합니다 (종료 시). 더 많은 제어가 필요하다면:
- 세션 중에 수동으로 커밋하기
- 나중에 `git rebase -i`로 자동 백업 커밋 합치기

## 관련 플러그인

- **Session File Tracker** - 파일 작업 요약
- **TODO Collector** - TODO 코멘트 추적
- **Complexity Monitor** - 코드 복잡도 검사

## 기술 세부사항

### 스크립트 위치
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-git-auto-backup/scripts/init-config.js` - 설정 초기화
- `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/hook-git-auto-backup/scripts/backup.js` - Git 백업 실행

### Hook 타입
- **SessionStart** - 세션 시작 시 설정 초기화
- **Stop** - 세션 종료 시 Git 백업 생성

### 의존성
- Node.js
- Git

### 타임아웃
15초

## 버전

**현재 버전**: 1.1.1

## 변경 이력

### v1.1.1 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 자동 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신이면 SessionStart 훅 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 경로 처리 개선

### v1.0.0
- 최초 릴리스

## 기여하기

이 플러그인을 자유롭게 커스터마이즈하세요:

1. `backup.js`를 수정하여 커밋 메시지 형식 변경
2. `plugin.json`을 수정하여 hook 동작 변경
3. `/plugin validate`로 테스트

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 크레딧

[Claude Code Developer Utilities](../../README.ko.md) 컬렉션의 일부입니다.
