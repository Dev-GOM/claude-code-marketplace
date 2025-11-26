using System;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Utils;

#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Wait commands
    /// Supports waiting for compilation, play mode changes, scene loads, and sleep
    /// </summary>
    public class WaitHandler : BaseHandler
    {
        public override string Category => "Wait";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Wait":
                    return HandleWait(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleWait(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<WaitParams>(request, "type");

            if (string.IsNullOrWhiteSpace(param.type))
            {
                throw new Exception("Wait type is required");
            }

            // Get send callback from request context
            var sendCallback = request.GetContext<Action<string>>("sendCallback");
            if (sendCallback == null)
            {
                throw new Exception("Send callback not found in request context");
            }

            double timeout = param.timeout > 0 ? param.timeout : 300.0;

            // Convert request ID to string for ResponseQueue
            string requestId = request.Id?.ToString() ?? string.Empty;

            switch (param.type.ToLower())
            {
                case "compile":
                    return HandleWaitCompile(requestId, sendCallback, timeout);

                case "playmode":
                    return HandleWaitPlayMode(requestId, sendCallback, param.value, timeout);

                case "sleep":
                    return HandleWaitSleep(requestId, sendCallback, param.seconds, timeout);

                case "scene":
                    return HandleWaitScene(requestId, sendCallback, timeout);

                default:
                    throw new Exception($"Unknown wait type: {param.type}. Supported types: compile, playmode, sleep, scene");
            }
            #else
            throw new Exception("Wait is only available in Unity Editor");
            #endif
        }

        #if UNITY_EDITOR
        private object HandleWaitCompile(string requestId, Action<string> sendCallback, double timeout)
        {
            ToolkitLogger.Log("WaitHandler", "Waiting for compilation to complete...");

            ResponseQueue.Instance.Register(
                requestId,
                condition: () => !EditorApplication.isCompiling,
                resultProvider: () => new
                {
                    success = true,
                    type = "compile",
                    message = "Compilation completed"
                },
                sendCallback,
                timeout
            );

            // Return null to indicate delayed response
            return null;
        }

        private object HandleWaitPlayMode(string requestId, Action<string> sendCallback, string targetState, double timeout)
        {
            if (string.IsNullOrWhiteSpace(targetState))
            {
                throw new Exception("PlayMode target state is required (enter, exit, or pause)");
            }

            bool targetIsPlaying;
            bool targetIsPaused = false;
            string stateDescription;

            switch (targetState.ToLower())
            {
                case "enter":
                    targetIsPlaying = true;
                    stateDescription = "entered play mode";
                    break;
                case "exit":
                    targetIsPlaying = false;
                    stateDescription = "exited play mode";
                    break;
                case "pause":
                    targetIsPlaying = true;
                    targetIsPaused = true;
                    stateDescription = "paused play mode";
                    break;
                default:
                    throw new Exception($"Invalid playmode state: {targetState}. Use 'enter', 'exit', or 'pause'");
            }

            ToolkitLogger.Log("WaitHandler", $"Waiting for play mode to {stateDescription}...");

            ResponseQueue.Instance.Register(
                requestId,
                condition: () =>
                {
                    if (targetIsPaused)
                    {
                        return EditorApplication.isPlaying && EditorApplication.isPaused;
                    }
                    return EditorApplication.isPlaying == targetIsPlaying;
                },
                resultProvider: () => new
                {
                    success = true,
                    type = "playmode",
                    state = targetState,
                    message = $"Play mode {stateDescription}"
                },
                sendCallback,
                timeout
            );

            return null;
        }

        private object HandleWaitSleep(string requestId, Action<string> sendCallback, double seconds, double timeout)
        {
            if (seconds <= 0)
            {
                throw new Exception("Sleep duration must be greater than 0");
            }

            if (seconds > timeout)
            {
                throw new Exception($"Sleep duration ({seconds}s) exceeds timeout ({timeout}s)");
            }

            ToolkitLogger.Log("WaitHandler", $"Sleeping for {seconds} seconds...");

            double wakeTime = EditorApplication.timeSinceStartup + seconds;

            ResponseQueue.Instance.Register(
                requestId,
                condition: () => EditorApplication.timeSinceStartup >= wakeTime,
                resultProvider: () => new
                {
                    success = true,
                    type = "sleep",
                    seconds = seconds,
                    message = $"Slept for {seconds} seconds"
                },
                sendCallback,
                timeout
            );

            return null;
        }

        private object HandleWaitScene(string requestId, Action<string> sendCallback, double timeout)
        {
            ToolkitLogger.Log("WaitHandler", "Waiting for scene to finish loading...");

            // Check if in play mode
            if (!EditorApplication.isPlaying)
            {
                throw new Exception("Scene loading wait is only available in play mode");
            }

            // Record initial state
            var initialSceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
            var initialSceneCount = UnityEngine.SceneManagement.SceneManager.sceneCount;
            var startTime = EditorApplication.timeSinceStartup;

            ToolkitLogger.LogDebug("WaitHandler", $"Initial scene: {initialSceneName}, scene count: {initialSceneCount}");

            ResponseQueue.Instance.Register(
                requestId,
                condition: () =>
                {
                    // Wait conditions:
                    // 1. Not compiling (compilation would reload domain)
                    // 2. Not paused (scene is actively running)
                    // 3. At least 0.1 seconds elapsed (give scene time to initialize)
                    // 4. Scene is loaded (isLoaded = true)

                    if (EditorApplication.isCompiling)
                        return false;

                    if (EditorApplication.isPaused)
                        return false;

                    // Minimum delay to ensure scene has initialized
                    double elapsed = EditorApplication.timeSinceStartup - startTime;
                    if (elapsed < 0.1)
                        return false;

                    // Check if active scene is loaded
                    var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                    if (!activeScene.isLoaded)
                        return false;

                    return true;
                },
                resultProvider: () =>
                {
                    var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                    return new
                    {
                        success = true,
                        type = "scene",
                        sceneName = currentScene.name,
                        sceneCount = UnityEngine.SceneManagement.SceneManager.sceneCount,
                        message = "Scene loading completed"
                    };
                },
                sendCallback,
                timeout
            );

            return null;
        }
        #endif

        // Parameter classes
        [Serializable]
        public class WaitParams
        {
            public string type;           // compile, playmode, sleep, scene
            public string value;          // for playmode: enter, exit, pause
            public double seconds;        // for sleep: duration in seconds
            public double timeout = 300;  // default 300 seconds
        }
    }
}
