---
name: hermes-tweet
description: Install, configure, and operate Hermes Tweet, the native Hermes Agent X/Twitter plugin for read-first social workflows and approval-gated actions.
allowed-tools: Bash, Read
---

# Hermes Tweet

Use this skill when a user wants Hermes Agent to search X/Twitter, inspect account or trend data, monitor social signals, or prepare approval-gated account actions through Hermes Tweet.

## Safety Rules

- Keep API keys out of chat, prompts, docs, issue text, and command output.
- Configure `XQUIK_API_KEY` in the Hermes runtime environment or `~/.hermes/.env`.
- Keep `HERMES_TWEET_ENABLE_ACTIONS=false` unless the operator explicitly asks for posting, replies, likes, retweets, follows, DMs, media changes, webhooks, or monitors.
- Use `tweet_explore` before `tweet_read` or `tweet_action`.
- Treat copied endpoint URLs as route hints only. Call only catalog-listed `/api/v1/...` paths.

## Install

Recommended Hermes Agent install:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

If Hermes cannot enable the plugin during install, enable it explicitly:

```bash
hermes plugins enable hermes-tweet
hermes plugins list
```

For a published-package install into the Hermes Python environment:

```bash
~/.hermes/hermes-agent/venv/bin/python -m pip install hermes-tweet
hermes plugins enable hermes-tweet
```

For local development from a trusted checkout:

```bash
hermes plugins install file:///absolute/path/to/hermes-tweet --force --enable
```

## Configure

Set the read key before calling `tweet_read`:

```bash
export XQUIK_API_KEY="xq_..."
export HERMES_TWEET_ENABLE_ACTIONS="false"
```

If you edit `~/.hermes/.env` during an active Hermes session, use `/reload` in the interactive CLI or restart gateway and cron sessions.

## Tool Flow

1. Call `tweet_explore` with the workflow goal.
2. Choose a catalog-listed read route.
3. Call `tweet_read` with the concrete `/api/v1/...` path and required parameters.
4. Ask for explicit operator approval before enabling or calling `tweet_action`.

## References

- Hermes Tweet: https://github.com/Xquik-dev/hermes-tweet
- PyPI: https://pypi.org/project/hermes-tweet/
- Hermes Agent: https://github.com/NousResearch/hermes-agent
