using System;
using System.Collections.Generic;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;

namespace UnityEditorToolkit.Editor.Database
{
    /// <summary>
    /// Unity ↔ PostgreSQL 실시간 동기화 관리자
    /// Phase 1: 기본 동기화 프레임워크
    /// Phase 2+: GameObject/Component 실시간 추적, 배치 업데이트
    /// </summary>
    public class SyncManager : IDisposable
    {
        #region Fields
        private readonly DatabaseManager databaseManager;
        private bool isRunning = false;
        private bool isDisposed = false;
        private CancellationTokenSource syncCts;

        // 동기화 설정
        private const int SyncIntervalMilliseconds = 1000; // 1초마다 동기화
        private const int BatchSize = 500; // 배치당 최대 500개 객체
        #endregion

        #region Properties
        /// <summary>
        /// 동기화 실행 중 여부
        /// </summary>
        public bool IsRunning => isRunning;

        /// <summary>
        /// 마지막 동기화 시간
        /// </summary>
        public DateTime LastSyncTime { get; private set; }

        /// <summary>
        /// 동기화 성공 횟수
        /// </summary>
        public int SuccessfulSyncCount { get; private set; }

        /// <summary>
        /// 동기화 실패 횟수
        /// </summary>
        public int FailedSyncCount { get; private set; }
        #endregion

        #region Constructor
        public SyncManager(DatabaseManager databaseManager)
        {
            this.databaseManager = databaseManager ?? throw new ArgumentNullException(nameof(databaseManager));
            LastSyncTime = DateTime.MinValue;
            SuccessfulSyncCount = 0;
            FailedSyncCount = 0;

            Debug.Log("[SyncManager] 생성 완료.");
        }
        #endregion

        #region Sync Control
        /// <summary>
        /// 동기화 시작
        /// </summary>
        public void StartSync()
        {
            ThrowIfDisposed();

            if (isRunning)
            {
                Debug.LogWarning("[SyncManager] 이미 동기화가 실행 중입니다.");
                return;
            }

            if (!databaseManager.IsInitialized || !databaseManager.IsConnected)
            {
                Debug.LogError("[SyncManager] DatabaseManager가 초기화되지 않았거나 연결되지 않았습니다.");
                return;
            }

            Debug.Log("[SyncManager] 동기화 시작...");

            syncCts = new CancellationTokenSource();
            isRunning = true;

            // 백그라운드 동기화 루프 시작 (UniTask)
            RunSyncLoopAsync(syncCts.Token).Forget();
        }

        /// <summary>
        /// 동기화 중지
        /// </summary>
        public void StopSync()
        {
            ThrowIfDisposed();

            if (!isRunning)
            {
                return;
            }

            Debug.Log("[SyncManager] 동기화 중지 중...");

            syncCts?.Cancel();
            syncCts?.Dispose();
            syncCts = null;

            isRunning = false;

            Debug.Log("[SyncManager] 동기화 중지 완료.");
        }
        #endregion

        #region Sync Loop
        /// <summary>
        /// 백그라운드 동기화 루프 (UniTask)
        /// </summary>
        private async UniTaskVoid RunSyncLoopAsync(CancellationToken cancellationToken)
        {
            Debug.Log("[SyncManager] 동기화 루프 시작.");

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    // 동기화 수행
                    await PerformSyncAsync(cancellationToken);

                    // 대기 (1초)
                    await UniTask.Delay(SyncIntervalMilliseconds, cancellationToken: cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                Debug.Log("[SyncManager] 동기화 루프가 취소되었습니다.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SyncManager] 동기화 루프 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
                isRunning = false;
            }

            Debug.Log("[SyncManager] 동기화 루프 종료.");
        }

        /// <summary>
        /// 단일 동기화 수행
        /// </summary>
        private async UniTask PerformSyncAsync(CancellationToken cancellationToken)
        {
            try
            {
                // Phase 1: 단순 연결 테스트만 수행
                // Phase 2+: 실제 GameObject/Component 동기화 구현

                bool isConnected = await databaseManager.TestConnectionAsync();
                if (!isConnected)
                {
                    Debug.LogWarning("[SyncManager] 데이터베이스 연결이 끊어졌습니다.");
                    FailedSyncCount++;
                    return;
                }

                // TODO Phase 2: GameObject 변경 감지 및 배치 업데이트
                // 1. Unity Scene에서 변경된 GameObject 목록 수집
                // 2. 배치 크기(500개)로 나누어 처리
                // 3. PostgreSQL에 업데이트 쿼리 실행
                // 4. 충돌 해결 (타임스탬프 기반)

                LastSyncTime = DateTime.UtcNow;
                SuccessfulSyncCount++;
            }
            catch (OperationCanceledException)
            {
                throw; // 취소는 상위로 전파
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SyncManager] 동기화 중 예외 발생: {ex.Message}");
                FailedSyncCount++;
            }
        }
        #endregion

