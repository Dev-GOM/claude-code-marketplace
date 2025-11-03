---
name: browser-pilot
description: |
  Chrome DevTools Protocol (CDP) browser automation, web scraping, crawling. 브라우저 자동화, 웹 스크래핑, 크롤링.

  Features/기능: screenshot 스크린샷, PDF generation PDF생성, web scraping 웹스크래핑, data extraction 데이터추출, form filling 폼작성, login automation 로그인자동화, click/input 클릭/입력, element finder 요소찾기, tab management 탭관리, cookie control 쿠키제어, JavaScript execution JS실행, page navigation 페이지이동, wait for element 요소대기, scroll 스크롤, accessibility tree 접근성트리, console messages 콘솔메시지, network idle 네트워크대기, back/forward 뒤로/앞으로, reload 새로고침, file upload 파일업로드, React compatibility React호환성.

  Selectors 셀렉터: CSS selectors (ID, class, attribute), XPath selectors with wildcard * (text-based, structural), XPath indexing (select N-th element with same text). Powerful text-based element selection like "click the 3rd button that says 'Delete'" using `//*[contains(text(), 'Delete')]`.

  Bot detection bypass 봇감지우회 (navigator.webdriver=false). Auto Chrome connection 자동크롬연결. Headless/headed mode. React/framework compatibility React/프레임워크호환성. All browser-pilot MCP features. Only needs websocket-client.
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

### Selector Types

Browser Pilot supports **three types of selectors** for element targeting:

#### 1. CSS Selectors (Default)
Standard CSS selector syntax:
```bash
# By ID
npm run bp:click -- -s "#login-button"

# By class
npm run bp:click -- -s ".submit-btn"

# By attribute
npm run bp:fill -- -s "input[name='email']"

# Complex selector
npm run bp:click -- -s "div.container > button.primary"
```

#### 2. XPath Selectors
XPath provides powerful text-based and structural element selection:
```bash
# By text content (most useful!) - Use wildcard * to search all elements
npm run bp:click -- -s "//*[contains(text(), 'Submit')]"

# By exact text - Use wildcard *
npm run bp:click -- -s "//*[text()='Sign In']"

# By attribute - Use wildcard *
npm run bp:fill -- -s "//*[@type='email']"

# Complex path with wildcard
npm run bp:click -- -s "//*[@class='modal']//*[@type='submit']"

# Parent-child relationship with wildcard
npm run bp:click -- -s "//*[contains(text(), 'Welcome')]/following-sibling::button"
```

#### 3. XPath with Indexing ⭐ (Selecting N-th Element)
When multiple elements have the same text/attributes, use indexing to select specific ones:

```bash
# Select 1st "Add to Cart" button - Use wildcard * with indexing
npm run bp:click -- -s "(//*[contains(text(), 'Add to Cart')])[1]"

# Select 3rd "Add to Cart" button
npm run bp:click -- -s "(//*[contains(text(), 'Add to Cart')])[3]"

# Select 5th text input - Use wildcard *
npm run bp:fill -- -s "(//*[@type='text'])[5]" -v "value"

# Select last submit button (if you know there are 3) - Use wildcard *
npm run bp:click -- -s "(//*[@type='submit'])[3]"
```

**Syntax:** `(//*[...])[N]` where N is 1-based (1 = first, 2 = second, etc.)

#### When to Use Each Type?

| Scenario | Recommended Selector | Example |
|----------|---------------------|---------|
| Element has unique ID | CSS `#id` | `#login-btn` |
| Element has unique class | CSS `.class` | `.submit-button` |
| **Text-based selection** | **XPath with wildcard** | `//*[contains(text(), 'Login')]` |
| **Multiple same-text elements** | **XPath + Index + wildcard** | `(//*[text()='Delete'])[2]` |
| N-th child element | Either | CSS: `ul > li:nth-child(3)` <br> XPath: `//ul/li[3]` |
| Partial attribute match | XPath with wildcard | `//*[contains(@href, 'checkout')]` |

**Note:** CSS `>` selects direct children only, while XPath `//` searches all descendants. For equivalent behavior, use XPath `/` (single slash) for direct children.

### Usage

**Method 1: npm scripts (Recommended)**
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"

# Screenshot - Capture webpage
npm run bp:screenshot -- -u "<target-url>" -o "<output-file>.png" --headless --full-page

