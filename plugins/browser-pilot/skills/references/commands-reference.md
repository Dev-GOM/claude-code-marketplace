# Browser Pilot Commands Reference

Complete reference for all Browser Pilot CLI commands using the project-local wrapper script.

## Command Entry Points

Browser Pilot uses the CLI wrapper script `.browser-pilot/bp`:

**Single command execution:**
```bash
node .browser-pilot/bp <command> [options]
```

**Chain mode (multiple commands):**
```bash
node .browser-pilot/bp chain <command1> [args1] <command2> [args2] ...
```

**Daemon management:**
```bash
node .browser-pilot/bp daemon-<action>
```

## Single Command Execution

### Navigation Commands

**navigate** - Navigate to URL (auto-generates interaction map on page load)
```bash
node .browser-pilot/bp navigate -u "<url>"
```

**back** - Navigate back in history
```bash
node .browser-pilot/bp back
```

**forward** - Navigate forward in history
```bash
node .browser-pilot/bp forward
```

**reload** - Reload current page (regenerates interaction map)
```bash
node .browser-pilot/bp reload
```

### Interaction Commands

**click** - Click an element

Smart Mode (Recommended):
```bash
node .browser-pilot/bp click --text "<text>" [options]

Options:
  --text <text>          Text content to search for
  --index <number>       Select nth match (1-based)
  --type <type>          Element type filter (supports aliases: "input" → "input-*")
  --tag <tag>            HTML tag filter (e.g., "button", "input")
  --viewport-only        Only search visible elements
  --verify               Verify action success

Examples:
  node .browser-pilot/bp click --text Submit
  node .browser-pilot/bp click --text "Sign In" --type button
  node .browser-pilot/bp click --text Delete --index 2
  node .browser-pilot/bp click --text Search --type input       # Auto-expands to all input types
  node .browser-pilot/bp click --text Submit --tag button       # Tag-based search
```

Direct Mode (fallback for unique IDs):
```bash
node .browser-pilot/bp click -s "<selector>"
node .browser-pilot/bp click -u "<url>" -s "<selector>"
```

**fill** - Fill input field

Smart Mode (Recommended):
```bash
node .browser-pilot/bp fill --text "<label>" -v "<value>" [options]

Options:
  --text <label>         Label or placeholder text to search
  --type <type>          Input type filter (supports aliases: "input" → "input-*")
  --tag <tag>            HTML tag filter (e.g., "input", "textarea")
  --viewport-only        Only search visible elements
  --verify               Verify action success

Examples:
  node .browser-pilot/bp fill --text Email -v user@example.com
  node .browser-pilot/bp fill --text Password -v secret --type input-password
  node .browser-pilot/bp fill --text Email --tag input -v user@example.com   # Tag-based search
```

Direct Mode (fallback for unique IDs):
```bash
node .browser-pilot/bp fill -s "<selector>" -v "<value>"
```

**hover** - Hover over element
```bash
node .browser-pilot/bp hover -s "<selector>"
```

**press** - Press keyboard key
```bash
node .browser-pilot/bp press -k "<key>"

Keys: Enter, Tab, Escape, ArrowUp, ArrowDown, etc.
```

**type** - Type text character by character
```bash
node .browser-pilot/bp type -t "<text>" -d <delay-ms>
```

**upload** - Upload file to input element
```bash
node .browser-pilot/bp upload -s "<selector>" -f "<file-path>"
```

### Data Extraction Commands

**extract** - Extract text content from element
```bash
node .browser-pilot/bp extract -s "<selector>"
```

**content** - Get full page HTML
```bash
node .browser-pilot/bp content
```

**console** - Get console messages
```bash
node .browser-pilot/bp console
```

**cookies** - Get page cookies
```bash
node .browser-pilot/bp cookies
```

### Capture Commands

**screenshot** - Capture screenshot (saved to `.browser-pilot/screenshots/`)
```bash
node .browser-pilot/bp screenshot -o "<filename>.png" [options]

Options:
  -u, --url <url>        URL to capture (optional)
  -o, --output <path>    Output filename (saved to .browser-pilot/screenshots/)
  --full-page            Capture full page (default: true)
  --clip-x <x>           Clip region X coordinate (pixels)
  --clip-y <y>           Clip region Y coordinate (pixels)
  --clip-width <width>   Clip region width (pixels)
  --clip-height <height> Clip region height (pixels)
  --clip-scale <scale>   Clip region scale factor (default: 1)
  --headless             Run in headless mode

Examples:
  # Full page screenshot
  node .browser-pilot/bp screenshot -o result.png --full-page
  # Saves to: .browser-pilot/screenshots/result.png

  # Capture specific region
  node .browser-pilot/bp screenshot -o region.png --clip-x 100 --clip-y 200 --clip-width 800 --clip-height 600
  # Saves to: .browser-pilot/screenshots/region.png
```

