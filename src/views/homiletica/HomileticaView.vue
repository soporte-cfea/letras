<template>
  <div class="homiletica" ref="rootEl">
    <header class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="hero-center">{{ meta.center }}</p>
        <h1 class="hero-title">
          <span class="hero-course">{{ meta.course }}</span>
          <span class="hero-module">{{ meta.module }}</span>
        </h1>
        <p class="hero-tagline">{{ meta.tagline }}</p>
        <p class="hero-meta">
          <span>{{ meta.teacher }}</span>
          <span class="hero-dot" aria-hidden="true">·</span>
          <span>{{ meta.place }}</span>
        </p>
        <a class="hero-cta" href="#introduccion">Comenzar el estudio</a>
      </div>
    </header>

    <nav class="toc" :class="{ 'toc--stuck': tocStuck }" aria-label="Índice del módulo">
      <div class="toc-track">
        <a
          v-for="section in navSections"
          :key="section.id"
          :href="`#${section.id}`"
          class="toc-link"
          :class="{ 'toc-link--active': activeSection === section.id }"
          @click="onTocClick(section.id, $event)"
        >
          {{ section.label }}
        </a>
      </div>
    </nav>

    <main class="main">
      <!-- Introducción -->
      <section id="introduccion" class="section">
        <header class="section-head">
          <p class="section-kicker">01</p>
          <h2 class="section-title">Introducción</h2>
          <p class="section-sub">El llamado a comunicar con claridad</p>
        </header>
        <div class="prose">
          <p>{{ intro.lead }}</p>
          <p>{{ intro.practice }}</p>
        </div>
      </section>

      <!-- Pilares + hábitos -->
      <section id="pilares" class="section">
        <header class="section-head">
          <p class="section-kicker">02</p>
          <h2 class="section-title">Cinco pilares</h2>
          <p class="section-sub">Y cuatro hábitos para buenos resultados</p>
        </header>

        <ol class="principle-list">
          <li v-for="(pillar, i) in pillars" :key="pillar.title" class="principle">
            <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div>
              <h3 class="principle-title">{{ pillar.title }}</h3>
              <p class="principle-text">{{ pillar.text }}</p>
            </div>
          </li>
        </ol>

        <div class="habits">
          <p class="habits-label">Conceptos clave</p>
          <ul class="habits-list">
            <li v-for="habit in habits" :key="habit">{{ habit }}</li>
          </ul>
        </div>
      </section>

      <!-- Qué es -->
      <section id="que-es" class="section">
        <header class="section-head">
          <p class="section-kicker">03</p>
          <h2 class="section-title">¿Qué es Homilética?</h2>
        </header>
        <p class="definition">{{ whatIs.definition }}</p>
        <ul class="plain-list">
          <li v-for="point in whatIs.points" :key="point">{{ point }}</li>
        </ul>
      </section>

      <!-- De qué predicar -->
      <section id="predicar" class="section">
        <header class="section-head">
          <p class="section-kicker">04</p>
          <h2 class="section-title">De qué predicar</h2>
          <p class="section-sub">Necesidades humanas y asuntos para el púlpito</p>
        </header>

        <div class="block">
          <h3 class="block-title">Necesidades humanas</h3>
          <div class="accordion">
            <details
              v-for="need in humanNeeds"
              :key="need.title"
              class="acc-item"
            >
              <summary class="acc-summary">{{ need.title }}</summary>
              <ul class="note-list">
                <li v-for="item in need.items" :key="item.label">
                  <span class="note-label">{{ item.label }}</span>
                  <span class="note-meta">{{ item.note }}</span>
                </li>
              </ul>
            </details>
          </div>
        </div>

        <div class="block">
          <h3 class="block-title">Asuntos para predicar</h3>
          <div class="accordion">
            <details
              v-for="topic in preachTopics"
              :key="topic.title"
              class="acc-item"
            >
              <summary class="acc-summary">{{ topic.title }}</summary>
              <ul class="plain-list plain-list--tight">
                <li v-for="item in topic.items" :key="item">{{ item }}</li>
              </ul>
            </details>
          </div>
        </div>
      </section>

      <!-- Preparación -->
      <section id="preparacion" class="section">
        <header class="section-head">
          <p class="section-kicker">05</p>
          <h2 class="section-title">Preparación para predicar</h2>
          <p class="section-sub">Ocho pasos antes de subir al púlpito</p>
        </header>
        <ol class="step-list">
          <li v-for="(step, i) in preparation" :key="step">
            <span class="step-num">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </section>

      <!-- Fundamentos -->
      <section id="fundamentos" class="section">
        <header class="section-head">
          <p class="section-kicker">06</p>
          <h2 class="section-title">Fundamentos del sermón</h2>
          <p class="section-sub">Las bases que sostienen cada mensaje</p>
        </header>
        <ol class="principle-list">
          <li v-for="(item, i) in foundations" :key="item" class="principle principle--compact">
            <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="principle-title">{{ item }}</h3>
          </li>
        </ol>
      </section>

      <!-- Características -->
      <section id="caracteristicas" class="section">
        <header class="section-head">
          <p class="section-kicker">07</p>
          <h2 class="section-title">Características del sermón</h2>
        </header>
        <ol class="principle-list">
          <li v-for="(item, i) in characteristics" :key="item.title" class="principle">
            <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div>
              <h3 class="principle-title">{{ item.title }}</h3>
              <p class="principle-text">{{ item.text }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Anatomía -->
      <section id="anatomia" class="section">
        <header class="section-head">
          <p class="section-kicker">08</p>
          <h2 class="section-title">Anatomía del sermón</h2>
          <p class="section-sub">Introducción, cuerpo, conclusión y aplicación</p>
        </header>

        <div class="anatomy">
          <!-- Introducción -->
          <article class="anatomy-part">
            <h3 class="anatomy-title">
              <span class="anatomy-letter">A</span>
              La introducción
            </h3>

            <div class="anatomy-group">
              <h4 class="anatomy-subtitle">Evita empezar así</h4>
              <ul class="plain-list plain-list--warn">
                <li v-for="item in anatomy.introduction.avoid" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="anatomy-group">
              <h4 class="anatomy-subtitle">Busca esto</h4>
              <ul class="plain-list">
                <li v-for="item in anatomy.introduction.goals" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="anatomy-group">
              <h4 class="anatomy-subtitle">Formas de comenzar</h4>
              <div class="start-list">
                <div
                  v-for="start in anatomy.introduction.starts"
                  :key="start.title"
                  class="start-item"
                >
                  <h5 class="start-title">{{ start.title }}</h5>
                  <ul class="plain-list plain-list--tight">
                    <li v-for="point in start.points" :key="point">{{ point }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </article>

          <!-- Cuerpo -->
          <article class="anatomy-part">
            <h3 class="anatomy-title">
              <span class="anatomy-letter">B</span>
              El cuerpo del sermón
            </h3>
            <ol class="principle-list">
              <li
                v-for="(item, i) in anatomy.body"
                :key="item.title"
                class="principle"
              >
                <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
                <div>
                  <h4 class="principle-title">{{ item.title }}</h4>
                  <p class="principle-text">{{ item.text }}</p>
                </div>
              </li>
            </ol>
          </article>

          <!-- Conclusión -->
          <article class="anatomy-part">
            <h3 class="anatomy-title">
              <span class="anatomy-letter">C</span>
              La conclusión
            </h3>
            <ol class="principle-list">
              <li
                v-for="(item, i) in anatomy.conclusion"
                :key="item.title"
                class="principle"
              >
                <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
                <div>
                  <h4 class="principle-title">{{ item.title }}</h4>
                  <p class="principle-text">{{ item.text }}</p>
                </div>
              </li>
            </ol>
          </article>

          <!-- Aplicación -->
          <article class="anatomy-part">
            <h3 class="anatomy-title">
              <span class="anatomy-letter">D</span>
              La aplicación
            </h3>
            <ol class="principle-list">
              <li
                v-for="(item, i) in anatomy.application"
                :key="item.title"
                class="principle"
              >
                <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
                <div>
                  <h4 class="principle-title">{{ item.title }}</h4>
                  <p class="principle-text">{{ item.text }}</p>
                </div>
              </li>
            </ol>
          </article>
        </div>
      </section>

      <!-- Clasificación -->
      <section id="clasificacion" class="section">
        <header class="section-head">
          <p class="section-kicker">09</p>
          <h2 class="section-title">Clasificación de sermones</h2>
        </header>
        <ul class="type-grid">
          <li v-for="type in sermonTypes" :key="type">{{ type }}</li>
        </ul>
      </section>

      <!-- Biblioteca -->
      <section id="biblioteca" class="section">
        <header class="section-head">
          <p class="section-kicker">10</p>
          <h2 class="section-title">La biblioteca del predicador</h2>
        </header>
        <ul class="plain-list">
          <li v-for="item in library.items" :key="item">{{ item }}</li>
        </ul>
        <blockquote class="quote">
          <p>{{ library.quote }}</p>
        </blockquote>
      </section>

      <!-- Voz -->
      <section id="voz" class="section">
        <header class="section-head">
          <p class="section-kicker">11</p>
          <h2 class="section-title">La voz del predicador</h2>
          <p class="section-sub">{{ voice.lead }}</p>
        </header>
        <ol class="principle-list">
          <li
            v-for="(aspect, i) in voice.aspects"
            :key="aspect.title"
            class="principle"
          >
            <span class="principle-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div>
              <h3 class="principle-title">{{ aspect.title }}</h3>
              <p class="principle-text">{{ aspect.text }}</p>
            </div>
          </li>
        </ol>
      </section>
    </main>

    <footer class="footer">
      <p class="footer-course">{{ meta.course }} · {{ meta.module }}</p>
      <p class="footer-center">{{ meta.center }}</p>
      <p class="footer-meta">{{ meta.teacher }} · {{ meta.place }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  anatomy,
  characteristics,
  foundations,
  habits,
  humanNeeds,
  intro,
  library,
  meta,
  navSections,
  pillars,
  preachTopics,
  preparation,
  sermonTypes,
  voice,
  whatIs,
} from './homileticaContent'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,650;1,7..72,500&family=Source+Sans+3:wght@400;500;600;700&display=swap'

const rootEl = ref<HTMLElement | null>(null)
const activeSection = ref(navSections[0]?.id ?? '')
const tocStuck = ref(false)

let observer: IntersectionObserver | null = null

function ensureFonts() {
  const existing = document.querySelector(`link[href="${FONT_HREF}"]`)
  if (existing) return
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = FONT_HREF
  document.head.appendChild(fontLink)
}

function scrollActiveTocIntoView(id: string) {
  const link = rootEl.value?.querySelector(
    `.toc-link[href="#${CSS.escape(id)}"]`
  ) as HTMLElement | null
  if (!link) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  link.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    inline: 'center',
    block: 'nearest',
  })
}

