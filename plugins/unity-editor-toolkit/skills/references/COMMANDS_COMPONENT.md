# Unity Editor Toolkit - Component Commands

완전한 Component 조작 및 관리 명령어 레퍼런스입니다.

**Last Updated**: 2025-01-25

---

## comp list

GameObject의 모든 컴포넌트를 나열합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp list <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로 (예: "Player" 또는 "Environment/Player")
```

**Options:**
```
--include-disabled     비활성 컴포넌트도 포함 (기본값: 활성 컴포넌트만 표시)
--type-only           컴포넌트 타입만 표시 (세부 정보 제외)
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Output Icons:**
```
●  활성 빌트인 컴포넌트
○  비활성 컴포넌트
★  MonoBehaviour (커스텀 스크립트)
```

**Examples:**
```bash
# GameObject의 모든 활성 컴포넌트 나열
cd <unity-project-root> && node .unity-websocket/uw comp list "Player"

# 비활성 컴포넌트도 포함하여 나열
cd <unity-project-root> && node .unity-websocket/uw comp list "Enemy" --include-disabled

# 타입만 표시
cd <unity-project-root> && node .unity-websocket/uw comp list "Character" --type-only

# JSON 형식으로 출력
cd <unity-project-root> && node .unity-websocket/uw comp list "Player" --json
```

---

## comp add

GameObject에 컴포넌트를 추가합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp add <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            추가할 컴포넌트 타입 (예: Rigidbody, BoxCollider, AudioSource)
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Supported Component Types:**
- Unity Built-in: Rigidbody, Rigidbody2D, BoxCollider, SphereCollider, CapsuleCollider, MeshCollider, AudioSource, AudioListener, Camera, Light, etc.
- Physics: Rigidbody, Rigidbody2D, Joint, SpringJoint, HingeJoint, ConfigurableJoint, etc.
- Rendering: MeshRenderer, SkinnedMeshRenderer, SpriteRenderer, LineRenderer, TrailRenderer, etc.
- Audio: AudioSource, AudioListener, AudioReverbFilter, etc.
- Custom: 모든 MonoBehaviour 스크립트

**Examples:**
```bash
# Rigidbody 추가
cd <unity-project-root> && node .unity-websocket/uw comp add "Player" Rigidbody

# BoxCollider 추가
cd <unity-project-root> && node .unity-websocket/uw comp add "Enemy" BoxCollider

# 커스텀 스크립트 추가
cd <unity-project-root> && node .unity-websocket/uw comp add "Character" PlayerController

# JSON 형식으로 응답 받기
cd <unity-project-root> && node .unity-websocket/uw comp add "Item" Collider --json
```

**Important:**
- Transform 컴포넌트는 모든 GameObject에 자동으로 포함되므로 추가할 수 없습니다.
- 같은 타입의 컴포넌트가 이미 존재하면 중복 추가되지 않습니다.

---

## comp remove

GameObject에서 컴포넌트를 제거합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp remove <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            제거할 컴포넌트 타입
```

**Options:**
```
--force               확인 없이 제거
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# 컴포넌트 제거
cd <unity-project-root> && node .unity-websocket/uw comp remove "Player" AudioSource

# Rigidbody 제거
cd <unity-project-root> && node .unity-websocket/uw comp remove "Enemy" Rigidbody

# 확인 없이 제거
cd <unity-project-root> && node .unity-websocket/uw comp remove "Temp" BoxCollider --force
```

**Important:**
- Transform은 필수 컴포넌트이므로 제거할 수 없습니다.
- Ctrl+Z (Undo)로 되돌릴 수 있습니다.

---

## comp enable

GameObject의 컴포넌트를 활성화합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp enable <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            활성화할 컴포넌트 타입
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# AudioSource 활성화
cd <unity-project-root> && node .unity-websocket/uw comp enable "Player" AudioSource

# 커스텀 스크립트 활성화
cd <unity-project-root> && node .unity-websocket/uw comp enable "Character" PlayerController

# JSON 응답
cd <unity-project-root> && node .unity-websocket/uw comp enable "Enemy" AIController --json
```

**Important:**
- Behaviour를 상속한 컴포넌트(MonoBehaviour, Renderer, AudioSource 등)만 활성화/비활성화 가능합니다.

