<template>
  <section class="mas-view">
    <div class="mas-header">
      <h1 class="mas-title">Más Opciones</h1>
      <p class="mas-subtitle">Configuración y herramientas adicionales</p>
    </div>

    <div class="mas-sections">
      <!-- Herramientas -->
      <div class="section">
        <h2 class="section-title">Herramientas</h2>
        <div class="tools-grid">
          <div class="tool-card" @click="exportData">
            <div class="tool-icon">📤</div>
            <h3>Exportar Datos</h3>
            <p>Descargar tus canciones y favoritos</p>
          </div>
          <div class="tool-card" @click="importData">
            <div class="tool-icon">📥</div>
            <h3>Importar Datos</h3>
            <p>Subir canciones desde archivos</p>
          </div>
          <div class="tool-card" @click="backupData">
            <div class="tool-icon">💾</div>
            <h3>Respaldo</h3>
            <p>Crear copia de seguridad</p>
          </div>
          <div class="tool-card" @click="shareApp">
            <div class="tool-icon">🔗</div>
            <h3>Compartir App</h3>
            <p>Invitar a otros usuarios</p>
          </div>
        </div>
      </div>

      <!-- Información -->
      <div class="section">
        <h2 class="section-title">Información</h2>
        <div class="info-list">
          <div class="info-item" @click="showAbout">
            <div class="info-icon">ℹ️</div>
            <div class="info-content">
              <h3>Acerca de</h3>
              <p>Versión 1.0.0 - Información de la app</p>
            </div>
            <div class="info-arrow">›</div>
          </div>
          <div class="info-item" @click="showHelp">
            <div class="info-icon">❓</div>
            <div class="info-content">
              <h3>Ayuda</h3>
              <p>Guías y tutoriales</p>
            </div>
            <div class="info-arrow">›</div>
          </div>
          <div class="info-item" @click="showPrivacy">
            <div class="info-icon">🔒</div>
            <div class="info-content">
              <h3>Privacidad</h3>
              <p>Política de privacidad y términos</p>
            </div>
            <div class="info-arrow">›</div>
          </div>
          <div class="info-item" @click="showContact">
            <div class="info-icon">📧</div>
            <div class="info-content">
              <h3>Contacto</h3>
              <p>Soporte y sugerencias</p>
            </div>
            <div class="info-arrow">›</div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="section">
        <h2 class="section-title">Estadísticas de la App</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ appStats.totalCanciones }}</div>
            <div class="stat-label">Canciones Totales</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ appStats.totalArtistas }}</div>
            <div class="stat-label">Artistas</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ appStats.totalUsuarios }}</div>
            <div class="stat-label">Usuarios</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ appStats.totalLetras }}</div>
            <div class="stat-label">Letras Disponibles</div>
          </div>
        </div>
      </div>

      <!-- Acciones del Sistema -->
      <div class="section">
        <h2 class="section-title">Sistema</h2>
        <div class="system-actions">
          <button class="action-btn primary" @click="clearCache">
            <div class="btn-icon">🗑️</div>
            <div class="btn-content">
              <h3>Limpiar Caché</h3>
              <p>Liberar espacio de almacenamiento</p>
            </div>
          </button>
          <button class="action-btn secondary" @click="resetSettings">
            <div class="btn-icon">⚙️</div>
            <div class="btn-content">
              <h3>Restablecer Configuración</h3>
              <p>Volver a configuración por defecto</p>
            </div>
          </button>
          <button class="action-btn danger" @click="logout">
            <div class="btn-icon">🚪</div>
            <div class="btn-content">
              <h3>Cerrar Sesión</h3>
              <p>Salir de la aplicación</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Acerca de -->
    <div v-if="showAboutModal" class="modal-overlay" @click="closeAboutModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Acerca de Letras</h3>
          <button class="close-btn" @click="closeAboutModal">×</button>
        </div>
        <div class="modal-body">
          <div class="app-info">
            <div class="app-logo">🎵</div>
            <h4>Letras v1.0.0</h4>
            <p>Una aplicación para descubrir, compartir y vivir la música a través de sus letras.</p>
            <p><strong>Desarrollado con:</strong> Vue 3, TypeScript, Supabase, Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showAboutModal = ref(false)

