# Unity Editor Toolkit - Unity 패키지

Claude Code 통합을 위한 WebSocket 기반 Unity Editor 실시간 제어.

## 설치

### 권장: Unity Package Manager

1. Unity Editor 열기
2. Window → Package Manager
3. `+` 클릭 → Add package from git URL
4. 입력: `https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package`
5. Add 클릭

### 대안: Assets 폴더

커스터마이징이 필요한 경우, 이 폴더를 `Assets/UnityEditorToolkit/`에 복사하세요.

> **참고**: UPM은 `Packages/` 폴더에 설치되며(읽기 전용), Assets는 직접 수정이 가능합니다.

## 빠른 시작

### 1. Server Window 열기

1. Unity 메뉴: `Tools > Unity Editor Toolkit > Server Window`
2. Editor에 새 창이 나타납니다

### 2. 플러그인 스크립트 경로 설정

1. **Plugin Scripts Path**: 사용자 홈 폴더에서 자동 감지 (`~/.claude/plugins/...`)
2. 감지되지 않으면 "Browse"를 클릭하여 수동 선택
3. 경로는 다음을 가리켜야 함: `unity-editor-toolkit/skills/scripts`

### 3. CLI 설치 (일회성 설정)

1. "Install CLI" 버튼 클릭
2. WebSocket 서버와 TypeScript CLI 빌드
3. 설치 완료 대기 (1-2분 소요 가능)
4. Console에 표시: "✓ CLI installation completed"

### 4. 서버 자동 시작

1. Unity Editor가 열리면 서버가 자동으로 시작됩니다
2. **포트**: 9500-9600 범위에서 자동 할당 (수동 설정 불필요)
3. **상태 파일**: `{ProjectRoot}/.unity-websocket/server-status.json`
4. CLI가 이 파일에서 올바른 포트를 자동으로 감지

### 5. Claude Code에서 연결

Claude Code에 Unity Editor Toolkit 플러그인 설치:

```bash
# 마켓플레이스 추가
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# 플러그인 설치
/plugin install unity-editor-toolkit@dev-gom-plugins
```

CLI 명령어 사용:

```bash
# GameObject 찾기
cd <unity-project-root> node .unity-websocket/uw go find "Player"

# 위치 설정
cd <unity-project-root> node .unity-websocket/uw tf set-position "Player" "0,5,10"

# 씬 로드
cd <unity-project-root> node .unity-websocket/uw scene load "GameScene"

# 콘솔 로그 가져오기
cd <unity-project-root> node .unity-websocket/uw console logs
```

## 요구사항

### Unity 버전
- **Unity 2020.3 이상**
- **Unity 6+ (2023.x+)** 완전 호환

### 의존성
- websocket-sharp 라이브러리 (아래 의존성 섹션 참조)

### Test Framework (테스트 실행용)
- **Unity 2019.2+**: 모든 프로젝트에 자동 포함
- **Unity 6+ (2023.x+)**: Core Package (Editor 버전 고정) + 새 기능

## 의존성

### websocket-sharp

이 패키지는 WebSocket 통신을 위해 websocket-sharp가 필요합니다.

**설치:**

1. websocket-sharp 다운로드: https://github.com/sta/websocket-sharp/releases
2. `websocket-sharp.dll` 압축 해제
3. `Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/`에 복사
4. Unity가 자동으로 DLL을 임포트

**대안:**

NuGet for Unity를 통해 추가:
1. NuGet for Unity 설치: https://github.com/GlitchEnzo/NuGetForUnity
2. NuGet 창 열기
3. "websocket-sharp" 검색
4. 설치

## 지원 명령어

### GameObject (5개 명령어)
- `GameObject.Find` - 이름으로 GameObject 찾기
- `GameObject.Create` - 새 GameObject 생성
- `GameObject.Destroy` - GameObject 파괴
- `GameObject.SetActive` - 활성 상태 설정