---

## comp disable

GameObject의 컴포넌트를 비활성화합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp disable <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            비활성화할 컴포넌트 타입
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# AudioSource 비활성화
cd <unity-project-root> && node .unity-websocket/uw comp disable "Player" AudioSource

# 커스텀 스크립트 비활성화
cd <unity-project-root> && node .unity-websocket/uw comp disable "Enemy" EnemyAI

# 렌더러 비활성화
cd <unity-project-root> && node .unity-websocket/uw comp disable "Visual" MeshRenderer --json
```

**Important:**
- Behaviour를 상속한 컴포넌트만 비활성화 가능합니다.
- 게임 오브젝트가 비활성화되어 있으면 모든 컴포넌트가 자동으로 비활성 상태입니다.

---

## comp get

컴포넌트의 속성값을 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp get <gameobject> <component> [property] [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            컴포넌트 타입
[property]             특정 속성 이름 (생략하면 모든 속성 표시)
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# Rigidbody의 모든 속성 조회
cd <unity-project-root> && node .unity-websocket/uw comp get "Player" Rigidbody

# 특정 속성 값 조회
cd <unity-project-root> && node .unity-websocket/uw comp get "Player" Rigidbody mass

# Transform 위치 조회
cd <unity-project-root> && node .unity-websocket/uw comp get "Enemy" Transform localPosition

# JSON 형식으로 출력
cd <unity-project-root> && node .unity-websocket/uw comp get "Character" Camera fieldOfView --json
```

**Supported Property Types:**
- Primitive: int, float, bool, string
- Unity Types: Vector2, Vector3, Vector4, Color, Rect, Bounds
- Enum: 열거형 값
- Reference: 게임 오브젝트/에셋 참조

---

## comp set

컴포넌트의 속성값을 설정합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp set <gameobject> <component> <property> <value> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            컴포넌트 타입
<property>             속성 이름
<value>                새 값 (쉼표로 구분된 벡터, 또는 일반 값)
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Value Formats:**
```
Integer/Float:        123 또는 45.67
Boolean:              true 또는 false
String:               "Hello World" 또는 HelloWorld
Vector3:              "1,2,3" (공백 없이)
Color:                "1,0,0,1" (R,G,B,A)
Enum:                 열거형 이름 (예: "Linear")
ObjectReference:      "GameObjectName" 또는 "GameObject:Component" 또는 "Assets/path/to/asset.ext"
```

**ObjectReference Formats (컴포넌트/에셋 참조):**
| 형식 | 예시 | 설명 |
|------|------|------|
| `null` | `"null"` | 참조 해제 |
| `GameObject` | `"Player"` | GameObject 참조 |
| `GameObject:Component` | `"GameHUD:UnityEngine.UIElements.UIDocument"` | 컴포넌트 참조 |
| `Asset Path` | `"Assets/Materials/Red.mat"` | 에셋 참조 |

**⚠️ 중요: 컴포넌트 참조 시 전체 네임스페이스 필요**
```
✅ "GameHUD:UnityEngine.UIElements.UIDocument"   (전체 네임스페이스)
❌ "GameHUD:UIDocument"                           (작동 안함)
```

**Examples:**
```bash
# Rigidbody mass 설정
cd <unity-project-root> && node .unity-websocket/uw comp set "Player" Rigidbody mass 2.5

# 중력 비활성화
cd <unity-project-root> && node .unity-websocket/uw comp set "Floating" Rigidbody useGravity false

# 위치 설정
cd <unity-project-root> && node .unity-websocket/uw comp set "Enemy" Transform localPosition "5,10,0"

# Camera FOV 설정
cd <unity-project-root> && node .unity-websocket/uw comp set "MainCamera" Camera fieldOfView 75

# 색상 설정 (R,G,B,A)
cd <unity-project-root> && node .unity-websocket/uw comp set "Material" SpriteRenderer color "1,0,0,1"

# Enum 값 설정
cd <unity-project-root> && node .unity-websocket/uw comp set "Collider" Rigidbody constraints "FreezeRotationZ"

# ObjectReference 설정 - GameObject 참조
cd <unity-project-root> && node .unity-websocket/uw comp set "Enemy" AIController target "Player"

# ObjectReference 설정 - 컴포넌트 참조 (전체 네임스페이스 필수)
cd <unity-project-root> && node .unity-websocket/uw comp set "HUD" GameView uiDocument "GameHUD:UnityEngine.UIElements.UIDocument"

# ObjectReference 설정 - 에셋 참조
cd <unity-project-root> && node .unity-websocket/uw comp set "Enemy" SpriteRenderer sprite "Assets/Sprites/Enemy.png"

# ObjectReference 설정 - 참조 해제
cd <unity-project-root> && node .unity-websocket/uw comp set "Item" Pickup targetObject "null"
```

