using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Database.Commands;
using Cysharp.Threading.Tasks;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for GameObject commands
    /// </summary>
    public class GameObjectHandler : BaseHandler
    {
        public override string Category => "GameObject";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Find":
                    return HandleFind(request);
                case "Create":
                    return HandleCreate(request);
                case "Destroy":
                    return HandleDestroy(request);
                case "SetActive":
                    return HandleSetActive(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Find GameObject by name or path
        /// </summary>
        private object HandleFind(JsonRpcRequest request)
        {
            var param = ValidateParam<FindParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            return new GameObjectInfo
            {
                name = obj.name,
                instanceId = obj.GetInstanceID(),
                path = GetGameObjectPath(obj),
                active = obj.activeSelf,
                tag = obj.tag,
                layer = obj.layer
            };
        }

        /// <summary>
        /// Create new GameObject
        /// </summary>
        private object HandleCreate(JsonRpcRequest request)
        {
            var param = ValidateParam<CreateParams>(request, "name");

            // Find parent GameObject if specified
            GameObject parentObj = null;
            if (!string.IsNullOrEmpty(param.parent))
            {
                parentObj = FindGameObject(param.parent);
                if (parentObj == null)
                {
                    throw new Exception($"Parent GameObject not found: {param.parent}");
                }
            }

            GameObject obj = new GameObject(param.name);

            // Set parent if specified
            if (parentObj != null)
            {
                obj.transform.SetParent(parentObj.transform);
            }

            // Register undo
            #if UNITY_EDITOR
            UnityEditor.Undo.RegisterCreatedObjectUndo(obj, "Create GameObject");
            #endif

            // Execute Command Pattern (if database is connected)
            ExecuteCreateCommandAsync(obj, parentObj).Forget();

            return new GameObjectInfo
            {
                name = obj.name,
                instanceId = obj.GetInstanceID(),
                path = GetGameObjectPath(obj),
                active = obj.activeSelf,
                tag = obj.tag,
                layer = obj.layer
            };
        }

        /// <summary>
        /// Execute CreateGameObjectCommand asynchronously (database persistence)
        /// </summary>
        private async UniTaskVoid ExecuteCreateCommandAsync(GameObject obj, GameObject parent)
        {
            try
            {
                #if UNITY_EDITOR
                // Check if database is connected
                if (DatabaseManager.Instance == null ||
                    !DatabaseManager.Instance.IsConnected ||
                    DatabaseManager.Instance.CommandHistory == null)
                {
                    return;
                }

                // Create command
                var command = new CreateGameObjectCommand(
                    obj.name,
                    obj.transform.position,
                    obj.transform.rotation,
                    parent
                );

                // Execute through CommandHistory (async, database persistence)
                await DatabaseManager.Instance.CommandHistory.ExecuteCommandAsync(command);
                #endif
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[GameObjectHandler] Command execution failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Destroy GameObject
        /// </summary>
        private object HandleDestroy(JsonRpcRequest request)
        {
            var param = ValidateParam<FindParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Execute Command Pattern before actual destruction (database persistence)
            ExecuteDeleteCommandAsync(obj).Forget();

            #if UNITY_EDITOR
            UnityEditor.Undo.DestroyObjectImmediate(obj);
            #else
            GameObject.DestroyImmediate(obj);
            #endif

            return new { success = true };
        }

        /// <summary>
        /// Execute DeleteGameObjectCommand asynchronously (database persistence)
        /// </summary>
        private async UniTaskVoid ExecuteDeleteCommandAsync(GameObject obj)
        {
            try
            {
                #if UNITY_EDITOR
                // Check if database is connected
                if (DatabaseManager.Instance == null ||
                    !DatabaseManager.Instance.IsConnected ||
                    DatabaseManager.Instance.CommandHistory == null)
                {
                    return;
                }

                // Create command
                var command = new DeleteGameObjectCommand(obj);

                // Execute through CommandHistory (async, database persistence)
                // Note: DeleteGameObjectCommand.CanPersist = false (GameObject reference)
                // So it will be added to Undo stack but not persisted to database
                await DatabaseManager.Instance.CommandHistory.ExecuteCommandAsync(command);
                #endif
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[GameObjectHandler] Command execution failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Set GameObject active state
        /// </summary>
        private object HandleSetActive(JsonRpcRequest request)
        {
            var param = ValidateParam<SetActiveParams>(request, "name and active");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            #if UNITY_EDITOR
            // ✅ RegisterCompleteObjectUndo 사용 (GameObject 전체 상태 기록)
            UnityEditor.Undo.RegisterCompleteObjectUndo(obj, "Set Active");
            #endif

            obj.SetActive(param.active);

            return new { success = true, active = obj.activeSelf };
        }

        // Parameter classes (✅ private으로 변경)
        [Serializable]
        private class FindParams
        {
            public string name;
        }

        [Serializable]
        private class CreateParams
        {
            public string name;
            public string parent;
        }

        [Serializable]
        private class SetActiveParams
        {
            public string name;
            public bool active;
        }

        // Response classes
        [Serializable]
        public class GameObjectInfo
        {
            public string name;
            public int instanceId;
            public string path;
            public bool active;
            public string tag;
            public int layer;
        }
    }
}
