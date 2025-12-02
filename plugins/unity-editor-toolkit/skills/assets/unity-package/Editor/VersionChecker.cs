using UnityEngine;
using UnityEngine.Networking;
using System;
using System.Threading.Tasks;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Checks for Unity Editor Toolkit updates from GitHub
    /// </summary>
    public class VersionChecker
    {
        private const string GITHUB_RAW_URL = "https://raw.githubusercontent.com/Dev-GOM/claude-code-marketplace/main/plugins/unity-editor-toolkit/.claude-plugin/plugin.json";
        private const string PACKAGE_PATH = "Packages/com.devgom.unity-editor-toolkit/package.json";

        public string LocalVersion { get; private set; }
        public string LatestVersion { get; private set; }
        public bool UpdateAvailable { get; private set; }
        public bool IsChecking { get; private set; }
        public string ErrorMessage { get; private set; }
        public DateTime LastChecked { get; private set; }

        public event Action OnVersionCheckComplete;

        /// <summary>
        /// Get the local package version from package.json
        /// </summary>
        public string GetLocalVersion()
        {
            try
            {
                string packageJson = System.IO.File.ReadAllText(
                    System.IO.Path.GetFullPath(PACKAGE_PATH));

                var packageData = JsonUtility.FromJson<PackageJson>(packageJson);
                LocalVersion = packageData?.version ?? "Unknown";
                return LocalVersion;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("VersionChecker", $"Failed to read local package.json: {ex.Message}");
                LocalVersion = "Unknown";
                return LocalVersion;
            }
        }

        /// <summary>
        /// Check for updates from GitHub
        /// </summary>
        public async Task CheckForUpdatesAsync()
        {
            if (IsChecking) return;

            IsChecking = true;
            ErrorMessage = null;

            try
            {
                // Get local version first
                GetLocalVersion();

                // Fetch latest version from GitHub
                using (var request = UnityWebRequest.Get(GITHUB_RAW_URL))
                {
                    request.timeout = 10;

                    var operation = request.SendWebRequest();

                    while (!operation.isDone)
                    {
                        await Task.Delay(100);
                    }

                    if (request.result == UnityWebRequest.Result.Success)
                    {
                        var pluginData = JsonUtility.FromJson<PluginJson>(request.downloadHandler.text);
                        LatestVersion = pluginData?.version ?? "Unknown";

                        // Compare versions
                        UpdateAvailable = IsNewerVersion(LatestVersion, LocalVersion);
                        LastChecked = DateTime.Now;

                        ToolkitLogger.Log("VersionChecker",
                            $"Version check complete - Local: {LocalVersion}, Latest: {LatestVersion}, Update: {UpdateAvailable}");
                    }
                    else
                    {
                        ErrorMessage = $"Failed to fetch version: {request.error}";
                        ToolkitLogger.LogError("VersionChecker", ErrorMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"Version check failed: {ex.Message}";
                ToolkitLogger.LogError("VersionChecker", ErrorMessage);
            }
            finally
            {
                IsChecking = false;
                OnVersionCheckComplete?.Invoke();
            }
        }

        /// <summary>
        /// Check if version A is newer than version B (semantic versioning)
        /// </summary>
        public static bool IsNewerVersion(string versionA, string versionB)
        {
            if (string.IsNullOrEmpty(versionA) || string.IsNullOrEmpty(versionB))
                return false;

            if (versionA == "Unknown" || versionB == "Unknown")
                return false;

            try
            {
                var partsA = versionA.Split('.');
                var partsB = versionB.Split('.');

                for (int i = 0; i < Math.Max(partsA.Length, partsB.Length); i++)
                {
                    int a = i < partsA.Length ? int.Parse(partsA[i]) : 0;
                    int b = i < partsB.Length ? int.Parse(partsB[i]) : 0;

                    if (a > b) return true;
                    if (a < b) return false;
                }

                return false; // Versions are equal
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Get version comparison text for UI display
        /// </summary>
        public string GetVersionComparisonText()
        {
            if (IsChecking)
                return "Checking...";

            if (!string.IsNullOrEmpty(ErrorMessage))
                return $"Error: {ErrorMessage}";

            if (string.IsNullOrEmpty(LatestVersion))
                return "Not checked";

            if (UpdateAvailable)
                return $"{LocalVersion} -> {LatestVersion} (Update Available)";

            return $"{LocalVersion} (Up to date)";
        }

        /// <summary>
        /// Get the update status message type for HelpBox
        /// </summary>
        public UnityEditor.MessageType GetStatusMessageType()
        {
            if (!string.IsNullOrEmpty(ErrorMessage))
                return UnityEditor.MessageType.Error;

            if (UpdateAvailable)
                return UnityEditor.MessageType.Warning;

            return UnityEditor.MessageType.Info;
        }

        [Serializable]
        private class PackageJson
        {
            public string version;
        }

        [Serializable]
        private class PluginJson
        {
            public string version;
        }
    }
}
