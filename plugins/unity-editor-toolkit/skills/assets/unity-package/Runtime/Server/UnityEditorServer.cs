using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Handlers;
using UnityEditorToolkit.Utils;
using Newtonsoft.Json;

// Note: websocket-sharp requires adding the DLL to ThirdParty folder
// Download from: https://github.com/sta/websocket-sharp
using WebSocketSharp;
using WebSocketSharp.Server;

namespace UnityEditorToolkit.Server
{
    /// <summary>
    /// Unity Editor WebSocket Server
    /// Provides JSON-RPC 2.0 API for controlling Unity Editor via WebSocket
    /// </summary>
    [ExecuteAlways]
    public class UnityEditorServer : MonoBehaviour
    {
        public enum LogLevel
        {
            None = 0,
            Error = 1,
            Warning = 2,
            Info = 3,
            Debug = 4
        }

        [Header("Server Settings")]
        [Tooltip("WebSocket server port (default: 9500)")]
        public int port = 9500;

        [Tooltip("Auto-start server on scene load")]
        public bool autoStart = true;

        [Tooltip("Maximum number of concurrent connections")]
        public int maxConnections = 5;

        [Tooltip("Command execution timeout in seconds")]
        public float commandTimeout = 30f;

        [Header("Logging")]
        [Tooltip("Logging level for debugging")]
        public LogLevel logLevel = LogLevel.Info;

        [Header("Status")]
        [SerializeField] private bool isRunning = false;
        [SerializeField] private int connectedClients = 0;

        private WebSocketServer server;
        private Dictionary<string, BaseHandler> handlers;
        private HashSet<string> activeConnections = new HashSet<string>();
        private float serverStartTime = 0f;
        private float lastHeartbeatTime = 0f;
        private const float HeartbeatInterval = 5f; // Update heartbeat every 5 seconds

        private void Awake()
        {
            // Ensure Main Thread Dispatcher exists
            UnityMainThreadDispatcher.Instance();

            // Initialize handlers
            handlers = new Dictionary<string, BaseHandler>
            {
                { "GameObject", new GameObjectHandler() },
                { "Transform", new TransformHandler() },
                { "Scene", new SceneHandler() },
                { "Console", new ConsoleHandler() },
                { "Hierarchy", new HierarchyHandler() }
            };

            // Start console logging
            ConsoleHandler.StartListening();
        }

        private void Start()
        {
            if (autoStart)
            {
                StartServer();
            }
        }

        private void OnDestroy()
        {
            StopServer();
            ConsoleHandler.StopListening();
        }

        private void Update()
        {
            // Periodic heartbeat update
            if (isRunning && Time.realtimeSinceStartup - lastHeartbeatTime > HeartbeatInterval)
            {
                lastHeartbeatTime = Time.realtimeSinceStartup;

                try
                {
                    string projectRoot = Path.GetDirectoryName(Application.dataPath);
                    ServerStatus status = ServerStatus.Load(projectRoot);

                    if (status != null)
                    {
                        status.UpdateHeartbeat();

                        bool saved = ServerStatus.Save(status, projectRoot);
                        if (!saved)
                        {
                            Log("Failed to save heartbeat update", LogLevel.Warning);
                        }
                    }
                    else
                    {
                        Log("Failed to load server status for heartbeat update", LogLevel.Warning);
                    }
                }
                catch (Exception e)
                {
                    Log($"Error updating heartbeat: {e.Message}", LogLevel.Error);
                }
            }
        }

        /// <summary>
        /// Start WebSocket server
        /// </summary>
        public void StartServer()
        {
            if (isRunning)
            {
                Log($"Server already running on port {port}", LogLevel.Warning);
                return;
            }

            try
            {
                server = new WebSocketServer(port);
                server.AddWebSocketService<EditorService>("/", () => new EditorService(this));
                server.Start();

                isRunning = true;
                serverStartTime = Time.realtimeSinceStartup;
                lastHeartbeatTime = Time.realtimeSinceStartup;

                // Save server status
                string projectRoot = Path.GetDirectoryName(Application.dataPath);
                ServerStatus status = ServerStatus.Create(port);
                ServerStatus.Save(status, projectRoot);

                Log($"✓ Unity Editor Server started on ws://127.0.0.1:{port}", LogLevel.Info);
            }
            catch (Exception ex)
            {
                Log($"Failed to start server: {ex.Message}", LogLevel.Error);
                isRunning = false;
            }
        }

        /// <summary>
        /// Stop WebSocket server
        /// </summary>
        public void StopServer()
        {
            if (!isRunning || server == null)
            {
                return;
            }

            try
            {
                // Mark server as stopped
                string projectRoot = Path.GetDirectoryName(Application.dataPath);
                ServerStatus.MarkStopped(projectRoot);

                server.Stop();
                server = null;
                isRunning = false;
                connectedClients = 0;
                activeConnections.Clear();
                Log("Unity Editor Server stopped", LogLevel.Info);
            }
            catch (Exception ex)
            {
                Log($"Error stopping server: {ex.Message}", LogLevel.Error);
            }
        }

