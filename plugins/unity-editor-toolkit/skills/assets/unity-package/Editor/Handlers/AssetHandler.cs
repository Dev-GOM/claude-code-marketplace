using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Utils;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Asset management commands (ScriptableObject, etc.)
    /// </summary>
    public class AssetHandler : BaseHandler
    {
        public override string Category => "Asset";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "ListScriptableObjectTypes":
                    return HandleListSOTypes(request);
                case "CreateScriptableObject":
                    return HandleCreateSO(request);
                case "GetFields":
                    return HandleGetFields(request);
                case "SetField":
                    return HandleSetField(request);
                case "Inspect":
                    return HandleInspect(request);
                case "AddArrayElement":
                    return HandleAddArrayElement(request);
                case "RemoveArrayElement":
                    return HandleRemoveArrayElement(request);
                case "GetArrayElement":
                    return HandleGetArrayElement(request);
                case "ClearArray":
                    return HandleClearArray(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// List all available ScriptableObject types
        /// </summary>
        private object HandleListSOTypes(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<FilterParams>() ?? new FilterParams();

            try
            {
                var types = TypeCache.GetTypesDerivedFrom<ScriptableObject>()
                    .Where(t => !t.IsAbstract && !t.IsGenericType && t.IsPublic)
                    .Select(t => new TypeInfo
                    {
                        fullName = t.FullName,
                        name = t.Name,
                        assembly = t.Assembly.GetName().Name,
                        namespaceName = t.Namespace ?? ""
                    })
                    .ToList();

                // Apply filter
                if (!string.IsNullOrEmpty(param.filter))
                {
                    string filterLower = param.filter.ToLower();
                    bool hasWildcard = param.filter.Contains("*");

                    if (hasWildcard)
                    {
                        string pattern = filterLower.Replace("*", "");
                        types = types.Where(t =>
                        {
                            string nameLower = t.fullName.ToLower();
                            if (param.filter.StartsWith("*") && param.filter.EndsWith("*"))
                                return nameLower.Contains(pattern);
                            else if (param.filter.StartsWith("*"))
                                return nameLower.EndsWith(pattern);
                            else if (param.filter.EndsWith("*"))
                                return nameLower.StartsWith(pattern);
                            return nameLower.Contains(pattern);
                        }).ToList();
                    }
                    else
                    {
                        types = types.Where(t =>
                            t.fullName.ToLower().Contains(filterLower) ||
                            t.name.ToLower().Contains(filterLower)).ToList();
                    }
                }

                return new
                {
                    success = true,
                    types = types.OrderBy(t => t.fullName).ToList(),
                    count = types.Count
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to list ScriptableObject types: {ex.Message}");
            }
            #else
            throw new Exception("Asset.ListScriptableObjectTypes is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Create a new ScriptableObject asset
        /// </summary>
        private object HandleCreateSO(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<CreateSOParams>(request, "typeName and path");

            if (string.IsNullOrWhiteSpace(param.typeName))
            {
                throw new Exception("Type name cannot be empty");
            }

            if (string.IsNullOrWhiteSpace(param.path))
            {
                throw new Exception("Asset path cannot be empty");
            }

            try
            {
                // Find the type
                Type soType = FindScriptableObjectType(param.typeName);
                if (soType == null)
                {
                    throw new Exception($"ScriptableObject type not found: {param.typeName}");
                }

                // Normalize path
                string assetPath = param.path;
                if (!assetPath.StartsWith("Assets/"))
                {
                    assetPath = "Assets/" + assetPath;
                }
                if (!assetPath.EndsWith(".asset"))
                {
                    assetPath += ".asset";
                }

                // Ensure directory exists
                string directory = Path.GetDirectoryName(assetPath);
                EnsureDirectoryExists(directory);

                // Create instance
                var instance = ScriptableObject.CreateInstance(soType);
                if (instance == null)
                {
                    throw new Exception($"Failed to create instance of type: {param.typeName}");
                }

                // Save as asset
                AssetDatabase.CreateAsset(instance, assetPath);
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();

                return new
                {
                    success = true,
                    path = assetPath,
                    typeName = soType.FullName,
                    message = $"ScriptableObject created at {assetPath}"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to create ScriptableObject: {ex.Message}");
            }
            #else
            throw new Exception("Asset.CreateScriptableObject is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Get fields of a ScriptableObject
        /// </summary>
        private object HandleGetFields(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<GetFieldsParams>() ?? new GetFieldsParams();

            if (string.IsNullOrWhiteSpace(param.path))
            {
                throw new Exception("path parameter is required");
            }

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var fields = new List<FieldInfo>();

                var property = serializedObject.GetIterator();
                bool enterChildren = true;

                while (property.NextVisible(enterChildren))
                {
                    enterChildren = false;

                    // Skip m_Script field
                    if (property.name == "m_Script")
                        continue;

                    var fieldInfo = CreateFieldInfo(property, param.expandArrays, param.maxDepth);
                    fields.Add(fieldInfo);
                }

                return new
                {
                    success = true,
                    path = assetPath,
                    typeName = asset.GetType().FullName,
                    fields = fields,
                    count = fields.Count
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get fields: {ex.Message}");
            }
            #else
            throw new Exception("Asset.GetFields is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Set a field value of a ScriptableObject (supports array index: fieldName[index])
        /// </summary>
        private object HandleSetField(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetFieldParams>(request, "path, fieldName, value");

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);

                // Parse field path (supports array index like items[0] or items[0].name)
                var property = FindPropertyByPath(serializedObject, param.fieldName);

                if (property == null)
                {
                    throw new Exception($"Field not found: {param.fieldName}");
                }

                // Record undo
                Undo.RecordObject(asset, $"Modify {param.fieldName}");

                // Set value based on type
                string previousValue = GetPropertyValueAsString(property);
                SetPropertyValue(property, param.value);

                serializedObject.ApplyModifiedProperties();
                EditorUtility.SetDirty(asset);
                AssetDatabase.SaveAssets();

                return new
                {
                    success = true,
                    path = assetPath,
                    fieldName = param.fieldName,
                    previousValue = previousValue,
                    newValue = param.value,
                    message = $"Field '{param.fieldName}' updated"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set field: {ex.Message}");
            }
            #else
            throw new Exception("Asset.SetField is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Inspect a ScriptableObject (full details)
        /// </summary>
        private object HandleInspect(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<GetFieldsParams>() ?? new GetFieldsParams();

            if (string.IsNullOrWhiteSpace(param.path))
            {
                throw new Exception("path parameter is required");
            }

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var fields = new List<FieldInfo>();

                var property = serializedObject.GetIterator();
                bool enterChildren = true;

                while (property.NextVisible(enterChildren))
                {
                    enterChildren = false;

                    if (property.name == "m_Script")
                        continue;

                    var fieldInfo = CreateFieldInfo(property, param.expandArrays, param.maxDepth);
                    fields.Add(fieldInfo);
                }

                // Get asset metadata
                string guid = AssetDatabase.AssetPathToGUID(assetPath);
                var assetImporter = AssetImporter.GetAtPath(assetPath);

                return new
                {
                    success = true,
                    metadata = new
                    {
                        path = assetPath,
                        guid = guid,
                        typeName = asset.GetType().FullName,
                        typeNameShort = asset.GetType().Name,
                        namespaceName = asset.GetType().Namespace ?? "",
                        assemblyName = asset.GetType().Assembly.GetName().Name,
                        instanceId = asset.GetInstanceID(),
                        name = asset.name,
                        hideFlags = asset.hideFlags.ToString(),
                        userData = assetImporter?.userData ?? ""
                    },
                    fields = fields,
                    fieldCount = fields.Count
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to inspect asset: {ex.Message}");
            }
            #else
            throw new Exception("Asset.Inspect is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Add an element to an array field
        /// </summary>
        private object HandleAddArrayElement(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ArrayElementParams>(request, "path, fieldName");

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var property = FindPropertyByPath(serializedObject, param.fieldName);

                if (property == null)
                {
                    throw new Exception($"Field not found: {param.fieldName}");
                }

                if (!property.isArray)
                {
                    throw new Exception($"Field '{param.fieldName}' is not an array");
                }

                // Record undo
                Undo.RecordObject(asset, $"Add element to {param.fieldName}");

                int insertIndex = param.index >= 0 && param.index <= property.arraySize
                    ? param.index
                    : property.arraySize;

                property.InsertArrayElementAtIndex(insertIndex);

                // Set value if provided
                if (param.value != null)
                {
                    var newElement = property.GetArrayElementAtIndex(insertIndex);
                    SetPropertyValue(newElement, param.value);
                }

                serializedObject.ApplyModifiedProperties();
                EditorUtility.SetDirty(asset);
                AssetDatabase.SaveAssets();

                return new
                {
                    success = true,
                    path = assetPath,
                    fieldName = param.fieldName,
                    index = insertIndex,
                    newSize = property.arraySize,
                    message = $"Element added at index {insertIndex}"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to add array element: {ex.Message}");
            }
            #else
            throw new Exception("Asset.AddArrayElement is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Remove an element from an array field
        /// </summary>
        private object HandleRemoveArrayElement(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ArrayElementParams>(request, "path, fieldName, index");

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var property = FindPropertyByPath(serializedObject, param.fieldName);

                if (property == null)
                {
                    throw new Exception($"Field not found: {param.fieldName}");
                }

                if (!property.isArray)
                {
                    throw new Exception($"Field '{param.fieldName}' is not an array");
                }

                if (param.index < 0 || param.index >= property.arraySize)
                {
                    throw new Exception($"Index {param.index} out of range (0-{property.arraySize - 1})");
                }

                // Record undo
                Undo.RecordObject(asset, $"Remove element from {param.fieldName}");

                // Get value before removal for return
                var elementToRemove = property.GetArrayElementAtIndex(param.index);
                string removedValue = GetPropertyValueAsString(elementToRemove);

                // For ObjectReference, need to set to null first then delete
                if (elementToRemove.propertyType == SerializedPropertyType.ObjectReference &&
                    elementToRemove.objectReferenceValue != null)
                {
                    elementToRemove.objectReferenceValue = null;
                }

                property.DeleteArrayElementAtIndex(param.index);

                serializedObject.ApplyModifiedProperties();
                EditorUtility.SetDirty(asset);
                AssetDatabase.SaveAssets();

                return new
                {
                    success = true,
                    path = assetPath,
                    fieldName = param.fieldName,
                    removedIndex = param.index,
                    removedValue = removedValue,
                    newSize = property.arraySize,
                    message = $"Element removed at index {param.index}"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to remove array element: {ex.Message}");
            }
            #else
            throw new Exception("Asset.RemoveArrayElement is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Get a specific array element
        /// </summary>
        private object HandleGetArrayElement(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ArrayElementParams>(request, "path, fieldName, index");

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var property = FindPropertyByPath(serializedObject, param.fieldName);

                if (property == null)
                {
                    throw new Exception($"Field not found: {param.fieldName}");
                }

                if (!property.isArray)
                {
                    throw new Exception($"Field '{param.fieldName}' is not an array");
                }

                if (param.index < 0 || param.index >= property.arraySize)
                {
                    throw new Exception($"Index {param.index} out of range (0-{property.arraySize - 1})");
                }

                var element = property.GetArrayElementAtIndex(param.index);
                var elementInfo = CreateFieldInfo(element, true, 3);

                return new
                {
                    success = true,
                    path = assetPath,
                    fieldName = param.fieldName,
                    index = param.index,
                    element = elementInfo
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get array element: {ex.Message}");
            }
            #else
            throw new Exception("Asset.GetArrayElement is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Clear all elements from an array
        /// </summary>
        private object HandleClearArray(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ArrayElementParams>(request, "path, fieldName");

            string assetPath = NormalizePath(param.path);

            var asset = AssetDatabase.LoadAssetAtPath<ScriptableObject>(assetPath);
            if (asset == null)
            {
                throw new Exception($"ScriptableObject not found at: {assetPath}");
            }

            try
            {
                var serializedObject = new SerializedObject(asset);
                var property = FindPropertyByPath(serializedObject, param.fieldName);

                if (property == null)
                {
                    throw new Exception($"Field not found: {param.fieldName}");
                }

                if (!property.isArray)
                {
                    throw new Exception($"Field '{param.fieldName}' is not an array");
                }

                // Record undo
                Undo.RecordObject(asset, $"Clear {param.fieldName}");

                int previousSize = property.arraySize;
                property.ClearArray();

                serializedObject.ApplyModifiedProperties();
                EditorUtility.SetDirty(asset);
                AssetDatabase.SaveAssets();

                return new
                {
                    success = true,
                    path = assetPath,
                    fieldName = param.fieldName,
                    previousSize = previousSize,
                    newSize = 0,
                    message = $"Array '{param.fieldName}' cleared"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to clear array: {ex.Message}");
            }
            #else
            throw new Exception("Asset.ClearArray is only available in Unity Editor");
            #endif
        }

        #region Helper Methods

        private Type FindScriptableObjectType(string typeName)
        {
            // Try exact match first
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    var type = assembly.GetType(typeName);
                    if (type != null && typeof(ScriptableObject).IsAssignableFrom(type))
                    {
                        return type;
                    }
                }
                catch
                {
                    // Ignore assembly load errors
                }
            }

            // Try matching by short name
            #if UNITY_EDITOR
            var matchingTypes = TypeCache.GetTypesDerivedFrom<ScriptableObject>()
                .Where(t => t.Name == typeName || t.FullName == typeName)
                .ToList();

            if (matchingTypes.Count == 1)
            {
                return matchingTypes[0];
            }
            else if (matchingTypes.Count > 1)
            {
                // Multiple matches - try to find exact match
                var exactMatch = matchingTypes.FirstOrDefault(t => t.FullName == typeName);
                if (exactMatch != null)
                    return exactMatch;

                // Return first match with warning
                ToolkitLogger.LogWarning("AssetHandler", $"Multiple types match '{typeName}'. Using: {matchingTypes[0].FullName}");
                return matchingTypes[0];
            }
            #endif

            return null;
        }

        private void EnsureDirectoryExists(string path)
        {
            #if UNITY_EDITOR
            if (string.IsNullOrEmpty(path))
                return;

            // Convert to forward slashes
            path = path.Replace("\\", "/");

            if (AssetDatabase.IsValidFolder(path))
                return;

            // Create directories recursively
            string[] folders = path.Split('/');
            string currentPath = "";

            for (int i = 0; i < folders.Length; i++)
            {
                string folder = folders[i];
                if (string.IsNullOrEmpty(folder))
                    continue;

                string parentPath = currentPath;
                currentPath = string.IsNullOrEmpty(currentPath) ? folder : currentPath + "/" + folder;

                if (!AssetDatabase.IsValidFolder(currentPath))
                {
                    if (string.IsNullOrEmpty(parentPath))
                    {
                        // Should not happen for "Assets/..." paths
                        continue;
                    }
                    AssetDatabase.CreateFolder(parentPath, folder);
                }
            }
            #endif
        }

        private string NormalizePath(string path)
        {
            if (string.IsNullOrEmpty(path))
                return path;

            path = path.Replace("\\", "/");

            if (!path.StartsWith("Assets/"))
            {
                path = "Assets/" + path;
            }

            return path;
        }

        #if UNITY_EDITOR
        /// <summary>
        /// Find property by path, supporting array index notation (items[0], items[0].subField)
        /// </summary>
        private SerializedProperty FindPropertyByPath(SerializedObject serializedObject, string path)
        {
            // Check for array index pattern: fieldName[index] or fieldName[index].subPath
            var match = Regex.Match(path, @"^([^\[]+)\[(\d+)\](.*)$");

            if (match.Success)
            {
                string fieldName = match.Groups[1].Value;
                int index = int.Parse(match.Groups[2].Value);
                string remainingPath = match.Groups[3].Value;

                var arrayProperty = serializedObject.FindProperty(fieldName);
                if (arrayProperty == null || !arrayProperty.isArray)
                {
                    return null;
                }

                if (index < 0 || index >= arrayProperty.arraySize)
                {
                    throw new Exception($"Array index {index} out of range (0-{arrayProperty.arraySize - 1})");
                }

                var elementProperty = arrayProperty.GetArrayElementAtIndex(index);

                // If there's remaining path (e.g., ".subField"), continue traversing
                if (!string.IsNullOrEmpty(remainingPath))
                {
                    // Remove leading dot if present
                    if (remainingPath.StartsWith("."))
                    {
                        remainingPath = remainingPath.Substring(1);
                    }

                    // Recursively find the sub-property
                    return FindSubProperty(elementProperty, remainingPath);
                }

                return elementProperty;
            }

            // Standard property path
            return serializedObject.FindProperty(path);
        }

        /// <summary>
        /// Find sub-property within a property, supporting nested arrays
        /// </summary>
        private SerializedProperty FindSubProperty(SerializedProperty parent, string path)
        {
            // Check for array index pattern in sub-path
            var match = Regex.Match(path, @"^([^\[]+)\[(\d+)\](.*)$");

            if (match.Success)
            {
                string fieldName = match.Groups[1].Value;
                int index = int.Parse(match.Groups[2].Value);
                string remainingPath = match.Groups[3].Value;

                var arrayProperty = parent.FindPropertyRelative(fieldName);
                if (arrayProperty == null || !arrayProperty.isArray)
                {
                    return null;
                }

                if (index < 0 || index >= arrayProperty.arraySize)
                {
                    throw new Exception($"Array index {index} out of range (0-{arrayProperty.arraySize - 1})");
                }

                var elementProperty = arrayProperty.GetArrayElementAtIndex(index);

                if (!string.IsNullOrEmpty(remainingPath))
                {
                    if (remainingPath.StartsWith("."))
                    {
                        remainingPath = remainingPath.Substring(1);
                    }
                    return FindSubProperty(elementProperty, remainingPath);
                }

                return elementProperty;
            }

            // Check if there's a dot in the path for nested properties
            int dotIndex = path.IndexOf('.');
            if (dotIndex > 0)
            {
                string firstPart = path.Substring(0, dotIndex);
                string remainingPath = path.Substring(dotIndex + 1);

                var subProperty = parent.FindPropertyRelative(firstPart);
                if (subProperty == null)
                {
                    return null;
                }

                return FindSubProperty(subProperty, remainingPath);
            }

            return parent.FindPropertyRelative(path);
        }

        /// <summary>
        /// Create FieldInfo with optional array expansion
        /// </summary>
        private FieldInfo CreateFieldInfo(SerializedProperty property, bool expandArrays = false, int maxDepth = 3, int currentDepth = 0)
        {
            var fieldInfo = new FieldInfo
            {
                name = property.name,
                displayName = property.displayName,
                type = property.propertyType.ToString(),
                isArray = property.isArray,
                arraySize = property.isArray ? property.arraySize : 0,
                propertyPath = property.propertyPath
            };

            // Get element type for arrays
            if (property.isArray && property.arraySize > 0)
            {
                var firstElement = property.GetArrayElementAtIndex(0);
                fieldInfo.elementType = firstElement.propertyType.ToString();
            }

            // For non-array or generic type, just get the value
            if (!property.isArray || property.propertyType == SerializedPropertyType.String)
            {
                fieldInfo.value = GetPropertyValueAsString(property);
            }
            else if (expandArrays && currentDepth < maxDepth)
            {
                // Expand array elements
                var elements = new List<FieldInfo>();
                for (int i = 0; i < property.arraySize; i++)
                {
                    var element = property.GetArrayElementAtIndex(i);
                    var elementInfo = CreateFieldInfo(element, expandArrays, maxDepth, currentDepth + 1);
                    elementInfo.name = $"[{i}]";
                    elementInfo.displayName = $"Element {i}";
                    elements.Add(elementInfo);
                }
                fieldInfo.elements = elements;
                fieldInfo.value = $"[Array: {property.arraySize} elements]";
            }
            else
            {
                fieldInfo.value = $"[Array: {property.arraySize} elements]";
            }

            // Handle Generic/ManagedReference types (nested objects)
            if (property.propertyType == SerializedPropertyType.Generic && !property.isArray && expandArrays && currentDepth < maxDepth)
            {
                var children = new List<FieldInfo>();
                var childProperty = property.Copy();
                var endProperty = property.GetEndProperty();

                childProperty.NextVisible(true); // Enter children

                while (!SerializedProperty.EqualContents(childProperty, endProperty))
                {
                    var childInfo = CreateFieldInfo(childProperty, expandArrays, maxDepth, currentDepth + 1);
                    children.Add(childInfo);

                    if (!childProperty.NextVisible(false))
                        break;
                }

                if (children.Count > 0)
                {
                    fieldInfo.elements = children;
                    fieldInfo.value = $"[Object: {children.Count} fields]";
                }
            }

            return fieldInfo;
        }

        private string GetPropertyValueAsString(SerializedProperty property)
        {
            switch (property.propertyType)
            {
                case SerializedPropertyType.Integer:
                    return property.intValue.ToString();
                case SerializedPropertyType.Float:
                    return property.floatValue.ToString(CultureInfo.InvariantCulture);
                case SerializedPropertyType.String:
                    return property.stringValue ?? "";
                case SerializedPropertyType.Boolean:
                    return property.boolValue.ToString().ToLower();
                case SerializedPropertyType.Enum:
                    return property.enumNames.Length > property.enumValueIndex && property.enumValueIndex >= 0
                        ? property.enumNames[property.enumValueIndex]
                        : property.enumValueIndex.ToString();
                case SerializedPropertyType.Vector2:
                    return $"{property.vector2Value.x},{property.vector2Value.y}";
                case SerializedPropertyType.Vector3:
                    return $"{property.vector3Value.x},{property.vector3Value.y},{property.vector3Value.z}";
                case SerializedPropertyType.Vector4:
                    return $"{property.vector4Value.x},{property.vector4Value.y},{property.vector4Value.z},{property.vector4Value.w}";
                case SerializedPropertyType.Color:
                    return $"{property.colorValue.r},{property.colorValue.g},{property.colorValue.b},{property.colorValue.a}";
                case SerializedPropertyType.Rect:
                    return $"{property.rectValue.x},{property.rectValue.y},{property.rectValue.width},{property.rectValue.height}";
                case SerializedPropertyType.Bounds:
                    var bounds = property.boundsValue;
                    return $"{bounds.center.x},{bounds.center.y},{bounds.center.z},{bounds.size.x},{bounds.size.y},{bounds.size.z}";
                case SerializedPropertyType.Quaternion:
                    var quat = property.quaternionValue;
                    return $"{quat.x},{quat.y},{quat.z},{quat.w}";
                case SerializedPropertyType.Vector2Int:
                    return $"{property.vector2IntValue.x},{property.vector2IntValue.y}";
                case SerializedPropertyType.Vector3Int:
                    return $"{property.vector3IntValue.x},{property.vector3IntValue.y},{property.vector3IntValue.z}";
                case SerializedPropertyType.RectInt:
                    var rectInt = property.rectIntValue;
                    return $"{rectInt.x},{rectInt.y},{rectInt.width},{rectInt.height}";
                case SerializedPropertyType.BoundsInt:
                    var boundsInt = property.boundsIntValue;
                    return $"{boundsInt.position.x},{boundsInt.position.y},{boundsInt.position.z},{boundsInt.size.x},{boundsInt.size.y},{boundsInt.size.z}";
                case SerializedPropertyType.LayerMask:
                    return property.intValue.ToString();
                case SerializedPropertyType.Character:
                    return ((char)property.intValue).ToString();
                case SerializedPropertyType.AnimationCurve:
                    var curve = property.animationCurveValue;
                    if (curve == null || curve.keys.Length == 0)
                        return "[]";
                    var keys = curve.keys.Select(k => $"{k.time}:{k.value}").ToArray();
                    return string.Join(";", keys);
                case SerializedPropertyType.Gradient:
                    return "[Gradient]"; // Complex type, read-only display
                case SerializedPropertyType.Hash128:
                    return property.hash128Value.ToString();
                case SerializedPropertyType.ObjectReference:
                    if (property.objectReferenceValue != null)
                    {
                        string assetPath = AssetDatabase.GetAssetPath(property.objectReferenceValue);
                        return string.IsNullOrEmpty(assetPath)
                            ? $"[Scene:{property.objectReferenceValue.name}]"
                            : assetPath;
                    }
                    return "null";
                case SerializedPropertyType.ExposedReference:
                    return property.exposedReferenceValue != null
                        ? property.exposedReferenceValue.name
                        : "null";
                case SerializedPropertyType.ArraySize:
                    return property.intValue.ToString();
                default:
                    if (property.isArray)
                    {
                        return $"[Array: {property.arraySize} elements]";
                    }
                    return $"[{property.propertyType}]";
            }
        }

        private void SetPropertyValue(SerializedProperty property, object value)
        {
            string valueStr = value?.ToString() ?? "";

            switch (property.propertyType)
            {
                case SerializedPropertyType.Integer:
                    if (int.TryParse(valueStr, out int intVal))
                        property.intValue = intVal;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to integer");
                    break;

                case SerializedPropertyType.Float:
                    if (float.TryParse(valueStr, NumberStyles.Float, CultureInfo.InvariantCulture, out float floatVal))
                        property.floatValue = floatVal;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to float");
                    break;

                case SerializedPropertyType.String:
                    property.stringValue = valueStr;
                    break;

                case SerializedPropertyType.Boolean:
                    if (bool.TryParse(valueStr, out bool boolVal))
                        property.boolValue = boolVal;
                    else if (valueStr == "1" || valueStr.ToLower() == "yes")
                        property.boolValue = true;
                    else if (valueStr == "0" || valueStr.ToLower() == "no")
                        property.boolValue = false;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to boolean");
                    break;

                case SerializedPropertyType.Enum:
                    // Try by name first
                    int enumIndex = Array.IndexOf(property.enumNames, valueStr);
                    if (enumIndex >= 0)
                    {
                        property.enumValueIndex = enumIndex;
                    }
                    else if (int.TryParse(valueStr, out int enumIntVal))
                    {
                        property.enumValueIndex = enumIntVal;
                    }
                    else
                    {
                        throw new Exception($"Cannot convert '{valueStr}' to enum. Valid values: {string.Join(", ", property.enumNames)}");
                    }
                    break;

                case SerializedPropertyType.Vector2:
                    property.vector2Value = ParseVector2(valueStr);
                    break;

                case SerializedPropertyType.Vector3:
                    property.vector3Value = ParseVector3(valueStr);
                    break;

                case SerializedPropertyType.Vector4:
                    property.vector4Value = ParseVector4(valueStr);
                    break;

                case SerializedPropertyType.Color:
                    property.colorValue = ParseColor(valueStr);
                    break;

                case SerializedPropertyType.Rect:
                    property.rectValue = ParseRect(valueStr);
                    break;

                case SerializedPropertyType.Quaternion:
                    property.quaternionValue = ParseQuaternion(valueStr);
                    break;

                case SerializedPropertyType.Bounds:
                    property.boundsValue = ParseBounds(valueStr);
                    break;

                case SerializedPropertyType.Vector2Int:
                    property.vector2IntValue = ParseVector2Int(valueStr);
                    break;

                case SerializedPropertyType.Vector3Int:
                    property.vector3IntValue = ParseVector3Int(valueStr);
                    break;

                case SerializedPropertyType.RectInt:
                    property.rectIntValue = ParseRectInt(valueStr);
                    break;

                case SerializedPropertyType.BoundsInt:
                    property.boundsIntValue = ParseBoundsInt(valueStr);
                    break;

                case SerializedPropertyType.LayerMask:
                    if (int.TryParse(valueStr, out int layerMaskVal))
                        property.intValue = layerMaskVal;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to LayerMask (integer expected)");
                    break;

                case SerializedPropertyType.Character:
                    if (valueStr.Length == 1)
                        property.intValue = valueStr[0];
                    else if (int.TryParse(valueStr, out int charVal))
                        property.intValue = charVal;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to Character (single char or int expected)");
                    break;

                case SerializedPropertyType.AnimationCurve:
                    property.animationCurveValue = ParseAnimationCurve(valueStr);
                    break;

                case SerializedPropertyType.Hash128:
                    property.hash128Value = Hash128.Parse(valueStr);
                    break;

                case SerializedPropertyType.ObjectReference:
                    SetObjectReference(property, valueStr);
                    break;

                case SerializedPropertyType.ArraySize:
                    if (int.TryParse(valueStr, out int arraySize) && arraySize >= 0)
                        property.arraySize = arraySize;
                    else
                        throw new Exception($"Cannot convert '{valueStr}' to array size (non-negative integer expected)");
                    break;

                case SerializedPropertyType.Gradient:
                    throw new Exception("Gradient type is not supported for modification via CLI");

                case SerializedPropertyType.ExposedReference:
                    throw new Exception("ExposedReference type is not supported for modification via CLI");

                default:
                    throw new Exception($"Unsupported property type: {property.propertyType}");
            }
        }

        private void SetObjectReference(SerializedProperty property, string valueStr)
        {
            if (string.IsNullOrEmpty(valueStr) || valueStr.ToLower() == "null")
            {
                property.objectReferenceValue = null;
                return;
            }

            // Try to load asset by path
            var asset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(valueStr);
            if (asset != null)
            {
                property.objectReferenceValue = asset;
                return;
            }

            // Try with Assets/ prefix
            if (!valueStr.StartsWith("Assets/"))
            {
                asset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>("Assets/" + valueStr);
                if (asset != null)
                {
                    property.objectReferenceValue = asset;
                    return;
                }
            }

            throw new Exception($"Asset not found at path: {valueStr}");
        }

        private Vector2 ParseVector2(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 2)
                throw new Exception($"Invalid Vector2 format: '{value}'. Expected 'x,y'");

            return new Vector2(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture)
            );
        }

        private Vector3 ParseVector3(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 3)
                throw new Exception($"Invalid Vector3 format: '{value}'. Expected 'x,y,z'");

            return new Vector3(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture)
            );
        }

        private Vector4 ParseVector4(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4)
                throw new Exception($"Invalid Vector4 format: '{value}'. Expected 'x,y,z,w'");

            return new Vector4(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[3].Trim(), CultureInfo.InvariantCulture)
            );
        }

        private Color ParseColor(string value)
        {
            var parts = value.Split(',');
            if (parts.Length < 3 || parts.Length > 4)
                throw new Exception($"Invalid Color format: '{value}'. Expected 'r,g,b' or 'r,g,b,a'");

            return new Color(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture),
                parts.Length == 4 ? float.Parse(parts[3].Trim(), CultureInfo.InvariantCulture) : 1f
            );
        }

        private Rect ParseRect(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4)
                throw new Exception($"Invalid Rect format: '{value}'. Expected 'x,y,width,height'");

            return new Rect(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[3].Trim(), CultureInfo.InvariantCulture)
            );
        }

        private Quaternion ParseQuaternion(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4)
                throw new Exception($"Invalid Quaternion format: '{value}'. Expected 'x,y,z,w'");

            return new Quaternion(
                float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture),
                float.Parse(parts[3].Trim(), CultureInfo.InvariantCulture)
            );
        }

        private Bounds ParseBounds(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 6)
                throw new Exception($"Invalid Bounds format: '{value}'. Expected 'centerX,centerY,centerZ,sizeX,sizeY,sizeZ'");

            return new Bounds(
                new Vector3(
                    float.Parse(parts[0].Trim(), CultureInfo.InvariantCulture),
                    float.Parse(parts[1].Trim(), CultureInfo.InvariantCulture),
                    float.Parse(parts[2].Trim(), CultureInfo.InvariantCulture)
                ),
                new Vector3(
                    float.Parse(parts[3].Trim(), CultureInfo.InvariantCulture),
                    float.Parse(parts[4].Trim(), CultureInfo.InvariantCulture),
                    float.Parse(parts[5].Trim(), CultureInfo.InvariantCulture)
                )
            );
        }

        private Vector2Int ParseVector2Int(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 2)
                throw new Exception($"Invalid Vector2Int format: '{value}'. Expected 'x,y'");

            return new Vector2Int(
                int.Parse(parts[0].Trim()),
                int.Parse(parts[1].Trim())
            );
        }

        private Vector3Int ParseVector3Int(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 3)
                throw new Exception($"Invalid Vector3Int format: '{value}'. Expected 'x,y,z'");

            return new Vector3Int(
                int.Parse(parts[0].Trim()),
                int.Parse(parts[1].Trim()),
                int.Parse(parts[2].Trim())
            );
        }

        private RectInt ParseRectInt(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 4)
                throw new Exception($"Invalid RectInt format: '{value}'. Expected 'x,y,width,height'");

            return new RectInt(
                int.Parse(parts[0].Trim()),
                int.Parse(parts[1].Trim()),
                int.Parse(parts[2].Trim()),
                int.Parse(parts[3].Trim())
            );
        }

        private BoundsInt ParseBoundsInt(string value)
        {
            var parts = value.Split(',');
            if (parts.Length != 6)
                throw new Exception($"Invalid BoundsInt format: '{value}'. Expected 'posX,posY,posZ,sizeX,sizeY,sizeZ'");

            return new BoundsInt(
                new Vector3Int(
                    int.Parse(parts[0].Trim()),
                    int.Parse(parts[1].Trim()),
                    int.Parse(parts[2].Trim())
                ),
                new Vector3Int(
                    int.Parse(parts[3].Trim()),
                    int.Parse(parts[4].Trim()),
                    int.Parse(parts[5].Trim())
                )
            );
        }

        private AnimationCurve ParseAnimationCurve(string value)
        {
            if (string.IsNullOrEmpty(value) || value == "[]")
                return new AnimationCurve();

            var curve = new AnimationCurve();
            var keyStrings = value.Split(';');

            foreach (var keyStr in keyStrings)
            {
                if (string.IsNullOrWhiteSpace(keyStr))
                    continue;

                var keyParts = keyStr.Split(':');
                if (keyParts.Length != 2)
                    throw new Exception($"Invalid AnimationCurve key format: '{keyStr}'. Expected 'time:value'");

                float time = float.Parse(keyParts[0].Trim(), CultureInfo.InvariantCulture);
                float val = float.Parse(keyParts[1].Trim(), CultureInfo.InvariantCulture);

                curve.AddKey(time, val);
            }

            return curve;
        }
        #endif

        #endregion

        #region Parameter Classes

        [Serializable]
        public class FilterParams
        {
            public string filter;
        }

        [Serializable]
        public class PathParams
        {
            public string path;
        }

        [Serializable]
        public class GetFieldsParams
        {
            public string path;
            public bool expandArrays;
            public int maxDepth = 3;
        }

        [Serializable]
        public class CreateSOParams
        {
            public string typeName;
            public string path;
        }

        [Serializable]
        public class SetFieldParams
        {
            public string path;
            public string fieldName;
            public object value;
        }

        [Serializable]
        public class ArrayElementParams
        {
            public string path;
            public string fieldName;
            public int index = -1;
            public object value;
        }

        [Serializable]
        public class TypeInfo
        {
            public string fullName;
            public string name;
            public string assembly;
            public string namespaceName;
        }

        [Serializable]
        public class FieldInfo
        {
            public string name;
            public string displayName;
            public string type;
            public string value;
            public bool isArray;
            public int arraySize;
            public string propertyPath;
            public string elementType;
            public List<FieldInfo> elements;
        }

        #endregion
    }
}
