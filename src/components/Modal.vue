<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 p-6 relative animate-fade-in">
      <button @click="$emit('close')" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold">&times;</button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.18s;
}
</style>

<script lang="ts">
export default {
  name: 'Modal'
}
</script> 