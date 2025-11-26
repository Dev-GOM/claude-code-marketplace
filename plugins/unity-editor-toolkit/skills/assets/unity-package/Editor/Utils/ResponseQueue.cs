using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityEditorToolkit.Editor.Utils
{
    /// <summary>
    /// Queue for delayed responses
    /// Allows handlers to register responses that will be sent later when conditions are met
    /// </summary>
    public class ResponseQueue
    {
        private static ResponseQueue instance;
        public static ResponseQueue Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = new ResponseQueue();
                }
                return instance;
            }
        }

        private class PendingResponse
        {
            public string requestId;
            public Func<bool> condition;
            public Func<object> resultProvider;
            public Action<string> sendCallback;
            public double registeredTime;
            public double timeoutSeconds;

            public bool IsTimedOut(double currentTime)
            {
                return currentTime - registeredTime > timeoutSeconds;
            }
        }

        private List<PendingResponse> pendingResponses = new List<PendingResponse>();

        /// <summary>
        /// Register a delayed response
        /// </summary>
        /// <param name="requestId">JSON-RPC request ID</param>
        /// <param name="condition">Condition to check (returns true when ready to send)</param>
        /// <param name="resultProvider">Function to provide result when condition is met</param>
        /// <param name="sendCallback">Callback to send response (receives JSON string)</param>
        /// <param name="timeoutSeconds">Timeout in seconds</param>
        public void Register(
            string requestId,
            Func<bool> condition,
            Func<object> resultProvider,
            Action<string> sendCallback,
            double timeoutSeconds = 300.0)
        {
            var response = new PendingResponse
            {
                requestId = requestId,
                condition = condition,
                resultProvider = resultProvider,
                sendCallback = sendCallback,
                registeredTime = UnityEditor.EditorApplication.timeSinceStartup,
                timeoutSeconds = timeoutSeconds
            };

            pendingResponses.Add(response);
            ToolkitLogger.Log("ResponseQueue", $" Registered delayed response for request {requestId} (timeout: {timeoutSeconds}s)");
        }

        /// <summary>
        /// Process pending responses (called from EditorApplication.update)
        /// </summary>
        public void Update()
        {
            if (pendingResponses.Count == 0)
                return;

            double currentTime = UnityEditor.EditorApplication.timeSinceStartup;
            List<PendingResponse> toRemove = new List<PendingResponse>();

            foreach (var response in pendingResponses)
            {
                try
                {
                    // Check timeout
                    if (response.IsTimedOut(currentTime))
                    {
                        ToolkitLogger.LogWarning("ResponseQueue", $" Request {response.requestId} timed out after {response.timeoutSeconds}s");

                        // Send timeout error
                        var errorResponse = new
                        {
                            jsonrpc = "2.0",
                            id = response.requestId,
                            error = new
                            {
                                code = -32000,
                                message = $"Wait condition timed out after {response.timeoutSeconds} seconds"
                            }
                        };
                        response.sendCallback(Newtonsoft.Json.JsonConvert.SerializeObject(errorResponse));
                        toRemove.Add(response);
                        continue;
                    }

                    // Check condition
                    if (response.condition())
                    {
                        ToolkitLogger.Log("ResponseQueue", $" Condition met for request {response.requestId}");

                        try
                        {
                            // Get result and send response
                            var result = response.resultProvider();
                            var successResponse = new
                            {
                                jsonrpc = "2.0",
                                id = response.requestId,
                                result = result
                            };
                            response.sendCallback(Newtonsoft.Json.JsonConvert.SerializeObject(successResponse));
                            toRemove.Add(response);
                        }
                        catch (System.InvalidOperationException ex)
                        {
                            // WebSocket already closed (client disconnected or timed out)
                            ToolkitLogger.LogWarning("ResponseQueue", $" WebSocket already closed for request {response.requestId}: {ex.Message}");
                            toRemove.Add(response);
                        }
                        catch (System.Exception ex)
                        {
                            ToolkitLogger.LogError("ResponseQueue", $" Error sending success response for request {response.requestId}: {ex.Message}");
                            toRemove.Add(response);
                        }
                    }
                }
                catch (Exception ex)
                {
                    ToolkitLogger.LogError("ResponseQueue", $" Error processing response for request {response.requestId}: {ex.Message}");

                    // Send error response
                    var errorResponse = new
                    {
                        jsonrpc = "2.0",
                        id = response.requestId,
                        error = new
                        {
                            code = -32603,
                            message = $"Internal error: {ex.Message}"
                        }
                    };
                    response.sendCallback(Newtonsoft.Json.JsonConvert.SerializeObject(errorResponse));
                    toRemove.Add(response);
                }
            }

            // Remove completed/timed out responses
            foreach (var response in toRemove)
            {
                pendingResponses.Remove(response);
            }
        }

        /// <summary>
        /// Get number of pending responses
        /// </summary>
        public int PendingCount => pendingResponses.Count;

        /// <summary>
        /// Clear all pending responses
        /// </summary>
        public void Clear()
        {
            pendingResponses.Clear();
            ToolkitLogger.Log("ResponseQueue", "Cleared all pending responses");
        }

        /// <summary>
        /// Cancel all pending responses with error message
        /// Called when server stops or domain reloads to notify clients
        /// </summary>
        public void CancelAllPending(string reason)
        {
            if (pendingResponses.Count == 0)
                return;

            ToolkitLogger.Log("ResponseQueue", $" Cancelling {pendingResponses.Count} pending response(s): {reason}");

            foreach (var response in pendingResponses)
            {
                try
                {
                    var errorResponse = new
                    {
                        jsonrpc = "2.0",
                        id = response.requestId,
                        error = new
                        {
                            code = -32000,
                            message = reason
                        }
                    };
                    response.sendCallback(Newtonsoft.Json.JsonConvert.SerializeObject(errorResponse));
                }
                catch (System.InvalidOperationException ex)
                {
                    // WebSocket already closed
                    ToolkitLogger.LogWarning("ResponseQueue", $" WebSocket already closed for request {response.requestId}: {ex.Message}");
                }
                catch (System.Exception ex)
                {
                    ToolkitLogger.LogWarning("ResponseQueue", $" Failed to send cancellation to {response.requestId}: {ex.Message}");
                }
            }

            pendingResponses.Clear();
        }
    }
}
