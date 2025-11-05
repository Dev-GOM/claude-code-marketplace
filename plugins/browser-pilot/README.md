# Browser Pilot

> **Status**: ✅ Released (v1.4.0)

**Language**: [English](README.md) | [한국어](README.ko.md)

Chrome DevTools Protocol (CDP) based browser automation, web scraping, and crawling - Control Chrome browser programmatically from Claude Code.

## Overview

Browser Pilot enables direct control of Chrome browser through the Chrome DevTools Protocol (CDP), similar to how Selenium or Puppeteer works but with a CLI-first approach. This plugin allows you to:

- 📸 Capture screenshots (viewport or full-page)
- 🌐 Navigate to URLs and interact with pages
- 🖱️ Click elements, fill forms, and press keys
- 📄 Extract text content and scrape data
- 📑 Generate PDFs from web pages
- 🔗 Manage browser tabs (list, switch, close)
- 🤖 Bypass bot detection (maintains `navigator.webdriver = false`)
- ⚛️ **React/Framework compatibility** (properly triggers React synthetic events)

## Architecture

```
┌─────────────────┐    Chrome DevTools Protocol    ┌──────────────────────┐
│  Claude Code    │◄──────────────────────────────►│   Chrome Browser     │
│  (TypeScript)   │      WebSocket (Port 9222+)    │   (CDP Server)       │
│                 │                                 │                      │
│  - CLI Client   │                                 │  - Headless Mode     │
│  - Commands     │                                 │  - Tab Management    │
│  - Config Mgmt  │                                 │  - DevTools API      │
└─────────────────┘                                 └──────────────────────┘
```

**Key Components:**
- **TypeScript CLI**: Command-line interface for CDP operations
- **Chrome Browser**: Runs in headless or headed mode with CDP enabled
- **WebSocket Communication**: JSON-based command-response protocol

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

### Basic Usage

All commands should be run from `plugins/browser-pilot/skills/scripts`:

```bash
cd plugins/browser-pilot/skills/scripts

# Take a screenshot
npm run bp:screenshot -- -u "https://example.com" -o "example.png" --headless --full-page

# Navigate to a URL
npm run bp:navigate -- -u "https://github.com"

# Extract text from elements
npm run bp:extract -- -u "https://example.com" -s "h1"

# Fill a form field
npm run bp:fill -- -u "https://example.com/login" -s "#email" -v "user@example.com"

# Click an element
npm run bp:click -- -u "https://example.com" -s "button.login-btn"

# Generate PDF
npm run bp:pdf -- -u "https://docs.example.com" -o "documentation.pdf"
```

**Note**: Project root is auto-detected from the current working directory. Files are saved to `.browser-pilot/` in your project root.

### Multi-Step Workflows

Chain commands using `&&` with `sleep` delays to avoid bot detection:

```bash
cd plugins/browser-pilot/skills/scripts

# Login workflow with human-like delays
# Note: URL is optional after first navigate - preserves page state!
npm run bp:navigate -- -u "https://example.com/login" && \
sleep 1 && \
npm run bp:fill -- -s "#email" -v "user@example.com" && \
sleep 0.5 && \
npm run bp:fill -- -s "#password" -v "mypass123" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']"
```

**New in v0.1.6**: URL parameter (`-u`) is now optional for most commands. When omitted, commands operate on the current page without refreshing, preserving console logs, network data, and form state.

## Available Commands

### Core Commands

```bash
# Launch browser
launch           # Start Chrome in headless or headed mode
  --headless     # Run without UI (default: false)

# Navigate
navigate         # Go to URL
  -u, --url      # Target URL (required)

# Screenshot
screenshot       # Capture page screenshot
  -u, --url      # Target URL (optional if browser already open)
  -o, --output   # Output filename (saves to .browser-pilot/)
  --full-page    # Capture entire page (default: viewport only)
  --headless     # Run in headless mode

# PDF Generation
pdf              # Generate PDF from page
  -u, --url      # Target URL (optional if browser already open)
  -o, --output   # Output filename (saves to .browser-pilot/)
  --landscape    # Use landscape orientation
  --headless     # Run in headless mode
```

