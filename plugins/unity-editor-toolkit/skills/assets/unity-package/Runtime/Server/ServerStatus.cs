using System;
using System.IO;
using System.Text;
using UnityEngine;
using Newtonsoft.Json;

namespace UnityEditorToolkit.Server
{
    /// <summary>
    /// Manages server status file for Unity WebSocket Server
    ///
    /// Stores current server state in .unity-websocket/server-status.json
    /// allowing CLI tools to discover the correct port and server state.
    /// </summary>
    [Serializable]
    public class ServerStatus
    {
        // Constants
        private const int HeartbeatStaleSeconds = 30;

        public string version = "1.0";
        public int port;
        public bool isRunning;
        public int pid;
        public string editorVersion;
        public string startedAt;
        public string lastHeartbeat;

        /// <summary>
        /// Get server status file path
        /// </summary>
        public static string GetStatusFilePath(string projectRoot)
        {
            string statusDir = Path.Combine(projectRoot, ".unity-websocket");
            return Path.Combine(statusDir, "server-status.json");
        }

        /// <summary>
        /// Create new server status
        /// </summary>
        public static ServerStatus Create(int port)
        {
            return new ServerStatus
            {
                version = "1.0",
                port = port,
                isRunning = true,
                pid = System.Diagnostics.Process.GetCurrentProcess().Id,
                editorVersion = Application.unityVersion,
                startedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                lastHeartbeat = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };
        }

        /// <summary>
        /// Save server status to file (atomic write)
        /// </summary>
        public static bool Save(ServerStatus status, string projectRoot)
        {
            string tempPath = null;

            try
            {
                string statusDir = Path.Combine(projectRoot, ".unity-websocket");
                if (!Directory.Exists(statusDir))
                {
                    Directory.CreateDirectory(statusDir);
                }

                string statusPath = GetStatusFilePath(projectRoot);
                tempPath = statusPath + ".tmp";

                // Serialize to JSON
                string json = JsonConvert.SerializeObject(status, Formatting.Indented);

                // Write to temp file first
                File.WriteAllText(tempPath, json, Encoding.UTF8);

                // Atomic replace using File.Replace (crash-safe)
                if (File.Exists(statusPath))
                {
                    // File.Replace is atomic - no data loss even if crash occurs
                    File.Replace(tempPath, statusPath, null);
                }
                else
                {
                    // First time, just move
                    File.Move(tempPath, statusPath);
                }

                tempPath = null; // Successfully handled, no cleanup needed
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Unity Editor Toolkit: Failed to save server status: {e.Message}");
                return false;
            }
            finally
            {
                // Cleanup temp file if it still exists (error case)
                if (tempPath != null && File.Exists(tempPath))
                {
                    try
                    {
                        File.Delete(tempPath);
                    }
                    catch (Exception cleanupEx)
                    {
                        Debug.LogWarning($"Unity Editor Toolkit: Failed to cleanup temp file: {cleanupEx.Message}");
                    }
                }
            }
        }

        /// <summary>
        /// Load server status from file
        /// </summary>
        public static ServerStatus Load(string projectRoot)
        {
            try
            {
                string statusPath = GetStatusFilePath(projectRoot);

                if (!File.Exists(statusPath))
                {
                    return null;
                }

                string json = File.ReadAllText(statusPath, Encoding.UTF8);
                return JsonConvert.DeserializeObject<ServerStatus>(json);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"Unity Editor Toolkit: Failed to load server status: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Update heartbeat timestamp
        /// </summary>
        public void UpdateHeartbeat()
        {
            lastHeartbeat = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        }

        /// <summary>
        /// Mark server as stopped
        /// </summary>
        public static bool MarkStopped(string projectRoot)
        {
            try
            {
                ServerStatus status = Load(projectRoot);
                if (status == null)
                {
                    return true; // Already no status file
                }

                status.isRunning = false;
                status.UpdateHeartbeat();
                return Save(status, projectRoot);
            }
            catch (Exception e)
            {
                Debug.LogError($"Unity Editor Toolkit: Failed to mark server as stopped: {e.Message}");
                return false;
            }
        }

        /// <summary>
        /// Check if status is stale (heartbeat > configured seconds old)
        /// </summary>
        public bool IsStale()
        {
            try
            {
                if (string.IsNullOrEmpty(lastHeartbeat))
                {
                    return true;
                }

                DateTime lastBeat = DateTime.Parse(lastHeartbeat);
                double secondsSinceLastBeat = (DateTime.UtcNow - lastBeat).TotalSeconds;

                return secondsSinceLastBeat > HeartbeatStaleSeconds;
            }
            catch
            {
                return true; // If we can't parse, assume stale
            }
        }
    }
}
