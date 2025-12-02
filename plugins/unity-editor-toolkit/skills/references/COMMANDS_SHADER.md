# Unity Editor Toolkit - Shader Commands

Shader 조회 및 키워드 관리 명령어 레퍼런스입니다.

**Last Updated**: 2025-12-02

---

## shader list

프로젝트의 모든 Shader를 나열합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader list [options]
```

**Options:**
```
-f, --filter <pattern> 이름으로 필터링 (부분 일치)
-b, --builtin          빌트인 Shader 포함
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# 프로젝트 내 모든 Shader 나열
cd <unity-project-root> && node .unity-websocket/uw shader list

# "Standard" 이름이 포함된 Shader 검색
cd <unity-project-root> && node .unity-websocket/uw shader list -f "Standard"

# 빌트인 Shader도 포함하여 검색
cd <unity-project-root> && node .unity-websocket/uw shader list --builtin

# Unlit 계열 Shader만 검색
cd <unity-project-root> && node .unity-websocket/uw shader list -f "Unlit"
```

**Output:**
```
Shaders (15):

Name                                              Properties  Queue   Type
-------------------------------------------------------------------------------------
Standard                                          15          2000    Built-in
Mobile/Diffuse                                    2           2000    Built-in
Custom/MyShader                                   8           3000    Project
```

---

## shader find

이름으로 Shader를 검색하고 상세 정보를 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader find <name> [options]
```

**Arguments:**
```
<name>                 Shader 이름 (정확히 일치해야 함)
                       예: "Standard", "Unlit/Color", "Custom/MyShader"
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Standard Shader 정보 조회
cd <unity-project-root> && node .unity-websocket/uw shader find "Standard"

# Unlit/Color Shader 조회
cd <unity-project-root> && node .unity-websocket/uw shader find "Unlit/Color"

# 커스텀 Shader 조회
cd <unity-project-root> && node .unity-websocket/uw shader find "Custom/Water"
```

**Output:**
```
Shader Info:
  Name: Standard
  Path: Built-in
  Type: Built-in
  Render Queue: 2000
  Properties: 15

  Properties:
    - _Color (Color): Color
    - _MainTex (Texture): Albedo
    - _Metallic (Range): Metallic
    - _Glossiness (Range): Smoothness
```

---

## shader properties

Shader의 모든 속성을 상세히 조회합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader properties <shaderName> [options]
```

**Arguments:**
```
<shaderName>           Shader 이름
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# Standard Shader 속성 조회
cd <unity-project-root> && node .unity-websocket/uw shader properties "Standard"

# URP Lit Shader 속성 조회
cd <unity-project-root> && node .unity-websocket/uw shader properties "Universal Render Pipeline/Lit"
```

**Output:**
```
Shader: Standard
Properties (15):

Name                          Type        Description
--------------------------------------------------------------------------------
_Color                        Color       Color
_MainTex                      Texture     Albedo
_Cutoff                       Range       Alpha Cutoff [0 - 1]
_Glossiness                   Range       Smoothness [0 - 1]
_Metallic                     Range       Metallic [0 - 1]
_BumpScale                    Float       Scale
_BumpMap                      Texture     Normal Map
```

---

## shader keywords

Shader 키워드를 조회합니다. 전역 키워드 또는 특정 Shader의 키워드를 조회할 수 있습니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader keywords [options]
```

**Options:**
```
-g, --global           전역 키워드 조회 (--shader와 함께 사용 불가)
-s, --shader <name>    특정 Shader의 키워드 조회
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Note:** `--global` 또는 `--shader <name>` 중 하나는 반드시 지정해야 합니다.

**Examples:**
```bash
# 전역 Shader 키워드 조회
cd <unity-project-root> && node .unity-websocket/uw shader keywords --global

# Standard Shader의 키워드 조회
cd <unity-project-root> && node .unity-websocket/uw shader keywords -s "Standard"
```

**Output:**
```
Global Keywords (12):

Name                                    Type                Valid
-----------------------------------------------------------------
_ALPHATEST_ON                           UserDefined         Yes
_NORMALMAP                              UserDefined         Yes
_EMISSION                               UserDefined         Yes
INSTANCING_ON                           BuiltinAutoStripped Yes
```

---

## shader keyword-enable

전역 Shader 키워드를 활성화합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader keyword-enable <keyword> [options]
```

