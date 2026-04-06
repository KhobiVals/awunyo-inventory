import { useState, useEffect, useCallback } from 'react';

/**
 * Awunyo Inventory Suite — Offline Database (IndexedDB)
 *
 * Replaces the simple localStorage offline queue with a proper IndexedDB store.
 * Works alongside the existing localStorage state — only the offline queue moves here.
 *
 * Stores:
 *   - offline_sales   : sales queued while offline
 *   - offline_updates : inventory/customer updates queued while offline
 *
 * Usage:
 *   import { offlineDB } from './OfflineDB';
 *   await offlineDB.init();
 *   await offlineDB.queueSale(saleObj);
 *   const pending = await offlineDB.getPendingSales();
 *   await offlineDB.markSaleSynced(saleId);
 */

const DB_NAME    = 'awunyo_offline';
const DB_VERSION = 1;

class OfflineDatabase {
  constructor() {
    this.db      = null;
    this.ready   = false;
    this._initP  = null;
  }

  /** Open (or create) the IndexedDB database. Safe to call multiple times. */
  init() {
    if (this._initP) return this._initP;
    this._initP = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported — falling back to in-memory queue.');
        this._memory = { sales: [], updates: [] };
        this.ready = true;
        resolve(this);
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;

        // Offline sales store
        if (!db.objectStoreNames.contains('offline_sales')) {
          const s = db.createObjectStore('offline_sales', { keyPath: 'id' });
          s.createIndex('storeId',   'storeId',   { unique: false });
          s.createIndex('sync_status', 'sync_status', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Generic offline updates (inventory, customers, etc.)
        if (!db.objectStoreNames.contains('offline_updates')) {
          const u = db.createObjectStore('offline_updates', { keyPath: 'local_id' });
          u.createIndex('entity',    'entity',    { unique: false });
          u.createIndex('sync_status', 'sync_status', { unique: false });
          u.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = e => {
        this.db    = e.target.result;
        this.ready = true;
        resolve(this);
      };

      req.onerror = e => {
        console.error('IndexedDB open failed:', e.target.error);
        // Fall back to in-memory
        this._memory = { sales: [], updates: [] };
        this.ready = true;
        resolve(this);
      };
    });
    return this._initP;
  }

  /** Low-level: run a transaction and get all items from a store */
  _getAll(storeName) {
    if (!this.db) {
      // Memory fallback
      return Promise.resolve(this._memory?.[storeName === 'offline_sales' ? 'sales' : 'updates'] || []);
    }
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Low-level: put a single item */
  _put(storeName, item) {
    if (!this.db) {
      const key = storeName === 'offline_sales' ? 'sales' : 'updates';
      this._memory[key] = this._memory[key] || [];
      const idx = this._memory[key].findIndex(x => x.id === item.id || x.local_id === item.local_id);
      if (idx >= 0) this._memory[key][idx] = item;
      else this._memory[key].push(item);
      return Promise.resolve(item);
    }
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).put(item);
      req.onsuccess = () => resolve(item);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Low-level: delete by key */
  _delete(storeName, key) {
    if (!this.db) {
      const mkey = storeName === 'offline_sales' ? 'sales' : 'updates';
      this._memory[mkey] = (this._memory[mkey] || []).filter(x => x.id !== key && x.local_id !== key);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SALES API
  // ─────────────────────────────────────────────────────────────────────────

  /** Add a sale to the offline queue */
  async queueSale(sale) {
    await this.init();
    const record = {
      ...sale,
      sync_status: 'pending',       // 'pending' | 'synced' | 'failed'
      timestamp:   Date.now(),
      queued_at:   new Date().toISOString(),
    };
    return this._put('offline_sales', record);
  }

  /** Get all pending (unsynced) sales */
  async getPendingSales() {
    await this.init();
    const all = await this._getAll('offline_sales');
    return all.filter(s => s.sync_status === 'pending');
  }

  /** Get ALL queued sales (any status) */
  async getAllQueuedSales() {
    await this.init();
    return this._getAll('offline_sales');
  }

  /** Mark a sale as successfully synced */
  async markSaleSynced(saleId) {
    await this.init();
    const all    = await this._getAll('offline_sales');
    const record = all.find(s => s.id === saleId);
    if (record) {
      record.sync_status = 'synced';
      record.synced_at   = new Date().toISOString();
      await this._put('offline_sales', record);
    }
  }

  /** Mark a sale as failed to sync */
  async markSaleFailed(saleId, error) {
    await this.init();
    const all    = await this._getAll('offline_sales');
    const record = all.find(s => s.id === saleId);
    if (record) {
      record.sync_status = 'failed';
      record.sync_error  = String(error);
      await this._put('offline_sales', record);
    }
  }

  /** Remove a sale from the queue entirely */
  async removeSale(saleId) {
    await this.init();
    return this._delete('offline_sales', saleId);
  }

  /** Count pending sales */
  async pendingCount() {
    const pending = await this.getPendingSales();
    return pending.length;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC UPDATE QUEUE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Queue any offline data update (inventory change, customer update, etc.)
   * @param {string} entity   - 'inventory' | 'customer' | 'settings' | etc.
   * @param {string} action   - 'create' | 'update' | 'delete'
   * @param {object} payload  - the data to sync
   */
  async queueUpdate({ entity, action, payload, storeId }) {
    await this.init();
    const record = {
      local_id:    `UPD_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      entity,
      action,
      payload,
      storeId,
      sync_status: 'pending',
      timestamp:   Date.now(),
      queued_at:   new Date().toISOString(),
    };
    return this._put('offline_updates', record);
  }

  /** Get all pending updates */
  async getPendingUpdates() {
    await this.init();
    const all = await this._getAll('offline_updates');
    return all.filter(u => u.sync_status === 'pending').sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Mark an update as synced */
  async markUpdateSynced(localId) {
    await this.init();
    const all    = await this._getAll('offline_updates');
    const record = all.find(u => u.local_id === localId);
    if (record) {
      record.sync_status = 'synced';
      record.synced_at   = new Date().toISOString();
      await this._put('offline_updates', record);
    }
  }

  /** Remove synced entries older than N days to keep DB clean */
  async cleanup(daysOld = 7) {
    await this.init();
    const cutoff = Date.now() - daysOld * 86400000;

    const sales = await this._getAll('offline_sales');
    for (const s of sales) {
      if (s.sync_status === 'synced' && s.timestamp < cutoff) {
        await this._delete('offline_sales', s.id);
      }
    }

    const updates = await this._getAll('offline_updates');
    for (const u of updates) {
      if (u.sync_status === 'synced' && u.timestamp < cutoff) {
        await this._delete('offline_updates', u.local_id);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MIGRATION from localStorage queue
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * One-time migration: move any pending sales from the old localStorage queue
   * into IndexedDB, then clear the localStorage key.
   */
  async migrateFromLocalStorage() {
    await this.init();
    try {
      const old = localStorage.getItem('nx_offline_q');
      if (!old) return;
      const sales = JSON.parse(old);
      if (!Array.isArray(sales) || sales.length === 0) { localStorage.removeItem('nx_offline_q'); return; }
      for (const sale of sales) {
        await this.queueSale(sale);
      }
      localStorage.removeItem('nx_offline_q');
      console.log(`[OfflineDB] Migrated ${sales.length} sale(s) from localStorage.`);
    } catch (e) {
      console.warn('[OfflineDB] Migration failed:', e);
    }
  }
}

// Singleton
export const offlineDB = new OfflineDatabase();

// ─────────────────────────────────────────────────────────────────────────────
// React hook for offline queue management
// ─────────────────────────────────────────────────────────────────────────────

export function useOfflineQueue(isOnline, setSales, notify) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);

  // Init DB and migrate from localStorage on mount
  useEffect(() => {
    (async () => {
      await offlineDB.init();
      await offlineDB.migrateFromLocalStorage();
      const count = await offlineDB.pendingCount();
      setPendingCount(count);
    })();
  }, []);

  // Update count whenever online status changes
  useEffect(() => {
    offlineDB.pendingCount().then(setPendingCount);
  }, [isOnline]);

  /** Queue a sale while offline */
  const queueSale = useCallback(async (sale) => {
    await offlineDB.queueSale(sale);
    const count = await offlineDB.pendingCount();
    setPendingCount(count);
  }, []);

  /** Sync all pending sales when back online */
  const syncPending = useCallback(async () => {
    if (!isOnline || syncing) return;
    const pending = await offlineDB.getPendingSales();
    if (pending.length === 0) return;

    setSyncing(true);
    const synced = [];

    for (const sale of pending) {
      try {
        // Add to live sales state
        setSales(prev => {
          const already = prev.find(s => s.id === sale.id);
          return already ? prev : [sale, ...prev];
        });
        await offlineDB.markSaleSynced(sale.id);
        synced.push(sale.id);
      } catch (e) {
        await offlineDB.markSaleFailed(sale.id, e);
      }
    }

    setSyncing(false);
    const remaining = await offlineDB.pendingCount();
    setPendingCount(remaining);

    if (synced.length > 0 && notify) {
      notify(`${synced.length} offline sale${synced.length > 1 ? 's' : ''} synced successfully.`);
    }

    // Cleanup old synced entries
    await offlineDB.cleanup(7);
  }, [isOnline, syncing, setSales, notify]);

  return { pendingCount, syncing, queueSale, syncPending };
}
