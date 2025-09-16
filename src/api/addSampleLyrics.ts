import { DocumentsService } from './songs'

// Función para agregar letras de ejemplo a las canciones existentes
export async function addSampleLyrics() {
  console.log('Agregando letras de ejemplo...')
  
  try {
    // Letra de ejemplo para "Revelación" (ID: 2)
    const revelacionLyrics = `Verso 1
Revelación de tu gloria
Manifiesto tu poder
En tu presencia hay victoria
Y en tu amor hay que vencer

Coro
Revelación, revelación
De tu gloria y tu poder
Revelación, revelación
En tu presencia quiero estar

Verso 2
Tu luz brilla en las tinieblas
Tu amor nunca fallará
En las pruebas y las penas
Tu presencia me guiará

Coro
Revelación, revelación
De tu gloria y tu poder
Revelación, revelación
En tu presencia quiero estar

Puente
Santo, santo, santo es el Señor
Digno de toda adoración
Santo, santo, santo es el Señor
Digno de toda adoración`

    await DocumentsService.createDocument({
      song_id: '2',
      body: revelacionLyrics,
      doc_type: 'lyrics',
      description: 'Letra de Revelación - Danilo Montero'
    })
    
    console.log('Letra agregada para "Revelación"')
    
    // Letra de ejemplo para "A el alto y sublime" (ID: 1)
    const altoSublimeLyrics = `Verso 1
A el alto y sublime
Que habita la eternidad
Y cuyo nombre es Santo
Yo le alabaré

Coro
Santo, santo, santo
Es el Señor Dios todopoderoso
Santo, santo, santo
Es el Señor Dios todopoderoso

Verso 2
Lleno está el cielo y la tierra
De tu gloria y majestad
Los ángeles te adoran
Y yo también te adoraré

Coro
Santo, santo, santo
Es el Señor Dios todopoderoso
Santo, santo, santo
Es el Señor Dios todopoderoso

Puente
Digno eres de recibir
Gloria, honor y poder
Digno eres de recibir
Gloria, honor y poder`

    await DocumentsService.createDocument({
      song_id: '1',
      body: altoSublimeLyrics,
      doc_type: 'lyrics',
      description: 'Letra de A el alto y sublime'
    })
    
    console.log('Letra agregada para "A el alto y sublime"')
    console.log('Letras de ejemplo agregadas exitosamente')
    
  } catch (error) {
    console.error('Error agregando letras de ejemplo:', error)
    throw error
  }
}

// Función para verificar si ya existen letras
export async function checkExistingLyrics() {
  try {
    const revelacionDocs = await DocumentsService.getDocumentsBySongId('2')
    const altoSublimeDocs = await DocumentsService.getDocumentsBySongId('1')
    
    console.log('Documentos para "Revelación" (ID: 2):', revelacionDocs.length)
    console.log('Documentos para "A el alto y sublime" (ID: 1):', altoSublimeDocs.length)
    
    return {
      revelacion: revelacionDocs.length > 0,
      altoSublime: altoSublimeDocs.length > 0
    }
  } catch (error) {
    console.error('Error verificando letras existentes:', error)
    return { revelacion: false, altoSublime: false }
  }
}
