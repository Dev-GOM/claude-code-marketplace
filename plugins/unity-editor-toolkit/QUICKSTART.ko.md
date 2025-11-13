**언어**: [English](./QUICKSTART.md) | 한국어

---

# Unity Editor Toolkit - 빠른 시작 가이드

설치부터 첫 명령어 실행까지 완벽한 설정 가이드입니다.

## 사전 요구사항

- Unity 2020.3 이상
- Claude Code 설치됨
- Unity Editor 기본 사용법 숙지

## 설치 단계

### 1. Claude Code 플러그인 설치

Claude Code 설정을 열고 다음을 추가하세요:

```json
{
  "plugins": {
    "marketplaces": [
      {
        "name": "dev-gom-plugins",
        "url": "https://github.com/Dev-GOM/claude-code-marketplace"
      }
    ],
    "enabled": ["dev-gom-plugins:unity-editor-toolkit"]
  }
}
```

### 2. Unity 패키지 설치 (Package Manager 사용)

1. Unity Editor 열기
2. `Window → Package Manager` 메뉴로 이동
3. 좌측 상단 `+` 버튼 클릭 → `Add package from git URL` 선택
4. 다음 URL 입력:
   ```
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
   ```
5. `Add` 클릭 후 설치 완료까지 대기

> **대안**: Assets 폴더에 설치하고 싶다면 (커스터마이징 용이), `plugins/unity-editor-toolkit/skills/assets/unity-package/`를 `Assets/UnityEditorToolkit/`에 복사하세요

### 3. websocket-sharp DLL 설치

패키지에 websocket-sharp DLL이 필요합니다. Package Manager에서 설치 스크립트 찾기:

1. Package Manager에서 "Unity Editor Toolkit" 선택
2. "Samples" 섹션에서 "Installation Scripts" 임포트
3. 또는 직접 이동:
   ```
   Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/
   ```

**Windows**: `install.bat` 더블클릭
**macOS/Linux**: 터미널에서 `./install.sh` 실행

**수동 설치** (자동 실패 시):
1. 다운로드: https://github.com/sta/websocket-sharp/releases/download/1.0.3-rc11/websocket-sharp.dll
2. 저장 위치: `Packages/com.devgom.unity-editor-toolkit/ThirdParty/websocket-sharp/websocket-sharp.dll`

### 4. WebSocket 서버 설정

1. Unity Editor Toolkit 서버 창 열기:
   - Unity 메뉴에서: `Tools > Unity Editor Toolkit > Server Window`
   - 에디터에 새 창이 나타납니다

2. 플러그인 스크립트 경로 설정:
   - **Plugin Scripts Path**: 사용자 홈 폴더에서 자동 감지 (`~/.claude/plugins/...`)
   - 자동 감지되지 않으면 "Browse"를 클릭하여 수동 선택
   - 경로는 다음을 가리켜야 합니다: `unity-editor-toolkit/skills/scripts`

3. CLI 설치 (일회성 설정):
   - "Install CLI" 버튼 클릭
   - WebSocket 서버와 TypeScript CLI를 빌드합니다
   - 설치 완료까지 대기 (1-2분 소요 가능)
   - Console에 표시: "✓ CLI installation completed"

4. 서버 자동 시작:
   - Unity Editor가 열릴 때 서버가 자동으로 시작됩니다
   - **Port**: 9500-9600 범위에서 자동 할당 (수동 설정 불필요)
   - **Status file**: `{ProjectRoot}/.unity-websocket/server-status.json`
   - CLI가 이 파일에서 올바른 포트를 자동으로 감지합니다
   - Console 확인: `✓ Unity Editor Server started on ws://127.0.0.1:XXXX`

## 첫 명령어

Claude Code의 터미널을 열고 다음 명령어를 시도해보세요:

### 1. 연결 상태 확인

```bash
cd <unity-project-root> node .unity-websocket/uw status
```

예상 출력:
```
✓ Connected to Unity Editor
WebSocket: ws://127.0.0.1:9500
Status: Running
```

### 2. GameObject 찾기

```bash
cd <unity-project-root> node .unity-websocket/uw go find "Main Camera"
```

예상 출력:
```
✓ GameObject found:
  Name: Main Camera
  Instance ID: 12345
  Path: /Main Camera
  Active: true
  Tag: MainCamera
  Layer: 0
```

