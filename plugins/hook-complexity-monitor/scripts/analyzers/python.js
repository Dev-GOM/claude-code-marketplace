const BaseAnalyzer = require('./base');

/**
 * Python Analyzer
 */
class PythonAnalyzer extends BaseAnalyzer {
  getSupportedExtensions() {
    return ['.py'];
  }

  extractFunctions(code, lines) {
    const functions = [];
    const defPattern = /^\s*def\s+(\w+)\s*\([^)]*\):/gm;
    let match;

    while ((match = defPattern.exec(code)) !== null) {
      const functionName = match[1];
      const startPos = match.index;
      const startLine = code.substring(0, startPos).split('\n').length;

      // Get the indentation level of the function definition
      const defIndent = match[0].match(/^\s*/)[0].length;

      // Find the end of the function by looking for the next line with same or less indentation
      let endLine = startLine;
      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines and comments
        if (line.trim() === '' || line.trim().startsWith('#')) {
          endLine = i + 1;
          continue;
        }

        // Get indentation of current line
        const lineIndent = line.match(/^\s*/)[0].length;

        // If we're past the def line and indentation is same or less, function ends
        if (i > startLine && lineIndent <= defIndent) {
          break;
        }

        endLine = i + 1;
      }

      const functionLines = lines.slice(startLine - 1, endLine);
      const functionCode = functionLines.join('\n');
      const length = endLine - startLine + 1;
      const complexity = this.calculateComplexity(functionCode, this.getComplexityPatterns());

      functions.push({
        name: functionName,
        startLine,
        endLine,
        length,
        complexity
      });
    }

    return functions;
  }

  calculateNesting(code, lines) {
    let maxNesting = 0;
    let maxNestingLine = 1;

    lines.forEach((line, index) => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('#')) {
        return;
      }

      // Calculate nesting level based on indentation (assuming 4 spaces per indent)
      const indent = line.match(/^\s*/)[0].length;
      const nestingLevel = Math.floor(indent / 4);

      if (nestingLevel > maxNesting) {
        maxNesting = nestingLevel;
        maxNestingLine = index + 1; // Lines are 1-indexed
      }
    });

    return { maxNesting, maxNestingLine };
  }

  getComplexityPatterns() {
    return [
      /\bif\s+/g,                // if condition:
      /\belif\s+/g,              // elif condition:
      /\bwhile\s+/g,             // while condition:
      /\bfor\s+/g,               // for ... in ...:
      /\bexcept\s*:/g,           // except:
      /\band\b/g,                // logical and
      /\bor\b/g                  // logical or
    ];
  }
}

module.exports = PythonAnalyzer;
