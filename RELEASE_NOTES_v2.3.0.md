# Dev GOM Plugins v2.3.0

> 2025-10-21

## 🚀 주요 변경사항

### Spec-Kit: 토큰 효율성 최적화

**v2.3.0**에서는 `/spec-kit:tasks` 커맨드 워크플로우를 완전히 재설계하여 **토큰 사용량을 50% 절감**하고, **코드를 35% 축소**했습니다.

#### 핵심 개선사항

1. **🎯 CLI 자동 파싱 활용**
   - GitHub Spec-Kit CLI가 `spec.md`와 `plan.md`를 직접 자동 파싱
   - 플러그인은 중복 정보 수집 없이 사전 검증 및 추가 컨텍스트 수집에만 집중
   - 사용자 스토리, 우선순위, 기술 스택 등을 자동으로 추출

2. **⚡ 토큰 절약**
   - 중복 질문 제거로 ~50% 토큰 절감
   - Step 4-7 (145줄) 제거: 수동 작업 수집 단계 삭제
   - Draft 파일 생성 단계 제거: CLI가 원본 문서 직접 읽기
   - 코드: 415줄 → 270줄 (35% 감소)

3. **✨ 선택적 컨텍스트 수집**
   - 필요시에만 추가 컨텍스트 입력
   - 옵션: 특정 작업 포함/제외, 우선순위 조정, 시간 제약, 테스트 전략
   - 기본값: 자동 생성 (권장)

4. **🔄 최적화된 워크플로우**
   ```
   이전: Plugin (정보 수집) → Draft 파일 → CLI (파싱) → tasks.md
   현재: Plugin (사전 검증) → CLI (직접 파싱) → tasks.md
   ```

## 📦 업데이트 방법

### 전체 마켓플레이스 업데이트

```bash
cd D:\Work\claude-code-marketplace
git pull
```

### Spec-Kit 플러그인만 업데이트

Claude Code Settings에서:
1. Extensions → Plugins 섹션 이동
2. `spec-kit` 플러그인 찾기
3. "Update" 버튼 클릭

또는 명령어:

```bash
# 플러그인 재설치
rm -rf ~/.claude/plugins/spec-kit
claude-code plugin install dev-gom-plugins/spec-kit
```

## 🔄 Breaking Changes

**없음** - 이번 버전은 하위 호환성을 유지합니다.

- 기존 `spec.md`, `plan.md` 파일 포맷 그대로 사용 가능
- 기존 워크플로우 그대로 동작
- 추가 마이그레이션 불필요

## 📝 변경된 파일

| 파일 | 변경 내용 |
|------|----------|
| `plugins/spec-kit/commands/tasks.md` | 워크플로우 재설계 (415→270줄) |
| `plugins/spec-kit/.claude-plugin/plugin.json` | 버전 업데이트 (2.2.0→2.3.0) |
| `.claude-plugin/marketplace.json` | 버전 업데이트 (2.2.0→2.3.0) |
| `plugins/spec-kit/README.md` | 영문 changelog 추가 |
| `plugins/spec-kit/README.ko.md` | 한글 changelog 추가 |
| `README.md` | 루트 changelog 업데이트 |
| `README.ko.md` | 루트 변경 이력 업데이트 |

## 📊 통계

- **코드 감소**: 415줄 → 270줄 (35% ↓)
- **토큰 절약**: ~50% 절감
- **파일 변경**: 8개 파일
- **추가**: +242줄, **삭제**: -122줄

## 🔗 이전 버전

- [v2.2.0](https://github.com/Dev-GOM/claude-code-marketplace/releases/tag/v2.2.0) - SlashCommand 통합 및 Git 설정
- [v2.0.0](https://github.com/Dev-GOM/claude-code-marketplace/releases/tag/v2.0.0) - 브랜치 기반 워크플로우

## 🐛 알려진 이슈

없음

## 💬 피드백

문제가 발생하거나 제안사항이 있으시면 [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)에 등록해주세요.

---

**Full Changelog**: https://github.com/Dev-GOM/claude-code-marketplace/compare/v2.2.0...v2.3.0
