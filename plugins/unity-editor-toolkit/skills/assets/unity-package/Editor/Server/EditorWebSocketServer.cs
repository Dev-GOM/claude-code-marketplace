using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Handlers;
using UnityEditorToolkit.Editor.Utils;
using Newtonsoft.Json;
using WebSocketSharp;
using WebSocketSharp.Server;
using LogLevel = UnityEditorToolkit.Editor.Utils.ToolkitLogger.LogLevel;

namespace UnityEditorToolkit.Editor.Server
{
    /// <summary>
    /// Editor WebSocket Server (Scene-independent)
    /// Runs automatically in the background using EditorApplication.update
    /// No GameObject required
    /// </summary>
    [InitializeOnLoad]
    public class EditorWebSocketServer
    {
        // LogLevel is now imported from Logger class

        // Singleton instance
        private static EditorWebSocketServer instance;
        public static EditorWebSocketServer Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = new EditorWebSocketServer();
                }
                return instance;
            }
        }

        // Server settings (stored in EditorPrefs)
        private const string PREF_PORT = "UnityEditorToolkit.Server.Port";
        private const string PREF_AUTO_START = "UnityEditorToolkit.Server.AutoStart";
        private const string PREF_MAX_CONNECTIONS = "UnityEditorToolkit.Server.MaxConnections";
        private const string PREF_COMMAND_TIMEOUT = "UnityEditorToolkit.Server.CommandTimeout";
        private const string PREF_LOG_LEVEL = "UnityEditorToolkit.Server.LogLevel";

        public int Port
        {
            get => EditorPrefs.GetInt(PREF_PORT, 9500);
            set => EditorPrefs.SetInt(PREF_PORT, value);
        }

        public bool AutoStart
        {
            get => EditorPrefs.GetBool(PREF_AUTO_START, true);
            set => EditorPrefs.SetBool(PREF_AUTO_START, value);
        }

        public int MaxConnections
        {
            get => EditorPrefs.GetInt(PREF_MAX_CONNECTIONS, 5);
            set => EditorPrefs.SetInt(PREF_MAX_CONNECTIONS, value);
        }

        public float CommandTimeout
        {
            get => EditorPrefs.GetFloat(PREF_COMMAND_TIMEOUT, 30f);
            set => EditorPrefs.SetFloat(PREF_COMMAND_TIMEOUT, value);
        }

        public LogLevel CurrentLogLevel
        {
            get => ToolkitLogger.CurrentLogLevel;
            set => ToolkitLogger.CurrentLogLevel = value;
        }

        // Server state
        public bool IsRunning { get; private set; }
        public int ConnectedClients => activeConnections.Count;

        // Server state change events
        public event Action OnServerStarted;
        public event Action OnServerStopped;

        private WebSocketServer server;
        private Dictionary<string, BaseHandler> handlers;
        private HashSet<string> activeConnections = new HashSet<string>();
        private double serverStartTime = 0;
        private double lastHeartbeatTime = 0;
        private const double HeartbeatInterval = 5.0; // seconds

        /// <summary>
        /// Static constructor - automatically called when Unity Editor starts
        /// </summary>
        static EditorWebSocketServer()
        {
            // Initialize instance
            var instance = Instance;

            // Auto-start if enabled
            if (instance.AutoStart)
            {
                instance.StartServer();
            }

            // Register update callback
            EditorApplication.update += instance.OnUpdate;

            // Handle domain reload
            AssemblyReloadEvents.beforeAssemblyReload += instance.OnBeforeAssemblyReload;
        }

        /// <summary>
        /// Private constructor
        /// </summary>
        private EditorWebSocketServer()
        {
            // Initialize handlers
            handlers = new Dictionary<string, BaseHandler>
            {
                { "GameObject", new GameObjectHandler() },
                { "Transform", new TransformHandler() },
                { "Component", new ComponentHandler() },
                { "Scene", new SceneHandler() },
                { "Console", new ConsoleHandler() },
                { "Hierarchy", new HierarchyHandler() },
                { "Editor", new EditorHandler() },
                { "Prefs", new PrefsHandler() },
                { "Wait", new WaitHandler() },
                { "Database", new DatabaseHandler() },
                { "Snapshot", new SnapshotHandler() },
                { "TransformHistory", new TransformHistoryHandler() },
                { "Sync", new SyncHandler() },
                { "Analytics", new AnalyticsHandler() },
                { "Menu", new MenuHandler() },
                { "Asset", new AssetHandler() },
                { "Prefab", new PrefabHandler() },
                { "Material", new MaterialHandler() },
                { "Animation", new AnimationHandler() }
            };

            // Initialize ChainHandler with access to all handlers
            var chainHandler = new ChainHandler();
            chainHandler.SetHandlers(handlers);
            handlers.Add("Chain", chainHandler);

            // Start console logging
            ConsoleHandler.StartListening();
        }

        /// <summary>
        /// Called every editor frame
        /// </summary>
        private void OnUpdate()
        {
            // Process pending delayed responses
            ResponseQueue.Instance.Update();

            // Periodic heartbeat update
            if (IsRunning && EditorApplication.timeSinceStartup - lastHeartbeatTime > HeartbeatInterval)
            {
                lastHeartbeatTime = EditorApplication.timeSinceStartup;

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
        /// Handle assembly reload (script compilation)
        /// </summary>
        private void OnBeforeAssemblyReload()
        {
            // Cancel all pending responses before domain reload
            // This notifies clients that their requests are cancelled due to compilation
            ResponseQueue.Instance.CancelAllPending("Script compilation started, request cancelled");

            StopServer();
        }

        /// <summary>
        /// Start WebSocket server
        /// </summary>
        public void StartServer()
        {
            if (IsRunning)
            {
                Log($"Server already running on port {Port}", LogLevel.Warning);
                return;
            }

            try
            {
                server = new WebSocketServer(Port);
                server.AddWebSocketService<EditorService>("/", () => new EditorService(this));
                server.Start();

                IsRunning = true;
                serverStartTime = EditorApplication.timeSinceStartup;
                lastHeartbeatTime = EditorApplication.timeSinceStartup;

                // Save server status
                string projectRoot = Path.GetDirectoryName(Application.dataPath);
                ServerStatus status = ServerStatus.Create(Port);
                ServerStatus.Save(status, projectRoot);

                Log($"✓ Unity Editor Server started on ws://127.0.0.1:{Port}", LogLevel.Info);

                // Notify subscribers
                OnServerStarted?.Invoke();
            }
            catch (Exception ex)
            {
                Log($"Failed to start server: {ex.Message}", LogLevel.Error);
                IsRunning = false;
            }
        }

        /// <summary>
        /// Stop WebSocket server
        /// </summary>
        public void StopServer()
        {
            if (!IsRunning || server == null)
            {
                return;
            }

            try
            {
                // Cancel all pending responses before stopping server
                ResponseQueue.Instance.CancelAllPending("Server stopping");

                // Mark server as stopped
                string projectRoot = Path.GetDirectoryName(Application.dataPath);
                ServerStatus.MarkStopped(projectRoot);

                server.Stop();
                server = null;
                IsRunning = false;
                activeConnections.Clear();
                ConsoleHandler.StopListening();
                Log("Unity Editor Server stopped", LogLevel.Info);

                // Notify subscribers
                OnServerStopped?.Invoke();
            }
            catch (Exception ex)
            {
                Log($"Error stopping server: {ex.Message}", LogLevel.Error);
            }
        }

        /// <summary>
        /// Handle JSON-RPC request (called from main thread)
        /// </summary>
        internal string HandleRequest(string message, Action<string> sendCallback)
        {
            JsonRpcRequest request = null;
            double startTime = EditorApplication.timeSinceStartup;

            try
            {
                // Parse JSON-RPC request
                request = JsonConvert.DeserializeObject<JsonRpcRequest>(message);

                if (request == null || !request.IsValid())
                {
                    return new JsonRpcErrorResponse(null, JsonRpcError.InvalidRequest()).ToJson();
                }

                // Set send callback in request context for delayed responses
                request.SetContext("sendCallback", sendCallback);

                Log($"Request: {request.Method}", LogLevel.Debug);

                // Health check (ping)
                if (request.Method == "ping")
                {
                    return new JsonRpcResponse(request.Id, new
                    {
                        status = "ok",
                        version = "1.0.0",
                        uptime = EditorApplication.timeSinceStartup - serverStartTime,
                        handlers = new List<string>(handlers.Keys),
                        connectedClients = ConnectedClients
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

                // If result is null, it's a delayed response (handled by ResponseQueue)
                if (result == null)
                {
                    Log($"Delayed response registered for: {request.Method}", LogLevel.Debug);
                    return null;
                }

                // Check timeout
                double elapsed = EditorApplication.timeSinceStartup - startTime;
                if (elapsed > CommandTimeout)
                {
                    Log($"Command timeout: {request.Method} took {elapsed:F2}s", LogLevel.Warning);
                }
                else
                {
                    Log($"Success: {request.Method} ({elapsed:F3}s)", LogLevel.Info);
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
            if (activeConnections.Count >= MaxConnections)
            {
                Log($"Max connections reached ({MaxConnections}), rejecting connection", LogLevel.Warning);
                return false;
            }

            activeConnections.Add(connectionId);
            Log($"Client connected: {connectionId} (total: {ConnectedClients})", LogLevel.Info);
            return true;
        }

        internal void OnClientDisconnected(string connectionId)
        {
            if (activeConnections.Remove(connectionId))
            {
                Log($"Client disconnected: {connectionId} (remaining: {ConnectedClients})", LogLevel.Info);
            }
        }

        /// <summary>
        /// Logging method (delegates to centralized Logger)
        /// </summary>
        private void Log(string message, LogLevel level)
        {
            switch (level)
            {
                case LogLevel.Error:
                    ToolkitLogger.LogError("Server", message);
                    break;
                case LogLevel.Warning:
                    ToolkitLogger.LogWarning("Server", message);
                    break;
                case LogLevel.Info:
                    ToolkitLogger.Log("Server", message);
                    break;
                case LogLevel.Debug:
                    ToolkitLogger.LogDebug("Server", message);
                    break;
            }
        }

        /// <summary>
        /// WebSocket service behavior
        /// </summary>
        private class EditorService : WebSocketBehavior
        {
            private EditorWebSocketServer server;

            public EditorService(EditorWebSocketServer server)
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
                // WebSocket thread → Main thread
                string message = e.Data;

                // Unity API must be called from main thread
                EditorMainThreadDispatcher.Enqueue(() =>
                {
                    try
                    {
                        // Handle request on main thread with send callback for delayed responses
                        string response = server.HandleRequest(message, Send);

                        // Send response (Send is thread-safe)
                        // Note: response can be null for delayed responses handled by ResponseQueue
                        if (!string.IsNullOrEmpty(response))
                        {
                            Send(response);
                        }
                    }
                    catch (Exception ex)
                    {
                        server.Log($"Error processing message: {ex.Message}", LogLevel.Error);

                        // Send error response
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
