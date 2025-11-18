-- Migration 002: Add GUID to GameObject
-- Unity Editor Toolkit - Add persistent GUID column to gameobjects table
-- Created: 2025-11-18
-- Purpose: Replace instance_id with GUID for persistent GameObject identification

-- ============================================================
-- ALTER TABLE: gameobjects
-- Add guid column for persistent identification
-- ============================================================

-- Add guid column (nullable initially for migration)
ALTER TABLE gameobjects ADD COLUMN guid TEXT;

-- Create unique index on guid (after data migration)
-- Note: Index will be created after populating existing rows with GUIDs
-- CREATE UNIQUE INDEX idx_gameobjects_guid ON gameobjects(guid);

-- ============================================================
-- Migration Notes
-- ============================================================
--
-- GUID migration strategy:
-- 1. Add guid column (nullable)
-- 2. Existing rows will have NULL guid
-- 3. SyncManager will generate GUIDs when syncing GameObjects
-- 4. GameObjectGuid component ensures all GameObjects have GUIDs
-- 5. After full scene sync, make guid NOT NULL and UNIQUE
--
-- Future migration (Migration_003):
-- ALTER TABLE gameobjects ALTER COLUMN guid SET NOT NULL;
-- CREATE UNIQUE INDEX idx_gameobjects_guid ON gameobjects(guid);
