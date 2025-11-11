using System;
using Newtonsoft.Json;

namespace UnityEditorToolkit.Protocol
{
    /// <summary>
    /// JSON-RPC 2.0 Error object
    /// </summary>
    [Serializable]
    public class JsonRpcError
    {
        [JsonProperty("code")]
        public int Code { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("data", NullValueHandling = NullValueHandling.Ignore)]
        public object Data { get; set; }

        public JsonRpcError() { }

        public JsonRpcError(int code, string message, object data = null)
        {
            Code = code;
            Message = message;
            Data = data;
        }

        // Standard JSON-RPC 2.0 error codes
        public static readonly int PARSE_ERROR = -32700;
        public static readonly int INVALID_REQUEST = -32600;
        public static readonly int METHOD_NOT_FOUND = -32601;
        public static readonly int INVALID_PARAMS = -32602;
        public static readonly int INTERNAL_ERROR = -32603;

        // Custom Unity error codes
        public static readonly int UNITY_NOT_CONNECTED = -32000;
        public static readonly int UNITY_COMMAND_FAILED = -32001;
        public static readonly int UNITY_OBJECT_NOT_FOUND = -32002;
        public static readonly int UNITY_SCENE_NOT_FOUND = -32003;
        public static readonly int UNITY_COMPONENT_NOT_FOUND = -32004;

        // Factory methods for common errors
        public static JsonRpcError ParseError(string details = null)
        {
            return new JsonRpcError(PARSE_ERROR, "Parse error", details);
        }

        public static JsonRpcError InvalidRequest(string details = null)
        {
            return new JsonRpcError(INVALID_REQUEST, "Invalid Request", details);
        }

        public static JsonRpcError MethodNotFound(string method)
        {
            return new JsonRpcError(METHOD_NOT_FOUND, $"Method not found: {method}");
        }

        public static JsonRpcError InvalidParams(string details)
        {
            return new JsonRpcError(INVALID_PARAMS, "Invalid params", details);
        }

        public static JsonRpcError InternalError(string details)
        {
            return new JsonRpcError(INTERNAL_ERROR, "Internal error", details);
        }

        public static JsonRpcError ObjectNotFound(string objectName)
        {
            return new JsonRpcError(UNITY_OBJECT_NOT_FOUND, $"GameObject not found: {objectName}");
        }

        public static JsonRpcError SceneNotFound(string sceneName)
        {
            return new JsonRpcError(UNITY_SCENE_NOT_FOUND, $"Scene not found: {sceneName}");
        }

        public static JsonRpcError CommandFailed(string details)
        {
            return new JsonRpcError(UNITY_COMMAND_FAILED, "Command failed", details);
        }
    }
}