### 3. 새 GameObject 생성

```bash
cd <unity-project-root> node .unity-websocket/uw go create "TestCube"
```

Unity Hierarchy를 확인하세요 - 새로운 "TestCube" GameObject가 보일 것입니다!

### 4. 위치 설정

```bash
cd <unity-project-root> node .unity-websocket/uw tf set-position "TestCube" "5,2,3"
```

Unity Scene View에서 "TestCube"가 위치 (5, 2, 3)으로 이동합니다.

### 5. 씬 정보 가져오기

```bash
cd <unity-project-root> node .unity-websocket/uw scene current
```

현재 활성화된 씬의 정보를 표시합니다.

### 6. 계층 구조 보기

```bash
cd <unity-project-root> node .unity-websocket/uw hierarchy
```

전체 GameObject 계층 구조를 트리 형태로 표시합니다.

### 7. 콘솔 로그 가져오기

```bash
cd <unity-project-root> node .unity-websocket/uw console logs --count 10
```

최근 10개의 콘솔 로그 항목을 표시합니다.

## 확인 체크리스트

- [ ] Claude Code 플러그인 설치 및 활성화
- [ ] Unity 패키지 성공적으로 임포트됨
- [ ] websocket-sharp.dll이 올바른 위치에 있음
- [ ] Unity Editor Toolkit 서버 창 열림 (`Tools > Unity Editor Toolkit > Server Window`)
- [ ] 플러그인 스크립트 경로가 올바르게 설정됨
- [ ] CLI가 성공적으로 설치됨 ("Install CLI" 버튼 클릭)
- [ ] 서버가 자동으로 시작됨 (Console에서 시작 메시지 확인)
- [ ] Status 파일 생성됨: `.unity-websocket/server-status.json`
- [ ] Console에 "✓ Unity Editor Server started on ws://127.0.0.1:XXXX" 표시
- [ ] `cd <unity-project-root> node .unity-websocket/uw status` 명령어 작동
- [ ] GameObject 생성/찾기 가능
- [ ] Transform 수정 가능
- [ ] Unity Console에 오류 없음

## 문제 해결

### "Server not found" 또는 "Connection refused"

**확인사항:**
1. Unity Editor가 열려 있는지
2. Console에 서버 시작 메시지가 표시되는지
3. Status 파일 존재 여부: 프로젝트 루트의 `.unity-websocket/server-status.json`
4. 포트 범위 9500-9600이 방화벽에 차단되지 않았는지
5. 서버 창에 "Server Status: Running" 표시되는지

**해결방법:**
```bash
# Unity 프로젝트 루트에서 status 파일 확인
ls -la .unity-websocket/

# 필요시 포트를 수동으로 지정
cd <unity-project-root> node .unity-websocket/uw --port 9500 status
```

Unity 서버 창에서 "Server Status"를 확인하고 필요시 재시작하세요.

### "Assembly 'websocket-sharp' not found"

**해결방법:**
1. DLL 위치 확인: `ThirdParty/websocket-sharp/websocket-sharp.dll`
2. Unity Editor 재시작
3. Console에서 임포트 오류 확인
4. 재임포트 시도: 패키지 우클릭 → Reimport

### 명령어가 타임아웃되거나 실패함

**확인사항:**
1. GameObject 이름이 정확한지 (대소문자 구분)
2. 씬이 로드되었는지
3. Unity가 오류 상태가 아닌지
4. 서버가 여전히 실행 중인지 (Console 확인)

**해결방법:**
```bash
# 먼저 서버 상태 확인
cd <unity-project-root> node .unity-websocket/uw status

# 간단한 명령어 시도
cd <unity-project-root> node .unity-websocket/uw go find "Main Camera"
```

### Unity Console에 오류 표시

**일반적인 문제:**

**"NullReferenceException"**
- GameObject 이름이 존재하지 않음
- 씬이 로드되지 않음
- 컴포넌트를 찾을 수 없음

**"JsonException"**
- 잘못된 명령어 파라미터
- 문서에서 파라미터 형식 확인

**"SocketException"**
- 포트가 이미 사용 중
- 방화벽이 연결을 차단
- 다른 포트 시도

## 다음 단계

### 더 많은 명령어 배우기

