# Unity Editor Toolkit - Prefab Commands

완전한 Prefab 조작 및 관리 명령어 레퍼런스입니다.

**Last Updated**: 2025-01-26

---

## prefab instantiate

프리팹을 씬에 인스턴스화합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate <path> [options]
```

**Arguments:**
```
<path>                 프리팹 에셋 경로 (예: "Assets/Prefabs/Player.prefab")
```

**Options:**
```
--name <name>          인스턴스 이름 지정
--position <x,y,z>     생성 위치 (예: "0,1,0")
--rotation <x,y,z>     회전값 (오일러 각도, 예: "0,90,0")
--parent <gameobject>  부모 GameObject 지정
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 기본 인스턴스화
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/Enemy.prefab"

# 이름과 위치 지정
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/Player.prefab" --name "Player1" --position "0,1,0"

# 부모 지정
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/Item.prefab" --parent "ItemContainer"

# 위치와 회전 지정
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/Car.prefab" --position "10,0,5" --rotation "0,180,0"
```

---

## prefab create

씬의 GameObject에서 프리팹을 생성합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab create <gameobject> <path> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<path>                 저장할 프리팹 경로 (예: "Assets/Prefabs/MyPrefab.prefab")
```

**Options:**
```
--overwrite            기존 프리팹 덮어쓰기
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 새 프리팹 생성
cd <unity-project-root> && node .unity-websocket/uw prefab create "Player" "Assets/Prefabs/Player.prefab"

# 기존 프리팹 덮어쓰기
cd <unity-project-root> && node .unity-websocket/uw prefab create "Enemy" "Assets/Prefabs/Enemy.prefab" --overwrite

# 하위 폴더에 저장
cd <unity-project-root> && node .unity-websocket/uw prefab create "Boss" "Assets/Prefabs/Enemies/Boss.prefab"
```

**Important:**
- 프리팹 생성 후 원본 GameObject는 프리팹 인스턴스로 연결됩니다.
- 경로에 존재하지 않는 폴더는 자동 생성됩니다.

---

## prefab unpack

프리팹 인스턴스를 언팩합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab unpack <gameobject> [options]
```

**Arguments:**
```
<gameobject>           프리팹 인스턴스 이름 또는 경로
```

**Options:**
```
--completely           완전히 언팩 (중첩된 프리팹도 모두 언팩)
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 최상위만 언팩 (기본값)
cd <unity-project-root> && node .unity-websocket/uw prefab unpack "Player"

# 완전히 언팩 (모든 중첩 프리팹 포함)
cd <unity-project-root> && node .unity-websocket/uw prefab unpack "ComplexPrefab" --completely
```

**Unpack Modes:**
| 모드 | 설명 |
|------|------|
| OutermostRoot (기본값) | 최상위 프리팹만 언팩, 중첩 프리팹은 유지 |
| Completely | 모든 중첩 프리팹까지 완전히 언팩 |

---

## prefab apply

프리팹 인스턴스의 오버라이드를 원본 프리팹에 적용합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab apply <gameobject> [options]
```

**Arguments:**
```
<gameobject>           프리팹 인스턴스 이름 또는 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 오버라이드 적용
cd <unity-project-root> && node .unity-websocket/uw prefab apply "Player"

# JSON 응답
cd <unity-project-root> && node .unity-websocket/uw prefab apply "Enemy" --json
```

**Important:**
- 모든 오버라이드가 원본 프리팹에 저장됩니다.
- 다른 씬의 동일 프리팹 인스턴스에도 영향을 줍니다.
- Ctrl+Z (Undo)로 되돌릴 수 있습니다.

---

## prefab revert

프리팹 인스턴스의 오버라이드를 되돌립니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab revert <gameobject> [options]
```

**Arguments:**
```
<gameobject>           프리팹 인스턴스 이름 또는 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 모든 오버라이드 되돌리기
cd <unity-project-root> && node .unity-websocket/uw prefab revert "Player"
```

---

## prefab variant

기존 프리팹에서 Variant를 생성합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab variant <sourcePath> <variantPath> [options]
```

**Arguments:**
```
<sourcePath>           원본 프리팹 경로
<variantPath>          Variant 저장 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Variant 생성
cd <unity-project-root> && node .unity-websocket/uw prefab variant "Assets/Prefabs/Enemy.prefab" "Assets/Prefabs/EnemyBoss.prefab"

# 다른 폴더에 Variant 생성
cd <unity-project-root> && node .unity-websocket/uw prefab variant "Assets/Prefabs/Base/Character.prefab" "Assets/Prefabs/Variants/Warrior.prefab"
```

**Important:**
- Variant는 원본 프리팹의 변경사항을 상속받습니다.
- Variant에서 개별 속성을 오버라이드할 수 있습니다.

---

## prefab overrides

프리팹 인스턴스의 오버라이드 목록을 조회합니다.

**Alias:** `prefab get-overrides`

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab overrides <gameobject> [options]
```

**Arguments:**
```
<gameobject>           프리팹 인스턴스 이름 또는 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Output Icons:**
```
●  PropertyOverride (속성 변경)
+  AddedComponent (추가된 컴포넌트)
-  RemovedComponent (제거된 컴포넌트)
★  AddedGameObject (추가된 자식 오브젝트)
```

**Examples:**
```bash
# 오버라이드 목록 조회
cd <unity-project-root> && node .unity-websocket/uw prefab overrides "Player"

# JSON으로 조회
cd <unity-project-root> && node .unity-websocket/uw prefab overrides "Enemy" --json
```

---

## prefab source

프리팹 인스턴스의 원본 프리팹 경로를 조회합니다.

