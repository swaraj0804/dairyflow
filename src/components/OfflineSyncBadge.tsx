import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Wifi, WifiOff, RefreshCw, CloudCheck, AlertCircle, Database, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineSyncBadge: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount, lastSyncTimestamp, triggerSync, milkInward, customers, expenses } = useApp();
  const [showModal, setShowModal] = useState(false);

  const formattedLastSync = lastSyncTimestamp
    ? new Date(lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not yet this session';

  return (
    <>
      {/* Compact Top Indicator Pill */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 border backdrop-blur-xl ${!isOnline
          ? 'bg-amber-500/25 border-amber-300/40 text-white shadow-amber-900/20'
          : pendingSyncCount > 0
            ? 'bg-blue-500/25 border-blue-300/40 text-white shadow-blue-900/20'
            : isSyncing
              ? 'bg-brand-400/25 border-brand-200/40 text-white shadow-brand-900/20'
              : 'bg-white/15 hover:bg-white/25 border-white/25 text-white shadow-black/10'
          }`}
        title="Offline IndexedDB & Cloud Sync Status"
      >
        {!isOnline ? (
          <>
            <WifiOff size={14} className="text-amber-300 animate-pulse" />
            <span className="tracking-tight">Offline</span>
            {pendingSyncCount > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-extrabold shadow-sm">
                {pendingSyncCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={14} className="text-brand-200 animate-spin" />
            <span className="tracking-tight">Syncing...</span>
          </>
        ) : pendingSyncCount > 0 ? (
          <>
            <RefreshCw size={14} className="text-blue-200" />
            <span className="tracking-tight">{pendingSyncCount} unsynced</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span className="text-[11px] text-white font-bold tracking-tight">Cached & Synced</span>
          </>
        )}
      </button>

      {/* Sync Status & Offline Details Modal */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              key="sync-status-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white/95 backdrop-blur-2xl rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-brand-900/10 space-y-5 text-brand-900"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${!isOnline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {!isOnline ? <WifiOff size={18} /> : <Wifi size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-brand-900">
                        {!isOnline ? 'Offline Storage Mode' : 'Online & Connected'}
                      </h3>
                      <p className="text-[11px] text-brand-900/60 font-medium">
                        IndexedDB local caching active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full bg-cream-100 text-brand-900/70 hover:bg-cream-200 flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Status Banner */}
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${!isOnline
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : pendingSyncCount > 0
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                  {!isOnline ? (
                    <p>
                      <strong>You are currently offline.</strong> You can continue adding milk inward entries, farm expenses, and daily records normally. Everything is safely cached locally and will automatically sync when connection returns.
                    </p>
                  ) : pendingSyncCount > 0 ? (
                    <p>
                      <strong>{pendingSyncCount} entry(ies) waiting to sync.</strong> Click "Sync Now" below to flush your pending offline records to the cloud.
                    </p>
                  ) : (
                    <p>
                      <strong>All entries are up to date!</strong> Cloud database is fully synchronized with your local IndexedDB storage.
                    </p>
                  )}
                </div>

                {/* IndexedDB Storage Metrics */}
                <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-900/70 font-semibold flex items-center gap-1.5">
                      <Database size={14} className="text-brand-600" />
                      Cached Inward Entries
                    </span>
                    <span className="font-bold text-brand-900">{milkInward.length} records</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-900/70 font-semibold">Cached Customers</span>
                    <span className="font-bold text-brand-900">{customers.length} records</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-900/70 font-semibold">Cached Expenses</span>
                    <span className="font-bold text-brand-900">{expenses.length} records</span>
                  </div>
                  <div className="pt-2 border-t border-cream-200/80 flex items-center justify-between text-[11px] text-brand-900/60">
                    <span>Last Cloud Sync:</span>
                    <span className="font-semibold text-brand-900">{formattedLastSync}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      await triggerSync();
                    }}
                    disabled={isSyncing || !isOnline}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing Records...' : 'Sync Now with Cloud'}</span>
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full bg-cream-100 hover:bg-cream-200 text-brand-900/80 font-semibold py-3 rounded-2xl text-xs transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
