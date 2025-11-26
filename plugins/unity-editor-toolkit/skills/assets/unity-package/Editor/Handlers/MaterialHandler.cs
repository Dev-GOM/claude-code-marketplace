using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Material commands
    /// </summary>
    public class MaterialHandler : BaseHandler
    {
        public override string Category => "Material";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "GetProperty":
                    return HandleGetProperty(request);
                case "SetProperty":
                    return HandleSetProperty(request);
                case "GetColor":
                    return HandleGetColor(request);
                case "SetColor":
                    return HandleSetColor(request);
                case "List":
                    return HandleList(request);
                case "GetShader":
                    return HandleGetShader(request);
                case "SetShader":
                    return HandleSetShader(request);
                case "GetTexture":
                    return HandleGetTexture(request);
                case "SetTexture":
                    return HandleSetTexture(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandleGetProperty(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialPropertyParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            if (!material.HasProperty(param.propertyName))
            {
                throw new Exception($"Material does not have property: {param.propertyName}");
            }

            object value = null;
            string propertyType = GetPropertyType(material, param.propertyName);

            switch (propertyType)
            {
                case "Float":
                case "Range":
                    value = material.GetFloat(param.propertyName);
                    break;
                case "Int":
                    value = material.GetInt(param.propertyName);
                    break;
                case "Color":
                    var color = material.GetColor(param.propertyName);
                    value = new { r = color.r, g = color.g, b = color.b, a = color.a };
                    break;
                case "Vector":
                    var vec = material.GetVector(param.propertyName);
                    value = new { x = vec.x, y = vec.y, z = vec.z, w = vec.w };
                    break;
                case "Texture":
                    var tex = material.GetTexture(param.propertyName);
                    value = tex != null ? new { name = tex.name, type = tex.GetType().Name } : null;
                    break;
                default:
                    value = "Unknown type";
                    break;
            }

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = param.propertyName,
                propertyType = propertyType,
                value = value
            };
        }

        private object HandleSetProperty(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialSetPropertyParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            if (!material.HasProperty(param.propertyName))
            {
                throw new Exception($"Material does not have property: {param.propertyName}");
            }

            string propertyType = GetPropertyType(material, param.propertyName);

            switch (propertyType)
            {
                case "Float":
                case "Range":
                    material.SetFloat(param.propertyName, Convert.ToSingle(param.value));
                    break;
                case "Int":
                    material.SetInt(param.propertyName, Convert.ToInt32(param.value));
                    break;
                default:
                    throw new Exception($"Property type {propertyType} cannot be set with SetProperty. Use SetColor, SetTexture, or SetVector.");
            }

            #if UNITY_EDITOR
            EditorUtility.SetDirty(material);
            #endif

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = param.propertyName,
                propertyType = propertyType,
                value = param.value
            };
        }

        private object HandleGetColor(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialColorParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            string propName = string.IsNullOrEmpty(param.propertyName) ? "_Color" : param.propertyName;

            if (!material.HasProperty(propName))
            {
                throw new Exception($"Material does not have color property: {propName}");
            }

            var color = material.GetColor(propName);

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = propName,
                color = new
                {
                    r = color.r,
                    g = color.g,
                    b = color.b,
                    a = color.a,
                    hex = ColorUtility.ToHtmlStringRGBA(color)
                }
            };
        }

        private object HandleSetColor(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialSetColorParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            string propName = string.IsNullOrEmpty(param.propertyName) ? "_Color" : param.propertyName;

            if (!material.HasProperty(propName))
            {
                throw new Exception($"Material does not have color property: {propName}");
            }

            Color newColor;

            // Parse color from various formats
            if (!string.IsNullOrEmpty(param.hex))
            {
                // Hex format: #RRGGBB or #RRGGBBAA
                string hexValue = param.hex.StartsWith("#") ? param.hex : "#" + param.hex;
                if (!ColorUtility.TryParseHtmlString(hexValue, out newColor))
                {
                    throw new Exception($"Invalid hex color format: {param.hex}");
                }
            }
            else
            {
                // RGBA format
                newColor = new Color(
                    param.r ?? 1f,
                    param.g ?? 1f,
                    param.b ?? 1f,
                    param.a ?? 1f
                );
            }

            material.SetColor(propName, newColor);

            #if UNITY_EDITOR
            EditorUtility.SetDirty(material);
            #endif

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = propName,
                color = new
                {
                    r = newColor.r,
                    g = newColor.g,
                    b = newColor.b,
                    a = newColor.a,
                    hex = ColorUtility.ToHtmlStringRGBA(newColor)
                }
            };
        }

        private object HandleList(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialListParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var materials = param.useShared ? renderer.sharedMaterials : renderer.materials;
            var materialList = new List<object>();

            for (int i = 0; i < materials.Length; i++)
            {
                var mat = materials[i];
                if (mat != null)
                {
                    materialList.Add(new
                    {
                        index = i,
                        name = mat.name,
                        shader = mat.shader != null ? mat.shader.name : "None"
                    });
                }
            }

            return new
            {
                success = true,
                gameObject = param.gameObject,
                count = materialList.Count,
                materials = materialList
            };
        }

        private object HandleGetShader(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialBaseParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            var shader = material.shader;

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                shader = shader != null ? new
                {
                    name = shader.name,
                    propertyCount = shader.GetPropertyCount()
                } : null
            };
        }

        private object HandleSetShader(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialSetShaderParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            var shader = Shader.Find(param.shaderName);
            if (shader == null)
            {
                throw new Exception($"Shader not found: {param.shaderName}");
            }

            material.shader = shader;

            #if UNITY_EDITOR
            EditorUtility.SetDirty(material);
            #endif

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                shader = shader.name
            };
        }

        private object HandleGetTexture(JsonRpcRequest request)
        {
            var param = ValidateParam<MaterialTextureParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            string propName = string.IsNullOrEmpty(param.propertyName) ? "_MainTex" : param.propertyName;

            if (!material.HasProperty(propName))
            {
                throw new Exception($"Material does not have texture property: {propName}");
            }

            var texture = material.GetTexture(propName);
            var scale = material.GetTextureScale(propName);
            var offset = material.GetTextureOffset(propName);

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = propName,
                texture = texture != null ? new
                {
                    name = texture.name,
                    type = texture.GetType().Name,
                    width = texture.width,
                    height = texture.height
                } : null,
                scale = new { x = scale.x, y = scale.y },
                offset = new { x = offset.x, y = offset.y }
            };
        }

        private object HandleSetTexture(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<MaterialSetTextureParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var renderer = obj.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new Exception($"No Renderer component found on: {param.gameObject}");
            }

            var material = GetMaterial(renderer, param.materialIndex, param.useShared);

            string propName = string.IsNullOrEmpty(param.propertyName) ? "_MainTex" : param.propertyName;

            if (!material.HasProperty(propName))
            {
                throw new Exception($"Material does not have texture property: {propName}");
            }

            Texture texture = null;

            if (!string.IsNullOrEmpty(param.texturePath))
            {
                texture = AssetDatabase.LoadAssetAtPath<Texture>(param.texturePath);
                if (texture == null)
                {
                    throw new Exception($"Texture not found at path: {param.texturePath}");
                }
            }

            material.SetTexture(propName, texture);

            // Set scale and offset if provided
            if (param.scaleX.HasValue || param.scaleY.HasValue)
            {
                var currentScale = material.GetTextureScale(propName);
                material.SetTextureScale(propName, new Vector2(
                    param.scaleX ?? currentScale.x,
                    param.scaleY ?? currentScale.y
                ));
            }

            if (param.offsetX.HasValue || param.offsetY.HasValue)
            {
                var currentOffset = material.GetTextureOffset(propName);
                material.SetTextureOffset(propName, new Vector2(
                    param.offsetX ?? currentOffset.x,
                    param.offsetY ?? currentOffset.y
                ));
            }

            EditorUtility.SetDirty(material);

            return new
            {
                success = true,
                gameObject = param.gameObject,
                material = material.name,
                propertyName = propName,
                texture = texture != null ? texture.name : "None"
            };
            #else
            throw new Exception("SetTexture is only available in Unity Editor");
            #endif
        }

        // Helper methods
        private Material GetMaterial(Renderer renderer, int? materialIndex, bool useShared)
        {
            var materials = useShared ? renderer.sharedMaterials : renderer.materials;
            int index = materialIndex ?? 0;

            if (index < 0 || index >= materials.Length)
            {
                throw new Exception($"Material index {index} out of range. Available: 0-{materials.Length - 1}");
            }

            var material = materials[index];
            if (material == null)
            {
                throw new Exception($"Material at index {index} is null");
            }

            return material;
        }

        private string GetPropertyType(Material material, string propertyName)
        {
            #if UNITY_EDITOR
            var shader = material.shader;
            int propCount = shader.GetPropertyCount();

            for (int i = 0; i < propCount; i++)
            {
                string name = shader.GetPropertyName(i);
                if (name == propertyName)
                {
                    var propType = shader.GetPropertyType(i);
                    return propType.ToString();
                }
            }
            #endif

            return "Unknown";
        }

        // Parameter classes
        [Serializable]
        public class MaterialBaseParams
        {
            public string gameObject;
            public int? materialIndex;
            public bool useShared;
        }

        [Serializable]
        public class MaterialPropertyParams : MaterialBaseParams
        {
            public string propertyName;
        }

        [Serializable]
        public class MaterialSetPropertyParams : MaterialPropertyParams
        {
            public float value;
        }

        [Serializable]
        public class MaterialColorParams : MaterialBaseParams
        {
            public string propertyName;
        }

        [Serializable]
        public class MaterialSetColorParams : MaterialColorParams
        {
            public float? r;
            public float? g;
            public float? b;
            public float? a;
            public string hex;
        }

        [Serializable]
        public class MaterialListParams
        {
            public string gameObject;
            public bool useShared;
        }

        [Serializable]
        public class MaterialSetShaderParams : MaterialBaseParams
        {
            public string shaderName;
        }

        [Serializable]
        public class MaterialTextureParams : MaterialBaseParams
        {
            public string propertyName;
        }

        [Serializable]
        public class MaterialSetTextureParams : MaterialTextureParams
        {
            public string texturePath;
            public float? scaleX;
            public float? scaleY;
            public float? offsetX;
            public float? offsetY;
        }
    }
}
