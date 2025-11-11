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
   https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/unity-package
   ```
5. `Add` 클릭 후 설치 완료까지 대기

> **대안**: Assets 폴더에 설치하고 싶다면 (커스터마이징 용이), `plugins/unity-editor-toolkit/unity-package/`를 `Assets/UnityEditorToolkit/`에 복사하세요

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

### 4. Unity 서버 설정

1. Unity에서 새 GameObject 생성:
   - Hierarchy에서 우클릭 → `Create Empty`
   - 이름을 "UnityEditorServer"로 변경

2. 서버 컴포넌트 추가:
   - "UnityEditorServer" GameObject 선택
   - Inspector에서: `Add Component`
   - 검색: "Unity Editor Server"
   - 클릭하여 추가

3. 설정 구성:
   - **Port**: 9300 (기본값, 필요시 변경 가능)
   - **Auto Start**: ✓ 체크

4. Play Mode 진입:
   - Play 버튼 클릭 (또는 Ctrl+P)
   - Console 확인: `✓ Unity Editor Server started on ws://127.0.0.1:9300`

## 첫 명령어

Claude Code의 터미널을 열고 다음 명령어를 시도해보세요:

### 1. 연결 상태 확인

```bash
unity-editor status
```

예상 출력:
```
✓ Connected to Unity Editor
WebSocket: ws://127.0.0.1:9300
Status: Running
```

### 2. GameObject 찾기

```bash
unity-editor go find "Main Camera"
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
unity-editor go create "TestCube"
```

Unity Hierarchy를 확인하세요 - 새로운 "TestCube" GameObject가 보일 것입니다!

### 4. 위치 설정

```bash
unity-editor tf set-position "TestCube" "5,2,3"
```

Unity Scene View에서 "TestCube"가 위치 (5, 2, 3)으로 이동합니다.

### 5. 씬 정보 가져오기

```bash
unity-editor scene current
```

현재 활성화된 씬의 정보를 표시합니다.

### 6. 계층 구조 보기

```bash
unity-editor hierarchy
```

전체 GameObject 계층 구조를 트리 형태로 표시합니다.

### 7. 콘솔 로그 가져오기

```bash
unity-editor console logs --count 10
```

최근 10개의 콘솔 로그 항목을 표시합니다.

## 확인 체크리스트

- [ ] Claude Code 플러그인 설치 및 활성화
- [ ] Unity 패키지 성공적으로 임포트됨
- [ ] websocket-sharp.dll이 올바른 위치에 있음
- [ ] UnityEditorServer GameObject 생성됨
- [ ] 서버 컴포넌트 구성됨 (포트 9300, 자동 시작)
- [ ] Play Mode 활성화
- [ ] Console에 "✓ Unity Editor Server started" 표시
- [ ] `unity-editor status` 명령어 작동
- [ ] GameObject 생성/찾기 가능
- [ ] Transform 수정 가능
- [ ] Unity Console에 오류 없음

## 문제 해결

### "Server not found" 또는 "Connection refused"

**확인사항:**
1. Unity가 Play Mode에 있는지
2. Console에 서버 시작 메시지가 표시되는지
3. 포트 9300이 방화벽에 차단되지 않았는지
4. UnityEditorServer 컴포넌트가 GameObject에 있는지

**해결방법:**
```bash
# 다른 포트 시도
unity-editor --port 9301 status
```

Unity에서 Server 컴포넌트의 포트를 9301로 변경하세요.

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
unity-editor status

# 간단한 명령어 시도
unity-editor go find "Main Camera"
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

전체 500+ 명령어 레퍼런스는 [COMMANDS.md](./COMMANDS.md) 또는 [COMMANDS.ko.md](./COMMANDS.ko.md)를 참조하세요.

**현재 사용 가능 (17개 명령어):**
- GameObject: Find, Create, Destroy, SetActive
- Transform: Get/Set Position, Rotation, Scale
- Scene: GetCurrent, GetAll, Load
- Console: GetLogs, Clear
- Hierarchy: Get

### 고급 사용법

**일괄 작업:**
```bash
# 여러 큐브 생성
for i in {1..5}; do
  unity-editor go create "Cube_$i"
  unity-editor tf set-position "Cube_$i" "$i,0,0"
done
```

**스크립트 통합:**
```bash
# 계층 구조를 파일로 저장
unity-editor hierarchy > hierarchy.json

# 콘솔을 실시간으로 모니터링
unity-editor console stream --filter error
```

### Editor Window

서버 제어 패널 접근:

`Window → Unity Editor Toolkit → Server Control`

기능:
- 서버 시작/중지
- 포트 구성
- 연결 상태 보기
- 문서 접근

## 지원

**이슈:**
https://github.com/Dev-GOM/claude-code-marketplace/issues

**문서:**
- [전체 README](./README.ko.md)
- [명령어 레퍼런스](./COMMANDS.ko.md)
- [Unity 패키지 문서](./unity-package/README.md)

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
- 각 프로젝트에서 다른 포트 사용 (9300, 9301, 9302...)
- `unity-editor --port <번호>` 명령어로 특정 포트 지정

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