**pdf** - Generate PDF (saved to `.browser-pilot/pdfs/`)
```bash
node .browser-pilot/bp pdf -o "<filename>.pdf" [options]

Options:
  -u, --url <url>        URL to capture (optional)
  -o, --output <path>    Output filename (saved to .browser-pilot/pdfs/)
  --landscape            Landscape orientation
  --headless             Run in headless mode

Example:
  node .browser-pilot/bp pdf -o document.pdf --landscape
  # Saves to: .browser-pilot/pdfs/document.pdf
```

**set-viewport** - Set browser viewport size (useful for responsive design testing)
```bash
node .browser-pilot/bp set-viewport -w <width> -h <height> [options]

Options:
  -w, --width <width>    Viewport width in pixels (required)
  -h, --height <height>  Viewport height in pixels (required)
  --scale <scale>        Device scale factor (default: 1)
  --mobile               Emulate mobile device (default: false)

Examples:
  # Desktop viewport
  node .browser-pilot/bp set-viewport -w 1920 -h 1080

  # Mobile viewport (iPhone 12)
  node .browser-pilot/bp set-viewport -w 390 -h 844 --scale 3 --mobile

  # Tablet viewport (iPad)
  node .browser-pilot/bp set-viewport -w 768 -h 1024 --scale 2
```

### Tab Management Commands

**tabs** - List all open tabs
```bash
node .browser-pilot/bp tabs
```

**new-tab** - Open new tab
```bash
node .browser-pilot/bp new-tab -u "<url>"
```

**close-tab** - Close tab by index
```bash
node .browser-pilot/bp close-tab -i <index>
```

**close** - Close browser
```bash
node .browser-pilot/bp close
```

### Utility Commands

**eval** - Execute JavaScript in browser context
```bash
node .browser-pilot/bp eval -e "<javascript-expression>"

Example:
node .browser-pilot/bp eval -e "document.title"
```

**wait** - Wait for element to appear
```bash
node .browser-pilot/bp wait -s "<selector>" -t <timeout-ms>
```

**scroll** - Scroll page or element
```bash
# Scroll to position
node .browser-pilot/bp scroll -x <x-pos> -y <y-pos>

# Scroll element into view
node .browser-pilot/bp scroll -s "<selector>"
```

**select** - Select dropdown option
```bash
node .browser-pilot/bp select -s "<selector>" -v "<option-value>"
```

**find** - Find elements matching selector
```bash
node .browser-pilot/bp find -s "<selector>"
```

**query** - Query interaction map for elements
```bash
# List all element types with counts
node .browser-pilot/bp query --list-types

# List all text contents (paginated, default 20)
node .browser-pilot/bp query --list-texts

# List text contents with type filter
node .browser-pilot/bp query --list-texts --type button

# Find elements by text
node .browser-pilot/bp query --text "<text-content>"

# Find all elements of a type (paginated)
node .browser-pilot/bp query --type <element-type>

# Type aliases (auto-expanded)
node .browser-pilot/bp query --type input          # Matches: input, input-text, input-search, etc.
node .browser-pilot/bp query --type input-search   # Exact match only

# Find by HTML tag
node .browser-pilot/bp query --tag button          # All <button> elements
node .browser-pilot/bp query --text Submit --tag button

# Show detailed information
node .browser-pilot/bp query --type button --verbose

# Pagination options
node .browser-pilot/bp query --type button --limit 50 --offset 20

# Unlimited results
node .browser-pilot/bp query --type button --limit 0

# Other options:
# --index <n>        Select nth match (1-based)
# --viewport-only    Only visible elements
# --id <id>          Direct element ID lookup
```

**map-status** - Check interaction map status
```bash
node .browser-pilot/bp map-status
```

**regen-map** - Force regenerate interaction map
```bash
node .browser-pilot/bp regen-map
```

## Chain Mode

Execute multiple commands sequentially in a single call with automatic map synchronization.

**Syntax:**
```bash
node .browser-pilot/bp chain <command1> [args1] <command2> [args2] ...
```

