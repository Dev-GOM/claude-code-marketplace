#!/usr/bin/env node

/**
 * Unity Compile Error Analyzer
 *
 * Processes VSCode diagnostics JSON output and extracts Unity-relevant C# compilation errors.
 * Filters by severity (Error only), source (csharp), and classifies errors by type.
 *
 * Usage:
 *   node analyze-diagnostics.js <diagnostics-json-file>
 *   node analyze-diagnostics.js (reads from stdin)
 *
 * Output: JSON array of classified Unity errors
 */

const fs = require('fs');
const path = require('path');

// Error classification patterns
const ERROR_CLASSIFICATIONS = {
  MISSING_IMPORT: {
    patterns: [/CS0246/, /type or namespace.*could not be found/i],
    category: 'Missing Import/Namespace',
    priority: 1
  },
  TYPE_MISMATCH: {
    patterns: [/CS0029/, /cannot implicitly convert/i, /cannot convert type/i],
    category: 'Type Mismatch',
    priority: 2
  },
  MEMBER_NOT_FOUND: {
    patterns: [/CS1061/, /does not contain a definition/i],
    category: 'Member Not Found',
    priority: 2
  },
  DUPLICATE_DEFINITION: {
    patterns: [/CS0101/, /already contains a definition/i],
    category: 'Duplicate Definition',
    priority: 3
  },
  SYNTAX_ERROR: {
    patterns: [/CS1002/, /CS1003/, /CS1525/, /expected/i],
    category: 'Syntax Error',
    priority: 1
  },
  ACCESS_MODIFIER: {
    patterns: [/CS0122/, /inaccessible due to its protection level/i],
    category: 'Access Modifier Issue',
    priority: 2
  },
  UNITY_API: {
    patterns: [/MonoBehaviour/, /GameObject/, /Transform/, /Component/],
    category: 'Unity API Issue',
    priority: 1
  }
};

/**
 * Classify error based on message content
 */
function classifyError(message) {
  for (const [key, classifier] of Object.entries(ERROR_CLASSIFICATIONS)) {
    for (const pattern of classifier.patterns) {
      if (pattern.test(message)) {
        return {
          type: key,
          category: classifier.category,
          priority: classifier.priority
        };
      }
    }
  }
  return {
    type: 'UNKNOWN',
    category: 'Other Error',
    priority: 4
  };
}

/**
 * Extract error code from message (e.g., "CS0246")
 */
function extractErrorCode(message) {
  const match = message.match(/CS\d{4}/);
  return match ? match[0] : null;
}

/**
 * Filter and process diagnostics
 */
function analyzeDiagnostics(diagnostics) {
  if (!diagnostics || !Array.isArray(diagnostics)) {
    console.error('Error: Invalid diagnostics format. Expected array.');
    process.exit(1);
  }

  const unityErrors = diagnostics
    .filter(diag => {
      // Filter: Only errors (not warnings)
      if (diag.severity !== 'Error') return false;

      // Filter: Only C# errors from OmniSharp
      if (diag.source !== 'csharp') return false;

      // Filter: Must have valid message
      if (!diag.message) return false;

      return true;
    })
    .map(diag => {
      const classification = classifyError(diag.message);
      const errorCode = extractErrorCode(diag.message);

      return {
        file: diag.uri ? diag.uri.replace('file:///', '') : 'unknown',
        line: diag.range?.start?.line ?? 0,
        column: diag.range?.start?.character ?? 0,
        errorCode: errorCode,
        message: diag.message,
        classification: classification.category,
        type: classification.type,
        priority: classification.priority,
        source: diag.source
      };
    });

  // Sort by priority (lower number = higher priority)
  unityErrors.sort((a, b) => a.priority - b.priority);

  return unityErrors;
}

/**
 * Generate summary statistics
 */
function generateSummary(errors) {
  const summary = {
    totalErrors: errors.length,
    byCategory: {},
    byFile: {},
    highPriority: errors.filter(e => e.priority === 1).length
  };

  errors.forEach(error => {
    // Count by category
    summary.byCategory[error.classification] =
      (summary.byCategory[error.classification] || 0) + 1;

    // Count by file
    const fileName = path.basename(error.file);
    summary.byFile[fileName] = (summary.byFile[fileName] || 0) + 1;
  });

  return summary;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  let diagnosticsData;

  if (args.length === 0) {
    // Read from stdin
    console.error('Reading diagnostics from stdin...');
    const input = fs.readFileSync(0, 'utf-8');
    try {
      diagnosticsData = JSON.parse(input);
    } catch (error) {
      console.error('Error parsing JSON from stdin:', error.message);
      process.exit(1);
    }
  } else {
    // Read from file
    const filePath = args[0];

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      diagnosticsData = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading/parsing file: ${error.message}`);
      process.exit(1);
    }
  }

  // Extract diagnostics array (handle different formats)
  let diagnostics;
  if (Array.isArray(diagnosticsData)) {
    diagnostics = diagnosticsData;
  } else if (diagnosticsData.diagnostics && Array.isArray(diagnosticsData.diagnostics)) {
    diagnostics = diagnosticsData.diagnostics;
  } else {
    console.error('Error: Could not find diagnostics array in input');
    process.exit(1);
  }

  // Analyze
  const errors = analyzeDiagnostics(diagnostics);
  const summary = generateSummary(errors);

  // Output results
  const output = {
    summary: summary,
    errors: errors
  };

  console.log(JSON.stringify(output, null, 2));
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  analyzeDiagnostics,
  classifyError,
  extractErrorCode,
  generateSummary
};