# Navigate - Go to URL
npm run bp:navigate -- -u "<target-url>"

# Extract - Get text content
npm run bp:extract -- -u "<target-url>" -s "<selector>"

# Click - Click element
npm run bp:click -- -u "<target-url>" -s "<selector>"

# Fill - Fill input field
npm run bp:fill -- -u "<target-url>" -s "<selector>" -v "<value>"

# Eval - Execute JavaScript
npm run bp:eval -- -u "<target-url>" -e "<javascript-expression>"

# PDF - Generate PDF
npm run bp:pdf -- -u "<target-url>" -o "<output-file>.pdf" --landscape

# Cookies - Get cookies
npm run bp:cookies -- -u "<target-url>"

# Tabs - List open tabs
npm run bp:tabs

# New Tab - Open new tab
npm run bp:new-tab -- -u "<target-url>"

# Close Tab - Close tab by index
npm run bp:close-tab -- -i <tab-index>

# Close - Close browser
npm run bp:close

# Hover - Hover over element
npm run bp:hover -- -u "<target-url>" -s "<selector>"

# Press - Press keyboard key
npm run bp:press -- -k "<key>"

# Type - Type text character by character
npm run bp:type -- -t "<text>" -d <delay-ms>

# Upload - Upload file to input
npm run bp:upload -- -u "<target-url>" -s "<selector>" -f "<file-path>"

# Reload - Reload current page
npm run bp:reload

# Back - Navigate back in history
npm run bp:back

# Forward - Navigate forward in history
npm run bp:forward

# Wait - Wait for element to appear
npm run bp:wait -- -s "<selector>" -t <timeout-ms>

# Scroll - Scroll page or element
npm run bp:scroll -- -x <x-position> -y <y-position>

# Content - Get page HTML content
npm run bp:content

# Select - Select dropdown option
npm run bp:select -- -u "<target-url>" -s "<selector>" -v "<option-value>"

# Check - Check checkbox
npm run bp:check -- -u "<target-url>" -s "<selector>"

# Uncheck - Uncheck checkbox
npm run bp:uncheck -- -u "<target-url>" -s "<selector>"

# Drag - Drag and drop element
npm run bp:drag -- -u "<target-url>" --from "<source-selector>" --to "<target-selector>"

# Console - Get console messages
npm run bp:console -- -u "<target-url>"
npm run bp:console -- -u "<target-url>" -e  # Errors only

# Focus - Focus on element
npm run bp:focus -- -u "<target-url>" -s "<selector>"

# Blur - Remove focus from element
npm run bp:blur -- -u "<target-url>" -s "<selector>"

# Extract Data - Extract multiple data points
npm run bp:extract-data -- -u "<target-url>" -s '{"title":"h1","price":".price"}'

# Find - Find element and get info
npm run bp:find -- -u "<target-url>" -s "<selector>"

# Get Property - Get element property value
npm run bp:get-property -- -u "<target-url>" -s "<selector>" -p "value"

# Switch Tab - Switch to tab by index
npm run bp:switch-tab -- -i <tab-index>

# Set Cookie - Set a cookie
npm run bp:set-cookie -- -n "sessionId" -v "abc123" -d "localhost"

# Delete Cookies - Delete cookies
npm run bp:delete-cookies -- -n "sessionId"  # Specific cookie
npm run bp:delete-cookies  # All cookies

# Sleep - Wait for milliseconds
npm run bp:sleep -- -t 2000  # Wait 2 seconds

# Wait Idle - Wait for network idle
npm run bp:wait-idle -- -t 5000

# Accessibility - Get accessibility tree
npm run bp:accessibility -- -u "<target-url>"

# Enable Interception - Enable request interception
npm run bp:enable-interception

# Disable Interception - Disable request interception
npm run bp:disable-interception
```

**Options:**
- `-u, --url` - **Optional** URL to navigate to (if not provided, uses current page)
- `--headless` - Run without visible browser window (faster)
- `--full-page` - Capture entire scrollable page (screenshot only)
- `--output` - Output file path (relative paths save to `.browser-pilot/`)
- `--selector` - CSS selector or XPath for element targeting (use wildcard `//*[...]` for text-based, supports indexing: `(//*[...])[N]`)
- `--value` - Text value to fill in input
- `--expression` - JavaScript code to execute

