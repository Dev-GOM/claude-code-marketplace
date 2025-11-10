# Unity Dev Toolkit

> **Unity 게임 개발을 위한 AI 기반 도우미**

> ⚠️ **실험적 기능**
>
> 이 플러그인은 현재 **실험 단계**입니다. 기능이 변경될 수 있으며, 일부 기능이 예상대로 작동하지 않을 수 있습니다. 문제가 발견되면 [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)에 보고해 주세요.
>
> **알려진 제한사항:**
> - 템플릿 생성 시 수동 매개변수 입력 필요
> - 씬 최적화 분석이 모든 Unity 버전을 다루지 못할 수 있음
> - UI 시스템 선택(UGUI vs UI Toolkit)은 프로젝트 요구사항에 따라 결정되어야 함
> - Skills는 모델이 자동 호출하며 모든 상황에서 활성화되지 않을 수 있음

> 스크립팅, 리팩토링, 최적화를 위한 전문 에이전트, 지능형 자동화, 프로덕션 수준의 스크립트 템플릿을 통해 전문적인 Unity 개발 지원을 제공하는 종합 Claude Code 플러그인입니다.

## 🌟 기능

이 플러그인은 Unity 개발을 강화하는 세 가지 강력한 Claude Code 기능을 통합합니다:

### 📝 슬래시 커맨드
Unity 개발 도구에 빠르게 접근:
- `/unity:new-script` - 모범 사례가 적용된 Unity 스크립트 생성
- `/unity:optimize-scene` - 포괄적인 씬 성능 분석
- `/unity:setup-test` - 완전한 테스트 환경 구축

### 🤖 전문 에이전트
Unity 개발을 위한 특화된 AI 어시스턴트:
- `@unity-scripter` - 깔끔하고 고성능 코드를 위한 C# 스크립팅 전문가
- `@unity-refactor` - 코드 품질 및 유지보수성 개선을 위한 리팩토링 전문가
- `@unity-performance` - 성능 최적화 전문가
- `@unity-architect` - 게임 시스템 아키텍처 컨설턴트

### ⚡ Agent Skills
Claude가 관련 상황에서 자동으로 사용하는 모델 호출 기능:
- **unity-script-validator** - Unity C# 스크립트의 모범 사례 및 성능 검증
- **unity-scene-optimizer** - 씬의 성능 병목 현상 분석
- **unity-template-generator** - 스크립트 템플릿 생성 지원
- **unity-ui-selector** - 프로젝트 요구사항에 따른 UGUI vs UI Toolkit 선택 가이드
- **unity-uitoolkit** - UI Toolkit 개발 지원 (UXML, USS, VisualElement API)
- **unity-compile-fixer** - VSCode diagnostics를 사용한 Unity C# 컴파일 에러 감지 및 해결
- **unity-test-runner** - Unity Test Framework 테스트 실행 및 상세한 실패 리포트 분석

## 🚀 설치

### 빠른 설치

```bash
# 마켓플레이스 추가 (아직 추가하지 않은 경우)
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# 플러그인 설치
/plugin install unity-dev-toolkit@dev-gom-plugins

# Claude Code 재시작
claude -r
```

### 설치 확인

```bash
/plugin
```

활성화된 플러그인 목록에서 "unity-dev-toolkit"을 확인할 수 있어야 합니다.

## 📖 사용법

### Unity 스크립트 생성

```bash
# MonoBehaviour 스크립트 생성
/unity:new-script MonoBehaviour PlayerController

# ScriptableObject 생성
/unity:new-script ScriptableObject WeaponData

# Editor 스크립트 생성
/unity:new-script EditorScript CustomTool

# 테스트 스크립트 생성
/unity:new-script TestScript PlayerControllerTests
```

생성된 스크립트에는 다음이 포함됩니다:
- ✅ Unity 모범 사례 및 규칙
- ✅ 적절한 region 구성
- ✅ XML 문서화 주석
- ✅ 성능을 고려한 패턴
- ✅ Null 안전성 및 검증
- ✅ 컴포넌트 캐싱
- ✅ 완전한 생명주기 메서드

**생성된 MonoBehaviour 예시:**
```csharp
using UnityEngine;

namespace MyGame.Player
{
    /// <summary>
    /// 플레이어 이동 및 입력을 처리합니다
    /// </summary>
    public class PlayerController : MonoBehaviour
    {
        #region Serialized Fields
        [SerializeField] private float moveSpeed = 5f;
        [SerializeField] private float jumpForce = 10f;
        #endregion

        #region Private Fields
        private Rigidbody rb;
        private bool isGrounded;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
        }

        private void Update()
        {
            HandleInput();
        }

        private void FixedUpdate()
        {
            ApplyMovement();
        }
        #endregion

        #region Private Methods
        private void HandleInput()
        {
            // 입력 처리 로직
        }

        private void ApplyMovement()
        {
            // 물리 기반 이동
        }
        #endregion
    }
}
```

