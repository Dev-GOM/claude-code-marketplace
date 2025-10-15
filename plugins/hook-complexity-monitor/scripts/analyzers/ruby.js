const BaseAnalyzer = require('./base');

/**
 * Ruby Analyzer
 *
 * Ruby uses 'end' keyword instead of braces
 */
class RubyAnalyzer extends BaseAnalyzer {
  getSupportedExtensions() {
    return ['.rb'];
  }

  extractFunctions(code, lines) {
    const functions = [];
    // def function_name(...) ... end
    const defPattern = /def\s+(\w+)(?:\s*\([^)]*\))?\s*$/gm;
    let match;

    while ((match = defPattern.exec(code)) !== null) {
      const functionName = match[1];
      const startPos = match.index;
      const startLine = code.substring(0, startPos).split('\n').length;

      // Find 'end' keyword for this function
      const indent = match[0].match(/^\s*/)[0].length;
      let endLine = startLine;
      let endCount = 1;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('def ')) endCount++;
        if (line.trim() === 'end' || line.trim().startsWith('end ')) {
          endCount--;
          if (endCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }

      const functionLines = lines.slice(startLine - 1, endLine);
      const functionCode = functionLines.join('\n');
      const length = endLine - startLine + 1;
      const complexity = this.calculateComplexity(functionCode, this.getComplexityPatterns());

      functions.push({
        name: functionName,
        startLine,
        endLine,
        length,
        complexity
      });
    }

    return functions;
  }

  calculateNesting(code, lines) {
    let maxNesting = 0;
    let maxNestingLine = 1;

    lines.forEach((line, index) => {
      if (line.trim() === '' || line.trim().startsWith('#')) {
        return;
      }

      const indent = line.match(/^\s*/)[0].length;
      const nestingLevel = Math.floor(indent / 2); // Ruby typically uses 2 spaces

      if (nestingLevel > maxNesting) {
        maxNesting = nestingLevel;
        maxNestingLine = index + 1;
      }
    });

    return { maxNesting, maxNestingLine };
  }

  getComplexityPatterns() {
    return [
      /\bif\s+/g,
      /\belsif\s+/g,
      /\bwhile\s+/g,
      /\bfor\s+/g,
      /\bcase\s+/g,
      /\brescue\s+/g,
      /\band\b/g,
      /\bor\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];
  }
}

module.exports = RubyAnalyzer;
