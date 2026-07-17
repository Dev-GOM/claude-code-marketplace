# Hermes Tweet

Native Hermes Agent plugin for X/Twitter workflows through Xquik.

## Overview

Hermes Tweet helps Claude Code users install, configure, and operate the upstream Hermes Agent plugin from [Xquik-dev/hermes-tweet](https://github.com/Xquik-dev/hermes-tweet). It focuses on read-first social workflows, catalog discovery, account reads, trends, monitors, media, draws, and approval-gated actions.

This marketplace entry is a Claude Code skill wrapper. The Hermes runtime plugin remains the upstream Python package and Hermes plugin.

## Install

Install this Claude Code plugin from the marketplace:

```bash
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git
/plugin install hermes-tweet@dev-gom-plugins
```

Then install the Hermes Agent plugin:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

Hermes prompts for `XQUIK_API_KEY` during interactive install. For non-interactive setups, set it in the Hermes runtime environment before calling `tweet_read`.

```bash
export XQUIK_API_KEY="xq_..."
export HERMES_TWEET_ENABLE_ACTIONS="false"
```

Keep `HERMES_TWEET_ENABLE_ACTIONS=false` unless the operator approves an exact private read, extraction job, draw, monitor, webhook, media, or write-like operation.

## Usage

- Use `tweet_explore` first to find supported `/api/v1/...` routes.
- Use `tweet_read` only for catalog-listed public read-only requests.
- Route private reads, extraction jobs, draws, monitors, webhooks, media operations, and write-like requests through `tweet_action`.
- Ask for exact operator approval before enabling or calling `tweet_action` for the named operation.
- Do not paste API keys into chat. Configure secrets through the Hermes runtime environment.

## Links

- [Hermes Tweet README](https://github.com/Xquik-dev/hermes-tweet#readme)
- [PyPI package](https://pypi.org/project/hermes-tweet/)
- [Hermes Agent](https://github.com/NousResearch/hermes-agent)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
