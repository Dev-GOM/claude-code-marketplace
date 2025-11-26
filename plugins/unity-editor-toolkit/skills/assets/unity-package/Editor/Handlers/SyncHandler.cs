using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Utils;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for syncing Unity GameObjects and Components with database
    /// </summary>
    public class SyncHandler : BaseHandler
    {
        public override string Category => "Sync";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "SyncScene":
                    return HandleSyncScene(request);
                case "SyncGameObject":
                    return HandleSyncGameObject(request);
                case "GetSyncStatus":
                    return HandleGetSyncStatus(request);
                case "ClearSync":
                    return HandleClearSync(request);
                case "StartAutoSync":
                    return HandleStartAutoSync(request);
                case "StopAutoSync":
                    return HandleStopAutoSync(request);
                case "GetAutoSyncStatus":
                    return HandleGetAutoSyncStatus(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Sync entire scene to database
        /// </summary>
        private object HandleSyncScene(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var param = request.GetParams<SyncSceneParams>() ?? new SyncSceneParams();
            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var scene = SceneManager.GetActiveScene();

            // Ensure scene record exists
            int sceneId = EnsureSceneRecord(connection, scene);

            int syncedObjects = 0;
            int syncedComponents = 0;
            int closureRecords = 0;

            // Get all GameObjects in scene
            var allObjects = scene.GetRootGameObjects();
            var objectList = new List<GameObject>();

            // Collect all objects recursively
            foreach (var root in allObjects)
            {
                CollectGameObjectsRecursive(root, objectList);
            }

            // Begin transaction for performance
            connection.BeginTransaction();

            try
            {
                // Clear existing data if requested
                if (param.clearExisting)
                {
                    connection.Execute("DELETE FROM gameobject_closure WHERE descendant_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);
                    connection.Execute("DELETE FROM components WHERE object_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);
                    connection.Execute("DELETE FROM gameobjects WHERE scene_id = ?", sceneId);
                }

                // Sync GameObjects
                var objectIdMap = new Dictionary<int, int>(); // instanceId -> object_id

                foreach (var obj in objectList)
                {
                    int objectId = SyncGameObject(connection, obj, sceneId, objectIdMap);
                    objectIdMap[obj.GetInstanceID()] = objectId;
                    syncedObjects++;

                    // Sync components if requested
                    if (param.includeComponents)
                    {
                        syncedComponents += SyncComponents(connection, obj, objectId);
                    }
                }

                // Build closure table
                if (param.buildClosure)
                {
                    closureRecords = BuildClosureTable(connection, objectList, objectIdMap);
                }

                connection.Commit();
            }
            catch (Exception ex)
            {
                connection.Rollback();
                throw new Exception($"Sync failed: {ex.Message}");
            }

            return new SyncResult
            {
                success = true,
                sceneName = scene.name,
                sceneId = sceneId,
                syncedObjects = syncedObjects,
                syncedComponents = syncedComponents,
                closureRecords = closureRecords,
                message = $"Synced {syncedObjects} objects, {syncedComponents} components, {closureRecords} closure records"
            };
        }

        /// <summary>
        /// Sync specific GameObject to database
        /// </summary>
        private object HandleSyncGameObject(JsonRpcRequest request)
        {
            var param = ValidateParam<SyncGameObjectParams>(request, "target");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var obj = FindGameObject(param.target);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.target}");
            }

            var scene = obj.scene;
            int sceneId = EnsureSceneRecord(connection, scene);

            var objectIdMap = new Dictionary<int, int>();
            int objectId = SyncGameObject(connection, obj, sceneId, objectIdMap);
            objectIdMap[obj.GetInstanceID()] = objectId;

            int syncedComponents = 0;
            if (param.includeComponents)
            {
                syncedComponents = SyncComponents(connection, obj, objectId);
            }

            // Sync hierarchy if requested
            int syncedChildren = 0;
            if (param.includeChildren)
            {
                var children = new List<GameObject>();
                CollectGameObjectsRecursive(obj, children);

                foreach (var child in children)
                {
                    if (child != obj) // Skip self
                    {
                        int childId = SyncGameObject(connection, child, sceneId, objectIdMap);
                        objectIdMap[child.GetInstanceID()] = childId;
                        syncedChildren++;

                        if (param.includeComponents)
                        {
                            syncedComponents += SyncComponents(connection, child, childId);
                        }
                    }
                }
            }

            return new SyncGameObjectResult
            {
                success = true,
                objectName = obj.name,
                objectId = objectId,
                syncedComponents = syncedComponents,
                syncedChildren = syncedChildren,
                message = $"Synced '{obj.name}' with {syncedComponents} components and {syncedChildren} children"
            };
        }

        /// <summary>
        /// Get sync status
        /// </summary>
        private object HandleGetSyncStatus(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var scene = SceneManager.GetActiveScene();

            // Count objects in scene
            var allObjects = scene.GetRootGameObjects();
            var objectList = new List<GameObject>();
            foreach (var root in allObjects)
            {
                CollectGameObjectsRecursive(root, objectList);
            }

            int unityObjectCount = objectList.Count;

            // Count objects in DB
            var sceneIdSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var sceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);

            int dbObjectCount = 0;
            int dbComponentCount = 0;
            int closureRecordCount = 0;

            if (sceneIds.Count() > 0)
            {
                int sceneId = sceneIds.First().scene_id;

                var objCountSql = "SELECT COUNT(*) FROM gameobjects WHERE scene_id = ? AND is_deleted = 0";
                dbObjectCount = connection.ExecuteScalar<int>(objCountSql, sceneId);

                var compCountSql = "SELECT COUNT(*) FROM components WHERE object_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)";
                dbComponentCount = connection.ExecuteScalar<int>(compCountSql, sceneId);

                var closureSql = "SELECT COUNT(*) FROM gameobject_closure WHERE descendant_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)";
                closureRecordCount = connection.ExecuteScalar<int>(closureSql, sceneId);
            }

            return new SyncStatusResult
            {
                success = true,
                sceneName = scene.name,
                unityObjectCount = unityObjectCount,
                dbObjectCount = dbObjectCount,
                dbComponentCount = dbComponentCount,
                closureRecordCount = closureRecordCount,
                inSync = unityObjectCount == dbObjectCount
            };
        }

        /// <summary>
        /// Clear sync data
        /// </summary>
        private object HandleClearSync(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var scene = SceneManager.GetActiveScene();
            var sceneIdSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var sceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);

            if (sceneIds.Count() == 0)
            {
                return new ClearSyncResult
                {
                    success = true,
                    deletedObjects = 0,
                    deletedComponents = 0,
                    message = "No sync data found for current scene"
                };
            }

            int sceneId = sceneIds.First().scene_id;

            // Delete in correct order (foreign keys)
            connection.Execute("DELETE FROM gameobject_closure WHERE descendant_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);
            int deletedComponents = connection.Execute("DELETE FROM components WHERE object_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);
            int deletedObjects = connection.Execute("DELETE FROM gameobjects WHERE scene_id = ?", sceneId);

            return new ClearSyncResult
            {
                success = true,
                deletedObjects = deletedObjects,
                deletedComponents = deletedComponents,
                message = $"Deleted {deletedObjects} objects and {deletedComponents} components from database"
            };
        }

        /// <summary>
        /// Start automatic synchronization
        /// </summary>
        private object HandleStartAutoSync(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            try
            {
                var syncManager = DatabaseManager.Instance.SyncManager;
                if (syncManager == null)
                {
                    throw new Exception("SyncManager is not initialized");
                }

                if (syncManager.IsRunning)
                {
                    return new AutoSyncResult
                    {
                        success = true,
                        message = "Auto-sync is already running",
                        isRunning = true
                    };
                }

                syncManager.StartSync();

                return new AutoSyncResult
                {
                    success = true,
                    message = "Auto-sync started successfully",
                    isRunning = true
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncHandler", $"Failed to start auto-sync: {ex.Message}");
                throw new Exception($"Failed to start auto-sync: {ex.Message}");
            }
        }

        /// <summary>
        /// Stop automatic synchronization
        /// </summary>
        private object HandleStopAutoSync(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            try
            {
                var syncManager = DatabaseManager.Instance.SyncManager;
                if (syncManager == null)
                {
                    throw new Exception("SyncManager is not initialized");
                }

                if (!syncManager.IsRunning)
                {
                    return new AutoSyncResult
                    {
                        success = true,
                        message = "Auto-sync is not running",
                        isRunning = false
                    };
                }

                syncManager.StopSync();

                return new AutoSyncResult
                {
                    success = true,
                    message = "Auto-sync stopped successfully",
                    isRunning = false
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncHandler", $"Failed to stop auto-sync: {ex.Message}");
                throw new Exception($"Failed to stop auto-sync: {ex.Message}");
            }
        }

        /// <summary>
        /// Get automatic synchronization status
        /// </summary>
        private object HandleGetAutoSyncStatus(JsonRpcRequest request)
        {
            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            try
            {
                var syncManager = DatabaseManager.Instance.SyncManager;
                if (syncManager == null)
                {
                    return new AutoSyncStatusResult
                    {
                        success = true,
                        isRunning = false,
                        isInitialized = false,
                        lastSyncTime = null,
                        successfulSyncCount = 0,
                        failedSyncCount = 0,
                        syncIntervalMs = 0,
                        batchSize = 0
                    };
                }

                var healthStatus = syncManager.GetHealthStatus();

                return new AutoSyncStatusResult
                {
                    success = true,
                    isRunning = healthStatus.IsRunning,
                    isInitialized = true,
                    lastSyncTime = healthStatus.LastSyncTime == DateTime.MinValue ? null : healthStatus.LastSyncTime.ToString("yyyy-MM-dd HH:mm:ss"),
                    successfulSyncCount = healthStatus.SuccessfulSyncCount,
                    failedSyncCount = healthStatus.FailedSyncCount,
                    syncIntervalMs = healthStatus.SyncIntervalMs,
                    batchSize = healthStatus.BatchSize
                };
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("SyncHandler", $"Failed to get auto-sync status: {ex.Message}");
                throw new Exception($"Failed to get auto-sync status: {ex.Message}");
            }
        }

        #region Helper Methods

        private void CollectGameObjectsRecursive(GameObject obj, List<GameObject> list)
        {
            list.Add(obj);
            for (int i = 0; i < obj.transform.childCount; i++)
            {
                CollectGameObjectsRecursive(obj.transform.GetChild(i).gameObject, list);
            }
        }

        private int EnsureSceneRecord(SQLite.SQLiteConnection connection, Scene scene)
        {
            var checkSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var ids = connection.Query<SceneIdRecord>(checkSql, scene.path);

            if (ids.Count() > 0)
            {
                // Update is_loaded status
                connection.Execute("UPDATE scenes SET is_loaded = 1, updated_at = datetime('now', 'localtime') WHERE scene_id = ?", ids.First().scene_id);
                return ids.First().scene_id;
            }

            var insertSql = @"
                INSERT INTO scenes (scene_name, scene_path, build_index, is_loaded, created_at, updated_at)
                VALUES (?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
            ";
            connection.Execute(insertSql, scene.name, scene.path, scene.buildIndex);
            return connection.ExecuteScalar<int>("SELECT last_insert_rowid()");
        }

        private int SyncGameObject(SQLite.SQLiteConnection connection, GameObject obj, int sceneId, Dictionary<int, int> objectIdMap)
        {
            int instanceId = obj.GetInstanceID();

            // Check if exists
            var checkSql = "SELECT object_id FROM gameobjects WHERE instance_id = ?";
            var existingIds = connection.Query<ObjectIdRecord>(checkSql, instanceId);

            int? parentObjectId = null;
            if (obj.transform.parent != null)
            {
                int parentInstanceId = obj.transform.parent.gameObject.GetInstanceID();
                if (objectIdMap.ContainsKey(parentInstanceId))
                {
                    parentObjectId = objectIdMap[parentInstanceId];
                }
            }

            if (existingIds.Count() > 0)
            {
                // Update existing
                var updateSql = @"
                    UPDATE gameobjects SET
                        scene_id = ?,
                        object_name = ?,
                        parent_id = ?,
                        tag = ?,
                        layer = ?,
                        is_active = ?,
                        is_static = ?,
                        is_deleted = 0,
                        updated_at = datetime('now', 'localtime')
                    WHERE object_id = ?
                ";
                connection.Execute(updateSql, sceneId, obj.name, parentObjectId, obj.tag, obj.layer,
                    obj.activeSelf ? 1 : 0, obj.isStatic ? 1 : 0, existingIds.First().object_id);
                return existingIds.First().object_id;
            }
            else
            {
                // Insert new
                var insertSql = @"
                    INSERT INTO gameobjects (
                        instance_id, scene_id, object_name, parent_id, tag, layer,
                        is_active, is_static, is_deleted, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
                ";
                connection.Execute(insertSql, instanceId, sceneId, obj.name, parentObjectId, obj.tag, obj.layer,
                    obj.activeSelf ? 1 : 0, obj.isStatic ? 1 : 0);
                return connection.ExecuteScalar<int>("SELECT last_insert_rowid()");
            }
        }

        private int SyncComponents(SQLite.SQLiteConnection connection, GameObject obj, int objectId)
        {
            // Clear existing components for this object
            connection.Execute("DELETE FROM components WHERE object_id = ?", objectId);

            var components = obj.GetComponents<Component>();
            int count = 0;

            foreach (var comp in components)
            {
                if (comp == null) continue;

                string componentType = comp.GetType().Name;
                string componentData = "{}"; // Simple placeholder for now

                var insertSql = @"
                    INSERT INTO components (object_id, component_type, component_data, is_enabled, created_at, updated_at)
                    VALUES (?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
                ";
                connection.Execute(insertSql, objectId, componentType, componentData);
                count++;
            }

            return count;
        }

        private int BuildClosureTable(SQLite.SQLiteConnection connection, List<GameObject> objects, Dictionary<int, int> objectIdMap)
        {
            // Clear existing closure records for these objects
            var objectIds = objectIdMap.Values.ToList();
            if (objectIds.Count > 0)
            {
                // Use parameterized query to prevent SQL injection
                // For small lists, delete individually
                if (objectIds.Count <= 100)
                {
                    foreach (var id in objectIds)
                    {
                        connection.Execute("DELETE FROM gameobject_closure WHERE descendant_id = ?", id);
                    }
                }
                else
                {
                    // For large lists, use temporary table
                    connection.Execute("CREATE TEMP TABLE IF NOT EXISTS temp_object_ids (id INTEGER)");

                    connection.BeginTransaction();
                    try
                    {
                        foreach (var id in objectIds)
                        {
                            connection.Execute("INSERT INTO temp_object_ids VALUES (?)", id);
                        }

                        connection.Execute(@"
                            DELETE FROM gameobject_closure
                            WHERE descendant_id IN (SELECT id FROM temp_object_ids)
                        ");

                        connection.Execute("DELETE FROM temp_object_ids");
                        connection.Commit();
                    }
                    catch
                    {
                        connection.Rollback();
                        throw;
                    }
                }
            }

            int count = 0;

            foreach (var obj in objects)
            {
                int objectId = objectIdMap[obj.GetInstanceID()];

                // Add self-reference (depth = 0)
                connection.Execute("INSERT INTO gameobject_closure (ancestor_id, descendant_id, depth) VALUES (?, ?, 0)", objectId, objectId);
                count++;

                // Add ancestors
                var current = obj.transform.parent;
                int depth = 1;

                while (current != null)
                {
                    int ancestorInstanceId = current.gameObject.GetInstanceID();
                    if (objectIdMap.ContainsKey(ancestorInstanceId))
                    {
                        int ancestorId = objectIdMap[ancestorInstanceId];
                        connection.Execute("INSERT INTO gameobject_closure (ancestor_id, descendant_id, depth) VALUES (?, ?, ?)",
                            ancestorId, objectId, depth);
                        count++;
                    }
                    current = current.parent;
                    depth++;
                }
            }

            return count;
        }

        #endregion

        #region Data Classes

        [Serializable]
        public class SyncSceneParams
        {
            public bool clearExisting = true;
            public bool includeComponents = true;
            public bool buildClosure = true;
        }

        [Serializable]
        public class SyncGameObjectParams
        {
            public string target;
            public bool includeComponents = true;
            public bool includeChildren = false;
        }

        private class SceneIdRecord
        {
            public int scene_id { get; set; }
        }

        private class ObjectIdRecord
        {
            public int object_id { get; set; }
        }

        [Serializable]
        public class SyncResult
        {
            public bool success;
            public string sceneName;
            public int sceneId;
            public int syncedObjects;
            public int syncedComponents;
            public int closureRecords;
            public string message;
        }

        [Serializable]
        public class SyncGameObjectResult
        {
            public bool success;
            public string objectName;
            public int objectId;
            public int syncedComponents;
            public int syncedChildren;
            public string message;
        }

        [Serializable]
        public class SyncStatusResult
        {
            public bool success;
            public string sceneName;
            public int unityObjectCount;
            public int dbObjectCount;
            public int dbComponentCount;
            public int closureRecordCount;
            public bool inSync;
        }

        [Serializable]
        public class ClearSyncResult
        {
            public bool success;
            public int deletedObjects;
            public int deletedComponents;
            public string message;
        }

        [Serializable]
        public class AutoSyncResult
        {
            public bool success;
            public string message;
            public bool isRunning;
        }

        [Serializable]
        public class AutoSyncStatusResult
        {
            public bool success;
            public bool isRunning;
            public bool isInitialized;
            public string lastSyncTime;
            public int successfulSyncCount;
            public int failedSyncCount;
            public int syncIntervalMs;
            public int batchSize;
        }

        #endregion
    }
}
