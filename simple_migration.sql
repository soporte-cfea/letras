-- Migración simple para agregar recursos a las canciones
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE song ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;
