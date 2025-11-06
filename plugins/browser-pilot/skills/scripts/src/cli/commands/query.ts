import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';

export function registerQueryCommands(program: Command) {
  // Query interaction map
  program
    .command('query')
    .description('Search interaction map for elements (by text, type, tag, or ID with pagination support)')
    .option('-t, --text <text>', 'Search by text content')
    .option('--type <type>', 'Filter by element type (supports aliases: "input" → "input-*")')
    .option('--tag <tag>', 'Filter by HTML tag (e.g., "input", "button")')
    .option('-i, --index <number>', 'Select nth match (1-based)', parseInt)
    .option('--viewport-only', 'Only search visible elements in viewport', false)
    .option('--id <id>', 'Direct element ID lookup')
    .option('--list-types', 'List all element types with counts')
    .option('--list-texts', 'List all text contents')
    .option('--limit <number>', 'Maximum results to return (default: 20, 0=unlimited)', parseInt)
    .option('--offset <number>', 'Number of results to skip (default: 0)', parseInt)
    .option('--verbose', 'Include detailed information', false)
    .action(async (options) => {
      try {
        // Build query parameters
        const params: Record<string, unknown> = {};

        if (options.text) params.text = options.text;
        if (options.type) params.type = options.type;
        if (options.tag) params.tag = options.tag;
        if (options.index) params.index = options.index;
        if (options.viewportOnly) params.viewportOnly = true;
        if (options.id) params.id = options.id;
        if (options.listTypes) params.listTypes = true;
        if (options.listTexts) params.listTexts = true;
        if (options.limit !== undefined) params.limit = options.limit;
        if (options.offset !== undefined) params.offset = options.offset;
        if (options.verbose) params.verbose = true;

        // Execute query
        const response = await executeViaDaemon('query-map', params);

        if (response.success) {
          const result = response.data as {
            count: number;
            results: Array<{
              selector: string;
              alternatives: string[];
              element: {
                tag: string;
                text: string | undefined;
                position: { x: number; y: number };
              };
            }>;
            types?: Record<string, number>;
            texts?: Array<{ text: string; type: string; count: number }>;
            total?: number;
          };

          // Handle listTypes output
          if (options.listTypes && result.types) {
            console.log(`\n=== Element Types ===`);
            const sortedTypes = Object.entries(result.types).sort((a, b) => b[1] - a[1]);
            sortedTypes.forEach(([type, count]) => {
              console.log(`${type}: ${count}`);
            });
            console.log(`\nTotal: ${result.total} elements`);
          }
          // Handle listTexts output
          else if (options.listTexts && result.texts) {
            const limit = options.limit !== undefined ? options.limit : 20;
            const showingText = limit === 0 ? 'all' : `${result.count}/${result.total}`;
            console.log(`\n=== Text Contents (showing ${showingText}) ===\n`);

            result.texts.forEach((item, idx) => {
              const num = (options.offset || 0) + idx + 1;
              const textPreview = item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text;
              console.log(`${num}. "${textPreview}" (${item.type}${item.count > 1 ? `, ${item.count} matches` : ''})`);
            });

            if (limit > 0 && result.total && result.total > result.count + (options.offset || 0)) {
              console.log(`\nUse --limit to see more, or --type to filter`);
            }
          }
          // Handle regular query output
          else {
            const showingText = result.total ? `${result.count}/${result.total}` : `${result.count}`;
            console.log(`\n=== Query Results (${showingText}) ===`);

            if (result.count === 0) {
              console.log('\nNo elements found matching your query.');
            } else {
              result.results.forEach((item, idx) => {
                const num = (options.offset || 0) + idx + 1;
                console.log(`\n[${num}]`);
                if (!options.verbose) {
                  // Compact format
                  const textPreview = item.element.text ?
                    (item.element.text.length > 50 ? item.element.text.substring(0, 50) + '...' : item.element.text) : '';
                  console.log(`  <${item.element.tag}> ${textPreview ? `"${textPreview}"` : '(no text)'}`);
                  console.log(`  Position: (${item.element.position.x}, ${item.element.position.y})`);
                  console.log(`  Selector: ${item.selector}`);
                } else {
                  // Verbose format
                  console.log(`  Tag: <${item.element.tag}>`);
                  if (item.element.text) {
                    const text = item.element.text.substring(0, 100);
                    console.log(`  Text: "${text}${item.element.text.length > 100 ? '...' : ''}"`);
                  }
                  console.log(`  Position: (${item.element.position.x}, ${item.element.position.y})`);
                  console.log(`  📍 Best Selector: ${item.selector}`);

                  if (item.alternatives.length > 0 && item.alternatives.length <= 3) {
                    console.log(`  Alternatives:`);
                    item.alternatives.forEach(alt => console.log(`    - ${alt}`));
                  }
                }
              });

              if (result.total && result.total > result.count + (options.offset || 0)) {
                console.log(`\nUse --limit and --offset for pagination, or --verbose for details`);
              }
            }
          }

          console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Query failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Get map status
  program
    .command('map-status')
    .description('Check interaction map status (URL, element count, cache validity, timestamp)')
    .action(async () => {
      try {
        const response = await executeViaDaemon('get-map-status', {});

        if (response.success) {
          const status = response.data as {
            exists: boolean;
            url: string | null;
            timestamp: string | null;
            elementCount: number;
            cacheValid: boolean;
          };

          console.log(`\n=== Interaction Map Status ===`);
          console.log(`Map exists: ${status.exists ? 'Yes' : 'No'}`);
          if (status.exists) {
            console.log(`URL: ${status.url || 'Unknown'}`);
            console.log(`Timestamp: ${status.timestamp || 'Unknown'}`);
            console.log(`Element count: ${status.elementCount}`);
            console.log(`Cache valid: ${status.cacheValid ? 'Yes (< 10 minutes)' : 'No (expired or not cached)'}`);
          }

          console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Status retrieval failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Force regenerate map
  program
    .command('regen-map')
    .description('Force rebuild interaction map (use when page content changes or map is stale)')
    .action(async () => {
      try {
        console.log('Regenerating interaction map...');
        const response = await executeViaDaemon('generate-map', { force: true });

        if (response.success) {
          const map = response.data as { url: string; timestamp: string; elementCount: number };
          console.log(`✓ Map regenerated successfully`);
          console.log(`  URL: ${map.url}`);
          console.log(`  Timestamp: ${map.timestamp}`);
          console.log(`  Total elements: ${map.elementCount}`);
          console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Map regeneration failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
