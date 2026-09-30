<template>
  <section
    class="tuner"
    :class="{
      'tuner--ok': inTune,
      'tuner--celebrate': celebrate,
      'tuner--listening': listening,
      'tuner--flat': direction === 'flat',
      'tuner--sharp': direction === 'sharp'
    }"
  >
    <button type="button" class="tuner__icon-btn tuner__back" title="Volver" @click="goBack">
      ←
    </button>
    <button
      type="button"
      class="tuner__icon-btn tuner__gear"
      title="Ajustes"
      :aria-expanded="settingsOpen"
      @click="settingsOpen = !settingsOpen"
    >
      ⚙
    </button>

    <div v-if="settingsOpen" class="tuner__settings">
      <div class="tuner__settings-row">
        <label class="tuner__settings-label" for="tuner-a4">A4</label>
        <div class="tuner__a4">
          <input
            id="tuner-a4"
            v-model.number="a4Hz"
            type="number"
            min="415"
            max="466"
            step="1"
            class="tuner__a4-input"
          />
          <button type="button" class="tuner__a4-reset" @click="a4Hz = 440">440</button>
        </div>
      </div>
    </div>

    <div class="tuner__stage">
      <div class="tuner__meter-panel" aria-live="polite">
        <div class="tuner__meter-bar">
          <button
            type="button"
            class="tuner__tuning-pill"
            title="Cambiar afinación"
            @click="cycleTuning"
          >
            {{ activeTuning.label }}
          </button>
          <button
            type="button"
            class="tuner__auto"
            :class="{ 'tuner__auto--on': mode === 'auto' }"
            :aria-pressed="mode === 'auto'"
            @click="toggleAuto"
          >
            <span class="tuner__auto-label">AUTO</span>
            <span class="tuner__auto-knob" aria-hidden="true" />
          </button>
        </div>

        <div class="tuner__grid" aria-hidden="true">
          <span class="tuner__accidental tuner__accidental--flat">♭</span>
          <span class="tuner__accidental tuner__accidental--sharp">♯</span>
          <div class="tuner__center-line" />
          <div
            class="tuner__cursor"
            :class="markerClass"
            :style="{ left: `calc(50% + ${needleOffset}%)` }"
          >
            <span class="tuner__cursor-dot" />
            <span class="tuner__cursor-tip" />
          </div>
        </div>

        <p
          class="tuner__ok-label"
          :class="{ 'tuner__ok-label--show': inTune }"
          aria-hidden="true"
        >
          Afinado
        </p>
        <span class="sr-only">{{ a11yStatus }}</span>
      </div>

      <div class="tuner__head-wrap">
        <div class="tuner__guitar" role="group" aria-label="Cuerda a afinar">
          <div class="tuner__pegs tuner__pegs--left">
            <button
              v-for="s in leftPegs"
              :key="s.id"
              type="button"
              class="tuner__peg"
              :class="{
                'tuner__peg--active': selectedStringId === s.id,
                'tuner__peg--ok': selectedStringId === s.id && inTune
              }"
              :aria-pressed="selectedStringId === s.id"
              :aria-label="`Cuerda ${s.id}`"
              @click="selectString(s.id)"
            >
              {{ s.name }}
            </button>
          </div>

          <div class="tuner__electric" aria-hidden="true">
            <svg class="tuner__electric-svg" viewBox="0 0 100 260" focusable="false">
              <!-- Cuerpo estilo Strat (silueta) -->
              <path
                class="tuner__e-body"
                d="M28 118
                   C18 118 10 128 10 142
                   C10 158 16 168 22 178
                   C18 188 14 200 16 214
                   C18 232 32 248 50 248
                   C68 248 82 232 84 214
                   C86 200 82 188 78 178
                   C84 168 90 158 90 142
                   C90 128 82 118 72 118
                   C68 118 64 122 60 122
                   L40 122
                   C36 122 32 118 28 118 Z"
              />
              <!-- Pickguard -->
              <path
                class="tuner__e-guard"
                d="M34 130 L66 130 C72 130 76 136 76 144
                   L74 188 C70 196 60 200 50 200
                   C40 200 30 196 26 188 L24 144
                   C24 136 28 130 34 130 Z"
              />
              <!-- Pastillas -->
              <rect class="tuner__e-pickup" x="36" y="142" width="28" height="8" rx="2" />
              <rect class="tuner__e-pickup" x="36" y="158" width="28" height="8" rx="2" />
              <rect class="tuner__e-pickup" x="36" y="174" width="28" height="8" rx="2" />
              <!-- Puente -->
              <rect class="tuner__e-bridge" x="38" y="208" width="24" height="6" rx="1.5" />
              <!-- Controles -->
              <circle class="tuner__e-knob" cx="62" cy="220" r="3.2" />
              <circle class="tuner__e-knob" cx="70" cy="212" r="3.2" />
              <circle class="tuner__e-knob" cx="70" cy="222" r="3.2" />
              <!-- Mástil -->
              <rect class="tuner__e-neck" x="42" y="52" width="16" height="72" rx="1" />
              <rect class="tuner__e-fretboard" x="43.5" y="54" width="13" height="68" rx="0.8" />
              <!-- Trastes -->
              <g class="tuner__e-frets">
                <line x1="43.5" y1="64" x2="56.5" y2="64" />
                <line x1="43.5" y1="74" x2="56.5" y2="74" />
                <line x1="43.5" y1="84" x2="56.5" y2="84" />
                <line x1="43.5" y1="94" x2="56.5" y2="94" />
                <line x1="43.5" y1="104" x2="56.5" y2="104" />
                <line x1="43.5" y1="114" x2="56.5" y2="114" />
              </g>
              <!-- Pala eléctrica (punta) -->
              <path
                class="tuner__e-head"
                d="M40 52 L40 18
                   C40 10 44 4 50 4
                   C56 4 60 10 60 18
                   L60 52 Z"
              />
              <path
                class="tuner__e-head-tip"
                d="M42 16 L50 6 L58 16 Z"
              />
              <!-- Cejuela -->
              <rect class="tuner__e-nut" x="42" y="50" width="16" height="2.5" rx="0.4" />
              <!-- Clavijas en pala -->
              <g class="tuner__e-machines">
                <circle cx="36" cy="14" r="2.4" />
                <circle cx="36" cy="26" r="2.4" />
                <circle cx="36" cy="38" r="2.4" />
                <circle cx="64" cy="14" r="2.4" />
                <circle cx="64" cy="26" r="2.4" />
                <circle cx="64" cy="38" r="2.4" />
              </g>
              <!-- Cuerdas -->
              <g class="tuner__e-strings">
                <line
                  v-for="(x, i) in electricStringXs"
                  :key="i"
                  :x1="x"
                  y1="16"
                  :x2="x"
                  y2="214"
                  :stroke-width="0.55 + i * 0.12"
                />
              </g>
            </svg>
          </div>

          <div class="tuner__pegs tuner__pegs--right">
            <button
              v-for="s in rightPegs"
              :key="s.id"
              type="button"
              class="tuner__peg"
              :class="{
                'tuner__peg--active': selectedStringId === s.id,
                'tuner__peg--ok': selectedStringId === s.id && inTune
              }"
              :aria-pressed="selectedStringId === s.id"
              :aria-label="`Cuerda ${s.id}`"
              @click="selectString(s.id)"
            >
              {{ s.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="tuner__footer">
      <button
        type="button"
        class="tuner__mic"
        :class="{ 'tuner__mic--on': listening }"
        :disabled="starting"
        @click="listening ? stop() : start()"
      >
        {{ micLabel }}
      </button>
      <p v-if="errorMessage" class="tuner__error" role="alert">{{ errorMessage }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  detectPitch,
  foldHzToTarget,
  GUITAR_TUNINGS,
  headstockPegs,
  isInTune,
  IN_TUNE_CENTS,
  nearestGuitarString,
  readingForMidi,
  type GuitarTuningId,
  type TunerReading
} from '@/tools/tuner'

type TunerMode = 'auto' | 'manual'
type Direction = 'idle' | 'waiting' | 'flat' | 'sharp' | 'ok'

const TUNING_ORDER: GuitarTuningId[] = ['standard', 'dropD']

const router = useRouter()

const mode = ref<TunerMode>('auto')
const tuningId = ref<GuitarTuningId>('standard')
const selectedStringId = ref('E2')
const listening = ref(false)
const starting = ref(false)
const settingsOpen = ref(false)
const errorMessage = ref<string | null>(null)
const a4Hz = ref(440)
const reading = ref<TunerReading | null>(null)
const silent = ref(true)
const celebrate = ref(false)
/** true mientras mostramos la última lectura buena tras soltar */
const holding = ref(false)

let audioContext: AudioContext | null = null
let mediaStream: MediaStream | null = null
let analyser: AnalyserNode | null = null
let dataArray: Float32Array | null = null
let rafId = 0
let smoothHz = 0
let silentFrames = 0
let candidateStringId: string | null = null
let candidateFrames = 0
let displayCents = 0
let wasInTune = false
let celebrateTimer = 0
let holdUntil = 0

const SWITCH_FRAMES = 10
const GUITAR_ACCEPT_CENTS = 72
const VISUAL_CENTS = 75
const DEADZONE_CENTS = 2
const HZ_SMOOTH = 0.9
const CENTS_SMOOTH = 0.88
/** Mantener la última lectura buena al soltar (ms) */
const HOLD_MS = 750
const CLARITY_MIN = 0.85

const activeTuning = computed(() => GUITAR_TUNINGS[tuningId.value])
const activeStrings = computed(() => activeTuning.value.strings)

const pegLayout = computed(() => headstockPegs(activeStrings.value))
const leftPegs = computed(() => pegLayout.value.left)
const rightPegs = computed(() => pegLayout.value.right)

const electricStringXs = [44.2, 46.2, 48.2, 51.8, 53.8, 55.8]

const activeString = computed(
  () => activeStrings.value.find((s) => s.id === selectedStringId.value) ?? activeStrings.value[0]
)

const targetMidi = computed(() => activeString.value?.midi ?? null)

const targetHz = computed(() => {
  if (targetMidi.value == null) return null
  return a4Hz.value * Math.pow(2, (targetMidi.value - 69) / 12)
})

const inTune = computed(() => {
  if (!listening.value || !reading.value) return false
  if (silent.value && !holding.value) return false
  return isInTune(reading.value.cents)
})

const direction = computed<Direction>(() => {
  if (!listening.value) return 'idle'
  if ((silent.value && !holding.value) || !reading.value) return 'waiting'
  if (isInTune(reading.value.cents)) return 'ok'
  return reading.value.cents < 0 ? 'flat' : 'sharp'
})

const a11yStatus = computed(() => {
  const note = activeString.value?.name ?? ''
  switch (direction.value) {
    case 'idle':
      return 'Pulsa Escuchar'
    case 'waiting':
      return note ? `Esperando ${note}` : 'Esperando nota'
    case 'ok':
      return note ? `${note} afinado` : 'Afinado'
    case 'flat':
      return `Bajo ${Math.abs(reading.value?.cents ?? 0)} cents`
    case 'sharp':
      return `Alto ${reading.value?.cents ?? 0} cents`
    default:
      return ''
  }
})

/** Cents suavizados → % del grid (−50…+50), con escala y zona muerta */
const needleOffset = computed(() => {
  if (!reading.value || !listening.value) return 0
  if (silent.value && !holding.value) return 0
  const c = reading.value.cents
  const calmed = Math.abs(c) <= DEADZONE_CENTS ? 0 : c
  return Math.max(-50, Math.min(50, (calmed / VISUAL_CENTS) * 50))
})

const markerClass = computed(() => {
  if (!listening.value || !reading.value) return 'tuner__cursor--idle'
  if (silent.value && !holding.value) return 'tuner__cursor--idle'
  const a = Math.abs(reading.value.cents)
  if (a <= IN_TUNE_CENTS) return 'tuner__cursor--ok'
  if (a <= 20) return 'tuner__cursor--near'
  return 'tuner__cursor--off'
})

const micLabel = computed(() => {
  if (starting.value) return 'Permiso…'
  return listening.value ? 'Parar' : 'Escuchar'
})

watch(inTune, (ok) => {
  if (ok && !wasInTune) {
    playInTuneChime()
    celebrate.value = true
    if (celebrateTimer) window.clearTimeout(celebrateTimer)
    celebrateTimer = window.setTimeout(() => {
      celebrate.value = false
      celebrateTimer = 0
    }, 1100)
  }
  wasInTune = ok
})

/** Pitido corto al clavar (sube C→E, volumen bajo). */
function playInTuneChime() {
  const ctx = audioContext
  if (!ctx || ctx.state === 'closed') return
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const notes = [523.25, 659.25]
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = notes[i]
    const t0 = now + i * 0.1
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 0.25)
  }
}

