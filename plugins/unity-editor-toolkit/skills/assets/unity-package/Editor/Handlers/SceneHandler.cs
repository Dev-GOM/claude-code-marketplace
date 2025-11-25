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
                case "New":
                    return HandleNew(request);
                case "Save":
                    return HandleSave(request);
                case "Unload":
                    return HandleUnload(request);
                case "SetActive":
                    return HandleSetActive(request);
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

        private object HandleNew(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<NewSceneParams>() ?? new NewSceneParams();

            try
            {
                var setup = param.empty ? NewSceneSetup.EmptyScene : NewSceneSetup.DefaultGameObjects;
                var mode = param.additive ? NewSceneMode.Additive : NewSceneMode.Single;

                var scene = EditorSceneManager.NewScene(setup, mode);

                return new
                {
                    success = true,
                    scene = GetSceneInfo(scene)
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to create new scene: {ex.Message}");
            }
            #else
            throw new Exception("New scene is only available in Editor mode");
            #endif
        }

        private object HandleSave(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<SaveSceneParams>() ?? new SaveSceneParams();

            try
            {
                Scene scene;

                // 특정 씬 이름이 지정된 경우 해당 씬 찾기
                if (!string.IsNullOrEmpty(param.sceneName))
                {
                    scene = SceneManager.GetSceneByName(param.sceneName);
                    if (!scene.IsValid())
                    {
                        scene = SceneManager.GetSceneByPath(param.sceneName);
                    }
                    if (!scene.IsValid())
                    {
                        throw new Exception($"Scene not found: {param.sceneName}");
                    }
                }
                else
                {
                    scene = SceneManager.GetActiveScene();
                }

                bool saved;

                // 새 경로로 저장 (Save As)
                if (!string.IsNullOrEmpty(param.path))
                {
                    saved = EditorSceneManager.SaveScene(scene, param.path);
                }
                else
                {
                    saved = EditorSceneManager.SaveScene(scene);
                }

                return new
                {
                    success = saved,
                    scene = GetSceneInfo(scene)
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save scene: {ex.Message}");
            }
            #else
            throw new Exception("Save scene is only available in Editor mode");
            #endif
        }

        private object HandleUnload(JsonRpcRequest request)
        {
            var param = ValidateParam<UnloadSceneParams>(request, "name");

            #if UNITY_EDITOR
            try
            {
                Scene scene = SceneManager.GetSceneByName(param.name);
                if (!scene.IsValid())
                {
                    scene = SceneManager.GetSceneByPath(param.name);
                }

                if (!scene.IsValid())
                {
                    throw new Exception($"Scene not found: {param.name}");
                }

                // 마지막 씬은 언로드 불가
                if (SceneManager.sceneCount <= 1)
                {
                    throw new Exception("Cannot unload the last scene");
                }

                bool closed = EditorSceneManager.CloseScene(scene, param.removeScene);

                return new { success = closed };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to unload scene: {ex.Message}");
            }
            #else
            try
            {
                SceneManager.UnloadSceneAsync(param.name);
                return new { success = true };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to unload scene: {ex.Message}");
            }
            #endif
        }

        private object HandleSetActive(JsonRpcRequest request)
        {
            var param = ValidateParam<SetActiveParams>(request, "name");

            try
            {
                Scene scene = SceneManager.GetSceneByName(param.name);
                if (!scene.IsValid())
                {
                    scene = SceneManager.GetSceneByPath(param.name);
                }

                if (!scene.IsValid())
                {
                    throw new Exception($"Scene not found: {param.name}");
                }

                if (!scene.isLoaded)
                {
                    throw new Exception($"Scene is not loaded: {param.name}");
                }

                bool success = SceneManager.SetActiveScene(scene);

                return new
                {
                    success = success,
                    scene = GetSceneInfo(scene)
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set active scene: {ex.Message}");
            }
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
        public class NewSceneParams
        {
            public bool empty;      // true: 빈 씬, false: 기본 오브젝트 포함
            public bool additive;   // true: 추가 모드, false: 기존 씬 대체
        }

        [Serializable]
        public class SaveSceneParams
        {
            public string sceneName;  // 저장할 씬 이름 (없으면 활성 씬)
            public string path;       // 저장 경로 (없으면 현재 경로에 저장)
        }

        [Serializable]
        public class UnloadSceneParams
        {
            public string name;
            public bool removeScene;  // true: 씬 완전 제거, false: 언로드만
        }

        [Serializable]
        public class SetActiveParams
        {
            public string name;
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
