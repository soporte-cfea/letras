<template>
  <div
    class="song-card rounded-lg shadow-sm border px-3 py-3 sm:px-4 sm:py-3 flex flex-col gap-2 overflow-hidden theme-transition"
  >
    <div class="flex justify-between items-start">
      <router-link
        :to="`/cancion/${cancion.id}-${(cancion.title || 'sin-titulo')
          .toLowerCase()
          .replace(/ /g, '-')}`"
        class="flex-1 block"
      >
        <div class="song-title text-base truncate">
          {{ cancion.title || 'Sin título' }}
        </div>
        <div class="song-artist text-sm font-medium truncate">
          {{ cancion.artist || '' }}
        </div>
        <div v-if="cancion.subtitle" class="song-subtitle text-xs italic truncate">
          {{ cancion.subtitle }}
        </div>
        <div class="flex flex-wrap gap-1 sm:gap-2 mt-1 overflow-x-auto">
          <!-- Etiquetas generales -->
          <span
            v-for="tag in normalizedTags"
            :key="tag"
            class="song-tag text-xs font-semibold rounded-full px-2 py-1 sm:px-3 whitespace-nowrap truncate max-w-[90px] sm:max-w-[120px]"
            >{{ tag }}</span
          >
          <!-- Etiquetas personales -->
          <span
            v-for="tag in personalTags"
            :key="`personal-${tag}`"
            class="song-tag song-tag-personal text-xs font-semibold rounded-full px-2 py-1 sm:px-3 whitespace-nowrap truncate max-w-[90px] sm:max-w-[120px]"
            >{{ tag }}</span
          >
        </div>
      </router-link>
      
      <!-- Botones de acción -->
      <div class="flex gap-1 ml-2">
        <button
          v-if="canEditSongs"
          @click="$emit('edit', cancion)"
          class="action-btn edit-btn"
          title="Editar canción"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button
          v-if="canDeleteSongs"
          @click="$emit('delete', cancion)"
          class="action-btn delete-btn"
          title="Eliminar canción"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Cancion } from "@/types/songTypes";
import { normalizeTags } from "@/utils/tags";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps<{
  cancion: Cancion;
  personalTags?: string[];
}>();

const emit = defineEmits<{
  edit: [cancion: Cancion];
  delete: [cancion: Cancion];
}>();

const { canEditSongs, canDeleteSongs } = usePermissions();

const normalizedTags = computed(() => normalizeTags(props.cancion.tags));
const personalTags = computed(() => props.personalTags || []);
</script>

<style scoped>
.song-card {
  background: var(--color-background-card);
  border-color: var(--color-border);
  transition: all var(--transition-normal);
}

.song-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.song-title {
  color: var(--color-heading);
  font-weight: 600;
}

.song-artist {
  color: var(--color-accent);
  font-weight: 500;
}

.song-subtitle {
  color: var(--color-text-soft);
}

.song-tag {
  background: var(--color-background-soft);
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
}

.song-tag-personal {
  background: rgba(var(--cf-navy-rgb, 30, 58, 138), 0.1);
  color: var(--cf-navy);
  border: 1px solid rgba(var(--cf-navy-rgb, 30, 58, 138), 0.3);
}

.action-btn {
  padding: 0.25rem;
  color: var(--color-text-mute);
  transition: all var(--transition-normal);
  border-radius: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.action-btn:hover {
  background: var(--color-background-hover);
}

.edit-btn:hover {
  color: var(--color-info);
}

.delete-btn:hover {
  color: var(--color-error);
}
</style>
