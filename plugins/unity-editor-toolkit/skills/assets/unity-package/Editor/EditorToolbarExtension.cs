using System.Reflection;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;
using UnityEditorToolkit.Editor.Server;
using UnityEditorToolkit.Editor.Database;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Displays server and DB connection status on Unity Editor Toolbar (Reflection-based)
    /// NOTE: Currently disabled due to Unity version-specific Toolbar API differences
    /// </summary>
#if false // Disabled: Toolbar Reflection API is unstable across Unity versions
    [InitializeOnLoad]
#endif
    public static class EditorToolbarExtension
    {
        private static VisualElement toolbarRoot;
        private static VisualElement customToolbarLeft;
        private static Label serverStatusLabel;
        private static Label dbStatusLabel;
        private static VisualElement statusContainer;

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

            // PlayModeButtons 바로 앞에 삽입하기 위해 ToolbarZonePlayMode 찾기
            var playModeZone = toolbarRoot.Q("ToolbarZonePlayMode");

            customToolbarLeft = new VisualElement
            {
                name = "unity-editor-toolkit-toolbar",
                style =
                {
                    flexDirection = FlexDirection.Row,
                    alignItems = Align.Center,
                    marginRight = 8,
                },
            };

            if (playModeZone != null)
            {
                // ToolbarZonePlayMode의 맨 앞에 삽입
                playModeZone.Insert(0, customToolbarLeft);
            }
            else
            {
                // PlayModeZone을 못 찾으면 ToolbarZoneLeftAlign에 추가
                var toolbarLeft = toolbarRoot.Q("ToolbarZoneLeftAlign");
                if (toolbarLeft != null)
                {
                    toolbarLeft.Add(customToolbarLeft);
                }
                else
                {
                    return;
                }
            }

            InitializeServerStatus();
        }

        private static void InitializeServerStatus()
        {
            // 클릭 가능한 컨테이너 (전체가 버튼처럼 동작)
            statusContainer = new VisualElement
            {
                name = "unity-editor-toolkit-status",
                style =
                {
                    flexDirection = FlexDirection.Row,
                    alignItems = Align.Center,
                    paddingLeft = 6,
                    paddingRight = 6,
                    paddingTop = 2,
                    paddingBottom = 2,
                    backgroundColor = new Color(0.2f, 0.2f, 0.2f, 0.3f),
                    borderTopLeftRadius = 3,
                    borderTopRightRadius = 3,
                    borderBottomLeftRadius = 3,
                    borderBottomRightRadius = 3,
                },
            };

            // 마우스 이벤트 추가
            statusContainer.RegisterCallback<MouseDownEvent>(evt =>
            {
                if (evt.button == 0) // 왼쪽 클릭
                {
                    ShowWindowMenu();
                }
            });

            // 마우스 오버 효과
            statusContainer.RegisterCallback<MouseEnterEvent>(evt =>
            {
                statusContainer.style.backgroundColor = new Color(0.3f, 0.3f, 0.3f, 0.5f);
            });

            statusContainer.RegisterCallback<MouseLeaveEvent>(evt =>
            {
                statusContainer.style.backgroundColor = new Color(0.2f, 0.2f, 0.2f, 0.3f);
            });

            // 서버 상태 라벨
            serverStatusLabel = new Label("●")
            {
                name = "server-status-label",
                style =
                {
                    fontSize = 11,
                    unityFontStyleAndWeight = FontStyle.Bold,
                    marginRight = 5,
                },
            };

            // DB 상태 라벨
            dbStatusLabel = new Label("●")
            {
                name = "db-status-label",
                style =
                {
                    fontSize = 11,
                    unityFontStyleAndWeight = FontStyle.Bold,
                    marginRight = 3,
                },
            };

            // 드롭다운 화살표
            var dropdownArrow = new Label("▼")
            {
                style =
                {
                    fontSize = 8,
                    color = new Color(0.8f, 0.8f, 0.8f, 1f),
                },
            };

            statusContainer.Add(serverStatusLabel);
            statusContainer.Add(dbStatusLabel);
            statusContainer.Add(dropdownArrow);
            customToolbarLeft.Add(statusContainer);
        }

        private static void OnUpdate()
        {
            TryInitialize();
            UpdateServerStatus();
        }

        private static void UpdateServerStatus()
        {
            if (serverStatusLabel == null || dbStatusLabel == null || statusContainer == null)
            {
                return;
            }

            // 서버 상태 업데이트
            var server = EditorWebSocketServer.Instance;
            bool serverIsRunning = server != null && server.IsRunning;

            if (serverIsRunning)
            {
                serverStatusLabel.text = $"● {server.Port}";
                serverStatusLabel.tooltip = $"WebSocket Server: Running\nPort: {server.Port}\nClients: {server.ConnectedClients}";
                serverStatusLabel.style.color = new Color(0.3f, 1f, 0.3f);
            }
            else
            {
                serverStatusLabel.text = "●";
                serverStatusLabel.tooltip = "WebSocket Server: Stopped";
                serverStatusLabel.style.color = new Color(1f, 0.3f, 0.3f);
            }

            // DB 상태 업데이트
            bool dbIsConnected = DatabaseManager.Instance != null && DatabaseManager.Instance.IsConnected;

            if (dbIsConnected)
            {
                dbStatusLabel.text = "● DB";
                dbStatusLabel.tooltip = "Database: Connected";
                dbStatusLabel.style.color = new Color(0.3f, 1f, 0.3f);
            }
            else
            {
                dbStatusLabel.text = "● DB";
                dbStatusLabel.tooltip = "Database: Disconnected";
                dbStatusLabel.style.color = new Color(1f, 0.3f, 0.3f);
            }

            // 전체 컨테이너 tooltip (종합 정보)
            string serverStatus = serverIsRunning ? $"Running (:{server.Port})" : "Stopped";
            string dbStatus = dbIsConnected ? "Connected" : "Disconnected";
            statusContainer.tooltip = $"Unity Editor Toolkit\n\nServer: {serverStatus}\nDatabase: {dbStatus}\n\nClick to open menu";
        }

        private static void ShowWindowMenu()
        {
            var menu = new GenericMenu();
            menu.AddItem(new GUIContent("Open Unity Editor Toolkit"), false, () => EditorServerWindow.ShowWindow());
            menu.ShowAsContext();
        }
    }
}
