# Spec-Kit Integration for Claude Code

[한국어 문서](README.ko.md)

Seamless integration of [GitHub Spec-Kit](https://github.com/github/spec-kit) with Claude Code for Specification-Driven Development (SDD).

## Overview

This plugin brings [GitHub's Spec-Kit](https://github.com/github/spec-kit) methodology into Claude Code, enabling a structured approach to software development:

**Constitution** → **Specification** → **Plan** → **Tasks** → **Implementation**

Instead of jumping straight into coding, define WHAT you're building (specification) and HOW you'll build it (plan) before writing a single line of code.

> 💡 **What is Spec-Kit?** A GitHub-developed framework for Specification-Driven Development that helps teams define clear requirements and plans before implementation. Learn more at [github.com/github/spec-kit](https://github.com/github/spec-kit)

## Features

- 🎯 **Spec-Driven Workflow**: Structured development process from idea to implementation
- 📝 **10 Slash Commands**: Intuitive commands for each stage of development
- 🔧 **CLI Integration**: Uses official `specify-cli` with installation guidance
- 📊 **Progress Tracking**: Analyze project status and completion
- ✅ **Quality Gates**: Automated checklist for code quality
- ⚠️ **Smart Prerequisite Checks**: Automatic warnings to prevent common mistakes

## Prerequisites

This plugin requires external tools:

1. **uv** (Python package manager)
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

2. **specify-cli** (GitHub Spec-Kit CLI)
   - Install: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`

The plugin will guide you through installation if not detected.

## Commands

### Core Workflow

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/spec-kit:init` | Initialize spec-kit project | Starting new project |
| `/spec-kit:check` | Check installation status | Troubleshooting setup |
| `/spec-kit:constitution` | Define project principles | Before any feature work |
| `/spec-kit:specify` | Write feature specifications | Defining WHAT to build |
| `/spec-kit:plan` | Create technical plan | Defining HOW to build |
| `/spec-kit:tasks` | Break down into tasks | Planning implementation |
| `/spec-kit:implement` | Execute tasks | During development |

### Utility Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/spec-kit:clarify` | Resolve ambiguities | When specs unclear |
| `/spec-kit:analyze` | Analyze project status | Review progress |
| `/spec-kit:checklist` | Run quality gates | Before commit/release |

## Workflow Example

```bash
# 1. Initialize project
/spec-kit:init

# 2. Establish project constitution (principles & standards)
/spec-kit:constitution

# 3. Write feature specification (WHAT to build)
/spec-kit:specify

# 4. Create technical plan (HOW to build)
/spec-kit:plan

# 5. Break down into tasks
/spec-kit:tasks

# 6. Implement step by step
/spec-kit:implement

# 7. Check quality gates
/spec-kit:checklist
```

## Iterative Workflow

Spec-Kit is **iterative by design**. You can revise earlier stages as you learn more during implementation.

### When to Update Earlier Stages

You should update specs, plans, or constitution when:
- 🔍 You discover missing requirements during implementation
- 💡 New insights emerge from prototyping or testing
- 🎯 Business priorities change
- ⚠️ Technical constraints reveal themselves
- 🤔 Open Questions need clarification

### How to Update (Recommended Approaches)

#### 1. Re-run Commands (Best Practice) ✅

Simply re-run the command to update that stage. Claude will maintain context and help refine:

```bash
# Need to change specification?
/spec-kit:specify

# Need to revise technical plan?
/spec-kit:plan

# Need to update constitution?
/spec-kit:constitution
```

**Why this is best:**
- 📝 Claude understands WHY you're changing things (context preserved)
- 🔄 Downstream stages automatically reflect changes
- ✅ Consistency checks and validation built-in
- 📋 Change history tracked in conversation

#### 2. Use Clarify for Specific Issues

When you need to resolve ambiguities or update specific sections:

```bash
# Clarify ambiguous parts
/spec-kit:clarify

# Then regenerate affected stages
/spec-kit:plan
/spec-kit:tasks
```

**When to use:**
- Specific parts of spec/plan need clarification
- Open Questions need answering
- Minor refinements needed

#### 3. Direct File Editing (Use Sparingly)

Only for minor cosmetic changes:

```bash
# Edit files directly in .specify/memory/
# - constitution.md
# - specification.md
# - plan.md

# Then regenerate downstream stages
/spec-kit:tasks
```

**Only use for:**
- Fixing typos
- Formatting adjustments
- Wording improvements

**Avoid for:**
- Adding/removing features
- Changing requirements
- Major restructuring

### Cascade Updates

After updating an earlier stage, regenerate downstream stages:

```
Constitution Changed → /spec-kit:specify → /spec-kit:plan → /spec-kit:tasks

Specification Changed → /spec-kit:plan → /spec-kit:tasks

Plan Changed → /spec-kit:tasks
```

### Example: Mid-Implementation Discovery

```bash
# During implementation, you realize the spec missed a critical edge case

# 1. Update specification with new requirements
/spec-kit:specify
"I need to add handling for offline mode..."

# 2. Update technical plan with new approach
/spec-kit:plan

# 3. Regenerate tasks to include new work
/spec-kit:tasks

# 4. Continue implementation with updated plan
/spec-kit:implement
```

**Key Principle:** Embrace iteration. It's better to update specs when you learn something new than to code against outdated requirements.

## Project Structure

After initialization:

```
your-project/
├── .specify/
│   ├── memory/
│   │   ├── constitution.md   # Project principles
│   │   ├── specification.md  # Feature requirements
│   │   ├── plan.md          # Technical implementation plan
│   │   └── tasks.md         # Actionable task breakdown
│   └── config.json          # Project configuration
└── ...
```

## Key Concepts

### Constitution
Your project's "bill of rights" - non-negotiable principles that guide all decisions:
- Core values (privacy, performance, accessibility)
- Technical standards (code quality, testing, security)
- Quality gates (pre-merge, pre-release checklists)

### Specification
Defines WHAT needs to be built:
- User stories and requirements
- Acceptance criteria
- UI/UX flows
- Success metrics
- NOT implementation details

### Plan
Defines HOW to build it:
- Architecture and tech stack
- Data models and components
- Implementation phases
- Performance optimization
- Testing strategy

### Tasks
Breaks the plan into actionable items:
- Small (1-4 hours each)
- Clear acceptance criteria
- Dependency mapping
- Progress tracking

## Architecture & Token Efficiency

This plugin is designed with a two-layer architecture for optimal token efficiency:

### Two-Layer Design

1. **Plugin Commands** (`/spec-kit:*`)
   - Interactive guidance layer
   - Collects information through conversation
   - Saves results to `.specify/temp/[command]-draft.md`
   - Passes only file path + instructions to core commands

2. **Core Commands** (`/speckit.*` - GitHub Spec-Kit)
   - Execution layer
   - Reads draft files directly
   - Generates/updates `.specify/memory/` files
   - Follows user instructions precisely

### Token Optimization

Instead of passing long text as command arguments:

```bash
# ❌ Inefficient: Passing all content as arguments
/speckit.specify "Long specification with hundreds of lines..."

# ✅ Efficient: Pass only file path + instruction
/speckit.specify .specify/temp/specification-draft.md

INSTRUCTION: Read the draft file and skip information collection steps.
Use ONLY the information from the draft file. Do NOT ask for additional information.
```

**Benefits:**
- 🚀 **Reduced token usage**: File path vs. full content
- 📁 **Reusable drafts**: Debug and iterate easily
- 🔄 **Clean workflow**: Separation of concerns
- ⚡ **Faster execution**: Less context to process

### Draft Files

All plugin commands create draft files in `.specify/temp/`:

```
.specify/
├── temp/                      # ← Draft files (temporary)
│   ├── constitution-draft.md
│   ├── specification-draft.md
│   ├── plan-draft.md
│   ├── tasks-draft.md
│   ├── implement-draft.md
│   ├── clarify-draft.md
│   ├── analyze-draft.md
│   └── checklist-draft.md
└── memory/                    # ← Final files (persistent)
    ├── constitution.md
    ├── specification.md
    ├── plan.md
    └── tasks.md
```

## Smart Prerequisite Checks

The plugin includes automatic prerequisite checks to prevent common mistakes and guide users toward better practices.

### Automatic Warnings

Commands automatically detect potential issues before proceeding:

#### `/spec-kit:plan` - Open Questions Check
```bash
⚠️ **Warning**: Unresolved questions found in specification!

We strongly recommend running `/spec-kit:clarify` before creating a plan.

Proceeding with unclear requirements can lead to:
- Wrong technology choices
- Unnecessary rework
- Confusion during implementation

Continue anyway? (yes/no)
```

#### `/spec-kit:tasks` - Dual Check
```bash
⚠️ **Warning**: Unresolved questions in spec or plan!

We strongly recommend running `/spec-kit:clarify` before breaking down tasks.

Proceeding with unclear requirements can lead to:
- Incomplete task definitions
- Wrong dependency mapping
- Direction changes during implementation
- Time waste

Continue anyway? (yes/no)
```

#### `/spec-kit:implement` - Project Status Check
```bash
⚠️ **Warning**: Unresolved questions in spec or plan!

We strongly recommend running `/spec-kit:clarify` before starting implementation.

Implementing with unclear requirements can lead to:
- Coding in the wrong direction
- Major refactoring later
- Time and effort waste
- Increased frustration

Continue anyway? (yes/no)
```

### Smart Commit Flow

The `/spec-kit:implement` command offers three commit options:

```
📋 **Commit Method Selection**

How would you like to proceed?

1. Run quality gate then commit (Recommended)
   - Run `/spec-kit:checklist`
   - Verify Pre-Merge Checklist passes
   - Commit if passed
   - Best for:
     • Core feature completion
     • Multiple tasks completed
     • PR creation
     • Release preparation

2. Commit directly
   - Basic quality checks only (lint, test)
   - Quick progress
   - Best for:
     • Small fixes
     • Work-in-progress saves
     • Experimental changes

3. Don't commit
   - Continue with next task
   - Batch multiple tasks together

Choice: [1/2/3]
```

### Benefits of Smart Checks

- 🛡️ **Prevents wasted effort**: Catches unclear requirements early
- 🎯 **Improves quality**: Encourages quality gate usage
- 📋 **Better workflow**: Promotes proper use of clarify/checklist commands
- 👤 **User control**: All checks are recommendations with opt-out
- 📖 **Clear guidance**: Specific commands and explanations provided

## Benefits

✅ **Clarity**: Know exactly what you're building before coding
✅ **Alignment**: Ensure specs, plans, and code stay in sync
✅ **Quality**: Built-in quality gates prevent regressions
✅ **Communication**: Specs serve as team documentation
✅ **Iterative**: Validate assumptions before heavy investment
✅ **Token Efficient**: Optimized architecture minimizes token usage

## Troubleshooting

### "specify: command not found" or Encoding Errors

If `specify` command is not found or you see Unicode encoding errors (especially on Windows), use the full path:

**Windows (CMD)**:
```cmd
set PYTHONIOENCODING=utf-8 && "%USERPROFILE%\.local\bin\specify.exe" [command]
```

**Windows (PowerShell)**:
```powershell
$env:PYTHONIOENCODING="utf-8"; & "$env:USERPROFILE\.local\bin\specify.exe" [command]
```

**macOS/Linux**:
```bash
PYTHONIOENCODING=utf-8 ~/.local/bin/specify [command]
```

**Permanent Fix** - Add to PATH:
```bash
uv tool update-shell
# Restart terminal
```

### Plugin not loading

```bash
# Check plugin configuration
cat ~/.claude/plugins.json

# Verify plugin structure
ls -la plugins/spec-kit/.claude-plugin/
```

### CLI not installed

Run `/spec-kit:check` to diagnose and get installation instructions.

## Examples

See the [examples](examples/) directory for:
- Sample constitutions
- Complete specification examples
- Technical plan templates

## Contributing

Contributions welcome! Please:
1. Follow the existing command style (frontmatter + concise instructions)
2. Test with actual spec-kit CLI
3. Update README if adding features

## Resources

- [GitHub Spec-Kit](https://github.com/github/spec-kit)
- [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins)
- [Spec-Kit Documentation](https://github.com/github/spec-kit#readme)

## License

MIT License - see [LICENSE](LICENSE) file.

## Credits

- **GitHub Spec-Kit**: Original SDD methodology and CLI
- **Claude Code**: AI-powered development environment
- **Plugin Author**: Integration and Claude Code adaptation

---

**Version**: 1.3.0
**Last Updated**: 2025-10-18
**Status**: Beta

## Changelog

### v1.3.0 (2025-10-18)
- 🔄 **Update Mode Selection**: All core commands now detect existing files and offer two update options
- 📋 **Full Regeneration**: Complete rewrite from scratch when requirements drastically change
- ✏️ **Incremental Update**: Merge-based updates for targeted changes
- 📖 **Iterative Workflow Documentation**: Comprehensive guide on when and how to update earlier stages
- 🎯 **Context Preservation**: Re-running commands maintains conversation history and change rationale
- ⚡ **Cascade Updates**: Clear guidance on updating downstream stages after changes

### v1.2.0 (2025-10-18)
- ✨ **Smart Prerequisite Checks**: Automatic Open Questions detection in plan, tasks, and implement commands
- 🎨 **Unified Commit Flow**: Single decision point with 3 clear options (quality gate + commit / direct commit / skip)
- 📋 **Better UX**: Context-appropriate guidance for each commit option
- 🛡️ **Error Prevention**: Warns about unclear requirements before proceeding
- 📖 **Documentation**: Added comprehensive "Smart Prerequisite Checks" section to READMEs

### v1.1.0 (2025-10-17)
- ✨ **Token Efficiency**: Implemented two-layer architecture with draft files
- 🚀 **Performance**: Reduced token usage by using file paths instead of full content
- 📁 **Draft System**: All commands now create reusable draft files in `.specify/temp/`
- 📝 **Instructions**: Added precise instructions for each command to skip redundant steps
- 🌐 **Multi-language**: Enhanced system language detection for all commands

### v1.0.0 (2025-10-16)
- 🎉 Initial release
- 📋 10 slash commands for complete SDD workflow
- 🔧 Integration with GitHub Spec-Kit CLI
