const BraceBasedAnalyzer = require('./brace-based');

/**
 * Kotlin Analyzer
 */
class KotlinAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.kt', '.kts'];
  }

  getFunctionPatterns() {
    return [
      // fun functionName(...): ReturnType { }
      /fun\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g,
      // suspend fun (coroutines)
      /suspend\s+fun\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhen\s*{/g,       // Kotlin's when expression
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
      /\?\./g              // safe call operator
    ];
  }
}

module.exports = KotlinAnalyzer;
