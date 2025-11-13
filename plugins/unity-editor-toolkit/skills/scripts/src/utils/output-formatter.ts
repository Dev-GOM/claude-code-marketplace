/**
 * Output Formatter Utility
 *
 * Provides unified output formatting for CLI commands.
 * Supports both JSON and human-readable text formats.
 */

/**
 * Output data in JSON format
 */
export function outputJson(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output data based on format flag
 */
export function output(data: any, isJson: boolean, textFormatter?: (data: any) => string): void {
  if (isJson) {
    outputJson(data);
  } else if (textFormatter) {
    console.log(textFormatter(data));
  } else {
    // Default: just stringify with indentation
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Format array data as a simple table
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const columnWidths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map(row => (row[i] || '').length));
    return Math.max(header.length, maxRowWidth);
  });

  const separator = columnWidths.map(w => '-'.repeat(w + 2)).join('+');
  const headerRow = headers.map((h, i) => h.padEnd(columnWidths[i])).join(' | ');
  const dataRows = rows.map(row =>
    row.map((cell, i) => (cell || '').padEnd(columnWidths[i])).join(' | ')
  );

  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * Format object as key-value pairs
 */
export function formatKeyValue(obj: Record<string, any>, indent: number = 0): string {
  const indentStr = ' '.repeat(indent);
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${indentStr}${key}:\n${formatKeyValue(value, indent + 2)}`;
      }
      return `${indentStr}${key}: ${value}`;
    })
    .join('\n');
}

/**
 * Format list with bullets
 */
export function formatList(items: string[], bullet: string = '•'): string {
  return items.map(item => `${bullet} ${item}`).join('\n');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
