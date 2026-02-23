<template>
  <nav v-if="isMobile" 
    class="bottom-nav" 
    :class="{ 'nav-hidden': isNavHidden }"
    @mouseenter="showNav"
    @mouseleave="hideNav"
  >
    <!-- Botón de autenticación para móvil -->
    <button 
      v-if="!authStore.isAuthenticated"
      @click="showLoginModal = true" 
      class="nav-item auth-item"
    >
      <span class="icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      </span>
      <span class="label">Login</span>
      <span class="ripple"></span>
    </button>
    
    <button 
      v-else
      @click="showUserModal = true" 
      class="nav-item user-item"
    >
      <span class="icon">
        <div v-if="userAvatarUrl" class="user-avatar-icon">
          <img :src="userAvatarUrl" :alt="authStore.userName || authStore.userEmail" class="avatar-icon-image" />
        </div>
        <svg v-else width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </span>
      <span class="label">{{ authStore.userName || 'Usuario' }}</span>
      <span class="ripple"></span>
    </button>
    
    <router-link 
      v-for="(item, index) in navItems" 
      :key="index"
      :to="item.path" 
      class="nav-item"
      :class="{ 'active': route.path === item.path }"
      @click="handleClick"
    >
      <span class="icon" v-html="item.icon"></span>
      <span class="label">{{ item.label }}</span>
      <span class="ripple"></span>
    </router-link>
    
    <!-- Toggle de tema para móvil -->
  </nav>
  
  <!-- Modal de autenticación para móvil -->
  <AuthModal 
    v-model:show="showLoginModal"
    mode="login"
    @success="handleAuthSuccess"
    @close="showLoginModal = false"
  />
  
  <!-- Modal de usuario para móvil -->
  <UserModal 
    v-model:show="showUserModal"
    @close="showUserModal = false"
    @logout="handleLogout"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getUserAvatar } from '@/composables/useAvatar';
import AuthModal from '@/components/auth/AuthModal.vue';
import UserModal from '@/components/auth/UserModal.vue';

const route = useRoute();
const authStore = useAuthStore();
const showLoginModal = ref(false);
const showUserModal = ref(false);
const isNavHidden = ref(false);
let lastScrollY = 0;

// Avatar del usuario
const userAvatarUrl = computed(() => getUserAvatar(authStore.user));

// Inicializar autenticación
onMounted(async () => {
  await authStore.initializeAuth();
});

// Métodos de autenticación
const handleAuthSuccess = () => {
  showLoginModal.value = false;
};

const handleLogout = () => {
  showUserModal.value = false;
};


const isMobile = ref(window.innerWidth <= 900);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

// Navegación actualizada - usando los mismos íconos SVG del sidebar
const navItems = [
  { 
    path: '/colecciones', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>`, 
    label: 'Listas' 
  },
  { 
    path: '/', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>`, 
    label: 'Inicio' 
  },
  { 
    path: '/canciones', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`, 
    label: 'Canciones' 
  },
  { 
    path: '/mas', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`, 
    label: 'Ajustes' 
  }
];

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    isNavHidden.value = true;
  } else {
    isNavHidden.value = false;
  }
  
  lastScrollY = currentScrollY;
};

const showNav = () => {
  isNavHidden.value = false;
};

const hideNav = () => {
  if (window.scrollY > 100) {
    isNavHidden.value = true;
  }
};

const handleClick = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLElement;
  const ripple = button.querySelector('.ripple') as HTMLElement;
  
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  
  ripple.classList.add('active');
  setTimeout(() => ripple.classList.remove('active'), 600);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70px;
  background: #1e293b;
  border-top: 1px solid #475569;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  transition: all var(--transition-normal);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.nav-hidden {
  transform: translateY(100%);
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 13px;
  padding: 8px 16px;
  transition: all var(--transition-normal);
  overflow: hidden;
  border-radius: 12px;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-item:hover {
  transform: translateY(-2px);
  background: #334155;
}

.nav-item.active {
  font-weight: bold;
  background: #334155;
}

.nav-item .icon {
  font-size: 24px;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
}

.nav-item:hover .icon {
  transform: scale(1.1);
}

.nav-item .label {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: var(--color-text-soft);
  opacity: 0.3;
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Estilos para elementos de autenticación y tema */
.auth-item, .user-item, .theme-item {
  background: none;
  border: none;
  color: #cbd5e1;
}

.auth-item:hover, .user-item:hover, .theme-item:hover {
  background: #334155;
}

.user-avatar-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .bottom-nav {
    height: 60px;
  }
  
  .nav-item {
    padding: 6px 12px;
  }
  
  .nav-item .icon {
    font-size: 20px;
  }
  
  .nav-item .label {
    font-size: 11px;
  }
}
</style>