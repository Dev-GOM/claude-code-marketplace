const BraceBasedAnalyzer = require('./brace-based');

/**
 * C# Analyzer
 */
class CSharpAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.cs'];
  }

  getFunctionPatterns() {
    return [
      // public/private/protected with return type and method name
      /(?:public|private|protected|internal|static|virtual|override|async|\s)+[\w<>\[\]?]+\s+(\w+)\s*\([^)]*\)\s*{/g,
      // Property getters/setters
      /(?:public|private|protected|internal|\s)+[\w<>\[\]?]+\s+(\w+)\s*{\s*get/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bforeach\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
      /\?\?/g              // null-coalescing operator
    ];
  }
}

module.exports = CSharpAnalyzer;
