# 변경 이력

Dev GOM Plugins 마켓플레이스의 모든 주요 변경사항이 이 파일에 문서화됩니다.

> **버전**: 2.11.0 | **최종 업데이트**: 2025-11-04

---

## [2.11.0] - 2025-11-04

### 변경됨
- 🎉 **Browser Pilot v1.0.0**: 첫 정식 릴리즈 - 프로덕션 준비 완료
  - **Breaking Changes**:
    - **`--project-root` 파라미터 제거**: 환경 변수에서 자동 감지
    - **설정 시스템 마이그레이션**: 프로젝트별 파일 → 공유 설정
  - **공유 설정 시스템**: 단일 설정 파일이 여러 프로젝트 관리
    - 멀티 프로젝트 포트 관리 (9222-9322 자동 할당)
    - 폴더 이름으로 프로젝트 식별
    - 포트 충돌 감지 및 자동 할당
  - **자동화된 세션 관리**: SessionStart/SessionEnd 훅
    - SessionStart: 프로젝트 자동 등록, 포트 할당, `.browser-pilot/` 디렉토리 생성
    - SessionEnd: `autoCleanup: true`일 때 선택적 정리
  - **모듈형 CLI 아키텍처**: `cli.ts`를 `src/cli/cli.ts`로 재구성
  - **문서 업데이트**: XPath 와일드카드 예제, 공유 설정 문서, 아키텍처 다이어그램
  - **크로스 플랫폼 지원**: 모든 경로 작업에 Node.js `path` 모듈 사용
  - **변경된 파일**: 11개 파일 (config.ts, browser.ts, helpers.ts, cli.ts, hooks.json 등)

---

## [2.10.7] - 2025-01-04

### 추가됨
- ⚛️ **Browser Pilot v0.3.0**: React/프레임워크 호환성
  - **React Synthetic Event 지원**: 모든 폼 액션이 이제 React synthetic events를 정상적으로 발생시킵니다
    - `fill`, `check`, `uncheck`, `typeText`, `pressKey`가 CDP 좌표 기반 상호작용 방식으로 변경
    - React controlled components 및 기타 최신 프레임워크(Vue, Angular, Svelte)와 완벽하게 작동
    - 비-React 애플리케이션과의 하위 호환성 유지
  - **CDP Input Domain 마이그레이션**: JavaScript 이벤트 시뮬레이션에서 Chrome DevTools Protocol로 변경
    - `fill`: JavaScript 값 할당 → CDP click + Input.insertText 방식으로 변경
    - `check`/`uncheck`: JavaScript 속성 변경 → CDP 마우스 이벤트 방식으로 변경
    - `typeText`: JavaScript KeyboardEvent → CDP Input.insertText (선택적 지연 지원)로 변경
    - `pressKey`: JavaScript KeyboardEvent → CDP Input.dispatchKeyEvent로 변경
  - **모듈형 액션 아키텍처**: actions.ts를 14개의 집중된 모듈로 분할
    - 전문화된 모듈을 포함하는 `actions/` 디렉토리 생성
    - capture.ts, cookies.ts, data.ts, debugging.ts, dialogs.ts, emulation.ts, forms.ts, helpers.ts
    - input.ts, interaction.ts, navigation.ts, network.ts, scroll.ts, tabs.ts, wait.ts
    - 더 나은 유지보수성과 코드 구성
  - **포괄적인 로깅**: 전체 47개 액션에 상세 로깅 포함
    - `ActionOptions` 파라미터에 `verbose: boolean` 추가 (기본값: true)
    - 총 148개 로깅 구문 (함수당 평균 3.1개)
    - 모든 액션의 에러 메시지 개선
  - **기술 세부사항**:
    - 좌표 기반 상호작용으로 React onChange/onClick 핸들러가 정상 발생
    - 모든 폼 상호작용이 React 컴포넌트와 상태 동기화 유지
    - 호환성 깨짐 없음 - 기존 셀렉터 및 파라미터 모두 동일하게 작동

---

## [2.10.6] - 2025-11-03

### 수정됨
- 🔧 **Browser Pilot v0.2.1**: 에러 메시지 및 문서 개선
  - **향상된 에러 메시지**: 에러 메시지에 셀렉터 정보 추가
    - `'Element not found'`에서 `'Element not found: ' + selector`로 변경
    - actions.ts와 actions-extra.ts의 9개 함수에 적용
    - 어떤 셀렉터가 실패했는지 표시하여 디버깅 개선
  - **문서 명확화**: SKILL.md의 CSS/XPath 셀렉터 비교 수정
    - "Complex structure"를 "N-th child element"로 명확화
    - CSS `>` (직계 자식)와 XPath `//` (모든 하위) 차이 설명 추가
    - XPath `/` (단일 슬래시)가 직계 자식 선택에서 CSS `>`와 동등함을 명시

---

## [2.10.5] - 2025-11-03

### 추가됨
- ✨ **Browser Pilot v0.2.0**: 인덱싱을 지원하는 XPath 셀렉터
  - **XPath 셀렉터 지원**: 강력한 텍스트 기반 요소 선택
    - 보이는 텍스트로 요소 선택: `//button[contains(text(), 'Submit')]`
    - 정확한 텍스트로 선택: `//button[text()='Sign In']`
    - 복잡한 XPath 쿼리: `//div[@class='modal']//button[@type='submit']`
    - 모든 요소 상호작용 명령어에서 작동 (click, fill, hover, focus, blur 등)
  - **XPath 인덱싱**: 같은 텍스트를 가진 여러 요소 중 N번째 요소 선택
    - 문법: `(//xpath-expression)[N]` (N은 1부터 시작)
    - 예시: `(//button[contains(text(), 'Add to Cart')])[3]`는 3번째 "Add to Cart" 버튼 선택
    - 중복 요소 중 특정 요소를 선택하는 문제 해결
  - **코드 품질 개선**: 중앙화된 유틸리티로 리팩토링
    - utils.ts에 `getFindElementScript()` 생성
    - actions.ts와 actions-extra.ts의 15개 이상 함수에 적용
    - 요소 찾기 로직의 단일 진실 공급원 확립
  - **향상된 문서화**: SKILL.md에 포괄적인 셀렉터 가이드 추가
    - Selector Types 섹션: CSS vs XPath vs XPath+Indexing
    - 결정 테이블: 각 셀렉터 타입을 언제 사용해야 하는지
    - 실용적인 예제 및 문제 해결 팁
  - **구현 세부사항**:
    - 인덱싱을 위해 `ORDERED_NODE_SNAPSHOT_TYPE`과 `document.evaluate()` 사용
    - `(//xpath)[N]` 문법 감지를 위한 정규식 패턴 매칭
    - 하위 호환성: 기존 CSS 셀렉터는 계속 작동

---

## [2.10.4] - 2025-11-03

### 수정됨
- 🔊 **Sound Notifications v1.4.4**: Node.js Wrapper로 Windows 경로 처리 문제 해결
  - **Windows 경로 문제 해결**: bash 래퍼에서 Node.js 래퍼로 전환
    - Git Bash가 `${CLAUDE_PLUGIN_ROOT}`의 Windows 스타일 경로(`C:\Users\...`)를 해석할 수 없었음
    - Node.js는 내장 `path` 모듈을 통해 Windows 경로를 네이티브하게 처리
    - Git Bash 경로 변환 의존성 제거
  - **크로스 플랫폼 호환성**: Node.js 래퍼가 진정한 크로스 플랫폼 지원 제공
    - Windows: PowerShell 스크립트(`sound-hook.ps1`)로 라우팅
    - macOS/Linux: bash 스크립트(`sound-hook.sh`)로 라우팅
    - 모든 플랫폼에서 일관된 동작
  - **아키텍처 변경**:
    - 제거: `sound-hook-wrapper.sh` (bash 래퍼)
    - 추가: `sound-hook-executor.js` (Node.js 래퍼)
    - 9개 모든 훅이 Node.js executor 사용하도록 업데이트
  - **요구사항**: Node.js v14+ 명시적으로 문서화
    - README에 설치 가이드 추가
    - Node.js 설정 문제 해결 섹션 추가

