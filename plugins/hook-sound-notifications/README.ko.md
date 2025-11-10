# Sound Notifications 훅 플러그인

Claude Code 훅 이벤트에 대한 오디오 알림 (사운드 및 볼륨 조절 지원)

## ⚠️ 실험적 기능 - 알려진 문제

**경고**: 이 플러그인은 현재 실험적이며 안정성 문제가 있습니다:

- **이 플러그인을 사용하면 Claude Code가 간헐적으로 종료될 수 있습니다**
- 이는 Claude Code의 훅 실행 시스템과 관련된 것으로 보입니다
- 문제가 무작위로 발생하며 아직 완전히 이해되지 않았습니다
- **권장사항**: 자주 종료되는 경우 이 플러그인을 비활성화하세요
- 중요하지 않은 작업에서만 사용하는 것을 권장합니다

현재 이 문제를 적극적으로 조사 중입니다. 종료 문제가 발생하면 `/plugin disable hook-sound-notifications`로 플러그인을 비활성화하세요.

## 기능

- 🔊 **9가지 훅 타입에 대한 사운드 알림**
  - SessionStart, SessionEnd
  - PreToolUse, PostToolUse (PostToolUse는 기본적으로 비활성화)
  - Notification, UserPromptSubmit
  - Stop, SubagentStop, PreCompact

- 🎚️ **볼륨 조절**
  - 전역 볼륨 설정 (0.0-1.0)
  - 훅별 볼륨 재정의
  - 권장: 빈번한 이벤트는 0.3-0.5

- 🔒 **중복 실행 방지**
  - 훅 타입당 1초 쿨다운
  - Claude Code 훅 중복 실행 버그 방지

- 🌐 **크로스 플랫폼 지원**
  - 요구사항: Node.js v14+
  - Windows: PowerShell MediaPlayer (볼륨 조절 지원)
  - macOS: afplay (볼륨 조절 미지원)
  - Linux: mpg123 (MP3, 볼륨 지원) / aplay (WAV)

## 요구사항

### Node.js (필수)

이 플러그인은 **Node.js v14 이상**이 시스템에 설치되어 있어야 합니다.

**Node.js 설치 확인:**
```bash
node --version
```

명령어가 실패하거나 v14 미만 버전이 표시되면 Node.js를 설치하세요:

- **다운로드:** https://nodejs.org/ (권장: LTS 버전)
- **설치 후:**
  1. 터미널/명령 프롬프트 재시작
  2. Claude Code 재시작
  3. 플러그인이 정상적으로 작동합니다

**문제 해결:**
- 훅 사운드가 재생되지 않으면 Node.js 설치 확인: `node --version`
- Node.js가 시스템 PATH에 포함되어 있는지 확인
- Windows에서는 Node.js 설치 후 명령 프롬프트 재시작 필요

## 설치

이 플러그인은 Dev GOM Plugins 마켓플레이스에 포함되어 있습니다. 설치 후 Claude Code를 재시작하세요.

## 설정

설정은 `.plugin-config/hook-sound-notifications.json`에 저장됩니다:

```json
{
  "soundNotifications": {
    "soundsFolder": "~/.claude/sounds/hook-sound-notifications",
    "enabled": true,
    "volume": 0.5,
    "hooks": {
      "SessionStart": {
        "enabled": true,
        "soundFile": "session-start.mp3",
        "volume": 0.5
      },
      "PreToolUse": {
        "enabled": true,
        "soundFile": "pre-tool-use.mp3",
        "volume": 0.3
      }
    }
  }
}
```

### 설정 항목

- `enabled`: 전역 활성화/비활성화 (기본값: true)
- `volume`: 전역 볼륨 0.0-1.0 (기본값: 0.5)
- `soundsFolder`: 사운드 파일 폴더 경로
  - **기본값:** `~/.claude/sounds/hook-sound-notifications/` (사용자 홈 폴더)
  - 사운드 파일이 첫 실행 시 자동으로 이 폴더에 복사됩니다
  - **플러그인 업데이트 시 안전** - 사용자 커스터마이징이 보존됩니다
  - 사용자 지정 절대 경로로 변경 가능
- `hooks.[hookType].enabled`: 특정 훅 활성화/비활성화
- `hooks.[hookType].soundFile`: 사운드 파일 이름 (soundsFolder 기준 상대 경로)
- `hooks.[hookType].volume`: 전역 볼륨 재정의

### 훅 활성화/비활성화

`.plugin-config/hook-sound-notifications.json`을 편집하고 Claude Code를 재시작하세요.

**참고:** PostToolUse는 빈번한 사용 시 불안정할 수 있어 기본적으로 비활성화되어 있습니다.

## 커스터마이징

### 커스텀 사운드 파일

사운드 파일은 사용자 홈 폴더에 저장되며 **플러그인 업데이트 시에도 안전하게 보존**됩니다.

