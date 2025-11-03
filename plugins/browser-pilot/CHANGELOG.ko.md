# 변경 이력

Browser Pilot의 주요 변경 사항을 이 파일에 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

## [0.3.0] - 2025-01-04

### 추가
- **React/프레임워크 호환성**: 모든 폼 액션이 이제 React synthetic events를 정상적으로 발생시킵니다
  - `fill`, `check`, `uncheck`, `typeText`, `pressKey`가 CDP 좌표 기반 상호작용 방식으로 변경
  - React controlled components 및 기타 최신 프레임워크와 완벽하게 작동
  - 비-React 애플리케이션과의 하위 호환성 유지

### 변경
- **액션 구현 개선**:
  - `fill`: JavaScript 값 할당 → CDP click + Input.insertText 방식으로 변경
  - `check`/`uncheck`: JavaScript 속성 변경 → CDP 마우스 이벤트 방식으로 변경
  - `typeText`: JavaScript KeyboardEvent → CDP Input.insertText (선택적 지연 지원)로 변경
  - `pressKey`: JavaScript KeyboardEvent → CDP Input.dispatchKeyEvent로 변경
- 전체 47개 액션에 ActionOptions 파라미터와 상세 로깅 추가
- 모든 액션의 에러 메시지 및 로깅 개선

### 기술 세부사항
- 액션들이 이제 Chrome DevTools Protocol (CDP) Input 도메인을 사용하여 적절한 이벤트 시뮬레이션
- 좌표 기반 상호작용으로 React onChange/onClick 핸들러가 정상 발생
- 모든 폼 상호작용이 React 컴포넌트와 상태 동기화 유지
- 호환성 깨짐 없음 - 기존 셀렉터 및 파라미터 모두 동일하게 작동

## [0.2.1] - 이전 릴리즈

### 기능
- XPath 셀렉터 지원 (인덱싱 포함)
- 봇 감지 우회 (navigator.webdriver = false)
- 44개 이상의 브라우저 자동화 액션
- 스크린샷, PDF 생성
- 폼 작성, 요소 상호작용
- 탭 관리, 쿠키 제어
- 콘솔 메시지 캡처
- 네트워크 인터셉션