function onTocClick(id: string, event: Event) {
  event.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  activeSection.value = id
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

watch(activeSection, (id) => {
  nextTick(() => scrollActiveTocIntoView(id))
})

function setupObservers() {
  const sections = navSections
    .map((s) => document.getElementById(s.id))
    .filter((el): el is HTMLElement => !!el)

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      if (visible[0]?.target?.id) {
        activeSection.value = visible[0].target.id
      }
    },
    {
      rootMargin: '-20% 0px -65% 0px',
      threshold: [0, 0.25, 0.5],
    }
  )
  sections.forEach((el) => observer?.observe(el))
}

function onScroll() {
  const toc = rootEl.value?.querySelector('.toc') as HTMLElement | null
  if (!toc) return
  tocStuck.value = toc.getBoundingClientRect().top <= 0
}

const previousTitle = document.title

onMounted(() => {
  document.title = `${meta.course} · ${meta.module} · ${meta.center}`
  ensureFonts()
  setupObservers()
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  if (location.hash) {
    const id = location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) {
      activeSection.value = id
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
    }
  }
})

onUnmounted(() => {
  document.title = previousTitle
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.homiletica {
  --hm-bg: #e8ebe4;
  --hm-bg-deep: #dfe4db;
  --hm-ink: #18201b;
  --hm-ink-soft: #3d4a42;
  --hm-muted: #5c6b62;
  --hm-accent: #1f4d3a;
  --hm-accent-soft: rgba(31, 77, 58, 0.12);
  --hm-line: rgba(24, 32, 27, 0.12);
  --hm-paper: #f4f6f1;
  --hm-warn: #6b3f2a;
  --hm-serif: 'Literata', 'Iowan Old Style', 'Palatino Linotype', Palatino, serif;
  --hm-sans: 'Source Sans 3', 'Segoe UI', Tahoma, sans-serif;
  --hm-radius: 2px;
  --hm-pad: clamp(1.25rem, 4.5vw, 2rem);
  --hm-max: 42rem;

  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(31, 77, 58, 0.08), transparent 55%),
    radial-gradient(900px 500px at 100% 0%, rgba(24, 32, 27, 0.06), transparent 50%),
    linear-gradient(180deg, var(--hm-bg) 0%, var(--hm-bg-deep) 100%);
  color: var(--hm-ink);
  font-family: var(--hm-sans);
  font-size: 1.0625rem;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

/* —— Hero —— */
.hero {
  position: relative;
  min-height: min(92vh, 46rem);
  display: flex;
  align-items: flex-end;
  padding: calc(var(--hm-pad) + 1rem) var(--hm-pad) 3rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(165deg, rgba(24, 32, 27, 0.88) 0%, rgba(31, 77, 58, 0.82) 48%, rgba(24, 32, 27, 0.9) 100%),
    repeating-linear-gradient(
      -12deg,
      transparent,
      transparent 11px,
      rgba(255, 255, 255, 0.015) 11px,
      rgba(255, 255, 255, 0.015) 12px
    );
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 5rem;
  background: linear-gradient(to top, var(--hm-bg), transparent);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(100%, var(--hm-max));
  margin: 0 auto;
  color: #f3f6f2;
  animation: rise 0.9s ease-out both;
}

.hero-center {
  margin: 0 0 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(243, 246, 242, 0.72);
}

.hero-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.hero-course {
  font-family: var(--hm-serif);
  font-size: clamp(2.75rem, 12vw, 4.5rem);
  font-weight: 650;
  line-height: 0.95;
  letter-spacing: -0.02em;
}

.hero-module {
  font-family: var(--hm-serif);
  font-size: clamp(1.25rem, 4.5vw, 1.65rem);
  font-weight: 500;
  font-style: italic;
  color: rgba(243, 246, 242, 0.85);
}

.hero-tagline {
  margin: 1.35rem 0 0;
  max-width: 28rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: rgba(243, 246, 242, 0.88);
}

.hero-meta {
  margin: 1.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  font-size: 0.92rem;
  color: rgba(243, 246, 242, 0.7);
}

.hero-dot {
  opacity: 0.6;
}

.hero-cta {
  display: inline-flex;
  margin-top: 1.75rem;
  padding: 0.85rem 1.25rem;
  border: 1px solid rgba(243, 246, 242, 0.35);
  color: #f3f6f2;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.hero-cta:hover,
.hero-cta:focus-visible {
  background: rgba(243, 246, 242, 0.1);
  border-color: rgba(243, 246, 242, 0.7);
  outline: none;
}

/* —— TOC —— */
.toc {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(232, 235, 228, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.toc--stuck {
  border-bottom-color: var(--hm-line);
  box-shadow: 0 8px 24px rgba(24, 32, 27, 0.06);
}

.toc-track {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.7rem var(--hm-pad);
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.toc-track::-webkit-scrollbar {
  display: none;
}

.toc-link {
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  color: var(--hm-muted);
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.toc-link--active {
  color: var(--hm-accent);
  border-bottom-color: var(--hm-accent);
}

/* —— Main / sections —— */
.main {
  width: min(100%, calc(var(--hm-max) + 2 * var(--hm-pad)));
  margin: 0 auto;
  padding: 0.5rem var(--hm-pad) 3rem;
}

.section {
  padding: 2.75rem 0 2.5rem;
  border-bottom: 1px solid var(--hm-line);
  scroll-margin-top: 3.5rem;
  animation: fade-up 0.7s ease both;
}

.section:last-of-type {
  border-bottom: none;
}

.section-head {
  margin-bottom: 1.5rem;
}

.section-kicker {
  margin: 0 0 0.45rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--hm-accent);
}

.section-title {
  margin: 0;
  font-family: var(--hm-serif);
  font-size: clamp(1.7rem, 6vw, 2.15rem);
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--hm-ink);
}

.section-sub {
  margin: 0.55rem 0 0;
  color: var(--hm-muted);
  font-size: 1rem;
}

.prose p {
  margin: 0 0 1.1rem;
  color: var(--hm-ink-soft);
  max-width: 38rem;
}

.prose p:last-child {
  margin-bottom: 0;
}

.definition {
  margin: 0 0 1.25rem;
  font-family: var(--hm-serif);
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--hm-ink);
}

/* —— Shared list patterns —— */
.principle-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.principle {
  display: grid;
  grid-template-columns: 2.4rem 1fr;
  gap: 0.75rem;
  align-items: start;
}

.principle--compact {
  align-items: center;
}

.principle-num {
  font-family: var(--hm-serif);
  font-size: 0.95rem;
  font-weight: 650;
  color: var(--hm-accent);
  padding-top: 0.15rem;
}

.principle-title {
  margin: 0;
  font-family: var(--hm-serif);
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.25;
}

.principle-text {
  margin: 0.3rem 0 0;
  color: var(--hm-ink-soft);
  font-size: 0.98rem;
}

.habits {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--hm-line);
}

.habits-label {
  margin: 0 0 0.85rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--hm-muted);
}

.habits-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 1rem;
}

.habits-list li {
  position: relative;
  padding-left: 0.9rem;
  font-weight: 600;
  color: var(--hm-accent);
}

.habits-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.35rem;
  height: 0.35rem;
  background: var(--hm-accent);
}

