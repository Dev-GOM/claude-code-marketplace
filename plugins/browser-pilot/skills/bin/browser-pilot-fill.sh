#!/bin/bash
# Browser Pilot Fill Command
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/../scripts/dist/cli.js" fill "$@"
