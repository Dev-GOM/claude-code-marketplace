using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityEditorToolkit.Utils
{
    /// <summary>
    /// Unity 메인 스레드에서 작업을 실행하기 위한 Dispatcher
    /// WebSocket 등 다른 스레드에서 Unity API를 호출할 때 사용
    /// </summary>
    public class UnityMainThreadDispatcher : MonoBehaviour
    {
        private static UnityMainThreadDispatcher instance;
        private static readonly Queue<Action> executionQueue = new Queue<Action>();
        private static readonly object @lock = new object();

        /// <summary>
        /// Singleton 인스턴스 가져오기
        /// </summary>
        public static UnityMainThreadDispatcher Instance()
        {
            if (instance == null)
            {
                // 메인 스레드에서만 GameObject 생성 가능
                if (UnityEngine.Object.FindObjectOfType<UnityMainThreadDispatcher>() == null)
                {
                    var go = new GameObject("UnityMainThreadDispatcher");
                    instance = go.AddComponent<UnityMainThreadDispatcher>();
                    DontDestroyOnLoad(go);
                }
                else
                {
                    instance = UnityEngine.Object.FindObjectOfType<UnityMainThreadDispatcher>();
                }
            }
            return instance;
        }

        private void Awake()
        {
            if (instance == null)
            {
                instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else if (instance != this)
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// 메인 스레드에서 실행할 작업 등록
        /// </summary>
        /// <param name="action">실행할 작업</param>
        public void Enqueue(Action action)
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
        /// <param name="callback">완료 후 콜백</param>
        public void Enqueue(Action action, Action<Exception> callback)
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

        private void Update()
        {
            // 메인 스레드에서 큐에 있는 작업 실행
            lock (@lock)
            {
                while (executionQueue.Count > 0)
                {
                    var action = executionQueue.Dequeue();
                    try
                    {
                        action.Invoke();
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"[UnityMainThreadDispatcher] Error executing action: {ex.Message}\n{ex.StackTrace}");
                    }
                }
            }
        }

        private void OnDestroy()
        {
            if (instance == this)
            {
                instance = null;
            }
        }

        /// <summary>
        /// 큐에 있는 작업 개수
        /// </summary>
        public int QueueCount
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
        public void ClearQueue()
        {
            lock (@lock)
            {
                executionQueue.Clear();
            }
        }
    }
}
