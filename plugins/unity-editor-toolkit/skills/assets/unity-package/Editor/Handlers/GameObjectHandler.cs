using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEditorToolkit.Protocol;

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

            GameObject obj = new GameObject(param.name);

            // Set parent if specified
            if (!string.IsNullOrEmpty(param.parent))
            {
                var parentObj = FindGameObject(param.parent);
                if (parentObj == null)
                {
                    GameObject.DestroyImmediate(obj);
                    throw new Exception($"Parent GameObject not found: {param.parent}");
                }
                obj.transform.SetParent(parentObj.transform);
            }

            // Register undo
            #if UNITY_EDITOR
            UnityEditor.Undo.RegisterCreatedObjectUndo(obj, "Create GameObject");
            #endif

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

            #if UNITY_EDITOR
            UnityEditor.Undo.DestroyObjectImmediate(obj);
            #else
            GameObject.DestroyImmediate(obj);
            #endif

            return new { success = true };
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
