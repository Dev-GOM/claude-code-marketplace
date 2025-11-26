using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// GameObject 삭제 명령
    /// 삭제 전 상태를 저장하여 Undo 지원
    /// </summary>
    public class DeleteGameObjectCommand : CommandBase
    {
        #region Fields
        private readonly int gameObjectInstanceId;
        private readonly string gameObjectName;
        private readonly Vector3 position;
        private readonly Quaternion rotation;
        private readonly Vector3 scale;
        private readonly int parentInstanceId;
        private readonly int siblingIndex;
        private GameObject deletedGameObject; // Undo용 참조 보관
        #endregion

        #region Constructor
        public DeleteGameObjectCommand(GameObject gameObject)
            : base($"Delete GameObject: {gameObject.name}")
        {
            gameObjectInstanceId = gameObject.GetInstanceID();
            gameObjectName = gameObject.name;
            position = gameObject.transform.position;
            rotation = gameObject.transform.rotation;
            scale = gameObject.transform.localScale;
            parentInstanceId = gameObject.transform.parent != null
                ? gameObject.transform.parent.gameObject.GetInstanceID()
                : 0;
            siblingIndex = gameObject.transform.GetSiblingIndex();
        }
        #endregion

        #region Command Implementation
        protected override async UniTask<bool> OnExecuteAsync()
        {
            try
            {
                var go = UnityEditor.EditorUtility.InstanceIDToObject(gameObjectInstanceId) as GameObject;
                if (go == null)
                {
                    ToolkitLogger.LogWarning("DeleteGameObjectCommand", $" GameObject를 찾을 수 없음: {gameObjectName}");
                    return false;
                }

                // Undo를 위해 참조 보관 (비활성화)
                deletedGameObject = go;
                go.SetActive(false);
                go.hideFlags = HideFlags.HideInHierarchy;

                ToolkitLogger.LogDebug("DeleteGameObjectCommand", $" GameObject 삭제: {gameObjectName}");

                await UniTask.Yield();
                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DeleteGameObjectCommand", $" 삭제 실패: {ex.Message}");
                return false;
            }
        }

        protected override async UniTask<bool> OnUndoAsync()
        {
            try
            {
                if (deletedGameObject == null)
                {
                    ToolkitLogger.LogWarning("DeleteGameObjectCommand", $" 복원할 GameObject 참조가 없음: {gameObjectName}");
                    return false;
                }

                // GameObject 복원
                deletedGameObject.SetActive(true);
                deletedGameObject.hideFlags = HideFlags.None;

                // 부모 및 위치 복원
                if (parentInstanceId != 0)
                {
                    var parent = UnityEditor.EditorUtility.InstanceIDToObject(parentInstanceId) as GameObject;
                    if (parent != null)
                    {
                        deletedGameObject.transform.SetParent(parent.transform, false);
                        deletedGameObject.transform.SetSiblingIndex(siblingIndex);
                    }
                }

                deletedGameObject.transform.position = position;
                deletedGameObject.transform.rotation = rotation;
                deletedGameObject.transform.localScale = scale;

                ToolkitLogger.LogDebug("DeleteGameObjectCommand", $" GameObject 복원 (Undo): {gameObjectName}");

                await UniTask.Yield();
                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("DeleteGameObjectCommand", $" Undo 실패: {ex.Message}");
                return false;
            }
        }

        protected override async UniTask<bool> OnRedoAsync()
        {
            // Redo는 Execute와 동일
            return await OnExecuteAsync();
        }
        #endregion

        #region Persistence Override
        public override bool CanPersist => false; // GameObject 참조를 포함하므로 DB 저장 불가
        #endregion

        #region Serialization
        public override string Serialize()
        {
            return JsonUtility.ToJson(new DeleteGameObjectData
            {
                commandId = CommandId,
                commandName = CommandName,
                executedAt = ExecutedAt.ToString("o"),
                gameObjectInstanceId = gameObjectInstanceId,
                gameObjectName = gameObjectName,
                position = position,
                rotation = rotation,
                scale = scale,
                parentInstanceId = parentInstanceId,
                siblingIndex = siblingIndex
            });
        }

        [Serializable]
        private class DeleteGameObjectData
        {
            public string commandId;
            public string commandName;
            public string executedAt;
            public int gameObjectInstanceId;
            public string gameObjectName;
            public Vector3 position;
            public Quaternion rotation;
            public Vector3 scale;
            public int parentInstanceId;
            public int siblingIndex;
        }
        #endregion
    }
}
