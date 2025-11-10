---
name: blender-retargeting
description: Blender animation retargeting with Mixamo integration via WebSocket - automate character rigging, bone mapping, and animation transfer
allowed-tools: Bash, Read, Write, Glob
---

# Blender Animation Retargeting Skill

Blender에서 Mixamo 애니메이션을 사용자의 리깅된 캐릭터에 자동으로 리타게팅하는 스킬입니다. WebSocket 기반 실시간 통신으로 Blender를 제어합니다.

## 📋 Prerequisites

### 1. Blender 설치 및 애드온 활성화

**필수 단계:**
1. Blender 3.0 이상 설치
2. Blender Python 애드온 설치:
   - Blender 실행
   - `Edit > Preferences > Add-ons > Install`
   - `plugins/blender-toolkit/skills/blender-retargeting/addon/__init__.py` 선택
   - "Blender Toolkit WebSocket Server" 애드온 활성화
3. 사이드바에서 "Blender Toolkit" 탭 확인
4. "Start Server" 버튼 클릭하여 WebSocket 서버 시작

### 2. TypeScript 클라이언트 빌드

```bash
cd plugins/blender-toolkit/skills/blender-retargeting/scripts
npm install
npm run build
```

### 3. 사용자 캐릭터 준비

- **리깅 완료된 캐릭터**: 아마추어(Armature)가 설정된 3D 모델
- **본 이름**: 표준 리그 이름 권장 (Rigify, Mixamo 호환)
- **Blender에 임포트**: 캐릭터가 현재 씬에 로드되어 있어야 함

## 🎯 Core Functionality

### 1. Mixamo 애니메이션 검색 및 다운로드

```typescript
import { AnimationRetargetingWorkflow } from './index';

const workflow = new AnimationRetargetingWorkflow();

// Mixamo 애니메이션 검색 및 다운로드
await workflow.run({
  targetCharacterArmature: 'MyCharacter',  // 사용자 캐릭터 이름
  mixamoAnimation: 'Walking',               // 애니메이션 검색어
  boneMapping: 'auto',                      // 자동 본 매핑
});
```

### 2. 수동 다운로드 파일 사용

Mixamo API 인증이 없는 경우:

```typescript
await workflow.run({
  targetCharacterArmature: 'MyCharacter',
  mixamoFilePath: '/path/to/downloaded/walking.fbx',  // 수동 다운로드 파일
  boneMapping: 'auto',
});
```

### 3. 커스텀 본 매핑

```typescript
await workflow.run({
  targetCharacterArmature: 'MyCharacter',
  mixamoAnimation: 'Running',
  boneMapping: 'custom',
  customBoneMap: {
    'Hips': 'root',
    'Spine': 'spine_01',
    'LeftArm': 'arm_L',
    'RightArm': 'arm_R',
    // ... 더 많은 본 매핑
  },
});
```

## 🔧 Workflow Steps

Claude가 자동으로 실행하는 단계:

1. **Blender 연결**: WebSocket으로 Blender에 연결 (포트: 9400~9500)
2. **캐릭터 확인**: 사용자 캐릭터의 아마추어 확인
3. **Mixamo 애니메이션 가져오기**:
   - API로 검색 및 다운로드 (Bearer 토큰 있는 경우)
   - 또는 수동 다운로드 파일 사용
4. **FBX 임포트**: Blender에 애니메이션 임포트
5. **본 매핑 생성**: Mixamo 본 ↔ 사용자 캐릭터 본 자동 매칭
6. **리타게팅 실행**: 컨스트레인트 기반 애니메이션 전송
7. **베이킹**: 컨스트레인트를 키프레임으로 변환
8. **NLA 추가**: 타임라인에 애니메이션 트랙 추가

## 📝 Usage Examples

### Example 1: 기본 리타게팅

**User**: "내 캐릭터 'Hero'에 Mixamo의 걷기 애니메이션을 적용해줘"

