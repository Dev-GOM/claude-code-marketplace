#!/usr/bin/env node
"use strict";
/**
 * Blender Toolkit CLI - Blender automation command-line interface
 * Provides geometry creation, object manipulation, and animation retargeting
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const geometry_1 = require("./commands/geometry");
const object_1 = require("./commands/object");
const modifier_1 = require("./commands/modifier");
const retargeting_1 = require("./commands/retargeting");
const material_1 = require("./commands/material");
const collection_1 = require("./commands/collection");
const daemon_1 = require("./commands/daemon");
const program = new commander_1.Command();
program
    .name('blender-toolkit')
    .description('Blender automation CLI with geometry creation, materials, modifiers, collections, and animation retargeting')
    .version('1.3.0')
    .addHelpText('after', '\nTip: Use "<command> --help" to see detailed options for each command.\nExample: blender-toolkit material create --help');
// Register all command groups
(0, geometry_1.registerGeometryCommands)(program);
(0, object_1.registerObjectCommands)(program);
(0, modifier_1.registerModifierCommands)(program);
(0, material_1.registerMaterialCommands)(program);
(0, collection_1.registerCollectionCommands)(program);
(0, retargeting_1.registerRetargetingCommands)(program);
(0, daemon_1.registerDaemonCommands)(program);
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map