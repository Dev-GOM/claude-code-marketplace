using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// GameObject 생성 명령
    /// </summary>
    public class CreateGameObjectCommand : CommandBase
    {
        #region Fields
        private readonly string gameObjectName;
        private readonly Vector3 position;
        private readonly Quaternion rotation;
        private readonly int parentInstanceId;
        private int createdInstanceId;
        #endregion

        #region Constructor
        public CreateGameObjectCommand(
            string gameObjectName,
            Vector3 position = default,
            Quaternion rotation = default,
            GameObject parent = null)
            : base($"Create GameObject: {gameObjectName}")
        {
            this.gameObjectName = gameObjectName;
            this.position = position;
            this.rotation = rotation != default ? rotation : Quaternion.identity;
            parentInstanceId = parent != null ? parent.GetInstanceID() : 0;
            createdInstanceId = 0;
        }

        /// <summary>
        /// 이미 생성된 GameObject로부터 Command 생성 (중복 생성 방지)
        /// </summary>
        public static CreateGameObjectCommand CreateFromExisting(GameObject existingObject, GameObject parent = null)
        {
            if (existingObject == null)
                throw new ArgumentNullException(nameof(existingObject));

            var command = new CreateGameObjectCommand(
                existingObject.name,
                existingObject.transform.position,
                existingObject.transform.rotation,
                parent
            );

            // 이미 생성된 객체의 InstanceID 저장
            command.createdInstanceId = existingObject.GetInstanceID();

            return command;
        }
        #endregion

        #region Command Implementation
        protected override async UniTask<bool> OnExecuteAsync()
        {
            try
            {
                // GameObject 생성
                var go = new GameObject(gameObjectName);
                go.transform.position = position;
                go.transform.rotation = rotation;

                // 부모 설정
                if (parentInstanceId != 0)
                {
                    var parent = UnityEditor.EditorUtility.InstanceIDToObject(parentInstanceId) as GameObject;
                    if (parent != null)
                    {
                        go.transform.SetParent(parent.transform, true);
                    }
                }

                // 생성된 GameObject ID 저장
                createdInstanceId = go.GetInstanceID();

                ToolkitLogger.LogDebug("CreateGameObjectCommand", $" GameObject 생성: {gameObjectName} (ID: {createdInstanceId})");

                await UniTask.Yield();
                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CreateGameObjectCommand", $" 생성 실패: {ex.Message}");
                return false;
            }
        }

        protected override async UniTask<bool> OnUndoAsync()
        {
            try
            {
                // 생성된 GameObject 삭제
                var go = UnityEditor.EditorUtility.InstanceIDToObject(createdInstanceId) as GameObject;
                if (go != null)
                {
                    UnityEngine.Object.DestroyImmediate(go);
                    ToolkitLogger.LogDebug("CreateGameObjectCommand", $" GameObject 삭제 (Undo): {gameObjectName}");
                }
                else
                {
                    ToolkitLogger.LogWarning("CreateGameObjectCommand", $" GameObject를 찾을 수 없음: {gameObjectName}");
                }

                await UniTask.Yield();
                return true;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CreateGameObjectCommand", $" Undo 실패: {ex.Message}");
                return false;
            }
        }

        protected override async UniTask<bool> OnRedoAsync()
        {
            // Redo는 Execute와 동일
            return await OnExecuteAsync();
        }
        #endregion

        #region Serialization
        public override string Serialize()
        {
            return JsonUtility.ToJson(new CreateGameObjectData
            {
                commandId = CommandId,
                commandName = CommandName,
                executedAt = ExecutedAt.ToString("o"),
                gameObjectName = gameObjectName,
                position = position,
                rotation = rotation,
                parentInstanceId = parentInstanceId,
                createdInstanceId = createdInstanceId
            });
        }

        /// <summary>
        /// JSON에서 Command 복원 (세션 영속성용)
        /// </summary>
        public static CreateGameObjectCommand FromJson(string json)
        {
            var data = JsonUtility.FromJson<CreateGameObjectData>(json);

            // 부모 GameObject 찾기
            GameObject parent = null;
            if (data.parentInstanceId != 0)
            {
                parent = UnityEditor.EditorUtility.InstanceIDToObject(data.parentInstanceId) as GameObject;
            }

            // 새 인스턴스 생성
            var command = new CreateGameObjectCommand(
                data.gameObjectName,
                data.position,
                data.rotation,
                parent
            );

            // 메타데이터 복원
            command.CommandId = data.commandId;
            command.CommandName = data.commandName;
            command.ExecutedAt = DateTime.Parse(data.executedAt);
            command.createdInstanceId = data.createdInstanceId;

            return command;
        }

        [Serializable]
        private class CreateGameObjectData
        {
            public string commandId;
            public string commandName;
            public string executedAt;
            public string gameObjectName;
            public Vector3 position;
            public Quaternion rotation;
            public int parentInstanceId;
            public int createdInstanceId;
        }
        #endregion
    }
}
