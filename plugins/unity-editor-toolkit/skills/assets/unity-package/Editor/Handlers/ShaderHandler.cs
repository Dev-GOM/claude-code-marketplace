using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Shader commands
    /// </summary>
    public class ShaderHandler : BaseHandler
    {
        public override string Category => "Shader";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "List":
                    return HandleList(request);
                case "Find":
                    return HandleFind(request);
                case "GetProperties":
                    return HandleGetProperties(request);
                case "GetKeywords":
                    return HandleGetKeywords(request);
                case "EnableKeyword":
                    return HandleEnableKeyword(request);
                case "DisableKeyword":
                    return HandleDisableKeyword(request);
                case "IsKeywordEnabled":
                    return HandleIsKeywordEnabled(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleList(JsonRpcRequest request)
        {
            var param = request.GetParams<ShaderListParams>() ?? new ShaderListParams();
            var shaderList = new List<object>();

            #if UNITY_EDITOR
            // Get all shaders in the project
            string[] shaderGuids = AssetDatabase.FindAssets("t:Shader");

            foreach (string guid in shaderGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                Shader shader = AssetDatabase.LoadAssetAtPath<Shader>(path);

                if (shader != null)
                {
                    // Apply filter if specified
                    if (!string.IsNullOrEmpty(param.filter))
                    {
                        if (!shader.name.ToLower().Contains(param.filter.ToLower()))
                            continue;
                    }

                    // Skip built-in shaders if not requested
                    bool isBuiltin = path.StartsWith("Packages/") || path.Contains("unity_builtin_extra");
                    if (!param.includeBuiltin && isBuiltin)
                        continue;

                    shaderList.Add(new
                    {
                        name = shader.name,
                        path = path,
                        isBuiltin = isBuiltin,
                        propertyCount = shader.GetPropertyCount(),
                        renderQueue = shader.renderQueue
                    });
                }
            }

            // Also include built-in shaders if requested
            if (param.includeBuiltin)
            {
                // Add common built-in shaders by trying to find them
                string[] commonBuiltinShaders = new[]
                {
                    "Standard",
                    "Standard (Specular setup)",
                    "Mobile/Diffuse",
                    "Mobile/Bumped Diffuse",
                    "Mobile/Bumped Specular",
                    "Unlit/Color",
                    "Unlit/Texture",
                    "Unlit/Transparent",
                    "Particles/Standard Unlit",
                    "Sprites/Default",
                    "UI/Default"
                };

                foreach (string shaderName in commonBuiltinShaders)
                {
                    Shader shader = Shader.Find(shaderName);
                    if (shader != null && !shaderList.Any(s => ((dynamic)s).name == shader.name))
                    {
                        // Apply filter if specified
                        if (!string.IsNullOrEmpty(param.filter))
                        {
                            if (!shader.name.ToLower().Contains(param.filter.ToLower()))
                                continue;
                        }

                        shaderList.Add(new
                        {
                            name = shader.name,
                            path = "Built-in",
                            isBuiltin = true,
                            propertyCount = shader.GetPropertyCount(),
                            renderQueue = shader.renderQueue
                        });
                    }
                }
            }
            #endif

            return new
            {
                success = true,
                count = shaderList.Count,
                shaders = shaderList
            };
        }

        private object HandleFind(JsonRpcRequest request)
        {
            var param = ValidateParam<ShaderFindParams>(request, "name");

            Shader shader = Shader.Find(param.name);

            if (shader == null)
            {
                return new
                {
                    success = false,
                    message = $"Shader not found: {param.name}"
                };
            }

            #if UNITY_EDITOR
            string path = AssetDatabase.GetAssetPath(shader);
            bool isBuiltin = string.IsNullOrEmpty(path) || path.StartsWith("Packages/") || path.Contains("unity_builtin_extra");

            var properties = new List<object>();
            int propCount = shader.GetPropertyCount();

            for (int i = 0; i < propCount; i++)
            {
                properties.Add(new
                {
                    name = shader.GetPropertyName(i),
                    type = shader.GetPropertyType(i).ToString(),
                    description = shader.GetPropertyDescription(i)
                });
            }

            return new
            {
                success = true,
                shader = new
                {
                    name = shader.name,
                    path = isBuiltin ? "Built-in" : path,
                    isBuiltin = isBuiltin,
                    propertyCount = propCount,
                    renderQueue = shader.renderQueue,
                    properties = properties
                }
            };
            #else
            return new
            {
                success = true,
                shader = new
                {
                    name = shader.name,
                    renderQueue = shader.renderQueue
                }
            };
            #endif
        }

        private object HandleGetProperties(JsonRpcRequest request)
        {
            var param = ValidateParam<ShaderFindParams>(request, "name");

            Shader shader = Shader.Find(param.name);

            if (shader == null)
            {
                throw new Exception($"Shader not found: {param.name}");
            }

            var properties = new List<object>();

            #if UNITY_EDITOR
            int propCount = shader.GetPropertyCount();

            for (int i = 0; i < propCount; i++)
            {
                var propType = shader.GetPropertyType(i);
                object defaultValue = null;

                // Get default value based on type
                switch (propType)
                {
                    case ShaderPropertyType.Color:
                        var color = shader.GetPropertyDefaultVectorValue(i);
                        defaultValue = new { r = color.x, g = color.y, b = color.z, a = color.w };
                        break;
                    case ShaderPropertyType.Vector:
                        var vec = shader.GetPropertyDefaultVectorValue(i);
                        defaultValue = new { x = vec.x, y = vec.y, z = vec.z, w = vec.w };
                        break;
                    case ShaderPropertyType.Float:
                    case ShaderPropertyType.Range:
                        defaultValue = shader.GetPropertyDefaultFloatValue(i);
                        break;
                    case ShaderPropertyType.Int:
                        defaultValue = shader.GetPropertyDefaultIntValue(i);
                        break;
                }

                var propInfo = new Dictionary<string, object>
                {
                    { "index", i },
                    { "name", shader.GetPropertyName(i) },
                    { "type", propType.ToString() },
                    { "description", shader.GetPropertyDescription(i) },
                    { "flags", shader.GetPropertyFlags(i).ToString() }
                };

                if (defaultValue != null)
                {
                    propInfo["defaultValue"] = defaultValue;
                }

                // Add range info for Range type
                if (propType == ShaderPropertyType.Range)
                {
                    var range = shader.GetPropertyRangeLimits(i);
                    propInfo["range"] = new { min = range.x, max = range.y };
                }

                // Add texture dimension for Texture type
                if (propType == ShaderPropertyType.Texture)
                {
                    propInfo["textureDimension"] = shader.GetPropertyTextureDimension(i).ToString();
                    propInfo["textureDefaultName"] = shader.GetPropertyTextureDefaultName(i);
                }

                properties.Add(propInfo);
            }
            #endif

            return new
            {
                success = true,
                shaderName = shader.name,
                propertyCount = properties.Count,
                properties = properties
            };
        }

        private object HandleGetKeywords(JsonRpcRequest request)
        {
            var param = request.GetParams<ShaderKeywordsParams>() ?? new ShaderKeywordsParams();

            if (param.global)
            {
                // Get global shader keywords
                var globalKeywords = Shader.globalKeywords;
                var keywordList = new List<object>();

                foreach (var keyword in globalKeywords)
                {
                    // GlobalKeyword only has 'name' property
                    // Use Shader.IsKeywordEnabled to check if enabled
                    keywordList.Add(new
                    {
                        name = keyword.name,
                        isEnabled = Shader.IsKeywordEnabled(keyword)
                    });
                }

                return new
                {
                    success = true,
                    global = true,
                    count = keywordList.Count,
                    keywords = keywordList
                };
            }
            else if (!string.IsNullOrEmpty(param.shaderName))
            {
                // Get keywords for specific shader
                Shader shader = Shader.Find(param.shaderName);
                if (shader == null)
                {
                    throw new Exception($"Shader not found: {param.shaderName}");
                }

                #if UNITY_EDITOR
                var keywordSpace = shader.keywordSpace;
                var keywordList = new List<object>();

                foreach (var keyword in keywordSpace.keywords)
                {
                    keywordList.Add(new
                    {
                        name = keyword.name,
                        type = keyword.type.ToString(),
                        isValid = keyword.isValid
                    });
                }

                return new
                {
                    success = true,
                    shaderName = shader.name,
                    count = keywordList.Count,
                    keywords = keywordList
                };
                #else
                return new
                {
                    success = true,
                    shaderName = shader.name,
                    message = "Shader keywords are only available in Unity Editor"
                };
                #endif
            }
            else
            {
                throw new Exception("Either 'global: true' or 'shaderName' must be specified");
            }
        }

        private object HandleEnableKeyword(JsonRpcRequest request)
        {
            var param = ValidateParam<ShaderKeywordParams>(request, "keyword");

            Shader.EnableKeyword(param.keyword);

            return new
            {
                success = true,
                keyword = param.keyword,
                enabled = true
            };
        }

        private object HandleDisableKeyword(JsonRpcRequest request)
        {
            var param = ValidateParam<ShaderKeywordParams>(request, "keyword");

            Shader.DisableKeyword(param.keyword);

            return new
            {
                success = true,
                keyword = param.keyword,
                enabled = false
            };
        }

        private object HandleIsKeywordEnabled(JsonRpcRequest request)
        {
            var param = ValidateParam<ShaderKeywordParams>(request, "keyword");

            bool isEnabled = Shader.IsKeywordEnabled(param.keyword);

            return new
            {
                success = true,
                keyword = param.keyword,
                enabled = isEnabled
            };
        }

        // Parameter classes
        [Serializable]
        public class ShaderListParams
        {
            public string filter;
            public bool includeBuiltin;
        }

        [Serializable]
        public class ShaderFindParams
        {
            public string name;
        }

        [Serializable]
        public class ShaderKeywordsParams
        {
            public string shaderName;
            public bool global;
        }

        [Serializable]
        public class ShaderKeywordParams
        {
            public string keyword;
        }
    }
}
