using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Runtime;
using UnityEditorToolkit.Editor.Utils;

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

            ToolkitLogger.Log("SyncManager", "생성 완료.");
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
                ToolkitLogger.LogWarning("SyncManager", "이미 동기화가 실행 중입니다.");
                return;
            }

            if (!databaseManager.IsInitialized || !databaseManager.IsConnected)
            {
                ToolkitLogger.LogError("SyncManager", "DatabaseManager가 초기화되지 않았거나 연결되지 않았습니다.");
                return;
            }

            ToolkitLogger.Log("SyncManager", "동기화 시작...");

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

            ToolkitLogger.Log("SyncManager", "동기화 중지 중...");

            syncCts?.Cancel();
            syncCts?.Dispose();
            syncCts = null;

            isRunning = false;

            ToolkitLogger.Log("SyncManager", "동기화 중지 완료.");
        }
        #endregion

        #region Sync Loop
        /// <summary>
        /// 백그라운드 동기화 루프 (UniTask)
        /// </summary>
        private async UniTaskVoid RunSyncLoopAsync(CancellationToken cancellationToken)
        {
            ToolkitLogger.Log("SyncManager", "동기화 루프 시작.");

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
                ToolkitLogger.Log("SyncManager", "동기화 루프가 취소되었습니다.");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncManager", $" 동기화 루프 중 예외 발생: {ex.Message}\n{ex.StackTrace}");
                isRunning = false;
            }

            ToolkitLogger.Log("SyncManager", "동기화 루프 종료.");
        }

        /// <summary>
        /// 단일 동기화 수행 (모든 로드된 씬)
        /// </summary>
        private async UniTask PerformSyncAsync(CancellationToken cancellationToken)
        {
            try
            {
                // Phase 1: 단순 연결 테스트만 수행
                // Phase 2: GameObject 변경 감지 및 배치 업데이트

                bool isConnected = await databaseManager.TestConnectionAsync();
                if (!isConnected)
                {
                    ToolkitLogger.LogWarning("SyncManager", "데이터베이스 연결이 끊어졌습니다.");
                    FailedSyncCount++;
                    return;
                }

                // Phase 2: 모든 로드된 씬에 대해 GameObject 변경 감지 및 배치 업데이트
                int sceneCount = SceneManager.sceneCount;
                if (sceneCount == 0)
                {
                    ToolkitLogger.LogWarning("SyncManager", "로드된 씬이 없습니다.");
                    return;
                }

                // 모든 로드된 씬 순회
                for (int i = 0; i < sceneCount; i++)
                {
                    var scene = SceneManager.GetSceneAt(i);

                    // 로드되지 않은 씬은 건너뛰기
                    if (!scene.isLoaded)
                    {
                        continue;
                    }

                    // 1. Unity Scene에서 모든 GameObject 수집
                    var allGameObjects = CollectAllGameObjects(scene);
                    if (allGameObjects.Count == 0)
                    {
                        continue; // 빈 씬은 건너뛰기
                    }

                    // 2. DB에서 현재 씬의 GameObject 목록 가져오기
                    Dictionary<string, DbGameObject> dbGameObjects;
                    try
                    {
                        dbGameObjects = await GetDatabaseGameObjectsAsync(scene, cancellationToken);
                    }
                    catch (InvalidOperationException ex)
                    {
                        ToolkitLogger.LogError("SyncManager", $" DB 연결 실패로 씬 '{scene.name}' 동기화 건너뜀: {ex.Message}");
                        continue; // 이 씬은 건너뛰고 다음 씬 처리
                    }

                    // 3. 변경 감지
                    var changes = DetectChanges(allGameObjects, dbGameObjects);

                    // 4. 배치 업데이트 실행
                    if (changes.Updated.Count > 0)
                    {
                        await BatchUpdateGameObjectsAsync(changes.Updated, cancellationToken);
                    }

                    if (changes.Inserted.Count > 0)
                    {
                        await BatchInsertGameObjectsAsync(scene, changes.Inserted, cancellationToken);
                    }

                    if (changes.Deleted.Count > 0)
                    {
                        await BatchMarkDeletedAsync(changes.Deleted, cancellationToken);
                    }

                    // 취소 확인
                    cancellationToken.ThrowIfCancellationRequested();
                }

                LastSyncTime = DateTime.UtcNow;
                SuccessfulSyncCount++;
            }
            catch (OperationCanceledException)
            {
                throw; // 취소는 상위로 전파
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncManager", $" 동기화 중 예외 발생: {ex.Message}");
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
                ToolkitLogger.Log("SyncManager", "수동 동기화 시작...");

                await PerformSyncAsync(cancellationToken);

                ToolkitLogger.Log("SyncManager", "수동 동기화 완료.");
                return new SyncResult
                {
                    Success = true,
                    Message = "Manual sync completed successfully."
                };
            }
            catch (OperationCanceledException)
            {
                ToolkitLogger.LogWarning("SyncManager", "수동 동기화가 취소되었습니다.");
                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = "Manual sync was canceled."
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncManager", $" 수동 동기화 중 예외 발생: {ex.Message}");
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
        /// GameObject 배치 업데이트
        /// </summary>
        /// <param name="gameObjects">업데이트할 GameObject 목록</param>
        public async UniTask<int> BatchUpdateGameObjectsAsync(List<GameObject> gameObjects, CancellationToken cancellationToken = default)
        {
            ThrowIfDisposed();

            if (gameObjects == null || gameObjects.Count == 0)
            {
                return 0;
            }

            await UniTask.SwitchToThreadPool();

            try
            {
                var connection = databaseManager.Connector?.Connection;
                if (connection == null)
                {
                    ToolkitLogger.LogError("SyncManager", "Database connection is null");
                    return 0;
                }

                int updatedCount = 0;

                // 배치 크기로 나누어 처리
                for (int i = 0; i < gameObjects.Count; i += BatchSize)
                {
                    int batchCount = Math.Min(BatchSize, gameObjects.Count - i);
                    var batch = gameObjects.GetRange(i, batchCount);

                    ExecuteInTransaction(connection, () =>
                    {
                        foreach (var obj in batch)
                        {
                            var guidComp = EnsureGameObjectGuid(obj);
                            string guid = guidComp.Guid;
                            int instanceId = obj.GetInstanceID();
                            int? parentId = obj.transform.parent != null ? obj.transform.parent.gameObject.GetInstanceID() : (int?)null;

                            var sql = @"
                                UPDATE gameobjects
                                SET object_name = ?,
                                    parent_id = ?,
                                    tag = ?,
                                    layer = ?,
                                    is_active = ?,
                                    is_static = ?,
                                    instance_id = ?,
                                    updated_at = datetime('now', 'localtime')
                                WHERE guid = ?
                            ";

                            connection.Execute(sql, obj.name, parentId, obj.tag, obj.layer, obj.activeSelf, obj.isStatic, instanceId, guid);
                        }
                    });

                    updatedCount += batchCount;
                    ToolkitLogger.Log("SyncManager", $" 배치 업데이트 완료: {batchCount}개 GameObject");

                    // 취소 확인
                    cancellationToken.ThrowIfCancellationRequested();
                }

                return updatedCount;
            }
            finally
            {
                // 메인 스레드가 살아있는지 확인
                if (!isDisposed)
                {
                    await UniTask.SwitchToMainThread();
                }
            }
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

        #region Helper Methods (Phase 2)
        /// <summary>
        /// 트랜잭션을 안전하게 실행하는 헬퍼 메서드
        /// </summary>
        private void ExecuteInTransaction(SQLite.SQLiteConnection connection, Action action)
        {
            // SQLite는 중첩 트랜잭션을 지원하지 않으므로 try-catch로 감지
            bool transactionStarted = false;
            try
            {
                connection.BeginTransaction();
                transactionStarted = true;

                action();

                connection.Commit();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("transaction") || ex.Message.Contains("Transaction"))
            {
                // 이미 트랜잭션이 시작된 경우, 그냥 액션만 실행
                ToolkitLogger.LogWarning("SyncManager", $" Transaction already started, executing without nested transaction: {ex.Message}");
                if (transactionStarted)
                {
                    connection.Rollback();
                }
                action();
            }
            catch
            {
                if (transactionStarted)
                {
                    connection.Rollback();
                }
                throw;
            }
        }

        /// <summary>
        /// Unity Scene에서 모든 GameObject 재귀적으로 수집
        /// </summary>
        private List<GameObject> CollectAllGameObjects(Scene scene)
        {
            var result = new List<GameObject>();
            var rootObjects = scene.GetRootGameObjects();

            foreach (var root in rootObjects)
            {
                CollectGameObjectsRecursive(root, result);
            }

            return result;
        }

        /// <summary>
        /// GameObject를 재귀적으로 수집하는 헬퍼 메서드
        /// </summary>
        private void CollectGameObjectsRecursive(GameObject obj, List<GameObject> list)
        {
            list.Add(obj);
            for (int i = 0; i < obj.transform.childCount; i++)
            {
                CollectGameObjectsRecursive(obj.transform.GetChild(i).gameObject, list);
            }
        }

        /// <summary>
        /// DB에서 현재 씬의 GameObject 목록 가져오기 (GUID 기반)
        /// </summary>
        private async UniTask<Dictionary<string, DbGameObject>> GetDatabaseGameObjectsAsync(Scene scene, CancellationToken cancellationToken)
        {
            await UniTask.SwitchToThreadPool();

            try
            {
                var connection = databaseManager.Connector?.Connection;
                if (connection == null)
                {
                    ToolkitLogger.LogError("SyncManager", "Database connection is null");
                    throw new InvalidOperationException("Database connection is not available");
                }

                // 1. scene_id 가져오기
                var sceneIdSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
                var sceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);

                if (!sceneIds.Any())
                {
                    // Scene이 DB에 없는 것은 정상 (첫 동기화)
                    ToolkitLogger.Log("SyncManager", $" Scene '{scene.name}'이 DB에 없습니다 (첫 동기화).");
                    return new Dictionary<string, DbGameObject>();
                }

                int sceneId = sceneIds.First().scene_id;

                // 2. GameObject 목록 가져오기 (guid 포함)
                var sql = @"
                    SELECT object_id, instance_id, guid, object_name, parent_id, tag, layer, is_active, is_static, is_deleted
                    FROM gameobjects
                    WHERE scene_id = ? AND is_deleted = 0
                ";

                var dbObjects = connection.Query<DbGameObject>(sql, sceneId);

                // Dictionary로 변환 (guid를 키로 사용, guid가 null인 경우 instance_id를 fallback으로 사용)
                var result = new Dictionary<string, DbGameObject>();
                foreach (var obj in dbObjects)
                {
                    string key = !string.IsNullOrEmpty(obj.guid) ? obj.guid : $"instance_{obj.instance_id}";
                    result[key] = obj;
                }

                return result;
            }
            finally
            {
                // 메인 스레드가 살아있는지 확인
                if (!isDisposed)
                {
                    await UniTask.SwitchToMainThread();
                }
            }
        }

        /// <summary>
        /// Scene ID를 가져오기 위한 레코드 클래스
        /// </summary>
        private class SceneIdRecord
        {
            public int scene_id { get; set; }
        }
        #endregion

        #region Change Detection (Phase 2)
        /// <summary>
        /// GameObject에 GameObjectGuid 컴포넌트 확보 (없으면 추가)
        /// </summary>
        private GameObjectGuid EnsureGameObjectGuid(GameObject obj)
        {
            var guidComp = obj.GetComponent<GameObjectGuid>();
            if (guidComp == null)
            {
                guidComp = obj.AddComponent<GameObjectGuid>();
            }
            return guidComp;
        }

        /// <summary>
        /// Unity GameObject와 DB GameObject 비교하여 변경사항 감지 (GUID 기반)
        /// </summary>
        private GameObjectChangeSet DetectChanges(List<GameObject> unityObjects, Dictionary<string, DbGameObject> dbObjects)
        {
            var changeSet = new GameObjectChangeSet
            {
                Updated = new List<GameObject>(),
                Inserted = new List<GameObject>(),
                Deleted = new List<int>()
            };

            // Unity에 있는 객체 확인 (GUID 기반)
            var processedGuids = new HashSet<string>();

            foreach (var obj in unityObjects)
            {
                // GameObjectGuid 컴포넌트 확보
                var guidComp = EnsureGameObjectGuid(obj);
                string guid = guidComp.Guid;

                processedGuids.Add(guid);

                if (dbObjects.TryGetValue(guid, out var dbObj))
                {
                    // DB에 존재: 변경 여부 확인
                    if (HasChanged(obj, dbObj))
                    {
                        changeSet.Updated.Add(obj);
                    }
                }
                else
                {
                    // DB에 없음: 새로운 객체
                    changeSet.Inserted.Add(obj);
                }
            }

            // DB에만 있고 Unity에 없는 객체 확인 (삭제된 객체)
            foreach (var kvp in dbObjects)
            {
                if (!processedGuids.Contains(kvp.Key))
                {
                    changeSet.Deleted.Add(kvp.Value.object_id);
                }
            }

            return changeSet;
        }

        /// <summary>
        /// GameObject가 DB 레코드와 비교하여 변경되었는지 확인
        /// </summary>
        private bool HasChanged(GameObject obj, DbGameObject dbObj)
        {
            // 이름 변경
            if (obj.name != dbObj.object_name)
                return true;

            // Parent 변경
            int? currentParentId = obj.transform.parent != null ? obj.transform.parent.gameObject.GetInstanceID() : (int?)null;
            if (currentParentId != dbObj.parent_id)
                return true;

            // Tag 변경
            if (obj.tag != dbObj.tag)
                return true;

            // Layer 변경
            if (obj.layer != dbObj.layer)
                return true;

            // Active 상태 변경
            if (obj.activeSelf != dbObj.is_active)
                return true;

            // Static 플래그 변경
            if (obj.isStatic != dbObj.is_static)
                return true;

            return false;
        }
        #endregion

        #region Batch Insert/Delete (Phase 2)
        /// <summary>
        /// GameObject 배치 삽입
        /// </summary>
        private async UniTask BatchInsertGameObjectsAsync(Scene scene, List<GameObject> gameObjects, CancellationToken cancellationToken)
        {
            if (gameObjects == null || gameObjects.Count == 0)
                return;

            await UniTask.SwitchToThreadPool();

            try
            {
                var connection = databaseManager.Connector?.Connection;
                if (connection == null)
                {
                    ToolkitLogger.LogError("SyncManager", "Database connection is null");
                    return;
                }

                // 1. scene_id 가져오기 (또는 생성)
                int sceneId = EnsureSceneRecord(connection, scene);

                // 2. 배치 INSERT
                for (int i = 0; i < gameObjects.Count; i += BatchSize)
                {
                    int batchCount = Math.Min(BatchSize, gameObjects.Count - i);
                    var batch = gameObjects.GetRange(i, batchCount);

                    ExecuteInTransaction(connection, () =>
                    {
                        foreach (var obj in batch)
                        {
                            var guidComp = EnsureGameObjectGuid(obj);
                            string guid = guidComp.Guid;
                            int instanceId = obj.GetInstanceID();
                            int? parentId = obj.transform.parent != null ? obj.transform.parent.gameObject.GetInstanceID() : (int?)null;

                            var sql = @"
                                INSERT INTO gameobjects (guid, instance_id, scene_id, object_name, parent_id, tag, layer, is_active, is_static, is_deleted, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
                            ";

                            connection.Execute(sql, guid, instanceId, sceneId, obj.name, parentId, obj.tag, obj.layer, obj.activeSelf, obj.isStatic);
                        }
                    });

                    ToolkitLogger.Log("SyncManager", $" 배치 삽입 완료: {batchCount}개 GameObject");

                    cancellationToken.ThrowIfCancellationRequested();
                }
            }
            finally
            {
                // 메인 스레드가 살아있는지 확인
                if (!isDisposed)
                {
                    await UniTask.SwitchToMainThread();
                }
            }
        }

        /// <summary>
        /// GameObject 배치 삭제 (soft delete)
        /// </summary>
        private async UniTask BatchMarkDeletedAsync(List<int> objectIds, CancellationToken cancellationToken)
        {
            if (objectIds == null || objectIds.Count == 0)
                return;

            await UniTask.SwitchToThreadPool();

            try
            {
                var connection = databaseManager.Connector?.Connection;
                if (connection == null)
                {
                    ToolkitLogger.LogError("SyncManager", "Database connection is null");
                    return;
                }

                // 배치 UPDATE (soft delete)
                for (int i = 0; i < objectIds.Count; i += BatchSize)
                {
                    int batchCount = Math.Min(BatchSize, objectIds.Count - i);
                    var batch = objectIds.GetRange(i, batchCount);

                    ExecuteInTransaction(connection, () =>
                    {
                        foreach (var objectId in batch)
                        {
                            var sql = @"
                                UPDATE gameobjects
                                SET is_deleted = 1, updated_at = datetime('now', 'localtime')
                                WHERE object_id = ?
                            ";

                            connection.Execute(sql, objectId);
                        }
                    });

                    ToolkitLogger.Log("SyncManager", $" 배치 삭제 완료: {batchCount}개 GameObject");

                    cancellationToken.ThrowIfCancellationRequested();
                }
            }
            finally
            {
                // 메인 스레드가 살아있는지 확인
                if (!isDisposed)
                {
                    await UniTask.SwitchToMainThread();
                }
            }
        }

        /// <summary>
        /// Scene 레코드가 DB에 존재하는지 확인하고 없으면 생성
        /// </summary>
        private int EnsureSceneRecord(SQLite.SQLiteConnection connection, Scene scene)
        {
            var sceneIdSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var sceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);

            if (sceneIds.Any())
            {
                return sceneIds.First().scene_id;
            }

            // Scene 레코드 생성
            var insertSql = @"
                INSERT INTO scenes (scene_path, scene_name, created_at, updated_at)
                VALUES (?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
            ";
            connection.Execute(insertSql, scene.path, scene.name);

            // 생성된 scene_id 반환
            var newSceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);
            return newSceneIds.First().scene_id;
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

            ToolkitLogger.Log("SyncManager", "Disposed.");
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

    /// <summary>
    /// DB GameObject 레코드 (SQLite-net ORM용)
    /// </summary>
    public class DbGameObject
    {
        public int object_id { get; set; }
        public int instance_id { get; set; }
        public string guid { get; set; }
        public string object_name { get; set; }
        public int? parent_id { get; set; }
        public string tag { get; set; }
        public int layer { get; set; }
        public bool is_active { get; set; }
        public bool is_static { get; set; }
        public bool is_deleted { get; set; }
    }

    /// <summary>
    /// GameObject 변경사항 집합
    /// </summary>
    public class GameObjectChangeSet
    {
        public List<GameObject> Updated { get; set; }
        public List<GameObject> Inserted { get; set; }
        public List<int> Deleted { get; set; }
    }
    #endregion
}
