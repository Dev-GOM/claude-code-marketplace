/**
 * Unity WebSocket CLI Constants
 *
 * Centralized constants for Unity WebSocket communication.
 * All magic numbers, timeouts, and configuration values should be defined here.
 */

/**
 * Unity WebSocket connection settings
 */
export const UNITY = {
  // Port range for Unity WebSocket servers (9500-9600)
  DEFAULT_PORT: 9500,
  MAX_PORT: 9600,
  LOCALHOST: '127.0.0.1',

  // WebSocket connection timeouts
  WS_TIMEOUT: 30000,           // 30 seconds
  CONNECT_TIMEOUT: 10000,      // 10 seconds
  RECONNECT_DELAY: 2000,       // 2 seconds
  MAX_RECONNECT_ATTEMPTS: 3,

  // Command execution timeouts
  COMMAND_TIMEOUT: 30000,      // 30 seconds for most commands
  HIERARCHY_TIMEOUT: 30000,    // 30 seconds for hierarchy queries
  SCENE_LOAD_TIMEOUT: 60000,   // 60 seconds for scene loading
} as const;

/**
 * File system paths and directories
 */
export const FS = {
  OUTPUT_DIR: '.unity-websocket',
  GITIGNORE_CONTENT: '# Unity WebSocket generated files\n*\n',
} as const;

/**
 * JSON-RPC 2.0 Protocol
 */
export const JSONRPC = {
  VERSION: '2.0',

  // Error codes (JSON-RPC standard + custom)
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // Custom Unity error codes
  UNITY_NOT_CONNECTED: -32000,
  UNITY_COMMAND_FAILED: -32001,
  UNITY_OBJECT_NOT_FOUND: -32002,
  UNITY_SCENE_NOT_FOUND: -32003,
  UNITY_COMPONENT_NOT_FOUND: -32004,
} as const;

/**
 * Unity command categories
 */
