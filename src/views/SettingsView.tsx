import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, Home as HomeIcon, LogOut, Check, Bell, Shield, HelpCircle, ChevronRight, X, ToggleLeft, ToggleRight, Lock, Download, MessageCircle, FileText, ChevronLeft, FileSpreadsheet, Clock, Volume2, Database, Wifi, WifiOff, RefreshCw, BellRing, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPdf, exportToExcel } from '../lib/exportUtils';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';

interface SettingsViewProps {
  onBack: () => void;
}

type SubView = 'main' | 'edit-profile' | 'notifications' | 'privacy' | 'change-password' | 'export' | 'offline-sync';

export default function SettingsView({ onBack }: SettingsViewProps) {
  const {
    user,
    updateUserProfile,
    signOut,
    milkInward,
    expenses,
    customers,
    updatePassword,
    notificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    sendTestNotification,
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncTimestamp,
    triggerSync
  } = useApp();

  const [activeView, setActiveView] = useState<SubView>('main');
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [farmName, setFarmName] = useState(user?.farmName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password edit state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserProfile({ name, farmName, email, phone });
    setTimeout(() => {
      setIsSaving(false);
      setActiveView('main');
    }, 500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    setIsChangingPassword(true);

    const result = await updatePassword(currentPassword, newPassword);

    setIsChangingPassword(false);

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert("Password updated successfully!");
      setActiveView('privacy');
    } else {
      alert(result.error || "Failed to update password");
    }
  };

  const handleExportExcel = () => {
    const data = milkInward.map(m => [m.date, m.shift, m.litres, m.fat, m.snf, m.rate, m.totalAmount]);
    exportToExcel('Farm_Milk_Records', ['Date', 'Shift', 'Litres', 'Fat %', 'SNF', 'Rate/Ltr', 'Total'], data);
  };

  const handleExportPdf = () => {
    const data = milkInward.map(m => [m.date, m.shift, m.litres.toString(), m.fat.toString(), m.snf.toString(), `₹${m.rate}`, `₹${m.totalAmount}`]);
    exportToPdf('Farm Milk Records', ['Date', 'Shift', 'Litres', 'Fat %', 'SNF', 'Rate/Ltr', 'Total'], data);
  };

  const handleTestNotification = async () => {
    const res = await sendTestNotification();
    setTestNotificationFeedback(res.message);
    setTimeout(() => setTestNotificationFeedback(null), 4000);
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderHeader = (title: string, subtitle: string, backView: SubView = 'main') => (
    <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4 max-w-md mx-auto w-full">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveView(backView)}
          className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-serif font-bold text-xl text-white tracking-tight">{title}</h1>
          <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const renderToggle = (label: string, description: string, enabled: boolean, onToggle: () => void) => (
    <div className="flex items-center justify-between py-4 border-b border-cream-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-bold text-brand-900">{label}</p>
        <p className="text-xs text-brand-900/70 font-medium mt-1 leading-snug">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onToggle}
        className={`transition-colors ${enabled ? 'text-brand-600' : 'text-brand-900/25'}`}
      >
        {enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
      </motion.button>
    </div>
  );

  if (activeView === 'edit-profile') {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('EDIT PROFILE', 'Update Information')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-cream-200 space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><User size={18} /></div>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="Your Name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Farm Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><HomeIcon size={18} /></div>
                  <input type="text" required value={farmName} onChange={e => setFarmName(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="Farm Name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><Mail size={18} /></div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="name@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><Phone size={18} /></div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="+1 234 567 890" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-brand-600 text-white font-bold py-4 rounded-[20px] shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {isSaving ? <span className="animate-pulse">Saving Changes...</span> : <><Check size={20} strokeWidth={3} /><span>Save Profile</span></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeView === 'change-password') {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('CHANGE PASSWORD', 'Update your secure login', 'privacy')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-cream-200 space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><Lock size={18} /></div>
                  <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="Enter current password" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><Lock size={18} /></div>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="Enter new password" minLength={6} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-900/70 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40"><Lock size={18} /></div>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-cream-50 pl-12 pr-4 py-3 rounded-[20px] border border-cream-200 focus:ring-2 focus:ring-brand-600 text-brand-900 font-medium placeholder-brand-900/40 transition-all" placeholder="Confirm new password" minLength={6} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isChangingPassword} className="w-full bg-brand-600 text-white font-bold py-4 rounded-[20px] shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {isChangingPassword ? <span className="animate-pulse">Updating...</span> : <><Check size={20} strokeWidth={3} /><span>Update Password</span></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeView === 'export') {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('EXPORT DATA', 'Download all your records', 'privacy')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full space-y-6">
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-cream-200 text-center">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download size={32} />
            </div>
            <h3 className="font-bold text-brand-900 text-lg mb-2">Your Farm Records</h3>
            <p className="text-sm text-brand-900/70 mb-6 leading-relaxed">
              Download a complete copy of your milk inward records. Choose your preferred format below.
            </p>

            <div className="space-y-3">
              <button onClick={handleExportExcel} className="w-full bg-brand-600 hover:bg-brand-800 text-white font-bold py-4 rounded-[20px] shadow-md transition-all flex items-center justify-center gap-2">
                <FileSpreadsheet size={20} />
                <span>Export as Excel (.xlsx)</span>
              </button>

              <button onClick={handleExportPdf} className="w-full bg-white hover:bg-brand-50 text-brand-600 border-2 border-brand-100 font-bold py-4 rounded-[20px] shadow-sm transition-all flex items-center justify-center gap-2">
                <FileText size={20} />
                <span>Export as PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'notifications') {
    const hasNotificationSupport = typeof window !== 'undefined' && 'Notification' in window;
    const permission = hasNotificationSupport ? Notification.permission : 'denied';

    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('SHIFT REMINDERS', 'Daily Milk Collection Alerts')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full space-y-5">
          {/* Permission Status Banner */}
          <div className="bg-white p-4 rounded-[22px] shadow-sm border border-cream-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${permission === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                <BellRing size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-900">
                  Browser Notifications: <span className="capitalize">{permission}</span>
                </p>
                <p className="text-[10px] text-brand-900/60 font-medium mt-0.5">
                  {permission === 'granted'
                    ? 'Shift alerts are active on this device'
                    : 'Tap below to authorize alerts on your device'}
                </p>
              </div>
            </div>
            {permission !== 'granted' && (
              <button
                onClick={async () => {
                  await requestNotificationPermission();
                }}
                className="text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-brand-700 active:scale-95 transition"
              >
                Enable
              </button>
            )}
          </div>

          {/* Morning Shift Configuration */}
          <div className="bg-white p-5 rounded-[22px] shadow-sm border border-cream-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-900">Morning Shift Reminder</h4>
                  <p className="text-[11px] text-brand-900/60 font-medium">Daily milk intake window</p>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({ morningEnabled: !notificationSettings.morningEnabled })}
                className={`transition-colors ${notificationSettings.morningEnabled ? 'text-brand-600' : 'text-brand-900/25'}`}
              >
                {notificationSettings.morningEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {notificationSettings.morningEnabled && (
              <div className="pt-3 border-t border-cream-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-900/70 uppercase tracking-wide">Reminder Time</label>
                  <input
                    type="time"
                    value={notificationSettings.morningTime}
                    onChange={(e) => updateNotificationSettings({ morningTime: e.target.value })}
                    className="bg-cream-50 border border-cream-200 rounded-xl px-3 py-1.5 font-bold text-brand-900 text-sm outline-none focus:border-brand-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-brand-900/50 font-medium">Quick presets:</span>
                  {['06:00', '06:30', '07:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateNotificationSettings({ morningTime: preset })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${notificationSettings.morningTime === preset
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-cream-50 text-brand-900/70 border-cream-200 hover:bg-cream-100'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evening Shift Configuration */}
          <div className="bg-white p-5 rounded-[22px] shadow-sm border border-cream-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-900">Evening Shift Reminder</h4>
                  <p className="text-[11px] text-brand-900/60 font-medium">Yield collection & fat testing</p>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({ eveningEnabled: !notificationSettings.eveningEnabled })}
                className={`transition-colors ${notificationSettings.eveningEnabled ? 'text-brand-600' : 'text-brand-900/25'}`}
              >
                {notificationSettings.eveningEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {notificationSettings.eveningEnabled && (
              <div className="pt-3 border-t border-cream-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-900/70 uppercase tracking-wide">Reminder Time</label>
                  <input
                    type="time"
                    value={notificationSettings.eveningTime}
                    onChange={(e) => updateNotificationSettings({ eveningTime: e.target.value })}
                    className="bg-cream-50 border border-cream-200 rounded-xl px-3 py-1.5 font-bold text-brand-900 text-sm outline-none focus:border-brand-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-brand-900/50 font-medium">Quick presets:</span>
                  {['17:00', '17:30', '18:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateNotificationSettings({ eveningTime: preset })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${notificationSettings.eveningTime === preset
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-cream-50 text-brand-900/70 border-cream-200 hover:bg-cream-100'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Features & Chime Sound */}
          <div className="bg-white p-5 rounded-[22px] shadow-sm border border-cream-200 divide-y divide-cream-100">
            <div className="flex items-center justify-between py-3 first:pt-0">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-600" />
                  <p className="text-sm font-bold text-brand-900">Smart Shift Suppression</p>
                </div>
                <p className="text-xs text-brand-900/60 font-medium mt-0.5">
                  Suppresses reminder if today's shift entry is already saved in IndexedDB.
                </p>
              </div>
              <button
                onClick={() => updateNotificationSettings({ smartCheckEnabled: !notificationSettings.smartCheckEnabled })}
                className={`transition-colors ${notificationSettings.smartCheckEnabled ? 'text-brand-600' : 'text-brand-900/25'}`}
              >
                {notificationSettings.smartCheckEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            <div className="flex items-center justify-between py-3 last:pb-0">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <Volume2 size={14} className="text-brand-600" />
                  <p className="text-sm font-bold text-brand-900">Audio Chime</p>
                </div>
                <p className="text-xs text-brand-900/60 font-medium mt-0.5">
                  Plays an acoustic reminder chime when the collection window opens.
                </p>
              </div>
              <button
                onClick={() => updateNotificationSettings({ soundEnabled: !notificationSettings.soundEnabled })}
                className={`transition-colors ${notificationSettings.soundEnabled ? 'text-brand-600' : 'text-brand-900/25'}`}
              >
                {notificationSettings.soundEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>

          {/* Test Reminder Trigger */}
          <div className="bg-cream-100/70 p-4 rounded-[22px] border border-cream-200 text-center space-y-2">
            <button
              onClick={handleTestNotification}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow transition active:scale-98 flex items-center justify-center gap-2 text-xs"
            >
              <BellRing size={16} />
              <span>Send Test Shift Reminder Now</span>
            </button>
            {testNotificationFeedback && (
              <p className="text-xs font-semibold text-brand-900 bg-white p-2 rounded-lg border border-cream-200 animate-fade-in">
                {testNotificationFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'offline-sync') {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('OFFLINE & SYNC', 'IndexedDB Local Cache')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full space-y-5">
          {/* Status banner */}
          <div className={`p-4 rounded-[22px] border text-xs leading-relaxed ${!isOnline
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : pendingSyncCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {!isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
              <span>{isOnline ? 'Connected to Internet' : 'Device is Offline'}</span>
            </div>
            <p className="text-brand-900/80">
              {!isOnline
                ? 'All entries you create or edit will be cached in IndexedDB immediately. When you reconnect, they will be synced to your server database.'
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} operations waiting in the queue to be synchronized with your cloud database.`
                  : 'Local IndexedDB cache is up to date and in sync with the cloud database.'}
            </p>
          </div>

          {/* Metrics */}
          <div className="bg-white p-5 rounded-[22px] shadow-sm border border-cream-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900/60">IndexedDB Stored Tables</h4>
            <div className="flex items-center justify-between text-sm py-1 border-b border-cream-100">
              <span className="font-semibold text-brand-900">Milk Inward Logs</span>
              <span className="font-bold text-brand-600">{milkInward.length} cached</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1 border-b border-cream-100">
              <span className="font-semibold text-brand-900">Customer Records</span>
              <span className="font-bold text-brand-600">{customers.length} cached</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1 border-b border-cream-100">
              <span className="font-semibold text-brand-900">Farm Expenses</span>
              <span className="font-bold text-brand-600">{expenses.length} cached</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1">
              <span className="font-semibold text-brand-900">Pending Outbox Queue</span>
              <span className={`font-bold ${pendingSyncCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingSyncCount} items
              </span>
            </div>
          </div>

          {/* Sync Trigger */}
          <button
            onClick={triggerSync}
            disabled={isSyncing || !isOnline}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronizing...' : 'Force Sync with Cloud'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (activeView === 'privacy') {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        {renderHeader('PRIVACY & SECURITY', 'Protect Your Account')}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-md mx-auto w-full space-y-5">
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-cream-200">
            {renderToggle('Biometric Login', 'Use fingerprint or face unlock to open the app.', biometricsEnabled, () => setBiometricsEnabled(!biometricsEnabled))}
            {renderToggle('Two-Factor Authentication', 'Require an extra code when signing in on new devices.', twoFactorEnabled, () => setTwoFactorEnabled(!twoFactorEnabled))}
          </div>
          <div className="bg-white rounded-[20px] p-2 shadow-sm border border-cream-200">
            <button onClick={() => setActiveView('change-password')} className="w-full flex items-center justify-between p-3 hover:bg-cream-50 rounded-[20px] transition-colors border-b border-cream-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-cream-200 flex items-center justify-center text-brand-900/60 shrink-0"><Lock size={18} /></div>
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-900">Change Password</p>
                  <p className="text-xs text-brand-900/60 font-medium mt-0.5">Update your secure login</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-brand-900/30" />
            </button>
            <button onClick={() => setActiveView('export')} className="w-full flex items-center justify-between p-3 hover:bg-cream-50 rounded-[20px] transition-colors border-b border-cream-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-cream-200 flex items-center justify-center text-brand-900/60 shrink-0"><Download size={18} /></div>
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-900">Export Farm Data</p>
                  <p className="text-xs text-brand-900/60 font-medium mt-0.5">Download all your records</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-brand-900/30" />
            </button>
          </div>
        </div>
      </div>
    );
  }


  // --- MAIN SETTINGS VIEW ---
  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Header Section */}
      <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-4xl px-6 pt-12 pb-8 shadow-md text-white shrink-0 relative z-10">
        <div className="max-w-md mx-auto w-full">
          <h1 className="font-serif font-bold text-3xl mb-8">Settings</h1>

          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-[20px] bg-white/20 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-inner shrink-0">
              <span className="font-bold text-2xl">{getInitials(user?.name || '')}</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-tight truncate">{user?.name || 'Your Name'}</h2>
              <p className="text-brand-200 text-sm mt-1 font-medium truncate">{user?.farmName || 'Your Farm'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollAreaWithGradients
        containerClassName="flex-1 min-h-0 w-full"
        className="px-4 pt-6 max-w-md mx-auto w-full space-y-5 pb-8 relative z-0 -mt-2"
      >
        {/* Profile Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[26px] p-5.5 shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-900 text-sm">Profile</h3>
            <button
              onClick={() => setActiveView('edit-profile')}
              className="text-brand-600 font-bold text-xs hover:text-brand-800 transition-colors px-2 py-1"
            >
              Edit
            </button>
          </div>

          <div className="space-y-0">
            {/* Row: Name */}
            <div className="flex items-center gap-4 py-3 border-b border-brand-900/10 last:border-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-700 shrink-0"><User size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-brand-900/80 tracking-wider">Full Name</p>
                <p className="text-sm font-bold text-brand-900 truncate">{user?.name || 'Not set'}</p>
              </div>
            </div>
            {/* Row: Farm Name */}
            <div className="flex items-center gap-4 py-3 border-b border-brand-900/10 last:border-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-700 shrink-0"><HomeIcon size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-brand-900/80 tracking-wider">Farm Name</p>
                <p className="text-sm font-bold text-brand-900 truncate">{user?.farmName || 'Not set'}</p>
              </div>
            </div>
            {/* Row: Phone */}
            <div className="flex items-center gap-4 py-3 border-b border-brand-900/10 last:border-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-700 shrink-0"><Phone size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-brand-900/80 tracking-wider">Phone</p>
                <p className="text-sm font-bold text-brand-900 truncate">{user?.phone || 'Not set'}</p>
              </div>
            </div>
            {/* Row: Email */}
            <div className="flex items-center gap-4 py-3 border-b border-brand-900/10 last:border-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-700 shrink-0"><Mail size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-brand-900/80 tracking-wider">Email</p>
                <p className="text-sm font-bold text-brand-900 truncate">{user?.email || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Menu Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[26px] p-2.5 shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('notifications')}
            className="w-full flex items-center justify-between p-3 hover:bg-cream-100/60 rounded-2xl transition-colors border-b border-brand-900/10 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-700 shrink-0">
                <BellRing size={18} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-brand-900">Shift Collection Reminders</p>
                  <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                    {notificationSettings.morningEnabled || notificationSettings.eveningEnabled ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-xs text-brand-900/60 font-medium mt-0.5">Morning ({notificationSettings.morningTime}) & Evening ({notificationSettings.eveningTime})</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-brand-900/30" />
          </motion.button>

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('offline-sync')}
            className="w-full flex items-center justify-between p-3 hover:bg-cream-100/60 rounded-2xl transition-colors border-b border-brand-900/10 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${!isOnline ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-brand-600/10 text-brand-700 border-brand-600/20'
                }`}>
                <Database size={18} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-brand-900">Offline & Sync Status</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${!isOnline ? 'bg-amber-100 text-amber-800' : pendingSyncCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                    {!isOnline ? 'Offline' : pendingSyncCount > 0 ? `${pendingSyncCount} queued` : 'Synced'}
                  </span>
                </div>
                <p className="text-xs text-brand-900/60 font-medium mt-0.5">IndexedDB cache, outbox queue & cloud sync</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-brand-900/30" />
          </motion.button>

          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('privacy')}
            className="w-full flex items-center justify-between p-3 hover:bg-cream-100/60 rounded-2xl transition-colors border-b border-brand-900/10 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-900/5 border border-brand-900/10 flex items-center justify-center text-brand-900/70 shrink-0"><Shield size={18} /></div>
              <div className="text-left">
                <p className="text-sm font-bold text-brand-900">Privacy & Security</p>
                <p className="text-xs text-brand-900/60 font-medium mt-0.5">Account protection & password</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-brand-900/30" />
          </motion.button>
        </div>

        {/* Log Out Button */}
        <div className="px-2 pt-2 pb-6">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={signOut}
            className="w-full bg-red-50/80 hover:bg-red-100/80 text-red-600 font-bold py-3.5 rounded-2xl border border-red-200/60 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span className="text-sm">Sign Out</span>
          </motion.button>
        </div>
      </ScrollAreaWithGradients>
    </div>
  );
}