**Important:**
- Ctrl+Z (Undo)로 되돌릴 수 있습니다.
- 변경 전 기존 값을 응답에 포함합니다.

---

## comp inspect

컴포넌트의 모든 속성과 상태를 표시합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp inspect <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            컴포넌트 타입
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# Rigidbody 전체 검사
cd <unity-project-root> && node .unity-websocket/uw comp inspect "Player" Rigidbody

# Transform 검사
cd <unity-project-root> && node .unity-websocket/uw comp inspect "Enemy" Transform

# 커스텀 스크립트 검사
cd <unity-project-root> && node .unity-websocket/uw comp inspect "Character" PlayerController

# JSON으로 출력 및 파일 저장
cd <unity-project-root> && node .unity-websocket/uw comp inspect "Item" Collider --json > component.json
```

**Output Format:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ComponentName
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ● Type: Full.Type.Name
  ● Enabled: true

    propertyName1  : PropertyType = value1
    propertyName2  : PropertyType = value2
    ...
```

---

## comp move-up

컴포넌트를 컴포넌트 목록에서 위로 이동합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp move-up <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            이동할 컴포넌트 타입
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# Rigidbody를 위로 이동
cd <unity-project-root> && node .unity-websocket/uw comp move-up "Player" Rigidbody

# BoxCollider를 위로 이동
cd <unity-project-root> && node .unity-websocket/uw comp move-up "Enemy" BoxCollider

# 먼저 목록 확인
cd <unity-project-root> && node .unity-websocket/uw comp list "Character"
# 그 다음 이동
cd <unity-project-root> && node .unity-websocket/uw comp move-up "Character" CustomScript
```

**Important:**
- Transform은 항상 첫 번째 위치에 고정되므로 이동할 수 없습니다.
- Inspector의 표시 순서가 변경됩니다.
- 일부 컴포넌트는 실행 순서에 영향을 받을 수 있습니다.

---

## comp move-down

컴포넌트를 컴포넌트 목록에서 아래로 이동합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp move-down <gameobject> <component> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<component>            이동할 컴포넌트 타입
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# Rigidbody를 아래로 이동
cd <unity-project-root> && node .unity-websocket/uw comp move-down "Player" Rigidbody

# 컴포넌트 순서 재정렬
cd <unity-project-root> && node .unity-websocket/uw comp move-down "Character" AudioSource
cd <unity-project-root> && node .unity-websocket/uw comp move-down "Character" AudioSource

# 최종 결과 확인
cd <unity-project-root> && node .unity-websocket/uw comp list "Character"
```

**Important:**
- 이미 마지막 위치에 있으면 이동할 수 없습니다.
- Transform은 항상 첫 번째 위치입니다.

---

## comp copy

한 GameObject의 컴포넌트를 다른 GameObject로 복사합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw comp copy <source> <component> <target> [options]
```

**Arguments:**
```
<source>               원본 GameObject 이름 또는 경로
<component>            복사할 컴포넌트 타입
<target>               대상 GameObject 이름 또는 경로
```

**Options:**
```
--json                JSON 형식으로 출력
--timeout <ms>        WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help            명령어 도움말 표시
```

**Examples:**
```bash
# Rigidbody 복사
cd <unity-project-root> && node .unity-websocket/uw comp copy "Player" Rigidbody "Enemy"

# 여러 컴포넌트 복사
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" BoxCollider "New"
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" Rigidbody "New"
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" AudioSource "New"

# 스크립트 복사
cd <unity-project-root> && node .unity-websocket/uw comp copy "Character" PlayerController "Character2"