**Important:** URL is now optional for most commands. If omitted, commands operate on the current page without refreshing. This preserves page state (console logs, network data, form inputs, etc.).

## Bot Detection Avoidance

CDP maintains `navigator.webdriver = false`, bypassing most anti-bot systems.

**Additional Tips**:
- Add `sleep` delays (0.5-2 seconds) between commands to mimic human behavior
- Longer delays for critical actions (login, form submission)
- Use random delays when automating multiple similar actions
- Example: `npm run bp:fill ... && sleep 1 && npm run bp:click ...`

**Test bot detection:**
```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:screenshot -- -u "https://bot.sannysoft.com" -o "bot-test.png" --headless
```
Expected: All checks **PASS** (green).

## Best Practices

1. **Build once** - Run `npm run build` in scripts/ before first use
2. **Use headed mode for debugging** - Omit `--headless` to see browser window
3. **Choose the right selector type**:
   - **CSS for structure**: Use when element has unique ID/class (`#login-btn`, `.submit`)
   - **XPath with wildcard for text**: Use when selecting by visible text (`//*[contains(text(), 'Submit')]`)
   - **XPath indexing for duplicates**: Use when multiple elements share same text (`(//*[text()='Delete'])[2]`)
4. **Relative paths** - Files auto-save to `.browser-pilot/`
5. **⭐ Chain commands with `&&`** - **ALWAYS prefer chaining multiple actions instead of running them one by one**:
   - ✅ **Good**: `npm run bp:navigate ... && sleep 1 && npm run bp:fill ... && npm run bp:click ...`
   - ❌ **Bad**: Running each command separately in different messages
   - **Why?** Browser stays open, no page refresh, preserves state (console logs, network data, form inputs)
   - **Example**: Login workflow needs navigate → fill email → fill password → click submit (4 commands chained)
6. **Add human-like delays** - Use `sleep 0.5-2` between commands to avoid bot detection
7. **Omit URL after first navigate** - Only first command needs `-u`, rest operate on current page without refresh
8. **Respect rate limits** - Add delays between requests
9. **Test selectors first** - Verify selectors in browser DevTools Console (F12):
   - CSS: `document.querySelector('#my-button')`
   - XPath: `$x('//*[text()="Click"]')` (Chrome DevTools shorthand with wildcard)

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
- Add wait time: `npm run bp:eval -- -e "new Promise(r => setTimeout(r, 2000))"`

**Element not found**
- Verify selector with browser DevTools (F12 → Console):
  - CSS: `document.querySelector('your-selector')`
  - XPath: `$x('//*[contains(text(), "Text")]')` (shorthand in Chrome DevTools)
- For text-based selection, use XPath with wildcard: `//*[contains(text(), 'Button Text')]`
- For multiple same-text elements, use XPath indexing with wildcard: `(//*[text()='Delete'])[2]`
- Wait for page load: Add `sleep 1` before interacting with dynamic content

## Technical Details

### Architecture

```
scripts/
├── package.json
├── tsconfig.json (ES2023)
├── dist/ (compiled JavaScript)
│   └── cli/
│       └── cli.js (main entry point)
└── src/
    ├── cli/ (CLI module)
    │   ├── cli.ts (main entry point)
    │   └── commands/ (15 command modules)
    │       ├── navigation.ts, interaction.ts, forms.ts
    │       ├── capture.ts, tabs.ts, cookies.ts
    │       ├── console.ts, network.ts, emulation.ts
    │       ├── dialogs.ts, scroll.ts, wait.ts
    │       └── data.ts, focus.ts, accessibility.ts
    └── cdp/ (Chrome DevTools Protocol)
        ├── browser.ts (Chrome launcher & lifecycle)
        ├── client.ts (WebSocket CDP communication)
        ├── config.ts (Shared config system)
        ├── utils.ts (Utilities)
        └── actions/ (14 action modules)
            ├── capture.ts, cookies.ts, data.ts
            ├── debugging.ts, dialogs.ts, emulation.ts
            ├── forms.ts, helpers.ts, input.ts
            ├── interaction.ts, navigation.ts, network.ts
            └── scroll.ts, tabs.ts, wait.ts

../../../ (plugin root)
└── skills/
    └── browser-pilot-config.json (Shared configuration)
        - Multi-project port management
        - Auto-cleanup settings
        - Project identification by folder name
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
npm run bp:screenshot -- -u "https://example.com" -o "example-screenshot.png" --headless
```

