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
      :class="{ 'active': $route.path === item.path }"
      @click="handleClick"
    >
      <span class="icon">{{ item.icon }}</span>
      <span class="label">{{ item.label }}</span>
      <span class="ripple"></span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isNavHidden = ref(false);
let lastScrollY = 0;

const isMobile = ref(window.innerWidth <= 900);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 900;
};

const navItems = [
  { path: '/', icon: '🏠', label: 'Inicio' },
  { path: '/buscar', icon: '🔍', label: 'Buscar' },
  { path: '/biblioteca', icon: '📚', label: 'Biblioteca' }
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
  background: linear-gradient(to top, var(--cf-navy), var(--cf-navy-dark));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
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
  color: var(--cf-navy-light);
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
}

.nav-item.active {
  color: var(--cf-gold);
  font-weight: bold;
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