/**
 * Unity Test Framework Tests for Vector3 Validation
 *
 * Security testing for Vector3Data's NaN/Infinity validation.
 */

using NUnit.Framework;
using UnityEngine;

namespace UnityEditorToolkit.Tests
{
    public class Vector3ValidationTests
    {
        [Test]
        public void ToVector3_Should_Throw_On_NaN_X()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = float.NaN,
                y = 0f,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("x"), "Error message should mention x coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_NaN_Y()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = float.NaN,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("y"), "Error message should mention y coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_NaN_Z()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = 0f,
                z = float.NaN
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("z"), "Error message should mention z coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_PositiveInfinity_X()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = float.PositiveInfinity,
                y = 0f,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("x"), "Error message should mention x coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_PositiveInfinity_Y()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = float.PositiveInfinity,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("y"), "Error message should mention y coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_PositiveInfinity_Z()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = 0f,
                z = float.PositiveInfinity
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("z"), "Error message should mention z coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_NegativeInfinity_X()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = float.NegativeInfinity,
                y = 0f,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("x"), "Error message should mention x coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_NegativeInfinity_Y()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = float.NegativeInfinity,
                z = 0f
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("y"), "Error message should mention y coordinate");
        }

        [Test]
        public void ToVector3_Should_Throw_On_NegativeInfinity_Z()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = 0f,
                z = float.NegativeInfinity
            };

            // Act & Assert
            var exception = Assert.Throws<System.ArgumentException>(() => data.ToVector3());
            Assert.IsTrue(exception.Message.Contains("z"), "Error message should mention z coordinate");
        }

        [Test]
        public void ToVector3_Should_Accept_Zero()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0f,
                y = 0f,
                z = 0f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(Vector3.zero, result);
        }

        [Test]
        public void ToVector3_Should_Accept_PositiveValues()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 1.5f,
                y = 2.7f,
                z = 3.9f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(1.5f, result.x, 0.0001f);
            Assert.AreEqual(2.7f, result.y, 0.0001f);
            Assert.AreEqual(3.9f, result.z, 0.0001f);
        }

        [Test]
        public void ToVector3_Should_Accept_NegativeValues()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = -1.5f,
                y = -2.7f,
                z = -3.9f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(-1.5f, result.x, 0.0001f);
            Assert.AreEqual(-2.7f, result.y, 0.0001f);
            Assert.AreEqual(-3.9f, result.z, 0.0001f);
        }

        [Test]
        public void ToVector3_Should_Accept_MixedValues()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = -5.5f,
                y = 0f,
                z = 10.25f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(-5.5f, result.x, 0.0001f);
            Assert.AreEqual(0f, result.y, 0.0001f);
            Assert.AreEqual(10.25f, result.z, 0.0001f);
        }

        [Test]
        public void ToVector3_Should_Accept_VerySmallValues()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 0.0001f,
                y = -0.0001f,
                z = 0.00001f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(0.0001f, result.x, 0.000001f);
            Assert.AreEqual(-0.0001f, result.y, 0.000001f);
            Assert.AreEqual(0.00001f, result.z, 0.000001f);
        }

        [Test]
        public void ToVector3_Should_Accept_VeryLargeValues()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 1000000f,
                y = -1000000f,
                z = 999999.99f
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(1000000f, result.x, 0.01f);
            Assert.AreEqual(-1000000f, result.y, 0.01f);
            Assert.AreEqual(999999.99f, result.z, 0.01f);
        }

        [Test]
        public void ToVector3_Should_Accept_MaxValue()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = float.MaxValue,
                y = float.MaxValue,
                z = float.MaxValue
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(float.MaxValue, result.x);
            Assert.AreEqual(float.MaxValue, result.y);
            Assert.AreEqual(float.MaxValue, result.z);
        }

        [Test]
        public void ToVector3_Should_Accept_MinValue()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = float.MinValue,
                y = float.MinValue,
                z = float.MinValue
            };

            // Act
            var result = data.ToVector3();

            // Assert
            Assert.AreEqual(float.MinValue, result.x);
            Assert.AreEqual(float.MinValue, result.y);
            Assert.AreEqual(float.MinValue, result.z);
        }

        [Test]
        public void ToVector3_Should_PreserveFloatPrecision()
        {
            // Arrange
            var data = new TransformHandler.Vector3Data
            {
                x = 1.23456789f,
                y = -9.87654321f,
                z = 0.11111111f
            };

            // Act
            var result = data.ToVector3();

            // Assert: Float precision is ~7 significant digits
            Assert.AreEqual(1.23456789f, result.x, 0.0000001f);
            Assert.AreEqual(-9.87654321f, result.y, 0.0000001f);
            Assert.AreEqual(0.11111111f, result.z, 0.0000001f);
        }
    }
}