**Key Features:**
- Auto-waits for page load and map generation after navigation
- Supports Smart Mode (--text) for reliable element targeting
- Adds random human-like delay (300-800ms) between commands
- Stops execution if any command fails
- Each command executes after the previous one completes

**Chain-specific Options:**
```bash
--timeout <ms>    Timeout for waiting map ready after navigation (default: 10000ms)
--delay <ms>      Fixed delay between commands (overrides random 300-800ms delay)
```

**Quote Rules:**
- No quotes needed when values have no spaces
- Use quotes when values contain spaces

**Examples:**

```bash
# Basic chain (no quotes needed)
node .browser-pilot/bp chain navigate -u <url> click --text Submit extract -s .result

# With spaces (quotes required)
node .browser-pilot/bp chain navigate -u <url> click --text "Sign In" fill -s #email -v "user@example.com"

# Login workflow with Smart Mode
node .browser-pilot/bp chain navigate -u <url> fill --text Email -v <email> fill --text Password -v <password> click --text Login

# Multi-step workflow with Korean text
node .browser-pilot/bp chain navigate -u <url> click --text "메인 메뉴" click --text "설정 변경" click --text "저장"

# Screenshot workflow
node .browser-pilot/bp chain navigate -u <url> wait -s .content-loaded screenshot -o result.png

# Custom timing
node .browser-pilot/bp chain --timeout 15000 --delay 1000 navigate -u <url> click --text Submit
```

## Daemon Commands

Daemon starts automatically on first command and stops automatically at session end.

**daemon-start** - Start daemon (auto-starts on first command)
```bash
node .browser-pilot/bp daemon-start
```

**daemon-stop** - Stop daemon and close browser
```bash
node .browser-pilot/bp daemon-stop
```

**daemon-restart** - Restart daemon
```bash
node .browser-pilot/bp daemon-restart
```

**daemon-status** - Check daemon status
```bash
node .browser-pilot/bp daemon-status
```

## Common Options

Most commands support:
- `-u, --url <url>`: Navigate to URL before action
- `--headless`: Run in headless mode (no visible browser)
- `--timeout <ms>`: Custom timeout for operations

## Smart Mode vs Direct Mode

**🌟 Recommendation: Use Smart Mode by default for better reliability**

| Feature | Smart Mode (Recommended) | Direct Mode |
|---------|--------------------------|-------------|
| Selector | Text content | CSS or XPath |
| Reliability | ⭐⭐⭐⭐⭐ High (stable) | ⭐⭐ Low (brittle) |
| Duplicates | Auto indexing | Manual indexing |
| Map Required | Yes (auto-generated) | No |
| Speed | Medium | Fast |
| Best For | Most cases, text-based UI | Unique IDs only |
| Maintenance | Low (text rarely changes) | High (selectors break often) |

**When to use Direct Mode:**
- Element has a unique, stable ID (e.g., `#user-profile-button`)
- Performance-critical operations requiring maximum speed
- Element has no visible text content

## Exit Codes

- `0`: Success
- `1`: General error
- Non-zero: Command failed

## Examples

**Take screenshot:**
```bash
node .browser-pilot/bp screenshot -u "https://example.com" -o "example.png" --full-page
```

**Login flow (Direct Mode):**
```bash
node .browser-pilot/bp navigate -u "https://example.com/login"
node .browser-pilot/bp fill -s "#email" -v "user@example.com"
node .browser-pilot/bp fill -s "#password" -v "secret"
node .browser-pilot/bp click -s "#login-btn"
```

**Login flow (Chain Mode):**
```bash
node .browser-pilot/bp chain navigate -u "https://example.com/login" fill -s "#email" -v "user@example.com" fill -s "#password" -v "secret" click -s "#login-btn"
```

**Smart mode workflow (map auto-generated on navigate):**
```bash
node .browser-pilot/bp navigate -u "https://example.com"
node .browser-pilot/bp click --text "Login" --type button
node .browser-pilot/bp fill --text "Email" -v "user@example.com"
node .browser-pilot/bp fill --text "Password" -v "secret"
node .browser-pilot/bp click --text "Submit" --verify
```

**Smart mode workflow (Chain Mode):**
```bash
node .browser-pilot/bp chain navigate -u "https://example.com" click --text "Login" --type button fill --text "Email" -v "user@example.com" fill --text "Password" -v "secret" click --text "Submit" --verify
```

**Extract data:**
```bash
node .browser-pilot/bp navigate -u "https://example.com/products"
node .browser-pilot/bp extract -s ".product-title"
node .browser-pilot/bp extract -s ".product-price"
```
