#!/bin/bash
# Browser Pilot Get Cookies Command
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/../scripts/dist/cli.js" cookies "$@"
