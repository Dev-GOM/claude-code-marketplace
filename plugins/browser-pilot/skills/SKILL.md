---
name: browser-pilot
description: |
  Chrome DevTools Protocol (CDP) browser automation, web scraping, crawling. 브라우저 자동화, 웹 스크래핑, 크롤링.

  Features/기능: screenshot 스크린샷, PDF generation PDF생성, web scraping 웹스크래핑, data extraction 데이터추출, form filling 폼작성, login automation 로그인자동화, click/input 클릭/입력, element finder 요소찾기, tab management 탭관리, cookie control 쿠키제어, JavaScript execution JS실행, page navigation 페이지이동, wait for element 요소대기, scroll 스크롤, accessibility tree 접근성트리, console messages 콘솔메시지, network idle 네트워크대기, back/forward 뒤로/앞으로, reload 새로고침, file upload 파일업로드, React compatibility React호환성, Smart Mode with Interaction Map 스마트모드.

  Selectors 셀렉터: CSS selectors (ID, class, attribute), XPath selectors with wildcard * (text-based, structural), XPath indexing (select N-th element with same text). Smart Mode: text-based element search with automatic selector generation.

  Bot detection bypass 봇감지우회 (navigator.webdriver=false). Auto Chrome connection 자동크롬연결. Headless/headed mode. Daemon-based architecture 데몬기반. Interaction Map System 인터랙션맵. React/framework compatibility React/프레임워크호환성.
---

# browser-pilot

## Purpose

Automate Chrome browser using Chrome DevTools Protocol (CDP) with a daemon-based architecture. Maintains persistent browser connection for instant command execution. Features Smart Mode with Interaction Map for reliable element targeting using text-based search instead of brittle selectors.

## When to Use

Use browser-pilot when tasks involve:
- Browser automation, web scraping, data extraction
- Screenshot capture, PDF generation
- Form filling, login automation, element interaction
- Tab management, cookie control, JavaScript execution
- Tasks requiring text-based element selection ("click the 3rd Delete button")
- Bot detection bypass requirements (navigator.webdriver = false)

## Prerequisites

Chrome must be installed. Local scripts initialize automatically on session start (no manual setup required).

## Architecture

**Daemon-based design** for optimal performance:
- Background daemon maintains persistent CDP connection to Chrome
- CLI commands communicate via IPC (Unix socket/Named pipe)
- Console messages and network errors collected continuously
- Auto-clear on navigation, auto-start on first command
- Auto-shutdown after 30 minutes of inactivity

**Interaction Map System** for reliable element targeting:
- Auto-generates JSON map of all interactive elements on page load
- Supports text-based search with automatic selector generation
- Handles duplicate elements with indexing
- Falls back to alternative selectors on failure
- Cache expires after 10 minutes

## Core Workflow

### 1. Extract Required Information

From user's request, identify:
- Target URL(s) to visit
- Actions to perform (screenshot, click, fill, etc.)
- Element identifiers (text content, CSS selectors, or XPath)
- Output file names (for screenshots/PDFs)
- Data to extract or forms to fill

When information is missing or ambiguous, use AskUserQuestion tool to provide clear options.

### 2. Execute Commands

All commands use the CLI wrapper script `.browser-pilot/bp` which forwards to project-local scripts. Replace placeholders (`<target-url>`, `<selector>`, etc.) with actual values.

#### Single Command Execution

**Navigation:**
```bash
node .browser-pilot/bp navigate -u "<url>"
node .browser-pilot/bp back
node .browser-pilot/bp forward
node .browser-pilot/bp reload
```

**Interaction (Direct Mode):**
```bash
node .browser-pilot/bp click -s "#login-button"
node .browser-pilot/bp fill -s "input[name='email']" -v "test@example.com"
node .browser-pilot/bp hover -s ".menu-item"
```

**Interaction (Smart Mode - recommended):**
```bash
# Text-based element search (map auto-generated on page load)
node .browser-pilot/bp click --text "Login" --type button

# Handle duplicates with indexing
node .browser-pilot/bp click --text "Delete" --index 2 --type button

# Filter visible elements only
node .browser-pilot/bp click --text "Submit" --viewport-only
```

**Data Extraction:**
```bash
node .browser-pilot/bp extract -s ".result"
node .browser-pilot/bp content
node .browser-pilot/bp console
node .browser-pilot/bp cookies
```

**Capture:**
```bash
node .browser-pilot/bp screenshot -o "page.png" --full-page
node .browser-pilot/bp pdf -o "page.pdf"
```

**Other Actions:**
```bash
node .browser-pilot/bp wait -s ".content-loaded" -t 3000
node .browser-pilot/bp scroll -s ".element"
node .browser-pilot/bp eval -e "document.title"
node .browser-pilot/bp upload -s "input[type=file]" -f "file.txt"
```

#### Chain Mode

Execute multiple commands sequentially in a single call:

