using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using SQLite;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database
{
    /// <summary>
    /// SQLite 데이터베이스 커넥터
    /// 임베디드 SQLite - 설치 불필요
    /// </summary>
    public class SQLiteConnector
    {
        #region Fields
        private readonly DatabaseConfig config;
        private SQLiteConnection connection;
        private bool isConnected;
        #endregion

        #region Properties
        /// <summary>
        /// 연결 상태
        /// </summary>
        public bool IsConnected => isConnected && connection != null;

        /// <summary>
        /// SQLite 연결 객체
        /// </summary>
        public SQLiteConnection Connection => connection;
        #endregion

        #region Constructor
        public SQLiteConnector(DatabaseConfig config)
        {
            this.config = config ?? throw new ArgumentNullException(nameof(config));
        }
        #endregion

        #region Connection Management
        /// <summary>
        /// 데이터베이스 연결
        /// </summary>
        public async UniTask<ConnectionResult> ConnectAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                if (isConnected)
                {
                    ToolkitLogger.LogWarning("SQLiteConnector", "Already connected.");
                    return new ConnectionResult
                    {
                        Success = true,
                        Message = "Already connected."
                    };
                }

                ToolkitLogger.Log("SQLiteConnector", $" Connecting to: {config.DatabaseFilePath}");

                // SQLite 연결 생성 (동기 작업이지만 UniTask로 래핑)
                await UniTask.RunOnThreadPool(() =>
                {
                    // SQLite 연결 옵션 설정
                    var options = new SQLiteConnectionString(
                        config.DatabaseFilePath,
                        SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.FullMutex,
                        storeDateTimeAsTicks: true
                    );

                    connection = new SQLiteConnection(options);

                    // WAL 모드 설정 (성능 향상)
                    if (config.EnableWAL)
                    {
                        try
                        {
                            connection.Execute("PRAGMA journal_mode=WAL;");
                            ToolkitLogger.Log("SQLiteConnector", "WAL mode enabled.");
                        }
                        catch (Exception walEx)
                        {
                            ToolkitLogger.LogWarning("SQLiteConnector", $" WAL mode failed (continuing without WAL): {walEx.Message}");
                        }
                    }

                    // Foreign Keys 활성화
                    try
                    {
                        connection.Execute("PRAGMA foreign_keys=ON;");
                    }
                    catch (Exception fkEx)
                    {
                        ToolkitLogger.LogWarning("SQLiteConnector", $" Foreign keys activation failed: {fkEx.Message}");
                    }

                    // Synchronous 설정 (NORMAL = 안전하면서도 빠름)
                    try
                    {
                        connection.Execute("PRAGMA synchronous=NORMAL;");
                    }
                    catch (Exception syncEx)
                    {
                        ToolkitLogger.LogWarning("SQLiteConnector", $" Synchronous setting failed: {syncEx.Message}");
                    }

                }, cancellationToken: cancellationToken);

                isConnected = true;

                ToolkitLogger.Log("SQLiteConnector", $" Connected successfully: {config.DatabaseFilePath}");
                return new ConnectionResult
                {
                    Success = true,
                    Message = "Connection successful."
                };
            }
            catch (OperationCanceledException)
            {
                ToolkitLogger.LogWarning("SQLiteConnector", "Connection cancelled.");
                return new ConnectionResult
                {
                    Success = false,
                    ErrorMessage = "Connection cancelled."
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Connection failed: {ex.Message}\n{ex.StackTrace}");
                return new ConnectionResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// 데이터베이스 연결 해제 (비동기)
        /// </summary>
        public async UniTask DisconnectAsync()
        {
            try
            {
                if (!isConnected)
                {
                    return;
                }

                ToolkitLogger.Log("SQLiteConnector", "Disconnecting...");

                await UniTask.RunOnThreadPool(() =>
                {
                    DisconnectInternal();
                });

                isConnected = false;

                // 강제 GC (파일 핸들 해제를 위해)
                GC.Collect();
                GC.WaitForPendingFinalizers();

                ToolkitLogger.Log("SQLiteConnector", "Disconnected.");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Disconnect error: {ex.Message}");
            }
        }

        /// <summary>
        /// 데이터베이스 연결 해제 (동기 - Assembly Reload/서버 종료 시 사용)
        /// </summary>
        public void Disconnect()
        {
            try
            {
                if (!isConnected)
                {
                    return;
                }

                ToolkitLogger.Log("SQLiteConnector", "Disconnecting (sync)...");

                DisconnectInternal();

                isConnected = false;

                ToolkitLogger.Log("SQLiteConnector", "Disconnected (sync).");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Disconnect error: {ex.Message}");
            }
        }

        /// <summary>
        /// 내부 연결 해제 로직
        /// </summary>
        private void DisconnectInternal()
        {
            // WAL 체크포인트 수행 (파일 잠금 해제를 위해)
            if (config.EnableWAL && connection != null)
            {
                try
                {
                    connection.Execute("PRAGMA wal_checkpoint(TRUNCATE);");
                    ToolkitLogger.Log("SQLiteConnector", "WAL checkpoint completed.");
                }
                catch (Exception walEx)
                {
                    ToolkitLogger.LogWarning("SQLiteConnector", $" WAL checkpoint failed: {walEx.Message}");
                }
            }

            connection?.Close();
            connection?.Dispose();
            connection = null;
        }

        /// <summary>
        /// 연결 테스트
        /// </summary>
        public async UniTask<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                if (!isConnected || connection == null)
                {
                    return false;
                }

                // 간단한 쿼리로 연결 테스트
                await UniTask.RunOnThreadPool(() =>
                {
                    connection.ExecuteScalar<int>("SELECT 1;");
                }, cancellationToken: cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Connection test failed: {ex.Message}");
                return false;
            }
        }
        #endregion

        #region Database Operations
        /// <summary>
        /// SQL 스크립트 실행 (마이그레이션용)
        /// </summary>
        public async UniTask<int> ExecuteScriptAsync(string sql, CancellationToken cancellationToken = default)
        {
            if (!isConnected || connection == null)
            {
                throw new InvalidOperationException("Database is not connected.");
            }

            try
            {
                return await UniTask.RunOnThreadPool(() =>
                {
                    return connection.Execute(sql);
                }, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Execute script failed: {ex.Message}\n{sql}");
                throw;
            }
        }

        /// <summary>
        /// 단일 값 조회
        /// </summary>
        public async UniTask<T> ExecuteScalarAsync<T>(string sql, CancellationToken cancellationToken = default)
        {
            if (!isConnected || connection == null)
            {
                throw new InvalidOperationException("Database is not connected.");
            }

            try
            {
                return await UniTask.RunOnThreadPool(() =>
                {
                    return connection.ExecuteScalar<T>(sql);
                }, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Execute scalar failed: {ex.Message}\n{sql}");
                throw;
            }
        }

        /// <summary>
        /// 데이터베이스 파일 존재 여부 확인
        /// </summary>
        public bool DatabaseFileExists()
        {
            return System.IO.File.Exists(config.DatabaseFilePath);
        }

        /// <summary>
        /// SQLite 버전 조회
        /// </summary>
        public async UniTask<string> GetDatabaseVersionAsync()
        {
            if (!isConnected || connection == null)
            {
                return "Not Connected";
            }

            try
            {
                return await UniTask.RunOnThreadPool(() =>
                {
                    var result = connection.ExecuteScalar<string>("SELECT sqlite_version();");
                    return $"SQLite {result}";
                });
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SQLiteConnector", $" Failed to get version: {ex.Message}");
                return "Unknown";
            }
        }
        #endregion
    }

    #region Result Struct
    /// <summary>
    /// 연결 결과
    /// </summary>
    public struct ConnectionResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
    }
    #endregion
}
