-- Migración para sistema de tags híbrido (públicos/privados)
-- Ejecutar este archivo en tu base de datos Supabase

-- 1. Crear tabla de tipos de tags
CREATE TABLE IF NOT EXISTS tag_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_visible_to_others BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de relación user_song_tags
CREATE TABLE IF NOT EXISTS user_song_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL por ahora, se llenará cuando implementes usuarios
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  tag_type_id UUID REFERENCES tag_types(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id, tag_id, tag_type_id)
);

-- 4. Insertar tipos de tags iniciales
INSERT INTO tag_types (name, description, is_visible_to_others) VALUES
('public', 'Etiquetas visibles para todos los usuarios', true),
('private', 'Etiquetas personales del usuario', false)
ON CONFLICT (name) DO NOTHING;

-- 5. Migrar tags existentes desde el campo texto
-- Primero, extraer todos los tags únicos del campo tags en songs
INSERT INTO tags (name)
SELECT DISTINCT TRIM(unnest(string_to_array(tags, ',')))
FROM songs 
WHERE tags IS NOT NULL AND tags != ''
ON CONFLICT (name) DO NOTHING;

-- 6. Crear las relaciones en user_song_tags
INSERT INTO user_song_tags (song_id, tag_id, tag_type_id)
SELECT 
  s.id,
  t.id,
  tt.id
FROM songs s
CROSS JOIN LATERAL unnest(string_to_array(s.tags, ',')) AS tag_name
JOIN tags t ON t.name = TRIM(tag_name)
JOIN tag_types tt ON tt.name = 'public'
WHERE s.tags IS NOT NULL AND s.tags != ''
ON CONFLICT (user_id, song_id, tag_id, tag_type_id) DO NOTHING;

-- 7. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_song_tags_song_id ON user_song_tags(song_id);
CREATE INDEX IF NOT EXISTS idx_user_song_tags_user_id ON user_song_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_song_tags_tag_type_id ON user_song_tags(tag_type_id);
CREATE INDEX IF NOT EXISTS idx_user_song_tags_public ON user_song_tags(song_id, tag_type_id) WHERE tag_type_id = (SELECT id FROM tag_types WHERE name = 'public');

-- 8. Crear función para obtener tags de una canción
CREATE OR REPLACE FUNCTION get_song_tags(p_song_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR(50),
  tag_type_name VARCHAR(50),
  is_visible_to_others BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    tt.name,
    tt.is_visible_to_others
  FROM tags t
  JOIN user_song_tags ust ON t.id = ust.tag_id
  JOIN tag_types tt ON ust.tag_type_id = tt.id
  WHERE ust.song_id = p_song_id 
    AND (tt.is_visible_to_others = true OR ust.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para agregar tag a canción
CREATE OR REPLACE FUNCTION add_tag_to_song(
  p_song_id UUID,
  p_tag_name VARCHAR(50),
  p_tag_type_name VARCHAR(50) DEFAULT 'public',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
  v_tag_type_id UUID;
BEGIN
  -- Crear o obtener tag
  INSERT INTO tags (name) VALUES (p_tag_name)
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_tag_id;
  
  -- Si no se insertó, obtener el existente
  IF v_tag_id IS NULL THEN
    SELECT id INTO v_tag_id FROM tags WHERE name = p_tag_name;
  END IF;
  
  -- Obtener tipo de tag
  SELECT id INTO v_tag_type_id FROM tag_types WHERE name = p_tag_type_name;
  
  -- Crear relación
  INSERT INTO user_song_tags (song_id, tag_id, tag_type_id, user_id)
  VALUES (p_song_id, v_tag_id, v_tag_type_id, p_user_id)
  ON CONFLICT (user_id, song_id, tag_id, tag_type_id) DO NOTHING;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear función para eliminar tag de canción
CREATE OR REPLACE FUNCTION remove_tag_from_song(
  p_song_id UUID,
  p_tag_name VARCHAR(50),
  p_tag_type_name VARCHAR(50) DEFAULT 'public',
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tag_id UUID;
  v_tag_type_id UUID;
BEGIN
  -- Obtener IDs
  SELECT id INTO v_tag_id FROM tags WHERE name = p_tag_name;
  SELECT id INTO v_tag_type_id FROM tag_types WHERE name = p_tag_type_name;
  
  -- Eliminar relación
  DELETE FROM user_song_tags 
  WHERE song_id = p_song_id 
    AND tag_id = v_tag_id 
    AND tag_type_id = v_tag_type_id
    AND (user_id = p_user_id OR (user_id IS NULL AND p_user_id IS NULL));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 11. (OPCIONAL) Eliminar campo tags de songs después de verificar que todo funciona
-- ALTER TABLE songs DROP COLUMN IF EXISTS tags;

-- Verificar migración
SELECT 
  'Tags migrados: ' || COUNT(*) as resultado
FROM user_song_tags ust
JOIN tag_types tt ON ust.tag_type_id = tt.id
WHERE tt.name = 'public';

