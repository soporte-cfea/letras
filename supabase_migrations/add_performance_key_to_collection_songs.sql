-- Tonalidad de ensayo por canción dentro de una lista.
-- No migra etiquetas existentes (list_tags / key: personales); el campo arranca NULL.
ALTER TABLE collection_songs
  ADD COLUMN IF NOT EXISTS performance_key text;

COMMENT ON COLUMN collection_songs.performance_key IS
  'Tonalidad de ensayo para esta canción en esta lista (ej. C, Am, F#). Nullable.';
