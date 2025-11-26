using System;
using System.IO;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Utils;
using Cysharp.Threading.Tasks;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Database command handler
    /// SQLite 데이터베이스 관리 명령어
    /// </summary>
    public class DatabaseHandler : BaseHandler
    {
        public override string Category => "Database";

        // Reset operation state tracking (for async reset via ResponseQueue)
        private static bool resetInProgress = false;
        private static OperationResult resetResult = null;

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Status":
                    return HandleStatus();
                case "Connect":
                    return HandleConnect(request);
                case "Disconnect":
                    return HandleDisconnect();
                case "Reset":
                    return HandleReset(request);
                case "RunMigrations":
                    return HandleRunMigrations();
                case "ClearMigrations":
                    return HandleClearMigrations();
                case "Undo":
                    return HandleUndo();
                case "Redo":
                    return HandleRedo();
                case "GetHistory":
                    return HandleGetHistory(request);
                case "ClearHistory":
                    return HandleClearHistory();
                case "Query":
                    return HandleQuery(request);
                default:
                    throw new ArgumentException($"Unknown method: {method}");
            }
        }

        #region Status
        private object HandleStatus()
        {
            var manager = DatabaseManager.Instance;
            var health = manager.GetHealthStatus();

            return new DatabaseStatusResult
            {
                isInitialized = health.IsInitialized,
                isConnected = health.IsConnected,
                isEnabled = health.IsEnabled,
                databaseFilePath = health.DatabaseFilePath,
                databaseFileExists = health.DatabaseFileExists,
                undoCount = manager.CommandHistory?.UndoCount ?? 0,
                redoCount = manager.CommandHistory?.RedoCount ?? 0
            };
        }
        #endregion

        #region Connect
        private class ConnectParams
        {
            public string databaseFilePath { get; set; }
            public bool enableWAL { get; set; } = true;
        }

        private object HandleConnect(JsonRpcRequest request)
        {
            if (DatabaseManager.Instance.IsConnected)
            {
                return new OperationResult
                {
                    success = true,
                    message = "Already connected"
                };
            }

            var config = DatabaseConfig.LoadFromEditorPrefs();

            // Override with request params if provided
            if (request.Params != null)
            {
                var paramsObj = request.GetParams<ConnectParams>();
                if (paramsObj != null)
                {
                    if (!string.IsNullOrEmpty(paramsObj.databaseFilePath))
                    {
                        config.DatabaseFilePath = paramsObj.databaseFilePath;
                    }
                    config.EnableWAL = paramsObj.enableWAL;
                }
            }

            // Synchronous wrapper (blocking call) - Convert UniTask to Task for synchronous execution
            var result = DatabaseManager.Instance.InitializeAsync(config).AsTask().GetAwaiter().GetResult();

            return new OperationResult
            {
                success = result.Success,
                message = result.Success ? "Connected successfully" : result.ErrorMessage
            };
        }
        #endregion

        #region Disconnect
        private object HandleDisconnect()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new OperationResult
                {
                    success = true,
                    message = "Not connected"
                };
            }

            // Synchronous wrapper - Convert UniTask to Task for synchronous execution
            DatabaseManager.Instance.ShutdownAsync().AsTask().GetAwaiter().GetResult();

            return new OperationResult
            {
                success = true,
                message = "Disconnected successfully"
            };
        }
        #endregion

        #region Reset
        private object HandleReset(JsonRpcRequest request)
        {
            // Check if reset is already in progress
            if (resetInProgress)
            {
                return new OperationResult
                {
                    success = false,
                    message = "Reset operation already in progress"
                };
            }

            // Get send callback from request context
            var sendCallback = request.GetContext<Action<string>>("sendCallback");
            if (sendCallback == null)
            {
                throw new Exception("Send callback not found in request context");
            }

            string requestId = request.Id?.ToString() ?? string.Empty;

            // Start async reset operation
            resetInProgress = true;
            resetResult = null;

            // Fire and forget async operation
            ResetDatabaseAsync().Forget();

            // Register delayed response
            ResponseQueue.Instance.Register(
                requestId,
                condition: () => !resetInProgress,
                resultProvider: () => resetResult ?? new OperationResult
                {
                    success = false,
                    message = "Reset operation failed unexpectedly"
                },
                sendCallback,
                timeoutSeconds: 120.0 // 2 minutes timeout
            );

            // Return null to indicate delayed response
            return null;
        }

        private async UniTaskVoid ResetDatabaseAsync()
        {
            try
            {
                var config = DatabaseConfig.LoadFromEditorPrefs();
                string dbPath = config.DatabaseFilePath;

                ToolkitLogger.Log("DatabaseHandler", "Starting database reset...");

                // Shutdown first (check IsInitialized, not just IsConnected)
                if (DatabaseManager.Instance.IsInitialized)
                {
                    try
                    {
                        ToolkitLogger.Log("DatabaseHandler", "Shutting down database...");
                        await DatabaseManager.Instance.ShutdownAsync();
                        ToolkitLogger.Log("DatabaseHandler", "Database shutdown complete.");
                    }
                    catch (Exception ex)
                    {
                        ToolkitLogger.LogWarning("DatabaseHandler", $"Shutdown warning: {ex.Message}");
                    }
                }

                // Delete database file
                bool fileDeleted = false;
                if (File.Exists(dbPath))
                {
                    try
                    {
                        File.Delete(dbPath);
                        fileDeleted = true;
                        ToolkitLogger.Log("DatabaseHandler", $"Database file deleted: {dbPath}");
                    }
                    catch (Exception ex)
                    {
                        resetResult = new OperationResult
                        {
                            success = false,
                            message = $"Failed to delete database file: {ex.Message}"
                        };
                        resetInProgress = false;
                        return;
                    }
                }

                // Reconnect (will run migrations automatically)
                ToolkitLogger.Log("DatabaseHandler", "Reconnecting to database...");
                var result = await DatabaseManager.Instance.InitializeAsync(config);

                resetResult = new OperationResult
                {
                    success = result.Success,
                    message = result.Success
                        ? $"Database reset successfully. File deleted: {fileDeleted}"
                        : $"Reset failed: {result.ErrorMessage}"
                };

                ToolkitLogger.Log("DatabaseHandler", $"Reset complete: {resetResult.message}");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseHandler", $"Reset exception: {ex.Message}");
                resetResult = new OperationResult
                {
                    success = false,
                    message = $"Reset failed: {ex.Message}"
                };
            }
            finally
            {
                resetInProgress = false;
            }
        }
        #endregion

        #region RunMigrations
        private object HandleRunMigrations()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new OperationResult
                {
                    success = false,
                    message = "Not connected to database"
                };
            }

            var runner = new MigrationRunner(DatabaseManager.Instance);
            var result = runner.RunMigrationsAsync().AsTask().GetAwaiter().GetResult();

            return new MigrationOperationResult
            {
                success = result.Success,
                message = result.Success
                    ? $"Migrations completed: {result.MigrationsApplied} applied"
                    : result.ErrorMessage,
                migrationsApplied = result.MigrationsApplied
            };
        }
        #endregion

        #region ClearMigrations
        private object HandleClearMigrations()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new OperationResult
                {
                    success = false,
                    message = "Not connected to database"
                };
            }

            try
            {
                var connection = DatabaseManager.Instance.Connector.Connection;
                int deleted = connection.Execute("DELETE FROM migrations");

                return new OperationResult
                {
                    success = true,
                    message = $"Cleared {deleted} migration record(s)"
                };
            }
            catch (Exception ex)
            {
                return new OperationResult
                {
                    success = false,
                    message = $"Failed to clear migrations: {ex.Message}"
                };
            }
        }
        #endregion

        #region Undo
        private object HandleUndo()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = "Not connected to database",
                    commandName = "",
                    remainingUndo = 0,
                    remainingRedo = 0
                };
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null || history.UndoCount == 0)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = "Nothing to undo",
                    commandName = "",
                    remainingUndo = 0,
                    remainingRedo = history?.RedoCount ?? 0
                };
            }

            try
            {
                string commandName = history.PeekUndo()?.CommandName ?? "Unknown";
                bool result = history.Undo();

                return new UndoRedoResult
                {
                    success = result,
                    message = result ? "Undo successful" : "Undo failed",
                    commandName = commandName,
                    remainingUndo = history.UndoCount,
                    remainingRedo = history.RedoCount
                };
            }
            catch (Exception ex)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = $"Undo failed: {ex.Message}",
                    commandName = "",
                    remainingUndo = history.UndoCount,
                    remainingRedo = history.RedoCount
                };
            }
        }
        #endregion

        #region Redo
        private object HandleRedo()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = "Not connected to database",
                    commandName = "",
                    remainingUndo = 0,
                    remainingRedo = 0
                };
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null || history.RedoCount == 0)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = "Nothing to redo",
                    commandName = "",
                    remainingUndo = history?.UndoCount ?? 0,
                    remainingRedo = 0
                };
            }

            try
            {
                string commandName = history.PeekRedo()?.CommandName ?? "Unknown";
                bool result = history.Redo();

                return new UndoRedoResult
                {
                    success = result,
                    message = result ? "Redo successful" : "Redo failed",
                    commandName = commandName,
                    remainingUndo = history.UndoCount,
                    remainingRedo = history.RedoCount
                };
            }
            catch (Exception ex)
            {
                return new UndoRedoResult
                {
                    success = false,
                    message = $"Redo failed: {ex.Message}",
                    commandName = "",
                    remainingUndo = history.UndoCount,
                    remainingRedo = history.RedoCount
                };
            }
        }
        #endregion

        #region GetHistory
        private class GetHistoryParams
        {
            public int limit { get; set; } = 10;
        }

        private object HandleGetHistory(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new HistoryResult
                {
                    undoStack = new HistoryEntryResult[0],
                    redoStack = new HistoryEntryResult[0],
                    totalUndo = 0,
                    totalRedo = 0
                };
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null)
            {
                return new HistoryResult
                {
                    undoStack = new HistoryEntryResult[0],
                    redoStack = new HistoryEntryResult[0],
                    totalUndo = 0,
                    totalRedo = 0
                };
            }

            int limit = 10;
            if (request.Params != null)
            {
                var paramsObj = request.GetParams<GetHistoryParams>();
                if (paramsObj != null)
                {
                    limit = paramsObj.limit;
                }
            }

            var undoCommands = history.GetUndoStack(limit);
            var redoCommands = history.GetRedoStack(limit);

            var undoEntries = new HistoryEntryResult[undoCommands.Count];
            for (int i = 0; i < undoCommands.Count; i++)
            {
                var cmd = undoCommands[i];
                undoEntries[i] = new HistoryEntryResult
                {
                    name = cmd.CommandName,
                    timestamp = cmd.ExecutedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    canUndo = true
                };
            }

            var redoEntries = new HistoryEntryResult[redoCommands.Count];
            for (int i = 0; i < redoCommands.Count; i++)
            {
                var cmd = redoCommands[i];
                redoEntries[i] = new HistoryEntryResult
                {
                    name = cmd.CommandName,
                    timestamp = cmd.ExecutedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    canUndo = false
                };
            }

            return new HistoryResult
            {
                undoStack = undoEntries,
                redoStack = redoEntries,
                totalUndo = history.UndoCount,
                totalRedo = history.RedoCount
            };
        }
        #endregion

        #region ClearHistory
        private object HandleClearHistory()
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new OperationResult
                {
                    success = false,
                    message = "Not connected to database"
                };
            }

            var history = DatabaseManager.Instance.CommandHistory;
            if (history == null)
            {
                return new OperationResult
                {
                    success = false,
                    message = "Command history not available"
                };
            }

            try
            {
                int undoCount = history.UndoCount;
                int redoCount = history.RedoCount;
                history.Clear();

                return new OperationResult
                {
                    success = true,
                    message = $"Cleared {undoCount} undo and {redoCount} redo entries"
                };
            }
            catch (Exception ex)
            {
                return new OperationResult
                {
                    success = false,
                    message = $"Failed to clear history: {ex.Message}"
                };
            }
        }
        #endregion

        #region Query
        private class QueryParams
        {
            public string table { get; set; }
            public int limit { get; set; } = 100;
        }

        // Pre-defined table schemas for safe querying
        private class MigrationRecord
        {
            public int migration_id { get; set; }
            public string migration_name { get; set; }
            public string applied_at { get; set; }
        }

        private class CommandHistoryQueryRecord
        {
            public string command_id { get; set; }
            public string command_name { get; set; }
            public string command_type { get; set; }
            public string command_data { get; set; }
            public string executed_at { get; set; }
            public string executed_by { get; set; }
        }

        private class TransformQueryRecord
        {
            public int transform_id { get; set; }
            public int object_id { get; set; }
            public float position_x { get; set; }
            public float position_y { get; set; }
            public float position_z { get; set; }
            public float rotation_x { get; set; }
            public float rotation_y { get; set; }
            public float rotation_z { get; set; }
            public float rotation_w { get; set; }
            public float scale_x { get; set; }
            public float scale_y { get; set; }
            public float scale_z { get; set; }
            public string recorded_at { get; set; }
        }

        private object HandleQuery(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                return new QueryResult
                {
                    success = false,
                    message = "Not connected to database",
                    rows = new object[0],
                    columns = new string[0],
                    rowCount = 0
                };
            }

            if (request.Params == null)
            {
                return new QueryResult
                {
                    success = false,
                    message = "Table name is required. Supported: migrations, command_history, transforms",
                    rows = new object[0],
                    columns = new string[0],
                    rowCount = 0
                };
            }

            var paramsObj = request.GetParams<QueryParams>();
            if (paramsObj == null || string.IsNullOrEmpty(paramsObj.table))
            {
                return new QueryResult
                {
                    success = false,
                    message = "Table name is required. Supported: migrations, command_history, transforms",
                    rows = new object[0],
                    columns = new string[0],
                    rowCount = 0
                };
            }

            try
            {
                var connection = DatabaseManager.Instance.Connector.Connection;
                var results = new System.Collections.Generic.List<System.Collections.Generic.Dictionary<string, object>>();
                string[] columnNames = null;

                string tableName = paramsObj.table.ToLower().Trim();

                switch (tableName)
                {
                    case "migrations":
                        {
                            columnNames = new[] { "migration_id", "migration_name", "applied_at" };
                            string sql = $"SELECT migration_id, migration_name, applied_at FROM migrations ORDER BY migration_id DESC LIMIT {paramsObj.limit}";
                            var records = connection.Query<MigrationRecord>(sql);

                            foreach (var record in records)
                            {
                                var row = new System.Collections.Generic.Dictionary<string, object>
                                {
                                    ["migration_id"] = record.migration_id,
                                    ["migration_name"] = record.migration_name,
                                    ["applied_at"] = record.applied_at
                                };
                                results.Add(row);
                            }
                        }
                        break;

                    case "command_history":
                        {
                            columnNames = new[] { "command_id", "command_name", "command_type", "command_data", "executed_at", "executed_by" };
                            string sql = $"SELECT command_id, command_name, command_type, command_data, executed_at, executed_by FROM command_history ORDER BY executed_at DESC LIMIT {paramsObj.limit}";
                            var records = connection.Query<CommandHistoryQueryRecord>(sql);

                            foreach (var record in records)
                            {
                                var row = new System.Collections.Generic.Dictionary<string, object>
                                {
                                    ["command_id"] = record.command_id,
                                    ["command_name"] = record.command_name,
                                    ["command_type"] = record.command_type,
                                    ["command_data"] = record.command_data,
                                    ["executed_at"] = record.executed_at,
                                    ["executed_by"] = record.executed_by
                                };
                                results.Add(row);
                            }
                        }
                        break;

                    case "transforms":
                        {
                            columnNames = new[] { "transform_id", "object_id", "position_x", "position_y", "position_z", "rotation_x", "rotation_y", "rotation_z", "rotation_w", "scale_x", "scale_y", "scale_z", "recorded_at" };
                            string sql = $"SELECT transform_id, object_id, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, rotation_w, scale_x, scale_y, scale_z, recorded_at FROM transforms ORDER BY recorded_at DESC LIMIT {paramsObj.limit}";
                            var records = connection.Query<TransformQueryRecord>(sql);

                            foreach (var record in records)
                            {
                                var row = new System.Collections.Generic.Dictionary<string, object>
                                {
                                    ["transform_id"] = record.transform_id,
                                    ["object_id"] = record.object_id,
                                    ["position_x"] = record.position_x,
                                    ["position_y"] = record.position_y,
                                    ["position_z"] = record.position_z,
                                    ["rotation_x"] = record.rotation_x,
                                    ["rotation_y"] = record.rotation_y,
                                    ["rotation_z"] = record.rotation_z,
                                    ["rotation_w"] = record.rotation_w,
                                    ["scale_x"] = record.scale_x,
                                    ["scale_y"] = record.scale_y,
                                    ["scale_z"] = record.scale_z,
                                    ["recorded_at"] = record.recorded_at
                                };
                                results.Add(row);
                            }
                        }
                        break;

                    default:
                        return new QueryResult
                        {
                            success = false,
                            message = $"Unknown table: {paramsObj.table}. Supported: migrations, command_history, transforms",
                            rows = new object[0],
                            columns = new string[0],
                            rowCount = 0
                        };
                }

                return new QueryResult
                {
                    success = true,
                    message = $"Query executed successfully. {results.Count} row(s) returned.",
                    rows = results.ToArray(),
                    columns = columnNames ?? new string[0],
                    rowCount = results.Count
                };
            }
            catch (Exception ex)
            {
                return new QueryResult
                {
                    success = false,
                    message = $"Query failed: {ex.Message}",
                    rows = new object[0],
                    columns = new string[0],
                    rowCount = 0
                };
            }
        }
        #endregion
    }

    #region Response Types
    public class DatabaseStatusResult
    {
        public bool isInitialized { get; set; }
        public bool isConnected { get; set; }
        public bool isEnabled { get; set; }
        public string databaseFilePath { get; set; }
        public bool databaseFileExists { get; set; }
        public int undoCount { get; set; }
        public int redoCount { get; set; }
    }

    public class OperationResult
    {
        public bool success { get; set; }
        public string message { get; set; }
    }

    public class MigrationOperationResult : OperationResult
    {
        public int migrationsApplied { get; set; }
    }

    public class UndoRedoResult : OperationResult
    {
        public string commandName { get; set; }
        public int remainingUndo { get; set; }
        public int remainingRedo { get; set; }
    }

    public class HistoryEntryResult
    {
        public string name { get; set; }
        public string timestamp { get; set; }
        public bool canUndo { get; set; }
    }

    public class HistoryResult
    {
        public HistoryEntryResult[] undoStack { get; set; }
        public HistoryEntryResult[] redoStack { get; set; }
        public int totalUndo { get; set; }
        public int totalRedo { get; set; }
    }

    public class QueryResult : OperationResult
    {
        public object[] rows { get; set; }
        public string[] columns { get; set; }
        public int rowCount { get; set; }
    }
    #endregion
}
