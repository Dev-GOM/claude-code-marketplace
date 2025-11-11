# Unity Editor Toolkit - Complete Command Reference

Unity Editor를 제어할 수 있는 모든 명령어 목록입니다. ✅는 현재 구현됨, 🔄는 구현 예정을 의미합니다.

## 목차

1. [GameObject & Hierarchy](#1-gameobject--hierarchy)
2. [Transform](#2-transform)
3. [Component](#3-component)
4. [Material & Rendering](#4-material--rendering)
5. [Scene Management](#5-scene-management)
6. [Prefab](#6-prefab)
7. [Asset Database](#7-asset-database)
8. [Console & Logging](#8-console--logging)
9. [Editor Window & UI](#9-editor-window--ui)
10. [Animation](#10-animation)
11. [Physics](#11-physics)
12. [Lighting](#12-lighting)
13. [Camera](#13-camera)
14. [Audio](#14-audio)
15. [Navigation & AI](#15-navigation--ai)
16. [Particle System](#16-particle-system)
17. [Timeline](#17-timeline)
18. [Build & Player](#18-build--player)
19. [Project Settings](#19-project-settings)
20. [Package Manager](#20-package-manager)
21. [Version Control](#21-version-control)
22. [Profiler & Performance](#22-profiler--performance)
23. [Test Runner](#23-test-runner)
24. [Input System](#24-input-system)
25. [UI Toolkit](#25-ui-toolkit)

---

## 1. GameObject & Hierarchy

### ✅ 현재 구현됨

```bash
# GameObject 찾기
unity-editor go find <name>

# GameObject 생성
unity-editor go create <name> [--parent <parent>]

# GameObject 삭제
unity-editor go destroy <name>

# 활성 상태 설정
unity-editor go set-active <name> <true|false>

# 계층 구조 조회
unity-editor hierarchy [--root-only] [--include-inactive]
```

### 🔄 구현 예정

```bash
# GameObject 복제
unity-editor go duplicate <name> [--count <n>]

# GameObject 부모 변경
unity-editor go set-parent <child> <parent>

# GameObject 이름 변경
unity-editor go rename <old-name> <new-name>

# GameObject 태그 설정
unity-editor go set-tag <name> <tag>

# GameObject 레이어 설정
unity-editor go set-layer <name> <layer>

# GameObject 정적 플래그 설정
unity-editor go set-static <name> <flags>

# GameObject 검색 (정규식)
unity-editor go search <pattern> [--regex]

# GameObject 필터링 (태그, 레이어)
unity-editor go filter --tag <tag> --layer <layer>

# GameObject 일괄 조작
unity-editor go batch <command> <pattern>

# GameObject 정보 가져오기
unity-editor go info <name>

# GameObject 하이라이트
unity-editor go highlight <name>

# GameObject에 자식 나열
unity-editor go children <name> [--recursive]

# GameObject의 컴포넌트 목록
unity-editor go components <name>

# GameObject 활성화/비활성화 토글
unity-editor go toggle <name>
```

---

## 2. Transform

### ✅ 현재 구현됨

```bash
# Transform 정보 가져오기
unity-editor tf get <name>

# Position 설정
unity-editor tf set-position <name> <x,y,z>

# Rotation 설정 (Euler)
unity-editor tf set-rotation <name> <x,y,z>

# Scale 설정
unity-editor tf set-scale <name> <x,y,z>
```

### 🔄 구현 예정

```bash
# Local/World 위치
unity-editor tf get-local-position <name>
unity-editor tf get-world-position <name>
unity-editor tf set-local-position <name> <x,y,z>
unity-editor tf set-world-position <name> <x,y,z>

# Local/World 회전
unity-editor tf get-local-rotation <name>
unity-editor tf get-world-rotation <name>
unity-editor tf set-local-rotation <name> <x,y,z>
unity-editor tf set-world-rotation <name> <x,y,z>

# Quaternion 회전
unity-editor tf get-rotation-quat <name>
unity-editor tf set-rotation-quat <name> <x,y,z,w>

# Local Scale
unity-editor tf get-local-scale <name>
unity-editor tf set-local-scale <name> <x,y,z>

# Transform 이동
unity-editor tf translate <name> <x,y,z> [--space <world|local>]

# Transform 회전
unity-editor tf rotate <name> <x,y,z> [--space <world|local>]

# Transform을 다른 Transform 방향으로 향하게
unity-editor tf look-at <source> <target> [--up <x,y,z>]

# 부모의 중심에 정렬
unity-editor tf align-to-parent <name>

# 자식 Transform 초기화
unity-editor tf reset <name> [--position] [--rotation] [--scale]

# Forward/Right/Up 벡터 가져오기
unity-editor tf get-forward <name>
unity-editor tf get-right <name>
unity-editor tf get-up <name>

# Transform 복사/붙여넣기
unity-editor tf copy <source>
unity-editor tf paste <target>

# Transform 스냅 (그리드)
unity-editor tf snap <name> <grid-size>
```

---

## 3. Component

### 🔄 구현 예정

```bash
# Component 가져오기
unity-editor component get <gameobject> <component-type>

# Component 추가
unity-editor component add <gameobject> <component-type>

# Component 제거
unity-editor component remove <gameobject> <component-type>

# Component 활성화/비활성화
unity-editor component enable <gameobject> <component-type>
unity-editor component disable <gameobject> <component-type>

# Component 속성 가져오기
unity-editor component get-property <gameobject> <component> <property>

# Component 속성 설정
unity-editor component set-property <gameobject> <component> <property> <value>

# Component 복사
unity-editor component copy <source-go> <component-type>

# Component 붙여넣기
unity-editor component paste <target-go>

# Component 정보 나열
unity-editor component list <gameobject>

# Component 검색
unity-editor component find <component-type>

# Component 일괄 수정
unity-editor component batch-set <component-type> <property> <value>

# Component Reset
unity-editor component reset <gameobject> <component-type>
```

---

## 4. Material & Rendering

### 🔄 구현 예정

```bash
# Material 가져오기
unity-editor material get <renderer-name>

# Material 속성 가져오기
unity-editor material get-property <renderer> <property>

# Material 속성 설정
unity-editor material set-property <renderer> <property> <value>

# Material 색상 가져오기
unity-editor material get-color <renderer> <property>

# Material 색상 설정
unity-editor material set-color <renderer> <property> <r,g,b,a>

# Material 텍스처 설정
unity-editor material set-texture <renderer> <property> <path>

# Material 교체
unity-editor material replace <renderer> <material-path>

# Material Shader 변경
unity-editor material set-shader <renderer> <shader-name>

# Renderer 활성화/비활성화
unity-editor renderer enable <name>
unity-editor renderer disable <name>

# Renderer 그림자 설정
unity-editor renderer set-shadows <name> <on|off|two-sided>

# Renderer 레이어 설정
unity-editor renderer set-sorting-layer <name> <layer>
unity-editor renderer set-sorting-order <name> <order>

# Mesh 정보 가져오기
unity-editor mesh info <name>

# Mesh 교체
unity-editor mesh replace <name> <mesh-path>

# SpriteRenderer 스프라이트 변경
unity-editor sprite set <name> <sprite-path>

# SpriteRenderer Flip 설정
unity-editor sprite flip-x <name> <true|false>
unity-editor sprite flip-y <name> <true|false>
```

---

## 5. Scene Management

### ✅ 현재 구현됨

```bash
# 현재 씬 정보
unity-editor scene current

# 로드된 씬 목록
unity-editor scene list

# 씬 로드
unity-editor scene load <name> [--additive]
```

### 🔄 구현 예정

```bash
# 씬 언로드
unity-editor scene unload <name>

# 씬 저장
unity-editor scene save [<name>]

# 씬 새로 생성
unity-editor scene new <name>

# 씬 닫기
unity-editor scene close [<name>]

# Active 씬 설정
unity-editor scene set-active <name>

# 씬 더티 플래그
unity-editor scene is-dirty [<name>]

# 씬 경로 가져오기
unity-editor scene get-path <name>

# Build Settings의 씬 목록
unity-editor scene build-list

# Build Settings에 씬 추가
unity-editor scene add-to-build <path>

# Build Settings에서 씬 제거
unity-editor scene remove-from-build <path>

# 씬 병합
unity-editor scene merge <source> <target>

# 씬 GameObjects 카운트
unity-editor scene count-objects [<name>]
```

---

## 6. Prefab

### 🔄 구현 예정

```bash
# Prefab 인스턴스화
unity-editor prefab instantiate <path> [--position <x,y,z>] [--parent <name>]

# Prefab 생성
unity-editor prefab create <gameobject> <save-path>

# Prefab 언팩
unity-editor prefab unpack <instance-name> [--completely]

# Prefab Apply 변경사항
unity-editor prefab apply <instance-name>

# Prefab Revert 변경사항
unity-editor prefab revert <instance-name>

# Prefab 오버라이드 확인
unity-editor prefab has-overrides <instance-name>

# Prefab 오버라이드 목록
unity-editor prefab list-overrides <instance-name>

# Prefab 소스 경로
unity-editor prefab get-source <instance-name>

# Prefab Variant 생성
unity-editor prefab create-variant <source-path> <save-path>

# Prefab 중첩 정보
unity-editor prefab is-nested <instance-name>

# Prefab 인스턴스 교체
unity-editor prefab replace-instance <old-instance> <new-prefab-path>

# Prefab 모든 인스턴스 찾기
unity-editor prefab find-instances <prefab-path>
```

---

## 7. Asset Database

### 🔄 구현 예정

```bash
# Asset 검색
unity-editor asset find <name> [--type <type>]

# Asset 경로 가져오기
unity-editor asset get-path <guid>

# Asset GUID 가져오기
unity-editor asset get-guid <path>

# Asset 정보
unity-editor asset info <path>

# Asset 가져오기 (Import)
unity-editor asset import <path> [--force]

# Asset 삭제
unity-editor asset delete <path>

# Asset 이동
unity-editor asset move <source> <destination>

# Asset 복사
unity-editor asset copy <source> <destination>

# Asset 이름 변경
unity-editor asset rename <path> <new-name>

# Asset 레이블 설정
unity-editor asset set-labels <path> <label1,label2,...>

# Asset 레이블 가져오기
unity-editor asset get-labels <path>

# Asset 새로고침
unity-editor asset refresh [--force]

# Asset 종속성 가져오기
unity-editor asset get-dependencies <path>

# Asset을 참조하는 것 찾기
unity-editor asset find-references <path>

# Asset 번들 할당
unity-editor asset set-bundle <path> <bundle-name>

# Meta 파일 재생성
unity-editor asset regenerate-meta <path>

# 누락된 Asset 찾기
unity-editor asset find-missing

# 사용되지 않는 Asset 찾기
unity-editor asset find-unused
```

---

## 8. Console & Logging

### ✅ 현재 구현됨

```bash
# 콘솔 로그 가져오기
unity-editor console logs [--count <n>] [--errors-only] [--warnings]

# 콘솔 지우기
unity-editor console clear
```

### 🔄 구현 예정

```bash
# 콘솔 로그 실시간 스트리밍
unity-editor console stream [--filter <error|warning|log>]

# 특정 로그 필터링
unity-editor console filter <keyword>

# 콘솔 로그 파일로 저장
unity-editor console export <filepath>

# 콘솔 로그 통계
unity-editor console stats

# Unity Editor에서 로그 출력
unity-editor console log <message>
unity-editor console warning <message>
unity-editor console error <message>

# 콘솔 설정
unity-editor console set-collapse <true|false>
unity-editor console set-clear-on-play <true|false>
unity-editor console set-error-pause <true|false>
```

---

## 9. Editor Window & UI

### 🔄 구현 예정

```bash
# Inspector 포커스
unity-editor window focus-inspector

# Scene View 포커스
unity-editor window focus-scene

# Game View 포커스
unity-editor window focus-game

# Project 창 포커스
unity-editor window focus-project

# Hierarchy 창 포커스
unity-editor window focus-hierarchy

# Console 창 포커스
unity-editor window focus-console

# 창 열기
unity-editor window open <window-type>

# 창 닫기
unity-editor window close <window-type>

# Editor Selection 가져오기
unity-editor editor get-selection

# Editor Selection 설정
unity-editor editor set-selection <gameobject>

# Editor Selection 여러개 설정
unity-editor editor set-selection-multi <go1,go2,...>

# Scene View 카메라 위치
unity-editor scene-view get-camera
unity-editor scene-view set-camera <x,y,z> <rx,ry,rz>

# Scene View GameObject에 포커스
unity-editor scene-view frame <gameobject>

# Scene View Gizmo 설정
unity-editor scene-view set-gizmos <true|false>

# Scene View 2D/3D 모드
unity-editor scene-view set-2d <true|false>

# Game View 해상도 설정
unity-editor game-view set-resolution <width>x<height>

# Game View 최대화
unity-editor game-view maximize <true|false>

# Play Mode 진입/종료
unity-editor editor play
unity-editor editor pause
unity-editor editor stop
unity-editor editor step

# Play Mode 상태
unity-editor editor is-playing
unity-editor editor is-paused
```

---

## 10. Animation

### 🔄 구현 예정

```bash
# Animation 재생
unity-editor anim play <gameobject> [<clip-name>]

# Animation 정지
unity-editor anim stop <gameobject>

# Animation 일시정지
unity-editor anim pause <gameobject>

# Animation 상태 가져오기
unity-editor anim get-state <gameobject>

# Animation Clip 목록
unity-editor anim list-clips <gameobject>

# Animation 현재 시간 설정
unity-editor anim set-time <gameobject> <time>

# Animation 속도 설정
unity-editor anim set-speed <gameobject> <speed>

# Animator Parameter 설정
unity-editor animator set-bool <gameobject> <param> <value>
unity-editor animator set-int <gameobject> <param> <value>
unity-editor animator set-float <gameobject> <param> <value>
unity-editor animator set-trigger <gameobject> <param>

# Animator Parameter 가져오기
unity-editor animator get-parameter <gameobject> <param>

# Animator 현재 State
unity-editor animator get-state <gameobject> [<layer>]

# Animator Transition
unity-editor animator crossfade <gameobject> <state> <duration>

# Animator Controller 교체
unity-editor animator set-controller <gameobject> <controller-path>

# Animation Event 추가
unity-editor anim add-event <clip-path> <time> <function-name>

# Animation Curve 수정
unity-editor anim set-curve <clip-path> <property> <keyframes>
```

---

## 11. Physics

### 🔄 구현 예정

```bash
# Rigidbody 속도 설정
unity-editor physics set-velocity <gameobject> <x,y,z>

# Rigidbody 각속도 설정
unity-editor physics set-angular-velocity <gameobject> <x,y,z>

# Rigidbody에 힘 추가
unity-editor physics add-force <gameobject> <x,y,z> [--mode <force|impulse|...>]

# Rigidbody Sleep/Wake
unity-editor physics sleep <gameobject>
unity-editor physics wake <gameobject>

# Rigidbody 중력 설정
unity-editor physics set-gravity <gameobject> <true|false>

# Rigidbody Kinematic 설정
unity-editor physics set-kinematic <gameobject> <true|false>

# Collider 활성화/비활성화
unity-editor collider enable <gameobject>
unity-editor collider disable <gameobject>

# Collider 크기 설정 (Box)
unity-editor collider set-size <gameobject> <x,y,z>

# Collider 반지름 설정 (Sphere)
unity-editor collider set-radius <gameobject> <radius>

# Raycast
unity-editor physics raycast <origin-x,y,z> <direction-x,y,z> <distance>

# OverlapSphere
unity-editor physics overlap-sphere <center-x,y,z> <radius>

# Physics Simulation Step
unity-editor physics simulate <time>

# Physics 설정
unity-editor physics get-gravity
unity-editor physics set-gravity <x,y,z>

# Layer Collision Matrix
unity-editor physics get-layer-collision <layer1> <layer2>
unity-editor physics set-layer-collision <layer1> <layer2> <true|false>
```

---

## 12. Lighting

### 🔄 구현 예정

```bash
# Light 색상 설정
unity-editor light set-color <name> <r,g,b>

# Light 강도 설정
unity-editor light set-intensity <name> <value>

# Light 범위 설정
unity-editor light set-range <name> <value>

# Light 타입 설정
unity-editor light set-type <name> <directional|point|spot|area>

# Light Shadow 설정
unity-editor light set-shadows <name> <none|hard|soft>

# Bake Lightmaps
unity-editor lighting bake [--clear]

# Lightmap 상태
unity-editor lighting is-baking

# Lightmap 취소
unity-editor lighting cancel-bake

# Lightmap 설정
unity-editor lighting set-mode <realtime|baked|mixed>

# Light Probe 그룹 설정
unity-editor lightprobe add <gameobject> <positions>

# Reflection Probe Bake
unity-editor reflection-probe bake <name>

# Ambient Light 설정
unity-editor ambient set-color <r,g,b>
unity-editor ambient set-intensity <value>

# Skybox 설정
unity-editor skybox set-material <material-path>

# Fog 설정
unity-editor fog enable
unity-editor fog disable
unity-editor fog set-color <r,g,b>
unity-editor fog set-density <value>
```

---

## 13. Camera

### 🔄 구현 예정

```bash
# Camera 위치/회전 설정
unity-editor camera set-position <name> <x,y,z>
unity-editor camera set-rotation <name> <x,y,z>

# Camera LookAt
unity-editor camera look-at <name> <target-x,y,z>

# Camera FOV 설정
unity-editor camera set-fov <name> <value>

# Camera Near/Far Plane
unity-editor camera set-near-plane <name> <value>
unity-editor camera set-far-plane <name> <value>

# Camera Clear Flags
unity-editor camera set-clear-flags <name> <skybox|solid-color|...>

# Camera Background Color
unity-editor camera set-bg-color <name> <r,g,b,a>

# Camera Depth
unity-editor camera set-depth <name> <value>

# Camera Culling Mask
unity-editor camera set-culling-mask <name> <layers>

# Camera Orthographic/Perspective
unity-editor camera set-orthographic <name> <true|false>
unity-editor camera set-orthographic-size <name> <value>

# Camera Viewport Rect
unity-editor camera set-viewport <name> <x,y,w,h>

# Camera Screenshot
unity-editor camera screenshot <name> <output-path> [--width <w>] [--height <h>]

# Main Camera 설정
unity-editor camera set-main <name>

# Camera Stack (URP)
unity-editor camera add-overlay <base> <overlay>
unity-editor camera remove-overlay <base> <overlay>
```

---

## 14. Audio

### 🔄 구현 예정

```bash
# AudioSource 재생
unity-editor audio play <name> [<clip-path>]

# AudioSource 정지
unity-editor audio stop <name>

# AudioSource 일시정지
unity-editor audio pause <name>

# AudioSource 볼륨 설정
unity-editor audio set-volume <name> <value>

# AudioSource 피치 설정
unity-editor audio set-pitch <name> <value>

# AudioSource 반복 설정
unity-editor audio set-loop <name> <true|false>

# AudioSource 공간 음향 설정
unity-editor audio set-spatial-blend <name> <value>

# AudioSource Min/Max Distance
unity-editor audio set-min-distance <name> <value>
unity-editor audio set-max-distance <name> <value>

# Audio Clip 교체
unity-editor audio set-clip <name> <clip-path>

# Audio Mixer 그룹 볼륨
unity-editor mixer set-volume <mixer> <group> <value>

# Audio Mixer 파라미터
unity-editor mixer set-parameter <mixer> <param> <value>
unity-editor mixer get-parameter <mixer> <param>

# Audio Listener 위치
unity-editor audio-listener get-position
unity-editor audio-listener set-position <x,y,z>
```

---

## 15. Navigation & AI

### 🔄 구현 예정

```bash
# NavMesh Bake
unity-editor navmesh bake [--async]

# NavMesh 상태
unity-editor navmesh is-baking

# NavMesh Clear
unity-editor navmesh clear

# NavMeshAgent 목적지 설정
unity-editor navagent set-destination <name> <x,y,z>

# NavMeshAgent 정지
unity-editor navagent stop <name>

# NavMeshAgent 재개
unity-editor navagent resume <name>

# NavMeshAgent 속도 설정
unity-editor navagent set-speed <name> <value>

# NavMeshAgent 회전 속도
unity-editor navagent set-angular-speed <name> <value>

# NavMeshAgent 경로 확인
unity-editor navagent has-path <name>

# NavMeshAgent 경로 남은 거리
unity-editor navagent get-remaining-distance <name>

# NavMesh Obstacle 설정
unity-editor navobstacle enable <name>
unity-editor navobstacle disable <name>
unity-editor navobstacle set-carve <name> <true|false>

# NavMesh 경로 계산
unity-editor navmesh calculate-path <start-x,y,z> <end-x,y,z>

# NavMesh Agent Area Mask
unity-editor navagent set-area-mask <name> <mask>
```

---

## 16. Particle System

### 🔄 구현 예정

```bash
# Particle System 재생
unity-editor particles play <name>

# Particle System 정지
unity-editor particles stop <name> [--clear]

# Particle System 일시정지
unity-editor particles pause <name>

# Particle System 시뮬레이션
unity-editor particles simulate <name> <time>

# Particle System 방출 속도
unity-editor particles set-emission-rate <name> <value>

# Particle System 시작 색상
unity-editor particles set-start-color <name> <r,g,b,a>

# Particle System 시작 크기
unity-editor particles set-start-size <name> <value>

# Particle System 시작 속도
unity-editor particles set-start-speed <name> <value>

# Particle System 수명
unity-editor particles set-start-lifetime <name> <value>

# Particle System 중력
unity-editor particles set-gravity <name> <value>

# Particle System 반복
unity-editor particles set-loop <name> <true|false>

# Particle System 파티클 개수
unity-editor particles get-count <name>

# Particle System 클리어
unity-editor particles clear <name>

# Particle System 모듈 활성화
unity-editor particles enable-module <name> <module>
unity-editor particles disable-module <name> <module>
```

---

## 17. Timeline

### 🔄 구현 예정

```bash
# Timeline 재생
unity-editor timeline play <name>

# Timeline 정지
unity-editor timeline stop <name>

# Timeline 일시정지
unity-editor timeline pause <name>

# Timeline 시간 설정
unity-editor timeline set-time <name> <time>

# Timeline 속도 설정
unity-editor timeline set-speed <name> <speed>

# Timeline 현재 시간
unity-editor timeline get-time <name>

# Timeline 지속 시간
unity-editor timeline get-duration <name>

# Timeline Playable Director 상태
unity-editor timeline get-state <name>

# Timeline Track 추가
unity-editor timeline add-track <name> <track-type>

# Timeline Track 제거
unity-editor timeline remove-track <name> <track-index>

# Timeline Clip 추가
unity-editor timeline add-clip <name> <track> <start> <duration>
```

---

## 18. Build & Player

### 🔄 구현 예정

```bash
# 빌드 실행
unity-editor build start [--target <platform>] [--output <path>]

# 빌드 상태
unity-editor build status

# 빌드 취소
unity-editor build cancel

# 빌드 타겟 설정
unity-editor build set-target <platform>

# 빌드 타겟 가져오기
unity-editor build get-target

# 빌드 씬 목록
unity-editor build list-scenes

# 빌드 옵션 설정
unity-editor build set-option <option> <value>

# Development Build 설정
unity-editor build set-development <true|false>

# Build & Run
unity-editor build run [--target <platform>]

# Player 로그
unity-editor player get-log

# Player 설정
unity-editor player set-company <name>
unity-editor player set-product <name>
unity-editor player set-version <version>
unity-editor player set-bundle-version <version>
```

---

## 19. Project Settings

### 🔄 구현 예정

```bash
# 프로젝트 설정 가져오기
unity-editor settings get <category> <property>

# 프로젝트 설정 변경
unity-editor settings set <category> <property> <value>

# Quality 설정
unity-editor quality set-level <level>
unity-editor quality get-level

# Graphics 설정
unity-editor graphics set-tier <tier>
unity-editor graphics get-render-pipeline

# Physics 설정
unity-editor settings physics get-gravity
unity-editor settings physics set-gravity <x,y,z>

# Time 설정
unity-editor settings time set-fixed-timestep <value>
unity-editor settings time set-maximum-timestep <value>

# Audio 설정
unity-editor settings audio set-volume <value>

# Input 설정
unity-editor settings input list-axes
unity-editor settings input add-axis <name>

# Tags & Layers
unity-editor settings add-tag <name>
unity-editor settings remove-tag <name>
unity-editor settings list-tags
unity-editor settings add-layer <name> <index>
unity-editor settings list-layers
```

---

## 20. Package Manager

### 🔄 구현 예정

```bash
# 패키지 목록
unity-editor package list [--all]

# 패키지 검색
unity-editor package search <keyword>

# 패키지 설치
unity-editor package install <package-name>[@version]

# 패키지 제거
unity-editor package remove <package-name>

# 패키지 업데이트
unity-editor package update <package-name>

# 패키지 정보
unity-editor package info <package-name>

# 패키지 임베드
unity-editor package embed <package-name>

# Git URL에서 패키지 추가
unity-editor package add-git <url>

# Local 패키지 추가
unity-editor package add-local <path>

# 패키지 종속성
unity-editor package dependencies <package-name>
```

---

## 21. Version Control

### 🔄 구현 예정

```bash
# VCS 상태
unity-editor vcs status [<path>]

# VCS Checkout
unity-editor vcs checkout <path>

# VCS Add
unity-editor vcs add <path>

# VCS Revert
unity-editor vcs revert <path>

# VCS Submit/Commit
unity-editor vcs submit <message>

# VCS Update
unity-editor vcs update

# VCS 충돌 확인
unity-editor vcs has-conflicts

# VCS 로그
unity-editor vcs log <path>

# VCS Diff
unity-editor vcs diff <path>
```

---

## 22. Profiler & Performance

### 🔄 구현 예정

```bash
# Profiler 시작
unity-editor profiler start

# Profiler 정지
unity-editor profiler stop

# Profiler 데이터 가져오기
unity-editor profiler get-data [--category <cpu|gpu|memory|...>]

# Frame Debugger 활성화
unity-editor frame-debugger enable

# Frame Debugger 비활성화
unity-editor frame-debugger disable

# Memory Profiler 스냅샷
unity-editor memory snapshot <output-path>

# GC 수집
unity-editor memory collect-garbage

# 메모리 사용량
unity-editor memory usage

# FPS 가져오기
unity-editor profiler get-fps

# Draw Call 수
unity-editor profiler get-draw-calls

# Batching 통계
unity-editor profiler get-batches
```

---

## 23. Test Runner

### 🔄 구현 예정

```bash
# 테스트 실행
unity-editor test run [--filter <pattern>] [--mode <editmode|playmode>]

# 테스트 목록
unity-editor test list

# 테스트 결과
unity-editor test results

# 특정 테스트 실행
unity-editor test run-single <test-name>

# 테스트 재실행
unity-editor test rerun-failed

# Code Coverage 활성화
unity-editor coverage enable

# Code Coverage 보고서
unity-editor coverage report <output-path>
```

---

## 24. Input System

### 🔄 구현 예정

```bash
# Input Action 트리거
unity-editor input trigger <action-name>

# Input Action 상태
unity-editor input get-value <action-name>

# Input Device 목록
unity-editor input list-devices

# Input Device 추가 (시뮬레이션)
unity-editor input add-device <device-type>

# Input Device 제거
unity-editor input remove-device <device-id>

# Input Binding 재정의
unity-editor input rebind <action> <binding-path>

# Input Map 활성화
unity-editor input enable-map <map-name>

# Input Map 비활성화
unity-editor input disable-map <map-name>
```

---

## 25. UI Toolkit

### 🔄 구현 예정

```bash
# UI Document 로드
unity-editor ui load-document <path>

# UI Element 찾기
unity-editor ui find-element <name>

# UI Element 속성 설정
unity-editor ui set-property <element> <property> <value>

# UI Element 텍스트 설정
unity-editor ui set-text <element> <text>

# UI Element 표시/숨김
unity-editor ui show <element>
unity-editor ui hide <element>

# UI Element 클래스 추가/제거
unity-editor ui add-class <element> <class>
unity-editor ui remove-class <element> <class>

# UI Style 변경
unity-editor ui set-style <element> <property> <value>

# UI Event 트리거
unity-editor ui trigger-event <element> <event-type>
```

---

## 추가 유틸리티 명령어

### 🔄 구현 예정

```bash
# Editor 환경 정보
unity-editor info version
unity-editor info platform
unity-editor info graphics-device
unity-editor info project-path

# Editor 재시작
unity-editor restart

# Editor 종료
unity-editor quit [--force]

# Editor Preferences
unity-editor prefs get <key>
unity-editor prefs set <key> <value>

# Script 컴파일
unity-editor compile [--force]

# Script 컴파일 상태
unity-editor is-compiling

# EditorApplication Callbacks
unity-editor callback on-play <script>
unity-editor callback on-stop <script>

# Utility
unity-editor screenshot <output-path>
unity-editor open-project <path>
unity-editor create-project <path>

# Debug
unity-editor debug break
unity-editor debug log-callstack
unity-editor debug draw-line <start> <end> <color> <duration>
unity-editor debug draw-ray <start> <direction> <color> <duration>
```

---

## 명령어 조합 예제

```bash
# GameObject 생성 및 위치 설정
unity-editor go create "MyObject" && unity-editor tf set-position "MyObject" "0,5,0"

# Prefab 인스턴스화 및 Material 변경
unity-editor prefab instantiate "Prefabs/Enemy" --position "10,0,5" && \
unity-editor material set-color "Enemy" "_Color" "1,0,0,1"

# 씬 로드 및 특정 GameObject 활성화
unity-editor scene load "Level1" && unity-editor go set-active "Boss" true

# 모든 Light의 강도를 2배로
unity-editor component find "Light" | xargs -I {} unity-editor light set-intensity {} 2.0

# 콘솔 에러 실시간 모니터링
unity-editor console stream --filter error

# GameObject 배치 일괄 처리
for i in {1..10}; do
  unity-editor go create "Cube_$i" && \
  unity-editor tf set-position "Cube_$i" "$i,0,0"
done
```

---

## 총 명령어 개수 요약

- **✅ 현재 구현**: 15개 명령어 (5개 카테고리)
- **🔄 구현 예정**: 500+ 명령어 (25개 카테고리)

Unity Editor의 거의 모든 기능을 CLI로 제어할 수 있도록 설계되었습니다.
