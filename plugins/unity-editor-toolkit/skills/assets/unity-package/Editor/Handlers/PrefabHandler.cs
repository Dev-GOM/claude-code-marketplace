using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Prefab commands (instantiate, create, unpack, apply, revert, variant, etc.)
    /// </summary>
    public class PrefabHandler : BaseHandler
    {
        public override string Category => "Prefab";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Instantiate":
                    return HandleInstantiate(request);
                case "Create":
                    return HandleCreate(request);
                case "Unpack":
                    return HandleUnpack(request);
                case "Apply":
                    return HandleApply(request);
                case "Revert":
                    return HandleRevert(request);
                case "Variant":
                    return HandleVariant(request);
                case "GetOverrides":
                    return HandleGetOverrides(request);
                case "GetSource":
                    return HandleGetSource(request);
                case "IsInstance":
                    return HandleIsInstance(request);
                case "Open":
                    return HandleOpen(request);
                case "Close":
                    return HandleClose(request);
                case "List":
                    return HandleList(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Instantiate a prefab in the scene
        /// </summary>
        private object HandleInstantiate(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<InstantiateParams>(request, "path");

            // Load prefab asset
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(param.path);
            if (prefab == null)
            {
                throw new Exception($"Prefab not found: {param.path}");
            }

            // Instantiate prefab
            GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (instance == null)
            {
                throw new Exception($"Failed to instantiate prefab: {param.path}");
            }

            // Register undo
            Undo.RegisterCreatedObjectUndo(instance, "Instantiate Prefab");

            // Set name if provided
            if (!string.IsNullOrEmpty(param.name))
            {
                instance.name = param.name;
            }

            // Set position if provided
            if (!string.IsNullOrEmpty(param.position))
            {
                var parts = param.position.Split(',');
                if (parts.Length == 3)
                {
                    instance.transform.position = new Vector3(
                        float.Parse(parts[0].Trim()),
                        float.Parse(parts[1].Trim()),
                        float.Parse(parts[2].Trim())
                    );
                }
            }

            // Set rotation if provided
            if (!string.IsNullOrEmpty(param.rotation))
            {
                var parts = param.rotation.Split(',');
                if (parts.Length == 3)
                {
                    instance.transform.eulerAngles = new Vector3(
                        float.Parse(parts[0].Trim()),
                        float.Parse(parts[1].Trim()),
                        float.Parse(parts[2].Trim())
                    );
                }
            }

            // Set parent if provided
            if (!string.IsNullOrEmpty(param.parent))
            {
                var parentObj = FindGameObject(param.parent);
                if (parentObj != null)
                {
                    instance.transform.SetParent(parentObj.transform, true);
                }
            }

            return new InstantiateResult
            {
                success = true,
                instanceName = instance.name,
                prefabPath = param.path,
                position = new Vector3Info(instance.transform.position)
            };
            #else
            throw new Exception("Prefab.Instantiate is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Create a prefab from a scene GameObject
        /// </summary>
        private object HandleCreate(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<CreateParams>(request, "name and path");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            // Ensure path ends with .prefab
            string savePath = param.path;
            if (!savePath.EndsWith(".prefab"))
            {
                savePath += ".prefab";
            }

            // Create directory if needed
            string directory = System.IO.Path.GetDirectoryName(savePath);
            if (!string.IsNullOrEmpty(directory) && !AssetDatabase.IsValidFolder(directory))
            {
                CreateFolderRecursively(directory);
            }

            // Check if prefab already exists
            var existingPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(savePath);
            if (existingPrefab != null && !param.overwrite)
            {
                throw new Exception($"Prefab already exists: {savePath}. Use --overwrite to replace.");
            }

            // Create prefab
            bool success;
            GameObject prefab;

            if (existingPrefab != null)
            {
                prefab = PrefabUtility.SaveAsPrefabAssetAndConnect(obj, savePath, InteractionMode.UserAction, out success);
            }
            else
            {
                prefab = PrefabUtility.SaveAsPrefabAssetAndConnect(obj, savePath, InteractionMode.UserAction, out success);
            }

            if (!success || prefab == null)
            {
                throw new Exception($"Failed to create prefab at: {savePath}");
            }

            AssetDatabase.Refresh();

            return new CreateResult
            {
                success = true,
                prefabPath = savePath,
                sourceName = obj.name,
                isConnected = PrefabUtility.IsPartOfPrefabInstance(obj)
            };
            #else
            throw new Exception("Prefab.Create is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Unpack a prefab instance
        /// </summary>
        private object HandleUnpack(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<UnpackParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            if (!PrefabUtility.IsPartOfPrefabInstance(obj))
            {
                throw new Exception($"GameObject is not a prefab instance: {param.name}");
            }

            // Get prefab root
            var prefabRoot = PrefabUtility.GetOutermostPrefabInstanceRoot(obj);
            if (prefabRoot == null)
            {
                prefabRoot = obj;
            }

            Undo.RegisterCompleteObjectUndo(prefabRoot, "Unpack Prefab");

            // Unpack based on mode
            if (param.completely)
            {
                PrefabUtility.UnpackPrefabInstance(prefabRoot, PrefabUnpackMode.Completely, InteractionMode.UserAction);
            }
            else
            {
                PrefabUtility.UnpackPrefabInstance(prefabRoot, PrefabUnpackMode.OutermostRoot, InteractionMode.UserAction);
            }

            return new { success = true, unpackedObject = prefabRoot.name, completely = param.completely };
            #else
            throw new Exception("Prefab.Unpack is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Apply prefab instance overrides to the source prefab
        /// </summary>
        private object HandleApply(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ApplyParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            if (!PrefabUtility.IsPartOfPrefabInstance(obj))
            {
                throw new Exception($"GameObject is not a prefab instance: {param.name}");
            }

            // Get prefab root
            var prefabRoot = PrefabUtility.GetOutermostPrefabInstanceRoot(obj);
            if (prefabRoot == null)
            {
                prefabRoot = obj;
            }

            // Get source prefab path
            string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(prefabRoot);

            // Apply all overrides
            PrefabUtility.ApplyPrefabInstance(prefabRoot, InteractionMode.UserAction);

            return new ApplyResult
            {
                success = true,
                instanceName = prefabRoot.name,
                prefabPath = prefabPath
            };
            #else
            throw new Exception("Prefab.Apply is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Revert prefab instance overrides
        /// </summary>
        private object HandleRevert(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<RevertParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            if (!PrefabUtility.IsPartOfPrefabInstance(obj))
            {
                throw new Exception($"GameObject is not a prefab instance: {param.name}");
            }

            // Get prefab root
            var prefabRoot = PrefabUtility.GetOutermostPrefabInstanceRoot(obj);
            if (prefabRoot == null)
            {
                prefabRoot = obj;
            }

            Undo.RegisterCompleteObjectUndo(prefabRoot, "Revert Prefab");

            // Revert all overrides
            PrefabUtility.RevertPrefabInstance(prefabRoot, InteractionMode.UserAction);

            return new { success = true, revertedObject = prefabRoot.name };
            #else
            throw new Exception("Prefab.Revert is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Create a prefab variant
        /// </summary>
        private object HandleVariant(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<VariantParams>(request, "sourcePath and variantPath");

            // Load source prefab
            var sourcePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(param.sourcePath);
            if (sourcePrefab == null)
            {
                throw new Exception($"Source prefab not found: {param.sourcePath}");
            }

            // Ensure path ends with .prefab
            string variantPath = param.variantPath;
            if (!variantPath.EndsWith(".prefab"))
            {
                variantPath += ".prefab";
            }

            // Create directory if needed
            string directory = System.IO.Path.GetDirectoryName(variantPath);
            if (!string.IsNullOrEmpty(directory) && !AssetDatabase.IsValidFolder(directory))
            {
                CreateFolderRecursively(directory);
            }

            // Instantiate temporarily to create variant
            var tempInstance = (GameObject)PrefabUtility.InstantiatePrefab(sourcePrefab);

            // Create variant
            var variant = PrefabUtility.SaveAsPrefabAsset(tempInstance, variantPath);

            // Cleanup temp instance
            UnityEngine.Object.DestroyImmediate(tempInstance);

            if (variant == null)
            {
                throw new Exception($"Failed to create variant at: {variantPath}");
            }

            AssetDatabase.Refresh();

            return new VariantResult
            {
                success = true,
                sourcePath = param.sourcePath,
                variantPath = variantPath
            };
            #else
            throw new Exception("Prefab.Variant is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Get prefab instance overrides
        /// </summary>
        private object HandleGetOverrides(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetOverridesParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            if (!PrefabUtility.IsPartOfPrefabInstance(obj))
            {
                throw new Exception($"GameObject is not a prefab instance: {param.name}");
            }

            // Get prefab root
            var prefabRoot = PrefabUtility.GetOutermostPrefabInstanceRoot(obj);
            if (prefabRoot == null)
            {
                prefabRoot = obj;
            }

            // Get all overrides
            var objectOverrides = PrefabUtility.GetObjectOverrides(prefabRoot);
            var addedComponents = PrefabUtility.GetAddedComponents(prefabRoot);
            var removedComponents = PrefabUtility.GetRemovedComponents(prefabRoot);
            var addedGameObjects = PrefabUtility.GetAddedGameObjects(prefabRoot);

            var overrideList = new List<OverrideInfo>();

            foreach (var ov in objectOverrides)
            {
                overrideList.Add(new OverrideInfo
                {
                    type = "PropertyOverride",
                    targetName = ov.instanceObject?.name ?? "Unknown",
                    targetType = ov.instanceObject?.GetType().Name ?? "Unknown"
                });
            }

            foreach (var ac in addedComponents)
            {
                overrideList.Add(new OverrideInfo
                {
                    type = "AddedComponent",
                    targetName = ac.instanceComponent?.name ?? "Unknown",
                    targetType = ac.instanceComponent?.GetType().Name ?? "Unknown"
                });
            }

            foreach (var rc in removedComponents)
            {
                overrideList.Add(new OverrideInfo
                {
                    type = "RemovedComponent",
                    targetName = rc.assetComponent?.name ?? "Unknown",
                    targetType = rc.assetComponent?.GetType().Name ?? "Unknown"
                });
            }

            foreach (var ag in addedGameObjects)
            {
                overrideList.Add(new OverrideInfo
                {
                    type = "AddedGameObject",
                    targetName = ag.instanceGameObject?.name ?? "Unknown",
                    targetType = "GameObject"
                });
            }

            return new GetOverridesResult
            {
                instanceName = prefabRoot.name,
                hasOverrides = overrideList.Count > 0,
                overrideCount = overrideList.Count,
                overrides = overrideList
            };
            #else
            throw new Exception("Prefab.GetOverrides is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Get source prefab path of an instance
        /// </summary>
        private object HandleGetSource(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetSourceParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            if (!PrefabUtility.IsPartOfPrefabInstance(obj))
            {
                return new GetSourceResult
                {
                    instanceName = obj.name,
                    isPrefabInstance = false,
                    prefabPath = null,
                    prefabType = "None"
                };
            }

            string prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(obj);
            var prefabType = PrefabUtility.GetPrefabAssetType(obj);
            var prefabStatus = PrefabUtility.GetPrefabInstanceStatus(obj);

            return new GetSourceResult
            {
                instanceName = obj.name,
                isPrefabInstance = true,
                prefabPath = prefabPath,
                prefabType = prefabType.ToString(),
                prefabStatus = prefabStatus.ToString()
            };
            #else
            throw new Exception("Prefab.GetSource is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Check if a GameObject is a prefab instance
        /// </summary>
        private object HandleIsInstance(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<IsInstanceParams>(request, "name");

            var obj = FindGameObject(param.name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.name}");
            }

            bool isPrefabInstance = PrefabUtility.IsPartOfPrefabInstance(obj);
            bool isPrefabAsset = PrefabUtility.IsPartOfPrefabAsset(obj);
            bool isOutermostRoot = PrefabUtility.IsOutermostPrefabInstanceRoot(obj);
            var prefabType = PrefabUtility.GetPrefabAssetType(obj);

            return new IsInstanceResult
            {
                name = obj.name,
                isPrefabInstance = isPrefabInstance,
                isPrefabAsset = isPrefabAsset,
                isOutermostRoot = isOutermostRoot,
                prefabType = prefabType.ToString()
            };
            #else
            throw new Exception("Prefab.IsInstance is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Open a prefab in prefab editing mode
        /// </summary>
        private object HandleOpen(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<OpenParams>(request, "path");

            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(param.path);
            if (prefab == null)
            {
                throw new Exception($"Prefab not found: {param.path}");
            }

            // Open prefab stage
            AssetDatabase.OpenAsset(prefab);

            var stage = PrefabStageUtility.GetCurrentPrefabStage();
            if (stage == null)
            {
                throw new Exception($"Failed to open prefab: {param.path}");
            }

            return new OpenResult
            {
                success = true,
                prefabPath = param.path,
                prefabName = prefab.name,
                stageRoot = stage.prefabContentsRoot?.name
            };
            #else
            throw new Exception("Prefab.Open is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// Close prefab editing mode and return to scene
        /// </summary>
        private object HandleClose(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var stage = PrefabStageUtility.GetCurrentPrefabStage();
            if (stage == null)
            {
                return new { success = true, message = "No prefab stage is currently open" };
            }

            string prefabPath = stage.assetPath;

            // Close prefab stage by returning to main stage
            StageUtility.GoToMainStage();

            return new { success = true, closedPrefab = prefabPath };
            #else
            throw new Exception("Prefab.Close is only available in Editor mode");
            #endif
        }

        /// <summary>
        /// List all prefabs in a folder
        /// </summary>
        private object HandleList(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<ListParams>(request, "");

            string searchPath = string.IsNullOrEmpty(param.path) ? "Assets" : param.path;

            // Find all prefab GUIDs
            string[] guids = AssetDatabase.FindAssets("t:Prefab", new[] { searchPath });

            var prefabs = new List<PrefabInfo>();
            foreach (var guid in guids)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);

                if (prefab != null)
                {
                    var prefabType = PrefabUtility.GetPrefabAssetType(prefab);

                    prefabs.Add(new PrefabInfo
                    {
                        name = prefab.name,
                        path = assetPath,
                        type = prefabType.ToString(),
                        isVariant = prefabType == PrefabAssetType.Variant
                    });
                }
            }

            return new ListResult
            {
                count = prefabs.Count,
                searchPath = searchPath,
                prefabs = prefabs
            };
            #else
            throw new Exception("Prefab.List is only available in Editor mode");
            #endif
        }

        #region Helper Methods

        private void CreateFolderRecursively(string path)
        {
            #if UNITY_EDITOR
            if (AssetDatabase.IsValidFolder(path))
                return;

            string parent = System.IO.Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(parent) && !AssetDatabase.IsValidFolder(parent))
            {
                CreateFolderRecursively(parent);
            }

            string folderName = System.IO.Path.GetFileName(path);
            AssetDatabase.CreateFolder(parent, folderName);
            #endif
        }

        #endregion

        #region Parameter Classes

        [Serializable]
        private class InstantiateParams
        {
            public string path;
            public string name;
            public string position;
            public string rotation;
            public string parent;
        }

        [Serializable]
        private class CreateParams
        {
            public string name;
            public string path;
            public bool overwrite;
        }

        [Serializable]
        private class UnpackParams
        {
            public string name;
            public bool completely;
        }

        [Serializable]
        private class ApplyParams
        {
            public string name;
        }

        [Serializable]
        private class RevertParams
        {
            public string name;
        }

        [Serializable]
        private class VariantParams
        {
            public string sourcePath;
            public string variantPath;
        }

        [Serializable]
        private class GetOverridesParams
        {
            public string name;
        }

        [Serializable]
        private class GetSourceParams
        {
            public string name;
        }

        [Serializable]
        private class IsInstanceParams
        {
            public string name;
        }

        [Serializable]
        private class OpenParams
        {
            public string path;
        }

        [Serializable]
        private class ListParams
        {
            public string path;
        }

        #endregion

        #region Response Classes

        [Serializable]
        public class Vector3Info
        {
            public float x;
            public float y;
            public float z;

            public Vector3Info(Vector3 v)
            {
                x = v.x;
                y = v.y;
                z = v.z;
            }
        }

        [Serializable]
        public class InstantiateResult
        {
            public bool success;
            public string instanceName;
            public string prefabPath;
            public Vector3Info position;
        }

        [Serializable]
        public class CreateResult
        {
            public bool success;
            public string prefabPath;
            public string sourceName;
            public bool isConnected;
        }

        [Serializable]
        public class ApplyResult
        {
            public bool success;
            public string instanceName;
            public string prefabPath;
        }

        [Serializable]
        public class VariantResult
        {
            public bool success;
            public string sourcePath;
            public string variantPath;
        }

        [Serializable]
        public class OverrideInfo
        {
            public string type;
            public string targetName;
            public string targetType;
        }

        [Serializable]
        public class GetOverridesResult
        {
            public string instanceName;
            public bool hasOverrides;
            public int overrideCount;
            public List<OverrideInfo> overrides;
        }

        [Serializable]
        public class GetSourceResult
        {
            public string instanceName;
            public bool isPrefabInstance;
            public string prefabPath;
            public string prefabType;
            public string prefabStatus;
        }

        [Serializable]
        public class IsInstanceResult
        {
            public string name;
            public bool isPrefabInstance;
            public bool isPrefabAsset;
            public bool isOutermostRoot;
            public string prefabType;
        }

        [Serializable]
        public class OpenResult
        {
            public bool success;
            public string prefabPath;
            public string prefabName;
            public string stageRoot;
        }

        [Serializable]
        public class PrefabInfo
        {
            public string name;
            public string path;
            public string type;
            public bool isVariant;
        }

        [Serializable]
        public class ListResult
        {
            public int count;
            public string searchPath;
            public List<PrefabInfo> prefabs;
        }

        #endregion
    }
}
