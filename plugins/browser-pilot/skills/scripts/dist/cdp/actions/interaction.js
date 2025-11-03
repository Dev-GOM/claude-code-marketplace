"use strict";
/**
 * Interaction actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.click = click;
exports.fill = fill;
exports.hover = hover;
exports.focus = focus;
exports.blur = blur;
exports.dragAndDrop = dragAndDrop;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
/**
 * Click element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 */
async function click(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Finding element: ${selector}`);
    // Step 1: Find element and scroll into view
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        text: el.textContent?.substring(0, 50) || '',
        visible: box.width > 0 && box.height > 0
      };
    })()
  `;
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (!result.result || !result.result.value) {
            console.error('❌ Element not found or error occurred');
            if (result.exceptionDetails) {
                console.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            }
            throw new Error(`Element not found: ${selector}`);
        }
        const { x, y, tag, text, visible } = result.result.value;
        if (opts.verbose) {
            console.log(`✓ Element found: <${tag.toLowerCase()}> "${text}"`);
            console.log(`  Position: (${Math.round(x)}, ${Math.round(y)}), Visible: ${visible}`);
        }
        // Step 2: Dispatch CDP mouse events (Puppeteer way)
        if (opts.verbose)
            console.log(`🖱️  Mouse down at (${Math.round(x)}, ${Math.round(y)})`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button: 'left',
            clickCount: 1,
            x,
            y
        });
        if (opts.verbose)
            console.log(`🖱️  Mouse up at (${Math.round(x)}, ${Math.round(y)})`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button: 'left',
            clickCount: 1,
            x,
            y
        });
        if (opts.verbose)
            console.log(`✅ Clicked: ${selector}`);
        // Check for console errors after click
        (0, helpers_1.checkConsoleErrors)(browser);
        return {
            success: true,
            selector,
            coordinates: { x: Math.round(x), y: Math.round(y) },
            element: { tag, text }
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Click failed: ${selector}`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
/**
 * Fill input field.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 * Uses CDP click + insertText for proper React compatibility.
 */
async function fill(browser, selector, value, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        console.log(`✍️  Filling input: ${selector}`);
        console.log(`   Value: "${value}"`);
    }
    // Step 1: Find element, get coordinates, and clear existing value
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();

      // Clear existing value
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        type: el.type || 'text'
      };
    })()
  `;
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (!result.result || !result.result.value) {
            console.error('❌ Element not found or error occurred');
            if (result.exceptionDetails) {
                console.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            }
            throw new Error(`Element not found: ${selector}`);
        }
        const { x, y, tag, type } = result.result.value;
        if (opts.verbose) {
            console.log(`✓ Element found: <${tag.toLowerCase()} type="${type}">`);
            console.log(`  Position: (${Math.round(x)}, ${Math.round(y)})`);
        }
        // Step 2: Click to focus
        if (opts.verbose)
            console.log(`🖱️  Clicking to focus...`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button: 'left',
            clickCount: 1,
            x,
            y
        });
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button: 'left',
            clickCount: 1,
            x,
            y
        });
        // Small delay to ensure focus
        await (0, helpers_1.sleep)(50);
        // Step 3: Insert text using CDP
        if (opts.verbose)
            console.log(`⌨️  Inserting text: "${value}"`);
        await browser.sendCommand('Input.insertText', {
            text: value
        });
        if (opts.verbose)
            console.log(`✅ Fill successful`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return { success: true, selector, value };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Fill failed: ${selector}`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
/**
 * Hover over element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP mouseMoved event for proper React compatibility.
 */
async function hover(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Hovering: ${selector}`);
    // Step 1: Find element and scroll into view
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        text: el.textContent?.substring(0, 50) || '',
        visible: box.width > 0 && box.height > 0
      };
    })()
  `;
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (!result.result || !result.result.value) {
            console.error('❌ Element not found or error occurred');
            if (result.exceptionDetails) {
                console.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            }
            throw new Error(`Element not found: ${selector}`);
        }
        const { x, y, tag, text, visible } = result.result.value;
        if (opts.verbose) {
            console.log(`✓ Element found: <${tag.toLowerCase()}> "${text}"`);
            console.log(`  Position: (${Math.round(x)}, ${Math.round(y)}), Visible: ${visible}`);
            console.log(`🖱️  Moving mouse to (${Math.round(x)}, ${Math.round(y)})`);
        }
        // Step 2: Dispatch CDP mouse move event
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x,
            y
        });
        if (opts.verbose)
            console.log(`✅ Hover successful`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return {
            success: true,
            selector,
            coordinates: { x: Math.round(x), y: Math.round(y) },
            element: { tag, text }
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Hover failed: ${selector}`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
/**
 * Focus element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function focus(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Focusing: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.focus();
      return true;
    })()
  `;
    await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    if (opts.verbose)
        console.log(`✅ Focus successful`);
    (0, helpers_1.checkConsoleErrors)(browser);
    return { success: true, selector };
}
/**
 * Blur element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function blur(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Blurring: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.blur();
      return true;
    })()
  `;
    await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    if (opts.verbose)
        console.log(`✅ Blur successful`);
    (0, helpers_1.checkConsoleErrors)(browser);
    return { success: true, selector };
}
/**
 * Drag and drop from one element to another.
 * Uses CDP mouse events for proper React/framework compatibility.
 */
