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

            // PlayModeButtons 바로 앞에 삽입하기 위해 ToolbarZonePlayMode 찾기
            var playModeZone = toolbarLeft.Q("ToolbarZonePlayMode");

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
                // PlayModeButtons 바로 앞에 삽입
                var playModeIndex = toolbarLeft.IndexOf(playModeZone);
                toolbarLeft.Insert(playModeIndex, customToolbarLeft);
            }
            else
            {
                // PlayModeZone을 못 찾으면 끝에 추가
                toolbarLeft.Add(customToolbarLeft);
            }

            InitializeServerStatus();
        }

        private static void InitializeServerStatus()
        {
            // 클릭 가능한 컨테이너 (전체가 버튼처럼 동작)
            var statusContainer = new VisualElement
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

            // 상태 라벨
            statusLabel = new Label("● 9500")
            {
                name = "status-label",
                tooltip = "Unity Editor Toolkit - Click to open menu",
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

            statusContainer.Add(statusLabel);
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
