<template>
  <div class="sections-crud">

    <!-- Header con botón para agregar -->
    <div v-if="sections.length > 0" class="crud-header">
      <button @click="showCreateForm = true" class="btn btn-primary">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14m7-7H5"/>
        </svg>
        Nueva Sección
      </button>
    </div>

    <!-- Lista de secciones -->
    <div class="sections-list">
      <div v-if="sections.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h4>No hay secciones creadas</h4>
        <p>Crea tu primera sección para organizar las canciones de tu lista.</p>
        <button @click="showCreateForm = true" class="btn btn-primary btn-large">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v14m7-7H5"/>
          </svg>
          Crear Primera Sección
        </button>
      </div>

      <div v-else class="sections-list-simple">
        <div
          v-for="section in sections"
          :key="section.id"
          class="section-item"
        >
          <div class="section-main">
            <div class="section-info">
              <div class="section-details">
                <h4 class="section-name">{{ section.name }}</h4>
                <span class="song-count">{{ getSectionSongCount(section.id) }} canciones</span>
              </div>
            </div>
            
            <div class="section-controls">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  :checked="section.enabled" 
                  @change="toggleSectionVisibility(section)"
                >
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">{{ section.enabled ? 'Visible' : 'Oculta' }}</span>
            </div>
            
            <div class="section-actions">
              <button @click="editSection(section)" class="action-btn edit-btn" title="Editar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button @click="deleteSection(section)" class="action-btn delete-btn" title="Eliminar">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulario para crear/editar sección -->
    <div v-if="showCreateForm || showEditForm" class="form-overlay">
      <div class="form-container">
        <div class="form-header">
          <h3>{{ isEditing ? 'Editar Sección' : 'Nueva Sección' }}</h3>
          <button @click="closeForm" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveSection" class="section-form">
          <div class="form-group">
            <label for="section-name">Nombre de la sección *</label>
            <input
              id="section-name"
              v-model="formData.name"
              type="text"
              placeholder="Ej: Introducción, Alabanza, Adoración..."
              class="form-input"
              maxlength="50"
              required
            />
            <small class="form-help">Máximo 50 caracteres</small>
          </div>


          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!formData.name.trim()">
              {{ isEditing ? 'Actualizar' : 'Crear' }} Sección
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar -->
    <Modal :show="showDeleteConfirm" @close="showDeleteConfirm = false" size="sm">
      <template #header>
        <h3>Confirmar Eliminación</h3>
      </template>

      <template #body>
        <div class="delete-confirm">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que quieres eliminar la sección <strong>"{{ sectionToDelete?.name }}"</strong>?</p>
          
          <div v-if="getSectionSongCount(sectionToDelete?.id || '') > 0" class="songs-warning">
            <p><strong>Esta sección tiene {{ getSectionSongCount(sectionToDelete?.id || '') }} canciones.</strong></p>
            <p>¿Qué quieres hacer con estas canciones?</p>
            
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="deleteOption" 
                  value="move" 
                />
                <span>Mover a otra sección</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="deleteOption" 
                  value="unassigned" 
                />
                <span>Dejar sin clasificar</span>
              </label>
            </div>

            <div v-if="deleteOption === 'move'" class="form-group">
              <label for="target-section">Sección destino</label>
              <select id="target-section" v-model="targetSectionId" class="form-select">
                <option value="">Selecciona una sección</option>
                <option 
                  v-for="section in sections.filter(s => s.id !== sectionToDelete?.id)" 
                  :key="section.id" 
                  :value="section.id"
                >
                  {{ section.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false" class="btn btn-secondary">
            Cancelar
          </button>
          <button 
            @click="confirmDelete" 
            class="btn btn-danger"
            :disabled="deleteOption === 'move' && !targetSectionId"
          >
            Eliminar Sección
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import type { CollectionSection } from '../api/sections';

interface Props {
  sections: CollectionSection[];
  songsBySection: { [sectionId: string]: any[] };
}

interface Emits {
  (e: 'create-section', data: { name: string; description: string; color: string }): void;
  (e: 'update-section', section: CollectionSection, data: { name: string; description: string; color: string }): void;
  (e: 'delete-section', section: CollectionSection, options?: { moveToSection?: string; moveToUnassigned?: boolean }): void;
  (e: 'toggle-section', section: CollectionSection, enabled: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();


// Estado del formulario
const showCreateForm = ref(false);
const showEditForm = ref(false);
const isEditing = ref(false);
const editingSection = ref<CollectionSection | null>(null);

// Estado para eliminación
const showDeleteConfirm = ref(false);
const sectionToDelete = ref<CollectionSection | null>(null);
const deleteOption = ref<'move' | 'unassigned'>('unassigned');
const targetSectionId = ref('');

// Datos del formulario
const formData = ref({
  name: '',
  description: '',
  color: '#3b82f6'
});

// Computed
const sections = computed(() => props.sections);

// Métodos
function getSectionSongCount(sectionId: string): number {
  return props.songsBySection[sectionId]?.length || 0;
}

function editSection(section: CollectionSection) {
  isEditing.value = true;
  editingSection.value = section;
  formData.value = {
    name: section.name,
    description: section.description || '',
    color: section.color
  };
  showEditForm.value = true;
}

function deleteSection(section: CollectionSection) {
  sectionToDelete.value = section;
  deleteOption.value = 'unassigned';
  targetSectionId.value = '';
  showDeleteConfirm.value = true;
}

function saveSection() {
  if (!formData.value.name.trim()) return;

  if (isEditing.value && editingSection.value) {
    emit('update-section', editingSection.value, { ...formData.value });
  } else {
    emit('create-section', { ...formData.value });
  }

  closeForm();
}

function confirmDelete() {
  if (!sectionToDelete.value) return;

  const options: { moveToSection?: string; moveToUnassigned?: boolean } = {};
  
  if (deleteOption.value === 'move' && targetSectionId.value) {
    options.moveToSection = targetSectionId.value;
  } else {
    options.moveToUnassigned = true;
  }

  emit('delete-section', sectionToDelete.value, options);
  showDeleteConfirm.value = false;
  sectionToDelete.value = null;
}

function closeForm() {
  showCreateForm.value = false;
  showEditForm.value = false;
  isEditing.value = false;
  editingSection.value = null;
  resetForm();
}

function resetForm() {
  formData.value = {
    name: '',
    description: '',
    color: '#3b82f6'
  };
}

function toggleSectionVisibility(section: CollectionSection) {
  emit('toggle-section', section, !section.enabled);
}
</script>

<style scoped>
.sections-crud {
  padding: 1rem;
}

.crud-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
}

.sections-list {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-soft);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  color: var(--color-text-soft);
}

/* Lista simple de secciones */
.sections-list-simple {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.section-item:last-child {
  border-bottom: none;
}

.section-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}


.section-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.section-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.2;
}

.song-count {
  font-size: 0.875rem;
  color: var(--color-text-soft);
  font-weight: 400;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.section-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-mute);
}

