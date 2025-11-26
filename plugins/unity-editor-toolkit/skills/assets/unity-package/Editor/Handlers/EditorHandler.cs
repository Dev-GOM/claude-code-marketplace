using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Attributes;
using UnityEditorToolkit.Editor.Utils;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Editor utility commands
    /// </summary>
    public class EditorHandler : BaseHandler
    {
        public override string Category => "Editor";

        private static Dictionary<string, MethodInfo> executableMethods;
        private static bool isInitialized = false;

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Refresh":
                    return HandleRefresh(request);
                case "Recompile":
                    return HandleRecompile(request);
                case "Reimport":
                    return HandleReimport(request);
                case "GetSelection":
                    return HandleGetSelection(request);
                case "SetSelection":
                    return HandleSetSelection(request);
                case "FocusGameView":
                    return HandleFocusGameView(request);
                case "FocusSceneView":
                    return HandleFocusSceneView(request);
                case "Execute":
                    return HandleExecute(request);
                case "ListExecutable":
                    return HandleListExecutable(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleRefresh(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            try
            {
                AssetDatabase.Refresh();
                return new { success = true, message = "AssetDatabase refreshed" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to refresh AssetDatabase: {ex.Message}");
            }
            #else
            throw new Exception("Refresh is only available in Unity Editor");
            #endif
        }

        private object HandleRecompile(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            try
            {
                // Request script compilation
                AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
                UnityEditor.Compilation.CompilationPipeline.RequestScriptCompilation();
                return new { success = true, message = "Script recompilation requested" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to request recompilation: {ex.Message}");
            }
            #else
            throw new Exception("Recompile is only available in Unity Editor");
            #endif
        }

        private object HandleReimport(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ReimportParams>(request, "path");

            try
            {
                // Build Unity virtual path and physical path
                string assetPath = $"Assets/{param.path}";
                string physicalPath = System.IO.Path.Combine(Application.dataPath, param.path);

                // Validate path exists using physical path
                if (!System.IO.File.Exists(physicalPath) && !System.IO.Directory.Exists(physicalPath))
                {
                    throw new Exception($"Asset not found: {assetPath}");
                }

                // Reimport the asset using Unity virtual path
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
                return new { success = true, path = assetPath, message = "Asset reimported" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to reimport asset: {ex.Message}");
            }
            #else
            throw new Exception("Reimport is only available in Unity Editor");
            #endif
        }

        private object HandleGetSelection(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var activeObject = Selection.activeGameObject;
            var selectedObjects = Selection.gameObjects;

            if (selectedObjects == null || selectedObjects.Length == 0)
            {
                return new
                {
                    success = true,
                    count = 0,
                    activeObject = (object)null,
                    selection = new object[0]
                };
            }

            var selectionList = selectedObjects.Select(obj => new
            {
                name = obj.name,
                instanceId = obj.GetInstanceID(),
                type = obj.GetType().Name
            }).ToList();

            return new
            {
                success = true,
                count = selectedObjects.Length,
                activeObject = activeObject != null ? new
                {
                    name = activeObject.name,
                    instanceId = activeObject.GetInstanceID(),
                    type = activeObject.GetType().Name
                } : null,
                selection = selectionList
            };
            #else
            throw new Exception("GetSelection is only available in Unity Editor");
            #endif
        }

        private object HandleSetSelection(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetSelectionParams>(request, "names");

            try
            {
                var selectedObjects = new List<GameObject>();
                var selectedNames = new List<string>();

                foreach (var nameOrPath in param.names)
                {
                    GameObject obj = null;

                    // Try finding by path first (e.g., "Parent/Child/Target")
                    if (nameOrPath.Contains("/"))
                    {
                        obj = GameObject.Find(nameOrPath);
                    }

                    // Try finding by name in all scene objects
                    if (obj == null)
                    {
                        var allObjects = UnityEngine.Object.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
                        obj = allObjects.FirstOrDefault(go => go.name == nameOrPath);
                    }

                    if (obj != null)
                    {
                        selectedObjects.Add(obj);
                        selectedNames.Add(obj.name);
                    }
                }

                if (selectedObjects.Count > 0)
                {
                    Selection.objects = selectedObjects.ToArray();
                }
                else
                {
                    Selection.objects = new UnityEngine.Object[0];
                }

                return new
                {
                    success = true,
                    selectedCount = selectedObjects.Count,
                    selectedNames = selectedNames
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set selection: {ex.Message}");
            }
            #else
            throw new Exception("SetSelection is only available in Unity Editor");
            #endif
        }

        private object HandleFocusGameView(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            try
            {
                EditorApplication.ExecuteMenuItem("Window/General/Game");
                return new { success = true, message = "Game View focused" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to focus Game View: {ex.Message}");
            }
            #else
            throw new Exception("FocusGameView is only available in Unity Editor");
            #endif
        }

        private object HandleFocusSceneView(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            try
            {
                EditorApplication.ExecuteMenuItem("Window/General/Scene");
                return new { success = true, message = "Scene View focused" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to focus Scene View: {ex.Message}");
            }
            #else
            throw new Exception("FocusSceneView is only available in Unity Editor");
            #endif
        }

        #if UNITY_EDITOR
        private string GetGameObjectPath(GameObject obj)
        {
            string path = obj.name;
            Transform parent = obj.transform.parent;

            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }

            return path;
        }
        #endif

        private void InitializeExecutableMethods()
        {
            if (isInitialized)
                return;

            executableMethods = new Dictionary<string, MethodInfo>();

            try
            {
                var assemblies = AppDomain.CurrentDomain.GetAssemblies();

                foreach (var assembly in assemblies)
                {
                    try
                    {
                        var types = assembly.GetTypes();

                        foreach (var type in types)
                        {
                            var methods = type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static);

                            foreach (var method in methods)
                            {
                                var attribute = method.GetCustomAttribute<ExecutableMethodAttribute>();
                                if (attribute != null)
                                {
                                    if (!method.IsStatic)
                                    {
                                        ToolkitLogger.LogWarning("EditorHandler", $"Method {type.FullName}.{method.Name} has [ExecutableMethod] but is not static. Skipping.");
                                        continue;
                                    }

                                    if (method.ReturnType != typeof(void))
                                    {
                                        ToolkitLogger.LogWarning("EditorHandler", $"Method {type.FullName}.{method.Name} has [ExecutableMethod] but does not return void. Skipping.");
                                        continue;
                                    }

                                    if (method.GetParameters().Length > 0)
                                    {
                                        ToolkitLogger.LogWarning("EditorHandler", $"Method {type.FullName}.{method.Name} has [ExecutableMethod] but has parameters. Skipping.");
                                        continue;
                                    }

                                    if (executableMethods.ContainsKey(attribute.CommandName))
                                    {
                                        ToolkitLogger.LogWarning("EditorHandler", $"Duplicate command name '{attribute.CommandName}'. Method {type.FullName}.{method.Name} will override previous registration.");
                                    }

                                    executableMethods[attribute.CommandName] = method;
                                    ToolkitLogger.LogDebug("EditorHandler", $"Registered executable method: '{attribute.CommandName}' -> {type.FullName}.{method.Name}");
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        ToolkitLogger.LogWarning("EditorHandler", $"Failed to scan assembly {assembly.FullName}: {ex.Message}");
                    }
                }

                ToolkitLogger.LogDebug("EditorHandler", $"Initialized with {executableMethods.Count} executable methods");
                isInitialized = true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("EditorHandler", $"Failed to initialize executable methods: {ex.Message}");
                executableMethods = new Dictionary<string, MethodInfo>();
                isInitialized = true;
            }
        }

        private object HandleExecute(JsonRpcRequest request)
        {
            InitializeExecutableMethods();

            var param = ValidateParam<ExecuteParams>(request, "commandName");

            if (string.IsNullOrWhiteSpace(param.commandName))
            {
                throw new Exception("Command name is required");
            }

            if (!executableMethods.TryGetValue(param.commandName, out var methodInfo))
            {
                throw new Exception($"Unknown command: '{param.commandName}'. Use Editor.ListExecutable to see available commands.");
            }

            try
            {
                ToolkitLogger.Log("EditorHandler", $"Executing command: '{param.commandName}'");
                methodInfo.Invoke(null, null);

                return new
                {
                    success = true,
                    commandName = param.commandName,
                    message = $"Command '{param.commandName}' executed successfully"
                };
            }
            catch (TargetInvocationException ex)
            {
                var innerException = ex.InnerException ?? ex;
                ToolkitLogger.LogError("EditorHandler", $"Failed to execute '{param.commandName}': {innerException.Message}\n{innerException.StackTrace}");
                throw new Exception($"Failed to execute '{param.commandName}': {innerException.Message}");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("EditorHandler", $"Failed to execute '{param.commandName}': {ex.Message}\n{ex.StackTrace}");
                throw new Exception($"Failed to execute '{param.commandName}': {ex.Message}");
            }
        }

        private object HandleListExecutable(JsonRpcRequest request)
        {
            InitializeExecutableMethods();

            var methods = executableMethods.Select(kvp =>
            {
                var methodInfo = kvp.Value;
                var attribute = methodInfo.GetCustomAttribute<ExecutableMethodAttribute>();

                return new
                {
                    commandName = kvp.Key,
                    description = attribute?.Description ?? "",
                    className = methodInfo.DeclaringType?.FullName ?? "Unknown",
                    methodName = methodInfo.Name
                };
            }).OrderBy(m => m.commandName).ToList();

            return new
            {
                success = true,
                count = methods.Count,
                methods = methods
            };
        }

        // Parameter classes
        [Serializable]
        public class ReimportParams
        {
            public string path;
        }

        [Serializable]
        public class SetSelectionParams
        {
            public string[] names;
        }

        [Serializable]
        public class ExecuteParams
        {
            public string commandName;
        }
    }
}
