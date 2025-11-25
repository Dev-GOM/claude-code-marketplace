using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Component commands (add, remove, enable, disable, get, set, inspect, move-up, move-down, copy)
    /// </summary>
    public class ComponentHandler : BaseHandler
    {
        public override string Category => "Component";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "List":
                    return HandleList(request);
                case "Add":
                    return HandleAdd(request);
                case "Remove":
                    return HandleRemove(request);
                case "SetEnabled":
                    return HandleSetEnabled(request);
                case "Get":
                    return HandleGet(request);
                case "Set":
                    return HandleSet(request);
                case "Inspect":
                    return HandleInspect(request);
                case "MoveUp":
                    return HandleMoveUp(request);
                case "MoveDown":
                    return HandleMoveDown(request);
                case "Copy":
                    return HandleCopy(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// List all components on a GameObject
        /// </summary>
        private object HandleList(JsonRpcRequest request)
        {
            var param = ValidateParam<ListParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            Component[] components = obj.GetComponents<Component>();
            var list = new List<ComponentInfo>();

            foreach (var comp in components)
            {
                if (comp == null) continue;

                // Check enabled state (only for Behaviour types)
                bool isEnabled = true;
                if (comp is Behaviour behaviour)
                {
                    isEnabled = behaviour.enabled;
                }

                // Skip disabled components if not requested
                if (!param.includeDisabled && !isEnabled)
                    continue;

                list.Add(new ComponentInfo
                {
                    type = comp.GetType().Name,
                    fullTypeName = comp.GetType().FullName,
                    enabled = isEnabled,
                    isMonoBehaviour = comp is MonoBehaviour
                });
            }

            return new ComponentListResult { count = list.Count, components = list };
        }

        /// <summary>
        /// Add a component to a GameObject
        /// </summary>
        private object HandleAdd(JsonRpcRequest request)
        {
            var param = ValidateParam<AddParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Check if component already exists
            if (obj.GetComponent(componentType) != null)
            {
                throw new Exception($"Component already exists: {param.componentType}");
            }

            // Add component
            Component comp = obj.AddComponent(componentType);

            // Register undo
            #if UNITY_EDITOR
            Undo.RegisterCreatedObjectUndo(comp, "Add Component");
            #endif

            return new ComponentInfo
            {
                type = comp.GetType().Name,
                fullTypeName = comp.GetType().FullName,
                enabled = comp is Behaviour ? ((Behaviour)comp).enabled : true,
                isMonoBehaviour = comp is MonoBehaviour
            };
        }

        /// <summary>
        /// Remove a component from a GameObject
        /// </summary>
        private object HandleRemove(JsonRpcRequest request)
        {
            var param = ValidateParam<RemoveParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Protect Transform
            if (componentType == typeof(Transform))
            {
                throw new Exception("Cannot remove Transform component (required on all GameObjects)");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            // Remove component
            #if UNITY_EDITOR
            Undo.DestroyObjectImmediate(comp);
            #else
            Object.DestroyImmediate(comp);
            #endif

            return new { success = true };
        }

        /// <summary>
        /// Enable or disable a component
        /// </summary>
        private object HandleSetEnabled(JsonRpcRequest request)
        {
            var param = ValidateParam<SetEnabledParams>(request, "name, componentType and enabled");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            // Only Behaviour components support enabled property
            if (!(comp is Behaviour behaviour))
            {
                throw new Exception($"Component {param.componentType} does not support enabled property");
            }

            #if UNITY_EDITOR
            Undo.RegisterCompleteObjectUndo(comp, param.enabled ? "Enable Component" : "Disable Component");
            #endif

            behaviour.enabled = param.enabled;

            return new { success = true, enabled = behaviour.enabled };
        }

        /// <summary>
        /// Get component properties
        /// </summary>
        private object HandleGet(JsonRpcRequest request)
        {
            var param = ValidateParam<GetParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            #if UNITY_EDITOR
            SerializedObject so = new SerializedObject(comp);

            // Get specific property
            if (!string.IsNullOrEmpty(param.property))
            {
                SerializedProperty prop = so.FindProperty(param.property);
                if (prop == null)
                {
                    throw new Exception($"Property not found: {param.property}");
                }

                return new PropertyInfo
                {
                    name = param.property,
                    type = prop.propertyType.ToString(),
                    value = GetPropertyValue(prop)
                };
            }

            // Get all properties
            var properties = new List<PropertyInfo>();
            SerializedProperty iterator = so.GetIterator();
            bool enterChildren = true;

            while (iterator.NextVisible(enterChildren))
            {
                enterChildren = false;

                // Skip internal properties
                if (iterator.name.StartsWith("m_"))
                    continue;

                properties.Add(new PropertyInfo
                {
                    name = iterator.name,
                    type = iterator.propertyType.ToString(),
                    value = GetPropertyValue(iterator)
                });
            }

            return new GetComponentResult
            {
                componentType = param.componentType,
                properties = properties
            };
            #else
            throw new Exception("Component.Get is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Set a component property
        /// </summary>
        private object HandleSet(JsonRpcRequest request)
        {
            var param = ValidateParam<SetParams>(request, "name, componentType, property and value");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            #if UNITY_EDITOR
            SerializedObject so = new SerializedObject(comp);
            SerializedProperty prop = so.FindProperty(param.property);

            if (prop == null)
            {
                throw new Exception($"Property not found: {param.property}");
            }

            // Register undo
            Undo.RegisterCompleteObjectUndo(comp, "Set Component Property");

            object oldValue = GetPropertyValue(prop);

            // Set property value
            try
            {
                SetPropertyValue(prop, param.value);
                so.ApplyModifiedProperties();
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set property: {ex.Message}");
            }

            return new SetPropertyResult
            {
                success = true,
                property = param.property,
                oldValue = oldValue,
                newValue = param.value
            };
            #else
            throw new Exception("Component.Set is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Inspect a component (get all properties and state)
        /// </summary>
        private object HandleInspect(JsonRpcRequest request)
        {
            var param = ValidateParam<InspectParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            #if UNITY_EDITOR
            SerializedObject so = new SerializedObject(comp);

            var properties = new List<PropertyInfo>();
            SerializedProperty iterator = so.GetIterator();
            bool enterChildren = true;

            while (iterator.NextVisible(enterChildren))
            {
                enterChildren = false;

                // Include all properties for inspection
                properties.Add(new PropertyInfo
                {
                    name = iterator.name,
                    type = iterator.propertyType.ToString(),
                    value = GetPropertyValue(iterator)
                });
            }

            bool isEnabled = comp is Behaviour ? ((Behaviour)comp).enabled : true;

            return new InspectComponentResult
            {
                componentType = param.componentType,
                fullTypeName = comp.GetType().FullName,
                enabled = isEnabled,
                isMonoBehaviour = comp is MonoBehaviour,
                properties = properties,
                propertyCount = properties.Count
            };
            #else
            throw new Exception("Component.Inspect is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Move a component up in the component list
        /// </summary>
        private object HandleMoveUp(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<MoveParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            // Use ComponentUtility to move component
            bool success = UnityEditorInternal.ComponentUtility.MoveComponentUp(comp);

            if (!success)
            {
                throw new Exception("Cannot move component up (already at top or is Transform)");
            }

            return new { success = true };
            #else
            throw new Exception("Component.MoveUp is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Move a component down in the component list
        /// </summary>
        private object HandleMoveDown(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<MoveParams>(request, "name and componentType");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component
            Component comp = obj.GetComponent(componentType);
            if (comp == null)
            {
                throw new Exception($"Component not found: {param.componentType}");
            }

            // Use ComponentUtility to move component
            bool success = UnityEditorInternal.ComponentUtility.MoveComponentDown(comp);

            if (!success)
            {
                throw new Exception("Cannot move component down (already at bottom)");
            }

            return new { success = true };
            #else
            throw new Exception("Component.MoveDown is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Copy a component from one GameObject to another
        /// </summary>
        private object HandleCopy(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<CopyParams>(request, "source, componentType and target");

            var sourceObj = FindGameObject(param.source);
            if (sourceObj == null)
            {
                throw new Exception($"Source GameObject not found: {param.source}");
            }

            var targetObj = FindGameObject(param.target);
            if (targetObj == null)
            {
                throw new Exception($"Target GameObject not found: {param.target}");
            }

            // Find component type
            Type componentType = FindComponentType(param.componentType);
            if (componentType == null)
            {
                throw new Exception($"Component type not found: {param.componentType}");
            }

            // Find component on source
            Component sourceComp = sourceObj.GetComponent(componentType);
            if (sourceComp == null)
            {
                throw new Exception($"Component not found on source GameObject: {param.componentType}");
            }

            // Use ComponentUtility to copy component
            bool success = UnityEditorInternal.ComponentUtility.CopyComponent(sourceComp);
            if (!success)
            {
                throw new Exception("Failed to copy component");
            }

            success = UnityEditorInternal.ComponentUtility.PasteComponentAsNew(targetObj);
            if (!success)
            {
                throw new Exception("Failed to paste component");
            }

            return new { success = true };
            #else
            throw new Exception("Component.Copy is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Find a component type by name (with multiple fallback strategies)
        /// </summary>
        private Type FindComponentType(string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
            {
                return null;
            }

            // 1. Try exact type with namespace
            var type = Type.GetType(typeName);
            if (type != null && typeof(Component).IsAssignableFrom(type))
            {
                return type;
            }

            // 2. Try UnityEngine namespace
            type = Type.GetType($"UnityEngine.{typeName}, UnityEngine");
            if (type != null && typeof(Component).IsAssignableFrom(type))
            {
                return type;
            }

            // 3. Scan all assemblies
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                type = assembly.GetType(typeName);
                if (type != null && typeof(Component).IsAssignableFrom(type))
                {
                    return type;
                }
            }

            return null;
        }

        /// <summary>
        /// Get the value of a serialized property
        /// </summary>
        private object GetPropertyValue(SerializedProperty prop)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Integer:
                    return prop.intValue;
                case SerializedPropertyType.Float:
                    return prop.floatValue;
                case SerializedPropertyType.Boolean:
                    return prop.boolValue;
                case SerializedPropertyType.String:
                    return prop.stringValue;
                case SerializedPropertyType.Vector2:
                    return new { x = prop.vector2Value.x, y = prop.vector2Value.y };
                case SerializedPropertyType.Vector3:
                    return new { x = prop.vector3Value.x, y = prop.vector3Value.y, z = prop.vector3Value.z };
                case SerializedPropertyType.Vector4:
                    return new { x = prop.vector4Value.x, y = prop.vector4Value.y, z = prop.vector4Value.z, w = prop.vector4Value.w };
                case SerializedPropertyType.Rect:
                    return new { x = prop.rectValue.x, y = prop.rectValue.y, width = prop.rectValue.width, height = prop.rectValue.height };
                case SerializedPropertyType.ArraySize:
                    return prop.arraySize;
                case SerializedPropertyType.Color:
                    return new { r = prop.colorValue.r, g = prop.colorValue.g, b = prop.colorValue.b, a = prop.colorValue.a };
                case SerializedPropertyType.ObjectReference:
                    return prop.objectReferenceValue != null ? prop.objectReferenceValue.name : "null";
                case SerializedPropertyType.Enum:
                    return prop.enumValueIndex >= 0 && prop.enumValueIndex < prop.enumNames.Length
                        ? prop.enumNames[prop.enumValueIndex]
                        : prop.enumValueIndex.ToString();
                case SerializedPropertyType.Vector2Int:
                    return new { x = prop.vector2IntValue.x, y = prop.vector2IntValue.y };
                case SerializedPropertyType.Vector3Int:
                    return new { x = prop.vector3IntValue.x, y = prop.vector3IntValue.y, z = prop.vector3IntValue.z };
                case SerializedPropertyType.RectInt:
                    return new { x = prop.rectIntValue.x, y = prop.rectIntValue.y, width = prop.rectIntValue.width, height = prop.rectIntValue.height };
                case SerializedPropertyType.Bounds:
                    return new {
                        center = new { x = prop.boundsValue.center.x, y = prop.boundsValue.center.y, z = prop.boundsValue.center.z },
                        size = new { x = prop.boundsValue.size.x, y = prop.boundsValue.size.y, z = prop.boundsValue.size.z }
                    };
                case SerializedPropertyType.BoundsInt:
                    return new {
                        position = new { x = prop.boundsIntValue.position.x, y = prop.boundsIntValue.position.y, z = prop.boundsIntValue.position.z },
                        size = new { x = prop.boundsIntValue.size.x, y = prop.boundsIntValue.size.y, z = prop.boundsIntValue.size.z }
                    };
                default:
                    return prop.propertyType.ToString();
            }
        }

        /// <summary>
        /// Set the value of a serialized property
        /// </summary>
        private void SetPropertyValue(SerializedProperty prop, string value)
        {
            try
            {
                switch (prop.propertyType)
                {
                    case SerializedPropertyType.Integer:
                        prop.intValue = int.Parse(value);
                        break;
                    case SerializedPropertyType.Float:
                        prop.floatValue = float.Parse(value);
                        break;
                    case SerializedPropertyType.Boolean:
                        prop.boolValue = bool.Parse(value);
                        break;
                    case SerializedPropertyType.String:
                        prop.stringValue = value;
                        break;
                    case SerializedPropertyType.Vector2:
                        ParseVector2(prop, value);
                        break;
                    case SerializedPropertyType.Vector3:
                        ParseVector3(prop, value);
                        break;
                    case SerializedPropertyType.Vector4:
                        ParseVector4(prop, value);
                        break;
                    case SerializedPropertyType.Rect:
                        ParseRect(prop, value);
                        break;
                    case SerializedPropertyType.Color:
                        ParseColor(prop, value);
                        break;
                    case SerializedPropertyType.Enum:
                        prop.enumValueIndex = System.Array.IndexOf(prop.enumNames, value);
                        if (prop.enumValueIndex < 0)
                        {
                            throw new Exception($"Enum value not found: {value}");
                        }
                        break;
                    case SerializedPropertyType.Vector2Int:
                        ParseVector2Int(prop, value);
                        break;
                    case SerializedPropertyType.Vector3Int:
                        ParseVector3Int(prop, value);
                        break;
                    case SerializedPropertyType.RectInt:
                        ParseRectInt(prop, value);
                        break;
                    case SerializedPropertyType.ObjectReference:
                        ParseObjectReference(prop, value);
                        break;
                    default:
                        throw new Exception($"Unsupported property type: {prop.propertyType}");
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to parse value for {prop.propertyType}: {ex.Message}");
            }
        }

        private void ParseVector2(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 2) throw new Exception("Vector2 requires 2 values");
            prop.vector2Value = new Vector2(float.Parse(parts[0]), float.Parse(parts[1]));
        }

        private void ParseVector3(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 3) throw new Exception("Vector3 requires 3 values");
            prop.vector3Value = new Vector3(float.Parse(parts[0]), float.Parse(parts[1]), float.Parse(parts[2]));
        }

        private void ParseVector4(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4) throw new Exception("Vector4 requires 4 values");
            prop.vector4Value = new Vector4(float.Parse(parts[0]), float.Parse(parts[1]), float.Parse(parts[2]), float.Parse(parts[3]));
        }

        private void ParseRect(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4) throw new Exception("Rect requires 4 values");
            prop.rectValue = new Rect(float.Parse(parts[0]), float.Parse(parts[1]), float.Parse(parts[2]), float.Parse(parts[3]));
        }

        private void ParseColor(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length < 3 || parts.Length > 4) throw new Exception("Color requires 3-4 values");
            float a = parts.Length == 4 ? float.Parse(parts[3]) : 1f;
            prop.colorValue = new Color(float.Parse(parts[0]), float.Parse(parts[1]), float.Parse(parts[2]), a);
        }

        private void ParseVector2Int(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 2) throw new Exception("Vector2Int requires 2 values");
            prop.vector2IntValue = new Vector2Int(int.Parse(parts[0]), int.Parse(parts[1]));
        }

        private void ParseVector3Int(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 3) throw new Exception("Vector3Int requires 3 values");
            prop.vector3IntValue = new Vector3Int(int.Parse(parts[0]), int.Parse(parts[1]), int.Parse(parts[2]));
        }

        private void ParseRectInt(SerializedProperty prop, string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4) throw new Exception("RectInt requires 4 values");
            prop.rectIntValue = new RectInt(int.Parse(parts[0]), int.Parse(parts[1]), int.Parse(parts[2]), int.Parse(parts[3]));
        }

        private void ParseObjectReference(SerializedProperty prop, string value)
        {
            // Handle null/empty values
            if (string.IsNullOrEmpty(value) || value.ToLower() == "null")
            {
                prop.objectReferenceValue = null;
                return;
            }

            // Check for "GameObject:Component" format (e.g., "GameHUD:UIDocument")
            if (value.Contains(":"))
            {
                var parts = value.Split(':');
                if (parts.Length == 2)
                {
                    var goName = parts[0].Trim();
                    var compTypeName = parts[1].Trim();

                    var targetGo = FindGameObject(goName);
                    if (targetGo != null)
                    {
                        var compType = FindComponentType(compTypeName);
                        if (compType != null)
                        {
                            var comp = targetGo.GetComponent(compType);
                            if (comp != null)
                            {
                                prop.objectReferenceValue = comp;
                                return;
                            }
                            throw new Exception($"Component '{compTypeName}' not found on GameObject '{goName}'");
                        }
                        throw new Exception($"Component type not found: '{compTypeName}'");
                    }
                    throw new Exception($"GameObject not found: '{goName}'");
                }
            }

            // Try to find GameObject by name
            var foundGameObject = GameObject.Find(value);
            if (foundGameObject != null)
            {
                prop.objectReferenceValue = foundGameObject;
                return;
            }

            // Try to find in all scene objects
            var allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
            foreach (var obj in allObjects)
            {
                if (obj.name == value && obj.scene.IsValid())
                {
                    prop.objectReferenceValue = obj;
                    return;
                }
            }

            // Try to load as asset
            #if UNITY_EDITOR
            var asset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(value);
            if (asset != null)
            {
                prop.objectReferenceValue = asset;
                return;
            }
            #endif

            // If nothing found, throw error with suggestions
            throw new Exception($"ObjectReference not found: '{value}'. Try GameObject name, 'GameObject:Component' format, or asset path.");
        }

        #region Parameter Classes

        [Serializable]
        private class ListParams
        {
            public string name;
            public bool includeDisabled;
        }

        [Serializable]
        private class AddParams
        {
            public string name;
            public string componentType;
        }

        [Serializable]
        private class RemoveParams
        {
            public string name;
            public string componentType;
        }

        [Serializable]
        private class SetEnabledParams
        {
            public string name;
            public string componentType;
            public bool enabled;
        }

        [Serializable]
        private class GetParams
        {
            public string name;
            public string componentType;
            public string property;
        }

        [Serializable]
        private class SetParams
        {
            public string name;
            public string componentType;
            public string property;
            public string value;
        }

        [Serializable]
        private class InspectParams
        {
            public string name;
            public string componentType;
        }

        [Serializable]
        private class MoveParams
        {
            public string name;
            public string componentType;
        }

        [Serializable]
        private class CopyParams
        {
            public string source;
            public string componentType;
            public string target;
        }

        #endregion

        #region Response Classes

        [Serializable]
        public class ComponentInfo
        {
            public string type;
            public string fullTypeName;
            public bool enabled;
            public bool isMonoBehaviour;
        }

        [Serializable]
        public class ComponentListResult
        {
            public int count;
            public List<ComponentInfo> components;
        }

        [Serializable]
        public class PropertyInfo
        {
            public string name;
            public string type;
            public object value;
        }

        [Serializable]
        public class GetComponentResult
        {
            public string componentType;
            public List<PropertyInfo> properties;
        }

        [Serializable]
        public class SetPropertyResult
        {
            public bool success;
            public string property;
            public object oldValue;
            public object newValue;
        }

        [Serializable]
        public class InspectComponentResult
        {
            public string componentType;
            public string fullTypeName;
            public bool enabled;
            public bool isMonoBehaviour;
            public List<PropertyInfo> properties;
            public int propertyCount;
        }

        #endregion
    }
}
