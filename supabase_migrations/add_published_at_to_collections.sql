-- Publicación de listas: borrador (published_at IS NULL) vs publicada.
-- Las listas existentes se marcan como publicadas para no ocultarlas.
-- Las nuevas nacen como borrador.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'collections'
      AND column_name = 'published_at'
  ) THEN
    ALTER TABLE collections
      ADD COLUMN published_at timestamptz;

    UPDATE collections
    SET published_at = COALESCE(created_at, now())
    WHERE published_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collections_published_visible
  ON collections (published_at)
  WHERE published_at IS NOT NULL;

COMMENT ON COLUMN collections.published_at IS
  'Fecha de publicación. NULL = borrador (solo visible para quien puede gestionar listas). Una fecha futura programa la publicación.';

-- Quién puede ver/editar borradores (rol admin / super_admin o permiso create:lists en el JWT).
CREATE OR REPLACE FUNCTION public.can_manage_lists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR COALESCE(auth.jwt() -> 'user_metadata' -> 'permissions', '[]'::jsonb) ? 'create:lists'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR COALESCE(auth.jwt() -> 'app_metadata' -> 'permissions', '[]'::jsonb) ? 'create:lists',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_lists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_lists() TO anon, authenticated;

-- Visibilidad de la lista: publicada (ahora o antes) o el usuario puede gestionar listas.
CREATE OR REPLACE FUNCTION public.collection_is_visible(p_collection_id collections.id%TYPE)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_lists()
    OR EXISTS (
      SELECT 1
      FROM collections c
      WHERE c.id = p_collection_id
        AND c.published_at IS NOT NULL
        AND c.published_at <= now()
    );
$$;

REVOKE ALL ON FUNCTION public.collection_is_visible FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.collection_is_visible TO anon, authenticated;

-- RLS: si ya había una política de SELECT abierta para todos, hay que quitarla
-- para que los borradores no se filtren. Se eliminan nombres habituales de Supabase.
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON collections;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON collections;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON collections;

DROP POLICY IF EXISTS "Published collections are visible" ON collections;
DROP POLICY IF EXISTS "List editors can view all collections" ON collections;
DROP POLICY IF EXISTS "List editors can insert collections" ON collections;
DROP POLICY IF EXISTS "List editors can update collections" ON collections;
DROP POLICY IF EXISTS "List editors can delete collections" ON collections;

CREATE POLICY "Published collections are visible"
  ON collections
  FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "List editors can view all collections"
  ON collections
  FOR SELECT
  USING (public.can_manage_lists());

CREATE POLICY "List editors can insert collections"
  ON collections
  FOR INSERT
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can update collections"
  ON collections
  FOR UPDATE
  USING (public.can_manage_lists())
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can delete collections"
  ON collections
  FOR DELETE
  USING (public.can_manage_lists());

DROP POLICY IF EXISTS "Enable read access for all users" ON collection_songs;
DROP POLICY IF EXISTS "Collection songs visible with parent" ON collection_songs;
DROP POLICY IF EXISTS "List editors can insert collection songs" ON collection_songs;
DROP POLICY IF EXISTS "List editors can update collection songs" ON collection_songs;
DROP POLICY IF EXISTS "List editors can delete collection songs" ON collection_songs;

CREATE POLICY "Collection songs visible with parent"
  ON collection_songs
  FOR SELECT
  USING (public.collection_is_visible(collection_id));

CREATE POLICY "List editors can insert collection songs"
  ON collection_songs
  FOR INSERT
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can update collection songs"
  ON collection_songs
  FOR UPDATE
  USING (public.can_manage_lists())
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can delete collection songs"
  ON collection_songs
  FOR DELETE
  USING (public.can_manage_lists());

DROP POLICY IF EXISTS "Enable read access for all users" ON collection_sections;
DROP POLICY IF EXISTS "Collection sections visible with parent" ON collection_sections;
DROP POLICY IF EXISTS "List editors can insert collection sections" ON collection_sections;
DROP POLICY IF EXISTS "List editors can update collection sections" ON collection_sections;
DROP POLICY IF EXISTS "List editors can delete collection sections" ON collection_sections;

CREATE POLICY "Collection sections visible with parent"
  ON collection_sections
  FOR SELECT
  USING (public.collection_is_visible(collection_id));

CREATE POLICY "List editors can insert collection sections"
  ON collection_sections
  FOR INSERT
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can update collection sections"
  ON collection_sections
  FOR UPDATE
  USING (public.can_manage_lists())
  WITH CHECK (public.can_manage_lists());

CREATE POLICY "List editors can delete collection sections"
  ON collection_sections
  FOR DELETE
  USING (public.can_manage_lists());