### 씬 성능 최적화

```bash
# 현재 씬 분석
/unity:optimize-scene

# 특정 씬 분석
/unity:optimize-scene Assets/Scenes/GameLevel.unity

# 전체 프로젝트 분석
/unity:optimize-scene --full-project
```

최적화 분석 범위:
- 🎨 **렌더링**: 드로우 콜, 배칭, 머티리얼, 텍스처
- ⚡ **물리**: Rigidbody, 콜라이더, 충돌 매트릭스
- 📜 **스크립팅**: Update 루프, 컴포넌트 캐싱, GC 할당
- 💾 **메모리**: 텍스처 사용, 에셋 로딩, 오브젝트 풀링
- 📱 **모바일**: 플랫폼별 최적화

**분석 결과 예시:**
```markdown
# Unity 씬 성능 분석

## 현재 지표
- 드로우 콜: 250 ⚠️
- 삼각형: 75,000 ⚠️
- 활성 GameObject: 450
- 스크립트 컴포넌트: 120

## 주요 이슈
1. 🔴 과도한 드로우 콜 (250개, 목표: <100)
2. 🔴 압축되지 않은 4096x4096 텍스처 5개
3. 🟡 50개 이상의 오브젝트에 static batching 미적용

## 권장사항
1. Static batching 활성화...
2. 머티리얼 결합...
3. 오브젝트 풀링 구현...

## 예상 효과
- 드로우 콜: 250 → 80 (68% 감소)
- 프레임 시간: 25ms → 12ms (52% 개선)
```

### 테스트 설정

```bash
# 스크립트에 대한 테스트 설정
/unity:setup-test PlayerController

# PlayMode 테스트 설정
/unity:setup-test playmode PlayerMovement

# 전체 테스트 환경 설정
/unity:setup-test --full-project
```

생성된 테스트 스위트 포함 사항:
- ✅ Setup/TearDown이 포함된 완전한 테스트 구조
- ✅ 개별 메서드에 대한 단위 테스트
- ✅ Unity 생명주기를 위한 PlayMode 테스트
- ✅ 컴포넌트 상호작용을 위한 통합 테스트
- ✅ 성능 벤치마크
- ✅ 엣지 케이스 커버리지
- ✅ Assembly definition 파일

**테스트 예시:**
```csharp
[Test]
public void Jump_WhenGrounded_IncreasesYPosition()
{
    // Arrange
    var initialY = player.transform.position.y;

    // Act
    player.Jump();

    // Assert
    Assert.Greater(player.transform.position.y, initialY);
}
```

### 전문 에이전트 사용

대화에서 에이전트를 직접 호출할 수 있습니다:

```
@unity-scripter WASD 이동과 점프 기능이 있는 플레이어 컨트롤러를 만들어줘

@unity-performance 게임이 30 fps로 떨어지는 이유를 분석해줘

@unity-architect 인벤토리 시스템을 어떻게 구조화해야 할까?
```

**에이전트 전문 분야:**

**@unity-scripter**
- C# 스크립팅 모범 사례
- Unity API 전문 지식
- 컴포넌트 아키텍처
- 성능을 고려한 코딩
- 코드 구성

**@unity-refactor**
- 코드 품질 개선
- 디자인 패턴 적용
- 레거시 코드 현대화
- SOLID 원칙
- 테스트 주도 리팩토링

**@unity-performance**
- 프로파일링 및 벤치마킹
- 렌더링 최적화
- 메모리 관리
- CPU/GPU 최적화
- 플랫폼별 튜닝

**@unity-architect**
- 시스템 디자인 패턴
- 프로젝트 구조
- ScriptableObject 아키텍처
- 의존성 관리
- 확장 가능한 게임 시스템

## 🔧 작동 방식

### Agent Skills 시스템

Agent Skills는 **모델이 자동 호출**합니다 - Claude가 요청에 따라 자동으로 사용 시기를 결정합니다. 명시적으로 호출할 필요가 없으며, 관련 상황에서 자동으로 활성화됩니다.

