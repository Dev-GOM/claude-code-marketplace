using System;
using UnityEngine;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for EditorPrefs commands
    /// </summary>
    public class PrefsHandler : BaseHandler
    {
        public override string Category => "Prefs";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetString":
                    return HandleGetString(request);
                case "GetInt":
                    return HandleGetInt(request);
                case "GetFloat":
                    return HandleGetFloat(request);
                case "GetBool":
                    return HandleGetBool(request);
                case "SetString":
                    return HandleSetString(request);
                case "SetInt":
                    return HandleSetInt(request);
                case "SetFloat":
                    return HandleSetFloat(request);
                case "SetBool":
                    return HandleSetBool(request);
                case "DeleteKey":
                    return HandleDeleteKey(request);
                case "DeleteAll":
                    return HandleDeleteAll(request);
                case "HasKey":
                    return HandleHasKey(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleGetString(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetPrefsParams>(request, "key");

            try
            {
                string value = EditorPrefs.GetString(param.key, param.defaultValue ?? "");
                return new
                {
                    success = true,
                    key = param.key,
                    value = value,
                    type = "string"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get EditorPrefs string: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleGetInt(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetPrefsParams>(request, "key");

            try
            {
                int defaultValue = 0;
                if (param.defaultValue != null)
                {
                    int.TryParse(param.defaultValue, out defaultValue);
                }

                int value = EditorPrefs.GetInt(param.key, defaultValue);
                return new
                {
                    success = true,
                    key = param.key,
                    value = value,
                    type = "int"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get EditorPrefs int: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleGetFloat(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetPrefsParams>(request, "key");

            try
            {
                float defaultValue = 0f;
                if (param.defaultValue != null)
                {
                    float.TryParse(param.defaultValue, out defaultValue);
                }

                float value = EditorPrefs.GetFloat(param.key, defaultValue);
                return new
                {
                    success = true,
                    key = param.key,
                    value = value,
                    type = "float"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get EditorPrefs float: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleGetBool(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<GetPrefsParams>(request, "key");

            try
            {
                bool defaultValue = false;
                if (param.defaultValue != null)
                {
                    bool.TryParse(param.defaultValue, out defaultValue);
                }

                bool value = EditorPrefs.GetBool(param.key, defaultValue);
                return new
                {
                    success = true,
                    key = param.key,
                    value = value,
                    type = "bool"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get EditorPrefs bool: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleSetString(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetPrefsParams>(request, "params");

            try
            {
                EditorPrefs.SetString(param.key, param.value);
                return new
                {
                    success = true,
                    key = param.key,
                    message = "EditorPrefs string value set"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set EditorPrefs string: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleSetInt(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetPrefsParams>(request, "params");

            try
            {
                if (!int.TryParse(param.value, out int intValue))
                {
                    throw new Exception($"Invalid int value: {param.value}");
                }

                EditorPrefs.SetInt(param.key, intValue);
                return new
                {
                    success = true,
                    key = param.key,
                    message = "EditorPrefs int value set"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set EditorPrefs int: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleSetFloat(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetPrefsParams>(request, "params");

            try
            {
                if (!float.TryParse(param.value, out float floatValue))
                {
                    throw new Exception($"Invalid float value: {param.value}");
                }

                EditorPrefs.SetFloat(param.key, floatValue);
                return new
                {
                    success = true,
                    key = param.key,
                    message = "EditorPrefs float value set"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set EditorPrefs float: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleSetBool(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<SetPrefsParams>(request, "params");

            try
            {
                if (!bool.TryParse(param.value, out bool boolValue))
                {
                    throw new Exception($"Invalid bool value: {param.value}");
                }

                EditorPrefs.SetBool(param.key, boolValue);
                return new
                {
                    success = true,
                    key = param.key,
                    message = "EditorPrefs bool value set"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to set EditorPrefs bool: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleDeleteKey(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<DeleteKeyParams>(request, "key");

            try
            {
                EditorPrefs.DeleteKey(param.key);
                return new
                {
                    success = true,
                    key = param.key,
                    message = "EditorPrefs key deleted"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to delete EditorPrefs key: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleDeleteAll(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            try
            {
                EditorPrefs.DeleteAll();
                return new
                {
                    success = true,
                    message = "All EditorPrefs deleted"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to delete all EditorPrefs: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        private object HandleHasKey(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<HasKeyParams>(request, "key");

            try
            {
                bool hasKey = EditorPrefs.HasKey(param.key);

                // 키가 존재하면 값과 타입도 함께 반환
                if (hasKey)
                {
                    // 타입 감지: int, float, bool, string 순서로 시도
                    object value = null;
                    string valueType = "unknown";

                    // Int 시도
                    try
                    {
                        int intValue = EditorPrefs.GetInt(param.key, int.MinValue);
                        string strValue = EditorPrefs.GetString(param.key, "");

                        // Int로 저장된 값이면 문자열 버전이 없거나 숫자 형태
                        if (string.IsNullOrEmpty(strValue) || int.TryParse(strValue, out _))
                        {
                            value = intValue;
                            valueType = "int";
                        }
                    }
                    catch { }

                    // Bool 시도 (int로 저장되므로 0 또는 1인지 확인)
                    if (valueType == "int" && (int)value >= 0 && (int)value <= 1)
                    {
                        bool boolValue = EditorPrefs.GetBool(param.key, false);
                        value = boolValue;
                        valueType = "bool";
                    }

                    // Float 시도
                    if (valueType == "unknown")
                    {
                        try
                        {
                            float floatValue = EditorPrefs.GetFloat(param.key, float.MinValue);
                            if (floatValue != float.MinValue)
                            {
                                value = floatValue;
                                valueType = "float";
                            }
                        }
                        catch { }
                    }

                    // String (기본값)
                    if (valueType == "unknown" || valueType == "int")
                    {
                        string strValue = EditorPrefs.GetString(param.key, "");
                        if (!string.IsNullOrEmpty(strValue))
                        {
                            value = strValue;
                            valueType = "string";
                        }
                    }

                    return new
                    {
                        success = true,
                        key = param.key,
                        hasKey = true,
                        type = valueType,
                        value = value
                    };
                }
                else
                {
                    return new
                    {
                        success = true,
                        key = param.key,
                        hasKey = false
                    };
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to check EditorPrefs key: {ex.Message}");
            }
            #else
            throw new Exception("EditorPrefs is only available in Unity Editor");
            #endif
        }

        // Parameter classes
        [Serializable]
        public class GetPrefsParams
        {
            public string key;
            public string defaultValue;
        }

        [Serializable]
        public class SetPrefsParams
        {
            public string key;
            public string value;
        }

        [Serializable]
        public class DeleteKeyParams
        {
            public string key;
        }

        [Serializable]
        public class HasKeyParams
        {
            public string key;
        }
    }
}
