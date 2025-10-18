# UI Toolkit Quick Reference

## Common VisualElement Types

### Input Controls
- `TextField` - Single/multi-line text input
- `IntegerField`, `FloatField`, `Vector3Field` - Numeric inputs
- `Toggle` - Boolean checkbox
- `Button` - Clickable button
- `Slider` - Value slider with optional input field
- `EnumField` - Dropdown for enum values
- `ObjectField` - Unity Object reference picker

### Layout Containers
- `VisualElement` - Generic container (like `<div>`)
- `ScrollView` - Scrollable area
- `Foldout` - Collapsible section
- `TwoPaneSplitView` - Resizable split panel
- `ListView` - Data-driven list with virtualization

### Display Elements
- `Label` - Text display
- `Image` - Sprite/Texture display
- `HelpBox` - Info/Warning/Error message box
- `ProgressBar` - Progress indicator

## USS Flexbox Layout

```css
.container {
    flex-direction: row; /* or column */
    justify-content: flex-start; /* flex-end, center, space-between */
    align-items: stretch; /* flex-start, flex-end, center */
    flex-grow: 1;
    flex-shrink: 0;
}
```

## USS Common Properties

```css
/* Spacing */
margin: 10px;
padding: 5px 10px;

/* Sizing */
width: 200px;
height: 100px;
min-width: 50px;
max-height: 300px;

/* Background */
background-color: rgb(50, 50, 50);
background-image: url('path/to/image.png');

/* Border */
border-width: 1px;
border-color: rgba(255, 255, 255, 0.2);
border-radius: 4px;

/* Text */
color: rgb(200, 200, 200);
font-size: 14px;
-unity-font-style: bold; /* or italic */
-unity-text-align: middle-center;
```

## Query API Examples

```csharp
// By name (must set name in UXML)
var button = root.Q<Button>("my-button");

// By class
var items = root.Query<VisualElement>(className: "item").ToList();

// First match
var firstLabel = root.Q<Label>();

// All matches
var allButtons = root.Query<Button>().ToList();

// Complex query
var activeItems = root.Query<VisualElement>()
    .Where(e => e.ClassListContains("active"))
    .ToList();
```

## Event Handling

```csharp
// Button click
button.clicked += () => Debug.Log("Clicked!");

// Value change
textField.RegisterValueChangedCallback(evt => {
    Debug.Log($"Changed: {evt.previousValue} -> {evt.newValue}");
});

// Mouse events
element.RegisterCallback<MouseDownEvent>(evt => {
    Debug.Log($"Mouse down at {evt.localMousePosition}");
});

// Cleanup
void OnDestroy() {
    button.clicked -= OnButtonClick;
}
```

## Data Binding

```csharp
// Bind to SerializedObject
var so = new SerializedObject(targetObject);
rootVisualElement.Bind(so);

// Manual binding
var property = so.FindProperty("fieldName");
var field = new PropertyField(property);
field.BindProperty(property);
```

## Custom VisualElement

```csharp
public class CustomElement : VisualElement
{
    public new class UxmlFactory : UxmlFactory<CustomElement, UxmlTraits> { }

    public new class UxmlTraits : VisualElement.UxmlTraits
    {
        UxmlStringAttribute customAttribute = new UxmlStringAttribute
            { name = "custom-value" };

        public override void Init(VisualElement ve, IUxmlAttributes bag,
            CreationContext cc)
        {
            base.Init(ve, bag, cc);
            ((CustomElement)ve).customValue = customAttribute.GetValueFromBag(bag, cc);
        }
    }

    private string customValue;

    public CustomElement()
    {
        AddToClassList("custom-element");
    }
}
```

## Performance Tips

1. **Use USS classes** instead of inline styles
2. **Cache VisualElement references** instead of repeated queries
3. **Use ListView** for large lists (virtualized)
4. **Avoid excessive rebuilds** - update only changed elements
5. **Use USS variables** for maintainable themes
6. **Minimize UXML nesting** for better performance

## Common Pitfalls

❌ **Querying before CreateGUI finishes**
```csharp
// Wrong
void OnEnable() {
    var button = rootVisualElement.Q<Button>(); // null!
}

// Correct
public void CreateGUI() {
    visualTree.CloneTree(rootVisualElement);
    var button = rootVisualElement.Q<Button>(); // works!
}
```

❌ **Forgetting to name elements**
```xml
<!-- Wrong: Can't query by name -->
<ui:Button text="Click" />

<!-- Correct -->
<ui:Button name="my-button" text="Click" />
```

❌ **Not cleaning up events**
```csharp
// Memory leak!
button.clicked += OnClick;

// Correct
void OnDestroy() {
    button.clicked -= OnClick;
}
```

## Resources

- Unity Manual: UI Toolkit
- Unity Scripting API: UnityEngine.UIElements
- Unity Forum: UI Toolkit section
- Sample Projects: UI Toolkit samples on GitHub
