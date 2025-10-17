---
description: 헌법의 품질 게이트(Quality Gates) 체크리스트 실행
allowed-tools: [Read, Bash]
---

# Run Quality Gates Checklist

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

## Step 5: Spec-Kit 명령 실행

체크리스트 유형을 결정한 후, 실행할 체크 항목을 정리하여 spec-kit 명령어에 전달합니다:

**수집된 정보 정리:**
Step 1-4에서 결정한 체크리스트 유형과 실행할 항목들을 다음 형식으로 정리:

```
체크리스트 유형: Pre-Merge / Pre-Release

실행할 자동화 체크:
- Lint: npm run lint
- Tests: npm test
- Coverage: npm run test:coverage (목표: >= 80%)
- Type Check: tsc --noEmit
- Bundle Size: npm run analyze (목표: < 50 KB)
- Security: npm audit

실행할 수동 체크:
- Accessibility: Lighthouse score > 90
- Keyboard navigation
- Screen reader compatibility
- Documentation: README, API docs, Changelog
- Code Review: 승인 상태

현재 상태:
[이미 알고 있는 상태 정보가 있다면 여기에 추가]
```

**SlashCommand 도구로 실행:**
정리된 정보를 인자로 전달하여 `/speckit.checklist` 명령을 실행합니다:

```
/speckit.checklist <위에서 정리한 정보 전체 + 사용자의 시스템 언어로 모든 내용을 작성하세요>
```

spec-kit 명령어는 이 정보를 받아서 사용자의 시스템 언어로 위의 Step 1-4 프로세스를 실행하고 결과 리포트를 생성합니다.

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

---

**참고**:
- 품질 게이트는 코드 품질과 프로젝트 기준 준수를 보장합니다
- 우리 플러그인(/spec-kit:checklist)은 체크리스트 유형 선택 및 결과 논의 역할
- 실제 품질 게이트 실행 및 리포트 생성은 spec-kit 명령어(/speckit.checklist)가 담당
