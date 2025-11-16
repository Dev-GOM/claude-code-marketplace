-- Migration 001: Initial Schema (SQLite)
-- Unity Editor Toolkit - SQLite Database Schema
-- Embedded SQLite (설치 불필요)
-- Created: 2025-11-14
-- Updated: 2025-11-14 (PostgreSQL → SQLite)

-- ============================================================
-- PRAGMA 설정
-- ============================================================

-- 참고: PRAGMA 설정은 SQLiteConnector.ConnectAsync()에서 자동으로 적용됩니다.
-- - foreign_keys = ON (Foreign Key 제약 활성화)
-- - journal_mode = WAL (Write-Ahead Logging, 성능 향상)
-- - synchronous = NORMAL (fsync 최적화)

-- ============================================================
-- TABLE 1: scenes
-- 씬 정보 (프로젝트의 모든 씬)
-- ============================================================

CREATE TABLE IF NOT EXISTS scenes (
    scene_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_name TEXT NOT NULL,
    scene_path TEXT NOT NULL UNIQUE,
    build_index INTEGER,
    is_loaded INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN → INTEGER (0/1)
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scenes_name ON scenes(scene_name);
CREATE INDEX idx_scenes_is_loaded ON scenes(is_loaded);

-- ============================================================
-- TABLE 2: gameobjects
-- GameObject 정보 (Closure Table로 계층 구조 관리)
-- ============================================================

CREATE TABLE IF NOT EXISTS gameobjects (
    object_id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL UNIQUE,
    scene_id INTEGER REFERENCES scenes(scene_id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    parent_id INTEGER REFERENCES gameobjects(object_id) ON DELETE SET NULL,
    tag TEXT DEFAULT 'Untagged',
    layer INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,  -- BOOLEAN → INTEGER
    is_static INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN → INTEGER
    is_deleted INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN → INTEGER (Soft delete)
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_gameobjects_instance_id ON gameobjects(instance_id);
CREATE INDEX idx_gameobjects_scene_id ON gameobjects(scene_id);
CREATE INDEX idx_gameobjects_parent_id ON gameobjects(parent_id);
CREATE INDEX idx_gameobjects_tag ON gameobjects(tag);
CREATE INDEX idx_gameobjects_is_active ON gameobjects(is_active);
CREATE INDEX idx_gameobjects_is_deleted ON gameobjects(is_deleted);

-- ============================================================
-- TABLE 2-1: gameobject_closure
-- GameObject 계층 구조 (Closure Table)
-- PostgreSQL ltree 대체 - 성능이 더 우수함
-- ============================================================

CREATE TABLE IF NOT EXISTS gameobject_closure (
    ancestor_id INTEGER NOT NULL,
    descendant_id INTEGER NOT NULL,
    depth INTEGER NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id),
    FOREIGN KEY (ancestor_id) REFERENCES gameobjects(object_id) ON DELETE CASCADE,
    FOREIGN KEY (descendant_id) REFERENCES gameobjects(object_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_closure_ancestor ON gameobject_closure(ancestor_id);
CREATE INDEX idx_closure_descendant ON gameobject_closure(descendant_id);
CREATE INDEX idx_closure_depth ON gameobject_closure(depth);

-- ============================================================
-- TABLE 3: components
-- Component 정보
-- ============================================================

CREATE TABLE IF NOT EXISTS components (
    component_id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER NOT NULL REFERENCES gameobjects(object_id) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    component_data TEXT CHECK(json_valid(component_data)),  -- JSON validation
    is_enabled INTEGER NOT NULL DEFAULT 1,  -- BOOLEAN → INTEGER
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_components_object_id ON components(object_id);
CREATE INDEX idx_components_type ON components(component_type);
-- SQLite JSON index는 json_each/json_tree로 쿼리 시 자동 활용

-- ============================================================
-- TABLE 4: transforms
-- Transform 히스토리 (위치, 회전, 스케일 변경 추적)
-- ============================================================

CREATE TABLE IF NOT EXISTS transforms (
    transform_id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER NOT NULL REFERENCES gameobjects(object_id) ON DELETE CASCADE,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    position_z REAL NOT NULL,
    rotation_x REAL NOT NULL,  -- Quaternion X
    rotation_y REAL NOT NULL,  -- Quaternion Y
    rotation_z REAL NOT NULL,  -- Quaternion Z
    rotation_w REAL NOT NULL,  -- Quaternion W
    scale_x REAL NOT NULL,
    scale_y REAL NOT NULL,
    scale_z REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transforms_object_id ON transforms(object_id);
CREATE INDEX idx_transforms_recorded_at ON transforms(recorded_at);

-- ============================================================
-- TABLE 5: command_history
-- 명령 히스토리 (Command Pattern, Undo/Redo 지원)
-- ============================================================

CREATE TABLE IF NOT EXISTS command_history (
    -- Primary Key: GUID 문자열 (C# Guid.NewGuid().ToString())
    command_id TEXT PRIMARY KEY,

    -- Command 정보
    command_name TEXT NOT NULL,
    command_type TEXT NOT NULL,
    command_data TEXT NOT NULL CHECK(json_valid(command_data)),  -- JSON validation

    -- 실행 정보
    executed_at TEXT NOT NULL,
    executed_by TEXT DEFAULT 'System',

    -- 메타데이터
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_command_history_executed_at ON command_history(executed_at DESC);
CREATE INDEX idx_command_history_type ON command_history(command_type);
CREATE INDEX idx_command_history_name ON command_history(command_name);
CREATE INDEX idx_command_history_executed_by ON command_history(executed_by);

-- ============================================================
-- TABLE 6: snapshots
-- 씬 스냅샷 (시점 복원용)
-- ============================================================

CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL REFERENCES scenes(scene_id) ON DELETE CASCADE,
    snapshot_name TEXT NOT NULL,
    snapshot_data TEXT NOT NULL CHECK(json_valid(snapshot_data)),  -- JSON validation
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_scene_id ON snapshots(scene_id);
CREATE INDEX idx_snapshots_created_at ON snapshots(created_at);

-- ============================================================
-- TABLE 7: metadata
-- 프로젝트 메타데이터
-- ============================================================

CREATE TABLE IF NOT EXISTS metadata (
    metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metadata_key ON metadata(key);

-- ============================================================
-- TABLE 8: analytics_cache
-- 분석 결과 캐시 (성능 최적화)
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
    cache_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_data TEXT NOT NULL CHECK(json_valid(cache_data)),  -- JSON validation
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- gameobjects.updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_gameobjects_updated_at
AFTER UPDATE ON gameobjects
FOR EACH ROW
BEGIN
    UPDATE gameobjects SET updated_at = CURRENT_TIMESTAMP
    WHERE object_id = NEW.object_id;
END;

-- components.updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_components_updated_at
AFTER UPDATE ON components
FOR EACH ROW
BEGIN
    UPDATE components SET updated_at = CURRENT_TIMESTAMP
    WHERE component_id = NEW.component_id;
END;

-- scenes.updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_scenes_updated_at
AFTER UPDATE ON scenes
FOR EACH ROW
BEGIN
    UPDATE scenes SET updated_at = CURRENT_TIMESTAMP
    WHERE scene_id = NEW.scene_id;
END;

-- metadata.updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_metadata_updated_at
AFTER UPDATE ON metadata
FOR EACH ROW
BEGIN
    UPDATE metadata SET updated_at = CURRENT_TIMESTAMP
    WHERE metadata_id = NEW.metadata_id;
END;

-- ============================================================
-- CLOSURE TABLE TRIGGERS (자동 유지 관리)
-- ============================================================

-- GameObject 생성 시: 자기 자신 + 부모 조상들 추가
CREATE TRIGGER IF NOT EXISTS trigger_gameobject_insert_closure
AFTER INSERT ON gameobjects
FOR EACH ROW
BEGIN
    -- 1. 자기 자신 (depth = 0)
    INSERT INTO gameobject_closure (ancestor_id, descendant_id, depth)
    VALUES (NEW.object_id, NEW.object_id, 0);

    -- 2. 부모가 있으면 부모의 모든 조상 복사 (depth + 1)
    INSERT INTO gameobject_closure (ancestor_id, descendant_id, depth)
    SELECT ancestor_id, NEW.object_id, depth + 1
    FROM gameobject_closure
    WHERE descendant_id = NEW.parent_id AND NEW.parent_id IS NOT NULL;
END;

-- GameObject 삭제 시: 관련 Closure 레코드 자동 삭제 (CASCADE)
-- (FOREIGN KEY ON DELETE CASCADE가 처리)

-- ============================================================
-- VIEWS
-- ============================================================

-- Active GameObjects View (is_deleted = 0, is_active = 1)
CREATE VIEW IF NOT EXISTS active_gameobjects AS
SELECT
    object_id,
    instance_id,
    scene_id,
    object_name,
    parent_id,
    tag,
    layer,
    created_at,
    updated_at
FROM gameobjects
WHERE is_deleted = 0 AND is_active = 1;

-- GameObject Component Count View
CREATE VIEW IF NOT EXISTS gameobject_component_count AS
SELECT
    g.object_id,
    g.object_name,
    g.parent_id,
    COUNT(c.component_id) AS component_count
FROM gameobjects g
LEFT JOIN components c ON g.object_id = c.object_id
WHERE g.is_deleted = 0
GROUP BY g.object_id, g.object_name, g.parent_id;

-- Recent Commands View
CREATE VIEW IF NOT EXISTS recent_commands AS
SELECT
    command_id,
    command_name,
    command_type,
    executed_at,
    executed_by
FROM command_history
ORDER BY executed_at DESC
LIMIT 100;

-- Command Statistics View
CREATE VIEW IF NOT EXISTS command_statistics AS
SELECT
    command_type,
    COUNT(*) AS command_count,
    MIN(executed_at) AS first_executed,
    MAX(executed_at) AS last_executed
FROM command_history
GROUP BY command_type
ORDER BY command_count DESC;

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- 기본 메타데이터 삽입
INSERT OR IGNORE INTO metadata (key, value) VALUES
    ('schema_version', '1'),
    ('database_type', 'SQLite'),
    ('database_created_at', datetime('now')),
    ('unity_editor_toolkit_version', '0.5.0');

-- ============================================================
-- COMPLETION
-- ============================================================

-- SQLite는 RAISE NOTICE가 없으므로 SELECT로 완료 메시지 출력
SELECT '==========================================================' AS message;
SELECT 'Migration 001: Initial Schema (SQLite) - 완료' AS message;
SELECT '==========================================================' AS message;
SELECT '생성된 테이블: 9개' AS message;
SELECT '  - scenes, gameobjects, gameobject_closure, components' AS message;
SELECT '  - transforms, command_history, snapshots, metadata, analytics_cache' AS message;
SELECT '' AS message;
SELECT '생성된 인덱스: 23개' AS message;
SELECT '  - gameobject_closure: 3개 (ancestor, descendant, depth)' AS message;
SELECT '  - command_history: 4개 (GUID, executed_at, type, name, executed_by)' AS message;
SELECT '' AS message;
SELECT '생성된 트리거: 5개' AS message;
SELECT '  - updated_at 자동 업데이트 (gameobjects, components, scenes, metadata)' AS message;
SELECT '  - Closure Table 자동 유지 (gameobject_insert_closure)' AS message;
SELECT '' AS message;
SELECT '생성된 뷰: 4개' AS message;
SELECT '  - active_gameobjects, gameobject_component_count' AS message;
SELECT '  - recent_commands, command_statistics' AS message;
SELECT '' AS message;
SELECT 'Closure Table 계층 구조 쿼리 예시:' AS message;
SELECT '  -- 특정 GameObject의 모든 자식 (ltree 대체):' AS message;
SELECT '  SELECT g.* FROM gameobjects g' AS message;
SELECT '  INNER JOIN gameobject_closure c ON g.object_id = c.descendant_id' AS message;
SELECT '  WHERE c.ancestor_id = ? AND c.depth > 0;' AS message;
SELECT '==========================================================' AS message;
