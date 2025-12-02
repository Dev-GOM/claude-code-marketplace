using System;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database
{
    /// <summary>
    /// SQLite 데이터베이스 연결 설정
    /// 임베디드 SQLite - 설치 불필요, 단일 파일 DB
    /// EditorPrefs에 개별 키로 저장/로드
    /// </summary>
    [Serializable]
    public class DatabaseConfig
    {
        #region EditorPrefs Keys
        /// <summary>
        /// EditorPrefs 키 상수
        /// </summary>
        private const string PREF_KEY_CONFIG_VERSION = "UnityEditorToolkit.Database.ConfigVersion";
        private const string PREF_KEY_ENABLE_DATABASE = "UnityEditorToolkit.Database.EnableDatabase";
        private const string PREF_KEY_FILE_PATH = "UnityEditorToolkit.Database.FilePath";
        private const string PREF_KEY_ENABLE_WAL = "UnityEditorToolkit.Database.EnableWAL";
        private const string PREF_KEY_ENABLE_ENCRYPTION = "UnityEditorToolkit.Database.EnableEncryption";
        private const string PREF_KEY_ENCRYPTION_KEY = "UnityEditorToolkit.Database.EncryptionKey";

        /// <summary>
        /// 현재 설정 버전
        /// </summary>
        public const int CURRENT_VERSION = 1;
        #endregion

        #region Private Fields
        /// <summary>
        /// 설정 버전 (마이그레이션용)
        /// v1: EnableWAL 기본값 true 변경, EnableDatabase 기본값 true 변경
        /// </summary>
        [SerializeField]
        private int configVersion = 0;

        /// <summary>
        /// 데이터베이스 기능 활성화 여부
        /// </summary>
        [SerializeField]
        private bool enableDatabase = true;

        /// <summary>
        /// SQLite 데이터베이스 파일 경로
        /// 기본값: Application.persistentDataPath + "/unity_editor_toolkit.db"
        /// </summary>
        [SerializeField]
        private string databaseFilePath = "";

        /// <summary>
        /// WAL (Write-Ahead Logging) 모드 사용 여부
        /// 성능 향상 및 동시성 개선
        /// </summary>
        [SerializeField]
        private bool enableWAL = true;

        /// <summary>
        /// 암호화 사용 여부 (SQLite Multiple Ciphers)
        /// </summary>
        [SerializeField]
        private bool enableEncryption = false;

        /// <summary>
        /// 암호화 키 (암호화 사용 시 필요)
        /// 주의: 평문 저장, 프로덕션에서는 보안 저장소 사용 권장
        /// </summary>
        [SerializeField]
        private string encryptionKey = "";
        #endregion

        #region Public Properties
        public int ConfigVersion
        {
            get => configVersion;
            set => configVersion = value;
        }

        public bool EnableDatabase
        {
            get => enableDatabase;
            set => enableDatabase = value;
        }

        public string DatabaseFilePath
        {
            get
            {
                // 빈 문자열이면 기본 경로 반환
                if (string.IsNullOrEmpty(databaseFilePath))
                {
                    return GetDefaultDatabasePath();
                }
                return databaseFilePath;
            }
            set => databaseFilePath = value;
        }

        public bool EnableWAL
        {
            get => enableWAL;
            set => enableWAL = value;
        }

        public bool EnableEncryption
        {
            get => enableEncryption;
            set => enableEncryption = value;
        }

        public string EncryptionKey
        {
            get => encryptionKey;
            set => encryptionKey = value;
        }
        #endregion

        #region Connection String
        /// <summary>
        /// SQLite 연결 문자열 생성
        /// </summary>
        /// <returns>SQLite 연결 문자열</returns>
        public string GetConnectionString()
        {
            string dbPath = DatabaseFilePath;

            // 기본 연결 문자열
            string connectionString = $"Data Source={dbPath}";

            // 암호화 사용 시
            if (enableEncryption && !string.IsNullOrEmpty(encryptionKey))
            {
                connectionString += $";Password={encryptionKey}";
            }

            return connectionString;
        }
        #endregion

        #region Static Methods
        /// <summary>
        /// 기본 데이터베이스 파일 경로 가져오기
        /// 프로젝트별로 고유한 DB 파일 생성 (Library 폴더에 저장)
        /// </summary>
        /// <returns>기본 경로</returns>
        public static string GetDefaultDatabasePath()
        {
            // 프로젝트 Library 폴더에 저장 (프로젝트별 분리, .gitignore 자동 적용)
            // Application.dataPath = "프로젝트경로/Assets"
            // Library 폴더 = "프로젝트경로/Library"
            string projectPath = Directory.GetParent(Application.dataPath)?.FullName;

            if (!string.IsNullOrEmpty(projectPath))
            {
                string libraryPath = Path.Combine(projectPath, "Library", "UnityEditorToolkit");

                // Library/UnityEditorToolkit 폴더가 없으면 생성
                if (!Directory.Exists(libraryPath))
                {
                    try
                    {
                        Directory.CreateDirectory(libraryPath);
                    }
                    catch (Exception ex)
                    {
                        ToolkitLogger.LogWarning("DatabaseConfig", $"Library 폴더 생성 실패, 대체 경로 사용: {ex.Message}");
                        return GetFallbackDatabasePath();
                    }
                }

                return Path.Combine(libraryPath, "unity_editor_toolkit.db");
            }

            // 프로젝트 경로를 가져올 수 없는 경우 대체 경로 사용
            return GetFallbackDatabasePath();
        }

        /// <summary>
        /// 대체 데이터베이스 파일 경로 (프로젝트 Library 폴더 사용 불가 시)
        /// 프로젝트 경로 해시를 사용하여 고유한 파일명 생성
        /// </summary>
        /// <returns>대체 경로</returns>
        private static string GetFallbackDatabasePath()
        {
            // 프로젝트별 고유 해시 생성 (프로젝트 경로 기반)
            string projectPath = Application.dataPath;
            string hash = GetStableHash(projectPath);

            // persistentDataPath에 프로젝트별 파일 생성
            return Path.Combine(Application.persistentDataPath, $"unity_editor_toolkit_{hash}.db");
        }

        /// <summary>
        /// 문자열의 안정적인 해시값 생성 (프로젝트 식별용)
        /// </summary>
        private static string GetStableHash(string input)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(input.ToLowerInvariant());
                byte[] hash = sha256.ComputeHash(bytes);
                // 처음 8바이트만 사용 (16자리 hex)
                return BitConverter.ToString(hash, 0, 8).Replace("-", "").ToLower();
            }
        }
        #endregion

        #region Validation
        /// <summary>
        /// 설정 유효성 검증
        /// </summary>
        /// <returns>유효성 검증 결과</returns>
        public ValidationResult Validate()
        {
            // 데이터베이스 비활성화 시 검증 통과
            if (!enableDatabase)
            {
                return new ValidationResult { IsValid = true };
            }

            // 파일 경로 검증
            string dbPath = DatabaseFilePath;
            if (string.IsNullOrWhiteSpace(dbPath))
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Database file path는 필수 항목입니다."
                };
            }

            // 디렉토리 존재 여부 확인 (없으면 생성 가능하도록 경고만)
            string directory = Path.GetDirectoryName(dbPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                try
                {
                    Directory.CreateDirectory(directory);
                }
                catch (Exception ex)
                {
                    return new ValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = $"디렉토리 생성 실패: {ex.Message}"
                    };
                }
            }

            // 암호화 사용 시 키 검증
            if (enableEncryption && string.IsNullOrWhiteSpace(encryptionKey))
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "암호화 사용 시 Encryption Key는 필수 항목입니다."
                };
            }

            return new ValidationResult { IsValid = true };
        }
        #endregion

        #region Reset
        /// <summary>
        /// 기본값으로 초기화
        /// </summary>
        public void Reset()
        {
            configVersion = CURRENT_VERSION;
            enableDatabase = true;  // SQLite는 설치 불필요, 기본 활성화
            databaseFilePath = "";
            enableWAL = true;
            enableEncryption = false;
            encryptionKey = "";
        }
        #endregion

        #region EditorPrefs Save/Load
        /// <summary>
        /// EditorPrefs에 개별 키로 저장
        /// </summary>
        public void SaveToEditorPrefs()
        {
            EditorPrefs.SetInt(PREF_KEY_CONFIG_VERSION, configVersion);
            EditorPrefs.SetBool(PREF_KEY_ENABLE_DATABASE, enableDatabase);
            EditorPrefs.SetString(PREF_KEY_FILE_PATH, databaseFilePath);
            EditorPrefs.SetBool(PREF_KEY_ENABLE_WAL, enableWAL);
            EditorPrefs.SetBool(PREF_KEY_ENABLE_ENCRYPTION, enableEncryption);
            EditorPrefs.SetString(PREF_KEY_ENCRYPTION_KEY, encryptionKey);
        }

        /// <summary>
        /// EditorPrefs에서 개별 키로 로드 (마이그레이션 포함)
        /// </summary>
        /// <returns>DatabaseConfig 인스턴스</returns>
        public static DatabaseConfig LoadFromEditorPrefs()
        {
            var config = new DatabaseConfig();

            // ConfigVersion 확인 (마이그레이션 판단용)
            int savedVersion = EditorPrefs.GetInt(PREF_KEY_CONFIG_VERSION, -1);

            if (savedVersion == -1)
            {
                // 첫 실행: 기본값 사용 (저장하지 않음)
                ToolkitLogger.Log("DatabaseConfig", "첫 실행 감지 - 기본값 사용");
                config.Reset();
                return config;
            }

            // 개별 키에서 로드
            config.configVersion = savedVersion;
            config.enableDatabase = EditorPrefs.GetBool(PREF_KEY_ENABLE_DATABASE, true);
            config.databaseFilePath = EditorPrefs.GetString(PREF_KEY_FILE_PATH, "");
            config.enableWAL = EditorPrefs.GetBool(PREF_KEY_ENABLE_WAL, true);
            config.enableEncryption = EditorPrefs.GetBool(PREF_KEY_ENABLE_ENCRYPTION, false);
            config.encryptionKey = EditorPrefs.GetString(PREF_KEY_ENCRYPTION_KEY, "");

            // 마이그레이션 필요 여부 확인
            if (config.configVersion < CURRENT_VERSION)
            {
                ToolkitLogger.Log("DatabaseConfig", $"마이그레이션: v{config.configVersion} → v{CURRENT_VERSION}");
                MigrateConfig(config);
                config.SaveToEditorPrefs(); // 마이그레이션 후 저장
            }

            return config;
        }

        /// <summary>
        /// EditorPrefs 키 모두 삭제
        /// </summary>
        public static void ClearEditorPrefs()
        {
            EditorPrefs.DeleteKey(PREF_KEY_CONFIG_VERSION);
            EditorPrefs.DeleteKey(PREF_KEY_ENABLE_DATABASE);
            EditorPrefs.DeleteKey(PREF_KEY_FILE_PATH);
            EditorPrefs.DeleteKey(PREF_KEY_ENABLE_WAL);
            EditorPrefs.DeleteKey(PREF_KEY_ENABLE_ENCRYPTION);
            EditorPrefs.DeleteKey(PREF_KEY_ENCRYPTION_KEY);
            ToolkitLogger.Log("DatabaseConfig", "EditorPrefs 초기화 완료");
        }

        /// <summary>
        /// 설정 마이그레이션 (이전 버전 → 최신 버전)
        /// </summary>
        /// <param name="config">마이그레이션할 설정</param>
        private static void MigrateConfig(DatabaseConfig config)
        {
            // v0 → v1: EnableWAL과 EnableDatabase 기본값을 true로 변경
            if (config.configVersion < 1)
            {
                bool changed = false;

                if (!config.enableWAL)
                {
                    ToolkitLogger.Log("DatabaseConfig", "마이그레이션: EnableWAL을 true로 변경 (v0 → v1)");
                    config.enableWAL = true;
                    changed = true;
                }

                if (!config.enableDatabase)
                {
                    ToolkitLogger.Log("DatabaseConfig", "마이그레이션: EnableDatabase를 true로 변경 (v0 → v1)");
                    config.enableDatabase = true;
                    changed = true;
                }

                if (changed)
                {
                    ToolkitLogger.Log("DatabaseConfig", "SQLite는 설치가 필요없으므로 Database 기능이 기본 활성화됩니다.");
                }

                config.configVersion = 1;
            }
        }
        #endregion
    }

    /// <summary>
    /// 설정 유효성 검증 결과
    /// </summary>
    public struct ValidationResult
    {
        /// <summary>
        /// 유효성 검증 통과 여부
        /// </summary>
        public bool IsValid;

        /// <summary>
        /// 검증 실패 시 에러 메시지
        /// </summary>
        public string ErrorMessage;
    }
}
