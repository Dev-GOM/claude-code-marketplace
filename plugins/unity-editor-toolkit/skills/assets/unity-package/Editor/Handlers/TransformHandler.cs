using System;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Database;
using UnityEditorToolkit.Editor.Database.Commands;
using Cysharp.Threading.Tasks;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Transform commands
    /// </summary>
    public class TransformHandler : BaseHandler
    {
        public override string Category => "Transform";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetPosition":
                    return HandleGetPosition(request);
                case "SetPosition":
                    return HandleSetPosition(request);
                case "GetRotation":
                    return HandleGetRotation(request);
                case "SetRotation":
                    return HandleSetRotation(request);
                case "GetScale":
                    return HandleGetScale(request);
                case "SetScale":
                    return HandleSetScale(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleGetPosition(JsonRpcRequest request)
        {
            var param = ValidateParam<NameParam>(request, "name");
            var transform = GetTransform(param.name);

            return new Vector3Data
            {
                x = transform.position.x,
                y = transform.position.y,
                z = transform.position.z
            };
        }

        private object HandleSetPosition(JsonRpcRequest request)
        {
            var param = ValidateParam<SetPositionParam>(request, "name and position");
            var transform = GetTransform(param.name);

            // Save old values for Command Pattern
            var oldPosition = transform.position;
            var oldRotation = transform.rotation;
            var oldScale = transform.localScale;

            #if UNITY_EDITOR
            UnityEditor.Undo.RecordObject(transform, "Set Position");
            #endif

            // ✅ ToVector3() 사용 (유효성 검증 포함)
            var newPosition = param.position.ToVector3();
            transform.position = newPosition;

            // Execute Command Pattern (if database is connected)
            ExecuteTransformCommandAsync(
                transform.gameObject,
                oldPosition, oldRotation, oldScale,
                newPosition, oldRotation, oldScale
            ).Forget();

            return new { success = true };
        }

        private object HandleGetRotation(JsonRpcRequest request)
        {
            var param = ValidateParam<NameParam>(request, "name");
            var transform = GetTransform(param.name);
            var euler = transform.eulerAngles;

            return new Vector3Data
            {
                x = euler.x,
                y = euler.y,
                z = euler.z
            };
        }

        private object HandleSetRotation(JsonRpcRequest request)
        {
            var param = ValidateParam<SetRotationParam>(request, "name and rotation");
            var transform = GetTransform(param.name);

            // Save old values for Command Pattern
            var oldPosition = transform.position;
            var oldRotation = transform.rotation;
            var oldScale = transform.localScale;

            #if UNITY_EDITOR
            UnityEditor.Undo.RecordObject(transform, "Set Rotation");
            #endif

            // ✅ ToVector3() 사용 (유효성 검증 포함)
            transform.eulerAngles = param.rotation.ToVector3();
            var newRotation = transform.rotation; // Quaternion으로 가져오기

            // Execute Command Pattern (if database is connected)
            ExecuteTransformCommandAsync(
                transform.gameObject,
                oldPosition, oldRotation, oldScale,
                oldPosition, newRotation, oldScale
            ).Forget();

            return new { success = true };
        }

        private object HandleGetScale(JsonRpcRequest request)
        {
            var param = ValidateParam<NameParam>(request, "name");
            var transform = GetTransform(param.name);

            return new Vector3Data
            {
                x = transform.localScale.x,
                y = transform.localScale.y,
                z = transform.localScale.z
            };
        }

        private object HandleSetScale(JsonRpcRequest request)
        {
            var param = ValidateParam<SetScaleParam>(request, "name and scale");
            var transform = GetTransform(param.name);

            // Save old values for Command Pattern
            var oldPosition = transform.position;
            var oldRotation = transform.rotation;
            var oldScale = transform.localScale;

            #if UNITY_EDITOR
            UnityEditor.Undo.RecordObject(transform, "Set Scale");
            #endif

            // ✅ ToVector3() 사용 (유효성 검증 포함)
            var newScale = param.scale.ToVector3();
            transform.localScale = newScale;

            // Execute Command Pattern (if database is connected)
            ExecuteTransformCommandAsync(
                transform.gameObject,
                oldPosition, oldRotation, oldScale,
                oldPosition, oldRotation, newScale
            ).Forget();

            return new { success = true };
        }

        /// <summary>
        /// Execute TransformChangeCommand asynchronously (database persistence)
        /// </summary>
        private async UniTaskVoid ExecuteTransformCommandAsync(
            GameObject gameObject,
            Vector3 oldPosition, Quaternion oldRotation, Vector3 oldScale,
            Vector3 newPosition, Quaternion newRotation, Vector3 newScale)
        {
            try
            {
                #if UNITY_EDITOR
                // Check if database is connected
                if (DatabaseManager.Instance == null ||
                    !DatabaseManager.Instance.IsConnected ||
                    DatabaseManager.Instance.CommandHistory == null)
                {
                    return;
                }

                // Create command
                var command = new TransformChangeCommand(
                    gameObject,
                    oldPosition, oldRotation, oldScale,
                    newPosition, newRotation, newScale
                );

                // Execute through CommandHistory (async, database persistence)
                await DatabaseManager.Instance.CommandHistory.ExecuteCommandAsync(command);
                #endif
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogWarning("TransformHandler", $"Command execution failed: {ex.Message}");
            }
        }

        private Transform GetTransform(string name)
        {
            var obj = FindGameObject(name);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {name}");
            }
            return obj.transform;
        }

        // Parameter classes (✅ private으로 변경)
        [Serializable]
        private class NameParam
        {
            public string name;
        }

        [Serializable]
        private class SetPositionParam
        {
            public string name;
            public Vector3Data position;
        }

        [Serializable]
        private class SetRotationParam
        {
            public string name;
            public Vector3Data rotation;
        }

        [Serializable]
        private class SetScaleParam
        {
            public string name;
            public Vector3Data scale;
        }

        // Response classes
        [Serializable]
        public class Vector3Data
        {
            public float x;
            public float y;
            public float z;

            /// <summary>
            /// Vector3로 변환 (✅ 유효성 검증 추가)
            /// </summary>
            public Vector3 ToVector3()
            {
                // NaN 및 Infinity 체크
                if (float.IsNaN(x) || float.IsInfinity(x))
                {
                    throw new ArgumentException($"Invalid x value: {x}");
                }
                if (float.IsNaN(y) || float.IsInfinity(y))
                {
                    throw new ArgumentException($"Invalid y value: {y}");
                }
                if (float.IsNaN(z) || float.IsInfinity(z))
                {
                    throw new ArgumentException($"Invalid z value: {z}");
                }

                return new Vector3(x, y, z);
            }

            /// <summary>
            /// Vector3에서 생성
            /// </summary>
            public static Vector3Data FromVector3(Vector3 v)
            {
                return new Vector3Data { x = v.x, y = v.y, z = v.z };
            }
        }
    }
}
