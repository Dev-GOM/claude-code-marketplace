using UnityEngine;
using System;
using System.Diagnostics;
using System.Text;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor
{
    /// <summary>
    /// Handles external command execution (Node.js, npm, etc.)
    /// </summary>
    public static class EditorServerCommandRunner
    {
        private const int ProcessKillWaitTimeoutMs = 5000; // 5 seconds
        private const int DefaultCommandTimeoutSeconds = 120; // 2 minutes

        /// <summary>
        /// Check if Node.js is installed and accessible
        /// </summary>
        public static bool CheckNodeInstallation()
        {
            return !string.IsNullOrEmpty(GetNodeVersion());
        }

        /// <summary>
        /// Get Node.js version string (e.g., "v22.17.0")
        /// </summary>
        public static string GetNodeVersion()
        {
            try
            {
                string nodeCommand = Application.platform == RuntimePlatform.WindowsEditor ? "node.exe" : "node";
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = nodeCommand,
                    Arguments = "--version",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (Process process = Process.Start(startInfo))
                {
                    process.WaitForExit(ProcessKillWaitTimeoutMs);
                    if (process.ExitCode == 0)
                    {
                        return process.StandardOutput.ReadToEnd().Trim();
                    }
                }
            }
            catch (Exception)
            {
                return null;
            }

            return null;
        }

        /// <summary>
        /// Run a command with arguments in a specific working directory
        /// </summary>
        public static string RunCommand(string command, string arguments, string workingDirectory, int timeoutSeconds = DefaultCommandTimeoutSeconds)
        {
            ProcessStartInfo startInfo = new ProcessStartInfo();

            // Platform-specific command execution
            // On Windows, .cmd files must be executed through cmd.exe when UseShellExecute = false
            if (Application.platform == RuntimePlatform.WindowsEditor && command == "npm")
            {
                startInfo.FileName = "cmd.exe";
                startInfo.Arguments = $"/c npm {arguments}";
            }
            else
            {
                startInfo.FileName = command;
                startInfo.Arguments = arguments;
            }

            startInfo.WorkingDirectory = workingDirectory;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            startInfo.StandardOutputEncoding = Encoding.UTF8;
            startInfo.StandardErrorEncoding = Encoding.UTF8;

            // Explicitly copy environment variables to ensure npm can find its dependencies
            // When UseShellExecute = false, environment variables are not automatically inherited
            // This fixes issues where npm.cmd cannot find node.exe or its internal modules
            foreach (System.Collections.DictionaryEntry envVar in Environment.GetEnvironmentVariables())
            {
                try
                {
                    string key = envVar.Key.ToString();
                    string value = envVar.Value.ToString();

                    // Add or update environment variable (case-insensitive on Windows)
                    if (startInfo.EnvironmentVariables.ContainsKey(key))
                    {
                        startInfo.EnvironmentVariables[key] = value;
                    }
                    else
                    {
                        startInfo.EnvironmentVariables.Add(key, value);
                    }
                }
                catch (Exception)
                {
                    // Skip problematic environment variables (e.g., null values)
                    continue;
                }
            }

            Process process = null;
            StringBuilder outputBuilder = new StringBuilder();
            StringBuilder errorBuilder = new StringBuilder();

            try
            {
                process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception($"Failed to start process: {command}");
                }

                // Read output asynchronously to prevent deadlocks
                process.OutputDataReceived += (sender, e) => {
                    if (e.Data != null)
                    {
                        lock (outputBuilder)
                        {
                            outputBuilder.AppendLine(e.Data);
                        }
                    }
                };
                process.ErrorDataReceived += (sender, e) => {
                    if (e.Data != null)
                    {
                        lock (errorBuilder)
                        {
                            errorBuilder.AppendLine(e.Data);
                        }
                    }
                };

                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                bool exited = process.WaitForExit(timeoutSeconds * 1000);

                if (!exited)
                {
                    ToolkitLogger.LogWarning("CommandRunner", $"Process timeout after {timeoutSeconds}s, killing: {command} {arguments}");

                    try
                    {
                        // Kill the process tree (including child processes)
                        if (!process.HasExited)
                        {
                            process.Kill();
                            bool killed = process.WaitForExit(ProcessKillWaitTimeoutMs);

                            if (!killed)
                            {
                                ToolkitLogger.LogError("CommandRunner", "Process did not terminate after kill signal");
                            }
                        }
                    }
                    catch (Exception killEx)
                    {
                        ToolkitLogger.LogError("CommandRunner", $"Failed to kill process: {killEx.Message}");
                    }

                    throw new Exception($"{command} timed out after {timeoutSeconds} seconds. Check network connection or increase timeout.");
                }

                // Wait for async output reading to complete
                process.WaitForExit();

                string output = outputBuilder.ToString();
                string error = errorBuilder.ToString();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"{command} {arguments} failed (exit code {process.ExitCode}):\n{error}");
                }

                return output;
            }
            finally
            {
                // Always cleanup process resources
                if (process != null)
                {
                    try
                    {
                        if (!process.HasExited)
                        {
                            process.Kill();
                            process.WaitForExit(ProcessKillWaitTimeoutMs);
                        }
                        process.Dispose();
                    }
                    catch (Exception ex)
                    {
                        ToolkitLogger.LogError("CommandRunner", $"Error disposing process: {ex.Message}");
                    }
                }
            }
        }
    }
}
