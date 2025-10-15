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
    
    <!-- Sección de autenticación discreta -->
    <div class="auth-section">
      <div v-if="!authStore.isAuthenticated" class="auth-buttons">
        <button @click="showLoginModal = true" class="auth-btn login-btn" title="Iniciar Sesión">
          <span class="icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </span>
          <span class="label">Login</span>
        </button>
      </div>
      
      <div v-else class="user-section">
        <div class="user-info">
          <span class="user-email">{{ authStore.userEmail }}</span>
        </div>
        <button @click="handleLogout" class="auth-btn logout-btn" title="Cerrar Sesión">
          <span class="icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="label">Salir</span>
        </button>
      </div>
    </div>
    
    <!-- Modal de autenticación -->
    <AuthModal 
      v-model:show="showLoginModal"
      mode="login"
      @success="handleAuthSuccess"
      @close="showLoginModal = false"
    />
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AuthModal from '@/components/auth/AuthModal.vue';

const route = useRoute();
const authStore = useAuthStore();
const showLoginModal = ref(false);

// Inicializar autenticación
onMounted(async () => {
  await authStore.initializeAuth();
});

// Métodos de autenticación
const handleLogout = async () => {
  await authStore.logout();
};

const handleAuthSuccess = () => {
  showLoginModal.value = false;
};

const navItems = [
  {
    path: '/',
    label: 'Inicio',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>`
  },
  {
    path: '/colecciones',
    label: 'Listas',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>`
  },
  {
    path: '/canciones',
    label: 'Canciones',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
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
  background: linear-gradient(to bottom, #1A1A2E, #16213E);
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.3);
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
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s ease;
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
  background: none;
  color: #93C5FD;
}
/* Sección de autenticación discreta */
.auth-section {
  margin-top: auto;
  padding: 16px 0;
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.auth-buttons, .user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.auth-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 0 6px 0;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 12px;
  transition: all 0.2s ease;
  outline: none;
  border: none;
  cursor: pointer;
  background: none;
  opacity: 0.7;
}

.auth-btn:hover {
  opacity: 1;
  color: rgba(255, 255, 255, 0.8);
}

.auth-btn .icon {
  margin-bottom: 2px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-btn .label {
  font-size: 9px;
  font-weight: 400;
  opacity: 0.8;
  letter-spacing: 0.5px;
}

.login-btn:hover, .login-btn:focus {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.logout-btn:hover, .logout-btn:focus {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.user-info {
  margin-bottom: 6px;
  text-align: center;
}

.user-email {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.4);
  word-break: break-all;
  padding: 0 6px;
  opacity: 0.6;
}

@media (max-width: 900px) {
  .sidebar-nav {
    display: none;
  }
}
</style>