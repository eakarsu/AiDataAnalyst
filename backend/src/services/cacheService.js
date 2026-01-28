import NodeCache from 'node-cache';
import crypto from 'crypto';

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120,
  useClones: true
});

const cacheService = {
  get(key) {
    return cache.get(key);
  },

  set(key, value, ttl) {
    return cache.set(key, value, ttl);
  },

  del(key) {
    return cache.del(key);
  },

  flush() {
    cache.flushAll();
  },

  invalidateByPrefix(prefix) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(k => k.startsWith(prefix));
    if (matchingKeys.length > 0) {
      cache.del(matchingKeys);
    }
    return matchingKeys.length;
  },

  invalidateUser(userId) {
    return this.invalidateByPrefix(`user:${userId}:`);
  },

  getStats() {
    const stats = cache.getStats();
    return {
      keys: cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%'
        : '0%',
      ksize: stats.ksize,
      vsize: stats.vsize
    };
  },

  generateKey(userId, type, data) {
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `user:${userId}:${type}:${hash}`;
  }
};

export default cacheService;
