# Browser Pilot

> **상태**: ✅ 릴리즈 (v0.2.1)

**언어**: [English](README.md) | [한국어](README.ko.md)

Chrome DevTools Protocol (CDP) 기반 브라우저 자동화, 웹 스크래핑, 크롤링 - Claude Code에서 Chrome 브라우저를 프로그래밍 방식으로 제어합니다.

## 개요

Browser Pilot은 Chrome DevTools Protocol (CDP)을 통해 Chrome 브라우저를 직접 제어할 수 있게 합니다. Selenium이나 Puppeteer와 유사하지만 CLI 우선 접근 방식을 사용합니다. 이 플러그인으로 다음을 할 수 있습니다:

- 📸 스크린샷 캡처 (뷰포트 또는 전체 페이지)
- 🌐 URL 탐색 및 페이지 상호작용
- 🖱️ 요소 클릭, 폼 작성, 키 입력
- 📄 텍스트 콘텐츠 추출 및 데이터 스크래핑
- 📑 웹 페이지에서 PDF 생성
- 🔗 브라우저 탭 관리 (목록, 전환, 닫기)
- 🤖 봇 감지 우회 (`navigator.webdriver = false` 유지)

## 아키텍처

```
┌─────────────────┐    Chrome DevTools Protocol    ┌──────────────────────┐
│  Claude Code    │◄──────────────────────────────►│   Chrome Browser     │
│  (TypeScript)   │    WebSocket (포트 9222+)      │   (CDP Server)       │
│                 │                                 │                      │
│  - CLI Client   │                                 │  - Headless Mode     │
│  - Commands     │                                 │  - Tab Management    │
│  - Config Mgmt  │                                 │  - DevTools API      │
└─────────────────┘                                 └──────────────────────┘
```

**주요 구성 요소:**
- **TypeScript CLI**: CDP 작업을 위한 커맨드라인 인터페이스
- **Chrome Browser**: CDP가 활성화된 headless 또는 headed 모드로 실행
- **WebSocket Communication**: JSON 기반 명령-응답 프로토콜

## Claude Code에서 스킬 사용하기

이 플러그인은 Claude가 자동으로 사용할 수 있는 **스킬**을 제공합니다. 직접 명령어를 실행할 필요가 없습니다.

### 사전 준비사항

Claude가 이 스킬을 사용하기 전에:

1. **TypeScript 코드 빌드** (최초 1회):
   ```bash
   cd plugins/browser-pilot/skills/scripts
   npm install
   npm run build
   ```

2. **Google Chrome 설치**
   - Claude가 스킬을 사용할 때 Chrome이 자동으로 실행됩니다
   - 포트 9222에서 실행 (또는 다음 사용 가능한 포트)

### 작동 방식

설정이 완료되면, Claude가 브라우저 자동화 작업을 요청할 때 자동으로 이 스킬을 사용합니다:
- "https://example.com 의 스크린샷을 찍어줘"
- "https://news.ycombinator.com 에서 제목을 추출해줘"
- "https://example.com 의 로그인 버튼을 클릭해줘"

Claude가 SKILL.md 인터페이스를 통해 모든 명령 실행을 처리합니다 - 원하는 것만 설명하면 됩니다!

## 설치

### 사전 요구사항

