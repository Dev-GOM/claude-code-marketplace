---
name: browser-pilot
description: |
  Chrome DevTools Protocol (CDP) browser automation, web scraping, crawling. 브라우저 자동화, 웹 스크래핑, 크롤링.

  Features/기능: screenshot with region control 영역지정스크린샷, viewport control 뷰포트제어, PDF generation PDF생성, web scraping 웹스크래핑, data extraction 데이터추출, form filling 폼작성, login automation 로그인자동화, click/input 클릭/입력, element finder 요소찾기, tab management 탭관리, cookie control 쿠키제어, JavaScript execution JS실행, page navigation 페이지이동, wait for element 요소대기, scroll 스크롤, accessibility tree 접근성트리, console messages 콘솔메시지, network idle 네트워크대기, back/forward 뒤로/앞으로, reload 새로고침, file upload 파일업로드, React compatibility React호환성, Smart Mode with Interaction Map 스마트모드.

  Selectors 셀렉터: CSS selectors (ID, class, attribute), XPath selectors with wildcard * (text-based, structural), XPath indexing (select N-th element with same text). Smart Mode: text-based element search with automatic selector generation.

  Bot detection bypass 봇감지우회 (navigator.webdriver=false). Auto Chrome connection 자동크롬연결. Headless/headed mode. Daemon-based architecture 데몬기반. Interaction Map System 인터랙션맵. React/framework compatibility React/프레임워크호환성.
---

# browser-pilot

## Purpose

Automate Chrome browser using Chrome DevTools Protocol (CDP) with a daemon-based architecture. Maintains persistent browser connection for instant command execution. Features Smart Mode with Interaction Map for reliable element targeting using text-based search instead of brittle selectors.

**Always run scripts with `--help` first** to see usage. DO NOT read the source until you try running the script first and find that a customized solution is abslutely necessary. These scripts can be very large and thus pollute your context window. They exist to be called directly as black-box scripts rather than ingested into your context window.

## When to Use

Use browser-pilot when tasks involve:
- Browser automation, web scraping, data extraction
- Screenshot capture, PDF generation
- Form filling, login automation, element interaction
- Tab management, cookie control, JavaScript execution
- Tasks requiring text-based element selection ("click the 3rd Delete button")
- Bot detection bypass requirements (navigator.webdriver = false)

## ⚠️ Important Guidelines

**When to Ask User:** Use AskUserQuestion tool if:
- Task requirements unclear or ambiguous
- Multiple implementation approaches possible
- Element selectors not working despite troubleshooting
- User intent uncertain (e.g., "automate this" without specifics)

**DO NOT** guess or assume user requirements. Always clarify first.

## Prerequisites

Chrome must be installed. Local scripts initialize automatically on session start (no manual setup required).

## Getting Help

All commands support `--help` for detailed options:

```bash
# See all available commands
node .browser-pilot/bp --help

# Get help for specific command
node .browser-pilot/bp <command> --help
```

## Architecture

**Daemon-based design:**
- Background daemon maintains persistent CDP connection
- CLI commands communicate via IPC
- Auto-starts on first command, stops at session end
- 30-minute inactivity timeout

**Interaction Map System:**
- Auto-generates JSON map of interactive elements on page load
- Enables text-based search with automatic selector generation
- Handles duplicates with indexing
- 10-minute cache with auto-regeneration

## Core Workflow

### 1. Extract Required Information

From user's request, identify:
- Target URL(s) to visit
- Actions to perform (screenshot, click, fill, etc.)
- Element identifiers (text content, CSS selectors, or XPath)
- Output file names (for screenshots/PDFs)
- Data to extract or forms to fill

When information is missing or ambiguous, use AskUserQuestion tool.

### 2. Execute Commands

All commands use `.browser-pilot/bp` wrapper script. Replace placeholders with actual values.

**Navigation:**
```bash
node .browser-pilot/bp navigate -u <url>
node .browser-pilot/bp back
node .browser-pilot/bp forward
node .browser-pilot/bp reload
```

**Interaction (Smart Mode - Recommended):**
```bash
# Text-based element search (map auto-generated)
# No quotes for single words
node .browser-pilot/bp click --text Login --type button
node .browser-pilot/bp fill --text Email -v <value>

# Use quotes when text contains spaces
node .browser-pilot/bp click --text "Sign In" --type button
node .browser-pilot/bp fill --text "Email Address" -v <value>

# Handle duplicates with indexing
node .browser-pilot/bp click --text Delete --index 2

# Filter visible elements only
node .browser-pilot/bp click --text Submit --viewport-only

# Type aliases (auto-expanded)
node .browser-pilot/bp click --text Search --type input  # Matches: input, input-text, input-search, etc.

# Tag-based filtering (HTML tag)
node .browser-pilot/bp click --text Submit --tag button  # Matches all <button> tags
node .browser-pilot/bp fill --text Email --tag input -v user@example.com

# 3-stage fallback (automatic)
# Stage 1: Type search (with alias expansion)
# Stage 2: Tag search (if type fails)
# Stage 3: Map regeneration + retry (up to 3 attempts)
```