**Alias:** `prefab get-source`

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab source <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 원본 프리팹 경로 조회
cd <unity-project-root> && node .unity-websocket/uw prefab source "Player"
```

**Output:**
```
✓ Prefab info for 'Player':
  Is Prefab Instance: Yes
  Prefab Path: Assets/Prefabs/Player.prefab
  Prefab Type: Regular
  Status: Connected
```

---

## prefab is-instance

GameObject가 프리팹 인스턴스인지 확인합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab is-instance <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 프리팹 인스턴스 여부 확인
cd <unity-project-root> && node .unity-websocket/uw prefab is-instance "Player"
```

**Prefab Types:**
| 타입 | 설명 |
|------|------|
| NotAPrefab | 프리팹이 아님 |
| Regular | 일반 프리팹 |
| Model | 모델 프리팹 (FBX 등) |
| Variant | 프리팹 Variant |
| MissingAsset | 원본 에셋 없음 |

---

## prefab open

프리팹을 편집 모드로 엽니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab open <path> [options]
```

**Arguments:**
```
<path>                 프리팹 에셋 경로
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 프리팹 편집 모드 열기
cd <unity-project-root> && node .unity-websocket/uw prefab open "Assets/Prefabs/Player.prefab"
```

**Important:**
- 프리팹 편집 모드에서는 씬이 아닌 프리팹 컨텍스트에서 작업합니다.
- 변경사항은 자동 저장되지 않습니다.
- `prefab close`로 편집 모드를 종료합니다.

---

## prefab close

프리팹 편집 모드를 닫고 씬으로 돌아갑니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab close [options]
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 프리팹 편집 모드 닫기
cd <unity-project-root> && node .unity-websocket/uw prefab close
```

---

## prefab list

폴더 내 모든 프리팹을 나열합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw prefab list [options]
```

**Options:**
```
--path <path>          검색 폴더 경로 (기본값: "Assets")
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Output Icons:**
```
●  일반 프리팹
◇  Variant 프리팹
```

**Examples:**
```bash
# 전체 프리팹 목록
cd <unity-project-root> && node .unity-websocket/uw prefab list

# 특정 폴더만 검색
cd <unity-project-root> && node .unity-websocket/uw prefab list --path "Assets/Prefabs/Characters"

# JSON 형식
cd <unity-project-root> && node .unity-websocket/uw prefab list --json
```

---

## Tips & Best Practices

### 프리팹 워크플로우

```bash
# 1. 씬에서 오브젝트 생성 및 설정
cd <unity-project-root> && node .unity-websocket/uw go create "NewCharacter"
cd <unity-project-root> && node .unity-websocket/uw comp add "NewCharacter" Rigidbody
cd <unity-project-root> && node .unity-websocket/uw comp add "NewCharacter" BoxCollider

# 2. 프리팹으로 저장
cd <unity-project-root> && node .unity-websocket/uw prefab create "NewCharacter" "Assets/Prefabs/NewCharacter.prefab"

# 3. 프리팹 인스턴스화
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/NewCharacter.prefab" --position "10,0,0"
```

### Variant 활용

```bash
# 1. 기본 적 프리팹 생성
cd <unity-project-root> && node .unity-websocket/uw prefab create "BaseEnemy" "Assets/Prefabs/Enemies/BaseEnemy.prefab"

# 2. Variant 생성
cd <unity-project-root> && node .unity-websocket/uw prefab variant "Assets/Prefabs/Enemies/BaseEnemy.prefab" "Assets/Prefabs/Enemies/FastEnemy.prefab"
cd <unity-project-root> && node .unity-websocket/uw prefab variant "Assets/Prefabs/Enemies/BaseEnemy.prefab" "Assets/Prefabs/Enemies/TankEnemy.prefab"

# 3. Variant 인스턴스화 및 수정
cd <unity-project-root> && node .unity-websocket/uw prefab instantiate "Assets/Prefabs/Enemies/FastEnemy.prefab" --name "FastEnemy1"
```

### 오버라이드 관리

```bash
# 1. 오버라이드 확인
cd <unity-project-root> && node .unity-websocket/uw prefab overrides "Player"

# 2. 오버라이드를 원본에 적용
cd <unity-project-root> && node .unity-websocket/uw prefab apply "Player"

# 또는 오버라이드 취소
cd <unity-project-root> && node .unity-websocket/uw prefab revert "Player"
```

---

## Troubleshooting

### 프리팹을 찾을 수 없음
**문제**: `Prefab not found: Assets/Prefabs/MyPrefab.prefab`

**해결**:
- 경로가 정확한지 확인 (대소문자 구분)
- `.prefab` 확장자가 포함되어 있는지 확인
- 에셋이 실제로 존재하는지 확인

### 프리팹 인스턴스가 아님
**문제**: `GameObject is not a prefab instance`

**해결**:
- `prefab is-instance`로 먼저 확인
- 이미 언팩된 오브젝트인 경우 프리팹이 아님
- 씬에서 직접 생성된 오브젝트는 프리팹 인스턴스가 아님

### 프리팹 생성 실패
**문제**: `Prefab already exists: ... Use --overwrite to replace.`

**해결**:
- 같은 경로에 프리팹이 이미 있음
- `--overwrite` 옵션으로 덮어쓰기 가능

---

## Related Commands

- [GameObject & Hierarchy Commands](./COMMANDS_GAMEOBJECT_HIERARCHY.md) - GameObject 생성, 계층 구조 관리
- [Component Commands](./COMMANDS_COMPONENT.md) - 컴포넌트 조작
- [Transform Commands](./COMMANDS_TRANSFORM.md) - 위치, 회전, 크기 조작
- [Asset Commands](./COMMANDS_ASSET.md) - 에셋 및 ScriptableObject 관리
