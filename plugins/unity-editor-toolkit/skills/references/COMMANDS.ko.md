# Unity Editor Toolkit - 전체 명령어 레퍼런스

Unity Editor를 제어할 수 있는 모든 명령어 목록입니다. ✅는 현재 구현됨, 🔄는 구현 예정을 의미합니다.

## 총 명령어 개수 요약

- **✅ 현재 구현**: 15개 명령어 (5개 카테고리)
- **🔄 구현 예정**: 500+ 명령어 (25개 카테고리)

Unity Editor의 거의 모든 기능을 CLI로 제어할 수 있도록 설계되었습니다.

## 주요 카테고리

1. **GameObject & Hierarchy** - GameObject 생성, 삭제, 조작, 계층 구조 관리
2. **Transform** - 위치, 회전, 스케일 제어
3. **Component** - 컴포넌트 추가, 제거, 속성 변경
4. **Material & Rendering** - Material 속성, 텍스처, Renderer 설정
5. **Scene Management** - 씬 로드, 저장, 병합
6. **Prefab** - Prefab 인스턴스화, 생성, 오버라이드 관리
7. **Asset Database** - Asset 검색, 가져오기, 종속성 관리
8. **Console & Logging** - 콘솔 로그 조회, 필터링
9. **Editor Window & UI** - Editor 창 제어, Selection, Play Mode
10. **Animation** - Animation 재생, Animator 제어
11. **Physics** - Rigidbody, Collider, Raycast
12. **Lighting** - Light 설정, Lightmap Baking
13. **Camera** - 카메라 위치, FOV, Screenshot
14. **Audio** - AudioSource 재생, 볼륨, Audio Mixer
15. **Navigation & AI** - NavMesh, NavMeshAgent
16. **Particle System** - 파티클 재생, 방출 제어
17. **Timeline** - Timeline 재생, Track 관리
18. **Build & Player** - 빌드 실행, 플레이어 설정
19. **Project Settings** - 프로젝트 설정 변경
20. **Package Manager** - 패키지 설치, 제거, 업데이트
21. **Version Control** - VCS 상태, Commit, Update
22. **Profiler & Performance** - Profiler 데이터, 메모리 프로파일링
23. **Test Runner** - 유닛 테스트 실행, Code Coverage
24. **Input System** - Input Action, Device 시뮬레이션
25. **UI Toolkit** - UI Document, Element 제어

상세한 명령어 목록은 [COMMANDS.md](./COMMANDS.md)를 참조하세요.

## 현재 구현된 명령어

### GameObject & Hierarchy
```bash
unity-editor go find <name>                    # GameObject 찾기
unity-editor go create <name>                  # GameObject 생성
unity-editor go destroy <name>                 # GameObject 삭제
unity-editor go set-active <name> <true|false> # 활성 상태 설정
unity-editor hierarchy                         # 계층 구조 조회
```

### Transform
```bash
unity-editor tf get <name>                     # Transform 정보 가져오기
unity-editor tf set-position <name> <x,y,z>    # Position 설정
unity-editor tf set-rotation <name> <x,y,z>    # Rotation 설정
unity-editor tf set-scale <name> <x,y,z>       # Scale 설정
```

### Scene Management
```bash
unity-editor scene current                     # 현재 씬 정보
unity-editor scene list                        # 로드된 씬 목록
unity-editor scene load <name>                 # 씬 로드
```

### Console & Logging
```bash
unity-editor console logs [--count <n>]        # 콘솔 로그 가져오기
unity-editor console clear                     # 콘솔 지우기
```

## 향후 추가될 주요 기능

### Component 제어
- Component 추가/제거
- 속성 가져오기/설정
- Component 일괄 수정

### Material & Rendering
- Material 속성 변경
- 텍스처 설정
- Shader 변경

### Prefab
- Prefab 인스턴스화
- 오버라이드 관리
- Prefab Variant

### Animation
- Animation 재생 제어
- Animator Parameter 설정
- Animation Curve 수정

### Physics
- Rigidbody 제어
- Raycast
- Collider 설정

### 그 외 500+ 명령어
전체 목록은 [COMMANDS.md](./COMMANDS.md)를 참조하세요.

## 사용 예제

### GameObject 생성 및 배치
```bash
unity-editor go create "Enemy"
unity-editor tf set-position "Enemy" "10,0,5"
unity-editor tf set-rotation "Enemy" "0,45,0"
```

### Prefab 인스턴스화 및 설정
```bash
unity-editor prefab instantiate "Prefabs/Player" --position "0,1,0"
unity-editor material set-color "Player" "_Color" "0,1,0,1"
```

### 씬 로드 및 GameObject 활성화
```bash
unity-editor scene load "Level1"
unity-editor go set-active "Boss" true
unity-editor anim play "Boss" "AttackAnimation"
```

### 콘솔 로그 모니터링
```bash
unity-editor console logs --errors-only --count 100
```

## 명령어 설계 원칙

1. **일관성**: 모든 명령어는 `unity-editor <category> <action> <target> [options]` 형식
2. **직관성**: 명령어 이름은 기능을 명확히 표현
3. **확장성**: 새로운 카테고리와 명령어를 쉽게 추가 가능
4. **안전성**: 위험한 작업은 확인 프롬프트
5. **성능**: 일괄 처리 지원

## 개발 로드맵

**Phase 1 (현재)**: GameObject, Transform, Scene, Console 기본 기능
**Phase 2**: Component, Material, Prefab
**Phase 3**: Animation, Physics, Lighting
**Phase 4**: Build, Profiler, Test Runner
**Phase 5**: 고급 기능 (Timeline, UI Toolkit, VCS)

---

자세한 명령어 문법과 옵션은 [COMMANDS.md](./COMMANDS.md)를 참조하세요.
