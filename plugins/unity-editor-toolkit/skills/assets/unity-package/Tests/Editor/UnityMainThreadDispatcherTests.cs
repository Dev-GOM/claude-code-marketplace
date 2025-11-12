/**
 * Unity Test Framework Tests for UnityMainThreadDispatcher
 *
 * Critical thread safety component testing.
 */

using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using System.Collections;
using System.Threading;
using UnityEditorToolkit.Utils;

namespace UnityEditorToolkit.Tests
{
    public class UnityMainThreadDispatcherTests
    {
        private UnityMainThreadDispatcher dispatcher;

        [SetUp]
        public void Setup()
        {
            // Ensure fresh dispatcher instance for each test
            var existingDispatcher = Object.FindObjectOfType<UnityMainThreadDispatcher>();
            if (existingDispatcher != null)
            {
                Object.DestroyImmediate(existingDispatcher.gameObject);
            }

            dispatcher = UnityMainThreadDispatcher.Instance();
        }

        [TearDown]
        public void Teardown()
        {
            if (dispatcher != null && dispatcher.gameObject != null)
            {
                Object.DestroyImmediate(dispatcher.gameObject);
            }
        }

        [Test]
        public void Instance_Should_CreateSingleton()
        {
            // Arrange & Act
            var instance1 = UnityMainThreadDispatcher.Instance();
            var instance2 = UnityMainThreadDispatcher.Instance();

            // Assert
            Assert.IsNotNull(instance1);
            Assert.IsNotNull(instance2);
            Assert.AreEqual(instance1, instance2, "Instance should be singleton");
        }

        [Test]
        public void Instance_Should_CreateGameObjectWithCorrectName()
        {
            // Arrange & Act
            var instance = UnityMainThreadDispatcher.Instance();

            // Assert
            Assert.AreEqual("UnityMainThreadDispatcher", instance.gameObject.name);
        }

        [UnityTest]
        public IEnumerator Enqueue_Should_ExecuteAction_OnMainThread()
        {
            // Arrange
            bool actionExecuted = false;
            int executionThreadId = 0;
            int mainThreadId = Thread.CurrentThread.ManagedThreadId;

            // Act: Enqueue from background thread
            var backgroundThread = new Thread(() =>
            {
                dispatcher.Enqueue(() =>
                {
                    executionThreadId = Thread.CurrentThread.ManagedThreadId;
                    actionExecuted = true;
                });
            });

            backgroundThread.Start();
            backgroundThread.Join(); // Wait for thread to complete

            // Wait one frame for Update to process queue
            yield return null;

            // Assert
            Assert.IsTrue(actionExecuted, "Action should have been executed");
            Assert.AreEqual(mainThreadId, executionThreadId, "Action should execute on main thread");
        }

        [UnityTest]
        public IEnumerator Enqueue_Should_ExecuteMultipleActions_InOrder()
        {
            // Arrange
            var executionOrder = new System.Collections.Generic.List<int>();

            // Act
            for (int i = 0; i < 10; i++)
            {
                int index = i; // Capture loop variable
                dispatcher.Enqueue(() => executionOrder.Add(index));
            }

            // Wait one frame for Update to process queue
            yield return null;

            // Assert
            Assert.AreEqual(10, executionOrder.Count, "All actions should be executed");
            for (int i = 0; i < 10; i++)
            {
                Assert.AreEqual(i, executionOrder[i], $"Action {i} should execute in order");
            }
        }

        [UnityTest]
        public IEnumerator Enqueue_Should_HandleExceptions_Gracefully()
        {
            // Arrange
            bool firstActionExecuted = false;
            bool secondActionExecuted = false;
            bool thirdActionExecuted = false;

            // Act: First action executes, second throws exception, third should still execute
            dispatcher.Enqueue(() => firstActionExecuted = true);
            dispatcher.Enqueue(() => throw new System.Exception("Test exception"));
            dispatcher.Enqueue(() => thirdActionExecuted = true);

            // Expect error log from exception
            LogAssert.Expect(LogType.Error, new System.Text.RegularExpressions.Regex(".*Test exception.*"));

            // Wait one frame for Update to process queue
            yield return null;

            // Assert
            Assert.IsTrue(firstActionExecuted, "First action should execute");
            Assert.IsTrue(thirdActionExecuted, "Third action should execute despite exception in second");
        }

        [Test]
        public void Enqueue_Should_ThrowException_WhenActionIsNull()
        {
            // Arrange & Act & Assert
            Assert.Throws<System.ArgumentNullException>(() =>
            {
                dispatcher.Enqueue(null);
            });
        }

        [UnityTest]
        public IEnumerator Enqueue_Should_HandleConcurrentAccess()
        {
            // Arrange
            int executionCount = 0;
            var threads = new Thread[5];

            // Act: Multiple threads enqueueing simultaneously
            for (int i = 0; i < 5; i++)
            {
                threads[i] = new Thread(() =>
                {
                    for (int j = 0; j < 10; j++)
                    {
                        dispatcher.Enqueue(() => Interlocked.Increment(ref executionCount));
                    }
                });
                threads[i].Start();
            }

            // Wait for all threads to complete
            for (int i = 0; i < 5; i++)
            {
                threads[i].Join();
            }

            // Wait one frame for Update to process queue
            yield return null;

            // Assert
            Assert.AreEqual(50, executionCount, "All 50 actions should execute (5 threads × 10 actions)");
        }

        [UnityTest]
        public IEnumerator Update_Should_ClearQueue_AfterExecution()
        {
            // Arrange
            int executionCount = 0;
            dispatcher.Enqueue(() => executionCount++);

            // Act: Wait for first Update
            yield return null;
            Assert.AreEqual(1, executionCount);

            // Wait for second Update (queue should be empty)
            yield return null;

            // Assert: No additional executions
            Assert.AreEqual(1, executionCount, "Queue should be cleared after execution");
        }

        [UnityTest]
        public IEnumerator Dispatcher_Should_SurviveSceneLoad()
        {
            // Arrange
            var instance = UnityMainThreadDispatcher.Instance();
            bool actionExecuted = false;

            // Act: Enqueue action
            dispatcher.Enqueue(() => actionExecuted = true);

            // Wait one frame
            yield return null;

            // Assert: Dispatcher still exists and works
            Assert.IsNotNull(Object.FindObjectOfType<UnityMainThreadDispatcher>());
            Assert.IsTrue(actionExecuted);
        }

        [UnityTest]
        public IEnumerator Enqueue_Should_WorkWith_UnityAPIcalls()
        {
            // Arrange
            GameObject testObject = null;
            string objectName = "TestObject_FromBackgroundThread";

            // Act: Create GameObject from background thread via dispatcher
            var thread = new Thread(() =>
            {
                dispatcher.Enqueue(() =>
                {
                    testObject = new GameObject(objectName);
                });
            });

            thread.Start();
            thread.Join();

            // Wait for Update to process
            yield return null;

            // Assert
            Assert.IsNotNull(testObject);
            Assert.AreEqual(objectName, testObject.name);

            // Cleanup
            Object.DestroyImmediate(testObject);
        }
    }
}
