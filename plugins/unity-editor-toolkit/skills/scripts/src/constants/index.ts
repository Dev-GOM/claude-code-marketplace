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
  COMMAND_TIMEOUT: 5000,       // 5 seconds for most commands
  HIERARCHY_TIMEOUT: 10000,    // 10 seconds for hierarchy queries
  SCENE_LOAD_TIMEOUT: 30000,   // 30 seconds for scene loading
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
  COMPONENT_GET: 'Component.Get',
  COMPONENT_ADD: 'Component.Add',
  COMPONENT_REMOVE: 'Component.Remove',

  // Material commands
  MATERIAL_GET_PROPERTY: 'Material.GetProperty',
  MATERIAL_SET_PROPERTY: 'Material.SetProperty',
  MATERIAL_GET_COLOR: 'Material.GetColor',
  MATERIAL_SET_COLOR: 'Material.SetColor',

  // Scene commands
  SCENE_GET_CURRENT: 'Scene.GetCurrent',
  SCENE_LOAD: 'Scene.Load',
  SCENE_GET_ALL: 'Scene.GetAll',

  // Console commands
  CONSOLE_GET_LOGS: 'Console.GetLogs',
  CONSOLE_CLEAR: 'Console.Clear',

  // Editor commands
  EDITOR_GET_SELECTION: 'Editor.GetSelection',
  EDITOR_SET_SELECTION: 'Editor.SetSelection',
  EDITOR_FOCUS_GAME_VIEW: 'Editor.FocusGameView',
  EDITOR_FOCUS_SCENE_VIEW: 'Editor.FocusSceneView',

  // Animation commands
  ANIMATION_PLAY: 'Animation.Play',
  ANIMATION_STOP: 'Animation.Stop',
  ANIMATION_GET_STATE: 'Animation.GetState',
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