.plain-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.plain-list li {
  position: relative;
  padding-left: 1rem;
  color: var(--hm-ink-soft);
}

.plain-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: var(--hm-accent);
}

.plain-list--tight {
  gap: 0.45rem;
}

.plain-list--warn li::before {
  background: var(--hm-warn);
}

.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.step-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  color: var(--hm-ink-soft);
}

.step-num {
  flex: 0 0 auto;
  width: 1.7rem;
  height: 1.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--hm-accent);
  color: var(--hm-accent);
  font-size: 0.82rem;
  font-weight: 700;
  margin-top: 0.05rem;
}

/* —— Blocks / accordion —— */
.block {
  margin-top: 1.75rem;
}

.block:first-of-type {
  margin-top: 0;
}

.block-title {
  margin: 0 0 0.85rem;
  font-family: var(--hm-serif);
  font-size: 1.2rem;
  font-weight: 650;
}

.accordion {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--hm-line);
}

.acc-item {
  border-bottom: 1px solid var(--hm-line);
}

.acc-summary {
  cursor: pointer;
  list-style: none;
  padding: 0.95rem 1.6rem 0.95rem 0;
  font-weight: 600;
  color: var(--hm-ink);
  position: relative;
  user-select: none;
}

.acc-summary::-webkit-details-marker {
  display: none;
}

