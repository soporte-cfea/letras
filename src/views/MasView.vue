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
import { ref } from "vue";

const showAboutModal = ref(false);

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
      background: white;
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
</script>

<style scoped>
.mas-view {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-background);
}

.mas-header {
  text-align: center;
  margin-bottom: 2rem;
}

.mas-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--cf-navy);
  margin-bottom: 0.25rem;
}

.mas-subtitle {
  color: var(--cf-navy-light);
  font-size: 0.95rem;
  font-weight: 400;
}

.mas-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cf-navy);
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--cf-gold);
  padding-bottom: 0.5rem;
}

.tools-grid {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.tool-card {
  background: var(--color-background-soft);
  padding: 1rem 1.25rem;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border);
  min-width: 140px;
}

.tool-card:hover {
  background: var(--cf-gold);
  color: var(--cf-navy);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.tool-icon {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.tool-card h3 {
  color: var(--cf-navy);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.tool-card p {
  color: var(--cf-navy-light);
  font-size: 0.8rem;
  line-height: 1.3;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.info-item:hover {
  background: var(--color-background-soft);
}

.info-icon {
  font-size: 1rem;
  margin-right: 0.75rem;
  opacity: 0.7;
}

.info-content {
  flex: 1;
}

.info-content h3 {
  color: var(--cf-navy);
  margin-bottom: 0.125rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-content p {
  color: var(--cf-navy-light);
  font-size: 0.8rem;
  line-height: 1.3;
}

.info-arrow {
  color: var(--cf-navy-light);
  font-size: 0.9rem;
  opacity: 0.6;
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
  background: white;
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
    padding: 1.25rem;
  }

  .tool-card {
    min-width: 120px;
    padding: 0.875rem 1rem;
  }
}
</style>
