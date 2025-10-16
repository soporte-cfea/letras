<template>
  <nav v-if="isMobile" 
    class="bottom-nav" 
    :class="{ 'nav-hidden': isNavHidden }"
    @mouseenter="showNav"
    @mouseleave="hideNav"
  >
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
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </span>
      <span class="label">{{ authStore.userName || 'Usuario' }}</span>
      <span class="ripple"></span>
    </button>
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
    @editProfile="handleEditProfile"
  />
  
  <!-- Modal de edición de perfil para móvil -->
  <ProfileEditModal 
    v-model:show="showProfileEditModal"
    @close="showProfileEditModal = false"
    @success="handleProfileEditSuccess"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AuthModal from '@/components/auth/AuthModal.vue';
import UserModal from '@/components/auth/UserModal.vue';
import ProfileEditModal from '@/components/auth/ProfileEditModal.vue';

const route = useRoute();
const authStore = useAuthStore();
const showLoginModal = ref(false);
const showUserModal = ref(false);
const showProfileEditModal = ref(false);
const isNavHidden = ref(false);
let lastScrollY = 0;

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

const handleEditProfile = () => {
  showProfileEditModal.value = true;
};


const handleProfileEditSuccess = () => {
  console.log('Perfil actualizado correctamente');
};

const isMobile = ref(window.innerWidth <= 900);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

// Navegación actualizada - usando los mismos íconos SVG del sidebar
const navItems = [
  { 
    path: '/', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>`, 
    label: 'Inicio' 
  },
  { 
    path: '/colecciones', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>`, 
    label: 'Listas' 
  },
  { 
    path: '/canciones', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`, 
    label: 'Canciones' 
  },
  { 
    path: '/mas', 
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`, 
    label: 'Más' 
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
  background: linear-gradient(to top, #1A1A2E, #16213E);
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
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
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 13px;
  padding: 8px 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  border-radius: 12px;
}

.nav-item:hover {
  color: var(--cf-gold);
  transform: translateY(-2px);
  background: none;
}

.nav-item.active {
  color: var(--cf-gold);
  font-weight: bold;
  background: none;
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
  background: rgba(255, 255, 255, 0.3);
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

/* Estilos para elementos de autenticación - consistentes con la paleta */
.auth-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
}

.auth-item:hover {
  background: rgba(59, 130, 246, 0.05);
  color: var(--cf-gold);
}

.user-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
}

.user-item:hover {
  background: rgba(59, 130, 246, 0.05);
  color: var(--cf-gold);
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