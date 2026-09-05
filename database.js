/* ==========================================================================
   Anne OS Kids — database.js
   Camada de abstração do IndexedDB (com fallback em memória caso indisponível)
   ========================================================================== */

class AnneDB {
  constructor() {
    this.dbName = 'AnneOsKidsDB';
    this.version = 1;
    this.db = null;
    this.ready = false;
    this.memoryFallback = false;
    this.mem = { users: [], games: [], drawings: [], notes: [], settings: [], achievements: [] };
    this.memId = 1;
  }

  init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        this.memoryFallback = true;
        this.ready = true;
        resolve();
        return;
      }
      try {
        const req = indexedDB.open(this.dbName, this.version);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('users')) {
            const s = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            s.createIndex('nome', 'nome', { unique: false });
          }
          if (!db.objectStoreNames.contains('games')) {
            const s = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
            s.createIndex('usuario_id', 'usuario_id', { unique: false });
          }
          if (!db.objectStoreNames.contains('drawings')) {
            const s = db.createObjectStore('drawings', { keyPath: 'id', autoIncrement: true });
            s.createIndex('usuario_id', 'usuario_id', { unique: false });
          }
          if (!db.objectStoreNames.contains('notes')) {
            const s = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
            s.createIndex('usuario_id', 'usuario_id', { unique: false });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'usuario_id' });
          }
          if (!db.objectStoreNames.contains('achievements')) {
            const s = db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
            s.createIndex('usuario_id', 'usuario_id', { unique: false });
          }
        };

        req.onsuccess = (e) => {
          this.db = e.target.result;
          this.ready = true;
          resolve();
        };

        req.onerror = () => {
          console.warn('Anne OS: IndexedDB indisponível, usando memória.');
          this.memoryFallback = true;
          this.ready = true;
          resolve();
        };
      } catch (err) {
        this.memoryFallback = true;
        this.ready = true;
        resolve();
      }
    });
  }

  _tx(store, mode) {
    return this.db.transaction(store, mode).objectStore(store);
  }

  add(store, obj) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) {
        const item = { ...obj, id: obj.id || this.memId++ };
        this.mem[store].push(item);
        resolve(item.id);
        return;
      }
      try {
        const req = this._tx(store, 'readwrite').add(obj);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  put(store, obj) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) {
        const key = obj.id !== undefined ? obj.id : obj.usuario_id;
        const idField = store === 'settings' ? 'usuario_id' : 'id';
        const idx = this.mem[store].findIndex(x => x[idField] === obj[idField]);
        if (idx >= 0) this.mem[store][idx] = obj; else this.mem[store].push(obj);
        resolve(key);
        return;
      }
      try {
        const req = this._tx(store, 'readwrite').put(obj);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  get(store, key) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) {
        const idField = store === 'settings' ? 'usuario_id' : 'id';
        resolve(this.mem[store].find(x => x[idField] === key) || null);
        return;
      }
      try {
        const req = this._tx(store, 'readonly').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  getAll(store) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) { resolve([...this.mem[store]]); return; }
      try {
        const req = this._tx(store, 'readonly').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  getByIndex(store, indexName, value) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) {
        resolve(this.mem[store].filter(x => x[indexName] === value));
        return;
      }
      try {
        const idx = this._tx(store, 'readonly').index(indexName);
        const req = idx.getAll(value);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  delete(store, key) {
    return new Promise((resolve, reject) => {
      if (this.memoryFallback) {
        const idField = store === 'settings' ? 'usuario_id' : 'id';
        this.mem[store] = this.mem[store].filter(x => x[idField] !== key);
        resolve();
        return;
      }
      try {
        const req = this._tx(store, 'readwrite').delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  clearAll() {
    const stores = ['users', 'games', 'drawings', 'notes', 'settings', 'achievements'];
    if (this.memoryFallback) {
      stores.forEach(s => this.mem[s] = []);
      return Promise.resolve();
    }
    return Promise.all(stores.map(s => new Promise((resolve, reject) => {
      const req = this._tx(s, 'readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })));
  }

  async estimateUsage() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        return { usage: usage || 0, quota: quota || 0 };
      }
    } catch (e) { /* ignore */ }
    return { usage: 0, quota: 0 };
  }
}

const db = new AnneDB();
