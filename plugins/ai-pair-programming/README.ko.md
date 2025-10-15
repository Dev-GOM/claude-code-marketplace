# AI 페어 프로그래밍 스위트

> **지능형 AI 어시스턴트로 코딩 워크플로우를 혁신하세요**

슬래시 커맨드, 전문 에이전트, 스마트 훅을 통합하여 완벽한 AI 페어 프로그래밍 경험을 제공하는 Claude Code 플러그인입니다.

## 🌟 주요 기능

이 플러그인은 Claude Code의 세 가지 강력한 기능을 통합합니다:

### 📝 슬래시 커맨드
AI 프로그래밍 지원에 빠르게 접근:
- `/pair` - 대화형 페어 프로그래밍 세션 시작
- `/review` - 종합적인 코드 리뷰 받기
- `/suggest` - 지능형 개선 제안 받기
- `/fix` - 버그 자동 감지 및 수정
- `/explain` - 상세한 코드 설명 받기

### 🤖 전문 에이전트
개발의 다양한 측면을 담당하는 특화된 AI 어시스턴트:
- `@code-reviewer` - 보안, 품질, 베스트 프랙티스 전문가
- `@bug-hunter` - 버그 감지 및 수정 전문가
- `@architect` - 소프트웨어 아키텍처 및 설계 컨설턴트
- `@performance-expert` - 성능 최적화 전문가

### 🔔 지능형 훅
워크플로우 전반에 걸친 자동 품질 체크:
- **PostToolUse**: 중요한 변경 후 코드 리뷰 제안
- **PreToolUse**: git 커밋 전 품질 검증
- **SessionEnd**: 종합 세션 리포트 생성

## 🚀 설치

### 빠른 설치

```bash
# 마켓플레이스 추가 (아직 추가하지 않았다면)
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# 플러그인 설치
/plugin install ai-pair-programming@dev-gom-plugins

# Claude Code 재시작
claude -r
```

### 설치 확인

```bash
/plugin
```

활성화된 플러그인 목록에 "ai-pair-programming"이 표시되어야 합니다.

## 📖 사용법

### 페어 프로그래밍 세션 시작

```bash
/pair
```

AI 페어 프로그래밍 모드가 활성화되면 Claude가:
- 구현 전에 명확한 질문을 합니다
- 추론과 설계 결정을 설명합니다
- 대안과 트레이드오프를 제안합니다
- 잠재적 실수를 조기에 발견합니다
- 지식과 베스트 프랙티스를 공유합니다

### 코드 리뷰 받기

```bash
# 최근 변경사항 리뷰
/review

# 특정 파일 리뷰
/review src/components/auth.js
```

`@code-reviewer` 에이전트가 분석하는 항목:
- **보안**: 인증, 입력 검증, 취약점
- **코드 품질**: 가독성, 네이밍, 구조
- **성능**: 알고리즘 효율성, 최적화 기회
- **베스트 프랙티스**: 디자인 패턴, 에러 핸들링, 테스팅
- **잠재적 버그**: 엣지 케이스, null 체크, 로직 오류

### 개선 제안 요청

```bash
# 최근 변경사항에 대한 제안
/suggest

# 특정 파일에 대한 제안
/suggest src/utils/api.js
```

제공되는 내용:
- 리팩토링 기회
- 설계 개선
- 성능 최적화
- 코드 현대화 제안
- 유지보수성 향상

### 버그 수정

```bash
# 에러 메시지로 디버깅
/fix "TypeError: Cannot read property 'length' of undefined"

# 특정 파일 디버깅
/fix src/services/payment.js
```

`@bug-hunter` 에이전트의 작업 과정:
1. 에러 메시지에서 문제 식별
2. 근본 원인 분석
3. 여러 수정 방법 제안
4. 최선의 솔루션 구현
5. 재발 방지를 위한 테스트 제안

### 코드 설명 받기

```bash
# 파일 설명
/explain src/hooks/useAuth.ts

# 개념 설명
/explain "인증 플로우가 어떻게 작동하나요"
```

설명 내용:
- 전체적인 개요
- 컴포넌트 분석
- 실행 흐름 설명
- 디자인 패턴 및 베스트 프랙티스
- 구체적인 예시

### 전문 에이전트 직접 호출

대화에서 에이전트를 직접 호출할 수 있습니다:

```
@code-reviewer auth.ts의 인증 로직을 리뷰해주세요

@bug-hunter WebSocket 연결에서 메모리 누수가 있어요

@architect 마이크로서비스 통신을 어떻게 구조화해야 할까요?

@performance-expert 대시보드 로딩이 느린데 분석해줄 수 있나요?
```

## 🔧 동작 원리

### 지능형 훅 시스템

플러그인은 훅을 사용하여 능동적인 지원을 제공합니다:

1. **코드 작성 후** (PostToolUse)
   - 파일 변경 추적
   - 5개 파일 변경 또는 5분 후 리뷰 제안
   - 일관된 품질 유지 지원

2. **Git 커밋 전** (PreToolUse)
   - 코드가 리뷰되었는지 확인
   - 리뷰되지 않은 변경사항 경고
   - 문제가 있는 코드 커밋 방지

3. **세션 종료** (SessionEnd)
   - 요약 리포트 생성
   - 통계 제공
   - 다음 작업 추천

### 상태 추적

플러그인은 `.state/review-state.json`에 상태를 유지합니다:
```json
{
  "fileChanges": 0,
  "lastReviewTime": 1634567890000
}
```

추적하는 정보:
- 마지막 리뷰 이후 변경된 파일 수
- 마지막 코드 리뷰 시간
- 세션 통계

### 생성되는 리포트

