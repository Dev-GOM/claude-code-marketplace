---
description: 기술 구현 계획(Plan) 작성 - HOW를 정의
allowed-tools: [Read, Write, Bash, AskUserQuestion]
argument-hint: <additional-context | 추가 컨텍스트>
---

# Create Technical Implementation Plan

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

⚠️ **커맨드 구분**: 이것은 **플러그인 커맨드** (/spec-kit:plan)입니다. 정보 수집과 사용자 논의를 담당합니다. 실제 파일 생성/업데이트는 GitHub Spec-Kit CLI 커맨드 (/speckit.plan)가 수행합니다.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

명세(specification)를 기술 아키텍처, 설계 결정, 구현 전략으로 변환합니다.

## Prerequisites

헌법과 명세가 먼저 존재해야 합니다:

```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# 헌법 (전역)
cat .specify/memory/constitution.md

# 명세 (브랜치별)
cat "specs/$CURRENT_BRANCH/spec.md"
```

없다면 먼저 `/spec-kit:constitution`, `/spec-kit:specify`를 실행하세요.

## Step 1: Git 변경사항 확인

계획 작성 전에 현재 작업 디렉토리의 변경사항과 브랜치 퍼블리쉬 상태를 확인합니다:

```bash
# 변경사항 확인
git status --short

# Upstream 브랜치 확인 (퍼블리쉬 여부)
git rev-parse --abbrev-ref @{upstream} 2>/dev/null
```

### 시나리오 A: 변경사항이 없는 경우

즉시 Step 2로 이동

### 시나리오 B: 변경사항 있음 + Upstream 브랜치 없음 (미퍼블리쉬)

