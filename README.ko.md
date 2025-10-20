# Claude Code 플러그인

> **버전**: 2.1.0 | **최종 업데이트**: 2025-10-20
>
> **언어**: [English](README.md) | [한국어](README.ko.md)

<details>
<summary><strong>📋 변경 이력</strong> (펼치기)</summary>

### Spec-Kit 통합

#### v2.2.0 (2025-10-20)
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

#### v2.0.4 (2025-10-19)
- 🐛 **버그 수정**: SlashCommand 형식 수정 - 8개 명령어 파일 모두에서 명령어와 INSTRUCTION을 한 줄로 통합
- 📝 **명확성 개선**: `/speckit.*` 명령어와 INSTRUCTION 파라미터 사이의 모호한 줄바꿈 제거
- 📝 **문서화**: INSTRUCTION 블록 명확화 - 모호한 "Use if clarification needed" 대신 "AskUserQuestion tool" 명시
- 🔄 **워크플로우 개선**: `/spec-kit:specify` 실행 전 Git 변경사항 확인 및 커밋 프롬프트 추가
- 🚀 **Git 통합 강화**: `/speckit.specify` 명세 작성 후 브랜치 퍼블리쉬 여부 선택 기능
- ♻️ **역할 분리**: 플러그인 커맨드에서 PowerShell 실행 제거로 워크플로우 명확화

#### v2.0.3 (2025-10-19)
- 🐛 **버그 수정**: 모든 커맨드 파일에서 중복된 `CURRENT_BRANCH` 선언 제거
- 📝 **문서화**: `/spec-kit:*`와 `/speckit.*` 혼동 방지를 위한 커맨드 구분 경고 추가

#### v2.0.2 (2025-10-19)
- 📝 **문서화**: 모든 커맨드 INSTRUCTION에 AskUserQuestion 도구 사용 지침 추가

#### v2.0.1 (2025-10-19)
- 🐛 **버그 수정**: clarify 명령어의 draft 파일 경로를 브랜치 기반 구조로 수정

#### v2.0.0 (2025-10-19)
- 🔄 **브랜치 기반 워크플로우**: 브랜치별 기능 명세를 지원하는 완전한 구조 개편
- 📁 **경로 변경**: 기능 파일을 `.specify/memory/`에서 `specs/[브랜치명]/` 구조로 마이그레이션
- ✨ **워크플로우 선택**: `/spec-kit:specify` 명령어가 새 명세 생성 또는 기존 명세 재작성 선택 제공
- 🔗 **PowerShell 통합**: 자동 브랜치 생성을 위한 `create-new-feature.ps1` 스크립트 통합
- 🎯 **브랜치 감지**: 모든 명령어가 현재 브랜치를 자동 감지하고 올바른 명세 파일로 작업
- 📋 **다음 단계 안내**: 모든 명령어에 워크플로우 탐색을 위한 AskUserQuestion 프롬프트 추가
- ⚠️ **주요 변경사항**: 기존 v1.x 사용자는 명세를 새로운 브랜치 기반 구조로 마이그레이션 필요

#### v1.7.0 (2025-10-19)
- 🔄 **다음 단계 제안**: 모든 명령어가 완료 후 AskUserQuestion을 사용하여 다음 작업 제안
- 🎯 **워크플로우 가이드**: 각 명령어가 컨텍스트에 맞는 다음 단계 제안 (예: specify → clarify/plan, tasks → implement)
- 📋 **스마트 내비게이션**: 워크플로우 계속, 파일 검토, 세션 종료 중 선택 가능
- 💡 **향상된 사용자 경험**: 다음 작업 선택을 위한 명확한 시각적 옵션 카드
- 🚀 **매끄러운 워크플로우**: 전체 SDD 프로세스를 안내하여 마찰 감소

#### v1.6.0 (2025-10-18)
- 🤝 **대화형 사용자 프롬프트**: 모든 명령어가 AskUserQuestion을 사용하여 향상된 사용자 상호작용 제공
- 🔄 **업데이트 모드 선택**: specify, plan, tasks 명령어가 완전 재생성 또는 부분 업데이트 중 선택 요청
- ⚠️ **스마트 경고**: implement 명령어가 Open Questions에 대해 경고하고 clarify 먼저 실행 제안
- 📋 **이슈 우선순위 지정**: clarify 명령어가 명확화할 모호한 항목 선택 가능
- 🎯 **개선된 UX**: 텍스트 기반 프롬프트를 명확한 설명이 있는 시각적 옵션 카드로 대체

