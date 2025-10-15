/**
 * Base Language Analyzer
 *
 * Abstract base class that all language analyzers must inherit from
 */
class BaseAnalyzer {
  /**
   * @returns {string[]} List of supported file extensions
   */
  getSupportedExtensions() {
    throw new Error('getSupportedExtensions() must be implemented');
  }

  /**
   * Extract list of functions from code
   * @param {string} code - Source code
   * @param {string[]} lines - Code split by lines
   * @returns {Array<{name: string, startLine: number, endLine: number, length: number, complexity: number}>}
   */
  extractFunctions(code, lines) {
    throw new Error('extractFunctions() must be implemented');
  }

  /**
   * Calculate maximum nesting depth
   * @param {string} code - Source code
   * @param {string[]} lines - Code split by lines
   * @returns {{maxNesting: number, maxNestingLine: number}}
   */
  calculateNesting(code, lines) {
    throw new Error('calculateNesting() must be implemented');
  }

  /**
   * Calculate Cyclomatic Complexity (common logic)
   * @param {string} code - Function code
   * @param {RegExp[]} patterns - Language-specific patterns
   * @returns {number}
   */
  calculateComplexity(code, patterns) {
    let complexity = 1; // Base complexity

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Check if extension is supported
   * @param {string} ext - File extension
   * @returns {boolean}
   */
  supports(ext) {
    return this.getSupportedExtensions().includes(ext);
  }
}

module.exports = BaseAnalyzer;
