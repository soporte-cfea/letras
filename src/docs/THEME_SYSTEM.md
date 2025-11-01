# Sistema de Temas - Letras App

## Descripción

Se ha implementado un sistema de temas profesional y moderno que permite alternar entre modo claro, oscuro y automático (basado en la preferencia del sistema).

## Características

### 🎨 **Temas Disponibles**
- **Claro**: Tema con colores claros y fondo blanco
- **Oscuro**: Tema con colores oscuros y fondo negro/azul marino
- **Automático**: Sigue la preferencia del sistema operativo

### 🔧 **Componentes Implementados**

#### 1. **useTheme Composable** (`src/composables/useTheme.ts`)
- Gestión reactiva del estado del tema
- Persistencia en localStorage
- Detección automática de preferencias del sistema
- API para cambiar temas programáticamente

#### 2. **ThemeToggle Component** (`src/components/ThemeToggle.vue`)
- Botón para alternar entre temas
- Versión compacta (solo icono) y completa
- Animaciones suaves
- Indicadores visuales del estado actual

#### 3. **ThemeStatus Component** (`src/components/ThemeStatus.vue`)
- Indicador de estado del tema actual
- Posicionamiento flotante
- Diseño responsive

### 🎯 **Variables CSS Implementadas**

#### Colores Base
```css
--cf-gold: #daba09;           /* Color principal dorado */
--cf-gold-light: #f4d03f;     /* Dorado claro */
--cf-gold-dark: #b8941f;      /* Dorado oscuro */
--cf-navy: #1a1a2e;           /* Azul marino */
--cf-navy-light: #283593;     /* Azul marino claro */
--cf-navy-dark: #0d1333;      /* Azul marino oscuro */
```

#### Variables de Tema Claro
```css
--color-background: #ffffff;
--color-background-soft: #f8fafc;
--color-background-mute: #f1f5f9;
--color-background-card: #ffffff;
--color-text: #1e293b;
--color-text-soft: #64748b;
--color-text-mute: #94a3b8;
--color-heading: #0f172a;
--color-accent: var(--cf-gold);
--color-border: #e2e8f0;
```

#### Variables de Tema Oscuro
```css
--color-background: #0f172a;
--color-background-soft: #1e293b;
--color-background-mute: #334155;
--color-background-card: #1e293b;
--color-text: #f1f5f9;
--color-text-soft: #cbd5e1;
--color-text-mute: #94a3b8;
--color-heading: #ffffff;
--color-accent: var(--cf-gold);
--color-border: #475569;
```

### 🚀 **Uso del Sistema**

#### En Componentes Vue
```vue
<script setup>
import { useTheme } from '@/composables/useTheme'

const { theme, isDark, toggleTheme, applyTheme } = useTheme()

// Cambiar tema programáticamente
applyTheme('dark')

// Alternar tema
toggleTheme()

// Verificar si es oscuro
console.log(isDark.value)
</script>
```

#### En CSS
```css
.mi-componente {
  background: var(--color-background-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.mi-componente:hover {
  background: var(--color-background-hover);
  color: var(--color-accent);
}
```

### 📱 **Responsive Design**

El sistema está optimizado para diferentes tamaños de pantalla:

- **Desktop**: Toggle en sidebar con etiqueta
- **Mobile**: Toggle en bottom navigation
- **Tablet**: Adaptación automática según el breakpoint

### 🎨 **Clases de Utilidad**

```css
/* Colores de fondo */
.bg-primary { background: var(--color-background); }
.bg-soft { background: var(--color-background-soft); }
.bg-card { background: var(--color-background-card); }

/* Colores de texto */
.text-primary { color: var(--color-text); }
.text-soft { color: var(--color-text-soft); }
.text-accent { color: var(--color-accent); }

/* Bordes */
.border-primary { border-color: var(--color-border); }
.border-hover { border-color: var(--color-border-hover); }

/* Sombras */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
```

### 🔄 **Transiciones**

Todas las transiciones están centralizadas:
```css
--transition-fast: 0.15s ease;
--transition-normal: 0.3s ease;
--transition-slow: 0.5s ease;
```

### 📦 **Componentes Actualizados**

- ✅ **App.vue**: Inicialización del sistema
- ✅ **SidebarNav.vue**: Toggle en desktop
- ✅ **BottomNav.vue**: Toggle en mobile
- ✅ **SongCard.vue**: Variables CSS actualizadas
- ✅ **Modal.vue**: Soporte para temas
- ✅ **AuthModal.vue**: Soporte para temas
- ✅ **HomeView.vue**: Variables CSS actualizadas

### 🎯 **Mejoras Implementadas**

1. **Sistema de Variables CSS Robusto**: Todas las variables están centralizadas y son consistentes
2. **Transiciones Suaves**: Todas las transiciones usan las variables centralizadas
3. **Persistencia**: El tema se guarda en localStorage
4. **Detección Automática**: Respeta las preferencias del sistema
5. **Responsive**: Funciona perfectamente en todos los dispositivos
6. **Accesibilidad**: Indicadores visuales claros del estado actual
7. **Performance**: Transiciones optimizadas y sin parpadeos

### 🚀 **Próximos Pasos**

- [ ] Agregar más variaciones de tema (alto contraste, etc.)
- [ ] Implementar animaciones de cambio de tema más elaboradas
- [ ] Agregar preferencias de usuario para personalizar colores
- [ ] Implementar tema basado en hora del día

## Conclusión

El sistema de temas implementado es profesional, moderno y sigue las mejores prácticas de diseño. Proporciona una experiencia de usuario excelente tanto en modo claro como oscuro, con transiciones suaves y un diseño consistente en toda la aplicación.
