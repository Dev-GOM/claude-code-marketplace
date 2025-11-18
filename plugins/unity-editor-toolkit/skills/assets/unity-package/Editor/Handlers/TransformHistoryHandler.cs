using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Transform History commands (Track and restore transform changes)
    /// </summary>
    public class TransformHistoryHandler : BaseHandler
    {
        public override string Category => "TransformHistory";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Record":
                    return HandleRecord(request);
                case "List":
                    return HandleList(request);
                case "Restore":
                    return HandleRestore(request);
                case "Compare":
                    return HandleCompare(request);
                case "Clear":
                    return HandleClear(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Record current transform state for a GameObject
        /// </summary>
        private object HandleRecord(JsonRpcRequest request)
        {
            var param = ValidateParam<RecordParams>(request, "target");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Find GameObject
            var obj = FindGameObject(param.target);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.target}");
            }

            // Ensure GameObject record exists
            int objectId = EnsureGameObjectRecord(connection, obj);

            // Record transform
            var transform = obj.transform;
            var sql = @"
                INSERT INTO transforms (
                    object_id,
                    position_x, position_y, position_z,
                    rotation_x, rotation_y, rotation_z, rotation_w,
                    scale_x, scale_y, scale_z,
                    recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
            ";

            connection.Execute(sql,
                objectId,
                transform.localPosition.x, transform.localPosition.y, transform.localPosition.z,
                transform.localRotation.x, transform.localRotation.y, transform.localRotation.z, transform.localRotation.w,
                transform.localScale.x, transform.localScale.y, transform.localScale.z
            );

            // Get inserted ID
            var transformId = connection.ExecuteScalar<int>("SELECT last_insert_rowid()");

            return new RecordResult
            {
                success = true,
                transformId = transformId,
                objectId = objectId,
                objectName = obj.name,
                position = new Vector3Data(transform.localPosition),
                rotation = new Vector4Data(transform.localRotation),
                scale = new Vector3Data(transform.localScale),
                message = $"Transform recorded for '{obj.name}'"
            };
        }

        /// <summary>
        /// List transform history for a GameObject
        /// </summary>
        private object HandleList(JsonRpcRequest request)
        {
            var param = ValidateParam<ListParams>(request, "target");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Find GameObject
            var obj = FindGameObject(param.target);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.target}");
            }

            // Get object ID
            var checkSql = "SELECT object_id FROM gameobjects WHERE instance_id = ?";
            var ids = connection.Query<ObjectIdRecord>(checkSql, obj.GetInstanceID());

            if (ids.Count() == 0)
            {
                return new ListResult
                {
                    success = true,
                    objectName = obj.name,
                    count = 0,
                    history = new List<TransformHistoryEntry>()
                };
            }

            int objectId = ids[0].object_id;

            // Get history
            var sql = @"
                SELECT transform_id, object_id,
                       position_x, position_y, position_z,
                       rotation_x, rotation_y, rotation_z, rotation_w,
                       scale_x, scale_y, scale_z,
                       recorded_at
                FROM transforms
                WHERE object_id = ?
                ORDER BY recorded_at DESC
                LIMIT ?
            ";

            var records = connection.Query<TransformRecord>(sql, objectId, param.limit);

            var history = records.Select(r => new TransformHistoryEntry
            {
                transformId = r.transform_id,
                position = new Vector3Data(r.position_x, r.position_y, r.position_z),
                rotation = new Vector4Data(r.rotation_x, r.rotation_y, r.rotation_z, r.rotation_w),
                scale = new Vector3Data(r.scale_x, r.scale_y, r.scale_z),
                recordedAt = r.recorded_at
            }).ToList();

            return new ListResult
            {
                success = true,
                objectName = obj.name,
                objectId = objectId,
                count = history.Count,
                history = history
            };
        }

        /// <summary>
        /// Restore transform from history
        /// </summary>
        private object HandleRestore(JsonRpcRequest request)
        {
            var param = ValidateParam<RestoreParams>(request, "transformId");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Get transform record
            var sql = @"
                SELECT t.transform_id, t.object_id,
                       t.position_x, t.position_y, t.position_z,
                       t.rotation_x, t.rotation_y, t.rotation_z, t.rotation_w,
                       t.scale_x, t.scale_y, t.scale_z,
                       t.recorded_at,
                       g.instance_id, g.object_name
                FROM transforms t
                INNER JOIN gameobjects g ON t.object_id = g.object_id
                WHERE t.transform_id = ?
            ";

            var records = connection.Query<TransformWithObjectRecord>(sql, param.transformId);

            if (records.Count() == 0)
            {
                throw new Exception($"Transform record {param.transformId} not found");
            }

            var record = records[0];

            // Find GameObject by instance ID
            #if UNITY_EDITOR
            var obj = EditorUtility.InstanceIDToObject(record.instance_id) as GameObject;
            #else
            var obj = FindGameObject(record.object_name);
            #endif

            if (obj == null)
            {
                throw new Exception($"GameObject '{record.object_name}' not found in scene");
            }

            // Record undo
            #if UNITY_EDITOR
            Undo.RecordObject(obj.transform, "Restore Transform from History");
            #endif

            // Restore transform
            obj.transform.localPosition = new Vector3(record.position_x, record.position_y, record.position_z);
            obj.transform.localRotation = new Quaternion(record.rotation_x, record.rotation_y, record.rotation_z, record.rotation_w);
            obj.transform.localScale = new Vector3(record.scale_x, record.scale_y, record.scale_z);

            return new RestoreResult
            {
                success = true,
                transformId = record.transform_id,
                objectName = record.object_name,
                position = new Vector3Data(obj.transform.localPosition),
                rotation = new Vector4Data(obj.transform.localRotation),
                scale = new Vector3Data(obj.transform.localScale),
                message = $"Transform restored for '{record.object_name}' from {record.recorded_at}"
            };
        }

        /// <summary>
        /// Compare two transform records
        /// </summary>
        private object HandleCompare(JsonRpcRequest request)
        {
            var param = ValidateParam<CompareParams>(request, "transformId1");

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
                SELECT transform_id, object_id,
                       position_x, position_y, position_z,
                       rotation_x, rotation_y, rotation_z, rotation_w,
                       scale_x, scale_y, scale_z,
                       recorded_at
                FROM transforms
                WHERE transform_id IN (?, ?)
            ";

            var records = connection.Query<TransformRecord>(sql, param.transformId1, param.transformId2);

            if (records.Count() < 2)
            {
                throw new Exception("One or both transform records not found");
            }

            var t1 = records.First(r => r.transform_id == param.transformId1);
            var t2 = records.First(r => r.transform_id == param.transformId2);

            var positionDiff = new Vector3(
                t2.position_x - t1.position_x,
                t2.position_y - t1.position_y,
                t2.position_z - t1.position_z
            );

            var scaleDiff = new Vector3(
                t2.scale_x - t1.scale_x,
                t2.scale_y - t1.scale_y,
                t2.scale_z - t1.scale_z
            );

            var rot1 = new Quaternion(t1.rotation_x, t1.rotation_y, t1.rotation_z, t1.rotation_w);
            var rot2 = new Quaternion(t2.rotation_x, t2.rotation_y, t2.rotation_z, t2.rotation_w);
            var rotationAngle = Quaternion.Angle(rot1, rot2);

            return new CompareResult
            {
                success = true,
                transform1 = new TransformHistoryEntry
                {
                    transformId = t1.transform_id,
                    position = new Vector3Data(t1.position_x, t1.position_y, t1.position_z),
                    rotation = new Vector4Data(t1.rotation_x, t1.rotation_y, t1.rotation_z, t1.rotation_w),
                    scale = new Vector3Data(t1.scale_x, t1.scale_y, t1.scale_z),
                    recordedAt = t1.recorded_at
                },
                transform2 = new TransformHistoryEntry
                {
                    transformId = t2.transform_id,
                    position = new Vector3Data(t2.position_x, t2.position_y, t2.position_z),
                    rotation = new Vector4Data(t2.rotation_x, t2.rotation_y, t2.rotation_z, t2.rotation_w),
                    scale = new Vector3Data(t2.scale_x, t2.scale_y, t2.scale_z),
                    recordedAt = t2.recorded_at
                },
                positionDifference = new Vector3Data(positionDiff),
                rotationAngleDifference = rotationAngle,
                scaleDifference = new Vector3Data(scaleDiff)
            };
        }

        /// <summary>
        /// Clear transform history for a GameObject
        /// </summary>
        private object HandleClear(JsonRpcRequest request)
        {
            var param = ValidateParam<ClearParams>(request, "target");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            // Find GameObject
            var obj = FindGameObject(param.target);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.target}");
            }

            // Get object ID
            var checkSql = "SELECT object_id FROM gameobjects WHERE instance_id = ?";
            var ids = connection.Query<ObjectIdRecord>(checkSql, obj.GetInstanceID());

            if (ids.Count() == 0)
            {
                return new ClearResult
                {
                    success = true,
                    objectName = obj.name,
                    deletedCount = 0,
                    message = $"No transform history found for '{obj.name}'"
                };
            }

            int objectId = ids[0].object_id;

            // Delete history
            var deleteSql = "DELETE FROM transforms WHERE object_id = ?";
            connection.Execute(deleteSql, objectId);

            // Get count
            var countSql = "SELECT changes()";
            var deletedCount = connection.ExecuteScalar<int>(countSql);

            return new ClearResult
            {
                success = true,
                objectName = obj.name,
                objectId = objectId,
                deletedCount = deletedCount,
                message = $"Cleared {deletedCount} transform records for '{obj.name}'"
            };
        }

        #region Helper Methods

        private int EnsureGameObjectRecord(SQLite.SQLiteConnection connection, GameObject obj)
        {
            var checkSql = "SELECT object_id FROM gameobjects WHERE instance_id = ?";
            var ids = connection.Query<ObjectIdRecord>(checkSql, obj.GetInstanceID());

            if (ids.Count() > 0)
            {
                return ids[0].object_id;
            }

            // Get scene ID
            int sceneId = EnsureSceneRecord(connection, obj.scene);

            // Insert GameObject record
            var insertSql = @"
                INSERT INTO gameobjects (
                    instance_id, scene_id, object_name,
                    tag, layer, is_active, is_static, is_deleted,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
            ";

            connection.Execute(insertSql,
                obj.GetInstanceID(),
                sceneId,
                obj.name,
                obj.tag,
                obj.layer,
                obj.activeSelf ? 1 : 0,
                obj.isStatic ? 1 : 0
            );

            return connection.ExecuteScalar<int>("SELECT last_insert_rowid()");
        }

        private int EnsureSceneRecord(SQLite.SQLiteConnection connection, UnityEngine.SceneManagement.Scene scene)
        {
            var checkSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var ids = connection.Query<SceneIdRecord>(checkSql, scene.path);

            if (ids.Count() > 0)
            {
                return ids[0].scene_id;
            }

            var insertSql = @"
                INSERT INTO scenes (scene_name, scene_path, build_index, is_loaded, created_at, updated_at)
                VALUES (?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
            ";
            connection.Execute(insertSql, scene.name, scene.path, scene.buildIndex);

            return connection.ExecuteScalar<int>("SELECT last_insert_rowid()");
        }

        #endregion

        #region Data Classes

        // Parameter classes
        [Serializable]
        public class RecordParams
        {
            public string target;
        }

        [Serializable]
        public class ListParams
        {
            public string target;
            public int limit = 50;
        }

        [Serializable]
        public class RestoreParams
        {
            public int transformId;
        }

        [Serializable]
        public class CompareParams
        {
            public int transformId1;
            public int transformId2;
        }

        [Serializable]
        public class ClearParams
        {
            public string target;
        }

        // Database record classes
        private class ObjectIdRecord
        {
            public int object_id { get; set; }
        }

        private class SceneIdRecord
        {
            public int scene_id { get; set; }
        }

        private class TransformRecord
        {
            public int transform_id { get; set; }
            public int object_id { get; set; }
            public float position_x { get; set; }
            public float position_y { get; set; }
            public float position_z { get; set; }
            public float rotation_x { get; set; }
            public float rotation_y { get; set; }
            public float rotation_z { get; set; }
            public float rotation_w { get; set; }
            public float scale_x { get; set; }
            public float scale_y { get; set; }
            public float scale_z { get; set; }
            public string recorded_at { get; set; }
        }

        private class TransformWithObjectRecord : TransformRecord
        {
            public int instance_id { get; set; }
            public string object_name { get; set; }
        }

        // Result classes
        [Serializable]
        public class RecordResult
        {
            public bool success;
            public int transformId;
            public int objectId;
            public string objectName;
            public Vector3Data position;
            public Vector4Data rotation;
            public Vector3Data scale;
            public string message;
        }

        [Serializable]
        public class ListResult
        {
            public bool success;
            public string objectName;
            public int objectId;
            public int count;
            public List<TransformHistoryEntry> history;
        }

        [Serializable]
        public class TransformHistoryEntry
        {
            public int transformId;
            public Vector3Data position;
            public Vector4Data rotation;
            public Vector3Data scale;
            public string recordedAt;
        }

        [Serializable]
        public class RestoreResult
        {
            public bool success;
            public int transformId;
            public string objectName;
            public Vector3Data position;
            public Vector4Data rotation;
            public Vector3Data scale;
            public string message;
        }

        [Serializable]
        public class CompareResult
        {
            public bool success;
            public TransformHistoryEntry transform1;
            public TransformHistoryEntry transform2;
            public Vector3Data positionDifference;
            public float rotationAngleDifference;
            public Vector3Data scaleDifference;
        }

        [Serializable]
        public class ClearResult
        {
            public bool success;
            public string objectName;
            public int objectId;
            public int deletedCount;
            public string message;
        }

        // Vector data classes
        [Serializable]
        public class Vector3Data
        {
            public float x;
            public float y;
            public float z;

            public Vector3Data() { }
            public Vector3Data(Vector3 v) { x = v.x; y = v.y; z = v.z; }
            public Vector3Data(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        }

        [Serializable]
        public class Vector4Data
        {
            public float x;
            public float y;
            public float z;
            public float w;

            public Vector4Data() { }
            public Vector4Data(Quaternion q) { x = q.x; y = q.y; z = q.z; w = q.w; }
            public Vector4Data(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        }

        #endregion
    }
}
