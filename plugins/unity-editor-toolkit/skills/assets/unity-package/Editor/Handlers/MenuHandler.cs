using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;
using UnityEditorToolkit.Protocol;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace UnityEditorToolkit.Handlers
{
    /// <summary>
    /// Handler for Unity Editor menu commands
    /// </summary>
    public class MenuHandler : BaseHandler
    {
        public override string Category => "Menu";

        protected override object HandleMethod(string method, JsonRpcRequest request)
        {
            switch (method)
            {
                case "Run":
                    return HandleRun(request);
                case "List":
                    return HandleList(request);
                default:
                    throw new Exception($"Unknown method: {method}");
            }
        }

        /// <summary>
        /// Execute a menu item by path
        /// </summary>
        private object HandleRun(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = ValidateParam<RunParams>(request, "menuPath");

            if (string.IsNullOrWhiteSpace(param.menuPath))
            {
                throw new Exception("Menu path cannot be empty");
            }

            try
            {
                bool success = EditorApplication.ExecuteMenuItem(param.menuPath);

                if (!success)
                {
                    throw new Exception($"Menu item not found or execution failed: {param.menuPath}");
                }

                return new
                {
                    success = true,
                    menuPath = param.menuPath,
                    message = $"Menu item executed: {param.menuPath}"
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to execute menu item '{param.menuPath}': {ex.Message}");
            }
            #else
            throw new Exception("Menu.Run is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// List available menu items
        /// </summary>
        private object HandleList(JsonRpcRequest request)
        {
            #if UNITY_EDITOR
            var param = request.GetParams<ListParams>() ?? new ListParams();
            var menus = new List<MenuItemInfo>();

            try
            {
                // Get menu items using reflection (Unity internal API)
                var menuType = typeof(EditorApplication).Assembly.GetType("UnityEditor.Menu");

                if (menuType != null)
                {
                    // Try to get menu items using internal methods
                    var getMenuItemsMethod = menuType.GetMethod("GetMenuItems",
                        BindingFlags.NonPublic | BindingFlags.Static);

                    if (getMenuItemsMethod != null)
                    {
                        // This method exists but parameters vary by Unity version
                        // Alternative approach: scan common menu paths
                        menus = GetKnownMenuItems();
                    }
                    else
                    {
                        // Fallback: return known menu paths
                        menus = GetKnownMenuItems();
                    }
                }
                else
                {
                    menus = GetKnownMenuItems();
                }

                // Apply filter if provided
                if (!string.IsNullOrEmpty(param.filter))
                {
                    string filterLower = param.filter.ToLower();
                    bool hasWildcard = param.filter.Contains("*");

                    if (hasWildcard)
                    {
                        // Simple wildcard matching
                        string pattern = filterLower.Replace("*", "");
                        menus = menus.Where(m =>
                        {
                            string pathLower = m.path.ToLower();
                            if (param.filter.StartsWith("*") && param.filter.EndsWith("*"))
                                return pathLower.Contains(pattern);
                            else if (param.filter.StartsWith("*"))
                                return pathLower.EndsWith(pattern);
                            else if (param.filter.EndsWith("*"))
                                return pathLower.StartsWith(pattern);
                            return pathLower.Contains(pattern);
                        }).ToList();
                    }
                    else
                    {
                        menus = menus.Where(m =>
                            m.path.ToLower().Contains(filterLower)).ToList();
                    }
                }

                return new
                {
                    success = true,
                    menus = menus.OrderBy(m => m.path).ToList(),
                    count = menus.Count
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to list menu items: {ex.Message}");
            }
            #else
            throw new Exception("Menu.List is only available in Unity Editor");
            #endif
        }

        /// <summary>
        /// Get known/common menu items
        /// </summary>
        private List<MenuItemInfo> GetKnownMenuItems()
        {
            var menus = new List<MenuItemInfo>();

            // File menu
            AddMenuCategory(menus, "File", new[]
            {
                "New Scene", "Open Scene", "Save", "Save As...",
                "New Project...", "Open Project...", "Save Project",
                "Build Settings...", "Build And Run"
            });

            // Edit menu
            AddMenuCategory(menus, "Edit", new[]
            {
                "Undo", "Redo", "Cut", "Copy", "Paste", "Duplicate", "Delete",
                "Select All", "Deselect All", "Select Children", "Select Prefab Root",
                "Play", "Pause", "Step",
                "Project Settings...", "Preferences...",
                "Clear All PlayerPrefs"
            });

            // Assets menu
            AddMenuCategory(menus, "Assets", new[]
            {
                "Create/Folder", "Create/C# Script", "Create/Shader/Standard Surface Shader",
                "Create/Material", "Create/Prefab", "Create/Scene",
                "Open", "Delete", "Rename", "Copy Path",
                "Import New Asset...", "Import Package/Custom Package...",
                "Export Package...", "Find References In Scene",
                "Refresh", "Reimport", "Reimport All"
            });

            // GameObject menu
            AddMenuCategory(menus, "GameObject", new[]
            {
                "Create Empty", "Create Empty Child",
                "3D Object/Cube", "3D Object/Sphere", "3D Object/Capsule",
                "3D Object/Cylinder", "3D Object/Plane", "3D Object/Quad",
                "2D Object/Sprite", "2D Object/Sprite Mask",
                "Effects/Particle System", "Effects/Trail", "Effects/Line",
                "Light/Directional Light", "Light/Point Light", "Light/Spotlight",
                "Audio/Audio Source", "Audio/Audio Reverb Zone",
                "Video/Video Player",
                "UI/Canvas", "UI/Panel", "UI/Button", "UI/Text", "UI/Image",
                "UI/Raw Image", "UI/Slider", "UI/Scrollbar", "UI/Toggle",
                "UI/Input Field", "UI/Dropdown", "UI/Scroll View",
                "Camera", "Move To View", "Align With View", "Align View to Selected"
            });

            // Component menu
            AddMenuCategory(menus, "Component", new[]
            {
                "Add...",
                "Mesh/Mesh Filter", "Mesh/Mesh Renderer",
                "Physics/Rigidbody", "Physics/Box Collider", "Physics/Sphere Collider",
                "Physics/Capsule Collider", "Physics/Mesh Collider",
                "Physics 2D/Rigidbody 2D", "Physics 2D/Box Collider 2D",
                "Rendering/Camera", "Rendering/Light",
                "Audio/Audio Source", "Audio/Audio Listener",
                "Scripts"
            });

            // Window menu
            AddMenuCategory(menus, "Window", new[]
            {
                "General/Scene", "General/Game", "General/Inspector", "General/Hierarchy",
                "General/Project", "General/Console",
                "Animation/Animation", "Animation/Animator",
                "Rendering/Lighting", "Rendering/Light Explorer", "Rendering/Occlusion Culling",
                "Audio/Audio Mixer",
                "Package Manager",
                "2D/Tile Palette", "2D/Sprite Editor",
                "AI/Navigation",
                "Asset Store",
                "Layouts/Default", "Layouts/2 by 3", "Layouts/4 Split", "Layouts/Tall", "Layouts/Wide"
            });

            // Help menu
            AddMenuCategory(menus, "Help", new[]
            {
                "About Unity...", "Unity Manual", "Scripting Reference",
                "Unity Forum", "Unity Answers", "Check for Updates"
            });

            // Tools menu (common items)
            AddMenuCategory(menus, "Tools", new[]
            {
                "Sprite Editor"
            });

            return menus;
        }

        private void AddMenuCategory(List<MenuItemInfo> menus, string category, string[] items)
        {
            foreach (var item in items)
            {
                string path = item.Contains("/") ? $"{category}/{item}" : $"{category}/{item}";
                menus.Add(new MenuItemInfo { path = path, category = category });
            }
        }

        // Parameter classes
        [Serializable]
        public class RunParams
        {
            public string menuPath;
        }

        [Serializable]
        public class ListParams
        {
            public string filter;
        }

        [Serializable]
        public class MenuItemInfo
        {
            public string path;
            public string category;
        }
    }
}
