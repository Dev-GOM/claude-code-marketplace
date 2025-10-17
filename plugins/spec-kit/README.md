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

## Prerequisites

This plugin requires external tools:

1. **uv** (Python package manager)
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

2. **specify-cli** (GitHub Spec-Kit CLI)
   - Install: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`

The plugin will guide you through installation if not detected.

## Installation

Add to your `.claude/plugins.json`:

```json
{
  "plugins": [
    {
      "source": "marketplace:spec-kit"
    }
  ]
}
```

Or install from GitHub:

```json
{
  "plugins": [
    {
      "source": "github:your-username/claude-code-marketplace/plugins/spec-kit"
    }
  ]
}
```

## Commands

### Core Workflow

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/speckit:init` | Initialize spec-kit project | Starting new project |
| `/speckit:check` | Check installation status | Troubleshooting setup |
| `/speckit:constitution` | Define project principles | Before any feature work |
| `/speckit:specify` | Write feature specifications | Defining WHAT to build |
| `/speckit:plan` | Create technical plan | Defining HOW to build |
| `/speckit:tasks` | Break down into tasks | Planning implementation |
| `/speckit:implement` | Execute tasks | During development |

### Utility Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/speckit:clarify` | Resolve ambiguities | When specs unclear |
| `/speckit:analyze` | Analyze project status | Review progress |
| `/speckit:checklist` | Run quality gates | Before commit/release |

## Workflow Example

```bash
# 1. Initialize project
/speckit:init

# 2. Establish project constitution (principles & standards)
/speckit:constitution

# 3. Write feature specification (WHAT to build)
/speckit:specify

# 4. Create technical plan (HOW to build)
/speckit:plan

# 5. Break down into tasks
/speckit:tasks

# 6. Implement step by step
/speckit:implement

# 7. Check quality gates
/speckit:checklist
```

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

## Benefits

✅ **Clarity**: Know exactly what you're building before coding
✅ **Alignment**: Ensure specs, plans, and code stay in sync
✅ **Quality**: Built-in quality gates prevent regressions
✅ **Communication**: Specs serve as team documentation
✅ **Iterative**: Validate assumptions before heavy investment

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

**Version**: 1.0.0
**Last Updated**: 2025-10-16
**Status**: Beta
