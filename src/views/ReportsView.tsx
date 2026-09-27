import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { exportToPdf, exportToExcel, ExportButtons } from '../lib/exportUtils';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';

interface ReportsViewProps {
  onBack: () => void;
}

export default function ReportsView({ onBack }: ReportsViewProps) {
  const { milkInward, expenses, customers, dailyFinance } = useApp();

  const {
    totalDairyRevenue,
    totalCustomerRevenue,
    totalInflow,
    totalExpenses,
    netProfit,
    avgMilk,
    avgFat,
    activeCustomers,
    isProfit
  } = useMemo(() => {
    const totalDairyRevenue = milkInward.reduce((acc, curr) => acc + curr.totalAmount, 0) || 0;

    const customerMap = new Map<string, number>(customers.map(c => [c.id, Number(c.price) || 0]));
    const totalCustomerRevenue = dailyFinance.reduce((acc, entry) => {
      if (!entry.confirmed) return acc;
      const price = customerMap.get(entry.customerId) ?? 0;
      return acc + (entry.amount * price);
    }, 0) || 0;

    const totalInflow = totalDairyRevenue + totalCustomerRevenue;

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.price, 0) || 0;
    const netProfit = totalInflow - totalExpenses;

    const totalMilk = milkInward.reduce((acc, curr) => acc + curr.litres, 0);
    const avgMilk = milkInward.length > 0 ? (totalMilk / milkInward.length).toFixed(1) : '0';

    const avgFat = milkInward.length > 0 ?
      (milkInward.reduce((acc, curr) => acc + curr.fat, 0) / milkInward.length).toFixed(1) : '0';

    const activeCustomers = customers.length;
    const isProfit = netProfit >= 0;

    return {
      totalDairyRevenue,
      totalCustomerRevenue,
      totalInflow,
      totalExpenses,
      netProfit,
      avgMilk,
      avgFat,
      activeCustomers,
      isProfit
    };
  }, [milkInward, dailyFinance, customers, expenses]);

  const handleExportPdf = () => {
    const data = [
      ['Total Dairy Revenue', `₹${totalDairyRevenue.toFixed(2)}`],
      ['Total Customer Revenue', `₹${totalCustomerRevenue.toFixed(2)}`],
      ['Total Inflow', `₹${totalInflow.toFixed(2)}`],
      ['Total Expenses', `₹${totalExpenses.toFixed(2)}`],
      ['Net Profit/Loss', `₹${netProfit.toFixed(2)}`],
      ['Avg Daily Milk Yield', `${avgMilk} Ltr`],
      ['Avg Fat Content', `${avgFat}%`],
      ['Active Customers', `${activeCustomers}`]
    ];
    exportToPdf('Global Report', ['Metric', 'Value'], data);
  };

  const handleExportExcel = () => {
    const data = [
      ['Total Dairy Revenue', totalDairyRevenue],
      ['Total Customer Revenue', totalCustomerRevenue],
      ['Total Inflow', totalInflow],
      ['Total Expenses', totalExpenses],
      ['Net Profit/Loss', netProfit],
      ['Avg Daily Milk Yield', avgMilk],
      ['Avg Fat Content', avgFat],
      ['Active Customers', activeCustomers]
    ];
    exportToExcel('Global Report', ['Metric', 'Value'], data);
  };

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Top Bar */}
      <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">

        <div className="flex items-center gap-4 max-w-md mx-auto w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-serif font-bold text-xl text-white tracking-tight">GLOBAL REPORT</h1>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-widest mt-1">Monthly Overview</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollAreaWithGradients
        containerClassName="flex-1 min-h-0 w-full"
        className="p-6 max-w-md mx-auto w-full space-y-6"
      >
        {/* Net Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
          className={`p-6 rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06)] border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25'} relative overflow-hidden backdrop-blur-xl ring-1 ring-white/60`}
        >
          <div className="absolute -right-6 -top-6 opacity-10">
            <DollarSign size={160} />
          </div>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 relative z-10 ${isProfit ? 'text-emerald-800' : 'text-red-800'}`}>Net Profit/Loss</h3>
          <p className={`text-4xl sm:text-5xl font-serif wrap-break-word font-bold tracking-tighter relative z-10 ${isProfit ? 'text-emerald-700' : 'text-[#E63946]'}`}>
            {isProfit ? '+' : '-'}₹{Math.abs(netProfit).toFixed(2)}
          </p>
        </motion.div>

        {/* Detailed Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
          className="bg-white/90 backdrop-blur-xl rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80 p-6 space-y-6"
        >
          <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider border-b border-brand-900/10 pb-3">Balance Sheet</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600/15 border border-brand-600/25 rounded-2xl flex items-center justify-center text-brand-700 shadow-inner">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-brand-900 text-sm">Total Inflow</p>
                <p className="text-xs text-brand-900/70 font-medium">Dairy & Customers</p>
              </div>
            </div>
            <p className="text-xl font-serif font-bold text-brand-900">₹{totalInflow.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E63946]/15 border border-[#E63946]/25 rounded-2xl flex items-center justify-center text-[#E63946] shadow-inner">
                <TrendingDown size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-brand-900 text-sm">Total Outflow</p>
                <p className="text-xs text-brand-900/70 font-medium">Farm Expenses</p>
              </div>
            </div>
            <p className="text-xl font-serif font-bold text-brand-900">₹{totalExpenses.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Analytics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
          className="bg-white/90 backdrop-blur-xl rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80 p-6"
        >
          <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-4">Analytics Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-brand-900/10 pb-2">
              <span className="text-sm font-semibold text-brand-900/80">Avg. Daily Milk Yield</span>
              <span className="font-bold text-brand-900">{avgMilk} Ltr</span>
            </div>
            <div className="flex justify-between items-end border-b border-brand-900/10 pb-2">
              <span className="text-sm font-semibold text-brand-900/80">Avg. Fat Content</span>
              <span className="font-bold text-brand-600">{avgFat}%</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-brand-900/80">Active Customers</span>
              <span className="font-bold text-brand-900">{activeCustomers}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="pt-2"
        >
          <ExportButtons onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
        </motion.div>

      </ScrollAreaWithGradients>
    </div>
  );
}
