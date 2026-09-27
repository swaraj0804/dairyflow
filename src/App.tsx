import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AnimatePresence, motion } from 'motion/react';
import HomeView from './views/HomeView';
import AuthView from './views/AuthView';
import DailyFinanceView from './views/DailyFinanceView';
import MilkInwardView from './views/MilkInwardView';
import FarmExpensesView from './views/FarmExpensesView';
import ReportsView from './views/ReportsView';
import MonthlyFinanceReportView from './views/MonthlyFinanceReportView';
import SettingsView from './views/SettingsView';
import { Home, LineChart, Settings } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: Route) => void;
}

const BottomNav = ({ currentRoute, onNavigate }: BottomNavProps) => {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'reports' as const, label: 'Reports', icon: LineChart },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-[0_12px_36px_-6px_rgba(10,47,32,0.16),0_2px_8px_rgba(10,47,32,0.06)] ring-1 ring-brand-900/5 rounded-[28px] p-1.5 flex justify-between items-center transform-gpu relative"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentRoute === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`relative flex-1 flex flex-col items-center justify-center py-2.5 rounded-[22px] transition-all duration-200 active:scale-95 z-10 ${isActive
                ? 'text-white font-bold'
                : 'text-brand-900/75 hover:text-brand-900 hover:bg-brand-900/5 font-semibold'
              }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-linear-to-br from-brand-600 to-brand-700 rounded-[22px] shadow-md shadow-brand-700/25 border border-white/20 -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Icon size={21} strokeWidth={isActive ? 2.5 : 2.1} className="drop-shadow-sm" />
            <span className="text-[11px] mt-0.5 tracking-tight font-bold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

type Route = 'home' | 'finance' | 'inward' | 'expenses' | 'reports' | 'monthlyFinanceReport' | 'settings';

const AppContent = () => {
  const { user, isLoading } = useApp();
  const [currentRoute, setCurrentRoute] = useState<Route>('home');

  if (isLoading) {
    return <div className="min-h-screen bg-cream-50 flex items-center justify-center font-serif font-bold text-brand-600 text-xl">Loading...</div>;
  }

  if (!user) {
    return <AuthView />;
  }

  const renderView = () => {
    switch (currentRoute) {
      case 'home': return <HomeView onNavigate={setCurrentRoute} />;
      case 'finance': return <DailyFinanceView onBack={() => setCurrentRoute('home')} onNavigateToReports={() => setCurrentRoute('monthlyFinanceReport')} />;
      case 'inward': return <MilkInwardView onBack={() => setCurrentRoute('home')} />;
      case 'expenses': return <FarmExpensesView onBack={() => setCurrentRoute('home')} />;
      case 'reports': return <ReportsView onBack={() => setCurrentRoute('home')} />;
      case 'monthlyFinanceReport': return <MonthlyFinanceReportView onBack={() => setCurrentRoute('finance')} />;
      case 'settings': return <SettingsView onBack={() => setCurrentRoute('home')} />;
      default: return <HomeView onNavigate={setCurrentRoute} />;
    }
  };

  const showBottomNav = currentRoute === 'home' || currentRoute === 'reports' || currentRoute === 'settings';

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-cream-50 text-brand-900 relative w-full font-sans">
      <main className="flex-1 min-h-0 w-full relative h-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentRoute}
            initial={{ opacity: 0, y: 8, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.996 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 w-full h-full flex flex-col min-h-0 transform-gpu ${showBottomNav ? 'pb-24' : ''}`}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showBottomNav && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none flex justify-center"
          >
            <div className="pointer-events-auto w-full max-w-sm">
              <BottomNav currentRoute={currentRoute} onNavigate={setCurrentRoute} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
