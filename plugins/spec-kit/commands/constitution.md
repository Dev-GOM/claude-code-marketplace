---
description: 프로젝트의 핵심 원칙과 기준을 정의하는 헌법(Constitution) 작성
allowed-tools: [Read, Write, Bash]
---

# Create Project Constitution

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 템플릿, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

프로젝트의 비협상 가능한 원칙과 기준을 정의합니다. 모든 기능, 계획, 구현은 이 헌법을 준수해야 합니다.

## Prerequisites

`.specify/` 디렉토리가 존재해야 합니다:

```bash
ls .specify/memory/
```

없다면 `/speckit:init`를 먼저 실행하세요.

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

## Step 4: Spec-Kit 명령 실행

모든 정보가 확인되면, 수집한 내용을 정리하여 spec-kit 명령어에 전달합니다:

**수집된 정보 정리:**
Step 1에서 수집한 모든 답변을 다음 형식으로 정리:

```
프로젝트 유형: [답변]
주요 사용자: [답변]
핵심 가치 (우선순위): [답변]
기술적 제약: [답변]
품질 기준: [답변]

원칙 1: [이름] - [구체적 요구사항]
원칙 2: [이름] - [구체적 요구사항]
...
```

**SlashCommand 도구로 실행:**
정리된 정보를 인자로 전달하여 `/speckit.constitution` 명령을 실행합니다:

```
/speckit.constitution <위에서 정리한 정보 전체 + 사용자의 시스템 언어로 모든 내용을 작성하세요>
```

spec-kit 명령어는 이 정보를 받아서 사용자의 시스템 언어로 `.specify/memory/constitution.md` 파일을 생성/업데이트합니다.

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
