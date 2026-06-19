const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://animeforyou.onrender.com/api';

class AnimeAPI {
  constructor() { this.useFallback = false; }

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

  async getAll() {
    const data = await this.fetch('/anime');
    if (data) { localStorage.setItem('afy_data', JSON.stringify(data)); return data; }
    return JSON.parse(localStorage.getItem('afy_data') || '[]');
  }

  async getById(id) {
    const data = await this.fetch(`/anime/${id}`);
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return all.find(a => a.id === id);
  }

  async search(q) {
    const data = await this.fetch(`/anime/search?q=${encodeURIComponent(q)}`);
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return all.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
  }

  async getByGenre(genre) {
    const data = await this.fetch(`/anime/genre/${encodeURIComponent(genre)}`);
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return all.filter(a => a.genres.includes(genre));
  }

  async create(anime) {
    return await this.fetch('/anime', { method: 'POST', body: JSON.stringify(anime) });
  }

  async update(id, anime) {
    return await this.fetch(`/anime/${id}`, { method: 'PUT', body: JSON.stringify(anime) });
  }

  async delete(id) {
    return await this.fetch(`/anime/${id}`, { method: 'DELETE' });
  }

  async getStats() {
    const data = await this.fetch('/stats');
    if (data) return data;
    const all = JSON.parse(localStorage.getItem('afy_data') || '[]');
    return { totalAnime: all.length, totalEpisodes: all.reduce((s,a) => s + (a.totalEpisodes||0), 0), totalGenres: [...new Set(all.flatMap(a => a.genres))].length };
  }

  async importData(data) {
    return await this.fetch('/anime/import', { method: 'POST', body: JSON.stringify({ data }) });
  }

  async exportData() {
    return await this.getAll();
  }
}

const api = new AnimeAPI();
