using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Scene commands
    /// </summary>
    public class SceneHandler : BaseHandler
    {
        public override string Category => "Scene";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetCurrent":
                    return HandleGetCurrent(request);
                case "GetAll":
                    return HandleGetAll(request);
                case "Load":
                    return HandleLoad(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleGetCurrent(JsonRpcRequest request)
        {
            var scene = SceneManager.GetActiveScene();
            return GetSceneInfo(scene);
        }

        private object HandleGetAll(JsonRpcRequest request)
        {
            var scenes = new List<SceneInfo>();
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                var scene = SceneManager.GetSceneAt(i);
                scenes.Add(GetSceneInfo(scene));
            }
            return scenes;
        }

        private object HandleLoad(JsonRpcRequest request)
        {
            var param = ValidateParam<LoadParams>(request, "name");

            #if UNITY_EDITOR
            // Editor mode: Use EditorSceneManager for proper undo/redo
            try
            {
                var mode = param.additive ? OpenSceneMode.Additive : OpenSceneMode.Single;
                EditorSceneManager.OpenScene(param.name, mode);
                return new { success = true };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to load scene: {ex.Message}");
            }
            #else
            // Runtime mode: Use SceneManager
            try
            {
                var mode = param.additive ? LoadSceneMode.Additive : LoadSceneMode.Single;
                SceneManager.LoadScene(param.name, mode);
                return new { success = true };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to load scene: {ex.Message}");
            }
            #endif
        }

        private SceneInfo GetSceneInfo(Scene scene)
        {
            return new SceneInfo
            {
                name = scene.name,
                path = scene.path,
                buildIndex = scene.buildIndex,
                isLoaded = scene.isLoaded,
                isDirty = scene.isDirty,
                rootCount = scene.rootCount
            };
        }

        // Parameter classes
        [Serializable]
        public class LoadParams
        {
            public string name;
            public bool additive;
        }

        [Serializable]
        public class SceneInfo
        {
            public string name;
            public string path;
            public int buildIndex;
            public bool isLoaded;
            public bool isDirty;
            public int rootCount;
        }
    }
}
