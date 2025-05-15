import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Cancion {
  id: string
  titulo: string
  autor: string
  letra: string
  tags: string[]
}

const mockCanciones: Cancion[] = [
  {
    id: '1',
    titulo: 'Cuán grande es Dios',
    autor: 'En Espíritu Y Verdad',
    letra: `Verso 1\nEl esplendor de un rey\nVestido en majestad\nLa tierra alegre está\nLa tierra alegre está\n\nVerso 2\nCubierto está de luz\nVenció la oscuridad\nY tiembla a su voz\nTiembla a su voz\n\nCoro 1\nCuán grande es Dios\nCántale cuán grande es Dios\nY todos lo verán\nCuán grande es Dios\n\nVerso 3\nDía a día él está\nEl tiempo está en él\nPrincipio y el fin\nPrincipio y el fin\n\nVerso 4\nLa trinidad en Dios\nEl Padre Hijo Espíritu\nCordero y el león\nCordero y el león\n\nCoro 1\nCuán grande es Dios\nCántale cuán grande es Dios\nY todos lo verán`,
    tags: ['Adoración', 'I - VI - IV - V', 'Tono C']
  },
  {
    id: '2',
    titulo: 'Bueno es alabar',
    autor: 'Danilo Montero',
    letra: 'Bueno es alabar tu nombre, oh Altísimo... (letra de ejemplo)',
    tags: ['Alabanza', 'Tono G']
  },
  {
    id: '3',
    titulo: 'Celebra victorioso',
    autor: 'Juan Carlos Alvarado',
    letra: 'Celebra victorioso al Señor... (letra de ejemplo)',
    tags: ['Victoria', 'Tono D']
  }
]

export const useCancionesStore = defineStore('canciones', () => {
  const canciones = ref<Cancion[]>(mockCanciones)

  function getCancionById(id: string) {
    return canciones.value.find(c => c.id === id)
  }

  return { canciones, getCancionById }
}) 