function toggleAuto() {
  if (mode.value === 'auto') setMode('manual')
  else setMode('auto')
}

function cycleTuning() {
  const idx = TUNING_ORDER.indexOf(tuningId.value)
  const next = TUNING_ORDER[(idx + 1) % TUNING_ORDER.length]
  setTuning(next)
}

function setTuning(next: GuitarTuningId) {
  if (tuningId.value === next) return
  tuningId.value = next
  const first = GUITAR_TUNINGS[next].strings[0]
  selectedStringId.value = first.id
  reading.value = null
  silent.value = true
  holding.value = false
  holdUntil = 0
  resetLock()
}

function setMode(next: TunerMode) {
  if (mode.value === next) return
  mode.value = next
  reading.value = null
  silent.value = true
  holding.value = false
  holdUntil = 0
  resetLock()
}

function selectString(id: string) {
  mode.value = 'manual'
  selectedStringId.value = id
  reading.value = null
  silent.value = true
  holding.value = false
  holdUntil = 0
  silentFrames = 0
  candidateStringId = null
  candidateFrames = 0
  retargetSmoothingToCurrentString()
}

function goBack() {
  stop()
  if (window.history.length > 1) router.back()
  else router.push({ name: 'mas' })
}

function resetLock() {
  candidateStringId = null
  candidateFrames = 0
  displayCents = 0
  smoothHz = 0
  silentFrames = 0
}