#### v1.5.0 (2025-10-18)
- 📊 **프로젝트 상태 표시**: 재초기화 취소 시 현재 프로젝트 구조와 진행 상황 표시
- 🗺️ **스마트 내비게이션**: 기존 파일(헌법, 명세, 계획, 작업) 분석 후 다음 단계 추천
- 🎯 **상황별 안내**: 완료된 단계를 보여주고 적절한 다음 명령어 제안
- 💡 **워크플로우 명확성**: 사용자가 SDD 워크플로우에서 현재 위치를 파악할 수 있도록 지원

#### v1.4.0 (2025-10-18)
- 🔄 **재초기화 확인**: `/spec-kit:init` 명령어가 기존 설치를 감지하고 재초기화 전 사용자 확인 요청
- 📝 **명령어 인자 지원**: 모든 명령어가 `$ARGUMENTS`를 통한 사용자 입력 수용
- 🏷️ **인자 힌트**: 모든 명령어에 이중 언어(한글/영문) 인자 힌트 추가로 UX 개선
- 🌐 **향상된 사용자 입력**: 명령어를 인라인 인자와 함께 호출 가능 (예: `/spec-kit:specify 사용자 인증 추가`)

#### v1.3.0 (2025-10-18)
- 🔄 **업데이트 모드 선택(Update Mode Selection)**: 모든 핵심 명령어가 기존 파일을 감지하고 두 가지 업데이트 옵션 제공
- 📋 **완전 재생성(Full Regeneration)**: 요구사항이 크게 변경되었을 때 처음부터 완전히 재작성
- ✏️ **부분 업데이트(Incremental Update)**: 특정 변경사항만 타겟팅하는 병합 기반 업데이트
- 📖 **반복적 워크플로우 문서화(Iterative Workflow Documentation)**: 이전 단계를 언제 어떻게 업데이트할지에 대한 종합 가이드
- 🎯 **컨텍스트 보존(Context Preservation)**: 명령어 재실행 시 대화 이력과 변경 이유 유지
- ⚡ **계단식 업데이트(Cascade Updates)**: 변경 후 하위 단계 업데이트에 대한 명확한 가이드

#### v1.2.0 (2025-10-18)
- ✨ **스마트 사전 체크(Smart Prerequisite Checks)**: `/spec-kit:plan`, `/spec-kit:tasks`, `/spec-kit:implement` 명령어에서 미해결 질문(Open Questions) 자동 감지
- 🎨 **통합 커밋 플로우(Unified Commit Flow)**: 3가지 명확한 옵션이 있는 단일 결정 포인트 (품질 게이트 + 커밋 / 바로 커밋 / 건너뛰기)
- 📋 **더 나은 UX**: 각 커밋 옵션에 대한 상황별 적절한 안내
- 🛡️ **오류 방지**: 진행하기 전에 불명확한 요구사항에 대해 경고
- 📖 **문서화**: README에 포괄적인 "스마트 사전 체크" 섹션 추가

#### v1.1.0 (2025-10-17)
- ✨ **토큰 효율성**: draft 파일을 사용하는 2계층 아키텍처 구현
- 🚀 **성능**: 전체 내용 대신 파일 경로 사용으로 토큰 사용량 감소
- 📁 **Draft 시스템**: 모든 명령어가 `.specify/temp/`에 재사용 가능한 draft 파일 생성
- 📝 **지시사항**: 각 명령어마다 중복 단계를 건너뛰는 정확한 지시사항 추가
- 🌐 **다국어**: 모든 명령어에 대한 시스템 언어 감지 개선

#### v1.0.0 (2025-10-16)
- 🎉 최초 릴리스
- 📋 완전한 SDD 워크플로우를 위한 10개 슬래시 명령어
- 🔧 GitHub Spec-Kit CLI와의 통합

---

### AI 페어 프로그래밍 스위트

#### v1.0.0 (2025-10-15)
- 🎉 최초 릴리스
- 💬 5개 슬래시 커맨드: `/pair`, `/review`, `/suggest`, `/fix`, `/explain`
- 🤖 4개 전문 에이전트: `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`
- 🔔 3개 지능형 훅: Edit/Write 시 코드 리뷰, 버그 감지, 세션 요약
- 🎨 모든 플러그인을 위한 설정 시스템

---

