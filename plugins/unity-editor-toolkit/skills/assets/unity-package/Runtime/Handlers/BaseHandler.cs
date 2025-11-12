using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditorToolkit.Protocol;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Base handler for JSON-RPC commands
    /// </summary>
    public abstract class BaseHandler
    {
        /// <summary>
        /// GameObject 캐시 (WeakReference 사용하여 메모리 누수 방지)
        /// </summary>
        private static Dictionary<string, System.WeakReference> gameObjectCache = new Dictionary<string, System.WeakReference>();
        private static readonly object cacheLock = new object();

        /// <summary>
        /// Handler category (e.g., "GameObject", "Transform")
        /// </summary>
        public abstract string Category { get; }

        /// <summary>
        /// Handle JSON-RPC request
        /// </summary>
        /// <param name="request">JSON-RPC request</param>
        /// <returns>Response object or null for error</returns>
        public object Handle(JsonRpcRequest request)
        {
            try
            {
                // Validate request
                if (request == null)
                {
                    throw new ArgumentNullException(nameof(request), "Request cannot be null");
                }

                // Validate method name
                string fullMethod = request.Method;
                if (string.IsNullOrWhiteSpace(fullMethod))
                {
                    throw new ArgumentException("Method name cannot be null or empty", nameof(request.Method));
                }

                // Validate method belongs to this handler category
                if (!fullMethod.StartsWith(Category + "."))
                {
                    throw new ArgumentException($"Invalid method for {Category} handler: {fullMethod}");
                }

                string methodName = fullMethod.Substring(Category.Length + 1);

                // Validate extracted method name
                if (string.IsNullOrWhiteSpace(methodName))
                {
                    throw new ArgumentException($"Method name is empty after removing category prefix: {fullMethod}");
                }

                // Route to specific handler method
                return HandleMethod(methodName, request);
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogError($"[{Category}] Handler error: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// Handle specific method (must be implemented by subclass)
        /// </summary>
        protected abstract object HandleMethod(string method, JsonRpcRequest request);

        /// <summary>
        /// Validate required parameter
        /// </summary>
        protected T ValidateParam<T>(JsonRpcRequest request, string paramName) where T : class
        {
            var paramsObj = request.GetParams<T>();
            if (paramsObj == null)
            {
                throw new Exception($"Missing or invalid parameter: {paramName}");
            }
            return paramsObj;
        }

        /// <summary>
        /// Find GameObject by name or path (캐싱 적용)
        /// </summary>
        public UnityEngine.GameObject FindGameObject(string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return null;
            }

            // 캐시 확인
            lock (cacheLock)
            {
                if (gameObjectCache.TryGetValue(name, out var weakRef) && weakRef.IsAlive)
                {
                    var cachedObj = weakRef.Target as UnityEngine.GameObject;
                    if (cachedObj != null && cachedObj.scene.IsValid())
                    {
                        return cachedObj;
                    }
                    else
                    {
                        // 캐시 무효화 (객체가 파괴됨)
                        gameObjectCache.Remove(name);
                    }
                }
            }

            // Try direct find first (빠른 검색)
            var obj = UnityEngine.GameObject.Find(name);
            if (obj != null)
            {
                CacheGameObject(name, obj);
                return obj;
            }

            // Try finding in all objects (including inactive) - 비용이 큼
            var allObjects = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.GameObject>();
            foreach (var go in allObjects)
            {
                if (go.name == name || GetGameObjectPath(go) == name)
                {
                    // Make sure it's a scene object, not asset
                    if (go.scene.IsValid())
                    {
                        CacheGameObject(name, go);
                        return go;
                    }
                }
            }

            return null;
        }

        /// <summary>
        /// GameObject를 캐시에 추가
        /// </summary>
        private void CacheGameObject(string name, UnityEngine.GameObject obj)
        {
            lock (cacheLock)
            {
                gameObjectCache[name] = new System.WeakReference(obj);

                // 캐시 크기 제한 (최대 100개)
                if (gameObjectCache.Count > 100)
                {
                    // 만료된(파괴된) 캐시 항목 제거
                    var toRemove = new List<string>();
                    foreach (var kvp in gameObjectCache)
                    {
                        if (!kvp.Value.IsAlive)
                        {
                            toRemove.Add(kvp.Key);
                        }
                    }
                    if (toRemove.Count > 0)
                    {
                        foreach (var key in toRemove)
                        {
                            gameObjectCache.Remove(key);
                        }
                    }

                    // 여전히 캐시 크기가 100개를 초과하면, 일부 항목을 제거하여 공간 확보
                    while (gameObjectCache.Count > 100)
                    {
                        // 가장 간단한 방법으로 첫 번째 항목 제거
                        // 더 나은 방법은 LRU(Least Recently Used) 정책을 구현하는 것입니다
                        var keyToRemove = gameObjectCache.Keys.First();
                        gameObjectCache.Remove(keyToRemove);
                    }
                }
            }
        }

        /// <summary>
        /// 캐시 비우기 (테스트용 또는 메모리 정리)
        /// </summary>
        public static void ClearCache()
        {
            lock (cacheLock)
            {
                gameObjectCache.Clear();
            }
        }

        /// <summary>
        /// Get full path of GameObject in hierarchy
        /// </summary>
        protected string GetGameObjectPath(UnityEngine.GameObject obj)
        {
            string path = obj.name;
            var parent = obj.transform.parent;
            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }
            return path;
        }
    }
}