.edit-btn:hover {
  background: var(--color-background-hover);
  color: var(--color-text);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem 1rem 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.875rem;
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  background: var(--color-background);
  color: var(--color-text);
}

.form-input::placeholder, .form-textarea::placeholder {
  color: var(--color-text-mute);
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-help {
  font-size: 0.75rem;
  color: var(--color-text-mute);
}


.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.delete-confirm {
  text-align: center;
  padding: 1rem;
  color: var(--color-text);
}

.delete-confirm strong {
  color: var(--color-heading);
}

.warning-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.delete-confirm p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
  color: var(--color-text);
}

.songs-warning {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: left;
}

.songs-warning p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
}

.songs-warning p strong {
  color: var(--color-warning);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
}

.radio-option input[type="radio"] {
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-background-hover);
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
}

/* Formulario inline */
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
}

.form-container {
  background: var(--color-background-card);
  border-radius: 8px;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.form-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
}

.form-header .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-mute);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.form-header .close-btn:hover {
  color: var(--color-text);
  background: var(--color-background-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .section-item {
    padding: 0.5rem 0;
  }
  
  .section-main {
    gap: 0.75rem;
  }
  
  .section-info {
    gap: 0.5rem;
  }
  
  .section-name {
    font-size: 0.9rem;
  }
  
  .song-count {
    font-size: 0.8rem;
  }
  
  .form-container {
    max-width: 95%;
    margin: 0.5rem;
  }
  
  .form-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .form-header h3 {
    font-size: 1.125rem;
  }
  
  .btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .btn-large {
    font-size: 0.9rem;
    padding: 0.6rem 1.2rem;
  }
}

/* Media queries específicas para teléfonos */
@media (max-width: 480px) {
  .section-item {
    padding: 0.4rem 0;
  }
  
  .section-name {
    font-size: 0.85rem;
  }
  
  .song-count {
    font-size: 0.75rem;
  }
  
  .empty-state h4 {
    font-size: 1rem;
  }
  
  .empty-state p {
    font-size: 0.85rem;
  }
  
  .btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.7rem;
  }
  
  .btn-large {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }
  
  .form-input, .form-textarea, .form-select {
    font-size: 0.8rem;
    padding: 0.6rem;
  }
  
  .form-group label {
    font-size: 0.8rem;
  }
  
  .form-help {
    font-size: 0.7rem;
  }
  
  .radio-option {
    font-size: 0.8rem;
  }
  
  .form-header h3 {
    font-size: 1rem;
  }
}

/* Media query adicional para teléfonos muy pequeños */
@media (max-width: 360px) {
  .section-name {
    font-size: 0.8rem;
  }
  
  .song-count {
    font-size: 0.7rem;
  }
  
  .empty-state h4 {
    font-size: 0.9rem;
  }
  
  .empty-state p {
    font-size: 0.8rem;
  }
  
  .btn {
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
  }
  
  .btn-large {
    font-size: 0.8rem;
    padding: 0.45rem 0.9rem;
  }
  
  .form-input, .form-textarea, .form-select {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
  
  .form-group label {
    font-size: 0.75rem;
  }
  
  .form-help {
    font-size: 0.65rem;
  }
  
  .radio-option {
    font-size: 0.75rem;
  }
  
  .form-header h3 {
    font-size: 0.9rem;
  }
}

/* Estilos para el toggle switch */
.section-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: .4s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: var(--color-background-card);
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--color-info);
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-soft);
}
</style>
