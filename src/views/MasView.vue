<template>
  <section class="mas-view">
    <div class="mas-header">
      <h1 class="mas-title">Configuración</h1>
    </div>

    <div class="mas-content">
      <!-- Herramientas -->
      <div class="section">
        <h2 class="section-title">Herramientas</h2>
        <div class="settings-list">
          <div class="setting-item" @click="shareApp">
            <div class="setting-icon">🔗</div>
            <div class="setting-content">
              <h3>Compartir App</h3>
              <p>Invitar a otros usuarios</p>
            </div>
            <div class="setting-arrow">›</div>
          </div>
        </div>
      </div>

      <!-- Administración (Solo para super_admin) -->
      <div v-if="isSuperAdmin" class="section">
        <h2 class="section-title">Administración</h2>
        <div class="settings-list">
          <div class="setting-item" @click="showRoleManager">
            <div class="setting-icon">👥</div>
            <div class="setting-content">
              <h3>Gestión de Roles</h3>
              <p>Administrar usuarios y permisos</p>
            </div>
            <div class="setting-arrow">›</div>
          </div>
        </div>
      </div>

      <!-- Configuración -->
      <div class="section">
        <h2 class="section-title">Configuración</h2>
        <div class="settings-list">
          <!-- Configuración de Tema -->
          <div class="config-item">
            <div class="config-label">
              <h3>Tema</h3>
              <p>Elige el modo de visualización</p>
            </div>
            <div class="config-control">
              <select :value="currentTheme" @change="setTheme($event.target.value)" class="config-select">
                <option value="auto">Automático</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
          </div>

          <!-- Configuración de Notificaciones -->
          <div class="config-item">
            <div class="config-label">
              <h3>Notificaciones</h3>
              <p>Recibir notificaciones de la aplicación</p>
            </div>
            <div class="config-control">
              <label class="config-switch">
                <input type="checkbox" v-model="notificationsEnabled" @change="toggleNotifications">
                <span class="config-slider"></span>
              </label>
            </div>
          </div>

          <!-- Configuración de Idioma -->
          <div class="config-item">
            <div class="config-label">
              <h3>Idioma</h3>
              <p>Idioma de la interfaz</p>
            </div>
            <div class="config-control">
              <select v-model="selectedLanguage" @change="changeLanguage" class="config-select">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <!-- Configuración de Tamaño de Fuente -->
          <div class="config-item">
            <div class="config-label">
              <h3>Tamaño de Fuente</h3>
              <p>Ajusta el tamaño del texto</p>
            </div>
            <div class="config-control">
              <div class="config-range">
                <input type="range" v-model="fontSize" @input="updateFontSize" min="12" max="18" class="config-slider-range">
                <span class="config-range-value">{{ fontSize }}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Información -->
      <div class="section">
        <h2 class="section-title">Información</h2>
        <div class="settings-list">
          <div class="setting-item" @click="showAbout">
            <div class="setting-icon">ℹ️</div>
            <div class="setting-content">
              <h3>Acerca de</h3>
              <p>Versión 1.0.0 - Información de la app</p>
            </div>
            <div class="setting-arrow">›</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Gestión de Roles -->
    <div v-if="showRoleManagerModal" class="modal-overlay" @click="closeRoleManagerModal">
      <div class="modal-content role-manager-modal" @click.stop>
        <div class="modal-header">
          <h3>Gestión de Usuarios</h3>
          <button class="close-btn" @click="closeRoleManagerModal">×</button>
        </div>
        <div class="modal-body">
          <RoleManager />
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
            <p class="app-description">
              Una aplicación web como una herramienta para 
              la organización y gestión de canciones cristianas.
            </p>
            
            <div class="features-list">
              <h5>Funcionalidades principales:</h5>
              <ul>
                <li>📚 <strong>Biblioteca de canciones</strong> con letras completas</li>
                <li>🔍 <strong>Búsqueda avanzada</strong> por título, artista y etiquetas</li>
                <li>📁 <strong>Listas personalizadas</strong> (playlists, álbumes, favoritos)</li>
                <li>🏷️ <strong>Sistema de etiquetas</strong> para categorizar canciones</li>
                <li>📝 <strong>Editor de letras</strong> integrado</li>
                <li>🔗 <strong>Recursos multimedia</strong> (Spotify, YouTube, etc.)</li>
                <li>📱 <strong>Diseño responsive</strong> para móviles y escritorio</li>
              </ul>
            </div>
            
            <div class="tech-stack">
              <h5>Tecnologías utilizadas:</h5>
              <div class="tech-tags">
                <span class="tech-tag">Vue 3</span>
                <span class="tech-tag">TypeScript</span>
                <span class="tech-tag">Supabase</span>
                <span class="tech-tag">Pinia</span>
                <span class="tech-tag">Vite</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from '@/stores/auth';
