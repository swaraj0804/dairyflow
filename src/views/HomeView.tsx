import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Landmark, Milk, ReceiptText, ChevronRight, UserCircle2, Hand, TrendingUp, Users, Droplets } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';
import { OfflineSyncBadge } from '../components/OfflineSyncBadge';
import { ShiftReminderBanner } from '../components/ShiftReminderBanner';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { toDateKey } from '../utils/dateUtils';

const HomeView = ({ onNavigate }: { onNavigate: (view: any) => void }) => {
  const { user, dailyFinance, milkInward, customers, expenses } = useApp();

  const { totalMilkToday, revenueToday, todayExpenses, avgFat } = useMemo(() => {
    const todayISO = toDateKey();

    const todayFinanceEntries = dailyFinance.filter(e => e.date === todayISO);
    const todayInwardEntries = milkInward.filter(e => e.date === todayISO);

    const financeMilk = todayFinanceEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const inwardMilk = todayInwardEntries.reduce((sum, entry) => sum + (entry.litres || 0), 0);
    const totalMilkToday = parseFloat((financeMilk + inwardMilk).toFixed(1));

    const customerMap = new Map<string, number>(customers.map(c => [c.id, Number(c.price) || 0]));
    const financeRevenue = todayFinanceEntries.reduce((sum, entry) => {
      if (!entry.confirmed) return sum;
      const price = customerMap.get(entry.customerId) ?? 0;
      return sum + (entry.amount * price);
    }, 0);
    const inwardRevenue = todayInwardEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);

    const revenueToday = (financeRevenue + inwardRevenue);

    const todayExpenses = expenses.filter(e => e.date === todayISO).reduce((sum, e) => sum + (e.price || 0), 0);

    const avgFat = todayInwardEntries.length > 0
      ? (todayInwardEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0) / todayInwardEntries.length).toFixed(1)
      : '0.0';

    return { totalMilkToday, revenueToday, todayExpenses, avgFat };
  }, [dailyFinance, milkInward, customers, expenses]);

  const getFirstName = (fullName: string) => {
    return fullName ? fullName.split(' ')[0] : 'Farmer';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 4) return 'Good Night,';
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <ScrollAreaWithGradients
      containerClassName="h-full w-full bg-cream-50"
      className="flex flex-col"
    >
      {/* Dark Green Header Section */}
      <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-14 pb-8 shadow-lg text-white shrink-0">
        <div className="max-w-md mx-auto w-full">
          {/* Greeting & Top Badges */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-brand-200 mb-1">{getGreeting()}</p>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold tracking-tight">{getFirstName(user?.name || '')}</h1>
                <span className="text-xl animate-pulse">👋</span>
              </div>
              <p className="text-xs text-brand-200/80 mt-0.5">{user?.farmName || 'Green Pastures Dairy'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OfflineSyncBadge />
              <PWAInstallButton />
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="flex gap-3.5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
              className="flex-1 bg-white/[0.14] hover:bg-white/18 backdrop-blur-xl rounded-[22px] p-4 border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_-4px_rgba(10,47,32,0.25)] transition-all cursor-default"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner shrink-0">
                  <Milk size={15} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Today's Milk</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">{totalMilkToday}</span>
                <span className="text-sm font-bold text-brand-100">L</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
              className="flex-1 bg-white/[0.14] hover:bg-white/18 backdrop-blur-xl rounded-[22px] p-4 border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_24px_-4px_rgba(10,47,32,0.25)] transition-all cursor-default"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner shrink-0">
                  <span className="font-serif font-bold text-sm">₹</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Today's Income</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">₹{revenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-6 pb-8 max-w-md mx-auto w-full"
      >
        {/* Daily Shift Collection Reminder */}
        <div className="mb-6">
          <ShiftReminderBanner
            onOpenSettings={() => onNavigate('settings')}
            onSelectShift={() => onNavigate('inward')}
          />
        </div>

        {/* Status Mini-Cards Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-white/85 backdrop-blur-xl rounded-[22px] p-4 shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.03)] border border-brand-900/10 ring-1 ring-white/80 flex flex-col justify-center hover:shadow-[0_8px_24px_-4px_rgba(10,47,32,0.1)] transition-shadow"
          >
            <div className="w-8 h-8 rounded-xl bg-red-100/70 border border-red-200 text-red-600 flex items-center justify-center mb-2.5 shadow-inner">
              <ReceiptText size={15} strokeWidth={2.5} />
            </div>
            <p className="font-extrabold text-brand-900 text-base tracking-tight">₹{todayExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-brand-900/75 font-bold mt-0.5">Expenses</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-white/85 backdrop-blur-xl rounded-[22px] p-4 shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.03)] border border-brand-900/10 ring-1 ring-white/80 flex flex-col justify-center hover:shadow-[0_8px_24px_-4px_rgba(10,47,32,0.1)] transition-shadow"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100/70 border border-teal-200 text-teal-700 flex items-center justify-center mb-2.5 shadow-inner">
              <Users size={15} strokeWidth={2.5} />
            </div>
            <p className="font-extrabold text-brand-900 text-base tracking-tight">{customers.length}</p>
            <p className="text-[11px] text-brand-900/75 font-bold mt-0.5">Customers</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-white/85 backdrop-blur-xl rounded-[22px] p-4 shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.03)] border border-brand-900/10 ring-1 ring-white/80 flex flex-col justify-center hover:shadow-[0_8px_24px_-4px_rgba(10,47,32,0.1)] transition-shadow"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center mb-2.5 shadow-inner">
              <Droplets size={15} strokeWidth={2.5} />
            </div>
            <p className="font-extrabold text-brand-900 text-base tracking-tight">{avgFat}%</p>
            <p className="text-[11px] text-brand-900/75 font-bold mt-0.5">Avg. Fat</p>
          </motion.div>
        </div>

        <h3 className="text-[11px] font-bold text-brand-900/80 uppercase tracking-widest mb-4">Quick Actions</h3>

        {/* Primary Action Button */}
        <motion.button
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => onNavigate('finance')}
          className="w-full bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white p-5 rounded-[26px] shadow-lg shadow-brand-700/20 border border-white/20 backdrop-blur-md flex items-center justify-between mb-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner">
              <span className="font-serif font-bold text-xl">₹</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-base tracking-tight">Daily Finance</h4>
              <p className="text-xs text-brand-100 font-semibold mt-0.5">Record customer collections</p>
            </div>
          </div>
          <ChevronRight size={20} strokeWidth={2.5} className="text-white/80" />
        </motion.button>

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => onNavigate('inward')}
            className="bg-linear-to-br from-brand-900 to-brand-800 hover:from-brand-850 hover:to-brand-750 text-white p-5 rounded-[26px] shadow-md border border-white/15 backdrop-blur-md text-left transition-colors flex flex-col justify-between min-h-32"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 text-white shadow-inner">
              <Milk size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-white">Milk Inward</h4>
              <p className="text-[11px] text-brand-100 font-semibold mt-1">Log shift entries</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => onNavigate('expenses')}
            className="bg-linear-to-br from-[#1E3A2F] to-[#162C24] hover:from-[#244537] hover:to-[#1B352B] text-white p-5 rounded-[26px] shadow-md border border-white/15 backdrop-blur-md text-left transition-colors flex flex-col justify-between min-h-32"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 text-white shadow-inner">
              <ReceiptText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-white">Farm Expenses</h4>
              <p className="text-[11px] text-brand-100 font-semibold mt-1">Track daily spend</p>
            </div>
          </motion.button>
        </div>

      </motion.div>
    </ScrollAreaWithGradients>
  );
};

export default HomeView;
