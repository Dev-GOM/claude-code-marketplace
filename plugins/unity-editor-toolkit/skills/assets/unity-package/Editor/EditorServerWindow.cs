using UnityEngine;
using UnityEditor;
using UnityEditorToolkit.Server;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Editor window for Unity Editor Toolkit Server
    /// </summary>
    public class EditorServerWindow : EditorWindow
    {
        private UnityEditorServer server;
        private Vector2 scrollPosition;
        private bool wasPlaying = false;
        private float lastUpdateTime = 0f;

        [MenuItem("Window/Unity Editor Toolkit/Server Control")]
        public static void ShowWindow()
        {
            var window = GetWindow<EditorServerWindow>("Editor Server");
            window.minSize = new Vector2(400, 300);
            window.Show();
        }

        private void OnEnable()
        {
            FindOrCreateServer();
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(10);

            // Header
            GUILayout.Label("Unity Editor Toolkit Server", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            // Server status
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            {
                if (server == null)
                {
                    EditorGUILayout.LabelField("Status:", "Not Found");
                    EditorGUILayout.HelpBox("Server component not found in scene. Click 'Create Server' to add one.", MessageType.Warning);

                    if (GUILayout.Button("Create Server GameObject", GUILayout.Height(30)))
                    {
                        CreateServer();
                    }
                }
                else
                {
                    // Server can run in both Edit Mode and Play Mode
                    var isRunning = server != null;
                    EditorGUILayout.LabelField("Status:", isRunning ? "Running ✓" : "Stopped");
                    EditorGUILayout.LabelField("Port:", server.port.ToString());
                    EditorGUILayout.LabelField("WebSocket URL:", $"ws://127.0.0.1:{server.port}");
                    EditorGUILayout.LabelField("Mode:", Application.isPlaying ? "Play Mode" : "Edit Mode");
                }
            }
            EditorGUILayout.EndVertical();

            EditorGUILayout.Space(10);

            // Server controls
            if (server != null)
            {
                EditorGUILayout.BeginVertical(EditorStyles.helpBox);
                {
                    GUILayout.Label("Controls", EditorStyles.boldLabel);

                    // Port settings (only editable when server is stopped)
                    EditorGUI.BeginDisabledGroup(server != null);
                    server.port = EditorGUILayout.IntField("Port:", server.port);
                    server.autoStart = EditorGUILayout.Toggle("Auto-Start:", server.autoStart);
                    EditorGUI.EndDisabledGroup();

                    EditorGUILayout.Space(5);

                    // Server works in both Edit Mode and Play Mode
                    EditorGUILayout.HelpBox(
                        "Server works in both Edit Mode and Play Mode.\n" +
                        "Auto-Start is enabled when this GameObject is loaded.",
                        MessageType.Info
                    );
                }
                EditorGUILayout.EndVertical();
            }

            EditorGUILayout.Space(10);

            // Information section
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            {
                GUILayout.Label("Information", EditorStyles.boldLabel);
                EditorGUILayout.Space(5);

                scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);
                {
                    EditorGUILayout.HelpBox(
                        "Unity Editor Toolkit provides a WebSocket server that allows external tools (like Claude Code) to control Unity Editor in real-time.\n\n" +
                        "Features:\n" +
                        "• GameObject manipulation (create, destroy, find)\n" +
                        "• Transform control (position, rotation, scale)\n" +
                        "• Scene management (load, save, query)\n" +
                        "• Console log access\n" +
                        "• Hierarchy inspection\n\n" +
                        "Connection:\n" +
                        "• Protocol: JSON-RPC 2.0 over WebSocket\n" +
                        "• Default Port: 9300\n" +
                        "• Localhost only (secure)",
                        MessageType.None
                    );

                    if (GUILayout.Button("Open Documentation", GUILayout.Height(25)))
                    {
                        Application.OpenURL("https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/unity-editor-toolkit");
                    }
                }
                EditorGUILayout.EndScrollView();
            }
            EditorGUILayout.EndVertical();
        }

        private void FindOrCreateServer()
        {
            server = FindObjectOfType<UnityEditorServer>();
        }

        private void CreateServer()
        {
            var go = new GameObject("UnityEditorServer");
            server = go.AddComponent<UnityEditorServer>();
            Selection.activeGameObject = go;
            EditorGUIUtility.PingObject(go);
        }

        private void Update()
        {
            bool needsRepaint = false;

            // 서버가 없으면 찾기
            if (server == null)
            {
                FindOrCreateServer();
                needsRepaint = true;
            }

            // Play Mode 상태 변화 감지
            if (Application.isPlaying != wasPlaying)
            {
                wasPlaying = Application.isPlaying;
                needsRepaint = true;
            }

            // 일정 간격으로만 업데이트 (0.5초마다)
            float currentTime = (float)EditorApplication.timeSinceStartup;
            if (currentTime - lastUpdateTime > 0.5f)
            {
                lastUpdateTime = currentTime;
                needsRepaint = true;
            }

            // 필요할 때만 Repaint (✅ 성능 최적화)
            if (needsRepaint)
            {
                Repaint();
            }
        }
    }
}
