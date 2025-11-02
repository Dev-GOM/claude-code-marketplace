---
name: browser-pilot
description: |
  Chrome DevTools Protocol (CDP) browser automation, web scraping, crawling. 브라우저 자동화, 웹 스크래핑, 크롤링.

  Features/기능: screenshot 스크린샷, PDF generation PDF생성, web scraping 웹스크래핑, data extraction 데이터추출, form filling 폼작성, login automation 로그인자동화, click/input 클릭/입력, element finder 요소찾기, tab management 탭관리, cookie control 쿠키제어, JavaScript execution JS실행, page navigation 페이지이동, wait for element 요소대기, scroll 스크롤, accessibility tree 접근성트리, console messages 콘솔메시지, network idle 네트워크대기, back/forward 뒤로/앞으로, reload 새로고침, file upload 파일업로드.

  Bot detection bypass 봇감지우회 (navigator.webdriver=false). Auto Chrome connection 자동크롬연결. Headless/headed mode. All browser-pilot MCP features. Only needs websocket-client.
---

# browser-pilot (CDP Direct)

## Purpose

Automate Chrome browser using pure Chrome DevTools Protocol (CDP) without browser-pilot or Selenium. Avoids bot detection by maintaining `navigator.webdriver = false`. Automatically connects to existing Chrome or launches new instance.

## When to Use This Skill

Use when tasks involve:
- Browser automation, web scraping, data extraction
- Screenshot capture, PDF generation
- Form filling, login automation
- Tab management, cookie control
- JavaScript execution in browser context
- Element interaction (click, fill, hover, scroll)
- Page navigation, waiting for elements/network
- Accessibility tree inspection
- Bot detection bypass requirements

## Quick Start

### Prerequisites

Chrome must be installed. Build CLI once:
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts" && npm install && npm run build
```

### Usage

**Method 1: npm scripts (Recommended)**
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"

# Screenshot - Capture webpage
npm run bp:screenshot -- -u "https://example.com" -o "page.png" --headless --full-page

# Navigate - Go to URL
npm run bp:navigate -- -u "https://example.com"

# Extract - Get text content
npm run bp:extract -- -u "https://example.com" -s "h1"

# Click - Click element
npm run bp:click -- -u "https://example.com" -s "button.submit"

# Fill - Fill input field
npm run bp:fill -- -u "https://example.com/login" -s "#email" -v "user@example.com"

# Eval - Execute JavaScript
npm run bp:eval -- -u "https://example.com" -e "document.title"

# PDF - Generate PDF
npm run bp:pdf -- -u "https://example.com" -o "page.pdf" --landscape

# Cookies - Get cookies
npm run bp:cookies -- -u "https://example.com"

# Tabs - List open tabs
npm run bp:tabs

# New Tab - Open new tab
npm run bp:new-tab -- -u "https://github.com"

# Close Tab - Close tab by index
npm run bp:close-tab -- -i 0

# Close - Close browser
npm run bp:close

# Hover - Hover over element
npm run bp:hover -- -u "https://example.com" -s "button.menu"

# Press - Press keyboard key
npm run bp:press -- -k "Enter"

# Type - Type text character by character
npm run bp:type -- -t "Hello World" -d 100

# Upload - Upload file to input
npm run bp:upload -- -u "https://example.com/upload" -s "#file-input" -f "/path/to/file.pdf"

# Reload - Reload current page
npm run bp:reload

# Back - Navigate back in history
npm run bp:back

# Forward - Navigate forward in history
npm run bp:forward

# Wait - Wait for element to appear
npm run bp:wait -- -s "div.loaded" -t 30000

# Scroll - Scroll page or element
npm run bp:scroll -- -x 0 -y 500

# Content - Get page HTML content
npm run bp:content

# Select - Select dropdown option
npm run bp:select -- -u "https://example.com" -s "#country" -v "USA"

# Check - Check checkbox
npm run bp:check -- -u "https://example.com" -s "#agree-terms"

# Uncheck - Uncheck checkbox
npm run bp:uncheck -- -u "https://example.com" -s "#subscribe"

# Drag - Drag and drop element
npm run bp:drag -- -u "https://example.com" --from "#item1" --to "#basket"
```

**Method 2: Shell scripts**
```bash
cd "${CLAUDE_SKILL_ROOT}/bin"

# Windows
browser-pilot-screenshot.bat -u "https://example.com" -o "page.png"
browser-pilot-hover.bat -u "https://example.com" -s "button.menu"
browser-pilot-reload.bat
browser-pilot-back.bat
browser-pilot-forward.bat

# Unix/Mac
./browser-pilot-screenshot.sh -u "https://example.com" -o "page.png"
./browser-pilot-hover.sh -u "https://example.com" -s "button.menu"
./browser-pilot-reload.sh
./browser-pilot-back.sh
./browser-pilot-forward.sh
```

