using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Database 상태 및 컨트롤을 표시하는 별도 윈도우
    /// </summary>
    public class DatabaseStatusWindow : EditorWindow
    {
        #region Fields
        private EditorServerWindow _parentWindow;

        // Data binding source
        private EditorServerWindowData windowData = new EditorServerWindowData();

        // UI Elements - Status
        private VisualElement dbStatusIndicator;
        private Label dbStatusLabel;
        private Label dbFileExistsLabel;
        private Label dbSyncStatusLabel;

        // UI Elements - Buttons
        private Button dbTestButton;
        private Button dbConnectButton;
        private Button dbDisconnectButton;
        private Button dbMigrateButton;
        private Button dbSyncToggleButton;

        // UI Elements - Command History
        private Label dbUndoCount;
        private Label dbRedoCount;
        private Button dbUndoButton;
        private Button dbRedoButton;
        private Button dbClearHistoryButton;

        // UI Elements - Messages
        private HelpBox dbErrorHelp;
        private HelpBox dbSuccessHelp;
        #endregion

        #region Window Management
        /// <summary>
        /// 윈도우 열기 (팩토리 메서드)
        /// </summary>
        public static DatabaseStatusWindow Open(EditorServerWindow parentWindow)
        {
            var window = GetWindow<DatabaseStatusWindow>("Database Status & Controls");
            window.minSize = new Vector2(400, 500);
            window._parentWindow = parentWindow;
            window.Show();
            return window;
        }
        #endregion

        #region Unity Lifecycle
        private void CreateGUI()
        {
            // Load UXML
            var visualTree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(
                "Packages/com.devgom.unity-editor-toolkit/Editor/DatabaseStatusWindow.uxml");

            if (visualTree == null)
            {
                Debug.LogError("[DatabaseStatusWindow] UXML file not found!");
                return;
            }

            visualTree.CloneTree(rootVisualElement);

            // Set data binding source
            rootVisualElement.dataSource = windowData;

            // Load USS (EditorServerWindow.uss 재사용)
            var styleSheet = AssetDatabase.LoadAssetAtPath<StyleSheet>(
                "Packages/com.devgom.unity-editor-toolkit/Editor/EditorServerWindow.uss");

            if (styleSheet != null)
            {
                rootVisualElement.styleSheets.Add(styleSheet);
            }

            // Query UI elements
            QueryUIElements();

            // Register events
            RegisterEvents();

            // Initial UI update
            UpdateUI();
        }

        private void OnDestroy()
        {
            // Cleanup
            UnregisterEvents();
        }
        #endregion

        #region UI Query
        private void QueryUIElements()
        {
            var root = rootVisualElement;

            // Status
            dbStatusIndicator = root.Q<VisualElement>("db-status-indicator");
            dbStatusLabel = root.Q<Label>("db-status-label");
            dbFileExistsLabel = root.Q<Label>("db-file-exists-label");
            dbSyncStatusLabel = root.Q<Label>("db-sync-status-label");

            // Buttons
            dbTestButton = root.Q<Button>("db-test-button");
            dbConnectButton = root.Q<Button>("db-connect-button");
            dbDisconnectButton = root.Q<Button>("db-disconnect-button");
            dbMigrateButton = root.Q<Button>("db-migrate-button");
            dbSyncToggleButton = root.Q<Button>("db-sync-toggle-button");

            // Command History
            dbUndoCount = root.Q<Label>("db-undo-count");
            dbRedoCount = root.Q<Label>("db-redo-count");
            dbUndoButton = root.Q<Button>("db-undo-button");
            dbRedoButton = root.Q<Button>("db-redo-button");
            dbClearHistoryButton = root.Q<Button>("db-clear-history-button");

            // Messages
            dbErrorHelp = root.Q<HelpBox>("db-error-help");
            dbSuccessHelp = root.Q<HelpBox>("db-success-help");
        }
        #endregion

        #region Event Handlers
        private void RegisterEvents()
        {
            if (dbTestButton != null)
                dbTestButton.clicked += OnTestConnectionClicked;

            if (dbConnectButton != null)
                dbConnectButton.clicked += OnConnectClicked;

            if (dbDisconnectButton != null)
                dbDisconnectButton.clicked += OnDisconnectClicked;

            if (dbMigrateButton != null)
                dbMigrateButton.clicked += OnRunMigrationsClicked;

            if (dbSyncToggleButton != null)
                dbSyncToggleButton.clicked += OnSyncToggleClicked;

            if (dbUndoButton != null)
                dbUndoButton.clicked += OnUndoClicked;

            if (dbRedoButton != null)
                dbRedoButton.clicked += OnRedoClicked;

            if (dbClearHistoryButton != null)
                dbClearHistoryButton.clicked += OnClearHistoryClicked;
        }

        private void UnregisterEvents()
        {
            if (dbTestButton != null)
                dbTestButton.clicked -= OnTestConnectionClicked;

            if (dbConnectButton != null)
                dbConnectButton.clicked -= OnConnectClicked;

            if (dbDisconnectButton != null)
                dbDisconnectButton.clicked -= OnDisconnectClicked;

            if (dbMigrateButton != null)
                dbMigrateButton.clicked -= OnRunMigrationsClicked;

            if (dbSyncToggleButton != null)
                dbSyncToggleButton.clicked -= OnSyncToggleClicked;

            if (dbUndoButton != null)
                dbUndoButton.clicked -= OnUndoClicked;

            if (dbRedoButton != null)
                dbRedoButton.clicked -= OnRedoClicked;

            if (dbClearHistoryButton != null)
                dbClearHistoryButton.clicked -= OnClearHistoryClicked;
        }

        private void OnTestConnectionClicked()
        {
            _parentWindow?.TestConnection();
            UpdateUI();
        }

        private void OnConnectClicked()
        {
            _parentWindow?.Connect();
            UpdateUI();
        }

        private void OnDisconnectClicked()
        {
            _parentWindow?.Disconnect();
            UpdateUI();
        }

        private void OnRunMigrationsClicked()
        {
            _parentWindow?.RunMigrations();
            UpdateUI();
        }

        private void OnSyncToggleClicked()
        {
            _parentWindow?.ToggleSync();
            UpdateUI();
        }

        private void OnUndoClicked()
        {
            _parentWindow?.Undo();
            UpdateUI();
        }

        private void OnRedoClicked()
        {
            _parentWindow?.Redo();
            UpdateUI();
        }

        private void OnClearHistoryClicked()
        {
            _parentWindow?.ClearHistory();
            UpdateUI();
        }
        #endregion

        #region UI Update
        /// <summary>
        /// UI 상태 업데이트
        /// </summary>
        public void UpdateUI()
        {
            if (_parentWindow == null)
                return;

            // Status
            UpdateConnectionStatus();
            UpdateDatabaseFileStatus();
            UpdateSyncStatus();
            UpdateCommandHistory();
            UpdateMessages();
        }

        private void UpdateConnectionStatus()
        {
            bool isConnected = _parentWindow.IsConnected;

            // Update data (UI auto-updates via data binding)
            windowData.DbIsConnected = isConnected;

            // Update button states (not bound to data)
            dbConnectButton?.SetEnabled(!isConnected);
            dbDisconnectButton?.SetEnabled(isConnected);

            if (dbDisconnectButton != null)
            {
                dbDisconnectButton.style.display = isConnected ? DisplayStyle.Flex : DisplayStyle.None;
            }
        }

        private void UpdateDatabaseFileStatus()
        {
            bool fileExists = _parentWindow.DatabaseFileExists();

            // Update data (UI auto-updates via data binding)
            windowData.DbFileExists = fileExists;
        }

        private void UpdateSyncStatus()
        {
            bool isSyncing = _parentWindow.IsSyncing;

            // Update data (UI auto-updates via data binding)
            windowData.DbIsSyncing = isSyncing;

            // Update button text (not bound to data)
            if (dbSyncToggleButton != null)
            {
                dbSyncToggleButton.text = isSyncing ? "⏹️ Stop Sync" : "🔄 Start Sync";
            }
        }

        private void UpdateCommandHistory()
        {
            int undoCount = _parentWindow.UndoCount;
            int redoCount = _parentWindow.RedoCount;

            // Update data (UI auto-updates via data binding)
            windowData.DbUndoCount = undoCount;
            windowData.DbRedoCount = redoCount;

            // Update button states (not bound to data)
            dbUndoButton?.SetEnabled(undoCount > 0);
            dbRedoButton?.SetEnabled(redoCount > 0);
        }

        private void UpdateMessages()
        {
            var errorMessage = _parentWindow.GetErrorMessage();
            var successMessage = _parentWindow.GetSuccessMessage();

            if (dbErrorHelp != null)
            {
                if (!string.IsNullOrEmpty(errorMessage))
                {
                    dbErrorHelp.text = errorMessage;
                    dbErrorHelp.RemoveFromClassList("hidden");
                }
                else
                {
                    dbErrorHelp.AddToClassList("hidden");
                }
            }

            if (dbSuccessHelp != null)
            {
                if (!string.IsNullOrEmpty(successMessage))
                {
                    dbSuccessHelp.text = successMessage;
                    dbSuccessHelp.RemoveFromClassList("hidden");
                }
                else
                {
                    dbSuccessHelp.AddToClassList("hidden");
                }
            }
        }
        #endregion
    }
}
