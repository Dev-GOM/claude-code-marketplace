/**
 * Browser script to generate interaction map.
 * This script runs in the browser context via Runtime.evaluate.
 */

export interface InteractionElement {
  id: string;
  type: string;
  tag: string;
  text?: string;
  value?: string;
  selectors: {
    byText?: string;      // Text-based XPath: //*[contains(text(), '...')]
    byId?: string;        // ID selector: #button-id
    byCSS?: string;       // CSS selector: button.class-name
    byRole?: string;      // Role-based: button, input, etc.
    byAriaLabel?: string; // ARIA label: [aria-label="..."]
  };
  attributes: Record<string, unknown>;
  position: { x: number; y: number };
  visibility: {
    inViewport: boolean;
    visible: boolean;
    obscured: boolean;
  };
  context?: {
    parent?: string;
    section?: string;
  };
}

/**
 * Generate the browser script that finds all interactive elements.
 * Returns a string that can be executed via Runtime.evaluate.
 */
export function getInteractionMapScript(): string {
  return `
    (function() {
      const elements = [];
      let idCounter = 0;

      // Helper: Escape text for XPath (handles both single and double quotes)
      function escapeXPath(text) {
        // If no quotes, use single quotes
        if (!text.includes("'") && !text.includes('"')) {
          return "'" + text + "'";
        }
        // If only single quotes, use double quotes
        if (text.includes("'") && !text.includes('"')) {
          return '"' + text + '"';
        }
        // If only double quotes, use single quotes
        if (!text.includes("'") && text.includes('"')) {
          return "'" + text + "'";
        }
        // Both present: use concat()
        const parts = text.split("'");
        const escaped = parts.map((part, i) => {
          if (i === 0) return "'" + part + "'";
          return "\\"'\\"," + "'" + part + "'";
        }).join(',');
        return "concat(" + escaped + ")";
      }

      // Helper: Generate Browser Pilot compatible selectors
      function getBrowserPilotSelectors(el) {
        const selectors = {};

        // 1. Text-based XPath (most stable for Browser Pilot)
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length <= 50) {
          const tagName = el.tagName.toLowerCase();
          selectors.byText = "//" + tagName + "[contains(text(), " + escapeXPath(text) + ")]";
        }

        // 2. ID selector (best if available)
        if (el.id) {
          selectors.byId = '#' + el.id;
        }

        // 3. CSS selector (with safe classes only)
        if (el.className) {
          const className = typeof el.className === 'string'
            ? el.className
            : (el.className.baseVal || '');

          if (className && className.trim) {
            const classes = className.trim().split(/\\s+/)
              .filter(cls => /^[a-zA-Z0-9_-]+$/.test(cls))
              .slice(0, 3);

            if (classes.length > 0) {
              selectors.byCSS = el.tagName.toLowerCase() + '.' + classes.join('.');
            }
          }
        }

        // Fallback CSS selector (tag only)
        if (!selectors.byCSS) {
          selectors.byCSS = el.tagName.toLowerCase();
        }

        // 4. Role-based selector
        const role = el.getAttribute('role');
        if (role) {
          selectors.byRole = '[role="' + role + '"]';
        }

        // 5. ARIA label selector
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) {
          // For CSS selectors, escape both quotes properly
          const escapedLabel = ariaLabel.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"');
          selectors.byAriaLabel = "[aria-label='" + escapedLabel + "']";
        }

        return selectors;
      }

      // Helper: Check if element is actually visible and interactive
      function isInteractive(el) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Check visibility
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return false;
        }

        // Check size
        if (rect.width === 0 || rect.height === 0) {
          return false;
        }

        // Check pointer events (but allow standard interactive elements even if disabled)
        const isStandardInteractive = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(el.tagName);
        if (style.pointerEvents === 'none' && !isStandardInteractive) {
          return false;
        }

        return true;
      }

      // Helper: Check if element is obscured
      function isObscured(el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);

        return topElement !== el && !el.contains(topElement);
      }

      // Helper: Get parent context
      function getContext(el) {
        const context = {};

        // Find parent with aria-label or role
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.getAttribute('aria-label')) {
            context.section = parent.getAttribute('aria-label');
            break;
          }
          if (parent.getAttribute('role') === 'group' || parent.getAttribute('role') === 'region') {
            context.parent = parent.tagName.toLowerCase();
            break;
          }
          parent = parent.parentElement;
        }

        return context;
      }

      // Helper: Check if element has React/Vue event handlers
      function hasEventHandlers(el) {
        // React event handlers
        if (el._reactProps?.onClick) return true;
        if (el.__reactEventHandlers$?.onClick) return true;

        // Check for React fiber props
        const keys = Object.keys(el);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (key.startsWith('__reactProps') || key.startsWith('__reactEventHandlers')) {
            const props = el[key];
            if (props && props.onClick) return true;
          }
        }

        return false;
      }

      // Find all interactive elements
      const selectors = [
        // Standard interactive elements
        'button',
        'a[href]',
        'input',
        'select',
        'textarea',

        // ARIA roles (only interactive ones)
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="radiogroup"]',
        '[role="combobox"]',
        '[role="tab"]',
        '[role="menuitem"]',
        '[role="switch"]',
        '[role="slider"]',

        // Event handlers
        '[onclick]',
        '[onmousedown]',
        '[onmouseup]'
      ];

      const foundElements = new Set();

      // Collect elements by selector
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!foundElements.has(el) && isInteractive(el)) {
            foundElements.add(el);
          }
        });
      });

      // Additional: Find clickable elements by cursor:pointer or React handlers
      // Check ALL elements for cursor:pointer or event handlers
      document.querySelectorAll('*').forEach(el => {
        if (foundElements.has(el)) return;

        const style = window.getComputedStyle(el);

        // Include if has cursor:pointer AND is interactive
        if (style.cursor === 'pointer' && isInteractive(el)) {
          foundElements.add(el);
          return;
        }

        // Include if has React event handlers (only check button-like classes for performance)
        if (el.className && typeof el.className === 'string') {
          const hasButtonClass = /button|btn|card|item|clickable/.test(el.className);
          if (hasButtonClass && hasEventHandlers(el) && isInteractive(el)) {
            foundElements.add(el);
          }
        }
      });

      // Process found elements
      Array.from(foundElements).forEach(el => {
        const rect = el.getBoundingClientRect();

        // Calculate absolute position (viewport coordinates + scroll offset)
        const absoluteX = Math.round(rect.left + window.pageXOffset + rect.width / 2);
        const absoluteY = Math.round(rect.top + window.pageYOffset + rect.height / 2);

        // Check if element is currently in viewport
        const inViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        );

        const element = {
          id: 'elem_' + (idCounter++),
          type: el.tagName.toLowerCase() === 'input' ? 'input-' + (el.type || 'text') :
                el.tagName.toLowerCase() === 'select' ? 'select' :
                el.tagName.toLowerCase() === 'textarea' ? 'textarea' :
                el.getAttribute('role') ? 'role-' + el.getAttribute('role') :
                el.tagName.toLowerCase(),
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 100) || null,
          value: el.value || null,
          selectors: getBrowserPilotSelectors(el),
          attributes: {
            id: el.id || null,
            class: el.className || null,
            name: el.getAttribute('name') || null,
            type: el.getAttribute('type') || null,
            role: el.getAttribute('role') || null,
            'aria-label': el.getAttribute('aria-label') || null,
            disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
            placeholder: el.getAttribute('placeholder') || null
          },
          position: {
            x: absoluteX,
            y: absoluteY
          },
          visibility: {
            inViewport: inViewport,
            visible: true,
            obscured: inViewport ? isObscured(el) : false
          },
          context: getContext(el)
        };

        elements.push(element);
      });

      return elements;
    })()
  `;
}