import { usePermissions } from '@/composables/usePermissions';
import RoleManager from '@/components/admin/RoleManager.vue';
import { useTheme } from '@/composables/useTheme';

const authStore = useAuthStore();
const { isSuperAdmin } = usePermissions();
const { theme, applyTheme } = useTheme();
const showAboutModal = ref(false);
const showRoleManagerModal = ref(false);

// Configuraciones reactivas
const currentTheme = ref(theme.value);
const notificationsEnabled = ref(true);
const selectedLanguage = ref('es');
const fontSize = ref(14);

// Funciones para las configuraciones
function setTheme(newTheme: string) {
  applyTheme(newTheme as 'light' | 'dark' | 'auto');
  currentTheme.value = newTheme;
}

function toggleNotifications() {
  // Lógica para manejar notificaciones
  console.log('Notificaciones:', notificationsEnabled.value);
}

function changeLanguage() {
  // Lógica para cambiar idioma
  console.log('Idioma:', selectedLanguage.value);
}

function updateFontSize() {
  // Lógica para actualizar tamaño de fuente
  document.documentElement.style.fontSize = fontSize.value + 'px';
  console.log('Tamaño de fuente:', fontSize.value);
}

async function shareApp() {
  const shareData = {
    title: "Letras - Música para tu Alma",
    text: "Descubre, comparte y vive la música a través de sus letras",
    url: window.location.origin,
  };

  // Detectar si es móvil
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  try {
    // En móviles, intentar Web Share API primero (solo en HTTPS)
    if (isMobile && navigator.share && window.isSecureContext) {
      await navigator.share(shareData);
      return;
    }

    // Fallback para móviles: Mostrar modal con opciones
    if (isMobile) {
      showMobileShareModal(shareData);
      return;
    }

    // En escritorio: Intentar copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      alert("Enlace copiado al portapapeles");
    } else {
      // Fallback final para escritorio
      copyToClipboardFallback(shareData.url);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("Error al compartir:", error);

    // Fallback final
    if (isMobile) {
      showMobileShareModal(shareData);
    } else {
      copyToClipboardFallback(shareData.url);
    }
  }
}