export const COMMANDS = {
  // GameObject commands
  HIERARCHY_GET: 'Hierarchy.Get',
  GAMEOBJECT_FIND: 'GameObject.Find',
  GAMEOBJECT_CREATE: 'GameObject.Create',
  GAMEOBJECT_DESTROY: 'GameObject.Destroy',
  GAMEOBJECT_SET_ACTIVE: 'GameObject.SetActive',

  // Transform commands
  TRANSFORM_GET_POSITION: 'Transform.GetPosition',
  TRANSFORM_SET_POSITION: 'Transform.SetPosition',
  TRANSFORM_GET_ROTATION: 'Transform.GetRotation',
  TRANSFORM_SET_ROTATION: 'Transform.SetRotation',
  TRANSFORM_GET_SCALE: 'Transform.GetScale',
  TRANSFORM_SET_SCALE: 'Transform.SetScale',

  // Component commands
  COMPONENT_LIST: 'Component.List',
  COMPONENT_ADD: 'Component.Add',
  COMPONENT_REMOVE: 'Component.Remove',
  COMPONENT_SET_ENABLED: 'Component.SetEnabled',
  COMPONENT_GET: 'Component.Get',
  COMPONENT_SET: 'Component.Set',
  COMPONENT_INSPECT: 'Component.Inspect',
  COMPONENT_MOVE_UP: 'Component.MoveUp',
  COMPONENT_MOVE_DOWN: 'Component.MoveDown',
  COMPONENT_COPY: 'Component.Copy',

  // Material commands
  MATERIAL_GET_PROPERTY: 'Material.GetProperty',
  MATERIAL_SET_PROPERTY: 'Material.SetProperty',
  MATERIAL_GET_COLOR: 'Material.GetColor',
  MATERIAL_SET_COLOR: 'Material.SetColor',
  MATERIAL_LIST: 'Material.List',
  MATERIAL_GET_SHADER: 'Material.GetShader',
  MATERIAL_SET_SHADER: 'Material.SetShader',
  MATERIAL_GET_TEXTURE: 'Material.GetTexture',
  MATERIAL_SET_TEXTURE: 'Material.SetTexture',

  // Scene commands
  SCENE_GET_CURRENT: 'Scene.GetCurrent',
  SCENE_LOAD: 'Scene.Load',
  SCENE_GET_ALL: 'Scene.GetAll',
  SCENE_NEW: 'Scene.New',
  SCENE_SAVE: 'Scene.Save',
  SCENE_UNLOAD: 'Scene.Unload',
  SCENE_SET_ACTIVE: 'Scene.SetActive',

  // Console commands
  CONSOLE_GET_LOGS: 'Console.GetLogs',
  CONSOLE_CLEAR: 'Console.Clear',

  // Editor commands
  EDITOR_GET_SELECTION: 'Editor.GetSelection',
  EDITOR_SET_SELECTION: 'Editor.SetSelection',
  EDITOR_FOCUS_GAME_VIEW: 'Editor.FocusGameView',
  EDITOR_FOCUS_SCENE_VIEW: 'Editor.FocusSceneView',
  EDITOR_REFRESH: 'Editor.Refresh',
  EDITOR_RECOMPILE: 'Editor.Recompile',
  EDITOR_REIMPORT: 'Editor.Reimport',
  EDITOR_EXECUTE: 'Editor.Execute',
  EDITOR_LIST_EXECUTABLE: 'Editor.ListExecutable',

  // Wait commands
  WAIT_WAIT: 'Wait.Wait',

  // Chain commands
  CHAIN_EXECUTE: 'Chain.Execute',

  // Animation commands
  ANIMATION_PLAY: 'Animation.Play',
  ANIMATION_STOP: 'Animation.Stop',
  ANIMATION_GET_STATE: 'Animation.GetState',
  ANIMATION_SET_PARAMETER: 'Animation.SetParameter',
  ANIMATION_GET_PARAMETER: 'Animation.GetParameter',
  ANIMATION_GET_PARAMETERS: 'Animation.GetParameters',
  ANIMATION_SET_TRIGGER: 'Animation.SetTrigger',
  ANIMATION_RESET_TRIGGER: 'Animation.ResetTrigger',
  ANIMATION_CROSSFADE: 'Animation.CrossFade',

  // Database commands
  DATABASE_STATUS: 'Database.Status',
  DATABASE_CONNECT: 'Database.Connect',
  DATABASE_DISCONNECT: 'Database.Disconnect',
  DATABASE_RESET: 'Database.Reset',
  DATABASE_RUN_MIGRATIONS: 'Database.RunMigrations',
  DATABASE_CLEAR_MIGRATIONS: 'Database.ClearMigrations',
  DATABASE_UNDO: 'Database.Undo',
  DATABASE_REDO: 'Database.Redo',
  DATABASE_GET_HISTORY: 'Database.GetHistory',
  DATABASE_CLEAR_HISTORY: 'Database.ClearHistory',
  DATABASE_QUERY: 'Database.Query',

  // Snapshot commands
  SNAPSHOT_SAVE: 'Snapshot.Save',
  SNAPSHOT_LIST: 'Snapshot.List',
  SNAPSHOT_GET: 'Snapshot.Get',
  SNAPSHOT_RESTORE: 'Snapshot.Restore',
  SNAPSHOT_DELETE: 'Snapshot.Delete',

  // Transform History commands
  TRANSFORM_HISTORY_RECORD: 'TransformHistory.Record',
  TRANSFORM_HISTORY_LIST: 'TransformHistory.List',
  TRANSFORM_HISTORY_RESTORE: 'TransformHistory.Restore',
  TRANSFORM_HISTORY_COMPARE: 'TransformHistory.Compare',
  TRANSFORM_HISTORY_CLEAR: 'TransformHistory.Clear',

  // Sync commands
  SYNC_SCENE: 'Sync.SyncScene',
  SYNC_GAMEOBJECT: 'Sync.SyncGameObject',
  SYNC_STATUS: 'Sync.GetSyncStatus',
  SYNC_CLEAR: 'Sync.ClearSync',
  SYNC_START_AUTO: 'Sync.StartAutoSync',
  SYNC_STOP_AUTO: 'Sync.StopAutoSync',
  SYNC_GET_AUTO_STATUS: 'Sync.GetAutoSyncStatus',

  // Analytics commands
  ANALYTICS_PROJECT_STATS: 'Analytics.GetProjectStats',
  ANALYTICS_SCENE_STATS: 'Analytics.GetSceneStats',
  ANALYTICS_SET_CACHE: 'Analytics.SetCache',
  ANALYTICS_GET_CACHE: 'Analytics.GetCache',
  ANALYTICS_CLEAR_CACHE: 'Analytics.ClearCache',
  ANALYTICS_LIST_CACHE: 'Analytics.ListCache',

  // Menu commands
  MENU_RUN: 'Menu.Run',
  MENU_LIST: 'Menu.List',

  // Asset commands
  ASSET_LIST_SO_TYPES: 'Asset.ListScriptableObjectTypes',
  ASSET_CREATE_SO: 'Asset.CreateScriptableObject',
  ASSET_GET_FIELDS: 'Asset.GetFields',
  ASSET_SET_FIELD: 'Asset.SetField',
  ASSET_INSPECT: 'Asset.Inspect',
  ASSET_ADD_ARRAY_ELEMENT: 'Asset.AddArrayElement',
  ASSET_REMOVE_ARRAY_ELEMENT: 'Asset.RemoveArrayElement',
  ASSET_GET_ARRAY_ELEMENT: 'Asset.GetArrayElement',
  ASSET_CLEAR_ARRAY: 'Asset.ClearArray',

  // Prefab commands
  PREFAB_INSTANTIATE: 'Prefab.Instantiate',
  PREFAB_CREATE: 'Prefab.Create',
  PREFAB_UNPACK: 'Prefab.Unpack',
  PREFAB_APPLY: 'Prefab.Apply',
  PREFAB_REVERT: 'Prefab.Revert',
  PREFAB_VARIANT: 'Prefab.Variant',
  PREFAB_GET_OVERRIDES: 'Prefab.GetOverrides',
  PREFAB_GET_SOURCE: 'Prefab.GetSource',
  PREFAB_IS_INSTANCE: 'Prefab.IsInstance',
  PREFAB_OPEN: 'Prefab.Open',
  PREFAB_CLOSE: 'Prefab.Close',
  PREFAB_LIST: 'Prefab.List',

  // Shader commands
  SHADER_LIST: 'Shader.List',
  SHADER_FIND: 'Shader.Find',
  SHADER_GET_PROPERTIES: 'Shader.GetProperties',
  SHADER_GET_KEYWORDS: 'Shader.GetKeywords',
  SHADER_ENABLE_KEYWORD: 'Shader.EnableKeyword',
  SHADER_DISABLE_KEYWORD: 'Shader.DisableKeyword',
  SHADER_IS_KEYWORD_ENABLED: 'Shader.IsKeywordEnabled',
} as const;

/**
 * Logger levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

/**
 * Logger level names mapping
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.VERBOSE]: 'VERBOSE',
};

/**
 * Unity log type mapping
 */
export enum UnityLogType {
  ERROR = 0,
  ASSERT = 1,
  WARNING = 2,
  LOG = 3,
  EXCEPTION = 4,
}

/**
 * Environment variable names
 */
export const ENV = {
  PROJECT_DIR: 'CLAUDE_PROJECT_DIR',
  PLUGIN_ROOT: 'CLAUDE_PLUGIN_ROOT',
  UNITY_WS_PORT: 'UNITY_WS_PORT',
  LOG_LEVEL: 'UNITY_WS_LOG_LEVEL',
} as const;
