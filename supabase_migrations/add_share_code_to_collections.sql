-- Añadir share_code a collections para URLs cortas al compartir
-- Permite enlaces como /v/abc12xy en lugar de /v/uuid-completo

ALTER TABLE collections
ADD COLUMN IF NOT EXISTS share_code VARCHAR(10) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_share_code
ON collections(share_code)
WHERE share_code IS NOT NULL;

COMMENT ON COLUMN collections.share_code IS 'Código corto para URLs compartidas (ej. abc12xy). Generado al compartir.';
