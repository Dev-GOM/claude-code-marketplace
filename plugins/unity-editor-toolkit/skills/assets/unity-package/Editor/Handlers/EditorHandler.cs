using System;
using UnityEngine;
using UnityEditorToolkit.Protocol;

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
                // Validate path exists
                string fullPath = $"Assets/{param.path}";
                if (!System.IO.File.Exists(fullPath) && !System.IO.Directory.Exists(fullPath))
                {
                    throw new Exception($"Asset not found: {fullPath}");
                }

                // Reimport the asset
                AssetDatabase.ImportAsset(fullPath, ImportAssetOptions.ForceUpdate);
                return new { success = true, path = fullPath, message = "Asset reimported" };
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
    }
}
