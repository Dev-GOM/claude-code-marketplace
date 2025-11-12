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
        private const string PACKAGE_VERSION = "0.4.0";
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
            // Check if initialization file exists in project settings
            bool isFirstInstall = !File.Exists(InitializationFilePath);
            string installedVersion = "";

            if (!isFirstInstall && File.Exists(InitializationFilePath))
            {
                try
                {
                    installedVersion = File.ReadAllText(InitializationFilePath).Trim();
                }
                catch
                {
                    installedVersion = "";
                }
            }

            bool isVersionUpgrade = !string.IsNullOrEmpty(installedVersion) && installedVersion != PACKAGE_VERSION;

            if (isFirstInstall)
            {
                // First time installation - open server window
                try
                {
                    File.WriteAllText(InitializationFilePath, PACKAGE_VERSION);
                }
                catch (System.Exception e)
                {
                    Debug.LogWarning($"[Unity Editor Toolkit] Failed to create initialization file: {e.Message}");
                }

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
                try
                {
                    File.WriteAllText(InitializationFilePath, PACKAGE_VERSION);
                }
                catch (System.Exception e)
                {
                    Debug.LogWarning($"[Unity Editor Toolkit] Failed to update version file: {e.Message}");
                }
                Debug.Log($"[Unity Editor Toolkit] Updated to version {PACKAGE_VERSION}");
            }
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
