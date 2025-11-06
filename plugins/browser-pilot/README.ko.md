# Browser Pilot

> **상태**: ✅ 릴리즈 (v1.5.8)

**언어**: [English](README.md) | [한국어](README.ko.md)

**데몬 기반 아키텍처**와 **스마트 모드**를 갖춘 Chrome DevTools Protocol (CDP) 기반 브라우저 자동화, 웹 스크래핑, 크롤링.

## 개요

Browser Pilot은 지속적인 브라우저 연결을 유지하는 **데몬 기반 아키텍처**를 통해 Chrome DevTools Protocol (CDP)로 지능형 브라우저 자동화를 제공합니다. 텍스트 기반 요소 검색을 위한 자동 Interaction Map 생성 기능을 갖춘 **스마트 모드**로 취약한 CSS 셀렉터를 제거합니다.

**주요 기능:**

- 🤖 **스마트 모드** - 자동 셀렉터 생성을 통한 텍스트 기반 요소 검색
- 🔄 **데몬 아키텍처** - 즉각적인 명령 실행을 위한 지속적 CDP 연결
- 📸 **스크린샷 캡처** - 뷰포트 또는 전체 페이지 스크린샷
- 🌐 **탐색 및 상호작용** - URL 탐색, 클릭, 입력, 타이핑, 스크롤
- 📄 **데이터 추출** - 텍스트 콘텐츠, 콘솔 로그, 쿠키, 접근성 트리
- 📑 **PDF 생성** - 웹 페이지를 PDF로 변환
- 🔗 **탭 관리** - 프로그래밍 방식으로 탭 목록, 전환, 닫기
- 🤖 **봇 감지 우회** - `navigator.webdriver = false` 유지
- ⚛️ **React/프레임워크 호환성** - React synthetic events 정상 발생
- ⛓️ **체인 모드** - 단일 워크플로우에서 여러 명령 실행

## 아키텍처

```
┌─────────────────┐                    ┌──────────────────┐    CDP     ┌──────────────────────┐
│  Claude Code    │  IPC 명령          │  데몬 서버        │◄──────────►│   Chrome Browser     │
│  (CLI Client)   │───────────────────►│  (백그라운드)     │ WebSocket  │   (CDP Server)       │
│                 │                    │                  │ 포트 9222+ │                      │
│  - 사용자 요청   │                    │  - CDP Client    │            │  - Headless/Headed   │
│  - 명령어 파싱   │                    │  - Map Generator │            │  - Tab Management    │
│  - 결과 출력     │                    │  - Auto-restart  │            │  - DevTools API      │
└─────────────────┘                    └──────────────────┘            └──────────────────────┘
```

**주요 구성 요소:**
- **데몬 서버**: 지속적인 CDP 연결을 유지하는 백그라운드 프로세스
- **CLI 클라이언트**: 데몬과의 IPC 통신을 통한 빠른 명령 실행
- **Interaction Map**: 스마트 모드를 위한 자동 생성 대화형 요소 JSON 맵
- **Chrome 브라우저**: CDP가 활성화된 headless 또는 headed 모드 실행
- **자동 관리**: 첫 명령어에서 데몬 시작, 세션 종료 시 중지 (30분 타임아웃)

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
- "브라우저 테스트 진행"
- "브라우저 파일럿 스킬을 로드하여 로그인 기능을 테스트"

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

### 스마트 모드 (권장)

자동 셀렉터 생성을 통한 텍스트 기반 요소 검색 - CSS 셀렉터보다 안정적:

```bash
# 페이지 탐색
node .browser-pilot/bp navigate -u "https://example.com/login"

# 텍스트 콘텐츠로 클릭 (단어가 하나면 따옴표 불필요)
node .browser-pilot/bp click --text Login --type button

# 텍스트 라벨로 폼 채우기 (공백이 있으면 따옴표 사용)
node .browser-pilot/bp fill --text "Email Address" -v "user@example.com"
node .browser-pilot/bp fill --text Password -v "mypass123"

# 인덱싱으로 중복 요소 처리 (2번째 Delete 버튼 클릭)
node .browser-pilot/bp click --text Delete --index 2

# 스크린샷 캡처
node .browser-pilot/bp screenshot -o "login-page.png"
```

### 체인 모드 (다중 명령어)

단일 워크플로우에서 여러 명령 실행:

```bash
# 로그인 워크플로우
node .browser-pilot/bp chain \
  navigate -u "https://example.com/login" \
  fill --text Email -v "user@example.com" \
  fill --text Password -v "mypass123" \
  click --text Login \
  screenshot -o "logged-in.png"

# 스크래핑 워크플로우
node .browser-pilot/bp chain \
  navigate -u "https://example.com" \
  wait -s ".content-loaded" \
  extract -s ".product-title" \
  screenshot -o "products.png"
```

