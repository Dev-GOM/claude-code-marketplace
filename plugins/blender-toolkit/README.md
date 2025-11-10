# Blender Toolkit

> **Status**: ✅ Release (v1.1.0)

**Language**: [English](README.md) | [한국어](README.ko.md)

Blender automation toolkit for Claude Code - WebSocket-based real-time Blender control and Mixamo animation retargeting with intelligent fuzzy bone matching

## 🎯 Features

### Core Features
- **🎬 Animation Retargeting**: Mixamo 애니메이션을 사용자 캐릭터에 자동 리타게팅
- **🧠 Fuzzy Bone Matching**: 60+ bones 지원, 유사도 기반 자동 매칭 (손가락, 발가락 포함)
- **🔌 WebSocket Integration**: 실시간 Blender 제어 (포트: 9400~9500)
- **✅ 2-Phase Workflow**: UI 확인 단계로 매핑 검증 가능
- **🎨 Multi-Project Support**: 프로젝트별 독립적인 포트 및 설정 관리
- **🔧 Rigify Compatible**: Rigify 리그 자동 지원

### New in v1.1.0
- **📊 Logging System**: winston (TypeScript) + logging (Python) - 디버깅 및 모니터링
- **🧩 Modular Architecture**: 확장 가능한 명령 핸들러 구조 (commands/, utils/)
- **📚 Complete API Documentation**: WebSocket commands, bone mapping guide, workflow examples
- **🎯 Quality Reports**: 매핑 품질 평가 시스템 (excellent/good/fair/poor)
- **🔍 Manual Download Workflow**: Mixamo API 없이 수동 다운로드 방식으로 안정성 확보

## 📦 Installation

### 1. Blender 애드온 설치

```bash
# 1. Blender 3.0 이상 실행
# 2. Edit > Preferences > Add-ons > Install
# 3. 다음 파일 선택:
plugins/blender-toolkit/skills/blender-retargeting/addon/__init__.py

# 4. "Blender Toolkit WebSocket Server" 활성화
```

### 2. TypeScript 클라이언트 빌드

```bash
cd plugins/blender-toolkit/skills/blender-retargeting/scripts
npm install
npm run build
```

### 3. WebSocket 서버 시작

Blender에서:
1. 사이드바 (N키) > "Blender Toolkit" 탭
2. "Start Server" 버튼 클릭
3. 포트 확인 (기본: 9400)

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
- `utils/`: 유틸리티 모듈
  - `bone_matching.py`: Fuzzy matching 알고리즘
  - `logger.py`: Python logging 시스템

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