.acc-summary::after {
  content: '+';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--hm-accent);
}

.acc-item[open] > .acc-summary::after {
  content: '−';
}

.acc-item .plain-list,
.acc-item .note-list {
  padding: 0 0 1.1rem;
}

.note-list {
  list-style: none;
  margin: 0;
  padding: 0 0 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.note-list li {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-left: 1rem;
  position: relative;
}

.note-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 0.35rem;
  height: 0.35rem;
  background: var(--hm-accent);
}

.note-label {
  font-weight: 600;
  color: var(--hm-ink);
}

.note-meta {
  font-size: 0.92rem;
  color: var(--hm-muted);
}

/* —— Anatomy —— */
.anatomy {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.anatomy-part {
  padding: 1.35rem 0 0;
  border-top: 1px solid var(--hm-line);
}

.anatomy-part:first-child {
  border-top: none;
  padding-top: 0;
}

.anatomy-title {
  margin: 0 0 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--hm-serif);
  font-size: 1.35rem;
  font-weight: 650;
}

.anatomy-letter {
  display: inline-flex;
  width: 1.85rem;
  height: 1.85rem;
  align-items: center;
  justify-content: center;
  background: var(--hm-accent);
  color: #f3f6f2;
  font-family: var(--hm-sans);
  font-size: 0.85rem;
  font-weight: 700;
}

