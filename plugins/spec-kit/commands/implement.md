---
description: 작업 목록에 따라 실제 구현 시작
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Implement Tasks

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 작업 확인, 진행 상황 보고, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

작업 목록(tasks)을 기반으로 실제 코드 구현을 시작합니다.

## Prerequisites

작업 목록이 먼저 존재해야 합니다:

```bash
cat .specify/memory/tasks.md
```

없다면 `/spec-kit:tasks`를 먼저 실행하세요.

## Step 1: Review Tasks

작업 목록을 읽고:
- 다음 작업 식별 (완료되지 않은 첫 번째 작업)
- 의존성 확인 (차단 작업 없는지)
- 수용 기준 확인

## Step 2: Confirm Task

사용자에게 확인:

```
다음 작업을 시작할까요?

**Task [번호]: [작업명]**

Description: [작업 설명]

Acceptance Criteria:
- [ ] [기준 1]
- [ ] [기준 2]

Estimate: [시간]

계속 진행하시겠습니까? (예/아니오)
```

## Step 3: Implement

작업 수용 기준을 하나씩 달성:

1. **필요한 파일 읽기**
   ```bash
   # 관련 파일 탐색
   grep -r "function_name" src/
   ```

2. **코드 작성/수정**
   - Write 또는 Edit 도구 사용
   - 헌법의 코드 품질 기준 준수
   - 계획의 아키텍처 패턴 따르기

3. **테스트 작성**
   - 유닛 테스트
   - 통합 테스트 (필요시)

4. **검증**
   ```bash
   # 테스트 실행
   npm test

   # 린트
   npm run lint

   # 타입 체크 (TypeScript의 경우)
   npm run type-check
   ```

## Step 4: Update Progress

작업 완료 시 tasks.md 업데이트:

```bash
# tasks.md의 체크박스를 완료로 표시
# - [ ] Task X → - [x] Task X
```

## Step 5: Review Acceptance Criteria

모든 수용 기준이 충족되었는지 확인:
- [ ] 기능 동작 확인
- [ ] 테스트 통과
- [ ] 코드 품질 기준 충족
- [ ] 문서 업데이트 (필요시)

## Step 6: Commit (Optional)

작업 완료 후 커밋:

```bash
git add .
git commit -m "feat: [작업 설명]"
```

## Step 7: Save Draft and Execute Spec-Kit Command

### 7.1 수집된 정보를 Draft 파일로 저장

먼저 `.specify/temp/` 디렉토리가 있는지 확인하고 없으면 생성:

```bash
mkdir -p .specify/temp
```

Write 도구를 사용하여 수집된 정보를 `.specify/temp/implement-draft.md` 파일로 저장합니다:

```markdown
# Implement Draft

## Current Task

### Task [번호]: [작업명]

**Description**: [Step 1-2에서 확인한 작업 설명]

**Acceptance Criteria**:
- [기준 1]
- [기준 2]

**Estimate**: [시간]

**Dependencies**: [의존성 정보]

## Related Files
[Step 3에서 확인한 관련 파일들...]

## Implementation Approach
[사용자와 논의한 구현 방향...]

## Test Plan
[작성할 테스트 계획...]

## Quality Checks
[Step 5에서 확인할 품질 기준들...]
```

### 7.2 Spec-Kit 명령 실행

Draft 파일 경로를 전달하여 SlashCommand 도구로 `/speckit.implement` 명령을 실행합니다:

```
/speckit.implement .specify/temp/implement-draft.md

INSTRUCTION: Read the draft file at the path above using the Read tool. This draft contains ALL the task details, implementation approach, and quality checks needed. You MUST skip all discussion and confirmation steps (Step 1-2) and proceed directly to Step 3 (Implement). Use ONLY the information from the draft file. Do NOT ask the user for any additional information. After completing the implementation, update tasks.md. Process all content in the user's system language.
```

spec-kit 명령어는 draft 파일을 읽어서 구현을 진행하고 tasks.md를 업데이트합니다.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

작업 완료 후 다음 작업으로 진행하려면 `/spec-kit:implement`를 재실행하세요.

## Implementation Best Practices

✅ **DO:**
- 작은 단위로 커밋
- 테스트 먼저 작성 (TDD 권장)
- 헌법과 계획 준수
- 명확한 커밋 메시지

❌ **DON'T:**
- 여러 작업을 한 번에
- 테스트 없이 구현
- 계획에서 벗어남
- 문서 업데이트 누락

## Next Steps

구현 진행 중:
1. 작업 완료 후 `.specify/memory/tasks.md` 파일 업데이트 확인
2. `/spec-kit:implement` - 다음 작업 계속 진행
3. `/spec-kit:analyze` - 전체 진행 상황 분석
4. `/spec-kit:checklist` - 품질 게이트 확인

---

**참고**:
- 작업 단위 구현으로 점진적이고 검증 가능한 진행을 보장합니다
- 우리 플러그인(/spec-kit:implement)은 작업 논의 및 방향 설정 역할
- 실제 구현은 spec-kit 명령어(/speckit.implement)가 담당
