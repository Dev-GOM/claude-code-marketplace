# Unity Editor Toolkit

> **⚠️ 상태**: 🧪 실험 단계 (v0.15.1) - **Unity 6+ 필수**
>
> **이 플러그인은 현재 실험 단계입니다. API와 기능이 변경될 수 있습니다.**
> **데이터베이스 기능은 Unity 6 이상이 필요합니다** (내장 SQLite, 별도 설치 불필요)

SQLite 데이터베이스 통합이 포함된 Claude Code를 위한 완벽한 Unity Editor 제어 및 자동화 툴킷. 25개 카테고리에 걸쳐 500+ Unity Editor 기능을 명령 - GameObjects, 컴포넌트, 씬, Material, 물리, 애니메이션 등을 실시간 WebSocket 자동화로 제어하세요.

## 최근 업데이트

전체 릴리즈 노트는 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

## 특징

- **500+ 명령어**: 25개 Unity Editor 카테고리에 걸친 포괄적인 제어
- **실시간 WebSocket**: 즉각적인 양방향 통신 (포트 9500-9600)
- **GameObject & 계층 구조**: 생성, 삭제, 조작, 트리 시각화로 계층 구조 쿼리
- **Transform 제어**: 위치, 회전, 스케일을 위한 정밀한 Vector3 조작
- **Component 관리**: 속성 접근을 통한 컴포넌트 추가, 제거, 설정
- **Scene 관리**: 빌드 설정 제어와 함께 여러 씬 로드, 저장, 병합
- **Material & 렌더링**: Material, Shader, 텍스처, Renderer 속성
- **Prefab 시스템**: 인스턴스화, 생성, 오버라이드, Variant 관리
- **Asset Database**: 검색, 가져오기, 종속성, 레이블, 번들 할당
- **Animation**: 재생, Animator 파라미터, 곡선, 이벤트
- **Physics**: Rigidbody, Collider, Raycast, 시뮬레이션 제어
- **Console 로깅**: 필터링, 내보내기, 스트리밍이 가능한 실시간 로그
- **Editor 자동화**: Play 모드, 창 포커스, 선택, Scene View 제어
- **빌드 & 배포**: 빌드 파이프라인, 플레이어 설정, 플랫폼 전환
- **고급 기능**: Lighting, Camera, Audio, Navigation, Particles, Timeline, UI Toolkit
- **보안 강화**: 경로 탐색, 명령 주입, JSON 주입에 대한 방어
- **크로스 플랫폼**: Windows, macOS, Linux 완전 지원

## 설치

이 플러그인은 [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) 마켓플레이스의 일부입니다.

### 마켓플레이스에서 설치 (권장)

```bash
# 마켓플레이스 추가
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# 플러그인 설치
/plugin install unity-editor-toolkit@dev-gom-plugins
```

### 직접 설치

```bash
# 저장소에서 직접 설치
/plugin add https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/unity-editor-toolkit
```

## 사용법

### Unity 설정

1. **Unity 패키지 설치**:

   의존성 패키지를 먼저 수동 설치한 후, 메인 패키지를 설치하세요:

   **1단계: 의존성 설치**
   - Unity Editor 열기
   - Window → Package Manager
   - `+` 버튼 → Add package from git URL... 클릭 후 다음을 순서대로 추가:

   ```
   https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask
   ```

   ```
   https://github.com/gilzoide/unity-sqlite-net.git#1.3.2
   ```

   **2단계: Unity Editor Toolkit 설치**
   - 두 패키지 설치 완료 후, 메인 패키지를 추가:

   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```

   **대안 방법:**
   - `skills/assets/unity-package`에서 Package Manager를 통해 Unity 패키지 추가 (Add package from disk)
   - 또는 프로젝트의 `Packages` 디렉토리에 패키지 폴더를 직접 복사

2. **WebSocket 서버 설정**:
   - Unity 메뉴에서 창 열기: `Tools > Unity Editor Toolkit > Server Window`
   - 플러그인 스크립트 경로 설정 (기본값: 사용자 홈 폴더에서 자동 감지)
   - "Install CLI"를 클릭하여 WebSocket 서버 빌드 (일회성 설정)
   - Unity Editor가 열릴 때 서버가 자동으로 시작됩니다

3. **서버 상태**:
   - 포트: 자동 할당 (9500-9600 범위)
   - Status 파일: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI가 이 파일에서 올바른 포트를 자동으로 감지합니다

### 패키지 업데이트

Unity Editor Toolkit을 최신 버전으로 업데이트하려면:

1. Unity Editor 열기
2. Window → Package Manager
3. `+` 버튼 → Add package from git URL... 클릭
4. 다음을 입력:

   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```

