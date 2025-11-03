# Changelog

All notable changes to Browser Pilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-04

### Added
- **React/Framework Compatibility**: All form actions now properly trigger React synthetic events
  - `fill`, `check`, `uncheck`, `typeText`, `pressKey` now use CDP coordinate-based interactions
  - Works seamlessly with React controlled components and other modern frameworks
  - Maintains backward compatibility with non-React applications

### Changed
- **Improved Action Implementation**:
  - `fill`: Changed from JavaScript value assignment to CDP click + Input.insertText
  - `check`/`uncheck`: Changed from JavaScript property changes to CDP mouse events
  - `typeText`: Changed from JavaScript KeyboardEvent to CDP Input.insertText (with optional delay)
  - `pressKey`: Changed from JavaScript KeyboardEvent to CDP Input.dispatchKeyEvent
- All 47 actions now include verbose logging with ActionOptions parameter
- Enhanced error messages and logging across all actions

### Technical Details
- Actions now use Chrome DevTools Protocol (CDP) Input domain for proper event simulation
- Coordinate-based interactions ensure React onChange/onClick handlers are triggered
- All form interactions maintain state synchronization with React components
- No breaking changes - all existing selectors and parameters remain the same

## [0.2.1] - Previous Release

### Features
- XPath selector support with indexing
- Bot detection bypass (navigator.webdriver = false)
- 44+ browser automation actions
- Screenshot, PDF generation
- Form filling, element interaction
- Tab management, cookie control
- Console message capture
- Network interception