All .bat/.sh scripts are now located in the `bin/` folder.

**Method 3: Direct CLI**
```bash
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" screenshot --url "https://example.com" --output "page.png"
```

Relative paths save to `.browser-pilot/` folder automatically.

## Common Workflows

### Capture Screenshot

```bash
# Headless mode
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" screenshot --url "https://github.com" --output "github.png" --headless --full-page

# Headed mode (visible browser)
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" screenshot --url "https://github.com" --output "github.png"
```

### Extract Text

```bash
# Specific element
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" extract --url "https://example.com/products" --selector "h1" --headless

# Entire body
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" extract --url "https://example.com" --headless
```

### Execute JavaScript

```bash
# Simple value
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" eval --url "https://example.com" --expression "document.title"

# Complex object
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" eval --url "https://example.com" --expression "({title: document.title, links: document.querySelectorAll('a').length})"
```

### Interact with Page

```bash
# Fill form
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" fill --url "https://example.com/login" --selector "#email" --value "user@example.com"

# Click button
node "${CLAUDE_SKILL_ROOT}/scripts/dist/cli.js" click --url "https://example.com" --selector "button[type='submit']"
```

## CLI Commands

```bash
# screenshot - Capture webpage screenshot
node dist/cli.js screenshot --url <URL> --output <PATH> [--headless] [--full-page]

# navigate - Navigate to URL (keeps browser open)
node dist/cli.js navigate --url <URL> [--headless]

# extract - Extract text from page
node dist/cli.js extract --url <URL> [--selector <CSS>] [--headless]

# click - Click element (keeps browser open)
node dist/cli.js click --url <URL> --selector <CSS> [--headless]

# fill - Fill input field (keeps browser open)
node dist/cli.js fill --url <URL> --selector <CSS> --value <TEXT> [--headless]

# eval - Execute JavaScript
node dist/cli.js eval --url <URL> --expression <SCRIPT> [--headless]
```

**Options:**
- `--headless` - Run without visible browser window (faster)
- `--full-page` - Capture entire scrollable page (screenshot only)
- `--output` - Output file path (relative paths save to `.browser-pilot/`)
- `--selector` - CSS selector for element targeting
- `--value` - Text value to fill in input
- `--expression` - JavaScript code to execute

## Bot Detection Avoidance

CDP maintains `navigator.webdriver = false`, bypassing most anti-bot systems.

Test: `node dist/cli.js screenshot --url "https://bot.sannysoft.com" --output "bot-test.png"`

Expected: All checks **PASS** (green).

## Best Practices

1. **Build once** - Run `npm run build` in scripts/ before first use
2. **Use headed mode for debugging** - Omit `--headless` to see browser window
3. **Prefer unique selectors** - Use IDs: `#username` > `.class` > `input[name="user"]`
4. **Relative paths** - Files auto-save to `.browser-pilot/`
5. **Respect rate limits** - Add delays between requests

## Troubleshooting

**Build errors**
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm install && npm run build
```

**Node.js not installed**
- Install Node.js 18+ from https://nodejs.org
- Verify: `node --version`

**Chrome not found**
- Install from https://www.google.com/chrome/
- CLI auto-detects installation path

**Port 9222 in use**
- Close existing Chrome instance

**Blank screenshots**
- Add wait time: `eval --expression "new Promise(r => setTimeout(r, 2000))"`

**Element not found**
- Verify selector with browser DevTools (F12)
- Use specific selectors: `#id` > `.class` > `tag`

## Technical Details

### Architecture

```
scripts/
├── package.json
├── tsconfig.json (ES2023)
├── dist/ (compiled)
│   └── cli.js
└── src/
    ├── cli.ts (commander.js)
    └── cdp/
        ├── client.ts (WebSocket CDP)
        ├── browser.ts (Chrome launcher)
        └── actions.ts (CDP actions)
```

### How CDP Works

1. Launch Chrome: `chrome --remote-debugging-port=9222`
2. Connect via WebSocket: `ws://localhost:9222/devtools/...`
3. Send commands: `{"method": "Page.navigate", "params": {...}}`
4. Receive responses: `{"id": 1, "result": {...}}`

## Responsible Use

**Appropriate:**
- Legitimate web scraping
- Testing own websites
- Authorized automation
- Research and education

**Inappropriate:**
- Unauthorized security bypass
- Terms of service violations
- DDoS attacks
- Credential stuffing

Always respect robots.txt and website terms.