/** Recalcula cents respecto a la cuerda actual sin tirar el Hz suavizado. */
function retargetSmoothingToCurrentString() {
  const target = targetHz.value
  if (!(smoothHz > 0) || target == null) return
  const folded = foldHzToTarget(smoothHz, target)
  smoothHz = folded
  displayCents = 1200 * Math.log2(folded / target)
}

function maybeFollowNearestString(hz: number) {
  if (mode.value !== 'auto') return

  const nearest = nearestGuitarString(hz, a4Hz.value, activeStrings.value)
  if (!nearest) return

  if (nearest.id === selectedStringId.value) {
    candidateStringId = null
    candidateFrames = 0
    return
  }

  if (candidateStringId === nearest.id) candidateFrames += 1
  else {
    candidateStringId = nearest.id
    candidateFrames = 1
  }

  if (candidateFrames >= SWITCH_FRAMES) {
    selectedStringId.value = nearest.id
    candidateStringId = null
    candidateFrames = 0
    retargetSmoothingToCurrentString()
  }
}

function micErrorMessage(err: unknown): string {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name?: string }).name)
      : ''

  if (!window.isSecureContext) {
    return 'El micrófono requiere HTTPS (o localhost). Abre la app por una conexión segura.'
  }

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Micrófono bloqueado. En el navegador: candado del sitio → Permisos → Micrófono → Permitir. En iPhone: Ajustes → Safari (o la app) → Micrófono.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No se encontró ningún micrófono en este dispositivo.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'El micrófono está en uso por otra app. Ciérrala e inténtalo de nuevo.'
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Este dispositivo no admite la configuración de audio pedida. Prueba de nuevo.'
    case 'SecurityError':
      return 'El navegador bloqueó el micrófono por seguridad. Usa HTTPS y revisa los permisos del sitio.'
    case 'AbortError':
      return 'Se canceló el acceso al micrófono. Pulsa Escuchar otra vez.'
    case 'TypeError':
      return 'Este navegador no puede pedir el micrófono aquí. Prueba Chrome o Safari actualizado.'
    default:
      return 'No se pudo usar el micrófono. Revisa el permiso del navegador o usa HTTPS.'
  }
}

