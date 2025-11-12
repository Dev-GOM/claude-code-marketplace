# Blender Toolkit

> **⚠️ Status**: 🧪 Experimental (v1.4.4)
>
> **This plugin is currently in experimental stage. APIs and features may change.**

**Language**: [English](README.md) | [한국어](README.ko.md)

Blender automation toolkit for Claude Code - WebSocket-based real-time Blender control with geometry, materials, modifiers, collections, and Mixamo animation retargeting

## Recent Updates (v1.4.4)

**Security Improvements:**
- 🔒 Removed `--trusted-host` flags from pip install (prevents MITM attacks)
- ✅ Enhanced SSL/TLS certificate validation for PyPI

**Dependency Management:**
- 📦 Using `requirements.txt` for version-controlled dependencies
- ✅ Fallback mechanism when requirements.txt is missing
- ✅ Simplified `.dist-info` exclusion logic

## 🎯 Features

### Core Features
- **🎬 Animation Retargeting**: Mixamo 애니메이션을 사용자 캐릭터에 자동 리타게팅
- **🧠 Fuzzy Bone Matching**: 60+ bones 지원, 유사도 기반 자동 매칭 (손가락, 발가락 포함)
- **🔌 WebSocket Integration**: 실시간 Blender 제어 (포트: 9400~9500)
- **✅ 2-Phase Workflow**: UI 확인 단계로 매핑 검증 가능
- **🎨 Multi-Project Support**: 프로젝트별 독립적인 포트 및 설정 관리
- **🔧 Rigify Compatible**: Rigify 리그 자동 지원

### New in v1.3.0
- **🎨 Material Management**: Principled BSDF 기반 머티리얼 생성, 속성 제어 (base color, metallic, roughness, emission)
- **🔧 Advanced Modifier Control**: 30+ modifiers 지원, list/remove/toggle/modify/reorder 전체 제어
- **📦 Collection Management**: 씬 계층 구조 관리 (create, add/remove objects, delete)
- **🏗️ Modular Architecture**: 모디파이어를 별도 모듈로 분리하여 확장성 향상
- **⚡ 30+ New CLI Commands**: material, modifier, collection 도메인에 걸친 새로운 명령

### v1.2.0 Features
- **🎨 Geometry Creation**: CLI 및 WebSocket을 통한 도형 생성 (Cube, Sphere, Cylinder, Plane, Cone, Torus)
- **🔧 Object Manipulation**: 오브젝트 변형, 복제, 삭제 등 전체 제어
- **⚡ Vertex Editing**: 버텍스 이동, 메쉬 세분화, 페이스 돌출 등 고급 편집
- **🔩 Modifier Support**: 모디파이어 추가 및 적용 (Subdivision, Mirror, Array, etc.)
- **💻 CLI Interface**: Browser-pilot 스타일의 명령줄 인터페이스
- **📚 Geometry API Documentation**: 전체 geometry API 레퍼런스 문서

### v1.1.0 Features
- **📊 Logging System**: winston (TypeScript) + logging (Python) - 디버깅 및 모니터링
- **🧩 Modular Architecture**: 확장 가능한 명령 핸들러 구조 (commands/, utils/)
- **📚 Complete API Documentation**: WebSocket commands, bone mapping guide, workflow examples
- **🎯 Quality Reports**: 매핑 품질 평가 시스템 (excellent/good/fair/poor)
- **🔍 Manual Download Workflow**: Mixamo API 없이 수동 다운로드 방식으로 안정성 확보

## 📦 Installation

### Install Plugin

```bash
# Add marketplace
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# Install plugin
/plugin install blender-toolkit@dev-gom-plugins
```

**Or install directly**:
```bash
/plugin add https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/blender-toolkit
```

### Automatic Setup (Recommended)

Blender Toolkit uses SessionStart hooks to automatically initialize your project:

1. **Start Session** - Hook will automatically:
   - Detect installed Blender versions (4.0+)
   - Create project configuration (port 9400-9500)
   - Copy and build local TypeScript scripts
   - Attempt background addon installation
2. **Check Status** - Review installation logs:
   ```bash
   cat .blender-toolkit/init-log.txt
   ```

### Building Addon Package

The SessionStart hook automatically creates a ZIP package in `.blender-toolkit/` for distribution:
- **Auto-generated**: Created during session initialization
- **Version tracking**: Only rebuilds when plugin version changes
- **Location**: `.blender-toolkit/blender-toolkit-addon-v{version}.zip`

