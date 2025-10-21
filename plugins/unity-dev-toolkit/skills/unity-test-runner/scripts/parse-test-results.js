#!/usr/bin/env node

/**
 * Unity Test Results Parser
 *
 * Parses Unity Test Framework NUnit XML output and extracts test statistics and failure details.
 *
 * Usage:
 *   node parse-test-results.js <path-to-results.xml> [--json]
 *
 * Options:
 *   --json    Output results as JSON
 *
 * Output (JSON):
 * {
 *   "summary": {
 *     "total": 10,
 *     "passed": 7,
 *     "failed": 2,
 *     "skipped": 1,
 *     "duration": 1.234
 *   },
 *   "failures": [
 *     {
 *       "name": "TestName",
 *       "fullName": "Namespace.Class.TestName",
 *       "message": "Failure message",
 *       "stackTrace": "Stack trace",
 *       "file": "Assets/Tests/TestFile.cs",
 *       "line": 42
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node parse-test-results.js <path-to-results.xml> [--json]');
  process.exit(args.length === 0 ? 1 : 0);
}

const resultsPath = args[0];
const jsonOutput = args.includes('--json');

/**
 * Extract text content from XML tag
 *
 * Note: This uses regex-based parsing instead of a full XML parser library.
 * While regex-based XML parsing is generally not recommended, it's sufficient
 * for Unity Test Framework's consistent NUnit XML output format. The patterns
 * are designed to be non-greedy and handle common variations (attributes, whitespace).
 *
 * For production use with arbitrary XML, consider using fast-xml-parser or xml2js.
 */
function extractTagContent(xml, tagName) {
  // Non-greedy matching: [\s\S]*? ensures minimal capture between tags
  // [^>]* allows for attributes without capturing them (stops at first >)
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract attribute value from XML tag
 *
 * Handles attributes with double quotes. Unity NUnit XML consistently uses
 * double quotes for attributes, so this simple pattern is reliable.
 */
function extractAttribute(tag, attrName) {
  // Escape special regex characters in attribute name
  const escapedAttrName = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedAttrName}="([^"]*)"`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract file path and line number from stack trace
 */
function extractFileInfo(stackTrace) {
  // Pattern: at Namespace.Class.Method () [0x00000] in /path/to/file.cs:42
  // Pattern: at Namespace.Class.Method () in Assets/Tests/TestFile.cs:line 42
  const patterns = [
    /in (.+\.cs):(\d+)/i,
    /in (.+\.cs):line (\d+)/i,
    /\[0x[0-9a-f]+\] in (.+\.cs):(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = stackTrace.match(pattern);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2])
      };
    }
  }

  return {
    file: null,
    line: null
  };
}

/**
 * Parse test-case element
 *
 * Extracts test metadata from <test-case> XML element using attribute matching.
 * All attributes are optional - defaults are provided for missing values.
 */
function parseTestCase(testCaseXml) {
  // Extract attributes with fallback defaults
  const nameMatch = testCaseXml.match(/name="([^"]*)"/);
  const fullNameMatch = testCaseXml.match(/fullname="([^"]*)"/);
  const resultMatch = testCaseXml.match(/result="([^"]*)"/);
  const durationMatch = testCaseXml.match(/duration="([^"]*)"/);

  const testCase = {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    fullName: fullNameMatch ? fullNameMatch[1] : 'Unknown',
    result: resultMatch ? resultMatch[1] : 'Unknown',
    duration: durationMatch ? parseFloat(durationMatch[1]) || 0 : 0
  };

  // Extract failure information if test failed
  if (testCase.result === 'Failed') {
    const failureXml = extractTagContent(testCaseXml, 'failure');

    if (failureXml) {
      testCase.message = extractTagContent(failureXml, 'message');
      testCase.stackTrace = extractTagContent(failureXml, 'stack-trace');

      // Extract file and line from stack trace
      if (testCase.stackTrace) {
        const fileInfo = extractFileInfo(testCase.stackTrace);
        testCase.file = fileInfo.file;
        testCase.line = fileInfo.line;
      }
    }
  }

  return testCase;
}