async function start() {
  errorMessage.value = null
  starting.value = true
  try {
    if (!window.isSecureContext) {
      throw Object.assign(new Error('insecure'), { name: 'SecurityError' })
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw Object.assign(new Error('unsupported'), { name: 'TypeError' })
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(mediaStream)

    const highpass = audioContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 70
    highpass.Q.value = 0.7

    analyser = audioContext.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0

    source.connect(highpass)
    highpass.connect(analyser)

    dataArray = new Float32Array(analyser.fftSize) as Float32Array
    listening.value = true
    silent.value = true
    reading.value = null
    resetLock()
    tick()
  } catch (err) {
    console.error(err)
    errorMessage.value = micErrorMessage(err)
    stop()
  } finally {
    starting.value = false
  }
}

function applyGuitarReading(hz: number) {
  maybeFollowNearestString(hz)

  const midi = targetMidi.value
  const target = targetHz.value
  if (midi == null || target == null) return

  const folded = foldHzToTarget(hz, target)
  const rawCents = 1200 * Math.log2(folded / target)

  if (Math.abs(rawCents) > GUITAR_ACCEPT_CENTS) {
    beginHoldOrSilence()
    return
  }

  silentFrames = 0
  holding.value = false
  holdUntil = 0
  smoothHz = smoothHz > 0 ? smoothHz * HZ_SMOOTH + folded * (1 - HZ_SMOOTH) : folded
  const next = readingForMidi(smoothHz, midi, a4Hz.value)
  let cents = next.cents
  if (Math.abs(cents) <= DEADZONE_CENTS) cents = 0
  displayCents = displayCents * CENTS_SMOOTH + cents * (1 - CENTS_SMOOTH)
  reading.value = {
    ...next,
    frequency: smoothHz,
    cents: Math.round(displayCents)
  }
  silent.value = false
}

function beginHoldOrSilence() {
  silentFrames += 1
  if (silentFrames < 10) return

  const now = performance.now()
  if (reading.value && !holding.value && holdUntil === 0) {
    holding.value = true
    holdUntil = now + HOLD_MS
    silent.value = true
    return
  }

  if (holding.value && now < holdUntil) {
    silent.value = true
    return
  }

  holding.value = false
  holdUntil = 0
  silent.value = true
  candidateStringId = null
  candidateFrames = 0
  displayCents *= 0.9
  if (Math.abs(displayCents) < 1) {
    displayCents = 0
    smoothHz = 0
    reading.value = null
  }
}

function tick() {
  if (!listening.value || !analyser || !dataArray || !audioContext) return

  analyser.getFloatTimeDomainData(dataArray as unknown as Float32Array<ArrayBuffer>)
  const detected = detectPitch(dataArray, audioContext.sampleRate, {
    clarityMin: CLARITY_MIN,
    minHz: 65
  })

  if (detected && detected.clarity >= CLARITY_MIN) {
    applyGuitarReading(detected.hz)
  } else {
    beginHoldOrSilence()
  }

  rafId = requestAnimationFrame(tick)
}

function stop() {
  listening.value = false
  starting.value = false
  celebrate.value = false
  holding.value = false
  holdUntil = 0
  wasInTune = false
  if (celebrateTimer) {
    window.clearTimeout(celebrateTimer)
    celebrateTimer = 0
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop()
    mediaStream = null
  }
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  analyser = null
  dataArray = null
  reading.value = null
  silent.value = true
  resetLock()
}

onUnmounted(() => {
  stop()
})
</script>
<style scoped>
.tuner {
  --tuner-ok: var(--color-success);
  --tuner-off: var(--color-error);
  --tuner-ui: var(--color-accent);
  --tuner-wood: color-mix(in srgb, #8b7355 55%, var(--color-background-mute));
  --tuner-wood-deep: color-mix(in srgb, #4a3b30 65%, var(--color-background-soft));
  --tuner-wood-light: color-mix(in srgb, #a89078 50%, var(--color-background-card));
  --tuner-nav-space: calc(4.75rem + env(safe-area-inset-bottom, 0px));

  height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      90% 50% at 50% 0%,
      color-mix(in srgb, var(--color-accent) 8%, var(--color-background)),
      var(--color-background) 55%
    );
  color: var(--color-text);
  transition: background 0.25s ease;
  padding: 0.35rem 0.75rem var(--tuner-nav-space);
  box-sizing: border-box;
}

.tuner--ok {
  background:
    radial-gradient(
      90% 50% at 50% 0%,
      color-mix(in srgb, var(--color-accent) 8%, var(--color-background)),
      var(--color-background) 55%
    );
}

.tuner--celebrate::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    55% 40% at 50% 22%,
    color-mix(in srgb, var(--tuner-ok) 22%, transparent),
    transparent 70%
  );
  animation: tuner-flash 1.1s ease-out forwards;
  z-index: 2;
}

@keyframes tuner-flash {
  0% { opacity: 0; }
  18% { opacity: 1; }
  100% { opacity: 0; }
}

.tuner__back,
.tuner__gear {
  position: absolute;
  top: 0.45rem;
  z-index: 5;
}

.tuner__back { left: 0.55rem; }
.tuner__gear { right: 0.55rem; }

.tuner__icon-btn {
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--color-background-card) 92%, transparent);
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  backdrop-filter: blur(6px);
}

