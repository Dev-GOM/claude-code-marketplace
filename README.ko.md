# Claude Code 개발자 유틸리티

> **언어**: [English](README.md) | [한국어](README.ko.md)

![Claude Code Session Log](images/claude-code-session-log.png)

일반적인 개발 워크플로우를 자동화하는 강력한 Claude Code 생산성 플러그인 모음입니다.

## 포함된 플러그인

### 1. 🔄 [Git Auto-Backup](plugins/hook-git-auto-backup/README.ko.md)

Claude Code 세션이 끝날 때마다 자동으로 git 커밋을 생성하여 작업 손실을 방지합니다.

**요약:** 세션 종료 시 타임스탬프와 함께 모든 변경사항 자동 커밋 | **Hook:** `Stop`

**[📖 전체 문서 보기 →](plugins/hook-git-auto-backup/README.ko.md)**

---

### 2. 📋 [TODO Collector](plugins/hook-todo-collector/README.ko.md)

프로젝트 전체를 스캔하여 모든 TODO, FIXME, HACK, XXX, NOTE, BUG 코멘트를 상세 리포트로 수집합니다.

**요약:** 다양한 언어 지원, 마크다운 리포트 생성 | **Hooks:** `PostToolUse` (Write|Edit|NotebookEdit), `Stop`

![TODO Report Example](images/todos-report.png)

**[📖 전체 문서 보기 →](plugins/hook-todo-collector/README.ko.md)**

---

### 3. 📊 [Code Complexity Monitor](plugins/hook-complexity-monitor/README.ko.md)

코드 복잡도 지표를 모니터링하고 임계값을 초과하면 경고합니다.

**요약:** 순환 복잡도, 함수/파일 길이, 중첩 깊이 추적 | **Hook:** `PostToolUse` (Edit|Write)

![Complexity Log Example](images/complexity-log.png)

**[📖 전체 문서 보기 →](plugins/hook-complexity-monitor/README.ko.md)**

---

### 4. 📝 [Auto Documentation Updater](plugins/hook-auto-docs/README.ko.md)

코드 변경사항을 기반으로 프로젝트 문서(README.md, CHANGELOG.md)를 자동으로 업데이트합니다.

**요약:** README 업데이트, CHANGELOG 유지, 의존성 추적 | **Hooks:** `PostToolUse` (Write), `Stop`

![Project Structure Example](images/project-structure.png)

**[📖 전체 문서 보기 →](plugins/hook-auto-docs/README.ko.md)**

---

### 5. 📊 [Session File Tracker](plugins/hook-session-summary/README.ko.md)

세션 동안 모든 파일 작업을 추적하고 디렉토리 트리 시각화가 포함된 요약 리포트를 생성합니다.

**요약:** 작업 유형별 파일 분류 (Created, Modified, Read) | **Hooks:** `PostToolUse` (Write|Edit|Read|NotebookEdit), `Stop`

![Session Summary Example](images/session-summary.png)

**[📖 전체 문서 보기 →](plugins/hook-session-summary/README.ko.md)**

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
   /plugin install hook-session-summary@dev-gom-plugins
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

- **Git Auto-Backup**: Claude 세션 종료 후 커밋
- **TODO Collector**: 세션 종료 시 TODO 스캔 및 리포트
- **Complexity Monitor**: Edit/Write 작업 후 코드 확인
- **Auto-Docs**: 세션 종료 시 문서 업데이트
- **Session File Tracker**: 세션 종료 시 파일 작업 요약

## 설정

각 플러그인은 완전히 커스터마이즈 가능합니다. 상세한 설정 옵션은:

- **[Git Auto-Backup 설정 →](plugins/hook-git-auto-backup/README.ko.md#설정)**
- **[TODO Collector 설정 →](plugins/hook-todo-collector/README.ko.md#설정)**
- **[Complexity Monitor 설정 →](plugins/hook-complexity-monitor/README.ko.md#설정)**
- **[Auto-Docs 설정 →](plugins/hook-auto-docs/README.ko.md#설정)**
- **[Session Tracker 설정 →](plugins/hook-session-summary/README.ko.md#설정)**

### 빠른 예제

**특정 플러그인 비활성화:**
```bash
/plugin uninstall hook-git-auto-backup@dev-gom-plugins
```

**복잡도 임계값 커스터마이즈:**
[Complexity Monitor 설정](plugins/hook-complexity-monitor/README.ko.md#설정) 참조

**커스텀 TODO 패턴 추가:**
[TODO Collector 설정](plugins/hook-todo-collector/README.ko.md#설정) 참조

## 출력 파일

플러그인은 프로젝트 루트에 다음 파일을 생성합니다:

- `.todos-report.md` - 상세한 TODO 리포트
- `.todos.txt` - 간단한 TODO 목록
- `.complexity-log.txt` - 복잡도 이슈 로그
- `.docs-summary.md` - 문서 업데이트 요약
- `.session-summary.md` - 세션 파일 작업 요약
- `CHANGELOG.md` - 프로젝트 변경 이력 (없으면 생성)

**팁:** 커밋하지 않으려면 `.gitignore`에 추가하세요:

```gitignore
.todos-report.md
.todos.txt
.complexity-log.txt
.docs-summary.md
.session-summary.md
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

## 개발

### 플러그인 개발자를 위한 정보

각 플러그인의 상세한 기술 문서는 해당 README에 있습니다:
- [Git Auto-Backup 기술 세부사항](plugins/hook-git-auto-backup/README.ko.md#기술-세부사항)
- [TODO Collector 기술 세부사항](plugins/hook-todo-collector/README.ko.md#기술-세부사항)
- [Complexity Monitor 기술 세부사항](plugins/hook-complexity-monitor/README.ko.md#기술-세부사항)
- [Auto-Docs 기술 세부사항](plugins/hook-auto-docs/README.ko.md#기술-세부사항)
- [Session Tracker 기술 세부사항](plugins/hook-session-summary/README.ko.md#기술-세부사항)

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
