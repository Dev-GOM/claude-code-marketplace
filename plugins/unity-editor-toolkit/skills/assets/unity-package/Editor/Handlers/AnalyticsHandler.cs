using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Analytics and caching
    /// </summary>
    public class AnalyticsHandler : BaseHandler
    {
        public override string Category => "Analytics";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetProjectStats":
                    return HandleGetProjectStats(request);
                case "GetSceneStats":
                    return HandleGetSceneStats(request);
                case "SetCache":
                    return HandleSetCache(request);
                case "GetCache":
                    return HandleGetCache(request);
                case "ClearCache":
                    return HandleClearCache(request);
                case "ListCache":
                    return HandleListCache(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Get project-wide statistics
        /// </summary>
        private object HandleGetProjectStats(JsonRpcRequest request)
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

            // Check cache first
            var cacheKey = "project_stats";
            var cacheResult = GetCacheData(connection, cacheKey);

            if (cacheResult != null)
            {
                return JsonUtility.FromJson<ProjectStatsResult>(cacheResult);
            }

            // Calculate stats
            int totalScenes = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM scenes");
            int totalObjects = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM gameobjects WHERE is_deleted = 0");
            int totalComponents = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM components");
            int totalTransforms = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM transforms");
            int totalSnapshots = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM snapshots");
            int commandHistoryCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM command_history");

            // Get most used components
            var componentsSql = @"
                SELECT component_type, COUNT(*) as count
                FROM components
                GROUP BY component_type
                ORDER BY count DESC
                LIMIT 10
            ";
            var componentStats = connection.Query<ComponentStatRecord>(componentsSql);

            var topComponents = componentStats.Select(c => new ComponentStat
            {
                componentType = c.component_type,
                count = c.count
            }).ToList();

            var result = new ProjectStatsResult
            {
                success = true,
                totalScenes = totalScenes,
                totalObjects = totalObjects,
                totalComponents = totalComponents,
                totalTransforms = totalTransforms,
                totalSnapshots = totalSnapshots,
                commandHistoryCount = commandHistoryCount,
                topComponents = topComponents
            };

            // Cache result
            var jsonData = JsonUtility.ToJson(result);
            SetCacheData(connection, cacheKey, jsonData, 3600); // Cache for 1 hour

            return result;
        }

        /// <summary>
        /// Get current scene statistics
        /// </summary>
        private object HandleGetSceneStats(JsonRpcRequest request)
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
            var cacheKey = $"scene_stats_{scene.path}";

            // Check cache
            var cacheResult = GetCacheData(connection, cacheKey);
            if (cacheResult != null)
            {
                return JsonUtility.FromJson<SceneStatsResult>(cacheResult);
            }

            // Get scene ID
            var sceneIdSql = "SELECT scene_id FROM scenes WHERE scene_path = ?";
            var sceneIds = connection.Query<SceneIdRecord>(sceneIdSql, scene.path);

            if (sceneIds.Count() == 0)
            {
                return new SceneStatsResult
                {
                    success = true,
                    sceneName = scene.name,
                    scenePath = scene.path,
                    objectCount = 0,
                    componentCount = 0,
                    snapshotCount = 0,
                    message = "Scene not synced to database"
                };
            }

            int sceneId = sceneIds.First().scene_id;

            // Calculate stats
            int objectCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM gameobjects WHERE scene_id = ? AND is_deleted = 0", sceneId);
            int componentCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM components WHERE object_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);
            int snapshotCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM snapshots WHERE scene_id = ?", sceneId);
            int transformHistoryCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM transforms WHERE object_id IN (SELECT object_id FROM gameobjects WHERE scene_id = ?)", sceneId);

            var result = new SceneStatsResult
            {
                success = true,
                sceneName = scene.name,
                scenePath = scene.path,
                sceneId = sceneId,
                objectCount = objectCount,
                componentCount = componentCount,
                snapshotCount = snapshotCount,
                transformHistoryCount = transformHistoryCount,
                message = "Scene statistics retrieved successfully"
            };

            // Cache result
            var jsonData = JsonUtility.ToJson(result);
            SetCacheData(connection, cacheKey, jsonData, 300); // Cache for 5 minutes

            return result;
        }

        /// <summary>
        /// Set cache data
        /// </summary>
        private object HandleSetCache(JsonRpcRequest request)
        {
            var param = ValidateParam<SetCacheParams>(request, "key");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            int ttl = param.ttl > 0 ? param.ttl : 3600; // Default 1 hour
            SetCacheData(connection, param.key, param.data, ttl);

            return new CacheResult
            {
                success = true,
                key = param.key,
                message = $"Cache set successfully (TTL: {ttl}s)"
            };
        }

        /// <summary>
        /// Get cache data
        /// </summary>
        private object HandleGetCache(JsonRpcRequest request)
        {
            var param = ValidateParam<GetCacheParams>(request, "key");

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            var data = GetCacheData(connection, param.key);

            if (data == null)
            {
                return new GetCacheResult
                {
                    success = false,
                    key = param.key,
                    data = null,
                    message = "Cache not found or expired"
                };
            }

            return new GetCacheResult
            {
                success = true,
                key = param.key,
                data = data,
                message = "Cache retrieved successfully"
            };
        }

        /// <summary>
        /// Clear cache
        /// </summary>
        private object HandleClearCache(JsonRpcRequest request)
        {
            var param = request.GetParams<ClearCacheParams>();

            if (!DatabaseManager.Instance.IsConnected)
            {
                throw new Exception("Database is not connected");
            }

            var connection = DatabaseManager.Instance.Connector?.Connection;
            if (connection == null)
            {
                throw new Exception("Failed to get database connection");
            }

            int deletedCount;

            if (param != null && !string.IsNullOrEmpty(param.key))
            {
                // Clear specific key
                deletedCount = connection.Execute("DELETE FROM analytics_cache WHERE cache_key = ?", param.key);
            }
            else
            {
                // Clear all cache
                deletedCount = connection.Execute("DELETE FROM analytics_cache");
            }

            return new ClearCacheResult
            {
                success = true,
                deletedCount = deletedCount,
                message = $"Cleared {deletedCount} cache entries"
            };
        }

        /// <summary>
        /// List all cache entries
        /// </summary>
        private object HandleListCache(JsonRpcRequest request)
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

            var sql = @"
                SELECT cache_id, cache_key, expires_at, created_at
                FROM analytics_cache
                ORDER BY created_at DESC
            ";
            var records = connection.Query<CacheListRecord>(sql);

            var entries = records.Select(r => new CacheEntry
            {
                cacheId = r.cache_id,
                cacheKey = r.cache_key,
                expiresAt = r.expires_at,
                createdAt = r.created_at,
                isExpired = IsExpired(r.expires_at)
            }).ToList();

            return new ListCacheResult
            {
                success = true,
                count = entries.Count,
                entries = entries
            };
        }

        #region Helper Methods

        private void SetCacheData(SQLite.SQLiteConnection connection, string key, string data, int ttlSeconds)
        {
            var expiresAt = DateTime.Now.AddSeconds(ttlSeconds).ToString("O");

            // Delete existing
            connection.Execute("DELETE FROM analytics_cache WHERE cache_key = ?", key);

            // Insert new
            var sql = @"
                INSERT INTO analytics_cache (cache_key, cache_data, expires_at, created_at)
                VALUES (?, ?, ?, datetime('now', 'localtime'))
            ";
            connection.Execute(sql, key, data, expiresAt);
        }

        private string GetCacheData(SQLite.SQLiteConnection connection, string key)
        {
            var sql = "SELECT cache_data, expires_at FROM analytics_cache WHERE cache_key = ?";
            var records = connection.Query<CacheDataRecord>(sql, key);

            if (records.Count() == 0)
            {
                return null;
            }

            var record = records.First();

            // Check expiration
            if (IsExpired(record.expires_at))
            {
                // Delete expired cache
                connection.Execute("DELETE FROM analytics_cache WHERE cache_key = ?", key);
                return null;
            }

            return record.cache_data;
        }

        private bool IsExpired(string expiresAt)
        {
            if (string.IsNullOrEmpty(expiresAt))
            {
                return false; // Never expires
            }

            DateTime expires;
            if (DateTime.TryParse(expiresAt, out expires))
            {
                return DateTime.Now > expires;
            }

            return false;
        }

        #endregion

        #region Data Classes

        private class SceneIdRecord
        {
            public int scene_id { get; set; }
        }

        private class ComponentStatRecord
        {
            public string component_type { get; set; }
            public int count { get; set; }
        }

        private class CacheDataRecord
        {
            public string cache_data { get; set; }
            public string expires_at { get; set; }
        }

        private class CacheListRecord
        {
            public int cache_id { get; set; }
            public string cache_key { get; set; }
            public string expires_at { get; set; }
            public string created_at { get; set; }
        }

        [Serializable]
        public class SetCacheParams
        {
            public string key;
            public string data;
            public int ttl = 3600; // Default 1 hour
        }

        [Serializable]
        public class GetCacheParams
        {
            public string key;
        }

        [Serializable]
        public class ClearCacheParams
        {
            public string key;
        }

        [Serializable]
        public class ComponentStat
        {
            public string componentType;
            public int count;
        }

        [Serializable]
        public class ProjectStatsResult
        {
            public bool success;
            public int totalScenes;
            public int totalObjects;
            public int totalComponents;
            public int totalTransforms;
            public int totalSnapshots;
            public int commandHistoryCount;
            public List<ComponentStat> topComponents;
        }

        [Serializable]
        public class SceneStatsResult
        {
            public bool success;
            public string sceneName;
            public string scenePath;
            public int sceneId;
            public int objectCount;
            public int componentCount;
            public int snapshotCount;
            public int transformHistoryCount;
            public string message;
        }

        [Serializable]
        public class CacheResult
        {
            public bool success;
            public string key;
            public string message;
        }

        [Serializable]
        public class GetCacheResult
        {
            public bool success;
            public string key;
            public string data;
            public string message;
        }

        [Serializable]
        public class ClearCacheResult
        {
            public bool success;
            public int deletedCount;
            public string message;
        }

        [Serializable]
        public class CacheEntry
        {
            public int cacheId;
            public string cacheKey;
            public string expiresAt;
            public string createdAt;
            public bool isExpired;
        }

        [Serializable]
        public class ListCacheResult
        {
            public bool success;
            public int count;
            public List<CacheEntry> entries;
        }

        #endregion
    }
}
