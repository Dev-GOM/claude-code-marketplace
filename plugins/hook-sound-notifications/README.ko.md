# Sound Notifications 훅 플러그인

Claude Code 훅 이벤트에 대한 오디오 알림 (사운드 및 볼륨 조절 지원)

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
  - Windows: VBScript + WMPlayer (볼륨 조절 지원)
  - macOS: afplay (볼륨 조절 미지원)
  - Linux: mpg123 (MP3, 볼륨 지원) / aplay (WAV)

## 설치

이 플러그인은 Dev GOM Plugins 마켓플레이스에 포함되어 있습니다. 설치 후 Claude Code를 재시작하세요.

## 설정

설정은 `.plugin-config/hook-sound-notifications.json`에 저장됩니다:

```json
{
  "soundNotifications": {
    "soundsFolder": "${CLAUDE_PLUGIN_ROOT}/sounds",
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
- `soundsFolder`: 사운드 파일 폴더 경로 (플러그인 위치에서 자동 감지)
  - 자동으로 `${CLAUDE_PLUGIN_ROOT}/sounds`로 설정됨
  - 절대 경로 또는 상대 경로로 커스터마이징 가능
  - 기본 사운드 파일이 플러그인에 포함되어 있음
- `hooks.[hookType].enabled`: 특정 훅 활성화/비활성화
- `hooks.[hookType].soundFile`: 사운드 파일 이름 (soundsFolder 기준 상대 경로)
- `hooks.[hookType].volume`: 전역 볼륨 재정의

### 훅 활성화/비활성화

`.plugin-config/hook-sound-notifications.json`을 편집하고 Claude Code를 재시작하세요.

**참고:** PostToolUse는 빈번한 사용 시 불안정할 수 있어 기본적으로 비활성화되어 있습니다.

## 커스터마이징

### 커스텀 사운드 파일

플러그인의 `sounds` 폴더에 있는 사운드 파일을 교체하거나, 설정에서 `soundFile` 경로를 업데이트하세요.

**지원 형식:** MP3, WAV

### 볼륨 레벨

- **SessionStart/End, Stop**: 0.5 (기본값)
- **PreToolUse/PostToolUse**: 0.3 (빈번한 이벤트는 낮게)
- **Notification, UserPromptSubmit**: 0.5

## 알려진 이슈

- PostToolUse 훅 활성화 시 Claude Code가 멈출 수 있음
- Windows: 긴 사운드 파일(3초+)이 중간에 끊길 수 있음 (조사 중)

## 라이선스

MIT