.tuner__icon-btn:hover {
  border-color: var(--tuner-ui);
  color: var(--tuner-ui);
}

.tuner__settings {
  margin: 2.5rem 0.25rem 0.25rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
  z-index: 4;
}

.tuner__settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tuner__settings-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-mute);
}

.tuner__a4 {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.tuner__a4-input {
  width: 4.25rem;
  padding: 0.35rem 0.45rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.tuner__a4-reset {
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-soft);
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}

.tuner__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 2.35rem;
}

.tuner__meter-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.tuner__meter-bar {
  width: min(100%, 22rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.tuner__tuning-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background-card);
  font-size: 0.72rem;
  font-weight: 650;
  color: var(--color-text);
  cursor: pointer;
}

.tuner__tuning-pill:hover {
  border-color: var(--tuner-ui);
  color: var(--tuner-ui);
}

.tuner__auto {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: transparent;
  color: var(--color-text-mute);
  cursor: pointer;
  padding: 0.1rem;
}

.tuner__auto-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.tuner__auto-knob {
  width: 2.2rem;
  height: 1.15rem;
  border-radius: 999px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  position: relative;
  transition: background 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.tuner__auto-knob::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  background: var(--color-background-card);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease;
}

.tuner__auto--on { color: var(--tuner-ui); }
.tuner__auto--on .tuner__auto-knob {
  background: var(--tuner-ui);
  border-color: var(--tuner-ui);
}
.tuner__auto--on .tuner__auto-knob::after {
  transform: translateX(0.95rem);
  background: var(--color-text-inverse, #fff);
}

.tuner__grid {
  position: relative;
  width: min(100%, 22rem);
  height: 5.25rem;
  border-radius: 10px;
  background:
    linear-gradient(
      to right,
      transparent 0,
      transparent calc(50% - 0.5px),
      var(--color-border-hover) calc(50% - 0.5px),
      var(--color-border-hover) calc(50% + 0.5px),
      transparent calc(50% + 0.5px)
    ),
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent 11px,
      color-mix(in srgb, var(--color-border) 70%, transparent) 11px,
      color-mix(in srgb, var(--color-border) 70%, transparent) 12px
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 11px,
      color-mix(in srgb, var(--color-border) 55%, transparent) 11px,
      color-mix(in srgb, var(--color-border) 55%, transparent) 12px
    ),
    var(--color-background-soft);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.tuner__center-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: var(--color-text-mute);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.tuner--ok .tuner__center-line {
  background: var(--tuner-ok);
  box-shadow: 0 0 12px color-mix(in srgb, var(--tuner-ok) 40%, transparent);
}

.tuner--ok .tuner__grid {
  border-color: color-mix(in srgb, var(--tuner-ok) 40%, var(--color-border));
}

.tuner__accidental {
  position: absolute;
  top: 0.2rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-mute);
  opacity: 0.85;
}
.tuner__accidental--flat { left: 0.55rem; }
.tuner__accidental--sharp { right: 0.55rem; }