async function dragAndDrop(browser, sourceSelector, targetSelector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Dragging ${sourceSelector} to ${targetSelector}`);
    // Step 1: Get coordinates for both elements
    const script = `
    (function() {
      const sourceSelector = ${JSON.stringify(sourceSelector)};
      const targetSelector = ${JSON.stringify(targetSelector)};
      ${(0, utils_1.getFindElementScript)()}

      const source = findElement(sourceSelector);
      const target = findElement(targetSelector);

      if (!source) throw new Error('Source element not found: ' + sourceSelector);
      if (!target) throw new Error('Target element not found: ' + targetSelector);

      // Scroll both into view
      source.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const sourceRect = source.getBoundingClientRect();

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const targetRect = target.getBoundingClientRect();

      return {
        source: {
          x: sourceRect.left + sourceRect.width / 2,
          y: sourceRect.top + sourceRect.height / 2,
          tag: source.tagName,
          text: source.textContent?.substring(0, 30) || ''
        },
        target: {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
          tag: target.tagName,
          text: target.textContent?.substring(0, 30) || ''
        }
      };
    })()
  `;
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (!result.result || !result.result.value) {
            console.error('❌ Element(s) not found');
            throw new Error('Could not find source or target element');
        }
        const { source, target } = result.result.value;
        if (opts.verbose) {
            console.log(`✓ Source: <${source.tag.toLowerCase()}> "${source.text}" at (${Math.round(source.x)}, ${Math.round(source.y)})`);
            console.log(`✓ Target: <${target.tag.toLowerCase()}> "${target.text}" at (${Math.round(target.x)}, ${Math.round(target.y)})`);
        }
        // Step 2: Perform CDP drag operation
        if (opts.verbose)
            console.log(`🖱️  Mouse down at source (${Math.round(source.x)}, ${Math.round(source.y)})`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button: 'left',
            clickCount: 1,
            x: source.x,
            y: source.y
        });
        // Small delay to simulate drag start
        await (0, helpers_1.sleep)(100);
        if (opts.verbose)
            console.log(`🖱️  Dragging to target (${Math.round(target.x)}, ${Math.round(target.y)})`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            button: 'left',
            x: target.x,
            y: target.y
        });
        // Small delay before release
        await (0, helpers_1.sleep)(100);
        if (opts.verbose)
            console.log(`🖱️  Mouse up at target (${Math.round(target.x)}, ${Math.round(target.y)})`);
        await browser.sendCommand('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button: 'left',
            clickCount: 1,
            x: target.x,
            y: target.y
        });
        if (opts.verbose)
            console.log(`✅ Drag and drop successful`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return {
            success: true,
            sourceSelector,
            targetSelector,
            source: { x: Math.round(source.x), y: Math.round(source.y) },
            target: { x: Math.round(target.x), y: Math.round(target.y) }
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Drag and drop failed`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
//# sourceMappingURL=interaction.js.map