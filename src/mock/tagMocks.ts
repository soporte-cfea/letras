import type { Tag, TagType, UserSongTag } from '@/types/songTypes'

// Mock de tipos de tags
export const mockTagTypes: TagType[] = [
  {
    id: '1',
    name: 'public',
    description: 'Etiquetas visibles para todos los usuarios',
    is_visible_to_others: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'private',
    description: 'Etiquetas personales del usuario',
    is_visible_to_others: false,
    created_at: '2024-01-01T00:00:00Z'
  }
]

// Mock de tags disponibles
export const mockTags: Tag[] = [
  { id: '1', name: 'rock', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'pop', created_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'acústico', created_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'favorita', created_at: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'triste', created_at: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'energético', created_at: '2024-01-01T00:00:00Z' },
  { id: '7', name: 'clásica', created_at: '2024-01-01T00:00:00Z' },
  { id: '8', name: 'moderna', created_at: '2024-01-01T00:00:00Z' },
  { id: '9', name: 'romántica', created_at: '2024-01-01T00:00:00Z' },
  { id: '10', name: 'nostálgica', created_at: '2024-01-01T00:00:00Z' }
]

// Mock de relaciones usuario-canción-tag
export const mockUserSongTags: UserSongTag[] = [
  // Tags públicos para canción 1
  {
    id: '1',
    user_id: undefined,
    song_id: '1',
    tag_id: '1',
    tag_type_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tag: mockTags[0], // rock
    tag_type: mockTagTypes[0] // public
  },
  {
    id: '2',
    user_id: undefined,
    song_id: '1',
    tag_id: '3',
    tag_type_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tag: mockTags[2], // acústico
    tag_type: mockTagTypes[0] // public
  },
  // Tags privados para canción 1 (usuario mock)
  {
    id: '3',
    user_id: 'mock-user-1',
    song_id: '1',
    tag_id: '4',
    tag_type_id: '2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tag: mockTags[3], // favorita
    tag_type: mockTagTypes[1] // private
  },
  // Tags públicos para canción 2
  {
    id: '4',
    user_id: undefined,
    song_id: '2',
    tag_id: '2',
    tag_type_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tag: mockTags[1], // pop
    tag_type: mockTagTypes[0] // public
  },
  {
    id: '5',
    user_id: undefined,
    song_id: '2',
    tag_id: '9',
    tag_type_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tag: mockTags[8], // romántica
    tag_type: mockTagTypes[0] // public
  }
]

// Función para simular delay de red
const simulateNetworkDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Función para generar ID único
const generateId = () => Math.random().toString(36).substr(2, 9)

// Mock de funciones de API
export const mockTagAPI = {
  // Obtener tags de una canción
  async getSongTags(songId: string, userId?: string): Promise<UserSongTag[]> {
    await simulateNetworkDelay()
    
    return mockUserSongTags.filter(ust => {
      const isForThisSong = ust.song_id === songId
      const isPublic = ust.tag_type?.name === 'public'
      const isUserPrivate = ust.tag_type?.name === 'private' && ust.user_id === userId
      
      return isForThisSong && (isPublic || isUserPrivate)
    })
  },

  // Obtener solo tags públicos
  async getPublicSongTags(songId: string): Promise<UserSongTag[]> {
    await simulateNetworkDelay()
    
    return mockUserSongTags.filter(ust => 
      ust.song_id === songId && ust.tag_type?.name === 'public'
    )
  },

  // Obtener solo tags privados
  async getPrivateSongTags(songId: string, userId: string): Promise<UserSongTag[]> {
    await simulateNetworkDelay()
    
    return mockUserSongTags.filter(ust => 
      ust.song_id === songId && 
      ust.user_id === userId && 
      ust.tag_type?.name === 'private'
    )
  },

  // Agregar tag a canción
  async addTagToSong(
    songId: string, 
    tagName: string, 
    tagType: 'public' | 'private' = 'public',
    userId?: string
  ): Promise<boolean> {
    await simulateNetworkDelay()
    
    // Buscar o crear tag
    let tag = mockTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
    if (!tag) {
      tag = {
        id: generateId(),
        name: tagName,
        created_at: new Date().toISOString()
      }
      mockTags.push(tag)
    }
    
    // Verificar si ya existe la relación
    const existingRelation = mockUserSongTags.find(ust => 
      ust.song_id === songId && 
      ust.tag_id === tag.id && 
      ust.tag_type?.name === tagType &&
      ust.user_id === (tagType === 'private' ? userId : undefined)
    )
    
    if (existingRelation) {
      return false // Ya existe
    }
    
    // Crear nueva relación
    const tagTypeData = mockTagTypes.find(tt => tt.name === tagType)
    if (!tagTypeData) return false
    
    const newUserSongTag: UserSongTag = {
      id: generateId(),
      user_id: tagType === 'private' ? userId : undefined,
      song_id: songId,
      tag_id: tag.id,
      tag_type_id: tagTypeData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tag: tag,
      tag_type: tagTypeData
    }
    
    mockUserSongTags.push(newUserSongTag)
    return true
  },

  // Eliminar tag de canción
  async removeTagFromSong(
    songId: string,
    tagName: string,
    tagType: 'public' | 'private' = 'public',
    userId?: string
  ): Promise<boolean> {
    await simulateNetworkDelay()
    
    const tag = mockTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
    if (!tag) return false
    
    const index = mockUserSongTags.findIndex(ust => 
      ust.song_id === songId && 
      ust.tag_id === tag.id && 
      ust.tag_type?.name === tagType &&
      ust.user_id === (tagType === 'private' ? userId : undefined)
    )
    
    if (index === -1) return false
    
    mockUserSongTags.splice(index, 1)
    return true
  },

  // Obtener todos los tags
  async getAllTags(): Promise<Tag[]> {
    await simulateNetworkDelay()
    return [...mockTags]
  },

  // Obtener tipos de tags
  async getTagTypes(): Promise<TagType[]> {
    await simulateNetworkDelay()
    return [...mockTagTypes]
  }
}

