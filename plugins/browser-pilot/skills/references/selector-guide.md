# Selector Strategies Guide

## Selector Types Overview

| Selector Type | Stability | Speed | Best For |
|--------------|-----------|-------|----------|
| CSS ID | ⭐⭐⭐⭐⭐ | Fast | Unique IDs |
| Smart Mode (text) | ⭐⭐⭐⭐ | Medium | Text-based UI |
| XPath (text) | ⭐⭐⭐⭐ | Medium | Text content |
| CSS Class | ⭐⭐ | Fast | Stable classes |
| XPath (structure) | ⭐⭐ | Medium | DOM structure |

## Decision Tree

```
Does element have unique ID?
├─ YES → Use CSS: #element-id
└─ NO ↓

Is element identified by text?
├─ YES → Use Smart Mode: --text "Submit"
└─ NO ↓

Does element have stable class?
├─ YES → Use CSS: .stable-class
└─ NO ↓

Can use ARIA attributes?
├─ YES → Use XPath: //*[@role='button']
└─ NO ↓

Use structural XPath
```

## CSS Selectors

### By ID (Most Stable)
```bash
node .browser-pilot/bp click -s "#login-button"
node .browser-pilot/bp click -s "#user-menu"
```

### By Class
```bash
node .browser-pilot/bp click -s ".submit-btn"
node .browser-pilot/bp click -s ".modal .close-button"
```

### By Attribute
```bash
node .browser-pilot/bp fill -s "input[name='email']" -v "test@example.com"
node .browser-pilot/bp click -s "button[data-action='submit']"
```

### Complex Selectors
```bash
# Direct child
node .browser-pilot/bp click -s "div.modal > button.primary"

# Descendant
node .browser-pilot/bp click -s "form .submit-button"

# Nth-child
node .browser-pilot/bp click -s "ul > li:nth-child(3)"

# Multiple classes
node .browser-pilot/bp click -s "button.btn.btn-primary.btn-lg"
```

## XPath Selectors

### Text-Based (Most Reliable)

**With Tag Name (Recommended):**
```bash
# Specific tag with text
node .browser-pilot/bp click -s "//button[contains(text(), 'Submit')]"
node .browser-pilot/bp click -s "//a[contains(text(), 'Learn More')]"

# Exact text match
node .browser-pilot/bp click -s "//button[text()='Sign In']"
```

**With Wildcard (Avoid):**
```bash
# Searches all elements (slow, imprecise)
node .browser-pilot/bp click -s "//*[contains(text(), 'Submit')]"
```

### Indexed XPath (Duplicates)
```bash
# First match
node .browser-pilot/bp click -s "(//button[contains(text(), 'Delete')])[1]"

# Third match
node .browser-pilot/bp click -s "(//button[contains(text(), 'Delete')])[3]"

# Last match (if 5 exist)
node .browser-pilot/bp click -s "(//button[contains(text(), 'Delete')])[5]"
```

### Attribute-Based
```bash
# By type
node .browser-pilot/bp fill -s "//*[@type='email']" -v "test@example.com"

# By role
node .browser-pilot/bp click -s "//*[@role='button']"

# By data attribute
node .browser-pilot/bp click -s "//*[@data-testid='submit']"

# Partial match
node .browser-pilot/bp click -s "//*[contains(@href, 'checkout')]"
```

### Structural XPath
```bash
# Parent-child
node .browser-pilot/bp click -s "//div[@class='modal']//button[@type='submit']"

# Following sibling
node .browser-pilot/bp click -s "//h1[contains(text(), 'Welcome')]/following-sibling::button"

# Preceding sibling
node .browser-pilot/bp click -s "//button[contains(text(), 'Next')]/preceding-sibling::button"

# Parent
node .browser-pilot/bp click -s "//button[@type='submit']/parent::form"
```

## Smart Mode Selectors

### Basic Text Search
```bash
node .browser-pilot/bp click --text "Submit"
node .browser-pilot/bp click --text "Add to Cart"
node .browser-pilot/bp fill --text "Username" -v "test"
```

### With Type Filter
```bash
# Only buttons
node .browser-pilot/bp click --text "Submit" --type button

# Only links
node .browser-pilot/bp click --text "Learn More" --type a

# Only text inputs
node .browser-pilot/bp fill --text "Email" -v "test@example.com" --type input-text
```

### With Indexing
```bash
# Second "Delete" button
node .browser-pilot/bp click --text "Delete" --index 2 --type button

# First "Submit" button
node .browser-pilot/bp click --text "Submit" --index 1
```

### With Visibility Filter
```bash
# Only visible elements
node .browser-pilot/bp click --text "Next" --viewport-only

# Visible "Add to Cart" buttons
node .browser-pilot/bp click --text "Add to Cart" --viewport-only --type button
```

## Common Patterns

### Form Filling

**Direct mode (fast but brittle):**
```bash
node .browser-pilot/bp fill -s "#email" -v "user@example.com"
node .browser-pilot/bp fill -s "#password" -v "secret"
node .browser-pilot/bp click -s "#login-btn"
```

**Smart mode (slower but reliable, map auto-generated on page load):**
```bash
node .browser-pilot/bp fill --text "Email" -v "user@example.com"
node .browser-pilot/bp fill --text "Password" -v "secret"
node .browser-pilot/bp click --text "Login" --type button
```