**저장 위치:**
- **Windows:** `C:\Users\<사용자명>\.claude\sounds\hook-sound-notifications\`
- **macOS/Linux:** `~/.claude/sounds/hook-sound-notifications/`

**커스터마이징 방법:**

1. 위 사운드 폴더 위치로 이동
2. 9개의 사운드 파일 중 원하는 파일을 교체:
   - `session-start.mp3`
   - `session-end.mp3`
   - `pre-tool-use.mp3`
   - `post-tool-use.mp3`
   - `notification.mp3`
   - `user-prompt-submit.mp3`
   - `stop.mp3`
   - `subagent-stop.mp3`
   - `pre-compact.mp3`
3. 커스텀 사운드는 플러그인 업데이트 시에도 유지됩니다

**지원 형식:** MP3, WAV

**참고:** 다른 위치의 사운드를 사용하려면 `.plugin-config/hook-sound-notifications.json`에서 `soundsFolder` 경로를 업데이트하세요.

### 볼륨 레벨

- **SessionStart/End, Stop**: 0.5 (기본값)
- **PreToolUse/PostToolUse**: 0.3 (빈번한 이벤트는 낮게)
- **Notification, UserPromptSubmit**: 0.5

## 알려진 이슈

### 심각
- **Claude Code가 간헐적으로 종료될 수 있음** - 이는 Claude Code의 훅 실행 시스템과 관련된 것으로 보입니다. 사용된 사운드 재생 방법(VBScript, PowerShell, PowerShell 스크립트)과 무관하게 무작위로 종료가 발생합니다.

### 경미
- PostToolUse 훅 활성화 시 불안정성 증가 가능 (기본적으로 비활성화)

## 변경 이력

### v1.4.4 (2025-11-03)
- **수정:** bash 래퍼에서 Node.js 래퍼로 전환하여 Windows 경로 처리 문제 해결
- **변경:** 모든 훅이 이제 `sound-hook-wrapper.sh` (bash) 대신 `sound-hook-executor.js` (Node.js) 사용
- **개선:** 크로스 플랫폼 호환성 향상 - Windows에서 Git Bash에 더 이상 의존하지 않음
- **추가:** Node.js v14+ 요구사항 명시적 문서화
- **제거:** `sound-hook-wrapper.sh` (Node.js executor로 대체)

### v1.4.3 (2025-11-03)
- **수정:** PowerShell lock cleanup이 이제 try-finally 사용 (모든 종료 경로에서 정상적으로 정리)
- **수정:** Windows fallback soundsFolder가 이제 홈 폴더 사용 (Unix와 동작 일치)
- **추가:** PowerShell에서 틸드 확장 지원 (크로스 플랫폼 config 호환성, `~/...` 경로)
- **강화:** 동적 파일 읽기 시 숨김 파일(.DS_Store, Thumbs.db) 필터링 및 오디오 확장자 검증
- **변경:** `bc`를 `awk`로 대체하여 이식성 향상 (POSIX 호환, 최소 환경에서 작동)

### v1.4.2 (2025-11-03)
- **수정:** sound-hook.sh SOUNDS_FOLDER fallback이 이제 플러그인 폴더 대신 홈 폴더 사용
- **추가:** sound-hook.sh에서 경로 틸드 확장 (`~/.claude/sounds/...`)
- **수정:** grep fallback(jq 미설치 시)이 이제 홈 폴더 사용
- **강화:** init-config.js가 동적으로 사운드 파일 읽기 (하드코딩된 목록 제거)
- **개선:** sound-hook-wrapper.sh Darwin/Linux 케이스 통합 (코드 중복 감소)

### v1.4.1 (2025-11-03)
- **수정:** bash 래퍼에서 Windows 경로 정규화 (C:\Users\... → /c/Users/...)
- **추가:** 중복 훅 실행 방지를 위한 Lock 메커니즘 (PID 기반)
- **강화:** 크로스 플랫폼 호환성 (CYGWIN/MINGW/MSYS/Windows_NT 지원)
- **변경:** 모든 훅이 lock 메커니즘을 포함한 bash 래퍼 사용

### v1.4.0 (2025-11-03)
- **추가:** 홈 폴더 사운드 마이그레이션 - 사운드가 이제 `~/.claude/sounds/hook-sound-notifications/`에 저장됨
- **추가:** 첫 실행 시 자동 사운드 파일 복사 (기존 파일 보존)
- **추가:** OS 감지 래퍼를 통한 크로스 플랫폼 훅 지원 (Windows/macOS/Linux)
- **추가:** jq 기반 JSON 파싱 및 grep fallback을 사용하는 Unix 사운드 재생 스크립트
- **변경:** 기본 soundsFolder가 플러그인 폴더에서 사용자 홈 폴더로 변경
- **수정:** 사용자 사운드 커스터마이징이 이제 플러그인 업데이트 시에도 보존됨
- **문서:** 홈 폴더 사용 안내를 포함한 상세 커스터마이징 가이드 추가

### v1.2.0 (2025-10-29)
- **변경:** Windows 사운드 재생을 PowerShell 스크립트 파일로 변경 (sound-hook.ps1, play-sound.ps1)
- **변경:** 훅에서 Node.js 래퍼 대신 PowerShell 스크립트 직접 호출
- **제거:** sound-hook.js (PowerShell 스크립트로 대체)
- **경고:** 간헐적인 Claude Code 종료 문제로 인해 실험적 기능 경고 추가
- **문서:** 중요한 안정성 경고를 포함하여 README 업데이트

### v1.1.0 (2025-10-29)
- **변경:** Windows 사운드 재생을 PowerShell 스크립트 파일로 변경 (sound-hook.ps1, play-sound.ps1)
- **변경:** 훅에서 Node.js 래퍼 대신 PowerShell 스크립트 직접 호출
- **추가:** SessionEnd 훅에서 hooks.json 설정 업데이트하여 다음 세션에 적용
- **추가:** 모든 스크립트에 중복 실행 방지 유틸리티 적용
- **수정:** 설정 변경이 세션 재시작 후 정상적으로 적용되도록 수정
- **경고:** 간헐적인 Claude Code 종료 문제로 인해 실험적 기능 경고 추가

### v1.0.2 (2025-10-29)
- **수정:** sound-hook.js의 설정 파일 경로 오류 수정

### v1.0.1 (2025-10-29)
- **수정:** init-config.js의 훅 선택 로직 수정
- **수정:** 플러그인 매니페스트 author 필드 검증 오류 수정

### v1.0.0 (2025-10-29)
- 독립 플러그인 첫 릴리즈

## 라이선스

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE) 참조
