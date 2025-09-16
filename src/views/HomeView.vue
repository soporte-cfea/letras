<template>
  <section class="home-view">
    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="animated-title">Música para tu Alma</h1>
      <p class="subtitle">Descubre, comparte y vive la música a través de sus letras</p>
      <div class="wave-animation"></div>
    </div>

    <!-- Featured Section -->
    <div class="featured-section">
      <h2>Destacados de la Semana</h2>
      <div class="cards-container">
        <div class="card" v-for="(song, index) in featuredSongs" :key="index">
          <div class="card-image" :style="{ backgroundImage: `url(${song.image})` }">
            <div class="card-overlay"></div>
          </div>
          <div class="card-content">
            <h3>{{ song.title }}</h3>
            <p>{{ song.artist }}</p>
            <div class="tags">
              <span v-for="tag in song.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- News Section -->
    <div class="news-section">
      <h2>Últimas Actualizaciones</h2>
      <div class="news-grid">
        <article v-for="(news, index) in latestNews" :key="index" class="news-card">
          <span class="news-date">{{ news.date }}</span>
          <h3>{{ news.title }}</h3>
          <p>{{ news.excerpt }}</p>
        </article>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-number">{{ stats.songs }}+</span>
        <span class="stat-label">Canciones</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.artists }}+</span>
        <span class="stat-label">Artistas</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ stats.users }}+</span>
        <span class="stat-label">Usuarios</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const featuredSongs = ref([
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    tags: ["Rock", "Clásico"],
    image: "https://picsum.photos/300/200"
  },
  {
    title: "Despacito",
    artist: "Luis Fonsi",
    tags: ["Pop", "Latino"],
    image: "https://picsum.photos/300/201"
  },
  {
    title: "Shape of You",
    artist: "Ed Sheeran",
    tags: ["Pop", "Internacional"],
    image: "https://picsum.photos/300/202"
  }
])

const latestNews = ref([
  {
    date: "2024-01-15",
    title: "Nueva Funcionalidad de Búsqueda",
    excerpt: "Ahora puedes buscar por acordes y tonalidad"
  },
  {
    date: "2024-01-14",
    title: "Colaboración con Artistas Locales",
    excerpt: "Más de 100 nuevas canciones agregadas"
  }
])

const stats = ref({
  songs: "1,000",
  artists: "500",
  users: "10,000"
})
</script>

<style scoped>
.home-view {
  padding: 0 0 80px 0;
  background: var(--color-background);
  overflow: hidden;
}

/* Hero Section */
.hero-section {
  height: 60vh;
  min-height: 400px;
  background: linear-gradient(135deg, var(--cf-navy) 0%, #1a365d 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 2rem;
}

.animated-title {
  font-size: 3rem;
  font-weight: bold;
  animation: fadeInUp 1s ease-out;
}

.subtitle {
  font-size: 1.2rem;
  margin-top: 1rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.5s forwards;
}

.wave-animation {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
}

/* Featured Section */
.featured-section {
  padding: 4rem 2rem;
}

h2 {
  font-size: 2rem;
  color: var(--cf-navy);
  text-align: center;
  margin-bottom: 2rem;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  width: 280px;
  height: auto;
}

.card:hover {
  transform: translateY(-5px);
}

.card-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}

.card-content {
  padding: 1.5rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  background: var(--cf-gold);
  color: var(--cf-navy);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

/* News Section */
.news-section {
  padding: 4rem 2rem;
  background: #f8fafc;
}

.news-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

.news-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  width: 350px;
  height: auto;
}

.news-date {
  color: var(--cf-gold);
  font-size: 0.9rem;
}

/* Stats Section */
.stats-section {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 4rem 2rem;
  text-align: center;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--cf-navy);
  display: block;
}

.stat-label {
  color: var(--cf-navy-light);
  font-size: 1.1rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .animated-title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>