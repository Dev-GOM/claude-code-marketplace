using System;

namespace UnityEditorToolkit.Editor.Attributes
{
    /// <summary>
    /// Marks a static method as executable via CLI
    /// Only methods with this attribute can be executed through Editor.Execute command
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
    public class ExecutableMethodAttribute : Attribute
    {
        /// <summary>
        /// CLI command name (e.g., "reinstall-cli")
        /// </summary>
        public string CommandName { get; }

        /// <summary>
        /// Description of what this method does
        /// </summary>
        public string Description { get; }

        /// <summary>
        /// Mark a method as executable via CLI
        /// </summary>
        /// <param name="commandName">CLI command name (kebab-case recommended)</param>
        /// <param name="description">Human-readable description</param>
        public ExecutableMethodAttribute(string commandName, string description = "")
        {
            if (string.IsNullOrWhiteSpace(commandName))
            {
                throw new ArgumentException("Command name cannot be null or empty", nameof(commandName));
            }

            CommandName = commandName;
            Description = description;
        }
    }
}
