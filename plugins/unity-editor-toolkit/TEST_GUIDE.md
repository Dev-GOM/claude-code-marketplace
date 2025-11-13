**Language**: English | [한국어](./TEST_GUIDE.ko.md)

---

# Unity Editor Toolkit - Test Guide

Complete guide for running Unity Test Framework tests.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Setup](#test-setup)
3. [Running Tests in Unity Editor](#running-tests-in-unity-editor)
4. [Running Tests via Command Line](#running-tests-via-command-line)
5. [Understanding Test Results](#understanding-test-results)
6. [Test Coverage](#test-coverage)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Unity Version

- **Unity 2020.3 or later**

### Unity Test Framework

| Unity Version | Test Framework Status |
|---------------|----------------------|
| **Unity 2019.2+** | ✅ **Automatically included** in all projects |
| **Unity 6+ (2023.x+)** | ✅ **Core Package** (version fixed to Editor) + New features |

> **Important**: Test Framework has been automatically included since Unity 2019.2. In Unity 6+, it's classified as a "Core Package" with version locked to the Editor version.

**Unity 6+ New Features** (since 2023.2):
- ✅ Test Retry and Repeat functionality
- ✅ Randomized test execution order (`-randomOrderSeed`)
- ✅ Auto-generated `TestFileReferences.json`
- ✅ SRP test auto-updates

### Package Installation

The Unity Editor Toolkit package includes test assemblies:

```
unity-package/
├── Tests/
│   ├── Editor/
│   │   ├── UnityEditorToolkit.Editor.Tests.asmdef
│   │   ├── UnityMainThreadDispatcherTests.cs (10 tests)
│   │   ├── GameObjectCachingTests.cs (13 tests)
│   │   ├── Vector3ValidationTests.cs (20 tests)
│   │   └── JsonRpcProtocolTests.cs (23 tests)
│   └── Runtime/
│       └── UnityEditorToolkit.Tests.asmdef
```

**Total: 66 automated tests**

---

## Test Setup

### 1. Install Package

If not already installed, add the package via UPM:

```
Window → Package Manager → + → Add package from git URL
```

Enter:
```
https://github.com/Dev-GOM/claude-code-marketplace.git?path=/plugins/unity-editor-toolkit/skills/assets/unity-package
```

### 2. Verify Test Framework

**All Unity versions (2019.2+)**:
- Test Framework is **automatically included**
- No installation needed
- Test Runner available immediately

**If Test Runner window is missing** (rare):
1. `Window → Package Manager`
2. Verify "Test Framework" is listed in "Built-in packages"
3. If not visible, restart Unity Editor

**Unity 6+ Specific**:
- Test Framework is a **Core Package** (cannot change version)
- Version is locked to your Unity Editor version
- Includes new features: Retry, Repeat, Random order

### 3. Open Test Runner

Open the Test Runner window:

```
Window → General → Test Runner
```

Or use keyboard shortcut: `Ctrl + Alt + T` (Windows/Linux) or `Cmd + Alt + T` (macOS)

---

## Running Tests in Unity Editor

### Method 1: Test Runner Window (Recommended)

#### Step 1: Open Test Runner

`Window → General → Test Runner`

#### Step 2: Select Test Mode

Click the **"EditMode"** tab (all current tests are EditMode)

#### Step 3: View Test Hierarchy

You should see:

```
▼ UnityEditorToolkit.Editor.Tests
  ▼ UnityMainThreadDispatcherTests (10 tests)
  ▼ GameObjectCachingTests (13 tests)
  ▼ Vector3ValidationTests (20 tests)
  ▼ JsonRpcProtocolTests (23 tests)
```

#### Step 4: Run Tests

**Run All Tests:**
- Click `Run All` button at the top

**Run Specific Test Suite:**
- Right-click test class (e.g., "UnityMainThreadDispatcherTests")
- Select `Run`

**Run Single Test:**
- Right-click individual test (e.g., "Instance_Should_CreateSingleton")
- Select `Run`

#### Step 5: View Results

Test results appear in the Test Runner window:

- ✅ **Green checkmark**: Test passed
- ❌ **Red X**: Test failed
- ⏭️ **Gray dash**: Test skipped

**Example Output:**
```
✓ UnityMainThreadDispatcherTests.Instance_Should_CreateSingleton (0.003s)
✓ UnityMainThreadDispatcherTests.Enqueue_Should_ExecuteAction_OnMainThread (0.012s)
✓ GameObjectCachingTests.FindGameObject_Should_FindExistingObject (0.008s)
✓ Vector3ValidationTests.ToVector3_Should_Throw_On_NaN_X (0.002s)

Total: 66 tests
Passed: 66
Failed: 0
Inconclusive: 0
Skipped: 0
Time: 2.345s
```

---

### Method 2: Run Selected Tests

1. Select one or more tests in Test Runner
2. Click `Run Selected` button

### Method 3: Re-run Failed Tests

After a test run with failures:

1. Click `Rerun Failed` button
2. Only failed tests will run again

---

## Running Tests via Command Line

### Windows

```batch
"C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe" ^
  -runTests ^
  -batchmode ^
  -projectPath "C:\Path\To\Your\UnityProject" ^
  -testResults "C:\Path\To\Results\test-results.xml" ^
  -testPlatform EditMode ^
  -logFile "C:\Path\To\Logs\unity-test.log"
```

### macOS / Linux

```bash
/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity \
  -runTests \
  -batchmode \
  -projectPath "/path/to/your/UnityProject" \
  -testResults "/path/to/results/test-results.xml" \
  -testPlatform EditMode \
  -logFile "/path/to/logs/unity-test.log"
```

### Parameters Explained

- `-runTests`: Run tests and exit
- `-batchmode`: Run without UI (headless)
- `-projectPath`: Path to Unity project
- `-testResults`: Output XML file path (NUnit format)
- `-testPlatform EditMode`: Run EditMode tests
- `-logFile`: Unity log output file

### Exit Codes

- `0`: All tests passed
- `2`: Some tests failed
- `3`: Run error (e.g., compilation error)

---

## Understanding Test Results

### Test Runner Results

Each test shows:

1. **Status Icon**
   - ✅ Green: Passed
   - ❌ Red: Failed
   - ⚠️ Yellow: Inconclusive
   - ⏭️ Gray: Skipped

2. **Test Name**
   - Format: `ClassName.TestMethodName`
   - Example: `UnityMainThreadDispatcherTests.Instance_Should_CreateSingleton`

3. **Execution Time**
   - Shows in seconds (e.g., `0.012s`)

4. **Failure Details** (if failed)
   - Stack trace
   - Expected vs. Actual values
   - Assertion message

### XML Test Results

When running via command line, results are saved in NUnit XML format:

```xml
<?xml version="1.0" encoding="utf-8"?>
<test-results>
  <test-suite name="UnityEditorToolkit.Editor.Tests">
    <results>
      <test-case name="UnityMainThreadDispatcherTests.Instance_Should_CreateSingleton"
                 executed="True"
                 success="True"
                 time="0.003"/>
      <!-- More test cases... -->
    </results>
  </test-suite>
</test-results>
```

---

## Test Coverage

### Current Test Coverage

| Component | Tests | Coverage |
|-----------|-------|----------|
| **UnityMainThreadDispatcher** | 10 tests | Critical thread safety |
| **GameObject Caching** | 13 tests | Performance optimization |
| **Vector3 Validation** | 20 tests | Security (NaN/Infinity) |
| **JSON-RPC Protocol** | 23 tests | Protocol compliance |
| **Total** | **66 tests** | **Core functionality** |

### What's Tested

#### 1. Thread Safety (Critical)
- ✅ Singleton instance creation
- ✅ Main thread execution verification
- ✅ Multiple actions in order
- ✅ Exception handling
- ✅ Concurrent access (5 threads)
- ✅ Unity API calls from background threads

#### 2. Performance (Caching)
- ✅ GameObject search with caching
- ✅ Cache hit performance (10x-100x faster)
- ✅ Cache invalidation when destroyed
- ✅ Inactive GameObject handling
- ✅ Nested GameObject support
- ✅ Large-scale caching (100+ objects)

#### 3. Security (Validation)
- ✅ NaN detection (x, y, z)
- ✅ PositiveInfinity detection
- ✅ NegativeInfinity detection
- ✅ Valid value acceptance (zero, positive, negative)
- ✅ Float precision preservation
- ✅ Edge cases (MaxValue, MinValue)

#### 4. Protocol Compliance (JSON-RPC 2.0)
- ✅ Request serialization/deserialization
- ✅ Response serialization
- ✅ Error response with request ID preservation
- ✅ Error codes (-32700, -32600, -32601, -32602, -32603)
- ✅ Parameter deserialization
- ✅ Complex parameter handling
- ✅ JSON-RPC 2.0 specification compliance

### What's NOT Tested (Future)

- ⏳ WebSocket communication (integration tests)
- ⏳ Handler implementations (GameObject, Transform, etc.)
- ⏳ Server lifecycle (start, stop, reconnect)
- ⏳ Console log collection
- ⏳ Scene loading
- ⏳ Undo system integration

---

## Troubleshooting

### Problem: "Test Framework package not found"

**Unity 6+ (2023.x+)**:
- This issue should not occur (Test Framework is built-in)
- If Test Runner window is missing, verify Unity installation

**Unity 2020.3 - 2022.x**:
1. Open Package Manager
2. Search "Test Framework"
3. Install "Test Framework" package
4. Restart Unity Editor

### Problem: "Assembly reference errors"

**Solution:**
1. Check that `UnityEditorToolkit.asmdef` exists in `Runtime/`
2. Verify test assembly definitions reference main assembly:
   ```json
   {
     "references": ["UnityEditorToolkit"]
   }
   ```
3. Reimport package: Right-click package → Reimport

### Problem: Tests not appearing in Test Runner

**Solution:**
1. Ensure `UNITY_INCLUDE_TESTS` define is set (automatic with testables)
2. Check assembly definition has `"autoReferenced": false`
3. Restart Unity Editor
4. Click "Refresh" in Test Runner window

### Problem: "DllNotFoundException: websocket-sharp"

**Solution:**
Tests don't require websocket-sharp (no actual server connection), but if error occurs:

1. Check `ThirdParty/websocket-sharp/websocket-sharp.dll` exists
2. Run installation script (see QUICKSTART.md)
3. Restart Unity Editor

### Problem: Tests fail with "NullReferenceException"

**Solution:**
1. Check if test requires GameObject setup
2. Verify `[SetUp]` method runs before each test
3. Check `[TearDown]` properly cleans up
4. Run test individually to isolate issue

### Problem: "UnityMainThreadDispatcher tests fail"

**Solution:**
1. Ensure tests use `[UnityTest]` attribute (not `[Test]`) for coroutines
2. Add `yield return null;` to wait for Update() execution
3. Check if multiple dispatcher instances conflict (cleanup in TearDown)

### Problem: Slow test execution

**Expected Times:**
- All tests: ~2-5 seconds
- UnityMainThreadDispatcher: ~0.5s (includes frame waits)
- GameObjectCaching: ~0.3s
- Vector3Validation: ~0.1s (pure logic)
- JsonRpcProtocol: ~0.2s (serialization)

**If slower:**
1. Check Unity isn't recompiling during tests
2. Close unnecessary Editor windows
3. Disable auto-refresh: `Edit → Preferences → Asset Pipeline → Auto Refresh (off)`

### Problem: "Could not load assembly"

**Solution:**
1. Delete `Library/` folder
2. Restart Unity (forces recompilation)
3. Wait for compilation to finish
4. Reopen Test Runner

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Unity Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: game-ci/unity-test-runner@v2
        with:
          projectPath: ./
          testMode: EditMode
          artifactsPath: test-results

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results
```

### Jenkins Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh '''
                    /Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity \
                      -runTests \
                      -batchmode \
                      -projectPath $WORKSPACE \
                      -testResults test-results.xml \
                      -testPlatform EditMode
                '''
            }
        }
    }
    post {
        always {
            junit 'test-results.xml'
        }
    }
}
```

---

## Best Practices

### When to Run Tests

1. **Before committing**: Run all tests
2. **After modifying core code**: Run affected tests
3. **Before releasing**: Full test suite
4. **In CI/CD**: Every push/PR

### Writing New Tests

When adding new features, follow existing patterns:

```csharp
[Test]
public void FeatureName_Should_DoExpectedBehavior()
{
    // Arrange: Set up test conditions
    var testObject = new GameObject("Test");

    // Act: Execute the code being tested
    var result = handler.DoSomething(testObject);

    // Assert: Verify expected outcome
    Assert.IsNotNull(result);
    Assert.AreEqual(expectedValue, result);

    // Cleanup: Destroy objects
    Object.DestroyImmediate(testObject);
}
```

### Test Naming Convention

Format: `MethodName_Should_ExpectedBehavior_WhenCondition`

Examples:
- ✅ `FindGameObject_Should_ReturnNull_WhenNotFound`
- ✅ `ToVector3_Should_Throw_On_NaN_X`
- ✅ `Enqueue_Should_ExecuteAction_OnMainThread`

---

## Additional Resources

### Unity Documentation

- [Unity Test Framework Manual](https://docs.unity3d.com/Packages/com.unity.test-framework@latest)
- [Writing Tests](https://docs.unity3d.com/Packages/com.unity.test-framework@latest/index.html?subfolder=/manual/workflow-create-test.html)
- [Test Attributes](https://docs.unity3d.com/Packages/com.unity.test-framework@latest/index.html?subfolder=/manual/reference-attribute.html)

### NUnit Documentation

- [NUnit Assertions](https://docs.nunit.org/articles/nunit/writing-tests/assertions/assertion-models/constraint.html)
- [Test Attributes](https://docs.nunit.org/articles/nunit/writing-tests/attributes.html)

### Unity Editor Toolkit

- [Main README](../README.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Command Roadmap](./COMMANDS.md)
- **Implemented Command Categories:**
  - [Connection & Status](./COMMANDS_CONNECTION_STATUS.md)
  - [GameObject & Hierarchy](./COMMANDS_GAMEOBJECT_HIERARCHY.md)
  - [Transform](./COMMANDS_TRANSFORM.md)
  - [Scene Management](./COMMANDS_SCENE.md)
  - [Asset Database & Editor](./COMMANDS_EDITOR.md)
  - [Console & Logging](./COMMANDS_CONSOLE.md)

---

## Quick Command Reference

```bash
# Open Test Runner
Window → General → Test Runner
Shortcut: Ctrl+Alt+T (Win/Linux) or Cmd+Alt+T (Mac)

# Run all tests
Click "Run All" button in Test Runner

# Run from command line (Windows)
Unity.exe -runTests -batchmode -projectPath "path" -testResults "results.xml" -testPlatform EditMode

# View test results
Open test-results.xml in any XML viewer or CI tool
```

---

**Total Tests**: 66