---

## [2.10.3] - 2025-11-03

### 수정됨
- 🔊 **Sound Notifications v1.4.3**: 중요 버그 수정
  - **PowerShell Lock Cleanup**: try-finally 패턴으로 lock 파일 정리 수정
    - 모든 종료 경로(정상, 조기 반환, 예외)에서 lock 파일 정리
    - temp 디렉토리에 오래된 lock 파일이 쌓이는 문제 방지
  - **Windows Fallback 일관성**: Windows도 Unix처럼 홈 폴더 사용
    - fallback을 `plugin/sounds`에서 `~/.claude/sounds/hook-sound-notifications`로 변경
    - 모든 플랫폼에서 일관된 동작 보장
  - **크로스 플랫폼 설정 호환성**: PowerShell에서 물결표 확장 추가
    - `~/...` 경로를 가진 설정 파일이 Windows에서도 작동
    - Unix 동작과 일치하여 이식 가능한 설정 파일 지원
  - **동적 파일 읽기 강화**: 시스템 파일 필터링 및 확장자 검증
    - 숨김 파일(.DS_Store, Thumbs.db, desktop.ini) 건너뛰기
    - 오디오 파일(.mp3, .wav, .ogg, .m4a, .aac, .flac)만 복사
    - 권한 문제에 대한 에러 처리 개선
  - **이식성 개선**: `bc`를 `awk`로 교체
    - 최소 환경(Alpine Linux, minimal Docker)에서도 작동
    - POSIX 호환, 더 널리 사용 가능

---

## [2.10.1] - 2025-11-03

### 개선됨
- 🔧 **Browser Pilot v0.1.6**: 선택적 URL 파라미터 & 페이지 상태 보존
  - **선택적 URL 파라미터**: URL (`-u, --url`)이 이제 10개 명령어에서 선택사항
    - 명령어: `screenshot`, `click`, `fill`, `extract`, `select`, `check`, `uncheck`, `hover`, `upload`, `drag`
    - URL을 생략하면 현재 페이지에서 새로고침 없이 명령 실행
    - 페이지 상태 보존: 콘솔 로그, 네트워크 데이터, 폼 입력값, JavaScript 상태
  - **필수 Project Root**: `--project-root`가 이제 모든 명령어에서 필수 파라미터
    - 올바른 파일 출력 경로 보장 및 저장 오류 방지
    - 미제공 시 명확한 오류 메시지 표시
  - **다단계 워크플로우 최적화**:
    - 첫 `navigate` 명령만 URL 파라미터 필요
    - 이후 명령들은 새로고침 없이 동일 페이지 재사용
    - 자동화 워크플로우에서 불필요한 페이지 리로드 제거
  - **성능 개선**: 리로드 오버헤드 제거로 워크플로우 시간 단축
  - **개발자 경험**: 페이지 상태가 보존된 채로 명령 체이닝 간소화

---

## [2.10.0] - 2025-11-03

### 개선됨
- 🔊 **Sound Notifications v1.4.0**: 홈 폴더 마이그레이션 & 크로스 플랫폼 지원
  - **홈 폴더 사운드 저장**: 사운드가 이제 `~/.claude/sounds/hook-sound-notifications/`에 저장됨
    - 플러그인 폴더에서 사용자 홈 폴더로 자동 마이그레이션
    - 플러그인 업데이트 시에도 사용자 커스터마이징 보존
    - 업데이트 시 덮어써지지 않음
  - **지능형 마이그레이션 로직**:
    - 신규 사용자: 사운드가 자동으로 홈 폴더에 복사됨
    - 기본 경로 사용 중인 기존 사용자: 홈 폴더로 마이그레이션
    - 커스텀 경로 사용 중인 기존 사용자: 경로 보존 (마이그레이션 안 함)
  - **크로스 플랫폼 훅 지원**:
    - OS 감지 래퍼 추가 (`sound-hook-wrapper.sh`)
    - OS에 따라 적절한 핸들러로 라우팅 (Windows/macOS/Linux)
    - jq 기반 JSON 파싱 및 grep fallback을 사용하는 Unix 사운드 재생
  - **향상된 설정 파싱**:
    - `.plugin-config/hook-sound-notifications.json`에서 설정 읽기
    - 전역 및 훅별 활성화/비활성화 상태 준수
    - 플랫폼별 볼륨 조절 지원 (가능한 경우)
  - **문서화**: 홈 폴더 사용 안내를 포함한 상세 커스터마이징 가이드 추가

---

## [2.8.5] - 2025-11-03

### 개선됨
- 🔧 **Browser Pilot v0.1.5**: Public API 타입 Export
  - **핵심 CDP 인터페이스 공개**: `StackTrace`와 `RemoteObject` 인터페이스를 public으로 변경
    - `StackTrace`는 이제 `ConsoleMessage` public API의 일부로 접근 가능
    - `RemoteObject`는 모듈 간 재사용을 위해 export됨
  - **더 나은 TypeScript API 설계**: 모듈 export 모범 사례 준수
  - **개발자 경험 향상**: 모듈 사용자가 이러한 타입을 직접 사용 가능
  - **타입 안전성**: 외부 코드에서 CDP 타입의 타입 안전한 사용 가능

---

## [2.8.4] - 2025-11-03

### 개선됨
- 🔧 **Browser Pilot v0.1.4**: 인터페이스 재사용을 통한 타입 안전성 강화
  - **FormattedConsoleMessage 인터페이스**: 포맷된 콘솔 메시지 전용 인터페이스 추가
    - `ConsoleMessage` (내부용, `timestamp: number`)와 `FormattedConsoleMessage` (API용, `timestamp: string`) 분리
    - 내부 표현과 포맷된 출력 간 타입 불일치 해결
    - 코드 명확성 향상 및 timestamp 타입 혼동 방지
  - **`any` 타입 제거**:
    - `ConsoleMessage.stackTrace`: `any` → `StackTrace`
    - `LogEntry.stackTrace`: `any` → `StackTrace`
    - `ExceptionDetails.stackTrace`: `any` → `StackTrace`
    - `RemoteObject.value`: `any` → `unknown`
    - `RemoteObject` 인덱스 시그니처: `[key: string]: any` → `[key: string]: unknown`
  - **타입 재사용**: CLI에서 인라인 타입 대신 `FormattedConsoleMessage` import 및 사용
  - **더 나은 타입 안전성**: `any` 대신 `unknown` 사용으로 명시적 타입 체크 강제
  - **유지보수성 향상**: 콘솔 메시지 타입의 단일 진실 공급원

---

## [2.8.3] - 2025-11-03

### 개선됨
- 🔧 **Browser Pilot v0.1.3**: TypeScript 타입 안전성 개선
  - CDP 이벤트 페이로드를 위한 명시적 TypeScript 인터페이스 추가:
    - `LogEntryAddedPayload` - `Log.entryAdded` 이벤트용
    - `ConsoleAPICalledPayload` - `Runtime.consoleAPICalled` 이벤트용
    - `ExceptionThrownPayload` - `Runtime.exceptionThrown` 이벤트용
    - `RemoteObject`, `StackTrace` 지원 인터페이스
  - 이벤트 핸들러의 `params: any`를 타입이 지정된 매개변수로 교체
  - CLI에서 콘솔 메시지 객체에 명시적 타입 주석 추가
  - 코드 유지보수성 및 IDE 자동완성 지원 향상

---

## [2.8.2] - 2025-11-03

