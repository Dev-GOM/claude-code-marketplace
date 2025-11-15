using UnityEditor;
using UnityEditor.Toolbars;
using UnityEngine;
using UnityEngine.UIElements;
using UnityEditorToolkit.Editor.Server;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Unity Editor Toolbar에 서버 연결 상태를 표시 (UI Toolkit 방식)
    /// </summary>
    public static class EditorToolbarExtension
    {
        private const string ToolbarId = "UnityEditorToolkit/StatusIndicator";

        [MainToolbarElement(ToolbarId, MainToolbarAlign.Left)]
        public static VisualElement CreateToolbarElement()
        {
            var container = new VisualElement();
            container.name = "unity-editor-toolkit-status";
            container.AddToClassList("unity-toolbar-element");

            // 상태 라벨
            var statusLabel = new Label("●");
            statusLabel.name = "status-label";
            statusLabel.AddToClassList("unity-toolbar-label");

            // 드롭다운 버튼
            var menuButton = new Button(() => ShowWindowMenu())
            {
                text = "⚙"
            };
            menuButton.AddToClassList("unity-toolbar-button");
            menuButton.tooltip = "Unity Editor Toolkit Windows";

            container.Add(statusLabel);
            container.Add(menuButton);

            // 상태 업데이트 스케줄
            container.schedule.Execute(() => UpdateStatus(statusLabel)).Every(500);

            return container;
        }

        private static void UpdateStatus(Label statusLabel)
        {
            var server = EditorWebSocketServer.Instance;
            bool isRunning = server != null && server.IsRunning;

            // CSS 클래스로 상태 관리
            statusLabel.RemoveFromClassList("server-stopped");
            statusLabel.RemoveFromClassList("server-running");

            if (isRunning)
            {
                statusLabel.text = $"● {server.Port}";
                statusLabel.tooltip = $"WebSocket Server Running\nPort: {server.Port}\nClients: {server.ConnectedClients}";
                statusLabel.AddToClassList("server-running");
            }
            else
            {
                statusLabel.text = "●";
                statusLabel.tooltip = "WebSocket Server Stopped";
                statusLabel.AddToClassList("server-stopped");
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
