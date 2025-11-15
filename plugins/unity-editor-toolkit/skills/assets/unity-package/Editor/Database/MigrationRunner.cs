using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;

namespace UnityEditorToolkit.Editor.Database
{
    /// <summary>
    /// 데이터베이스 마이그레이션 자동 실행
    /// SQL 파일을 순서대로 실행하여 스키마 버전 관리
    /// SQLite 버전 - 트랜잭션 지원
    /// </summary>
    public class MigrationRunner
    {
        #region Fields
        private readonly DatabaseManager databaseManager;
        private readonly string migrationsPath;
        #endregion

        #region Constructor
        public MigrationRunner(DatabaseManager databaseManager, string migrationsPath = null)
        {
            this.databaseManager = databaseManager ?? throw new ArgumentNullException(nameof(databaseManager));

            // 마이그레이션 폴더 경로 (기본값: Editor/Database/Migrations)
            if (string.IsNullOrEmpty(migrationsPath))
            {
                // Unity 패키지 내 Migrations 폴더 경로
                this.migrationsPath = Path.Combine(Application.dataPath, "..", "Packages",
                    "com.devgom.unity-editor-toolkit", "Editor", "Database", "Migrations");
            }
            else
            {
                this.migrationsPath = migrationsPath;
            }

            Debug.Log($"[MigrationRunner] 생성 완료. Migrations Path: {this.migrationsPath}");
        }
        #endregion

        #region Migration Execution
        /// <summary>
        /// 모든 마이그레이션 실행 (순서대로)
        /// </summary>
        public async UniTask<MigrationResult> RunMigrationsAsync(CancellationToken cancellationToken = default)
        {
            if (!databaseManager.IsInitialized || !databaseManager.IsConnected)
            {
                return new MigrationResult
                {
                    Success = false,
                    ErrorMessage = "DatabaseManager not initialized or not connected."
                };
            }

            try
            {
                Debug.Log("[MigrationRunner] 마이그레이션 시작...");

                // 1. migrations 테이블 생성 (존재하지 않으면)
                await EnsureMigrationTableExistsAsync(cancellationToken);

                // 2. 실행된 마이그레이션 목록 조회
                var appliedMigrations = await GetAppliedMigrationsAsync(cancellationToken);
                Debug.Log($"[MigrationRunner] 이미 실행된 마이그레이션: {appliedMigrations.Count}개");

                // 3. 마이그레이션 파일 목록 조회
                var migrationFiles = GetMigrationFiles();
                if (migrationFiles.Count == 0)
                {
                    Debug.LogWarning($"[MigrationRunner] 마이그레이션 파일이 없습니다: {migrationsPath}");
                    return new MigrationResult
                    {
                        Success = true,
                        Message = "No migration files found.",
                        MigrationsApplied = 0
                    };
                }

                Debug.Log($"[MigrationRunner] 발견된 마이그레이션 파일: {migrationFiles.Count}개");

                // 4. 미실행 마이그레이션 필터링
                var pendingMigrations = migrationFiles
                    .Where(file => !appliedMigrations.Contains(Path.GetFileNameWithoutExtension(file)))
                    .OrderBy(file => file)
                    .ToList();

                if (pendingMigrations.Count == 0)
                {
                    Debug.Log("[MigrationRunner] 실행할 마이그레이션이 없습니다.");
                    return new MigrationResult
                    {
                        Success = true,
                        Message = "All migrations already applied.",
                        MigrationsApplied = 0
                    };
                }

                Debug.Log($"[MigrationRunner] 실행할 마이그레이션: {pendingMigrations.Count}개");

                // 5. 마이그레이션 실행
                int appliedCount = 0;
                foreach (var migrationFile in pendingMigrations)
                {
                    string migrationName = Path.GetFileNameWithoutExtension(migrationFile);
                    Debug.Log($"[MigrationRunner] 실행 중: {migrationName}");

                    var result = await ApplyMigrationAsync(migrationFile, cancellationToken);
                    if (!result.Success)
                    {
                        Debug.LogError($"[MigrationRunner] 마이그레이션 실패: {migrationName}\n{result.ErrorMessage}");
                        return new MigrationResult
                        {
                            Success = false,
                            ErrorMessage = $"Failed to apply migration: {migrationName}\n{result.ErrorMessage}",
                            MigrationsApplied = appliedCount
                        };
                    }

                    appliedCount++;
                    Debug.Log($"[MigrationRunner] 완료: {migrationName}");
                }

                Debug.Log($"[MigrationRunner] 마이그레이션 완료: {appliedCount}개 적용됨");
                return new MigrationResult
                {
                    Success = true,
                    Message = $"Successfully applied {appliedCount} migration(s).",
                    MigrationsApplied = appliedCount
                };
            }
            catch (Exception ex)
            {
                Debug.LogError($"[MigrationRunner] 마이그레이션 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
                return new MigrationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    MigrationsApplied = 0
                };
            }
        }

