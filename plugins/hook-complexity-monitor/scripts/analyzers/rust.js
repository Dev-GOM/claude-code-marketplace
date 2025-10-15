const BraceBasedAnalyzer = require('./brace-based');

/**
 * Rust Analyzer
 */
class RustAnalyzer extends BraceBasedAnalyzer {
  getSupportedExtensions() {
    return ['.rs'];
  }

  getFunctionPatterns() {
    return [
      // fn function_name(...) -> ReturnType { }
      /fn\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*{/g,
      // pub fn function_name
      /pub\s+fn\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?:->\s*[^{]+)?\s*{/g
    ];
  }

  getComplexityPatterns() {
    return [
      /\bif\s+/g,
      /\belse\s+if\s+/g,
      /\bwhile\s+/g,
      /\bfor\s+/g,
      /\bmatch\s+/g,       // match expression
      /&&/g,
      /\|\|/g
    ];
  }
}

module.exports = RustAnalyzer;