**Claude 실행**:
```typescript
const workflow = new AnimationRetargetingWorkflow();

await workflow.run({
  targetCharacterArmature: 'Hero',
  mixamoAnimation: 'Walking',
  boneMapping: 'auto',
});
```

**결과**:
- Mixamo에서 "Walking" 검색
- 자동으로 다운로드 (또는 수동 다운로드 안내)
- Hero 캐릭터에 애니메이션 리타게팅
- NLA 트랙에 "Mixamo_[timestamp]" 추가

### Example 2: 여러 애니메이션 일괄 적용

**User**: "내 캐릭터에 Walking, Running, Jumping 애니메이션을 모두 적용해줘"

**Claude 실행**:
```typescript
const animations = ['Walking', 'Running', 'Jumping'];
const workflow = new AnimationRetargetingWorkflow();

for (const animName of animations) {
  console.log(`\n🎬 Processing ${animName}...`);

  await workflow.run({
    targetCharacterArmature: 'MyCharacter',
    mixamoAnimation: animName,
    boneMapping: 'auto',
  });
}
```

### Example 3: Rigify 캐릭터에 리타게팅

**User**: "Rigify로 리깅한 캐릭터에 춤 애니메이션 적용해줘"

**Claude 실행**:
```typescript
await workflow.run({
  targetCharacterArmature: 'RigifyCharacter',
  mixamoAnimation: 'Dancing',
  boneMapping: 'mixamo_to_rigify',  // Rigify 프리셋 사용
});
```

## 🔑 Mixamo Authentication (Optional)

Mixamo API를 사용하려면 Bearer 토큰이 필요합니다:

### Bearer 토큰 얻기

1. Mixamo.com에 로그인 (Adobe 계정)
2. 브라우저 개발자 도구 열기 (F12)
3. Network 탭 → 애니메이션 검색
4. 요청 헤더에서 `Authorization: Bearer ...` 복사

### 토큰 저장

```typescript
import { saveMixamoBearerToken } from './blender/config';

saveMixamoBearerToken('your-bearer-token-here');
```

**참고**: 토큰 없이도 수동 다운로드 후 `mixamoFilePath`로 사용 가능합니다.

## 🎨 Bone Mapping Strategies

### 1. Auto Mapping (권장)

Mixamo 표준 본 이름을 기반으로 자동 매칭:

- `Hips` → `hips`, `pelvis`, `root`
- `Spine` → `spine`, `spine1`
- `LeftArm` → `upper_arm.l`, `leftarm`
- `RightLeg` → `shin.r`, `rightleg`

### 2. Preset Mapping

미리 정의된 프리셋:

- `mixamo_to_rigify`: Rigify 리그용
- `mixamo_to_custom`: 커스텀 리그용

### 3. Custom Mapping

사용자 정의 본 매핑:

```typescript
{
  'Mixamo_Bone_Name': 'Your_Bone_Name'
}
```

## 📂 Output Structure

```
.blender-toolkit/
├── animations/              # 다운로드된 Mixamo FBX 파일
│   ├── walking.fbx
│   ├── running.fbx
│   └── dancing.fbx
├── blender-config.json     # 프로젝트별 설정
└── .gitignore              # Git 무시 설정
```

**전역 설정**:
```
~/.claude/plugins/marketplaces/dev-gom-plugins/plugins/blender-toolkit/skills/blender-config.json
```

## 🚨 Troubleshooting

### 문제 1: "Blender is not running"

**원인**: WebSocket 서버가 시작되지 않음

**해결**:
1. Blender 실행 확인
2. 애드온 활성화 확인
3. "Start Server" 버튼 클릭
4. 포트 충돌 확인 (9400~9500)

### 문제 2: "Target armature not found"

**원인**: 캐릭터 이름이 잘못됨

**해결**:
```bash
# Blender에서 아마추어 목록 확인
Outliner 패널에서 캐릭터 이름 확인
```

### 문제 3: "Bone mapping failed"

**원인**: 본 이름이 표준과 다름

**해결**:
```typescript
// 커스텀 본 매핑 사용
customBoneMap: {
  'Hips': 'actual_root_bone_name',
  // 모든 본 수동 매핑
}
```

