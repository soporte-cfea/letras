-- Añadir slug a collections para URLs por nombre (ej. /v/coros-dios-esta)
-- Complementa share_code: ambas formas de URL funcionan

ALTER TABLE collections
ADD COLUMN IF NOT EXISTS slug VARCHAR(120) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug
ON collections(slug)
WHERE slug IS NOT NULL;

COMMENT ON COLUMN collections.slug IS 'Slug para URL por nombre (ej. coros-dios-esta). Único por colección.';
