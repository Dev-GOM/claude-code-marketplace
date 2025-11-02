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

## How to Use

**Extract required information from user's request:**
- Target URL(s) to visit
- Actions to perform (screenshot, click, fill, etc.)
- Selectors for elements (CSS selectors or XPath)
- Output file names for screenshots/PDFs
- Any specific data to extract or forms to fill

**When information is missing or ambiguous:**
- Use the `AskUserQuestion` tool to provide clear options to the user
- Offer specific choices rather than open-ended questions
- Examples:
  - "Which action?" → Choices: Screenshot, Navigate, Extract text, Fill form
  - "Headless mode?" → Choices: Yes (faster, no UI), No (visible browser)
  - "Full page screenshot?" → Choices: Yes (entire page), No (viewport only)

**Important:** Always replace `<target-url>`, `<selector>`, `<output-file>`, and other placeholders with actual values from the user's request or AskUserQuestion responses.

### Usage

**Method 1: npm scripts (Recommended)**
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"

# Screenshot - Capture webpage
npm run bp:screenshot -- -u "<target-url>" -o "<output-file>.png" --headless --full-page --project-root "$OLDPWD"

# Navigate - Go to URL
npm run bp:navigate -- -u "<target-url>" --project-root "$OLDPWD"

# Extract - Get text content
npm run bp:extract -- -u "<target-url>" -s "<selector>" --project-root "$OLDPWD"

# Click - Click element
npm run bp:click -- -u "<target-url>" -s "<selector>" --project-root "$OLDPWD"

# Fill - Fill input field
npm run bp:fill -- -u "<target-url>" -s "<selector>" -v "<value>" --project-root "$OLDPWD"

# Eval - Execute JavaScript
npm run bp:eval -- -u "<target-url>" -e "<javascript-expression>" --project-root "$OLDPWD"

# PDF - Generate PDF
npm run bp:pdf -- -u "<target-url>" -o "<output-file>.pdf" --landscape --project-root "$OLDPWD"

# Cookies - Get cookies
npm run bp:cookies -- -u "<target-url>" --project-root "$OLDPWD"

# Tabs - List open tabs
npm run bp:tabs -- --project-root "$OLDPWD"

# New Tab - Open new tab
npm run bp:new-tab -- -u "<target-url>" --project-root "$OLDPWD"

# Close Tab - Close tab by index
npm run bp:close-tab -- -i <tab-index> --project-root "$OLDPWD"

# Close - Close browser
npm run bp:close -- --project-root "$OLDPWD"

# Hover - Hover over element
npm run bp:hover -- -u "<target-url>" -s "<selector>" --project-root "$OLDPWD"

# Press - Press keyboard key
npm run bp:press -- -k "<key>" --project-root "$OLDPWD"

# Type - Type text character by character
npm run bp:type -- -t "<text>" -d <delay-ms> --project-root "$OLDPWD"

# Upload - Upload file to input
npm run bp:upload -- -u "<target-url>" -s "<selector>" -f "<file-path>" --project-root "$OLDPWD"

# Reload - Reload current page
npm run bp:reload -- --project-root "$OLDPWD"

# Back - Navigate back in history
npm run bp:back -- --project-root "$OLDPWD"

# Forward - Navigate forward in history
npm run bp:forward -- --project-root "$OLDPWD"

# Wait - Wait for element to appear
npm run bp:wait -- -s "<selector>" -t <timeout-ms> --project-root "$OLDPWD"

# Scroll - Scroll page or element
npm run bp:scroll -- -x <x-position> -y <y-position> --project-root "$OLDPWD"

# Content - Get page HTML content
npm run bp:content -- --project-root "$OLDPWD"

# Select - Select dropdown option
npm run bp:select -- -u "<target-url>" -s "<selector>" -v "<option-value>" --project-root "$OLDPWD"

# Check - Check checkbox
npm run bp:check -- -u "<target-url>" -s "<selector>" --project-root "$OLDPWD"