.tuner__cursor {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  transition: left 0.18s ease-out;
  will-change: left;
}

.tuner__cursor-dot {
  position: absolute;
  left: -0.45rem;
  top: -0.45rem;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  background: var(--color-heading, var(--color-text));
  box-shadow: 0 0 0 2px var(--color-background-card);
}

.tuner__cursor-tip {
  position: absolute;
  left: -0.28rem;
  top: 0.45rem;
  width: 0;
  height: 0;
  border-left: 0.28rem solid transparent;
  border-right: 0.28rem solid transparent;
  border-top: 0.35rem solid var(--color-heading, var(--color-text));
}

.tuner__cursor--idle .tuner__cursor-dot,
.tuner__cursor--idle .tuner__cursor-tip { opacity: 0.35; }

.tuner__cursor--ok .tuner__cursor-dot {
  background: var(--tuner-ok);
  box-shadow:
    0 0 0 2px var(--color-background-card),
    0 0 10px color-mix(in srgb, var(--tuner-ok) 45%, transparent);
}
.tuner__cursor--ok .tuner__cursor-tip { border-top-color: var(--tuner-ok); }
.tuner__cursor--near .tuner__cursor-dot { background: var(--tuner-ui); }
.tuner__cursor--near .tuner__cursor-tip { border-top-color: var(--tuner-ui); }
.tuner__cursor--off .tuner__cursor-dot { background: var(--tuner-off); }
.tuner__cursor--off .tuner__cursor-tip { border-top-color: var(--tuner-off); }

