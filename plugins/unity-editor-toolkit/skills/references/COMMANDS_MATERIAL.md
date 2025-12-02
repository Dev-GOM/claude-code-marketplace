# Unity Editor Toolkit - Material Commands

Material 속성 조작 및 관리 명령어 레퍼런스입니다.

**Last Updated**: 2025-12-02

---

## material list

GameObject에 연결된 모든 Material을 나열합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material list <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로 (예: "Player" 또는 "Environment/Cube")
```

**Options:**
```
--shared               공유 Material 사용 (인스턴스화되지 않은 원본)
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# GameObject의 모든 Material 나열
cd <unity-project-root> && node .unity-websocket/uw material list "Cube"

# 공유 Material 목록
cd <unity-project-root> && node .unity-websocket/uw material list "Player" --shared

# JSON 형식 출력
cd <unity-project-root> && node .unity-websocket/uw material list "Enemy" --json
```

---

## material get

Material 속성값을 조회합니다. Float, Int, Range 타입 속성 지원.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material get <gameobject> <property> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<property>             Material 속성 이름 (예: "_Glossiness", "_Metallic")
```

**Options:**
```
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 사용
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Smoothness 값 조회
cd <unity-project-root> && node .unity-websocket/uw material get "Cube" "_Glossiness"

# 두 번째 Material의 Metallic 값 조회
cd <unity-project-root> && node .unity-websocket/uw material get "Character" "_Metallic" -m 1
```

---

## material set

Material 속성값을 설정합니다. Float, Int, Range 타입 속성 지원.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material set <gameobject> <property> <value> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<property>             Material 속성 이름
<value>                설정할 값 (숫자)
```

**Options:**
```
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 수정
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Smoothness를 0.8로 설정
cd <unity-project-root> && node .unity-websocket/uw material set "Cube" "_Glossiness" 0.8

# Metallic을 1.0으로 설정
cd <unity-project-root> && node .unity-websocket/uw material set "Player" "_Metallic" 1.0
```

---

## material get-color

Material의 색상 속성을 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material get-color <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
-p, --property <name>  색상 속성 이름 (기본값: "_Color")
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 사용
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 기본 색상 조회
cd <unity-project-root> && node .unity-websocket/uw material get-color "Cube"

# Emission 색상 조회
cd <unity-project-root> && node .unity-websocket/uw material get-color "Neon" -p "_EmissionColor"
```

---

## material set-color

Material의 색상 속성을 설정합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material set-color <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
-p, --property <name>  색상 속성 이름 (기본값: "_Color")
-m, --material <index> Material 인덱스 (기본값: 0)
--hex <color>          Hex 색상 코드 (예: "#FF0000" 또는 "FF0000FF")
--r <value>            빨강 (0.0 ~ 1.0)
--g <value>            초록 (0.0 ~ 1.0)
--b <value>            파랑 (0.0 ~ 1.0)
--a <value>            알파 (0.0 ~ 1.0, 기본값: 1.0)
--shared               공유 Material 수정
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Hex 코드로 빨간색 설정
cd <unity-project-root> && node .unity-websocket/uw material set-color "Cube" --hex "#FF0000"

# RGBA로 반투명 파란색 설정
cd <unity-project-root> && node .unity-websocket/uw material set-color "Glass" --r 0 --g 0 --b 1 --a 0.5

# Emission 색상 설정
cd <unity-project-root> && node .unity-websocket/uw material set-color "Neon" -p "_EmissionColor" --hex "#00FF00"
```

---

## material get-shader

Material에 적용된 Shader 정보를 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material get-shader <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 사용
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Shader 정보 조회
cd <unity-project-root> && node .unity-websocket/uw material get-shader "Cube"

# 두 번째 Material의 Shader 조회
cd <unity-project-root> && node .unity-websocket/uw material get-shader "Character" -m 1
```

---

## material set-shader

Material의 Shader를 변경합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material set-shader <gameobject> <shaderName> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<shaderName>           Shader 이름 (예: "Standard", "Unlit/Color")
```

**Options:**
```
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 수정
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Standard Shader로 변경
cd <unity-project-root> && node .unity-websocket/uw material set-shader "Cube" "Standard"

# Unlit Shader로 변경
cd <unity-project-root> && node .unity-websocket/uw material set-shader "UIElement" "Unlit/Texture"
```

---

## material get-texture

Material의 텍스처 속성을 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material get-texture <gameobject> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
```

**Options:**
```
-p, --property <name>  텍스처 속성 이름 (기본값: "_MainTex")
-m, --material <index> Material 인덱스 (기본값: 0)
--shared               공유 Material 사용
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 메인 텍스처 정보 조회
cd <unity-project-root> && node .unity-websocket/uw material get-texture "Cube"

# Normal Map 텍스처 조회
cd <unity-project-root> && node .unity-websocket/uw material get-texture "Character" -p "_BumpMap"
```

---

## material set-texture

Material의 텍스처를 설정합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw material set-texture <gameobject> <texturePath> [options]
```

**Arguments:**
```
<gameobject>           GameObject 이름 또는 경로
<texturePath>          Assets 폴더 기준 텍스처 경로 (예: "Assets/Textures/Wood.png")
```

**Options:**
```
-p, --property <name>  텍스처 속성 이름 (기본값: "_MainTex")
-m, --material <index> Material 인덱스 (기본값: 0)
--scale-x <value>      텍스처 X 스케일
--scale-y <value>      텍스처 Y 스케일
--offset-x <value>     텍스처 X 오프셋
--offset-y <value>     텍스처 Y 오프셋
--shared               공유 Material 수정
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 메인 텍스처 설정
cd <unity-project-root> && node .unity-websocket/uw material set-texture "Cube" "Assets/Textures/Stone.png"

# Normal Map 설정
cd <unity-project-root> && node .unity-websocket/uw material set-texture "Wall" "Assets/Textures/Brick_Normal.png" -p "_BumpMap"

# 텍스처 타일링 설정
cd <unity-project-root> && node .unity-websocket/uw material set-texture "Floor" "Assets/Textures/Tile.png" --scale-x 4 --scale-y 4
```

---

## Common Material Properties

Standard Shader에서 자주 사용되는 속성들:

| Property Name | Type | Description |
|---------------|------|-------------|
| `_Color` | Color | Albedo 색상 |
| `_MainTex` | Texture | Albedo 텍스처 |
| `_Metallic` | Float | 금속 정도 (0-1) |
| `_Glossiness` | Float | 부드러움/광택 (0-1) |
| `_BumpMap` | Texture | Normal Map |
| `_BumpScale` | Float | Normal Map 강도 |
| `_EmissionColor` | Color | Emission 색상 |
| `_EmissionMap` | Texture | Emission 텍스처 |
| `_OcclusionMap` | Texture | Ambient Occlusion 맵 |
| `_OcclusionStrength` | Float | AO 강도 (0-1) |

---

## JSON Output Example

```json
{
  "success": true,
  "gameObject": "Cube",
  "material": "Default-Material",
  "propertyName": "_Color",
  "color": {
    "r": 1.0,
    "g": 0.5,
    "b": 0.0,
    "a": 1.0,
    "hex": "FF8000FF"
  }
}
```
