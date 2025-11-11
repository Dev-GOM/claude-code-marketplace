/**
 * Unity Test Framework Tests for JSON-RPC Protocol
 *
 * Protocol compliance and serialization testing.
 */

using NUnit.Framework;
using Newtonsoft.Json.Linq;

namespace UnityEditorToolkit.Tests
{
    public class JsonRpcProtocolTests
    {
        [Test]
        public void JsonRpcRequest_Should_SerializeCorrectly()
        {
            // Arrange
            var request = new JsonRpcRequest
            {
                JsonRpc = "2.0",
                Id = "test_123",
                Method = "GameObject.Find",
                Params = JToken.FromObject(new { name = "Player" })
            };

            // Act
            var json = request.ToJson();

            // Assert
            Assert.IsNotEmpty(json);
            Assert.IsTrue(json.Contains("\"jsonrpc\":\"2.0\""));
            Assert.IsTrue(json.Contains("\"id\":\"test_123\""));
            Assert.IsTrue(json.Contains("\"method\":\"GameObject.Find\""));
        }

        [Test]
        public void JsonRpcRequest_Should_DeserializeCorrectly()
        {
            // Arrange
            var json = @"{
                ""jsonrpc"": ""2.0"",
                ""id"": ""req_456"",
                ""method"": ""Transform.SetPosition"",
                ""params"": { ""name"": ""Cube"", ""position"": { ""x"": 1, ""y"": 2, ""z"": 3 } }
            }";

            // Act
            var request = JsonRpcRequest.FromJson(json);

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual("2.0", request.JsonRpc);
            Assert.AreEqual("req_456", request.Id);
            Assert.AreEqual("Transform.SetPosition", request.Method);
            Assert.IsNotNull(request.Params);
        }

        [Test]
        public void JsonRpcResponse_Should_SerializeSuccessResponse()
        {
            // Arrange
            var response = new JsonRpcResponse("req_789", new
            {
                success = true,
                name = "Player",
                active = true
            });

            // Act
            var json = response.ToJson();

            // Assert
            Assert.IsNotEmpty(json);
            Assert.IsTrue(json.Contains("\"jsonrpc\":\"2.0\""));
            Assert.IsTrue(json.Contains("\"id\":\"req_789\""));
            Assert.IsTrue(json.Contains("\"result\""));
            Assert.IsFalse(json.Contains("\"error\""));
        }

        [Test]
        public void JsonRpcErrorResponse_Should_SerializeErrorResponse()
        {
            // Arrange
            var error = JsonRpcError.InternalError("Test error message");
            var response = new JsonRpcErrorResponse("req_error", error);

            // Act
            var json = response.ToJson();

            // Assert
            Assert.IsNotEmpty(json);
            Assert.IsTrue(json.Contains("\"jsonrpc\":\"2.0\""));
            Assert.IsTrue(json.Contains("\"id\":\"req_error\""));
            Assert.IsTrue(json.Contains("\"error\""));
            Assert.IsTrue(json.Contains("\"code\":-32603"));
            Assert.IsTrue(json.Contains("Test error message"));
        }

        [Test]
        public void JsonRpcErrorResponse_Should_PreserveRequestId()
        {
            // Arrange
            var requestId = "important_request_123";
            var error = JsonRpcError.MethodNotFound("GameObject.InvalidMethod");

            // Act
            var response = new JsonRpcErrorResponse(requestId, error);
            var json = response.ToJson();

            // Assert
            Assert.IsTrue(json.Contains($"\"id\":\"{requestId}\""));
        }

        [Test]
        public void JsonRpcErrorResponse_Should_HandleNullRequestId()
        {
            // Arrange
            var error = JsonRpcError.ParseError();

            // Act
            var response = new JsonRpcErrorResponse(null, error);
            var json = response.ToJson();

            // Assert
            Assert.IsTrue(json.Contains("\"id\":null"));
        }

        [Test]
        public void JsonRpcError_InternalError_Should_HaveCorrectCode()
        {
            // Arrange & Act
            var error = JsonRpcError.InternalError("Test message");

            // Assert
            Assert.AreEqual(-32603, error.Code);
            Assert.AreEqual("Internal error", error.Message);
            Assert.IsNotNull(error.Data);
        }

        [Test]
        public void JsonRpcError_MethodNotFound_Should_HaveCorrectCode()
        {
            // Arrange & Act
            var error = JsonRpcError.MethodNotFound("Unknown.Method");

            // Assert
            Assert.AreEqual(-32601, error.Code);
            Assert.AreEqual("Method not found", error.Message);
        }

        [Test]
        public void JsonRpcError_InvalidParams_Should_HaveCorrectCode()
        {
            // Arrange & Act
            var error = JsonRpcError.InvalidParams("Missing 'name' parameter");

            // Assert
            Assert.AreEqual(-32602, error.Code);
            Assert.AreEqual("Invalid params", error.Message);
        }

