const BraceBasedAnalyzer = require('./brace-based');

/**
 * Go Analyzer
 */
class GoAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.go'];
  }

  getFunctionPatterns() {
    return [
      // func functionName(...) { }
      /func\s+(\w+)\s*\([^)]*\)\s*(?:[^{]*)\s*{/g,
      // func (receiver) functionName(...) { }
      /func\s+\([^)]*\)\s*(\w+)\s*\([^)]*\)\s*(?:[^{]*)\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s+/g,          // if condition {
      /\belse\s+if\s+/g,   // else if condition {
      /\bfor\s+/g,         // for condition {
      /\bcase\s+/g,        // case value:
      /&&/g,
      /\|\|/g
    ];
  }
}

module.exports = GoAnalyzer;