```bash
# Basic chain: navigate → click → extract
node .browser-pilot/bp chain navigate -u "<url>" click --text "Submit" extract -s ".result"

# Login workflow
node .browser-pilot/bp chain navigate -u "<login-url>" fill --text "Email" -v "user@example.com" fill --text "Password" -v "secret" click --text "Login"

# Screenshot workflow with navigation
node .browser-pilot/bp chain navigate -u "<url>" wait -s ".content-loaded" -t 3000 screenshot -o "page.png"
```

Chain mode stops if any command fails. Each command executes after the previous one completes.

### 3. Selector Syntax

**CSS Selectors** (for elements with unique IDs/classes):
- By ID: `#login-button`
- By class: `.submit-btn`
- By attribute: `input[name='email']`
- Complex: `div.container > button.primary`

**XPath Selectors** (for text-based or structural selection):
- By text (wildcard `*`): `//*[contains(text(), 'Submit')]`
- By exact text: `//*[text()='Sign In']`
- By attribute: `//*[@type='email']`
- With indexing: `(//*[contains(text(), 'Delete')])[2]`

**Smart Mode Options** (recommended for reliability):
- `--text <text>`: Search by text content
- `--index <number>`: Select N-th match (1-based)
- `--type <type>`: Filter by element type (button, input, etc.)
- `--viewport-only`: Only search visible elements

## Smart Mode Workflow

Smart Mode eliminates brittle selectors by using text-based element search with automatic selector generation from interaction maps.

### When to Use Smart Mode

Use Smart Mode when:
- Elements lack unique IDs or stable classes
- Need to select "the 2nd Delete button" or similar
- Selectors frequently break due to UI changes
- Working with dynamically generated content

### Smart Mode Steps

1. **Navigate to target page** (map generates automatically):
```bash
node .browser-pilot/bp navigate -u "<target-url>"
```

2. **Execute actions with text-based search**:
```bash
# Click first "Add to Cart" button
node .browser-pilot/bp click --text "Add to Cart" --index 1

# Click visible "Delete" buttons only
node .browser-pilot/bp click --text "Delete" --viewport-only --type button

# Fill input by label text
node .browser-pilot/bp fill --text "Username" -v "testuser"
```

### Interaction Map

Maps are auto-generated on page load and stored in `.browser-pilot/interaction-map.json` with:
- **Key-value structure**: Direct ID access (`elements[id]`)
- **Indexes**: Fast lookup by text, type, or visibility
- **Multiple selectors**: byText (XPath), byId, byCSS, byRole, byAriaLabel
- **Smart priority**: byId > byText(indexed) > byCSS > byRole
- **10-minute cache**: Automatically regenerates after expiration

Map regenerates automatically on navigation or after 10-minute cache expiration.

#### Querying the Map

Explore the interaction map to find elements:

```bash
# List all element types with counts
node .browser-pilot/bp query --list-types

# List all text contents (default: 20 items)
node .browser-pilot/bp query --list-texts

# List button text contents only
node .browser-pilot/bp query --list-texts --type button

# Find elements by text
node .browser-pilot/bp query --text "Submit"

# Find all buttons (paginated, default 20)
node .browser-pilot/bp query --type button

# Show all buttons with detailed info
node .browser-pilot/bp query --type button --limit 0 --verbose

# Pagination
node .browser-pilot/bp query --type button --limit 10 --offset 20

# Check map status
node .browser-pilot/bp map-status

# Force regenerate map
node .browser-pilot/bp regen-map
```

## Daemon Management

Daemon starts automatically on first command and stops automatically at session end or when idle for 30 minutes. Manual control:

```bash
# Start daemon (optional, auto-starts)
node .browser-pilot/bp daemon-start

# Check status
node .browser-pilot/bp daemon-status

# Restart daemon
node .browser-pilot/bp daemon-restart

# Stop daemon
node .browser-pilot/bp daemon-stop
```

## Best Practices

1. **Use Smart Mode for reliability**: Text-based search is more stable than CSS selectors
2. **Maps auto-generate**: No manual map generation needed, happens on page load
3. **Prefer text-based XPath with wildcards**: `//*[contains(text(), '...')]` works across frameworks
4. **Use indexing for duplicates**: `--index 2` selects 2nd match
5. **Filter by type**: `--type button` narrows search results
6. **Verify element visibility**: `--viewport-only` ensures element is on screen
7. **Check console for errors**: `node .browser-pilot/bp console` after actions fail
8. **Let daemon auto-manage**: Automatically starts on first command, stops at session end
9. **Use Chain Mode for workflows**: Execute multiple commands in sequence for complex tasks

## References

Detailed documentation available in `references/` folder:
- `references/interaction-map.md`: Interaction Map system architecture and auto-generation
- `references/commands-reference.md`: Complete command reference with all options
- `references/selector-guide.md`: Advanced selector strategies and examples

Load references as needed for detailed information about specific features.
