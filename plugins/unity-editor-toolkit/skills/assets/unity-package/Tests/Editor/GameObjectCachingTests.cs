/**
 * Unity Test Framework Tests for GameObject Caching
 *
 * Performance optimization testing for BaseHandler's WeakReference caching.
 */

using NUnit.Framework;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using UnityEditorToolkit.Handlers;

namespace UnityEditorToolkit.Tests
{
    public class GameObjectCachingTests
    {
        private GameObject testGameObject;
        private GameObjectHandler handler;

        [SetUp]
        public void Setup()
        {
            handler = new GameObjectHandler();
            testGameObject = new GameObject("TestCacheObject");
        }

        [TearDown]
        public void Teardown()
        {
            // Clean up all test GameObjects
            var allTestObjects = Object.FindObjectsOfType<GameObject>()
                .Where(go => go.name.StartsWith("TestCache") || go.name.StartsWith("CacheTest"));

            foreach (var obj in allTestObjects)
            {
                Object.DestroyImmediate(obj);
            }

            testGameObject = null;
            handler = null;
        }

        [Test]
        public void FindGameObject_Should_FindExistingObject()
        {
            // Arrange
            var expectedName = "TestCacheObject";

            // Act
            var result = handler.FindGameObject(expectedName);

            // Assert
            Assert.IsNotNull(result, "Should find existing GameObject");
            Assert.AreEqual(expectedName, result.name);
        }

        [Test]
        public void FindGameObject_Should_ReturnNull_WhenNotFound()
        {
            // Arrange
            var nonExistentName = "NonExistent_GameObject_12345";

            // Act
            var result = handler.FindGameObject(nonExistentName);

            // Assert
            Assert.IsNull(result, "Should return null for non-existent GameObject");
        }

        [Test]
        public void FindGameObject_Should_UseCaching_OnSecondCall()
        {
            // Arrange
            var objectName = "TestCacheObject";

            // Act: First call (cache miss)
            var start1 = System.DateTime.Now;
            var result1 = handler.FindGameObject(objectName);
            var time1 = (System.DateTime.Now - start1).TotalMilliseconds;

            // Second call (cache hit)
            var start2 = System.DateTime.Now;
            var result2 = handler.FindGameObject(objectName);
            var time2 = (System.DateTime.Now - start2).TotalMilliseconds;

            // Assert
            Assert.AreEqual(result1, result2, "Should return same GameObject instance");
            Assert.Less(time2, time1 * 0.5, "Second call should be significantly faster (cache hit)");
        }

        [Test]
        public void FindGameObject_Should_HandleMultipleObjects()
        {
            // Arrange
            var objects = new List<GameObject>();
            for (int i = 0; i < 5; i++)
            {
                objects.Add(new GameObject($"CacheTest_{i}"));
            }

            // Act: Find all objects
            var results = new List<GameObject>();
            foreach (var obj in objects)
            {
                results.Add(handler.FindGameObject(obj.name));
            }

            // Assert
            Assert.AreEqual(5, results.Count, "Should find all 5 objects");
            for (int i = 0; i < 5; i++)
            {
                Assert.IsNotNull(results[i], $"Object {i} should be found");
                Assert.AreEqual(objects[i], results[i], $"Object {i} should match");
            }

            // Cleanup
            foreach (var obj in objects)
            {
                Object.DestroyImmediate(obj);
            }
        }

        [Test]
        public void Cache_Should_Invalidate_WhenGameObjectDestroyed()
        {
            // Arrange
            var objectName = "TestCacheObject";
            handler.FindGameObject(objectName); // Cache it

            // Act: Destroy GameObject
            Object.DestroyImmediate(testGameObject);
            testGameObject = null;

            // Create new GameObject with same name
            testGameObject = new GameObject(objectName);
            var result = handler.FindGameObject(objectName);

            // Assert
            Assert.IsNotNull(result, "Should find newly created GameObject");
            Assert.AreEqual(objectName, result.name);
        }

        [Test]
        public void Cache_Should_HandleInactiveGameObjects()
        {
            // Arrange
            testGameObject.SetActive(false);
            var objectName = testGameObject.name;

            // Act
            var result = handler.FindGameObject(objectName);

            // Assert
            Assert.IsNotNull(result, "Should find inactive GameObject");
            Assert.AreEqual(objectName, result.name);
            Assert.IsFalse(result.activeSelf, "GameObject should be inactive");
        }