**Example 2: User Request**
> "Extract all h1 headings from github.com"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:extract -- -u "https://github.com" -s "h1"
```

**Example 3: User Request**
> "Click the login button on example.com/login"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:click -- -u "https://example.com/login" -s "button.login-btn"
```

**Example 3b: User Request (XPath)**
> "Click the button that says 'Sign In'"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
# Use XPath with wildcard * to find element by text content
npm run bp:click -- -u "https://example.com/login" -s "//*[contains(text(), 'Sign In')]"
```

**Example 4: User Request**
> "Fill in the email field with test@example.com on the signup page"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:fill -- -u "https://example.com/signup" -s "#email" -v "test@example.com"
```

**Example 5: User Request**
> "Generate a PDF of the documentation page"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
npm run bp:pdf -- -u "https://docs.example.com" -o "documentation.pdf" --landscape
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
# Navigate to login page (URL required)
npm run bp:navigate -- -u "https://example.com/login" && \
sleep 1 && \
# Fill email (no URL - uses current page, no refresh!)
npm run bp:fill -- -s "#email" -v "test@example.com" && \
sleep 0.5 && \
# Fill password (no URL - uses current page)
npm run bp:fill -- -s "#password" -v "mypass123" && \
sleep 0.5 && \
# Click submit (no URL - uses current page)
npm run bp:click -- -s "button[type='submit']"
```

**Note:** Only the first `navigate` command needs `-u`. All subsequent commands operate on the current page without refreshing.

**Example 7: Data Extraction with Screenshot**
> "Go to github.com, extract the main heading, and take a screenshot"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
# Navigate to GitHub (URL required)
npm run bp:navigate -- -u "https://github.com" && \
sleep 1 && \
# Extract heading (no URL - uses current page)
npm run bp:extract -- -s "h1" && \
sleep 0.5 && \
# Screenshot (no URL - uses current page)
npm run bp:screenshot -- -o "github-page.png" --full-page
```

**Example 8: Multiple Elements with Same Text (XPath Indexing)**
> "Click the 3rd 'Add to Cart' button on the product listing page"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
# Navigate to product page
npm run bp:navigate -- -u "https://shop.example.com/products" && \
sleep 1 && \
# Use XPath indexing with wildcard * to select the 3rd element with text "Add to Cart"
npm run bp:click -- -s "(//*[contains(text(), 'Add to Cart')])[3]"
```

**Note:** When multiple elements share the same text, use XPath indexing with wildcard `(//*[...])[N]` to select the N-th element. Standard CSS selectors cannot easily select elements by text content.

**Example 9: Form Submission Workflow**
> "Fill out the contact form on example.com/contact with name 'John Doe', email 'john@example.com', message 'Hello', and submit it"

```bash
cd "${CLAUDE_SKILL_ROOT}/scripts"
# Navigate to contact page (URL required)
npm run bp:navigate -- -u "https://example.com/contact" && \
sleep 1 && \
# Fill name (no URL - uses current page)
npm run bp:fill -- -s "#name" -v "John Doe" && \
sleep 0.5 && \
# Fill email (no URL - uses current page)
npm run bp:fill -- -s "#email" -v "john@example.com" && \
sleep 0.5 && \
# Fill message (no URL - uses current page)
npm run bp:fill -- -s "#message" -v "Hello" && \
sleep 0.5 && \
# Submit form (no URL - uses current page)
npm run bp:click -- -s "button[type='submit']" && \
sleep 1 && \
# Screenshot (no URL - uses current page)
npm run bp:screenshot -- -o "contact-form-submitted.png"
```

**Performance Note**:
- Browser launches once and stays open (fast)
- Each command reuses the same browser instance
- **No page refresh when URL is omitted** - preserves page state, console logs, network data
- ~100-200ms overhead per command (npm startup)
- CDP communication is near-instant (milliseconds)
- Add `sleep` delays to avoid bot detection (0.5-2 seconds recommended)
- Total workflow time = initial page load + sleep delays + command overhead (no reload overhead!)