**Chain mode (Direct):**
```bash
node .browser-pilot/bp chain navigate -u <url> fill -s #email -v <email> fill -s #password -v <password> click -s #login-btn
```

**Chain mode (Smart - recommended):**
```bash
node .browser-pilot/bp chain navigate -u <url> fill --text Email -v <email> fill --text Password -v <password> click --text Login --type button
```

**Note:** Chain mode auto-waits for map generation after navigation and adds human-like delays between commands.

### Clicking Nth Item

**CSS nth-child:**
```bash
node .browser-pilot/bp click -s "ul.products > li:nth-child(3) button"
```

**XPath indexing:**
```bash
node .browser-pilot/bp click -s "(//ul[@class='products']//button)[3]"
```

**Smart mode indexing:**
```bash
node .browser-pilot/bp click --text "Add to Cart" --index 3
```

### Modal Interactions

**CSS scoping:**
```bash
node .browser-pilot/bp click -s ".modal .btn-primary"
node .browser-pilot/bp click -s "#confirm-modal button.submit"
```

**XPath scoping:**
```bash
node .browser-pilot/bp click -s "//div[@class='modal']//button[contains(text(), 'Confirm')]"
```

**Smart mode:**
```bash
node .browser-pilot/bp click --text "Confirm" --type button --viewport-only
```

### Dynamic Content

**Wait then interact:**
```bash
node .browser-pilot/bp wait -s ".loading-complete" -t 5000
node .browser-pilot/bp click --text "Load More" --viewport-only
```

**Chain mode:**
```bash
node .browser-pilot/bp chain wait -s ".loading-complete" -t 5000 click --text "Load More" --viewport-only
```

## Best Practices

### 1. Prefer Stable Identifiers

**Good: Unique ID**
```bash
node .browser-pilot/bp click -s "#checkout-button"
```

**Good: Data attribute**
```bash
node .browser-pilot/bp click -s "button[data-testid='submit']"
```

**Avoid: Generated classes**
```bash
node .browser-pilot/bp click -s ".btn-a7s9d2f"  # Likely to change
```

### 2. Use Smart Mode for Text-Based UI

**Good: Text content is stable**
```bash
node .browser-pilot/bp click --text "Continue to Checkout"
```

**Avoid: CSS classes for text buttons**
```bash
node .browser-pilot/bp click -s ".checkout-btn-primary-lg"
```

### 3. Scope Selectors When Possible

**Good: Scoped to container**
```bash
node .browser-pilot/bp click -s "#user-menu button.logout"
```

**Avoid: Global selector**
```bash
node .browser-pilot/bp click -s "button.logout"  # May match wrong button
```

### 4. Handle Duplicates Explicitly

**Good: Specific index**
```bash
node .browser-pilot/bp click --text "Delete" --index 2
```

**Good: Scoped selector**
```bash
node .browser-pilot/bp click -s "#product-123 button.delete"
```

**Avoid: Ambiguous selector**
```bash
node .browser-pilot/bp click --text "Delete"  # Which Delete button?
```

### 5. Verify Element Visibility

**Good: Checks visibility**
```bash
node .browser-pilot/bp click --text "Submit" --viewport-only
```

**Consider: May be off-screen**
```bash
node .browser-pilot/bp click --text "Submit"
```

## Troubleshooting

### "Element not found"

**Solution 1: Use Smart Mode**
```bash
# Map auto-generates on page load, just use text search
node .browser-pilot/bp click --text "Submit"
```

**Solution 2: Wait for element**
```bash
node .browser-pilot/bp wait -s "#submit-button" -t 5000
node .browser-pilot/bp click -s "#submit-button"
```

**Solution 3: Check selector in DevTools**
```javascript
// In browser console:
document.querySelector('#submit-button')  // CSS
$x("//button[contains(text(), 'Submit')]")  // XPath
```

### "Multiple elements match"

**Solution 1: Use indexing**
```bash
node .browser-pilot/bp click --text "Delete" --index 2
```

**Solution 2: Add more specificity**
```bash
# Before
node .browser-pilot/bp click -s "button"

# After
node .browser-pilot/bp click -s "#product-list button.delete"
```

**Solution 3: Filter by type**
```bash
node .browser-pilot/bp click --text "Submit" --type button
```

### "Wrong element clicked"

**Solution 1: Inspect map**
```bash
# Check interaction map JSON
cat .browser-pilot/interaction-map.json | jq '.indexes.byText'

# Find element IDs with your text
# Verify positions and types
```

**Solution 2: Use visibility filter**
```bash
node .browser-pilot/bp click --text "Add to Cart" --viewport-only
```

**Solution 3: Be more specific**
```bash
# Before
node .browser-pilot/bp click --text "Submit"

# After
node .browser-pilot/bp click --text "Submit Order" --type button
```

## Framework-Specific Tips

### React Applications
- Use `data-testid` attributes if available
- Text-based XPath works well (stable)
- Smart Mode recommended for dynamic classes
- Avoid CSS classes (often generated)

### Angular Applications
- Use `ng-` attributes if available
- Text-based selectors are stable
- Smart Mode recommended
- Avoid dynamic `_ngcontent` attributes

### Vue Applications
- Use `data-` attributes if available
- Text-based XPath works well
- Smart Mode recommended
- Avoid scoped CSS classes

### Plain HTML
- CSS selectors work well
- IDs and classes are usually stable
- Direct mode is often sufficient
- Use Smart Mode for dynamic content
