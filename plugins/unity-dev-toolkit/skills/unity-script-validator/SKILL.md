---
name: Unity Script Validator
description: Validates C# scripts for best practices, performance, and Unity patterns. Use when reviewing scripts or checking code quality.
allowed-tools: Read, Grep, Glob
---

# Unity Script Validator

Validates Unity C# scripts against best practices and performance patterns specific to Unity game development.

## What This Skill Checks

- **Field declarations**: `[SerializeField] private` instead of public fields
- **Component caching**: GetComponent in Awake/Start, not Update (~100x faster)
- **String operations**: StringBuilder for frequent concatenation
- **GameObject.Find**: Cache references, avoid in Update (O(n) operation)
- **Code organization**: #region directives, consistent ordering
- **XML documentation**: `<summary>` tags on public methods
- **Update vs FixedUpdate**: Appropriate usage for physics/non-physics
- **Coroutines**: Prefer for intermittent tasks over Update

Provides: Issues found, specific fixes, performance impact estimates, refactored code examples.

## Compatibility

Applies to Unity 2019.4 LTS and later (including Unity 6).

See [patterns.md](patterns.md) and [examples.md](examples.md) for detailed optimization techniques.

## When to Use vs Other Components

**Use this Skill when**: Quick validation of existing Unity scripts for best practices and common issues

**Use @unity-scripter agent when**: Writing new code or implementing Unity features from scratch

**Use @unity-refactor agent when**: Improving code quality, applying design patterns, or modernizing legacy code

**Use @unity-performance agent when**: Deep performance profiling, memory optimization, or platform-specific tuning

**Use /unity:new-script command when**: Creating new scripts from production-ready templates

## Related Skills

- **unity-scene-optimizer**: For scene-level performance analysis
- **unity-template-generator**: For generating validated script templates
