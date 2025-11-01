<template>
  <section class="perfil-view">
    <div class="perfil-header">
      <div class="avatar-container">
        <div class="avatar">
          <span class="avatar-text">{{ userInitials }}</span>
        </div>
        <button class="edit-avatar-btn" @click="editAvatar">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      </div>
      <h1 class="perfil-title">{{ userName }}</h1>
      <p class="perfil-subtitle">{{ userEmail }}</p>
    </div>

    <div class="perfil-stats">
      <div class="stat-card">
        <div class="stat-number">{{ userStats.favoritos }}</div>
        <div class="stat-label">Favoritos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ userStats.canciones }}</div>
        <div class="stat-label">Canciones Agregadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ userStats.playlists }}</div>
        <div class="stat-label">Playlists</div>
      </div>
    </div>

    <div class="perfil-sections">
      <!-- Mis Favoritos -->
      <div class="section">
        <h2 class="section-title">Mis Favoritos</h2>
        <div v-if="favoritos.length === 0" class="empty-state">
          <div class="empty-icon">❤️</div>
          <p>No tienes canciones favoritas aún</p>
          <router-link to="/canciones" class="btn-primary">Explorar Canciones</router-link>
        </div>
        <div v-else class="favoritos-grid">
          <div v-for="cancion in favoritos" :key="cancion.id" class="favorito-card">
            <router-link :to="`/cancion/${cancion.id}`" class="favorito-link">
              <div class="favorito-info">
                <h3>{{ cancion.title }}</h3>
                <p>{{ cancion.artist }}</p>
              </div>
              <button @click.prevent="removeFavorite(cancion.id)" class="remove-fav-btn">
                ❤️
              </button>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Configuración -->
      <div class="section">
        <h2 class="section-title">Configuración</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Notificaciones</h3>
              <p>Recibir notificaciones de nuevas canciones</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.notifications">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <h3>Tema</h3>
              <p>Cambiar entre tema claro y oscuro</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.darkMode">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <h3>Idioma</h3>
              <p>Seleccionar idioma de la interfaz</p>
            </div>
            <select v-model="settings.language" class="language-select">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCancionesStore } from '@/stores/canciones'
import { Cancion } from '@/types/songTypes'

const cancionesStore = useCancionesStore()

// Datos del usuario (simulados por ahora)
const userName = ref('Usuario Demo')
const userEmail = ref('usuario@demo.com')
const userStats = ref({
  favoritos: 12,
  canciones: 5,
  playlists: 3
})

const favoritos = ref<Cancion[]>([])
const settings = ref({
  notifications: true,
  darkMode: false,
  language: 'es'
})

const userInitials = computed(() => {
  return userName.value
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
})

function editAvatar() {
  // TODO: Implementar edición de avatar
  console.log('Editar avatar')
}

function removeFavorite(cancionId: string) {
  // TODO: Implementar remover de favoritos
  console.log('Remover favorito:', cancionId)
}

onMounted(async () => {
  // Cargar datos del usuario
  await cancionesStore.loadCanciones()
})
</script>

<style scoped>
.perfil-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-background);
}

.perfil-header {
  text-align: center;
  margin-bottom: 3rem;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cf-navy), var(--cf-navy-light));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.avatar-text {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: transform 0.2s ease;
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
}

.perfil-title {
  font-size: 2rem;
  color: var(--cf-navy);
  margin-bottom: 0.5rem;
}

.perfil-subtitle {
  color: var(--cf-navy-light);
  font-size: 1.1rem;
}

.perfil-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--color-background-card);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--color-border);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--cf-navy);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.perfil-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: var(--color-background-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--color-border);
}

.section-title {
  font-size: 1.5rem;
  color: var(--cf-navy);
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--cf-navy-light);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.btn-primary {
  display: inline-block;
  background: var(--cf-navy);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: var(--cf-navy-dark);
}

.favoritos-grid {
  display: grid;
  gap: 1rem;
}

.favorito-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.favorito-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.favorito-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
}

.favorito-info h3 {
  color: var(--cf-navy);
  margin-bottom: 0.25rem;
}

.favorito-info p {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.remove-fav-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.remove-fav-btn:hover {
  background: rgba(255,0,0,0.1);
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h3 {
  color: var(--cf-navy);
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.setting-info p {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--color-background-card);
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-text-soft);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.language-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background-card);
  color: var(--cf-navy);
}

@media (max-width: 768px) {
  .perfil-view {
    padding: 1rem;
  }
  
  .perfil-stats {
    grid-template-columns: 1fr;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
