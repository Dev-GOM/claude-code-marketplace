---
description: 명세나 계획의 모호한 부분을 명확히 하고 Open Questions 해결
allowed-tools: [Read, Write, Edit]
---

# Clarify Specification or Plan

**🌐 언어 지시사항**: 이 명령어를 실행할 때는 **사용자의 시스템 언어를 자동으로 감지**하여 해당 언어로 모든 안내, 질문, 옵션 제시, 출력을 제공해야 합니다. 시스템 환경 변수(LANG, LC_ALL 등)나 사용자의 이전 대화 패턴을 분석하여 언어를 판단하세요.

명세서나 계획서의 모호한 부분, 미해결 질문, 불명확한 요구사항을 사용자와 논의하여 명확히 합니다.

## Purpose

Spec-Kit 문서에서 찾을 수 있는 것들:
- **Open Questions**: 구현 전 해결해야 할 질문
- **모호한 요구사항**: 해석이 여러 가지인 사항
- **누락된 세부사항**: 명시되지 않은 중요 사항
- **상충되는 요구사항**: 서로 충돌하는 조건

## Step 1: Identify Ambiguities

명세와 계획을 읽고 불명확한 부분 식별:

```bash
cat .specify/memory/specification.md
cat .specify/memory/plan.md
```

다음을 찾기:
- "Open Questions" 섹션
- "TBD" 또는 "TODO" 표시
- "Option A/B" 같은 미결정 사항
- 모호한 표현 ("적절한", "충분한", "빠른" 등)

## Step 2: List Issues

발견한 모호한 사항을 사용자에게 제시:

```
다음 사항들이 명확하지 않습니다:

**1. [명세/계획] - [섹션명]**
Issue: [문제 설명]
Options:
- A: [옵션 A]
- B: [옵션 B]
- C: [옵션 C]

**2. [명세/계획] - [섹션명]**
Issue: [문제 설명]
...

어떤 것부터 명확히 하시겠습니까?
```

## Step 3: Discuss and Resolve

각 이슈에 대해:

1. **배경 설명**: 왜 이것이 중요한가?
2. **옵션 제시**: 가능한 선택지와 장단점
3. **추천**: 헌법과 계획 기반 권장사항
4. **결정**: 사용자 의사결정
5. **영향 분석**: 다른 부분에 미치는 영향

## Step 4: Spec-Kit 명령 실행

모든 이슈가 명확해지면, 해결된 내용을 정리하여 spec-kit 명령어에 전달합니다:

**수집된 정보 정리:**
Step 1-3에서 식별하고 해결한 모호한 부분들을 다음 형식으로 정리:

```
해결된 이슈:

1. [명세/계획] - [섹션명]
   Issue: [원래 모호했던 내용]
   Resolution: [명확해진 내용]
   Rationale: [이렇게 결정한 이유]

2. [명세/계획] - [섹션명]
   Issue: [원래 모호했던 내용]
   Resolution: [명확해진 내용]
   Rationale: [이렇게 결정한 이유]

영향받는 섹션:
- specification.md: [섹션명] - [변경 내용]
- plan.md: [섹션명] - [변경 내용]

제거할 Open Questions:
- [질문 1]
- [질문 2]
```

**SlashCommand 도구로 실행:**
정리된 정보를 인자로 전달하여 `/speckit.clarify` 명령을 실행합니다:

```
/speckit.clarify <위에서 정리한 정보 전체 + 사용자의 시스템 언어로 모든 내용을 작성하세요>
```

spec-kit 명령어는 이 정보를 받아서 사용자의 시스템 언어로:
- Open Questions 섹션에서 해결된 항목 제거
- 요구사항 섹션에 명확한 내용 추가
- 수용 기준에 구체적 조건 추가
- Open Technical Questions 제거
- 기술 스택 결정 반영
- 변경 로그 기록

## Example Clarification

**Before (모호함):**
```
사용자가 사진을 빠르게 업로드할 수 있어야 한다.
```

**Questions:**
- "빠르게"의 기준은?
- 얼마나 많은 사진?
- 진행 표시는?

**After (명확함):**
```
사용자가 한 번에 최대 100장의 사진을 업로드할 수 있어야 한다.
- 각 사진은 20MB 이하
- 업로드 시간: 10MB당 < 2초 (평균 브로드밴드)
- 진행률 바와 현재/총 카운트 표시
- 실패한 사진은 재시도 옵션 제공
```

## When to Use

- 구현 시작 전에
- 리뷰에서 모호함 지적받았을 때
- 팀원들의 해석이 다를 때
- Open Questions가 많을 때

## Next Steps

명확화 후:
1. `.specify/memory/specification.md` 및 `plan.md` 파일 업데이트 확인
2. 필요시 명세 재검토: `/spec-kit:specify`
3. 필요시 계획 업데이트: `/spec-kit:plan`
4. 작업 조정: `/spec-kit:tasks`
5. 구현 진행: `/spec-kit:implement`

---

**참고**:
- 명확한 명세와 계획은 잘못된 구현을 방지합니다
- 우리 플러그인(/spec-kit:clarify)은 모호한 부분 식별 및 논의 역할
- 실제 문서 업데이트는 spec-kit 명령어(/speckit.clarify)가 담당
