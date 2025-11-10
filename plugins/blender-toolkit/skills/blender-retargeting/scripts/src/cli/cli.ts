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
import { registerMaterialCommands } from './commands/material';
import { registerCollectionCommands } from './commands/collection';
import { registerDaemonCommands } from './commands/daemon';

const program = new Command();

program
  .name('blender-toolkit')
  .description('Blender automation CLI with geometry creation, materials, modifiers, collections, and animation retargeting')
  .version('1.3.0')
  .addHelpText('after', '\nTip: Use "<command> --help" to see detailed options for each command.\nExample: blender-toolkit material create --help');

// Register all command groups
registerGeometryCommands(program);
registerObjectCommands(program);
registerModifierCommands(program);
registerMaterialCommands(program);
registerCollectionCommands(program);
registerRetargetingCommands(program);
registerDaemonCommands(program);

// Parse command line arguments
program.parse();
