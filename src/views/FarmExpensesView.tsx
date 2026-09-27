import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, PlusCircle, ReceiptText, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, List, WifiOff, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPdf, exportToExcel, ExportButtons } from '../lib/exportUtils';
import type { ExpenseEntry } from '../types';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';
import DateRangeSelector, { DateFilterMode, getDateRangeDetails, isDateInRange } from '../components/DateRangeSelector';
import { useToast } from '../context/ToastContext';
import { toDateKey } from '../utils/dateUtils';

interface FarmExpensesViewProps {
  onBack: () => void;
}

export default function FarmExpensesView({ onBack }: FarmExpensesViewProps) {
  const { addExpense, updateExpense, deleteExpense, expenses, isOnline } = useApp();
  const { showSuccess, showError, showInfo } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [showHistory, setShowHistory] = useState(false);
  const [filterMode, setFilterMode] = useState<DateFilterMode>('month');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ExpenseEntry>>({});

  // Dynamic date range calculations
  const dateRange = useMemo(() => getDateRangeDetails(filterMode, selectedDate), [filterMode, selectedDate]);

  // Filtered expenses based on Day, Week, or Month
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => isDateInRange(e.date, dateRange))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, dateRange]);

  const totalRangeExpense = filteredExpenses.reduce((sum, e) => sum + e.price, 0);
  const avgExpense = filteredExpenses.length > 0 ? (totalRangeExpense / filteredExpenses.length).toFixed(2) : '0.00';


  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const handleEditClick = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setEditData({ name: entry.name, price: entry.price });
  };

  const handleSaveEdit = async (id: string) => {
    if (editData.name && editData.price !== undefined) {
      await updateExpense(id, { name: editData.name.trim(), price: editData.price });
      showSuccess(
        'Expense Updated!',
        `${editData.name} • ₹${Number(editData.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        { iconType: 'expense' }
      );
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSaveExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showError('Incomplete Details', 'Please provide an expense name and amount.');
      return false;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showError('Invalid Amount', 'Please enter a valid expense cost.');
      return false;
    }

    const entry: ExpenseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: toDateKey(selectedDate),
      name: formData.name.trim(),
      price: priceNum
    };

    addExpense(entry);
    showSuccess(
      'Expense Saved!',
      `${entry.name} • ₹${entry.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${!isOnline ? ' (Cached offline)' : ''}`,
      { iconType: 'expense' }
    );
    return true; // indicates success
  };

  const handleSave = (e: React.FormEvent) => {
    if (handleSaveExpense(e)) {
      setIsSaving(true);
      setFormData({ name: '', price: '' });
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const handleAddNew = () => {
    if (handleSaveExpense()) {
      setFormData({ name: '', price: '' });
    }
  };

  const getExportData = () => {
    return filteredExpenses.map(entry => [
      entry.date,
      entry.name,
      `₹${entry.price.toFixed(2)}`
    ]);
  };

  const handleExportPdf = () => {
    exportToPdf(`Farm Expenses (${dateRange.displayLabel})`, ['Date', 'Expense Name', 'Amount'], getExportData());
  };

  const handleExportExcel = () => {
    exportToExcel(`Farm Expenses (${dateRange.displayLabel})`, ['Date', 'Expense Name', 'Amount'], getExportData());
  };

  return (
    <AnimatePresence mode="wait">
      {showHistory ? (
        <motion.div
          key="expenses-history"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col h-full bg-cream-50"
        >
          {/* Top Bar with Date Range Selector */}
          <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto w-full mb-3">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHistory(false)}
                  className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Back to expense entry"
                >
                  <ArrowLeft size={24} />
                </motion.button>
                <div>
                  <h1 className="font-serif font-bold text-xl text-white tracking-tight">FARM EXPENSES REPORT</h1>
                  <p className="text-xs text-brand-200">Historical costs & logs</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowHistory(false)}
                className="text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
              >
                + New Expense
              </motion.button>
            </div>

            <div className="max-w-md mx-auto w-full">
              <DateRangeSelector
                mode={filterMode}
                onModeChange={setFilterMode}
                currentDate={selectedDate}
                onDateChange={setSelectedDate}
                theme="dark"
                idPrefix="expenses-history-filter"
              />
            </div>
          </div>

          <ScrollAreaWithGradients
            containerClassName="flex-1 min-h-0 w-full"
            className="p-6 max-w-md mx-auto w-full"
          >
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white rounded-3xl border border-cream-200 shadow-sm mt-2">
                <p className="font-serif font-bold text-lg text-brand-900 mb-1">No Expenses Recorded</p>
                <p className="text-sm text-brand-900/60 font-medium">
                  No expense entries found for {dateRange.displayLabel}.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowHistory(false)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Log Expense For {dateRange.displayLabel}
                </motion.button>
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 mb-6 flex justify-between items-center ring-1 ring-white/80"
                >
                  <div>
                    <p className="text-[10px] text-brand-900/80 font-bold uppercase tracking-wider mb-1">
                      Total Expenses ({filterMode.toUpperCase()})
                    </p>
                    <p className="font-serif font-bold text-[#E63946] text-2xl">-₹{totalRangeExpense.toFixed(2)}</p>
                    <p className="text-[11px] text-brand-900/60 font-semibold mt-0.5">
                      {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense item' : 'expense items'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-brand-900/80 font-bold uppercase tracking-wider mb-1">Average / Entry</p>
                    <p className="font-serif font-bold text-brand-900 text-xl">₹{avgExpense}</p>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  {filteredExpenses.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                      className="bg-white/90 backdrop-blur-xl p-4.5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 ring-1 ring-white/80 flex flex-col gap-3 hover:shadow-[0_8px_24px_-4px_rgba(10,47,32,0.1)] transition-all"
                    >
                      {editingId === entry.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Name</label>
                              <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full bg-white px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Amount (₹)</label>
                              <input type="number" step="0.01" value={editData.price || ''} onChange={e => setEditData({ ...editData, price: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-brand-900/10">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingId(null)} className="p-2 text-brand-900/60 hover:bg-cream-100 rounded-lg transition-colors"><X size={16} /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSaveEdit(entry.id)} className="p-2 text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-md shadow-brand-600/20"><Check size={16} /></motion.button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-brand-900 text-base tracking-tight">{entry.name}</p>
                                {entry._synced === false ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                    <WifiOff size={10} />
                                    Offline Cached
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                    <Cloud size={10} />
                                    Synced
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-brand-900/70 font-semibold mt-0.5">{entry.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-serif font-bold text-[#E63946] text-lg">-₹{entry.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-brand-900/10">
                            {deleteConfirmId === entry.id ? (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-red-500">Delete?</span>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDeleteConfirmId(null)} className="p-1.5 text-brand-900/60 hover:text-brand-900 hover:bg-cream-100 rounded-lg transition-colors"><X size={14} /></motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={async () => {
                                  await deleteExpense(entry.id);
                                  setDeleteConfirmId(null);
                                  showInfo('Expense Removed', `${entry.name} was removed from records.`);
                                }} className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"><Check size={14} /></motion.button>
                              </div>
                            ) : (
                              <>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleEditClick(entry)} className="p-1.5 text-brand-900/60 hover:text-brand-900 hover:bg-cream-100 rounded-lg transition-colors"><Edit2 size={14} /></motion.button>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setDeleteConfirmId(entry.id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></motion.button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-8 pt-4 border-t border-cream-200">
              <ExportButtons onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
            </div>
          </ScrollAreaWithGradients>
        </motion.div>
      ) : (
        <motion.div
          key="expenses-form"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col h-full bg-cream-50"
        >
          {/* Top Bar */}
          <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto w-full mb-3">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onBack}
                  className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft size={24} />
                </motion.button>
                <div>
                  <h1 className="font-serif font-bold text-xl text-white tracking-tight">FARM EXPENSES</h1>
                  <p className="text-xs text-brand-200">Record daily farm costs</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
                title="View Historical Expenses"
              >
                <List size={16} />
                <span>History</span>
              </motion.button>
            </div>

            {/* Date Selector for Logging */}
            <div className="max-w-md mx-auto w-full bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl px-3.5 py-2 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                className="p-1 text-white hover:bg-white/20 rounded-xl transition-colors"
                title="Previous Day"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </motion.button>
              <div className="text-center">
                <p className="text-xs font-extrabold text-white uppercase tracking-wider drop-shadow-sm">{currentDateStr}</p>
                <p className="text-[10px] text-brand-100 font-bold">Expense Date</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                className="p-1 text-white hover:bg-white/20 rounded-xl transition-colors"
                title="Next Day"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>

          {/* Main Content */}
          <ScrollAreaWithGradients
            containerClassName="flex-1 min-h-0 w-full"
            className="p-6 max-w-md mx-auto w-full"
          >
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80 relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <ReceiptText size={120} />
              </div>

              <form onSubmit={handleSave} className="relative z-10 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-brand-900/80 mb-2 uppercase tracking-wide">Expense Name / Reason</label>
                  <input required type="text" className="w-full bg-white px-4 py-3.5 rounded-2xl border border-brand-900/10 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-brand-900 font-bold text-lg placeholder:text-brand-900/30"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Cattle Feed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-900/80 mb-2 uppercase tracking-wide">Price Amount (₹)</label>
                  <input required type="number" step="0.01" className="w-full bg-cream-50/80 px-4 py-3.5 rounded-2xl border border-brand-900/10 shadow-sm focus:ring-2 focus:ring-brand-600/30 outline-none text-brand-900 font-serif font-bold text-3xl placeholder:text-brand-900/40"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                </div>

                <div className="pt-4 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isSaving}
                    className={`flex-2 text-white font-bold text-sm tracking-wide py-4 rounded-2xl shadow-lg transition-all ${isSaving ? 'bg-brand-700 shadow-brand-600/5' : 'bg-brand-600 shadow-brand-600/20 hover:bg-brand-700'}`}
                  >
                    {isSaving ? 'SAVED ✓' : 'SAVE EXPENSE'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={handleAddNew}
                    className="flex-1 flex items-center justify-center bg-cream-100/80 hover:bg-cream-200 text-brand-900 border border-brand-900/10 font-bold text-sm rounded-2xl transition-all"
                  >
                    <PlusCircle size={22} />
                  </motion.button>
                </div>
              </form>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setShowHistory(true)}
              className="w-full flex items-center justify-center gap-2 text-brand-900/80 font-bold text-sm tracking-wide py-4 bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-brand-900/10 hover:border-brand-600/30 hover:shadow-md transition-all ring-1 ring-white/80"
            >
              VIEW HISTORICAL EXPENSE REPORT
            </motion.button>

          </ScrollAreaWithGradients>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