세션 종료 시 `.pair-programming-session.md`를 생성합니다:

```markdown
# AI 페어 프로그래밍 세션 리포트

**세션 종료:** 2024-10-16 14:30:00

## 세션 통계
- **수정된 파일:** 7
- **마지막 코드 리뷰:** 2024-10-16 14:15:00

## 권장사항
✅ 코드가 안정적입니다. 커밋하기 좋은 시점입니다!
```

## 🎯 워크플로우 예시

플러그인을 사용한 일반적인 워크플로우:

```bash
# 1. 페어 프로그래밍 시작
/pair
# Claude: "함께 멋진 것을 만들어봅시다! 무엇을 작업하고 싶으신가요?"

# 2. AI 지원으로 기능 구현
"사용자 인증을 추가해볼게요"
# Claude가 설계 및 구현을 돕습니다...

# 3. 5개 파일 변경 후 자동 제안이 나타남
# 💡 팁: 중요한 변경사항이 있습니다. /review 실행을 고려해보세요

# 4. 코드 리뷰 요청
/review
# @code-reviewer가 상세한 분석 제공

# 5. 발견된 이슈 수정
@bug-hunter JWT 검증 이슈를 수정해주세요

# 6. 커밋 전 검증 발생
git commit -m "인증 추가"
# ⚠️ 커밋 전 체크: 품질 확인을 위해 /review를 실행하세요

# 7. 최종 리뷰
/review

# 8. 코드 커밋
git commit -m "인증 추가"

# 9. 세션 종료 - 자동 리포트 생성
# 🎯 세션 완료! 리포트가 .pair-programming-session.md에 저장되었습니다
```

## ⚙️ 설정

### 플러그인 설정

플러그인은 `hooks/hooks.json`을 사용하여 설정합니다. 주요 설정:

```json
{
  "configuration": {
    "reviewThresholds": {
      "fileChangeCount": 5,           // 리뷰 제안 전 파일 수
      "timeIntervalMinutes": 5,        // 리뷰 제안 전 분 수
      "preCommitWarningFiles": 3,      // 커밋 전 경고 파일 수
      "preCommitWarningMinutes": 10    // 커밋 전 경고 분 수
    },
    "outputFiles": {
      "sessionReport": ".pair-programming-session.md",
      "reviewState": ".state/review-state.json"
    },
    "features": {
      "autoReviewSuggestion": true,    // 자동 리뷰 제안 활성화
      "preCommitValidation": true,     // 커밋 전 경고 활성화
      "sessionReporting": true         // 세션 리포트 활성화
    }
  }
}
```

**환경 변수:**
- `${CLAUDE_PLUGIN_ROOT}`: 플러그인 루트 디렉토리로 자동 확인
- 훅 명령어에서 올바른 스크립트 경로를 보장하기 위해 사용

### 에이전트 커스터마이징

에이전트는 `agents/` 디렉토리에 YAML frontmatter가 있는 Markdown 파일로 정의됩니다.

예시 (`agents/code-reviewer.md`):
```markdown
---
name: code-reviewer
description: 사용자 정의 설명
tools: Read, Grep, Glob
model: sonnet
---

사용자 정의 시스템 프롬프트를 여기에 작성...
```

**에이전트 속성:**
- `name`: 고유 식별자 (소문자와 하이픈 사용)
- `description`: 에이전트를 호출할 시점
- `tools`: 쉼표로 구분된 허용 도구 목록
- `model`: 사용할 모델 (sonnet, opus, haiku 또는 inherit)

### 특정 훅 비활성화

`hooks/hooks.json`을 편집하여 훅 비활성화:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "enabled": false,  // 이 훅 비활성화
        ...
      }
    ]
  }
}
```

또는 전체 플러그인 비활성화:
```bash
/plugin disable ai-pair-programming
```

## 📊 출력 파일

플러그인이 생성하는 파일들:

- `.state/review-state.json` - 세션 상태 추적
- `.pair-programming-session.md` - 세션 리포트

원하는 경우 `.gitignore`에 추가:
```gitignore
.state/
.pair-programming-session.md
```

## 🐛 문제 해결

### 플러그인이 작동하지 않음

1. 플러그인 설치 확인:
   ```bash
   /plugin
   ```

2. Node.js 사용 가능 여부 확인:
   ```bash
   node --version
   ```

3. 에러 확인:
   ```bash
   claude --debug
   ```

### 훅이 트리거되지 않음

1. 설정에서 훅이 활성화되어 있는지 확인
2. 훅 이벤트 이름이 일치하는지 확인
3. 스크립트 권한 확인 (Unix):
   ```bash
   chmod +x plugins/ai-pair-programming/scripts/*.js
   ```

### 에이전트가 응답하지 않음

1. 에이전트 Markdown 파일에 유효한 YAML frontmatter가 있는지 확인
2. 에이전트 이름이 일치하는지 확인 (`@agent-name` 형식 사용)
3. agents 디렉토리가 올바르게 설정되었는지 확인
4. 에이전트 파일이 `.json`이 아닌 `.md` 확장자를 사용하는지 확인

## 🤝 기여하기

플러그인을 자유롭게 커스터마이징하세요:

1. 저장소 포크
2. 에이전트, 커맨드 또는 훅 수정
3. `/plugin validate`로 테스트
4. 개선사항 공유!

## 📄 라이선스

MIT 라이선스 - 자유롭게 사용하고 수정하세요.

## 🙏 크레딧

Claude Code 커뮤니티를 위해 개발자 생산성 향상을 목표로 제작되었습니다.

---

**AI와 함께 즐거운 코딩 되세요!** 🚀

이슈나 제안사항이 있으시면 GitHub에서 이슈를 열어주세요.
