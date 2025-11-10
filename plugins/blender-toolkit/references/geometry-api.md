# Geometry API Reference

Blender Toolkit의 도형 생성 및 메쉬 편집 API 문서입니다.

## 목차

- [Primitive Creation (도형 생성)](#primitive-creation)
- [Object Operations (오브젝트 조작)](#object-operations)
- [Vertex Operations (버텍스 편집)](#vertex-operations)
- [Modifier Operations (모디파이어)](#modifier-operations)
- [CLI Commands (CLI 명령)](#cli-commands)

---

## Primitive Creation

### Geometry.createCube

큐브(정육면체) 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],  // [x, y, z] 위치
  "size": 2.0,            // 크기
  "name": "Cube"          // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Cube",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 8,
  "faces": 6
}
```

**CLI:**
```bash
blender-toolkit create-cube -x 0 -y 0 -z 0 --size 2.0 --name "MyCube"
```

---

### Geometry.createSphere

구(Sphere) 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],  // [x, y, z] 위치
  "radius": 1.0,          // 반지름
  "segments": 32,         // 수평 세그먼트 수
  "ringCount": 16,        // 수직 링 수
  "name": "Sphere"        // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Sphere",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 482,
  "faces": 480
}
```

**CLI:**
```bash
blender-toolkit create-sphere --radius 1.5 --segments 64 --rings 32
```

---

### Geometry.createCylinder

실린더 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],  // [x, y, z] 위치
  "radius": 1.0,          // 반지름
  "depth": 2.0,           // 높이
  "vertices": 32,         // 버텍스 수
  "name": "Cylinder"      // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Cylinder",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 64,
  "faces": 62
}
```

**CLI:**
```bash
blender-toolkit create-cylinder --radius 0.5 --depth 3.0 --vertices 16
```

---

### Geometry.createPlane

평면(Plane) 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],  // [x, y, z] 위치
  "size": 2.0,            // 크기
  "name": "Plane"         // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Plane",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 4,
  "faces": 1
}
```

**CLI:**
```bash
blender-toolkit create-plane --size 10.0 --name "Ground"
```

---

### Geometry.createCone

원뿔(Cone) 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],  // [x, y, z] 위치
  "radius1": 1.0,         // 아래 반지름
  "depth": 2.0,           // 높이
  "vertices": 32,         // 버텍스 수
  "name": "Cone"          // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Cone",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 33,
  "faces": 32
}
```

**CLI:**
```bash
blender-toolkit create-cone --radius 2.0 --depth 4.0
```

---

### Geometry.createTorus

토러스(Torus) 생성

**Parameters:**
```json
{
  "location": [0, 0, 0],    // [x, y, z] 위치
  "majorRadius": 1.0,       // 주 반지름
  "minorRadius": 0.25,      // 부 반지름 (튜브 두께)
  "majorSegments": 48,      // 주 세그먼트 수
  "minorSegments": 12,      // 부 세그먼트 수
  "name": "Torus"           // 오브젝트 이름 (선택)
}
```

**Returns:**
```json
{
  "name": "Torus",
  "type": "MESH",
  "location": [0, 0, 0],
  "vertices": 576,
  "faces": 576
}
```

**CLI:**
```bash
blender-toolkit create-torus --major-radius 2.0 --minor-radius 0.5
```

---

## Object Operations

### Object.list

씬의 모든 오브젝트 목록 조회

**Parameters:**
```json
{
  "type": "MESH"  // 오브젝트 타입 필터 (선택)
                   // 옵션: MESH, ARMATURE, CAMERA, LIGHT, EMPTY, etc.
}
```

**Returns:**
```json
[
  {
    "name": "Cube",
    "type": "MESH",
    "location": [0, 0, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  ...
]
```

**CLI:**
```bash
blender-toolkit list-objects
blender-toolkit list-objects --type MESH
```

---

### Object.transform

오브젝트 변형 (이동, 회전, 스케일)

**Parameters:**
```json
{
  "name": "Cube",                    // 오브젝트 이름 (필수)
  "location": [1.0, 2.0, 3.0],      // 새 위치 (선택)
  "rotation": [0, 0, 1.57],         // 새 회전 (radians, 선택)
  "scale": [2.0, 2.0, 2.0]          // 새 스케일 (선택)
}
```

**Returns:**
```json
{
  "name": "Cube",
  "location": [1.0, 2.0, 3.0],
  "rotation": [0, 0, 1.57],
  "scale": [2.0, 2.0, 2.0]
}
```

**CLI:**
```bash
# 이동
blender-toolkit transform --name "Cube" --loc-x 5.0 --loc-y 0 --loc-z 2.0

# 회전 (radians)
blender-toolkit transform --name "Cube" --rot-z 1.57

# 스케일
blender-toolkit transform --name "Cube" --scale-x 2.0 --scale-y 2.0 --scale-z 2.0
```

---

### Object.duplicate

오브젝트 복제

**Parameters:**
```json
{
  "name": "Cube",              // 원본 오브젝트 이름 (필수)
  "newName": "Cube.001",       // 새 이름 (선택)
  "location": [5.0, 0, 0]      // 새 위치 (선택)
}
```

**Returns:**
```json
{
  "name": "Cube.001",
  "type": "MESH",
  "location": [5.0, 0, 0]
}
```

**CLI:**
```bash
blender-toolkit duplicate --name "Cube" --new-name "CubeCopy" -x 5.0
```

---

### Object.delete

오브젝트 삭제

**Parameters:**
```json
{
  "name": "Cube"  // 오브젝트 이름 (필수)
}
```

**Returns:**
```json
{
  "status": "success",
  "message": "Object 'Cube' deleted"
}
```

**CLI:**
```bash
blender-toolkit delete --name "Cube"
```

---

## Vertex Operations

### Geometry.getVertices

오브젝트의 모든 버텍스 정보 조회

**Parameters:**
```json
{
  "name": "Cube"  // 오브젝트 이름 (필수)
}
```

**Returns:**
```json
[
  {
    "index": 0,
    "co": [1.0, 1.0, -1.0],      // 좌표
    "normal": [0.0, 0.0, -1.0]   // 노멀 벡터
  },
  ...
]
```

**CLI:**
```bash
blender-toolkit get-vertices --name "Cube"
```

---

### Geometry.moveVertex

특정 버텍스를 새 위치로 이동

**Parameters:**
```json
{
  "objectName": "Cube",            // 오브젝트 이름 (필수)
  "vertexIndex": 0,                // 버텍스 인덱스 (필수)
  "newPosition": [2.0, 1.0, -1.0]  // 새 위치 [x, y, z] (필수)
}
```

**Returns:**
```json
{
  "object": "Cube",
  "vertex_index": 0,
  "position": [2.0, 1.0, -1.0]
}
```

**CLI:**
```bash
blender-toolkit move-vertex --name "Cube" --index 0 -x 2.0 -y 1.0 -z -1.0
```

---

### Geometry.subdivideMesh

메쉬 세분화 (Subdivide)

**Parameters:**
```json
{
  "name": "Cube",  // 오브젝트 이름 (필수)
  "cuts": 2        // 세분화 횟수 (기본값: 1)
}
```

**Returns:**
```json
{
  "name": "Cube",
  "vertices": 98,
  "edges": 192,
  "faces": 96
}
```

**CLI:**
```bash
blender-toolkit subdivide --name "Cube" --cuts 2
```

---

### Geometry.extrudeFace

페이스 돌출 (Extrude)

**Parameters:**
```json
{
  "objectName": "Cube",  // 오브젝트 이름 (필수)
  "faceIndex": 0,        // 페이스 인덱스 (필수)
  "offset": 1.0          // 돌출 거리 (기본값: 1.0)
}
```

**Returns:**
```json
{
  "object": "Cube",
  "face_index": 0,
  "vertices": 12,
  "faces": 7
}
```

**Note:** CLI 명령은 아직 구현되지 않았습니다 (WebSocket API만 사용 가능).

---

## Modifier Operations

### Modifier.add

모디파이어 추가

**Parameters:**
```json
{
  "objectName": "Cube",           // 오브젝트 이름 (필수)
  "modifierType": "SUBSURF",      // 모디파이어 타입 (필수)
  "name": "Subdivision",          // 모디파이어 이름 (선택)
  "properties": {                 // 모디파이어 속성 (선택)
    "levels": 2,
    "render_levels": 2
  }
}
```

**Modifier Types:**
- `SUBSURF` - Subdivision Surface
- `MIRROR` - Mirror
- `ARRAY` - Array
- `BEVEL` - Bevel
- `SOLIDIFY` - Solidify
- `BOOLEAN` - Boolean
- 기타 Blender 모디파이어

**Returns:**
```json
{
  "object": "Cube",
  "modifier": "Subdivision",
  "type": "SUBSURF"
}
```

**CLI:**
```bash
blender-toolkit add-modifier --name "Cube" --type SUBSURF --levels 2
```

---

### Modifier.apply

모디파이어 적용

**Parameters:**
```json
{
  "objectName": "Cube",      // 오브젝트 이름 (필수)
  "modifierName": "Subdivision"  // 모디파이어 이름 (필수)
}
```

**Returns:**
```json
{
  "status": "success",
  "message": "Modifier 'Subdivision' applied"
}
```

**CLI:**
```bash
blender-toolkit apply-modifier --name "Cube" --modifier "Subdivision"
```

---

## CLI Commands

### 설치 및 빌드

```bash
cd plugins/blender-toolkit/skills/blender-retargeting/scripts
npm install
npm run build
```

### CLI 명령 실행

#### Geometry Creation

```bash
# Cube
npm run bt:create-cube -- -x 0 -y 0 -z 0 --size 2.0

# Sphere
npm run bt:create-sphere -- --radius 1.0 --segments 32

# Cylinder
npm run bt:create-cylinder -- --radius 0.5 --depth 2.0

# Plane
npm run bt:create-plane -- --size 5.0
```

#### Object Operations

```bash
# List objects
npm run bt:list-objects

# Transform
npm run bt:transform -- --name "Cube" --loc-x 5.0 --loc-y 0 --loc-z 2.0

# Delete
npm run bt:delete -- --name "Cube"
```

#### Animation Retargeting

```bash
# Retarget animation
npm run bt:retarget -- --target "MyCharacter" --file "./animations/Walking.fbx"

# Show Mixamo help
blender-toolkit mixamo-help
blender-toolkit mixamo-help "Walking"
```

---

## 사용 예시

### TypeScript/JavaScript에서 사용

```typescript
import { BlenderClient } from './blender/client';

const client = new BlenderClient();

async function createScene() {
  await client.connect(9400);

  // Create a cube
  const cube = await client.sendCommand('Geometry.createCube', {
    location: [0, 0, 0],
    size: 2.0,
    name: 'MyCube'
  });

  // Add subdivision modifier
  await client.sendCommand('Modifier.add', {
    objectName: 'MyCube',
    modifierType: 'SUBSURF',
    properties: { levels: 2 }
  });

  // Create a sphere
  const sphere = await client.sendCommand('Geometry.createSphere', {
    location: [5, 0, 0],
    radius: 1.5
  });

  await client.disconnect();
}

createScene();
```

### Claude Code에서 사용

Claude에게 다음과 같이 요청할 수 있습니다:

```
"Blender에 큐브를 생성하고 위치를 (5, 0, 2)로 이동시켜줘"
"구를 만들고 subdivision modifier를 추가해줘"
"평면을 만들고 크기를 10으로 설정해줘"
```

Claude가 자동으로 적절한 CLI 명령이나 WebSocket API를 호출합니다.

---

## 에러 처리

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "id": "request-id",
  "error": {
    "code": -1,
    "message": "Error description"
  }
}
```

**일반적인 에러:**
- `Object not found` - 지정한 오브젝트가 없음
- `Mesh object required` - MESH 타입 오브젝트가 필요함
- `Vertex index out of range` - 잘못된 버텍스 인덱스
- `WebSocket connection failed` - Blender 서버에 연결 실패

---

## 추가 참고 자료

- [WebSocket API Reference](./websocket-api.md)
- [Bone Mapping Guide](./bone-mapping-guide.md)
- [Workflow Examples](./workflow-examples.md)
