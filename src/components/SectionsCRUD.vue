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

      <div v-else class="sections-grid">
        <div
          v-for="section in sections"
          :key="section.id"
          class="section-card"
          :style="{ borderLeftColor: section.color }"
        >
          <div class="section-content">
            <div class="section-header">
              <h4 class="section-name">{{ section.name }}</h4>
              <div class="section-actions">
                <button @click="editSection(section)" class="action-btn edit-btn" title="Editar">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click="deleteSection(section)" class="action-btn delete-btn" title="Eliminar">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <p v-if="section.description" class="section-description">{{ section.description }}</p>
            
            <div class="section-stats">
              <span class="song-count">{{ getSectionSongCount(section.id) }} canciones</span>
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
              <div class="color-indicator" :style="{ backgroundColor: section.color }"></div>
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

          <div class="form-group">
            <label for="section-description">Descripción</label>
            <textarea
              id="section-description"
              v-model="formData.description"
              placeholder="Descripción opcional de la sección..."
              class="form-textarea"
              rows="3"
              maxlength="200"
            ></textarea>
            <small class="form-help">Máximo 200 caracteres</small>
          </div>

          <div class="form-group">
            <label>Color de la sección</label>
            <div class="color-picker">
              <div
                v-for="color in availableColors"
                :key="color"
                :class="['color-option', { active: formData.color === color }]"
                :style="{ backgroundColor: color }"
                @click="formData.color = color"
                :title="color"
              ></div>
            </div>
            <small class="form-help">Elige un color para identificar visualmente la sección</small>
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

// Colores disponibles
const availableColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

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
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sections-list {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.section-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.section-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.section-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  min-width: 0;
}

.section-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  color: #6b7280;
}

.edit-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.delete-btn {
  color: #6b7280;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.section-description {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.section-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.song-count {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
}

.section-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #1f2937;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.delete-confirm {
  text-align: center;
  padding: 1rem;
}

.warning-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.delete-confirm p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
  color: #374151;
}

.songs-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: left;
}

.songs-warning p {
  margin: 0 0 0.5rem 0;
  color: #92400e;
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
  color: #374151;
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
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.form-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.form-header .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.form-header .close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Responsive */
@media (max-width: 768px) {
  .sections-grid {
    grid-template-columns: 1fr;
  }
  
  .section-card {
    padding: 0.75rem;
  }
  
  .section-name {
    font-size: 1rem;
  }
  
  .section-description {
    font-size: 0.8rem;
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
  .section-card {
    padding: 0.5rem;
  }
  
  .section-name {
    font-size: 0.9rem;
  }
  
  .section-description {
    font-size: 0.75rem;
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
    font-size: 0.85rem;
  }
  
  .section-description {
    font-size: 0.7rem;
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
  background-color: #ccc;
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
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #3b82f6;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}
</style>
