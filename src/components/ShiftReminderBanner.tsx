import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, BellRing, CheckCircle, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShiftReminderBannerProps {
  onOpenSettings?: () => void;
  onSelectShift?: (shift: 'Morning' | 'Evening') => void;
}

export const ShiftReminderBanner: React.FC<ShiftReminderBannerProps> = ({ onOpenSettings, onSelectShift }) => {
  const { milkInward, notificationSettings, updateNotificationSettings, sendTestNotification, requestNotificationPermission } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Current shift context
  const currentShift: 'Morning' | 'Evening' = currentHour < 14 ? 'Morning' : 'Evening';
  const isMorningRecorded = milkInward.some(m => m.date === todayStr && m.shift === 'Morning');
  const isEveningRecorded = milkInward.some(m => m.date === todayStr && m.shift === 'Evening');
  const isCurrentShiftRecorded = currentShift === 'Morning' ? isMorningRecorded : isEveningRecorded;

  const currentShiftTime = currentShift === 'Morning' ? notificationSettings.morningTime : notificationSettings.eveningTime;
  const isReminderEnabled = currentShift === 'Morning' ? notificationSettings.morningEnabled : notificationSettings.eveningEnabled;

  const handleQuickTest = async () => {
    const res = await sendTestNotification();
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleReminder = async () => {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      setFeedback('Please allow browser notifications to receive shift reminders.');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    if (currentShift === 'Morning') {
      await updateNotificationSettings({ morningEnabled: !notificationSettings.morningEnabled });
    } else {
      await updateNotificationSettings({ eveningEnabled: !notificationSettings.eveningEnabled });
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-4.5 border border-brand-900/10 shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.03)] ring-1 ring-white/80 space-y-3.5">
      {/* Top Shift Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-inner ${isCurrentShiftRecorded ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/80' : 'bg-amber-100 text-amber-700 border border-amber-200/80'
            }`}>
            {isCurrentShiftRecorded ? <CheckCircle size={18} strokeWidth={2.5} /> : <Clock size={18} strokeWidth={2.5} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-brand-900 tracking-tight">{currentShift} Collection Window</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCurrentShiftRecorded
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                }`}>
                {isCurrentShiftRecorded ? 'Recorded ✓' : 'Entry Pending'}
              </span>
            </div>
            <p className="text-[11px] text-brand-900/75 font-semibold mt-0.5">
              Reminder: {currentShiftTime} • {isReminderEnabled ? 'Active' : 'Off'}
            </p>
          </div>
        </div>

        {/* Quick Test / Toggle Reminder */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleQuickTest}
            className="p-2 rounded-xl hover:bg-cream-100 text-brand-900/70 hover:text-brand-900 transition-colors"
            title="Test reminder notification"
          >
            <BellRing size={16} />
          </button>
          <button
            onClick={handleToggleReminder}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border shadow-sm active:scale-95 ${isReminderEnabled
                ? 'bg-brand-600 text-white border-brand-600 shadow-brand-600/20'
                : 'bg-cream-100/90 text-brand-900/80 border-cream-200 hover:bg-cream-200 hover:text-brand-900'
              }`}
          >
            {isReminderEnabled ? 'Alerts ON' : 'Turn ON'}
          </button>
        </div>
      </div>

      {/* Shift status details */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-brand-900/10 text-xs">
        <div
          onClick={() => onSelectShift?.('Morning')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isMorningRecorded
              ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-900 shadow-sm'
              : 'bg-white/70 border-brand-900/10 text-brand-900 hover:bg-white hover:border-brand-900/20 shadow-sm'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] tracking-tight">Morning Shift</span>
            <span className="text-[10px] text-brand-900/65 font-bold">{notificationSettings.morningTime}</span>
          </div>
          <p className={`text-[10px] font-bold ${isMorningRecorded ? 'text-emerald-700' : 'text-brand-900/70'}`}>
            {isMorningRecorded ? '✓ Logged' : 'Pending entry'}
          </p>
        </div>

        <div
          onClick={() => onSelectShift?.('Evening')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isEveningRecorded
              ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-900 shadow-sm'
              : 'bg-white/70 border-brand-900/10 text-brand-900 hover:bg-white hover:border-brand-900/20 shadow-sm'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] tracking-tight">Evening Shift</span>
            <span className="text-[10px] text-brand-900/65 font-bold">{notificationSettings.eveningTime}</span>
          </div>
          <p className={`text-[10px] font-bold ${isEveningRecorded ? 'text-emerald-700' : 'text-brand-900/70'}`}>
            {isEveningRecorded ? '✓ Logged' : 'Pending entry'}
          </p>
        </div>
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] font-medium text-brand-900 bg-brand-50 p-2 rounded-xl border border-brand-200/60 text-center"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
