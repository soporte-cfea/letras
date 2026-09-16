<template>
  <div v-if="visible" class="song-update-bar" :class="barClass" role="status" aria-live="polite">
    <div class="song-update-bar__text">
      <template v-if="applying">
        <span class="song-update-bar__title">Actualizando canción…</span>
        <span class="song-update-bar__sub">Espere un momento</span>
      </template>
      <template v-else-if="applyError">
        <span class="song-update-bar__title">No se pudo actualizar</span>
        <span class="song-update-bar__sub">{{ applyError }}</span>
      </template>
      <template v-else-if="updateAvailable">
        <span class="song-update-bar__title">Hay una versión nueva</span>
        <span class="song-update-bar__sub">Estás viendo una copia local</span>
      </template>
    </div>
    <div class="song-update-bar__actions">
      <template v-if="applying">
        <span class="song-update-bar__spinner" aria-hidden="true" />
      </template>
      <template v-else-if="applyError">
        <button type="button" class="song-update-bar__btn song-update-bar__btn--primary" @click="$emit('update')">
          Reintentar
        </button>
        <button type="button" class="song-update-bar__btn" @click="$emit('dismiss')">
          Seguir con esta
        </button>
      </template>
      <template v-else-if="updateAvailable">
        <button type="button" class="song-update-bar__btn song-update-bar__btn--primary" @click="$emit('update')">
          Actualizar
        </button>
        <button type="button" class="song-update-bar__btn" @click="$emit('dismiss')">
          Seguir con esta
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  updateAvailable: boolean
  applying: boolean
  applyError: string | null
}>()

defineEmits<{
  update: []
  dismiss: []
}>()

const visible = computed(
  () => props.updateAvailable || props.applying || !!props.applyError
)

const barClass = computed(() => {
  if (props.applying) return 'song-update-bar--busy'
  if (props.applyError) return 'song-update-bar--error'
  return 'song-update-bar--available'
})
</script>

<style scoped>
.song-update-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.song-update-bar--available {
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-background-soft));
  border-bottom-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border));
}

.song-update-bar--busy {
  background: var(--color-background-soft);
}

.song-update-bar--error {
  background: color-mix(in srgb, var(--color-error, #dc2626) 8%, var(--color-background-soft));
  border-bottom-color: color-mix(in srgb, var(--color-error, #dc2626) 30%, var(--color-border));
}

.song-update-bar__text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.song-update-bar__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.song-update-bar__sub {
  font-size: 0.75rem;
  color: var(--color-text-soft);
}

.song-update-bar__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.song-update-bar__btn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 8px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 550;
  cursor: pointer;
  white-space: nowrap;
}

.song-update-bar__btn--primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-text-inverse, #fff);
}

.song-update-bar__btn:focus-visible {
  outline: 2px solid var(--color-border-focus, var(--color-accent));
  outline-offset: 2px;
}

.song-update-bar__spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: song-update-spin 0.7s linear infinite;
}

@keyframes song-update-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .song-update-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .song-update-bar__actions {
    justify-content: stretch;
  }

  .song-update-bar__btn {
    flex: 1;
  }
}
</style>
