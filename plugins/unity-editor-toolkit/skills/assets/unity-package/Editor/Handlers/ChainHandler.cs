using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEditorToolkit.Protocol;
using UnityEditorToolkit.Editor.Utils;
using Newtonsoft.Json.Linq;

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Chain commands
    /// Executes multiple commands sequentially
    /// </summary>
    public class ChainHandler : BaseHandler
    {
        public override string Category => "Chain";

        private Dictionary<string, BaseHandler> handlers;

        public void SetHandlers(Dictionary<string, BaseHandler> handlers)
        {
            this.handlers = handlers;
        }

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Execute":
                    return HandleExecute(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleExecute(JsonRpcRequest request)
        {
            var param = ValidateParam<ExecuteParams>(request, "commands");

            if (param.commands == null || param.commands.Length == 0)
            {
                throw new Exception("Commands array is required and cannot be empty");
            }

            ToolkitLogger.Log("ChainHandler", $"Executing {param.commands.Length} command(s) sequentially...");

            var results = new List<object>();
            double totalElapsed = 0;

            for (int i = 0; i < param.commands.Length; i++)
            {
                var cmd = param.commands[i];
                double startTime = UnityEditor.EditorApplication.timeSinceStartup;

                try
                {
                    ToolkitLogger.LogDebug("ChainHandler", $"[{i + 1}/{param.commands.Length}] Executing: {cmd.method}");

                    // Parse method to get category
                    string category = GetCategory(cmd.method);

                    if (!handlers.ContainsKey(category))
                    {
                        throw new Exception($"Unknown command category: {category}");
                    }

                    // Create a new request for this command
                    var chainedRequest = new JsonRpcRequest
                    {
                        Id = $"{request.Id}:chain:{i}",
                        Method = cmd.method,
                        Params = cmd.parameters != null ? JToken.FromObject(cmd.parameters) : null
                    };

                    // Execute the command
                    var handler = handlers[category];
                    var result = handler.Handle(chainedRequest);

                    double elapsed = UnityEditor.EditorApplication.timeSinceStartup - startTime;
                    totalElapsed += elapsed;

                    // If result is null, it's a delayed response (not supported in chain)
                    if (result == null)
                    {
                        throw new Exception($"Command '{cmd.method}' returned delayed response, which is not supported in chain execution");
                    }

                    results.Add(new
                    {
                        index = i,
                        method = cmd.method,
                        success = true,
                        result = result,
                        elapsed = elapsed
                    });

                    ToolkitLogger.LogDebug("ChainHandler", $"[{i + 1}/{param.commands.Length}] Success: {cmd.method} ({elapsed:F3}s)");
                }
                catch (Exception ex)
                {
                    double elapsed = UnityEditor.EditorApplication.timeSinceStartup - startTime;
                    totalElapsed += elapsed;

                    ToolkitLogger.LogError("ChainHandler", $"[{i + 1}/{param.commands.Length}] Failed: {cmd.method} - {ex.Message}");

                    // Add error result
                    results.Add(new
                    {
                        index = i,
                        method = cmd.method,
                        success = false,
                        error = ex.Message,
                        elapsed = elapsed
                    });

                    // If stopOnError is true, stop execution
                    if (param.stopOnError)
                    {
                        ToolkitLogger.LogWarning("ChainHandler", "Stopping chain execution due to error (stopOnError=true)");
                        break;
                    }
                }
            }

            return new
            {
                success = true,
                totalCommands = param.commands.Length,
                executedCommands = results.Count,
                totalElapsed = totalElapsed,
                results = results
            };
        }

        private string GetCategory(string method)
        {
            int dotIndex = method.IndexOf('.');
            if (dotIndex < 0)
            {
                throw new Exception($"Invalid method format: {method}");
            }
            return method.Substring(0, dotIndex);
        }

        // Parameter classes
        [Serializable]
        public class ExecuteParams
        {
            public CommandEntry[] commands;
            public bool stopOnError = true;
        }

        [Serializable]
        public class CommandEntry
        {
            public string method;
            public object parameters;
        }
    }
}
