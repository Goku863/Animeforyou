// AnimeForYou API - Firebase Realtime Database
// Uses Firebase SDK from CDN

class AnimeAPI {
  constructor() {
    this.db = null;
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      // Firebase is loaded via CDN in HTML
      this.db = firebase.database();
      this.initialized = true;
      console.log('Firebase connected');
    } catch (e) {
      console.error('Firebase init error:', e);
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

  clearCache() {
    this.cache.clear();
  }

  // Get all anime
  async getAll() {
    await this.init();
    const cached = this.getCached('all');
    if (cached) return cached;

    return new Promise((resolve) => {
      this.db.ref('anime').once('value', (snapshot) => {
        const data = snapshot.val();
        const list = data ? Object.values(data) : [];
        this.setCache('all', list);
        resolve(list);
      }).catch((e) => {
        console.error('Firebase getAll error:', e);
        resolve([]);
      });
    });
  }

  // Get anime by ID
  async getById(id) {
    await this.init();
    const cached = this.getCached(`id:${id}`);
    if (cached) return cached;

    return new Promise((resolve) => {
      this.db.ref(`anime/${id}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) this.setCache(`id:${id}`, data);
        resolve(data);
      }).catch((e) => {
        console.error('Firebase getById error:', e);
        resolve(null);
      });
    });
  }

  // Search anime
  async search(q) {
    const all = await this.getAll();
    const lower = q.toLowerCase();
    return all.filter(a =>
      a.title.toLowerCase().includes(lower) ||
      (a.synopsis && a.synopsis.toLowerCase().includes(lower)) ||
      (a.genres && a.genres.some(g => g.toLowerCase().includes(lower))) ||
      (a.studio && a.studio.toLowerCase().includes(lower))
    );
  }

  // Get by genre
  async getByGenre(genre) {
    const all = await this.getAll();
    return all.filter(a => a.genres && a.genres.includes(genre));
  }

  // Get trending
  async getTrending(limit = 12) {
    const all = await this.getAll();
    return [...all].sort((a, b) => (b.trending || 0) - (a.trending || 0)).slice(0, limit);
  }

  // Get top rated
  async getTopRated(limit = 10) {
    const all = await this.getAll();
    return [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
  }

  // Get latest
  async getLatest(limit = 12) {
    const all = await this.getAll();
    return [...all].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, limit);
  }

  // Get related
  async getRelated(anime, limit = 10) {
    const all = await this.getAll();
    return all
      .filter(a => a.id !== anime.id && a.genres && anime.genres && a.genres.some(g => anime.genres.includes(g)))
      .slice(0, limit);
  }

  // Get random
  async getRandom(count = 5) {
    const all = await this.getAll();
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Create anime
  async create(anime) {
    await this.init();
    this.clearCache();
    const id = anime.id || this.generateId(anime.title);
    anime.id = id;
    anime.createdAt = Date.now();

    return new Promise((resolve, reject) => {
      this.db.ref(`anime/${id}`).set(anime)
        .then(() => resolve(anime))
        .catch((e) => {
          console.error('Firebase create error:', e);
          reject(e);
        });
    });
  }

  // Update anime
  async update(id, anime) {
    await this.init();
    this.clearCache();
    anime.updatedAt = Date.now();

    return new Promise((resolve, reject) => {
      this.db.ref(`anime/${id}`).update(anime)
        .then(() => resolve(anime))
        .catch((e) => {
          console.error('Firebase update error:', e);
          reject(e);
        });
    });
  }

  // Delete anime
  async delete(id) {
    await this.init();
    this.clearCache();

    return new Promise((resolve, reject) => {
      this.db.ref(`anime/${id}`).remove()
        .then(() => resolve(true))
        .catch((e) => {
          console.error('Firebase delete error:', e);
          reject(e);
        });
    });
  }

  // Get stats
  async getStats() {
    const all = await this.getAll();
    return {
      totalAnime: all.length,
      totalEpisodes: all.reduce((s, a) => s + (a.totalEpisodes || 0), 0),
      totalGenres: [...new Set(all.flatMap(a => a.genres || []))].length,
      avgRating: all.length ? (all.reduce((s, a) => s + (a.rating || 0), 0) / all.length).toFixed(1) : 0
    };
  }

  // Export data
  async exportData() {
    return await this.getAll();
  }

  // Import data
  async importData(data) {
    await this.init();
    this.clearCache();
    const updates = {};
    data.forEach(anime => {
      const id = anime.id || this.generateId(anime.title);
      anime.id = id;
      updates[`anime/${id}`] = anime;
    });

    return new Promise((resolve, reject) => {
      this.db.ref().update(updates)
        .then(() => resolve(true))
        .catch((e) => {
          console.error('Firebase import error:', e);
          reject(e);
        });
    });
  }

  // Generate ID from title
  generateId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
  }
}

const api = new AnimeAPI();
