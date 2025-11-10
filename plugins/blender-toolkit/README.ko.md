# Blender Toolkit

> **⚠️ 상태**: 🧪 실험 단계 (v1.3.0)
>
> **이 플러그인은 현재 실험 단계입니다. API와 기능이 변경될 수 있습니다.**

**Language**: [English](README.md) | [한국어](README.ko.md)

Claude Code를 위한 Blender 자동화 툴킷 - 도형, 머티리얼, 모디파이어, 컬렉션, Mixamo 애니메이션 리타게팅을 포함한 WebSocket 기반 실시간 Blender 제어

## 🎯 Features

### 핵심 기능
- **🎬 Animation Retargeting**: Mixamo 애니메이션을 사용자 캐릭터에 자동 리타게팅
- **🧠 Fuzzy Bone Matching**: 60+ bones 지원, 유사도 기반 자동 매칭 (손가락, 발가락 포함)
- **🔌 WebSocket Integration**: 실시간 Blender 제어 (포트: 9400~9500)
- **✅ 2-Phase Workflow**: UI 확인 단계로 매핑 검증 가능
- **🎨 Multi-Project Support**: 프로젝트별 독립적인 포트 및 설정 관리
- **🔧 Rigify Compatible**: Rigify 리그 자동 지원

### v1.3.0의 새 기능
- **🎨 Material Management**: Principled BSDF 기반 머티리얼 생성, 속성 제어 (base color, metallic, roughness, emission)
- **🔧 Advanced Modifier Control**: 30+ modifiers 지원, list/remove/toggle/modify/reorder 전체 제어
- **📦 Collection Management**: 씬 계층 구조 관리 (create, add/remove objects, delete)
- **🏗️ Modular Architecture**: 모디파이어를 별도 모듈로 분리하여 확장성 향상
- **⚡ 30+ New CLI Commands**: material, modifier, collection 도메인에 걸친 새로운 명령

### v1.2.0 기능
- **🎨 Geometry Creation**: CLI 및 WebSocket을 통한 도형 생성 (Cube, Sphere, Cylinder, Plane, Cone, Torus)
- **🔧 Object Manipulation**: 오브젝트 변형, 복제, 삭제 등 전체 제어
- **⚡ Vertex Editing**: 버텍스 이동, 메쉬 세분화, 페이스 돌출 등 고급 편집
- **🔩 Modifier Support**: 모디파이어 추가 및 적용 (Subdivision, Mirror, Array, etc.)
- **💻 CLI Interface**: Browser-pilot 스타일의 명령줄 인터페이스

### v1.1.0 기능
- **📊 Logging System**: winston (TypeScript) + logging (Python) - 디버깅 및 모니터링
- **🧩 Modular Architecture**: 확장 가능한 명령 핸들러 구조 (commands/, utils/)
- **📚 Complete API Documentation**: WebSocket commands, bone mapping guide, workflow examples
- **🎯 Quality Reports**: 매핑 품질 평가 시스템 (excellent/good/fair/poor)

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
1. 사이드바 > "Blender Toolkit" 탭
2. "Start Server" 버튼 클릭
3. 포트 확인 (기본: 9400)

## 🚀 Quick Start

### 기본 리타게팅 예시

```typescript
import { AnimationRetargetingWorkflow } from 'blender-retargeting';

const workflow = new AnimationRetargetingWorkflow();

await workflow.run({
  targetCharacterArmature: 'MyCharacter',  // 사용자 캐릭터 이름
  mixamoAnimation: 'Walking',               // Mixamo 애니메이션 검색어
  boneMapping: 'auto',                      // 자동 본 매핑
});
```

### Claude Code와 함께 사용

**User**: "내 캐릭터 'Hero'에 Mixamo의 걷기 애니메이션을 적용해줘"

**Claude가 자동으로 실행**:
1. ✅ Blender 연결 (WebSocket)
2. 🔍 'Hero' 캐릭터 확인
3. 📥 Mixamo에서 'Walking' 다운로드
4. 📦 FBX 임포트
5. 🎯 본 자동 매핑
6. 🎬 애니메이션 리타게팅
7. 📋 NLA 트랙 추가

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude Code   │◄───────►│  TypeScript      │◄───────►│    Blender      │
│   (Skill)       │   IPC   │  WebSocket       │   WS    │   (Python       │
│                 │         │  Client          │ 9400    │    Addon)       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   Mixamo API     │
                            │   (Optional)     │
                            └──────────────────┘