### 문제 4: "Mixamo download failed"

**원인**: Bearer 토큰 없음 또는 만료

**해결**:
1. Mixamo.com에서 수동 다운로드:
   - Format: FBX
   - Skin: Without Skin
   - FPS: 30
2. `mixamoFilePath`로 파일 경로 지정

## 🎯 Best Practices

### 1. 본 이름 표준화

캐릭터 리깅 시 표준 이름 사용:
- Rigify 자동 리그 권장
- 또는 Mixamo 본 이름 규칙 따르기

### 2. 애니메이션 프리뷰

리타게팅 후 반드시 확인:
- 발이 땅에 붙는지
- 팔이 올바르게 움직이는지
- 회전 제약이 자연스러운지

### 3. 클린업

Mixamo 소스 아마추어 삭제:
```python
# Blender에서 수동 또는 스크립트로
bpy.data.objects['Mixamo_Armature'].select_set(True)
bpy.ops.object.delete()
```

### 4. NLA 관리

여러 애니메이션을 NLA 트랙으로 관리하면 블렌딩 가능

## 🔗 Integration with Claude Workflow

Claude가 이 스킬을 호출하는 방법:

```typescript
import { AnimationRetargetingWorkflow } from 'blender-retargeting';

async function handleUserRequest(userMessage: string) {
  // 사용자 요청 파싱
  const characterName = extractCharacterName(userMessage);
  const animationName = extractAnimationName(userMessage);

  // 워크플로우 실행
  const workflow = new AnimationRetargetingWorkflow();

  await workflow.run({
    targetCharacterArmature: characterName,
    mixamoAnimation: animationName,
    boneMapping: 'auto',
  });

  console.log('✅ Animation retargeted successfully!');
}
```

## 📊 Configuration Management

### 프로젝트별 포트 자동 할당

Browser-Pilot처럼 프로젝트마다 고유 포트:

- Project A: 9400
- Project B: 9401
- Project C: 9402

### 설정 확인

```typescript
import { listProjects } from './blender/config';

listProjects();
```

## 🌟 Advanced Features

### 1. 애니메이션 미리보기

```typescript
import { RetargetingController } from './blender/retargeting';

const controller = new RetargetingController(client);

// 재생
await controller.playAnimation('MyCharacter', 'Walking_Action', true);

// 정지
await controller.stopAnimation();
```

### 2. 본 구조 분석

```typescript
const bones = await controller.getBones('MyCharacter');

bones.forEach(bone => {
  console.log(`${bone.name} - Parent: ${bone.parent}`);
});
```

### 3. 인기 애니메이션 추천

```typescript
const popular = workflow.getPopularAnimations();

console.log('Recommended animations:');
popular.forEach(anim => {
  console.log(`- ${anim.name} (${anim.category})`);
});
```

## 📚 References

- **Blender Python API**: https://docs.blender.org/api/current/
- **Mixamo**: https://www.mixamo.com
- **WebSocket Protocol**: RFC 6455
- **FBX Format**: Autodesk FBX SDK

## 🤝 Contributing

본 매핑 프리셋 추가 방법:

1. `addon/__init__.py`의 `get_preset_bone_mapping()` 수정
2. 새 프리셋 딕셔너리 추가
3. 테스트 및 문서화

## 📝 Notes

- **포트 범위**: 9400-9500 (Browser-Pilot과 충돌 방지)
- **파일 포맷**: FBX 권장 (Collada .dae도 지원)
- **Blender 버전**: 3.0 이상
- **Python 버전**: Blender 내장 Python 3.10+

## ⚡ Performance Tips

1. **Without Skin 다운로드**: Mixamo 다운로드 시 "Without Skin" 선택하여 파일 크기 감소
2. **프레임 범위 제한**: 긴 애니메이션은 필요한 부분만 베이킹
3. **여러 애니메이션 처리**: 배치로 실행하여 Blender 재시작 최소화

---

**Happy animating! 🎬**