**Manual Build**:
```bash
# Build addon ZIP
node .blender-toolkit/bt addon-build

# Force rebuild (ignore version check)
node .blender-toolkit/bt addon-build --force

# Check available commands
node .blender-toolkit/bt --help
```

**Package Contents**:
- ✅ All addon Python files (`*.py`)
- ✅ Command modules (`commands/`)
- ✅ Utility modules (`utils/`)
- ✅ WebSocket server implementation
- ❌ Development configs (`.pylintrc`, `pyrightconfig.json`)
- ❌ Python cache (`__pycache__`, `*.pyc`)

### Manual Addon Installation

If automatic installation fails, install manually:

**Option 1: Install from ZIP (Recommended)**
```bash
# 1. Open Blender 4.0+
# 2. Edit > Preferences > Add-ons > Install
# 3. Select: .blender-toolkit/blender-toolkit-addon-v*.zip
# 4. Enable "Blender Toolkit WebSocket Server"
```

**Option 2: Install from Source**
```bash
# 1. Open Blender 4.0+
# 2. Edit > Preferences > Add-ons > Install
# 3. Select: plugins/blender-toolkit/skills/addon/__init__.py
# 4. Enable "Blender Toolkit WebSocket Server"
```

### Start WebSocket Server

In Blender:
1. Sidebar (N key) > "Blender Toolkit" tab
2. Click "Start Server" button
3. Port shown in console (default: 9400)

## ⚙️ Configuration

**Shared Config Location**: `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json`

### Manual Blender Path Configuration

If Blender is not automatically detected, you can manually specify the path:

1. Open the config file: `~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json`
2. Add or update the `blenderExecutable` field:

```json
{
  "blenderExecutable": "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
  "blenderVersion": "4.2.0",
  "projects": { ... }
}
```

**Common Blender Paths:**
- **Windows**: `C:\Program Files\Blender Foundation\Blender 4.x\blender.exe`
- **macOS**: `/Applications/Blender.app/Contents/MacOS/Blender`
- **Linux**: `/usr/bin/blender` or `~/blender/blender`

**Example Configuration**:

```json
{
  "blenderExecutable": "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
  "blenderVersion": "4.2.0",
  "detectedBlenderVersions": [
    {
      "version": "4.2.0",
      "path": "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
      "major": 4,
      "minor": 2
    }
  ],
  "addonInstalled": false,
  "addonInstallAttempted": true,
  "lastInstallAttempt": "2025-11-10 12:34:56",
  "projects": {
    "my-project": {
      "rootPath": "D:\\Work\\my-project",
      "port": 9400,
      "outputDir": ".blender-toolkit",
      "lastUsed": "2025-11-10 12:34:56",
      "autoCleanup": false,
      "autoRestore": true
    }
  }
}
```

**Configuration Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `blenderExecutable` | string | Path to Blender executable |
| `blenderVersion` | string | Detected Blender version |
| `detectedBlenderVersions` | array | All detected Blender installations |
| `addonInstalled` | boolean | User-set flag for addon installation status |
| `addonInstallAttempted` | boolean | Whether automatic installation was attempted |
| `lastInstallAttempt` | string | Timestamp of last installation attempt |
| `projects` | object | Per-project configuration (port, paths, etc.) |

**To Change Blender Version**:

1. Open config file (path above)
2. Edit `blenderExecutable` to desired version from `detectedBlenderVersions`
3. Save and restart Claude Code session

## 🚀 Quick Start

### 기본 리타게팅 예시

```typescript
import { AnimationRetargetingWorkflow } from 'blender-retargeting';

const workflow = new AnimationRetargetingWorkflow();

await workflow.run({
  targetCharacterArmature: 'MyCharacter',           // 사용자 캐릭터 이름
  animationFilePath: './animations/Walking.fbx',    // 다운로드한 FBX 파일
  animationName: 'Walking',
  boneMapping: 'auto',                              // Fuzzy matching 자동 매핑
  skipConfirmation: false,                          // UI 확인 단계 활성화
});
```

### Mixamo 수동 다운로드

Mixamo는 공식 API를 제공하지 않으므로 수동 다운로드가 필요합니다:

