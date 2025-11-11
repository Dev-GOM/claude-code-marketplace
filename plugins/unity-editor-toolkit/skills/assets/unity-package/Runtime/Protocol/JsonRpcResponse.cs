using System;
using Newtonsoft.Json;

namespace UnityEditorToolkit.Protocol
{
    /// <summary>
    /// JSON-RPC 2.0 Success Response
    /// </summary>
    [Serializable]
    public class JsonRpcResponse
    {
        [JsonProperty("jsonrpc")]
        public string JsonRpc { get; set; } = "2.0";

        [JsonProperty("id")]
        public object Id { get; set; }

        [JsonProperty("result")]
        public object Result { get; set; }

        public JsonRpcResponse() { }

        public JsonRpcResponse(object id, object result)
        {
            Id = id;
            Result = result;
        }

        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.None, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            });
        }
    }

    /// <summary>
    /// JSON-RPC 2.0 Error Response
    /// </summary>
    [Serializable]
    public class JsonRpcErrorResponse
    {
        [JsonProperty("jsonrpc")]
        public string JsonRpc { get; set; } = "2.0";

        [JsonProperty("id")]
        public object Id { get; set; }

        [JsonProperty("error")]
        public JsonRpcError Error { get; set; }

        public JsonRpcErrorResponse() { }

        public JsonRpcErrorResponse(object id, JsonRpcError error)
        {
            Id = id;
            Error = error;
        }

        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.None);
        }
    }
}
