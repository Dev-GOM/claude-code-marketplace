# 변경 이력

Dev GOM Plugins 마켓플레이스의 모든 주요 변경사항이 이 파일에 문서화됩니다.

> **버전**: 2.4.0 | **최종 업데이트**: 2025-10-21

---

## [2.4.0] - 2025-10-21

### 추가됨
- 🎉 **새 플러그인**: Auto Release Manager - 모든 프로젝트 타입의 버전 업데이트 및 릴리즈 자동화
  - 범용 프로젝트 타입 감지 (Node.js, Python, Rust, Go, Unity, Unreal 등)
  - 크로스 플랫폼 버전 업데이트 스크립트
  - Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)
  - Unreal Engine .uproject 지원
  - Conventional Commits에서 CHANGELOG 자동 생성
  - Git 워크플로우 자동화
  - Python 3.11+ 외부 의존성 제로

---

## Spec-Kit 통합

### [2.3.2] - 2025-10-21

#### 수정됨
- 모호한 지시("필요시", "선택적")로 인한 AskUserQuestion 도구 미호출 문제 해결
- Step 4.2 최소 옵션 요구사항 위반 (1개 → 2개 필수)

#### 추가됨
- 모든 제약사항을 포함한 명시적 AskUserQuestion 도구 사용 가이드라인 섹션
- 모든 사용자 상호작용 지점에 MUST 지시 추가 (Step 1-B, 1-C, Step 2, Step 4.2, What's Next)
- 모든 섹션에 체크마크(✅)로 도구 제약사항 검증 표시
- 시스템의 "Other" 옵션 자동 추가에 대한 명확한 문서화

#### 변경됨
- Step 4.2 헤더를 "(선택적)"에서 필수로 변경
- 2-4개 옵션 요구사항 충족을 위해 "요구사항 추가" 옵션 추가

### [2.3.1] - 2025-10-21

#### 변경됨
- tasks 커맨드의 rigid AskUserQuestion JSON 구조 제거
- Claude가 컨텍스트에 따라 자율적으로 질문 결정
- 더 유연한 대화 흐름으로 사용자 경험 개선
- Step 1 (Git 변경사항), Step 2 (업데이트 모드), What's Next 섹션의 유연성 향상

### v2.3.0 (2025-10-21)
- 🚀 **토큰 효율성 최적화**: `/spec-kit:tasks` 커맨드 워크플로우 완전 재설계
  - 중복 정보 수집 제거 (Step 4-7) - CLI가 spec.md와 plan.md를 직접 자동 파싱
  - draft 파일 요구사항 제거 - CLI가 원본 문서 직접 읽기
  - 코드 라인 415줄에서 ~270줄로 감소 (35% 축소)
  - 플러그인은 사전 검증 및 추가 컨텍스트 수집에만 집중
  - **토큰 절약**: 중복 질문 제거로 ~50% 절감
  - **사용자 경험**: 최소 질문 (필요시에만 추가 컨텍스트)
- 🎯 **CLI 자동 생성**: GitHub Spec-Kit CLI의 자동 파싱 기능 100% 활용
  - spec.md에서 사용자 스토리, 우선순위, 수용 기준 자동 추출
  - plan.md에서 기술 스택, 라이브러리, 구현 전략 자동 추출
  - 사용자 스토리 phase별 자동 작업 생성 (P1, P2, P3...)
  - 의존성 매핑 및 병렬 실행 가능 작업 자동 식별
- ✨ **선택적 컨텍스트 수집**: 사용자가 다음을 선택 가능:
  - 특정 작업 포함
  - 특정 작업 제외
  - 우선순위 조정
  - 시간 제약 지정
  - 테스트 전략 선호
  - 또는 추가 입력 없이 자동 생성 (권장)

### v2.2.0 (2025-10-20)
- ✨ **SlashCommand 도구 통합**: 8개 커맨드 파일 모두에서 SlashCommand 도구를 명시적으로 사용하도록 개선 (중요 경고 추가)
- 🚀 **Git 설정 워크플로우**: init 커맨드에 포괄적인 Git 설치 및 GitHub 설정 추가
  - OS에 따라 Git 자동 감지 및 설치 (Windows/macOS/Linux)
  - Git 사용자 정보 대화식 설정
  - GitHub CLI 설치 및 인증
  - `gh repo create --private`로 Private 리포지토리 생성
- 📝 **Phase 기반 Draft 파일명**: implement 커맨드가 phase와 task ID를 포함한 draft 파일 생성
  - 형식: `[phase]-[task-id]-[slug]-draft.md` (예: `p2-t010-currency-draft.md`)
  - 크로스 플랫폼 호환성을 위한 영문 전용 slug 생성
  - 더 나은 파일 구성 및 작업 추적

### v2.0.4 (2025-10-19)
- 🐛 **버그 수정**: SlashCommand 형식 수정 - 8개 명령어 파일 모두에서 명령어와 INSTRUCTION을 한 줄로 통합
- 📝 **명확성 개선**: `/speckit.*` 명령어와 INSTRUCTION 파라미터 사이의 모호한 줄바꿈 제거
- 📝 **문서화**: INSTRUCTION 블록 명확화 - 모호한 "Use if clarification needed" 대신 "AskUserQuestion tool" 명시
- 🔄 **워크플로우 개선**: `/spec-kit:specify` 실행 전 Git 변경사항 확인 및 커밋 프롬프트 추가
- 🚀 **Git 통합 강화**: `/speckit.specify` 명세 작성 후 브랜치 퍼블리쉬 여부 선택 기능
- ♻️ **역할 분리**: 플러그인 커맨드에서 PowerShell 실행 제거로 워크플로우 명확화

### v2.0.3 (2025-10-19)
- 🐛 **버그 수정**: 모든 커맨드 파일에서 중복된 `CURRENT_BRANCH` 선언 제거
- 📝 **문서화**: `/spec-kit:*`와 `/speckit.*` 혼동 방지를 위한 커맨드 구분 경고 추가

### v2.0.2 (2025-10-19)
- 📝 **문서화**: 모든 커맨드 INSTRUCTION에 AskUserQuestion 도구 사용 지침 추가

### v2.0.1 (2025-10-19)
- 🐛 **버그 수정**: clarify 명령어의 draft 파일 경로를 브랜치 기반 구조로 수정

### v2.0.0 (2025-10-19)
- 🔄 **브랜치 기반 워크플로우**: 브랜치별 기능 명세를 지원하는 완전한 구조 개편
- 📁 **경로 변경**: 기능 파일을 `.specify/memory/`에서 `specs/[브랜치명]/` 구조로 마이그레이션
- ✨ **워크플로우 선택**: `/spec-kit:specify` 명령어가 새 명세 생성 또는 기존 명세 재작성 선택 제공
- 🔗 **PowerShell 통합**: 자동 브랜치 생성을 위한 `create-new-feature.ps1` 스크립트 통합
- 🎯 **브랜치 감지**: 모든 명령어가 현재 브랜치를 자동 감지하고 올바른 명세 파일로 작업
- 📋 **다음 단계 안내**: 모든 명령어에 워크플로우 탐색을 위한 AskUserQuestion 프롬프트 추가
- ⚠️ **주요 변경사항**: 기존 v1.x 사용자는 명세를 새로운 브랜치 기반 구조로 마이그레이션 필요

### v1.7.0 (2025-10-19)
- 🔄 **다음 단계 제안**: 모든 명령어가 완료 후 AskUserQuestion을 사용하여 다음 작업 제안
- 🎯 **워크플로우 가이드**: 각 명령어가 컨텍스트에 맞는 다음 단계 제안 (예: specify → clarify/plan, tasks → implement)
- 📋 **스마트 내비게이션**: 워크플로우 계속, 파일 검토, 세션 종료 중 선택 가능
- 💡 **향상된 사용자 경험**: 다음 작업 선택을 위한 명확한 시각적 옵션 카드
- 🚀 **매끄러운 워크플로우**: 전체 SDD 프로세스를 안내하여 마찰 감소

### v1.6.0 (2025-10-18)
- 🤝 **대화형 사용자 프롬프트**: 모든 명령어가 AskUserQuestion을 사용하여 향상된 사용자 상호작용 제공
- 🔄 **업데이트 모드 선택**: specify, plan, tasks 명령어가 완전 재생성 또는 부분 업데이트 중 선택 요청
- ⚠️ **스마트 경고**: implement 명령어가 Open Questions에 대해 경고하고 clarify 먼저 실행 제안
- 📋 **이슈 우선순위 지정**: clarify 명령어가 명확화할 모호한 항목 선택 가능
- 🎯 **개선된 UX**: 텍스트 기반 프롬프트를 명확한 설명이 있는 시각적 옵션 카드로 대체

### v1.5.0 (2025-10-18)
- 📊 **프로젝트 상태 표시**: 재초기화 취소 시 현재 프로젝트 구조와 진행 상황 표시
- 🗺️ **스마트 내비게이션**: 기존 파일(헌법, 명세, 계획, 작업) 분석 후 다음 단계 추천
- 🎯 **상황별 안내**: 완료된 단계를 보여주고 적절한 다음 명령어 제안
- 💡 **워크플로우 명확성**: 사용자가 SDD 워크플로우에서 현재 위치를 파악할 수 있도록 지원

### v1.4.0 (2025-10-18)
- 🔄 **재초기화 확인**: `/spec-kit:init` 명령어가 기존 설치를 감지하고 재초기화 전 사용자 확인 요청
- 📝 **명령어 인자 지원**: 모든 명령어가 `$ARGUMENTS`를 통한 사용자 입력 수용
- 🏷️ **인자 힌트**: 모든 명령어에 이중 언어(한글/영문) 인자 힌트 추가로 UX 개선
- 🌐 **향상된 사용자 입력**: 명령어를 인라인 인자와 함께 호출 가능 (예: `/spec-kit:specify 사용자 인증 추가`)

### v1.3.0 (2025-10-18)
- 🔄 **업데이트 모드 선택(Update Mode Selection)**: 모든 핵심 명령어가 기존 파일을 감지하고 두 가지 업데이트 옵션 제공
- 📋 **완전 재생성(Full Regeneration)**: 요구사항이 크게 변경되었을 때 처음부터 완전히 재작성
- ✏️ **부분 업데이트(Incremental Update)**: 특정 변경사항만 타겟팅하는 병합 기반 업데이트
- 📖 **반복적 워크플로우 문서화(Iterative Workflow Documentation)**: 이전 단계를 언제 어떻게 업데이트할지에 대한 종합 가이드
- 🎯 **컨텍스트 보존(Context Preservation)**: 명령어 재실행 시 대화 이력과 변경 이유 유지
- ⚡ **계단식 업데이트(Cascade Updates)**: 변경 후 하위 단계 업데이트에 대한 명확한 가이드

### v1.2.0 (2025-10-18)
- ✨ **스마트 사전 체크(Smart Prerequisite Checks)**: `/spec-kit:plan`, `/spec-kit:tasks`, `/spec-kit:implement` 명령어에서 미해결 질문(Open Questions) 자동 감지
- 🎨 **통합 커밋 플로우(Unified Commit Flow)**: 3가지 명확한 옵션이 있는 단일 결정 포인트 (품질 게이트 + 커밋 / 바로 커밋 / 건너뛰기)
- 📋 **더 나은 UX**: 각 커밋 옵션에 대한 상황별 적절한 안내
- 🛡️ **오류 방지**: 진행하기 전에 불명확한 요구사항에 대해 경고
- 📖 **문서화**: README에 포괄적인 "스마트 사전 체크" 섹션 추가

### v1.1.0 (2025-10-17)
- ✨ **토큰 효율성**: draft 파일을 사용하는 2계층 아키텍처 구현
- 🚀 **성능**: 전체 내용 대신 파일 경로 사용으로 토큰 사용량 감소
- 📁 **Draft 시스템**: 모든 명령어가 `.specify/temp/`에 재사용 가능한 draft 파일 생성
- 📝 **지시사항**: 각 명령어마다 중복 단계를 건너뛰는 정확한 지시사항 추가
- 🌐 **다국어**: 모든 명령어에 대한 시스템 언어 감지 개선

### v1.0.0 (2025-10-16)
- 🎉 최초 릴리스
- 📋 완전한 SDD 워크플로우를 위한 10개 슬래시 명령어
- 🔧 GitHub Spec-Kit CLI와의 통합

---

## AI Pair Programming Suite

### v1.1.1 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위 지정**: 충돌 방지를 위해 상태 및 출력 파일에 프로젝트 이름 사용
- 🎯 **SessionStart 훅**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태이면 SessionStart 훅이 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 호환성을 위한 경로 처리 개선

### v1.0.0 (2025-10-15)
- 🎉 최초 릴리스
- 💬 5개 슬래시 커맨드: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4개 전문 에이전트: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3개 지능형 훅: Edit/Write 시 코드 리뷰, 버그 감지, 세션 요약
- 🎨 모든 플러그인을 위한 설정 시스템

---

## TODO Collector

### v1.2.0 (2025-10-20)
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위**: 상태 파일에 프로젝트 이름 사용으로 충돌 방지
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚙️ **커스텀 필터링**: includeDirs 및 includeExtensions 설정 추가
- 🔍 **전체 프로젝트 스캔**: 첫 실행 시 전체 프로젝트 자동 스캔
- 🔧 **설정 리팩토링**: 설정을 `.plugin-config/hook-todo-collector.json`으로 이동
- 📝 **버그 수정**: 파일 수정이 없을 때 리포트가 생성되지 않는 문제 수정
- 🐛 **버그 수정**: 전체 스캔 로직 개선 - 리포트 파일이 없을 때 즉시 스캔

### v1.1.1 (2025-10-18)
- 🐛 **버그 수정**: `outputFormats` 설정의 빈 배열 처리 수정

### v1.1.0 (2025-10-18)
- 📛 **프로젝트명 파일**: 모든 생성 파일에 프로젝트 이름 포함하여 여러 프로젝트 간 충돌 방지

### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔗 TODO 리포트에 클릭 가능한 파일 링크
- 📝 다양한 코멘트 타입 지원 (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 통계가 포함된 상세한 마크다운 리포트
- 🎯 마크다운 헤더 건너뛰기로 오탐 방지
- 🌐 다국어 지원

---

## 훅 플러그인들 (모든 훅 플러그인)

### v1.1.1 (2025-10-20) - 모든 훅 플러그인
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위**: 상태 및 출력 파일에 프로젝트 이름 사용으로 충돌 방지
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리
- 🔍 **Complexity Monitor**: 선택적 스캔을 위한 includeDirs, excludeDirs, includeExtensions, excludeExtensions 설정 추가
- 🐛 **버그 수정 - Complexity Monitor v1.1.1**: 복잡도 로그 파일이 없을 때 전체 프로젝트 스캔 수행

### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **프로젝트명이 포함된 출력 파일**: 모든 생성 파일에 프로젝트 이름을 포함하여 여러 프로젝트 간 충돌 방지
- 🏷️ **파일 명명 규칙**: `.complexity-log.md`에서 `.{프로젝트명}-complexity-log.md`로 변경 (모든 훅 동일)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 각 프로젝트의 추적 파일이 플러그인 `.state` 디렉토리에 분리 저장

### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔄 **Git Auto-Backup**: 세션 종료 후 자동 git 커밋
- 📊 **Complexity Monitor**: 설정 가능한 임계값으로 코드 복잡도 추적
- 📝 **Auto-Docs**: 프로젝트 구조 자동 문서화
- 📋 **Session Summary**: 세션 동안 모든 파일 작업 추적
- ⚙️ `.plugin-config/` 파일을 통한 설정 가능
- 🔇 `showLogs` 설정으로 선택적 로그 표시

---

## Auto-Docs

### v1.4.1 (2025-10-20)
- ✨ **개선**: 여러 디렉토리 포함 시 통합된 트리 구조로 표시
- 🐛 **버그 수정**: 출력 파일 삭제 시 문서 재생성
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리

### v1.4.0 (2025-10-18)
- 📁 **빈 디렉토리 제어**: 빈 디렉토리 포함 여부를 제어하는 `includeEmptyDirs` 설정 옵션 추가
- 🐛 **버그 수정**: 두 확장자 필터가 모두 활성화된 경우 둘 다 표시하도록 수정

### v1.3.0 (2025-10-18)
- 📄 **파일 확장자 필터링**: `includeExtensions`와 `excludeExtensions` 설정 옵션 추가
- 🎯 **선택적 파일 포함**: 특정 파일 타입만 포함 (예: `.js`, `.ts`, `.json`)
- 🚫 **파일 타입 제외**: 원하지 않는 파일 타입 제외 (예: `.meta`, `.log`, `.tmp`)
- 🔧 **유연한 설정**: 확장자를 점 포함/제외하고 지정 가능 (`.meta` 또는 `meta`)
- 📋 **AND 조건**: 두 필터가 함께 작동하여 세밀한 제어 제공 (먼저 포함, 그 다음 제외)
- 💡 **사용 사례**: 소스 코드만 집중, 빌드 산출물 제외, 메타데이터 파일 숨기기

### v1.2.0 (2025-10-18)
- 📛 **프로젝트명이 포함된 출력 파일**: 생성 파일에 프로젝트 이름 포함 (`.{프로젝트명}-project-structure.md`)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 플러그인 디렉토리에 프로젝트별 상태 파일 저장

### v1.1.0 (2025-10-18)
- 📁 **선택적 디렉토리 스캔**: 특정 디렉토리만 스캔할 수 있는 `includeDirs` 설정 추가
- 🎯 **집중된 문서화**: 전체 프로젝트가 아닌 선택된 폴더만 프로젝트 구조 생성
- ⚙️ **설정 우선순위**: `includeDirs`가 설정되면 `excludeDirs`보다 우선 적용
- 📚 **대규모 프로젝트 지원**: 대규모 코드베이스의 특정 부분만 문서화할 때 유용
- 🌐 **다국어 문서화**: 영문 및 한글 README 모두 업데이트

---

## Unity Dev Toolkit

### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit 템플릿**: Editor와 Runtime 모두를 위한 완전한 UI Toolkit 템플릿 추가 (총 6개 파일)
- 📝 **Editor 템플릿**: UXML/USS를 사용한 EditorWindow (C#, UXML, USS)
- 🎮 **Runtime 템플릿**: UXML/USS를 사용한 게임 UI용 UIDocument (C#, UXML, USS)
- ⚡ **새 Skill 추가**: UI Toolkit 개발 지원을 위한 `unity-uitoolkit` Skill 추가
- 📚 **템플릿 개수**: 7개에서 10개의 프로덕션 수준 템플릿으로 증가
- 🔗 **크로스 참조**: 새로운 UI Toolkit 기능 참조를 위해 Skills 업데이트

### v1.1.0 (2025-10-18)
- 🤖 **새 Agent 추가**: 코드 리팩토링 및 품질 개선을 위한 `@unity-refactor` Agent 추가
- 📝 **Skills 향상**: 모든 Skills에 "When to Use vs Other Components" 섹션 추가
- 🔗 **컴포넌트 통합**: Skills vs Agents vs Commands 사용 시기에 대한 명확한 가이드
- 📚 **문서화**: 컴포넌트 간 참조 및 사용 패턴 개선

### v1.0.1 (2025-10-18)
- 📝 **Skill 문서 최적화**: SKILL.md 파일 간소화 (834 → 197 라인, 76% 감소)
- 🎯 **Progressive Disclosure**: 간결한 스킬 문서화를 위한 모범 사례 적용
- 🗑️ **중복 제거**: "When to Use This Skill" 섹션 제거 (스킬 활성화는 description 필드로 결정됨)
- ⚡ **토큰 효율성**: 더 빠른 스킬 로딩 및 활성화를 위한 컨텍스트 크기 감소

### v1.0.0 (2025-10-18)
- 🎉 최초 릴리스
- 📝 3개 슬래시 커맨드: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3개 전문 에이전트: `@unity-scripter`, `@unity-performance`, `@unity-architect` (v1.1.0에서 4개로 확장)
- ⚡ 4개 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (v1.2.0에서 5개로 확장)
- 📄 MonoBehaviour, ScriptableObject, Editor, Test 스크립트를 위한 프로덕션 수준 템플릿

---

## Auto Release Manager

### v1.0.1 (2025-10-21)

#### 변경됨
- 📦 **Python 3.11+ 요구사항**: Python 3.11+ 요구로 tomli 의존성 제거
  - TOML 파싱을 위해 내장 `tomllib` 사용
  - 명확한 오류 메시지와 함께 Python 버전 체크 추가
  - 모든 스크립트에 대한 외부 의존성 제로

#### 수정됨
- 🔧 **타입 힌트**: 5개 Python 스크립트의 모든 타입 어노테이션 수정
  - 모든 Dict, List, Optional 타입에 타입 매개변수 추가
  - `subprocess.CompletedProcess[str]` 타입 힌트 수정
  - 모든 Pylance 및 mypy 경고 해결
- 📏 **코드 품질**: 모든 PEP 8 린터 오류 수정
  - E501 라인 길이 위반 수정 (79자 제한)
  - 코드 포맷팅 일관성 개선
  - 모든 변수에 타입 힌트 추가

#### 문서화
- 📝 **요구사항**: README.md 및 README.ko.md에 Python 3.11+ 요구사항 추가
- 📚 **명확성**: 명확한 버전 요구사항과 함께 설치 지침 업데이트

### v1.0.0 (2025-01-20)
- 🎉 최초 릴리스
- 🔍 범용 프로젝트 타입 감지 (Node.js, Python, Rust, Go, Unity, Unreal 등)
- 📝 크로스 플랫폼 버전 업데이트 스크립트
- 🔄 Unity 이중 파일 동기화 (version.json ← → ProjectSettings.asset)
- 🎮 Unreal Engine .uproject 지원
- 📋 Conventional Commits에서 CHANGELOG 자동 생성
- 🚀 Git 워크플로우 자동화
- 📚 포괄적인 문서 및 가이드
