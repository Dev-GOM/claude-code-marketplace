using UnityEngine;
using UnityEditor;

namespace UnityEditorToolkit.Editor.Utils
{
    /// <summary>
    /// Centralized logging utility with log level filtering
    /// All handlers should use this instead of Debug.Log directly
    /// </summary>
    public static class ToolkitLogger
    {
        public enum LogLevel
        {
            None = 0,
            Error = 1,
            Warning = 2,
            Info = 3,
            Debug = 4
        }

        private const string PREF_LOG_LEVEL = "UnityEditorToolkit.Server.LogLevel";
        private const string PREFIX = "[UnityEditorToolkit]";

        /// <summary>
        /// Current log level (shared with EditorWebSocketServer)
        /// </summary>
        public static LogLevel CurrentLogLevel
        {
            get => (LogLevel)EditorPrefs.GetInt(PREF_LOG_LEVEL, (int)LogLevel.Info);
            set => EditorPrefs.SetInt(PREF_LOG_LEVEL, (int)value);
        }

        /// <summary>
        /// Log an error message (always shown unless LogLevel.None)
        /// </summary>
        public static void LogError(string message)
        {
            if (CurrentLogLevel >= LogLevel.Error)
            {
                Debug.LogError($"{PREFIX} {message}");
            }
        }

        /// <summary>
        /// Log an error message with context
        /// </summary>
        public static void LogError(string category, string message)
        {
            if (CurrentLogLevel >= LogLevel.Error)
            {
                Debug.LogError($"{PREFIX}[{category}] {message}");
            }
        }

        /// <summary>
        /// Log a warning message
        /// </summary>
        public static void LogWarning(string message)
        {
            if (CurrentLogLevel >= LogLevel.Warning)
            {
                Debug.LogWarning($"{PREFIX} {message}");
            }
        }

        /// <summary>
        /// Log a warning message with context
        /// </summary>
        public static void LogWarning(string category, string message)
        {
            if (CurrentLogLevel >= LogLevel.Warning)
            {
                Debug.LogWarning($"{PREFIX}[{category}] {message}");
            }
        }

        /// <summary>
        /// Log an info message
        /// </summary>
        public static void Log(string message)
        {
            if (CurrentLogLevel >= LogLevel.Info)
            {
                Debug.Log($"{PREFIX} {message}");
            }
        }

        /// <summary>
        /// Log an info message with context
        /// </summary>
        public static void Log(string category, string message)
        {
            if (CurrentLogLevel >= LogLevel.Info)
            {
                Debug.Log($"{PREFIX}[{category}] {message}");
            }
        }

        /// <summary>
        /// Log a debug message (verbose)
        /// </summary>
        public static void LogDebug(string message)
        {
            if (CurrentLogLevel >= LogLevel.Debug)
            {
                Debug.Log($"{PREFIX}[DEBUG] {message}");
            }
        }

        /// <summary>
        /// Log a debug message with context (verbose)
        /// </summary>
        public static void LogDebug(string category, string message)
        {
            if (CurrentLogLevel >= LogLevel.Debug)
            {
                Debug.Log($"{PREFIX}[{category}][DEBUG] {message}");
            }
        }

        /// <summary>
        /// Check if a log level is enabled
        /// </summary>
        public static bool IsLogLevelEnabled(LogLevel level)
        {
            return CurrentLogLevel >= level;
        }
    }
}