        /// <summary>
        /// 단일 마이그레이션 실행
        /// </summary>
        private async UniTask<MigrationResult> ApplyMigrationAsync(string filePath, CancellationToken cancellationToken)
        {
            try
            {
                // SQL 파일 읽기
                string sql = File.ReadAllText(filePath);
                if (string.IsNullOrWhiteSpace(sql))
                {
                    return new MigrationResult
                    {
                        Success = false,
                        ErrorMessage = "Migration file is empty."
                    };
                }

                string migrationName = Path.GetFileNameWithoutExtension(filePath);

                await UniTask.RunOnThreadPool(() =>
                {
                    var connection = databaseManager.Connector.Connection;

                    // SQLite는 기본적으로 트랜잭션 내에서 실행됨
                    connection.BeginTransaction();

                    try
                    {
                        // SQL을 세미콜론으로 분리하여 개별 실행
                        var sqlStatements = sql.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                        int executedCount = 0;

                        foreach (var statement in sqlStatements)
                        {
                            var trimmedStatement = statement.Trim();
                            if (string.IsNullOrWhiteSpace(trimmedStatement))
                                continue;

                            // SELECT 문 (결과 메시지용)은 스킵
                            if (trimmedStatement.StartsWith("SELECT ", StringComparison.OrdinalIgnoreCase) &&
                                trimmedStatement.Contains(" AS message", StringComparison.OrdinalIgnoreCase))
                            {
                                continue;
                            }

                            // SQL 실행
                            connection.Execute(trimmedStatement);
                            executedCount++;
                        }

                        Debug.Log($"[MigrationRunner] SQL 문장 실행 완료: {executedCount}개");

                        // migrations 테이블에 기록
                        string insertSql = @"
                            INSERT INTO migrations (migration_name, applied_at)
                            VALUES (?, datetime('now'));";

                        connection.Execute(insertSql, migrationName);

                        // 커밋
                        connection.Commit();
                    }
                    catch
                    {
                        // 롤백
                        connection.Rollback();
                        throw;
                    }
                }, cancellationToken: cancellationToken);

                return new MigrationResult { Success = true };
            }
            catch (Exception ex)
            {
                return new MigrationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
        #endregion

        #region Migration Table Management
        /// <summary>
        /// migrations 테이블 생성 (존재하지 않으면)
        /// </summary>
        private async UniTask EnsureMigrationTableExistsAsync(CancellationToken cancellationToken)
        {
            string createTableSql = @"
                CREATE TABLE IF NOT EXISTS migrations (
                    migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name TEXT NOT NULL UNIQUE,
                    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(migration_name);
            ";

            await UniTask.RunOnThreadPool(() =>
            {
                var connection = databaseManager.Connector.Connection;
                connection.Execute(createTableSql);
            }, cancellationToken: cancellationToken);

            Debug.Log("[MigrationRunner] migrations 테이블 확인 완료.");
        }

        /// <summary>
        /// 실행된 마이그레이션 목록 조회
        /// </summary>
        private async UniTask<List<string>> GetAppliedMigrationsAsync(CancellationToken cancellationToken)
        {
            var appliedMigrations = new List<string>();

            string selectSql = "SELECT migration_name FROM migrations ORDER BY migration_id ASC;";

            await UniTask.RunOnThreadPool(() =>
            {
                var connection = databaseManager.Connector.Connection;
                var results = connection.Query<MigrationRecord>(selectSql);

                foreach (var record in results)
                {
                    appliedMigrations.Add(record.migration_name);
                }
            }, cancellationToken: cancellationToken);

            return appliedMigrations;
        }

        /// <summary>
        /// Migration 레코드 (SQLite 쿼리 결과용)
        /// </summary>
        private class MigrationRecord
        {
            public string migration_name { get; set; }
        }
        #endregion

        #region File Discovery
        /// <summary>
        /// 마이그레이션 파일 목록 조회 (.sql 파일)
        /// </summary>
        private List<string> GetMigrationFiles()
        {
            if (!Directory.Exists(migrationsPath))
            {
                Debug.LogWarning($"[MigrationRunner] Migrations 폴더가 존재하지 않습니다: {migrationsPath}");
                return new List<string>();
            }

            var files = Directory.GetFiles(migrationsPath, "*.sql", SearchOption.TopDirectoryOnly)
                .OrderBy(file => file)
                .ToList();

            return files;
        }
        #endregion
    }

    #region Result Structs
    /// <summary>
    /// 마이그레이션 결과
    /// </summary>
    public struct MigrationResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
        public int MigrationsApplied;
    }
    #endregion
}
