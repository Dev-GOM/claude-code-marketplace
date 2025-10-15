const BraceBasedAnalyzer = require('./brace-based');

/**
 * PHP Analyzer
 */
class PHPAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.php'];
  }

  getFunctionPatterns() {
    return [
      // function functionName(...) { }
      /function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g,
      // public/private/protected function
      /(?:public|private|protected|static|\s)+function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s*\(/g,
      /\belseif\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bforeach\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
      /\?\?/g              // null coalescing
    ];
  }
}

module.exports = PHPAnalyzer;
