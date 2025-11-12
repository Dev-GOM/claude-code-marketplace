using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Automatically opens Server Window when package is first installed
    /// </summary>
    [InitializeOnLoad]
    public static class PackageInitializer
    {
        private static readonly string InitializationFilePath = Path.Combine(
            Path.GetDirectoryName(Application.dataPath),
            "ProjectSettings",
            "UnityEditorToolkit.initialized"
        );

        static PackageInitializer()
        {
            EditorApplication.delayCall += Initialize;
        }

        private static void Initialize()
        {
            // Get current package version from package.json
            string packageVersion = GetPackageVersion();
            if (string.IsNullOrEmpty(packageVersion))
            {
                Debug.LogWarning("[Unity Editor Toolkit] Could not determine package version. Initialization skipped.");
                return;
            }

            // Check if initialization file exists in project settings
            bool isFirstInstall = !File.Exists(InitializationFilePath);
            string installedVersion = "";

            if (!isFirstInstall)
            {
                try
                {
                    installedVersion = File.ReadAllText(InitializationFilePath).Trim();
                }
                catch (System.Exception e)
                {
                    Debug.LogWarning($"[Unity Editor Toolkit] Failed to read initialization file: {e.Message}");
                    installedVersion = "";
                }
            }

            bool isVersionUpgrade = !string.IsNullOrEmpty(installedVersion) && installedVersion != packageVersion;

            if (isFirstInstall)
            {
                // First time installation - open server window
                WriteInitializationFile(packageVersion, "Failed to create initialization file");

                // Delay to ensure Unity is fully loaded
                EditorApplication.delayCall += () =>
                {
                    EditorWindow.GetWindow<EditorServerWindow>("Unity Editor Toolkit");
                    Debug.Log("[Unity Editor Toolkit] Welcome! Server Window opened. Configure your plugin scripts path and install CLI to get started.");
                };
            }
            else if (isVersionUpgrade)
            {
                // Version upgrade - just update version number
                WriteInitializationFile(packageVersion, "Failed to update version file");
                Debug.Log($"[Unity Editor Toolkit] Updated to version {packageVersion}");
            }
        }

        private static void WriteInitializationFile(string version, string failureMessage)
        {
            try
            {
                File.WriteAllText(InitializationFilePath, version);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"[Unity Editor Toolkit] {failureMessage}: {e.Message}");
            }
        }

        private static string GetPackageVersion()
        {
            try
            {
                string packagePath = FindPackageJsonPath();
                if (string.IsNullOrEmpty(packagePath) || !File.Exists(packagePath))
                {
                    return null;
                }

                string json = File.ReadAllText(packagePath);
                return ExtractVersionFromJson(json);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"[Unity Editor Toolkit] Failed to read package version: {e.Message}");
                return null;
            }
        }

        private static string FindPackageJsonPath()
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

        private static string ExtractVersionFromJson(string json)
        {
            // Simple regex to extract version (avoiding full JSON parser)
            Match match = Regex.Match(json, @"""version""\s*:\s*""([^""]+)""");
            return match.Success ? match.Groups[1].Value : null;
        }

        [MenuItem("Tools/Unity Editor Toolkit/Reset Package Initialization", priority = 101)]
        private static void ResetInitialization()
        {
            if (File.Exists(InitializationFilePath))
            {
                File.Delete(InitializationFilePath);
                Debug.Log("[Unity Editor Toolkit] Package initialization reset. Restart Unity to trigger first-install behavior.");
            }
            else
            {
                Debug.Log("[Unity Editor Toolkit] No initialization file found - already in fresh state.");
            }
        }
    }
}
