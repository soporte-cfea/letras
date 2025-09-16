<template>
  <section class="w-full min-h-screen bg-white pb-16 sm:pb-24">
    <div class="sm:px-4 sm:pt-6 sm:pb-2">
      <h2 class="text-xl font-semibold text-blue-900 mb-3 sm:mb-4">Canciones</h2>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Buscar canciones, artistas, tags..."
        class="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base mb-2 sm:mb-3 shadow-sm"
      />
      <div class="flex flex-col sm:flex-row gap-1 sm:gap-4 mb-1 sm:mb-2">
        <div class="flex items-center gap-1 sm:gap-2">
          <label class="text-sm text-blue-900 font-medium">Artista:</label>
          <select
            v-model="selectedArtist"
            class="rounded px-1 py-1 sm:px-2 border border-gray-200 text-sm focus:outline-none"
          >
            <option value="">Todos</option>
            <option v-for="artist in artistas" :key="artist" :value="artist">
              {{ artist }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-1 sm:gap-2">
          <label class="text-sm text-blue-900 font-medium">Tags:</label>
          <select
            v-model="selectedTag"
            class="rounded px-1 py-1 sm:px-2 border border-gray-200 text-sm focus:outline-none"
          >
            <option value="">Todos</option>
            <option v-for="tag in tags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div class="px-1 sm:px-4">
      <!-- Estado de carga -->
      <div
        v-if="loading"
        class="text-center text-gray-500 py-8 sm:py-12 text-base"
      >
        Cargando canciones...
      </div>
      
      <!-- Estado de error -->
      <div
        v-else-if="error"
        class="text-center text-red-500 py-8 sm:py-12 text-base"
      >
        Error: {{ error }}
      </div>
      
      <!-- Sin resultados -->
      <div
        v-else-if="filteredCanciones.length === 0"
        class="text-center text-gray-500 py-8 sm:py-12 text-base"
      >
        No se encontraron resultados
      </div>
      
      <!-- Lista de canciones -->
      <ul v-else class="flex flex-col gap-3 sm:gap-3">
        <SongCard v-for="cancion in filteredCanciones" :key="cancion.id" :cancion="cancion" />
      </ul>
    </div>

    <!-- Botón flotante para agregar canción -->
    <button
      @click="showAddModal = true"
      class="fixed bottom-20 right-2 sm:bottom-24 sm:right-4 bg-yellow-400 text-blue-900 rounded-full shadow-lg w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-3xl font-bold hover:bg-yellow-300 focus:outline-none z-40"
    >
      <span>+</span>
      <span class="sr-only">Agregar canción</span>
    </button>

    <!-- Modal para agregar canción -->
    <Modal :show="showAddModal" @close="closeAddModal">
      <h3 class="text-lg font-bold text-blue-900 mb-3 sm:mb-4">
        Agregar nueva canción
      </h3>
      <form @submit.prevent="agregarCancion" class="flex flex-col gap-2 sm:gap-3">
        <input
          v-model="form.titulo"
          type="text"
          placeholder="Título"
          class="px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <input
          v-model="form.autor"
          type="text"
          placeholder="Autor"
          class="px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
          required
        />
        <div class="relative">
          <textarea
            v-model="form.letra"
            placeholder="Letra"
            rows="4"
            class="px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none w-full"
            required
          ></textarea>
          <button
            type="button"
            @click="showLetraFull = true"
            class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Pantalla completa
          </button>
        </div>
        <input
          v-model="form.tags"
          type="text"
          placeholder="Tags (separados por coma)"
          class="px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base"
        />
        <div class="flex gap-1 sm:gap-2 mt-2">
          <button
            type="submit"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar
          </button>
          <button
            type="button"
            @click="closeAddModal"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>

    <!-- Overlay de edición de letra en pantalla completa -->
    <div
      v-if="showLetraFull"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-1 sm:mx-2 p-2 sm:p-4 flex flex-col h-[90vh]"
      >
        <div class="flex justify-between items-center mb-1 sm:mb-2">
          <h4 class="text-lg font-bold text-blue-900">Editar letra</h4>
          <button
            @click="showLetraFull = false"
            class="text-gray-400 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <textarea
          v-model="form.letra"
          class="flex-1 w-full px-2 py-2 sm:px-3 rounded border border-gray-200 focus:ring-2 focus:ring-blue-300 text-base resize-none mb-2 sm:mb-3"
          style="min-height: 160px; max-height: 100%"
        ></textarea>
        <div class="flex gap-1 sm:gap-2">
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-blue-900 text-white rounded py-2 font-semibold hover:bg-blue-800 transition"
          >
            Guardar y volver
          </button>
          <button
            @click="showLetraFull = false"
            class="flex-1 bg-gray-200 text-gray-700 rounded py-2 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useCancionesStore } from "../stores/canciones";
import { storeToRefs } from "pinia";
import { useNotifications } from '@/composables/useNotifications';
import Modal from "../components/Modal.vue";
import SongCard from "@/components/common/SongCard.vue";

const cancionesStore = useCancionesStore();
const { canciones, loading, error, artistas, tags } = storeToRefs(cancionesStore);
const { success, error: showError } = useNotifications();

const searchQuery = ref("");
const selectedArtist = ref("");
const selectedTag = ref("");

const showAddModal = ref(false);
const showLetraFull = ref(false);

const form = ref({
  titulo: "",
  autor: "",
  letra: "",
  tags: "",
});

// Cargar canciones al montar el componente
onMounted(async () => {
  await cancionesStore.loadCanciones();
});

function closeAddModal() {
  showAddModal.value = false;
  form.value = { titulo: "", autor: "", letra: "", tags: "" };
}

async function agregarCancion() {
  if (
    !form.value.titulo.trim() ||
    !form.value.autor.trim() ||
    !form.value.letra.trim()
  )
    return;

  try {
    const newSong = {
      title: form.value.titulo.trim(),
      artist: form.value.autor.trim(),
      subtitle: "",
      tempo: "",
      bpm: 120,
      tags: form.value.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const createdSong = await cancionesStore.addCancion(newSong);
    
    // Si se creó la canción exitosamente y hay letra, crear el documento
    if (createdSong && form.value.letra.trim()) {
      try {
        await cancionesStore.createSongLyrics(
          createdSong.id, 
          form.value.letra.trim(),
          `Letra de ${createdSong.title}`
        );
      } catch (lyricsErr) {
        console.error('Error al crear la letra:', lyricsErr);
        showError('Error', 'Canción creada pero no se pudo guardar la letra');
      }
    }
    
    success('Éxito', `Canción "${createdSong.title}" agregada correctamente`);
    closeAddModal();
  } catch (err) {
    console.error('Error al agregar canción:', err);
    showError('Error', 'No se pudo agregar la canción. Inténtalo de nuevo.');
  }
}

const filteredCanciones = computed(() => {
  return cancionesStore.filterCanciones(
    searchQuery.value,
    selectedArtist.value,
    selectedTag.value
  );
});
</script>