        [Test]
        public void Cache_Should_HandleNestedGameObjects()
        {
            // Arrange
            var parent = new GameObject("CacheTest_Parent");
            var child = new GameObject("CacheTest_Child");
            child.transform.SetParent(parent.transform);

            // Act
            var foundParent = handler.FindGameObject("CacheTest_Parent");
            var foundChild = handler.FindGameObject("CacheTest_Child");

            // Assert
            Assert.IsNotNull(foundParent, "Should find parent");
            Assert.IsNotNull(foundChild, "Should find child");
            Assert.AreEqual(parent, foundParent);
            Assert.AreEqual(child, foundChild);

            // Cleanup
            Object.DestroyImmediate(parent);
        }

        [Test]
        public void Cache_Should_HandleDuplicateNames()
        {
            // Arrange
            var obj1 = new GameObject("CacheTest_Duplicate");
            var obj2 = new GameObject("CacheTest_Duplicate");

            // Act
            var result = handler.FindGameObject("CacheTest_Duplicate");

            // Assert
            Assert.IsNotNull(result, "Should find one of the duplicate objects");
            Assert.AreEqual("CacheTest_Duplicate", result.name);

            // Cleanup
            Object.DestroyImmediate(obj1);
            Object.DestroyImmediate(obj2);
        }

        [Test]
        public void FindGameObject_Should_HandleEmptyString()
        {
            // Arrange
            var emptyName = "";

            // Act
            var result = handler.FindGameObject(emptyName);

            // Assert
            Assert.IsNull(result, "Should return null for empty name");
        }

        [Test]
        public void FindGameObject_Should_HandleNullString()
        {
            // Arrange
            string nullName = null;

            // Act
            var result = handler.FindGameObject(nullName);

            // Assert
            Assert.IsNull(result, "Should return null for null name");
        }

        [Test]
        public void Cache_Should_WorkAcrossMultipleCalls()
        {
            // Arrange
            var obj1 = new GameObject("CacheTest_Multi_1");
            var obj2 = new GameObject("CacheTest_Multi_2");
            var obj3 = new GameObject("CacheTest_Multi_3");

            // Act: Interleave calls to different objects
            var result1a = handler.FindGameObject("CacheTest_Multi_1");
            var result2a = handler.FindGameObject("CacheTest_Multi_2");
            var result1b = handler.FindGameObject("CacheTest_Multi_1"); // From cache
            var result3a = handler.FindGameObject("CacheTest_Multi_3");
            var result2b = handler.FindGameObject("CacheTest_Multi_2"); // From cache

            // Assert
            Assert.AreEqual(obj1, result1a);
            Assert.AreEqual(obj1, result1b);
            Assert.AreEqual(obj2, result2a);
            Assert.AreEqual(obj2, result2b);
            Assert.AreEqual(obj3, result3a);

            // Cleanup
            Object.DestroyImmediate(obj1);
            Object.DestroyImmediate(obj2);
            Object.DestroyImmediate(obj3);
        }

        [Test]
        public void Cache_Should_HandleLargeNumberOfObjects()
        {
            // Arrange: Create 100 GameObjects
            var objects = new List<GameObject>();
            for (int i = 0; i < 100; i++)
            {
                objects.Add(new GameObject($"CacheTest_Large_{i}"));
            }

            // Act: Find all objects (should populate cache)
            var results = new List<GameObject>();
            foreach (var obj in objects)
            {
                results.Add(handler.FindGameObject(obj.name));
            }

            // Assert: All objects found
            Assert.AreEqual(100, results.Count);
            for (int i = 0; i < 100; i++)
            {
                Assert.IsNotNull(results[i], $"Object {i} should be found");
            }

            // Act: Find all again (should use cache)
            var cachedResults = new List<GameObject>();
            var start = System.DateTime.Now;
            foreach (var obj in objects)
            {
                cachedResults.Add(handler.FindGameObject(obj.name));
            }
            var cacheTime = (System.DateTime.Now - start).TotalMilliseconds;

            // Assert: Cached access should be fast
            Assert.Less(cacheTime, 50, "Cached access for 100 objects should be < 50ms");

            // Cleanup
            foreach (var obj in objects)
            {
                Object.DestroyImmediate(obj);
            }
        }
    }
}