### 추가됨
- ✨ **Browser Pilot v0.1.2**: 콘솔 메시지 수집 및 14개 새 CLI 명령
  - **콘솔 메시지 수집**:
    - CDP 이벤트를 통한 실시간 콘솔 메시지 수집
    - `Log.entryAdded`, `Runtime.consoleAPICalled`, `Runtime.exceptionThrown` 캡처
    - 레벨, 텍스트, 타임스탬프, URL, 라인 번호 추적이 포함된 메시지 버퍼
    - 통계: 전체, 에러, 경고, 로그 개수
  - **새 CLI 명령** (14개):
    - `console` - 콘솔 메시지 가져오기 (에러만 보려면 `-e` 옵션)
    - `focus` / `blur` - 요소 포커스/포커스 해제
    - `extract-data` - JSON 셀렉터 매핑으로 여러 데이터 포인트 추출
    - `find` - 요소 찾기 및 상세 정보 가져오기
    - `get-property` - 요소 속성 값 가져오기
    - `switch-tab` - 브라우저 탭 전환
    - `set-cookie` / `delete-cookies` - 쿠키 관리
    - `sleep` - 지정된 밀리초 동안 대기
    - `wait-idle` - 네트워크 유휴 상태 대기
    - `accessibility` - 접근성 트리 가져오기
    - `enable-interception` / `disable-interception` - 요청 가로채기 제어

### 개선됨
- 🔧 **Browser Pilot v0.1.2**: 아키텍처 개선
  - CDPClient가 EventEmitter를 확장하여 적절한 이벤트 처리
  - WebSocket 메시지 핸들러에 영구 이벤트 리스너 추가
  - ChromeBrowser가 콘솔 메시지 버퍼 유지
  - 구현된 48개 함수 모두 CLI를 통해 접근 가능
  - package.json에 모든 명령의 npm 스크립트 단축키 추가
  - SKILL.md에 포괄적인 명령 문서 업데이트

---

## [2.8.1] - 2025-11-03

### 보안
- 🔒 **Browser Pilot v0.1.1**: 추가 XSS 취약점 수정
  - 7개 추가 함수의 템플릿 문자열 주입 취약점 수정
  - 수정된 함수: `pressKey`, `typeText`, `uploadFile`, `getElementProperty`, `findElement`, `scroll`, `dragAndDrop`
  - 안전하지 않은 템플릿 리터럴을 `JSON.stringify()`로 교체하여 적절한 이스케이핑 적용
  - 총 18개 함수가 XSS 공격으로부터 보호됨 (v2.8.0에서 11개 + v2.8.1에서 7개)

### 수정됨
- 📝 **Browser Pilot v0.1.1**: 문서 불일치 수정
  - README 문서에서 `maxAttempts` 예시 (40)가 실제 코드 기본값 (20)과 다른 문제 수정
  - 기본 타임아웃이 10초 (20회 시도 × 500ms)임을 명확히 설명
  - 영문 및 한글 문서 모두 업데이트

---

## [2.8.0] - 2025-11-03

### 추가됨
- ✨ **새 플러그인: Browser Pilot v0.1.0**
  - Chrome DevTools Protocol (CDP) 기반 브라우저 자동화, 웹 스크래핑 및 크롤링
  - 기능:
    - 스크린샷 캡처 및 PDF 생성이 가능한 Headless 브라우저 자동화
    - 폼 자동화 (입력, 클릭, 타이핑, 키 입력)
    - 요소 텍스트 추출을 통한 웹 스크래핑
    - 탭 관리 (목록, 전환, 닫기)
    - 페이지 컨텍스트에서 JavaScript 실행
    - 봇 감지 우회 (`navigator.webdriver = false`)
    - 인간 같은 딜레이를 사용한 멀티 스텝 워크플로우
  - TypeScript로 빌드된 크로스 플랫폼 CLI
  - SessionStart 훅을 통한 자동 초기화
  - `.browser-pilot/` 디렉토리에 파일 저장
  - 워크플로우 예제를 포함한 포괄적인 문서

- ✨ **새 플러그인: Unity Editor Pilot v0.1.0** (🚧 개발 중)
  - WebSocket 기반 Unity Editor 제어 (포트 30090-30099)
  - 계획된 기능:
    - GameObject/Scene/PlayMode 관리
    - Transform 및 컴포넌트 작업
    - 빌드 자동화
  - 상태: 개발 진행 중, 아직 설치 불가

### 수정됨
- 🐛 **Browser Pilot v0.1.0**: 폴링 로직 버그 수정
  - HTTP 응답이 non-OK 상태를 반환할 때 발생할 수 있는 무한 루프 수정
  - 매 반복마다 시도 횟수를 증가시키도록 폴링 로직 변경
  - 이제 10초 후 정상적으로 타임아웃됨 (20회 시도 × 500ms)

- 🐛 **Browser Pilot v0.1.0**: CLI 옵션 처리 개선
  - 수동 `process.argv` 파싱을 Commander.js `preAction` 훅으로 교체
  - 유지보수성 향상 및 라이브러리 모범 사례 준수
  - 명령 실행 전 `--project-root` 옵션이 깔끔하게 처리됨

### 보안
- 🔒 **Browser Pilot v0.1.0**: XSS 취약점 수정
  - 11개 고우선순위 함수의 템플릿 문자열 주입 취약점 수정
  - 안전하지 않은 템플릿 리터럴을 `JSON.stringify()`로 교체하여 적절한 이스케이핑 적용
  - 수정된 함수: `click`, `fill`, `extractText`, `hover`, `focus`, `blur`, `extractData`, `selectOption`, `check`, `uncheck`, `waitFor`
  - 악의적인 선택자나 값을 통한 임의 JavaScript 코드 실행 방지
  - 예시: `selector = "'); alert('XSS'); //"` 형태의 코드 주입이 더 이상 발생하지 않음

---

## [2.7.0] - 2025-11-03

### 추가됨
- ✨ **새 플러그인: Browser Pilot v0.1.0**
  - Chrome DevTools Protocol (CDP) 기반 브라우저 자동화, 웹 스크래핑 및 크롤링
  - 기능:
    - 스크린샷 캡처 및 PDF 생성이 가능한 Headless 브라우저 자동화
    - 폼 자동화 (입력, 클릭, 타이핑, 키 입력)
    - 요소 텍스트 추출을 통한 웹 스크래핑
    - 탭 관리 (목록, 전환, 닫기)
    - 페이지 컨텍스트에서 JavaScript 실행
    - 봇 감지 우회 (`navigator.webdriver = false`)
    - 인간 같은 딜레이를 사용한 멀티 스텝 워크플로우
  - TypeScript로 빌드된 크로스 플랫폼 CLI
  - SessionStart 훅을 통한 자동 초기화
  - `.browser-pilot/` 디렉토리에 파일 저장
  - 워크플로우 예제를 포함한 포괄적인 문서

- ✨ **새 플러그인: Unity Editor Pilot v0.1.0** (🚧 개발 중)
  - WebSocket 기반 Unity Editor 제어 (포트 30090-30099)
  - 계획된 기능:
    - GameObject/Scene/PlayMode 관리
    - Transform 및 컴포넌트 작업
    - 빌드 자동화
  - 상태: 개발 진행 중, 아직 설치 불가

### 수정됨
- 🐛 **Browser Pilot v0.1.0**: 폴링 로직 버그 수정
  - HTTP 응답이 non-OK 상태를 반환할 때 발생할 수 있는 무한 루프 수정
  - 매 반복마다 시도 횟수를 증가시키도록 폴링 로직 변경
  - 이제 10초 후 정상적으로 타임아웃됨 (20회 시도 × 500ms)

- 🐛 **Browser Pilot v0.1.0**: CLI 옵션 처리 개선
  - 수동 `process.argv` 파싱을 Commander.js `preAction` 훅으로 교체
  - 유지보수성 향상 및 라이브러리 모범 사례 준수
  - 명령 실행 전 `--project-root` 옵션이 깔끔하게 처리됨

---

## [2.5.2] - 2025-10-29

### 수정됨
- 🐛 **Sound Notifications v1.0.2**: 설정 파일 경로 버그 수정
  - sound-hook.js가 올바른 설정 파일 로드하도록 수정 (`claude-dev-helper.json` → `hook-sound-notifications.json`)
  - 사운드가 이제 정상적으로 재생됨

