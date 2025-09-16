// Utilidades para manejar datos de Supabase

export function sanitizeSongData(song: any) {
  return {
    id: song.id?.toString() || '',
    title: song.title || 'Sin título',
    artist: song.artist || 'Artista desconocido',
    subtitle: song.subtitle || '',
    tempo: song.tempo || '',
    bpm: song.bpm || null,
    tags: song.tags || [],
    created_at: song.created_at || null,
    update_at: song.update_at || null,
  };
}

export function sanitizeDocumentData(document: any) {
  return {
    id: document.id?.toString() || '',
    song_id: document.song_id?.toString() || '',
    body: document.body || '',
    doc_type: document.doc_type || '',
    description: document.description || '',
    created_at: document.created_at || null,
    update_at: document.update_at || null,
  };
}