1. **Google Chrome** (최신 버전 권장)
2. **Node.js** 18+ ([nodejs.org](https://nodejs.org))
3. **Git Bash** (Windows) 또는 Terminal (macOS/Linux)

### 빠른 설치

```bash
cd plugins/browser-pilot/skills/scripts
npm install
npm run build
```

Claude Code 세션을 시작하면 플러그인이 자동으로 초기화됩니다 (SessionStart 훅을 통해).

## 빠른 시작

### 기본 사용법

모든 명령어는 `plugins/browser-pilot/skills/scripts`에서 실행해야 합니다:

```bash
cd plugins/browser-pilot/skills/scripts

# 스크린샷 캡처
npm run bp:screenshot -- -u "https://example.com" -o "example.png" --headless --full-page --project-root "$OLDPWD"

# URL로 이동
npm run bp:navigate -- -u "https://github.com" --project-root "$OLDPWD"

# 요소에서 텍스트 추출
npm run bp:extract -- -u "https://example.com" -s "h1" --project-root "$OLDPWD"

# 폼 필드 채우기
npm run bp:fill -- -u "https://example.com/login" -s "#email" -v "user@example.com" --project-root "$OLDPWD"

# 요소 클릭
npm run bp:click -- -u "https://example.com" -s "button.login-btn" --project-root "$OLDPWD"

# PDF 생성
npm run bp:pdf -- -u "https://docs.example.com" -o "documentation.pdf" --project-root "$OLDPWD"
```

**중요**: 파일이 올바른 프로젝트 디렉토리에 저장되도록 항상 `--project-root "$OLDPWD"`를 포함하세요.

### 멀티 스텝 워크플로우

봇 감지를 피하기 위해 `&&`로 명령을 체이닝하고 `sleep` 딜레이를 추가하세요:

```bash
cd plugins/browser-pilot/skills/scripts

# 인간 같은 딜레이를 사용한 로그인 워크플로우
npm run bp:navigate -- -u "https://example.com/login" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:fill -- -s "#email" -v "user@example.com" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#password" -v "mypass123" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']" --project-root "$OLDPWD"
```

## 사용 가능한 명령어

### 핵심 명령어

```bash
# 브라우저 실행
launch           # Headless 또는 headed 모드로 Chrome 시작
  --headless     # UI 없이 실행 (기본값: false)

# 탐색
navigate         # URL로 이동
  -u, --url      # 대상 URL (필수)

# 스크린샷
screenshot       # 페이지 스크린샷 캡처
  -u, --url      # 대상 URL (브라우저가 이미 열려있으면 선택사항)
  -o, --output   # 출력 파일명 (.browser-pilot/에 저장)
  --full-page    # 전체 페이지 캡처 (기본값: 뷰포트만)
  --headless     # Headless 모드로 실행

# PDF 생성
pdf              # 페이지에서 PDF 생성
  -u, --url      # 대상 URL (브라우저가 이미 열려있으면 선택사항)
  -o, --output   # 출력 파일명 (.browser-pilot/에 저장)
  --landscape    # 가로 방향 사용
  --headless     # Headless 모드로 실행
```

### 상호작용 명령어

```bash
# 클릭
click            # 셀렉터로 요소 클릭
  -u, --url      # 대상 URL (선택사항)
  -s, --selector # CSS 셀렉터 (필수)

# 폼 채우기
fill             # 입력 필드 채우기
  -u, --url      # 대상 URL (선택사항)
  -s, --selector # CSS 셀렉터 (필수)
  -v, --value    # 채울 텍스트 (필수)

# 텍스트 입력
type             # 활성 요소에 텍스트 입력
  --text         # 입력할 텍스트 (필수)

# 키 누르기
press            # 키보드 키 누르기
  --key          # 키 이름 (Enter, Tab, Escape 등)

# 콘텐츠 추출
extract          # 요소에서 텍스트 추출
  -u, --url      # 대상 URL (선택사항)
  -s, --selector # CSS 셀렉터 (필수)
  --all          # 일치하는 모든 요소 추출 (기본값: 첫 번째만)

# JavaScript 실행
eval             # 페이지 컨텍스트에서 JavaScript 실행
  -u, --url      # 대상 URL (선택사항)
  --expression   # 실행할 JavaScript 코드 (필수)
```

### 탭 관리

```bash
# 탭 목록
list-tabs        # ID와 제목이 포함된 모든 열린 탭 표시

# 탭 전환
switch-tab       # 특정 탭으로 전환
  --id           # 탭 ID (list-tabs에서 확인)
  --index        # 또는 탭 인덱스 (0부터 시작)

# 탭 닫기
close-tab        # 특정 탭 닫기
  --id           # 탭 ID (list-tabs에서 확인)
  --index        # 또는 탭 인덱스 (0부터 시작)

# 브라우저 닫기
close            # 모든 탭 닫고 브라우저 종료
```

## 설정

### 설정 파일

위치: `.plugin-config/browser-pilot.json`

```json
{
  "initialized": true,
  "debugPort": 9222,
  "lastUsed": "2025-11-03T05:00:00.000Z"
}
```

### 출력 디렉토리

모든 스크린샷과 PDF는 자동으로 다음 위치에 저장됩니다:
- `.browser-pilot/` (프로젝트 루트)
- 생성된 파일을 제외하는 `.gitignore`와 함께 자동 생성

## 예제 워크플로우

### 스크린샷 캡처

```bash
# Headless 모드에서 전체 페이지 스크린샷
npm run bp:screenshot -- \
  -u "https://github.com" \
  -o "github-homepage.png" \
  --headless \
  --full-page \
  --project-root "$OLDPWD"
```

### 폼 자동화

```bash
cd plugins/browser-pilot/skills/scripts

# 딜레이를 포함한 문의 폼 제출
npm run bp:navigate -- -u "https://example.com/contact" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:fill -- -s "#name" -v "홍길동" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#email" -v "hong@example.com" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#message" -v "Browser Pilot에서 보냅니다!" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:screenshot -- -o "contact-submitted.png" --project-root "$OLDPWD"
```

### 웹 스크래핑

```bash
# 페이지에서 모든 h1 제목 추출
npm run bp:extract -- \
  -u "https://news.ycombinator.com" \
  -s "a.storylink" \
  --all \
  --project-root "$OLDPWD"
```

### PDF 생성

```bash
# 문서의 가로 방향 PDF 생성
npm run bp:pdf -- \
  -u "https://docs.example.com" \
  -o "api-docs.pdf" \
  --landscape \
  --headless \
  --project-root "$OLDPWD"
```

## 봇 감지 우회

Browser Pilot은 `navigator.webdriver = false`를 유지하여 대부분의 봇 방지 시스템을 우회합니다.

**추가 팁**:
- 인간 행동을 모방하기 위해 명령 사이에 `sleep` 딜레이 (0.5-2초) 추가
- 중요한 작업(로그인, 폼 제출)에는 더 긴 딜레이 사용
- 여러 유사한 작업을 자동화할 때는 랜덤 딜레이 사용
- 예시: `npm run bp:fill ... && sleep 1 && npm run bp:click ...`

**봇 감지 테스트**:
```bash
npm run bp:screenshot -- \
  -u "https://bot.sannysoft.com" \
  -o "bot-test.png" \
  --headless \
  --project-root "$OLDPWD"
```

예상 결과: 모든 검사 **PASS** (녹색).

## 모범 사례

1. **한 번 빌드** - 첫 사용 전에 `npm run build` 실행
2. **디버깅에는 headed 모드 사용** - 브라우저 창을 보려면 `--headless` 생략
3. **고유한 셀렉터 선호** - ID 사용: `#username` > `.class` > `input[name="user"]`
4. **상대 경로** - 파일은 자동으로 `.browser-pilot/`에 저장
5. **인간 같은 딜레이 추가** - 봇 감지를 피하기 위해 명령 사이에 `sleep 0.5-2` 사용
6. **속도 제한 준수** - 요청 사이에 딜레이 추가
7. **작업 완료 후 브라우저 닫기** - 리소스 해제를 위해 `npm run bp:close` 사용

## 문제 해결

### 빌드 오류

```bash
cd plugins/browser-pilot/skills/scripts
npm install && npm run build
```

### Chrome을 찾을 수 없음

Browser Pilot은 Chrome 설치를 자동으로 감지합니다. 실패할 경우:

**Windows**:
- 기본: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- 사용자: `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`

**macOS**:
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

**Linux**:
- `/usr/bin/google-chrome`
- `/usr/bin/chromium`

### 포트가 이미 사용 중

Browser Pilot은 포트가 사용 중일 경우 디버그 포트를 자동 증가시킵니다 (9222 → 9223 → ...).

### 연결 시간 초과

기본 타임아웃은 10초입니다 (20회 시도 × 500ms). 늘리려면 `src/cdp/browser.ts`를 수정:
```typescript
const maxAttempts = 40; // 20에서 40으로 변경하면 20초 타임아웃
```

### 요소를 찾을 수 없음

- 브라우저 DevTools로 셀렉터 확인 (`F12` → 콘솔 → `document.querySelector("...")`)
- 상호작용 전에 `sleep 1`로 페이지 로딩 대기
- 더 구체적인 셀렉터 사용 (`#id` > `.class`)

## 기술적 세부사항

### Chrome DevTools Protocol

Browser Pilot은 모든 브라우저 작업에 CDP를 사용합니다:

**요청:**
```json
{
  "id": 1,
  "method": "Page.navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

**응답:**
```json
{
  "id": 1,
  "result": {
    "frameId": "frame-id-here"
  }
}
```

### 프로젝트 구조

```
plugins/browser-pilot/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 메타데이터
├── hooks/
│   ├── hooks.json               # SessionStart 훅 설정
│   └── scripts/
│       └── init-config.js       # 자동 초기화 스크립트
├── skills/
│   ├── SKILL.md                 # 스킬 문서
│   └── scripts/
│       ├── package.json         # Node.js 의존성
│       ├── tsconfig.json        # TypeScript 설정
│       ├── dist/                # 컴파일된 JavaScript
│       └── src/
│           ├── cli.ts           # CLI 진입점
│           ├── cdp/
│           │   ├── browser.ts   # Chrome 런처
│           │   ├── client.ts    # CDP WebSocket 클라이언트
│           │   ├── actions.ts   # 핵심 CDP 액션
│           │   ├── actions-extra.ts  # 확장 액션
│           │   └── utils.ts     # 유틸리티 함수
│           └── config/
│               └── manager.ts   # 설정 관리
└── README.md                    # 이 파일
```

## 윤리적 사용

Browser Pilot은 **승인된 자동화 전용**입니다. 다음 용도로 사용하지 마세요:

- 무단 접근 또는 자격 증명 도용
- DDoS 공격 또는 서버 과부하
- 저작권 침해 (저작권이 있는 콘텐츠 스크래핑)
- 페이월 또는 접근 제어 우회
- 자동 계정 생성 (스팸, 가짜 계정)
- 자격 증명 스터핑

항상 robots.txt와 웹사이트 이용 약관을 준수하세요.

## 성능

**명령 체이닝**:
- 브라우저는 한 번 시작되고 계속 열려있음 (빠름)
- 각 명령은 동일한 브라우저 인스턴스 재사용
- 명령당 ~100-200ms 오버헤드 (npm 시작)
- CDP 통신은 거의 즉각적 (밀리초)
- 봇 감지를 피하기 위해 `sleep` 딜레이 추가 (0.5-2초 권장)
- 총 워크플로우 시간 = 페이지 로드 + sleep 딜레이 + 명령 오버헤드

## 라이선스

MIT License - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 기여

이 플러그인은 [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) 마켓플레이스의 일부입니다. 기여를 환영합니다!

## 지원

- 📖 문서: [SKILL.md](./skills/SKILL.md)
- 🐛 이슈: [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)
- 💬 토론: [GitHub Discussions](https://github.com/Dev-GOM/claude-code-marketplace/discussions)

---

**참고**: Browser Pilot은 프로덕션 준비가 완료되었으며 적극적으로 유지 관리됩니다. GitHub Issues를 통해 버그를 보고하거나 기능을 요청하세요.
