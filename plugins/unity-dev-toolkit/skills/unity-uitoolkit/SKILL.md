---
name: Unity UI Toolkit
description: Assists with Unity UI Toolkit development - UXML structure, USS styling, C# VisualElement manipulation, data binding, and custom controls. Use when implementing UI Toolkit interfaces.
allowed-tools: Read, Write, Glob
---

# Unity UI Toolkit

Assists with Unity UI Toolkit development including UXML markup, USS styling, C# VisualElement API, and modern UI patterns.

## What This Skill Helps With

### UXML Structure
- Proper element hierarchy and naming conventions
- Common controls: TextField, Button, Toggle, Slider, ObjectField, ListView
- Layout containers: VisualElement, ScrollView, Foldout, TwoPaneSplitView
- Data-driven UI with templates and bindings

### USS Styling
- Class-based styling and selectors
- Flexbox layout (flex-direction, justify-content, align-items)
- USS variables and dark theme optimization
- Pseudo-classes (:hover, :active, :disabled)
- Transitions and animations

### C# VisualElement API
- Query API: `rootElement.Q<Button>("my-button")`
- Event handling: `.clicked +=` and `.RegisterValueChangedCallback()`
- Dynamic UI creation with constructors
- Data binding with `Bind()` and `SerializedObject`

### Best Practices
- UXML for structure, USS for styling, C# for logic
- Name elements for Query API access
- Use classes for styling, not inline styles
- Cache VisualElement references in fields
- Proper event cleanup in `OnDestroy()`

## Common Patterns

**Editor Window Setup:**
```csharp
public void CreateGUI() {
    var visualTree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>("path/to.uxml");
    visualTree.CloneTree(rootVisualElement);

    var button = rootVisualElement.Q<Button>("my-button");
    button.clicked += OnButtonClick;
}
```

**USS Class Toggle:**
```csharp
element.AddToClassList("active");
element.RemoveFromClassList("active");
element.ToggleInClassList("active");
```

**Data Binding:**
```csharp
var so = new SerializedObject(target);
rootVisualElement.Bind(so);
```

## Unity Version Requirements

- **Unity 2021.2+** for runtime UI Toolkit
- **Unity 2019.4+** for editor-only UI Toolkit (limited features)

See [ui-toolkit-reference.md](ui-toolkit-reference.md) for complete API documentation.

## When to Use vs Other Components

**Use this Skill when**: Building UI Toolkit interfaces, writing UXML/USS, or manipulating VisualElements in C#

**Use unity-ui-selector skill when**: Choosing between UGUI and UI Toolkit for a project

**Use @unity-scripter agent when**: Implementing complex UI logic or custom VisualElement controls

**Use EditorScriptUIToolkit templates when**: Generating new UI Toolkit editor windows with UXML/USS files

## Related Skills

- **unity-ui-selector**: Helps choose between UGUI and UI Toolkit
- **unity-template-generator**: Generates UI Toolkit editor script templates
- **unity-script-validator**: Validates UI Toolkit code patterns