---

## [2.5.1] - 2025-10-29

### 수정됨
- 🐛 **Sound Notifications v1.0.1**: 중요 버그 수정
  - plugin.json author 필드 형식 수정 (문자열 → 객체)로 검증 통과
  - init-config.js 훅 선택 로직을 하드코딩된 [0] 대신 동적 find()로 수정
  - SessionStart 사운드 활성화/비활성화 설정이 이제 올바르게 작동

---

## [2.5.0] - 2025-10-29

### 추가됨
- ✨ **새 플러그인: Sound Notifications v1.0.0**
  - Claude Code 훅 이벤트를 위한 독립 사운드 알림 플러그인
  - 9가지 훅 타입 지원: SessionStart, SessionEnd, PreToolUse, PostToolUse, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact
  - 전역 및 훅별 볼륨 조절 기능 (0.0-1.0)
  - 크로스 플랫폼 지원: Windows (VBScript + WMPlayer), macOS (afplay), Linux (mpg123/aplay)
  - 1초 쿨다운을 통한 중복 실행 방지
  - PostToolUse는 불안정성 방지를 위해 기본 비활성화
  - `.plugin-config/hook-sound-notifications.json`을 통한 설정
  - MP3 및 WAV 파일 형식 지원

### 변경됨
- 🔄 **Claude Dev Helper v1.4.0**: 주요 변경사항 - 사운드 알림 제거
  - 사운드 알림 기능이 별도 `hook-sound-notifications` 플러그인으로 이동
  - 핵심 파일 관리 및 Git diff 기능에 집중하도록 간소화
  - sound-hook.js 및 sounds 폴더 제거
  - `soundNotifications` 설정 섹션 제거
  - hooks.json에서 모든 사운드 관련 훅 제거
  - 마이그레이션 필요: 오디오 피드백을 위해 `hook-sound-notifications` 플러그인을 별도로 설치해야 함

### 마이그레이션 가이드
Claude Dev Helper에서 사운드 알림을 사용하고 있었다면:
1. 새 플러그인 설치: `/plugin install hook-sound-notifications@dev-gom-plugins`
2. `.plugin-config/hook-sound-notifications.json`에서 사운드 설정 재구성
3. 이전 사운드 설정은 수동으로 마이그레이션해야 함

---

## [2.4.19] - 2025-10-28

### 수정됨
- 🐛 **Claude Dev Helper v1.2.5**: 설정 마이그레이션 수정
  - init-config.js의 deep merge 로직 수정으로 기존 훅에 새 필드 정상 추가
  - 새로운 `volume` 필드가 모든 훅에 올바르게 추가됨
  - 버전 증가로 기존 사용자의 자동 마이그레이션 트리거
  - v1.2.4 사용자는 다음 세션에서 자동으로 volume 필드 추가됨

---

## [2.4.18] - 2025-10-28

### 추가됨
- 🔊 **Claude Dev Helper v1.2.4**: 사운드 알림 볼륨 조절 기능
  - 전역 볼륨 조절 기능 추가 (0.0 - 1.0)
  - 훅별 개별 볼륨 재정의 기능 추가
  - PreToolUse와 PostToolUse는 기본 0.3 (빈번한 이벤트라 조용하게)
  - 나머지 훅들은 기본 0.5 (50% 볼륨)
  - 플랫폼별 지원:
    - Windows: WMPlayer 볼륨 설정 (0-100)
    - Linux: mpg123 --scale 옵션 (MP3 파일)
    - macOS: afplay (아직 볼륨 조절 미지원)
  - `.plugin-config/claude-dev-helper.json`에서 볼륨 사용자 정의 가능

---

## [2.4.16] - 2025-10-28

### 수정됨
- 🐛 **Claude Dev Helper v1.2.3**: 사운드 경로 설정 수정
  - 사운드 파일 경로가 플러그인 폴더를 자동으로 감지하도록 수정
  - sound-hook.js가 `__dirname`을 사용하여 sounds 폴더 위치 자동 탐지 (설정 불필요)
  - 기본 설정에서 `soundsFolder` 제거 - 플러그인 위치에서 자동 감지
  - 플러그인이 설치된 위치와 관계없이 사운드가 정상 작동
  - 필요시 사용자 정의 `soundsFolder` 경로로 재정의 가능

---

## [2.4.15] - 2025-10-28

### 수정됨
- 🐛 **Claude Dev Helper v1.2.2**: 코드 품질 개선
  - `play-sound.py`의 Flake8 린팅 오류 수정:
    - 적절한 빈 줄 추가 (E302, E305)
    - 줄 길이 위반 수정 (E501)
    - `file_path` 매개변수에 타입 어노테이션 추가
  - 코드 가독성 및 유지보수성 향상

### 변경됨
- 🔧 **Claude Dev Helper v1.2.1**: 동적 hooks.json 업데이트
  - 설정 변경 시 다음 세션 시작 시 `hooks.json`이 자동으로 업데이트됨
  - 사용자는 `.plugin-config/claude-dev-helper.json`만 수정하면 됨 (hooks.json 수동 편집 불필요)
  - `soundNotifications.enabled`가 `false`면 모든 사운드 훅이 자동으로 비활성화됨
  - `soundNotifications.enabled`가 `true`면 개별 훅 설정이 반영됨
  - 설정 변경 감지 시 재시작 안내 표시
  - 사운드 알림이 비활성화되었을 때 불필요한 Node.js 프로세스 오버헤드 제거

---

## [2.4.14] - 2025-10-28

### 추가됨
- 🔔 **Claude Dev Helper v1.2.0**: 모든 훅 이벤트에 대한 사운드 알림
  - **Claude Code의 모든 9가지 훅 타입**에 대한 오디오 피드백:
    - SessionStart, SessionEnd
    - PreToolUse, PostToolUse
    - Notification, UserPromptSubmit
    - Stop, SubagentStop, PreCompact
  - 훅 타입별 사운드 파일 설정 가능
  - 전역 및 훅별 활성화/비활성화 플래그
  - 사운드 폴더 경로 설정 가능 (상대 경로 또는 절대 경로)
  - 크로스 플랫폼 사운드 재생 지원:
    - Windows: PowerShell의 Media.SoundPlayer
    - macOS: afplay (내장)
    - Linux: aplay (WAV) / mpg123 (MP3)
  - 비차단 사운드 재생 (detached process spawning)
  - 비중요 사운드 작업에 대한 자동 실패 처리
  - `.plugin-config/claude-dev-helper.json`에서 설정
  - 성능 영향이 큰 훅 (PreToolUse, PostToolUse)은 기본 비활성화
  - 설정 변경 후 Claude Code 재시작 필요
  - soundeffect-lab.info에서 다운로드한 샘플 사운드 파일 포함
  - 스크립트:
    - `play-sound.js`: 크로스 플랫폼 사운드 재생 유틸리티
    - `sound-hook.js`: 사운드 재생을 위한 훅 진입점
    - `init-config.js`: soundNotifications 기본 설정 추가

---

## [2.4.13] - 2025-10-27

### 수정됨
- 🔧 **Claude Dev Helper v1.1.8 + Extension v1.1.6**: 포커스 유지 문제 완전 해결!
  - **주요 변경**: `showTextDocument` 대신 `vscode.open` 명령어와 `background: true` 옵션 사용
  - 이제 포커스가 제대로 유지됨 - 파일이 백그라운드에서 열리고 포커스를 가져가지 않음
  - `openLocation` 의미 변경: `0` = 첫 번째 컬럼 (왼쪽), `1` = 두 번째 컬럼 (오른쪽)
  - 두 값 모두 명시적 viewColumn 사용 (ViewColumn.One / ViewColumn.Two)
  - VSCode API 권장 방식에 따른 백그라운드 파일 열기 구현
  - Extension v1.1.6 VS Marketplace 업로드 준비 완료

