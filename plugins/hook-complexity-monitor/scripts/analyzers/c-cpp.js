const BraceBasedAnalyzer = require('./brace-based');

/**
 * C/C++ Analyzer
 */
class CCppAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'];
  }

  getFunctionPatterns() {
    return [
      // Return type, function name, parameters
      /[\w:*&<>]+\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*{/g,
      // Constructor/destructor
      /(?:~)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g
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

module.exports = CCppAnalyzer;
