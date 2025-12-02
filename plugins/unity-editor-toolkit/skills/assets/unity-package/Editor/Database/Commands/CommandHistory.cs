using System;
using System.Collections.Generic;
using System.Linq;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// Command History 관리자
    /// Undo/Redo 스택 관리 및 세션 간 영속성
    /// </summary>
    public class CommandHistory
    {
        #region Fields
        private readonly Stack<ICommand> undoStack;
        private readonly Stack<ICommand> redoStack;
        private readonly DatabaseManager databaseManager;

        private const int MaxHistorySize = 100; // 최대 100개 명령 기록
        #endregion

        #region Properties
        /// <summary>
        /// Undo 가능한 명령 개수
        /// </summary>
        public int UndoCount => undoStack.Count;

        /// <summary>
        /// Redo 가능한 명령 개수
        /// </summary>
        public int RedoCount => redoStack.Count;

        /// <summary>
        /// Undo 가능 여부
        /// </summary>
        public bool CanUndo => undoStack.Count > 0;

        /// <summary>
        /// Redo 가능 여부
        /// </summary>
        public bool CanRedo => redoStack.Count > 0;
        #endregion

        #region Events
        /// <summary>
        /// History 변경 이벤트 (UI 업데이트용)
        /// </summary>
        public event Action OnHistoryChanged;
        #endregion

        #region Constructor
        public CommandHistory(DatabaseManager databaseManager)
        {
            this.databaseManager = databaseManager ?? throw new ArgumentNullException(nameof(databaseManager));
            undoStack = new Stack<ICommand>();
            redoStack = new Stack<ICommand>();

            ToolkitLogger.LogDebug("CommandHistory", "생성 완료.");
        }
        #endregion

        #region Execute Command
        /// <summary>
        /// 명령 실행 및 히스토리 추가
        /// </summary>
        public async UniTask<bool> ExecuteCommandAsync(ICommand command)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }

            // 명령 실행
            bool success = await command.ExecuteAsync();

            if (success)
            {
                // Undo 스택에 추가
                undoStack.Push(command);

                // Redo 스택 초기화 (새로운 명령이 실행되면 Redo 불가)
                redoStack.Clear();

                // 히스토리 크기 제한
                TrimHistory();

                // 데이터베이스에 저장 (선택적)
                if (command.CanPersist && databaseManager.IsConnected)
                {
                    await PersistCommandAsync(command);
                }

                // 이벤트 발생
                OnHistoryChanged?.Invoke();

                ToolkitLogger.LogDebug("CommandHistory", $" 명령 실행 및 추가: {command.CommandName} (Undo: {UndoCount}, Redo: {RedoCount})");
            }

            return success;
        }

        /// <summary>
        /// 이미 실행된 명령을 히스토리에 기록 (실행 없이 기록만)
        /// </summary>
        public async UniTask RecordCommandAsync(ICommand command)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }

            // Undo 스택에 추가 (이미 실행됨)
            undoStack.Push(command);

            // Redo 스택 초기화 (새로운 명령이 기록되면 Redo 불가)
            redoStack.Clear();

            // 히스토리 크기 제한
            TrimHistory();

            // 데이터베이스에 저장 (선택적)
            if (command.CanPersist && databaseManager.IsConnected)
            {
                await PersistCommandAsync(command);
            }

            // 이벤트 발생
            OnHistoryChanged?.Invoke();

            ToolkitLogger.LogDebug("CommandHistory", $" 명령 기록: {command.CommandName} (Undo: {UndoCount}, Redo: {RedoCount})");
        }
        #endregion

        #region Undo/Redo
        /// <summary>
        /// Undo 실행
        /// </summary>
        public async UniTask<bool> UndoAsync()
        {
            if (!CanUndo)
            {
                ToolkitLogger.LogWarning("CommandHistory", "Undo 불가능 - 스택이 비어있습니다.");
                return false;
            }

            var command = undoStack.Pop();
            bool success = await command.UndoAsync();

            if (success)
            {
                // Redo 스택에 추가
                redoStack.Push(command);

                // 이벤트 발생
                OnHistoryChanged?.Invoke();

                ToolkitLogger.LogDebug("CommandHistory", $" Undo 완료: {command.CommandName} (Undo: {UndoCount}, Redo: {RedoCount})");
            }
            else
            {
                // 실패 시 다시 Undo 스택에 추가
                undoStack.Push(command);
                ToolkitLogger.LogError("CommandHistory", $" Undo 실패: {command.CommandName}");
            }

            return success;
        }

        /// <summary>
        /// Undo 실행 (동기 - WebSocket 핸들러용)
        /// </summary>
        /// <remarks>
        /// WebSocket 핸들러에서 결과를 반환받기 위한 동기 메서드입니다.
        /// 내부적으로 UndoAsync()를 동기 호출합니다.
        /// </remarks>
        public bool Undo()
        {
            return UndoAsync().GetAwaiter().GetResult();
        }

        /// <summary>
        /// Redo 실행
        /// </summary>
        public async UniTask<bool> RedoAsync()
        {
            if (!CanRedo)
            {
                ToolkitLogger.LogWarning("CommandHistory", "Redo 불가능 - 스택이 비어있습니다.");
                return false;
            }

            var command = redoStack.Pop();
            bool success = await command.RedoAsync();

            if (success)
            {
                // Undo 스택에 추가
                undoStack.Push(command);

                // 이벤트 발생
                OnHistoryChanged?.Invoke();

                ToolkitLogger.LogDebug("CommandHistory", $" Redo 완료: {command.CommandName} (Undo: {UndoCount}, Redo: {RedoCount})");
            }
            else
            {
                // 실패 시 다시 Redo 스택에 추가
                redoStack.Push(command);
                ToolkitLogger.LogError("CommandHistory", $" Redo 실패: {command.CommandName}");
            }

            return success;
        }

        /// <summary>
        /// Redo 실행 (동기 - WebSocket 핸들러용)
        /// </summary>
        /// <remarks>
        /// WebSocket 핸들러에서 결과를 반환받기 위한 동기 메서드입니다.
        /// 내부적으로 RedoAsync()를 동기 호출합니다.
        /// </remarks>
        public bool Redo()
        {
            return RedoAsync().GetAwaiter().GetResult();
        }

        /// <summary>
        /// 다음 Undo할 명령 확인 (스택에서 제거 안함)
        /// </summary>
        public ICommand PeekUndo()
        {
            return CanUndo ? undoStack.Peek() : null;
        }

        /// <summary>
        /// 다음 Redo할 명령 확인 (스택에서 제거 안함)
        /// </summary>
        public ICommand PeekRedo()
        {
            return CanRedo ? redoStack.Peek() : null;
        }

        /// <summary>
        /// Undo 스택 목록 가져오기
        /// </summary>
        public List<ICommand> GetUndoStack(int limit = 10)
        {
            var result = new List<ICommand>();
            var temp = new Stack<ICommand>();

            int count = 0;
            while (undoStack.Count > 0 && count < limit)
            {
                var cmd = undoStack.Pop();
                temp.Push(cmd);
                result.Add(cmd);
                count++;
            }

            // 복원
            while (temp.Count > 0)
            {
                undoStack.Push(temp.Pop());
            }

            return result;
        }

        /// <summary>
        /// Redo 스택 목록 가져오기
        /// </summary>
        public List<ICommand> GetRedoStack(int limit = 10)
        {
            var result = new List<ICommand>();
            var temp = new Stack<ICommand>();

            int count = 0;
            while (redoStack.Count > 0 && count < limit)
            {
                var cmd = redoStack.Pop();
                temp.Push(cmd);
                result.Add(cmd);
                count++;
            }

            // 복원
            while (temp.Count > 0)
            {
                redoStack.Push(temp.Pop());
            }

            return result;
        }
        #endregion

        #region History Management
        /// <summary>
        /// 전체 히스토리 초기화 (메모리 + DB)
        /// </summary>
        public void Clear()
        {
            // 메모리 스택 초기화
            undoStack.Clear();
            redoStack.Clear();

            // DB의 command_history 테이블도 삭제
            ClearDatabaseHistory();

            OnHistoryChanged?.Invoke();

            ToolkitLogger.LogDebug("CommandHistory", "히스토리 초기화 완료 (메모리 + DB).");
        }

        /// <summary>
        /// 데이터베이스의 command_history 테이블 삭제
        /// </summary>
        private void ClearDatabaseHistory()
        {
            try
            {
                if (!databaseManager.IsConnected || databaseManager.Connector == null)
                {
                    ToolkitLogger.LogDebug("CommandHistory", "DB 연결 없음 - DB 히스토리 삭제 건너뜀");
                    return;
                }

                var connection = databaseManager.Connector.Connection;
                int deleted = connection.Execute("DELETE FROM command_history");
                ToolkitLogger.Log("CommandHistory", $"DB 히스토리 삭제 완료: {deleted}개 레코드 삭제됨");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CommandHistory", $"DB 히스토리 삭제 실패: {ex.Message}");
            }
        }

        /// <summary>
        /// 히스토리 크기 제한
        /// </summary>
        private void TrimHistory()
        {
            if (undoStack.Count > MaxHistorySize)
            {
                // 성능 개선: 리스트로 변환 후 트림하고 스택 재구성
                var list = undoStack.ToList();
                list.RemoveRange(0, list.Count - MaxHistorySize);

                undoStack.Clear();
                for (int i = list.Count - 1; i >= 0; i--)
                {
                    undoStack.Push(list[i]);
                }

                ToolkitLogger.LogDebug("CommandHistory", $" 히스토리 크기 제한 적용: {undoStack.Count}개 유지");
            }
        }

        /// <summary>
        /// 최근 명령 목록 가져오기 (UI 표시용)
        /// </summary>
        public List<string> GetRecentCommands(int count = 10)
        {
            var commands = new List<string>();
            var temp = new Stack<ICommand>();

            // Undo 스택에서 가져오기
            int retrievedCount = 0;
            while (undoStack.Count > 0 && retrievedCount < count)
            {
                var cmd = undoStack.Pop();
                temp.Push(cmd);
                commands.Add($"{cmd.ExecutedAt:HH:mm:ss} - {cmd.CommandName}");
                retrievedCount++;
            }

            // 복원
            while (temp.Count > 0)
            {
                undoStack.Push(temp.Pop());
            }

            return commands;
        }
        #endregion

        #region Database Persistence
        /// <summary>
        /// 명령을 데이터베이스에 저장
        /// </summary>
        private async UniTask PersistCommandAsync(ICommand command)
        {
            try
            {
                if (!databaseManager.IsConnected || databaseManager.Connector == null)
                {
                    return;
                }

                // JSON 직렬화
                string json = command.Serialize();

                // SQL INSERT (SQLite 문법)
                string sql = @"
                    INSERT INTO command_history (
                        command_id, command_name, command_type,
                        command_data, executed_at, executed_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?);";

                await UniTask.RunOnThreadPool(() =>
                {
                    var connection = databaseManager.Connector.Connection;
                    connection.Execute(sql,
                        command.CommandId,
                        command.CommandName,
                        command.GetType().Name,
                        json,
                        command.ExecutedAt.ToString("o"), // ISO 8601 format
                        "EditorUI" // 실행 주체 구분
                    );
                });

                ToolkitLogger.LogDebug("CommandHistory", $" 명령 저장 완료: {command.CommandName}");
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CommandHistory", $" 명령 저장 실패: {ex.Message}");
            }
        }

        /// <summary>
        /// 데이터베이스에서 히스토리 로드 (세션 복원)
        /// </summary>
        public async UniTask<int> LoadHistoryFromDatabaseAsync(DateTime since)
        {
            try
            {
                if (!databaseManager.IsConnected || databaseManager.Connector == null)
                {
                    ToolkitLogger.LogWarning("CommandHistory", "데이터베이스 연결되지 않음 - 히스토리 로드 불가.");
                    return 0;
                }

                // SQL SELECT (SQLite 문법)
                string sql = @"
                    SELECT command_id, command_name, command_type, command_data, executed_at
                    FROM command_history
                    WHERE executed_at >= ?
                    ORDER BY executed_at ASC
                    LIMIT 100";

                int loadedCount = 0;

                // DB 쿼리는 백그라운드 스레드에서 실행
                List<CommandHistoryRecord> records = null;
                await UniTask.RunOnThreadPool(() =>
                {
                    var connection = databaseManager.Connector.Connection;
                    records = connection.Query<CommandHistoryRecord>(sql, since.ToString("o")).ToList();
                });

                // Command 복원은 메인 스레드에서 실행 (Unity API 호출 가능)
                await UniTask.SwitchToMainThread();

                foreach (var record in records)
                {
                    // CommandFactory를 사용하여 Command 복원
                    var command = CommandFactory.CreateFromDatabase(record.command_type, record.command_data);

                    if (command != null)
                    {
                        // Undo 스택에 추가 (실행 완료된 명령)
                        undoStack.Push(command);
                        loadedCount++;

                        ToolkitLogger.LogDebug("CommandHistory", $" Command 복원: {command.CommandName} (Type: {record.command_type})");
                    }
                    else
                    {
                        ToolkitLogger.LogWarning("CommandHistory", $" Command 복원 실패 - Type: {record.command_type}, ID: {record.command_id}");
                    }
                }

                ToolkitLogger.LogDebug("CommandHistory", $" 히스토리 로드 완료: {loadedCount}개");
                return loadedCount;
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CommandHistory", $" 히스토리 로드 실패: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// Command History 레코드 (SQLite 쿼리 결과용)
        /// </summary>
        private class CommandHistoryRecord
        {
            public string command_id { get; set; }
            public string command_name { get; set; }
            public string command_type { get; set; }
            public string command_data { get; set; }
            public string executed_at { get; set; }
        }
        #endregion

        #region Status
        /// <summary>
        /// 히스토리 상태 정보
        /// </summary>
        public HistoryStatus GetStatus()
        {
            return new HistoryStatus
            {
                UndoCount = UndoCount,
                RedoCount = RedoCount,
                CanUndo = CanUndo,
                CanRedo = CanRedo,
                MaxHistorySize = MaxHistorySize
            };
        }
        #endregion
    }

    #region Status Struct
    public struct HistoryStatus
    {
        public int UndoCount;
        public int RedoCount;
        public bool CanUndo;
        public bool CanRedo;
        public int MaxHistorySize;

        public override string ToString()
        {
            return $"[HistoryStatus] Undo: {UndoCount}, Redo: {RedoCount}, Max: {MaxHistorySize}";
        }
    }
    #endregion
}