        /// <summary>
        /// Handle JSON-RPC request (메인 스레드에서 실행됨)
        /// </summary>
        internal string HandleRequest(string message)
        {
            JsonRpcRequest request = null;
            float startTime = Time.realtimeSinceStartup;

            try
            {
                // Parse JSON-RPC request
                request = JsonConvert.DeserializeObject<JsonRpcRequest>(message);

                if (request == null || !request.IsValid())
                {
                    return new JsonRpcErrorResponse(null, JsonRpcError.InvalidRequest()).ToJson();
                }

                Log($"Request: {request.Method}", LogLevel.Debug);

                // Health check (ping)
                if (request.Method == "ping")
                {
                    return new JsonRpcResponse(request.Id, new
                    {
                        status = "ok",
                        version = "0.1.0",
                        uptime = Time.realtimeSinceStartup - serverStartTime,
                        handlers = new List<string>(handlers.Keys),
                        connectedClients = connectedClients
                    }).ToJson();
                }

                // Extract category from method (e.g., "GameObject.Find" -> "GameObject")
                string category = GetCategory(request.Method);

                if (!handlers.ContainsKey(category))
                {
                    return new JsonRpcErrorResponse(request.Id, JsonRpcError.MethodNotFound(request.Method)).ToJson();
                }

                // Handle request with appropriate handler
                var handler = handlers[category];
                var result = handler.Handle(request);

                // Check timeout
                float elapsed = Time.realtimeSinceStartup - startTime;
                if (elapsed > commandTimeout)
                {
                    Log($"Command timeout: {request.Method} took {elapsed:F2}s", LogLevel.Warning);
                }

                // Return success response
                return new JsonRpcResponse(request.Id, result).ToJson();
            }
            catch (JsonException ex)
            {
                Log($"JSON Parse Error: {ex.Message}", LogLevel.Error);
                return new JsonRpcErrorResponse(null, JsonRpcError.ParseError(ex.Message)).ToJson();
            }
            catch (Exception ex)
            {
                Log($"Request Handler Error: {ex.Message}\n{ex.StackTrace}", LogLevel.Error);
                // ✅ request?.Id 사용 (High 이슈 해결)
                return new JsonRpcErrorResponse(request?.Id, JsonRpcError.InternalError(ex.Message)).ToJson();
            }
        }

        private string GetCategory(string method)
        {
            int dotIndex = method.IndexOf('.');
            if (dotIndex < 0)
            {
                throw new Exception($"Invalid method format: {method}");
            }
            return method.Substring(0, dotIndex);
        }

        internal bool OnClientConnected(string connectionId)
        {
            if (activeConnections.Count >= maxConnections)
            {
                Log($"Max connections reached ({maxConnections}), rejecting connection", LogLevel.Warning);
                return false;
            }

            activeConnections.Add(connectionId);
            connectedClients++;
            Log($"Client connected: {connectionId} (total: {connectedClients})", LogLevel.Info);
            return true;
        }

        internal void OnClientDisconnected(string connectionId)
        {
            if (activeConnections.Remove(connectionId))
            {
                connectedClients--;
                Log($"Client disconnected: {connectionId} (remaining: {connectedClients})", LogLevel.Info);
            }
        }

        /// <summary>
        /// 로깅 메서드
        /// </summary>
        private void Log(string message, LogLevel level)
        {
            if (level <= logLevel)
            {
                string prefix = "[UnityEditorToolkit]";
                switch (level)
                {
                    case LogLevel.Error:
                        Debug.LogError($"{prefix} {message}");
                        break;
                    case LogLevel.Warning:
                        Debug.LogWarning($"{prefix} {message}");
                        break;
                    case LogLevel.Info:
                    case LogLevel.Debug:
                        Debug.Log($"{prefix} {message}");
                        break;
                }
            }
        }

        /// <summary>
        /// WebSocket service behavior
        /// </summary>
        private class EditorService : WebSocketBehavior
        {
            private UnityEditorServer server;

            public EditorService(UnityEditorServer server)
            {
                this.server = server;
            }

            protected override void OnOpen()
            {
                // Check max connections
                if (!server.OnClientConnected(ID))
                {
                    Context.WebSocket.Close(CloseStatusCode.PolicyViolation, "Max connections reached");
                }
            }

            protected override void OnClose(CloseEventArgs e)
            {
                server.OnClientDisconnected(ID);
            }

            protected override void OnMessage(MessageEventArgs e)
            {
                // ✅ Critical 이슈 해결: WebSocket 스레드에서 메인 스레드로 작업 전달
                string message = e.Data;

                // Unity API는 반드시 메인 스레드에서만 호출
                UnityMainThreadDispatcher.Instance().Enqueue(() =>
                {
                    try
                    {
                        // 메인 스레드에서 요청 처리
                        string response = server.HandleRequest(message);

                        // 응답 전송 (Send는 스레드 안전)
                        if (!string.IsNullOrEmpty(response))
                        {
                            Send(response);
                        }
                    }
                    catch (Exception ex)
                    {
                        server.Log($"Error processing message: {ex.Message}", LogLevel.Error);

                        // 에러 응답 전송
                        var errorResponse = new JsonRpcErrorResponse(null,
                            JsonRpcError.InternalError(ex.Message)).ToJson();
                        Send(errorResponse);
                    }
                });
            }

            protected override void OnError(WebSocketSharp.ErrorEventArgs e)
            {
                server.Log($"WebSocket Error: {e.Message}", LogLevel.Error);
            }
        }
    }
}
