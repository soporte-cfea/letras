import { SongsService } from './songs'
import { mockCanciones } from '@/mock/songMocks'
import { addSampleLyrics, checkExistingLyrics } from './addSampleLyrics'

// Función para migrar las canciones mockeadas a Supabase
export async function migrateMockDataToSupabase() {
  console.log('Iniciando migración de datos mock a Supabase...')
  
  try {
    // Obtener canciones existentes de Supabase
    const existingSongs = await SongsService.getSongs()
    console.log(`Canciones existentes en Supabase: ${existingSongs.length}`)
    
    if (existingSongs.length > 0) {
      console.log('Ya hay canciones en Supabase. Saltando migración.')
      return
    }
    
    // Migrar cada canción mock
    for (const mockSong of mockCanciones) {
      try {
        const newSong = {
          title: mockSong.titulo,
          artist: mockSong.autor,
          subtitle: '',
          tempo: '',
          bpm: mockSong.bpm,
          tags: mockSong.tags,
        }
        
        const createdSong = await SongsService.createSong(newSong)
        console.log(`Migrada canción: ${createdSong?.title}`)
        
        // Aquí podrías también crear un documento con la letra
        // usando DocumentsService.createDocument()
        
      } catch (error) {
        console.error(`Error migrando canción ${mockSong.titulo}:`, error)
      }
    }
    
    console.log('Migración completada exitosamente')
  } catch (error) {
    console.error('Error durante la migración:', error)
    throw error
  }
}

// Función para agregar letras de ejemplo a las canciones existentes
export async function addSampleLyricsToExistingSongs() {
  console.log('Verificando letras existentes...')
  
  try {
    const existingLyrics = await checkExistingLyrics()
    
    if (existingLyrics.revelacion && existingLyrics.altoSublime) {
      console.log('Las letras de ejemplo ya existen. Saltando...')
      return
    }
    
    await addSampleLyrics()
    console.log('Letras de ejemplo agregadas exitosamente')
  } catch (error) {
    console.error('Error agregando letras de ejemplo:', error)
    throw error
  }
}

// Función para verificar la conexión con Supabase
export async function testSupabaseConnection() {
  try {
    const songs = await SongsService.getSongs()
    console.log('Conexión con Supabase exitosa')
    console.log(`Canciones encontradas: ${songs.length}`)
    return true
  } catch (error) {
    console.error('Error de conexión con Supabase:', error)
    return false
  }
}
