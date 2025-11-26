using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Database.Commands;
using Cysharp.Threading.Tasks;
using UnityEditorToolkit.Editor.Utils;

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
                case "SetParent":
                    return HandleSetParent(request);
                case "GetParent":
                    return HandleGetParent(request);
                case "GetChildren":
                    return HandleGetChildren(request);
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

            // Record Command for history (without re-executing creation)
            RecordCreateCommandAsync(obj, parentObj).Forget();

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
        /// Record CreateGameObjectCommand for history (without re-executing)
        /// </summary>
        private async UniTaskVoid RecordCreateCommandAsync(GameObject obj, GameObject parent)
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

                // Create command with already created GameObject reference
                var command = CreateGameObjectCommand.CreateFromExisting(obj, parent);

                // Add to history without executing (already created)
                await DatabaseManager.Instance.CommandHistory.RecordCommandAsync(command);
                #endif
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("GameObjectHandler", $"Command recording failed: {ex.Message}");
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
                ToolkitLogger.LogWarning("GameObjectHandler", $"Command execution failed: {ex.Message}");
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

        /// <summary>
        /// Set or remove parent of GameObject
        /// </summary>
        private object HandleSetParent(JsonRpcRequest request)
        {
            var param = ValidateParam<SetParentParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            #if UNITY_EDITOR
            UnityEditor.Undo.SetTransformParent(obj.transform, null, "Set Parent");
            #endif

            // parent가 null이거나 빈 문자열이면 부모 제거
            if (string.IsNullOrEmpty(param.parent))
            {
                obj.transform.SetParent(null, param.worldPositionStays);
                return new SetParentResult
                {
                    success = true,
                    name = obj.name,
                    parent = null,
                    path = GetGameObjectPath(obj)
                };
            }

            // 새 부모 찾기
            var newParent = FindGameObject(param.parent);
            if (newParent == null)
            {
                throw new Exception($"Parent GameObject not found: {param.parent}");
            }

            // 순환 참조 체크
            if (IsDescendantOf(newParent.transform, obj.transform))
            {
                throw new Exception($"Cannot set parent: {param.parent} is a descendant of {param.name}");
            }

            #if UNITY_EDITOR
            UnityEditor.Undo.SetTransformParent(obj.transform, newParent.transform, "Set Parent");
            #endif

            obj.transform.SetParent(newParent.transform, param.worldPositionStays);

            return new SetParentResult
            {
                success = true,
                name = obj.name,
                parent = newParent.name,
                path = GetGameObjectPath(obj)
            };
        }

        /// <summary>
        /// Get parent information of GameObject
        /// </summary>
        private object HandleGetParent(JsonRpcRequest request)
        {
            var param = ValidateParam<FindParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            var parent = obj.transform.parent;
            if (parent == null)
            {
                return new ParentInfo
                {
                    hasParent = false,
                    parent = null
                };
            }

            return new ParentInfo
            {
                hasParent = true,
                parent = new GameObjectInfo
                {
                    name = parent.gameObject.name,
                    instanceId = parent.gameObject.GetInstanceID(),
                    path = GetGameObjectPath(parent.gameObject),
                    active = parent.gameObject.activeSelf,
                    tag = parent.gameObject.tag,
                    layer = parent.gameObject.layer
                }
            };
        }

        /// <summary>
        /// Get children of GameObject
        /// </summary>
        private object HandleGetChildren(JsonRpcRequest request)
        {
            var param = ValidateParam<GetChildrenParams>(request, "name");
            var obj = FindGameObject(param.name);

            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            var children = new List<GameObjectInfo>();
            var transform = obj.transform;

            // recursive 옵션에 따라 직접 자식만 또는 모든 자손 반환
            if (param.recursive)
            {
                GetAllDescendants(transform, children);
            }
            else
            {
                for (int i = 0; i < transform.childCount; i++)
                {
                    var child = transform.GetChild(i).gameObject;
                    children.Add(new GameObjectInfo
                    {
                        name = child.name,
                        instanceId = child.GetInstanceID(),
                        path = GetGameObjectPath(child),
                        active = child.activeSelf,
                        tag = child.tag,
                        layer = child.layer
                    });
                }
            }

            return new ChildrenInfo
            {
                count = children.Count,
                children = children
            };
        }

        /// <summary>
        /// 재귀적으로 모든 자손 가져오기
        /// </summary>
        private void GetAllDescendants(Transform parent, List<GameObjectInfo> list)
        {
            for (int i = 0; i < parent.childCount; i++)
            {
                var child = parent.GetChild(i).gameObject;
                list.Add(new GameObjectInfo
                {
                    name = child.name,
                    instanceId = child.GetInstanceID(),
                    path = GetGameObjectPath(child),
                    active = child.activeSelf,
                    tag = child.tag,
                    layer = child.layer
                });

                // 재귀 호출
                GetAllDescendants(child.transform, list);
            }
        }

        /// <summary>
        /// target이 parent의 자손인지 확인 (순환 참조 방지)
        /// </summary>
        private bool IsDescendantOf(Transform target, Transform parent)
        {
            var current = target;
            while (current != null)
            {
                if (current == parent)
                    return true;
                current = current.parent;
            }
            return false;
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

        [Serializable]
        private class SetParentParams
        {
            public string name;
            public string parent; // null 또는 빈 문자열이면 부모 제거
            public bool worldPositionStays = true; // 월드 좌표 유지 여부
        }

        [Serializable]
        private class GetChildrenParams
        {
            public string name;
            public bool recursive = false; // true면 모든 자손, false면 직접 자식만
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

        [Serializable]
        public class SetParentResult
        {
            public bool success;
            public string name;
            public string parent;
            public string path;
        }

        [Serializable]
        public class ParentInfo
        {
            public bool hasParent;
            public GameObjectInfo parent;
        }

        [Serializable]
        public class ChildrenInfo
        {
            public int count;
            public List<GameObjectInfo> children;
        }
    }
}
