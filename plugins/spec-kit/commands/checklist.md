---
description: 헌법의 품질 게이트(Quality Gates) 체크리스트 실행
allowed-tools: [Read, Bash, Write, SlashCommand]
argument-hint: <specific-gate | 특정 게이트>
---

# Run Quality Gates Checklist

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

⚠️ **커맨드 구분**: 이것은 **플러그인 커맨드** (/spec-kit:checklist)입니다. 정보 수집과 사용자 논의를 담당합니다. 실제 파일 생성/업데이트는 GitHub Spec-Kit CLI 커맨드 (/speckit.checklist)가 수행합니다.

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 체크리스트, 리포트, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

헌법에 정의된 품질 게이트를 실행하여 코드가 프로젝트 기준을 충족하는지 확인합니다.

## Purpose

다음을 검증합니다:
- 코드 품질 기준
- 테스트 커버리지
- 성능 예산
- 보안 요구사항
- 접근성 기준
- 문서화 완성도

## Step 1: Load Quality Gates

헌법에서 품질 게이트 읽기:

```bash
cat .specify/memory/constitution.md
```

"Quality Gates" 섹션 찾기:
- Pre-Merge Checklist
- Pre-Release Checklist

## Step 2: Run Automated Checks

자동화 가능한 체크 실행:

### Code Quality

```bash
# Lint
npm run lint
# or
eslint src/

# Format check
npm run format:check
# or
prettier --check src/
```

**Result**: ✅ Pass / ❌ Fail

### Testing

```bash
# Run tests
npm test

# Coverage report
npm run test:coverage
```

**Expected**: Coverage >= 80%
**Actual**: [%]%
**Result**: ✅ Pass / ❌ Fail

### Type Checking (TypeScript)

```bash
npm run type-check
# or
tsc --noEmit
```

**Result**: ✅ Pass / ❌ Fail

### Performance

```bash
# Build
npm run build

# Bundle size check
npm run analyze
```

**Expected**: < 50 KB gzipped
**Actual**: [N] KB
**Result**: ✅ Pass / ❌ Fail

### Security

```bash
# Dependency audit
npm audit

# Check for vulnerabilities
npm audit --audit-level=moderate
```

**Result**: ✅ Pass / ❌ Fail ([N] vulnerabilities)

## Step 3: Manual Checks

자동화할 수 없는 항목 확인:

### Accessibility

- [ ] Lighthouse Accessibility Score > 90
- [ ] Keyboard navigation tested
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA

**How to check:**
```bash
# Lighthouse CI
npm run lighthouse
# or
lighthouse https://localhost:3000 --view
```

### Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Changelog updated
- [ ] Migration guide (if breaking changes)

### Code Review

- [ ] Peer review approved
- [ ] No unresolved comments
- [ ] Security-sensitive code double-checked

## Step 4: Generate Report

체크리스트 결과 요약:

```markdown
# Quality Gates Report

**Date**: [현재 날짜]
**Checklist Type**: Pre-Merge / Pre-Release

## Automated Checks

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Lint | No errors | 0 errors | ✅ |
| Tests | All pass | 45/45 | ✅ |
| Coverage | >= 80% | 85% | ✅ |
| Type Check | No errors | 0 errors | ✅ |
| Bundle Size | < 50 KB | 42 KB | ✅ |
| Security | 0 vulnerabilities | 0 | ✅ |

## Manual Checks

| Check | Status | Notes |
|-------|--------|-------|
| Lighthouse | ✅ | Score: 95 |
| Accessibility | ✅ | WCAG AA compliant |
| Documentation | ⚠️ | README needs update |
| Code Review | ✅ | Approved by @reviewer |

## Summary

**Overall**: ⚠️ Pass with Warnings

**Blockers**: 1
- README not updated

**Warnings**: 0

**Recommendations**:
1. Update README before merge
2. Consider adding more E2E tests
```

## Step 5: Save Draft and Execute Spec-Kit Command

### 5.1 수집된 정보를 Draft 파일로 저장

먼저 현재 기능의 drafts 디렉토리 생성:

```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# drafts 디렉토리 생성
mkdir -p "specs/$CURRENT_BRANCH/drafts"
```

Write 도구를 사용하여 수집된 정보를 `specs/$CURRENT_BRANCH/drafts/checklist-draft.md` 파일로 저장합니다:

```markdown
# Checklist Draft

## Checklist Type
[Pre-Merge / Pre-Release]

## Quality Gates from Constitution
[Step 1에서 로드한 헌법의 품질 게이트들...]

## Automated Checks

### Code Quality
- Command: npm run lint
- Expected: No errors
- Result: [Step 2 실행 결과]

### Testing
- Command: npm test
- Expected: All pass
- Result: [Step 2 실행 결과]

### Coverage
- Command: npm run test:coverage
- Expected: >= 80%
- Actual: [%]%
- Result: [Step 2 실행 결과]

### Type Check
- Command: tsc --noEmit
- Expected: No errors
- Result: [Step 2 실행 결과]

### Bundle Size
- Command: npm run analyze
- Expected: < 50 KB
- Actual: [N] KB
- Result: [Step 2 실행 결과]

### Security
- Command: npm audit
- Expected: 0 vulnerabilities
- Result: [Step 2 실행 결과]

## Manual Checks

### Accessibility
[Step 3에서 확인한 접근성 체크 결과들...]

### Documentation
[Step 3에서 확인한 문서화 체크 결과들...]

### Code Review
[Step 3에서 확인한 코드 리뷰 상태...]

## Summary
- Overall Status: [Pass / Pass with Warnings / Fail]
- Blockers: [N]개
- Warnings: [N]개
```