### 다이렉트 모드 (CSS 셀렉터)

고유 ID가 있거나 스마트 모드를 사용할 수 없을 때:

```bash
# CSS 셀렉터 사용
node .browser-pilot/bp click -s "#login-button"
node .browser-pilot/bp fill -s "input[name='email']" -v "user@example.com"
node .browser-pilot/bp extract -s "h1.page-title"
```

**참고**: 파일은 프로젝트 루트의 `.browser-pilot/`에 저장됩니다. 데몬은 첫 명령어에서 자동 시작되고 세션 종료 시 중지됩니다.

## 사용 가능한 명령어

모든 명령어는 래퍼 스크립트를 사용: `node .browser-pilot/bp <명령어> [옵션]`

상세 옵션은 `--help` 사용: `node .browser-pilot/bp <명령어> --help`

### 탐색 명령어

```bash
navigate -u <url>              # URL로 이동
back                           # 뒤로 가기
forward                        # 앞으로 가기
reload                         # 현재 페이지 새로고침
```

### 상호작용 명령어 (스마트 모드)

```bash
# 텍스트 기반 검색 (권장)
click --text <text> [옵션]     # 텍스트로 요소 클릭
  --type <type>                # 요소 타입으로 필터링 (button, link, input 등)
  --index <n>                  # n번째 일치 항목 선택 (중복 시)
  --viewport-only              # 보이는 요소만 검색

fill --text <text> -v <값>     # 라벨 텍스트로 입력 필드 채우기
  --type <type>                # 입력 타입으로 필터링
  --index <n>                  # n번째 일치 항목 선택

# 다이렉트 셀렉터 (대체)
click -s <selector>            # CSS 셀렉터로 클릭
fill -s <selector> -v <값>     # CSS 셀렉터로 채우기
```

### 캡처 명령어

```bash
screenshot -o <파일명>         # 스크린샷 캡처
  --full-page                  # 전체 페이지 캡처 (기본값: 뷰포트)

pdf -o <파일명>                # PDF 생성
  --landscape                  # 가로 방향 사용
```

### 데이터 추출

```bash
extract -s <selector>          # 요소에서 텍스트 추출
  --all                        # 모든 일치 항목 추출 (기본값: 첫 번째)

content                        # 전체 페이지 텍스트 콘텐츠 가져오기
console                        # 콘솔 메시지 가져오기
cookies                        # 쿠키 가져오기
```

### 체인 모드

```bash
chain <cmd1> <cmd2> ...        # 여러 명령 실행
  --timeout <ms>               # 맵 대기 타임아웃 (기본값: 10000)
  --delay <ms>                 # 명령 사이 고정 딜레이
```

### 쿼리 명령어

```bash
query --text <text>            # Interaction Map에서 요소 찾기
query --list-types             # 모든 요소 타입 나열
map-status                     # 맵 상태 확인
regen-map                      # 맵 강제 재생성
```

### 기타 명령어

```bash
wait -s <selector> -t <ms>     # 요소 대기
scroll -s <selector>           # 요소로 스크롤
eval -e <expression>           # JavaScript 실행
tabs                           # 모든 탭 나열
```

### 데몬 관리

```bash
daemon-status                  # 데몬 상태 확인
daemon-stop                    # 데몬 수동 중지
```

전체 명령어 레퍼런스는 [references/commands-reference.md](./skills/references/commands-reference.md) 참조

## 설정

### 공유 설정 파일

**위치**: `{plugin-folder}/skills/browser-pilot-config.json`

플러그인은 여러 프로젝트를 관리하는 공유 설정 시스템을 사용합니다:

```json
{
  "projects": {
    "my-project": {
      "rootPath": "/path/to/my-project",
      "port": 9222,
      "outputDir": ".browser-pilot",
      "lastUsed": "2025-11-04T12:00:00.000Z",
      "autoCleanup": false
    },
    "another-project": {
      "rootPath": "/path/to/another-project",
      "port": 9223,
      "outputDir": ".browser-pilot",
      "lastUsed": "2025-11-04T11:00:00.000Z",
      "autoCleanup": false
    }
  }
}
```

**기능:**
- SessionStart 훅을 통한 자동 프로젝트 등록
- 프로젝트별 고유 포트 할당 (9222-9322)
- 폴더 이름으로 프로젝트 식별
- SessionEnd 훅을 통한 선택적 정리 (`autoCleanup: true`일 때)

### 출력 디렉토리

