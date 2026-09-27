import { localDb, type PendingSyncItem } from '../db/indexedDb';
import { apiFetch } from '../utils/api';

export type SyncStatusListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTimestamp: number | null;
  lastError: string | null;
}) => void;

class SyncManager {
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private pendingCount = 0;
  private lastSyncTimestamp: number | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncStatusListener> = new Set();
  private token: string | null = null;
  private autoSyncInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Periodic queue check every 30 seconds
      this.autoSyncInterval = window.setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.processQueue();
        }
      }, 30000);

      this.updatePendingCount();
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token && this.isOnline) {
      this.processQueue();
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    this.notify(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(specificListener?: SyncStatusListener) {
    const payload = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastError: this.lastError
    };

    if (specificListener) {
      specificListener(payload);
    } else {
      this.listeners.forEach(fn => fn(payload));
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.lastError = null;
    this.notify();
    this.processQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  public async updatePendingCount(): Promise<number> {
    try {
      this.pendingCount = await localDb.pendingSync.count();
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  /**
   * Enqueues an operation to be performed locally and synced to the server.
   */
  public async enqueue(
    type: PendingSyncItem['type'],
    action: PendingSyncItem['action'],
    entityId: string,
    payload: any
  ): Promise<PendingSyncItem> {
    const item: PendingSyncItem = {
      id: `${type}_${action}_${entityId}_${Date.now()}`,
      type,
      action,
      entityId,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };

    // If another pending update for the same entity exists, update or replace it
    const existing = await localDb.pendingSync.where('entityId').equals(entityId).first();
    if (existing && action === 'update') {
      await localDb.pendingSync.update(existing.id, {
        payload: { ...existing.payload, ...payload },
        timestamp: Date.now()
      });
    } else {
      await localDb.pendingSync.put(item);
    }

    await this.updatePendingCount();

    // If currently online, trigger background sync
    if (this.isOnline && this.token) {
      this.processQueue();
    }

    return item;
  }

  /**
   * Processes all pending sync queue items sequentially
   */
  public async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (!this.isOnline) return { synced: 0, failed: 0 };
    if (!this.token) return { synced: 0, failed: 0 };

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      const items = await localDb.pendingSync.orderBy('timestamp').toArray();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };

      for (const item of items) {
        try {
          let res: Response;

          switch (item.type) {
            case 'milkInward': {
              if (item.action === 'create') {
                res = await apiFetch('/api/milk-inward', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'update') {
                res = await apiFetch(`/api/milk-inward/${item.entityId}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'delete') {
                res = await apiFetch(`/api/milk-inward/${item.entityId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${this.token}` }
                });
              } else {
                throw new Error('Unsupported action');
              }
              break;
            }

            case 'dailyFinance': {
              if (item.action === 'update') {
                res = await apiFetch('/api/daily-finance/bulk', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else {
                throw new Error('Unsupported action');
              }
              break;
            }

            case 'expense': {
              if (item.action === 'create') {
                res = await apiFetch('/api/expenses', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'update') {
                res = await apiFetch(`/api/expenses/${item.entityId}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'delete') {
                res = await apiFetch(`/api/expenses/${item.entityId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${this.token}` }
                });
              } else {
                throw new Error('Unsupported action');
              }
              break;
            }

            case 'customer': {
              if (item.action === 'create') {
                res = await apiFetch('/api/customers', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'update') {
                res = await apiFetch(`/api/customers/${item.entityId}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(item.payload)
                });
              } else if (item.action === 'delete') {
                res = await apiFetch(`/api/customers/${item.entityId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${this.token}` }
                });
              } else {
                throw new Error('Unsupported action');
              }
              break;
            }

            default:
              throw new Error(`Unknown type: ${item.type}`);
          }

          if (res.ok) {
            // Remove from sync queue
            await localDb.pendingSync.delete(item.id);

            // Update _synced in local table
            if (item.type === 'milkInward' && item.action !== 'delete') {
              await localDb.milkInward.update(item.entityId, { _synced: true });
            } else if (item.type === 'expense' && item.action !== 'delete') {
              await localDb.expenses.update(item.entityId, { _synced: true });
            } else if (item.type === 'customer' && item.action !== 'delete') {
              await localDb.customers.update(item.entityId, { _synced: true });
            }

            synced++;
          } else {
            const errText = await res.text().catch(() => 'Server error');
            await localDb.pendingSync.update(item.id, {
              retryCount: item.retryCount + 1,
              lastError: errText
            });
            failed++;
          }
        } catch (itemErr: any) {
          failed++;
          await localDb.pendingSync.update(item.id, {
            retryCount: item.retryCount + 1,
            lastError: itemErr?.message || String(itemErr)
          });
          // Stop processing if network error
          break;
        }
      }

      this.lastSyncTimestamp = Date.now();
    } catch (queueErr: any) {
      this.lastError = queueErr?.message || 'Sync failed';
    } finally {
      this.isSyncing = false;
      await this.updatePendingCount();
      this.notify();
    }

    return { synced, failed };
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastError: this.lastError
    };
  }
}

export const syncManager = new SyncManager();