---

## [2.4.12] - 2025-10-27

### 변경됨
- 🔧 **Claude Dev Helper v1.1.7 + Extension v1.1.4**: openLocation을 숫자 값으로 변경
  - 타입 안전성을 위해 `openLocation`을 문자열에서 숫자로 변경 (오타 방지)
  - `0` = current (ViewColumn.Active로 현재 탭에서 열기)
  - `1` = beside (ViewColumn.Two로 분할 뷰에서 열기)
  - 포커스 문제 수정: 'current' 모드에 ViewColumn.Active 추가하여 포커스 정상 유지
  - 기본값: `1` (beside - 기존 동작 유지)

---

## [2.4.11] - 2025-10-27

### 수정됨
- 🔧 **Claude Dev Helper v1.1.6**: 설정 마이그레이션 버그 수정
  - init-config.js의 deep merge 로직 수정으로 새 필드 정상 추가
  - 마이그레이션 시 `openLocation` 필드가 기존 설정 파일에 올바르게 추가됨
  - 기존 사용자의 설정 재마이그레이션을 위해 버전을 1.1.6으로 증가
  - v1.1.5 사용자는 다음 세션에서 자동으로 openLocation 필드 추가됨

---

## [2.4.10] - 2025-10-27

### 추가됨
- 🎯 **Claude Dev Helper v1.1.5 + Extension v1.1.2**: 파일 열기 위치 설정 가능
  - 새로운 `openLocation` 설정 옵션: `'beside'` (분할 뷰) 또는 `'current'` (현재 탭)
  - 기본값: `'beside'` (기존 동작 유지 - 분할 뷰로 열기)
  - `'current'`로 설정하면 현재 에디터 탭에서 파일 열기
  - `.plugin-config/claude-dev-helper.json`으로 설정 가능
  - VSCode 확장이 두 가지 열기 모드 모두 지원하도록 업데이트

---

## [2.4.9] - 2025-10-27

### 수정됨
- 🔧 **Claude Dev Helper v1.1.4**: 포커스 제어를 위해 VSCode 확장 패턴 복원
  - 직접 `code` 명령어에서 VSCode 확장 + 파일 워처 패턴으로 복원
  - 포커스 문제 해결: 파일이 이제 백그라운드에서 열리며 포커스를 가져가지 않음
  - `.claude-dev-helper/open-files.json` 큐 통신 복원
  - `preserveFocus: true` 옵션을 가진 VSCode 확장이 적절한 포커스 제어 제공
  - **참고**: 자동 파일 열기 기능을 위해 VSCode 확장 설치 필요

---

## [2.4.8] - 2025-10-27

### 변경됨
- 🔧 **Claude Dev Helper v1.1.3**: 자동 파일 열기 구현 단순화
  - VSCode 확장 의존성을 제거하고 직접 `code` 명령어 실행으로 변경
  - `exec`로 `code -r "파일경로"` 실행하여 백그라운드에서 파일 열기
  - `.claude-dev-helper/open-files.json` 및 파일 워처 더 이상 불필요
  - 단순화된 아키텍처: 훅 스크립트 → code CLI → VSCode
  - Windows/Unix/Linux 크로스 플랫폼 경로 정규화
  - VSCode 확장 별도 설치 불필요

---

## [2.4.7] - 2025-10-27

### 수정됨
- 🔧 **Claude Dev Helper v1.1.2**: 자동 파일 열기 stdin 파싱 수정
  - PostToolUse 훅의 stdin 데이터 구조 파싱 수정
  - `toolUse.parameters.file_path`에서 `input.tool_input.file_path`로 수정
  - Write 및 Edit 작업에 대한 `tool_name` 검증 추가
  - hook-auto-open-file 플러그인 패턴과 일치
  - 무음 작동을 위한 불필요한 콘솔 로깅 제거

---

## [2.4.6] - 2025-10-27

### 수정됨
- 🔧 **Claude Dev Helper v1.1.1**: 플러그인 매니페스트 검증 오류 수정
  - plugin.json에서 지원되지 않는 `requirements` 키 제거
  - "Unrecognized key(s) in object: 'requirements'" 검증 오류 수정
  - 플러그인이 매니페스트 오류 없이 정상 로드됨

---

## [2.4.5] - 2025-10-27

### 추가됨
- 🔧 **Claude Dev Helper v1.1.0**: 자동 파일 열기 기능
  - Claude가 파일을 생성하거나 수정하면 VSCode에서 자동으로 열림
  - 프로젝트 루트의 `.plugin-config/claude-dev-helper.json`으로 설정 가능
  - 설정: enabled (기본값: true), focus (기본값: false), maxQueueSize (기본값: 10)
  - SessionStart 훅이 기본값으로 config 초기화
  - VSCode Extension v1.1.0 VS Marketplace에 퍼블리시
  - `.claude-dev-helper/open-files.json`과 파일 워처 통합
  - 백그라운드 열기 지원 (포커스 안 가져감)

---

## [2.4.4] - 2025-10-22

### 추가됨
- 🧪 **Unity Dev Toolkit v1.4.0**: 새로운 테스트 자동화 스킬
  - Unity Test Framework 자동 실행 및 분석을 위한 `unity-test-runner` 스킬 추가
  - 크로스 플랫폼 Unity 에디터 감지 (Windows/macOS/Linux)
  - Unity CLI를 통한 EditMode 및 PlayMode 테스트 실행
  - 상세한 실패 분석 기능을 갖춘 NUnit XML 결과 파싱
  - 6가지 일반적인 실패 카테고리에 대한 스마트 테스트 패턴 매칭
  - 빠른 탐색을 위한 실패 리포트의 파일:라인 참조
  - 에디터 감지 및 테스트 결과 파싱용 Node.js 스크립트
  - NUnit assertions 및 Unity 특화 패턴을 포함한 종합 테스트 패턴 데이터베이스

---

## [2.4.3] - 2025-10-22

### 추가됨
- 🔧 **Unity Dev Toolkit v1.3.0**: 새로운 컴파일 에러 해결 스킬
  - C# 컴파일 에러 자동 감지 및 해결을 위한 `unity-compile-fixer` 스킬 추가
  - 실시간 에러 감지를 위한 VSCode diagnostics 통합 (OmniSharp)
  - Unity C# 에러 패턴 종합 데이터베이스 포함 (CS0246, CS0029, CS1061 등)
  - 에러 분석 기반 스마트 컨텍스트 인식 수정 제안
  - Unity .meta 파일 충돌 감지 및 버전 관리 통합
  - VSCode diagnostics 처리를 위한 Node.js 분석 스크립트 포함

---

## [2.4.2] - 2025-10-21

### 수정됨
- 🔒 **Auto Release Manager v1.0.3**: 향상된 오류 처리
  - detect_project.py 및 sync_unity_version.py에 UnicodeDecodeError 처리 추가
  - 잘못된 형식이거나 UTF-8로 인코딩되지 않은 파일을 만났을 때 스크립트 충돌 방지

---

## [2.4.1] - 2025-10-21

### 수정됨
- 🔧 **Auto Release Manager v1.0.2**: 코드 품질 및 문서 개선
  - Unreal Engine 버전 감지 우선순위 수정
  - 구체적인 예외 타입으로 오류 처리 개선
  - 모든 문서에서 Python 버전 요구사항을 3.11+로 업데이트
  - plugin.json skills 배열 설정 수정

---

## [2.4.0] - 2025-10-21

### 추가됨
- 🎉 **새 플러그인**: Auto Release Manager - 모든 프로젝트 타입의 버전 업데이트 및 릴리즈 자동화
  - 범용 프로젝트 타입 감지 (Node.js, Python, Rust, Go, Unity, Unreal 등)
  - 크로스 플랫폼 버전 업데이트 스크립트
  - Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)
  - Unreal Engine .uproject 지원
  - Conventional Commits에서 CHANGELOG 자동 생성
  - Git 워크플로우 자동화
  - Python 3.11+ 외부 의존성 제로

