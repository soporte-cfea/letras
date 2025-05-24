<template>
  <nav class="sidebar-nav" aria-label="Menú principal">
    <ul>
      <li v-for="item in navItems" :key="item.path">
        <router-link :to="item.path" class="sidebar-link" :class="{ active: route.path === item.path }" tabindex="0">
          <span class="icon" v-html="item.icon"></span>
          <span class="label">{{ item.label }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();

const navItems = [
  {
    path: '/',
    label: 'Inicio',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>`
  },
  {
    path: '/canciones',
    label: 'Canciones',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><line x1="12" y1="10" x2="12" y2="16"/><circle cx="12" cy="17" r="1"/></svg>`
  },
  {
    path: '/buscar',
    label: 'Buscar',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
  },
  {
    path: '/biblioteca',
    label: 'Biblioteca',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>`
  },
  {
    path: '/perfil',
    label: 'Perfil',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M16 16a4 4 0 0 0-8 0"/></svg>`
  },
  {
    path: '/mas',
    label: 'Más',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`
  }
];
</script>

<style scoped>
.sidebar-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 80px;
  height: 100vh;
  background: linear-gradient(to bottom, var(--cf-navy), var(--cf-navy-dark));
  box-shadow: 2px 0 16px #0002;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
  z-index: 1200;
  transition: width 0.2s;
}
.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}
.sidebar-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 18px 0 10px 0;
  color: var(--cf-navy-light);
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s, color 0.2s;
  outline: none;
  border: none;
  cursor: pointer;
}
.sidebar-link .icon {
  margin-bottom: 6px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-link .label {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.95;
}
.sidebar-link.active, .sidebar-link:focus, .sidebar-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--cf-gold);
}
@media (max-width: 900px) {
  .sidebar-nav {
    display: none;
  }
}
</style>