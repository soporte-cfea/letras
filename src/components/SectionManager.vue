<template>
  <Modal :show="show" @close="closeModal" size="md">
    <template #header>
      <h3>{{ isEditing ? 'Editar Sección' : 'Gestionar Secciones' }}</h3>
    </template>

    <template #body>
      <!-- Formulario para crear/editar sección -->
      <div v-if="showForm" class="section-form">
        <div class="form-group">
          <label for="section-name">Nombre de la sección</label>
          <input
            id="section-name"
            v-model="formData.name"
            type="text"
            placeholder="Ej: Introducción, Alabanza, Adoración..."
            class="form-input"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="section-description">Descripción (opcional)</label>
          <textarea
            id="section-description"
            v-model="formData.description"
            placeholder="Descripción de la sección..."
            class="form-textarea"
            rows="2"
            maxlength="200"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="section-color">Color</label>
          <div class="color-picker">
            <div
              v-for="color in availableColors"
              :key="color"
              :class="['color-option', { active: formData.color === color }]"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            ></div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="cancelForm" class="btn btn-secondary">Cancelar</button>
          <button @click="saveSection" class="btn btn-primary" :disabled="!formData.name.trim()">
            {{ isEditing ? 'Actualizar' : 'Crear' }} Sección
          </button>
        </div>
      </div>

      <!-- Lista de secciones existentes -->
      <div v-else class="sections-list">
        <div class="list-header">
          <h4>Secciones de la lista</h4>
          <button @click="showCreateForm" class="btn btn-primary btn-sm">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            Nueva Sección
          </button>
        </div>

        <div v-if="sections.length === 0" class="empty-state">
          <p>No hay secciones creadas. Crea una para organizar tus canciones.</p>
        </div>

        <div v-else class="sections-grid">
          <div
            v-for="section in sections"
            :key="section.id"
            class="section-item"
            :style="{ borderLeftColor: section.color }"
          >
            <div class="section-content">
              <h5 class="section-name">{{ section.name }}</h5>
              <p v-if="section.description" class="section-description">{{ section.description }}</p>
              <span class="section-songs">{{ getSectionSongCount(section.id) }} canciones</span>
            </div>
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
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from './Modal.vue';
import type { CollectionSection } from '../api/sections';

interface Props {
  show: boolean;
  sections: CollectionSection[];
  songsBySection: { [sectionId: string]: any[] };
}

interface Emits {
  (e: 'close'): void;
  (e: 'create-section', data: { name: string; description: string; color: string }): void;
  (e: 'update-section', section: CollectionSection, data: { name: string; description: string; color: string }): void;
  (e: 'delete-section', section: CollectionSection): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showForm = ref(false);
const isEditing = ref(false);
const editingSection = ref<CollectionSection | null>(null);

const formData = ref({
  name: '',
  description: '',
  color: '#3b82f6'
});

const availableColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

function getSectionSongCount(sectionId: string): number {
  return props.songsBySection[sectionId]?.length || 0;
}

function showCreateForm() {
  showForm.value = true;
  isEditing.value = false;
  editingSection.value = null;
  resetForm();
}

function editSection(section: CollectionSection) {
  showForm.value = true;
  isEditing.value = true;
  editingSection.value = section;
  formData.value = {
    name: section.name,
    description: section.description || '',
    color: section.color
  };
}

function deleteSection(section: CollectionSection) {
  if (confirm(`¿Estás seguro de que quieres eliminar la sección "${section.name}"?`)) {
    emit('delete-section', section);
  }
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

function cancelForm() {
  closeForm();
}

function closeForm() {
  showForm.value = false;
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

function closeModal() {
  emit('close');
}

// Reset form when modal closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    closeForm();
  }
});
</script>

<style scoped>
.section-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.form-input, .form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.sections-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-content {
  flex: 1;
  min-width: 0;
}

.section-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.section-songs {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .list-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .section-item {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .section-actions {
    justify-content: flex-end;
  }
}
</style>