**1. 스크립트 검증 Skill**
Unity 스크립트 리뷰를 요청하면 `unity-script-validator` Skill이 자동으로:
- ✅ public 필드 확인 ([SerializeField] private 제안)
- ✅ Update 루프에서 GetComponent 감지
- ✅ 문자열 연결 이슈 식별
- ✅ XML 문서화 제안
- ✅ 네임스페이스 사용 권장
- ✅ 캐시된 참조 확인

**사용 예시:**
```
사용자: 이 Unity 스크립트를 모범 사례에 따라 검토해줄 수 있어?

Claude가 unity-script-validator를 활성화하고 다음을 제공:
🎮 Unity 스크립트 분석

⚠️ 발견된 이슈:
- Update에서 GetComponent() 호출 - Awake에서 캐시하세요
- public 필드 발견 - [SerializeField] private을 사용하세요

💡 제안사항:
- public 메서드에 XML 문서화 추가
- #region 지시문으로 코드 구성
```

**2. 씬 최적화 Skill**
Unity 씬 성능을 논의할 때 `unity-scene-optimizer` Skill이 다음을 분석:
- ⚠️ 높은 GameObject 수
- ⚠️ 과도한 실시간 조명
- ⚠️ 드로우 콜 최적화
- ⚠️ 텍스처 압축
- 💡 배칭 기회

**3. UI 시스템 선택 Skill**
UI 개발을 시작할 때 `unity-ui-selector` Skill이 다음을 기반으로 UGUI와 UI Toolkit 중 선택을 안내:
- 대상 Unity 버전
- 프로젝트 복잡도
- 플랫폼 요구사항
- 팀 경험