### 5.2 Spec-Kit 명령 실행

**⚠️ CRITICAL - MUST USE SLASHCOMMAND TOOL**:

You **MUST** now use the **SlashCommand tool** to execute the `/speckit.checklist` command. This is a required step - do not skip it!

Call the SlashCommand tool with the following command parameter (replace $CURRENT_BRANCH with the actual branch name):

```
/speckit.checklist INSTRUCTION: This command is being called from /spec-kit:checklist plugin. Current branch is "$CURRENT_BRANCH" and draft at "specs/$CURRENT_BRANCH/drafts/checklist-draft.md". Read draft. Draft contains ALL checklist results including automated check outputs and manual check statuses. Skip all execution steps (Step 1-3) and proceed directly to Step 4 (Generate Report). **CRITICAL - MUST FOLLOW:** 1. LANGUAGE: Process ALL content in user's system language. 2. ASKUSERQUESTION: Use AskUserQuestion tool if clarification needed. 3. REPORT GENERATION: Generate report from draft only, do NOT re-run checks.
```

The spec-kit command will read the draft file and execute Step 4 (Generate Report) to create the results report in the user's system language.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

## Pre-Merge vs Pre-Release

### Pre-Merge Checklist (빠른 체크)

- 테스트 통과
- Lint 통과
- 타입 체크 통과
- 코드 리뷰 승인

### Pre-Release Checklist (전체 체크)

- 모든 Pre-Merge 항목
- Lighthouse score
- 크로스 브라우저 테스트
- 성능 벤치마크
- 보안 스캔
- 문서 완성도

## Step 6: Fix Issues

실패한 항목이 있다면:

```
다음 항목이 실패했습니다:

❌ Test Coverage: 75% (expected: >= 80%)
   → Action: Add tests for [모듈명]

❌ Bundle Size: 58 KB (expected: < 50 KB)
   → Action: Enable tree-shaking, review dependencies

수정하시겠습니까? (예/아니오)
```

## When to Use

- 커밋 전
- PR 생성 전
- 릴리스 전
- CI/CD 파이프라인에서 자동 실행

## Integration with CI/CD

GitHub Actions 예제:

```yaml
name: Quality Gates
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build
      - run: npm audit
```

## Next Steps

모든 게이트 통과 시:
- 커밋/머지 진행
- 다음 작업: `/spec-kit:implement`

실패 시:
- 이슈 수정
- 재실행: `/spec-kit:checklist`

## What's Next?

AskUserQuestion 도구를 사용하여 사용자에게 다음 작업을 물어봅니다:

```json
{
  "questions": [{
    "question": "품질 게이트 확인이 완료되었습니다. 다음 단계로 무엇을 진행하시겠습니까?",
    "header": "다음 단계",
    "multiSelect": false,
    "options": [
      {
        "label": "다음 작업 계속 (/spec-kit:implement)",
        "description": "품질 게이트를 통과했다면 다음 작업을 계속 구현합니다. (권장)"
      },
      {
        "label": "체크리스트 재실행",
        "description": "이슈를 수정한 후 품질 게이트를 다시 확인합니다."
      },
      {
        "label": "전체 진행 상황 분석 (/spec-kit:analyze)",
        "description": "현재 프로젝트 상태를 종합적으로 분석합니다."
      },
      {
        "label": "Git 커밋/머지 진행",
        "description": "품질 게이트를 통과했으니 변경사항을 커밋하고 머지합니다."
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
- **다음 작업 계속** 선택 시 → `/spec-kit:implement` 명령 실행 안내
- **체크리스트 재실행** 선택 시 → `/spec-kit:checklist` 명령 재실행 안내
- **전체 진행 상황 분석** 선택 시 → `/spec-kit:analyze` 명령 실행 안내
- **Git 커밋/머지 진행** 선택 시 → git 작업 가이드 제공
- **다른 명령어 실행** 선택 시 → 사용자가 원하는 명령어 입력 요청
- **작업 완료** 선택 시 → 세션 종료

---

**참고**:
- 품질 게이트는 코드 품질과 프로젝트 기준 준수를 보장합니다
- 우리 플러그인(/spec-kit:checklist)은 체크리스트 유형 선택 및 결과 논의 역할
- 실제 품질 게이트 실행 및 리포트 생성은 spec-kit 명령어(/speckit.checklist)가 담당