### Transform (6개 명령어)
- `Transform.GetPosition` - 월드 위치 가져오기
- `Transform.SetPosition` - 월드 위치 설정
- `Transform.GetRotation` - 회전 가져오기 (오일러 각도)
- `Transform.SetRotation` - 회전 설정
- `Transform.GetScale` - 로컬 스케일 가져오기
- `Transform.SetScale` - 로컬 스케일 설정

### Scene (3개 명령어)
- `Scene.GetCurrent` - 활성 씬 정보 가져오기
- `Scene.GetAll` - 로드된 모든 씬 가져오기
- `Scene.Load` - 씬 로드 (단일 또는 추가)

### Console (2개 명령어)
- `Console.GetLogs` - 필터링된 콘솔 로그 가져오기
- `Console.Clear` - 콘솔 지우기

### Hierarchy (1개 명령어)
- `Hierarchy.Get` - GameObject 계층 구조 트리 가져오기

## API 예제

### GameObject 찾기

**요청:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "GameObject.Find",
  "params": { "name": "Player" }
}
```

**응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
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

### 위치 설정

**요청:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "Transform.SetPosition",
  "params": {
    "name": "Player",
    "position": { "x": 0, "y": 5, "z": 10 }
  }
}
```

**응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": { "success": true }
}
```

## 보안

- **로컬호스트 전용**: 서버는 127.0.0.1에서의 연결만 허용
- **에디터 모드 전용**: 서버는 Editor에서만 실행되며, 빌드에서는 실행되지 않음
- **Undo 지원**: 모든 작업은 Unity의 Undo 시스템을 지원

## 문제 해결

### 서버가 시작되지 않음

1. Console에서 오류 메시지 확인
2. 포트가 사용 중인지 확인 (9500-9600)
3. websocket-sharp.dll이 설치되었는지 확인
4. 다른 포트 번호 시도

### 연결할 수 없음

1. 서버가 실행 중인지 확인 (Console 확인)
2. WebSocket URL 확인: 상태 파일에서 포트 확인
3. 방화벽 설정 확인
4. Unity Editor가 열려 있는지 확인 (Edit Mode 또는 Play Mode)

### 명령어 실패

1. Console에서 오류 세부정보 확인
2. GameObject 이름이 올바른지 확인
3. 씬이 로드되었는지 확인
4. 매개변수 형식이 API와 일치하는지 확인

## Editor Window

Unity 메뉴를 통해 서버 제어에 액세스:

**Tools → Unity Editor Toolkit → Server Window**

기능:
- 서버 상태 모니터링
- 플러그인 스크립트 경로 설정
- CLI 설치 및 빌드
- 문서 빠른 액세스

## 성능

- 최소 오버헤드: 명령당 ~1-2ms
- 다중 클라이언트 동시 지원
- 로그는 1000개 항목으로 제한
- 스레드 안전 작업

## 알려진 제한사항

- Editor 모드 전용 (빌드에서 사용 불가)
- 단일 씬 활성 명령 실행
- GameObject 찾기는 활성 씬으로 제한
- 콘솔 로그는 최근 1000개 항목으로 제한

## 향후 기능

계획된 500개 이상의 명령어는 [COMMANDS.md](../COMMANDS.md)를 참조하세요:
- Component 조작
- Material 편집
- Prefab 인스턴스화
- Asset Database 쿼리
- Animation 제어
- Physics 시뮬레이션
- 그리고 훨씬 더 많은 기능...

## 라이선스

Apache License 2.0

## 링크

- [GitHub 저장소](https://github.com/Dev-GOM/claude-code-marketplace)
- [플러그인 문서](../README.ko.md)
- [명령어 레퍼런스](../COMMANDS.ko.md)
- [이슈 트래커](https://github.com/Dev-GOM/claude-code-marketplace/issues)

## 지원

문제, 질문 또는 기능 요청은 다음을 방문하세요:
https://github.com/Dev-GOM/claude-code-marketplace/issues
