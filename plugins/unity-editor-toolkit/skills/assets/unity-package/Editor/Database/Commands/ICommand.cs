using System;
using Cysharp.Threading.Tasks;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// Command Pattern 인터페이스
    /// 모든 실행 가능한 명령은 이 인터페이스를 구현해야 함
    /// </summary>
    public interface ICommand
    {
        /// <summary>
        /// 명령 고유 ID (데이터베이스 저장용)
        /// </summary>
        string CommandId { get; }

        /// <summary>
        /// 명령 이름 (UI 표시용)
        /// </summary>
        string CommandName { get; }

        /// <summary>
        /// 명령 실행 시간
        /// </summary>
        DateTime ExecutedAt { get; }

        /// <summary>
        /// 명령 실행
        /// </summary>
        UniTask<bool> ExecuteAsync();

        /// <summary>
        /// 명령 실행 취소 (Undo)
        /// </summary>
        UniTask<bool> UndoAsync();

        /// <summary>
        /// 명령 재실행 (Redo)
        /// </summary>
        UniTask<bool> RedoAsync();

        /// <summary>
        /// 명령을 데이터베이스에 저장할 수 있는지 여부
        /// </summary>
        bool CanPersist { get; }

        /// <summary>
        /// 명령을 JSON으로 직렬화
        /// </summary>
        string Serialize();

        /// <summary>
        /// JSON에서 명령 복원
        /// </summary>
        void Deserialize(string json);
    }
}