**4. 컴파일 에러 해결 Skill**
Unity 프로젝트에 컴파일 에러가 있을 때 `unity-compile-fixer` Skill이 자동으로:
- 🔍 VSCode diagnostics(OmniSharp C# language server)에서 에러 수집
- 📊 일반적인 Unity 문제 데이터베이스와 에러 패턴 분석
- 💡 사용자 승인을 위한 컨텍스트 인식 솔루션 제안
- 🔧 코드 구조를 유지하면서 수정 적용
- ✅ Unity .meta 파일에 대한 버전 관리 상태 확인

**사용 예시:**
```
사용자: Unity 프로젝트에 컴파일 에러가 있는데 고쳐줄 수 있나요?

Claude가 unity-compile-fixer를 활성화하여 다음을 제공:
🔍 3개의 C# 컴파일 에러 발견

❌ CS0246 at PlayerController.cs:45
   타입 또는 네임스페이스 이름 'Rigidbody'를 찾을 수 없습니다

💡 제안된 수정:
   PlayerController.cs 상단에 'using UnityEngine;' 추가

❌ CS1061 at GameManager.cs:23
   'GameObject'에 'position' 정의가 포함되어 있지 않습니다

💡 제안된 수정:
   'gameObject.position' 대신 'transform.position' 사용

✅ 모든 수정을 적용하시겠습니까? [예/아니오]
```

**5. 테스트 러너 Skill**
Unity 테스트를 실행할 때 `unity-test-runner` Skill이 자동으로:
- 🔍 여러 플랫폼(Windows/macOS/Linux)에서 Unity 에디터 설치 감지
- ⚙️ 테스트 매개변수 구성 (EditMode/PlayMode, 카테고리, 필터)
- 🚀 적절한 타임아웃으로 Unity CLI를 통해 테스트 실행
- 📊 NUnit XML 결과 파싱 및 실패 세부 정보 추출
- 💡 일반적인 테스트 패턴과 실패 원인 분석
- 📝 파일:라인 참조 및 수정 제안이 포함된 상세 리포트 생성

**사용 예시:**
```
사용자: 내 프로젝트의 모든 Unity 테스트를 실행해줘

Claude가 unity-test-runner를 활성화하여 다음을 제공:
🧪 Unity 테스트 결과

📊 요약:
- 총 테스트: 10
- ✓ 성공: 7 (70%)
- ✗ 실패: 2 (20%)
- ⊘ 스킵: 1 (10%)
- 소요 시간: 12.35초

❌ 실패한 테스트:

1. Tests.Combat.PlayerTests.TestPlayerTakeDamage
   위치: Assets/Tests/Combat/PlayerTests.cs:42
   실패 원인: Expected: 90, But was: 100

   💡 분석: TakeDamage() 호출 후 플레이어 체력이 감소하지 않음

   제안된 수정:
   TakeDamage() 구현 확인:
   ```csharp
   public void TakeDamage(int damage) {
       health -= damage; // 이 라인이 있는지 확인
   }
   ```

2. Tests.AI.EnemyTests.TestEnemyChasePlayer
   위치: Assets/Tests/AI/EnemyTests.cs:67
   실패 원인: TimeoutException - 제한 시간 초과 (5초)

   💡 분석: 무한 루프 또는 코루틴 테스트에서 yield 누락

   제안된 수정:
   [UnityTest] 속성 추가 및 yield return 사용:
   ```csharp
   [UnityTest]
   public IEnumerator TestEnemyChasePlayer() {
       // ... 테스트 코드 ...
       yield return null; // 프레임 대기
   }
   ```
```

### 스크립트 템플릿

플러그인은 프로덕션 수준의 템플릿을 포함합니다:

**MonoBehaviour 템플릿** (`templates/MonoBehaviour.cs.template`)
- 완전한 생명주기 메서드
- Region 구성
- 컴포넌트 캐싱
- XML 문서화
- 검증 헬퍼
- Gizmo 그리기

**ScriptableObject 템플릿** (`templates/ScriptableObject.cs.template`)
- CreateAssetMenu 속성
- 프로퍼티 접근자
- 데이터 검증
- Clone 메서드
- 커스텀 에디터 훅

**Editor 스크립트 템플릿** (`templates/EditorScript.cs.template`)
- EditorWindow 구조
- 탭 시스템
- 설정 저장
- 컨텍스트 메뉴
- 진행 표시줄
- 에셋 유틸리티

**Test 스크립트 템플릿** (`templates/TestScript.cs.template`)
- 완전한 테스트 구조
- Setup/TearDown
- PlayMode 테스트
- 성능 테스트
- 엣지 케이스 처리
- 헬퍼 메서드

**Editor UI Toolkit 템플릿 세트** (3개 파일: C#, UXML, USS)
- `templates/EditorScriptUIToolkit.cs.template` - UI Toolkit EditorWindow
- `templates/EditorScriptUIToolkit.uxml.template` - UXML 구조
- `templates/EditorScriptUIToolkit.uss.template` - USS 스타일링
- VisualElement 기반 에디터 도구
- 요소 참조를 위한 Query API
- 이벤트 처리 시스템
- EditorPrefs 설정 저장
- 다크 테마 최적화 스타일

**Runtime UI Toolkit 템플릿 세트** (3개 파일: C#, UXML, USS)
- `templates/RuntimeUIToolkit.cs.template` - UIDocument MonoBehaviour
- `templates/RuntimeUIToolkit.uxml.template` - 게임 UI 구조
- `templates/RuntimeUIToolkit.uss.template` - 게임 UI 스타일링
- 완전한 게임 UI 시스템 (HUD, 메뉴, 인벤토리)
- UIDocument 통합
- 런타임 이벤트 처리
- 일시정지 지원 표시 제어
- 모바일을 위한 반응형 디자인

## 🎯 워크플로우 예시

이 플러그인을 사용한 일반적인 Unity 개발 워크플로우:

```bash
# 1. 새로운 플레이어 컨트롤러 생성
/unity:new-script MonoBehaviour PlayerController
# Claude가 Unity 모범 사례를 따르는 완전하고 문서화된 스크립트 생성

# 2. 스크립팅 전문가에게 도움 요청
@unity-scripter 새로운 Input System으로 입력 처리를 추가해줘
# 전문 에이전트가 최신 Unity Input System 구현

# 3. 스크립트 리뷰 요청
# Claude가 자동으로 unity-script-validator Skill 사용

# 4. 테스트 생성
/unity:setup-test PlayerController
# 완전한 테스트 스위트 생성

# 5. 씬 최적화
/unity:optimize-scene Assets/Scenes/GameLevel.unity
# 포괄적인 성능 분석 제공

# 6. 아키텍트와 상담
@unity-architect 적 스폰 시스템을 어떻게 구조화해야 할까?
# 아키텍처 가이드 받기

# 7. 성능 최적화
@unity-performance 모바일 기기에서 게임이 느려
# 플랫폼별 최적화 권장사항 받기
```

## ⚙️ 설정

### 템플릿 커스터마이징

템플릿은 생성 중에 대체되는 플레이스홀더를 사용합니다:
- `{{CLASS_NAME}}`: 스크립트 클래스 이름
- `{{NAMESPACE}}`: 네임스페이스
- `{{DESCRIPTION}}`: 스크립트 설명
- `{{FILE_NAME}}`: 출력 파일 이름
- `{{MENU_PATH}}`: Unity 메뉴 경로
- `{{WINDOW_TITLE}}`: 에디터 윈도우 제목

### Skills 비활성화

Skills는 Claude가 관련 상황에서 자동으로 사용합니다. 특정 Skill이 사용되지 않도록 하려면 플러그인을 일시적으로 비활성화할 수 있습니다:

```bash
/plugin disable unity-dev-toolkit
```

다시 활성화하려면:
```bash
/plugin enable unity-dev-toolkit
```

## 🎓 모범 사례

### 스크립트 구성

```
Assets/
├── Scripts/
│   ├── Runtime/
│   │   ├── Core/
│   │   ├── Player/
│   │   ├── Enemy/
│   │   └── Systems/
│   └── Editor/
│       └── Tools/
├── Data/
│   └── ScriptableObjects/
└── Tests/
    ├── EditMode/
    └── PlayMode/
```

### Unity 코딩 규칙

```csharp
// ✅ 좋음
[SerializeField] private float moveSpeed = 5f;
private Rigidbody rb;

void Awake()
{
    rb = GetComponent<Rigidbody>();  // 참조 캐시
}

void Update()
{
    rb.velocity = ...;  // 캐시된 참조 사용
}

// ❌ 나쁨
public float moveSpeed = 5f;  // public 필드

void Update()
{
    GetComponent<Rigidbody>().velocity = ...;  // 비용이 큼!
}
```

### 성능 패턴

**오브젝트 풀링:**
```csharp
// Instantiate/Destroy 대신 오브젝트 재사용
public class BulletPool
{
    private Queue<Bullet> pool = new Queue<Bullet>();

    public Bullet Get()
    {
        if (pool.Count > 0)
        {
            var bullet = pool.Dequeue();
            bullet.gameObject.SetActive(true);
            return bullet;
        }
        return Instantiate(bulletPrefab);
    }

    public void Return(Bullet bullet)
    {
        bullet.gameObject.SetActive(false);
        pool.Enqueue(bullet);
    }
}
```

**할당 방지:**
```csharp
// ❌ 나쁨: 매 프레임 할당
void Update()
{
    string text = "Score: " + score.ToString();
}

// ✅ 좋음: 할당 없음
private StringBuilder sb = new StringBuilder(32);

void Update()
{
    sb.Clear();
    sb.Append("Score: ");
    sb.Append(score);
}
```

## 🐛 문제 해결

### 플러그인이 작동하지 않음

1. 설치 확인:
   ```bash
   /plugin
   ```

2. Node.js 설치 확인:
   ```bash
   node --version
   ```

3. 디버그 모드 활성화:
   ```bash
   claude --debug
   ```

### Skills가 활성화되지 않음

Skills는 모델이 자동 호출하며 Claude가 사용 시기를 결정합니다. Skill이 활성화되지 않으면:

1. 요청을 더 구체적으로 작성해보세요
2. "Unity 스크립트", "씬 성능", "UI 시스템"과 같은 키워드를 언급하세요
3. 플러그인이 활성화되어 있는지 확인: `/plugin`
4. Claude Code 재시작: `claude -r`

### 에이전트가 응답하지 않음

1. 에이전트 파일에 유효한 YAML frontmatter가 있는지 확인
2. 올바른 형식 사용: `@unity-scripter`
3. `.json`이 아닌 `.md` 확장자 확인

## 🤝 기여

기여를 환영합니다! 다음을 수행할 수 있습니다:

1. 저장소 포크
2. 새로운 템플릿 추가
3. 에이전트 및 스킬 개선
4. 커맨드 향상
5. 개선사항 공유

## 📄 라이선스

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE) 참조

## 🎮 Unity 버전 호환성

이 플러그인은 다음과 호환됩니다:
- ✅ Unity 2019.4 LTS 이상
- ✅ Unity 2020.3 LTS
- ✅ Unity 2021.3 LTS
- ✅ Unity 2022.3 LTS
- ✅ Unity 6 (2023+)

## 📋 변경 이력

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
- 🤖 3개 전문 에이전트: `@unity-scripter`, `@unity-performance`, `@unity-architect`
- ⚡ 4개 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector`
- 📄 MonoBehaviour, ScriptableObject, Editor, Test 스크립트를 위한 프로덕션 수준 템플릿

## 🙏 제작자

지능형 AI 지원을 통해 게임 개발 생산성을 향상시키기 위해 Unity 및 Claude Code 커뮤니티를 위해 제작되었습니다.

---

**즐거운 Unity 개발 되세요!** 🚀🎮

이슈나 제안 사항이 있으면 GitHub에서 이슈를 열어주세요.
