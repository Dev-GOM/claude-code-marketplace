const BaseAnalyzer = require('./base');

/**
 * JavaScript/TypeScript Analyzer
 */
class JavaScriptAnalyzer extends BaseAnalyzer {
  getSupportedExtensions() {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  }

  extractFunctions(code, lines) {
    const functions = [];

    // Function patterns for JavaScript/TypeScript
    const patterns = [
      /function\s+(\w+)\s*\([^)]*\)\s*{/g,           // function name() {}
      /(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,             // name = () => {}
      /(\w+)\s*:\s*\([^)]*\)\s*=>\s*{/g,             // name: () => {}
      /async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g,   // async function name() {}
      /(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*{/g      // name = async () => {}
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const functionName = match[1] || 'anonymous';
        const startPos = match.index;
        const startLine = code.substring(0, startPos).split('\n').length;

        // Find function end by counting braces
        let braceCount = 1;
        let pos = match.index + match[0].length;
        let endLine = startLine;

        while (braceCount > 0 && pos < code.length) {
          if (code[pos] === '{') braceCount++;
          if (code[pos] === '}') braceCount--;
          if (code[pos] === '\n') endLine++;
          pos++;
        }

        const functionCode = code.substring(match.index, pos);
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
    });

    return functions;
  }

  calculateNesting(code, lines) {
    let maxNesting = 0;
    let maxNestingLine = 1;
    let currentNesting = 0;
    let currentLine = 1;

    code.split('').forEach(char => {
      if (char === '\n') {
        currentLine++;
      }
      if (char === '{') {
        currentNesting++;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
          maxNestingLine = currentLine;
        }
      } else if (char === '}') {
        currentNesting--;
      }
    });

    return { maxNesting, maxNestingLine };
  }

  getComplexityPatterns() {
    return [
      /\bif\s*\(/g,              // if (condition)
      /\belse\s+if\s*\(/g,       // else if (condition)
      /\bwhile\s*\(/g,           // while (condition)
      /\bfor\s*\(/g,             // for (...)
      /\bcase\s+/g,              // case value:
      /\bcatch\s*\(/g,           // catch (error)
      /&&/g,                     // logical AND
      /\|\|/g,                   // logical OR
      /\?/g                      // ternary operator
    ];
  }
}

module.exports = JavaScriptAnalyzer;