5. Add 클릭 (기존 패키지가 업데이트됨)

**참고:** 의존성 패키지(UniTask, unity-sqlite-net)는 릴리즈 노트에 명시되지 않는 한 일반적으로 업데이트가 필요하지 않습니다.

### CLI 명령어

```bash
# 기본 사용법
cd <unity-project-root> && node .unity-websocket/uw <command> [options]

# 사용 가능한 모든 명령어 보기
cd <unity-project-root> && node .unity-websocket/uw --help

# 특정 명령어 도움말 보기
cd <unity-project-root> && node .unity-websocket/uw <command> --help
```

**현재 구현됨**: 15개 카테고리에 86개 명령어

전체 명령어 레퍼런스는 [COMMANDS.md](./skills/references/COMMANDS.md) 또는 [COMMANDS.ko.md](./skills/references/COMMANDS.ko.md)를 참조하세요.

#### 명령어 카테고리

전체 명령어 레퍼런스는 [COMMANDS.md](./skills/references/COMMANDS.md)를 참조하세요:

- **Component**: 속성 접근을 통한 컴포넌트 추가, 제거, 설정
- **Material**: 색상, 텍스처, Shader, Renderer 설정
- **Prefab**: 인스턴스화, 생성, 오버라이드 관리
- **Asset Database**: 검색, 가져오기, 종속성
- **Animation**: Animator 파라미터, 클립, 곡선
- **Physics**: Rigidbody, Collider, Raycast, 시뮬레이션
- **Lighting**: Light, Lightmap, Reflection Probe
- **Camera**: FOV, Viewport, 스크린샷
- **Audio**: AudioSource, Mixer, 3D 오디오
- **Navigation**: NavMesh, Agent, Obstacle
- **Particles**: 방출, 모듈, 시뮬레이션
- **Timeline**: Playable Director, Track, Clip
- **Build**: 빌드 파이프라인, 플레이어 설정
- **Profiler**: 성능 데이터, 메모리 스냅샷
- **Test Runner**: 유닛 테스트, Code Coverage
- 그 외 10개 이상의 카테고리...

### 명령어 예제

**GameObject 생성 및 설정:**
```bash
cd <unity-project-root> && node .unity-websocket/uw go create "Enemy" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-position "Enemy" "10,0,5" && \
cd <unity-project-root> && node .unity-websocket/uw tf set-rotation "Enemy" "0,45,0"
```

**Prefab 인스턴스화 및 수정:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Prefabs/Player" --position "0,1,0" && \
cd <unity-project-root> && node .unity-websocket/uw material set-color "Player" "_Color" "0,1,0,1"
```

**씬 로드 및 GameObject 활성화:**
```bash
cd <unity-project-root> && node .unity-websocket/uw scene load "Level1" && \
cd <unity-project-root> && node .unity-websocket/uw go set-active "Boss" true
```

**콘솔 오류 실시간 모니터링:**
```bash
cd <unity-project-root> && node .unity-websocket/uw console stream --filter error
```

**GameObject 일괄 생성:**
```bash
for i in {1..10}; do
  cd <unity-project-root> && node .unity-websocket/uw go create "Cube_$i" && \
  cd <unity-project-root> && node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

## 아키텍처

### 구성 요소

