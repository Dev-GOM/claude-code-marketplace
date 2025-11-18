using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;

#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Snapshot commands (Save/Load scene state to/from database)
    /// </summary>
    public class SnapshotHandler : BaseHandler
    {
        public override string Category => "Snapshot";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Save":
                    return HandleSave(request);
                case "List":
                    return HandleList(request);
                case "Restore":
                    return HandleRestore(request);
                case "Delete":
                    return HandleDelete(request);
                case "Get":
                    return HandleGet(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Save current scene state as a snapshot
        /// </summary>
        private object HandleSave(JsonRpcRequest request)
        {
            var param = ValidateParam<SaveParams>(request, "name");

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

            // Get or create scene record
            int sceneId = EnsureSceneRecord(connection, scene);

            // Serialize scene state
            var snapshotData = SerializeSceneState(scene);
            var snapshotJson = JsonUtility.ToJson(snapshotData);

            // Insert snapshot
            var sql = @"
                INSERT INTO snapshots (scene_id, snapshot_name, snapshot_data, description, created_at)
                VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
            ";
            connection.Execute(sql, sceneId, param.name, snapshotJson, param.description ?? "");

            // Get the inserted snapshot ID
            var lastIdSql = "SELECT last_insert_rowid()";
            var snapshotId = connection.ExecuteScalar<int>(lastIdSql);

            return new SnapshotResult
            {
                success = true,
                snapshotId = snapshotId,
                snapshotName = param.name,
                sceneName = scene.name,
                scenePath = scene.path,
                objectCount = snapshotData.objects.Count,
                message = $"Snapshot '{param.name}' saved with {snapshotData.objects.Count} objects"
            };
        }

        /// <summary>
        /// List all snapshots for current scene or all scenes
        /// </summary>
        private object HandleList(JsonRpcRequest request)
        {
            var param = request.GetParams<ListParams>() ?? new ListParams();

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            string sql;
            List<SnapshotRecord> records;

            if (param.allScenes)
            {
                sql = @"
                    SELECT s.snapshot_id, s.scene_id, sc.scene_name, sc.scene_path,
                           s.snapshot_name, s.description, s.created_at
                    FROM snapshots s
                    INNER JOIN scenes sc ON s.scene_id = sc.scene_id
                    ORDER BY s.created_at DESC
                    LIMIT ?
                ";
                records = connection.Query<SnapshotRecord>(sql, param.limit);
            }
            else
            {
                var scene = SceneManager.GetActiveScene();
                sql = @"
                    SELECT s.snapshot_id, s.scene_id, sc.scene_name, sc.scene_path,
                           s.snapshot_name, s.description, s.created_at
                    FROM snapshots s
                    INNER JOIN scenes sc ON s.scene_id = sc.scene_id
                    WHERE sc.scene_path = ?
                    ORDER BY s.created_at DESC
                    LIMIT ?
                ";
                records = connection.Query<SnapshotRecord>(sql, scene.path, param.limit);
            }

            var snapshots = records.Select(r => new SnapshotInfo
            {
                snapshotId = r.snapshot_id,
                sceneId = r.scene_id,
                sceneName = r.scene_name,
                scenePath = r.scene_path,
                snapshotName = r.snapshot_name,
                description = r.description,
                createdAt = r.created_at
            }).ToList();

            return new ListResult
            {
                success = true,
                count = snapshots.Count,
                snapshots = snapshots
            };
        }

        /// <summary>
        /// Get snapshot details by ID
        /// </summary>
        private object HandleGet(JsonRpcRequest request)
        {
            var param = ValidateParam<GetParams>(request, "snapshotId");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var sql = @"
                SELECT s.snapshot_id, s.scene_id, sc.scene_name, sc.scene_path,
                       s.snapshot_name, s.snapshot_data, s.description, s.created_at
                FROM snapshots s
                INNER JOIN scenes sc ON s.scene_id = sc.scene_id
                WHERE s.snapshot_id = ?
            ";
            var records = connection.Query<SnapshotDataRecord>(sql, param.snapshotId);

            if (records.Count() == 0)
            {
                throw new Exception($"Snapshot with ID {param.snapshotId} not found");
            }

            var record = records[0];
            var snapshotData = JsonUtility.FromJson<SceneSnapshotData>(record.snapshot_data);

            return new GetResult
            {
                success = true,
                snapshotId = record.snapshot_id,
                sceneId = record.scene_id,
                sceneName = record.scene_name,
                scenePath = record.scene_path,
                snapshotName = record.snapshot_name,
                description = record.description,
                createdAt = record.created_at,
                objectCount = snapshotData.objects.Count,
                data = snapshotData
            };
        }

        /// <summary>
        /// Restore scene from snapshot
        /// </summary>
        private object HandleRestore(JsonRpcRequest request)
        {
            var param = ValidateParam<RestoreParams>(request, "snapshotId");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Get snapshot data
            var sql = @"
                SELECT s.snapshot_id, s.scene_id, sc.scene_name, sc.scene_path,
                       s.snapshot_name, s.snapshot_data, s.description, s.created_at
                FROM snapshots s
                INNER JOIN scenes sc ON s.scene_id = sc.scene_id
                WHERE s.snapshot_id = ?
            ";
            var records = connection.Query<SnapshotDataRecord>(sql, param.snapshotId);

            if (records.Count() == 0)
            {
                throw new Exception($"Snapshot with ID {param.snapshotId} not found");
            }

            var record = records[0];
            var snapshotData = JsonUtility.FromJson<SceneSnapshotData>(record.snapshot_data);

            // Restore scene state
            int restoredCount = RestoreSceneState(snapshotData, param.clearScene);

            return new RestoreResult
            {
                success = true,
                snapshotId = record.snapshot_id,
                snapshotName = record.snapshot_name,
                sceneName = record.scene_name,
                restoredObjects = restoredCount,
                message = $"Restored {restoredCount} objects from snapshot '{record.snapshot_name}'"
            };
        }

        /// <summary>
        /// Delete a snapshot
        /// </summary>
        private object HandleDelete(JsonRpcRequest request)
        {
            var param = ValidateParam<DeleteParams>(request, "snapshotId");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Check if snapshot exists
            var checkSql = "SELECT snapshot_name FROM snapshots WHERE snapshot_id = ?";
            var names = connection.Query<NameRecord>(checkSql, param.snapshotId);

            if (names.Count() == 0)
            {
                throw new Exception($"Snapshot with ID {param.snapshotId} not found");
            }

            var snapshotName = names[0].snapshot_name;

            // Delete snapshot
            var deleteSql = "DELETE FROM snapshots WHERE snapshot_id = ?";
            connection.Execute(deleteSql, param.snapshotId);

            return new DeleteResult
            {
                success = true,
                snapshotId = param.snapshotId,
                snapshotName = snapshotName,
                message = $"Snapshot '{snapshotName}' deleted"
            };
        }

        #region Helper Methods

        private int EnsureSceneRecord(SQLite.SQLiteConnection connection, Scene scene)
        {
            var checkSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var ids = connection.Query<SceneIdRecord>(checkSql, scene.path);

            if (ids.Count() > 0)
            {
                return ids[0].scene_id;
            }

            // Insert new scene record
            var insertSql = @"
                INSERT INTO scenes (scene_name, scene_path, build_index, is_loaded, created_at, updated_at)
                VALUES (?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
            ";
            connection.Execute(insertSql, scene.name, scene.path, scene.buildIndex);

            var lastIdSql = "SELECT last_insert_rowid()";
            return connection.ExecuteScalar<int>(lastIdSql);
        }

        private SceneSnapshotData SerializeSceneState(Scene scene)
        {
            var data = new SceneSnapshotData
            {
                sceneName = scene.name,
                scenePath = scene.path,
                buildIndex = scene.buildIndex,
                capturedAt = DateTime.Now.ToString("O"),
                objects = new List<GameObjectData>()
            };

            // Get all root objects
            var rootObjects = scene.GetRootGameObjects();
            foreach (var root in rootObjects)
            {
                SerializeGameObjectRecursive(root, data.objects);
            }

            return data;
        }

        private void SerializeGameObjectRecursive(GameObject obj, List<GameObjectData> list)
        {
            var objData = new GameObjectData
            {
                instanceId = obj.GetInstanceID(),
                name = obj.name,
                tag = obj.tag,
                layer = obj.layer,
                isActive = obj.activeSelf,
                isStatic = obj.isStatic,
                transform = new TransformData
                {
                    positionX = obj.transform.localPosition.x,
                    positionY = obj.transform.localPosition.y,
                    positionZ = obj.transform.localPosition.z,
                    rotationX = obj.transform.localRotation.x,
                    rotationY = obj.transform.localRotation.y,
                    rotationZ = obj.transform.localRotation.z,
                    rotationW = obj.transform.localRotation.w,
                    scaleX = obj.transform.localScale.x,
                    scaleY = obj.transform.localScale.y,
                    scaleZ = obj.transform.localScale.z
                },
                children = new List<GameObjectData>()
            };

            list.Add(objData);

            // Serialize children
            for (int i = 0; i < obj.transform.childCount; i++)
            {
                var child = obj.transform.GetChild(i).gameObject;
                SerializeGameObjectRecursive(child, objData.children);
            }
        }

        private int RestoreSceneState(SceneSnapshotData data, bool clearScene)
        {
            #if UNITY_EDITOR
            if (clearScene)
            {
                // Clear current scene objects (except preserved ones)
                var currentRoots = SceneManager.GetActiveScene().GetRootGameObjects();
                foreach (var obj in currentRoots)
                {
                    if (!obj.name.StartsWith("_") && obj.tag != "EditorOnly")
                    {
                        Undo.DestroyObjectImmediate(obj);
                    }
                }
            }
            #endif

            int restoredCount = 0;

            // Restore objects
            foreach (var objData in data.objects)
            {
                restoredCount += RestoreGameObjectRecursive(objData, null);
            }

            return restoredCount;
        }

        private int RestoreGameObjectRecursive(GameObjectData data, Transform parent)
        {
            int count = 0;

            // Try to find existing object by instance ID or name
            GameObject obj = null;

            #if UNITY_EDITOR
            obj = EditorUtility.InstanceIDToObject(data.instanceId) as GameObject;
            #endif

            if (obj == null)
            {
                // Create new object
                obj = new GameObject(data.name);
                #if UNITY_EDITOR
                Undo.RegisterCreatedObjectUndo(obj, "Restore Snapshot");
                #endif
            }
            else
            {
                #if UNITY_EDITOR
                Undo.RecordObject(obj.transform, "Restore Snapshot");
                Undo.RecordObject(obj, "Restore Snapshot");
                #endif
            }

            // Restore properties
            obj.name = data.name;
            obj.tag = data.tag;
            obj.layer = data.layer;
            obj.SetActive(data.isActive);
            obj.isStatic = data.isStatic;

            if (parent != null)
            {
                obj.transform.SetParent(parent, false);
            }

            // Restore transform
            obj.transform.localPosition = new Vector3(data.transform.positionX, data.transform.positionY, data.transform.positionZ);
            obj.transform.localRotation = new Quaternion(data.transform.rotationX, data.transform.rotationY, data.transform.rotationZ, data.transform.rotationW);
            obj.transform.localScale = new Vector3(data.transform.scaleX, data.transform.scaleY, data.transform.scaleZ);

            count++;

            // Restore children
            foreach (var childData in data.children)
            {
                count += RestoreGameObjectRecursive(childData, obj.transform);
            }

            return count;
        }

        #endregion

        #region Data Classes

        // Parameter classes
        [Serializable]
        public class SaveParams
        {
            public string name;
            public string description;
        }

        [Serializable]
        public class ListParams
        {
            public bool allScenes = false;
            public int limit = 50;
        }

        [Serializable]
        public class GetParams
        {
            public int snapshotId;
        }

        [Serializable]
        public class RestoreParams
        {
            public int snapshotId;
            public bool clearScene = false;
        }

        [Serializable]
        public class DeleteParams
        {
            public int snapshotId;
        }

        // Database record classes
        private class SnapshotRecord
        {
            public int snapshot_id { get; set; }
            public int scene_id { get; set; }
            public string scene_name { get; set; }
            public string scene_path { get; set; }
            public string snapshot_name { get; set; }
            public string description { get; set; }
            public string created_at { get; set; }
        }

        private class SnapshotDataRecord
        {
            public int snapshot_id { get; set; }
            public int scene_id { get; set; }
            public string scene_name { get; set; }
            public string scene_path { get; set; }
            public string snapshot_name { get; set; }
            public string snapshot_data { get; set; }
            public string description { get; set; }
            public string created_at { get; set; }
        }

        private class SceneIdRecord
        {
            public int scene_id { get; set; }
        }

        private class NameRecord
        {
            public string snapshot_name { get; set; }
        }

        // Result classes
        [Serializable]
        public class SnapshotResult
        {
            public bool success;
            public int snapshotId;
            public string snapshotName;
            public string sceneName;
            public string scenePath;
            public int objectCount;
            public string message;
        }

        [Serializable]
        public class ListResult
        {
            public bool success;
            public int count;
            public List<SnapshotInfo> snapshots;
        }

        [Serializable]
        public class SnapshotInfo
        {
            public int snapshotId;
            public int sceneId;
            public string sceneName;
            public string scenePath;
            public string snapshotName;
            public string description;
            public string createdAt;
        }

        [Serializable]
        public class GetResult
        {
            public bool success;
            public int snapshotId;
            public int sceneId;
            public string sceneName;
            public string scenePath;
            public string snapshotName;
            public string description;
            public string createdAt;
            public int objectCount;
            public SceneSnapshotData data;
        }

        [Serializable]
        public class RestoreResult
        {
            public bool success;
            public int snapshotId;
            public string snapshotName;
            public string sceneName;
            public int restoredObjects;
            public string message;
        }

        [Serializable]
        public class DeleteResult
        {
            public bool success;
            public int snapshotId;
            public string snapshotName;
            public string message;
        }

        // Snapshot data classes
        [Serializable]
        public class SceneSnapshotData
        {
            public string sceneName;
            public string scenePath;
            public int buildIndex;
            public string capturedAt;
            public List<GameObjectData> objects;
        }

        [Serializable]
        public class GameObjectData
        {
            public int instanceId;
            public string name;
            public string tag;
            public int layer;
            public bool isActive;
            public bool isStatic;
            public TransformData transform;
            public List<GameObjectData> children;
        }

        [Serializable]
        public class TransformData
        {
            public float positionX;
            public float positionY;
            public float positionZ;
            public float rotationX;
            public float rotationY;
            public float rotationZ;
            public float rotationW;
            public float scaleX;
            public float scaleY;
            public float scaleZ;
        }

        #endregion
    }
}
