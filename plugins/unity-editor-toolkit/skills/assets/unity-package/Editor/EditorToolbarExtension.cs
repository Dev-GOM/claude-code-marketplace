using System.Reflection;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;
using UnityEditorToolkit.Editor.Server;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Unity Editor Toolbar에 서버 연결 상태를 표시 (Reflection 기반)
    /// </summary>
    [InitializeOnLoad]
    public static class EditorToolbarExtension
    {
        private static VisualElement toolbarRoot;
        private static VisualElement customToolbarLeft;
        private static Label statusLabel;

        static EditorToolbarExtension()
        {
            EditorApplication.update -= OnUpdate;
            EditorApplication.update += OnUpdate;
        }

        private static void TryInitialize()
        {
            if (toolbarRoot != null)
            {
                return;
            }

            var toolbarType = typeof(UnityEditor.Editor).Assembly.GetType("UnityEditor.Toolbar");
            if (toolbarType == null)
            {
                return;
            }

            var toolbarObj = toolbarType.GetField("get").GetValue(null);
            if (toolbarObj == null)
            {
                return;
            }

            toolbarRoot = (VisualElement)toolbarType.GetField("m_Root",
                BindingFlags.Instance | BindingFlags.NonPublic)?.GetValue(toolbarObj);

            if (toolbarRoot == null)
            {
                return;
            }

            var toolbarLeft = toolbarRoot.Q("ToolbarZoneLeftAlign");
            if (toolbarLeft == null)
            {
                return;
            }

            customToolbarLeft = new VisualElement
            {
                name = "unity-editor-toolkit-toolbar",
                style =
                {
                    flexGrow = 1,
                    flexDirection = FlexDirection.Row,
                    overflow = Overflow.Hidden,
                },
            };
            toolbarLeft.Add(customToolbarLeft);

            InitializeServerStatus();
        }

        private static void InitializeServerStatus()
        {
            var statusContainer = new VisualElement
            {
                name = "unity-editor-toolkit-status",
                style =
                {
                    flexDirection = FlexDirection.Row,
                    alignItems = Align.Center,
                    paddingLeft = 8,
                    paddingRight = 8,
                },
            };

            // 상태 라벨
            statusLabel = new Label("●")
            {
                name = "status-label",
                style =
                {
                    fontSize = 11,
                    unityFontStyleAndWeight = FontStyle.Bold,
                    marginRight = 5,
                },
            };

            // 드롭다운 버튼
            var menuButton = new Button(ShowWindowMenu)
            {
                text = "⚙",
                tooltip = "Unity Editor Toolkit Windows",
                style =
                {
                    fontSize = 11,
                    paddingLeft = 5,
                    paddingRight = 5,
                    paddingTop = 2,
                    paddingBottom = 2,
                },
            };

            statusContainer.Add(statusLabel);
            statusContainer.Add(menuButton);
            customToolbarLeft.Add(statusContainer);
        }

        private static void OnUpdate()
        {
            TryInitialize();
            UpdateServerStatus();
        }

        private static void UpdateServerStatus()
        {
            if (statusLabel == null)
            {
                return;
            }

            var server = EditorWebSocketServer.Instance;
            bool isRunning = server != null && server.IsRunning;

            if (isRunning)
            {
                statusLabel.text = $"● {server.Port}";
                statusLabel.tooltip = $"WebSocket Server Running\nPort: {server.Port}\nClients: {server.ConnectedClients}";
                statusLabel.style.color = new Color(0.3f, 1f, 0.3f);
            }
            else
            {
                statusLabel.text = "●";
                statusLabel.tooltip = "WebSocket Server Stopped";
                statusLabel.style.color = new Color(1f, 0.3f, 0.3f);
            }
        }

        private static void ShowWindowMenu()
        {
            var menu = new GenericMenu();
            menu.AddItem(new GUIContent("Server Window"), false, () => EditorServerWindow.ShowWindow());
            menu.AddItem(new GUIContent("Database Status Window"), false, () => DatabaseStatusWindow.Open(null));
            menu.ShowAsContext();
        }
    }
}
