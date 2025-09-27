<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-3 sm:px-4 sm:py-3 flex flex-col gap-2 overflow-hidden"
  >
    <div class="flex justify-between items-start">
      <router-link
        :to="`/cancion/${cancion.id}-${(cancion.title || 'sin-titulo')
          .toLowerCase()
          .replace(/ /g, '-')}`"
        class="flex-1 block"
      >
        <div class="font-semibold text-blue-900 text-base truncate">
          {{ cancion.title || 'Sin título' }}
        </div>
        <div class="text-yellow-700 text-sm font-medium truncate">
          {{ cancion.artist || '' }}
        </div>
        <div v-if="cancion.subtitle" class="text-gray-600 text-xs italic truncate">
          {{ cancion.subtitle }}
        </div>
        <div class="flex flex-wrap gap-1 sm:gap-2 mt-1 overflow-x-auto">
          <!-- Tags del sistema anterior (compatibilidad) -->
          <span
            v-for="tag in normalizedTags"
            :key="`old-${tag}`"
            class="bg-yellow-400 text-blue-900 text-xs font-semibold rounded-full px-2 py-1 sm:px-3 whitespace-nowrap truncate max-w-[90px] sm:max-w-[120px]"
            >{{ tag }}</span
          >
          <!-- Tags del nuevo sistema híbrido -->
          <span
            v-for="userTag in cancion.user_tags"
            :key="`new-${userTag.id}`"
            class="text-xs font-semibold rounded-full px-2 py-1 sm:px-3 whitespace-nowrap truncate max-w-[90px] sm:max-w-[120px]"
            :class="{
              'bg-blue-100 text-blue-800': userTag.tag_type?.name === 'public',
              'bg-amber-100 text-amber-800': userTag.tag_type?.name === 'private'
            }"
          >
            {{ userTag.tag?.name }}
          </span>
        </div>
      </router-link>
      
      <!-- Botones de acción -->
      <div class="flex gap-1 ml-2">
        <button
          @click="$emit('edit', cancion)"
          class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Editar canción"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button
          @click="openTagModal"
          class="p-1 text-gray-400 hover:text-green-600 transition-colors text-sm"
          title="Gestionar etiquetas"
        >
          🏷️
        </button>
        <button
          @click="$emit('delete', cancion)"
          class="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Eliminar canción"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal de etiquetas -->
    <TagModal
      :show="showTagModal"
      :cancion="cancion"
      :user-id="currentUserId"
      @close="closeTagModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Cancion } from "@/types/songTypes";
import { normalizeTags } from "@/utils/tags";
import TagModal from "../TagModal.vue";

const props = defineProps<{
  cancion: Cancion;
}>();

const emit = defineEmits<{
  edit: [cancion: Cancion];
  delete: [cancion: Cancion];
}>();

// Estado del modal de etiquetas
const showTagModal = ref(false);
const currentUserId = ref<string | undefined>('mock-user-1'); // Usuario mock para probar tags privados

const normalizedTags = computed(() => normalizeTags(props.cancion.tags));

// Métodos para manejar el modal
const openTagModal = () => {
  showTagModal.value = true;
};

const closeTagModal = () => {
  showTagModal.value = false;
};
</script>
