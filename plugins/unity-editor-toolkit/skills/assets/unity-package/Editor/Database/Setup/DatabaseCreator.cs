using System;
using System.IO;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Setup
{
    /// <summary>
    /// SQLite 데이터베이스 자동 생성
    /// 파일 기반 DB이므로 설치 불필요
    /// </summary>
    public class DatabaseCreator
    {
        /// <summary>
        /// 데이터베이스 파일 생성 및 확인
        /// </summary>
        public async UniTask<DatabaseCreationResult> CreateDatabaseAsync(DatabaseConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                ToolkitLogger.Log("DatabaseCreator", $" 데이터베이스 확인 시작: {config.DatabaseFilePath}");

                // 1. 데이터베이스 파일 존재 여부 확인
                if (File.Exists(config.DatabaseFilePath))
                {
                    long fileSize = new FileInfo(config.DatabaseFilePath).Length;
                    ToolkitLogger.Log("DatabaseCreator", $" 데이터베이스 파일이 이미 존재합니다: {config.DatabaseFilePath} ({fileSize} bytes)");

                    return new DatabaseCreationResult
                    {
                        Success = true,
                        Message = $"Database file already exists: {config.DatabaseFilePath}",
                        AlreadyExists = true
                    };
                }

                // 2. 디렉토리 생성 (존재하지 않으면)
                string directory = Path.GetDirectoryName(config.DatabaseFilePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    ToolkitLogger.Log("DatabaseCreator", $" 디렉토리 생성: {directory}");
                    Directory.CreateDirectory(directory);
                }

                // 3. SQLite 파일은 첫 연결 시 자동 생성됨
                // 여기서는 빈 파일을 생성하지 않고, 연결 시 자동 생성되도록 함
                ToolkitLogger.Log("DatabaseCreator", $" 데이터베이스 준비 완료: {config.DatabaseFilePath}");
                ToolkitLogger.Log("DatabaseCreator", "첫 연결 시 자동으로 생성됩니다.");

                await UniTask.Yield(cancellationToken);

                return new DatabaseCreationResult
                {
                    Success = true,
                    Message = $"Database ready to be created: {config.DatabaseFilePath}",
                    AlreadyExists = false
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseCreator", $" 예외 발생: {ex.Message}\n{ex.StackTrace}");
                return new DatabaseCreationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    AlreadyExists = false
                };
            }
        }

        /// <summary>
        /// 데이터베이스 파일 삭제 (개발/테스트용)
        /// </summary>
        public async UniTask<bool> DeleteDatabaseAsync(DatabaseConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!File.Exists(config.DatabaseFilePath))
                {
                    ToolkitLogger.LogWarning("DatabaseCreator", $" 데이터베이스 파일이 존재하지 않습니다: {config.DatabaseFilePath}");
                    return true;
                }

                ToolkitLogger.Log("DatabaseCreator", $" 데이터베이스 삭제: {config.DatabaseFilePath}");
                File.Delete(config.DatabaseFilePath);

                // WAL 파일도 삭제 (있으면)
                string walFile = config.DatabaseFilePath + "-wal";
                string shmFile = config.DatabaseFilePath + "-shm";

                if (File.Exists(walFile))
                {
                    File.Delete(walFile);
                    ToolkitLogger.Log("DatabaseCreator", $" WAL 파일 삭제: {walFile}");
                }

                if (File.Exists(shmFile))
                {
                    File.Delete(shmFile);
                    ToolkitLogger.Log("DatabaseCreator", $" SHM 파일 삭제: {shmFile}");
                }

                await UniTask.Yield(cancellationToken);

                ToolkitLogger.Log("DatabaseCreator", "데이터베이스 삭제 완료.");
                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseCreator", $" 삭제 실패: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 데이터베이스 파일 정보 조회
        /// </summary>
        public DatabaseFileInfo GetDatabaseInfo(DatabaseConfig config)
        {
            if (!File.Exists(config.DatabaseFilePath))
            {
                return new DatabaseFileInfo
                {
                    Exists = false,
                    FilePath = config.DatabaseFilePath
                };
            }

            var fileInfo = new FileInfo(config.DatabaseFilePath);

            return new DatabaseFileInfo
            {
                Exists = true,
                FilePath = config.DatabaseFilePath,
                FileSize = fileInfo.Length,
                CreatedTime = fileInfo.CreationTime,
                ModifiedTime = fileInfo.LastWriteTime
            };
        }
    }

    #region Result Structs
    /// <summary>
    /// 데이터베이스 생성 결과
    /// </summary>
    public struct DatabaseCreationResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
        public bool AlreadyExists;
    }

    /// <summary>
    /// 데이터베이스 파일 정보
    /// </summary>
    public struct DatabaseFileInfo
    {
        public bool Exists;
        public string FilePath;
        public long FileSize;
        public DateTime CreatedTime;
        public DateTime ModifiedTime;

        public override string ToString()
        {
            if (!Exists)
            {
                return $"[DatabaseFileInfo] File does not exist: {FilePath}";
            }

            return $"[DatabaseFileInfo]\n" +
                   $"  Path: {FilePath}\n" +
                   $"  Size: {FileSize / 1024.0:F2} KB\n" +
                   $"  Created: {CreatedTime}\n" +
                   $"  Modified: {ModifiedTime}";
        }
    }
    #endregion
}