### Interaction Commands

```bash
# Click
click            # Click element by selector
  -u, --url      # Target URL (optional)
  -s, --selector # CSS selector (required)

# Fill Form
fill             # Fill input field
  -u, --url      # Target URL (optional)
  -s, --selector # CSS selector (required)
  -v, --value    # Text to fill (required)

# Type Text
type             # Type text in active element
  --text         # Text to type (required)

# Press Key
press            # Press keyboard key
  --key          # Key name (Enter, Tab, Escape, etc.)

# Extract Content
extract          # Extract text from elements
  -u, --url      # Target URL (optional)
  -s, --selector # CSS selector (required)
  --all          # Extract all matching elements (default: first only)

# Execute JavaScript
eval             # Execute JavaScript in page context
  -u, --url      # Target URL (optional)
  --expression   # JavaScript code to execute (required)
```

### Tab Management

```bash
# List tabs
list-tabs        # Show all open tabs with IDs and titles

# Switch tab
switch-tab       # Switch to specific tab
  --id           # Tab ID (from list-tabs)
  --index        # Or tab index (0-based)

# Close tab
close-tab        # Close specific tab
  --id           # Tab ID (from list-tabs)
  --index        # Or tab index (0-based)

# Close browser
close            # Close all tabs and exit browser
```

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

### Screenshot Capture

```bash
# Full-page screenshot in headless mode
npm run bp:screenshot -- \
  -u "https://github.com" \
  -o "github-homepage.png" \
  --headless \
  --full-page
```

### Form Automation

```bash
cd plugins/browser-pilot/skills/scripts

# Contact form submission with delays
npm run bp:navigate -- -u "https://example.com/contact" && \
sleep 1 && \
npm run bp:fill -- -s "#name" -v "John Doe" && \
sleep 0.5 && \
npm run bp:fill -- -s "#email" -v "john@example.com" && \
sleep 0.5 && \
npm run bp:fill -- -s "#message" -v "Hello from Browser Pilot!" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']" && \
sleep 1 && \
npm run bp:screenshot -- -o "contact-submitted.png"
```

### Web Scraping

```bash
# Extract all h1 headings from a page
npm run bp:extract -- \
  -u "https://news.ycombinator.com" \
  -s "a.storylink" \
  --all
```

### PDF Generation

```bash
# Generate landscape PDF of documentation
npm run bp:pdf -- \
  -u "https://docs.example.com" \
  -o "api-docs.pdf" \
  --landscape \
  --headless
```

## Bot Detection Avoidance

Browser Pilot maintains `navigator.webdriver = false`, bypassing most anti-bot systems.

**Additional Tips**:
- Add `sleep` delays (0.5-2 seconds) between commands to mimic human behavior
- Longer delays for critical actions (login, form submission)
- Use random delays when automating multiple similar actions
- Example: `npm run bp:fill ... && sleep 1 && npm run bp:click ...`

**Test Bot Detection**:
```bash
npm run bp:screenshot -- \
  -u "https://bot.sannysoft.com" \
  -o "bot-test.png" \
  --headless
```

Expected: All checks **PASS** (green).

## Best Practices

1. **Build once** - Run `npm run build` before first use
2. **Use headed mode for debugging** - Omit `--headless` to see browser window
3. **Prefer unique selectors** - Use IDs: `#username` > `.class` > `input[name="user"]`
4. **Relative paths** - Files auto-save to `.browser-pilot/`
5. **Add human-like delays** - Use `sleep 0.5-2` between commands to avoid bot detection
6. **Respect rate limits** - Add delays between requests
7. **Close browser when done** - Use `npm run bp:close` to free resources

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

## Support

- 📖 Documentation: [SKILL.md](./skills/SKILL.md)
- 🐛 Issues: [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Dev-GOM/claude-code-marketplace/discussions)

---

**Note**: Browser Pilot is production-ready and actively maintained. Report bugs or request features via GitHub Issues.
