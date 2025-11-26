using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditor;
using UnityEditor.Compilation;
using UnityEditorToolkit.Editor.Database.Commands;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database
{
    /// <summary>
    /// SQLite 데이터베이스 관리 싱글톤
    /// 임베디드 SQLite - 설치 불필요, 단일 파일 DB
    /// Domain Reload 시 자동으로 연결 정리 및 재연결
    /// </summary>
    [InitializeOnLoad]
    public class DatabaseManager
    {
        #region Domain Reload Handling
        private const string PREF_KEY_DB_WAS_CONNECTED = "UnityEditorToolkit.Database.WasConnected";
        private const string PREF_KEY_DB_PATH = "UnityEditorToolkit.Database.Path";
        private const string PREF_KEY_DB_ENABLE_WAL = "UnityEditorToolkit.Database.EnableWAL";

        static DatabaseManager()
        {
            // Domain Reload 전: 연결 정리
            AssemblyReloadEvents.beforeAssemblyReload += OnBeforeAssemblyReload;

            // Domain Reload 후: 자동 재연결
            EditorApplication.delayCall += OnAfterAssemblyReload;
        }

        private static void OnBeforeAssemblyReload()
        {
            if (instance != null && instance.IsConnected)
            {
                ToolkitLogger.Log("DatabaseManager", "Domain Reload 감지 - 연결 상태 저장 및 정리 중...");

                // 연결 상태 저장
                EditorPrefs.SetBool(PREF_KEY_DB_WAS_CONNECTED, true);
                if (instance.config != null)
                {
                    EditorPrefs.SetString(PREF_KEY_DB_PATH, instance.config.DatabaseFilePath);
                    EditorPrefs.SetBool(PREF_KEY_DB_ENABLE_WAL, instance.config.EnableWAL);
                }

                // 연결 정리 (동기 방식)
                try
                {
                    instance.connector?.DisconnectAsync().Forget();
                }
                catch (Exception ex)
                {
                    ToolkitLogger.LogError("DatabaseManager", $" Shutdown 중 예외: {ex.Message}");
                }
            }
        }

        private static void OnAfterAssemblyReload()
        {
            // 이전에 연결되어 있었는지 확인
            bool wasConnected = EditorPrefs.GetBool(PREF_KEY_DB_WAS_CONNECTED, false);

            if (wasConnected)
            {
                ToolkitLogger.Log("DatabaseManager", "Domain Reload 완료 - 자동 재연결 시도...");

                // 연결 상태 플래그 클리어
                EditorPrefs.DeleteKey(PREF_KEY_DB_WAS_CONNECTED);

                // 설정 복원 및 재연결
                string dbPath = EditorPrefs.GetString(PREF_KEY_DB_PATH, "");
                bool enableWAL = EditorPrefs.GetBool(PREF_KEY_DB_ENABLE_WAL, true);

                if (!string.IsNullOrEmpty(dbPath))
                {
                    var config = new DatabaseConfig
                    {
                        DatabaseFilePath = dbPath,
                        EnableWAL = enableWAL
                    };

                    // 비동기 재연결
                    Instance.InitializeAsync(config).Forget();
                    ToolkitLogger.Log("DatabaseManager", "자동 재연결 완료.");
                }
            }
        }
        #endregion

        #region Singleton
        private static DatabaseManager instance;
        private static readonly object @lock = new object();

        public static DatabaseManager Instance
        {
            get
            {
                if (instance == null)
                {
                    lock (@lock)
                    {
                        if (instance == null)
                        {
                            instance = new DatabaseManager();
                        }
                    }
                }
                return instance;
            }
        }

        private DatabaseManager()
        {
            // Private constructor for singleton
        }
        #endregion

        #region Fields
        private DatabaseConfig config;
        private SQLiteConnector connector;
        private CommandHistory commandHistory;
        private SyncManager syncManager;
        private bool isInitialized = false;
        private bool isConnected = false;
        private CancellationTokenSource lifecycleCts;
        private static bool isInitializing = false; // Race condition prevention
        private static UniTaskCompletionSource<InitializationResult> initializationTcs; // Wait-based: 초기화 결과 공유
        private bool isMigrationRunning = false; // Migration in progress flag
        #endregion

        #region Properties
        /// <summary>
        /// 데이터베이스 초기화 완료 여부
        /// </summary>
        public bool IsInitialized => isInitialized;

        /// <summary>
        /// 데이터베이스 연결 상태
        /// </summary>
        public bool IsConnected => isConnected && connector != null && connector.IsConnected;

        /// <summary>
        /// 현재 데이터베이스 설정
        /// </summary>
        public DatabaseConfig Config => config;

        /// <summary>
        /// SQLite 커넥터
        /// </summary>
        public SQLiteConnector Connector => connector;

        /// <summary>
        /// Command History (Undo/Redo)
        /// </summary>
        public CommandHistory CommandHistory => commandHistory;

        /// <summary>
        /// Sync Manager (실시간 동기화)
        /// </summary>
        public SyncManager SyncManager => syncManager;

        /// <summary>
        /// 마이그레이션 실행 중 여부
        /// </summary>
        public bool IsMigrationRunning => isMigrationRunning;
        #endregion

        #region Initialization
        /// <summary>
        /// 데이터베이스 초기화
        /// </summary>
        /// <param name="config">데이터베이스 설정</param>
        public async UniTask<InitializationResult> InitializeAsync(DatabaseConfig config)
        {
            // Wait-based: 이미 진행 중인 초기화가 있으면 완료 대기
            UniTaskCompletionSource<InitializationResult> existingTcs = null;

            // Race condition prevention: 이미 초기화 진행 중인 경우
            lock (@lock)
            {
                if (isInitializing)
                {
                    // 진행 중인 초기화가 있으면 TCS 참조 저장 (lock 밖에서 대기)
                    existingTcs = initializationTcs;
                }
                else if (isInitialized)
                {
                    // 이미 초기화된 경우
                    ToolkitLogger.LogWarning("DatabaseManager", "이미 초기화되었습니다. Shutdown 후 재초기화하세요.");
                    return new InitializationResult
                    {
                        Success = false,
                        ErrorMessage = "Already initialized. Call Shutdown() first."
                    };
                }
                else
                {
                    // 새로운 초기화 시작
                    isInitializing = true;
                    initializationTcs = new UniTaskCompletionSource<InitializationResult>();
                }
            }

            // 진행 중인 초기화가 있으면 완료될 때까지 대기 후 결과 공유
            if (existingTcs != null)
            {
                ToolkitLogger.Log("DatabaseManager", "다른 초기화가 진행 중입니다. 완료를 대기합니다...");
                return await existingTcs.Task;
            }

            // 새로운 초기화 시작
            InitializationResult result = default;

            try
            {
                // 데이터베이스 비활성화 시
                if (!config.EnableDatabase)
                {
                    ToolkitLogger.Log("DatabaseManager", "데이터베이스 기능이 비활성화되어 있습니다.");
                    result = new InitializationResult
                    {
                        Success = true,
                        Message = "Database feature is disabled."
                    };
                    return result;
                }

                // 설정 유효성 검증
                var validation = config.Validate();
                if (!validation.IsValid)
                {
                    ToolkitLogger.LogError("DatabaseManager", $" 설정 유효성 검증 실패: {validation.ErrorMessage}");
                    result = new InitializationResult
                    {
                        Success = false,
                        ErrorMessage = validation.ErrorMessage
                    };
                    return result;
                }

                // 설정 저장
                this.config = config;

                // CancellationTokenSource 생성
                lifecycleCts = new CancellationTokenSource();

                // SQLite 커넥터 생성
                connector = new SQLiteConnector(this.config);

                // Command History 생성
                commandHistory = new CommandHistory(this);

                // 연결 테스트
                var connectResult = await connector.ConnectAsync(lifecycleCts.Token);
                if (!connectResult.Success)
                {
                    ToolkitLogger.LogError("DatabaseManager", $" 연결 실패: {connectResult.ErrorMessage}");
                    await CleanupAsync();
                    result = new InitializationResult
                    {
                        Success = false,
                        ErrorMessage = connectResult.ErrorMessage
                    };
                    return result;
                }

                isConnected = true;
                isInitialized = true;

                // 자동 마이그레이션 실행
                await RunAutoMigrationAsync(lifecycleCts.Token);

                // SyncManager 초기화
                syncManager = new SyncManager(this);
                ToolkitLogger.Log("DatabaseManager", "SyncManager initialized.");

                ToolkitLogger.Log("DatabaseManager", $" 초기화 완료: {this.config.DatabaseFilePath}");
                result = new InitializationResult
                {
                    Success = true,
                    Message = "Initialization successful."
                };
                return result;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" 초기화 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
                await CleanupAsync();
                result = new InitializationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
                return result;
            }
            finally
            {
                // TCS에 결과 설정하여 대기 중인 호출자들에게 결과 전달
                lock (@lock)
                {
                    isInitializing = false;
                    var tcs = initializationTcs;
                    initializationTcs = null;
                    tcs?.TrySetResult(result);
                }
            }
        }

        /// <summary>
        /// 데이터베이스 종료 및 리소스 정리
        /// </summary>
        public async UniTask ShutdownAsync()
        {
            if (!isInitialized)
            {
                return;
            }

            ToolkitLogger.Log("DatabaseManager", "Shutting down...");

            try
            {
                // CancellationToken 취소
                lifecycleCts?.Cancel();

                // 리소스 정리
                await CleanupAsync();

                isInitialized = false;
                isConnected = false;

                ToolkitLogger.Log("DatabaseManager", "Shutdown 완료.");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" Shutdown 중 예외 발생: {ex.Message}");
            }
        }

        /// <summary>
        /// 내부 리소스 정리
        /// </summary>
        private async UniTask CleanupAsync()
        {
            try
            {
                // SyncManager 정리
                if (syncManager != null)
                {
                    syncManager.Dispose();
                    syncManager = null;
                    ToolkitLogger.Log("DatabaseManager", "SyncManager disposed.");
                }

                // Command History 정리
                if (commandHistory != null)
                {
                    commandHistory.Clear();
                    commandHistory = null;
                }

                // 커넥터 정리
                if (connector != null)
                {
                    await connector.DisconnectAsync();
                    connector = null;
                }

                // CancellationTokenSource 정리
                lifecycleCts?.Dispose();
                lifecycleCts = null;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" Cleanup 중 예외 발생: {ex.Message}");
            }
        }
        #endregion

        #region Connection Management
        /// <summary>
        /// 데이터베이스 연결 해제 (동기 방식 - 서버 종료/Assembly Reload 시 사용)
        /// </summary>
        public void Disconnect()
        {
            if (!isInitialized || !isConnected)
            {
                return;
            }

            ToolkitLogger.Log("DatabaseManager", "서버 종료로 인한 연결 해제...");

            try
            {
                // CancellationToken 취소
                lifecycleCts?.Cancel();

                // SyncManager 정리
                if (syncManager != null)
                {
                    syncManager.Dispose();
                    syncManager = null;
                }

                // Command History 정리
                if (commandHistory != null)
                {
                    commandHistory.Clear();
                    commandHistory = null;
                }

                // 커넥터 정리 (동기 방식)
                connector?.Disconnect();
                connector = null;

                // CancellationTokenSource 정리
                lifecycleCts?.Dispose();
                lifecycleCts = null;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" Disconnect 중 예외: {ex.Message}");
            }
            finally
            {
                // 상태 업데이트
                isConnected = false;
                isInitialized = false;
            }

            ToolkitLogger.Log("DatabaseManager", "연결 해제 완료.");
        }

        /// <summary>
        /// 연결 상태 확인
        /// </summary>
        public async UniTask<bool> TestConnectionAsync()
        {
            if (!isInitialized || connector == null)
            {
                return false;
            }

            try
            {
                return await connector.TestConnectionAsync(lifecycleCts?.Token ?? default);
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" 연결 테스트 실패: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 연결 재시도
        /// </summary>
        public async UniTask<bool> ReconnectAsync()
        {
            if (!isInitialized || config == null)
            {
                ToolkitLogger.LogWarning("DatabaseManager", "초기화되지 않았습니다.");
                return false;
            }

            try
            {
                ToolkitLogger.Log("DatabaseManager", "재연결 시도 중...");

                // 기존 연결 종료
                if (connector != null)
                {
                    await connector.DisconnectAsync();
                }

                // 새 커넥터 생성
                connector = new SQLiteConnector(config);

                // 연결
                var result = await connector.ConnectAsync(lifecycleCts?.Token ?? default);
                isConnected = result.Success;

                if (isConnected)
                {
                    ToolkitLogger.Log("DatabaseManager", "재연결 성공.");
                }
                else
                {
                    ToolkitLogger.LogError("DatabaseManager", $" 재연결 실패: {result.ErrorMessage}");
                }

                return isConnected;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseManager", $" 재연결 중 예외 발생: {ex.Message}");
                isConnected = false;
                return false;
            }
        }
        #endregion

        #region Auto Migration
        /// <summary>
        /// 자동 마이그레이션 실행 (연결 시 자동 호출)
        /// </summary>
        private async UniTask RunAutoMigrationAsync(CancellationToken cancellationToken)
        {
            isMigrationRunning = true;
            try
            {
                ToolkitLogger.Log("DatabaseManager", "자동 마이그레이션 확인 중...");

                var migrationRunner = new MigrationRunner(this);
                var result = await migrationRunner.RunMigrationsAsync(cancellationToken);

                if (result.Success)
                {
                    if (result.MigrationsApplied > 0)
                    {
                        ToolkitLogger.Log("DatabaseManager", $" 자동 마이그레이션 완료: {result.MigrationsApplied}개 적용됨");
                    }
                    else
                    {
                        ToolkitLogger.Log("DatabaseManager", "마이그레이션이 최신 상태입니다.");
                    }
                }
                else
                {
                    ToolkitLogger.LogWarning("DatabaseManager", $" 자동 마이그레이션 실패: {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("DatabaseManager", $" 자동 마이그레이션 중 예외 발생: {ex.Message}");
                // 마이그레이션 실패해도 연결은 유지
            }
            finally
            {
                isMigrationRunning = false;
            }
        }
        #endregion

        #region Health Check
        /// <summary>
        /// 데이터베이스 상태 정보 조회
        /// </summary>
        public DatabaseHealthStatus GetHealthStatus()
        {
            return new DatabaseHealthStatus
            {
                IsInitialized = isInitialized,
                IsConnected = IsConnected,
                IsEnabled = config?.EnableDatabase ?? false,
                DatabaseFilePath = config?.DatabaseFilePath ?? "N/A",
                DatabaseFileExists = connector?.DatabaseFileExists() ?? false
            };
        }
        #endregion
    }

    #region Result Structs
    /// <summary>
    /// 초기화 결과
    /// </summary>
    public struct InitializationResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
    }

    /// <summary>
    /// 데이터베이스 상태
    /// </summary>
    public struct DatabaseHealthStatus
    {
        public bool IsInitialized;
        public bool IsConnected;
        public bool IsEnabled;
        public string DatabaseFilePath;
        public bool DatabaseFileExists;

        public override string ToString()
        {
            return $"[DatabaseHealthStatus]\n" +
                   $"  Initialized: {IsInitialized}\n" +
                   $"  Connected: {IsConnected}\n" +
                   $"  Enabled: {IsEnabled}\n" +
                   $"  Database File: {DatabaseFilePath}\n" +
                   $"  File Exists: {DatabaseFileExists}";
        }
    }
    #endregion
}
