using System;
using UnityEngine;
using UnityEditor;
using UnityEngine.UIElements;
using Cysharp.Threading.Tasks;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Database.Setup;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// EditorServerWindow의 Database 섹션 확장
    /// Partial class로 분리하여 관리
    /// </summary>
    public partial class EditorServerWindow
    {
        #region Database Setup UI Elements
        private Label dbSetupSqliteStatus;
        private Label dbSetupUniTaskStatus;
        private Button dbSetupButton;
        private Button dbViewStatusButton;
        private VisualElement dbSetupProgressContainer;
        private Label dbSetupProgressLabel;
        private ProgressBar dbSetupProgressBar;
        private Label dbSetupStepLabel;
        private HelpBox dbSetupInfoHelp;
        private HelpBox dbSetupSuccessHelp;
        private HelpBox dbSetupErrorHelp;
        #endregion

        #region Database UI Elements
        private Toggle dbEnableToggle;
        private VisualElement dbConfigSection;
        private VisualElement dbDisabledSection;

        // Config fields
        private TextField dbFilePathField;
        private Button dbBrowseButton;
        private Button dbOpenFolderButton;
        private Button dbResetPathButton;
        private Toggle dbWalToggle;

        // Status
        private VisualElement dbStatusIndicator;
        private Label dbStatusLabel;
        private Label dbFileExistsLabel;
        private Label dbSyncStatusLabel;

        // Buttons
        private Button dbTestButton;
        private Button dbConnectButton;
        private Button dbDisconnectButton;
        private Button dbMigrateButton;
        private Button dbSyncToggleButton;

        // Command History UI
        private Label dbUndoCount;
        private Label dbRedoCount;
        private Button dbUndoButton;
        private Button dbRedoButton;
        private Button dbClearHistoryButton;

        // Messages
        private HelpBox dbInfoHelp;
        private HelpBox dbErrorHelp;
        private HelpBox dbSuccessHelp;
        #endregion

        #region Database State
        private DatabaseConfig currentDbConfig;
        private DatabaseSetupWizard setupWizard;
        private bool isLoadingConfig = false; // UI 로드 중 플래그
        private System.Threading.CancellationTokenSource migrationCheckCts; // Migration 버튼 업데이트 취소 토큰
        private bool lastConnectionState = false; // 마지막 연결 상태 (상태 변경 감지용)
        #endregion

        #region Database UI Initialization
        private void QueryDatabaseUIElements()
        {
            // Setup Wizard UI
            dbSetupSqliteStatus = rootVisualElement.Q<Label>("db-setup-sqlite-status");
            dbSetupUniTaskStatus = rootVisualElement.Q<Label>("db-setup-unitask-status");
            dbSetupButton = rootVisualElement.Q<Button>("db-setup-button");
            dbViewStatusButton = rootVisualElement.Q<Button>("db-view-status-button");
            dbSetupProgressContainer = rootVisualElement.Q<VisualElement>("db-setup-progress-container");
            dbSetupProgressLabel = rootVisualElement.Q<Label>("db-setup-progress-label");
            dbSetupProgressBar = rootVisualElement.Q<ProgressBar>("db-setup-progress-bar");
            dbSetupStepLabel = rootVisualElement.Q<Label>("db-setup-step-label");
            dbSetupInfoHelp = rootVisualElement.Q<HelpBox>("db-setup-info-help");
            dbSetupSuccessHelp = rootVisualElement.Q<HelpBox>("db-setup-success-help");
            dbSetupErrorHelp = rootVisualElement.Q<HelpBox>("db-setup-error-help");

            dbEnableToggle = rootVisualElement.Q<Toggle>("db-enable-toggle");
            dbConfigSection = rootVisualElement.Q<VisualElement>("db-config-section");
            dbDisabledSection = rootVisualElement.Q<VisualElement>("db-disabled-section");

            // Config fields
            dbFilePathField = rootVisualElement.Q<TextField>("db-filepath-field");
            dbBrowseButton = rootVisualElement.Q<Button>("db-browse-button");
            dbOpenFolderButton = rootVisualElement.Q<Button>("db-open-folder-button");
            dbResetPathButton = rootVisualElement.Q<Button>("db-reset-path-button");
            dbWalToggle = rootVisualElement.Q<Toggle>("db-wal-toggle");

            // Status
            dbStatusIndicator = rootVisualElement.Q<VisualElement>("db-status-indicator");
            dbStatusLabel = rootVisualElement.Q<Label>("db-status-label");
            dbFileExistsLabel = rootVisualElement.Q<Label>("db-file-exists-label");
            dbSyncStatusLabel = rootVisualElement.Q<Label>("db-sync-status-label");

            // Buttons
            dbTestButton = rootVisualElement.Q<Button>("db-test-button");
            dbConnectButton = rootVisualElement.Q<Button>("db-connect-button");
            dbDisconnectButton = rootVisualElement.Q<Button>("db-disconnect-button");
            dbMigrateButton = rootVisualElement.Q<Button>("db-migrate-button");
            dbSyncToggleButton = rootVisualElement.Q<Button>("db-sync-toggle-button");

            // Command History
            dbUndoCount = rootVisualElement.Q<Label>("db-undo-count");
            dbRedoCount = rootVisualElement.Q<Label>("db-redo-count");
            dbUndoButton = rootVisualElement.Q<Button>("db-undo-button");
            dbRedoButton = rootVisualElement.Q<Button>("db-redo-button");
            dbClearHistoryButton = rootVisualElement.Q<Button>("db-clear-history-button");

            // Messages
            dbInfoHelp = rootVisualElement.Q<HelpBox>("db-info-help");
            dbErrorHelp = rootVisualElement.Q<HelpBox>("db-error-help");
            dbSuccessHelp = rootVisualElement.Q<HelpBox>("db-success-help");
        }

        private void BindDatabaseEvents()
        {
            // Setup Wizard
            dbSetupButton?.RegisterCallback<ClickEvent>(evt => RunSetupWizardAsync().Forget());

            // View Status Button
            dbViewStatusButton?.RegisterCallback<ClickEvent>(evt => OpenDatabaseStatusWindow());

            // Enable toggle
            dbEnableToggle?.RegisterValueChangedCallback(evt => {
                OnDatabaseEnableChanged(evt.newValue);
            });

            // Config field changes
            dbFilePathField?.RegisterValueChangedCallback(evt => SaveDatabaseConfig());
            dbWalToggle?.RegisterValueChangedCallback(evt => SaveDatabaseConfig());

            // Browse buttons
            dbBrowseButton?.RegisterCallback<ClickEvent>(evt => BrowseDatabaseFileAsync().Forget());
            dbOpenFolderButton?.RegisterCallback<ClickEvent>(evt => OpenDatabaseFolder());
            dbResetPathButton?.RegisterCallback<ClickEvent>(evt => ResetDatabasePath());

            // Buttons
            dbTestButton?.RegisterCallback<ClickEvent>(evt => TestDatabaseConnectionAsync().Forget());
            dbConnectButton?.RegisterCallback<ClickEvent>(evt => ConnectDatabaseAsync(autoConnect: false).Forget());
            dbDisconnectButton?.RegisterCallback<ClickEvent>(evt => DisconnectDatabaseAsync().Forget());
            dbMigrateButton?.RegisterCallback<ClickEvent>(evt => RunDatabaseMigrationsAsync().Forget());
            dbSyncToggleButton?.RegisterCallback<ClickEvent>(evt => ToggleDatabaseSyncAsync().Forget());

            // Command History Buttons
            dbUndoButton?.RegisterCallback<ClickEvent>(evt => UndoAsync().Forget());
            dbRedoButton?.RegisterCallback<ClickEvent>(evt => RedoAsync().Forget());
            dbClearHistoryButton?.RegisterCallback<ClickEvent>(evt => ClearHistoryAsync().Forget());
        }

        private void InitializeDatabaseUI()
        {
            // Initialize Setup Wizard
            setupWizard = new DatabaseSetupWizard();

            // Hide all messages initially
            HideSetupMessages();
            HideDatabaseMessages();

            // Check Setup Status
            CheckSetupStatusAsync().Forget();

            // Load saved config
            LoadDatabaseConfig();

            // Update sections visibility without saving (초기화 시)
            UpdateDatabaseSectionsVisibility(currentDbConfig?.EnableDatabase ?? true);

            // Update UI
            UpdateDatabaseUI();

            // Subscribe to CommandHistory events if already connected (e.g., after domain reload)
            if (DatabaseManager.Instance.IsConnected && DatabaseManager.Instance.CommandHistory != null)
            {
                DatabaseManager.Instance.CommandHistory.OnHistoryChanged -= UpdateCommandHistoryUI;
                DatabaseManager.Instance.CommandHistory.OnHistoryChanged += UpdateCommandHistoryUI;

                // Reload history from database after domain reload
                EditorApplication.delayCall += () => {
                    ReloadHistoryFromDatabaseAsync().Forget();
                };
            }

            // Auto-connect to database if enabled and not already connected
            if (currentDbConfig?.EnableDatabase == true && !DatabaseManager.Instance.IsConnected)
            {
                EditorApplication.delayCall += () => {
                    ConnectDatabaseAsync(autoConnect: true).Forget();
                };
            }
        }
        #endregion

        #region Database Config Management
        private void LoadDatabaseConfig()
        {
            isLoadingConfig = true; // UI 로드 시작

            try
            {
                // EditorPrefs에서 개별 키로 로드 (마이그레이션 자동 처리)
                currentDbConfig = DatabaseConfig.LoadFromEditorPrefs();

                // Update UI fields (이때 ValueChangedCallback이 발동되지만 isLoadingConfig=true라 저장 안됨)
                if (dbEnableToggle != null)
                    dbEnableToggle.value = currentDbConfig.EnableDatabase;

                if (dbFilePathField != null)
                    dbFilePathField.value = currentDbConfig.DatabaseFilePath;

                if (dbWalToggle != null)
                    dbWalToggle.value = currentDbConfig.EnableWAL;
            }
            finally
            {
                isLoadingConfig = false; // UI 로드 완료
            }
        }

        private void SaveDatabaseConfig()
        {
            // UI 로드 중에는 저장하지 않음 (ValueChangedCallback 무시)
            if (isLoadingConfig)
            {
                return;
            }

            if (currentDbConfig == null)
            {
                ToolkitLogger.LogWarning("EditorServerWindow", "SaveDatabaseConfig: currentDbConfig is null");
                return;
            }

            // Update config from UI (UI가 null이면 현재 값 유지)
            if (dbEnableToggle != null)
                currentDbConfig.EnableDatabase = dbEnableToggle.value;

            if (dbFilePathField != null && !string.IsNullOrEmpty(dbFilePathField.value))
                currentDbConfig.DatabaseFilePath = dbFilePathField.value;

            if (dbWalToggle != null)
                currentDbConfig.EnableWAL = dbWalToggle.value;

            // Save to EditorPrefs (개별 키로 저장)
            ToolkitLogger.Log("EditorServerWindow", $" Saving DatabaseConfig: EnableWAL={currentDbConfig.EnableWAL}, EnableDatabase={currentDbConfig.EnableDatabase}");
            currentDbConfig.SaveToEditorPrefs();
        }

        private void OnDatabaseEnableChanged(bool enabled)
        {
            SaveDatabaseConfig();
            UpdateDatabaseSectionsVisibility(enabled);
        }

        private void UpdateDatabaseSectionsVisibility(bool enabled)
        {
            // Show/hide sections
            if (enabled)
            {
                dbConfigSection?.RemoveFromClassList("hidden");
                dbDisabledSection?.AddToClassList("hidden");

                // Adjust window height for enabled state (more content)
                var window = this as EditorWindow;
                if (window != null)
                {
                    window.minSize = new Vector2(400, 600);
                }
            }
            else
            {
                dbConfigSection?.AddToClassList("hidden");
                dbDisabledSection?.RemoveFromClassList("hidden");

                // Adjust window height for disabled state (less content)
                var window = this as EditorWindow;
                if (window != null)
                {
                    window.minSize = new Vector2(400, 400);
                }

                // Disconnect if connected (초기화 시에는 연결되어 있지 않으므로 안전)
                if (DatabaseManager.Instance.IsConnected)
                {
                    DisconnectDatabaseAsync().Forget();
                }
            }
        }

        /// <summary>
        /// 데이터베이스 파일 경로 선택
        /// </summary>
        private async UniTaskVoid BrowseDatabaseFileAsync()
        {
            string currentPath = dbFilePathField?.value ?? DatabaseConfig.GetDefaultDatabasePath();
            string directory = System.IO.Path.GetDirectoryName(currentPath);

            string selectedPath = EditorUtility.SaveFilePanel(
                "Select Database File Location",
                directory,
                "unity_editor_toolkit.db",
                "db"
            );

            if (!string.IsNullOrEmpty(selectedPath))
            {
                if (dbFilePathField != null)
                {
                    dbFilePathField.value = selectedPath;
                }
                SaveDatabaseConfig();
                ToolkitLogger.Log("EditorServerWindow", $" Database path updated: {selectedPath}");
            }

            await UniTask.Yield();
        }

        /// <summary>
        /// 데이터베이스 파일 폴더 열기
        /// </summary>
        private void OpenDatabaseFolder()
        {
            string filePath = dbFilePathField?.value ?? DatabaseConfig.GetDefaultDatabasePath();
            string directory = System.IO.Path.GetDirectoryName(filePath);

            if (System.IO.Directory.Exists(directory))
            {
                EditorUtility.RevealInFinder(directory);
                ToolkitLogger.Log("EditorServerWindow", $" Opened folder: {directory}");
            }
            else
            {
                ShowDatabaseError($"❌ 폴더가 존재하지 않습니다:\n{directory}");
                ToolkitLogger.LogWarning("EditorServerWindow", $" Directory does not exist: {directory}");
            }
        }

        /// <summary>
        /// 데이터베이스 경로를 기본값으로 재설정
        /// </summary>
        private void ResetDatabasePath()
        {
            string defaultPath = DatabaseConfig.GetDefaultDatabasePath();

            if (dbFilePathField != null)
            {
                dbFilePathField.value = defaultPath;
            }

            SaveDatabaseConfig();
            ShowDatabaseSuccess($"✅ 경로가 기본값으로 재설정되었습니다:\n{defaultPath}");
            ToolkitLogger.Log("EditorServerWindow", $" Database path reset to default: {defaultPath}");
        }
        #endregion

        #region Database Operations
        private async UniTaskVoid TestDatabaseConnectionAsync()
        {
            SaveDatabaseConfig();

            // Hide messages
            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "데이터베이스 연결 테스트 시작...");

                var connector = new SQLiteConnector(currentDbConfig);
                var result = await connector.ConnectAsync();

                if (result.Success)
                {
                    var version = await connector.GetDatabaseVersionAsync();
                    await connector.DisconnectAsync();

                    ShowDatabaseSuccess($"✅ 연결 성공!\n\nSQLite Version:\n{version}\n\nDatabase File:\n{currentDbConfig.DatabaseFilePath}");
                    ToolkitLogger.Log("EditorServerWindow", $" 연결 테스트 성공: {version}");
                }
                else
                {
                    ShowDatabaseError($"❌ 연결 실패:\n{result.ErrorMessage}");
                    ToolkitLogger.LogError("EditorServerWindow", $" 연결 테스트 실패: {result.ErrorMessage}");
                }
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ 연결 테스트 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" 연결 테스트 예외: {ex.Message}");
            }
        }

        private async UniTaskVoid ConnectDatabaseAsync(bool autoConnect = false)
        {
            SaveDatabaseConfig();
            if (!autoConnect)
            {
                HideDatabaseMessages();
            }

            try
            {
                // 이미 연결되어 있는지 확인
                if (DatabaseManager.Instance.IsConnected)
                {
                    if (!autoConnect)
                    {
                        ShowDatabaseSuccess("✅ 이미 연결되어 있습니다!\n\nCommand History 활성화됨");
                    }
                    ToolkitLogger.Log("EditorServerWindow", "이미 데이터베이스에 연결되어 있습니다.");
                    UpdateDatabaseUI();
                    return;
                }

                ToolkitLogger.Log("EditorServerWindow", $" 데이터베이스 연결 중... (자동연결: {autoConnect})");

                // 데이터베이스 연결 (InitializeAsync에서 자동 마이그레이션 실행)
                var result = await DatabaseManager.Instance.InitializeAsync(currentDbConfig);

                if (!result.Success)
                {
                    if (!autoConnect)
                    {
                        ShowDatabaseError($"❌ 연결 실패:\n{result.ErrorMessage}");
                    }
                    ToolkitLogger.LogError("EditorServerWindow", $" 연결 실패: {result.ErrorMessage}");
                    UpdateDatabaseUI();
                    return;
                }

                ToolkitLogger.Log("EditorServerWindow", "데이터베이스 연결 성공 (자동 마이그레이션 완료).");

                // Subscribe to CommandHistory events after successful connection
                if (DatabaseManager.Instance.CommandHistory != null)
                {
                    // Unsubscribe first to avoid duplicate subscriptions
                    DatabaseManager.Instance.CommandHistory.OnHistoryChanged -= UpdateCommandHistoryUI;
                    DatabaseManager.Instance.CommandHistory.OnHistoryChanged += UpdateCommandHistoryUI;
                    ToolkitLogger.Log("EditorServerWindow", "CommandHistory 이벤트 구독 완료.");

                    // Load history from database (restore from last session)
                    try
                    {
                        // Load commands from last 24 hours
                        var since = DateTime.UtcNow.AddHours(-24);
                        int loadedCount = await DatabaseManager.Instance.CommandHistory.LoadHistoryFromDatabaseAsync(since);
                        if (loadedCount > 0)
                        {
                            ToolkitLogger.Log("EditorServerWindow", $" DB에서 {loadedCount}개 명령 히스토리 복원 완료.");
                        }
                    }
                    catch (Exception loadEx)
                    {
                        ToolkitLogger.LogWarning("EditorServerWindow", $" 히스토리 로드 실패 (무시됨): {loadEx.Message}");
                    }
                }

                if (!autoConnect)
                {
                    ShowDatabaseSuccess("✅ 데이터베이스 연결 완료!\n\nCommand History 활성화됨\n(자동 마이그레이션 실행됨)");
                }
            }
            catch (System.Exception ex)
            {
                if (!autoConnect)
                {
                    ShowDatabaseError($"❌ 연결 중 오류:\n{ex.Message}");
                }
                ToolkitLogger.LogError("EditorServerWindow", $" 연결 예외: {ex.Message}");
            }

            UpdateDatabaseUI();
        }

        private async UniTaskVoid DisconnectDatabaseAsync()
        {
            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "데이터베이스 연결 해제 중...");

                await DatabaseManager.Instance.ShutdownAsync();

                ShowDatabaseSuccess("✅ 데이터베이스 연결 해제 완료.");
                ToolkitLogger.Log("EditorServerWindow", "연결 해제 성공.");
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ 연결 해제 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" 연결 해제 예외: {ex.Message}");
            }

            UpdateDatabaseUI();
        }

        private async UniTaskVoid RunDatabaseMigrationsAsync()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                ShowDatabaseError("⚠️ 먼저 데이터베이스에 연결하세요.");
                return;
            }

            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "마이그레이션 실행 중...");

                var runner = new MigrationRunner(DatabaseManager.Instance);
                var result = await runner.RunMigrationsAsync();

                if (result.Success)
                {
                    ShowDatabaseSuccess($"✅ 마이그레이션 완료!\n{result.MigrationsApplied}개 적용됨.");
                    ToolkitLogger.Log("EditorServerWindow", $" 마이그레이션 성공: {result.MigrationsApplied}개");

                    // Update migration button text after successful migration
                    UpdateMigrationButtonTextAsync().Forget();
                }
                else
                {
                    ShowDatabaseError($"❌ 마이그레이션 실패:\n{result.ErrorMessage}");
                    ToolkitLogger.LogError("EditorServerWindow", $" 마이그레이션 실패: {result.ErrorMessage}");
                }
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ 마이그레이션 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" 마이그레이션 예외: {ex.Message}");
            }
        }

        private async UniTaskVoid ToggleDatabaseSyncAsync()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                ShowDatabaseError("⚠️ 데이터베이스에 연결되어 있지 않습니다.");
                return;
            }

            try
            {
                // DatabaseManager의 SyncManager 사용 (단일 인스턴스)
                var syncManager = DatabaseManager.Instance.SyncManager;
                if (syncManager == null)
                {
                    ShowDatabaseError("⚠️ SyncManager가 초기화되지 않았습니다.");
                    return;
                }

                // 토글 동작
                if (syncManager.IsRunning)
                {
                    // 동기화 중지
                    syncManager.StopSync();
                    ShowDatabaseSuccess("🛑 동기화가 중지되었습니다.");
                }
                else
                {
                    // 동기화 시작
                    syncManager.StartSync();
                    ShowDatabaseSuccess("▶️ 동기화가 시작되었습니다.");
                }

                // UI 업데이트
                await UniTask.Yield();
                UpdateDatabaseUI();
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("EditorServerWindow", $" 동기화 토글 실패: {ex.Message}");
                ShowDatabaseError($"⚠️ 동기화 토글 실패: {ex.Message}");
            }
        }
        #endregion

        #region Command History Operations
        /// <summary>
        /// Undo 실행
        /// </summary>
        private async UniTaskVoid UndoAsync()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                ShowDatabaseError("⚠️ 데이터베이스에 연결되어 있지 않습니다.");
                return;
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null || !history.CanUndo)
            {
                ShowDatabaseError("⚠️ Undo할 명령이 없습니다.");
                return;
            }

            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "Undo 실행 중...");

                bool success = await history.UndoAsync();

                if (success)
                {
                    ShowDatabaseSuccess("✅ ⟲ Undo 완료!");
                    ToolkitLogger.Log("EditorServerWindow", "Undo 성공.");
                }
                else
                {
                    ShowDatabaseError("❌ Undo 실패.");
                    ToolkitLogger.LogError("EditorServerWindow", "Undo 실패.");
                }
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ Undo 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" Undo 예외: {ex.Message}");
            }

            UpdateCommandHistoryUI();
        }

        /// <summary>
        /// Redo 실행
        /// </summary>
        private async UniTaskVoid RedoAsync()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                ShowDatabaseError("⚠️ 데이터베이스에 연결되어 있지 않습니다.");
                return;
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null || !history.CanRedo)
            {
                ShowDatabaseError("⚠️ Redo할 명령이 없습니다.");
                return;
            }

            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "Redo 실행 중...");

                bool success = await history.RedoAsync();

                if (success)
                {
                    ShowDatabaseSuccess("✅ ⟳ Redo 완료!");
                    ToolkitLogger.Log("EditorServerWindow", "Redo 성공.");
                }
                else
                {
                    ShowDatabaseError("❌ Redo 실패.");
                    ToolkitLogger.LogError("EditorServerWindow", "Redo 실패.");
                }
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ Redo 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" Redo 예외: {ex.Message}");
            }

            UpdateCommandHistoryUI();
        }

        /// <summary>
        /// Command History 초기화
        /// </summary>
        private async UniTaskVoid ClearHistoryAsync()
        {
            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null)
            {
                return;
            }

            HideDatabaseMessages();

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "Command History 초기화 중...");

                history.Clear();

                ShowDatabaseSuccess("✅ 🗑️ Command History가 초기화되었습니다.");
                ToolkitLogger.Log("EditorServerWindow", "Command History 초기화 완료.");
            }
            catch (System.Exception ex)
            {
                ShowDatabaseError($"❌ 초기화 중 오류:\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" History 초기화 예외: {ex.Message}");
            }

            await UniTask.Yield();
            UpdateCommandHistoryUI();
        }

        /// <summary>
        /// DB에서 Command History 리로드 (도메인 리로드 후)
        /// </summary>
        private async UniTaskVoid ReloadHistoryFromDatabaseAsync()
        {
            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null || !DatabaseManager.Instance.IsConnected)
            {
                return;
            }

            try
            {
                // Load commands from last 24 hours
                var since = DateTime.UtcNow.AddHours(-24);
                int loadedCount = await history.LoadHistoryFromDatabaseAsync(since);

                if (loadedCount > 0)
                {
                    ToolkitLogger.Log("EditorServerWindow", $" DB에서 {loadedCount}개 명령 히스토리 복원 완료 (도메인 리로드 후).");
                }

                // Update UI
                UpdateCommandHistoryUI();
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("EditorServerWindow", $" 히스토리 리로드 실패 (무시됨): {ex.Message}");
            }
        }

        /// <summary>
        /// Command History UI 업데이트
        /// </summary>
        private void UpdateCommandHistoryUI()
        {
            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null)
            {
                // Update data (UI auto-updates via data binding)
                windowData.DbUndoCount = 0;
                windowData.DbRedoCount = 0;

                // Update button states
                dbUndoButton?.SetEnabled(false);
                dbRedoButton?.SetEnabled(false);
                dbClearHistoryButton?.SetEnabled(false);
                return;
            }

            // Update data (UI auto-updates via data binding)
            windowData.DbUndoCount = history.UndoCount;
            windowData.DbRedoCount = history.RedoCount;

            // Update button states (not bound to data)
            dbUndoButton?.SetEnabled(history.CanUndo && DatabaseManager.Instance.IsConnected);
            dbRedoButton?.SetEnabled(history.CanRedo && DatabaseManager.Instance.IsConnected);
            dbClearHistoryButton?.SetEnabled((history.UndoCount > 0 || history.RedoCount > 0) && DatabaseManager.Instance.IsConnected);
        }
        #endregion

        #region Database UI Update
        private void UpdateDatabaseUI()
        {
            if (dbStatusIndicator == null || dbStatusLabel == null)
                return;

            bool isConnected = DatabaseManager.Instance.IsConnected;

            // Update data (UI auto-updates via data binding)
            windowData.DbIsConnected = isConnected;

            // Update status indicator classes (CSS classes cannot be bound)
            dbStatusIndicator.RemoveFromClassList("status-stopped");
            dbStatusIndicator.RemoveFromClassList("status-running");
            dbStatusIndicator.AddToClassList(isConnected ? "status-running" : "status-stopped");

            // Update database file status
            if (DatabaseManager.Instance.IsInitialized && DatabaseManager.Instance.Connector != null)
            {
                bool fileExists = DatabaseManager.Instance.Connector.DatabaseFileExists();
                windowData.DbFileExists = fileExists;
            }
            else
            {
                windowData.DbFileExists = false;
            }

            // Update sync status
            windowData.DbIsSyncing = DatabaseManager.Instance.SyncManager?.IsRunning ?? false;

            // Update button visibility and states (not bound to data)
            dbConnectButton?.SetEnabled(!isConnected && (dbEnableToggle?.value ?? false));
            dbDisconnectButton?.SetEnabled(isConnected);

            if (isConnected)
            {
                dbDisconnectButton?.RemoveFromClassList("hidden");
                dbConnectButton?.AddToClassList("hidden");
            }
            else
            {
                dbDisconnectButton?.AddToClassList("hidden");
                dbConnectButton?.RemoveFromClassList("hidden");
            }

            dbTestButton?.SetEnabled(dbEnableToggle?.value ?? false);
            dbMigrateButton?.SetEnabled(isConnected);
            dbSyncToggleButton?.SetEnabled(isConnected);

            // Update Migration button text only when connection state changes (avoid polling)
            if (isConnected != lastConnectionState)
            {
                lastConnectionState = isConnected;
                UpdateMigrationButtonTextAsync().Forget();
            }

            // Update Command History UI
            UpdateCommandHistoryUI();
        }

        /// <summary>
        /// Migration 버튼 텍스트 업데이트 (비동기)
        /// </summary>
        private async UniTaskVoid UpdateMigrationButtonTextAsync()
        {
            if (dbMigrateButton == null)
                return;

            if (!DatabaseManager.Instance.IsConnected)
            {
                dbMigrateButton.text = "⚙️ Run Migrations";
                return;
            }

            // 이전 요청 취소 (race condition 방지)
            migrationCheckCts?.Cancel();
            migrationCheckCts?.Dispose();
            migrationCheckCts = new System.Threading.CancellationTokenSource();
            var token = migrationCheckCts.Token;

            try
            {
                // 마이그레이션이 실행 중이면 완료될 때까지 대기 (최대 60초)
                int waitCount = 0;
                while (DatabaseManager.Instance.IsMigrationRunning && waitCount < 600)
                {
                    await UniTask.Delay(100, cancellationToken: token);
                    waitCount++;
                }

                if (token.IsCancellationRequested || !DatabaseManager.Instance.IsConnected)
                {
                    return;
                }

                var runner = new MigrationRunner(DatabaseManager.Instance);
                int pendingCount = await runner.GetPendingMigrationCountAsync(token);

                // 취소되었으면 무시
                if (token.IsCancellationRequested)
                {
                    return;
                }

                // 비동기 작업 후 UI 요소 및 연결 상태 재확인 (윈도우 닫힘, 도메인 리로드 등)
                if (dbMigrateButton == null || !DatabaseManager.Instance.IsConnected)
                {
                    return;
                }

                if (pendingCount > 0)
                {
                    dbMigrateButton.text = $"⚙️ Run Migrations ({pendingCount} pending)";
                }
                else if (pendingCount == 0)
                {
                    dbMigrateButton.text = "✅ Migrations Up-to-date";
                }
                else
                {
                    dbMigrateButton.text = "⚙️ Run Migrations";
                }
            }
            catch (OperationCanceledException)
            {
                // 취소됨 - 무시
            }
            catch (Exception ex)
            {
                // 비동기 작업 중 예외 발생 시 (컴파일, 도메인 리로드 등)
                ToolkitLogger.LogWarning("EditorServerWindow", $" Migration 상태 확인 실패: {ex.Message}");

                // UI 요소가 여전히 유효한지 확인
                if (dbMigrateButton != null)
                {
                    dbMigrateButton.text = "⚙️ Run Migrations";
                }
            }
        }

        private void HideDatabaseMessages()
        {
            dbErrorHelp?.AddToClassList("hidden");
            dbSuccessHelp?.AddToClassList("hidden");
        }

        private void ShowDatabaseError(string message)
        {
            if (dbErrorHelp != null)
            {
                dbErrorHelp.text = message;
                dbErrorHelp.RemoveFromClassList("hidden");
            }

            dbSuccessHelp?.AddToClassList("hidden");
        }

        private void ShowDatabaseSuccess(string message)
        {
            if (dbSuccessHelp != null)
            {
                dbSuccessHelp.text = message;
                dbSuccessHelp.RemoveFromClassList("hidden");
            }

            dbErrorHelp?.AddToClassList("hidden");
        }
        #endregion

        #region Database Cleanup
        private void CleanupDatabaseUI()
        {
            // SyncManager는 DatabaseManager가 소유하므로 여기서 Dispose 하지 않음
            // DatabaseManager.CleanupAsync()에서 처리됨

            // Cancel any pending migration check
            migrationCheckCts?.Cancel();
            migrationCheckCts?.Dispose();
            migrationCheckCts = null;

            // Unsubscribe from CommandHistory events
            if (DatabaseManager.Instance.CommandHistory != null)
            {
                DatabaseManager.Instance.CommandHistory.OnHistoryChanged -= UpdateCommandHistoryUI;
            }

            // Setup Wizard
            dbSetupSqliteStatus = null;
            dbSetupUniTaskStatus = null;
            dbSetupButton = null;
            dbSetupProgressContainer = null;
            dbSetupProgressLabel = null;
            dbSetupProgressBar = null;
            dbSetupStepLabel = null;
            dbSetupInfoHelp = null;
            dbSetupSuccessHelp = null;
            dbSetupErrorHelp = null;

            dbEnableToggle = null;
            dbConfigSection = null;
            dbDisabledSection = null;
            dbFilePathField = null;
            dbBrowseButton = null;
            dbOpenFolderButton = null;
            dbResetPathButton = null;
            dbWalToggle = null;
            dbStatusIndicator = null;
            dbStatusLabel = null;
            dbFileExistsLabel = null;
            dbSyncStatusLabel = null;
            dbTestButton = null;
            dbConnectButton = null;
            dbDisconnectButton = null;
            dbMigrateButton = null;
            dbSyncToggleButton = null;
            dbUndoCount = null;
            dbRedoCount = null;
            dbUndoButton = null;
            dbRedoButton = null;
            dbClearHistoryButton = null;
            dbInfoHelp = null;
            dbErrorHelp = null;
            dbSuccessHelp = null;

            setupWizard = null;
        }
        #endregion

        #region Setup Wizard
        /// <summary>
        /// Setup Status 확인
        /// SQLite와 UniTask는 패키지에 포함되어 있음
        /// </summary>
        private async UniTaskVoid CheckSetupStatusAsync()
        {
            if (setupWizard == null) return;

            try
            {
                // SQLite 상태 표시 (항상 사용 가능)
                if (dbSetupSqliteStatus != null)
                {
                    dbSetupSqliteStatus.text = "✓ Included (unity-sqlite-net)";
                }

                // UniTask 상태 표시 (package.json 의존성)
                if (dbSetupUniTaskStatus != null)
                {
                    dbSetupUniTaskStatus.text = "✓ Auto-installed (package.json)";
                }

                // Setup 버튼은 항상 활성화 (DB 파일 생성 및 마이그레이션용)
                if (dbSetupButton != null)
                {
                    dbSetupButton.SetEnabled(true);
                }

                await UniTask.Yield();
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("EditorServerWindow", $" Setup Status 확인 실패: {ex.Message}");
            }
        }

        /// <summary>
        /// Setup Wizard 실행 (원클릭 설치)
        /// </summary>
        private async UniTaskVoid RunSetupWizardAsync()
        {
            if (setupWizard == null || setupWizard.IsRunning)
            {
                return;
            }

            SaveDatabaseConfig();
            HideSetupMessages();

            // 기존 DB 파일 삭제 (재설치)
            if (System.IO.File.Exists(currentDbConfig.DatabaseFilePath))
            {
                try
                {
                    System.IO.File.Delete(currentDbConfig.DatabaseFilePath);
                    ToolkitLogger.Log("EditorServerWindow", $" 기존 DB 파일 삭제: {currentDbConfig.DatabaseFilePath}");
                }
                catch (Exception ex)
                {
                    ShowSetupError($"❌ 기존 DB 파일 삭제 실패:\n{ex.Message}");
                    return;
                }
            }

            // Progress 표시
            dbSetupProgressContainer?.RemoveFromClassList("hidden");
            dbSetupButton?.SetEnabled(false);

            try
            {
                ToolkitLogger.Log("EditorServerWindow", "Setup Wizard 시작 (재설치)...");

                var result = await setupWizard.RunSetupAsync(currentDbConfig);

                if (result.Success)
                {
                    ShowSetupSuccess("✅ 데이터베이스 재설치 완료!\n\n모든 과정이 성공적으로 완료되었습니다.");
                    ToolkitLogger.Log("EditorServerWindow", "Setup Wizard 완료 (재설치).");

                    // Setup Status 재확인
                    await UniTask.Delay(1000);
                    CheckSetupStatusAsync().Forget();

                    // Database Enable 자동 활성화
                    if (dbEnableToggle != null)
                    {
                        dbEnableToggle.value = true;
                    }
                }
                else
                {
                    ShowSetupError($"❌ 재설치 실패:\n\n{result.ErrorMessage}");
                    ToolkitLogger.LogError("EditorServerWindow", $" Setup Wizard 실패: {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                ShowSetupError($"❌ 재설치 중 예외:\n\n{ex.Message}");
                ToolkitLogger.LogError("EditorServerWindow", $" Setup Wizard 예외: {ex.Message}");
            }
            finally
            {
                // Progress 숨기기
                dbSetupProgressContainer?.AddToClassList("hidden");
                dbSetupButton?.SetEnabled(true);
            }
        }

        /// <summary>
        /// Setup 메시지 숨기기
        /// </summary>
        private void HideSetupMessages()
        {
            dbSetupInfoHelp?.AddToClassList("hidden");
            dbSetupSuccessHelp?.AddToClassList("hidden");
            dbSetupErrorHelp?.AddToClassList("hidden");
        }

        /// <summary>
        /// Setup 성공 메시지 표시
        /// </summary>
        private void ShowSetupSuccess(string message)
        {
            if (dbSetupSuccessHelp != null)
            {
                dbSetupSuccessHelp.text = message;
                dbSetupSuccessHelp.RemoveFromClassList("hidden");
            }

            dbSetupInfoHelp?.AddToClassList("hidden");
            dbSetupErrorHelp?.AddToClassList("hidden");
        }

        /// <summary>
        /// Setup 에러 메시지 표시
        /// </summary>
        private void ShowSetupError(string message)
        {
            if (dbSetupErrorHelp != null)
            {
                dbSetupErrorHelp.text = message;
                dbSetupErrorHelp.RemoveFromClassList("hidden");
            }

            dbSetupInfoHelp?.AddToClassList("hidden");
            dbSetupSuccessHelp?.AddToClassList("hidden");
        }
        #endregion

        #region Public API for DatabaseStatusWindow
        private DatabaseStatusWindow _statusWindow;

        /// <summary>
        /// Database Status 윈도우 열기
        /// </summary>
        private void OpenDatabaseStatusWindow()
        {
            if (_statusWindow == null)
            {
                _statusWindow = DatabaseStatusWindow.Open(this);
            }
            else
            {
                _statusWindow.Focus();
                _statusWindow.UpdateUI();
            }
        }

        /// <summary>
        /// 연결 상태 확인
        /// </summary>
        public bool IsConnected
        {
            get { return DatabaseManager.Instance.IsConnected; }
        }

        /// <summary>
        /// 동기화 상태 확인
        /// </summary>
        public bool IsSyncing
        {
            get { return DatabaseManager.Instance.SyncManager != null && DatabaseManager.Instance.SyncManager.IsRunning; }
        }

        /// <summary>
        /// Undo 스택 크기
        /// </summary>
        public int UndoCount
        {
            get { return DatabaseManager.Instance.CommandHistory?.UndoCount ?? 0; }
        }

        /// <summary>
        /// Redo 스택 크기
        /// </summary>
        public int RedoCount
        {
            get { return DatabaseManager.Instance.CommandHistory?.RedoCount ?? 0; }
        }

        /// <summary>
        /// 데이터베이스 파일 존재 여부
        /// </summary>
        public bool DatabaseFileExists()
        {
            return System.IO.File.Exists(currentDbConfig?.DatabaseFilePath);
        }

        /// <summary>
        /// 연결 테스트 (DatabaseStatusWindow용)
        /// </summary>
        public void TestConnection()
        {
            TestDatabaseConnectionAsync().Forget();
        }

        /// <summary>
        /// 데이터베이스 연결 (DatabaseStatusWindow용)
        /// </summary>
        public void Connect()
        {
            ConnectDatabaseAsync().Forget();
        }

        /// <summary>
        /// 데이터베이스 연결 해제 (DatabaseStatusWindow용)
        /// </summary>
        public void Disconnect()
        {
            DisconnectDatabaseAsync().Forget();
        }

        /// <summary>
        /// 마이그레이션 실행 (DatabaseStatusWindow용)
        /// </summary>
        public void RunMigrations()
        {
            RunDatabaseMigrationsAsync().Forget();
        }

        /// <summary>
        /// 동기화 토글 (DatabaseStatusWindow용)
        /// </summary>
        public void ToggleSync()
        {
            ToggleDatabaseSyncAsync().Forget();
        }

        /// <summary>
        /// Undo 실행 (DatabaseStatusWindow용)
        /// </summary>
        public void Undo()
        {
            UndoAsync().Forget();
        }

        /// <summary>
        /// Redo 실행 (DatabaseStatusWindow용)
        /// </summary>
        public void Redo()
        {
            RedoAsync().Forget();
        }

        /// <summary>
        /// 명령 히스토리 삭제 (DatabaseStatusWindow용)
        /// </summary>
        public void ClearHistory()
        {
            ClearHistoryAsync().Forget();
        }

        /// <summary>
        /// 에러 메시지 가져오기
        /// </summary>
        public string GetErrorMessage()
        {
            if (dbErrorHelp != null && !dbErrorHelp.ClassListContains("hidden"))
            {
                return dbErrorHelp.text;
            }
            return string.Empty;
        }

        /// <summary>
        /// 성공 메시지 가져오기
        /// </summary>
        public string GetSuccessMessage()
        {
            if (dbSuccessHelp != null && !dbSuccessHelp.ClassListContains("hidden"))
            {
                return dbSuccessHelp.text;
            }
            return string.Empty;
        }
        #endregion
    }
}
