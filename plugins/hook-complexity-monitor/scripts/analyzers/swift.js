const BraceBasedAnalyzer = require('./brace-based');

/**
 * Swift Analyzer
 */
class SwiftAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.swift'];
  }

  getFunctionPatterns() {
    return [
      // func functionName(...) -> ReturnType { }
      /func\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*{/g,
      // init methods
      /init\s*\([^)]*\)\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s+/g,
      /\belse\s+if\s+/g,
      /\bwhile\s+/g,
      /\bfor\s+/g,
      /\bcase\s+/g,
      /\bguard\s+/g,       // Swift's guard statement
      /\bcatch\s+/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];
  }
}

module.exports = SwiftAnalyzer;
