# Blender Toolkit

> **Status**: ✅ Release (v1.0.0)

**Language**: [English](README.md) | [한국어](README.ko.md)

Blender automation toolkit for Claude Code - WebSocket-based real-time Blender control and Mixamo animation retargeting

## 🎯 Features

- **🎬 Animation Retargeting**: Mixamo 애니메이션을 사용자 캐릭터에 자동 리타게팅
- **🔌 WebSocket Integration**: 실시간 Blender 제어 (포트: 9400~9500)
- **🤖 Auto Bone Mapping**: Mixamo 본을 사용자 리그에 자동 매핑
- **📦 Mixamo Integration**: 애니메이션 검색 및 다운로드 (API 지원)
- **🎨 Multi-Project Support**: 프로젝트별 독립적인 포트 및 설정 관리
- **🔧 Rigify Compatible**: Rigify 리그 자동 지원

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

Apache License 2.0 - See [LICENSE](../../LICENSE) file for details

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