1. [Mixamo 웹사이트](https://www.mixamo.com/) 방문
2. 원하는 애니메이션 검색
3. 다운로드 설정:
   - **Format**: FBX (.fbx)
   - **Skin**: Without Skin (애니메이션만)
   - **FPS**: 30 fps
   - **Keyframe Reduction**: None
4. `./animations/` 폴더에 저장

### Claude Code와 함께 사용

**User**: "내 캐릭터 'Hero'에 Mixamo Walking 애니메이션을 적용해줘"

**Claude가 자동으로 실행**:
1. ✅ Blender 연결 (WebSocket)
2. 🔍 'Hero' 캐릭터 확인
3. 📥 다운로드 안내 제공 (수동 다운로드 필요)
4. 📦 FBX 임포트
5. 🧠 Fuzzy matching으로 본 자동 매핑 (60+ bones)
6. 📊 매핑 품질 보고서 생성
7. 🎨 Blender UI에 매핑 표시
8. ⏸️ 사용자 확인 대기
9. 🎬 애니메이션 리타게팅
10. 📋 NLA 트랙 추가

## 💻 CLI Commands

Blender Toolkit은 browser-pilot 스타일의 CLI 인터페이스를 제공합니다:

### Geometry Creation

```bash
# Cube 생성
npm run bt:create-cube -- -x 0 -y 0 -z 0 --size 2.0 --name "MyCube"

# Sphere 생성
npm run bt:create-sphere -- --radius 1.5 --segments 64 --rings 32

# Cylinder 생성
npm run bt:create-cylinder -- --radius 0.5 --depth 3.0

# Plane 생성 (바닥)
npm run bt:create-plane -- --size 10.0 --name "Ground"

# Cone 생성
blender-toolkit create-cone --radius 2.0 --depth 4.0

# Torus 생성
blender-toolkit create-torus --major-radius 2.0 --minor-radius 0.5
```

### Object Operations

```bash
# 오브젝트 목록 조회
npm run bt:list-objects
npm run bt:list-objects -- --type MESH

# 오브젝트 변형
npm run bt:transform -- --name "Cube" --loc-x 5.0 --loc-y 0 --loc-z 2.0
npm run bt:transform -- --name "Sphere" --scale-x 2.0 --scale-y 2.0 --scale-z 2.0

# 오브젝트 복제
blender-toolkit duplicate --name "Cube" --new-name "CubeCopy" -x 5.0

# 오브젝트 삭제
npm run bt:delete -- --name "Cube"
```

### Vertex & Mesh Editing

```bash
# 버텍스 조회
blender-toolkit get-vertices --name "Cube"

# 버텍스 이동
blender-toolkit move-vertex --name "Cube" --index 0 -x 2.0 -y 1.0 -z -1.0

# 메쉬 세분화
blender-toolkit subdivide --name "Cube" --cuts 2
```

### Modifiers

```bash
# Subdivision modifier 추가
blender-toolkit add-modifier --name "Cube" --type SUBSURF --levels 2

# Modifier 적용
blender-toolkit apply-modifier --name "Cube" --modifier "Subdivision"
```

### Animation Retargeting

```bash
# 애니메이션 리타게팅
npm run bt:retarget -- --target "MyCharacter" --file "./animations/Walking.fbx"

# Mixamo 도움말
blender-toolkit mixamo-help
blender-toolkit mixamo-help "Walking"
```

### Claude Code와 함께 사용

Claude에게 다음과 같이 요청할 수 있습니다:

```
"Blender에 큐브를 생성하고 크기를 3으로 설정해줘"
"구를 만들고 위치를 (5, 0, 0)으로 이동시켜줘"
"평면을 만들고 subdivision modifier를 추가해줘"
"큐브를 복제하고 X축으로 5만큼 이동시켜줘"
```

Claude가 자동으로 적절한 CLI 명령이나 WebSocket API를 실행합니다.

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude Code   │◄───────►│  TypeScript      │◄───────►│    Blender      │
│   (Skill)       │   IPC   │  WebSocket       │   WS    │   (Python       │
│                 │         │  Client          │ 9400    │    Addon)       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │                            │
                            ┌────────┴─────────┐         ┌───────┴────────┐
                            │  Logging System  │         │  UI Panel      │
                            │  (winston)       │         │  (Review/Edit) │
                            └──────────────────┘         └────────────────┘
```

### Components

**TypeScript Client:**
- `client.ts`: WebSocket 통신
- `retargeting.ts`: 리타게팅 로직
- `config.ts`: 프로젝트별 설정 관리
- `logger.ts`: winston 로깅 시스템

**Python Addon:**
- `commands/`: 모듈화된 명령 핸들러
  - `armature.py`: 아마추어 조회
  - `retargeting.py`: 리타게팅 실행
  - `animation.py`: 애니메이션 관리
  - `bone_mapping.py`: 본 매핑 저장/로드
  - `import_.py`: FBX/DAE 임포트
  - `geometry.py`: 도형 생성 및 메쉬 편집 (v1.2.0)
- `utils/`: 유틸리티 모듈
  - `bone_matching.py`: Fuzzy matching 알고리즘
  - `logger.py`: Python logging 시스템

**CLI Commands (v1.2.0):**
- `cli/cli.ts`: Commander 기반 CLI 엔트리
- `cli/commands/`:
  - `geometry.ts`: 도형 생성 명령
  - `object.ts`: 오브젝트 조작 명령
  - `modifier.ts`: 모디파이어 명령
  - `retargeting.ts`: 리타게팅 명령

## 🧠 Fuzzy Bone Matching

### Algorithm

60+ bones를 지원하는 고급 매칭 알고리즘:

1. **Name Normalization**: 소문자 변환, 특수문자 제거
2. **Similarity Calculation**: SequenceMatcher + 보너스 점수
   - Substring match (+0.15)
   - Prefix/Suffix match (+0.1)
   - Digit match (+0.1)
   - Keyword match (+0.05)
3. **Two-Phase Matching**:
   - Phase 1: Exact matching (known aliases)
   - Phase 2: Fuzzy matching (60% threshold)

### Supported Bones

- **Body**: Hips, Spine, Spine1, Spine2, Neck, Head (6개)
- **Arms**: Shoulders, Arms, ForeArms, Hands (8개)
- **Legs**: UpLegs, Legs, Feet, ToeBases (8개)
- **Fingers**: Thumb, Index, Middle, Ring, Pinky (좌우 각 15개, 총 30개)

**Total: 60+ bones**

### Quality Assessment

매핑 후 자동 품질 평가:

| Quality | Critical Bones | Description |
|---------|---------------|-------------|
| **Excellent** | 8-9 / 9 | 자동 리타게팅 권장 |
| **Good** | 6-7 / 9 | 간단한 검토 후 진행 |
| **Fair** | 4-5 / 9 | 철저한 검토 필요 |
| **Poor** | < 4 / 9 | 커스텀 매핑 사용 |

## 📁 Project Structure

```
plugins/blender-toolkit/
├── .claude-plugin/
│   └── plugin.json                          # 플러그인 메타데이터
├── skills/
│   └── blender-retargeting/
│       ├── SKILL.md                         # 스킬 정의 (Claude용)
│       ├── addon/
│       │   ├── __init__.py                  # Blender Python 애드온
│       │   ├── commands/                    # 명령 핸들러 (모듈화)
│       │   │   ├── armature.py
│       │   │   ├── retargeting.py
│       │   │   ├── animation.py
│       │   │   ├── bone_mapping.py
│       │   │   └── import_.py
│       │   └── utils/                       # 유틸리티
│       │       ├── bone_matching.py         # Fuzzy matching
│       │       └── logger.py                # Logging
│       ├── scripts/
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── src/
│       │       ├── index.ts                 # 메인 워크플로우
│       │       ├── constants/
│       │       ├── utils/
│       │       │   └── logger.ts            # Winston logger
│       │       └── blender/
│       │           ├── client.ts            # WebSocket 클라이언트
│       │           ├── config.ts            # 설정 관리
│       │           └── retargeting.ts       # 리타게팅 로직
│       └── references/                      # API 문서
│           ├── websocket-commands.md        # WebSocket 명령 레퍼런스
│           ├── bone-mapping-guide.md        # 본 매핑 가이드
│           └── workflow-examples.md         # 워크플로우 예시
└── README.md
```

## 🎨 Bone Mapping Strategies

### 1. Auto Mapping (권장)

Fuzzy matching으로 자동 매핑:

```typescript
boneMapping: 'auto'
```

**장점**:
- 60+ bones 자동 매칭
- 다양한 네이밍 컨벤션 지원
- 품질 보고서 제공

### 2. Preset Mapping

미리 정의된 매핑 사용:

```typescript
boneMapping: 'mixamo_to_rigify'
```

**사용 가능한 프리셋**:
- `mixamo_to_rigify`: Rigify 리그용

### 3. Custom Mapping

수동 매핑:

```typescript
boneMapping: 'custom',
customBoneMap: {
  'Hips': 'root_bone',
  'Spine': 'spine_01',
  'LeftArm': 'arm_L',
  // ...
}
```

## 🔄 2-Phase Workflow

### Phase 1: Auto-Generate Mapping

1. Fuzzy matching 실행
2. 60+ bones 자동 매핑
3. 품질 보고서 생성
4. Blender UI에 매핑 표시

### Phase 2: User Review & Confirm

1. Blender UI에서 매핑 검토
2. 잘못된 매핑 수정 (드롭다운)
3. "Apply Retargeting" 버튼 클릭
4. 확인 후 리타게팅 진행

**UI 확인 건너뛰기**:
```typescript
skipConfirmation: true  // 자동 진행
```

## 📊 Logging System

### Enable Logging

```bash
# 환경 변수 설정
export DEBUG=1

# 로그 확인
tail -f .blender-toolkit/logs/typescript.log
tail -f .blender-toolkit/logs/blender-addon.log
```

### Log Files

```
.blender-toolkit/logs/
├── typescript.log      # TypeScript 클라이언트 로그
├── blender-addon.log   # Python 애드온 로그
└── error.log           # 에러 로그만
```

### Log Levels

- `DEBUG`: 상세 디버깅 정보
- `INFO`: 일반 정보 (기본)
- `WARN`: 경고 메시지
- `ERROR`: 에러 메시지

## 🛠️ Configuration

### 프로젝트별 설정

```json
{
  "rootPath": "/path/to/project",
  "port": 9400,
  "outputDir": ".blender-toolkit",
  "lastUsed": "2025-11-10T12:00:00Z",
  "autoCleanup": true
}
```

설정 파일 위치:
```
~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json
```

### 포트 관리

- **기본 포트**: 9400
- **범위**: 9400~9500
- **자동 할당**: 프로젝트별 독립 포트
- **충돌 방지**: Browser-Pilot (9222~9322)과 분리

## 🚨 Troubleshooting

### "Connection failed"

```bash
# 1. Blender 실행 중인지 확인
# 2. 애드온 활성화 확인
# 3. WebSocket 서버 시작 확인
# 4. 포트 충돌 확인
lsof -i :9400

# 5. 로그 확인
tail -f .blender-toolkit/logs/typescript.log
```

### "Armature not found"

```python
# Blender Python 콘솔에서 확인
import bpy
print([obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE'])
```

### "Bone mapping failed" or "Low quality"

1. **UI에서 수동 검토**:
   - `skipConfirmation: false` 설정
   - Blender UI에서 매핑 확인 및 수정

2. **커스텀 매핑 사용**:
```typescript
boneMapping: 'custom',
customBoneMap: {
  'Hips': 'actual_bone_name_in_your_rig',
  // 모든 주요 본 수동 매핑
}
```

3. **로그 확인**:
```bash
DEBUG=1 node .blender-toolkit/bt.js retarget ...
```

## 📚 API Documentation

상세한 API 문서는 `references/` 폴더 참조:

- **[WebSocket Commands](skills/blender-retargeting/references/websocket-commands.md)**: 모든 WebSocket 명령 레퍼런스
- **[Bone Mapping Guide](skills/blender-retargeting/references/bone-mapping-guide.md)**: 본 매핑 전략 및 알고리즘
- **[Workflow Examples](skills/blender-retargeting/references/workflow-examples.md)**: 12가지 실전 예시

## 📚 Examples

### 1. 단일 애니메이션 리타게팅 (UI 확인)

```typescript
await workflow.run({
  targetCharacterArmature: 'Hero',
  animationFilePath: './animations/Walking.fbx',
  animationName: 'Walking',
  boneMapping: 'auto',
  skipConfirmation: false,  // UI에서 확인
});
```

### 2. 여러 애니메이션 배치 처리

```typescript
const animations = [
  { file: './animations/Walking.fbx', name: 'Walking' },
  { file: './animations/Running.fbx', name: 'Running' },
  { file: './animations/Jumping.fbx', name: 'Jumping' },
];

for (const anim of animations) {
  await workflow.run({
    targetCharacterArmature: 'Hero',
    animationFilePath: anim.file,
    animationName: anim.name,
    boneMapping: 'auto',
    skipConfirmation: true,  // 배치 처리 시 자동 진행
  });
  console.log(`✅ ${anim.name} completed`);
}
```

### 3. Rigify 캐릭터 (프리셋)

```typescript
await workflow.run({
  targetCharacterArmature: 'RigifyCharacter',
  animationFilePath: './animations/SwordSlash.fbx',
  animationName: 'SwordSlash',
  boneMapping: 'mixamo_to_rigify',  // Rigify 프리셋
});
```

### 4. 커스텀 매핑

```typescript
await workflow.run({
  targetCharacterArmature: 'CustomRig',
  animationFilePath: './animations/Dancing.fbx',
  animationName: 'Dancing',
  boneMapping: 'custom',
  customBoneMap: {
    'Hips': 'Root',
    'Spine': 'Spine_01',
    'Spine1': 'Spine_02',
    'Neck': 'Neck_01',
    'Head': 'Head_01',
    'LeftArm': 'UpperArm_L',
    'LeftForeArm': 'ForeArm_L',
    'LeftHand': 'Hand_L',
    // ...
  },
});
```

## 🎯 Best Practices

1. **Fuzzy Matching 활용**: 자동 매핑 + UI 확인이 가장 효율적
2. **품질 보고서 확인**: Excellent/Good 이상일 때 자동 진행
3. **단순한 애니메이션부터**: Walking, Idle로 매핑 검증 후 복잡한 애니메이션 진행
4. **표준 리그 사용**: Rigify 자동 리그 권장
5. **Without Skin 다운로드**: Mixamo에서 "Without Skin" 선택
6. **로깅 활성화**: 문제 발생 시 `DEBUG=1` 설정
7. **NLA 관리**: 여러 애니메이션을 NLA 트랙으로 정리
8. **프리뷰 확인**: 항상 애니메이션 확인 후 최종 저장

## 🔗 Integration

### Claude Code Skill

SKILL.md에 정의된 워크플로우를 Claude가 자동 실행:

```yaml
---
name: blender-retargeting
description: Blender animation retargeting with Mixamo integration
allowed-tools: Bash, Read, Write, Glob
---
```

### API Reference

상세한 API 문서는 `references/websocket-commands.md` 참조

```typescript
// BlenderClient - WebSocket 통신
const client = new BlenderClient(port);
await client.connect();
await client.sendCommand('Armature.list');

// RetargetingController - 리타게팅 로직
const controller = new RetargetingController(client);
const boneMap = await controller.autoMapBones('Mixamo', 'Hero');
await controller.retarget({ sourceArmature, targetArmature, boneMapping });
```

## 🔄 Changelog

### v1.2.0 (2025-11-10)
- 🎨 Geometry creation API 추가 (Cube, Sphere, Cylinder, Plane, Cone, Torus)
- 🔧 Object manipulation commands (transform, duplicate, delete, list)
- ⚡ Vertex editing operations (move, get, subdivide, extrude)
- 🔩 Modifier support (add, apply)
- 💻 CLI interface 구현 (browser-pilot 스타일)
- 📚 Geometry API 문서 작성 (geometry-api.md)
- 📦 package.json에 bin 및 스크립트 명령 등록
- 🧩 TypeScript CLI commands 모듈화 (geometry, object, modifier, retargeting)

### v1.1.0 (2025-11-10)
- ✨ Fuzzy matching 알고리즘 구현 (60+ bones)
- 📊 로깅 시스템 도입 (winston + logging)
- 🧩 파이썬 코드 모듈화 (commands/, utils/)
- 📚 완전한 API 문서 작성 (references/)
- 🎯 매핑 품질 보고서 시스템
- 🔄 2-Phase UI 확인 워크플로우
- 🚫 Mixamo API 제거 (수동 다운로드로 전환)

### v1.0.0 (2025-10-29)
- 🎉 Initial release
- 🎬 기본 애니메이션 리타게팅
- 🤖 Auto bone mapping
- 🔌 WebSocket integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. 커스텀 본 매핑 프리셋 추가:
   - `addon/commands/retargeting.py`의 `get_preset_bone_mapping()` 함수에 프리셋 추가
4. 문서 업데이트
5. 테스트

## 📝 License

Apache License 2.0 - See [LICENSE](../../LICENSE) file for details

## 🙏 Credits

- **Blender Foundation**: Blender 3D software
- **Mixamo (Adobe)**: 애니메이션 리소스
- **Claude Code Community**: 피드백 및 테스트

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Dev-GOM/claude-code-marketplace/discussions)
- **Documentation**: [SKILL.md](skills/blender-retargeting/SKILL.md)