**Interaction (Direct Mode - fallback for unique IDs):**
```bash
node .browser-pilot/bp click -s "#login-button"
node .browser-pilot/bp fill -s "input[name='email']" -v <value>
```

**Capture:**
```bash
# Screenshots saved to .browser-pilot/screenshots/
node .browser-pilot/bp screenshot -o <filename>.png

# Capture specific region
node .browser-pilot/bp screenshot -o region.png --clip-x 100 --clip-y 200 --clip-width 800 --clip-height 600

# Set viewport size for responsive testing
node .browser-pilot/bp set-viewport -w 375 -h 667 --scale 2 --mobile

# Get current viewport size
node .browser-pilot/bp get-viewport

# Get screen and viewport information
node .browser-pilot/bp get-screen-info

# PDFs saved to .browser-pilot/pdfs/
node .browser-pilot/bp pdf -o <filename>.pdf
```

**Chain Mode (multiple commands):**
```bash
# Basic chain (no quotes needed for single words)
node .browser-pilot/bp chain navigate -u <url> click --text Submit extract -s .result

# With spaces (quotes required)
node .browser-pilot/bp chain navigate -u <url> click --text "Sign In" fill --text Email -v <email>

# Login workflow
node .browser-pilot/bp chain navigate -u <url> fill --text Email -v <email> fill --text Password -v <password> click --text Login

# Screenshot workflow
node .browser-pilot/bp chain navigate -u <url> wait -s .content-loaded screenshot -o result.png
```

**Chain-specific options:**
- `--timeout <ms>`: Map wait timeout after navigation (default: 10000ms)
- `--delay <ms>`: Fixed delay between commands (overrides random 300-800ms)

**Data Extraction:**
```bash
node .browser-pilot/bp extract -s <selector>
node .browser-pilot/bp content
node .browser-pilot/bp console
node .browser-pilot/bp cookies
```

**Other Actions:**
```bash
node .browser-pilot/bp wait -s <selector> -t <timeout-ms>
node .browser-pilot/bp scroll -s <selector>
node .browser-pilot/bp eval -e <javascript-expression>
```

### 3. Query Interaction Map (when needed)

```bash
# List all element types
node .browser-pilot/bp query --list-types

# Find elements by text
node .browser-pilot/bp query --text <text>

# Check map status
node .browser-pilot/bp map-status

# Force regenerate map
node .browser-pilot/bp regen-map
```

## Best Practices

1. **🌟 Use Smart Mode by default**: Text-based search (`--text`) is more stable than CSS selectors
   - Recommended: `click --text Login`
   - Fallback: `click -s #login-btn` (only for unique IDs)

2. **Maps auto-generate**: No manual map generation needed, happens on page load

3. **Handle duplicates with indexing**: `--index 2` selects 2nd match when multiple elements have same text

4. **Filter with type aliases**: `--type input` auto-expands to match `input`, `input-text`, `input-search`, etc.
   - Generic: `--type input` (matches all input types)
   - Specific: `--type input-search` (exact match only)

5. **Use tag-based search for flexibility**: `--tag button` matches all `<button>` elements regardless of type

6. **3-stage fallback is automatic**: If element not found, system automatically:
   - Tries type-based search (with alias expansion)
   - Falls back to tag-based search
   - Regenerates map and retries (up to 3 attempts)

7. **Verify element visibility**: `--viewport-only` ensures element is on screen

8. **Use Chain Mode for workflows**: Execute multiple commands in sequence for complex automation

9. **Check console for errors**: `node .browser-pilot/bp console` after actions fail

10. **Let daemon auto-manage**: Starts on first command, stops at session end

## References

Detailed documentation in `references/` folder (load as needed):

- **`references/commands-reference.md`**: Complete command list with all options and examples
- **`references/interaction-map.md`**: Smart Mode system, map structure, and query API
- **`references/selector-guide.md`**: Selector strategies, best practices, and troubleshooting

Load references when user needs detailed information about specific features, advanced usage patterns, or troubleshooting guidance.
