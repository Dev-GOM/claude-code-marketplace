using System;
using System.Collections.Generic;
using UnityEditor;

namespace UnityEditorToolkit.Editor.Utils
{
    /// <summary>
    /// Editor 메인 스레드에서 작업을 실행하기 위한 Static Dispatcher
    /// MonoBehaviour를 사용하지 않아 Scene에 독립적으로 동작
    /// WebSocket 등 다른 스레드에서 Unity API를 호출할 때 사용
    /// </summary>
    public static class EditorMainThreadDispatcher
    {
        private static readonly Queue<Action> executionQueue = new Queue<Action>();
        private static readonly object @lock = new object();
        private static bool isInitialized = false;

        /// <summary>
        /// Editor 시작 시 자동 초기화
        /// </summary>
        [InitializeOnLoadMethod]
        private static void Initialize()
        {
            if (!isInitialized)
            {
                EditorApplication.update += ProcessQueue;
                isInitialized = true;
            }
        }

        /// <summary>
        /// 메인 스레드에서 실행할 작업 등록
        /// </summary>
        /// <param name="action">실행할 작업</param>
        public static void Enqueue(Action action)
        {
            if (action == null)
            {
                throw new ArgumentNullException(nameof(action));
            }

            lock (@lock)
            {
                executionQueue.Enqueue(action);
            }
        }

        /// <summary>
        /// 메인 스레드에서 실행할 작업 등록 (콜백 포함)
        /// </summary>
        /// <param name="action">실행할 작업</param>
        /// <param name="callback">완료 후 콜백 (예외 발생 시 예외 전달, 성공 시 null)</param>
        public static void Enqueue(Action action, Action<Exception> callback)
        {
            if (action == null)
            {
                throw new ArgumentNullException(nameof(action));
            }

            lock (@lock)
            {
                executionQueue.Enqueue(() =>
                {
                    try
                    {
                        action.Invoke();
                        callback?.Invoke(null);
                    }
                    catch (Exception ex)
                    {
                        callback?.Invoke(ex);
                    }
                });
            }
        }

        /// <summary>
        /// 큐에 있는 작업들을 메인 스레드에서 처리
        /// EditorApplication.update에서 자동 호출
        /// </summary>
        private static void ProcessQueue()
        {
            // 최대 처리 시간 제한 (프레임 드롭 방지)
            const int maxProcessTimeMs = 10;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            lock (@lock)
            {
                while (executionQueue.Count > 0 && stopwatch.ElapsedMilliseconds < maxProcessTimeMs)
                {
                    var action = executionQueue.Dequeue();
                    try
                    {
                        action.Invoke();
                    }
                    catch (Exception ex)
                    {
                        ToolkitLogger.LogError("EditorMainThreadDispatcher", $"Error executing action: {ex.Message}\n{ex.StackTrace}");
                    }
                }
            }
        }

        /// <summary>
        /// 큐에 있는 작업 개수
        /// </summary>
        public static int QueueCount
        {
            get
            {
                lock (@lock)
                {
                    return executionQueue.Count;
                }
            }
        }

        /// <summary>
        /// 큐 비우기
        /// </summary>
        public static void ClearQueue()
        {
            lock (@lock)
            {
                executionQueue.Clear();
            }
        }

        /// <summary>
        /// 초기화 여부
        /// </summary>
        public static bool IsInitialized => isInitialized;
    }
}
