using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEditorToolkit.Protocol;

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

            lock (logLock)
            {
                var logs = new List<ConsoleLogEntry>();

                // Queue를 Array로 변환하여 인덱스 접근
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

                return logs;
            }
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
                            Debug.LogWarning("LogEntries.Clear method not found");
                        }
                    }
                    else
                    {
                        Debug.LogWarning("UnityEditor.LogEntries type not found");
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"Failed to clear Editor console: {ex.Message}");
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
            public bool includeWarnings = false;
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
