---
description: 기술 구현 계획(Plan) 작성 - HOW를 정의
allowed-tools: [Read, Write, Bash]
---

# Create Technical Implementation Plan

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

명세(specification)를 기술 아키텍처, 설계 결정, 구현 전략으로 변환합니다.

## Prerequisites

헌법과 명세가 먼저 존재해야 합니다:

```bash
cat .specify/memory/constitution.md
cat .specify/memory/specification.md
```

없다면 먼저 `/spec-kit:constitution`, `/spec-kit:specify`를 실행하세요.

## Step 1: Review Specification

명세를 읽고 이해:
- 어떤 기능을 구축해야 하는가?
- 수용 기준은 무엇인가?
- 성능 요구사항은?
- 제약사항은?

## Step 2: Structure Technical Plan

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

## Step 3: Validate Against Constitution

계획이 헌법의 기술 표준을 준수하는지 확인:

```bash
cat .specify/memory/constitution.md
```

- 성능 예산 충족?
- 보안 요구사항 반영?
- 테스트 커버리지 계획됨?
- 접근성 고려됨?

## Step 4: Review & Approve

계획의 완전성과 실행 가능성을 검토:
1. 모든 명세 요구사항이 계획에 반영됨?
2. 기술 스택이 헌법의 표준을 준수함?
3. 단계별 구현 전략이 명확함?
4. 테스트 전략이 구체적임?

## Step 5: Spec-Kit 명령 실행

모든 정보가 확인되면, 수집한 내용을 정리하여 spec-kit 명령어에 전달합니다:

**수집된 정보 정리:**
Step 1-4에서 결정한 모든 내용을 다음 형식으로 정리:

```
아키텍처:
- Frontend: [프레임워크, 상태관리, 스타일링]
- Data Layer: [스토리지, 캐싱 전략]
- Services: [서비스 목록과 기술]

기술 스택:
- Language: [언어와 버전]
- Build Tool: [도구]
- Testing: [프레임워크]
- Libraries: [라이브러리 목록과 선택 이유]

데이터 모델:
- [Model 1]: [필드 정의]
- [Model 2]: [필드 정의]

컴포넌트 구조:
- [Component 1]: [역할과 props]
- [Component 2]: [역할과 props]

구현 단계:
Phase 1: [작업 목록과 완료 기준]
Phase 2: [작업 목록과 완료 기준]

성능 최적화 전략: [전략 목록]
보안 고려사항: [보안 조치]
테스트 전략: [Unit/Integration/E2E 계획]
```

**SlashCommand 도구로 실행:**
정리된 정보를 인자로 전달하여 `/speckit.plan` 명령을 실행합니다:

```
/speckit.plan <위에서 정리한 정보 전체 + 사용자의 시스템 언어로 모든 내용을 작성하세요>
```

spec-kit 명령어는 이 정보를 받아서 사용자의 시스템 언어로 `.specify/memory/plan.md` 파일을 생성/업데이트합니다.

## Next Steps

계획 생성 후:
1. `.specify/memory/plan.md` 파일 검토
2. `/spec-kit:tasks` - 작업으로 분해
3. `/spec-kit:implement` - 구현 시작
4. `/spec-kit:analyze` - 진행 상황 검토

---

**참고**:
- 계획은 WHAT(명세)를 HOW(구현 방법)로 변환합니다
- 우리 플러그인(/spec-kit:plan)은 정보 수집 역할
- 실제 파일 생성은 spec-kit 명령어(/speckit.plan)가 담당
