const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://animeforyou.onrender.com/api';

class AnimeAPI {
  constructor() {
    this.useFallback = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async fetch(path, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API fallback to localStorage:', e.message);
      this.useFallback = true;
      return null;
    }
  }

  getCached(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.time < this.cacheTimeout) return entry.data;
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, time: Date.now() });
  }

  async getAll() {
    const cached = this.getCached('all');
    if (cached) return cached;
    const data = await this.fetch('/anime');
    if (data) {
      localStorage.setItem('afy_data', JSON.stringify(data));
      this.setCache('all', data);
      return data;
    }
    return JSON.parse(localStorage.getItem('afy_data') || '[]');
  }

  async getById(id) {
    const cached = this.getCached(`id:${id}`);
    if (cached) return cached;
    const data = await this.fetch(`/anime/${id}`);
    if (data) {
      this.setCache(`id:${id}`, data);
      return data;
    }
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return all.find(a => a.id === id);
  }

  async search(q) {
    const data = await this.fetch(`/anime/search?q=${encodeURIComponent(q)}`);
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    const lower = q.toLowerCase();
    return all.filter(a =>
      a.title.toLowerCase().includes(lower) ||
      a.synopsis.toLowerCase().includes(lower) ||
      a.genres.some(g => g.toLowerCase().includes(lower)) ||
      a.studio.toLowerCase().includes(lower)
    );
  }

  async getByGenre(genre) {
    const data = await this.fetch(`/anime/genre/${encodeURIComponent(genre)}`);
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return all.filter(a => a.genres.includes(genre));
  }

  async getTrending(limit = 12) {
    const all = await this.getAll();
    return [...all].sort((a, b) => b.trending - a.trending).slice(0, limit);
  }

  async getTopRated(limit = 10) {
    const all = await this.getAll();
    return [...all].sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  async getLatest(limit = 12) {
    const all = await this.getAll();
    return [...all].sort((a, b) => b.id.localeCompare(a.id)).slice(0, limit);
  }

  async getRelated(anime, limit = 10) {
    const all = await this.getAll();
    return all
      .filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g)))
      .slice(0, limit);
  }

  async getRandom(count = 5) {
    const all = await this.getAll();
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async create(anime) {
    this.cache.clear();
    return await this.fetch('/anime', { method: 'POST', body: JSON.stringify(anime) });
  }

  async update(id, anime) {
    this.cache.clear();
    return await this.fetch(`/anime/${id}`, { method: 'PUT', body: JSON.stringify(anime) });
  }

  async delete(id) {
    this.cache.clear();
    return await this.fetch(`/anime/${id}`, { method: 'DELETE' });
  }

  async getStats() {
    const cached = this.getCached('stats');
    if (cached) return cached;
    const data = await this.fetch('/stats');
    if (data) {
      this.setCache('stats', data);
      return data;
    }
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    const stats = {
      totalAnime: all.length,
      totalEpisodes: all.reduce((s, a) => s + (a.totalEpisodes || 0), 0),
      totalGenres: [...new Set(all.flatMap(a => a.genres))].length,
      avgRating: all.length ? (all.reduce((s, a) => s + a.rating, 0) / all.length).toFixed(1) : 0
    };
    this.setCache('stats', stats);
    return stats;
  }

  async importData(data) {
    this.cache.clear();
    return await this.fetch('/anime/import', { method: 'POST', body: JSON.stringify({ data }) });
  }

  async exportData() {
    return await this.getAll();
  }

  clearCache() {
    this.cache.clear();
  }
}

const api = new AnimeAPI();
