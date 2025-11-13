**언어**: [English](./TEST_GUIDE.md) | 한국어

---

# Unity Editor Toolkit - 테스트 가이드

Unity Test Framework 테스트 실행을 위한 완벽 가이드입니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [테스트 설정](#테스트-설정)
3. [Unity Editor에서 테스트 실행](#unity-editor에서-테스트-실행)
4. [명령줄로 테스트 실행](#명령줄로-테스트-실행)
5. [테스트 결과 이해하기](#테스트-결과-이해하기)
6. [테스트 커버리지](#테스트-커버리지)
7. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필요한 Unity 버전

- **Unity 2020.3 이상**

### Unity Test Framework

| Unity 버전 | Test Framework 상태 |
|-----------|-------------------|
| **Unity 2019.2 이상** | ✅ **모든 프로젝트에 자동 포함** |
| **Unity 6+ (2023.x+)** | ✅ **Core Package** (Editor 버전 고정) + 새 기능 추가 |

> **중요**: Test Framework는 Unity 2019.2부터 자동으로 포함되었습니다. Unity 6+에서는 "Core Package"로 분류되어 버전이 Editor와 고정됩니다.

**Unity 6+ 새 기능** (2023.2부터):
- ✅ 테스트 재시도(Retry) 및 반복(Repeat) 기능
- ✅ 무작위 순서 실행 (`-randomOrderSeed`)
- ✅ `TestFileReferences.json` 자동 생성
- ✅ SRP 테스트 자동 업데이트

### 패키지 설치

Unity Editor Toolkit 패키지는 테스트 어셈블리를 포함합니다:

```
unity-package/
├── Tests/
│   ├── Editor/
│   │   ├── UnityEditorToolkit.Editor.Tests.asmdef
│   │   ├── UnityMainThreadDispatcherTests.cs (10개 테스트)
│   │   ├── GameObjectCachingTests.cs (13개 테스트)
│   │   ├── Vector3ValidationTests.cs (20개 테스트)
│   │   └── JsonRpcProtocolTests.cs (23개 테스트)
│   └── Runtime/
│       └── UnityEditorToolkit.Tests.asmdef
```

**총 66개의 자동화 테스트**

---

## 테스트 설정

### 1. 패키지 설치

아직 설치하지 않았다면 UPM을 통해 패키지 추가:

```
Window → Package Manager → + → Add package from git URL
```

다음 URL 입력:
```
https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
```

### 2. Test Framework 확인

**모든 Unity 버전 (2019.2 이상)**:
- Test Framework가 **자동으로 포함**되어 있음
- 별도 설치 불필요
- Test Runner 즉시 사용 가능

**Test Runner 창이 없는 경우** (드물게 발생):
1. `Window → Package Manager`
2. "Built-in packages"에서 "Test Framework" 확인
3. 보이지 않으면 Unity Editor 재시작

**Unity 6+ 특징**:
- Test Framework는 **Core Package**임 (버전 변경 불가)
- Unity Editor 버전과 동일하게 고정됨
- 새 기능 포함: Retry, Repeat, 무작위 순서 실행

### 3. Test Runner 열기

Test Runner 창 열기:

```
Window → General → Test Runner
```

또는 키보드 단축키 사용: `Ctrl + Alt + T` (Windows/Linux) 또는 `Cmd + Alt + T` (macOS)

---

## Unity Editor에서 테스트 실행

### 방법 1: Test Runner 창 (권장)

#### 1단계: Test Runner 열기

`Window → General → Test Runner`

#### 2단계: 테스트 모드 선택

**"EditMode"** 탭 클릭 (현재 모든 테스트는 EditMode)

#### 3단계: 테스트 계층 구조 확인

다음과 같이 표시됩니다:

```
▼ UnityEditorToolkit.Editor.Tests
  ▼ UnityMainThreadDispatcherTests (10개 테스트)
  ▼ GameObjectCachingTests (13개 테스트)
  ▼ Vector3ValidationTests (20개 테스트)
  ▼ JsonRpcProtocolTests (23개 테스트)
```

#### 4단계: 테스트 실행

**모든 테스트 실행:**
- 상단의 `Run All` 버튼 클릭

**특정 테스트 스위트 실행:**
- 테스트 클래스 우클릭 (예: "UnityMainThreadDispatcherTests")
- `Run` 선택

**단일 테스트 실행:**
- 개별 테스트 우클릭 (예: "Instance_Should_CreateSingleton")
- `Run` 선택

#### 5단계: 결과 확인

테스트 결과가 Test Runner 창에 표시됩니다:

- ✅ **녹색 체크마크**: 테스트 통과
- ❌ **빨간 X**: 테스트 실패
- ⏭️ **회색 대시**: 테스트 건너뜀

**예시 출력:**
```
✓ UnityMainThreadDispatcherTests.Instance_Should_CreateSingleton (0.003s)
✓ UnityMainThreadDispatcherTests.Enqueue_Should_ExecuteAction_OnMainThread (0.012s)
✓ GameObjectCachingTests.FindGameObject_Should_FindExistingObject (0.008s)
✓ Vector3ValidationTests.ToVector3_Should_Throw_On_NaN_X (0.002s)

총계: 66 테스트
통과: 66
실패: 0
불확정: 0
건너뜀: 0
시간: 2.345s
```

---

### 방법 2: 선택된 테스트 실행

1. Test Runner에서 하나 이상의 테스트 선택
2. `Run Selected` 버튼 클릭

### 방법 3: 실패한 테스트만 재실행

실패가 있는 테스트 실행 후:

1. `Rerun Failed` 버튼 클릭
2. 실패한 테스트만 다시 실행됩니다

---

## 명령줄로 테스트 실행

### Windows

```batch
"C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe" ^
  -runTests ^
  -batchmode ^
  -projectPath "C:\Path\To\Your\UnityProject" ^
  -testResults "C:\Path\To\Results\test-results.xml" ^
  -testPlatform EditMode ^
  -logFile "C:\Path\To\Logs\unity-test.log"
```

### macOS / Linux

```bash
/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity \
  -runTests \
  -batchmode \
  -projectPath "/path/to/your/UnityProject" \
  -testResults "/path/to/results/test-results.xml" \
  -testPlatform EditMode \
  -logFile "/path/to/logs/unity-test.log"
```

### 매개변수 설명

- `-runTests`: 테스트 실행 후 종료
- `-batchmode`: UI 없이 실행 (헤드리스)
- `-projectPath`: Unity 프로젝트 경로
- `-testResults`: 출력 XML 파일 경로 (NUnit 형식)
- `-testPlatform EditMode`: EditMode 테스트 실행
- `-logFile`: Unity 로그 출력 파일

### 종료 코드

- `0`: 모든 테스트 통과
- `2`: 일부 테스트 실패
- `3`: 실행 오류 (예: 컴파일 오류)

---

## 테스트 결과 이해하기

### Test Runner 결과

각 테스트는 다음을 표시합니다:

1. **상태 아이콘**
   - ✅ 녹색: 통과
   - ❌ 빨강: 실패
   - ⚠️ 노랑: 불확정
   - ⏭️ 회색: 건너뜀

2. **테스트 이름**
   - 형식: `클래스명.테스트메서드명`
   - 예시: `UnityMainThreadDispatcherTests.Instance_Should_CreateSingleton`

3. **실행 시간**
   - 초 단위로 표시 (예: `0.012s`)

4. **실패 세부 정보** (실패 시)
   - 스택 트레이스
   - 예상 값 vs. 실제 값
   - 어설션 메시지

---

## 테스트 커버리지

### 현재 테스트 커버리지

| 컴포넌트 | 테스트 수 | 커버리지 |
|-----------|----------|----------|
| **UnityMainThreadDispatcher** | 10개 | Critical 스레드 안전성 |
| **GameObject 캐싱** | 13개 | 성능 최적화 |
| **Vector3 검증** | 20개 | 보안 (NaN/Infinity) |
| **JSON-RPC 프로토콜** | 23개 | 프로토콜 준수 |
| **총계** | **66개** | **핵심 기능** |

### 테스트된 항목

#### 1. 스레드 안전성 (Critical)
- ✅ 싱글톤 인스턴스 생성
- ✅ 메인 스레드 실행 검증
- ✅ 여러 액션 순서대로 실행
- ✅ 예외 처리
- ✅ 동시 접근 (5개 스레드)
- ✅ 백그라운드 스레드에서 Unity API 호출

#### 2. 성능 (캐싱)
- ✅ 캐싱을 사용한 GameObject 검색
- ✅ 캐시 히트 성능 (10x-100x 빠름)
- ✅ GameObject 파괴 시 캐시 무효화
- ✅ 비활성 GameObject 처리
- ✅ 중첩된 GameObject 지원
- ✅ 대규모 캐싱 (100개 이상 객체)

#### 3. 보안 (검증)
- ✅ NaN 감지 (x, y, z)
- ✅ PositiveInfinity 감지
- ✅ NegativeInfinity 감지
- ✅ 유효한 값 허용 (zero, positive, negative)
- ✅ Float 정밀도 보존
- ✅ 엣지 케이스 (MaxValue, MinValue)

#### 4. 프로토콜 준수 (JSON-RPC 2.0)
- ✅ 요청 직렬화/역직렬화
- ✅ 응답 직렬화
- ✅ 요청 ID 보존된 에러 응답
- ✅ 에러 코드 (-32700, -32600, -32601, -32602, -32603)
- ✅ 파라미터 역직렬화
- ✅ 복잡한 파라미터 처리
- ✅ JSON-RPC 2.0 사양 준수

### 테스트되지 않은 항목 (향후)

- ⏳ WebSocket 통신 (통합 테스트)
- ⏳ 핸들러 구현 (GameObject, Transform 등)
- ⏳ 서버 라이프사이클 (시작, 중지, 재연결)
- ⏳ Console 로그 수집
- ⏳ Scene 로딩
- ⏳ Undo 시스템 통합

---

## 문제 해결

### 문제: "Test Framework package not found"

**모든 Unity 버전 (2019.2 이상)**:
- 이 문제는 거의 발생하지 않음 (자동 포함)
- Test Runner 창이 없다면:
  1. Unity Editor 재시작
  2. Package Manager에서 "Built-in packages" 확인
  3. Unity 설치가 손상되었을 수 있음 → 재설치 고려

**Unity 6+**:
- Core Package이므로 반드시 포함되어 있음
- 문제 발생 시 Unity Hub에서 Editor 재설치

### 문제: "Assembly reference errors"

**해결방법:**
1. `Runtime/`에 `UnityEditorToolkit.asmdef`가 있는지 확인
2. 테스트 어셈블리 정의가 메인 어셈블리를 참조하는지 확인:
   ```json
   {
     "references": ["UnityEditorToolkit"]
   }
   ```
3. 패키지 재임포트: 패키지 우클릭 → Reimport

### 문제: Test Runner에 테스트가 나타나지 않음

**해결방법:**
1. `UNITY_INCLUDE_TESTS` 정의가 설정되었는지 확인 (testables로 자동)
2. 어셈블리 정의에 `"autoReferenced": false`가 있는지 확인
3. Unity Editor 재시작
4. Test Runner 창에서 "Refresh" 클릭

### 문제: "DllNotFoundException: websocket-sharp"

**해결방법:**
테스트는 websocket-sharp가 필요하지 않지만 (실제 서버 연결 없음), 오류 발생 시:

1. `ThirdParty/websocket-sharp/websocket-sharp.dll`이 있는지 확인
2. 설치 스크립트 실행 (QUICKSTART.md 참조)
3. Unity Editor 재시작

### 문제: 테스트가 "NullReferenceException"로 실패

**해결방법:**
1. 테스트가 GameObject 설정이 필요한지 확인
2. `[SetUp]` 메서드가 각 테스트 전에 실행되는지 확인
3. `[TearDown]`이 제대로 정리하는지 확인
4. 테스트를 개별로 실행하여 문제 격리

### 문제: "UnityMainThreadDispatcher 테스트 실패"

**해결방법:**
1. 코루틴용 테스트가 `[Test]`가 아닌 `[UnityTest]` 속성 사용하는지 확인
2. `yield return null;`을 추가하여 Update() 실행 대기
3. 여러 디스패처 인스턴스 충돌 확인 (TearDown에서 정리)

### 문제: 느린 테스트 실행

**예상 시간:**
- 모든 테스트: ~2-5초
- UnityMainThreadDispatcher: ~0.5초 (프레임 대기 포함)
- GameObjectCaching: ~0.3초
- Vector3Validation: ~0.1초 (순수 로직)
- JsonRpcProtocol: ~0.2초 (직렬화)

**느린 경우:**
1. Unity가 테스트 중에 재컴파일하지 않는지 확인
2. 불필요한 Editor 창 닫기
3. 자동 새로고침 비활성화: `Edit → Preferences → Asset Pipeline → Auto Refresh (off)`

---

## 빠른 명령어 참조

```bash
# Test Runner 열기
Window → General → Test Runner
단축키: Ctrl+Alt+T (Win/Linux) 또는 Cmd+Alt+T (Mac)

# 모든 테스트 실행
Test Runner에서 "Run All" 버튼 클릭

# 명령줄에서 실행 (Windows)
Unity.exe -runTests -batchmode -projectPath "path" -testResults "results.xml" -testPlatform EditMode

# 테스트 결과 보기
test-results.xml을 XML 뷰어나 CI 도구로 열기
```

---

## 실전 사용법

### 1. Unity Editor에서 테스트 실행 (가장 쉬움)

```
1. Window → General → Test Runner
2. "EditMode" 탭 클릭
3. "Run All" 클릭
4. 결과 확인 (2-5초 소요)
```

**결과 예시:**
```
✅ 66개 테스트 통과
⏱️ 2.3초
```

### 2. 특정 컴포넌트만 테스트

**스레드 안전성만 테스트:**
```
UnityMainThreadDispatcherTests 우클릭 → Run
```

**성능(캐싱)만 테스트:**
```
GameObjectCachingTests 우클릭 → Run
```

### 3. 코드 수정 후 확인

코드를 수정했다면:

1. **영향받는 테스트만 실행** (빠름)
   - 예: Transform 코드 수정 → Vector3ValidationTests 실행

2. **모든 테스트 실행** (안전)
   - "Run All" 클릭
   - 다른 부분에 영향 없는지 확인

---

## 추가 리소스

### Unity 문서

- [Unity Test Framework Manual](https://docs.unity3d.com/Packages/com.unity.test-framework@latest)
- [테스트 작성](https://docs.unity3d.com/Packages/com.unity.test-framework@latest/index.html?subfolder=/manual/workflow-create-test.html)

### Unity Editor Toolkit

- [메인 README](../README.ko.md)
- [빠른 시작 가이드](./QUICKSTART.ko.md)
- [명령어 로드맵](./COMMANDS.md)
- **구현된 명령어 카테고리:**
  - [연결 및 상태](./COMMANDS_CONNECTION_STATUS.md)
  - [GameObject 및 계층 구조](./COMMANDS_GAMEOBJECT_HIERARCHY.md)
  - [Transform](./COMMANDS_TRANSFORM.md)
  - [Scene 관리](./COMMANDS_SCENE.md)
  - [Asset Database 및 Editor](./COMMANDS_EDITOR.md)
  - [Console 및 로깅](./COMMANDS_CONSOLE.md)

---

**총 테스트**: 66개
