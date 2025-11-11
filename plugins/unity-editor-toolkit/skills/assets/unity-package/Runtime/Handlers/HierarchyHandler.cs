using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Protocol;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Hierarchy commands
    /// </summary>
    public class HierarchyHandler : BaseHandler
    {
        public override string Category => "Hierarchy";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Get":
                    return HandleGet(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleGet(JsonRpcRequest request)
        {
            var param = request.GetParams<GetParams>() ?? new GetParams();

            var rootObjects = new List<GameObjectInfo>();
            var scene = SceneManager.GetActiveScene();

            if (!scene.IsValid())
            {
                return rootObjects;
            }

            foreach (var rootGO in scene.GetRootGameObjects())
            {
                // Skip inactive if requested
                if (!param.includeInactive && !rootGO.activeSelf)
                    continue;

                var info = BuildGameObjectInfo(rootGO, !param.rootOnly, param.includeInactive);
                rootObjects.Add(info);
            }

            return rootObjects;
        }

        private GameObjectInfo BuildGameObjectInfo(GameObject obj, bool includeChildren, bool includeInactive)
        {
            var info = new GameObjectInfo
            {
                name = obj.name,
                instanceId = obj.GetInstanceID(),
                path = GetGameObjectPath(obj),
                active = obj.activeSelf,
                tag = obj.tag,
                layer = obj.layer
            };

            if (includeChildren && obj.transform.childCount > 0)
            {
                info.children = new List<GameObjectInfo>();
                for (int i = 0; i < obj.transform.childCount; i++)
                {
                    var child = obj.transform.GetChild(i).gameObject;

                    // Skip inactive if requested
                    if (!includeInactive && !child.activeSelf)
                        continue;

                    var childInfo = BuildGameObjectInfo(child, true, includeInactive);
                    info.children.Add(childInfo);
                }
            }

            return info;
        }

        // Parameter classes
        [Serializable]
        public class GetParams
        {
            public bool rootOnly = false;
            public bool includeInactive = false;
        }

        [Serializable]
        public class GameObjectInfo
        {
            public string name;
            public int instanceId;
            public string path;
            public bool active;
            public string tag;
            public int layer;
            public List<GameObjectInfo> children;
        }
    }
}