전체 500+ 명령어 로드맵은 [COMMANDS.md](./skills/references/COMMANDS.md)를 참조하세요.

**현재 사용 가능 (18개 명령어):**
- 연결 및 상태: Status (1개 명령어)
- GameObject 및 계층 구조: Find, Create, Destroy, SetActive, Hierarchy (5개 명령어)
- Transform: Get, SetPosition, SetRotation, SetScale (4개 명령어)
- Scene: Current, List, Load (3개 명령어)
- Asset Database 및 Editor: Refresh, Recompile, Reimport (3개 명령어)
- Console: Logs, Clear (2개 명령어)

### 고급 사용법

**일괄 작업:**
```bash
# 여러 큐브 생성
for i in {1..5}; do
  cd <unity-project-root> node .unity-websocket/uw go create "Cube_$i"
  cd <unity-project-root> node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

**스크립트 통합:**
```bash
# 계층 구조를 파일로 저장
cd <unity-project-root> node .unity-websocket/uw hierarchy > hierarchy.json

# 콘솔을 실시간으로 모니터링
cd <unity-project-root> node .unity-websocket/uw console stream --filter error
```

### Editor Window

서버 제어 패널 접근:

`Tools → Unity Editor Toolkit → Server Window`

기능:
- CLI 설치 (일회성 설정)
- 플러그인 스크립트 경로 설정
- 서버 상태 보기 (Running/Stopped)
- 연결 정보 보기 (포트, status 파일 위치)
- 수동으로 서버 시작/중지
- 문서 접근

## 지원

**이슈:**
https://github.com/Dev-GOM/claude-code-marketplace/issues

**문서:**
- [전체 README](./README.ko.md)
- [명령어 로드맵](./skills/references/COMMANDS.md) - 500+ 명령어 로드맵
- **구현된 명령어 카테고리:**
  - [연결 및 상태](./skills/references/COMMANDS_CONNECTION_STATUS.md)
  - [GameObject 및 계층 구조](./skills/references/COMMANDS_GAMEOBJECT_HIERARCHY.md)
  - [Transform](./skills/references/COMMANDS_TRANSFORM.md)
  - [Scene 관리](./skills/references/COMMANDS_SCENE.md)
  - [Asset Database 및 Editor](./skills/references/COMMANDS_EDITOR.md)
  - [Console 및 로깅](./skills/references/COMMANDS_CONSOLE.md)
- [Unity 패키지 문서](./skills/assets/unity-package/README.md)

---

## 추가 팁

### 프로젝트 저장

중요한 작업을 시작하기 전에 프로젝트를 저장하세요:
- `File → Save Project`
- 또는 `Ctrl+S` (Windows/Linux) / `Cmd+S` (macOS)

### Undo 지원

모든 Unity Editor Toolkit 명령어는 Unity의 Undo 시스템과 통합되어 있습니다:
- `Edit → Undo` 또는 `Ctrl+Z`로 변경 사항 되돌리기 가능

### 여러 프로젝트

여러 Unity 프로젝트를 동시에 실행하는 경우:
- 각 프로젝트에서 다른 포트 사용 (9500, 9501, 9502...)
- `cd <unity-project-root> node .unity-websocket/uw --port <번호>` 명령어로 특정 포트 지정

### 성능 최적화

- 대량의 GameObject 작업 시 Play Mode를 일시정지하여 성능 향상
- Console 로그는 최근 1000개로 자동 제한됨

---

**축하합니다!** 🎉 Unity Editor Toolkit 설정을 성공적으로 완료했습니다. 이제 Claude Code에서 직접 Unity Editor를 제어할 수 있습니다!

## 학습 리소스

### 영상 튜토리얼 (예정)
- 기본 설정 및 첫 명령어
- GameObject 및 Transform 제어
- 씬 관리 및 계층 구조 탐색
- 고급 자동화 워크플로우

### 예제 프로젝트 (예정)
- 기본 GameObject 조작
- 프로시저럴 레벨 생성
- 자동화된 테스트 설정
- 에디터 도구 통합

### 커뮤니티
- GitHub Discussions에서 질문하기
- 예제 스크립트 공유
- 새로운 명령어 제안

---

**문제가 있나요?** GitHub Issues에서 도움을 받으세요:
https://github.com/Dev-GOM/claude-code-marketplace/issues
