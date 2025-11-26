using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

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

            ToolkitLogger.LogDebug("MigrationRunner", $" 생성 완료. Migrations Path: {this.migrationsPath}");
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
                ToolkitLogger.LogDebug("MigrationRunner", "마이그레이션 시작...");

                // 1. migrations 테이블 생성 (존재하지 않으면)
                await EnsureMigrationTableExistsAsync(cancellationToken);

                // 2. 실행된 마이그레이션 목록 조회
                var appliedMigrations = await GetAppliedMigrationsAsync(cancellationToken);
                ToolkitLogger.LogDebug("MigrationRunner", $" 이미 실행된 마이그레이션: {appliedMigrations.Count}개");

                // 3. 마이그레이션 파일 목록 조회
                var migrationFiles = GetMigrationFiles();
                if (migrationFiles.Count == 0)
                {
                    ToolkitLogger.LogWarning("MigrationRunner", $" 마이그레이션 파일이 없습니다: {migrationsPath}");
                    return new MigrationResult
                    {
                        Success = true,
                        Message = "No migration files found.",
                        MigrationsApplied = 0
                    };
                }

                ToolkitLogger.LogDebug("MigrationRunner", $" 발견된 마이그레이션 파일: {migrationFiles.Count}개");

                // 4. 미실행 마이그레이션 필터링
                var pendingMigrations = migrationFiles
                    .Where(file => !appliedMigrations.Contains(Path.GetFileNameWithoutExtension(file)))
                    .OrderBy(file => file)
                    .ToList();

                if (pendingMigrations.Count == 0)
                {
                    ToolkitLogger.LogDebug("MigrationRunner", "실행할 마이그레이션이 없습니다.");
                    return new MigrationResult
                    {
                        Success = true,
                        Message = "All migrations already applied.",
                        MigrationsApplied = 0
                    };
                }

                ToolkitLogger.LogDebug("MigrationRunner", $" 실행할 마이그레이션: {pendingMigrations.Count}개");

                // 5. 마이그레이션 실행
                int appliedCount = 0;
                foreach (var migrationFile in pendingMigrations)
                {
                    string migrationName = Path.GetFileNameWithoutExtension(migrationFile);
                    ToolkitLogger.LogDebug("MigrationRunner", $" 실행 중: {migrationName}");

                    var result = await ApplyMigrationAsync(migrationFile, cancellationToken);
                    if (!result.Success)
                    {
                        ToolkitLogger.LogError("MigrationRunner", $" 마이그레이션 실패: {migrationName}\n{result.ErrorMessage}");
                        return new MigrationResult
                        {
                            Success = false,
                            ErrorMessage = $"Failed to apply migration: {migrationName}\n{result.ErrorMessage}",
                            MigrationsApplied = appliedCount
                        };
                    }

                    appliedCount++;
                    ToolkitLogger.LogDebug("MigrationRunner", $" 완료: {migrationName}");
                }

                ToolkitLogger.LogDebug("MigrationRunner", $" 마이그레이션 완료: {appliedCount}개 적용됨");
                return new MigrationResult
                {
                    Success = true,
                    Message = $"Successfully applied {appliedCount} migration(s).",
                    MigrationsApplied = appliedCount
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("MigrationRunner", $" 마이그레이션 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
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

                    // 트랜잭션으로 마이그레이션 원자성 보장
                    // 마이그레이션 중 오류 발생 시 롤백으로 데이터베이스 일관성 유지
                    connection.BeginTransaction();
                    try
                    {
                        // SQL을 완전한 문장 단위로 분리 (BEGIN...END 블록 고려)
                        var sqlStatements = SplitSqlStatements(sql);
                        int executedCount = 0;

                        foreach (var statement in sqlStatements)
                        {
                            var trimmedStatement = statement.Trim();
                            if (string.IsNullOrWhiteSpace(trimmedStatement))
                                continue;

                            // 주석만 있는 문장 스킵 (Execute()에 전달하면 "not an error" 발생)
                            string withoutComments = RemoveSqlComments(trimmedStatement);
                            if (string.IsNullOrWhiteSpace(withoutComments))
                            {
                                ToolkitLogger.LogDebug("MigrationRunner", $" 주석만 있는 문장 스킵 (RemoveSqlComments v2 적용됨)");
                                continue;
                            }

                            // 주석이 제거된 SQL 사용 (Execute()가 주석을 처리하지 못할 수 있음)
                            string cleanedSql = withoutComments.Trim();

                            // SELECT 문 (결과 메시지용)은 스킵 - Execute()는 결과를 반환하지 않음
                            if (cleanedSql.StartsWith("SELECT ", StringComparison.OrdinalIgnoreCase))
                            {
                                ToolkitLogger.LogDebug("MigrationRunner", $" SELECT 문 스킵");
                                continue;
                            }

                            // PRAGMA 문은 스킵 (SQLiteConnector에서 이미 설정됨)
                            if (cleanedSql.StartsWith("PRAGMA ", StringComparison.OrdinalIgnoreCase))
                            {
                                ToolkitLogger.LogDebug("MigrationRunner", $" PRAGMA 문 스킵: {cleanedSql}");
                                continue;
                            }

                            // SQL 실행 (오류 발생 시 어떤 문에서 발생했는지 확인용)
                            try
                            {
                                connection.Execute(cleanedSql);
                                executedCount++;
                            }
                            catch (Exception sqlEx)
                            {
                                // SQL 문의 첫 100자만 출력 (너무 길면 로그가 지저분해짐)
                                string sqlPreview = trimmedStatement.Length > 100
                                    ? trimmedStatement.Substring(0, 100) + "..."
                                    : trimmedStatement;
                                ToolkitLogger.LogError("MigrationRunner", $" SQL 실행 실패 ({executedCount + 1}번째): {sqlEx.Message}\nSQL: {sqlPreview}");
                                throw;
                            }
                        }

                        ToolkitLogger.LogDebug("MigrationRunner", $" SQL 문장 실행 완료: {executedCount}개");

                        // migrations 테이블에 기록
                        string insertSql = @"
                            INSERT INTO migrations (migration_name, applied_at)
                            VALUES (?, datetime('now'));";

                        connection.Execute(insertSql, migrationName);

                        // 트랜잭션 커밋
                        connection.Commit();
                        ToolkitLogger.LogDebug("MigrationRunner", $" 마이그레이션 트랜잭션 커밋 완료: {migrationName}");
                    }
                    catch (Exception ex)
                    {
                        // 트랜잭션 롤백
                        connection.Rollback();
                        ToolkitLogger.LogError("MigrationRunner", $" 마이그레이션 실패 - 롤백됨: {ex.Message}");
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

            ToolkitLogger.LogDebug("MigrationRunner", "migrations 테이블 확인 완료.");
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

        #region Pending Migration Check
        /// <summary>
        /// 대기 중인 마이그레이션 수 조회 (UI 표시용)
        /// </summary>
        public async UniTask<int> GetPendingMigrationCountAsync(CancellationToken cancellationToken = default)
        {
            if (!databaseManager.IsInitialized || !databaseManager.IsConnected)
            {
                return -1; // 연결 안됨
            }

            try
            {
                // migrations 테이블 확인
                await EnsureMigrationTableExistsAsync(cancellationToken);

                // 실행된 마이그레이션 목록 조회
                var appliedMigrations = await GetAppliedMigrationsAsync(cancellationToken);

                // 마이그레이션 파일 목록 조회
                var migrationFiles = GetMigrationFiles();

                // 미실행 마이그레이션 필터링
                var pendingMigrations = migrationFiles
                    .Where(file => !appliedMigrations.Contains(Path.GetFileNameWithoutExtension(file)))
                    .ToList();

                return pendingMigrations.Count;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("MigrationRunner", $" 펜딩 마이그레이션 확인 실패: {ex.Message}");
                return -1;
            }
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
                ToolkitLogger.LogWarning("MigrationRunner", $" Migrations 폴더가 존재하지 않습니다: {migrationsPath}");
                return new List<string>();
            }

            var files = Directory.GetFiles(migrationsPath, "*.sql", SearchOption.TopDirectoryOnly)
                .OrderBy(file => file)
                .ToList();

            return files;
        }

        /// <summary>
        /// SQL 문에서 주석을 제거 (Execute() 호출 전 유효성 검증용)
        /// </summary>
        private string RemoveSqlComments(string sql)
        {
            var result = new System.Text.StringBuilder();
            bool inSingleLineComment = false;
            bool inMultiLineComment = false;
            bool inString = false;

            for (int i = 0; i < sql.Length; i++)
            {
                char c = sql[i];
                char nextChar = i + 1 < sql.Length ? sql[i + 1] : '\0';

                // 줄바꿈 처리 (단일 줄 주석 종료)
                if (c == '\n' || c == '\r')
                {
                    inSingleLineComment = false;
                    if (!inMultiLineComment)
                    {
                        result.Append(c);
                    }
                    continue;
                }

                // 단일 줄 주석 시작
                if (!inString && !inMultiLineComment && c == '-' && nextChar == '-')
                {
                    inSingleLineComment = true;
                    i++; // 두 번째 '-' 스킵
                    continue;
                }

                // 다중 줄 주석 시작
                if (!inString && !inSingleLineComment && c == '/' && nextChar == '*')
                {
                    inMultiLineComment = true;
                    i++; // '*' 스킵
                    continue;
                }

                // 다중 줄 주석 종료
                if (inMultiLineComment && c == '*' && nextChar == '/')
                {
                    inMultiLineComment = false;
                    i++; // '/' 스킵
                    continue;
                }

                // 주석 내부면 스킵
                if (inSingleLineComment || inMultiLineComment)
                {
                    continue;
                }

                // 문자열 시작/종료 (작은따옴표)
                if (c == '\'')
                {
                    // 이스케이프된 따옴표 확인 ('')
                    if (inString && nextChar == '\'')
                    {
                        result.Append(c);
                        i++; // 다음 따옴표도 추가
                        result.Append('\'');
                        continue;
                    }
                    inString = !inString;
                }

                result.Append(c);
            }

            return result.ToString();
        }

        /// <summary>
        /// SQL 문장을 BEGIN...END 블록을 고려하여 분리
        /// </summary>
        private List<string> SplitSqlStatements(string sql)
        {
            var statements = new List<string>();
            var currentStatement = new System.Text.StringBuilder();
            int beginEndDepth = 0;
            bool inSingleLineComment = false;
            bool inMultiLineComment = false;
            bool inString = false;

            for (int i = 0; i < sql.Length; i++)
            {
                char c = sql[i];
                char nextChar = i + 1 < sql.Length ? sql[i + 1] : '\0';

                // 줄바꿈 처리 (단일 줄 주석 종료)
                if (c == '\n')
                {
                    inSingleLineComment = false;
                    currentStatement.Append(c);
                    continue;
                }

                // 단일 줄 주석 시작 (문자열 내부가 아닐 때)
                if (!inString && !inMultiLineComment && c == '-' && nextChar == '-')
                {
                    inSingleLineComment = true;
                    currentStatement.Append(c);
                    continue;
                }

                // 다중 줄 주석 시작
                if (!inString && !inSingleLineComment && c == '/' && nextChar == '*')
                {
                    inMultiLineComment = true;
                    currentStatement.Append(c);
                    continue;
                }

                // 다중 줄 주석 종료
                if (inMultiLineComment && c == '*' && nextChar == '/')
                {
                    inMultiLineComment = false;
                    currentStatement.Append(c);
                    i++; // '/' 스킵
                    currentStatement.Append('/');
                    continue;
                }

                // 주석 내부면 그대로 추가
                if (inSingleLineComment || inMultiLineComment)
                {
                    currentStatement.Append(c);
                    continue;
                }

                // 문자열 시작/종료 (작은따옴표)
                if (c == '\'')
                {
                    // 이스케이프된 따옴표 확인 ('')
                    if (inString && nextChar == '\'')
                    {
                        currentStatement.Append(c);
                        i++; // 다음 따옴표도 추가
                        currentStatement.Append('\'');
                        continue;
                    }
                    inString = !inString;
                    currentStatement.Append(c);
                    continue;
                }

                // 문자열 내부면 그대로 추가
                if (inString)
                {
                    currentStatement.Append(c);
                    continue;
                }

                // BEGIN 키워드 감지 (대소문자 무시)
                if (i + 5 <= sql.Length)
                {
                    string word = sql.Substring(i, 5).ToUpper();
                    if (word == "BEGIN" && (i == 0 || !char.IsLetterOrDigit(sql[i - 1])) &&
                        (i + 5 >= sql.Length || !char.IsLetterOrDigit(sql[i + 5])))
                    {
                        beginEndDepth++;
                    }
                }

                // END 키워드 감지
                if (i + 3 <= sql.Length)
                {
                    string word = sql.Substring(i, 3).ToUpper();
                    if (word == "END" && (i == 0 || !char.IsLetterOrDigit(sql[i - 1])) &&
                        (i + 3 >= sql.Length || !char.IsLetterOrDigit(sql[i + 3])))
                    {
                        beginEndDepth--;
                    }
                }

                // 세미콜론으로 문장 분리 (BEGIN...END 블록 외부에서만)
                if (c == ';' && beginEndDepth == 0)
                {
                    currentStatement.Append(c);
                    string statement = currentStatement.ToString().Trim();
                    if (!string.IsNullOrWhiteSpace(statement))
                    {
                        statements.Add(statement);
                    }
                    currentStatement.Clear();
                    continue;
                }

                currentStatement.Append(c);
            }

            // 마지막 문장 추가 (세미콜론 없이 끝나는 경우)
            string lastStatement = currentStatement.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(lastStatement))
            {
                statements.Add(lastStatement);
            }

            return statements;
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