.tuner__ok-label {
  margin: 0.1rem 0 0;
  min-height: 1em;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: transparent;
  transition: color 0.15s ease;
}

.tuner__ok-label--show {
  color: var(--tuner-ok);
  animation: tuner-ok-pop 0.35s ease-out;
}

@keyframes tuner-ok-pop {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.tuner__head-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem 0;
}

.tuner__guitar {
  display: grid;
  grid-template-columns: 2.55rem minmax(6.5rem, 8.5rem) 2.55rem;
  gap: 0.3rem;
  align-items: start;
  width: auto;
  height: min(100%, 18.5rem);
  max-height: 100%;
}

.tuner__pegs {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.35rem;
  /* Alineadas con la pala (parte alta del SVG) */
  padding: 0.35rem 0 0;
  height: 38%;
  min-height: 6.5rem;
}

.tuner__peg {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-background-card);
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.tuner__peg:hover {
  border-color: var(--color-border-hover);
  transform: scale(1.05);
}

.tuner__peg--active {
  border-color: var(--tuner-ui);
  color: var(--color-text-inverse, #fff);
  background: var(--tuner-ui);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tuner-ui) 22%, transparent);
  transform: scale(1.06);
}

.tuner__peg--ok {
  border-color: var(--tuner-ok);
  color: var(--color-text-inverse, #fff);
  background: var(--tuner-ok);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--tuner-ok) 28%, transparent),
    0 0 14px color-mix(in srgb, var(--tuner-ok) 35%, transparent);
  animation: tuner-peg-pulse 0.9s ease-in-out infinite;
}