        #region Manual Sync
        /// <summary>
        /// 수동 동기화 (즉시 실행)
        /// </summary>
        public async UniTask<SyncResult> SyncNowAsync(CancellationToken cancellationToken = default)
        {
            ThrowIfDisposed();

            if (!databaseManager.IsInitialized || !databaseManager.IsConnected)
            {
                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = "Database not initialized or not connected."
                };
            }

            try
            {
                Debug.Log("[SyncManager] 수동 동기화 시작...");

                await PerformSyncAsync(cancellationToken);

                Debug.Log("[SyncManager] 수동 동기화 완료.");
                return new SyncResult
                {
                    Success = true,
                    Message = "Manual sync completed successfully."
                };
            }
            catch (OperationCanceledException)
            {
                Debug.LogWarning("[SyncManager] 수동 동기화가 취소되었습니다.");
                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = "Manual sync was canceled."
                };
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SyncManager] 수동 동기화 중 예외 발생: {ex.Message}");
                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
        #endregion

        #region Batch Operations (Phase 2+)
        /// <summary>
        /// GameObject 배치 업데이트 (Phase 2에서 구현)
        /// </summary>
        /// <param name="gameObjects">업데이트할 GameObject 목록</param>
        public async UniTask<int> BatchUpdateGameObjectsAsync(List<GameObject> gameObjects, CancellationToken cancellationToken = default)
        {
            ThrowIfDisposed();

            if (gameObjects == null || gameObjects.Count == 0)
            {
                return 0;
            }

            int updatedCount = 0;

            // 배치 크기로 나누어 처리
            for (int i = 0; i < gameObjects.Count; i += BatchSize)
            {
                int batchCount = Math.Min(BatchSize, gameObjects.Count - i);
                var batch = gameObjects.GetRange(i, batchCount);

                // TODO Phase 2: 실제 SQL UPDATE 쿼리 실행
                // using (var connection = await _databaseManager.ConnectionPool.AcquireConnectionAsync(cancellationToken))
                // {
                //     // SQL 쿼리 실행
                // }

                updatedCount += batchCount;

                // 취소 확인
                cancellationToken.ThrowIfCancellationRequested();
            }

            Debug.Log($"[SyncManager] 배치 업데이트 완료: {updatedCount}개 GameObject");
            return updatedCount;
        }

        /// <summary>
        /// Component 배치 업데이트 (Phase 2에서 구현)
        /// </summary>
        public async UniTask<int> BatchUpdateComponentsAsync(List<Component> components, CancellationToken cancellationToken = default)
        {
            ThrowIfDisposed();

            if (components == null || components.Count == 0)
            {
                return 0;
            }

            // TODO Phase 2: Component 배치 업데이트 구현

            await UniTask.Yield();
            return 0;
        }
        #endregion

        #region Health Check
        /// <summary>
        /// SyncManager 상태 정보
        /// </summary>
        public SyncHealthStatus GetHealthStatus()
        {
            return new SyncHealthStatus
            {
                IsRunning = isRunning,
                LastSyncTime = LastSyncTime,
                SuccessfulSyncCount = SuccessfulSyncCount,
                FailedSyncCount = FailedSyncCount,
                SyncIntervalMs = SyncIntervalMilliseconds,
                BatchSize = BatchSize
            };
        }
        #endregion

        #region Disposal
        public void Dispose()
        {
            if (isDisposed)
            {
                return;
            }

            StopSync();
            isDisposed = true;

            Debug.Log("[SyncManager] Disposed.");
        }

        private void ThrowIfDisposed()
        {
            if (isDisposed)
            {
                throw new ObjectDisposedException(nameof(SyncManager));
            }
        }
        #endregion
    }

    #region Result Structs
    /// <summary>
    /// 동기화 결과
    /// </summary>
    public struct SyncResult
    {
        public bool Success;
        public string Message;
        public string ErrorMessage;
    }

    /// <summary>
    /// SyncManager 상태
    /// </summary>
    public struct SyncHealthStatus
    {
        public bool IsRunning;
        public DateTime LastSyncTime;
        public int SuccessfulSyncCount;
        public int FailedSyncCount;
        public int SyncIntervalMs;
        public int BatchSize;

        public override string ToString()
        {
            return $"[SyncHealthStatus]\n" +
                   $"  Running: {IsRunning}\n" +
                   $"  Last Sync: {LastSyncTime:yyyy-MM-dd HH:mm:ss}\n" +
                   $"  Success: {SuccessfulSyncCount}, Failed: {FailedSyncCount}\n" +
                   $"  Interval: {SyncIntervalMs}ms, Batch: {BatchSize}";
        }
    }
    #endregion
}