### TODO Collector

#### v1.2.0 (2025-10-20)
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

#### v1.1.1 (2025-10-18)
- 🐛 **버그 수정**: `outputFormats` 설정의 빈 배열 처리 수정

#### v1.1.0 (2025-10-18)
- 📛 **프로젝트명 파일**: 모든 생성 파일에 프로젝트 이름 포함하여 여러 프로젝트 간 충돌 방지

#### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔗 TODO 리포트에 클릭 가능한 파일 링크
- 📝 다양한 코멘트 타입 지원 (TODO, FIXME, HACK, XXX, NOTE, BUG)
- 📊 통계가 포함된 상세한 마크다운 리포트
- 🎯 마크다운 헤더 건너뛰기로 오탐 방지
- 🌐 다국어 지원

---

### 훅 플러그인들 (모든 훅 플러그인)

#### v1.1.1 (2025-10-20) - 모든 훅 플러그인
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🏷️ **프로젝트 범위**: 상태 및 출력 파일에 프로젝트 이름 사용으로 충돌 방지
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리
- 🔍 **Complexity Monitor**: 선택적 스캔을 위한 includeDirs, excludeDirs, includeExtensions, excludeExtensions 설정 추가
- 🐛 **버그 수정 - Complexity Monitor v1.1.1**: 복잡도 로그 파일이 없을 때 전체 프로젝트 스캔 수행

#### v1.1.0 (2025-10-18) - Complexity Monitor, Session Summary, TODO Collector
- 📛 **프로젝트명이 포함된 출력 파일**: 모든 생성 파일에 프로젝트 이름을 포함하여 여러 프로젝트 간 충돌 방지
- 🏷️ **파일 명명 규칙**: `.complexity-log.md`에서 `.{프로젝트명}-complexity-log.md`로 변경 (모든 훅 동일)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 각 프로젝트의 추적 파일이 플러그인 `.state` 디렉토리에 분리 저장

#### v1.0.0 (2025-10-14)
- 🎉 최초 릴리스
- 🔄 **Git Auto-Backup**: 세션 종료 후 자동 git 커밋
- 📊 **Complexity Monitor**: 설정 가능한 임계값으로 코드 복잡도 추적
- 📝 **Auto-Docs**: 프로젝트 구조 자동 문서화
- 📋 **Session Summary**: 세션 동안 모든 파일 작업 추적
- ⚙️ `.plugin-config/` 파일을 통한 설정 가능
- 🔇 `showLogs` 설정으로 선택적 로그 표시

---

### Auto-Docs

#### v1.4.1 (2025-10-20)
- ✨ **개선**: 여러 디렉토리 포함 시 통합된 트리 구조로 표시
- 🐛 **버그 수정**: 출력 파일 삭제 시 문서 재생성
- 🔄 **자동 마이그레이션**: 플러그인 버전 기반 설정 마이그레이션
- 📦 **스마트 업데이트**: 새 필드 추가 시 사용자 설정 보존
- 🎯 **SessionStart Hook**: 세션 시작 시 설정 파일 자동 생성
- ⚡ **성능**: 설정이 최신 상태면 SessionStart hook 즉시 종료
- 🌍 **크로스 플랫폼**: Windows/macOS/Linux 향상된 경로 처리

#### v1.4.0 (2025-10-18)
- 📁 **빈 디렉토리 제어**: 빈 디렉토리 포함 여부를 제어하는 `includeEmptyDirs` 설정 옵션 추가
- 🐛 **버그 수정**: 두 확장자 필터가 모두 활성화된 경우 둘 다 표시하도록 수정

#### v1.3.0 (2025-10-18)
- 📄 **파일 확장자 필터링**: `includeExtensions`와 `excludeExtensions` 설정 옵션 추가
- 🎯 **선택적 파일 포함**: 특정 파일 타입만 포함 (예: `.js`, `.ts`, `.json`)
- 🚫 **파일 타입 제외**: 원하지 않는 파일 타입 제외 (예: `.meta`, `.log`, `.tmp`)
- 🔧 **유연한 설정**: 확장자를 점 포함/제외하고 지정 가능 (`.meta` 또는 `meta`)
- 📋 **AND 조건**: 두 필터가 함께 작동하여 세밀한 제어 제공 (먼저 포함, 그 다음 제외)
- 💡 **사용 사례**: 소스 코드만 집중, 빌드 산출물 제외, 메타데이터 파일 숨기기