const appStats = ref({
  totalCanciones: 0,
  totalArtistas: 0,
  totalUsuarios: 0,
  totalLetras: 0
})

function exportData() {
  // TODO: Implementar exportación de datos
  console.log('Exportar datos')
}

function importData() {
  // TODO: Implementar importación de datos
  console.log('Importar datos')
}

function backupData() {
  // TODO: Implementar respaldo
  console.log('Crear respaldo')
}

function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Letras - Música para tu Alma',
      text: 'Descubre, comparte y vive la música a través de sus letras',
      url: window.location.origin
    })
  } else {
    // Fallback para navegadores que no soportan Web Share API
    navigator.clipboard.writeText(window.location.origin)
    alert('Enlace copiado al portapapeles')
  }
}

function showAbout() {
  showAboutModal.value = true
}

function closeAboutModal() {
  showAboutModal.value = false
}

function showHelp() {
  // TODO: Implementar vista de ayuda
  console.log('Mostrar ayuda')
}

function showPrivacy() {
  // TODO: Implementar vista de privacidad
  console.log('Mostrar privacidad')
}

function showContact() {
  // TODO: Implementar vista de contacto
  console.log('Mostrar contacto')
}

function clearCache() {
  if (confirm('¿Estás seguro de que quieres limpiar el caché?')) {
    // TODO: Implementar limpieza de caché
    console.log('Limpiar caché')
    alert('Caché limpiado exitosamente')
  }
}

function resetSettings() {
  if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
    // TODO: Implementar restablecimiento
    console.log('Restablecer configuración')
    alert('Configuración restablecida')
  }
}

function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    // TODO: Implementar logout
    console.log('Cerrar sesión')
    alert('Sesión cerrada')
  }
}

onMounted(async () => {
  // Cargar estadísticas de la app
  // TODO: Conectar con Supabase para obtener estadísticas reales
  appStats.value = {
    totalCanciones: 150,
    totalArtistas: 75,
    totalUsuarios: 25,
    totalLetras: 120
  }
})
</script>

<style scoped>
.mas-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-background);
}

.mas-header {
  text-align: center;
  margin-bottom: 3rem;
}

.mas-title {
  font-size: 2.5rem;
  color: var(--cf-navy);
  margin-bottom: 0.5rem;
}

.mas-subtitle {
  color: var(--cf-navy-light);
  font-size: 1.1rem;
}

.mas-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--color-border);
}

.section-title {
  font-size: 1.5rem;
  color: var(--cf-navy);
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--cf-gold);
  padding-bottom: 0.5rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.tool-card {
  background: var(--color-background-soft);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border);
}

.tool-card:hover {
  background: var(--cf-gold);
  color: var(--cf-navy);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.tool-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.tool-card h3 {
  color: var(--cf-navy);
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.tool-card p {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.info-item:hover {
  background: var(--color-background-soft);
}

.info-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.info-content {
  flex: 1;
}

.info-content h3 {
  color: var(--cf-navy);
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.info-content p {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.info-arrow {
  color: var(--cf-navy-light);
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--cf-navy);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
}

.system-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-btn.primary {
  background: var(--cf-navy);
  color: white;
}

.action-btn.primary:hover {
  background: var(--cf-navy-dark);
}

.action-btn.secondary {
  background: var(--color-background-soft);
  color: var(--cf-navy);
  border: 1px solid var(--color-border);
}

.action-btn.secondary:hover {
  background: var(--cf-gold);
}

.action-btn.danger {
  background: #dc3545;
  color: white;
}

.action-btn.danger:hover {
  background: #c82333;
}

.btn-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.btn-content h3 {
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.btn-content p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  color: var(--cf-navy);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--cf-navy-light);
}

.modal-body {
  padding: 1.5rem;
}

.app-info {
  text-align: center;
}

.app-logo {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.app-info h4 {
  color: var(--cf-navy);
  margin-bottom: 1rem;
}

.app-info p {
  color: var(--cf-navy-light);
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .mas-view {
    padding: 1rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
