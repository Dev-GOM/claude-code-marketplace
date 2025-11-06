# Changelog

All notable changes to Browser Pilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-11-06

### Added
- Smart Mode now prominently recommended over Direct Mode in all documentation
- Quote rules explicitly documented for single and chain commands
- New daemon mode handler architecture with modular file organization
- Enhanced query command with detailed help text and examples

### Changed
- **BREAKING**: Simplified SKILL.md to 914 words (from 1,504 words)
- Moved detailed documentation to `references/` folder to avoid duplication
- Chain command description improved with clear examples and quote rules
- All 18 CLI command files (52+ total commands) now have detailed descriptions
- Smart Mode sections reordered to appear first in all documentation
- Quote rules clarified: quotes only needed when values contain spaces

### Improved
- CLI help system discoverability
- Commands reference documentation with Smart Mode prioritized over Direct Mode
- Selector guide with comprehensive best practices
- Interaction map documentation with clear query examples

### Fixed
- Quote rules clarified in chain mode examples (removed unnecessary quotes)
- Personal project examples removed from public documentation
- Placeholder formats standardized with angle brackets (e.g., `<url>`, `<login-url>`)
- Single mode quote rules documented consistently with chain mode

### Documentation
- Added "Recommended" labels and visual emphasis for Smart Mode
- Updated comparison tables showing Smart Mode advantages
- Enhanced troubleshooting sections with Smart Mode examples
- Progressive disclosure principle applied to reduce documentation duplication

---

## [1.3.0] - 2025-01-05

See [root CHANGELOG.md](../../CHANGELOG.md) for previous versions.
