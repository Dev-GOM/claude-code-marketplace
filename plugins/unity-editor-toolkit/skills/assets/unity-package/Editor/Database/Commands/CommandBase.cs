using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// Command Pattern 기본 추상 클래스
    /// 공통 기능 구현
    /// </summary>
    public abstract class CommandBase : ICommand
    {
        #region ICommand Properties
        public string CommandId { get; protected set; }
        public string CommandName { get; protected set; }
        public DateTime ExecutedAt { get; protected set; }
        public virtual bool CanPersist => true;
        #endregion

        #region Constructor
        protected CommandBase(string commandName)
        {
            CommandId = Guid.NewGuid().ToString();
            CommandName = commandName;
            ExecutedAt = DateTime.UtcNow;
        }
        #endregion

        #region Abstract Methods
        /// <summary>
        /// 실제 실행 로직 (파생 클래스에서 구현)
        /// </summary>
        protected abstract UniTask<bool> OnExecuteAsync();

        /// <summary>
        /// 실제 Undo 로직 (파생 클래스에서 구현)
        /// </summary>
        protected abstract UniTask<bool> OnUndoAsync();

        /// <summary>
        /// 실제 Redo 로직 (파생 클래스에서 구현)
        /// </summary>
        protected abstract UniTask<bool> OnRedoAsync();
        #endregion

        #region ICommand Implementation
        public async UniTask<bool> ExecuteAsync()
        {
            try
            {
                ToolkitLogger.LogDebug("Command", $" Executing: {CommandName}");
                ExecutedAt = DateTime.UtcNow;
                bool result = await OnExecuteAsync();

                if (result)
                {
                    ToolkitLogger.LogDebug("Command", $" Executed successfully: {CommandName}");
                }
                else
                {
                    ToolkitLogger.LogWarning("Command", $" Execution failed: {CommandName}");
                }

                return result;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("Command", $" Exception during execution: {CommandName}\n{ex.Message}");
                return false;
            }
        }

        public async UniTask<bool> UndoAsync()
        {
            try
            {
                ToolkitLogger.LogDebug("Command", $" Undoing: {CommandName}");
                bool result = await OnUndoAsync();

                if (result)
                {
                    ToolkitLogger.LogDebug("Command", $" Undo successful: {CommandName}");
                }
                else
                {
                    ToolkitLogger.LogWarning("Command", $" Undo failed: {CommandName}");
                }

                return result;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("Command", $" Exception during undo: {CommandName}\n{ex.Message}");
                return false;
            }
        }

        public async UniTask<bool> RedoAsync()
        {
            try
            {
                ToolkitLogger.LogDebug("Command", $" Redoing: {CommandName}");
                bool result = await OnRedoAsync();

                if (result)
                {
                    ToolkitLogger.LogDebug("Command", $" Redo successful: {CommandName}");
                }
                else
                {
                    ToolkitLogger.LogWarning("Command", $" Redo failed: {CommandName}");
                }

                return result;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("Command", $" Exception during redo: {CommandName}\n{ex.Message}");
                return false;
            }
        }
        #endregion

        #region Serialization
        public virtual string Serialize()
        {
            // 기본 직렬화 (파생 클래스에서 오버라이드 가능)
            return JsonUtility.ToJson(new CommandData
            {
                commandId = CommandId,
                commandName = CommandName,
                executedAt = ExecutedAt.ToString("o")
            });
        }

        public virtual void Deserialize(string json)
        {
            // 기본 역직렬화 (파생 클래스에서 오버라이드 가능)
            var data = JsonUtility.FromJson<CommandData>(json);
            CommandId = data.commandId;
            CommandName = data.commandName;
            ExecutedAt = DateTime.Parse(data.executedAt);
        }
        #endregion

        #region Serialization Data
        [Serializable]
        protected class CommandData
        {
            public string commandId;
            public string commandName;
            public string executedAt;
        }
        #endregion
    }
}
