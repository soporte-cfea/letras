<template>
  <div class="tiptap-test-view">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Prueba de TipTap Editor</h1>
        <p class="text-gray-600">Explora diferentes configuraciones y modos de uso del editor de texto enriquecido</p>
      </header>

      <!-- Tabs para diferentes ejemplos -->
      <div class="mb-6">
        <div class="flex gap-2 border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Contenido de cada tab -->
      <div class="space-y-8">
        <!-- Tab 1: Editor básico con toolbar -->
        <div v-if="activeTab === 'basic'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Editor básico con barra de herramientas</h2>
            <p class="text-gray-600 mb-4">Editor completo con todas las herramientas de formato disponibles.</p>
            <RichTextEditorWithToolbar
              v-model="content1"
              placeholder="Escribe tu análisis aquí..."
              min-height="300px"
            />
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Contenido HTML generado:</h3>
              <pre class="text-xs overflow-x-auto">{{ content1 || '(vacío)' }}</pre>
            </div>
          </div>
        </div>

        <!-- Tab 2: Editor avanzado -->
        <div v-if="activeTab === 'advanced'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Editor Avanzado</h2>
            <p class="text-gray-600 mb-4">Editor con todas las funcionalidades avanzadas: tablas, imágenes, alineación de texto, listas de tareas y más.</p>
            <RichTextEditorAdvanced
              v-model="contentAdvanced"
              placeholder="Escribe tu análisis avanzado aquí..."
              min-height="400px"
            />
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Características avanzadas incluidas:</h3>
              <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Tablas editables (agregar/eliminar filas y columnas)</li>
                <li>Imágenes desde URL</li>
                <li>Alineación de texto (izquierda, centro, derecha, justificar)</li>
                <li>Listas de tareas (checkboxes)</li>
                <li>Todas las características del editor básico</li>
              </ul>
            </div>
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Contenido HTML generado:</h3>
              <pre class="text-xs overflow-x-auto max-h-60 overflow-y-auto">{{ contentAdvanced || '(vacío)' }}</pre>
            </div>
          </div>
        </div>

        <!-- Tab 3: Editor sin toolbar (solo atajos de teclado) -->
        <div v-if="activeTab === 'minimal'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Editor minimalista (sin toolbar)</h2>
            <p class="text-gray-600 mb-4">Editor sin barra de herramientas. Usa atajos de teclado para formatear.</p>
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>Atajos de teclado:</strong> Ctrl+B (negrita), Ctrl+I (cursiva), Ctrl+U (subrayado), 
                Ctrl+K (enlace), Ctrl+Shift+X (tachado)
              </p>
            </div>
            <RichTextEditor
              v-model="content2"
              placeholder="Escribe aquí... (usa atajos de teclado para formatear)"
              min-height="300px"
            />
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Contenido HTML generado:</h3>
              <pre class="text-xs overflow-x-auto">{{ content2 || '(vacío)' }}</pre>
            </div>
          </div>
        </div>

        <!-- Tab 3: Editor de solo lectura -->
        <div v-if="activeTab === 'readonly'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Vista de solo lectura</h2>
            <p class="text-gray-600 mb-4">Editor en modo de solo lectura para mostrar contenido formateado.</p>
            <RichTextEditor
              v-model="readonlyContent"
              :editable="!readonlyMode"
              min-height="200px"
            />
            <div class="mt-4">
              <button
                @click="toggleReadonly"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {{ readonlyMode ? 'Habilitar edición' : 'Deshabilitar edición' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 4: Editor compacto -->
        <div v-if="activeTab === 'compact'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Editor compacto</h2>
            <p class="text-gray-600 mb-4">Editor con altura mínima para espacios reducidos.</p>
            <RichTextEditorWithToolbar
              v-model="content3"
              placeholder="Análisis breve..."
              min-height="150px"
            />
          </div>
        </div>

        <!-- Tab 5: Comparación de configuraciones -->
        <div v-if="activeTab === 'compare'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Comparación lado a lado</h2>
            <p class="text-gray-600 mb-4">Compara diferentes configuraciones del editor.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold mb-2">Con Toolbar</h3>
                <RichTextEditorWithToolbar
                  v-model="content4"
                  placeholder="Editor con toolbar..."
                  min-height="250px"
                />
              </div>
              <div>
                <h3 class="font-semibold mb-2">Sin Toolbar</h3>
                <RichTextEditor
                  v-model="content5"
                  placeholder="Editor sin toolbar..."
                  min-height="250px"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 6: Ejemplo de análisis de canción -->
        <div v-if="activeTab === 'example'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Ejemplo: Análisis de canción</h2>
            <p class="text-gray-600 mb-4">Ejemplo práctico de cómo se vería el análisis de una canción.</p>
            <RichTextEditorWithToolbar
              v-model="songAnalysisExample"
              placeholder="Escribe tu análisis de la canción aquí..."
              min-height="400px"
            />
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold mb-2">Vista previa del análisis:</h3>
              <div 
                class="prose max-w-none p-4 bg-white rounded border"
                v-html="songAnalysisExample"
              ></div>
            </div>
          </div>
        </div>

        <!-- Tab 7: Información y documentación -->
        <div v-if="activeTab === 'info'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-4">Información y características</h2>
            
            <div class="space-y-6">
              <div class="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Características disponibles</h3>
                <ul class="space-y-2 text-gray-700">
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Formato de texto:</strong> Negrita, cursiva, subrayado, tachado, resaltado</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Encabezados:</strong> H1, H2, H3, H4, H5, H6</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Listas:</strong> Con viñetas y numeradas</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Enlaces:</strong> Insertar y editar hipervínculos</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Citas:</strong> Bloques de cita</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Código:</strong> Inline y bloques de código</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-green-500 mr-2">✓</span>
                    <span><strong>Deshacer/Rehacer:</strong> Historial de cambios</span>
                  </li>
                </ul>
              </div>

              <div class="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Atajos de teclado</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">B</kbd> - Negrita</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">I</kbd> - Cursiva</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">U</kbd> - Subrayado</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">K</kbd> - Enlace</p>
                  </div>
                  <div>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">Shift</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">X</kbd> - Tachado</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">Z</kbd> - Deshacer</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">Y</kbd> - Rehacer</p>
                    <p><kbd class="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">Shift</kbd> + <kbd class="px-2 py-1 bg-gray-100 rounded">K</kbd> - Código</p>
                  </div>
                </div>
              </div>

              <div class="p-6 bg-white border border-gray-200 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Modos de uso</h3>
                <ul class="space-y-3 text-gray-700">
                  <li>
                    <strong>Con Toolbar:</strong> Ideal para usuarios que prefieren botones visibles para formatear texto.
                    Usa el componente <code class="px-1 py-0.5 bg-gray-100 rounded">RichTextEditorWithToolbar</code>.
                  </li>
                  <li>
                    <strong>Sin Toolbar:</strong> Ideal para usuarios avanzados que prefieren atajos de teclado.
                    Usa el componente <code class="px-1 py-0.5 bg-gray-100 rounded">RichTextEditor</code>.
                  </li>
                  <li>
                    <strong>Solo lectura:</strong> Para mostrar contenido formateado sin permitir edición.
                    Pasa la prop <code class="px-1 py-0.5 bg-gray-100 rounded">editable="false"</code>.
                  </li>
                </ul>
              </div>

              <div class="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 class="text-lg font-semibold mb-3 text-blue-900">Próximos pasos</h3>
                <p class="text-blue-800 mb-2">
                  Una vez que decidas la configuración que mejor se adapte a tus necesidades:
                </p>
                <ol class="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Integra el editor en el formulario de edición de canciones</li>
                  <li>Guarda el contenido HTML en la base de datos</li>
                  <li>Muestra el contenido formateado en la vista de detalle</li>
                  <li>Personaliza los estilos según tu diseño</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import RichTextEditorWithToolbar from '@/components/common/RichTextEditorWithToolbar.vue'
import RichTextEditorAdvanced from '@/components/common/RichTextEditorAdvanced.vue'

const activeTab = ref('basic')

const tabs = [
  { id: 'basic', label: 'Básico con Toolbar' },
  { id: 'advanced', label: 'Avanzado' },
  { id: 'minimal', label: 'Minimalista' },
  { id: 'readonly', label: 'Solo Lectura' },
  { id: 'compact', label: 'Compacto' },
  { id: 'compare', label: 'Comparar' },
  { id: 'example', label: 'Ejemplo Práctico' },
  { id: 'info', label: 'Información' }
]

// Contenido para cada ejemplo
const content1 = ref('')
const contentAdvanced = ref('')
const content2 = ref('')
const content3 = ref('')
const content4 = ref('')
const content5 = ref('')
const readonlyContent = ref(`
  <h2>Ejemplo de contenido formateado</h2>
  <p>Este es un <strong>texto en negrita</strong> y este es un <em>texto en cursiva</em>.</p>
  <p>También puedes usar <u>subrayado</u> y <s>tachado</s>.</p>
  <ul>
    <li>Lista con viñetas</li>
    <li>Otro elemento</li>
  </ul>
  <blockquote>
    <p>Esta es una cita importante sobre la canción.</p>
  </blockquote>
  <p>Puedes agregar <a href="https://example.com">enlaces</a> también.</p>
`)
const readonlyMode = ref(true)
const songAnalysisExample = ref(`
  <h2>Análisis de "Nombre de la Canción"</h2>
  
  <h3>Contexto</h3>
  <p>Esta canción fue escrita en <strong>2020</strong> durante un momento muy especial...</p>
  
  <h3>Mensaje Principal</h3>
  <p>El mensaje central de la canción habla sobre <em>la esperanza y la fe</em> en tiempos difíciles.</p>
  
  <h3>Elementos Musicales</h3>
  <ul>
    <li>Tempo: 120 BPM</li>
    <li>Compás: 4/4</li>
    <li>Clave: Mayor</li>
  </ul>
  
  <h3>Reflexión</h3>
  <blockquote>
    <p>"Esta canción nos recuerda que siempre hay luz al final del túnel"</p>
  </blockquote>
  
  <p>Para más información, visita <a href="https://example.com">este enlace</a>.</p>
`)

function toggleReadonly() {
  readonlyMode.value = !readonlyMode.value
}
</script>

<style scoped>
.tiptap-test-view {
  min-height: 100vh;
  background: #f9fafb;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
}
</style>

