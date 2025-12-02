# 변경 이력

Unity Editor Toolkit의 모든 주요 변경 사항을 이 파일에 기록합니다.

이 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 기반으로 하며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## [0.15.1] - 2025-12-02

### 추가
- **버전 체크 기능**: Unity Editor 창에서 업데이트 확인
  - "Check for Updates" 버튼으로 GitHub에서 최신 버전 확인
  - "Open GitHub Releases" 버튼으로 릴리즈 페이지 빠른 접근
  - 로컬 버전 vs 최신 버전 비교 및 업데이트 상태 표시
  - GitHub raw URL에 비동기 HTTP 요청으로 실시간 버전 확인

### 변경
- **문서**: Unity 패키지 설치 가이드 업데이트
  - 의존성 패키지 설치 단계 추가 (UniTask, unity-sqlite-net)
  - 패키지 업데이트 안내 추가
  - 루트 CHANGELOG 파일 제거 (릴리즈 노트는 GitHub Releases에서 확인)

## [0.13.0] - 2025-12-02

### 추가
- **Shader 명령어** (7개 신규)
  - `shader list` - 프로젝트 내 모든 셰이더 목록
  - `shader find` - 이름으로 셰이더 검색
  - `shader properties` - 셰이더 속성 조회
  - `shader keywords` - 전역/셰이더 키워드 목록
  - `shader keyword-enable` - 전역 셰이더 키워드 활성화
  - `shader keyword-disable` - 전역 셰이더 키워드 비활성화
  - `shader keyword-status` - 키워드 활성화 상태 확인
- **문서**
  - `COMMANDS_MATERIAL.md` - Material 명령어 레퍼런스 (9개)
  - `COMMANDS_SHADER.md` - Shader 명령어 레퍼런스 (7개)

### 수정
- **Console 버그**: Warning 로그가 기본적으로 표시됨 (`includeWarnings` 기본값 `true`로 변경)
- **데이터베이스 히스토리 삭제**: 클리어 시 SQLite 데이터베이스에서 커맨드 히스토리가 정상적으로 삭제됨
- **프로젝트별 데이터베이스 분리**: 각 Unity 프로젝트가 공유 persistent 경로 대신 `Library/UnityEditorToolkit/` 폴더에 고유한 데이터베이스 파일 사용

### 변경
- 총 명령어 수 58개에서 86개로 증가
- Phase 2 상태 반영하여 문서 업데이트

## [0.12.1] - 2025-12-01

### 수정
- 컴파일 충돌 방지를 위해 Logger 클래스를 ToolkitLogger로 이름 변경

## [0.12.0] - 2025-11-30

### 추가
- Material 명령어 (9개)
- Animation 명령어
- Editor 명령어 확장

## [0.11.0] - 2025-11-28

### 추가
- Prefab 명령어 (12개)
- Asset 관리 명령어 (9개)

## [0.10.0] - 2025-11-25

### 추가
- Component 명령어 (10개)
- Menu 실행 명령어 (2개)

## [0.9.0] - 2025-11-22

### 추가
- SQLite 데이터베이스 통합
- GUID 기반 GameObject 영속성
- 멀티씬 동기화
- 실행 취소/다시 실행이 있는 Command Pattern

## [0.8.0] - 2025-11-19

### 추가
- 최초 실험 릴리즈
- 핵심 명령어: GameObject, Transform, Scene, Console, Wait, Chain
- JSON-RPC 2.0을 사용하는 WebSocket 서버
- EditorPrefs 관리
