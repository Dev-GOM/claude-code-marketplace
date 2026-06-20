# Hermes Tweet

Xquik을 통해 X/Twitter 워크플로우를 제공하는 네이티브 Hermes Agent 플러그인입니다.

## 개요

Hermes Tweet는 Claude Code 사용자가 [Xquik-dev/hermes-tweet](https://github.com/Xquik-dev/hermes-tweet) 업스트림 Hermes Agent 플러그인을 설치하고 설정하며 운영하도록 돕습니다. 읽기 우선 소셜 워크플로우, 카탈로그 탐색, 계정 읽기, 트렌드, 모니터, 미디어, 추첨, 승인 기반 액션에 초점을 맞춥니다.

이 마켓플레이스 항목은 Claude Code Skill 래퍼입니다. Hermes 런타임 플러그인은 업스트림 Python 패키지와 Hermes 플러그인에 남아 있습니다.

## 설치

마켓플레이스에서 이 Claude Code 플러그인을 설치합니다:

```bash
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
/plugin install hermes-tweet@dev-gom-plugins
```

그 다음 Hermes Agent 플러그인을 설치합니다:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

Hermes는 대화형 설치 중 `XQUIK_API_KEY`를 요청합니다. 비대화형 설정에서는 `tweet_read` 호출 전에 Hermes 런타임 환경에 키를 설정하세요.

```bash
export XQUIK_API_KEY="xq_..."
export HERMES_TWEET_ENABLE_ACTIONS="false"
```

게시, 답글, 좋아요, 리트윗, 팔로우, DM, 미디어 변경, 웹훅, 모니터가 필요한 세션이 아니라면 `HERMES_TWEET_ENABLE_ACTIONS=false`를 유지하세요.

## 사용법

- 먼저 `tweet_explore`로 지원되는 `/api/v1/...` 경로를 찾습니다.
- 카탈로그에 있는 읽기 전용 요청에는 `tweet_read`를 사용합니다.
- 계정 변경 작업이 필요한 세션에서만 `tweet_action`을 활성화합니다.
- API 키를 채팅에 붙여넣지 마세요. Hermes 런타임 환경에서 secret을 설정하세요.

## 링크

- [Hermes Tweet README](https://github.com/Xquik-dev/hermes-tweet#readme)
- [PyPI 패키지](https://pypi.org/project/hermes-tweet/)
- [Hermes Agent](https://github.com/NousResearch/hermes-agent)
