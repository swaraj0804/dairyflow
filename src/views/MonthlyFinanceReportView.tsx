import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { exportToPdf, exportToExcel, ExportButtons } from '../lib/exportUtils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, getDaysInMonth, getDate } from 'date-fns';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';

interface MonthlyFinanceReportViewProps {
  onBack: () => void;
}

export default function MonthlyFinanceReportView({ onBack }: MonthlyFinanceReportViewProps) {
  const { customers, dailyFinance } = useApp();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { monthData, daysArray } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const daysInMonth = getDaysInMonth(currentMonth);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Filter dailyFinance for current month
    const monthlyFinance = dailyFinance.filter(entry => {
      try {
        const entryDate = parseISO(entry.date);
        return isWithinInterval(entryDate, { start, end });
      } catch (e) {
        return false;
      }
    });

    const dataByCustomer = customers.map(customer => {
      const customerEntries = monthlyFinance.filter(e => e.customerId === customer.id && e.confirmed);
      const totalAmount = customerEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalPrice = totalAmount * (customer.price || 0);

      const dailyAmounts: Record<number, number> = {};
      customerEntries.forEach(entry => {
        try {
          const entryDate = parseISO(entry.date);
          const day = getDate(entryDate);
          dailyAmounts[day] = (dailyAmounts[day] || 0) + entry.amount;
        } catch (e) {
          // ignore
        }
      });

      return {
        ...customer,
        totalAmount,
        totalPrice,
        dailyAmounts
      };
    });

    return { monthData: dataByCustomer, daysArray };
  }, [currentMonth, customers, dailyFinance]);

  const grandTotalAmount = monthData.reduce((sum, data) => sum + data.totalAmount, 0);
  const grandTotalPrice = monthData.reduce((sum, data) => sum + data.totalPrice, 0);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const formattedMonth = format(currentMonth, 'MMMM yyyy');

  const getExportData = () => {
    return monthData.map(data => {
      const row: (string | number)[] = [
        `${data.firstName} ${data.lastName}`
      ];
      daysArray.forEach(day => {
        row.push(data.dailyAmounts[day] ? data.dailyAmounts[day].toFixed(1) : '-');
      });
      row.push(data.totalAmount.toFixed(1));
      row.push(`₹${(data.price || 0).toFixed(2)}`);
      row.push(`₹${data.totalPrice.toFixed(2)}`);
      return row;
    });
  };

  const handleExportPdf = () => {
    const headers = ['Customer', ...daysArray.map(String), 'Total(L)', 'Price', 'Total(₹)'];
    exportToPdf(`Monthly Milk Intake - ${formattedMonth}`, headers, getExportData());
  };

  const handleExportExcel = () => {
    const headers = ['Customer', ...daysArray.map(String), 'Total Amount (Ltr)', 'Price/Ltr', 'Total (₹)'];
    exportToExcel(`Monthly Milk Intake - ${formattedMonth}`, headers, getExportData());
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
            <h1 className="font-serif font-bold text-xl text-white tracking-tight">MILK INTAKE</h1>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-widest mt-1">Monthly Data Sheet</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollAreaWithGradients
        containerClassName="flex-1 min-h-0 w-full"
        className="p-4 w-full"
      >
        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 ring-1 ring-white/80 mb-6 max-w-md mx-auto"
        >
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center text-brand-900/70 hover:text-brand-900 hover:bg-cream-100/80 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex items-center gap-2 text-brand-900 font-bold">
            <Calendar size={18} className="text-brand-600" />
            <span>{formattedMonth}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center text-brand-900/70 hover:text-brand-900 hover:bg-cream-100/80 rounded-full transition-colors transform rotate-180"
          >
            <ArrowLeft size={20} />
          </motion.button>
        </motion.div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileHover={{ y: -2 }}
            className="bg-white/90 backdrop-blur-xl p-4.5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 ring-1 ring-white/80"
          >
            <h3 className="text-[10px] font-bold text-brand-900/80 uppercase tracking-widest mb-1">Total Milk</h3>
            <p className="text-2xl font-serif font-bold text-brand-900">{grandTotalAmount.toFixed(1)} <span className="text-sm">Ltr</span></p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white/90 backdrop-blur-xl p-4.5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 ring-1 ring-white/80"
          >
            <h3 className="text-[10px] font-bold text-brand-900/80 uppercase tracking-widest mb-1">Total Value</h3>
            <p className="text-2xl font-serif font-bold text-brand-600">₹{grandTotalPrice.toFixed(2)}</p>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/90 backdrop-blur-xl rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 ring-1 ring-white/80 overflow-hidden mb-6 max-w-[95vw] mx-auto w-full"
        >
          <div className="px-4.5 py-3.5 bg-cream-100/60 border-b border-brand-900/10 sticky left-0">
            <h2 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Customer Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-brand-900/10 bg-cream-50/80 text-xs text-brand-900/80 font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4 sticky left-0 bg-cream-50/95 backdrop-blur-md min-w-30 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Customer</th>
                  {daysArray.map(day => (
                    <th key={day} className="p-3 text-center min-w-10">{day}</th>
                  ))}
                  <th className="p-3 text-right min-w-20">Liters</th>
                  <th className="p-3 text-right min-w-20">Price</th>
                  <th className="p-3 pr-4 text-right min-w-25">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthData.length > 0 ? (
                  monthData.map((data) => (
                    <tr key={data.id} className="border-b border-cream-100/80 last:border-0 hover:bg-brand-900/5 transition-colors">
                      <td className="p-3 pl-4 font-semibold text-brand-900 text-sm sticky left-0 bg-white/95 backdrop-blur-md z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        {data.firstName} {data.lastName}
                      </td>
                      {daysArray.map(day => (
                        <td key={day} className={`p-3 text-center text-sm font-medium ${data.dailyAmounts[day] ? 'text-brand-600 font-bold' : 'text-brand-900/35'}`}>
                          {data.dailyAmounts[day] ? data.dailyAmounts[day].toFixed(1) : '-'}
                        </td>
                      ))}
                      <td className="p-3 text-right text-sm font-bold text-brand-900 bg-cream-50/40">
                        {data.totalAmount.toFixed(1)}
                      </td>
                      <td className="p-3 text-right text-sm font-bold text-brand-900 bg-cream-50/40">
                        ₹{(data.price || 0).toFixed(2)}
                      </td>
                      <td className="p-3 pr-4 text-right text-sm font-bold text-brand-600 bg-cream-50/40">
                        ₹{data.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={daysArray.length + 4} className="p-6 text-center text-sm font-medium text-brand-900/70 sticky left-0">
                      No milk intake records for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto w-full pb-8"
        >
          {monthData.length > 0 && (
            <ExportButtons onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
          )}
        </motion.div>
      </ScrollAreaWithGradients>
    </div>
  );
}
