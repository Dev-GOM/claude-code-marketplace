using UnityEngine;
using UnityEditor;
using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Handles CLI script installation and version management
    /// </summary>
    public class EditorServerCLIInstaller
    {
        private const int LockFileStaleMinutes = 10;
        private const int NpmInstallTimeoutSeconds = 30;
        private const int NpmBuildTimeoutSeconds = 120;
        private const int NpmInstallExtendedTimeoutSeconds = 300; // 5 minutes for initial install
        private const int TimestampFutureToleranceMinutes = 1;
        private const long DefaultRequiredDiskSpaceMB = 500;
        private const int LockAcquisitionRetryIntervalMs = 500;

        public string PluginVersion { get; private set; }
        public string LocalCLIVersion { get; private set; }
        public string HomeCLIVersion { get; private set; }
        public bool UpdateAvailable { get; private set; }
        public bool IsInstalling { get; private set; }
        public string InstallLog { get; private set; } = "";

        private string pluginScriptsPathOverride;

        public EditorServerCLIInstaller(string pathOverride = null)
        {
            pluginScriptsPathOverride = pathOverride;
        }

        /// <summary>
        /// Check CLI versions and update availability
        /// </summary>
        public void CheckVersion()
        {
            PluginVersion = EditorServerPathManager.GetPluginVersion();
            LocalCLIVersion = EditorServerPathManager.GetLocalCLIVersion();
            HomeCLIVersion = EditorServerPathManager.GetHomeCLIVersion();
            // Update available when home CLI version differs from installed local CLI version
            UpdateAvailable = (HomeCLIVersion != null && LocalCLIVersion != null && HomeCLIVersion != LocalCLIVersion);
        }

        /// <summary>
        /// Check if minor version difference (same major.minor, different patch)
        /// </summary>
        public static bool IsMinorVersionDifference(string v1, string v2)
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

        /// <summary>
        /// Check if installation is in progress
        /// </summary>
        public bool IsInstallationInProgress()
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
                ToolkitLogger.LogWarning("CLIInstaller", "Removing stale installation lock");
                try
                {
                    File.Delete(lockFile);
                }
                catch (Exception e)
                {
                    ToolkitLogger.LogError("CLIInstaller", $"Failed to delete stale lock: {e.Message}");
                }
                return false;
            }

            return true;
        }

        /// <summary>
        /// Clear installation lock file
        /// </summary>
        public void ClearInstallationLock()
        {
            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            string lockFile = Path.Combine(projectRoot, ".unity-websocket", ".install.lock");

            if (File.Exists(lockFile))
            {
                try
                {
                    File.Delete(lockFile);
                    ToolkitLogger.Log("CLIInstaller", "Installation lock cleared");
                    EditorUtility.DisplayDialog("Lock Cleared", "Installation lock has been cleared.\nYou can now retry installation.", "OK");
                }
                catch (Exception e)
                {
                    ToolkitLogger.LogError("CLIInstaller", $"Failed to clear lock: {e.Message}");
                    EditorUtility.DisplayDialog("Error", $"Failed to clear lock:\n{e.Message}", "OK");
                }
            }
        }

        /// <summary>
        /// Install or update CLI scripts
        /// </summary>
        public void InstallOrUpdate()
        {
            IsInstalling = true;
            InstallLog = "";

            string projectRoot = Path.GetDirectoryName(Application.dataPath);
            string outputDir = Path.Combine(projectRoot, ".unity-websocket");
            string lockFile = Path.Combine(outputDir, ".install.lock");

            try
            {
                // Pre-flight checks
                InstallLog += "[Pre-flight] Running system checks...\n";

                // Check disk space
                if (!CheckDiskSpace(projectRoot, DefaultRequiredDiskSpaceMB))
                {
                    bool proceed = EditorUtility.DisplayDialog("Low Disk Space",
                        $"Less than {DefaultRequiredDiskSpaceMB}MB available. Installation may fail.\n\nProceed anyway?",
                        "Yes", "No");

                    if (!proceed)
                    {
                        InstallLog += "❌ Installation cancelled by user (low disk space)\n";
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
                    InstallLog += "❌ Write permission denied\n";
                    return;
                }

                // Acquire installation lock
                InstallLog += "[Pre-flight] Acquiring installation lock...\n";
                string lockError;
                if (!AcquireLock(lockFile, out lockError))
                {
                    EditorUtility.DisplayDialog("Installation In Progress", lockError ?? "Cannot acquire lock", "OK");
                    InstallLog += $"❌ {lockError}\n";
                    return;
                }

                InstallLog += "✓ Pre-flight checks passed\n\n";

                string skillsDir = Path.Combine(outputDir, "skills", "scripts");

                // Step 1: Create output directory
                InstallLog += "[1/5] Creating output directory...\n";
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
                InstallLog += "[2/5] Removing old CLI scripts...\n";
                if (Directory.Exists(skillsDir))
                {
                    Directory.Delete(skillsDir, true);
                }

                // Step 3: Copy CLI scripts from plugin
                InstallLog += "[3/5] Copying CLI scripts...\n";
                string pluginScriptsPath = EditorServerPathManager.FindPluginScriptsPath(pluginScriptsPathOverride);
                if (string.IsNullOrEmpty(pluginScriptsPath))
                {
                    InstallLog += "❌ ERROR: Plugin scripts not found!\n";
                    ToolkitLogger.LogError("CLIInstaller", "Plugin scripts path not found");
                    return;
                }

                EditorServerPathManager.CopyDirectory(pluginScriptsPath, skillsDir);
                InstallLog += $"✓ Copied from: {pluginScriptsPath}\n";

                // Step 4: npm install
                InstallLog += "[4/5] Installing dependencies (npm install)...\n";
                InstallLog += "This may take a minute...\n";

                string npmOutput = EditorServerCommandRunner.RunCommand("npm", "install", skillsDir, NpmInstallExtendedTimeoutSeconds);
                InstallLog += "✓ Dependencies installed\n";

                // Step 5: npm run build
                InstallLog += "[5/5] Building CLI (npm run build)...\n";
                string buildOutput = EditorServerCommandRunner.RunCommand("npm", "run build", skillsDir, NpmBuildTimeoutSeconds);
                InstallLog += "✓ Build completed\n";

                // Create CLI wrapper
                CreateCLIWrapper(outputDir, skillsDir);

                InstallLog += "\n✅ CLI installation completed successfully!\n";
                ToolkitLogger.Log("CLIInstaller", "CLI scripts installed successfully");

                // Refresh version info
                CheckVersion();
            }
            catch (Exception e)
            {
                InstallLog += $"\n❌ ERROR: {e.Message}\n";

                // Check for common errors and provide hints
                if (e.Message.Contains("ENOSPC"))
                {
                    InstallLog += "\n💡 Hint: Disk space full. Free up space and try again.\n";
                }
                else if (e.Message.Contains("EACCES") || e.Message.Contains("permission"))
                {
                    InstallLog += "\n💡 Hint: Permission denied. Check folder permissions or run as administrator.\n";
                }
                else if (e.Message.Contains("ETIMEDOUT") || e.Message.Contains("network"))
                {
                    InstallLog += "\n💡 Hint: Network timeout. Check your internet connection.\n";
                    InstallLog += "   If behind a proxy, configure npm:\n";
                    InstallLog += "   npm config set proxy http://proxy.company.com:8080\n";
                }

                ToolkitLogger.LogError("CLIInstaller", $"CLI installation failed: {e.Message}");
            }
            finally
            {
                ReleaseLock(lockFile);
                IsInstalling = false;
            }
        }

        private bool IsLockStale(string lockPath)
        {
            try
            {
                string[] lines = File.ReadAllLines(lockPath);
                if (lines.Length < 2) return true;

                // Check if process is running
                if (int.TryParse(lines[0], out int pid))
                {
                    if (pid <= 0) return true;

                    int currentPID = Process.GetCurrentProcess().Id;
                    if (pid == currentPID) return false;

                    try
                    {
                        Process process = Process.GetProcessById(pid);
                        if (process.HasExited) return true;

                        string processName = process.ProcessName.ToLower();
                        bool isUnityEditor = processName.Contains("unity") && !processName.Contains("unityhub");

                        if (isUnityEditor) return false;
                        return true;
                    }
                    catch (ArgumentException) { return true; }
                    catch (InvalidOperationException) { return true; }
                }

                // Fallback to timestamp
                if (DateTime.TryParse(lines[1], out DateTime lockTimestamp))
                {
                    if (lockTimestamp > DateTime.Now.AddMinutes(TimestampFutureToleranceMinutes)) return true;
                    if ((DateTime.Now - lockTimestamp).TotalMinutes > LockFileStaleMinutes) return true;
                }
                else
                {
                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return true;
            }
        }

        private bool AcquireLock(string lockPath, out string errorMessage)
        {
            errorMessage = null;
            DateTime startTime = DateTime.Now;
            int timeoutSeconds = NpmInstallTimeoutSeconds;

            while ((DateTime.Now - startTime).TotalSeconds < timeoutSeconds)
            {
                try
                {
                    // Try to open or create the lock file atomically
                    using (FileStream fs = File.Open(lockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                    {
                        // Check if file has content (existing lock)
                        if (fs.Length > 0)
                        {
                            // Read existing lock content
                            byte[] buffer = new byte[fs.Length];
                            fs.Read(buffer, 0, (int)fs.Length);
                            string existingContent = Encoding.UTF8.GetString(buffer);
                            string[] lines = existingContent.Split('\n');

                            // Check if lock is stale
                            bool isStale = false;
                            if (lines.Length >= 2)
                            {
                                if (int.TryParse(lines[0], out int pid))
                                {
                                    int currentPID = Process.GetCurrentProcess().Id;
                                    if (pid == currentPID)
                                    {
                                        // Same process, reuse lock
                                        return true;
                                    }

                                    try
                                    {
                                        Process process = Process.GetProcessById(pid);
                                        if (process.HasExited)
                                        {
                                            isStale = true;
                                        }
                                        else
                                        {
                                            string processName = process.ProcessName.ToLower();
                                            bool isUnityEditor = processName.Contains("unity") && !processName.Contains("unityhub");
                                            if (!isUnityEditor)
                                            {
                                                isStale = true;
                                            }
                                        }
                                    }
                                    catch (ArgumentException) { isStale = true; }
                                    catch (InvalidOperationException) { isStale = true; }
                                }

                                // Check timestamp as fallback
                                if (!isStale && DateTime.TryParse(lines[1], out DateTime lockTimestamp))
                                {
                                    if (lockTimestamp > DateTime.Now.AddMinutes(TimestampFutureToleranceMinutes) ||
                                        (DateTime.Now - lockTimestamp).TotalMinutes > LockFileStaleMinutes)
                                    {
                                        isStale = true;
                                    }
                                }
                            }
                            else
                            {
                                isStale = true; // Invalid format
                            }

                            if (!isStale)
                            {
                                // Lock is valid and owned by another process
                                fs.Close();
                                System.Threading.Thread.Sleep(LockAcquisitionRetryIntervalMs);
                                continue;
                            }

                            // Lock is stale, overwrite it
                            fs.SetLength(0);
                            fs.Seek(0, SeekOrigin.Begin);
                        }

                        // Write new lock content
                        int currentPID2 = Process.GetCurrentProcess().Id;
                        string lockContent = $"{currentPID2}\n{DateTime.Now:yyyy-MM-dd HH:mm:ss}";
                        byte[] info = Encoding.UTF8.GetBytes(lockContent);
                        fs.Write(info, 0, info.Length);
                        fs.Flush();
                        return true;
                    }
                }
                catch (IOException)
                {
                    // File is locked by another process
                    System.Threading.Thread.Sleep(LockAcquisitionRetryIntervalMs);
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
                ToolkitLogger.LogWarning("CLIInstaller", $"Failed to release lock: {e.Message}");
            }
        }

        private bool CheckDiskSpace(string path, long requiredMB = 500)
        {
            try
            {
                string rootPath = Path.GetPathRoot(path);
                if (string.IsNullOrEmpty(rootPath))
                {
                    ToolkitLogger.LogWarning("CLIInstaller", "Could not determine drive root path");
                    return true; // Cannot check, assume OK
                }

                DriveInfo drive = new DriveInfo(rootPath);

                // Check if drive is ready (mounted and accessible)
                if (!drive.IsReady)
                {
                    ToolkitLogger.LogWarning("CLIInstaller", $"Drive {rootPath} is not ready");
                    return true; // Cannot check, assume OK
                }

                long availableMB = drive.AvailableFreeSpace / (1024 * 1024);
                InstallLog += $"💾 Disk space: {availableMB}MB available on {rootPath}\n";

                if (availableMB < requiredMB)
                {
                    InstallLog += $"⚠️  Low disk space: {requiredMB}MB recommended\n";
                    return false;
                }

                return true;
            }
            catch (ArgumentException e)
            {
                ToolkitLogger.LogWarning("CLIInstaller", $"Invalid drive path: {e.Message}");
                return true; // Cannot check, assume OK
            }
            catch (Exception e)
            {
                ToolkitLogger.LogWarning("CLIInstaller", $"Could not check disk space: {e.Message}");
                return true; // Cannot check, assume OK
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
                ToolkitLogger.LogWarning("CLIInstaller", $"Write permission check failed: {e.Message}");
                return true;
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
    }
}
