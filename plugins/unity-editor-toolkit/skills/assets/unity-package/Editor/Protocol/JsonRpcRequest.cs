using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Protocol
{
    /// <summary>
    /// JSON-RPC 2.0 Request
    /// </summary>
    [Serializable]
    public class JsonRpcRequest
    {
        [JsonProperty("jsonrpc")]
        public string JsonRpc { get; set; } = "2.0";

        [JsonProperty("id")]
        public object Id { get; set; }

        [JsonProperty("method")]
        public string Method { get; set; }

        [JsonProperty("params")]
        public JToken Params { get; set; }

        /// <summary>
        /// Context data (not serialized, used for passing runtime data like callbacks)
        /// </summary>
        [JsonIgnore]
        private Dictionary<string, object> context = new Dictionary<string, object>();

        /// <summary>
        /// Get strongly-typed parameters (✅ 에러 처리 개선)
        /// </summary>
        public T GetParams<T>() where T : class
        {
            if (Params == null || Params.Type == JTokenType.Null)
            {
                return null;
            }

            try
            {
                return Params.ToObject<T>();
            }
            catch (Newtonsoft.Json.JsonException ex)
            {
                // JSON 역직렬화 실패 시 예외를 다시 던져서 호출자가 처리하도록
                ToolkitLogger.LogError("JsonRpcRequest", $"Failed to deserialize params to {typeof(T).Name}: {ex.Message}");
                throw new ArgumentException($"Invalid parameter format for {typeof(T).Name}: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                // 기타 예외도 동일하게 처리
                ToolkitLogger.LogError("JsonRpcRequest", $"Unexpected error deserializing params: {ex.Message}");
                throw new ArgumentException($"Failed to deserialize parameters: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Set context data
        /// </summary>
        public void SetContext<T>(string key, T value)
        {
            context[key] = value;
        }

        /// <summary>
        /// Get context data
        /// </summary>
        public T GetContext<T>(string key)
        {
            if (context.TryGetValue(key, out var value))
            {
                return (T)value;
            }
            return default(T);
        }

        /// <summary>
        /// Check if request is valid
        /// </summary>
        public bool IsValid()
        {
            return JsonRpc == "2.0" && !string.IsNullOrEmpty(Method);
        }

        /// <summary>
        /// Serialize request to JSON string
        /// </summary>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.None, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            });
        }

        /// <summary>
        /// Deserialize JSON string to request object
        /// </summary>
        public static JsonRpcRequest FromJson(string json)
        {
            return JsonConvert.DeserializeObject<JsonRpcRequest>(json);
        }
    }
}
