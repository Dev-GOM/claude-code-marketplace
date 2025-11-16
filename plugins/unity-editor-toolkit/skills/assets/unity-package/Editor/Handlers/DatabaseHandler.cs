using System;
using System.IO;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Database command handler
    /// SQLite 데이터베이스 관리 명령어
    /// </summary>
    public class DatabaseHandler : BaseHandler
    {
        public override string Category => "Database";

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
                    return HandleReset();
                case "RunMigrations":
                    return HandleRunMigrations();
                case "ClearMigrations":
                    return HandleClearMigrations();
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
        private object HandleReset()
        {
            var config = DatabaseConfig.LoadFromEditorPrefs();
            string dbPath = config.DatabaseFilePath;

            // Disconnect first
            if (DatabaseManager.Instance.IsConnected)
            {
                DatabaseManager.Instance.ShutdownAsync().AsTask().GetAwaiter().GetResult();
            }

            // Delete database file
            bool fileDeleted = false;
            if (File.Exists(dbPath))
            {
                try
                {
                    File.Delete(dbPath);
                    fileDeleted = true;
                    Debug.Log($"[DatabaseHandler] Database file deleted: {dbPath}");
                }
                catch (Exception ex)
                {
                    return new OperationResult
                    {
                        success = false,
                        message = $"Failed to delete database file: {ex.Message}"
                    };
                }
            }

            // Reconnect (will run migrations automatically)
            var result = DatabaseManager.Instance.InitializeAsync(config).AsTask().GetAwaiter().GetResult();

            return new OperationResult
            {
                success = result.Success,
                message = result.Success
                    ? $"Database reset successfully. File deleted: {fileDeleted}"
                    : $"Reset failed: {result.ErrorMessage}"
            };
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
    #endregion
}
