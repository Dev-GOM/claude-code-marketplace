#!/bin/bash
# Browser Pilot Check Command
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/../scripts/dist/cli/cli.js" check "$@"
