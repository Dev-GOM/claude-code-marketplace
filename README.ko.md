# Claude Code 개발자 유틸리티

> **언어**: [English](README.md) | [한국어](README.ko.md)

일반적인 개발 워크플로우를 자동화하는 강력한 Claude Code 생산성 플러그인 모음입니다.

## 포함된 플러그인

### 1. Git 자동 백업
Claude Code 세션이 끝날 때마다 자동으로 git 커밋을 생성하여 작업 손실을 방지합니다.

**기능:**
- 세션 종료 시 모든 변경사항 자동 커밋
- 타임스탬프가 포함된 커밋 메시지
- 실제 변경사항이 있을 때만 커밋
- 안전하고 비침습적

**Hook:** `stop`

### 2. TODO 수집기
프로젝트 전체를 스캔하여 모든 TODO, FIXME, HACK, XXX, NOTE, BUG 주석을 수집합니다.

**기능:**
- 여러 프로그래밍 언어 지원
- 상세한 마크다운 리포트 생성
- 주석 유형 및 파일별로 그룹화
- `.todos-report.md`와 `.todos.txt` 생성
- `node_modules` 및 빌드 디렉토리 제외

**Hook:** `stop`

### 3. 코드 복잡도 모니터
코드 복잡도 지표를 모니터링하고 임계값을 초과하면 경고합니다.

**기능:**
- 순환 복잡도 계산
- 함수 및 파일 길이 확인
- 중첩 깊이 모니터링
- `.complexity-log.txt`에 이슈 기록
- 코드 변경 후 실시간 피드백

**임계값:**
- 순환 복잡도: 10
- 함수 길이: 50줄
- 파일 길이: 500줄
- 중첩 깊이: 4단계

**Hook:** `postToolUse` (Edit|Write)

### 4. 자동 문서 업데이터
코드 변경사항을 기반으로 프로젝트 문서를 자동으로 업데이트합니다.

**기능:**
- 프로젝트 정보로 README.md 업데이트
- CHANGELOG.md 유지 관리
- 의존성 및 스크립트 추적
- 문서 요약 생성
- 자동 생성 섹션 명확히 표시

**Hook:** `stop`

## 설치

### 빠른 시작 (권장)

1. Claude Code에서 마켓플레이스 추가:
   ```bash
   /plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
   ```

2. 플러그인 설치:
   ```bash
   /plugin install hook-git-auto-backup@dev-gom-plugins
   /plugin install hook-todo-collector@dev-gom-plugins
   /plugin install hook-complexity-monitor@dev-gom-plugins
   /plugin install hook-auto-docs@dev-gom-plugins
   ```

3. 플러그인을 로드하기 위해 Claude Code 재시작:
   ```bash
   claude
   # 또는
   claude -r  # 마지막 세션 재개
   # 또는
   claude -c  # 현재 디렉토리에서 계속
   ```

4. 플러그인 설치 확인:
   ```bash
   /plugin
   ```

### 로컬 설치 (개발용)

1. 이 저장소를 클론하고 이동
2. 로컬 마켓플레이스 추가:
   ```bash
   /plugin marketplace add dev-gom-plugins ./path/to/.claude-plugin/marketplace.json
   ```
3. 위와 같이 플러그인 설치

## 사용법

설치 후 플러그인은 자동으로 작동합니다:

- **Git 자동 백업**: Claude 세션 종료 후 커밋
- **TODO 수집기**: 세션 종료 시 TODO 스캔 및 리포트
- **복잡도 모니터**: Edit/Write 작업 후 코드 확인
- **자동 문서**: 세션 종료 시 문서 업데이트

## 설정

### 복잡도 임계값 커스터마이징

`.claude-plugin/plugins/complexity-monitor/check-complexity.js` 편집:

```javascript
const THRESHOLDS = {
  cyclomaticComplexity: 15,  // 사용자 정의 값
  functionLength: 100,       // 사용자 정의 값
  fileLength: 1000,         // 사용자 정의 값
  nesting: 5                // 사용자 정의 값
};
```

### TODO 패턴 커스터마이징

`.claude-plugin/plugins/todo-collector/collect-todos.js` 편집:

```javascript
const TODO_PATTERNS = [
  // 사용자 정의 패턴 추가
  /\/\/\s*(IMPORTANT|REVIEW)[\s:]+(.+)/gi,
];
```

### 특정 플러그인 비활성화

```bash
/plugin uninstall hook-git-auto-backup@dev-gom-plugins
```

## 출력 파일

플러그인은 프로젝트 루트에 다음 파일을 생성합니다:

- `.todos-report.md` - 상세한 TODO 리포트
- `.todos.txt` - 간단한 TODO 목록
- `.complexity-log.txt` - 복잡도 이슈 로그
- `.docs-summary.md` - 문서 업데이트 요약
- `CHANGELOG.md` - 프로젝트 변경 이력 (없으면 생성)

**팁:** 커밋하지 않으려면 `.gitignore`에 추가하세요:

```gitignore
.todos-report.md
.todos.txt
.complexity-log.txt
.docs-summary.md
```

## 요구사항

- Claude Code CLI
- Node.js (플러그인 스크립트 실행용)
- Git (git-auto-backup 플러그인용)

## 문제 해결

### 플러그인이 실행되지 않나요?

1. 플러그인 설치 확인:
   ```bash
   /plugin
   ```

2. 설정에서 hooks가 활성화되어 있는지 확인

3. Node.js가 PATH에 있는지 확인:
   ```bash
   node --version
   ```

### Git 커밋이 작동하지 않나요?

1. git 저장소인지 확인:
   ```bash
   git status
   ```

2. git이 구성되어 있는지 확인:
   ```bash
   git config user.name
   git config user.email
   ```

### 복잡도 모니터에서 오탐이 발생하나요?

프로젝트의 필요에 맞게 플러그인 설정 파일에서 임계값을 조정하세요.

## 기여

필요에 따라 이러한 플러그인을 자유롭게 커스터마이징하세요:

1. `.claude-plugin` 디렉토리 포크/복사
2. `plugins/[plugin-name]/`에서 플러그인 스크립트 수정
3. hook 동작을 변경하는 경우 `plugin.json` 업데이트
4. `/plugin validate .claude-plugin`로 테스트

## 라이선스

MIT 라이선스 - 프로젝트에 자유롭게 사용하고 수정하세요.

## 크레딧

자동화를 통해 개발자 생산성을 향상시키기 위해 Claude Code용으로 제작되었습니다.

---

**즐거운 코딩 되세요!** 🚀

문제나 제안사항이 있으면 GitHub에서 이슈를 열어주세요.
