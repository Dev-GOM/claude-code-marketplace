#!/usr/bin/env node

/**
 * Blender Toolkit CLI - Blender automation command-line interface
 * Provides geometry creation, object manipulation, and animation retargeting
 */

import { Command } from 'commander';
import { registerGeometryCommands } from './commands/geometry';
import { registerObjectCommands } from './commands/object';
import { registerModifierCommands } from './commands/modifier';
import { registerRetargetingCommands } from './commands/retargeting';

const program = new Command();

program
  .name('blender-toolkit')
  .description('Blender automation CLI with geometry creation, object manipulation, and animation retargeting')
  .version('1.1.0')
  .addHelpText('after', '\nTip: Use "<command> --help" to see detailed options for each command.\nExample: blender-toolkit create-cube --help');

// Register all command groups
registerGeometryCommands(program);
registerObjectCommands(program);
registerModifierCommands(program);
registerRetargetingCommands(program);

// Parse command line arguments
program.parse();
