<template>
  <section class="usuarios-admin-view">
    <div class="view-header">
      <BackButton />
      <h1 class="view-title">Administración de Usuarios</h1>
    </div>
    <div class="view-content">
      <RoleManager />
    </div>
  </section>
</template>

<script setup lang="ts">
import BackButton from '@/components/BackButton.vue'
import RoleManager from '@/components/admin/RoleManager.vue'
</script>

<style scoped>
.usuarios-admin-view {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.view-content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .view-header {
    padding: 1rem;
  }

  .view-title {
    font-size: 1.25rem;
  }
}
</style>

