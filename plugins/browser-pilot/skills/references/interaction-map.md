# Interaction Map System

## Overview

The Interaction Map system provides reliable element targeting for browser automation by generating a structured JSON representation of all interactive elements on a webpage. This eliminates brittle CSS selectors and enables text-based element search with automatic selector generation.

## Architecture

### Components

1. **Map Generator** (`src/cdp/map/generate-interaction-map.ts`)
   - Browser-side script that extracts all interactive elements
   - Generates multiple selector types for each element
   - Handles SVG elements, disabled states, React components

2. **Map Manager** (`src/daemon/map-manager.ts`)
   - Daemon-level automatic map generation on page load
   - 10-minute cache with auto-regeneration
   - URL-based cache validation
   - Event-driven DOM stabilization detection

3. **Map Query Module** (`src/cdp/map/query-map.ts`)
   - Loads and queries interaction maps
   - Searches by text, type, ID, visibility
   - Returns best selector with alternatives

4. **CLI Integration** (`src/cli/commands/interaction.ts`)
   - Smart Mode options: `--text`, `--index`, `--type`, `--viewport-only`
   - Automatic map querying before action execution
   - Fallback to alternative selectors on failure

### Automatic Map Generation

Maps are automatically generated when:
- Navigating to a new page (`node .browser-pilot/bp navigate -u "<url>"`)
- Page reload (`node .browser-pilot/bp reload`)
- Cache expires (10 minutes)
- Manual force generation (daemon command)

No manual map generation needed - the daemon handles it automatically.

Output location: `.browser-pilot/interaction-map.json`

## JSON Structure

Maps use a hybrid structure optimized for both direct access and search:

```json
{
  "url": "https://example.com",
  "timestamp": "2025-11-05T14:39:03.598+09:00",
  "viewport": {
    "width": 2560,
    "height": 1305
  },
  "elements": {
    "elem_0": {
      "id": "elem_0",
      "type": "button",
      "tag": "button",
      "text": "Submit",
      "value": null,
      "selectors": {
        "byText": "//button[contains(text(), 'Submit')]",
        "byId": "#submit-btn",
        "byCSS": "button.btn.btn-primary",
        "byRole": "[role='button']",
        "byAriaLabel": "[aria-label='Submit form']"
      },
      "attributes": {
        "id": "submit-btn",
        "class": "btn btn-primary",
        "disabled": false
      },
      "position": {
        "x": 1275,
        "y": 650
      },
      "visibility": {
        "inViewport": true,
        "visible": true,
        "obscured": false
      },
      "context": {
        "section": "Form"
      }
    }
  },
  "indexes": {
    "byText": {
      "Submit": ["elem_0", "elem_15"],
      "Delete": ["elem_5", "elem_6", "elem_7"]
    },
    "byType": {
      "button": ["elem_0", "elem_1", "elem_2"],
      "input-text": ["elem_10", "elem_11"]
    },
    "inViewport": ["elem_0", "elem_1", "elem_2", "elem_10"]
  },
  "statistics": {
    "total": 45,
    "byType": {
      "button": 12,
      "input-text": 5,
      "a": 8
    },
    "duplicates": 3
  }
}
```

### Key Features

**1. Key-Value Structure** (`elements`)
- Direct ID access: `map.elements["elem_0"]`
- Avoids array iteration for known IDs

**2. Indexes** (fast lookup)
- `byText`: Maps text content → element IDs
- `byType`: Maps element types → element IDs
- `inViewport`: Array of visible element IDs

**3. Multiple Selectors**
- `byText`: XPath with tag name (e.g., `//button[contains(text(), 'Submit')]`)
- `byId`: CSS ID selector (highest priority)
- `byCSS`: CSS class selector
- `byRole`: ARIA role selector
- `byAriaLabel`: ARIA label selector

**4. Automatic Indexing**
- Duplicate text elements get indexed: `(//button[contains(text(), 'Delete')])[2]`
- Enables "click the 3rd Delete button" functionality

**5. Auto-Caching**
- 10-minute cache TTL
- Automatically regenerates on expiration or navigation
- URL-based validation to prevent stale maps

## Element Detection

### Interactive Element Types

The map generator detects:
- Standard inputs: `<input>`, `<button>`, `<select>`, `<textarea>`
- Links: `<a href="...">`
- ARIA roles: `button`, `link`, `textbox`, `checkbox`, `radio`, etc.
- Click handlers: Elements with `onclick`, React event handlers
- Cursor style: `cursor: pointer`
- Tab-navigable: `tabindex >= 0`

### Special Cases

**SVG Elements:**
```typescript
// Handles SVGAnimatedString className
const className = typeof el.className === 'string'
  ? el.className
  : (el.className.baseVal || '');
```

**Disabled Buttons:**
```typescript
// Standard interactive elements included even if disabled
const isStandardInteractive = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(tag);
if (!isStandardInteractive && style.pointerEvents === 'none') {
  return false; // Skip
}
```

**React Components:**
```typescript
// Detect React event handlers
const reactProps = Object.keys(el).filter(key => key.startsWith('__react'));
const hasReactHandlers = reactProps.some(prop => {
  const value = el[prop];
  return value && typeof value === 'object' && value.onClick;
});
```

## Selector Generation

### Priority Order

Query system selects best selector with this priority:

1. **byId** (highest priority)
   - Most stable, unique identifier
   - Example: `#login-button`

2. **byText** (indexed for duplicates)
   - Tag-specific XPath: `//button[contains(text(), 'Submit')]`
   - With indexing: `(//button[contains(text(), 'Delete')])[2]`

