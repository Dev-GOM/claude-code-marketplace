using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Attributes;

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
            var selection = Selection.activeGameObject;
            if (selection == null)
            {
                return new { selected = false };
            }

            return new
            {
                selected = true,
                name = selection.name,
                instanceId = selection.GetInstanceID(),
                path = GetGameObjectPath(selection)
            };
            #else
            throw new Exception("GetSelection is only available in Unity Editor");
            #endif
        }

        private object HandleSetSelection(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SelectionParams>(request, "instanceId");

            try
            {
                var obj = EditorUtility.InstanceIDToObject(param.instanceId) as GameObject;
                if (obj == null)
                {
                    throw new Exception($"GameObject with instanceId {param.instanceId} not found");
                }

                Selection.activeGameObject = obj;
                return new { success = true, name = obj.name };
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
                                        Debug.LogWarning($"[EditorHandler] Method {type.FullName}.{method.Name} has [ExecutableMethod] but is not static. Skipping.");
                                        continue;
                                    }

                                    if (method.ReturnType != typeof(void))
                                    {
                                        Debug.LogWarning($"[EditorHandler] Method {type.FullName}.{method.Name} has [ExecutableMethod] but does not return void. Skipping.");
                                        continue;
                                    }

                                    if (method.GetParameters().Length > 0)
                                    {
                                        Debug.LogWarning($"[EditorHandler] Method {type.FullName}.{method.Name} has [ExecutableMethod] but has parameters. Skipping.");
                                        continue;
                                    }

                                    if (executableMethods.ContainsKey(attribute.CommandName))
                                    {
                                        Debug.LogWarning($"[EditorHandler] Duplicate command name '{attribute.CommandName}'. Method {type.FullName}.{method.Name} will override previous registration.");
                                    }

                                    executableMethods[attribute.CommandName] = method;
                                    Debug.Log($"[EditorHandler] Registered executable method: '{attribute.CommandName}' -> {type.FullName}.{method.Name}");
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.LogWarning($"[EditorHandler] Failed to scan assembly {assembly.FullName}: {ex.Message}");
                    }
                }

                Debug.Log($"[EditorHandler] Initialized with {executableMethods.Count} executable methods");
                isInitialized = true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[EditorHandler] Failed to initialize executable methods: {ex.Message}");
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
                Debug.Log($"[EditorHandler] Executing command: '{param.commandName}'");
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
                Debug.LogError($"[EditorHandler] Failed to execute '{param.commandName}': {innerException.Message}\n{innerException.StackTrace}");
                throw new Exception($"Failed to execute '{param.commandName}': {innerException.Message}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[EditorHandler] Failed to execute '{param.commandName}': {ex.Message}\n{ex.StackTrace}");
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
        public class SelectionParams
        {
            public int instanceId;
        }

        [Serializable]
        public class ExecuteParams
        {
            public string commandName;
        }
    }
}
