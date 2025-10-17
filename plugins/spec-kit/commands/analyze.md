---
description: 프로젝트 전체 상태 분석 및 진행 상황 리포트
allowed-tools: [Read, Bash]
---

# Analyze Project Status

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 분석 리포트, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

spec-kit 프로젝트의 전체 상태를 분석하고 진행 상황을 리포트합니다.

## Purpose

다음을 파악합니다:
- 명세-계획-작업의 정합성
- 구현 진행률
- 헌법 준수 여부
- 차단 요소
- 다음 액션

## Step 1: Gather Status

모든 spec-kit 파일 읽기:

```bash
cat .specify/memory/constitution.md
cat .specify/memory/specification.md
cat .specify/memory/plan.md
cat .specify/memory/tasks.md
```

## Step 2: Analyze Completeness

각 문서의 완성도 평가:

### Constitution
- ✅ 존재 / ❌ 없음
- Status: Draft / Approved
- 원칙 개수: [N]개
- 품질 게이트: [N]개

### Specification
- ✅ 존재 / ❌ 없음
- Status: Draft / In Review / Approved
- User Stories: [N]개
- Acceptance Criteria: [N]개
- Open Questions: [N]개 (⚠️ 해결 필요)

### Plan
- ✅ 존재 / ❌ 없음
- Status: Draft / Approved
- Phases: [N]개
- Open Technical Questions: [N]개 (⚠️ 해결 필요)

### Tasks
- ✅ 존재 / ❌ 없음
- Total Tasks: [N]개
- Completed: [N]개 ([%]%)
- In Progress: [N]개
- Pending: [N]개

## Step 3: Check Alignment

문서 간 정합성 확인:

**Specification → Plan:**
- 명세의 모든 요구사항이 계획에 반영되었는가?
- 계획의 기술 선택이 명세 제약사항을 만족하는가?

**Plan → Tasks:**
- 계획의 모든 Phase가 작업으로 분해되었는가?
- 작업 예상 시간의 합이 현실적인가?

**Constitution → All:**
- 명세가 헌법 원칙을 준수하는가?
- 계획이 기술 표준을 따르는가?
- 작업이 품질 게이트를 포함하는가?

## Step 4: Identify Blockers

진행을 막는 요소 식별:

**High Priority:**
- 🔴 Open Questions 미해결
- 🔴 상충되는 요구사항
- 🔴 누락된 의존성
- 🔴 차단된 작업 (의존성 미완료)

**Medium Priority:**
- 🟡 명확하지 않은 요구사항
- 🟡 기술 스택 미결정
- 🟡 테스트 전략 없음

**Low Priority:**
- 🟢 문서 포맷팅
- 🟢 예제 부족

## Step 5: Save Draft and Execute Spec-Kit Command

### 5.1 수집된 정보를 Draft 파일로 저장

먼저 `.specify/temp/` 디렉토리가 있는지 확인하고 없으면 생성:

```bash
mkdir -p .specify/temp
```

Write 도구를 사용하여 수집된 정보를 `.specify/temp/analyze-draft.md` 파일로 저장합니다:

```markdown
# Analyze Draft

## Document Status

### Constitution
- Status: [Step 2에서 확인한 상태]
- Principles: [N]개
- Quality Gates: [N]개
- Issues: [식별된 이슈들]

### Specification
- Status: [Step 2에서 확인한 상태]
- User Stories: [N]개
- Acceptance Criteria: [N]개
- Open Questions: [N]개
- Issues: [식별된 이슈들]

### Plan
- Status: [Step 2에서 확인한 상태]
- Phases: [N]개
- Open Technical Questions: [N]개
- Issues: [식별된 이슈들]

### Tasks
- Total: [N]개
- Completed: [N]개 ([%]%)
- In Progress: [N]개
- Pending: [N]개

## Alignment Check

### Spec ↔ Plan
[Step 3에서 확인한 정합성 상태와 이슈...]

### Plan ↔ Tasks
[Step 3에서 확인한 정합성 상태와 이슈...]

### Constitution ↔ All
[Step 3에서 확인한 준수 여부...]

## Identified Blockers

### High Priority (🔴)
[Step 4에서 식별한 고우선순위 차단 요소들...]

### Medium Priority (🟡)
[Step 4에서 식별한 중우선순위 이슈들...]

### Low Priority (🟢)
[Step 4에서 식별한 저우선순위 이슈들...]

## Current Status
- Current Phase: [Phase 번호] - [Phase Name]
- Estimated Remaining: [N] hours
```

### 5.2 Spec-Kit 명령 실행

Draft 파일 경로를 전달하여 SlashCommand 도구로 `/speckit.analyze` 명령을 실행합니다:

```
/speckit.analyze .specify/temp/analyze-draft.md

INSTRUCTION: Read the draft file at the path above using the Read tool. This draft contains ALL the analysis results including document status, alignment checks, and identified blockers. You MUST skip all data gathering and analysis steps (Step 1-4) and proceed directly to generating the comprehensive analysis report. Use ONLY the information from the draft file. Do NOT ask the user for any additional information or re-analyze the documents. Process all content in the user's system language.
```

spec-kit 명령어는 draft 파일을 읽어서 사용자의 시스템 언어로 다음과 같은 리포트를 생성합니다:

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

```markdown
# Project Analysis Report

**Date**: [현재 날짜]

## Overall Status

📊 **Progress**: [완료된 작업] / [전체 작업] ([%]%)

🎯 **Current Phase**: Phase [N] - [Phase Name]

⏱️ **Estimated Remaining**: [N] hours

## Document Status

| Document | Status | Completeness | Issues |
|----------|--------|--------------|--------|
| Constitution | ✅ | 100% | 0 |
| Specification | ⚠️ | 85% | 2 open questions |
| Plan | ✅ | 100% | 0 |
| Tasks | 🔄 | 60% | 3/5 complete |

## Alignment Check

✅ Constitution ↔ Specification: Aligned
✅ Specification ↔ Plan: Aligned
⚠️ Plan ↔ Tasks: 1 phase not broken down

## Blockers

### High Priority (🔴)

1. **[Blocker Name]**
   - Impact: [영향 설명]
   - Action: [해결 방법]

### Medium Priority (🟡)

[...]

## Recommendations

1. **Immediate**: [즉시 해야 할 것]
2. **Next**: [다음 단계]
3. **Future**: [추후 고려사항]

## Next Actions

1. `/speckit:clarify` - Resolve open questions
2. `/speckit:implement` - Continue Task [N]
3. `/speckit:checklist` - Run quality gates
```

## When to Use

- 스프린트 시작 시
- 중요 마일스톤 전
- 진행이 막혔다고 느낄 때
- 전체 상황 파악이 필요할 때

## Next Steps

분석 결과에 따라:
- Open Questions 많음 → `/spec-kit:clarify`
- 작업 완료율 낮음 → `/spec-kit:implement`
- 품질 확인 필요 → `/spec-kit:checklist`
- 계획 수정 필요 → `/spec-kit:plan`

---

**참고**:
- 정기적인 분석으로 프로젝트가 올바른 방향으로 가고 있는지 확인합니다
- 우리 플러그인(/spec-kit:analyze)은 분석 범위 및 초점 결정 역할
- 실제 상태 분석 및 리포트 생성은 spec-kit 명령어(/speckit.analyze)가 담당
