const JavaScriptAnalyzer = require('./javascript');
const PythonAnalyzer = require('./python');
const JavaAnalyzer = require('./java');
const GoAnalyzer = require('./go');
const CCppAnalyzer = require('./c-cpp');
const CSharpAnalyzer = require('./csharp');
const RustAnalyzer = require('./rust');
const SwiftAnalyzer = require('./swift');
const KotlinAnalyzer = require('./kotlin');
const RubyAnalyzer = require('./ruby');
const PHPAnalyzer = require('./php');

/**
 * Analyzer Registry
 *
 * Manages all registered analyzers and returns the appropriate analyzer for a file extension
 */
class AnalyzerRegistry {
  constructor() {
    this.analyzers = [
      new JavaScriptAnalyzer(),
      new PythonAnalyzer(),
      new JavaAnalyzer(),
      new GoAnalyzer(),
      new CCppAnalyzer(),
      new CSharpAnalyzer(),
      new RustAnalyzer(),
      new SwiftAnalyzer(),
      new KotlinAnalyzer(),
      new RubyAnalyzer(),
      new PHPAnalyzer()
      // Add new language analyzers here
    ];
  }

  /**
   * Get analyzer for file extension
   * @param {string} ext - File extension (e.g. '.js', '.py')
   * @returns {BaseAnalyzer|null}
   */
  getAnalyzer(ext) {
    return this.analyzers.find(analyzer => analyzer.supports(ext)) || null;
  }

  /**
   * Get all supported file extensions
   * @returns {string[]}
   */
  getAllSupportedExtensions() {
    const extensions = new Set();
    this.analyzers.forEach(analyzer => {
      analyzer.getSupportedExtensions().forEach(ext => extensions.add(ext));
    });
    return Array.from(extensions);
  }
}

module.exports = new AnalyzerRegistry();
