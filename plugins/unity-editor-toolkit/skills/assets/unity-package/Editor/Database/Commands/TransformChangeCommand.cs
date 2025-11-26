using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// GameObject Transform 변경 명령
    /// Position, Rotation, Scale 변경을 추적하고 Undo/Redo 지원
    /// </summary>
    public class TransformChangeCommand : CommandBase
    {
        #region Fields
        private readonly int gameObjectInstanceId;
        private readonly Vector3 oldPosition;
        private readonly Quaternion oldRotation;
        private readonly Vector3 oldScale;
        private readonly Vector3 newPosition;
        private readonly Quaternion newRotation;
        private readonly Vector3 newScale;
        private readonly string gameObjectName;
        #endregion

        #region Constructor
        public TransformChangeCommand(
            GameObject gameObject,
            Vector3 oldPosition, Quaternion oldRotation, Vector3 oldScale,
            Vector3 newPosition, Quaternion newRotation, Vector3 newScale)
            : base($"Transform Change: {gameObject.name}")
        {
            gameObjectInstanceId = gameObject.GetInstanceID();
            gameObjectName = gameObject.name;

            this.oldPosition = oldPosition;
            this.oldRotation = oldRotation;
            this.oldScale = oldScale;

            this.newPosition = newPosition;
            this.newRotation = newRotation;
            this.newScale = newScale;
        }
        #endregion

        #region Command Implementation
        protected override async UniTask<bool> OnExecuteAsync()
        {
            var go = GetGameObject();
            if (go == null) return false;

            // 새로운 Transform 적용
            go.transform.position = newPosition;
            go.transform.rotation = newRotation;
            go.transform.localScale = newScale;

            await UniTask.Yield();
            return true;
        }

        protected override async UniTask<bool> OnUndoAsync()
        {
            var go = GetGameObject();
            if (go == null) return false;

            // 이전 Transform 복원
            go.transform.position = oldPosition;
            go.transform.rotation = oldRotation;
            go.transform.localScale = oldScale;

            await UniTask.Yield();
            return true;
        }

        protected override async UniTask<bool> OnRedoAsync()
        {
            // Redo는 Execute와 동일
            return await OnExecuteAsync();
        }
        #endregion

        #region Helper Methods
        private GameObject GetGameObject()
        {
            var go = UnityEditor.EditorUtility.InstanceIDToObject(gameObjectInstanceId) as GameObject;
            if (go == null)
            {
                ToolkitLogger.LogWarning("TransformChangeCommand", $"GameObject not found: {gameObjectName} (ID: {gameObjectInstanceId})");
            }
            return go;
        }
        #endregion

        #region Serialization
        public override string Serialize()
        {
            return JsonUtility.ToJson(new TransformChangeData
            {
                commandId = CommandId,
                commandName = CommandName,
                executedAt = ExecutedAt.ToString("o"),
                gameObjectInstanceId = gameObjectInstanceId,
                gameObjectName = gameObjectName,
                oldPosition = oldPosition,
                oldRotation = oldRotation,
                oldScale = oldScale,
                newPosition = newPosition,
                newRotation = newRotation,
                newScale = newScale
            });
        }

        /// <summary>
        /// JSON에서 Command 복원 (세션 영속성용)
        /// </summary>
        public static TransformChangeCommand FromJson(string json)
        {
            var data = JsonUtility.FromJson<TransformChangeData>(json);

            // GameObject 찾기
            var go = UnityEditor.EditorUtility.InstanceIDToObject(data.gameObjectInstanceId) as GameObject;
            if (go == null)
            {
                ToolkitLogger.LogWarning("TransformChangeCommand", $"GameObject not found (FromJson): {data.gameObjectName} (ID: {data.gameObjectInstanceId})");
                // GameObject가 없어도 Command는 생성 (히스토리 기록용)
                go = new GameObject(data.gameObjectName);
            }

            // 새 인스턴스 생성
            var command = new TransformChangeCommand(
                go,
                data.oldPosition, data.oldRotation, data.oldScale,
                data.newPosition, data.newRotation, data.newScale
            );

            // 메타데이터 복원
            command.CommandId = data.commandId;
            command.CommandName = data.commandName;
            command.ExecutedAt = DateTime.Parse(data.executedAt);

            return command;
        }

        [Serializable]
        private class TransformChangeData
        {
            public string commandId;
            public string commandName;
            public string executedAt;
            public int gameObjectInstanceId;
            public string gameObjectName;
            public Vector3 oldPosition;
            public Quaternion oldRotation;
            public Vector3 oldScale;
            public Vector3 newPosition;
            public Quaternion newRotation;
            public Vector3 newScale;
        }
        #endregion
    }
}