**Arguments:**
```
<keyword>              활성화할 키워드 이름 (대소문자 구분)
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# HDR 키워드 활성화
cd <unity-project-root> && node .unity-websocket/uw shader keyword-enable "HDR_ON"

# Soft Particles 활성화
cd <unity-project-root> && node .unity-websocket/uw shader keyword-enable "_SOFT_PARTICLES"
```

---

## shader keyword-disable

전역 Shader 키워드를 비활성화합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader keyword-disable <keyword> [options]
```

**Arguments:**
```
<keyword>              비활성화할 키워드 이름 (대소문자 구분)
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# HDR 키워드 비활성화
cd <unity-project-root> && node .unity-websocket/uw shader keyword-disable "HDR_ON"

# Fog 비활성화
cd <unity-project-root> && node .unity-websocket/uw shader keyword-disable "FOG_LINEAR"
```

---

## shader keyword-status

전역 Shader 키워드의 활성화 상태를 확인합니다.

**Usage:**
```bash
cd <unity-project-root> && node .unity-websocket/uw shader keyword-status <keyword> [options]
```

**Arguments:**
```
<keyword>              확인할 키워드 이름 (대소문자 구분)
```

**Options:**
```
--json                 JSON 형식으로 출력
--timeout <ms>         WebSocket 연결 타임아웃 (기본값: 30000)
-h, --help             명령어 도움말 표시
```

**Examples:**
```bash
# HDR 키워드 상태 확인
cd <unity-project-root> && node .unity-websocket/uw shader keyword-status "HDR_ON"
```

**Output:**
```
Keyword "HDR_ON" is enabled
```

---

## Common Shader Keywords

자주 사용되는 Shader 키워드들:

| Keyword | Description |
|---------|-------------|
| `_NORMALMAP` | Normal Map 활성화 |
| `_EMISSION` | Emission 활성화 |
| `_ALPHATEST_ON` | Alpha Test (Cutout) 모드 |
| `_ALPHABLEND_ON` | Alpha Blend (Transparent) 모드 |
| `_ALPHAPREMULTIPLY_ON` | Premultiplied Alpha 모드 |
| `_METALLICGLOSSMAP` | Metallic Gloss Map 사용 |
| `_SPECGLOSSMAP` | Specular Gloss Map 사용 |
| `_PARALLAXMAP` | Parallax Map 활성화 |
| `FOG_LINEAR` | Linear Fog |
| `FOG_EXP` | Exponential Fog |
| `FOG_EXP2` | Exponential Squared Fog |
| `INSTANCING_ON` | GPU Instancing 활성화 |

---

## Shader Property Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `Color` | RGBA 색상 | `(1, 0, 0, 1)` |
| `Vector` | 4D 벡터 | `(1, 2, 3, 4)` |
| `Float` | 단일 숫자 | `1.5` |
| `Range` | 범위 제한 숫자 | `0.5` (min-max) |
| `Texture` | 2D 텍스처 | Texture2D |
| `Int` | 정수 | `5` |

---

## JSON Output Examples

### shader list
```json
{
  "success": true,
  "count": 3,
  "shaders": [
    {
      "name": "Standard",
      "path": "Built-in",
      "isBuiltin": true,
      "propertyCount": 15,
      "renderQueue": 2000
    },
    {
      "name": "Custom/Water",
      "path": "Assets/Shaders/Water.shader",
      "isBuiltin": false,
      "propertyCount": 8,
      "renderQueue": 3000
    }
  ]
}
```

### shader keywords
```json
{
  "success": true,
  "global": true,
  "count": 5,
  "keywords": [
    {
      "name": "_NORMALMAP",
      "type": "UserDefined",
      "isValid": true
    },
    {
      "name": "_EMISSION",
      "type": "UserDefined",
      "isValid": true
    }
  ]
}
```

---

## Render Queue Ranges

| Range | Name | Description |
|-------|------|-------------|
| 0-999 | Background | 배경 (스카이박스 등) |
| 1000-1999 | Geometry-1 | 기하 앞쪽 |
| 2000-2449 | Geometry | 기본 불투명 오브젝트 |
| 2450-2499 | AlphaTest | 알파 테스트 오브젝트 |
| 2500-2999 | Transparent-1 | 투명 앞쪽 |
| 3000-3999 | Transparent | 기본 투명 오브젝트 |
| 4000-4999 | Overlay | UI, 오버레이 |
