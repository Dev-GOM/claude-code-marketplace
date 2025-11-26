using System;
using UnityEngine;
using UnityEditorToolkit.Editor.Utils;

namespace UnityEditorToolkit.Editor.Database.Commands
{
    /// <summary>
    /// Command Factory
    /// 데이터베이스에서 로드한 명령을 적절한 Command 인스턴스로 복원
    /// </summary>
    public static class CommandFactory
    {
        /// <summary>
        /// command_type과 command_data로부터 ICommand 인스턴스 생성
        /// </summary>
        /// <param name="commandType">Command 타입 이름 (예: "CreateGameObjectCommand")</param>
        /// <param name="commandData">직렬화된 JSON 데이터</param>
        /// <returns>복원된 ICommand 인스턴스, 실패 시 null</returns>
        public static ICommand CreateFromDatabase(string commandType, string commandData)
        {
            try
            {
                switch (commandType)
                {
                    case "CreateGameObjectCommand":
                        return CreateGameObjectCommand.FromJson(commandData);

                    case "TransformChangeCommand":
                        return TransformChangeCommand.FromJson(commandData);

                    // DeleteGameObjectCommand는 CanPersist = false이므로 데이터베이스에 저장되지 않음

                    default:
                        ToolkitLogger.LogWarning("CommandFactory", $" 알 수 없는 Command 타입: {commandType}");
                        return null;
                }
            }
            catch (Exception ex)
            {
                ToolkitLogger.LogError("CommandFactory", $" Command 복원 실패 - Type: {commandType}, Error: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Command 타입이 지원되는지 확인
        /// </summary>
        public static bool IsSupported(string commandType)
        {
            return commandType switch
            {
                "CreateGameObjectCommand" => true,
                "TransformChangeCommand" => true,
                _ => false
            };
        }
    }
}
