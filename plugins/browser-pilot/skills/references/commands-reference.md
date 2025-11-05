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

Direct Mode:
```bash
node .browser-pilot/bp click -s "<selector>"
node .browser-pilot/bp click -u "<url>" -s "<selector>"
```

Smart Mode:
```bash
node .browser-pilot/bp click --text "<text>" [options]

Options:
  --text <text>          Text content to search for
  --index <number>       Select nth match (1-based)
  --type <type>          Element type filter (button, input, etc.)
  --viewport-only        Only search visible elements
  --verify               Verify action success
```

**fill** - Fill input field

Direct Mode:
```bash
node .browser-pilot/bp fill -s "<selector>" -v "<value>"
```

Smart Mode:
```bash
node .browser-pilot/bp fill --text "<label>" -v "<value>" [options]

Options:
  --text <label>         Label or placeholder text to search
  --type <type>          Input type filter (default: input)
  --viewport-only        Only search visible elements
  --verify               Verify action success
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

**screenshot** - Capture screenshot
```bash
node .browser-pilot/bp screenshot -o "<output-file>.png" [options]

Options:
  -u, --url <url>        URL to capture (optional)
  -o, --output <path>    Output file path
  --full-page            Capture full page (default: true)
  --headless             Run in headless mode
```

**pdf** - Generate PDF
```bash
node .browser-pilot/bp pdf -o "<output-file>.pdf" [options]

Options:
  -u, --url <url>        URL to capture (optional)
  -o, --output <path>    Output file path
  --landscape            Landscape orientation
  --headless             Run in headless mode
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

Execute multiple commands sequentially in a single call:

```bash
node .browser-pilot/bp chain <command1> <args1> <command2> <args2> ...
```

**Examples:**
```bash
# Basic chain: navigate → click → extract
node .browser-pilot/bp chain navigate -u "<url>" click --text "Submit" extract -s ".result"

# Login workflow
node .browser-pilot/bp chain navigate -u "<login-url>" fill -s "#email" -v "user@example.com" fill -s "#password" -v "secret" click -s "#login-btn"

# Smart mode workflow
node .browser-pilot/bp chain navigate -u "<url>" click --text "Login" --type button fill --text "Email" -v "user@example.com" fill --text "Password" -v "secret" click --text "Submit" --verify

# Screenshot workflow with navigation
node .browser-pilot/bp chain navigate -u "<url>" wait -s ".content-loaded" -t 3000 screenshot -o "page.png"
```

Chain mode stops if any command fails. Each command executes after the previous one completes.

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

| Feature | Direct Mode | Smart Mode |
|---------|-------------|------------|
| Selector | CSS or XPath | Text content |
| Reliability | Low (brittle) | High (stable) |
| Duplicates | Manual indexing | Auto indexing |
| Map Required | No | Yes (auto-generated) |
| Speed | Fast | Slightly slower |
| Best For | Unique IDs/classes | Text-based UI |

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
