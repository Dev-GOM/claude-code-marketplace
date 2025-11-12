using UnityEngine;
using UnityEditor;
using UnityEditorToolkit.Server;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System;
using System.Text;
using System.Linq;

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

        // Constants
        private const int LockFileStaleMinutes = 10;
        private const int ProcessKillWaitTimeoutMs = 5000; // 5 seconds
        private const int NpmInstallTimeoutSeconds = 30;
        private const int NpmBuildTimeoutSeconds = 120; // 2 minutes
        private const int DefaultCommandTimeoutSeconds = 120; // 2 minutes
        private const string PREF_KEY_PLUGIN_PATH = "UnityEditorToolkit.PluginScriptsPath";

        // CLI management
        private string pluginVersion = null;
        private string localCLIVersion = null;
        private bool cliUpdateAvailable = false;
        private bool isInstallingCLI = false;
        private string cliInstallLog = "";
        private bool hasNodeJS = false;
        private string pluginScriptsPathOverride = null;

        [MenuItem("Tools/Unity Editor Toolkit/Server Window")]
        public static void ShowWindow()
        {
            var window = GetWindow<EditorServerWindow>("Editor Server");
            window.minSize = new Vector2(400, 300);
            window.Show();
        }

        private void OnEnable()
        {
            FindOrCreateServer();
            hasNodeJS = CheckNodeInstallation();
            pluginScriptsPathOverride = EditorPrefs.GetString(PREF_KEY_PLUGIN_PATH, "");
            CheckCLIVersion();
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(10);

            // Header
            GUILayout.Label("Unity Editor Toolkit Server", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            // CLI Status Section
            DrawCLIStatusSection();

            EditorGUILayout.Space(10);

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
                        "• Default Port: 9500\n" +
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

        private void DrawCLIStatusSection()
        {
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            {
                GUILayout.Label("CLI Scripts", EditorStyles.boldLabel);
                EditorGUILayout.Space(5);

                // Node.js check first
                if (!hasNodeJS)
                {
                    EditorGUILayout.HelpBox(
                        "Node.js is not installed or not in PATH.\n\n" +
                        "Please install Node.js from https://nodejs.org/\n" +
                        "Recommended version: 18.x or higher\n\n" +
                        "After installation, restart Unity Editor.",
                        MessageType.Error
                    );

                    if (GUILayout.Button("Open Node.js Download Page", GUILayout.Height(30)))
                    {
                        Application.OpenURL("https://nodejs.org/");
                    }

                    if (GUILayout.Button("Recheck Node.js Installation", GUILayout.Height(25)))
                    {
                        hasNodeJS = CheckNodeInstallation();
                        if (hasNodeJS)
                        {
                            CheckCLIVersion();
                        }
                        Repaint();
                    }
                }
                else
                {
                    // Version info
                    EditorGUILayout.LabelField("Package Version:", pluginVersion ?? "Unknown");
                    EditorGUILayout.LabelField("Local CLI Version:", localCLIVersion ?? "Not Installed");

                    EditorGUILayout.Space(5);

                    // Check for installation in progress (file-based lock)
                    bool installInProgress = IsInstallationInProgress();

                    // Status message
                    if (installInProgress)
                    {
                        EditorGUILayout.HelpBox(
                            "CLI installation is in progress...\n" +
                            "If this persists for more than 10 minutes, click 'Clear Lock' below.",
                            MessageType.Info
                        );
                    }
                    else if (localCLIVersion == null)
                    {
                        EditorGUILayout.HelpBox("CLI scripts not installed. Click 'Install CLI Scripts' to set up.", MessageType.Warning);
                    }
                    else if (cliUpdateAvailable)
                    {
                        bool isMinorUpdate = IsMinorVersionDifference(localCLIVersion, pluginVersion);
                        if (isMinorUpdate)
                        {
                            EditorGUILayout.HelpBox($"CLI update available: {localCLIVersion} → {pluginVersion}\n(Minor update, current version still works)", MessageType.Info);
                        }
                        else
                        {
                            EditorGUILayout.HelpBox($"CLI update available: {localCLIVersion} → {pluginVersion}\n(Recommended to update)", MessageType.Warning);
                        }
                    }
                    else
                    {
                        EditorGUILayout.HelpBox("CLI scripts up-to-date ✓", MessageType.Info);
                    }

                    EditorGUILayout.Space(5);

                    // Action buttons
                    EditorGUI.BeginDisabledGroup(isInstallingCLI || installInProgress);
                    {
                        if (localCLIVersion == null)
                        {
                            if (GUILayout.Button("Install CLI Scripts", GUILayout.Height(30)))
                            {
                                InstallOrUpdateCLI();
                            }
                        }
                        else if (cliUpdateAvailable)
                        {
                            if (GUILayout.Button("⚠️ Update CLI Scripts", GUILayout.Height(30)))
                            {
                                InstallOrUpdateCLI();
                            }
                        }
                        else
                        {
                            if (GUILayout.Button("Reinstall CLI Scripts", GUILayout.Height(25)))
                            {
                                InstallOrUpdateCLI();
                            }
                        }
                    }
                    EditorGUI.EndDisabledGroup();

                    // Clear stale lock button
                    if (installInProgress)
                    {
                        EditorGUILayout.Space(5);
                        if (GUILayout.Button("Clear Lock (if installation stuck)", GUILayout.Height(25)))
                        {
                            ClearInstallationLock();
                            Repaint();
                        }
                    }

                    // Installation progress
                    if (isInstallingCLI)
                    {
                        EditorGUILayout.Space(5);
                        EditorGUILayout.HelpBox("Installing CLI scripts...\nPlease wait, this may take a few minutes.", MessageType.Info);
                    }

                    // Show install log if available
                    if (!string.IsNullOrEmpty(cliInstallLog))
                    {
                        EditorGUILayout.Space(5);
                        EditorGUILayout.LabelField("Last Installation Log:", EditorStyles.boldLabel);
                        EditorGUILayout.TextArea(cliInstallLog, GUILayout.Height(100));
                    }

                    // Plugin Scripts Path Configuration
                    EditorGUILayout.Space(10);
                    EditorGUILayout.LabelField("Plugin Scripts Path", EditorStyles.boldLabel);

                    string currentPath = string.IsNullOrEmpty(pluginScriptsPathOverride)
                        ? GetDefaultPluginScriptsPath()
                        : pluginScriptsPathOverride;

                    EditorGUILayout.BeginHorizontal();
                    GUI.enabled = false;
                    EditorGUILayout.TextField(currentPath);
                    GUI.enabled = true;

                    if (GUILayout.Button("Browse", GUILayout.Width(80)))
                    {
                        string selected = EditorUtility.OpenFolderPanel(
                            "Select Plugin Scripts Folder",
                            currentPath,
                            "");

                        if (!string.IsNullOrEmpty(selected))
                        {
                            pluginScriptsPathOverride = selected;
                            EditorPrefs.SetString(PREF_KEY_PLUGIN_PATH, selected);
                            CheckCLIVersion(); // Recheck with new path
                            Repaint();
                        }
                    }

                    if (GUILayout.Button("Reset", GUILayout.Width(80)))
                    {
                        pluginScriptsPathOverride = "";
                        EditorPrefs.DeleteKey(PREF_KEY_PLUGIN_PATH);
                        CheckCLIVersion(); // Recheck with default path
                        Repaint();
                    }
                    EditorGUILayout.EndHorizontal();

                    // Path validation
                    bool pathValid = Directory.Exists(currentPath) &&
                                     File.Exists(Path.Combine(currentPath, "package.json"));

                    if (pathValid)
                    {
                        EditorGUILayout.HelpBox("✓ Valid plugin scripts path", MessageType.Info);
                    }
                    else
                    {
                        EditorGUILayout.HelpBox(
                            "❌ Invalid path. CLI installation will fail.\n\n" +
                            "Default path: " + GetDefaultPluginScriptsPath() + "\n\n" +
                            "Click 'Browse' to select the correct plugin scripts folder.",
                            MessageType.Error);
                    }
                }
            }
            EditorGUILayout.EndVertical();
        }

        private bool CheckNodeInstallation()
        {
            try
            {
                string nodeCommand = Application.platform == RuntimePlatform.WindowsEditor ? "node.exe" : "node";
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = nodeCommand,
                    Arguments = "--version",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (Process process = Process.Start(startInfo))
                {
                    process.WaitForExit(ProcessKillWaitTimeoutMs);
                    if (process.ExitCode == 0)
                    {
                        string version = process.StandardOutput.ReadToEnd().Trim();
                        UnityEngine.Debug.Log($"Unity Editor Toolkit: Node.js detected: {version}");
                        return true;
                    }
                }
            }
            catch (Exception)
            {
                return false;
            }

            return false;
        }

        private bool IsInstallationInProgress()
        {
            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            string lockFile = Path.Combine(projectRoot, ".unity-websocket", ".install.lock");

            if (!File.Exists(lockFile))
            {
                return false;
            }

            // Check if lock is stale
            if (IsLockStale(lockFile))
            {
                UnityEngine.Debug.LogWarning("Unity Editor Toolkit: Removing stale installation lock");
                try
                {
                    File.Delete(lockFile);
                }
                catch (Exception e)
                {
                    UnityEngine.Debug.LogError($"Unity Editor Toolkit: Failed to delete stale lock: {e.Message}");
                }
                return false;
            }

            return true;
        }

        private bool IsLockStale(string lockPath)
        {
            try
            {
                string[] lines = File.ReadAllLines(lockPath);
                if (lines.Length < 2) return true; // Invalid format, assume stale

                // 1. Check if process is a running Unity instance
                if (int.TryParse(lines[0], out int pid))
                {
                    // Validate PID is in valid range
                    if (pid <= 0)
                    {
                        UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Invalid PID in lock file: {pid}");
                        return true;
                    }

                    // Check if this is our own lock
                    int currentPID = System.Diagnostics.Process.GetCurrentProcess().Id;
                    if (pid == currentPID)
                    {
                        return false; // Our own lock, always valid
                    }

                    try
                    {
                        Process process = Process.GetProcessById(pid);

                        // Check if process has exited (race condition safety)
                        if (process.HasExited)
                        {
                            return true; // Process has exited, stale
                        }

                        // More precise Unity process detection
                        string processName = process.ProcessName.ToLower();
                        bool isUnityEditor = processName.Contains("unity") && !processName.Contains("unityhub");

                        if (isUnityEditor)
                        {
                            return false; // Process alive and is Unity Editor, lock is valid
                        }

                        UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Lock held by non-Unity process: {process.ProcessName}");
                        return true; // Process exists but is not Unity Editor, lock is stale
                    }
                    catch (ArgumentException) { return true; /* Process not found, stale */ }
                    catch (InvalidOperationException) { return true; /* Process has exited, stale */ }
                    catch (Exception ex)
                    {
                        UnityEngine.Debug.LogWarning($"Error checking process lock (PID {pid}), falling back to timestamp: {ex.Message}");
                    }
                }
                else
                {
                    UnityEngine.Debug.LogWarning("Unity Editor Toolkit: Failed to parse PID from lock file");
                }

                // 2. Fallback to timestamp written inside the lock file
                if (DateTime.TryParse(lines[1], out DateTime lockTimestamp))
                {
                    // Validate timestamp is not in the future
                    if (lockTimestamp > DateTime.Now.AddMinutes(1))
                    {
                        UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Lock timestamp is in the future: {lockTimestamp}");
                        return true;
                    }

                    if ((DateTime.Now - lockTimestamp).TotalMinutes > LockFileStaleMinutes)
                    {
                        return true; // Stale by time
                    }
                }
                else
                {
                    UnityEngine.Debug.LogWarning("Unity Editor Toolkit: Failed to parse timestamp from lock file");
                    return true; // Unreadable timestamp, assume stale
                }

                // If process check was inconclusive but timestamp is recent, assume lock is valid to be safe.
                return false;
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Error reading lock file: {e.Message}");
                return true; // Can't read lock, assume stale for recovery
            }
        }

        private void ClearInstallationLock()
        {
            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            string lockFile = Path.Combine(projectRoot, ".unity-websocket", ".install.lock");

            if (File.Exists(lockFile))
            {
                try
                {
                    File.Delete(lockFile);
                    UnityEngine.Debug.Log("Unity Editor Toolkit: Installation lock cleared");
                    EditorUtility.DisplayDialog("Lock Cleared", "Installation lock has been cleared.\nYou can now retry installation.", "OK");
                }
                catch (Exception e)
                {
                    UnityEngine.Debug.LogError($"Unity Editor Toolkit: Failed to clear lock: {e.Message}");
                    EditorUtility.DisplayDialog("Error", $"Failed to clear lock:\n{e.Message}", "OK");
                }
            }
        }

        private void CheckCLIVersion()
        {
            // Get plugin version from package.json
            pluginVersion = GetPluginVersion();

            // Get local CLI version
            localCLIVersion = GetLocalCLIVersion();

            // Check if update is available
            cliUpdateAvailable = (pluginVersion != null && localCLIVersion != null && pluginVersion != localCLIVersion);
        }

        private bool IsMinorVersionDifference(string v1, string v2)
        {
            try
            {
                var parts1 = v1.Split('.');
                var parts2 = v2.Split('.');

                if (parts1.Length >= 2 && parts2.Length >= 2)
                {
                    // Same major and minor version? (only patch different)
                    return parts1[0] == parts2[0] && parts1[1] == parts2[1];
                }
            }
            catch (Exception)
            {
                return false;
            }

            return false;
        }

        private string GetPluginVersion()
        {
            try
            {
                // Find package.json in the Unity Package
                string packagePath = FindPackageJsonPath();
                if (string.IsNullOrEmpty(packagePath) || !File.Exists(packagePath))
                {
                    UnityEngine.Debug.LogWarning("Unity Editor Toolkit: package.json not found");
                    return null;
                }

                string json = File.ReadAllText(packagePath);
                return ExtractVersionFromJson(json);
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogError($"Unity Editor Toolkit: Failed to read plugin version: {e.Message}");
                return null;
            }
        }

        private string GetLocalCLIVersion()
        {
            try
            {
                string projectRoot = Path.GetDirectoryName(Application.dataPath);
                string localPackageJson = Path.Combine(projectRoot, ".unity-websocket", "skills", "scripts", "package.json");

                if (!File.Exists(localPackageJson))
                {
                    return null;
                }

                string json = File.ReadAllText(localPackageJson);
                return ExtractVersionFromJson(json);
            }
            catch (Exception)
            {
                return null;
            }
        }

        private string ExtractVersionFromJson(string json)
        {
            // Simple regex to extract version (avoiding full JSON parser)
            Match match = Regex.Match(json, @"""version""\s*:\s*""([^""]+)""");
            return match.Success ? match.Groups[1].Value : null;
        }

        private string FindPackageJsonPath()
        {
            // Try to find the package.json in various locations
            string[] searchPaths = new string[]
            {
                // Installed via Package Manager
                "Packages/com.devgom.unity-editor-toolkit/package.json",
                // Installed in Assets
                "Assets/UnityEditorToolkit/package.json",
                "Assets/Packages/UnityEditorToolkit/package.json"
            };

            string projectRoot = Path.GetDirectoryName(Application.dataPath);

            foreach (string relativePath in searchPaths)
            {
                string fullPath = Path.Combine(projectRoot, relativePath);
                if (File.Exists(fullPath))
                {
                    return fullPath;
                }
            }

            return null;
        }

        private bool CheckDiskSpace(string path, long requiredMB = 500)
        {
            try
            {
                DriveInfo drive = new DriveInfo(Path.GetPathRoot(path));
                long availableMB = drive.AvailableFreeSpace / (1024 * 1024);

                if (availableMB < requiredMB)
                {
                    cliInstallLog += $"⚠️  Low disk space: {availableMB}MB available, {requiredMB}MB recommended\n";
                    return false;
                }

                return true;
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Could not check disk space: {e.Message}");
                return true; // Proceed anyway
            }
        }

        private bool CheckWritePermission(string directory)
        {
            try
            {
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Test write permission
                string testFile = Path.Combine(directory, ".writetest");
                File.WriteAllText(testFile, "test");
                File.Delete(testFile);
                return true;
            }
            catch (UnauthorizedAccessException)
            {
                return false;
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Write permission check failed: {e.Message}");
                return true; // Proceed and let it fail later with more context
            }
        }

        private bool AcquireLock(string lockPath, out string errorMessage)
        {
            errorMessage = null;

            // Check for stale lock first
            if (File.Exists(lockPath) && IsLockStale(lockPath))
            {
                UnityEngine.Debug.LogWarning("Unity Editor Toolkit: Removing stale installation lock before acquire");
                try
                {
                    File.Delete(lockPath);
                }
                catch (Exception e)
                {
                    errorMessage = $"Failed to remove stale lock: {e.Message}";
                    return false;
                }
            }

            DateTime startTime = DateTime.Now;
            int timeoutSeconds = NpmInstallTimeoutSeconds;

            while ((DateTime.Now - startTime).TotalSeconds < timeoutSeconds)
            {
                try
                {
                    // Try to create lock file exclusively
                    using (FileStream fs = File.Open(lockPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    {
                        int currentPID = Process.GetCurrentProcess().Id;
                        string lockContent = $"{currentPID}\n{DateTime.Now:yyyy-MM-dd HH:mm:ss}";
                        byte[] info = Encoding.UTF8.GetBytes(lockContent);
                        fs.Write(info, 0, info.Length);
                    }
                    return true;
                }
                catch (IOException)
                {
                    // Lock file exists, wait and retry
                    System.Threading.Thread.Sleep(500);
                }
                catch (Exception e)
                {
                    errorMessage = $"Lock acquisition failed: {e.Message}";
                    return false;
                }
            }

            errorMessage = "Another Unity instance is installing CLI scripts. Please wait and try again.";
            return false;
        }

        private void ReleaseLock(string lockPath)
        {
            try
            {
                if (File.Exists(lockPath))
                {
                    File.Delete(lockPath);
                }
            }
            catch (Exception e)
            {
                UnityEngine.Debug.LogWarning($"Unity Editor Toolkit: Failed to release lock: {e.Message}");
            }
        }

        private void InstallOrUpdateCLI()
        {
            isInstallingCLI = true;
            cliInstallLog = "";
            Repaint();

            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            string outputDir = Path.Combine(projectRoot, ".unity-websocket");
            string lockFile = Path.Combine(outputDir, ".install.lock");

            try
            {
                // Pre-flight checks
                cliInstallLog += "[Pre-flight] Running system checks...\n";

                // Check disk space
                if (!CheckDiskSpace(projectRoot, 500))
                {
                    bool proceed = EditorUtility.DisplayDialog("Low Disk Space",
                        "Less than 500MB available. Installation may fail.\n\nProceed anyway?",
                        "Yes", "No");

                    if (!proceed)
                    {
                        cliInstallLog += "❌ Installation cancelled by user (low disk space)\n";
                        return;
                    }
                }

                // Check write permission
                if (!CheckWritePermission(outputDir))
                {
                    EditorUtility.DisplayDialog("Permission Denied",
                        $"Cannot write to {outputDir}\n\n" +
                        "If using version control:\n" +
                        "• Check out the .unity-websocket folder\n" +
                        "• Or add it to .gitignore/.p4ignore",
                        "OK");
                    cliInstallLog += "❌ Write permission denied\n";
                    return;
                }

                // Acquire installation lock
                cliInstallLog += "[Pre-flight] Acquiring installation lock...\n";
                string lockError;
                if (!AcquireLock(lockFile, out lockError))
                {
                    EditorUtility.DisplayDialog("Installation In Progress", lockError ?? "Cannot acquire lock", "OK");
                    cliInstallLog += $"❌ {lockError}\n";
                    return;
                }

                cliInstallLog += "✓ Pre-flight checks passed\n\n";

                string skillsDir = Path.Combine(outputDir, "skills", "scripts");

                // Step 1: Create output directory
                cliInstallLog += "[1/5] Creating output directory...\n";
                if (!Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }

                // Create .gitignore
                string gitignorePath = Path.Combine(outputDir, ".gitignore");
                if (!File.Exists(gitignorePath))
                {
                    File.WriteAllText(gitignorePath, "# Unity WebSocket generated files\n*\n!.gitignore\n");
                }

                // Step 2: Remove old CLI scripts
                cliInstallLog += "[2/5] Removing old CLI scripts...\n";
                if (Directory.Exists(skillsDir))
                {
                    Directory.Delete(skillsDir, true);
                }

                // Step 3: Copy CLI scripts from plugin
                cliInstallLog += "[3/5] Copying CLI scripts...\n";
                string pluginScriptsPath = FindPluginScriptsPath();
                if (string.IsNullOrEmpty(pluginScriptsPath))
                {
                    cliInstallLog += "❌ ERROR: Plugin scripts not found!\n";
                    UnityEngine.Debug.LogError("Unity Editor Toolkit: Plugin scripts path not found");
                    return;
                }

                CopyDirectory(pluginScriptsPath, skillsDir);
                cliInstallLog += $"✓ Copied from: {pluginScriptsPath}\n";

                // Step 4: npm install
                cliInstallLog += "[4/5] Installing dependencies (npm install)...\n";
                cliInstallLog += "This may take a minute...\n";

                string npmOutput = RunCommand("npm", "install", skillsDir, 300); // 5 minute timeout
                cliInstallLog += "✓ Dependencies installed\n";

                // Step 5: npm run build
                cliInstallLog += "[5/5] Building CLI (npm run build)...\n";
                string buildOutput = RunCommand("npm", "run build", skillsDir, NpmBuildTimeoutSeconds);
                cliInstallLog += "✓ Build completed\n";

                // Create CLI wrapper
                CreateCLIWrapper(outputDir, skillsDir);

                cliInstallLog += "\n✅ CLI installation completed successfully!\n";
                UnityEngine.Debug.Log("Unity Editor Toolkit: CLI scripts installed successfully");

                // Refresh version info
                CheckCLIVersion();
            }
            catch (Exception e)
            {
                cliInstallLog += $"\n❌ ERROR: {e.Message}\n";

                // Check for common errors and provide hints
                if (e.Message.Contains("ENOSPC"))
                {
                    cliInstallLog += "\n💡 Hint: Disk space full. Free up space and try again.\n";
                }
                else if (e.Message.Contains("EACCES") || e.Message.Contains("permission"))
                {
                    cliInstallLog += "\n💡 Hint: Permission denied. Check folder permissions or run as administrator.\n";
                }
                else if (e.Message.Contains("ETIMEDOUT") || e.Message.Contains("network"))
                {
                    cliInstallLog += "\n💡 Hint: Network timeout. Check your internet connection.\n";
                    cliInstallLog += "   If behind a proxy, configure npm:\n";
                    cliInstallLog += "   npm config set proxy http://proxy.company.com:8080\n";
                }

                UnityEngine.Debug.LogError($"Unity Editor Toolkit: CLI installation failed: {e.Message}");
            }
            finally
            {
                ReleaseLock(lockFile);
                isInstallingCLI = false;
                Repaint();
            }
        }

        private string GetDefaultPluginScriptsPath()
        {
            string homeFolder = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(homeFolder, ".claude", "plugins", "marketplaces", "dev-gom-plugins",
                               "plugins", "unity-editor-toolkit", "skills", "scripts");
        }

        private string FindPluginScriptsPath()
        {
            // Use custom path if set
            if (!string.IsNullOrEmpty(pluginScriptsPathOverride))
            {
                // Security: Validate path to prevent path traversal
                string normalized = Path.GetFullPath(pluginScriptsPathOverride);
                string homeFolder = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string allowedPath = Path.Combine(homeFolder, ".claude", "plugins");

                if (!normalized.StartsWith(allowedPath, StringComparison.OrdinalIgnoreCase))
                {
                    UnityEngine.Debug.LogError($"Plugin path outside allowed directory: {pluginScriptsPathOverride}");
                    return null;
                }

                if (Directory.Exists(normalized) &&
                    File.Exists(Path.Combine(normalized, "package.json")))
                {
                    return normalized;
                }
            }

            // Use default home folder based path
            string defaultPath = GetDefaultPluginScriptsPath();
            if (Directory.Exists(defaultPath) &&
                File.Exists(Path.Combine(defaultPath, "package.json")))
            {
                return defaultPath;
            }

            return null;
        }

        private void CopyDirectory(string sourceDir, string destDir)
        {
            // Security: Validate and normalize paths to prevent path traversal
            string normalizedSource = Path.GetFullPath(sourceDir);
            string normalizedDest = Path.GetFullPath(destDir);

            // Validate source is in allowed plugin directory
            string homeFolder = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string allowedPluginPath = Path.Combine(homeFolder, ".claude", "plugins");

            if (!normalizedSource.StartsWith(allowedPluginPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException($"Source path outside allowed directory: {sourceDir}");
            }

            // Validate destination is within project
            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            if (!normalizedDest.StartsWith(projectRoot, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException($"Destination path outside project: {destDir}");
            }

            // Check for symbolic links (security risk)
            DirectoryInfo sourceInfo = new DirectoryInfo(normalizedSource);
            if ((sourceInfo.Attributes & FileAttributes.ReparsePoint) == FileAttributes.ReparsePoint)
            {
                throw new UnauthorizedAccessException("Symbolic links are not allowed");
            }

            Directory.CreateDirectory(normalizedDest);

            // Copy files with validation
            foreach (string file in Directory.GetFiles(normalizedSource))
            {
                string fileName = Path.GetFileName(file);

                // Validate filename (prevent null byte injection)
                if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 || fileName.Contains('\0'))
                {
                    UnityEngine.Debug.LogWarning($"Skipping invalid file name: {fileName}");
                    continue;
                }

                string destFile = Path.Combine(normalizedDest, fileName);

                // Validate final path stays within destination
                string normalizedDestFile = Path.GetFullPath(destFile);
                if (!normalizedDestFile.StartsWith(normalizedDest, StringComparison.OrdinalIgnoreCase))
                {
                    UnityEngine.Debug.LogWarning($"Skipping file outside destination: {fileName}");
                    continue;
                }

                File.Copy(file, normalizedDestFile, true);
            }

            // Copy subdirectories recursively with validation
            foreach (string dir in Directory.GetDirectories(normalizedSource))
            {
                string dirName = Path.GetFileName(dir);

                // Skip node_modules, dist, hidden folders, and cache
                if (dirName == "node_modules" || dirName == "dist" ||
                    dirName.StartsWith(".") || dirName == "__pycache__")
                {
                    continue;
                }

                string destSubDir = Path.Combine(normalizedDest, dirName);
                CopyDirectory(dir, destSubDir);
            }
        }

        private string RunCommand(string command, string arguments, string workingDirectory, int timeoutSeconds = DefaultCommandTimeoutSeconds)
        {
            // Platform-specific command adjustment
            if (Application.platform == RuntimePlatform.WindowsEditor)
            {
                if (command == "npm")
                {
                    command = "npm.cmd";
                }
            }

            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            Process process = null;
            try
            {
                process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception($"Failed to start process: {command}");
                }

                bool exited = process.WaitForExit(timeoutSeconds * 1000);

                if (!exited)
                {
                    UnityEngine.Debug.LogWarning($"Process timeout, killing: {command} {arguments}");

                    try
                    {
                        process.Kill();
                        process.WaitForExit(ProcessKillWaitTimeoutMs);
                    }
                    catch (Exception killEx)
                    {
                        UnityEngine.Debug.LogError($"Failed to kill process: {killEx.Message}");
                    }

                    throw new Exception($"{command} timed out after {timeoutSeconds} seconds. Check network connection or increase timeout.");
                }

                string output = process.StandardOutput.ReadToEnd();
                string error = process.StandardError.ReadToEnd();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"{command} {arguments} failed (exit code {process.ExitCode}):\n{error}");
                }

                return output;
            }
            finally
            {
                // Always cleanup process resources
                if (process != null)
                {
                    try
                    {
                        if (!process.HasExited)
                        {
                            process.Kill();
                            process.WaitForExit(ProcessKillWaitTimeoutMs);
                        }
                        process.Dispose();
                    }
                    catch (Exception ex)
                    {
                        UnityEngine.Debug.LogError($"Error disposing process: {ex.Message}");
                    }
                }
            }
        }

        private void CreateCLIWrapper(string outputDir, string skillsDir)
        {
            string wrapperPath = Path.Combine(outputDir, "uw.js");
            string wrapperContent = @"#!/usr/bin/env node

/**
 * Unity WebSocket CLI Wrapper
 *
 * This wrapper script forwards all arguments to the local CLI installation.
 * Auto-generated by Unity Editor Toolkit.
 *
 * Usage: node .unity-websocket/uw.js <command> [options]
 * Example: node .unity-websocket/uw.js hierarchy
 */

const path = require('path');

// Set CLAUDE_PROJECT_DIR to project root (parent of .unity-websocket)
process.env.CLAUDE_PROJECT_DIR = path.resolve(__dirname, '..');

// Get the actual CLI path
const cliPath = path.join(__dirname, 'skills', 'scripts', 'dist', 'cli', 'cli.js');

// Forward to the actual CLI
require(cliPath);
";

            File.WriteAllText(wrapperPath, wrapperContent);
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
