import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Customer, DailyFinanceEntry, MilkInwardEntry, ExpenseEntry } from '../types';
import { apiFetch } from '../utils/api';
import { toDateKey } from '../utils/dateUtils';
import { localDb, type ShiftNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../db/indexedDb';
import { syncManager } from '../services/syncService';
import { notificationScheduler } from '../services/notificationService';

interface AppState {
  user: User | null;
  token: string | null;
  customers: Customer[];
  dailyFinance: DailyFinanceEntry[];
  milkInward: MilkInwardEntry[];
  expenses: ExpenseEntry[];
  isLoading: boolean;
  // Offline & Sync
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTimestamp: number | null;
  triggerSync: () => Promise<void>;
  // Notifications
  notificationSettings: ShiftNotificationSettings;
  updateNotificationSettings: (settings: Partial<ShiftNotificationSettings>) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendTestNotification: () => Promise<{ success: boolean; message: string }>;
  // Auth & Data actions
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, profile: { name: string, farmName: string, phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateDailyFinance: (entries: DailyFinanceEntry[], dateStr?: string) => Promise<void>;
  addMilkInward: (entry: MilkInwardEntry) => Promise<void>;
  updateMilkInward: (id: string, entry: Partial<MilkInwardEntry>) => Promise<void>;
  deleteMilkInward: (id: string) => Promise<void>;
  addExpense: (entry: ExpenseEntry) => Promise<void>;
  updateExpense: (id: string, entry: Partial<ExpenseEntry>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, error?: string }>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dailyFinance, setDailyFinance] = useState<DailyFinanceEntry[]>([]);
  const [milkInward, setMilkInward] = useState<MilkInwardEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);

  // Notification state
  const [notificationSettings, setNotificationSettings] = useState<ShiftNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  // 1. Subscribe to SyncManager updates
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(status => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingSyncCount(status.pendingCount);
      setLastSyncTimestamp(status.lastSyncTimestamp);
    });
    return unsubscribe;
  }, []);

  // 2. Load stored notification settings on mount
  useEffect(() => {
    notificationScheduler.getSettings().then(setNotificationSettings);
  }, []);

  // 3. Load initial data from IndexedDB immediately for instant offline render
  useEffect(() => {
    async function loadFromIndexedDb() {
      try {
        const [cachedInward, cachedFinance, cachedExpenses, cachedCust] = await Promise.all([
          localDb.milkInward.toArray(),
          localDb.dailyFinance.toArray(),
          localDb.expenses.toArray(),
          localDb.customers.toArray()
        ]);

        if (cachedInward.length > 0) setMilkInward(cachedInward);
        if (cachedFinance.length > 0) setDailyFinance(cachedFinance);
        if (cachedExpenses.length > 0) setExpenses(cachedExpenses);
        if (cachedCust.length > 0) setCustomers(cachedCust);

        // Load cached user profile if exists in localStorage
        const savedUser = localStorage.getItem('dairyflow_cached_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch { }
        }
      } catch (err) {
        console.warn('Could not read from IndexedDB cache on startup:', err);
      }
    }
    loadFromIndexedDb();
  }, []);

  // 4. Server fetch utility with merge into IndexedDB
  const fetchData = useCallback(async (t: string) => {
    const headers = { 'Authorization': `Bearer ${t}` };
    try {
      const [uRes, cRes, dfRes, miRes, eRes] = await Promise.all([
        apiFetch('/api/user/profile', { headers }).catch(() => null),
        apiFetch('/api/customers', { headers }).catch(() => null),
        apiFetch('/api/daily-finance', { headers }).catch(() => null),
        apiFetch('/api/milk-inward', { headers }).catch(() => null),
        apiFetch('/api/expenses', { headers }).catch(() => null)
      ]);

      if (uRes && !uRes.ok && uRes.status === 401) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('dairyflow_cached_user');
        syncManager.setToken(null);
        return;
      }

      const userData = uRes && uRes.ok ? await uRes.json().catch(() => null) : null;
      const customersData = cRes && cRes.ok ? await cRes.json().catch(() => null) : null;
      const dailyFinanceData = dfRes && dfRes.ok ? await dfRes.json().catch(() => null) : null;
      const milkInwardData = miRes && miRes.ok ? await miRes.json().catch(() => null) : null;
      const expensesData = eRes && eRes.ok ? await eRes.json().catch(() => null) : null;

      if (userData && !userData.error) {
        setUser(userData);
        localStorage.setItem('dairyflow_cached_user', JSON.stringify(userData));
      }

      // Merge server records with any pending offline changes in IndexedDB
      if (Array.isArray(milkInwardData)) {
        const pendingItems = await localDb.pendingSync.where('type').equals('milkInward').toArray();
        const pendingIds = new Set(pendingItems.map(p => p.entityId));

        // Get local unsynced entries
        const localUnsynced = await localDb.milkInward.filter(m => m._synced === false).toArray();

        // Mark server items as synced
        const syncedServerItems = milkInwardData.map(m => ({ ...m, _synced: true }));
        await localDb.milkInward.bulkPut(syncedServerItems);

        // Keep local unsynced that are pending
        const combined = [
          ...localUnsynced.filter(l => !milkInwardData.some(s => s.id === l.id)),
          ...syncedServerItems.filter(s => !pendingItems.some(p => p.entityId === s.id && p.action === 'delete'))
        ];

        setMilkInward(combined);
      }

      if (Array.isArray(customersData)) {
        const syncedCust = customersData.map(c => ({ ...c, _synced: true }));
        await localDb.customers.bulkPut(syncedCust);
        setCustomers(syncedCust);
      }

      if (Array.isArray(dailyFinanceData)) {
        const syncedFinance = dailyFinanceData.map(df => ({ ...df, _synced: true }));
        await localDb.dailyFinance.bulkPut(syncedFinance);
        setDailyFinance(syncedFinance);
      }

      if (Array.isArray(expensesData)) {
        const localUnsynced = await localDb.expenses.filter(e => e._synced === false).toArray();
        const syncedExpenses = expensesData.map(e => ({ ...e, _synced: true }));
        await localDb.expenses.bulkPut(syncedExpenses);
        const combined = [
          ...localUnsynced.filter(l => !expensesData.some(s => s.id === l.id)),
          ...syncedExpenses
        ];
        setExpenses(combined);
      }
    } catch (e) {
      console.warn('Could not sync with server, using offline cached data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. Auth Token loading
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('dairyflow_cached_user');

    if (savedToken) {
      setToken(savedToken);
      syncManager.setToken(savedToken);
      fetchData(savedToken);
    } else if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [fetchData]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('dairyflow_cached_user', JSON.stringify(data.user));
    syncManager.setToken(data.token);
    fetchData(data.token);
  }, [fetchData]);

  const signUpWithEmail = useCallback(async (email: string, pass: string, profile: { name: string, farmName: string, phone: string }) => {
    const res = await apiFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, ...profile })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to sign up');
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('dairyflow_cached_user', JSON.stringify(data.user));
    syncManager.setToken(data.token);
    fetchData(data.token);
  }, [fetchData]);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('dairyflow_cached_user');
    syncManager.setToken(null);
  }, []);

  // Manual Trigger Sync
  const triggerSync = useCallback(async () => {
    await syncManager.processQueue();
    if (token) {
      await fetchData(token);
    }
  }, [token, fetchData]);

  // Notifications API
  const updateNotificationSettings = useCallback(async (newSettings: Partial<ShiftNotificationSettings>) => {
    const updated = await notificationScheduler.updateSettings(newSettings);
    setNotificationSettings(updated);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    return await notificationScheduler.requestPermission();
  }, []);

  const sendTestNotification = useCallback(async () => {
    return await notificationScheduler.sendTestNotification();
  }, []);

  // --- DATA MUTATIONS WITH INDEXEDDB OFFLINE CACHING & SYNC ---

  // Milk Inward
  const addMilkInward = useCallback(async (entry: MilkInwardEntry) => {
    const localEntry: MilkInwardEntry = {
      ...entry,
      id: entry.id || Math.random().toString(36).substring(2, 11),
      _synced: false,
      _offlineCreated: true
    };

    // 1. Immediately cache in IndexedDB
    await localDb.milkInward.put(localEntry);

    // 2. Optimistically update React state
    setMilkInward(prev => [localEntry, ...prev.filter(m => m.id !== localEntry.id)]);

    // 3. If online & authenticated, attempt server sync
    if (navigator.onLine && token) {
      try {
        const res = await apiFetch('/api/milk-inward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(entry)
        });

        if (res.ok) {
          const saved = await res.json();
          const syncedEntry = { ...saved, _synced: true, _offlineCreated: false };
          await localDb.milkInward.put(syncedEntry);
          setMilkInward(prev => prev.map(m => m.id === localEntry.id ? syncedEntry : m));
          return;
        }
      } catch (err) {
        console.warn('Network error while adding milk inward. Enqueued for offline sync:', err);
      }
    }

    // 4. If offline or request failed, enqueue in syncManager
    await syncManager.enqueue('milkInward', 'create', localEntry.id, localEntry);
  }, [token]);

  const updateMilkInward = useCallback(async (id: string, partial: Partial<MilkInwardEntry>) => {
    // 1. Update IndexedDB
    const existing = await localDb.milkInward.get(id);
    const updated = existing ? { ...existing, ...partial, _synced: false } : null;
    if (updated) {
      await localDb.milkInward.put(updated);
    }

    // 2. Optimistic state update
    setMilkInward(prev => prev.map(m => m.id === id ? { ...m, ...partial, _synced: false } : m));

    // 3. Sync or enqueue
    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/milk-inward/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(partial)
        });
        if (res.ok) {
          const serverUpdated = await res.json();
          await localDb.milkInward.update(id, { ...serverUpdated, _synced: true });
          setMilkInward(prev => prev.map(m => m.id === id ? { ...m, ...serverUpdated, _synced: true } : m));
          return;
        }
      } catch (err) {
        console.warn('Network error updating milk inward. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('milkInward', 'update', id, partial);
  }, [token]);

  const deleteMilkInward = useCallback(async (id: string) => {
    // 1. Remove from IndexedDB
    await localDb.milkInward.delete(id);

    // 2. Optimistic state update
    setMilkInward(prev => prev.filter(m => m.id !== id));

    // 3. Sync or enqueue
    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/milk-inward/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) return;
      } catch (err) {
        console.warn('Network error deleting milk inward. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('milkInward', 'delete', id, {});
  }, [token]);

  // Daily Finance
  const updateDailyFinance = useCallback(async (entries: DailyFinanceEntry[], dateStr?: string) => {
    const date = dateStr || toDateKey();

    // 1. Update matching customer rows in IndexedDB while retaining their IDs.
    let markedEntries: DailyFinanceEntry[] = [];
    await localDb.transaction('rw', localDb.dailyFinance, async () => {
      const existingEntries = await localDb.dailyFinance.where('date').equals(date).toArray();
      const idByCustomer = new Map<string, string>();
      existingEntries.forEach(entry => {
        if (!idByCustomer.has(entry.customerId)) idByCustomer.set(entry.customerId, entry.id);
      });
      markedEntries = entries.map(entry => ({
        ...entry,
        id: idByCustomer.get(entry.customerId) || entry.id,
        date,
        _synced: false
      }));
      const retainedIds = new Set(markedEntries.map(entry => entry.id));
      await localDb.dailyFinance.where('date').equals(date).and(entry => !retainedIds.has(entry.id)).delete();
      await localDb.dailyFinance.bulkPut(markedEntries);
    });

    // 2. Optimistic state update
    setDailyFinance(prev => [...(Array.isArray(prev) ? prev : []).filter(e => e.date !== date), ...markedEntries]);
    setCustomers(prev => prev.map(c => {
      const entry = entries.find(e => e.customerId === c.id);
      if (entry) {
        return { ...c, litres: entry.amount };
      }
      return c;
    }));

    // 3. Sync or enqueue
    if (navigator.onLine && token) {
      try {
        const res = await apiFetch('/api/daily-finance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ entries: markedEntries, date })
        });
        if (res.ok) {
          const synced = markedEntries.map(e => ({ ...e, _synced: true }));
          await localDb.dailyFinance.bulkPut(synced);
          setDailyFinance(prev => [...prev.filter(e => e.date !== date), ...synced]);
          return;
        }
      } catch (err) {
        console.warn('Network error updating daily finance. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('dailyFinance', 'update', date, { entries: markedEntries, date });
  }, [token]);

  // Expenses
  const addExpense = useCallback(async (entry: ExpenseEntry) => {
    const localEntry: ExpenseEntry = {
      ...entry,
      id: entry.id || Math.random().toString(36).substring(2, 11),
      _synced: false,
      _offlineCreated: true
    };

    await localDb.expenses.put(localEntry);
    setExpenses(prev => [...(Array.isArray(prev) ? prev : []), localEntry]);

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(entry)
        });
        if (res.ok) {
          const saved = await res.json();
          const synced = { ...saved, _synced: true, _offlineCreated: false };
          await localDb.expenses.put(synced);
          setExpenses(prev => prev.map(e => e.id === localEntry.id ? synced : e));
          return;
        }
      } catch (err) {
        console.warn('Network error adding expense. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('expense', 'create', localEntry.id, localEntry);
  }, [token]);

  const updateExpense = useCallback(async (id: string, entry: Partial<ExpenseEntry>) => {
    const existing = await localDb.expenses.get(id);
    if (existing) {
      await localDb.expenses.put({ ...existing, ...entry, _synced: false });
    }
    setExpenses(prev => prev.map(m => m.id === id ? { ...m, ...entry, _synced: false } : m));

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(entry)
        });
        if (res.ok) {
          const updated = await res.json();
          await localDb.expenses.update(id, { ...updated, _synced: true });
          setExpenses(prev => prev.map(m => m.id === id ? { ...m, ...updated, _synced: true } : m));
          return;
        }
      } catch (err) {
        console.warn('Network error updating expense. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('expense', 'update', id, entry);
  }, [token]);

  const deleteExpense = useCallback(async (id: string) => {
    await localDb.expenses.delete(id);
    setExpenses(prev => prev.filter(m => m.id !== id));

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/expenses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) return;
      } catch (err) {
        console.warn('Network error deleting expense. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('expense', 'delete', id, {});
  }, [token]);

  // Customers
  const addCustomer = useCallback(async (customer: Customer) => {
    const localCust: Customer = {
      ...customer,
      id: customer.id || Math.random().toString(36).substring(2, 11)
    };

    await localDb.customers.put(localCust);
    setCustomers(prev => [...(Array.isArray(prev) ? prev : []), localCust]);

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(customer)
        });
        if (res.ok) {
          const saved = await res.json();
          await localDb.customers.put(saved);
          setCustomers(prev => prev.map(c => c.id === localCust.id ? saved : c));
          return;
        }
      } catch (err) {
        console.warn('Network error adding customer. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('customer', 'create', localCust.id, localCust);
  }, [token]);

  const updateCustomer = useCallback(async (id: string, partial: Partial<Customer>) => {
    const existing = await localDb.customers.get(id);
    if (existing) {
      await localDb.customers.put({ ...existing, ...partial });
    }
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...partial } : c));

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(partial)
        });
        if (res.ok) {
          const updated = await res.json();
          await localDb.customers.put(updated);
          setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
          return;
        }
      } catch (err) {
        console.warn('Network error updating customer. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('customer', 'update', id, partial);
  }, [token]);

  const deleteCustomer = useCallback(async (id: string) => {
    await localDb.customers.delete(id);
    await localDb.dailyFinance.where('customerId').equals(id).delete();
    setCustomers(prev => prev.filter(c => c.id !== id));
    setDailyFinance(prev => prev.filter(e => e.customerId !== id));

    if (navigator.onLine && token) {
      try {
        const res = await apiFetch(`/api/customers/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) return;
      } catch (err) {
        console.warn('Network error deleting customer. Enqueued for sync:', err);
      }
    }

    await syncManager.enqueue('customer', 'delete', id, {});
  }, [token]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update password' };
      }
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Network error' };
    }
  }, [token]);

  const updateUserProfile = useCallback(async (profile: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...profile };
      setUser(updated);
      localStorage.setItem('dairyflow_cached_user', JSON.stringify(updated));
    }
    if (!token) return;
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('dairyflow_cached_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, user]);

  const contextValue = useMemo(() => ({
    user,
    token,
    customers,
    dailyFinance,
    milkInward,
    expenses,
    isLoading,
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncTimestamp,
    triggerSync,
    notificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    sendTestNotification,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateDailyFinance,
    addMilkInward,
    updateMilkInward,
    deleteMilkInward,
    addExpense,
    updateExpense,
    deleteExpense,
    updateUserProfile,
    updatePassword,
  }), [
    user,
    token,
    customers,
    dailyFinance,
    milkInward,
    expenses,
    isLoading,
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncTimestamp,
    triggerSync,
    notificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    sendTestNotification,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateDailyFinance,
    addMilkInward,
    updateMilkInward,
    deleteMilkInward,
    addExpense,
    updateExpense,
    deleteExpense,
    updateUserProfile,
    updatePassword,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
