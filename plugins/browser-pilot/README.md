# Browser Pilot

> **Status**: ✅ Released (v1.5.2)

**Language**: [English](README.md) | [한국어](README.ko.md)

Chrome DevTools Protocol (CDP) based browser automation, web scraping, and crawling with **daemon-based architecture** and **Smart Mode** for reliable element targeting.

## Overview

Browser Pilot provides intelligent browser automation through Chrome DevTools Protocol (CDP) with a **daemon-based architecture** that maintains persistent browser connections. Features **Smart Mode** with automatic Interaction Map generation for text-based element search, eliminating brittle CSS selectors.

**Key Features:**

- 🤖 **Smart Mode** - Text-based element search with automatic selector generation
- 🔄 **Daemon Architecture** - Persistent CDP connection for instant command execution
- 📸 **Screenshot Capture** - Viewport or full-page screenshots
- 🌐 **Navigation & Interaction** - URL navigation, click, fill, type, scroll
- 📄 **Data Extraction** - Text content, console logs, cookies, accessibility tree
- 📑 **PDF Generation** - Convert web pages to PDFs
- 🔗 **Tab Management** - List, switch, close tabs programmatically
- 🤖 **Bot Detection Bypass** - Maintains `navigator.webdriver = false`
- ⚛️ **React/Framework Compatibility** - Properly triggers React synthetic events
- ⛓️ **Chain Mode** - Execute multiple commands in a single workflow

## Architecture

```
┌─────────────────┐                    ┌──────────────────┐    CDP     ┌──────────────────────┐
│  Claude Code    │  IPC Commands      │  Daemon Server   │◄──────────►│   Chrome Browser     │
│  (CLI Client)   │───────────────────►│  (Background)    │ WebSocket  │   (CDP Server)       │
│                 │                    │                  │ Port 9222+ │                      │
│  - User Request │                    │  - CDP Client    │            │  - Headless/Headed   │
│  - Command Parse│                    │  - Map Generator │            │  - Tab Management    │
│  - Result Output│                    │  - Auto-restart  │            │  - DevTools API      │
└─────────────────┘                    └──────────────────┘            └──────────────────────┘
```

**Key Components:**
- **Daemon Server**: Background process maintaining persistent CDP connection
- **CLI Client**: Fast command execution via IPC communication with daemon
- **Interaction Map**: Auto-generated JSON map of interactive elements for Smart Mode
- **Chrome Browser**: Runs in headless or headed mode with CDP enabled
- **Auto-Management**: Daemon starts on first command, stops at session end (30-min timeout)

## Using the Skill in Claude Code

This plugin provides a **skill** that Claude can use automatically. You don't need to run commands manually.

### Prerequisites

Before Claude can use this skill:

1. **Build the TypeScript code** (one-time setup):
   ```bash
   cd plugins/browser-pilot/skills/scripts
   npm install
   npm run build
   ```

2. **Install Google Chrome**
   - Chrome will auto-launch when Claude uses the skill
   - Runs on port 9222 (or next available port)

### How It Works

Once set up, Claude will automatically use this skill when you ask for browser automation tasks:
- "Take a screenshot of https://example.com"
- "Extract the title from https://news.ycombinator.com"
- "Click the login button on https://example.com"
- "Run browser tests"
- "Load browser-pilot skill to test login functionality"

Claude handles all the command execution through the SKILL.md interface - you just describe what you want!

## Installation

### Prerequisites