# Uncheck - Uncheck checkbox
npm run bp:uncheck -- -u "<target-url>" -s "<selector>" --project-root "$OLDPWD"

# Drag - Drag and drop element
npm run bp:drag -- -u "<target-url>" --from "<source-selector>" --to "<target-selector>" --project-root "$OLDPWD"
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

**Additional Tips**:
- Add `sleep` delays (0.5-2 seconds) between commands to mimic human behavior
- Longer delays for critical actions (login, form submission)
- Use random delays when automating multiple similar actions
- Example: `npm run bp:fill ... && sleep 1 && npm run bp:click ...`

Test: `node dist/cli.js screenshot --url "https://bot.sannysoft.com" --output "bot-test.png"`

Expected: All checks **PASS** (green).

## Best Practices

1. **Build once** - Run `npm run build` in scripts/ before first use
2. **Use headed mode for debugging** - Omit `--headless` to see browser window
3. **Prefer unique selectors** - Use IDs: `#username` > `.class` > `input[name="user"]`
4. **Relative paths** - Files auto-save to `.browser-pilot/`
5. **Add human-like delays** - Use `sleep 0.5-2` between commands to avoid bot detection
6. **Respect rate limits** - Add delays between requests

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

## Examples

Here are concrete examples showing how to use this skill:

**Example 1: User Request**
> "Take a screenshot of example.com"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:screenshot -- -u "https://example.com" -o "example-screenshot.png" --headless --project-root "$OLDPWD"
```

**Example 2: User Request**
> "Extract all h1 headings from github.com"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:extract -- -u "https://github.com" -s "h1" --project-root "$OLDPWD"
```

**Example 3: User Request**
> "Click the login button on example.com/login"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:click -- -u "https://example.com/login" -s "button.login-btn" --project-root "$OLDPWD"
```

**Example 4: User Request**
> "Fill in the email field with test@example.com on the signup page"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:fill -- -u "https://example.com/signup" -s "#email" -v "test@example.com" --project-root "$OLDPWD"
```

**Example 5: User Request**
> "Generate a PDF of the documentation page"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:pdf -- -u "https://docs.example.com" -o "documentation.pdf" --landscape --project-root "$OLDPWD"
```

### Multi-Step Workflows

You can chain multiple commands using `&&` to create workflows. The browser stays open between commands, making this efficient.

**Important: Bot Detection Avoidance**
- Add `sleep` delays between commands to mimic human behavior
- Recommended delays: 0.5-2 seconds between actions
- Longer delays for critical actions (login, submission)

**Example 6: Login Workflow**
> "Log into example.com with my email test@example.com and password mypass123"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:navigate -- -u "https://example.com/login" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:fill -- -s "#email" -v "test@example.com" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#password" -v "mypass123" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']" --project-root "$OLDPWD"
```

**Example 7: Data Extraction with Screenshot**
> "Go to github.com, extract the main heading, and take a screenshot"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:navigate -- -u "https://github.com" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:extract -- -s "h1" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:screenshot -- -o "github-page.png" --full-page --project-root "$OLDPWD"
```

**Example 8: Form Submission Workflow**
> "Fill out the contact form on example.com/contact with name 'John Doe', email 'john@example.com', message 'Hello', and submit it"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:navigate -- -u "https://example.com/contact" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:fill -- -s "#name" -v "John Doe" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#email" -v "john@example.com" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:fill -- -s "#message" -v "Hello" --project-root "$OLDPWD" && \
sleep 0.5 && \
npm run bp:click -- -s "button[type='submit']" --project-root "$OLDPWD" && \
sleep 1 && \
npm run bp:screenshot -- -o "contact-form-submitted.png" --project-root "$OLDPWD"
```

**Performance Note**:
- Browser launches once and stays open (fast)
- Each command reuses the same browser instance
- ~100-200ms overhead per command (npm startup)
- CDP communication is near-instant (milliseconds)
- Add `sleep` delays to avoid bot detection (0.5-2 seconds recommended)
- Total workflow time = page loads + sleep delays + command overhead
