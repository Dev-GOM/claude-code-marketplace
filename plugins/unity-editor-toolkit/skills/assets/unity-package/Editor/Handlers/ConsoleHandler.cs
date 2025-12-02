using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Console commands
    /// </summary>
    public class ConsoleHandler : BaseHandler
    {
        public override string Category => "Console";

        // Store console logs (Queue로 변경 - O(1) 삽입/삭제)
        private static Queue<ConsoleLogEntry> logEntries = new Queue<ConsoleLogEntry>(1000);
        private static readonly object logLock = new object();
        private static bool isListening = false;

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetLogs":
                    return HandleGetLogs(request);
                case "Clear":
                    return HandleClear(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        public static void StartListening()
        {
            if (isListening) return;

            Application.logMessageReceived += OnLogMessageReceived;
            isListening = true;
        }

        public static void StopListening()
        {
            if (!isListening) return;

            Application.logMessageReceived -= OnLogMessageReceived;
            isListening = false;
        }

        private static void OnLogMessageReceived(string message, string stackTrace, LogType type)
        {
            lock (logLock)
            {
                logEntries.Enqueue(new ConsoleLogEntry
                {
                    message = message,
                    stackTrace = stackTrace,
                    type = (int)type,
                    timestamp = DateTime.Now.ToString("HH:mm:ss.fff")
                });

                // Keep only last 1000 logs (✅ O(1) 연산으로 최적화)
                if (logEntries.Count > 1000)
                {
                    logEntries.Dequeue();
                }
            }
        }

        private object HandleGetLogs(JsonRpcRequest request)
        {
            var param = request.GetParams<GetLogsParams>() ?? new GetLogsParams { count = 50 };
            var logs = new List<ConsoleLogEntry>();

            #if UNITY_EDITOR
            // Get logs from Unity Editor Console using Reflection
            try
            {
                var assembly = Assembly.GetAssembly(typeof(UnityEditor.Editor));
                if (assembly != null)
                {
                    var logEntriesType = assembly.GetType("UnityEditor.LogEntries");
                    var logEntryType = assembly.GetType("UnityEditor.LogEntry");

                    if (logEntriesType != null && logEntryType != null)
                    {
                        // Get total count
                        var getCountMethod = logEntriesType.GetMethod("GetCount", BindingFlags.Static | BindingFlags.Public);
                        int totalCount = getCountMethod != null ? (int)getCountMethod.Invoke(null, null) : 0;

                        // Start from the most recent logs
                        int start = Math.Max(0, totalCount - param.count);

                        // Get entries
                        var getEntryMethod = logEntriesType.GetMethod("GetEntryInternal", BindingFlags.Static | BindingFlags.Public);

                        if (getEntryMethod != null)
                        {
                            for (int i = start; i < totalCount; i++)
                            {
                                var entry = Activator.CreateInstance(logEntryType);
                                var parameters = new object[] { i, entry };
                                getEntryMethod.Invoke(null, parameters);

                                // Extract fields
                                var messageField = logEntryType.GetField("message", BindingFlags.Public | BindingFlags.Instance);
                                var conditionField = logEntryType.GetField("condition", BindingFlags.Public | BindingFlags.Instance);
                                var modeField = logEntryType.GetField("mode", BindingFlags.Public | BindingFlags.Instance);

                                string message = conditionField != null ? (string)conditionField.GetValue(entry) : "";
                                string stackTrace = messageField != null ? (string)messageField.GetValue(entry) : "";
                                int mode = modeField != null ? (int)modeField.GetValue(entry) : 0;

                                // If message is empty, use first line of stackTrace as message
                                if (string.IsNullOrEmpty(message) && !string.IsNullOrEmpty(stackTrace))
                                {
                                    int firstNewLine = stackTrace.IndexOf('\n');
                                    if (firstNewLine > 0)
                                    {
                                        message = stackTrace.Substring(0, firstNewLine);
                                    }
                                    else
                                    {
                                        message = stackTrace;
                                    }
                                }

                                // Convert mode to LogType
                                LogType logType = ConvertModeToLogType(mode);

                                // Filter by type
                                if (param.errorsOnly)
                                {
                                    if (logType != LogType.Error && logType != LogType.Exception)
                                        continue;
                                }
                                else if (!param.includeWarnings)
                                {
                                    if (logType == LogType.Warning)
                                        continue;
                                }

                                logs.Add(new ConsoleLogEntry
                                {
                                    message = message,
                                    stackTrace = stackTrace,
                                    type = (int)logType,
                                    timestamp = "" // Editor 로그는 실제 발생 시간을 알 수 없음
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("ConsoleHandler", $"Failed to get Editor console logs: {ex.Message}");

                // Fallback to runtime logs
                lock (logLock)
                {
                    var logArray = logEntries.ToArray();
                    int start = Math.Max(0, logArray.Length - param.count);

                    for (int i = start; i < logArray.Length; i++)
                    {
                        var log = logArray[i];

                        // Filter by type
                        if (param.errorsOnly)
                        {
                            if (log.type != (int)LogType.Error && log.type != (int)LogType.Exception)
                                continue;
                        }
                        else if (!param.includeWarnings)
                        {
                            if (log.type == (int)LogType.Warning)
                                continue;
                        }

                        logs.Add(log);
                    }
                }
            }
            #else
            // Runtime: use Application.logMessageReceived logs
            lock (logLock)
            {
                var logArray = logEntries.ToArray();
                int start = Math.Max(0, logArray.Length - param.count);

                for (int i = start; i < logArray.Length; i++)
                {
                    var log = logArray[i];

                    if (param.errorsOnly)
                    {
                        if (log.type != (int)LogType.Error && log.type != (int)LogType.Exception)
                            continue;
                    }
                    else if (!param.includeWarnings)
                    {
                        if (log.type == (int)LogType.Warning)
                            continue;
                    }

                    logs.Add(log);
                }
            }
            #endif

            return logs;
        }

        private LogType ConvertModeToLogType(int mode)
        {
            // Unity LogEntry mode flags
            // Error = 1 << 0 = 1
            // Assert = 1 << 1 = 2
            // Log = 1 << 2 = 4
            // Fatal = 1 << 4 = 16
            // DontPreprocessCondition = 1 << 5 = 32
            // AssetImportError = 1 << 6 = 64
            // AssetImportWarning = 1 << 7 = 128
            // ScriptingError = 1 << 8 = 256
            // ScriptingWarning = 1 << 9 = 512
            // ScriptingLog = 1 << 10 = 1024
            // ScriptCompileError = 1 << 11 = 2048
            // ScriptCompileWarning = 1 << 12 = 4096
            // StickyError = 1 << 13 = 8192
            // MayIgnoreLineNumber = 1 << 14 = 16384
            // ReportBug = 1 << 15 = 32768
            // DisplayPreviousErrorInStatusBar = 1 << 16 = 65536
            // ScriptingException = 1 << 17 = 131072
            // DontExtractStacktrace = 1 << 18 = 262144
            // ShouldClearOnPlay = 1 << 19 = 524288
            // GraphCompileError = 1 << 20 = 1048576
            // ScriptingAssertion = 1 << 21 = 2097152

            // Check error flags
            if ((mode & (1 | 64 | 256 | 2048 | 1048576)) != 0)
                return LogType.Error;

            // Check exception flags
            if ((mode & 131072) != 0)
                return LogType.Exception;

            // Check warning flags
            if ((mode & (128 | 512 | 4096)) != 0)
                return LogType.Warning;

            // Check assert flags
            if ((mode & (2 | 2097152)) != 0)
                return LogType.Assert;

            // Default to Log
            return LogType.Log;
        }

        private object HandleClear(JsonRpcRequest request)
        {
            lock (logLock)
            {
                logEntries.Clear();
            }

            #if UNITY_EDITOR
            // Also clear Unity Editor console (✅ Reflection null 체크 추가)
            try
            {
                var assembly = Assembly.GetAssembly(typeof(UnityEditor.Editor));
                if (assembly != null)
                {
                    var type = assembly.GetType("UnityEditor.LogEntries");
                    if (type != null)
                    {
                        var method = type.GetMethod("Clear");
                        if (method != null)
                        {
                            method.Invoke(null, null);
                        }
                        else
                        {
                            ToolkitLogger.LogWarning("ConsoleHandler", "LogEntries.Clear method not found");
                        }
                    }
                    else
                    {
                        ToolkitLogger.LogWarning("ConsoleHandler", "UnityEditor.LogEntries type not found");
                    }
                }
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("ConsoleHandler", $"Failed to clear Editor console: {ex.Message}");
            }
            #endif

            return new { success = true };
        }

        // Parameter classes
        [Serializable]
        public class GetLogsParams
        {
            public int count = 50;
            public bool errorsOnly = false;
            public bool includeWarnings = true;
        }

        [Serializable]
        public class ConsoleLogEntry
        {
            public string message;
            public string stackTrace;
            public int type; // LogType: Error=0, Assert=1, Warning=2, Log=3, Exception=4
            public string timestamp;
        }
    }
}