# 결과 확인
cd <unity-project-root> && node .unity-websocket/uw comp list "New"
```

**Important:**
- 원본 컴포넌트의 모든 속성이 복사됩니다.
- 대상 GameObject에 같은 타입의 컴포넌트가 있으면 덮어쓰지 않고 새로 추가합니다.
- Ctrl+Z (Undo)로 되돌릴 수 있습니다.

---

## Tips & Best Practices

### 컴포넌트 순서 최적화
```bash
# 1. 목록으로 현재 순서 확인
cd <unity-project-root> && node .unity-websocket/uw comp list "Player"

# 2. 필요한 순서대로 정렬
cd <unity-project-root> && node .unity-websocket/uw comp move-up "Player" Rigidbody
cd <unity-project-root> && node .unity-websocket/uw comp move-up "Player" BoxCollider

# 3. 최종 확인
cd <unity-project-root> && node .unity-websocket/uw comp list "Player"
```

### GameObject 템플릿 만들기
```bash
# 1. 하나의 GameObject에 모든 컴포넌트 추가 및 설정
cd <unity-project-root> && node .unity-websocket/uw comp add "Template" Rigidbody
cd <unity-project-root> && node .unity-websocket/uw comp add "Template" BoxCollider
cd <unity-project-root> && node .unity-websocket/uw comp add "Template" AudioSource
cd <unity-project-root> && node .unity-websocket/uw comp set "Template" Rigidbody mass 2.0

# 2. 다른 GameObject들에 복사
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" Rigidbody "Object1"
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" BoxCollider "Object1"
cd <unity-project-root> && node .unity-websocket/uw comp copy "Template" AudioSource "Object1"
```

### 대량 설정 변경
```bash
# 여러 컴포넌트의 속성을 한 번에 변경 (스크립트)
for obj in "Enemy1" "Enemy2" "Enemy3"; do
  cd <unity-project-root> && node .unity-websocket/uw comp set "$obj" Rigidbody mass 1.5
  cd <unity-project-root> && node .unity-websocket/uw comp set "$obj" AudioSource volume 0.8
done
```

---

## Troubleshooting

### 컴포넌트 타입을 찾을 수 없음
**문제**: `Component type not found`

**해결**:
- 컴포넌트 이름이 정확한지 확인 (대소문자 구분)
- 예: `Rigidbody` (O), `rigidbody` (X), `RigidBody` (X)
- 네임스페이스가 필요한 경우: `UnityEngine.Rigidbody`

### 속성을 변경할 수 없음
**문제**: `Failed to set property`

**해결**:
- 속성 이름이 정확한지 확인
- Inspector에 표시되지 않는 내부 속성(`m_`로 시작)은 변경 불가
- 값의 형식이 맞는지 확인 (예: Vector3는 "x,y,z" 형식)

### 컴포넌트 제거 불가
**문제**: `Cannot remove component`

**해결**:
- Transform은 필수 컴포넌트이므로 제거 불가
- 일부 컴포넌트는 RequireComponent로 인해 제거 불가능할 수 있음

### ObjectReference를 찾을 수 없음
**문제**: `ObjectReference not found: 'GameHUD:UIDocument'`

**해결**:
- **컴포넌트 참조 시 전체 네임스페이스 필수**
  - ✅ `"GameHUD:UnityEngine.UIElements.UIDocument"`
  - ❌ `"GameHUD:UIDocument"`
- 일반적인 Unity 네임스페이스:
  - `UnityEngine.` - 기본 컴포넌트 (Rigidbody, Collider 등)
  - `UnityEngine.UI.` - uGUI 컴포넌트 (Image, Text 등)
  - `UnityEngine.UIElements.` - UI Toolkit 컴포넌트 (UIDocument 등)
- GameObject 이름이 정확한지 확인
- 비활성 GameObject는 GameObject.Find로 찾을 수 없음

---

## Related Commands

- [GameObject & Hierarchy Commands](./COMMANDS_GAMEOBJECT_HIERARCHY.md) - GameObject 생성, 계층 구조 관리
- [Transform Commands](./COMMANDS_TRANSFORM.md) - 위치, 회전, 크기 조작
- [Scene Commands](./COMMANDS_SCENE.md) - 씬 관리
- [Asset Commands](./COMMANDS_ASSET.md) - 에셋 및 ScriptableObject 관리