3. **byCSS**
   - Safe classes only (alphanumeric, hyphens, underscores)
   - Example: `button.btn.btn-primary`
   - Skips generic tag-only selectors

4. **byRole**
   - ARIA role attribute
   - Example: `[role="button"]`

5. **byAriaLabel** (lowest priority)
   - ARIA label attribute
   - Example: `[aria-label="Submit form"]`

### Text-Based XPath

XPath selectors include tag names for precision:

**Before:** `//*[contains(text(), 'Submit')]`
- Problem: Matches any element with that text (div, span, button, etc.)

**After:** `//button[contains(text(), 'Submit')]`
- Solution: Only matches `<button>` elements
- More precise, faster execution

## Query API

### Query Options

```typescript
interface QueryOptions {
  text?: string;          // Search by text content
  type?: string;          // Filter by element type
  index?: number;         // Select nth match (1-based)
  viewportOnly?: boolean; // Only visible elements
  id?: string;            // Direct ID lookup
}
```

### Usage Examples

**Direct ID lookup:**
```typescript
const results = queryMap(map, { id: 'elem_0' });
// Returns: Single element with that ID
```

**Text search:**
```typescript
const results = queryMap(map, { text: 'Delete' });
// Returns: All elements containing "Delete"
```

**Text + index:**
```typescript
const results = queryMap(map, { text: 'Delete', index: 2 });
// Returns: Second element containing "Delete"
```

**Type filter:**
```typescript
const results = queryMap(map, { type: 'button' });
// Returns: All button elements
```

**Text + type:**
```typescript
const results = queryMap(map, { text: 'Submit', type: 'button' });
// Returns: Button elements containing "Submit"
```

**Visibility filter:**
```typescript
const results = queryMap(map, { text: 'Add to Cart', viewportOnly: true });
// Returns: Only "Add to Cart" elements currently visible
```

### Fuzzy Search

When exact text match fails, falls back to fuzzy search:
```typescript
// Query: { text: 'menu' }
// Matches: "메뉴로 돌아가기", "Main Menu", "menu button"
// Case-insensitive, substring matching
```

## CLI Smart Mode

### Click Command

```bash
# Search by text
node .browser-pilot/bp click --text "Submit"

# With index for duplicates
node .browser-pilot/bp click --text "Delete" --index 2

# Filter by type
node .browser-pilot/bp click --text "Add to Cart" --type button

# Visible elements only
node .browser-pilot/bp click --text "Next" --viewport-only
```

### Fill Command

```bash
# Search input by label
node .browser-pilot/bp fill --text "Username" -v "testuser"

# Filter by input type
node .browser-pilot/bp fill --text "Password" -v "secret" --type input-password

# Visible inputs only
node .browser-pilot/bp fill --text "Email" -v "test@example.com" --viewport-only
```

## Cache Management

### Automatic Cache

Maps are cached for 10 minutes with automatic management:
- Auto-generated on first page load
- Auto-regenerated after 10 minutes
- Auto-regenerated on navigation
- URL validation prevents stale maps

Cache location: `.browser-pilot/map-cache.json`

### Manual Control (Daemon Commands)

Force regenerate map:
```bash
npm run bp:daemon-send -- --command MAP_GENERATE --params '{"force":true}'
```

Query current map:
```bash
npm run bp:daemon-send -- --command MAP_QUERY --params '{"text":"Submit","type":"button"}'
```

## Best Practices

1. **Let daemon auto-manage**
   - Maps generate automatically on page load
   - No manual generation needed

2. **Use text + index for duplicates**
   - Better than CSS classes that may change
   - More readable: "click 2nd Delete" vs complex selector

3. **Filter by type**
   - Narrows results when text is ambiguous
   - `--type button` excludes links, divs with same text

4. **Verify visibility**
   - `--viewport-only` ensures element is on screen
   - Avoids clicking hidden/off-screen elements

5. **Check map statistics**
   - Review duplicates count in map JSON
   - Helps determine if indexing is needed

6. **Fallback handling**
   - Smart Mode automatically tries alternative selectors
   - Check console for errors if action fails

## Troubleshooting

### Element not found in map

**Cause:** Element may not be detected as interactive

**Solutions:**
1. Check if element has click handler: Look for `onclick`, React handlers
2. Verify cursor style: Should be `pointer` for clickable elements
3. Check ARIA role: Element should have appropriate role
4. Force regenerate map if recently added to page

### Wrong element selected

**Cause:** Multiple elements with same text

**Solutions:**
1. Use `--index` to select specific match
2. Add `--type` filter to narrow results
3. Use `--viewport-only` to exclude off-screen elements
4. Check element position in map JSON

### Map out of date

**Cause:** Page changed after map generation

**Solutions:**
1. Maps auto-regenerate after 10 minutes
2. Force regenerate with daemon command
3. Check timestamp in map JSON
4. Verify URL matches current page

### Cache not updating

**Cause:** URL changed but cache still returns old map

**Solutions:**
1. Daemon validates URL before returning cache
2. Force regenerate with `force:true` parameter
3. Check cache file for URL mismatch
4. Restart daemon if persists

## Future Enhancements

Current status (v1.0.0):
- ✓ Automatic map generation on page load
- ✓ Daemon-level map caching and management
- ✓ Action verification with automatic retry
- ✓ URL-based cache validation

Planned improvements:
- Visual map inspector tool
- Map diff for debugging selector changes
- Performance metrics and optimization