        [Test]
        public void JsonRpcError_ParseError_Should_HaveCorrectCode()
        {
            // Arrange & Act
            var error = JsonRpcError.ParseError();

            // Assert
            Assert.AreEqual(-32700, error.Code);
            Assert.AreEqual("Parse error", error.Message);
        }

        [Test]
        public void JsonRpcError_InvalidRequest_Should_HaveCorrectCode()
        {
            // Arrange & Act
            var error = JsonRpcError.InvalidRequest();

            // Assert
            Assert.AreEqual(-32600, error.Code);
            Assert.AreEqual("Invalid Request", error.Message);
        }

        [Test]
        public void GetParams_Should_DeserializeCorrectly()
        {
            // Arrange
            var json = @"{
                ""jsonrpc"": ""2.0"",
                ""id"": 1,
                ""method"": ""GameObject.Find"",
                ""params"": { ""name"": ""TestObject"" }
            }";
            var request = JsonRpcRequest.FromJson(json);

            // Act
            var param = request.GetParams<FindParams>();

            // Assert
            Assert.IsNotNull(param);
            Assert.AreEqual("TestObject", param.name);
        }

        [Test]
        public void GetParams_Should_HandleUnknownFields()
        {
            // Arrange
            var json = @"{
                ""jsonrpc"": ""2.0"",
                ""id"": 1,
                ""method"": ""GameObject.Find"",
                ""params"": { ""wrongField"": ""value"" }
            }";
            var request = JsonRpcRequest.FromJson(json);

            // Act
            var param = request.GetParams<FindParams>();

            // Assert: JsonConvert ignores unknown fields, so param is not null but name is null
            Assert.IsNotNull(param);
            Assert.IsNull(param.name);
        }

        [Test]
        public void GetParams_Should_ReturnNullForNullParams()
        {
            // Arrange
            var request = new JsonRpcRequest
            {
                JsonRpc = "2.0",
                Id = 1,
                Method = "ping",
                Params = null
            };

            // Act
            var param = request.GetParams<FindParams>();

            // Assert
            Assert.IsNull(param);
        }

        [Test]
        public void Request_Should_HandleComplexParameters()
        {
            // Arrange
            var json = @"{
                ""jsonrpc"": ""2.0"",
                ""id"": ""complex_1"",
                ""method"": ""Transform.SetPosition"",
                ""params"": {
                    ""name"": ""Player"",
                    ""position"": { ""x"": 1.5, ""y"": 2.7, ""z"": -3.9 }
                }
            }";

            // Act
            var request = JsonRpcRequest.FromJson(json);
            var param = request.GetParams<SetPositionParams>();

            // Assert
            Assert.IsNotNull(param);
            Assert.AreEqual("Player", param.name);
            Assert.IsNotNull(param.position);
            Assert.AreEqual(1.5f, param.position.x, 0.0001f);
            Assert.AreEqual(2.7f, param.position.y, 0.0001f);
            Assert.AreEqual(-3.9f, param.position.z, 0.0001f);
        }

        [Test]
        public void Request_Should_HandleNumericId()
        {
            // Arrange
            var request = new JsonRpcRequest
            {
                JsonRpc = "2.0",
                Id = 42,
                Method = "GameObject.Find"
            };

            // Act
            var json = request.ToJson();

            // Assert
            Assert.IsTrue(json.Contains("\"id\":42"));
        }

        [Test]
        public void Request_Should_HandleStringId()
        {
            // Arrange
            var request = new JsonRpcRequest
            {
                JsonRpc = "2.0",
                Id = "string_id_123",
                Method = "GameObject.Find"
            };

            // Act
            var json = request.ToJson();

            // Assert
            Assert.IsTrue(json.Contains("\"id\":\"string_id_123\""));
        }

        [Test]
        public void Response_Should_MatchRequestId()
        {
            // Arrange
            var requestId = "match_test_789";
            var result = new { success = true };

            // Act
            var response = new JsonRpcResponse(requestId, result);
            var json = response.ToJson();

            // Assert
            Assert.IsTrue(json.Contains($"\"id\":\"{requestId}\""));
        }

        [Test]
        public void Protocol_Should_Comply_WithJsonRpc20Spec()
        {
            // Arrange
            var request = new JsonRpcRequest
            {
                JsonRpc = "2.0",
                Id = "spec_test",
                Method = "GameObject.Find",
                Params = JToken.FromObject(new { name = "Test" })
            };

            // Act
            var json = request.ToJson();
            var parsed = JObject.Parse(json);

            // Assert: JSON-RPC 2.0 required fields
            Assert.IsTrue(parsed.ContainsKey("jsonrpc"));
            Assert.IsTrue(parsed.ContainsKey("method"));
            Assert.IsTrue(parsed.ContainsKey("id"));
            Assert.AreEqual("2.0", parsed["jsonrpc"].ToString());
        }

        // Helper classes for testing
        private class FindParams
        {
            public string name { get; set; }
        }

        private class SetPositionParams
        {
            public string name { get; set; }
            public Vector3Param position { get; set; }
        }

        private class Vector3Param
        {
            public float x { get; set; }
            public float y { get; set; }
            public float z { get; set; }
        }
    }
}
