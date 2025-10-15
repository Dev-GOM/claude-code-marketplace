const BaseAnalyzer = require('./base');

/**
 * Brace-Based Language Analyzer
 *
 * Common base class for languages that use braces for block scoping
 * (Java, C, C++, C#, Go, Rust, Swift, Kotlin, etc.)
 */
class BraceBasedAnalyzer extends BaseAnalyzer {
  /**
   * Extract functions using regex patterns
   * Override getFunctionPatterns() in subclass to customize
   */
  extractFunctions(code, lines) {
    const functions = [];
    const patterns = this.getFunctionPatterns();

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

  /**
   * Calculate nesting depth for brace-based languages
   */
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

  /**
   * Function patterns - override in subclass
   * @returns {RegExp[]}
   */
  getFunctionPatterns() {
    throw new Error('getFunctionPatterns() must be implemented in subclass');
  }

  /**
   * Complexity patterns - override in subclass
   * @returns {RegExp[]}
   */
  getComplexityPatterns() {
    throw new Error('getComplexityPatterns() must be implemented in subclass');
  }
}

module.exports = BraceBasedAnalyzer;