---

## Spec-Kit 통합

### [2.3.2] - 2025-10-21

#### 수정됨
- 모호한 지시("필요시", "선택적")로 인한 AskUserQuestion 도구 미호출 문제 해결
- Step 4.2 최소 옵션 요구사항 위반 (1개 → 2개 필수)

#### 추가됨
- 모든 제약사항을 포함한 명시적 AskUserQuestion 도구 사용 가이드라인 섹션
- 모든 사용자 상호작용 지점에 MUST 지시 추가 (Step 1-B, 1-C, Step 2, Step 4.2, What's Next)
- 모든 섹션에 체크마크(✅)로 도구 제약사항 검증 표시
- 시스템의 "Other" 옵션 자동 추가에 대한 명확한 문서화

#### 변경됨
- Step 4.2 헤더를 "(선택적)"에서 필수로 변경
- 2-4개 옵션 요구사항 충족을 위해 "요구사항 추가" 옵션 추가

### [2.3.1] - 2025-10-21

#### 변경됨
- tasks 커맨드의 rigid AskUserQuestion JSON 구조 제거
- Claude가 컨텍스트에 따라 자율적으로 질문 결정
- 더 유연한 대화 흐름으로 사용자 경험 개선
- Step 1 (Git 변경사항), Step 2 (업데이트 모드), What's Next 섹션의 유연성 향상

### v2.3.0 (2025-10-21)
- 🚀 **토큰 효율성 최적화**: `/spec-kit:tasks` 커맨드 워크플로우 완전 재설계
  - 중복 정보 수집 제거 (Step 4-7) - CLI가 spec.md와 plan.md를 직접 자동 파싱
  - draft 파일 요구사항 제거 - CLI가 원본 문서 직접 읽기
  - 코드 라인 415줄에서 ~270줄로 감소 (35% 축소)
  - 플러그인은 사전 검증 및 추가 컨텍스트 수집에만 집중
  - **토큰 절약**: 중복 질문 제거로 ~50% 절감
  - **사용자 경험**: 최소 질문 (필요시에만 추가 컨텍스트)
- 🎯 **CLI 자동 생성**: GitHub Spec-Kit CLI의 자동 파싱 기능 100% 활용
  - spec.md에서 사용자 스토리, 우선순위, 수용 기준 자동 추출
  - plan.md에서 기술 스택, 라이브러리, 구현 전략 자동 추출
  - 사용자 스토리 phase별 자동 작업 생성 (P1, P2, P3...)
  - 의존성 매핑 및 병렬 실행 가능 작업 자동 식별
- ✨ **선택적 컨텍스트 수집**: 사용자가 다음을 선택 가능:
  - 특정 작업 포함
  - 특정 작업 제외
  - 우선순위 조정
  - 시간 제약 지정
  - 테스트 전략 선호
  - 또는 추가 입력 없이 자동 생성 (권장)

### v2.2.0 (2025-10-20)
- ✨ **SlashCommand 도구 통합**: 8개 커맨드 파일 모두에서 SlashCommand 도구를 명시적으로 사용하도록 개선 (중요 경고 추가)
- 🚀 **Git 설정 워크플로우**: init 커맨드에 포괄적인 Git 설치 및 GitHub 설정 추가
  - OS에 따라 Git 자동 감지 및 설치 (Windows/macOS/Linux)
  - Git 사용자 정보 대화식 설정
  - GitHub CLI 설치 및 인증
  - `gh repo create --private`로 Private 리포지토리 생성
- 📝 **Phase 기반 Draft 파일명**: implement 커맨드가 phase와 task ID를 포함한 draft 파일 생성
  - 형식: `[phase]-[task-id]-[slug]-draft.md` (예: `p2-t010-currency-draft.md`)
  - 크로스 플랫폼 호환성을 위한 영문 전용 slug 생성
  - 더 나은 파일 구성 및 작업 추적

### v2.0.4 (2025-10-19)
- 🐛 **버그 수정**: SlashCommand 형식 수정 - 8개 명령어 파일 모두에서 명령어와 INSTRUCTION을 한 줄로 통합
- 📝 **명확성 개선**: `/speckit.*` 명령어와 INSTRUCTION 파라미터 사이의 모호한 줄바꿈 제거
- 📝 **문서화**: INSTRUCTION 블록 명확화 - 모호한 "Use if clarification needed" 대신 "AskUserQuestion tool" 명시
- 🔄 **워크플로우 개선**: `/spec-kit:specify` 실행 전 Git 변경사항 확인 및 커밋 프롬프트 추가
- 🚀 **Git 통합 강화**: `/speckit.specify` 명세 작성 후 브랜치 퍼블리쉬 여부 선택 기능
- ♻️ **역할 분리**: 플러그인 커맨드에서 PowerShell 실행 제거로 워크플로우 명확화

### v2.0.3 (2025-10-19)
- 🐛 **버그 수정**: 모든 커맨드 파일에서 중복된 `CURRENT_BRANCH` 선언 제거
- 📝 **문서화**: `/spec-kit:*`와 `/speckit.*` 혼동 방지를 위한 커맨드 구분 경고 추가

### v2.0.2 (2025-10-19)
- 📝 **문서화**: 모든 커맨드 INSTRUCTION에 AskUserQuestion 도구 사용 지침 추가

### v2.0.1 (2025-10-19)
- 🐛 **버그 수정**: clarify 명령어의 draft 파일 경로를 브랜치 기반 구조로 수정

### v2.0.0 (2025-10-19)
- 🔄 **브랜치 기반 워크플로우**: 브랜치별 기능 명세를 지원하는 완전한 구조 개편
- 📁 **경로 변경**: 기능 파일을 `.specify/memory/`에서 `specs/[브랜치명]/` 구조로 마이그레이션
- ✨ **워크플로우 선택**: `/spec-kit:specify` 명령어가 새 명세 생성 또는 기존 명세 재작성 선택 제공
- 🔗 **PowerShell 통합**: 자동 브랜치 생성을 위한 `create-new-feature.ps1` 스크립트 통합
- 🎯 **브랜치 감지**: 모든 명령어가 현재 브랜치를 자동 감지하고 올바른 명세 파일로 작업
- 📋 **다음 단계 안내**: 모든 명령어에 워크플로우 탐색을 위한 AskUserQuestion 프롬프트 추가
- ⚠️ **주요 변경사항**: 기존 v1.x 사용자는 명세를 새로운 브랜치 기반 구조로 마이그레이션 필요

### v1.7.0 (2025-10-19)
- 🔄 **다음 단계 제안**: 모든 명령어가 완료 후 AskUserQuestion을 사용하여 다음 작업 제안
- 🎯 **워크플로우 가이드**: 각 명령어가 컨텍스트에 맞는 다음 단계 제안 (예: specify → clarify/plan, tasks → implement)
- 📋 **스마트 내비게이션**: 워크플로우 계속, 파일 검토, 세션 종료 중 선택 가능
- 💡 **향상된 사용자 경험**: 다음 작업 선택을 위한 명확한 시각적 옵션 카드
- 🚀 **매끄러운 워크플로우**: 전체 SDD 프로세스를 안내하여 마찰 감소

### v1.6.0 (2025-10-18)
- 🤝 **대화형 사용자 프롬프트**: 모든 명령어가 AskUserQuestion을 사용하여 향상된 사용자 상호작용 제공
- 🔄 **업데이트 모드 선택**: specify, plan, tasks 명령어가 완전 재생성 또는 부분 업데이트 중 선택 요청
- ⚠️ **스마트 경고**: implement 명령어가 Open Questions에 대해 경고하고 clarify 먼저 실행 제안
- 📋 **이슈 우선순위 지정**: clarify 명령어가 명확화할 모호한 항목 선택 가능
- 🎯 **개선된 UX**: 텍스트 기반 프롬프트를 명확한 설명이 있는 시각적 옵션 카드로 대체

### v1.5.0 (2025-10-18)
- 📊 **프로젝트 상태 표시**: 재초기화 취소 시 현재 프로젝트 구조와 진행 상황 표시
- 🗺️ **스마트 내비게이션**: 기존 파일(헌법, 명세, 계획, 작업) 분석 후 다음 단계 추천
- 🎯 **상황별 안내**: 완료된 단계를 보여주고 적절한 다음 명령어 제안
- 💡 **워크플로우 명확성**: 사용자가 SDD 워크플로우에서 현재 위치를 파악할 수 있도록 지원

### v1.4.0 (2025-10-18)
- 🔄 **재초기화 확인**: `/spec-kit:init` 명령어가 기존 설치를 감지하고 재초기화 전 사용자 확인 요청
- 📝 **명령어 인자 지원**: 모든 명령어가 `$ARGUMENTS`를 통한 사용자 입력 수용
- 🏷️ **인자 힌트**: 모든 명령어에 이중 언어(한글/영문) 인자 힌트 추가로 UX 개선
- 🌐 **향상된 사용자 입력**: 명령어를 인라인 인자와 함께 호출 가능 (예: `/spec-kit:specify 사용자 인증 추가`)

### v1.3.0 (2025-10-18)
- 🔄 **업데이트 모드 선택(Update Mode Selection)**: 모든 핵심 명령어가 기존 파일을 감지하고 두 가지 업데이트 옵션 제공
- 📋 **완전 재생성(Full Regeneration)**: 요구사항이 크게 변경되었을 때 처음부터 완전히 재작성
- ✏️ **부분 업데이트(Incremental Update)**: 특정 변경사항만 타겟팅하는 병합 기반 업데이트
- 📖 **반복적 워크플로우 문서화(Iterative Workflow Documentation)**: 이전 단계를 언제 어떻게 업데이트할지에 대한 종합 가이드
- 🎯 **컨텍스트 보존(Context Preservation)**: 명령어 재실행 시 대화 이력과 변경 이유 유지
- ⚡ **계단식 업데이트(Cascade Updates)**: 변경 후 하위 단계 업데이트에 대한 명확한 가이드

### v1.2.0 (2025-10-18)
- ✨ **스마트 사전 체크(Smart Prerequisite Checks)**: `/spec-kit:plan`, `/spec-kit:tasks`, `/spec-kit:implement` 명령어에서 미해결 질문(Open Questions) 자동 감지
- 🎨 **통합 커밋 플로우(Unified Commit Flow)**: 3가지 명확한 옵션이 있는 단일 결정 포인트 (품질 게이트 + 커밋 / 바로 커밋 / 건너뛰기)
- 📋 **더 나은 UX**: 각 커밋 옵션에 대한 상황별 적절한 안내
- 🛡️ **오류 방지**: 진행하기 전에 불명확한 요구사항에 대해 경고
- 📖 **문서화**: README에 포괄적인 "스마트 사전 체크" 섹션 추가

### v1.1.0 (2025-10-17)
- ✨ **토큰 효율성**: draft 파일을 사용하는 2계층 아키텍처 구현
- 🚀 **성능**: 전체 내용 대신 파일 경로 사용으로 토큰 사용량 감소
- 📁 **Draft 시스템**: 모든 명령어가 `.specify/temp/`에 재사용 가능한 draft 파일 생성
- 📝 **지시사항**: 각 명령어마다 중복 단계를 건너뛰는 정확한 지시사항 추가
- 🌐 **다국어**: 모든 명령어에 대한 시스템 언어 감지 개선

### v1.0.0 (2025-10-16)
- 🎉 최초 릴리스
- 📋 완전한 SDD 워크플로우를 위한 10개 슬래시 명령어
- 🔧 GitHub Spec-Kit CLI와의 통합

---

## AI Pair Programming Suite

### v1.1.1 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위 지정**: 충돌 방지를 위해 상태 및 출력 파일에 프로젝트 이름 사용
- 🎯 **SessionStart 훅**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태이면 SessionStart 훅이 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 호환성을 위한 경로 처리 개선

### v1.0.0 (2025-10-15)
- 🎉 최초 릴리스
- 💬 5개 슬래시 커맨드: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4개 전문 에이전트: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3개 지능형 훅: Edit/Write 시 코드 리뷰, 버그 감지, 세션 요약
- 🎨 모든 플러그인을 위한 설정 시스템

---

## TODO Collector

### v1.2.0 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위**: 상태 파일에 프로젝트 이름 사용으로 충돌 방지
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚙️ **커스텀 필터링**: includeDirs 및 includeExtensions 설정 추가
- 🔍 **전체 프로젝트 스캔**: 첫 실행 시 전체 프로젝트 자동 스캔
- 🔧 **설정 리팩토링**: 설정을 `.plugin-config/hook-todo-collector.json`으로 이동
- 📝 **버그 수정**: 파일 수정이 없을 때 리포트가 생성되지 않는 문제 수정
- 🐛 **버그 수정**: 전체 스캔 로직 개선 - 리포트 파일이 없을 때 즉시 스캔

### v1.1.1 (2025-10-18)
- 🐛 **버그 수정**: `outputFormats` 설정의 빈 배열 처리 수정

### v1.1.0 (2025-10-18)
- 📛 **프로젝트명 파일**: 모든 생성 파일에 프로젝트 이름 포함하여 여러 프로젝트 간 충돌 방지

### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔗 TODO 리포트에 클릭 가능한 파일 링크
- 📝 다양한 코멘트 타입 지원 (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 통계가 포함된 상세한 마크다운 리포트
- 🎯 마크다운 헤더 건너뛰기로 오탐 방지
- 🌐 다국어 지원

---

## 훅 플러그인들 (모든 훅 플러그인)

### v1.1.1 (2025-10-20) - 모든 훅 플러그인
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위**: 상태 및 출력 파일에 프로젝트 이름 사용으로 충돌 방지
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리
- 🔍 **Complexity Monitor**: 선택적 스캔을 위한 includeDirs, excludeDirs, includeExtensions, excludeExtensions 설정 추가
- 🐛 **버그 수정 - Complexity Monitor v1.1.1**: 복잡도 로그 파일이 없을 때 전체 프로젝트 스캔 수행

### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **프로젝트명이 포함된 출력 파일**: 모든 생성 파일에 프로젝트 이름을 포함하여 여러 프로젝트 간 충돌 방지
- 🏷️ **파일 명명 규칙**: `.complexity-log.md`에서 `.{프로젝트명}-complexity-log.md`로 변경 (모든 훅 동일)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 각 프로젝트의 추적 파일이 플러그인 `.state` 디렉토리에 분리 저장

### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔄 **Git Auto-Backup**: 세션 종료 후 자동 git 커밋
- 📊 **Complexity Monitor**: 설정 가능한 임계값으로 코드 복잡도 추적
- 📝 **Auto-Docs**: 프로젝트 구조 자동 문서화
- 📋 **Session Summary**: 세션 동안 모든 파일 작업 추적
- ⚙️ `.plugin-config/` 파일을 통한 설정 가능
- 🔇 `showLogs` 설정으로 선택적 로그 표시

---

## Auto-Docs

### v1.4.1 (2025-10-20)
- ✨ **개선**: 여러 디렉토리 포함 시 통합된 트리 구조로 표시
- 🐛 **버그 수정**: 출력 파일 삭제 시 문서 재생성
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리

### v1.4.0 (2025-10-18)
- 📁 **빈 디렉토리 제어**: 빈 디렉토리 포함 여부를 제어하는 `includeEmptyDirs` 설정 옵션 추가
- 🐛 **버그 수정**: 두 확장자 필터가 모두 활성화된 경우 둘 다 표시하도록 수정

### v1.3.0 (2025-10-18)
- 📄 **파일 확장자 필터링**: `includeExtensions`와 `excludeExtensions` 설정 옵션 추가
- 🎯 **선택적 파일 포함**: 특정 파일 타입만 포함 (예: `.js`, `.ts`, `.json`)
- 🚫 **파일 타입 제외**: 원하지 않는 파일 타입 제외 (예: `.meta`, `.log`, `.tmp`)
- 🔧 **유연한 설정**: 확장자를 점 포함/제외하고 지정 가능 (`.meta` 또는 `meta`)
- 📋 **AND 조건**: 두 필터가 함께 작동하여 세밀한 제어 제공 (먼저 포함, 그 다음 제외)
- 💡 **사용 사례**: 소스 코드만 집중, 빌드 산출물 제외, 메타데이터 파일 숨기기

### v1.2.0 (2025-10-18)
- 📛 **프로젝트명이 포함된 출력 파일**: 생성 파일에 프로젝트 이름 포함 (`.{프로젝트명}-project-structure.md`)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 플러그인 디렉토리에 프로젝트별 상태 파일 저장

### v1.1.0 (2025-10-18)
- 📁 **선택적 디렉토리 스캔**: 특정 디렉토리만 스캔할 수 있는 `includeDirs` 설정 추가
- 🎯 **집중된 문서화**: 전체 프로젝트가 아닌 선택된 폴더만 프로젝트 구조 생성
- ⚙️ **설정 우선순위**: `includeDirs`가 설정되면 `excludeDirs`보다 우선 적용
- 📚 **대규모 프로젝트 지원**: 대규모 코드베이스의 특정 부분만 문서화할 때 유용
- 🌐 **다국어 문서화**: 영문 및 한글 README 모두 업데이트

---

## Unity Dev Toolkit

### v1.3.0 (2025-10-22)
- 🔧 **새 Skill 추가**: C# 컴파일 에러 자동 감지 및 해결을 위한 `unity-compile-fixer` Skill 추가
- 🔍 **VSCode 통합**: 실시간 에러 감지를 위해 VSCode diagnostics (OmniSharp) 활용
- 📊 **에러 패턴 데이터베이스**: Unity C# 에러 패턴 종합 데이터베이스 포함 (CS0246, CS0029, CS1061 등)
- 💡 **스마트 솔루션**: 에러 분석 기반 컨텍스트 인식 수정 제안
- ✅ **VCS 지원**: Unity .meta 파일 충돌 및 버전 관리 통합 처리
- 📝 **분석 스크립트**: VSCode diagnostics 처리를 위한 Node.js 스크립트 포함

### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit 템플릿**: Editor와 Runtime 모두를 위한 완전한 UI Toolkit 템플릿 추가 (총 6개 파일)
- 📝 **Editor 템플릿**: UXML/USS를 사용한 EditorWindow (C#, UXML, USS)
- 🎮 **Runtime 템플릿**: UXML/USS를 사용한 게임 UI용 UIDocument (C#, UXML, USS)
- ⚡ **새 Skill 추가**: UI Toolkit 개발 지원을 위한 `unity-uitoolkit` Skill 추가
- 📚 **템플릿 개수**: 7개에서 10개의 프로덕션 수준 템플릿으로 증가
- 🔗 **크로스 참조**: 새로운 UI Toolkit 기능 참조를 위해 Skills 업데이트

### v1.1.0 (2025-10-18)
- 🤖 **새 Agent 추가**: 코드 리팩토링 및 품질 개선을 위한 `@unity-refactor` Agent 추가
- 📝 **Skills 향상**: 모든 Skills에 "When to Use vs Other Components" 섹션 추가
- 🔗 **컴포넌트 통합**: Skills vs Agents vs Commands 사용 시기에 대한 명확한 가이드
- 📚 **문서화**: 컴포넌트 간 참조 및 사용 패턴 개선

### v1.0.1 (2025-10-18)
- 📝 **Skill 문서 최적화**: SKILL.md 파일 간소화 (834 → 197 라인, 76% 감소)
- 🎯 **Progressive Disclosure**: 간결한 스킬 문서화를 위한 모범 사례 적용
- 🗑️ **중복 제거**: "When to Use This Skill" 섹션 제거 (스킬 활성화는 description 필드로 결정됨)
- ⚡ **토큰 효율성**: 더 빠른 스킬 로딩 및 활성화를 위한 컨텍스트 크기 감소

### v1.0.0 (2025-10-18)
- 🎉 최초 릴리스
- 📝 3개 슬래시 커맨드: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3개 전문 에이전트: `@unity-scripter`, `@unity-performance`, `@unity-architect` (v1.1.0에서 4개로 확장)
- ⚡ 4개 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (v1.2.0에서 5개로 확장)
- 📄 MonoBehaviour, ScriptableObject, Editor, Test 스크립트를 위한 프로덕션 수준 템플릿

---

## Auto Release Manager

### v1.0.3 (2025-10-21)

#### 수정됨
- 🔒 **오류 처리**: 더 나은 강건성을 위해 UnicodeDecodeError 처리 추가
  - `detect_project.py`: Unreal Engine .uproject 파일의 UTF-8 디코딩 오류 처리
  - `sync_unity_version.py`: Unity 파일의 UTF-8 디코딩 오류 처리
  - 잘못된 형식이거나 UTF-8로 인코딩되지 않은 파일을 만났을 때 스크립트 충돌 방지

### v1.0.2 (2025-10-21)

#### 수정됨
- 🔧 **Unreal Engine 버전 우선순위**: `EngineAssociation` 대신 `Version`을 우선하도록 버전 감지 수정
  - 이제 엔진 버전 대신 프로젝트 버전을 올바르게 읽음
  - unreal-guide.md 문서와 일치하도록 수정
- 🐛 **예외 처리**: 구체적인 예외로 오류 처리 개선
  - detect_project.py에서 `except BaseException`을 `except (json.JSONDecodeError, IOError)`로 변경
  - sync_unity_version.py에서 `except Exception`을 `except (json.JSONDecodeError, IOError)`로 변경
- 📝 **코드 가독성**: git_operations.py에서 `chr(10)`을 `'\n'`으로 교체
- 🔧 **플러그인 설정**: plugin.json의 skills 배열을 실제 스킬 이름으로 수정

#### 문서화
- 📚 **일관성**: 모든 문서 파일에서 Python 버전 요구사항을 3.8+에서 3.11+로 업데이트

### v1.0.1 (2025-10-21)

#### 변경됨
- 📦 **Python 3.11+ 요구사항**: Python 3.11+ 요구로 tomli 의존성 제거
  - TOML 파싱을 위해 내장 `tomllib` 사용
  - 명확한 오류 메시지와 함께 Python 버전 체크 추가
  - 모든 스크립트에 대한 외부 의존성 제로

#### 수정됨
- 🔧 **타입 힌트**: 5개 Python 스크립트의 모든 타입 어노테이션 수정
  - 모든 Dict, List, Optional 타입에 타입 매개변수 추가
  - `subprocess.CompletedProcess[str]` 타입 힌트 수정
  - 모든 Pylance 및 mypy 경고 해결
- 📏 **코드 품질**: 모든 PEP 8 린터 오류 수정
  - E501 라인 길이 위반 수정 (79자 제한)
  - 코드 포맷팅 일관성 개선
  - 모든 변수에 타입 힌트 추가

#### 문서화
- 📝 **요구사항**: README.md 및 README.ko.md에 Python 3.11+ 요구사항 추가
- 📚 **명확성**: 명확한 버전 요구사항과 함께 설치 지침 업데이트

### v1.0.0 (2025-01-20)
- 🎉 최초 릴리스
- 🔍 범용 프로젝트 타입 감지 (Node.js, Python, Rust, Go, Unity, Unreal 등)
- 📝 크로스 플랫폼 버전 업데이트 스크립트
- 🔄 Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)
- 🎮 Unreal Engine .uproject 지원
- 📋 Conventional Commits에서 CHANGELOG 자동 생성
- 🚀 Git 워크플로우 자동화
- 📚 포괄적인 문서 및 가이드
