using UnityEngine;
using System;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Handles path management for plugin scripts and CLI installation
    /// </summary>
    public static class EditorServerPathManager
    {
        /// <summary>
        /// Get the default plugin scripts path in user's home directory
        /// </summary>
        public static string GetDefaultPluginScriptsPath()
        {
            string homeFolder = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(homeFolder, ".claude", "plugins", "marketplaces", "dev-gom-plugins",
                               "plugins", "unity-editor-toolkit", "skills", "scripts");
        }

        /// <summary>
        /// Find the plugin scripts path (custom or default)
        /// </summary>
        public static string FindPluginScriptsPath(string customPath = null)
        {
            // Use custom path if set
            if (!string.IsNullOrEmpty(customPath))
            {
                // Security: Validate path to prevent path traversal
                string normalized = Path.GetFullPath(customPath);
                string homeFolder = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string allowedPath = Path.Combine(homeFolder, ".claude", "plugins");

                if (!normalized.StartsWith(allowedPath, StringComparison.OrdinalIgnoreCase))
                {
                    ToolkitLogger.LogError("PathManager", $"Plugin path outside allowed directory: {customPath}");
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

        /// <summary>
        /// Find package.json path in Unity Package
        /// </summary>
        public static string FindPackageJsonPath()
        {
            string projectRoot = Path.GetDirectoryName(Application.dataPath);

            // Try to find the package.json in various locations
            string[][] searchPathComponents = new string[][]
            {
                // Installed via Package Manager
                new string[] { "Packages", "com.devgom.unity-editor-toolkit", "package.json" },
                // Installed in Assets
                new string[] { "Assets", "UnityEditorToolkit", "package.json" },
                new string[] { "Assets", "Packages", "UnityEditorToolkit", "package.json" }
            };

            foreach (string[] components in searchPathComponents)
            {
                // Build path using Path.Combine for cross-platform compatibility
                string[] fullPathComponents = new string[components.Length + 1];
                fullPathComponents[0] = projectRoot;
                Array.Copy(components, 0, fullPathComponents, 1, components.Length);

                string fullPath = Path.Combine(fullPathComponents);
                if (File.Exists(fullPath))
                {
                    return fullPath;
                }
            }

            return null;
        }

        /// <summary>
        /// Extract version from package.json content
        /// </summary>
        public static string ExtractVersionFromJson(string json)
        {
            // Simple regex to extract version (avoiding full JSON parser)
            Match match = Regex.Match(json, @"""version""\s*:\s*""([^""]+)""");
            return match.Success ? match.Groups[1].Value : null;
        }

        /// <summary>
        /// Get plugin version from package.json
        /// </summary>
        public static string GetPluginVersion()
        {
            try
            {
                // Find package.json in the Unity Package
                string packagePath = FindPackageJsonPath();
                if (string.IsNullOrEmpty(packagePath) || !File.Exists(packagePath))
                {
                    ToolkitLogger.LogWarning("PathManager", "package.json not found");
                    return null;
                }

                string json = File.ReadAllText(packagePath);
                return ExtractVersionFromJson(json);
            }
            catch (Exception e)
            {
                ToolkitLogger.LogError("PathManager", $"Unity Editor Toolkit: Failed to read plugin version: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Get local CLI version from installed scripts
        /// </summary>
        public static string GetLocalCLIVersion()
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

        /// <summary>
        /// Get home folder CLI version (source version to be installed)
        /// </summary>
        public static string GetHomeCLIVersion()
        {
            try
            {
                string homeCLIPath = FindPluginScriptsPath();
                if (string.IsNullOrEmpty(homeCLIPath))
                {
                    return null;
                }

                string homePackageJson = Path.Combine(homeCLIPath, "package.json");
                if (!File.Exists(homePackageJson))
                {
                    return null;
                }

                string json = File.ReadAllText(homePackageJson);
                return ExtractVersionFromJson(json);
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Copy directory with security validation
        /// </summary>
        public static void CopyDirectory(string sourceDir, string destDir)
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
                    ToolkitLogger.LogWarning("PathManager", $"Skipping invalid file name: {fileName}");
                    continue;
                }

                string destFile = Path.Combine(normalizedDest, fileName);

                // Validate final path stays within destination
                string normalizedDestFile = Path.GetFullPath(destFile);
                if (!normalizedDestFile.StartsWith(normalizedDest, StringComparison.OrdinalIgnoreCase))
                {
                    ToolkitLogger.LogWarning("PathManager", $"Skipping file outside destination: {fileName}");
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
    }
}