- **Unity C# Server**: JSON-RPC 2.0 핸들러 프레임워크를 가진 WebSocket 서버
- **서버 상태 동기화**: `.unity-websocket/server-status.json`을 통한 자동 포트 검색
- **WebSocket Client**: 자동 재연결 및 타임아웃 처리가 있는 TypeScript 구현
- **CLI Framework**: 모듈식 명령어 아키텍처를 가진 Commander.js
- **보안 계층**: 다층 입력 검증 및 주입 방어

### 통신 프로토콜

WebSocket을 통한 JSON-RPC 2.0:

**요청:**
```json
{
  "jsonrpc": "2.0",
  "id": "req_1",
  "method": "GameObject.Find",
  "params": { "name": "Player" }
}
```

**응답:**
```json
{
  "jsonrpc": "2.0",
  "id": "req_1",
  "result": {
    "name": "Player",
    "instanceId": 12345,
    "path": "/Player",
    "active": true,
    "tag": "Player",
    "layer": 0
  }
}
```

### 포트 할당 & 검색

- **범위**: 9500-9600 (100개 포트)
- **충돌 방지**: Browser Pilot(9222-9322) 및 Blender Toolkit(9400-9500) 회피
- **자동 검색**: Unity 서버가 포트를 `.unity-websocket/server-status.json`에 기록
- **CLI 검색**: status 파일에서 포트를 자동으로 읽음 (수동 설정 불필요)
- **Heartbeat**: 연결 상태 모니터링을 위해 5초마다 서버가 상태를 업데이트

## 보안

심층 방어 보안 구현:

- **경로 탐색 방어**: `..` 감지를 포함한 `path.resolve()` 검증
- **명령 주입 방어**: npm 실행 정화 및 환경 격리
- **JSON 주입 방지**: 모든 구조에 대한 런타임 타입 검증
- **로그 주입 방어**: 메시지 정화로 로그 조작 방지
- **WebSocket 보안**: localhost 전용 연결
- **포트 검증**: 9500-9600 범위 강제 적용
- **원자적 작업**: Race condition 없는 Lock 획득 (`{ flag: 'wx' }`)
- **메모리 안전성**: 적절한 이벤트 리스너 정리

## 개발

### 프로젝트 구조

```
unity-editor-toolkit/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 메타데이터
├── hooks/
│   └── hooks.json               # SessionStart/SessionEnd 훅
├── scripts/
│   ├── shared/
│   │   └── hook-utils.js        # 보안 유틸리티
│   ├── init-config.js           # SessionStart 훅
│   └── cleanup-config.js        # SessionEnd 훅
├── skills/
│   ├── SKILL.md                 # 스킬 문서
│   ├── scripts/
│   │   ├── src/
│   │   │   ├── cli/
│   │   │   │   ├── cli.ts       # 메인 CLI 진입점
│   │   │   │   └── commands/    # 명령어 구현
│   │   │   ├── constants/
│   │   │   │   └── index.ts     # 중앙 집중식 상수
│   │   │   ├── unity/
│   │   │   │   ├── client.ts    # WebSocket 클라이언트
│   │   │   │   └── protocol.ts  # JSON-RPC 타입
│   │   │   └── utils/
│   │   │       ├── config.ts    # 설정 관리
│   │   │       └── logger.ts    # 로깅 유틸리티
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── references/              # 문서
│   │   ├── QUICKSTART.md        # 빠른 시작 가이드
│   │   ├── QUICKSTART.ko.md     # 한국어 빠른 시작 가이드
│   │   ├── COMMANDS.md          # 완전한 명령어 레퍼런스 (500+)
│   │   ├── COMMANDS.ko.md       # 한국어 명령어 레퍼런스
│   │   ├── API_COMPATIBILITY.md # Unity 버전 호환성
│   │   ├── TEST_GUIDE.md        # 테스트 가이드
│   │   └── TEST_GUIDE.ko.md     # 한국어 테스트 가이드
│   └── assets/                  # Unity 패키지
│       └── unity-package/       # Unity C# WebSocket 서버
│           ├── Runtime/         # 핵심 핸들러 & 프로토콜
│           ├── Editor/          # 에디터 창
│           ├── Tests/           # 유닛 테스트 (66개 테스트)
│           ├── ThirdParty/      # websocket-sharp
│           └── package.json     # Unity 패키지 매니페스트
├── README.md                    # 영문 README
└── README.ko.md                 # 이 파일
```

