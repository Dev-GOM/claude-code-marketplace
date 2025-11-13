using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
                UnityEngine.Debug.LogError($"Failed to deserialize params to {typeof(T).Name}: {ex.Message}");
                throw new ArgumentException($"Invalid parameter format for {typeof(T).Name}: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                // 기타 예외도 동일하게 처리
                UnityEngine.Debug.LogError($"Unexpected error deserializing params: {ex.Message}");
                throw new ArgumentException($"Failed to deserialize parameters: {ex.Message}", ex);
            }
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
