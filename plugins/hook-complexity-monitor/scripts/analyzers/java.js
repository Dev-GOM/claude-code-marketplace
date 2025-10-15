const BraceBasedAnalyzer = require('./brace-based');

/**
 * Java Analyzer
 */
class JavaAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.java'];
  }

  getFunctionPatterns() {
    return [
      // public/private/protected modifiers with return type and method name
      /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*{/g,
      // Constructor
      /(?:public|private|protected)?\s+(\w+)\s*\([^)]*\)\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];
  }
}

module.exports = JavaAnalyzer;