1. **Google Chrome** (latest version recommended)
2. **Node.js** 18+ ([nodejs.org](https://nodejs.org))
3. **Git Bash** (Windows) or Terminal (macOS/Linux)

### Quick Installation

```bash
cd plugins/browser-pilot/skills/scripts
npm install
npm run build
```

The plugin will auto-initialize when you start a Claude Code session (via SessionStart hook).

## Quick Start

### Smart Mode (Recommended)

Text-based element search with automatic selector generation - more reliable than CSS selectors:

```bash
# Navigate to a page
node .browser-pilot/bp navigate -u "https://example.com/login"

# Click using text content (no quotes for single words)
node .browser-pilot/bp click --text Login --type button

# Fill form using text labels (quotes when text contains spaces)
node .browser-pilot/bp fill --text "Email Address" -v "user@example.com"
node .browser-pilot/bp fill --text Password -v "mypass123"

# Handle duplicate elements with indexing (click 2nd Delete button)
node .browser-pilot/bp click --text Delete --index 2

# Take screenshot
node .browser-pilot/bp screenshot -o "login-page.png"
```

### Chain Mode (Multiple Commands)

Execute multiple commands in a single workflow:

```bash
# Login workflow
node .browser-pilot/bp chain \
  navigate -u "https://example.com/login" \
  fill --text Email -v "user@example.com" \
  fill --text Password -v "mypass123" \
  click --text Login \
  screenshot -o "logged-in.png"

# Scraping workflow
node .browser-pilot/bp chain \
  navigate -u "https://example.com" \
  wait -s ".content-loaded" \
  extract -s ".product-title" \
  screenshot -o "products.png"
```

### Direct Mode (CSS Selectors)

For unique IDs or when Smart Mode is unavailable:

```bash
# Using CSS selectors
node .browser-pilot/bp click -s "#login-button"
node .browser-pilot/bp fill -s "input[name='email']" -v "user@example.com"
node .browser-pilot/bp extract -s "h1.page-title"
```

**Note**: Files are saved to `.browser-pilot/` in your project root. Daemon auto-starts on first command and stops at session end.

## Available Commands

All commands use the wrapper script: `node .browser-pilot/bp <command> [options]`

Use `--help` for detailed options: `node .browser-pilot/bp <command> --help`

### Navigation Commands

```bash
navigate -u <url>              # Navigate to URL
back                           # Go back in history
forward                        # Go forward in history
reload                         # Reload current page
```

### Interaction Commands (Smart Mode)

```bash
# Text-based search (recommended)
click --text <text> [options]  # Click element by text
  --type <type>                # Filter by element type (button, link, input, etc.)
  --index <n>                  # Select n-th match (for duplicates)
  --viewport-only              # Only search visible elements

fill --text <text> -v <value>  # Fill input by label text
  --type <type>                # Filter by input type
  --index <n>                  # Select n-th match

# Direct selector (fallback)
click -s <selector>            # Click by CSS selector
fill -s <selector> -v <value>  # Fill by CSS selector
```

### Capture Commands

```bash
screenshot -o <filename>       # Capture screenshot
  --full-page                  # Capture entire page (default: viewport)

pdf -o <filename>              # Generate PDF
  --landscape                  # Use landscape orientation
```

### Data Extraction

```bash
extract -s <selector>          # Extract text from elements
  --all                        # Extract all matches (default: first)

content                        # Get full page text content
console                        # Get console messages
cookies                        # Get cookies
```

### Chain Mode

```bash
chain <cmd1> <cmd2> ...        # Execute multiple commands
  --timeout <ms>               # Map wait timeout (default: 10000)
  --delay <ms>                 # Fixed delay between commands
```

### Query Commands

```bash
query --text <text>            # Find elements in Interaction Map
query --list-types             # List all element types
map-status                     # Check map status
regen-map                      # Force regenerate map
```

### Other Commands

```bash
wait -s <selector> -t <ms>     # Wait for element
scroll -s <selector>           # Scroll to element
eval -e <expression>           # Execute JavaScript
tabs                           # List all tabs
```

### Daemon Management

```bash
daemon-status                  # Check daemon status
daemon-stop                    # Stop daemon manually
```

For complete command reference, see [references/commands-reference.md](./skills/references/commands-reference.md)

## Configuration

### Shared Config File

**Location**: `{plugin-folder}/skills/browser-pilot-config.json`

The plugin uses a shared configuration system that manages multiple projects:

```json
{
  "projects": {
    "my-project": {
      "rootPath": "/path/to/my-project",
      "port": 9222,
      "outputDir": ".browser-pilot",
      "lastUsed": "2025-11-04T12:00:00.000Z",
      "autoCleanup": false
    },
    "another-project": {
      "rootPath": "/path/to/another-project",
      "port": 9223,
      "outputDir": ".browser-pilot",
      "lastUsed": "2025-11-04T11:00:00.000Z",
      "autoCleanup": false
    }
  }
}
```

**Features:**
- Automatic project registration via SessionStart hook
- Unique port allocation per project (9222-9322)
- Project identification by folder name
- Optional cleanup via SessionEnd hook (when `autoCleanup: true`)

### Output Directory

All screenshots and PDFs are automatically saved to:
- `.browser-pilot/` (in project root)
- Auto-created at session start with `.gitignore` to exclude generated files

## Example Workflows

### Login Workflow (Smart Mode + Chain)

```bash
# Complete login workflow using text-based search
node .browser-pilot/bp chain \
  navigate -u "https://example.com/login" \
  fill --text Email -v "user@example.com" \
  fill --text Password -v "mypass123" \
  click --text "Sign In" --type button \
  screenshot -o "logged-in.png"
```

### Screenshot Capture

```bash
# Full-page screenshot
node .browser-pilot/bp chain \
  navigate -u "https://github.com" \
  screenshot -o "github-homepage.png" --full-page
```

### Form Automation (Smart Mode)

```bash
# Contact form submission using text labels
node .browser-pilot/bp chain \
  navigate -u "https://example.com/contact" \
  fill --text "Your Name" -v "John Doe" \
  fill --text "Email Address" -v "john@example.com" \
  fill --text Message -v "Hello from Browser Pilot!" \
  click --text Submit --type button \
  screenshot -o "contact-submitted.png"
```

### Web Scraping

```bash
# Extract multiple elements
node .browser-pilot/bp chain \
  navigate -u "https://news.ycombinator.com" \
  extract -s "a.storylink" --all
```

### PDF Generation

```bash
# Generate landscape PDF
node .browser-pilot/bp chain \
  navigate -u "https://docs.example.com" \
  pdf -o "api-docs.pdf" --landscape
```

### Query Interaction Map

```bash
# Find specific elements
node .browser-pilot/bp query --text "Login"
node .browser-pilot/bp query --list-types

# Check map status
node .browser-pilot/bp map-status
```

## Bot Detection Avoidance

Browser Pilot maintains `navigator.webdriver = false` and properly triggers React synthetic events, bypassing most anti-bot systems.

**Chain Mode automatically adds 300-800ms random delays** between commands to mimic human behavior.

**Test Bot Detection**:
```bash
node .browser-pilot/bp chain \
  navigate -u "https://bot.sannysoft.com" \
  screenshot -o "bot-test.png"
```

Expected: All checks **PASS** (green).

## Best Practices

1. **🌟 Use Smart Mode by default** - Text-based search (`--text Login`) is more stable than CSS selectors
2. **Use Chain Mode for workflows** - Automatic delays and streamlined execution
3. **Daemon auto-manages** - No manual start/stop needed
4. **Prefer text-based search** - More resilient to UI changes than CSS selectors
5. **Handle duplicates with indexing** - `--index 2` for the 2nd matching element
6. **Filter by type for precision** - `--type button` narrows results
7. **Verify visibility** - `--viewport-only` ensures element is on screen
8. **Check console on errors** - `node .browser-pilot/bp console` for debugging
9. **Use `--help` for guidance** - `node .browser-pilot/bp <command> --help`

## Troubleshooting

### Build Errors

```bash
cd plugins/browser-pilot/skills/scripts
npm install && npm run build
```

### Chrome Not Found

Browser Pilot automatically detects Chrome installation. If it fails:

**Windows**:
- Default: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- User: `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`

**macOS**:
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

**Linux**:
- `/usr/bin/google-chrome`
- `/usr/bin/chromium`

### Port Already in Use

Browser Pilot auto-increments debug port (9222 → 9223 → ...) if port is busy.

### Connection Timeout

Default timeout is 10 seconds (20 attempts × 500ms). To increase, modify `src/cdp/browser.ts`:
```typescript
const maxAttempts = 40; // Change from 20 to 40 for 20 seconds timeout
```

### Element Not Found

- Verify selector with browser DevTools (`F12` → Console → `document.querySelector("...")`)
- Wait for page load with `sleep 1` before interacting
- Use more specific selectors (`#id` > `.class`)

## Technical Details

### Chrome DevTools Protocol

Browser Pilot uses CDP for all browser operations:

**Request:**
```json
{
  "id": 1,
  "method": "Page.navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "result": {
    "frameId": "frame-id-here"
  }
}
```

## Ethical Usage

Browser Pilot is for **authorized automation only**. Do NOT use for:

- Unauthorized access or credential theft
- DDoS attacks or server overload
- Copyright infringement (scraping copyrighted content)
- Bypassing paywalls or access controls
- Automated account creation (spam, fake accounts)
- Credential stuffing

Always respect robots.txt and website terms of service.

## Performance

**Command Chaining**:
- Browser launches once and stays open (fast)
- Each command reuses the same browser instance
- **No page refresh when URL is omitted** (v0.1.6+) - preserves page state
- ~100-200ms overhead per command (npm startup)
- CDP communication is near-instant (milliseconds)
- Add `sleep` delays to avoid bot detection (0.5-2 seconds recommended)
- Total workflow time = initial page load + sleep delays + command overhead

## License

Apache License 2.0 - see [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE) for details

## Contributing

This plugin is part of the [Dev GOM Plugins](https://github.com/Dev-GOM/claude-code-marketplace) marketplace. Contributions are welcome!

## Documentation

- 📖 **Quick Reference**: [SKILL.md](./skills/SKILL.md) - Concise guide for Claude Code
- 📚 **Detailed Guides**:
  - [Command Reference](./skills/references/commands-reference.md) - All 52+ commands with examples
  - [Selector Guide](./skills/references/selector-guide.md) - Smart Mode strategies and best practices
  - [Interaction Map](./skills/references/interaction-map.md) - Map system details and query API

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Dev-GOM/claude-code-marketplace/discussions)
- 🔧 **Development Guide**: [CLAUDE.md](./CLAUDE.md) - Plugin development guidelines

---

**Note**: Browser Pilot v1.4.0 is production-ready and actively maintained. Report bugs or request features via GitHub Issues.
