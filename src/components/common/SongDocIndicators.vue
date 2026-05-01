<template>
  <div
    class="doc-indicators-root"
    :class="[
      `doc-indicators-root--${mode}`,
      { 'doc-indicators-root--loading': loading }
    ]"
    role="group"
    :aria-label="ariaLabel"
    @click.stop
  >
    <template v-for="def in defs" :key="def.key">
      <TouchHint
        v-if="touchHintWrap(def)"
        :message="HINT_EMPTY[def.key]"
      >
        <button
          type="button"
          class="doc-icon"
          :class="[`doc-icon--${def.key}`, { 'doc-icon--on': isOn(def.key) }]"
          :title="iconTitle(def)"
        >
          <svg
            class="doc-icon-svg"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="def.path"
            />
          </svg>
        </button>
      </TouchHint>
      <button
        v-else
        type="button"
        class="doc-icon"
        :class="[`doc-icon--${def.key}`, { 'doc-icon--on': isOn(def.key) }]"
        :title="iconTitle(def)"
        :disabled="!interactive"
        :aria-disabled="!interactive"
        @click.stop="onIconClick(def.key)"
      >
        <svg
          class="doc-icon-svg"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            :d="def.path"
          />
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SongDocumentPresence } from '@/types/songTypes';
import TouchHint from './TouchHint.vue';

export type DocIndicatorSection = keyof SongDocumentPresence;

const props = withDefaults(
  defineProps<{
    /** En filas: estado por canción. En modo legend puede omitirse. */
    presence?: SongDocumentPresence | null;
    loading?: boolean;
    /** legend = cabecera de tabla (iconos con color de tipo); values = fila o tarjeta */
    mode?: 'legend' | 'values';
    /** Tamaño del icono en px (aprox.) */
    iconSize?: number;
    /** Si true, cada icono emite select al hacer clic (solo tiene sentido en mode values). */
    interactive?: boolean;
  }>(),
  {
    presence: null,
    loading: false,
    mode: 'values',
    iconSize: 14,
    interactive: false
  }
);

const emit = defineEmits<{
  select: [section: DocIndicatorSection];
}>();

const HINT_EMPTY: Record<DocIndicatorSection, string> = {
  lyrics: 'Aún no hay letra',
  chords: 'Aún no hay acordes',
  analysis: 'Aún no hay análisis'
};

const HINT_VIEW: Record<DocIndicatorSection, string> = {
  lyrics: 'Ver letra',
  chords: 'Ver acordes',
  analysis: 'Ver análisis'
};

const defs = [
  {
    key: 'lyrics' as const,
    title: 'Letra',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    key: 'chords' as const,
    title: 'Acordes',
    path: 'M9 19V9l10-2v10M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm10-2c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z'
  },
  {
    key: 'analysis' as const,
    title: 'Análisis',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  }
];

const ariaLabel = computed(() =>
  props.mode === 'legend'
    ? 'Tipos de contenido: letra, acordes, análisis'
    : 'Estado de contenido: letra, acordes, análisis'
);

function isOn(key: keyof SongDocumentPresence): boolean {
  if (props.mode === 'legend') return false;
  return Boolean(props.presence?.[key]);
}

function iconTitle(def: (typeof defs)[number]): string {
  if (props.mode === 'legend') {
    return def.title;
  }
  return isOn(def.key) ? HINT_VIEW[def.key] : HINT_EMPTY[def.key];
}

function touchHintWrap(def: (typeof defs)[number]): boolean {
  return Boolean(props.interactive && props.mode === 'values' && !isOn(def.key));
}

function onIconClick(section: DocIndicatorSection) {
  if (!props.interactive || props.mode !== 'values') return;
  if (!isOn(section)) return;
  emit('select', section);
}

const iconSizePx = computed(() => `${props.iconSize}px`);
</script>

<style scoped>
.doc-indicators-root {
  --doc-lyrics: #0d9488;
  --doc-chords: #7c3aed;
  --doc-analysis: #047857;

  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.doc-indicators-root--loading {
  opacity: 0.45;
}

.doc-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  box-sizing: border-box;
  color: var(--color-text-mute);
  font: inherit;
  cursor: default;
  transition:
    color var(--transition-normal),
    border-color var(--transition-normal),
    background var(--transition-normal),
    opacity var(--transition-normal);
}

.doc-icon:not(:disabled) {
  cursor: pointer;
}

.doc-icon:not(:disabled):hover {
  filter: brightness(1.06);
}

.doc-icon:disabled {
  cursor: default;
}

.doc-icon-svg {
  width: v-bind(iconSizePx);
  height: v-bind(iconSizePx);
  flex-shrink: 0;
}

/* Cabecera: cada icono con el color de su categoría (referencia visual) */
.doc-indicators-root--legend .doc-icon--lyrics {
  color: var(--doc-lyrics);
  border-color: color-mix(in srgb, var(--doc-lyrics) 35%, var(--color-border));
  background: color-mix(in srgb, var(--doc-lyrics) 10%, var(--color-background));
  opacity: 0.88;
}

.doc-indicators-root--legend .doc-icon--chords {
  color: var(--doc-chords);
  border-color: color-mix(in srgb, var(--doc-chords) 35%, var(--color-border));
  background: color-mix(in srgb, var(--doc-chords) 10%, var(--color-background));
  opacity: 0.88;
}

.doc-indicators-root--legend .doc-icon--analysis {
  color: var(--doc-analysis);
  border-color: color-mix(in srgb, var(--doc-analysis) 35%, var(--color-border));
  background: color-mix(in srgb, var(--doc-analysis) 10%, var(--color-background));
  opacity: 0.88;
}

/* Filas: apagado = neutro; encendido = color del tipo */
.doc-indicators-root--values .doc-icon:not(.doc-icon--on) {
  opacity: 0.5;
}

.doc-indicators-root--values .doc-icon--lyrics.doc-icon--on {
  color: var(--doc-lyrics);
  border-color: color-mix(in srgb, var(--doc-lyrics) 50%, var(--color-border));
  background: color-mix(in srgb, var(--doc-lyrics) 14%, var(--color-background));
  opacity: 1;
}

.doc-indicators-root--values .doc-icon--chords.doc-icon--on {
  color: var(--doc-chords);
  border-color: color-mix(in srgb, var(--doc-chords) 50%, var(--color-border));
  background: color-mix(in srgb, var(--doc-chords) 14%, var(--color-background));
  opacity: 1;
}

.doc-indicators-root--values .doc-icon--analysis.doc-icon--on {
  color: var(--doc-analysis);
  border-color: color-mix(in srgb, var(--doc-analysis) 50%, var(--color-border));
  background: color-mix(in srgb, var(--doc-analysis) 14%, var(--color-background));
  opacity: 1;
}
</style>