/**
 * Parse Unity Test Framework XML results
 *
 * Parses NUnit XML format produced by Unity Test Framework.
 * Expects standard Unity test output structure with <test-run> root element.
 *
 * @param {string} xmlContent - Raw XML content from test results file
 * @returns {Object} Parsed test results with summary, failures, and all tests
 * @throws {Error} If XML structure is invalid or test-run element is missing
 */
function parseTestResults(xmlContent) {
  // Validate XML has test-run root element
  const testRunMatch = xmlContent.match(/<test-run[^>]*>/i);
  if (!testRunMatch) {
    throw new Error('Invalid Unity Test Framework XML: <test-run> element not found. ' +
                   'Ensure the file is a valid NUnit XML results file from Unity.');
  }

  const testRunTag = testRunMatch[0];

  const summary = {
    total: parseInt(extractAttribute(testRunTag, 'total') || '0'),
    passed: parseInt(extractAttribute(testRunTag, 'passed') || '0'),
    failed: parseInt(extractAttribute(testRunTag, 'failed') || '0'),
    skipped: parseInt(extractAttribute(testRunTag, 'skipped') || '0') +
             parseInt(extractAttribute(testRunTag, 'inconclusive') || '0'),
    duration: parseFloat(extractAttribute(testRunTag, 'duration') || '0')
  };

  // Extract all test cases using non-greedy matching
  // Pattern matches <test-case ...>...</test-case> with minimal capture
  // [^>]* stops at first >, [\s\S]*? captures minimal content between tags
  const testCaseRegex = /<test-case[^>]*>[\s\S]*?<\/test-case>/gi;
  const testCaseMatches = xmlContent.match(testCaseRegex) || [];

  const allTests = [];
  const failures = [];

  for (const testCaseXml of testCaseMatches) {
    const testCase = parseTestCase(testCaseXml);
    allTests.push(testCase);

    if (testCase.result === 'Failed') {
      failures.push(testCase);
    }
  }

  return {
    summary,
    failures,
    allTests
  };
}

/**
 * Format output for console
 */
function formatConsoleOutput(results) {
  const { summary, failures } = results;

  console.log('\n=== Unity Test Results ===\n');

  // Summary
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✓ Passed: ${summary.passed}`);

  if (summary.failed > 0) {
    console.log(`✗ Failed: ${summary.failed}`);
  }

  if (summary.skipped > 0) {
    console.log(`⊘ Skipped: ${summary.skipped}`);
  }

  console.log(`Duration: ${summary.duration.toFixed(3)}s\n`);

  // Failures
  if (failures.length > 0) {
    console.log('=== Failed Tests ===\n');

    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.fullName}`);

      if (failure.message) {
        console.log(`   Message: ${failure.message}`);
      }

      if (failure.file && failure.line) {
        console.log(`   Location: ${failure.file}:${failure.line}`);
      }

      if (failure.stackTrace) {
        console.log(`   Stack Trace:`);
        const lines = failure.stackTrace.split('\n').slice(0, 3);
        lines.forEach(line => console.log(`     ${line.trim()}`));

        if (failure.stackTrace.split('\n').length > 3) {
          console.log(`     ... (truncated)`);
        }
      }

      console.log('');
    });
  } else {
    console.log('✓ All tests passed!\n');
  }
}

// Main execution
try {
  // Check if file exists
  if (!fs.existsSync(resultsPath)) {
    console.error(`Error: Test results file not found: ${resultsPath}`);
    process.exit(1);
  }

  // Read and parse XML
  const xmlContent = fs.readFileSync(resultsPath, 'utf-8');
  const results = parseTestResults(xmlContent);

  // Output results
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    formatConsoleOutput(results);
  }

  // Exit with error code if tests failed
  if (results.summary.failed > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error(`Error parsing test results: ${error.message}`);
  process.exit(1);
}
