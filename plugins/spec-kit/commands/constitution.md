---
description: 프로젝트의 핵심 원칙과 기준을 정의하는 헌법(Constitution) 작성
allowed-tools: [Read, Write, Bash]
argument-hint: <project-description | 프로젝트 설명>
---

# Create Project Constitution

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

프로젝트의 비협상 가능한 원칙과 기준을 정의합니다. 모든 기능, 계획, 구현은 이 헌법을 준수해야 합니다.

## Prerequisites

`.specify/` 디렉토리가 존재해야 합니다:

```bash
ls .specify/memory/
```

없다면 `/speckit:init`를 먼저 실행하세요.

## Step 0: Check Existing File and Choose Update Mode

기존 헌법 파일 확인:

```bash
cat .specify/memory/constitution.md
```

### If File Exists - Choose Update Mode

사용자에게 두 가지 옵션 제공:

**📋 Option 1: 완전 재생성 (Full Regeneration)**
- 처음부터 모든 정보를 다시 수집하여 새로 작성
- 기존 헌법은 참고용으로만 활용
- **추천 시점:**
  - 프로젝트 방향이 크게 변경되었을 때
  - 핵심 가치나 원칙을 근본적으로 바꾸고 싶을 때
  - 새로운 관점으로 헌법을 다시 정립하고 싶을 때

**✏️ Option 2: 부분 업데이트 (Incremental Update)**
- 기존 헌법을 보여주고 변경/추가할 부분만 질문
- 기존 내용과 새 내용을 merge하여 업데이트
- **추천 시점:**
  - 특정 원칙이나 기준만 수정하고 싶을 때
  - 새로운 품질 게이트 추가
  - 기술 표준 업데이트 (예: 새 플랫폼 지원)
  - 일부 원칙 개선 또는 명확화

**사용자 선택에 따라 진행:**
- Option 1 선택 시 → Step 1부터 정상 진행 (완전 재작성)
- Option 2 선택 시 → 기존 헌법 표시 + "어떤 부분을 업데이트하시겠습니까?" 질문 + 변경사항만 수집 후 merge

### If File Not Exists

Step 1부터 정상 진행 (처음 작성)

---

## Step 1: Understand Project Context

사용자에게 다음을 질문:

1. **프로젝트 유형**: 웹 앱, 모바일 앱, 라이브러리, CLI 도구 등
2. **주요 사용자**: 일반 사용자, 개발자, 기업 등
3. **핵심 가치**: 성능, 보안, 접근성, 단순성 등 (우선순위)
4. **기술적 제약**: 플랫폼 요구사항, 규정 준수, 팀 전문성
5. **품질 기준**: 테스트 커버리지, 문서화, 코드 리뷰 등

## Step 2: Draft Constitution

다음 섹션으로 헌법을 작성:

### Constitution Template

```markdown
# [Project Name] Constitution

## Vision

[1-2 문단: 프로젝트 목적과 목표]

## Core Principles

1. **[원칙명]**
   - [구체적 요구사항]
   - [구체적 요구사항]

[5-10개 핵심 원칙]

## Technical Standards

### Code Quality
- [기준]

### Testing
- [기준]

### Performance
- [기준]

### Security
- [기준]

### Browser/Platform Support
- [기준]

## Development Process

### Code Review
- [프로세스 요구사항]

### Documentation
- [프로세스 요구사항]

### Release
- [프로세스 요구사항]

## Quality Gates

### Pre-Merge Checklist
- [ ] [게이트]
- [ ] [게이트]

### Pre-Release Checklist
- [ ] [게이트]
- [ ] [게이트]

## Non-Goals

[명시적으로 하지 않을 것들 - 범위 제한]

---
**Version**: 1.0
**Last Updated**: [Date]
```

## Step 3: 검토 및 확인

수집된 정보로 작성한 헌법이 다음을 만족하는지 사용자와 함께 확인:
- 구체적이고 측정 가능한가?
- 현실적으로 달성 가능한가?
- 명확한 우선순위가 있는가?
- 2-3페이지 이내로 간결한가?

## Step 4: Save Draft and Execute Spec-Kit Command

### 4.1 수집된 정보를 Draft 파일로 저장

먼저 `.specify/temp/` 디렉토리가 있는지 확인하고 없으면 생성:

```bash
mkdir -p .specify/temp
```

Write 도구를 사용하여 수집된 정보를 `.specify/temp/constitution-draft.md` 파일로 저장합니다:

```markdown
# Constitution Draft

## Collected Information

### 프로젝트 유형
[Step 1에서 수집한 답변]

### 주요 사용자
[Step 1에서 수집한 답변]

### 핵심 가치 (우선순위)
[Step 1에서 수집한 답변]

### 기술적 제약
[Step 1에서 수집한 답변]

### 품질 기준
[Step 1에서 수집한 답변]

## Core Principles

### 원칙 1: [이름]
[구체적 요구사항]

### 원칙 2: [이름]
[구체적 요구사항]

[Step 2에서 작성한 모든 원칙들...]

## Technical Standards
[Step 2에서 작성한 기술 기준들...]

## Development Process
[Step 2에서 작성한 개발 프로세스...]

## Quality Gates
[Step 2에서 작성한 품질 게이트...]

## Non-Goals
[Step 2에서 작성한 비목표...]
```

### 4.2 Spec-Kit 명령 실행

Draft 파일 경로를 전달하여 SlashCommand 도구로 `/speckit.constitution` 명령을 실행합니다:

```
/speckit.constitution .specify/temp/constitution-draft.md

INSTRUCTION: Read the draft file at the path above using the Read tool. This draft contains ALL the information needed with all placeholders filled. You MUST skip Step 2 (Collect/derive values for placeholders) entirely and proceed directly to Step 3 (Draft the updated constitution content). Use ONLY the information from the draft file. Do NOT ask the user for any additional information. Process all content in the user's system language.
```

spec-kit 명령어는 draft 파일을 읽어서 `.specify/memory/constitution.md` 파일을 생성/업데이트합니다.

**토큰 절약 효과:**
- 긴 텍스트를 명령어 인자로 전달하지 않음
- 파일 경로만 전달하여 효율적
- Draft 파일로 디버깅 및 재사용 가능

## Next Steps

헌법 생성 후:
1. `.specify/memory/constitution.md` 파일 검토
2. 팀과 공유 및 정렬
3. `/spec-kit:specify` - 헌법을 준수하는 기능 명세 작성
4. 버전 관리에 커밋

---

**참고**:
- 헌법은 프로젝트의 북극성입니다. 모든 명세, 계획, 구현이 이 원칙에 부합해야 합니다.
- 우리 플러그인(/spec-kit:constitution)은 정보 수집 역할
- 실제 파일 생성은 spec-kit 명령어(/speckit.constitution)가 담당
