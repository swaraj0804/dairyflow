import Dexie, { type Table } from 'dexie';
import type { MilkInwardEntry, DailyFinanceEntry, ExpenseEntry, Customer } from '../types';

export interface PendingSyncItem {
  id: string;
  type: 'milkInward' | 'dailyFinance' | 'expense' | 'customer';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface ShiftNotificationSettings {
  id: string; // 'current'
  morningEnabled: boolean;
  morningTime: string; // '06:30' (HH:mm 24-hr format)
  eveningEnabled: boolean;
  eveningTime: string; // '17:30' (HH:mm 24-hr format)
  smartCheckEnabled: boolean; // skip if already logged today
  soundEnabled: boolean;
  lastMorningNotifiedDate?: string; // 'YYYY-MM-DD'
  lastEveningNotifiedDate?: string; // 'YYYY-MM-DD'
}

export type CachedMilkInward = MilkInwardEntry & {
  _synced?: boolean;
  _offlineCreated?: boolean;
  _updatedAt?: number;
};

export type CachedDailyFinance = DailyFinanceEntry & {
  _synced?: boolean;
  _updatedAt?: number;
};

export type CachedExpense = ExpenseEntry & {
  _synced?: boolean;
  _offlineCreated?: boolean;
  _updatedAt?: number;
};

export type CachedCustomer = Customer & {
  _synced?: boolean;
  _updatedAt?: number;
};

class DairyFlowDB extends Dexie {
  milkInward!: Table<CachedMilkInward, string>;
  dailyFinance!: Table<CachedDailyFinance, string>;
  expenses!: Table<CachedExpense, string>;
  customers!: Table<CachedCustomer, string>;
  pendingSync!: Table<PendingSyncItem, string>;
  notificationSettings!: Table<ShiftNotificationSettings, string>;

  constructor() {
    super('DairyFlowOfflineDB');
    this.version(1).stores({
      milkInward: 'id, date, shift, _synced, _updatedAt',
      dailyFinance: 'id, date, customerId, _synced, _updatedAt',
      expenses: 'id, date, _synced, _updatedAt',
      customers: 'id, _synced, _updatedAt',
      pendingSync: 'id, type, action, entityId, timestamp, retryCount',
      notificationSettings: 'id'
    });
  }
}

export const localDb = new DairyFlowDB();

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: ShiftNotificationSettings = {
  id: 'current',
  morningEnabled: true,
  morningTime: '06:30',
  eveningEnabled: true,
  eveningTime: '17:30',
  smartCheckEnabled: true,
  soundEnabled: true,
  lastMorningNotifiedDate: '',
  lastEveningNotifiedDate: ''
};

export async function getStoredNotificationSettings(): Promise<ShiftNotificationSettings> {
  try {
    const existing = await localDb.notificationSettings.get('current');
    if (existing) return existing;
    await localDb.notificationSettings.put(DEFAULT_NOTIFICATION_SETTINGS);
    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (err) {
    console.warn('Could not read notification settings from IndexedDB, using defaults:', err);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveStoredNotificationSettings(settings: Partial<ShiftNotificationSettings>): Promise<ShiftNotificationSettings> {
  try {
    const current = await getStoredNotificationSettings();
    const updated: ShiftNotificationSettings = { ...current, ...settings, id: 'current' };
    await localDb.notificationSettings.put(updated);
    return updated;
  } catch (err) {
    console.error('Failed to save notification settings to IndexedDB:', err);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
  }
}