모든 스크린샷과 PDF는 자동으로 다음 위치에 저장됩니다:
- `.browser-pilot/` (프로젝트 루트)
- 세션 시작 시 `.gitignore`와 함께 자동 생성되어 생성된 파일 제외

## 예제 워크플로우

### 로그인 워크플로우 (스마트 모드 + 체인)

```bash
# 텍스트 기반 검색을 사용한 완전한 로그인 워크플로우
node .browser-pilot/bp chain \
  navigate -u "https://example.com/login" \
  fill --text Email -v "user@example.com" \
  fill --text Password -v "mypass123" \
  click --text "로그인" --type button \
  screenshot -o "logged-in.png"
```

### 스크린샷 캡처

```bash
# 전체 페이지 스크린샷
node .browser-pilot/bp chain \
  navigate -u "https://github.com" \
  screenshot -o "github-homepage.png" --full-page
```

### 폼 자동화 (스마트 모드)

```bash
# 텍스트 라벨을 사용한 문의 폼 제출
node .browser-pilot/bp chain \
  navigate -u "https://example.com/contact" \
  fill --text "이름" -v "홍길동" \
  fill --text "이메일 주소" -v "hong@example.com" \
  fill --text 메시지 -v "Browser Pilot에서 보냅니다!" \
  click --text 제출 --type button \
  screenshot -o "contact-submitted.png"
```

### 웹 스크래핑

```bash
# 여러 요소 추출
node .browser-pilot/bp chain \
  navigate -u "https://news.ycombinator.com" \
  extract -s "a.storylink" --all
```

### PDF 생성

```bash
# 가로 방향 PDF 생성
node .browser-pilot/bp chain \
  navigate -u "https://docs.example.com" \
  pdf -o "api-docs.pdf" --landscape
```

### Interaction Map 쿼리

```bash
# 특정 요소 찾기
node .browser-pilot/bp query --text "로그인"
node .browser-pilot/bp query --list-types

# 맵 상태 확인
node .browser-pilot/bp map-status
```

## 봇 감지 우회

Browser Pilot은 `navigator.webdriver = false`를 유지하고 React synthetic events를 적절히 발생시켜 대부분의 봇 방지 시스템을 우회합니다.

**체인 모드는 자동으로 300-800ms 랜덤 딜레이를 추가**하여 인간 행동을 모방합니다.

**봇 감지 테스트**:
```bash
node .browser-pilot/bp chain \
  navigate -u "https://bot.sannysoft.com" \
  screenshot -o "bot-test.png"
```

예상 결과: 모든 검사 **PASS** (녹색).

## 모범 사례

1. **🌟 기본적으로 스마트 모드 사용** - 텍스트 기반 검색 (`--text 로그인`)이 CSS 셀렉터보다 안정적
2. **워크플로우에는 체인 모드 사용** - 자동 딜레이 및 간소화된 실행
3. **데몬 자동 관리** - 수동 시작/중지 불필요
4. **텍스트 기반 검색 선호** - UI 변경에 CSS 셀렉터보다 탄력적
5. **인덱싱으로 중복 처리** - 2번째 일치 요소에 `--index 2` 사용
6. **타입으로 정밀 필터링** - `--type button`으로 결과 좁히기
7. **가시성 확인** - `--viewport-only`로 화면에 있는 요소 확인
8. **오류 시 콘솔 확인** - 디버깅을 위해 `node .browser-pilot/bp console` 사용
9. **가이드를 위해 `--help` 사용** - `node .browser-pilot/bp <명령어> --help`

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

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE)와 [NOTICE](../../NOTICE) 참조

## 기여

이 플러그인은 [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) 마켓플레이스의 일부입니다. 기여를 환영합니다!

## 문서

- 📖 **빠른 참조**: [SKILL.md](./skills/SKILL.md) - Claude Code용 간결한 가이드
- 📚 **상세 가이드**:
  - [명령어 레퍼런스](./skills/references/commands-reference.md) - 예제를 포함한 모든 52+ 명령어
  - [셀렉터 가이드](./skills/references/selector-guide.md) - 스마트 모드 전략 및 모범 사례
  - [Interaction Map](./skills/references/interaction-map.md) - 맵 시스템 상세 정보 및 쿼리 API

## 지원

- 🐛 **이슈**: [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)
- 💬 **토론**: [GitHub Discussions](https://github.com/Dev-GOM/claude-code-marketplace/discussions)
- 🔧 **개발 가이드**: [CLAUDE.md](./CLAUDE.md) - 플러그인 개발 가이드라인

---

**참고**: Browser Pilot v1.4.0은 프로덕션 준비가 완료되었으며 적극적으로 유지 관리됩니다. GitHub Issues를 통해 버그를 보고하거나 기능을 요청하세요.
