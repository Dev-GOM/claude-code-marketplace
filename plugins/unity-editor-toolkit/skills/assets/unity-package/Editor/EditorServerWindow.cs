using UnityEngine;
using UnityEditor;
using UnityEngine.UIElements;
using UnityEditorToolkit.Editor.Server;
using UnityEditorToolkit.Editor.Attributes;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Utils;
using Cysharp.Threading.Tasks;
using System.IO;
using UnityEditor.Callbacks;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Editor window for Unity Editor Toolkit Server (UI Toolkit version)
    /// </summary>
    public partial class EditorServerWindow : EditorWindow
    {
        private EditorWebSocketServer server => EditorWebSocketServer.Instance;
        private EditorServerCLIInstaller cliInstaller;
        private VersionChecker versionChecker;

        // Data binding source
        private EditorServerWindowData windowData = new EditorServerWindowData();

        private bool wasPlaying = false;
        private float lastUpdateTime = 0f;
        private bool hasNodeJS = false;

        private const string PREF_KEY_PLUGIN_PATH = "UnityEditorToolkit.PluginScriptsPath";
        private const float UI_UPDATE_INTERVAL_SECONDS = 0.5f;

        // UI Elements
        private VisualElement statusIndicator;
        private Label serverStatusLabel;
        private Label serverPortLabel;
        private Label connectedClientsLabel;
        private Toggle autostartToggle;
        private EnumField logLevelDropdown;
        private Button startButton;
        private Button stopButton;

        private VisualElement nodejsMissingSection;
        private VisualElement cliStatusSection;
        private Label packageVersionLabel;
        private Label cliVersionLabel;

        // Status messages
        private HelpBox installProgressHelp;
        private HelpBox notInstalledHelp;
        private HelpBox updateMinorHelp;
        private HelpBox updateMajorHelp;
        private HelpBox upToDateHelp;

        // Buttons
        private Button installButton;
        private Button updateButton;
        private Button reinstallButton;
        private Button clearLockButton;

        // Installation
        private HelpBox installingMessage;
        private VisualElement installLogContainer;
        private TextField installLogField;
        private TextField pluginPathField;

        // Version check
        private Button checkVersionButton;
        private Button openReleasesButton;
        private HelpBox versionUpdateHelp;
        private HelpBox versionUpToDateHelp;
        private HelpBox versionErrorHelp;

        [MenuItem("Tools/Unity Editor Toolkit/Server Window")]
        public static void ShowWindow()
        {
            var window = GetWindow<EditorServerWindow>("Editor Server");
            window.minSize = new Vector2(400, 300);
            window.Show();
        }

        private void OnEnable()
        {
            // Initialize CLI installer
            string pathOverride = EditorPrefs.GetString(PREF_KEY_PLUGIN_PATH, null);
            cliInstaller = new EditorServerCLIInstaller(pathOverride);

            // Initialize version checker
            versionChecker = new VersionChecker();
            versionChecker.OnVersionCheckComplete += OnVersionCheckComplete;
            versionChecker.GetLocalVersion();

            // Check Node.js installation
            hasNodeJS = EditorServerCommandRunner.CheckNodeInstallation();

            // Check CLI version
            if (hasNodeJS)
            {
                cliInstaller.CheckVersion();
            }
        }

        private void OnServerStartedHandler()
        {
            // Auto-reconnect database if it was previously connected
            if (EditorPrefs.GetBool("UnityEditorToolkit.Database.AutoReconnect", false))
            {
                EditorPrefs.DeleteKey("UnityEditorToolkit.Database.AutoReconnect");

                // Reconnect using saved config
                string dbPath = EditorPrefs.GetString("UnityEditorToolkit.Database.Path", "");
                bool enableWAL = EditorPrefs.GetBool("UnityEditorToolkit.Database.EnableWAL", true);

                if (!string.IsNullOrEmpty(dbPath))
                {
                    var config = new DatabaseConfig
                    {
                        DatabaseFilePath = dbPath,
                        EnableWAL = enableWAL
                    };
                    DatabaseManager.Instance.InitializeAsync(config).Forget();
                    ToolkitLogger.Log("EditorServerWindow", "서버 시작 - 데이터베이스 자동 재연결");
                }
            }
            UpdateUI();
        }

        private void OnServerStoppedHandler()
        {
            // Save auto-reconnect flag before disconnecting
            if (DatabaseManager.Instance.IsConnected)
            {
                EditorPrefs.SetBool("UnityEditorToolkit.Database.AutoReconnect", true);
            }

            // Disconnect database when server stops
            DatabaseManager.Instance.Disconnect();
            UpdateUI();
        }

        public void CreateGUI()
        {
            // Load UXML
            var visualTree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(
                "Packages/com.devgom.unity-editor-toolkit/Editor/EditorServerWindow.uxml");

            if (visualTree == null)
            {
                var label = new Label("Error: Could not load EditorServerWindow.uxml");
                label.style.color = Color.red;
                rootVisualElement.Add(label);
                return;
            }

            visualTree.CloneTree(rootVisualElement);

            // Set data binding source
            rootVisualElement.dataSource = windowData;

            // Load USS
            var styleSheet = AssetDatabase.LoadAssetAtPath<StyleSheet>(
                "Packages/com.devgom.unity-editor-toolkit/Editor/EditorServerWindow.uss");

            if (styleSheet != null)
            {
                rootVisualElement.styleSheets.Add(styleSheet);
            }

            // Query all UI elements
            QueryUIElements();

            // Bind events
            BindEvents();

            // Initialize Database UI
            InitializeDatabaseUI();

            // Initial UI update
            UpdateUI();

            // Log initialization status (한 번에 출력)
            LogInitializationStatus();
        }

        private void QueryUIElements()
        {
            // Server section
            statusIndicator = rootVisualElement.Q<VisualElement>("status-indicator");
            serverStatusLabel = rootVisualElement.Q<Label>("server-status");
            serverPortLabel = rootVisualElement.Q<Label>("server-port");
            connectedClientsLabel = rootVisualElement.Q<Label>("connected-clients");
            autostartToggle = rootVisualElement.Q<Toggle>("autostart-toggle");
            logLevelDropdown = rootVisualElement.Q<EnumField>("log-level-dropdown");
            startButton = rootVisualElement.Q<Button>("start-button");
            stopButton = rootVisualElement.Q<Button>("stop-button");

            // CLI section
            nodejsMissingSection = rootVisualElement.Q<VisualElement>("nodejs-missing");
            cliStatusSection = rootVisualElement.Q<VisualElement>("cli-status");
            packageVersionLabel = rootVisualElement.Q<Label>("package-version");
            cliVersionLabel = rootVisualElement.Q<Label>("cli-version");

            // Status messages
            installProgressHelp = rootVisualElement.Q<HelpBox>("install-progress");
            notInstalledHelp = rootVisualElement.Q<HelpBox>("not-installed");
            updateMinorHelp = rootVisualElement.Q<HelpBox>("update-minor");
            updateMajorHelp = rootVisualElement.Q<HelpBox>("update-major");
            upToDateHelp = rootVisualElement.Q<HelpBox>("up-to-date");

            // Buttons
            installButton = rootVisualElement.Q<Button>("install-button");
            updateButton = rootVisualElement.Q<Button>("update-button");
            reinstallButton = rootVisualElement.Q<Button>("reinstall-button");
            clearLockButton = rootVisualElement.Q<Button>("clear-lock-button");

            // Installation
            installingMessage = rootVisualElement.Q<HelpBox>("installing-message");
            installLogContainer = rootVisualElement.Q<VisualElement>("install-log-container");
            installLogField = rootVisualElement.Q<TextField>("install-log");
            pluginPathField = rootVisualElement.Q<TextField>("plugin-path");

            // Version check section
            checkVersionButton = rootVisualElement.Q<Button>("check-version-button");
            openReleasesButton = rootVisualElement.Q<Button>("open-releases-button");
            versionUpdateHelp = rootVisualElement.Q<HelpBox>("version-update-help");
            versionUpToDateHelp = rootVisualElement.Q<HelpBox>("version-uptodate-help");
            versionErrorHelp = rootVisualElement.Q<HelpBox>("version-error-help");

            // Database section
            QueryDatabaseUIElements();
        }

        private void BindEvents()
        {
            // Server controls
            autostartToggle?.RegisterValueChangedCallback(evt => {
                server.AutoStart = evt.newValue;
            });

            // Initialize and bind log level dropdown
            if (logLevelDropdown != null)
            {
                logLevelDropdown.Init(server.CurrentLogLevel);
                logLevelDropdown.RegisterValueChangedCallback(evt => {
                    server.CurrentLogLevel = (ToolkitLogger.LogLevel)evt.newValue;
                });
            }

            startButton?.RegisterCallback<ClickEvent>(evt => server.StartServer());
            stopButton?.RegisterCallback<ClickEvent>(evt => server.StopServer());

            // Server state change events
            server.OnServerStarted += OnServerStartedHandler;
            server.OnServerStopped += OnServerStoppedHandler;

            // Node.js section
            var nodejsDownloadBtn = rootVisualElement.Q<Button>("nodejs-download-button");
            nodejsDownloadBtn?.RegisterCallback<ClickEvent>(evt =>
                Application.OpenURL("https://nodejs.org/"));

            var recheckNodejsBtn = rootVisualElement.Q<Button>("recheck-nodejs-button");
            recheckNodejsBtn?.RegisterCallback<ClickEvent>(evt => {
                hasNodeJS = EditorServerCommandRunner.CheckNodeInstallation();
                if (hasNodeJS) cliInstaller.CheckVersion();
                UpdateUI();
            });

            // CLI buttons
            installButton?.RegisterCallback<ClickEvent>(evt => InstallCLI());
            updateButton?.RegisterCallback<ClickEvent>(evt => InstallCLI());
            reinstallButton?.RegisterCallback<ClickEvent>(evt => InstallCLI());
            clearLockButton?.RegisterCallback<ClickEvent>(evt => {
                cliInstaller.ClearInstallationLock();
                UpdateUI();
            });

            // Path management
            var openPathBtn = rootVisualElement.Q<Button>("open-path-button");
            openPathBtn?.RegisterCallback<ClickEvent>(evt => {
                string path = EditorServerPathManager.FindPluginScriptsPath(
                    EditorPrefs.GetString(PREF_KEY_PLUGIN_PATH, null));
                if (!string.IsNullOrEmpty(path) && System.IO.Directory.Exists(path))
                {
                    EditorUtility.RevealInFinder(path);
                }
                else
                {
                    EditorUtility.DisplayDialog("Error", "Plugin scripts path not found.", "OK");
                }
            });

            var browsePathBtn = rootVisualElement.Q<Button>("browse-path-button");
            browsePathBtn?.RegisterCallback<ClickEvent>(evt => {
                string currentPath = EditorServerPathManager.FindPluginScriptsPath(
                    EditorPrefs.GetString(PREF_KEY_PLUGIN_PATH, null))
                    ?? EditorServerPathManager.GetDefaultPluginScriptsPath();

                string selectedPath = EditorUtility.OpenFolderPanel(
                    "Select Plugin Scripts Path",
                    System.IO.Path.GetDirectoryName(currentPath),
                    "");

                if (!string.IsNullOrEmpty(selectedPath))
                {
                    // Validate the path has package.json
                    if (System.IO.File.Exists(System.IO.Path.Combine(selectedPath, "package.json")))
                    {
                        EditorPrefs.SetString(PREF_KEY_PLUGIN_PATH, selectedPath);
                        cliInstaller = new EditorServerCLIInstaller(selectedPath);
                        cliInstaller.CheckVersion();
                        UpdateUI();
                    }
                    else
                    {
                        EditorUtility.DisplayDialog("Invalid Path",
                            "Selected folder does not contain package.json.\nPlease select the 'scripts' folder containing CLI scripts.",
                            "OK");
                    }
                }
            });

            var resetPathBtn = rootVisualElement.Q<Button>("reset-path-button");
            resetPathBtn?.RegisterCallback<ClickEvent>(evt => {
                EditorPrefs.DeleteKey(PREF_KEY_PLUGIN_PATH);
                cliInstaller = new EditorServerCLIInstaller(null);
                cliInstaller.CheckVersion();
                UpdateUI();
            });

            // Documentation
            var openDocsBtn = rootVisualElement.Q<Button>("open-docs-button");
            openDocsBtn?.RegisterCallback<ClickEvent>(evt => {
                Application.OpenURL("https://github.com/Dev-GOM/claude-code-marketplace/tree/main/plugins/unity-editor-toolkit");
            });

            // Version check
            checkVersionButton?.RegisterCallback<ClickEvent>(evt => CheckForUpdates());
            openReleasesButton?.RegisterCallback<ClickEvent>(evt => {
                Application.OpenURL("https://github.com/Dev-GOM/claude-code-marketplace/releases");
            });

            // Database section
            BindDatabaseEvents();
        }

        private void InstallCLI()
        {
            cliInstaller.InstallOrUpdate();
            UpdateUI();
        }

        private void UpdateUI()
        {
            if (rootVisualElement == null || serverStatusLabel == null) return;

            // Update version status
            UpdateVersionStatus();

            // Update server status
            UpdateServerStatus();

            // Update CLI status
            UpdateCLIStatus();

            // Update database status
            UpdateDatabaseUI();
        }

        private void UpdateVersionStatus()
        {
            if (versionChecker == null) return;

            // Update data properties
            windowData.LocalVersion = versionChecker.LocalVersion ?? "Unknown";
            windowData.LatestVersion = versionChecker.LatestVersion ?? "Not checked";
            windowData.IsCheckingVersion = versionChecker.IsChecking;
            windowData.UpdateAvailable = versionChecker.UpdateAvailable;

            if (versionChecker.LastChecked != default)
            {
                windowData.LastChecked = versionChecker.LastChecked.ToString("yyyy-MM-dd HH:mm:ss");
            }

            // Update help boxes
            versionUpdateHelp?.AddToClassList("hidden");
            versionUpToDateHelp?.AddToClassList("hidden");
            versionErrorHelp?.AddToClassList("hidden");

            if (!string.IsNullOrEmpty(versionChecker.ErrorMessage))
            {
                if (versionErrorHelp != null)
                {
                    versionErrorHelp.text = versionChecker.ErrorMessage;
                    versionErrorHelp.RemoveFromClassList("hidden");
                }
            }
            else if (versionChecker.LatestVersion != null && versionChecker.LatestVersion != "Not checked")
            {
                if (versionChecker.UpdateAvailable)
                {
                    if (versionUpdateHelp != null)
                    {
                        versionUpdateHelp.text = $"Update available: v{versionChecker.LocalVersion} -> v{versionChecker.LatestVersion}\nClick 'Open GitHub Releases' to download.";
                        versionUpdateHelp.RemoveFromClassList("hidden");
                    }
                }
                else
                {
                    versionUpToDateHelp?.RemoveFromClassList("hidden");
                }
            }

            // Update button state
            checkVersionButton?.SetEnabled(!versionChecker.IsChecking);
        }

        private async void CheckForUpdates()
        {
            if (versionChecker == null || versionChecker.IsChecking) return;

            windowData.IsCheckingVersion = true;
            UpdateVersionStatus();

            await versionChecker.CheckForUpdatesAsync();
        }

        private void OnVersionCheckComplete()
        {
            // Schedule UI update on main thread
            EditorApplication.delayCall += () =>
            {
                UpdateVersionStatus();
            };
        }

        private void UpdateServerStatus()
        {
            // Update data properties (UI auto-updates via data binding)
            windowData.ServerIsRunning = server.IsRunning;
            windowData.ServerPort = server.Port;
            windowData.ConnectedClients = server.ConnectedClients;
            windowData.AutoStart = server.AutoStart;

            // Update status indicator classes (CSS classes cannot be bound)
            if (statusIndicator != null)
            {
                statusIndicator.RemoveFromClassList("status-stopped");
                statusIndicator.RemoveFromClassList("status-running");
                statusIndicator.AddToClassList(server.IsRunning ? "status-running" : "status-stopped");
            }

            // Update button states (not bound to data)
            autostartToggle.SetEnabled(!server.IsRunning);
            startButton.SetEnabled(!server.IsRunning);
            stopButton.SetEnabled(server.IsRunning);
        }

        private void UpdateCLIStatus()
        {
            bool installInProgress = cliInstaller.IsInstallationInProgress();

            // Show/hide Node.js sections
            if (!hasNodeJS)
            {
                nodejsMissingSection?.RemoveFromClassList("hidden");
                cliStatusSection?.AddToClassList("hidden");
                return;
            }

            nodejsMissingSection?.AddToClassList("hidden");
            cliStatusSection?.RemoveFromClassList("hidden");

            // Update version data (UI auto-updates via data binding)
            windowData.PackageVersion = cliInstaller.PluginVersion ?? "Unknown";
            windowData.CLIVersion = cliInstaller.LocalCLIVersion != null
                ? $"✅ {cliInstaller.LocalCLIVersion}"
                : "❌ Not Installed";

            // Hide all status messages first
            installProgressHelp?.AddToClassList("hidden");
            notInstalledHelp?.AddToClassList("hidden");
            updateMinorHelp?.AddToClassList("hidden");
            updateMajorHelp?.AddToClassList("hidden");
            upToDateHelp?.AddToClassList("hidden");

            // Show appropriate status message
            if (installInProgress)
            {
                installProgressHelp?.RemoveFromClassList("hidden");
            }
            else if (cliInstaller.LocalCLIVersion == null)
            {
                notInstalledHelp?.RemoveFromClassList("hidden");
            }
            else if (cliInstaller.UpdateAvailable)
            {
                bool isMinorUpdate = EditorServerCLIInstaller.IsMinorVersionDifference(
                    cliInstaller.LocalCLIVersion, cliInstaller.HomeCLIVersion);

                if (isMinorUpdate)
                {
                    if (updateMinorHelp != null)
                    {
                        updateMinorHelp.text = $"CLI update available: {cliInstaller.LocalCLIVersion} → {cliInstaller.HomeCLIVersion}\n(Minor update, current version still works)";
                        updateMinorHelp.RemoveFromClassList("hidden");
                    }
                }
                else
                {
                    if (updateMajorHelp != null)
                    {
                        updateMajorHelp.text = $"CLI update available: {cliInstaller.LocalCLIVersion} → {cliInstaller.HomeCLIVersion}\n(Recommended to update)";
                        updateMajorHelp.RemoveFromClassList("hidden");
                    }
                }
            }
            else
            {
                upToDateHelp?.RemoveFromClassList("hidden");
            }

            // Button visibility
            UpdateButtonVisibility(installInProgress);

            // Installation progress
            if (cliInstaller.IsInstalling)
            {
                installingMessage?.RemoveFromClassList("hidden");
            }
            else
            {
                installingMessage?.AddToClassList("hidden");
            }

            // Installation log (only on error)
            UpdateInstallLog();

            // Plugin path
            UpdatePluginPath();
        }

        private void UpdateButtonVisibility(bool installInProgress)
        {
            // Hide all buttons first
            installButton?.AddToClassList("hidden");
            updateButton?.AddToClassList("hidden");
            reinstallButton?.AddToClassList("hidden");
            clearLockButton?.AddToClassList("hidden");

            bool canInstall = !cliInstaller.IsInstalling && !installInProgress;

            // Show appropriate button
            if (cliInstaller.LocalCLIVersion == null)
            {
                installButton?.RemoveFromClassList("hidden");
                installButton?.SetEnabled(canInstall);
            }
            else if (cliInstaller.UpdateAvailable)
            {
                updateButton?.RemoveFromClassList("hidden");
                updateButton?.SetEnabled(canInstall);
            }
            else
            {
                reinstallButton?.RemoveFromClassList("hidden");
                reinstallButton?.SetEnabled(canInstall);
            }

            if (installInProgress)
            {
                clearLockButton?.RemoveFromClassList("hidden");
            }
        }

        private void UpdateInstallLog()
        {
            if (string.IsNullOrEmpty(cliInstaller.InstallLog))
            {
                installLogContainer?.AddToClassList("hidden");
                return;
            }

            // Check if log contains error
            string logLower = cliInstaller.InstallLog.ToLower();
            bool hasError = logLower.Contains("error") ||
                           logLower.Contains("failed") ||
                           logLower.Contains("exception") ||
                           logLower.Contains("cannot find") ||
                           logLower.Contains("command not found");

            if (hasError)
            {
                installLogContainer?.RemoveFromClassList("hidden");
                if (installLogField != null)
                    installLogField.value = cliInstaller.InstallLog;
            }
            else
            {
                installLogContainer?.AddToClassList("hidden");
            }
        }

        private void UpdatePluginPath()
        {
            if (pluginPathField == null) return;

            string pathOverride = EditorPrefs.GetString(PREF_KEY_PLUGIN_PATH, null);
            string displayPath = EditorServerPathManager.FindPluginScriptsPath(pathOverride)
                              ?? EditorServerPathManager.GetDefaultPluginScriptsPath();
            pluginPathField.value = displayPath;
        }

        private void Update()
        {
            bool needsUpdate = false;

            // Play Mode state change detection
            if (Application.isPlaying != wasPlaying)
            {
                wasPlaying = Application.isPlaying;
                needsUpdate = true;
            }

            // Periodic update
            float currentTime = (float)EditorApplication.timeSinceStartup;
            if (currentTime - lastUpdateTime > UI_UPDATE_INTERVAL_SECONDS)
            {
                lastUpdateTime = currentTime;
                needsUpdate = true;
            }

            // Update UI when needed
            if (needsUpdate)
            {
                UpdateUI();
            }
        }

        private void LogInitializationStatus()
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            sb.AppendLine("✓ Unity Editor Toolkit - Initialized");
            sb.AppendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // Node.js 상태
            if (hasNodeJS)
            {
                string nodeVersion = EditorServerCommandRunner.GetNodeVersion();
                sb.AppendLine($"  Node.js: {nodeVersion}");
            }
            else
            {
                sb.AppendLine("  Node.js: Not installed");
            }

            // CLI 상태
            if (cliInstaller != null)
            {
                string cliVersion = cliInstaller.LocalCLIVersion;
                sb.AppendLine($"  CLI Version: {(string.IsNullOrEmpty(cliVersion) ? "Not installed" : cliVersion)}");
            }

            // Database 상태
            if (currentDbConfig != null)
            {
                sb.AppendLine($"  Database: {(currentDbConfig.EnableDatabase ? "Enabled" : "Disabled")}");
                if (currentDbConfig.EnableDatabase)
                {
                    sb.AppendLine($"    - WAL Mode: {(currentDbConfig.EnableWAL ? "Enabled" : "Disabled")}");
                    sb.AppendLine($"    - File Path: {currentDbConfig.DatabaseFilePath}");
                }
            }

            // Server 상태
            sb.AppendLine($"  WebSocket Server: {(server.IsRunning ? $"Running (Port {server.Port})" : "Stopped")}");

            sb.AppendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            ToolkitLogger.Log("EditorServerWindow", sb.ToString());
        }

        #region Executable Methods (CLI)

        /// <summary>
        /// Reinstall Unity Editor Toolkit CLI (executable via CLI)
        /// </summary>
        [ExecutableMethod("reinstall-cli", "Reinstall Unity Editor Toolkit CLI")]
        public static void ReinstallCLI()
        {
            var window = GetWindow<EditorServerWindow>("Unity Editor Toolkit");
            if (window == null)
            {
                ToolkitLogger.LogError("EditorServerWindow", "Failed to get window instance for CLI reinstall");
                throw new System.Exception("Failed to get Unity Editor Toolkit window instance");
            }

            if (window.cliInstaller == null)
            {
                ToolkitLogger.LogError("EditorServerWindow", "CLI installer is not initialized");
                throw new System.Exception("CLI installer is not initialized");
            }

            ToolkitLogger.Log("EditorServerWindow", "Reinstalling CLI via execute command...");
            window.cliInstaller.InstallOrUpdate();
        }

        #endregion

        private void OnDisable()
        {
            // Unsubscribe from server events
            if (server != null)
            {
                server.OnServerStarted -= OnServerStartedHandler;
                server.OnServerStopped -= OnServerStoppedHandler;
            }

            // Unsubscribe from version checker events
            if (versionChecker != null)
            {
                versionChecker.OnVersionCheckComplete -= OnVersionCheckComplete;
            }

            // UI Toolkit automatically cleans up event handlers when the window closes
            // Clear any references to prevent potential memory leaks
            statusIndicator = null;
            serverStatusLabel = null;
            serverPortLabel = null;
            connectedClientsLabel = null;
            autostartToggle = null;
            startButton = null;
            stopButton = null;
            nodejsMissingSection = null;
            cliStatusSection = null;
            packageVersionLabel = null;
            cliVersionLabel = null;
            installProgressHelp = null;
            notInstalledHelp = null;
            updateMinorHelp = null;
            updateMajorHelp = null;
            upToDateHelp = null;
            installButton = null;
            updateButton = null;
            reinstallButton = null;
            clearLockButton = null;
            installingMessage = null;
            installLogContainer = null;
            installLogField = null;
            pluginPathField = null;

            // Version check section cleanup
            checkVersionButton = null;
            openReleasesButton = null;
            versionUpdateHelp = null;
            versionUpToDateHelp = null;
            versionErrorHelp = null;

            // Database section cleanup
            CleanupDatabaseUI();
        }
    }
}
