<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-3 sm:px-4 sm:py-3 flex flex-col gap-2 overflow-hidden"
  >
    <router-link
      :to="`/cancion/${cancion.id}-${(cancion.title || 'sin-titulo')
        .toLowerCase()
        .replace(/ /g, '-')}`"
      class="block"
    >
      <div class="font-semibold text-blue-900 text-base truncate">
        {{ cancion.title || 'Sin título' }}
      </div>
      <div class="text-yellow-700 text-sm font-medium truncate">
        {{ cancion.artist || 'Artista desconocido' }}
      </div>
      <div v-if="cancion.subtitle" class="text-gray-600 text-xs italic truncate">
        {{ cancion.subtitle }}
      </div>
      <div class="flex flex-wrap gap-1 sm:gap-2 mt-1 overflow-x-auto">
        <span
          v-for="tag in normalizedTags"
          :key="tag"
          class="bg-yellow-400 text-blue-900 text-xs font-semibold rounded-full px-2 py-1 sm:px-3 whitespace-nowrap truncate max-w-[90px] sm:max-w-[120px]"
          >{{ tag }}</span
        >
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Cancion } from "@/types/songTypes";
import { normalizeTags } from "@/utils/tags";

const props = defineProps<{
  cancion: Cancion;
}>();

const normalizedTags = computed(() => normalizeTags(props.cancion.tags));
</script>