```

## 📁 Project Structure

```
plugins/blender-toolkit/
├── .claude-plugin/
│   └── plugin.json                          # 플러그인 메타데이터
├── skills/
│   └── blender-retargeting/
│       ├── SKILL.md                         # 스킬 정의 (Claude용)
│       ├── addon/
│       │   └── __init__.py                  # Blender Python 애드온
│       ├── scripts/
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── src/
│       │       ├── index.ts                 # 메인 워크플로우
│       │       ├── constants/
│       │       │   └── index.ts             # 상수 정의
│       │       └── blender/
│       │           ├── client.ts            # WebSocket 클라이언트
│       │           ├── config.ts            # 설정 관리
│       │           ├── retargeting.ts       # 리타게팅 로직
│       │           └── mixamo.ts            # Mixamo API
│       └── references/
│           └── bone-mappings.json           # 본 매핑 프리셋
└── README.md
```

## 🎨 Bone Mapping

### Auto Mapping (자동 매핑)

Mixamo 표준 본 이름 자동 감지:

| Mixamo Bone | Target Candidates |
|-------------|-------------------|
| Hips        | hips, pelvis, root |
| Spine       | spine, spine1 |
| LeftArm     | upper_arm.l, leftarm |
| RightLeg    | shin.r, rightleg |

### Preset Mapping (프리셋)

- **mixamo_to_rigify**: Rigify 자동 리그용
- **mixamo_to_custom**: 커스텀 리그용

### Custom Mapping (커스텀)

```typescript
customBoneMap: {
  'Hips': 'root_bone',
  'Spine': 'spine_01',
  'LeftArm': 'arm_L',
  // ...
}
```

## 🔑 Mixamo Authentication

### Bearer 토큰 설정 (선택사항)

Mixamo API 자동 다운로드를 위해:

```typescript
import { saveMixamoBearerToken } from './blender/config';

saveMixamoBearerToken('your-bearer-token');
```

### 토큰 없이 사용

수동 다운로드 후 경로 지정:

```typescript
await workflow.run({
  targetCharacterArmature: 'MyCharacter',
  mixamoFilePath: './animations/walking.fbx',
});
```

## 🛠️ Configuration

### 프로젝트별 설정

```json
{
  "rootPath": "/path/to/project",
  "port": 9400,
  "outputDir": ".blender-toolkit",
  "mixamoBearerToken": "optional-token"
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
```

### "Armature not found"

```python
# Blender Python 콘솔에서 확인
import bpy
print([obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE'])
```

### "Bone mapping failed"

커스텀 본 매핑 사용:
```typescript
customBoneMap: {
  'Hips': 'actual_bone_name_in_your_rig',
  // 모든 주요 본 수동 매핑
}
```

## 📚 Examples

### 1. 단일 애니메이션 리타게팅

```typescript
await workflow.run({
  targetCharacterArmature: 'Hero',
  mixamoAnimation: 'Walking',
  boneMapping: 'auto',
});
```

### 2. 여러 애니메이션 배치 처리

```typescript
const animations = ['Walking', 'Running', 'Jumping', 'Dancing'];

for (const anim of animations) {
  await workflow.run({
    targetCharacterArmature: 'Hero',
    mixamoAnimation: anim,
    boneMapping: 'auto',
  });
  console.log(`✅ ${anim} completed`);
}
```

### 3. Rigify 캐릭터

```typescript
await workflow.run({
  targetCharacterArmature: 'RigifyCharacter',
  mixamoAnimation: 'Sword And Shield Slash',
  boneMapping: 'mixamo_to_rigify',
});
```

## 🎯 Best Practices

1. **표준 리그 사용**: Rigify 자동 리그 권장
2. **Without Skin 다운로드**: Mixamo에서 "Without Skin" 선택
3. **NLA 관리**: 여러 애니메이션을 NLA 트랙으로 정리
4. **클린업**: 리타게팅 후 Mixamo 소스 아마추어 삭제
5. **프리뷰**: 항상 애니메이션 확인 후 최종 저장

## 🔗 Integration

### Claude Code Skill

SKILL.md에 정의된 워크플로우를 Claude가 자동 실행:

```yaml
---
name: blender-retargeting
description: Blender animation retargeting with Mixamo
allowed-tools: Bash, Read, Write, Glob
---
```

### API Reference

```typescript
// BlenderClient
const client = new BlenderClient(port);
await client.connect();
await client.sendCommand('Armature.list');

// RetargetingController
const controller = new RetargetingController(client);
await controller.retarget(options);

// MixamoClient
const mixamo = new MixamoClient();
await mixamo.searchAnimations('walking');
```

## 📊 Performance

- **연결 속도**: ~100ms (WebSocket 핸드셰이크)
- **리타게팅**: ~2-10초 (본 개수에 따라)
- **FBX 임포트**: ~1-5초
- **Mixamo 다운로드**: ~5-30초 (파일 크기에 따라)

## 🤝 Contributing

본 매핑 프리셋 추가:

1. `addon/__init__.py` 수정
2. `get_preset_bone_mapping()` 함수에 프리셋 추가
3. 문서 업데이트
4. 테스트

## 📝 License

Apache License 2.0 - 자세한 내용은 [LICENSE](../../LICENSE) 파일을 참조하세요

## 🙏 Credits

- **Blender Foundation**: Blender 3D software
- **Adobe Mixamo**: Free animation library
- **Browser-Pilot**: WebSocket architecture inspiration

## 📞 Support

- **Issues**: https://github.com/Dev-GOM/claude-code-marketplace/issues
- **Discussions**: https://github.com/Dev-GOM/claude-code-marketplace/discussions
- **Documentation**: See SKILL.md

---

**Made with ❤️ for Claude Code Community**