function showMobileShareModal(shareData) {
  const modal = document.createElement("div");
  modal.style.cssText = `
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
    padding: 1rem;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--color-background-card);
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
    ">
      <h3 style="margin: 0 0 1rem 0; color: #1a365d;">Compartir Letras</h3>
      <p style="margin: 0 0 1.5rem 0; color: #4a5568; font-size: 0.9rem;">
        Copia el enlace para compartir la aplicación:
      </p>
      <div style="
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        word-break: break-all;
        font-size: 0.85rem;
        color: #2d3748;
      ">${shareData.url}</div>
      <div style="display: flex; gap: 0.5rem; justify-content: center;">
        <button id="copyBtn" style="
          background: #3182ce;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        ">Copiar Enlace</button>
        <button id="closeBtn" style="
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        ">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const copyBtn = modal.querySelector("#copyBtn");
  const closeBtn = modal.querySelector("#closeBtn");

  copyBtn.onclick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        copyBtn.textContent = "¡Copiado!";
        copyBtn.style.background = "#38a169";
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 1500);
      } else {
        copyToClipboardFallback(shareData.url);
        copyBtn.textContent = "¡Copiado!";
        copyBtn.style.background = "#38a169";
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 1500);
      }
    } catch (err) {
      console.error("Error al copiar:", err);
      copyBtn.textContent = "Error al copiar";
      copyBtn.style.background = "#e53e3e";
    }
  };

  closeBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  // Cerrar al hacer clic fuera del modal
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

function copyToClipboardFallback(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    alert("Enlace copiado al portapapeles");
  } catch (err) {
    console.error("Error al copiar:", err);
    alert(
      "No se pudo copiar el enlace. Por favor, cópialo manualmente: " + text
    );
  } finally {
    document.body.removeChild(textArea);
  }
}

function showAbout() {
  showAboutModal.value = true;
}

function closeAboutModal() {
  showAboutModal.value = false;
}

function showRoleManager() {
  showRoleManagerModal.value = true;
}

function closeRoleManagerModal() {
  showRoleManagerModal.value = false;
}

</script>

<style scoped>
.mas-view {
  min-height: 100vh;
  background: var(--color-background);
  padding: 0;
  display: flex;
  flex-direction: column;
}

.mas-header {
  padding: 1rem 1rem 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.mas-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  transition: color var(--transition-normal);
}

.mas-content {
  flex: 1;
  padding: 0;
}

.section {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-mute);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0.5rem 1rem 0.25rem 1rem;
  padding: 0;
  border: none;
  transition: color var(--transition-normal);
}

.settings-list {
  display: flex;
  flex-direction: column;
  background: var(--color-background-card);
  border-radius: 8px;
  margin: 0 1rem 0.25rem 1rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: var(--color-background-hover);
}

.setting-item:active {
  background: var(--color-background-soft);
  transform: scale(0.98);
}

.setting-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.setting-content {
  flex: 1;
  min-width: 0;
}

.setting-content h3 {
  color: var(--color-text);
  margin: 0 0 0.0625rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--transition-normal);
}

.setting-content p {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  line-height: 1.1;
  margin: 0;
  transition: color var(--transition-normal);
}

.setting-arrow {
  color: var(--color-text-mute);
  font-size: 1rem;
  font-weight: 300;
  opacity: 0.6;
  transition: all var(--transition-normal);
  margin-left: 0.25rem;
}

.setting-item:hover .setting-arrow {
  opacity: 1;
  transform: translateX(2px);
}

/* Estilos para el sistema de configuraciones */
.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-normal);
}

.config-item:last-child {
  border-bottom: none;
}

.config-item:hover {
  background: var(--color-background-hover);
}

.config-label {
  flex: 1;
  min-width: 0;
}

.config-label h3 {
  color: var(--color-text);
  margin: 0 0 0.125rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--transition-normal);
}

.config-label p {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  line-height: 1.1;
  margin: 0;
  transition: color var(--transition-normal);
}

.config-control {
  margin-left: 1rem;
  flex-shrink: 0;
}

/* Select estilos */
.config-select {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--color-text);
  font-size: 0.85rem;
  min-width: 120px;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.config-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(218, 186, 9, 0.1);
}

.config-select:hover {
  border-color: var(--color-border-hover);
}

/* Switch estilos */
.config-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.config-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.config-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  transition: all var(--transition-normal);
}

.config-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: var(--color-text-mute);
  border-radius: 50%;
  transition: all var(--transition-normal);
}

.config-switch input:checked + .config-slider {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.config-switch input:checked + .config-slider:before {
  transform: translateX(20px);
  background-color: var(--color-text-inverse);
}

/* Range slider estilos */
.config-range {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 150px;
}

.config-slider-range {
  flex: 1;
  height: 4px;
  background: var(--color-background-soft);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.config-slider-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.config-slider-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.config-slider-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all var(--transition-normal);
}

.config-range-value {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-background-card);
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  color: var(--cf-navy);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--cf-navy-light);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.25rem;
}

.app-info {
  text-align: center;
}

.app-logo {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.8;
}

.app-info h4 {
  color: var(--cf-navy);
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.app-description {
  color: var(--cf-navy-light);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: left;
}

.features-list {
  margin-bottom: 1.5rem;
  text-align: left;
}

.features-list h5 {
  color: var(--cf-navy);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.features-list ul {
  margin: 0;
  padding-left: 1rem;
  list-style: none;
}

.features-list li {
  color: var(--cf-navy-light);
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.tech-stack {
  margin-bottom: 1.5rem;
  text-align: left;
}

.tech-stack h5 {
  color: var(--cf-navy);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tech-tag {
  background: var(--cf-gold);
  color: var(--cf-navy);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .mas-view {
    padding: 1rem;
  }

  .mas-title {
    font-size: 1.5rem;
  }

  .section {
    padding: 1rem 0;
  }

  .tool-card {
    min-width: 120px;
    padding: 0.875rem 1rem;
  }
}

/* Estilos para la sección de administración */
.admin-section {
  border-left: 4px solid var(--color-accent);
  background: linear-gradient(135deg, rgba(218, 186, 9, 0.05), rgba(218, 186, 9, 0.02));
}

.admin-section .section-title {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* Modal de gestión de roles */
.role-manager-modal {
  max-width: 90vw;
  max-height: 90vh;
  width: 900px;
}

.role-manager-modal .modal-body {
  padding: 0;
  max-height: 75vh;
  overflow-y: auto;
  background: #f9fafb;
}
</style>
