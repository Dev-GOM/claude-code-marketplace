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
    /// Handler for Animation commands
    /// </summary>
    public class AnimationHandler : BaseHandler
    {
        public override string Category => "Animation";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Play":
                    return HandlePlay(request);
                case "Stop":
                    return HandleStop(request);
                case "GetState":
                    return HandleGetState(request);
                case "SetParameter":
                    return HandleSetParameter(request);
                case "GetParameter":
                    return HandleGetParameter(request);
                case "GetParameters":
                    return HandleGetParameters(request);
                case "SetTrigger":
                    return HandleSetTrigger(request);
                case "ResetTrigger":
                    return HandleResetTrigger(request);
                case "CrossFade":
                    return HandleCrossFade(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        private object HandlePlay(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationPlayParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            // Try Animator first (newer system)
            var animator = obj.GetComponent<Animator>();
            if (animator != null)
            {
                if (!string.IsNullOrEmpty(param.stateName))
                {
                    animator.Play(param.stateName, param.layer ?? 0, param.normalizedTime ?? 0f);
                }
                else
                {
                    animator.enabled = true;
                    animator.speed = param.speed ?? 1f;
                }

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animator",
                    stateName = param.stateName ?? "Default",
                    message = "Animation playing"
                };
            }

            // Fall back to legacy Animation component
            var animation = obj.GetComponent<Animation>();
            if (animation != null)
            {
                if (!string.IsNullOrEmpty(param.clipName))
                {
                    animation.Play(param.clipName);
                }
                else
                {
                    animation.Play();
                }

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animation",
                    clipName = param.clipName ?? "Default",
                    message = "Animation playing"
                };
            }

            throw new Exception($"No Animator or Animation component found on: {param.gameObject}");
        }

        private object HandleStop(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationStopParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            // Try Animator first
            var animator = obj.GetComponent<Animator>();
            if (animator != null)
            {
                if (param.resetToDefault)
                {
                    animator.Rebind();
                    animator.Update(0f);
                }
                animator.speed = 0f;

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animator",
                    message = "Animation stopped"
                };
            }

            // Fall back to legacy Animation
            var animation = obj.GetComponent<Animation>();
            if (animation != null)
            {
                if (!string.IsNullOrEmpty(param.clipName))
                {
                    animation.Stop(param.clipName);
                }
                else
                {
                    animation.Stop();
                }

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animation",
                    message = "Animation stopped"
                };
            }

            throw new Exception($"No Animator or Animation component found on: {param.gameObject}");
        }

        private object HandleGetState(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationStateParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            // Try Animator first
            var animator = obj.GetComponent<Animator>();
            if (animator != null)
            {
                int layer = param.layer ?? 0;
                var stateInfo = animator.GetCurrentAnimatorStateInfo(layer);
                var clipInfo = animator.GetCurrentAnimatorClipInfo(layer);

                string currentClipName = "None";
                if (clipInfo.Length > 0 && clipInfo[0].clip != null)
                {
                    currentClipName = clipInfo[0].clip.name;
                }

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animator",
                    enabled = animator.enabled,
                    speed = animator.speed,
                    layer = layer,
                    currentState = new
                    {
                        fullPathHash = stateInfo.fullPathHash,
                        shortNameHash = stateInfo.shortNameHash,
                        normalizedTime = stateInfo.normalizedTime,
                        length = stateInfo.length,
                        speed = stateInfo.speed,
                        speedMultiplier = stateInfo.speedMultiplier,
                        isLooping = stateInfo.loop,
                        clipName = currentClipName
                    },
                    isInTransition = animator.IsInTransition(layer),
                    hasRootMotion = animator.hasRootMotion,
                    layerCount = animator.layerCount,
                    parameterCount = animator.parameterCount
                };
            }

            // Fall back to legacy Animation
            var animation = obj.GetComponent<Animation>();
            if (animation != null)
            {
                var clips = new List<object>();
                foreach (AnimationState state in animation)
                {
                    clips.Add(new
                    {
                        name = state.name,
                        length = state.length,
                        normalizedTime = state.normalizedTime,
                        speed = state.speed,
                        weight = state.weight,
                        enabled = state.enabled,
                        wrapMode = state.wrapMode.ToString()
                    });
                }

                return new
                {
                    success = true,
                    gameObject = param.gameObject,
                    type = "Animation",
                    isPlaying = animation.isPlaying,
                    clipCount = animation.GetClipCount(),
                    clips = clips
                };
            }

            throw new Exception($"No Animator or Animation component found on: {param.gameObject}");
        }

        private object HandleSetParameter(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationParameterParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            // Find parameter type
            AnimatorControllerParameterType? paramType = null;
            foreach (var p in animator.parameters)
            {
                if (p.name == param.parameterName)
                {
                    paramType = p.type;
                    break;
                }
            }

            if (!paramType.HasValue)
            {
                throw new Exception($"Parameter not found: {param.parameterName}");
            }

            switch (paramType.Value)
            {
                case AnimatorControllerParameterType.Float:
                    animator.SetFloat(param.parameterName, Convert.ToSingle(param.value));
                    break;
                case AnimatorControllerParameterType.Int:
                    animator.SetInteger(param.parameterName, Convert.ToInt32(param.value));
                    break;
                case AnimatorControllerParameterType.Bool:
                    animator.SetBool(param.parameterName, Convert.ToBoolean(param.value));
                    break;
                case AnimatorControllerParameterType.Trigger:
                    if (Convert.ToBoolean(param.value))
                        animator.SetTrigger(param.parameterName);
                    else
                        animator.ResetTrigger(param.parameterName);
                    break;
            }

            return new
            {
                success = true,
                gameObject = param.gameObject,
                parameterName = param.parameterName,
                parameterType = paramType.Value.ToString(),
                value = param.value
            };
        }

        private object HandleGetParameter(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationGetParameterParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            // Find parameter
            AnimatorControllerParameter foundParam = null;
            foreach (var p in animator.parameters)
            {
                if (p.name == param.parameterName)
                {
                    foundParam = p;
                    break;
                }
            }

            if (foundParam == null)
            {
                throw new Exception($"Parameter not found: {param.parameterName}");
            }

            object value = null;
            switch (foundParam.type)
            {
                case AnimatorControllerParameterType.Float:
                    value = animator.GetFloat(param.parameterName);
                    break;
                case AnimatorControllerParameterType.Int:
                    value = animator.GetInteger(param.parameterName);
                    break;
                case AnimatorControllerParameterType.Bool:
                    value = animator.GetBool(param.parameterName);
                    break;
                case AnimatorControllerParameterType.Trigger:
                    value = "Trigger (no value)";
                    break;
            }

            return new
            {
                success = true,
                gameObject = param.gameObject,
                parameterName = param.parameterName,
                parameterType = foundParam.type.ToString(),
                value = value
            };
        }

        private object HandleGetParameters(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationBaseParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            var parameters = new List<object>();
            foreach (var p in animator.parameters)
            {
                object value = null;
                switch (p.type)
                {
                    case AnimatorControllerParameterType.Float:
                        value = animator.GetFloat(p.name);
                        break;
                    case AnimatorControllerParameterType.Int:
                        value = animator.GetInteger(p.name);
                        break;
                    case AnimatorControllerParameterType.Bool:
                        value = animator.GetBool(p.name);
                        break;
                    case AnimatorControllerParameterType.Trigger:
                        value = null;
                        break;
                }

                parameters.Add(new
                {
                    name = p.name,
                    type = p.type.ToString(),
                    value = value,
                    defaultFloat = p.defaultFloat,
                    defaultInt = p.defaultInt,
                    defaultBool = p.defaultBool
                });
            }

            return new
            {
                success = true,
                gameObject = param.gameObject,
                count = parameters.Count,
                parameters = parameters
            };
        }

        private object HandleSetTrigger(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationTriggerParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            animator.SetTrigger(param.triggerName);

            return new
            {
                success = true,
                gameObject = param.gameObject,
                triggerName = param.triggerName,
                message = "Trigger set"
            };
        }

        private object HandleResetTrigger(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationTriggerParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            animator.ResetTrigger(param.triggerName);

            return new
            {
                success = true,
                gameObject = param.gameObject,
                triggerName = param.triggerName,
                message = "Trigger reset"
            };
        }

        private object HandleCrossFade(JsonRpcRequest request)
        {
            var param = ValidateParam<AnimationCrossFadeParams>(request, "gameObject");

            var obj = FindGameObject(param.gameObject);
            if (obj == null)
            {
                throw new Exception($"GameObject not found: {param.gameObject}");
            }

            var animator = obj.GetComponent<Animator>();
            if (animator == null)
            {
                throw new Exception($"No Animator component found on: {param.gameObject}");
            }

            animator.CrossFade(
                param.stateName,
                param.transitionDuration ?? 0.25f,
                param.layer ?? 0,
                param.normalizedTimeOffset ?? 0f
            );

            return new
            {
                success = true,
                gameObject = param.gameObject,
                stateName = param.stateName,
                transitionDuration = param.transitionDuration ?? 0.25f,
                message = "CrossFade started"
            };
        }

        // Parameter classes
        [Serializable]
        public class AnimationBaseParams
        {
            public string gameObject;
        }

        [Serializable]
        public class AnimationPlayParams : AnimationBaseParams
        {
            public string stateName;    // For Animator
            public string clipName;     // For legacy Animation
            public int? layer;
            public float? normalizedTime;
            public float? speed;
        }

        [Serializable]
        public class AnimationStopParams : AnimationBaseParams
        {
            public string clipName;
            public bool resetToDefault;
        }

        [Serializable]
        public class AnimationStateParams : AnimationBaseParams
        {
            public int? layer;
        }

        [Serializable]
        public class AnimationParameterParams : AnimationBaseParams
        {
            public string parameterName;
            public object value;
        }

        [Serializable]
        public class AnimationGetParameterParams : AnimationBaseParams
        {
            public string parameterName;
        }

        [Serializable]
        public class AnimationTriggerParams : AnimationBaseParams
        {
            public string triggerName;
        }

        [Serializable]
        public class AnimationCrossFadeParams : AnimationBaseParams
        {
            public string stateName;
            public float? transitionDuration;
            public int? layer;
            public float? normalizedTimeOffset;
        }
    }
}
