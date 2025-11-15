using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditor;
using UnityEditor.Compilation;
using UnityEditorToolkit.Editor.Database.Commands;

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
                Debug.Log("[DatabaseManager] Domain Reload 감지 - 연결 상태 저장 및 정리 중...");

                // 연결 상태 저장
                EditorPrefs.SetBool(PREF_KEY_DB_WAS_CONNECTED, true);
                if (instance.config != null)
                {
                    EditorPrefs.SetString(PREF_KEY_DB_PATH, instance.config.DatabasePath);
                    EditorPrefs.SetBool(PREF_KEY_DB_ENABLE_WAL, instance.config.EnableWAL);
                }

                // 연결 정리 (동기 방식)
                try
                {
                    instance.connector?.DisconnectAsync().Forget();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[DatabaseManager] Shutdown 중 예외: {ex.Message}");
                }
            }
        }

        private static void OnAfterAssemblyReload()
        {
            // 이전에 연결되어 있었는지 확인
            bool wasConnected = EditorPrefs.GetBool(PREF_KEY_DB_WAS_CONNECTED, false);

            if (wasConnected)
            {
                Debug.Log("[DatabaseManager] Domain Reload 완료 - 자동 재연결 시도...");

                // 연결 상태 플래그 클리어
                EditorPrefs.DeleteKey(PREF_KEY_DB_WAS_CONNECTED);

                // 설정 복원 및 재연결
                string dbPath = EditorPrefs.GetString(PREF_KEY_DB_PATH, "");
                bool enableWAL = EditorPrefs.GetBool(PREF_KEY_DB_ENABLE_WAL, true);

                if (!string.IsNullOrEmpty(dbPath))
                {
                    var config = new DatabaseConfig
                    {
                        DatabasePath = dbPath,
                        EnableWAL = enableWAL
                    };

                    // 비동기 재연결
                    Instance.InitializeAsync(config).Forget();
                    Debug.Log("[DatabaseManager] 자동 재연결 완료.");
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
        private bool isInitialized = false;
        private bool isConnected = false;
        private CancellationTokenSource lifecycleCts;
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
        #endregion

        #region Initialization
        /// <summary>
        /// 데이터베이스 초기화
        /// </summary>
        /// <param name="config">데이터베이스 설정</param>
        public async UniTask<InitializationResult> InitializeAsync(DatabaseConfig config)
        {
            // 이미 초기화된 경우
            if (isInitialized)
            {
                Debug.LogWarning("[DatabaseManager] 이미 초기화되었습니다. Shutdown 후 재초기화하세요.");
                return new InitializationResult
                {
                    Success = false,
                    ErrorMessage = "Already initialized. Call Shutdown() first."
                };
            }

            // 데이터베이스 비활성화 시
            if (!config.EnableDatabase)
            {
                Debug.Log("[DatabaseManager] 데이터베이스 기능이 비활성화되어 있습니다.");
                return new InitializationResult
                {
                    Success = true,
                    Message = "Database feature is disabled."
                };
            }

            // 설정 유효성 검증
            var validation = config.Validate();
            if (!validation.IsValid)
            {
                Debug.LogError($"[DatabaseManager] 설정 유효성 검증 실패: {validation.ErrorMessage}");
                return new InitializationResult
                {
                    Success = false,
                    ErrorMessage = validation.ErrorMessage
                };
            }

            try
            {
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
                    Debug.LogError($"[DatabaseManager] 연결 실패: {connectResult.ErrorMessage}");
                    await CleanupAsync();
                    return new InitializationResult
                    {
                        Success = false,
                        ErrorMessage = connectResult.ErrorMessage
                    };
                }

                isConnected = true;
                isInitialized = true;

                Debug.Log($"[DatabaseManager] 초기화 완료: {this.config.DatabaseFilePath}");
                return new InitializationResult
                {
                    Success = true,
                    Message = "Initialization successful."
                };
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DatabaseManager] 초기화 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
                await CleanupAsync();
                return new InitializationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
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

            Debug.Log("[DatabaseManager] Shutting down...");

            try
            {
                // CancellationToken 취소
                lifecycleCts?.Cancel();

                // 리소스 정리
                await CleanupAsync();

                isInitialized = false;
                isConnected = false;

                Debug.Log("[DatabaseManager] Shutdown 완료.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DatabaseManager] Shutdown 중 예외 발생: {ex.Message}");
            }
        }

        /// <summary>
        /// 내부 리소스 정리
        /// </summary>
        private async UniTask CleanupAsync()
        {
            try
            {
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
                Debug.LogError($"[DatabaseManager] Cleanup 중 예외 발생: {ex.Message}");
            }
        }
        #endregion

        #region Connection Management
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
                Debug.LogError($"[DatabaseManager] 연결 테스트 실패: {ex.Message}");
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
                Debug.LogWarning("[DatabaseManager] 초기화되지 않았습니다.");
                return false;
            }

            try
            {
                Debug.Log("[DatabaseManager] 재연결 시도 중...");

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
                    Debug.Log("[DatabaseManager] 재연결 성공.");
                }
                else
                {
                    Debug.LogError($"[DatabaseManager] 재연결 실패: {result.ErrorMessage}");
                }

                return isConnected;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DatabaseManager] 재연결 중 예외 발생: {ex.Message}");
                isConnected = false;
                return false;
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