브랜치가 아직 원격에 퍼블리쉬되지 않은 상태에서 변경사항이 있는 경우:

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "현재 작업 디렉토리에 변경되지 않은 파일이 있고, 브랜치가 아직 퍼블리쉬되지 않았습니다. 어떻게 처리하시겠습니까?",
    "header": "Git 변경사항",
    "multiSelect": false,
    "options": [
      {
        "label": "퍼블리쉬 + 커밋",
        "description": "현재 변경사항을 커밋하고 브랜치를 원격 저장소에 퍼블리쉬합니다. 팀과 공유하거나 백업이 필요한 경우 권장합니다."
      },
      {
        "label": "로컬에만 커밋",
        "description": "현재 변경사항을 커밋하지만 브랜치는 로컬에만 유지합니다. 아직 공유할 준비가 안 된 경우에 사용합니다."
      },
      {
        "label": "나중에 결정",
        "description": "계획 작성을 진행하고 나중에 모든 변경사항을 함께 처리합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"퍼블리쉬 + 커밋"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. `git push -u origin [브랜치명]`
  4. Step 2로 이동
- **"로컬에만 커밋"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. Step 2로 이동
- **"나중에 결정"** 선택 시: 즉시 Step 2로 이동

### 시나리오 C: 변경사항 있음 + Upstream 브랜치 있음 (이미 퍼블리쉬됨)

브랜치가 이미 원격에 퍼블리쉬된 상태에서 변경사항이 있는 경우:

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "현재 작업 디렉토리에 변경되지 않은 파일이 있습니다. 먼저 커밋하시겠습니까?",
    "header": "Git 변경사항",
    "multiSelect": false,
    "options": [
      {
        "label": "커밋하기",
        "description": "현재 변경사항을 커밋하고 원격 브랜치에 푸쉬합니다. 작업을 명확하게 분리할 수 있습니다."
      },
      {
        "label": "나중에 결정",
        "description": "계획 작성을 진행하고 나중에 모든 변경사항을 함께 커밋합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"커밋하기"** 선택 시:
  1. 사용자에게 커밋 메시지 요청
  2. `git add -A && git commit -m "[메시지]"`
  3. `git push`
  4. Step 2로 이동
- **"나중에 결정"** 선택 시: 즉시 Step 2로 이동

---

## Step 2: Check Existing File and Choose Update Mode

기존 계획 파일 확인:

```bash
# 계획 파일 확인
cat "specs/$CURRENT_BRANCH/plan.md"
```

### If File Exists - Choose Update Mode

AskUserQuestion 도구를 사용하여 사용자에게 확인:

```json
{
  "questions": [{
    "question": "기존 계획 파일이 존재합니다. 어떻게 업데이트하시겠습니까?",
    "header": "업데이트 모드",
    "multiSelect": false,
    "options": [
      {
        "label": "완전 재생성 (Full Regeneration)",
        "description": "처음부터 모든 정보를 다시 수집하여 새로 작성합니다. 아키텍처가 크게 변경되었거나 기술 스택을 완전히 바꾸고 싶을 때 추천합니다."
      },
      {
        "label": "부분 업데이트 (Incremental Update)",
        "description": "기존 계획을 유지하고 변경/추가할 부분만 질문합니다. 특정 컴포넌트 설계 변경, 새로운 라이브러리 추가 등 일부 내용만 업데이트할 때 추천합니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라 진행:**
- **"완전 재생성"** 선택 시 → Step 3부터 정상 진행 (완전 재작성)
- **"부분 업데이트"** 선택 시 → 기존 계획 표시 + "어떤 부분을 업데이트하시겠습니까?" 질문 + 변경사항만 수집 후 merge

### If File Not Exists

Step 3부터 정상 진행 (처음 작성)

---

## Step 3: Review Specification and Check Prerequisites

명세를 읽고 이해:
- 어떤 기능을 구축해야 하는가?
- 수용 기준은 무엇인가?
- 성능 요구사항은?
- 제약사항은?

**⚠️ 사전 체크:**

계획 작성 전에 명세의 완성도를 확인하세요:

```bash
# specification.md에서 Open Questions 체크
cat "specs/$CURRENT_BRANCH/spec.md" | grep -A 10 "Open Questions"
```

**만약 Open Questions가 있다면:**

```
⚠️ **경고**: 명세에 미해결 질문이 있습니다!

계획을 작성하기 전에 `/spec-kit:clarify`를 실행하여 모호한 부분을 명확히 하는 것을 강력히 권장합니다.

명확하지 않은 요구사항으로 계획을 작성하면:
- 잘못된 기술 선택
- 불필요한 재작업
- 구현 중 혼란

그래도 계속 진행하시겠습니까? (예/아니오)
```

사용자가 "아니오"를 선택하면 `/spec-kit:clarify`를 먼저 실행하도록 안내하세요.

## Step 4: Structure Technical Plan

사용자와 함께 다음 구조로 기술 계획을 정리합니다:

### Plan Template

```markdown
# Technical Plan: [Feature Name]

## Architecture Overview

[고수준 아키텍처 다이어그램 또는 설명]

### System Components

1. **Frontend**
   - UI 프레임워크: [React, Vue, Vanilla JS 등]
   - 상태 관리: [Redux, Zustand, Context 등]
   - 스타일링: [CSS Modules, Tailwind 등]

2. **Data Layer**
   - 로컬 스토리지: [IndexedDB, localStorage 등]
   - 상태 지속성: [전략]
   - 캐싱 전략: [Service Worker 등]

3. **Services**
   - [서비스 1]: [목적과 기술]
   - [서비스 2]: [목적과 기술]

## Technology Stack

### Core Technologies
- **Language**: [TypeScript 5.x 등]
- **Build Tool**: [Vite, Webpack 등]
- **Package Manager**: [npm, pnpm 등]
- **Testing**: [Jest, Playwright 등]

### Libraries

| Library | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| [lib] | [ver] | [용도] | [선택 이유] |

### Development Tools
- [도구들]

## Data Models

### [Model Name]

```typescript
interface ModelName {
  id: string;
  // ... fields
}
```

[주요 모델들 정의]

## Database Schema

[IndexedDB, SQL 등의 스키마 정의]

## Component Architecture

### Component Hierarchy

```
App
├── Component1
│   ├── SubComponent1
│   └── SubComponent2
└── Component2
```

### Key Components

#### [Component Name]

```typescript
interface ComponentProps {
  // props
}

// Uses:
// - [기술 1]
// - [기술 2]
```

## Implementation Strategy

### Phase 1: [Phase Name] (Week 1)

1. [작업]
2. [작업]

**Acceptance**: [완료 기준]

### Phase 2: [Phase Name] (Week 2)

[단계별 작업과 완료 기준]

## State Management

### Global State

```typescript
interface AppState {
  // state
}
```

### Local Component State

[컴포넌트 로컬 상태]

## Performance Optimization

### Strategies

1. **[전략명]**
   - [구체적 방법]

### Performance Budgets

- Initial bundle: < 50 KB gzipped
- TTI: < 3s
- Lighthouse: > 90

## Offline Support

### Service Worker Strategy

[오프라인 지원 전략]

### Offline Capabilities

- ✅ [가능한 것]
- ❌ [불가능한 것]

## Security Considerations

### Data Protection

1. **Input Validation**
   - [검증 방법]

2. **Content Security Policy**
```
CSP headers
```

## Error Handling

### Error Categories

1. **[에러 유형]**
   - [처리 방법]

### Error UI

[에러 UI 전략]

## Testing Strategy

### Unit Tests
- [대상]
- **Target**: 80% coverage

### Integration Tests
- [대상]

### E2E Tests
- [주요 흐름]

### Performance Tests
- [성능 테스트 방법]

## Accessibility Implementation

### WCAG 2.1 Level AA Requirements

1. **Keyboard Navigation**
   - [요구사항]

2. **Screen Reader Support**
   - [요구사항]

## Browser Compatibility

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Needed
- [필요한 폴리필]

## Deployment Plan

### Build Process

```bash
npm ci
npm run test
npm run build
```

### Continuous Integration

[CI/CD 전략]

### Release Checklist

- [ ] All tests pass
- [ ] Lighthouse score > 90
- [ ] Accessibility audit passes
- [ ] Bundle size within budget

## Monitoring & Analytics

### Performance Monitoring
- [모니터링 전략]

### Error Tracking
- [에러 추적 전략]

## Migration Strategy

[필요시 마이그레이션 전략]

## Open Technical Questions

1. **[질문]**
   - 옵션 A: [...]
   - 옵션 B: [...]
   - Decision needed before implementation

---
**Plan Version**: 1.0
**Created**: [Date]
**Status**: Draft | In Review | Approved
```

## Step 5: Validate Against Constitution

계획이 헌법의 기술 표준을 준수하는지 확인:

```bash
cat .specify/memory/constitution.md
```

- 성능 예산 충족?
- 보안 요구사항 반영?
- 테스트 커버리지 계획됨?
- 접근성 고려됨?

## Step 6: Review & Approve

계획의 완전성과 실행 가능성을 검토:
1. 모든 명세 요구사항이 계획에 반영됨?
2. 기술 스택이 헌법의 표준을 준수함?
3. 단계별 구현 전략이 명확함?
4. 테스트 전략이 구체적임?

## Step 7: Save Draft and Execute Spec-Kit Command

### 7.1 수집된 정보를 Draft 파일로 저장

먼저 현재 기능의 drafts 디렉토리 생성:

```bash
# drafts 디렉토리 생성
mkdir -p "specs/$CURRENT_BRANCH/drafts"
```

Write 도구를 사용하여 수집된 정보를 `specs/$CURRENT_BRANCH/drafts/plan-draft.md` 파일로 저장합니다:

```markdown
# Plan Draft

## Architecture Overview
[Step 4에서 작성한 아키텍처 개요...]

### System Components

#### Frontend
- UI 프레임워크: [선택한 프레임워크]
- 상태 관리: [선택한 상태 관리]
- 스타일링: [선택한 스타일링]

#### Data Layer
[Step 4에서 작성한 데이터 레이어...]

#### Services
[Step 4에서 작성한 서비스들...]

## Technology Stack

### Core Technologies
[Step 4에서 선택한 핵심 기술들...]

### Libraries
[Step 4에서 선택한 라이브러리들과 선택 이유...]

### Development Tools
[Step 4에서 선택한 개발 도구들...]

## Data Models
[Step 4에서 작성한 데이터 모델들...]

## Database Schema
[Step 4에서 작성한 데이터베이스 스키마...]

## Component Architecture
[Step 4에서 작성한 컴포넌트 아키텍처...]

## Implementation Strategy
[Step 4에서 작성한 구현 전략과 단계들...]

## State Management
[Step 4에서 작성한 상태 관리 전략...]

## Performance Optimization
[Step 4에서 작성한 성능 최적화 전략...]

## Offline Support
[Step 4에서 작성한 오프라인 지원 전략...]

## Security Considerations
[Step 4에서 작성한 보안 고려사항...]

## Error Handling
[Step 4에서 작성한 에러 처리 전략...]

## Testing Strategy
[Step 4에서 작성한 테스트 전략...]

## Accessibility Implementation
[Step 4에서 작성한 접근성 구현 계획...]

## Browser Compatibility
[Step 4에서 작성한 브라우저 호환성...]

## Deployment Plan
[Step 4에서 작성한 배포 계획...]

## Monitoring & Analytics
[Step 4에서 작성한 모니터링 전략...]

## Migration Strategy
[Step 4에서 작성한 마이그레이션 전략...]

## Open Technical Questions
[Step 4에서 작성한 미해결 기술 질문들...]
```

### 7.2 Spec-Kit 명령 실행

Draft 파일 경로와 **브랜치 정보**를 전달하여 SlashCommand 도구로 `/speckit.plan` 명령을 실행합니다:

```
/speckit.plan INSTRUCTION: This command is being called from /spec-kit:plan plugin. Current branch is "$CURRENT_BRANCH" and draft at "specs/$CURRENT_BRANCH/drafts/plan-draft.md". Read draft. Draft contains ALL technical architecture, technology stack decisions, and implementation strategy. Skip information collection and discussion steps (Step 3-6) and proceed directly to writing plan file. **CRITICAL - MUST FOLLOW:** 1. LANGUAGE: Process ALL content in user's system language. 2. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. 3. FILE WRITE: Write to "specs/$CURRENT_BRANCH/plan.md" with complete technical plan structure.
```

spec-kit 명령어는 draft 파일을 읽어서 `specs/$CURRENT_BRANCH/plan.md` 파일을 생성/업데이트합니다.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

## Next Steps

계획 생성 후:
1. `specs/$CURRENT_BRANCH/plan.md` 파일 검토
2. `/spec-kit:tasks` - 작업으로 분해
3. `/spec-kit:implement` - 구현 시작
4. `/spec-kit:analyze` - 진행 상황 검토

## What's Next?

AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 물어봅니다:

```json
{
  "questions": [{
    "question": "기술 구현 계획 작성이 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?",
    "header": "다음 단계",
    "multiSelect": false,
    "options": [
      {
        "label": "작업 분해 (/spec-kit:tasks)",
        "description": "계획을 실행 가능한 작업 목록으로 분해합니다. (권장 다음 단계)"
      },
      {
        "label": "모호한 부분 명확화 (/spec-kit:clarify)",
        "description": "계획에 Open Technical Questions가 있다면 먼저 명확히 합니다."
      },
      {
        "label": "계획 파일 검토",
        "description": "생성된 specs/[브랜치]/plan.md 파일을 먼저 검토하고 싶습니다."
      },
      {
        "label": "다른 명령어 실행",
        "description": "위 선택지에 없는 다른 spec-kit 명령어를 직접 입력하여 실행합니다."
      },
      {
        "label": "작업 완료",
        "description": "지금은 여기까지만 작업하겠습니다."
      }
    ]
  }]
}
```

**사용자 선택에 따라:**
- **작업 분해** 선택 시 → `/spec-kit:tasks` 명령 실행 안내
- **모호한 부분 명확화** 선택 시 → `/spec-kit:clarify` 명령 실행 안내
- **계획 파일 검토** 선택 시 → `cat "specs/$CURRENT_BRANCH/plan.md"` 실행 후 다시 선택지 제공
- **다른 명령어 실행** 선택 시 → 사용자가 원하는 명령어 입력 요청
- **작업 완료** 선택 시 → 세션 종료

---

**참고**:
- 계획은 WHAT(명세)를 HOW(구현 방법)로 변환합니다
- 우리 플러그인(/spec-kit:plan)은 정보 수집 역할
- 실제 파일 생성은 spec-kit 명령어(/speckit.plan)가 담당