### 빌드

```bash
cd skills/scripts
npm install
npm run build
```

### 테스트

엔드투엔드 테스트를 위해서는 Unity C# 서버 구현이 필요합니다. 유닛 테스트는 곧 추가될 예정입니다.

## 개발 로드맵

**Phase 2 (현재)**: 15개 카테고리 86개 명령어 (GameObject, Transform, Component, Scene, Prefab, Material, Shader, Asset 등)
**Phase 3**: Animation, Physics, Lighting - 150+ 명령어
**Phase 4**: Build, Profiler, Test Runner - 100+ 명령어
**Phase 5**: 고급 기능 (Timeline, UI Toolkit, VCS) - 150+ 명령어

자세한 로드맵은 [COMMANDS.md](./skills/references/COMMANDS.md) 또는 [COMMANDS.ko.md](./skills/references/COMMANDS.ko.md)를 참조하세요.

## 개발 예정

### Unity C# 서버 패키지
- [ ] websocket-sharp를 사용한 WebSocket 서버
- [ ] JSON-RPC 2.0 핸들러 프레임워크
- [ ] 명령어 라우팅 및 실행
- [ ] Unity Package Manager 통합

### 명령어 (500+)
- [x] GameObject & Hierarchy (15개 명령어)
- [x] Transform (8개 명령어)
- [x] Scene Management (3개 명령어)
- [x] Console & Logging (2개 명령어)
- [x] EditorPrefs Management (6개 명령어)
- [x] Wait Commands (4개 명령어)
- [x] Chain Commands (2개 명령어)
- [ ] Component (20+ 명령어)
- [ ] Material & Rendering (25+ 명령어)
- [ ] Prefab (15+ 명령어)
- [ ] Asset Database (20+ 명령어)
- [ ] Animation (20+ 명령어)
- [ ] Physics (20+ 명령어)
- [ ] Lighting (15+ 명령어)
- [ ] Camera (15+ 명령어)
- [ ] Audio (15+ 명령어)
- [ ] Navigation & AI (15+ 명령어)
- [ ] Particle System (15+ 명령어)
- [ ] Timeline (10+ 명령어)
- [ ] Build & Player (15+ 명령어)
- [ ] Project Settings (20+ 명령어)
- [ ] Package Manager (10+ 명령어)
- [ ] Version Control (10+ 명령어)
- [ ] Profiler & Performance (15+ 명령어)
- [ ] Test Runner (10+ 명령어)
- [ ] Input System (10+ 명령어)
- [ ] UI Toolkit (10+ 명령어)
- [ ] Utility Commands (20+ 명령어)

## 라이선스

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE)를 참조하세요

## 관련 플러그인

- [Browser Pilot](../browser-pilot) - Chrome DevTools Protocol을 통한 브라우저 자동화
- [Blender Toolkit](../blender-toolkit) - Blender 3D 자동화 및 씬 관리
- [Unity Dev Toolkit](../unity-dev-toolkit) - Unity 개발 유틸리티 및 컴파일 오류 수정

## 문서

- [COMMANDS.md](./skills/references/COMMANDS.md) - 완전한 명령어 레퍼런스 (500+ 명령어)
- [COMMANDS.ko.md](./skills/references/COMMANDS.ko.md) - 한국어 명령어 레퍼런스
- [DATABASE_GUIDE.md](./skills/references/DATABASE_GUIDE.md) - 데이터베이스 사용 가이드

---

**버전**: 0.15.1
**Unity 버전**: Unity 6+ (데이터베이스 기능은 내장 SQLite 지원 필요)
**마지막 업데이트**: 2025-12-02
**제작자**: Dev GOM
**마켓플레이스**: [dev-gom-plugins](https://github.com/Dev-GOM/claude-code-marketplace)