@keyframes tuner-peg-pulse {
  0%, 100% { transform: scale(1.06); }
  50% { transform: scale(1.12); }
}

.tuner__electric {
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.tuner__electric-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.tuner__e-body {
  fill: color-mix(in srgb, var(--color-heading, #253858) 88%, #1a1a2e);
  stroke: color-mix(in srgb, var(--color-border) 50%, #000);
  stroke-width: 0.7;
}

.tuner__e-guard {
  fill: color-mix(in srgb, var(--color-background-soft) 70%, #d4c4a8);
  opacity: 0.92;
}

.tuner__e-pickup {
  fill: #1e293b;
  stroke: #94a3b8;
  stroke-width: 0.4;
}

.tuner__e-bridge {
  fill: #cbd5e1;
  stroke: #64748b;
  stroke-width: 0.35;
}

.tuner__e-knob {
  fill: #334155;
  stroke: #94a3b8;
  stroke-width: 0.35;
}

.tuner__e-neck {
  fill: color-mix(in srgb, var(--tuner-wood-deep) 80%, #2a211a);
}

.tuner__e-fretboard {
  fill: #1c1410;
}

.tuner__e-frets line {
  stroke: #9ca3af;
  stroke-width: 0.45;
}

.tuner__e-head,
.tuner__e-head-tip {
  fill: color-mix(in srgb, var(--color-heading, #253858) 90%, #0f172a);
  stroke: color-mix(in srgb, var(--color-border) 40%, #000);
  stroke-width: 0.55;
}

.tuner__e-nut {
  fill: #e2e8f0;
}

.tuner__e-machines circle {
  fill: #e2e8f0;
  stroke: #64748b;
  stroke-width: 0.4;
}

.tuner__e-strings line {
  stroke: #cbd5e1;
  stroke-linecap: round;
  opacity: 0.85;
}

.tuner__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.25rem 0 0.15rem;
  max-width: 22rem;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.tuner__mic {
  width: 100%;
  border: none;
  border-radius: 11px;
  padding: 0.55rem 1rem;
  font-size: 0.92rem;
  font-weight: 750;
  cursor: pointer;
  background: var(--tuner-ui);
  color: var(--color-text-inverse, #fff);
}

.tuner__mic:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.tuner__mic--on {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.tuner__error {
  margin: 0;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--tuner-off) 10%, var(--color-background));
  border: 1px solid color-mix(in srgb, var(--tuner-off) 35%, var(--color-border));
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.3;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 360px) {
  .tuner__guitar {
    grid-template-columns: 2.3rem minmax(5.75rem, 7.5rem) 2.3rem;
  }
  .tuner__peg {
    width: 2.1rem;
    height: 2.1rem;
    font-size: 0.85rem;
  }
}

@media (max-height: 700px) {
  .tuner__grid { height: 4.5rem; }
  .tuner__guitar { height: min(100%, 16.5rem); }
  .tuner__peg {
    width: 2.1rem;
    height: 2.1rem;
  }
}
</style>