#### v1.2.0 (2025-10-18)
- 📛 **프로젝트명이 포함된 출력 파일**: 생성 파일에 프로젝트 이름 포함 (`.{프로젝트명}-project-structure.md`)
- 🔀 **다중 프로젝트 지원**: 여러 프로젝트에서 동시 작업 가능, 파일 충돌 없음
- 📁 **상태 격리**: 플러그인 디렉토리에 프로젝트별 상태 파일 저장

#### v1.1.0 (2025-10-18)
- 📁 **선택적 디렉토리 스캔**: 특정 디렉토리만 스캔할 수 있는 `includeDirs` 설정 추가
- 🎯 **집중된 문서화**: 전체 프로젝트가 아닌 선택된 폴더만 프로젝트 구조 생성
- ⚙️ **설정 우선순위**: `includeDirs`가 설정되면 `excludeDirs`보다 우선 적용
- 📚 **대규모 프로젝트 지원**: 대규모 코드베이스의 특정 부분만 문서화할 때 유용
- 🌐 **다국어 문서화**: 영문 및 한글 README 모두 업데이트

---

### Unity Dev Toolkit

#### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit 템플릿**: Editor와 Runtime 모두를 위한 완전한 UI Toolkit 템플릿 추가 (총 6개 파일)
- 📝 **Editor 템플릿**: UXML/USS를 사용한 EditorWindow (C#, UXML, USS)
- 🎮 **Runtime 템플릿**: UXML/USS를 사용한 게임 UI용 UIDocument (C#, UXML, USS)
- ⚡ **새 Skill 추가**: UI Toolkit 개발 지원을 위한 `unity-uitoolkit` Skill 추가
- 📚 **템플릿 개수**: 7개에서 10개의 프로덕션 수준 템플릿으로 증가
- 🔗 **크로스 참조**: 새로운 UI Toolkit 기능 참조를 위해 Skills 업데이트

#### v1.1.0 (2025-10-18)
- 🤖 **새 Agent 추가**: 코드 리팩토링 및 품질 개선을 위한 `@unity-refactor` Agent 추가
- 📝 **Skills 향상**: 모든 Skills에 "When to Use vs Other Components" 섹션 추가
- 🔗 **컴포넌트 통합**: Skills vs Agents vs Commands 사용 시기에 대한 명확한 가이드
- 📚 **문서화**: 컴포넌트 간 참조 및 사용 패턴 개선

#### v1.0.1 (2025-10-18)
- 📝 **Skill 문서 최적화**: SKILL.md 파일 간소화 (834 → 197 라인, 76% 감소)
- 🎯 **Progressive Disclosure**: 간결한 스킬 문서화를 위한 모범 사례 적용
- 🗑️ **중복 제거**: "When to Use This Skill" 섹션 제거 (스킬 활성화는 description 필드로 결정됨)
- ⚡ **토큰 효율성**: 더 빠른 스킬 로딩 및 활성화를 위한 컨텍스트 크기 감소

#### v1.0.0 (2025-10-18)
- 🎉 최초 릴리스
- 📝 3개 슬래시 커맨드: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3개 전문 에이전트: `@unity-scripter`, `@unity-performance`, `@unity-architect` (v1.1.0에서 4개로 확장)
- ⚡ 4개 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector` (v1.2.0에서 5개로 확장)
- 📄 MonoBehaviour, ScriptableObject, Editor, Test 스크립트를 위한 프로덕션 수준 템플릿

</details>

> **⚠️ 중요 공지 (>= v2.0.17)**
> 채팅창에 훅 로그가 계속 쌓이는 이슈가 있습니다. 이 문제가 해결될 때까지 hooks.json에서 `suppressOutput: true`를 사용하여 PostToolUse 훅 출력을 숨겼습니다. Stop 훅 메시지는 `.plugin-config/[plugin-name].json`의 `"showLogs": false`(기본값)로 제어됩니다. `true`로 설정하면 활성화됩니다. 자세한 내용은 [설정](#설정)을 참조하세요.

일반적인 개발 워크플로우(Workflow)를 자동화하는 강력한 Claude Code 생산성 플러그인(Plugin) 모음입니다.

![Claude Code Session Log](images/claude-code-session-log.png)

## 포함된 플러그인

### 1. 🔄 [Git Auto-Backup](plugins/hook-git-auto-backup/README.ko.md)

Claude Code 세션(Session)이 끝날 때마다 자동으로 git 커밋을 생성하여 작업 손실을 방지합니다.

**요약:** 세션 종료 시 타임스탬프와 함께 모든 변경사항 자동 커밋 | **훅(Hook):** `Stop`

**[📖 전체 문서 보기 →](plugins/hook-git-auto-backup/README.ko.md)**

---

### 2. 📋 [TODO Collector](plugins/hook-todo-collector/README.ko.md)

프로젝트 전체를 스캔하여 모든 TODO, FIXME, HACK, XXX, NOTE, BUG 코멘트를 상세 리포트(Report)로 수집합니다.

**요약:** 다양한 언어 지원, 마크다운 리포트 생성 | **훅(Hooks):** `PostToolUse` (Write|Edit|NotebookEdit), `Stop`

![TODO Report Example](images/todos-report.png)

**[📖 전체 문서 보기 →](plugins/hook-todo-collector/README.ko.md)**

---

### 3. 📊 [Code Complexity Monitor](plugins/hook-complexity-monitor/README.ko.md)

코드 복잡도 지표를 모니터링하고 임계값을 초과하면 경고합니다.

**요약:** 순환 복잡도, 함수/파일 길이, 중첩 깊이 추적 | **훅(Hook):** `PostToolUse` (Edit|Write)

![Complexity Log Example](images/complexity-log.png)

**[📖 전체 문서 보기 →](plugins/hook-complexity-monitor/README.ko.md)**

---

### 4. 📝 [Auto Documentation Generator](plugins/hook-auto-docs/README.ko.md)

디렉토리 트리, 스크립트, 의존성을 포함한 프로젝트 구조를 자동으로 스캔하고 문서화합니다.

**요약:** 프로젝트 구조 문서 생성, 파일 변경 추적, package.json 정보 추출 | **훅(Hooks):** `PostToolUse` (Write), `Stop`

![Project Structure Example](images/project-structure.png)

**[📖 전체 문서 보기 →](plugins/hook-auto-docs/README.ko.md)**

---

### 5. 📊 [Session File Tracker](plugins/hook-session-summary/README.ko.md)

세션 동안 모든 파일 작업을 추적하고 디렉토리 트리 시각화가 포함된 요약 리포트를 생성합니다.

**요약:** 작업 유형별 파일 분류 (Created, Modified, Read) | **훅(Hooks):** `PostToolUse` (Write|Edit|Read|NotebookEdit), `Stop`

![Session Summary Example](images/session-summary.png)

**[📖 전체 문서 보기 →](plugins/hook-session-summary/README.ko.md)**

---

### 6. 🤖 [AI 페어 프로그래밍 스위트](plugins/ai-pair-programming/README.ko.md)

슬래시 커맨드(Slash Command), 전문 에이전트(Agent), 지능형 훅이 통합된 완벽한 AI 페어 프로그래밍 경험.

**요약:** 5개 슬래시 커맨드 + 4개 전문 에이전트 + 3개 지능형 훅 | **커맨드:** `/pair`, `/review`, `/suggest`, `/fix`, `/explain` | **에이전트:** `@code-reviewer`, `@bug-hunter`, `@architect`, `@performance-expert`

**[📖 전체 문서 보기 →](plugins/ai-pair-programming/README.ko.md)**

---

### 7. 📋 [Spec-Kit 통합](plugins/spec-kit/README.ko.md)

명세 주도 개발(SDD, Specification-Driven Development)을 위한 [GitHub Spec-Kit](https://github.com/github/spec-kit) 통합. 코딩 전에 무엇을(WHAT) 어떻게(HOW) 만들지 정의합니다.

**요약:** 구조화된 개발 워크플로우를 위한 10개 슬래시 커맨드 | **커맨드:** `/spec-kit:init`, `/spec-kit:constitution`, `/spec-kit:specify`, `/spec-kit:plan`, `/spec-kit:tasks`, `/spec-kit:implement` | **워크플로우:** 헌법(Constitution) → 명세(Specification) → 계획(Plan) → 작업(Tasks) → 구현(Implementation)

**[📖 전체 문서 보기 →](plugins/spec-kit/README.ko.md)**

---

### 8. 🎮 [Unity Dev Toolkit](plugins/unity-dev-toolkit/README.ko.md)

지능형 스크립팅 지원, 코드 리팩토링, 성능 최적화, UI Toolkit 지원을 갖춘 종합 Unity 게임 개발 도구.

**요약:** 4개 전문 에이전트 + 5개 Agent Skills + 3개 슬래시 커맨드 + 10개 프로덕션 템플릿 | **커맨드:** `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test` | **에이전트:** `@unity-scripter`, `@unity-refactor`, `@unity-performance`, `@unity-architect` | **기능:** UI Toolkit 템플릿 (Editor + Runtime), 자동 코드 검증, 씬 최적화

**[📖 전체 문서 보기 →](plugins/unity-dev-toolkit/README.ko.md)**

## 설치

### 빠른 시작 (권장)

1. Claude Code에서 마켓플레이스(Marketplace) 추가:
   ```bash
   /plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
   ```

2. 플러그인 설치:
   ```bash
   /plugin install hook-git-auto-backup@dev-gom-plugins
   ```
   ```bash
   /plugin install hook-todo-collector@dev-gom-plugins
   ```
   ```bash
   /plugin install hook-complexity-monitor@dev-gom-plugins
   ```
   ```bash
   /plugin install hook-auto-docs@dev-gom-plugins
   ```
   ```bash
   /plugin install hook-session-summary@dev-gom-plugins
   ```
   ```bash
   /plugin install ai-pair-programming@dev-gom-plugins
   ```
   ```bash
   /plugin install spec-kit@dev-gom-plugins
   ```
   ```bash
   /plugin install unity-dev-toolkit@dev-gom-plugins
   ```

3. 플러그인을 로드하기 위해 Claude Code 재시작:
   ```bash
   claude
   # 또는
   claude -r  # 마지막 세션 재개
   # 또는
   claude -c  # 현재 디렉토리에서 계속
   ```

4. 플러그인 설치 확인:
   ```bash
   /plugin
   ```

### 로컬 설치 (개발용)

1. 이 저장소를 클론하고 이동
2. 로컬 마켓플레이스 추가:
   ```bash
   /plugin marketplace add dev-gom-plugins ./path/to/.claude-plugin/marketplace.json
   ```
3. 위와 같이 플러그인 설치

## 사용법

설치 후 플러그인은 자동으로 작동합니다:

- **Git Auto-Backup**: Claude 세션 종료 후 커밋
- **TODO Collector**: 세션 종료 시 TODO 스캔 및 리포트
- **Complexity Monitor**: Edit/Write 작업 후 코드 확인
- **Auto-Docs**: 세션 종료 시 문서 업데이트
- **Session File Tracker**: 세션 종료 시 파일 작업 요약
- **AI 페어 프로그래밍 스위트**: 커맨드, 에이전트, 훅으로 지능형 지원 제공
- **Spec-Kit 통합**: `/spec-kit:*` 커맨드로 명세 주도 개발 워크플로우 안내
- **Unity Dev Toolkit**: `/unity:*` 커맨드 사용, `@unity-*`로 전문 에이전트 호출, Agent Skills를 통한 자동 스크립트 검증

## 설정

### 플러그인별 설정

각 플러그인은 첫 실행 시 `.plugin-config/[plugin-name].json` 설정 파일을 자동으로 생성합니다. 이 파일들은 플러그인 업데이트 시에도 보존됩니다.

**공통 설정:**
- `showLogs`: Stop 훅 로그 표시 여부 (`false`가 기본값으로 채팅 혼잡도 감소)

**예제** - TODO Collector 로그 활성화:

`.plugin-config/hook-todo-collector.json` 파일 생성 또는 편집:
```json
{
  "showLogs": true,
  "outputDirectory": "",
  "supportedExtensions": null,
  "excludeDirs": null,
  "commentTypes": null,
  "outputFormats": null
}
```

상세한 설정 옵션:

- **[Git Auto-Backup 설정 →](plugins/hook-git-auto-backup/README.ko.md#설정)**
- **[TODO Collector 설정 →](plugins/hook-todo-collector/README.ko.md#설정)**
- **[Complexity Monitor 설정 →](plugins/hook-complexity-monitor/README.ko.md#설정)**
- **[Auto-Docs 설정 →](plugins/hook-auto-docs/README.ko.md#설정)**
- **[Session Tracker 설정 →](plugins/hook-session-summary/README.ko.md#설정)**
- **[AI 페어 프로그래밍 설정 →](plugins/ai-pair-programming/README.ko.md#설정)**
- **[Spec-Kit 문서 →](plugins/spec-kit/README.ko.md)**

### 빠른 예제

**특정 플러그인 비활성화:**
```bash
/plugin uninstall hook-git-auto-backup@dev-gom-plugins
```

**특정 플러그인의 훅 로그 활성화:**
`.plugin-config/[plugin-name].json` 파일을 편집하고 `"showLogs": true`로 설정

**복잡도 임계값 커스터마이즈:**
[Complexity Monitor 설정](plugins/hook-complexity-monitor/README.ko.md#설정) 참조

**커스텀 TODO 패턴 추가:**
[TODO Collector 설정](plugins/hook-todo-collector/README.ko.md#설정) 참조

## 출력 파일

플러그인은 프로젝트 루트에 다음 파일을 생성합니다:

- `.todos-report.md` - 상세한 TODO 리포트
- `.todos.txt` - 간단한 TODO 목록
- `.complexity-log.txt` - 복잡도 이슈 로그
- `.project-structure.md` - 프로젝트 구조 문서
- `.session-summary.md` - 세션 파일 작업 요약
- `.pair-programming-session.md` - AI 페어 프로그래밍 세션 리포트

**플러그인 설정 파일** (프로젝트 루트에 자동 생성):

- `.plugin-config/` - 플러그인별 설정 파일 (플러그인 업데이트 시에도 설정 보존)

**팁:** 출력 파일은 커밋하지 않으려면 `.gitignore`에 추가하세요. `.plugin-config/`의 설정 파일은 팀과 설정을 공유하려면 커밋하세요:

```gitignore
# 플러그인 출력 파일
.todos-report.md
.todos.txt
.complexity-log.txt
.project-structure.md
.structure-state.json
.structure-changes.json
.session-summary.md
.pair-programming-session.md
.state/

# 선택사항: 플러그인 설정을 제외하려면 주석 해제 (설정을 공유하지 않으려는 경우)
# .plugin-config/
```

## 요구사항

- Claude Code CLI
- Node.js (플러그인 스크립트 실행용)
- Git (git-auto-backup 플러그인용)

## 문제 해결

### 플러그인이 실행되지 않나요?

1. 플러그인 설치 확인:
   ```bash
   /plugin
   ```

2. 설정에서 hooks가 활성화되어 있는지 확인

3. Node.js가 PATH에 있는지 확인:
   ```bash
   node --version
   ```

### Git 커밋이 작동하지 않나요?

1. git 저장소인지 확인:
   ```bash
   git status
   ```

2. git이 구성되어 있는지 확인:
   ```bash
   git config user.name
   git config user.email
   ```

### 복잡도 모니터에서 오탐이 발생하나요?

프로젝트의 필요에 맞게 플러그인 설정 파일에서 임계값을 조정하세요.

## 개발

### 플러그인 개발자를 위한 정보

각 플러그인의 상세한 기술 문서는 해당 README에 있습니다:
- [Git Auto-Backup 기술 세부사항](plugins/hook-git-auto-backup/README.ko.md#기술-세부사항)
- [TODO Collector 기술 세부사항](plugins/hook-todo-collector/README.ko.md#기술-세부사항)
- [Complexity Monitor 기술 세부사항](plugins/hook-complexity-monitor/README.ko.md#기술-세부사항)
- [Auto-Docs 기술 세부사항](plugins/hook-auto-docs/README.ko.md#기술-세부사항)
- [Session Tracker 기술 세부사항](plugins/hook-session-summary/README.ko.md#기술-세부사항)
- [AI 페어 프로그래밍 기술 세부사항](plugins/ai-pair-programming/README.ko.md#동작-원리)
- [Spec-Kit 통합 가이드](plugins/spec-kit/README.ko.md)

## 기여

필요에 따라 이러한 플러그인을 자유롭게 커스터마이징하세요:

1. `.claude-plugin` 디렉토리 포크/복사
2. `plugins/[plugin-name]/`에서 플러그인 스크립트 수정
3. hook 동작을 변경하는 경우 `plugin.json` 업데이트
4. `/plugin validate .claude-plugin`로 테스트

## 라이선스

MIT 라이선스 - 프로젝트에 자유롭게 사용하고 수정하세요.

## 크레딧

자동화를 통해 개발자 생산성을 향상시키기 위해 Claude Code용으로 제작되었습니다.

---

**즐거운 코딩 되세요!** 🚀

문제나 제안사항이 있으면 GitHub에서 이슈를 열어주세요.
