# Unity Editor Toolkit - Complete Command Reference

Unity Editor를 제어할 수 있는 500+ 명령어 로드맵입니다.

**Current Status**: Phase 1 - 18 commands implemented

📖 **Full documentation by category**:
- [Connection & Status](./COMMANDS_CONNECTION_STATUS.md)
- [GameObject & Hierarchy](./COMMANDS_GAMEOBJECT_HIERARCHY.md)
- [Transform](./COMMANDS_TRANSFORM.md)
- [Scene Management](./COMMANDS_SCENE.md)
- [Asset Database & Editor Utilities](./COMMANDS_EDITOR.md)
- [Console & Logging](./COMMANDS_CONSOLE.md)

## Table of Contents

1. [Connection & Status](#connection--status) ✅
2. [GameObject & Hierarchy](#1-gameobject--hierarchy) ✅
3. [Transform](#2-transform) ✅
4. [Component](#3-component) 🔄
5. [Material & Rendering](#4-material--rendering) 🔄
6. [Scene Management](#5-scene-management) ✅
7. [Prefab](#6-prefab) 🔄
8. [Asset Database & Editor](#7-asset-database--editor-utilities) ✅
9. [Console & Logging](#8-console--logging) ✅
10. [Editor Window & UI](#9-editor-window--ui) 🔄
11. [Animation](#10-animation) 🔄
12. [Physics](#11-physics) 🔄
13. [Lighting](#12-lighting) 🔄
14. [Camera](#13-camera) 🔄
15. [Audio](#14-audio) 🔄
16. [Navigation & AI](#15-navigation--ai) 🔄
17. [Particle System](#16-particle-system) 🔄
18. [Timeline](#17-timeline) 🔄
19. [Build & Player](#18-build--player) 🔄
20. [Project Settings](#19-project-settings) 🔄
21. [Package Manager](#20-package-manager) 🔄
22. [Version Control](#21-version-control) 🔄
23. [Profiler & Performance](#22-profiler--performance) 🔄
24. [Test Runner](#23-test-runner) 🔄
25. [Input System](#24-input-system) 🔄
26. [UI Toolkit](#25-ui-toolkit) 🔄

---

## Connection & Status

### ✅ Currently Implemented (1 command)

```bash
# Check Unity WebSocket connection status
cd <unity-project-root> node .unity-websocket/uw status
```

**📖 Full documentation**: [COMMANDS_CONNECTION_STATUS.md](./COMMANDS_CONNECTION_STATUS.md)

---

## 1. GameObject & Hierarchy

### ✅ Currently Implemented (5 commands)

```bash
cd <unity-project-root> node .unity-websocket/uw go find <name>      # Find GameObject
cd <unity-project-root> node .unity-websocket/uw go create <name>    # Create GameObject
cd <unity-project-root> node .unity-websocket/uw go destroy <name>   # Destroy GameObject
cd <unity-project-root> node .unity-websocket/uw go set-active <name> <true|false>  # Set active state
cd <unity-project-root> node .unity-websocket/uw hierarchy          # View hierarchy tree
```

**📖 Full documentation with options**: [COMMANDS_GAMEOBJECT_HIERARCHY.md](./COMMANDS_GAMEOBJECT_HIERARCHY.md)

---

### 🔄 구현 예정

```bash
# GameObject 복제
cd <unity-project-root> node .unity-websocket/uw go duplicate <name> [--count <n>]

# GameObject 부모 변경
cd <unity-project-root> node .unity-websocket/uw go set-parent <child> <parent>

# GameObject 이름 변경
cd <unity-project-root> node .unity-websocket/uw go rename <old-name> <new-name>

# GameObject 태그 설정
cd <unity-project-root> node .unity-websocket/uw go set-tag <name> <tag>

# GameObject 레이어 설정
cd <unity-project-root> node .unity-websocket/uw go set-layer <name> <layer>

# GameObject 정적 플래그 설정
cd <unity-project-root> node .unity-websocket/uw go set-static <name> <flags>

# GameObject 검색 (정규식)
cd <unity-project-root> node .unity-websocket/uw go search <pattern> [--regex]

# GameObject 필터링 (태그, 레이어)
cd <unity-project-root> node .unity-websocket/uw go filter --tag <tag> --layer <layer>

# GameObject 일괄 조작
cd <unity-project-root> node .unity-websocket/uw go batch <command> <pattern>

# GameObject 정보 가져오기
cd <unity-project-root> node .unity-websocket/uw go info <name>

# GameObject 하이라이트
cd <unity-project-root> node .unity-websocket/uw go highlight <name>

# GameObject에 자식 나열
cd <unity-project-root> node .unity-websocket/uw go children <name> [--recursive]

# GameObject의 컴포넌트 목록
cd <unity-project-root> node .unity-websocket/uw go components <name>

# GameObject 활성화/비활성화 토글
cd <unity-project-root> node .unity-websocket/uw go toggle <name>
```

---

## 2. Transform

### ✅ Currently Implemented (4 commands)

```bash
cd <unity-project-root> node .unity-websocket/uw tf get <name>                    # Get Transform info
cd <unity-project-root> node .unity-websocket/uw tf set-position <name> <x,y,z>   # Set position
cd <unity-project-root> node .unity-websocket/uw tf set-rotation <name> <x,y,z>   # Set rotation (Euler angles)
cd <unity-project-root> node .unity-websocket/uw tf set-scale <name> <x,y,z>      # Set scale
```

**📖 Full documentation with options**: [COMMANDS_TRANSFORM.md](./COMMANDS_TRANSFORM.md)

---

### 🔄 구현 예정

```bash
# Local/World 위치
cd <unity-project-root> node .unity-websocket/uw tf get-local-position <name>
cd <unity-project-root> node .unity-websocket/uw tf get-world-position <name>
cd <unity-project-root> node .unity-websocket/uw tf set-local-position <name> <x,y,z>
cd <unity-project-root> node .unity-websocket/uw tf set-world-position <name> <x,y,z>

# Local/World 회전
cd <unity-project-root> node .unity-websocket/uw tf get-local-rotation <name>
cd <unity-project-root> node .unity-websocket/uw tf get-world-rotation <name>
cd <unity-project-root> node .unity-websocket/uw tf set-local-rotation <name> <x,y,z>
cd <unity-project-root> node .unity-websocket/uw tf set-world-rotation <name> <x,y,z>

# Quaternion 회전
cd <unity-project-root> node .unity-websocket/uw tf get-rotation-quat <name>
cd <unity-project-root> node .unity-websocket/uw tf set-rotation-quat <name> <x,y,z,w>

# Local Scale
cd <unity-project-root> node .unity-websocket/uw tf get-local-scale <name>
cd <unity-project-root> node .unity-websocket/uw tf set-local-scale <name> <x,y,z>

# Transform 이동
cd <unity-project-root> node .unity-websocket/uw tf translate <name> <x,y,z> [--space <world|local>]

# Transform 회전
cd <unity-project-root> node .unity-websocket/uw tf rotate <name> <x,y,z> [--space <world|local>]

# Transform을 다른 Transform 방향으로 향하게
cd <unity-project-root> node .unity-websocket/uw tf look-at <source> <target> [--up <x,y,z>]

# 부모의 중심에 정렬
cd <unity-project-root> node .unity-websocket/uw tf align-to-parent <name>

# 자식 Transform 초기화
cd <unity-project-root> node .unity-websocket/uw tf reset <name> [--position] [--rotation] [--scale]

# Forward/Right/Up 벡터 가져오기
cd <unity-project-root> node .unity-websocket/uw tf get-forward <name>
cd <unity-project-root> node .unity-websocket/uw tf get-right <name>
cd <unity-project-root> node .unity-websocket/uw tf get-up <name>

# Transform 복사/붙여넣기
cd <unity-project-root> node .unity-websocket/uw tf copy <source>
cd <unity-project-root> node .unity-websocket/uw tf paste <target>

# Transform 스냅 (그리드)
cd <unity-project-root> node .unity-websocket/uw tf snap <name> <grid-size>
```

---

## 3. Component

### 🔄 구현 예정

```bash
# Component 가져오기
cd <unity-project-root> node .unity-websocket/uw component get <gameobject> <component-type>

# Component 추가
cd <unity-project-root> node .unity-websocket/uw component add <gameobject> <component-type>

# Component 제거
cd <unity-project-root> node .unity-websocket/uw component remove <gameobject> <component-type>

# Component 활성화/비활성화
cd <unity-project-root> node .unity-websocket/uw component enable <gameobject> <component-type>
cd <unity-project-root> node .unity-websocket/uw component disable <gameobject> <component-type>

# Component 속성 가져오기
cd <unity-project-root> node .unity-websocket/uw component get-property <gameobject> <component> <property>

# Component 속성 설정
cd <unity-project-root> node .unity-websocket/uw component set-property <gameobject> <component> <property> <value>

# Component 복사
cd <unity-project-root> node .unity-websocket/uw component copy <source-go> <component-type>

# Component 붙여넣기
cd <unity-project-root> node .unity-websocket/uw component paste <target-go>

# Component 정보 나열
cd <unity-project-root> node .unity-websocket/uw component list <gameobject>

# Component 검색
cd <unity-project-root> node .unity-websocket/uw component find <component-type>

# Component 일괄 수정
cd <unity-project-root> node .unity-websocket/uw component batch-set <component-type> <property> <value>

# Component Reset
cd <unity-project-root> node .unity-websocket/uw component reset <gameobject> <component-type>
```

---

## 4. Material & Rendering

### 🔄 구현 예정

```bash
# Material 가져오기
cd <unity-project-root> node .unity-websocket/uw material get <renderer-name>

# Material 속성 가져오기
cd <unity-project-root> node .unity-websocket/uw material get-property <renderer> <property>

# Material 속성 설정
cd <unity-project-root> node .unity-websocket/uw material set-property <renderer> <property> <value>

# Material 색상 가져오기
cd <unity-project-root> node .unity-websocket/uw material get-color <renderer> <property>

# Material 색상 설정
cd <unity-project-root> node .unity-websocket/uw material set-color <renderer> <property> <r,g,b,a>

# Material 텍스처 설정
cd <unity-project-root> node .unity-websocket/uw material set-texture <renderer> <property> <path>

# Material 교체
cd <unity-project-root> node .unity-websocket/uw material replace <renderer> <material-path>

# Material Shader 변경
cd <unity-project-root> node .unity-websocket/uw material set-shader <renderer> <shader-name>

# Renderer 활성화/비활성화
cd <unity-project-root> node .unity-websocket/uw renderer enable <name>
cd <unity-project-root> node .unity-websocket/uw renderer disable <name>

# Renderer 그림자 설정
cd <unity-project-root> node .unity-websocket/uw renderer set-shadows <name> <on|off|two-sided>

# Renderer 레이어 설정
cd <unity-project-root> node .unity-websocket/uw renderer set-sorting-layer <name> <layer>
cd <unity-project-root> node .unity-websocket/uw renderer set-sorting-order <name> <order>

# Mesh 정보 가져오기
cd <unity-project-root> node .unity-websocket/uw mesh info <name>

# Mesh 교체
cd <unity-project-root> node .unity-websocket/uw mesh replace <name> <mesh-path>

# SpriteRenderer 스프라이트 변경
cd <unity-project-root> node .unity-websocket/uw sprite set <name> <sprite-path>

# SpriteRenderer Flip 설정
cd <unity-project-root> node .unity-websocket/uw sprite flip-x <name> <true|false>
cd <unity-project-root> node .unity-websocket/uw sprite flip-y <name> <true|false>
```

---

## 5. Scene Management

### ✅ Currently Implemented (3 commands)

```bash
cd <unity-project-root> node .unity-websocket/uw scene current     # Get current scene info
cd <unity-project-root> node .unity-websocket/uw scene list        # List all loaded scenes
cd <unity-project-root> node .unity-websocket/uw scene load <name> # Load scene
```

**📖 Full documentation with options**: [COMMANDS_SCENE.md](./COMMANDS_SCENE.md)

---

### 🔄 구현 예정

```bash
# 씬 언로드
cd <unity-project-root> node .unity-websocket/uw scene unload <name>

# 씬 저장
cd <unity-project-root> node .unity-websocket/uw scene save [<name>]

# 씬 새로 생성
cd <unity-project-root> node .unity-websocket/uw scene new <name>

# 씬 닫기
cd <unity-project-root> node .unity-websocket/uw scene close [<name>]

# Active 씬 설정
cd <unity-project-root> node .unity-websocket/uw scene set-active <name>

# 씬 더티 플래그
cd <unity-project-root> node .unity-websocket/uw scene is-dirty [<name>]

# 씬 경로 가져오기
cd <unity-project-root> node .unity-websocket/uw scene get-path <name>

# Build Settings의 씬 목록
cd <unity-project-root> node .unity-websocket/uw scene build-list

# Build Settings에 씬 추가
cd <unity-project-root> node .unity-websocket/uw scene add-to-build <path>

# Build Settings에서 씬 제거
cd <unity-project-root> node .unity-websocket/uw scene remove-from-build <path>

# 씬 병합
cd <unity-project-root> node .unity-websocket/uw scene merge <source> <target>

# 씬 GameObjects 카운트
cd <unity-project-root> node .unity-websocket/uw scene count-objects [<name>]
```

---

## 6. Prefab

### 🔄 구현 예정

```bash
# Prefab 인스턴스화
cd <unity-project-root> node .unity-websocket/uw prefab instantiate <path> [--position <x,y,z>] [--parent <name>]

# Prefab 생성
cd <unity-project-root> node .unity-websocket/uw prefab create <gameobject> <save-path>

# Prefab 언팩
cd <unity-project-root> node .unity-websocket/uw prefab unpack <instance-name> [--completely]

# Prefab Apply 변경사항
cd <unity-project-root> node .unity-websocket/uw prefab apply <instance-name>

# Prefab Revert 변경사항
cd <unity-project-root> node .unity-websocket/uw prefab revert <instance-name>

# Prefab 오버라이드 확인
cd <unity-project-root> node .unity-websocket/uw prefab has-overrides <instance-name>

# Prefab 오버라이드 목록
cd <unity-project-root> node .unity-websocket/uw prefab list-overrides <instance-name>

# Prefab 소스 경로
cd <unity-project-root> node .unity-websocket/uw prefab get-source <instance-name>

# Prefab Variant 생성
cd <unity-project-root> node .unity-websocket/uw prefab create-variant <source-path> <save-path>

# Prefab 중첩 정보
cd <unity-project-root> node .unity-websocket/uw prefab is-nested <instance-name>

# Prefab 인스턴스 교체
cd <unity-project-root> node .unity-websocket/uw prefab replace-instance <old-instance> <new-prefab-path>

# Prefab 모든 인스턴스 찾기
cd <unity-project-root> node .unity-websocket/uw prefab find-instances <prefab-path>
```

---

## 7. Asset Database & Editor Utilities

### ✅ Currently Implemented (3 commands)

```bash
cd <unity-project-root> node .unity-websocket/uw editor refresh        # Refresh AssetDatabase (generate meta files, trigger compilation)
cd <unity-project-root> node .unity-websocket/uw editor recompile      # Request script recompilation
cd <unity-project-root> node .unity-websocket/uw editor reimport <path> # Reimport specific asset (recompile Assembly)
```

**⚠️ Important**: After these commands, check Unity Editor for compilation status

**📖 Full documentation with options**: [COMMANDS_EDITOR.md](./COMMANDS_EDITOR.md)

---

### 🔄 구현 예정

```bash
# Asset 검색
cd <unity-project-root> node .unity-websocket/uw asset find <name> [--type <type>]

# Asset 경로 가져오기
cd <unity-project-root> node .unity-websocket/uw asset get-path <guid>

# Asset GUID 가져오기
cd <unity-project-root> node .unity-websocket/uw asset get-guid <path>

# Asset 정보
cd <unity-project-root> node .unity-websocket/uw asset info <path>

# Asset 가져오기 (Import)
cd <unity-project-root> node .unity-websocket/uw asset import <path> [--force]

# Asset 삭제
cd <unity-project-root> node .unity-websocket/uw asset delete <path>

# Asset 이동
cd <unity-project-root> node .unity-websocket/uw asset move <source> <destination>

# Asset 복사
cd <unity-project-root> node .unity-websocket/uw asset copy <source> <destination>

# Asset 이름 변경
cd <unity-project-root> node .unity-websocket/uw asset rename <path> <new-name>

# Asset 레이블 설정
cd <unity-project-root> node .unity-websocket/uw asset set-labels <path> <label1,label2,...>

# Asset 레이블 가져오기
cd <unity-project-root> node .unity-websocket/uw asset get-labels <path>

# Asset 종속성 가져오기
cd <unity-project-root> node .unity-websocket/uw asset get-dependencies <path>

# Asset을 참조하는 것 찾기
cd <unity-project-root> node .unity-websocket/uw asset find-references <path>

# Asset 번들 할당
cd <unity-project-root> node .unity-websocket/uw asset set-bundle <path> <bundle-name>

# Meta 파일 재생성
cd <unity-project-root> node .unity-websocket/uw asset regenerate-meta <path>

# 누락된 Asset 찾기
cd <unity-project-root> node .unity-websocket/uw asset find-missing

# 사용되지 않는 Asset 찾기
cd <unity-project-root> node .unity-websocket/uw asset find-unused
```

---

## 8. Console & Logging

### ✅ Currently Implemented (2 commands)

```bash
cd <unity-project-root> node .unity-websocket/uw console logs   # Get console logs
cd <unity-project-root> node .unity-websocket/uw console clear  # Clear console
```

**📖 Full documentation with options**: [COMMANDS_CONSOLE.md](./COMMANDS_CONSOLE.md)

---

### 🔄 구현 예정

```bash
# 콘솔 로그 실시간 스트리밍
cd <unity-project-root> node .unity-websocket/uw console stream [--filter <error|warning|log>]

# 특정 로그 필터링
cd <unity-project-root> node .unity-websocket/uw console filter <keyword>

# 콘솔 로그 파일로 저장
cd <unity-project-root> node .unity-websocket/uw console export <filepath>

# 콘솔 로그 통계
cd <unity-project-root> node .unity-websocket/uw console stats

# Unity Editor에서 로그 출력
cd <unity-project-root> node .unity-websocket/uw console log <message>
cd <unity-project-root> node .unity-websocket/uw console warning <message>
cd <unity-project-root> node .unity-websocket/uw console error <message>

# 콘솔 설정
cd <unity-project-root> node .unity-websocket/uw console set-collapse <true|false>
cd <unity-project-root> node .unity-websocket/uw console set-clear-on-play <true|false>
cd <unity-project-root> node .unity-websocket/uw console set-error-pause <true|false>
```

---

## 9. Editor Window & UI

### 🔄 구현 예정

```bash
# Inspector 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-inspector

# Scene View 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-scene

# Game View 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-game

# Project 창 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-project

# Hierarchy 창 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-hierarchy

# Console 창 포커스
cd <unity-project-root> node .unity-websocket/uw window focus-console

# 창 열기
cd <unity-project-root> node .unity-websocket/uw window open <window-type>

# 창 닫기
cd <unity-project-root> node .unity-websocket/uw window close <window-type>

# Editor Selection 가져오기
cd <unity-project-root> node .unity-websocket/uw editor get-selection

# Editor Selection 설정
cd <unity-project-root> node .unity-websocket/uw editor set-selection <gameobject>

# Editor Selection 여러개 설정
cd <unity-project-root> node .unity-websocket/uw editor set-selection-multi <go1,go2,...>

# Scene View 카메라 위치
cd <unity-project-root> node .unity-websocket/uw scene-view get-camera
cd <unity-project-root> node .unity-websocket/uw scene-view set-camera <x,y,z> <rx,ry,rz>

# Scene View GameObject에 포커스
cd <unity-project-root> node .unity-websocket/uw scene-view frame <gameobject>

# Scene View Gizmo 설정
cd <unity-project-root> node .unity-websocket/uw scene-view set-gizmos <true|false>

# Scene View 2D/3D 모드
cd <unity-project-root> node .unity-websocket/uw scene-view set-2d <true|false>

# Game View 해상도 설정
cd <unity-project-root> node .unity-websocket/uw game-view set-resolution <width>x<height>

# Game View 최대화
cd <unity-project-root> node .unity-websocket/uw game-view maximize <true|false>

# Play Mode 진입/종료
cd <unity-project-root> node .unity-websocket/uw editor play
cd <unity-project-root> node .unity-websocket/uw editor pause
cd <unity-project-root> node .unity-websocket/uw editor stop
cd <unity-project-root> node .unity-websocket/uw editor step

# Play Mode 상태
cd <unity-project-root> node .unity-websocket/uw editor is-playing
cd <unity-project-root> node .unity-websocket/uw editor is-paused
```

---

## 10. Animation

### 🔄 구현 예정

```bash
# Animation 재생
cd <unity-project-root> node .unity-websocket/uw anim play <gameobject> [<clip-name>]

# Animation 정지
cd <unity-project-root> node .unity-websocket/uw anim stop <gameobject>

# Animation 일시정지
cd <unity-project-root> node .unity-websocket/uw anim pause <gameobject>

# Animation 상태 가져오기
cd <unity-project-root> node .unity-websocket/uw anim get-state <gameobject>

# Animation Clip 목록
cd <unity-project-root> node .unity-websocket/uw anim list-clips <gameobject>

# Animation 현재 시간 설정
cd <unity-project-root> node .unity-websocket/uw anim set-time <gameobject> <time>

# Animation 속도 설정
cd <unity-project-root> node .unity-websocket/uw anim set-speed <gameobject> <speed>

# Animator Parameter 설정
cd <unity-project-root> node .unity-websocket/uw animator set-bool <gameobject> <param> <value>
cd <unity-project-root> node .unity-websocket/uw animator set-int <gameobject> <param> <value>
cd <unity-project-root> node .unity-websocket/uw animator set-float <gameobject> <param> <value>
cd <unity-project-root> node .unity-websocket/uw animator set-trigger <gameobject> <param>

# Animator Parameter 가져오기
cd <unity-project-root> node .unity-websocket/uw animator get-parameter <gameobject> <param>

# Animator 현재 State
cd <unity-project-root> node .unity-websocket/uw animator get-state <gameobject> [<layer>]

# Animator Transition
cd <unity-project-root> node .unity-websocket/uw animator crossfade <gameobject> <state> <duration>

# Animator Controller 교체
cd <unity-project-root> node .unity-websocket/uw animator set-controller <gameobject> <controller-path>

# Animation Event 추가
cd <unity-project-root> node .unity-websocket/uw anim add-event <clip-path> <time> <function-name>

# Animation Curve 수정
cd <unity-project-root> node .unity-websocket/uw anim set-curve <clip-path> <property> <keyframes>
```

---

## 11. Physics

### 🔄 구현 예정

```bash
# Rigidbody 속도 설정
cd <unity-project-root> node .unity-websocket/uw physics set-velocity <gameobject> <x,y,z>

# Rigidbody 각속도 설정
cd <unity-project-root> node .unity-websocket/uw physics set-angular-velocity <gameobject> <x,y,z>

# Rigidbody에 힘 추가
cd <unity-project-root> node .unity-websocket/uw physics add-force <gameobject> <x,y,z> [--mode <force|impulse|...>]

# Rigidbody Sleep/Wake
cd <unity-project-root> node .unity-websocket/uw physics sleep <gameobject>
cd <unity-project-root> node .unity-websocket/uw physics wake <gameobject>

# Rigidbody 중력 설정
cd <unity-project-root> node .unity-websocket/uw physics set-gravity <gameobject> <true|false>

# Rigidbody Kinematic 설정
cd <unity-project-root> node .unity-websocket/uw physics set-kinematic <gameobject> <true|false>

# Collider 활성화/비활성화
cd <unity-project-root> node .unity-websocket/uw collider enable <gameobject>
cd <unity-project-root> node .unity-websocket/uw collider disable <gameobject>

# Collider 크기 설정 (Box)
cd <unity-project-root> node .unity-websocket/uw collider set-size <gameobject> <x,y,z>

# Collider 반지름 설정 (Sphere)
cd <unity-project-root> node .unity-websocket/uw collider set-radius <gameobject> <radius>

# Raycast
cd <unity-project-root> node .unity-websocket/uw physics raycast <origin-x,y,z> <direction-x,y,z> <distance>

# OverlapSphere
cd <unity-project-root> node .unity-websocket/uw physics overlap-sphere <center-x,y,z> <radius>

# Physics Simulation Step
cd <unity-project-root> node .unity-websocket/uw physics simulate <time>

# Physics 설정
cd <unity-project-root> node .unity-websocket/uw physics get-gravity
cd <unity-project-root> node .unity-websocket/uw physics set-gravity <x,y,z>

# Layer Collision Matrix
cd <unity-project-root> node .unity-websocket/uw physics get-layer-collision <layer1> <layer2>
cd <unity-project-root> node .unity-websocket/uw physics set-layer-collision <layer1> <layer2> <true|false>
```

---

## 12. Lighting

### 🔄 구현 예정

```bash
# Light 색상 설정
cd <unity-project-root> node .unity-websocket/uw light set-color <name> <r,g,b>

# Light 강도 설정
cd <unity-project-root> node .unity-websocket/uw light set-intensity <name> <value>

# Light 범위 설정
cd <unity-project-root> node .unity-websocket/uw light set-range <name> <value>

# Light 타입 설정
cd <unity-project-root> node .unity-websocket/uw light set-type <name> <directional|point|spot|area>

# Light Shadow 설정
cd <unity-project-root> node .unity-websocket/uw light set-shadows <name> <none|hard|soft>

# Bake Lightmaps
cd <unity-project-root> node .unity-websocket/uw lighting bake [--clear]

# Lightmap 상태
cd <unity-project-root> node .unity-websocket/uw lighting is-baking

# Lightmap 취소
cd <unity-project-root> node .unity-websocket/uw lighting cancel-bake

# Lightmap 설정
cd <unity-project-root> node .unity-websocket/uw lighting set-mode <realtime|baked|mixed>

# Light Probe 그룹 설정
cd <unity-project-root> node .unity-websocket/uw lightprobe add <gameobject> <positions>

# Reflection Probe Bake
cd <unity-project-root> node .unity-websocket/uw reflection-probe bake <name>

# Ambient Light 설정
cd <unity-project-root> node .unity-websocket/uw ambient set-color <r,g,b>
cd <unity-project-root> node .unity-websocket/uw ambient set-intensity <value>

# Skybox 설정
cd <unity-project-root> node .unity-websocket/uw skybox set-material <material-path>

# Fog 설정
cd <unity-project-root> node .unity-websocket/uw fog enable
cd <unity-project-root> node .unity-websocket/uw fog disable
cd <unity-project-root> node .unity-websocket/uw fog set-color <r,g,b>
cd <unity-project-root> node .unity-websocket/uw fog set-density <value>
```

---

## 13. Camera

### 🔄 구현 예정

```bash
# Camera 위치/회전 설정
cd <unity-project-root> node .unity-websocket/uw camera set-position <name> <x,y,z>
cd <unity-project-root> node .unity-websocket/uw camera set-rotation <name> <x,y,z>

# Camera LookAt
cd <unity-project-root> node .unity-websocket/uw camera look-at <name> <target-x,y,z>

# Camera FOV 설정
cd <unity-project-root> node .unity-websocket/uw camera set-fov <name> <value>

# Camera Near/Far Plane
cd <unity-project-root> node .unity-websocket/uw camera set-near-plane <name> <value>
cd <unity-project-root> node .unity-websocket/uw camera set-far-plane <name> <value>

# Camera Clear Flags
cd <unity-project-root> node .unity-websocket/uw camera set-clear-flags <name> <skybox|solid-color|...>

# Camera Background Color
cd <unity-project-root> node .unity-websocket/uw camera set-bg-color <name> <r,g,b,a>

# Camera Depth
cd <unity-project-root> node .unity-websocket/uw camera set-depth <name> <value>

# Camera Culling Mask
cd <unity-project-root> node .unity-websocket/uw camera set-culling-mask <name> <layers>

# Camera Orthographic/Perspective
cd <unity-project-root> node .unity-websocket/uw camera set-orthographic <name> <true|false>
cd <unity-project-root> node .unity-websocket/uw camera set-orthographic-size <name> <value>

# Camera Viewport Rect
cd <unity-project-root> node .unity-websocket/uw camera set-viewport <name> <x,y,w,h>

# Camera Screenshot
cd <unity-project-root> node .unity-websocket/uw camera screenshot <name> <output-path> [--width <w>] [--height <h>]

# Main Camera 설정
cd <unity-project-root> node .unity-websocket/uw camera set-main <name>

# Camera Stack (URP)
cd <unity-project-root> node .unity-websocket/uw camera add-overlay <base> <overlay>
cd <unity-project-root> node .unity-websocket/uw camera remove-overlay <base> <overlay>
```

---

## 14. Audio

### 🔄 구현 예정

```bash
# AudioSource 재생
cd <unity-project-root> node .unity-websocket/uw audio play <name> [<clip-path>]

# AudioSource 정지
cd <unity-project-root> node .unity-websocket/uw audio stop <name>

# AudioSource 일시정지
cd <unity-project-root> node .unity-websocket/uw audio pause <name>

# AudioSource 볼륨 설정
cd <unity-project-root> node .unity-websocket/uw audio set-volume <name> <value>

# AudioSource 피치 설정
cd <unity-project-root> node .unity-websocket/uw audio set-pitch <name> <value>

# AudioSource 반복 설정
cd <unity-project-root> node .unity-websocket/uw audio set-loop <name> <true|false>

# AudioSource 공간 음향 설정
cd <unity-project-root> node .unity-websocket/uw audio set-spatial-blend <name> <value>

# AudioSource Min/Max Distance
cd <unity-project-root> node .unity-websocket/uw audio set-min-distance <name> <value>
cd <unity-project-root> node .unity-websocket/uw audio set-max-distance <name> <value>

# Audio Clip 교체
cd <unity-project-root> node .unity-websocket/uw audio set-clip <name> <clip-path>

# Audio Mixer 그룹 볼륨
cd <unity-project-root> node .unity-websocket/uw mixer set-volume <mixer> <group> <value>

# Audio Mixer 파라미터
cd <unity-project-root> node .unity-websocket/uw mixer set-parameter <mixer> <param> <value>
cd <unity-project-root> node .unity-websocket/uw mixer get-parameter <mixer> <param>

# Audio Listener 위치
cd <unity-project-root> node .unity-websocket/uw audio-listener get-position
cd <unity-project-root> node .unity-websocket/uw audio-listener set-position <x,y,z>
```

---

## 15. Navigation & AI

### 🔄 구현 예정

```bash
# NavMesh Bake
cd <unity-project-root> node .unity-websocket/uw navmesh bake [--async]

# NavMesh 상태
cd <unity-project-root> node .unity-websocket/uw navmesh is-baking

# NavMesh Clear
cd <unity-project-root> node .unity-websocket/uw navmesh clear

# NavMeshAgent 목적지 설정
cd <unity-project-root> node .unity-websocket/uw navagent set-destination <name> <x,y,z>

# NavMeshAgent 정지
cd <unity-project-root> node .unity-websocket/uw navagent stop <name>

# NavMeshAgent 재개
cd <unity-project-root> node .unity-websocket/uw navagent resume <name>

# NavMeshAgent 속도 설정
cd <unity-project-root> node .unity-websocket/uw navagent set-speed <name> <value>

# NavMeshAgent 회전 속도
cd <unity-project-root> node .unity-websocket/uw navagent set-angular-speed <name> <value>

# NavMeshAgent 경로 확인
cd <unity-project-root> node .unity-websocket/uw navagent has-path <name>

# NavMeshAgent 경로 남은 거리
cd <unity-project-root> node .unity-websocket/uw navagent get-remaining-distance <name>

# NavMesh Obstacle 설정
cd <unity-project-root> node .unity-websocket/uw navobstacle enable <name>
cd <unity-project-root> node .unity-websocket/uw navobstacle disable <name>
cd <unity-project-root> node .unity-websocket/uw navobstacle set-carve <name> <true|false>

# NavMesh 경로 계산
cd <unity-project-root> node .unity-websocket/uw navmesh calculate-path <start-x,y,z> <end-x,y,z>

# NavMesh Agent Area Mask
cd <unity-project-root> node .unity-websocket/uw navagent set-area-mask <name> <mask>
```

---

## 16. Particle System

### 🔄 구현 예정

```bash
# Particle System 재생
cd <unity-project-root> node .unity-websocket/uw particles play <name>

# Particle System 정지
cd <unity-project-root> node .unity-websocket/uw particles stop <name> [--clear]

# Particle System 일시정지
cd <unity-project-root> node .unity-websocket/uw particles pause <name>

# Particle System 시뮬레이션
cd <unity-project-root> node .unity-websocket/uw particles simulate <name> <time>

# Particle System 방출 속도
cd <unity-project-root> node .unity-websocket/uw particles set-emission-rate <name> <value>

# Particle System 시작 색상
cd <unity-project-root> node .unity-websocket/uw particles set-start-color <name> <r,g,b,a>

# Particle System 시작 크기
cd <unity-project-root> node .unity-websocket/uw particles set-start-size <name> <value>

# Particle System 시작 속도
cd <unity-project-root> node .unity-websocket/uw particles set-start-speed <name> <value>

# Particle System 수명
cd <unity-project-root> node .unity-websocket/uw particles set-start-lifetime <name> <value>

# Particle System 중력
cd <unity-project-root> node .unity-websocket/uw particles set-gravity <name> <value>

# Particle System 반복
cd <unity-project-root> node .unity-websocket/uw particles set-loop <name> <true|false>

# Particle System 파티클 개수
cd <unity-project-root> node .unity-websocket/uw particles get-count <name>

# Particle System 클리어
cd <unity-project-root> node .unity-websocket/uw particles clear <name>

# Particle System 모듈 활성화
cd <unity-project-root> node .unity-websocket/uw particles enable-module <name> <module>
cd <unity-project-root> node .unity-websocket/uw particles disable-module <name> <module>
```

---

## 17. Timeline

### 🔄 구현 예정

```bash
# Timeline 재생
cd <unity-project-root> node .unity-websocket/uw timeline play <name>

# Timeline 정지
cd <unity-project-root> node .unity-websocket/uw timeline stop <name>

# Timeline 일시정지
cd <unity-project-root> node .unity-websocket/uw timeline pause <name>

# Timeline 시간 설정
cd <unity-project-root> node .unity-websocket/uw timeline set-time <name> <time>

# Timeline 속도 설정
cd <unity-project-root> node .unity-websocket/uw timeline set-speed <name> <speed>

# Timeline 현재 시간
cd <unity-project-root> node .unity-websocket/uw timeline get-time <name>

# Timeline 지속 시간
cd <unity-project-root> node .unity-websocket/uw timeline get-duration <name>

# Timeline Playable Director 상태
cd <unity-project-root> node .unity-websocket/uw timeline get-state <name>

# Timeline Track 추가
cd <unity-project-root> node .unity-websocket/uw timeline add-track <name> <track-type>

# Timeline Track 제거
cd <unity-project-root> node .unity-websocket/uw timeline remove-track <name> <track-index>

# Timeline Clip 추가
cd <unity-project-root> node .unity-websocket/uw timeline add-clip <name> <track> <start> <duration>
```

---

## 18. Build & Player

### 🔄 구현 예정

```bash
# 빌드 실행
cd <unity-project-root> node .unity-websocket/uw build start [--target <platform>] [--output <path>]

# 빌드 상태
cd <unity-project-root> node .unity-websocket/uw build status

# 빌드 취소
cd <unity-project-root> node .unity-websocket/uw build cancel

# 빌드 타겟 설정
cd <unity-project-root> node .unity-websocket/uw build set-target <platform>

# 빌드 타겟 가져오기
cd <unity-project-root> node .unity-websocket/uw build get-target

# 빌드 씬 목록
cd <unity-project-root> node .unity-websocket/uw build list-scenes

# 빌드 옵션 설정
cd <unity-project-root> node .unity-websocket/uw build set-option <option> <value>

# Development Build 설정
cd <unity-project-root> node .unity-websocket/uw build set-development <true|false>

# Build & Run
cd <unity-project-root> node .unity-websocket/uw build run [--target <platform>]

# Player 로그
cd <unity-project-root> node .unity-websocket/uw player get-log

# Player 설정
cd <unity-project-root> node .unity-websocket/uw player set-company <name>
cd <unity-project-root> node .unity-websocket/uw player set-product <name>
cd <unity-project-root> node .unity-websocket/uw player set-version <version>
cd <unity-project-root> node .unity-websocket/uw player set-bundle-version <version>
```

---

## 19. Project Settings

### 🔄 구현 예정

```bash
# 프로젝트 설정 가져오기
cd <unity-project-root> node .unity-websocket/uw settings get <category> <property>

# 프로젝트 설정 변경
cd <unity-project-root> node .unity-websocket/uw settings set <category> <property> <value>

# Quality 설정
cd <unity-project-root> node .unity-websocket/uw quality set-level <level>
cd <unity-project-root> node .unity-websocket/uw quality get-level

# Graphics 설정
cd <unity-project-root> node .unity-websocket/uw graphics set-tier <tier>
cd <unity-project-root> node .unity-websocket/uw graphics get-render-pipeline

# Physics 설정
cd <unity-project-root> node .unity-websocket/uw settings physics get-gravity
cd <unity-project-root> node .unity-websocket/uw settings physics set-gravity <x,y,z>

# Time 설정
cd <unity-project-root> node .unity-websocket/uw settings time set-fixed-timestep <value>
cd <unity-project-root> node .unity-websocket/uw settings time set-maximum-timestep <value>

# Audio 설정
cd <unity-project-root> node .unity-websocket/uw settings audio set-volume <value>

# Input 설정
cd <unity-project-root> node .unity-websocket/uw settings input list-axes
cd <unity-project-root> node .unity-websocket/uw settings input add-axis <name>

# Tags & Layers
cd <unity-project-root> node .unity-websocket/uw settings add-tag <name>
cd <unity-project-root> node .unity-websocket/uw settings remove-tag <name>
cd <unity-project-root> node .unity-websocket/uw settings list-tags
cd <unity-project-root> node .unity-websocket/uw settings add-layer <name> <index>
cd <unity-project-root> node .unity-websocket/uw settings list-layers
```

---

## 20. Package Manager

### 🔄 구현 예정

```bash
# 패키지 목록
cd <unity-project-root> node .unity-websocket/uw package list [--all]

# 패키지 검색
cd <unity-project-root> node .unity-websocket/uw package search <keyword>

# 패키지 설치
cd <unity-project-root> node .unity-websocket/uw package install <package-name>[@version]

# 패키지 제거
cd <unity-project-root> node .unity-websocket/uw package remove <package-name>

# 패키지 업데이트
cd <unity-project-root> node .unity-websocket/uw package update <package-name>

# 패키지 정보
cd <unity-project-root> node .unity-websocket/uw package info <package-name>

# 패키지 임베드
cd <unity-project-root> node .unity-websocket/uw package embed <package-name>

# Git URL에서 패키지 추가
cd <unity-project-root> node .unity-websocket/uw package add-git <url>

# Local 패키지 추가
cd <unity-project-root> node .unity-websocket/uw package add-local <path>

# 패키지 종속성
cd <unity-project-root> node .unity-websocket/uw package dependencies <package-name>
```

---

## 21. Version Control

### 🔄 구현 예정

```bash
# VCS 상태
cd <unity-project-root> node .unity-websocket/uw vcs status [<path>]

# VCS Checkout
cd <unity-project-root> node .unity-websocket/uw vcs checkout <path>

# VCS Add
cd <unity-project-root> node .unity-websocket/uw vcs add <path>

# VCS Revert
cd <unity-project-root> node .unity-websocket/uw vcs revert <path>

# VCS Submit/Commit
cd <unity-project-root> node .unity-websocket/uw vcs submit <message>

# VCS Update
cd <unity-project-root> node .unity-websocket/uw vcs update

# VCS 충돌 확인
cd <unity-project-root> node .unity-websocket/uw vcs has-conflicts

# VCS 로그
cd <unity-project-root> node .unity-websocket/uw vcs log <path>

# VCS Diff
cd <unity-project-root> node .unity-websocket/uw vcs diff <path>
```

---

## 22. Profiler & Performance

### 🔄 구현 예정

```bash
# Profiler 시작
cd <unity-project-root> node .unity-websocket/uw profiler start

# Profiler 정지
cd <unity-project-root> node .unity-websocket/uw profiler stop

# Profiler 데이터 가져오기
cd <unity-project-root> node .unity-websocket/uw profiler get-data [--category <cpu|gpu|memory|...>]

# Frame Debugger 활성화
cd <unity-project-root> node .unity-websocket/uw frame-debugger enable

# Frame Debugger 비활성화
cd <unity-project-root> node .unity-websocket/uw frame-debugger disable

# Memory Profiler 스냅샷
cd <unity-project-root> node .unity-websocket/uw memory snapshot <output-path>

# GC 수집
cd <unity-project-root> node .unity-websocket/uw memory collect-garbage

# 메모리 사용량
cd <unity-project-root> node .unity-websocket/uw memory usage

# FPS 가져오기
cd <unity-project-root> node .unity-websocket/uw profiler get-fps

# Draw Call 수
cd <unity-project-root> node .unity-websocket/uw profiler get-draw-calls

# Batching 통계
cd <unity-project-root> node .unity-websocket/uw profiler get-batches
```

---

## 23. Test Runner

### 🔄 구현 예정

```bash
# 테스트 실행
cd <unity-project-root> node .unity-websocket/uw test run [--filter <pattern>] [--mode <editmode|playmode>]

# 테스트 목록
cd <unity-project-root> node .unity-websocket/uw test list

# 테스트 결과
cd <unity-project-root> node .unity-websocket/uw test results

# 특정 테스트 실행
cd <unity-project-root> node .unity-websocket/uw test run-single <test-name>

# 테스트 재실행
cd <unity-project-root> node .unity-websocket/uw test rerun-failed

# Code Coverage 활성화
cd <unity-project-root> node .unity-websocket/uw coverage enable

# Code Coverage 보고서
cd <unity-project-root> node .unity-websocket/uw coverage report <output-path>
```

---

## 24. Input System

### 🔄 구현 예정

```bash
# Input Action 트리거
cd <unity-project-root> node .unity-websocket/uw input trigger <action-name>

# Input Action 상태
cd <unity-project-root> node .unity-websocket/uw input get-value <action-name>

# Input Device 목록
cd <unity-project-root> node .unity-websocket/uw input list-devices

# Input Device 추가 (시뮬레이션)
cd <unity-project-root> node .unity-websocket/uw input add-device <device-type>

# Input Device 제거
cd <unity-project-root> node .unity-websocket/uw input remove-device <device-id>

# Input Binding 재정의
cd <unity-project-root> node .unity-websocket/uw input rebind <action> <binding-path>

# Input Map 활성화
cd <unity-project-root> node .unity-websocket/uw input enable-map <map-name>

# Input Map 비활성화
cd <unity-project-root> node .unity-websocket/uw input disable-map <map-name>
```

---

## 25. UI Toolkit

### 🔄 구현 예정

```bash
# UI Document 로드
cd <unity-project-root> node .unity-websocket/uw ui load-document <path>

# UI Element 찾기
cd <unity-project-root> node .unity-websocket/uw ui find-element <name>

# UI Element 속성 설정
cd <unity-project-root> node .unity-websocket/uw ui set-property <element> <property> <value>

# UI Element 텍스트 설정
cd <unity-project-root> node .unity-websocket/uw ui set-text <element> <text>

# UI Element 표시/숨김
cd <unity-project-root> node .unity-websocket/uw ui show <element>
cd <unity-project-root> node .unity-websocket/uw ui hide <element>

# UI Element 클래스 추가/제거
cd <unity-project-root> node .unity-websocket/uw ui add-class <element> <class>
cd <unity-project-root> node .unity-websocket/uw ui remove-class <element> <class>

# UI Style 변경
cd <unity-project-root> node .unity-websocket/uw ui set-style <element> <property> <value>

# UI Event 트리거
cd <unity-project-root> node .unity-websocket/uw ui trigger-event <element> <event-type>
```

---

## 추가 유틸리티 명령어

### 🔄 구현 예정

```bash
# Editor 환경 정보
cd <unity-project-root> node .unity-websocket/uw info version
cd <unity-project-root> node .unity-websocket/uw info platform
cd <unity-project-root> node .unity-websocket/uw info graphics-device
cd <unity-project-root> node .unity-websocket/uw info project-path

# Editor 재시작
cd <unity-project-root> node .unity-websocket/uw restart

# Editor 종료
cd <unity-project-root> node .unity-websocket/uw quit [--force]

# Editor Preferences
cd <unity-project-root> node .unity-websocket/uw prefs get <key>
cd <unity-project-root> node .unity-websocket/uw prefs set <key> <value>

# Script 컴파일
cd <unity-project-root> node .unity-websocket/uw compile [--force]

# Script 컴파일 상태
cd <unity-project-root> node .unity-websocket/uw is-compiling

# EditorApplication Callbacks
cd <unity-project-root> node .unity-websocket/uw callback on-play <script>
cd <unity-project-root> node .unity-websocket/uw callback on-stop <script>

# Utility
cd <unity-project-root> node .unity-websocket/uw screenshot <output-path>
cd <unity-project-root> node .unity-websocket/uw open-project <path>
cd <unity-project-root> node .unity-websocket/uw create-project <path>

# Debug
cd <unity-project-root> node .unity-websocket/uw debug break
cd <unity-project-root> node .unity-websocket/uw debug log-callstack
cd <unity-project-root> node .unity-websocket/uw debug draw-line <start> <end> <color> <duration>
cd <unity-project-root> node .unity-websocket/uw debug draw-ray <start> <direction> <color> <duration>
```

---

## 명령어 조합 예제

```bash
# GameObject 생성 및 위치 설정
cd <unity-project-root> node .unity-websocket/uw go create "MyObject" && cd <unity-project-root> node .unity-websocket/uw tf set-position "MyObject" "0,5,0"

# Prefab 인스턴스화 및 Material 변경
cd <unity-project-root> node .unity-websocket/uw prefab instantiate "Prefabs/Enemy" --position "10,0,5" && \
cd <unity-project-root> node .unity-websocket/uw material set-color "Enemy" "_Color" "1,0,0,1"

# 씬 로드 및 특정 GameObject 활성화
cd <unity-project-root> node .unity-websocket/uw scene load "Level1" && cd <unity-project-root> node .unity-websocket/uw go set-active "Boss" true

# 모든 Light의 강도를 2배로
cd <unity-project-root> node .unity-websocket/uw component find "Light" | xargs -I {} cd <unity-project-root> node .unity-websocket/uw light set-intensity {} 2.0

# 콘솔 에러 실시간 모니터링
cd <unity-project-root> node .unity-websocket/uw console stream --filter error

# GameObject 배치 일괄 처리
for i in {1..10}; do
  cd <unity-project-root> node .unity-websocket/uw go create "Cube_$i" && \
  cd <unity-project-root> node .unity-websocket/uw tf set-position "Cube_$i" "$i,0,0"
done
```

---

## 총 명령어 개수 요약

- **✅ 현재 구현**: 15개 명령어 (5개 카테고리)
- **🔄 구현 예정**: 500+ 명령어 (25개 카테고리)

Unity Editor의 거의 모든 기능을 CLI로 제어할 수 있도록 설계되었습니다.
