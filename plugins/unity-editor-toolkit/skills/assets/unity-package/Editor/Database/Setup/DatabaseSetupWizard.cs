using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Setup
{
    /// <summary>
    /// Database 원클릭 자동 설치 마법사
    /// SQLite - 설치 불필요, DB 파일 생성 → 마이그레이션
    /// </summary>
    public class DatabaseSetupWizard
    {
        #region Setup Steps
        public enum SetupStep
        {
            NotStarted,
            PreparingDatabase,
            RunningMigrations,
            Completed,
            Failed
        }
        #endregion

        #region State
        private SetupStep currentStep = SetupStep.NotStarted;
        private string statusMessage = "";
        private string errorMessage = "";
        private bool isRunning = false;
        private float progress = 0f;

        public SetupStep CurrentStep => currentStep;
        public string StatusMessage => statusMessage;
        public string ErrorMessage => errorMessage;
        public bool IsRunning => isRunning;
        public float Progress => progress;
        #endregion

        #region Dependencies
        private readonly DatabaseCreator databaseCreator;
        #endregion

        #region Constructor
        public DatabaseSetupWizard()
        {
            databaseCreator = new DatabaseCreator();
        }
        #endregion

        #region Main Setup Flow
        /// <summary>
        /// 자동 설치 시작
        /// </summary>
        public async UniTask<SetupResult> RunSetupAsync(DatabaseConfig config, CancellationToken cancellationToken = default)
        {
            if (isRunning)
            {
                return new SetupResult
                {
                    Success = false,
                    ErrorMessage = "Setup already in progress."
                };
            }

            isRunning = true;
            currentStep = SetupStep.NotStarted;
            errorMessage = "";
            progress = 0f;

            try
            {
                // Step 1: 데이터베이스 파일 준비
                if (!await PrepareDatabaseAsync(config, cancellationToken))
                {
                    return CreateFailureResult("데이터베이스 준비 실패.");
                }

                // Step 2: 마이그레이션 실행
                if (!await RunMigrationsAsync(config, cancellationToken))
                {
                    return CreateFailureResult("마이그레이션 실행 실패.");
                }

                // 완료
                currentStep = SetupStep.Completed;
                statusMessage = "데이터베이스 설치 완료!";
                progress = 1f;

                ToolkitLogger.Log("DatabaseSetupWizard", "설치 완료!");

                return new SetupResult
                {
                    Success = true,
                    Message = "Database setup completed successfully!"
                };
            }
            catch (OperationCanceledException)
            {
                ToolkitLogger.LogWarning("DatabaseSetupWizard", "설치가 취소되었습니다.");
                currentStep = SetupStep.Failed;
                return CreateFailureResult("설치가 취소되었습니다.");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DatabaseSetupWizard", $" 설치 중 예외 발생: {ex.Message}");
                currentStep = SetupStep.Failed;
                return CreateFailureResult($"예외 발생: {ex.Message}");
            }
            finally
            {
                isRunning = false;
            }
        }
        #endregion

        #region Step Implementations
        private async UniTask<bool> PrepareDatabaseAsync(DatabaseConfig config, CancellationToken cancellationToken)
        {
            currentStep = SetupStep.PreparingDatabase;
            statusMessage = "데이터베이스 파일 준비 중...";
            progress = 0.3f;

            ToolkitLogger.Log("DatabaseSetupWizard", "데이터베이스 파일 준비 중...");

            var result = await databaseCreator.CreateDatabaseAsync(config, cancellationToken);

            if (result.Success)
            {
                if (result.AlreadyExists)
                {
                    ToolkitLogger.Log("DatabaseSetupWizard", $" 데이터베이스 파일이 이미 존재합니다: {config.DatabaseFilePath}");
                }
                else
                {
                    ToolkitLogger.Log("DatabaseSetupWizard", $" 데이터베이스 파일 준비 완료: {config.DatabaseFilePath}");
                }
                return true;
            }
            else
            {
                errorMessage = $"데이터베이스 준비 실패: {result.ErrorMessage}";
                ToolkitLogger.LogError("DatabaseSetupWizard", $" {errorMessage}");
                return false;
            }
        }

        private async UniTask<bool> RunMigrationsAsync(DatabaseConfig config, CancellationToken cancellationToken)
        {
            currentStep = SetupStep.RunningMigrations;
            statusMessage = "마이그레이션 실행 중...";
            progress = 0.6f;

            ToolkitLogger.Log("DatabaseSetupWizard", "마이그레이션 시작...");

            try
            {
                // DatabaseManager 초기화 (InitializeAsync가 자동으로 마이그레이션도 실행함)
                var initResult = await DatabaseManager.Instance.InitializeAsync(config);
                if (!initResult.Success)
                {
                    errorMessage = $"DatabaseManager 초기화 실패: {initResult.ErrorMessage}";
                    ToolkitLogger.LogError("DatabaseSetupWizard", $" {errorMessage}");
                    return false;
                }

                // 마이그레이션은 InitializeAsync에서 자동으로 실행됨
                // 중복 실행을 방지하기 위해 별도 호출하지 않음
                ToolkitLogger.Log("DatabaseSetupWizard", "마이그레이션 완료 (DatabaseManager.InitializeAsync에서 실행됨)");
                return true;
            }
            catch (Exception ex)
            {
                errorMessage = $"마이그레이션 중 예외 발생: {ex.Message}";
                ToolkitLogger.LogError("DatabaseSetupWizard", $" {errorMessage}");
                return false;
            }
        }
        #endregion

        #region Helper Methods
        private SetupResult CreateFailureResult(string error)
        {
            currentStep = SetupStep.Failed;
            errorMessage = error;
            progress = 0f;

            return new SetupResult
            {
                Success = false,
                ErrorMessage = error
            };
        }
        #endregion

        #region Reset
        /// <summary>
        /// 상태 초기화
        /// </summary>
        public void Reset()
        {
            currentStep = SetupStep.NotStarted;
            statusMessage = "";
            errorMessage = "";
            isRunning = false;
            progress = 0f;
        }
        #endregion
    }

    #region Result Struct
    /// <summary>
    /// Setup 결과
    /// </summary>
    public struct SetupResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
    }
    #endregion
}
