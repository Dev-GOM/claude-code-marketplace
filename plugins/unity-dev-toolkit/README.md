# Unity Dev Toolkit

> **Your AI-powered companion for Unity game development**

> ⚠️ **Experimental Feature**
>
> This plugin is currently in **experimental stage**. Features may change, and some functionality might not work as expected. Please report any issues you encounter on [GitHub Issues](https://github.com/Dev-GOM/claude-code-marketplace/issues).
>
> **Known Limitations:**
> - Template generation requires manual parameter input
> - Scene optimization analysis may not cover all Unity versions
> - UI system selection (UGUI vs UI Toolkit) should be determined based on project requirements
> - Skills are model-invoked and may not activate in all contexts

> A comprehensive Claude Code plugin that brings expert Unity development assistance through specialized agents for scripting, refactoring, and optimization, plus intelligent automation and production-ready script templates.

## 🌟 Features

This plugin integrates three powerful Claude Code features to supercharge your Unity development:

### 📝 Slash Commands
Quick access to Unity development tools:
- `/unity:new-script` - Generate Unity scripts with best practices
- `/unity:optimize-scene` - Comprehensive scene performance analysis
- `/unity:setup-test` - Create complete test environments

### 🤖 Expert Agents
Specialized AI assistants for Unity development:
- `@unity-scripter` - C# scripting expert for clean, performant code
- `@unity-refactor` - Code refactoring specialist for improving quality and maintainability
- `@unity-performance` - Performance optimization specialist
- `@unity-architect` - Game system architecture consultant

### ⚡ Agent Skills
Model-invoked capabilities that Claude automatically uses when relevant:
- **unity-script-validator** - Validates Unity C# scripts for best practices and performance
- **unity-scene-optimizer** - Analyzes scenes for performance bottlenecks
- **unity-template-generator** - Assists with script template generation
- **unity-ui-selector** - Guides UGUI vs UI Toolkit selection based on project needs
- **unity-uitoolkit** - Assists with UI Toolkit development (UXML, USS, VisualElement API)
- **unity-compile-fixer** - Detects and resolves Unity C# compilation errors using VSCode diagnostics
- **unity-test-runner** - Executes and analyzes Unity Test Framework tests with detailed failure reports

## 🚀 Installation

### Quick Install

```bash
# Add the marketplace (if not already added)
/plugin marketplace add https://github.com/Dev-GOM/claude-code-marketplace.git

# Install the plugin
/plugin install unity-dev-toolkit@dev-gom-plugins

# Restart Claude Code
claude -r
```

### Verify Installation

```bash
/plugin
```

You should see "unity-dev-toolkit" in the enabled plugins list.

## 📖 Usage

### Creating Unity Scripts

```bash
# Generate a MonoBehaviour script
/unity:new-script MonoBehaviour PlayerController

# Generate a ScriptableObject
/unity:new-script ScriptableObject WeaponData

# Generate an Editor script
/unity:new-script EditorScript CustomTool

# Generate a test script
/unity:new-script TestScript PlayerControllerTests
```

The generated scripts include:
- ✅ Unity best practices and conventions
- ✅ Proper region organization
- ✅ XML documentation comments
- ✅ Performance-conscious patterns
- ✅ Null safety and validation
- ✅ Component caching
- ✅ Complete lifecycle methods

**Example Generated MonoBehaviour:**
```csharp
using UnityEngine;

namespace MyGame.Player
{
    /// <summary>
    /// Handles player movement and input
    /// </summary>
    public class PlayerController : MonoBehaviour
    {
        #region Serialized Fields
        [SerializeField] private float moveSpeed = 5f;
        [SerializeField] private float jumpForce = 10f;
        #endregion

        #region Private Fields
        private Rigidbody rb;
        private bool isGrounded;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
        }

        private void Update()
        {
            HandleInput();
        }

        private void FixedUpdate()
        {
            ApplyMovement();
        }
        #endregion

        #region Private Methods
        private void HandleInput()
        {
            // Input handling logic
        }

        private void ApplyMovement()
        {
            // Physics-based movement
        }
        #endregion
    }
}
```

### Optimizing Scene Performance

```bash
# Analyze current scene
/unity:optimize-scene

# Analyze specific scene
/unity:optimize-scene Assets/Scenes/GameLevel.unity

# Full project analysis
/unity:optimize-scene --full-project
```

The optimization analysis covers:
- 🎨 **Rendering**: Draw calls, batching, materials, textures
- ⚡ **Physics**: Rigidbody, colliders, collision matrix
- 📜 **Scripting**: Update loops, component caching, GC allocation
- 💾 **Memory**: Texture usage, asset loading, object pooling
- 📱 **Mobile**: Platform-specific optimizations

**Sample Analysis Output:**
```markdown
# Unity Scene Performance Analysis

## Current Metrics
- Draw Calls: 250 ⚠️
- Triangles: 75,000 ⚠️
- Active GameObjects: 450
- Script Components: 120

## Critical Issues
1. 🔴 Excessive draw calls (250, target: <100)
2. 🔴 5 uncompressed 4096x4096 textures
3. 🟡 Missing static batching on 50+ objects

## Recommendations
1. Enable static batching...
2. Combine materials...
3. Implement object pooling...

## Estimated Impact
- Draw calls: 250 → 80 (68% reduction)
- Frame time: 25ms → 12ms (52% improvement)
```

### Setting Up Tests

```bash
# Setup tests for a script
/unity:setup-test PlayerController

# Setup PlayMode tests
/unity:setup-test playmode PlayerMovement

# Setup full test environment
/unity:setup-test --full-project
```

Generated test suites include:
- ✅ Complete test structure with Setup/TearDown
- ✅ Unit tests for individual methods
- ✅ PlayMode tests for Unity lifecycle
- ✅ Integration tests for component interaction
- ✅ Performance benchmarks
- ✅ Edge case coverage
- ✅ Assembly definition files

**Example Test:**
```csharp
[Test]
public void Jump_WhenGrounded_IncreasesYPosition()
{
    // Arrange
    var initialY = player.transform.position.y;

    // Act
    player.Jump();

    // Assert
    Assert.Greater(player.transform.position.y, initialY);
}
```

### Using Expert Agents

You can invoke agents directly in your conversation:

```
@unity-scripter create a player controller with WASD movement and jumping

@unity-performance analyze why my game is dropping to 30 fps

@unity-architect how should I structure my inventory system?
```

**Agent Specializations:**

**@unity-scripter**
- C# scripting best practices
- Unity API expertise
- Component architecture
- Performance-conscious coding
- Code organization

**@unity-refactor**
- Code quality improvement
- Design pattern application
- Legacy code modernization
- SOLID principles
- Test-driven refactoring

**@unity-performance**
- Profiling and benchmarking
- Rendering optimization
- Memory management
- CPU/GPU optimization
- Platform-specific tuning

**@unity-architect**
- System design patterns
- Project structure
- ScriptableObject architecture
- Dependency management
- Scalable game systems

## 🔧 How It Works

### Agent Skills System

Agent Skills are **model-invoked** - Claude automatically decides when to use them based on your requests. You don't need to explicitly call them; they activate when relevant.

**1. Script Validation Skill**
When you ask Claude to review Unity scripts, the `unity-script-validator` skill automatically:
- ✅ Checks for public fields (suggests [SerializeField] private)
- ✅ Detects GetComponent in Update loops
- ✅ Identifies string concatenation issues
- ✅ Suggests XML documentation
- ✅ Recommends namespace usage
- ✅ Checks for cached references

**Example Usage:**
```
You: Can you review this Unity script for best practices?

Claude activates unity-script-validator and provides:
🎮 Unity Script Analysis

⚠️ Issues Found:
- GetComponent() called in Update - cache in Awake
- Public fields found - use [SerializeField] private

💡 Suggestions:
- Add XML documentation to public methods
- Use #region directives to organize code
```

**2. Scene Optimization Skill**
When discussing Unity scene performance, the `unity-scene-optimizer` skill helps analyze:
- ⚠️ High GameObject counts
- ⚠️ Excessive realtime lights
- ⚠️ Draw call optimization
- ⚠️ Texture compression
- 💡 Batching opportunities

**3. UI System Selection Skill**
When starting UI development, the `unity-ui-selector` skill guides you through choosing between UGUI and UI Toolkit based on:
- Target Unity version
- Project complexity
- Platform requirements
- Team experience

**4. Compile Error Resolver Skill**
When Unity projects have compilation errors, the `unity-compile-fixer` skill automatically:
- 🔍 Collects errors from VSCode diagnostics (OmniSharp C# language server)
- 📊 Analyzes error patterns against common Unity issues database
- 💡 Proposes context-aware solutions for user approval
- 🔧 Applies fixes while preserving code structure
- ✅ Verifies version control status for Unity .meta files

**Example Usage:**
```
You: My Unity project has compiler errors, can you fix them?

Claude activates unity-compile-fixer and provides:
🔍 Found 3 C# Compilation Errors

❌ CS0246 at PlayerController.cs:45
   The type or namespace name 'Rigidbody' could not be found

💡 Proposed Fix:
   Add 'using UnityEngine;' at the top of PlayerController.cs

❌ CS1061 at GameManager.cs:23
   'GameObject' does not contain a definition for 'position'

💡 Proposed Fix:
   Use 'transform.position' instead of 'gameObject.position'

✅ Apply all fixes? [Yes/No]
```

**5. Test Runner Skill**
When running Unity tests, the `unity-test-runner` skill automatically:
- 🔍 Detects Unity Editor installation across platforms (Windows/macOS/Linux)
- ⚙️ Configures test parameters (EditMode/PlayMode, categories, filters)
- 🚀 Executes tests via Unity CLI with proper timeouts
- 📊 Parses NUnit XML results and extracts failure details
- 💡 Analyzes failures against common test patterns
- 📝 Generates detailed reports with file:line references and fix suggestions

**Example Usage:**
```
You: Run all Unity tests in my project

Claude activates unity-test-runner and provides:
🧪 Unity Test Results

📊 Summary:
- Total Tests: 10
- ✓ Passed: 7 (70%)
- ✗ Failed: 2 (20%)
- ⊘ Skipped: 1 (10%)
- Duration: 12.35s

❌ Failed Tests:

1. Tests.Combat.PlayerTests.TestPlayerTakeDamage
   Location: Assets/Tests/Combat/PlayerTests.cs:42
   Failure: Expected: 90, But was: 100

   💡 Analysis: Player health not decreasing after TakeDamage() call

   Suggested Fix:
   Verify TakeDamage() implementation:
   ```csharp
   public void TakeDamage(int damage) {
       health -= damage; // Ensure this line exists
   }
   ```

2. Tests.AI.EnemyTests.TestEnemyChasePlayer
   Location: Assets/Tests/AI/EnemyTests.cs:67
   Failure: TimeoutException - Test exceeded time limit (5s)

   💡 Analysis: Infinite loop or missing yield in coroutine test

   Suggested Fix:
   Add [UnityTest] attribute and use yield return:
   ```csharp
   [UnityTest]
   public IEnumerator TestEnemyChasePlayer() {
       // ... test code ...
       yield return null; // Wait for frame
   }
   ```
```

### Script Templates

The plugin includes production-ready templates:

**MonoBehaviour Template** (`templates/MonoBehaviour.cs.template`)
- Complete lifecycle methods
- Region organization
- Component caching
- XML documentation
- Validation helpers
- Gizmo drawing

**ScriptableObject Template** (`templates/ScriptableObject.cs.template`)
- CreateAssetMenu attribute
- Property accessors
- Data validation
- Clone method
- Custom editor hooks

**Editor Script Template** (`templates/EditorScript.cs.template`)
- EditorWindow structure
- Tab system
- Settings persistence
- Context menus
- Progress bars
- Asset utilities

**Test Script Template** (`templates/TestScript.cs.template`)
- Complete test structure
- Setup/TearDown
- PlayMode tests
- Performance tests
- Edge case handling
- Helper methods

**Editor UI Toolkit Template Set** (3 files: C#, UXML, USS)
- `templates/EditorScriptUIToolkit.cs.template` - UI Toolkit EditorWindow
- `templates/EditorScriptUIToolkit.uxml.template` - UXML structure
- `templates/EditorScriptUIToolkit.uss.template` - USS styling
- VisualElement-based editor tools
- Query API for element references
- Event handling system
- EditorPrefs settings persistence
- Dark theme optimized styles

**Runtime UI Toolkit Template Set** (3 files: C#, UXML, USS)
- `templates/RuntimeUIToolkit.cs.template` - UIDocument MonoBehaviour
- `templates/RuntimeUIToolkit.uxml.template` - Game UI structure
- `templates/RuntimeUIToolkit.uss.template` - Game UI styling
- Complete game UI system (HUD, menus, inventory)
- UIDocument integration
- Runtime event handling
- Visibility control with pause support
- Responsive design for mobile

## 🎯 Workflow Example

Here's a typical Unity development workflow with this plugin:

```bash
# 1. Create a new player controller
/unity:new-script MonoBehaviour PlayerController
# Claude generates a complete, documented script following Unity best practices

# 2. Ask the scripting expert for help
@unity-scripter add input handling with the new Input System
# Expert agent implements modern Unity Input System

# 3. Ask Claude to review the script
# Claude automatically uses unity-script-validator skill

# 4. Create tests
/unity:setup-test PlayerController
# Complete test suite generated

# 5. Optimize the scene
/unity:optimize-scene Assets/Scenes/GameLevel.unity
# Comprehensive performance analysis provided

# 6. Consult the architect
@unity-architect how should I structure the enemy spawning system?
# Get architectural guidance

# 7. Performance optimization
@unity-performance the game is slow on mobile devices
# Get platform-specific optimization recommendations
```

## ⚙️ Configuration

### Customizing Templates

Templates use placeholders that are replaced during generation:
- `{{CLASS_NAME}}`: The script class name
- `{{NAMESPACE}}`: The namespace
- `{{DESCRIPTION}}`: Script description
- `{{FILE_NAME}}`: Output file name
- `{{MENU_PATH}}`: Unity menu path
- `{{WINDOW_TITLE}}`: Editor window title

### Disabling Skills

Skills are automatically used by Claude when relevant. To prevent a specific skill from being used, you can temporarily disable the plugin:

```bash
/plugin disable unity-dev-toolkit
```

To re-enable:
```bash
/plugin enable unity-dev-toolkit
```

## 🎓 Best Practices

### Script Organization

```
Assets/
├── Scripts/
│   ├── Runtime/
│   │   ├── Core/
│   │   ├── Player/
│   │   ├── Enemy/
│   │   └── Systems/
│   └── Editor/
│       └── Tools/
├── Data/
│   └── ScriptableObjects/
└── Tests/
    ├── EditMode/
    └── PlayMode/
```

### Unity Coding Conventions

```csharp
// ✅ Good
[SerializeField] private float moveSpeed = 5f;
private Rigidbody rb;

void Awake()
{
    rb = GetComponent<Rigidbody>();  // Cache reference
}

void Update()
{
    rb.velocity = ...;  // Use cached reference
}

// ❌ Bad
public float moveSpeed = 5f;  // Public field

void Update()
{
    GetComponent<Rigidbody>().velocity = ...;  // Expensive!
}
```

### Performance Patterns

**Object Pooling:**
```csharp
// Reuse objects instead of Instantiate/Destroy
public class BulletPool
{
    private Queue<Bullet> pool = new Queue<Bullet>();

    public Bullet Get()
    {
        if (pool.Count > 0)
        {
            var bullet = pool.Dequeue();
            bullet.gameObject.SetActive(true);
            return bullet;
        }
        return Instantiate(bulletPrefab);
    }

    public void Return(Bullet bullet)
    {
        bullet.gameObject.SetActive(false);
        pool.Enqueue(bullet);
    }
}
```

**Avoid Allocations:**
```csharp
// ❌ Bad: Allocates every frame
void Update()
{
    string text = "Score: " + score.ToString();
}

// ✅ Good: No allocations
private StringBuilder sb = new StringBuilder(32);

void Update()
{
    sb.Clear();
    sb.Append("Score: ");
    sb.Append(score);
}
```

## 🐛 Troubleshooting

### Plugin Not Working

1. Check installation:
   ```bash
   /plugin
   ```

2. Verify Node.js is installed:
   ```bash
   node --version
   ```

3. Enable debug mode:
   ```bash
   claude --debug
   ```

### Skills Not Activating

Skills are model-invoked and Claude decides when to use them. If a skill doesn't activate:

1. Try being more specific in your request
2. Mention keywords like "Unity script", "scene performance", or "UI system"
3. Check that the plugin is enabled: `/plugin`
4. Restart Claude Code: `claude -r`

### Agents Not Responding

1. Check agent files have valid YAML frontmatter
2. Use correct format: `@unity-scripter`
3. Ensure `.md` extension, not `.json`

## 🤝 Contributing

Contributions are welcome! You can:

1. Fork the repository
2. Add new templates
3. Improve agents and skills
4. Enhance commands
5. Share your improvements

## 📄 License

Apache License 2.0 - See [LICENSE](../../LICENSE) for details

## 🎮 Unity Version Compatibility

This plugin works with:
- ✅ Unity 2019.4 LTS and later
- ✅ Unity 2020.3 LTS
- ✅ Unity 2021.3 LTS
- ✅ Unity 2022.3 LTS
- ✅ Unity 6 (2023+)

## 📋 Changelog

### v1.3.0 (2025-10-22)
- 🔧 **New Skill**: Added `unity-compile-fixer` skill for automated C# compilation error detection and resolution
- 🔍 **VSCode Integration**: Leverages VSCode diagnostics (OmniSharp) for real-time error detection
- 📊 **Error Pattern Database**: Includes comprehensive Unity C# error patterns (CS0246, CS0029, CS1061, etc.)
- 💡 **Smart Solutions**: Proposes context-aware fixes based on error analysis
- ✅ **VCS Support**: Handles Unity .meta file conflicts and version control integration
- 📝 **Analysis Scripts**: Includes Node.js script for processing VSCode diagnostics

### v1.2.0 (2025-10-18)
- 🎨 **UI Toolkit Templates**: Added complete UI Toolkit templates for both Editor and Runtime (6 files total)
- 📝 **Editor Templates**: EditorWindow with UXML/USS (C#, UXML, USS)
- 🎮 **Runtime Templates**: UIDocument for game UI with UXML/USS (C#, UXML, USS)
- ⚡ **New Skill**: Added `unity-uitoolkit` skill for UI Toolkit development assistance
- 📚 **Template Count**: Increased from 7 to 10 production-ready templates
- 🔗 **Cross-References**: Updated Skills to reference new UI Toolkit capabilities

### v1.1.0 (2025-10-18)
- 🤖 **New Agent**: Added `@unity-refactor` agent for code refactoring and quality improvement
- 📝 **Skills Enhancement**: Added "When to Use vs Other Components" sections to all Skills
- 🔗 **Component Integration**: Clear guidance on when to use Skills vs Agents vs Commands
- 📚 **Documentation**: Improved cross-component references and usage patterns

### v1.0.1 (2025-10-18)
- 📝 **Skill Documentation Optimization**: Simplified SKILL.md files (834 → 197 lines, 76% reduction)
- 🎯 **Progressive Disclosure**: Applied best practices for concise skill documentation
- 🗑️ **Removed Redundancy**: Eliminated "When to Use This Skill" sections (skill activation is determined by description field)
- ⚡ **Token Efficiency**: Reduced context size for faster skill loading and activation

### v1.0.0 (2025-10-18)
- 🎉 Initial release
- 📝 3 slash commands: `/unity:new-script`, `/unity:optimize-scene`, `/unity:setup-test`
- 🤖 3 expert agents: `@unity-scripter`, `@unity-performance`, `@unity-architect`
- ⚡ 4 Agent Skills: `unity-script-validator`, `unity-scene-optimizer`, `unity-template-generator`, `unity-ui-selector`
- 📄 Production-ready templates for MonoBehaviour, ScriptableObject, Editor, and Test scripts

## 🙏 Credits

Created for the Unity and Claude Code communities to enhance game development productivity through intelligent AI assistance.

---

**Happy Unity Development!** 🚀🎮

For issues or suggestions, please open an issue on GitHub.