.anatomy-group {
  margin-bottom: 1.4rem;
}

.anatomy-group:last-child {
  margin-bottom: 0;
}

.anatomy-subtitle {
  margin: 0 0 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--hm-muted);
}

.start-list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.start-title {
  margin: 0 0 0.4rem;
  font-family: var(--hm-serif);
  font-size: 1.05rem;
  font-weight: 650;
}

/* —— Types / quote / footer —— */
.type-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 1rem;
}

.type-grid li {
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--hm-line);
  font-weight: 600;
  color: var(--hm-ink);
}

.quote {
  margin: 1.75rem 0 0;
  padding: 1.15rem 0 1.15rem 1rem;
  border-left: 3px solid var(--hm-accent);
  background: transparent;
}

.quote p {
  margin: 0;
  font-family: var(--hm-serif);
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.55;
  color: var(--hm-ink-soft);
}

.footer {
  padding: 2.5rem var(--hm-pad) 3.5rem;
  text-align: center;
  border-top: 1px solid var(--hm-line);
  background: rgba(24, 32, 27, 0.04);
}

.footer-course {
  margin: 0;
  font-family: var(--hm-serif);
  font-size: 1.2rem;
  font-weight: 650;
}

.footer-center {
  margin: 0.45rem 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--hm-muted);
}

.footer-meta {
  margin: 0.65rem 0 0;
  font-size: 0.92rem;
  color: var(--hm-ink-soft);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 720px) {
  .habits-list {
    grid-template-columns: repeat(4, 1fr);
  }

  .type-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .hero {
    align-items: center;
    padding-bottom: 4rem;
  }

  .hero-inner {
    margin-left: max(var(--hm-pad), calc((100% - var(--hm-max)) / 2));
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-inner,
  .section {
    animation: none;
  }

  .hero-cta,
  .toc-link {
    transition: none;
  }
}
</style>
