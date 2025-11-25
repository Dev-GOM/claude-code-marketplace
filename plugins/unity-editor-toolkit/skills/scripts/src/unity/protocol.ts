/**
 * Unity WebSocket JSON-RPC 2.0 Protocol
 *
 * Type definitions for Unity WebSocket communication using JSON-RPC 2.0 protocol.
 */

import { JSONRPC } from '@/constants';

/**
 * JSON-RPC 2.0 Request
 */
export interface JSONRPCRequest<T = unknown> {
  jsonrpc: typeof JSONRPC.VERSION;
  id: string | number;
  method: string;
  params?: T;
}

/**
 * JSON-RPC 2.0 Success Response
 */
export interface JSONRPCSuccessResponse<T = unknown> {
  jsonrpc: typeof JSONRPC.VERSION;
  id: string | number;
  result: T;
}

/**
 * JSON-RPC 2.0 Error Object
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC 2.0 Error Response
 */
export interface JSONRPCErrorResponse {
  jsonrpc: typeof JSONRPC.VERSION;
  id: string | number | null;
  error: JSONRPCError;
}

/**
 * JSON-RPC 2.0 Response (success or error)
 */
export type JSONRPCResponse<T = unknown> = JSONRPCSuccessResponse<T> | JSONRPCErrorResponse;

/**
 * Type guard for error response
 */
export function isErrorResponse(response: JSONRPCResponse): response is JSONRPCErrorResponse {
  return 'error' in response;
}

/**
 * Type guard for success response
 */
export function isSuccessResponse<T>(response: JSONRPCResponse<T>): response is JSONRPCSuccessResponse<T> {
  return 'result' in response;
}

/**
 * Unity GameObject information
 */
export interface GameObjectInfo {
  name: string;
  instanceId: number;
  path: string;
  active: boolean;
  tag: string;
  layer: number;
  components?: string[];  // Component type names
  children?: GameObjectInfo[];
}

/**
 * Unity Transform information
 */
export interface TransformInfo {
  position: Vector3;
  rotation: Vector3;  // Euler angles
  scale: Vector3;
}

/**
 * Unity Vector3
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Unity Component information
 */
export interface ComponentInfo {
  type: string;
  fullTypeName: string;
  enabled: boolean;
  isMonoBehaviour: boolean;
  properties?: Record<string, unknown>;
}

/**
 * Component list result
 */
export interface ComponentListResult {
  count: number;
  components: ComponentInfo[];
}

/**
 * Component property information
 */
export interface PropertyInfo {
  name: string;
  type: string;
  value: unknown;
}

/**
 * Get component result
 */
export interface GetComponentResult {
  componentType: string;
  properties: PropertyInfo[];
}

/**
 * Set property result
 */
export interface SetPropertyResult {
  success: boolean;
  property: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Inspect component result
 */
export interface InspectComponentResult {
  componentType: string;
  fullTypeName: string;
  enabled: boolean;
  isMonoBehaviour: boolean;
  properties: PropertyInfo[];
  propertyCount: number;
}

/**
 * Unity Material property
 */
export interface MaterialProperty {
  name: string;
  type: string;
  value: unknown;
}

/**
 * Unity Scene information
 */
export interface SceneInfo {
  name: string;
  path: string;
  buildIndex: number;
  isLoaded: boolean;
  isDirty: boolean;
  rootCount: number;
}

/**
 * Unity Console Log entry
 */
export interface ConsoleLogEntry {
  type: number;  // UnityLogType enum value
  message: string;
  stackTrace: string;
  timestamp: string;
}

/**
 * Unity Editor Selection
 */
export interface EditorSelection {
  gameObjects: GameObjectInfo[];
  assets: string[];
}

/**
 * Animation state
 */
export interface AnimationState {
  name: string;
  enabled: boolean;
  weight: number;
  time: number;
  length: number;
  speed: number;
  normalizedTime: number;
}
