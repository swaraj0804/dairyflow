import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ScanLine, List, Loader2, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, WifiOff, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPdf, exportToExcel, ExportButtons } from '../lib/exportUtils';
import type { MilkInwardEntry } from '../types';
import { apiFetch } from '../utils/api';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';
import DateRangeSelector, { DateFilterMode, getDateRangeDetails, isDateInRange } from '../components/DateRangeSelector';
import { OfflineSyncBadge } from '../components/OfflineSyncBadge';
import { ShiftReminderBanner } from '../components/ShiftReminderBanner';
import { useToast } from '../context/ToastContext';

interface MilkInwardViewProps {
  onBack: () => void;
  onOpenSettings?: () => void;
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string'
    ? resolve(reader.result)
    : reject(new Error('Could not read the selected image.'));
  reader.onerror = () => reject(reader.error || new Error('Could not read the selected image.'));
  reader.onabort = () => reject(new Error('Image reading was cancelled.'));
  reader.readAsDataURL(file);
});

export default function MilkInwardView({ onBack, onOpenSettings }: MilkInwardViewProps) {
  const { addMilkInward, updateMilkInward, deleteMilkInward, milkInward, token, isOnline } = useApp();
  const { showSuccess, showError, showInfo } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentDateDisplay = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [showHistory, setShowHistory] = useState(false);
  const [filterMode, setFilterMode] = useState<DateFilterMode>('month');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MilkInwardEntry>>({});

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    litres: '',
    temp: '',
    snf: '',
    rate: '',
    fat: '',
    shift: 'Morning' as 'Morning' | 'Evening'
  });

  useEffect(() => {
    const fatVal = parseFloat(formData.fat);
    const snfVal = parseFloat(formData.snf);
    if (!isNaN(fatVal) && !isNaN(snfVal)) {
      const calculatedRate = (fatVal * 3.50) + (snfVal * 3.50);
      setFormData(prev => ({ ...prev, rate: calculatedRate.toFixed(2) }));
    }
  }, [formData.fat, formData.snf]);

  const totalAmount = (parseFloat(formData.litres) || 0) * (parseFloat(formData.rate) || 0);

  const todayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const isCurrentShiftSubmitted = milkInward.some(m => m.date === todayStr && m.shift === formData.shift);

  // Dynamic date range calculation for Day, Week, or Month
  const dateRange = useMemo(() => getDateRangeDetails(filterMode, selectedDate), [filterMode, selectedDate]);

  // Filter entries based on the active date range
  const filteredMilkInward = useMemo(() => {
    return milkInward
      .filter(entry => isDateInRange(entry.date, dateRange))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [milkInward, dateRange]);

  const totalAmountFiltered = filteredMilkInward.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const totalLitresFiltered = filteredMilkInward.reduce((sum, entry) => sum + entry.litres, 0);
  const avgFatFiltered = filteredMilkInward.length > 0
    ? (filteredMilkInward.reduce((sum, entry) => sum + entry.fat, 0) / filteredMilkInward.length).toFixed(1)
    : '0.0';

  const handleEditClick = (entry: MilkInwardEntry) => {
    setEditingId(entry.id);
    setEditData({
      litres: entry.litres,
      rate: entry.rate,
      fat: entry.fat,
      snf: entry.snf,
      temp: entry.temp,
      shift: entry.shift
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (editData.litres !== undefined && editData.rate !== undefined) {
      const newTotal = editData.litres * editData.rate;
      await updateMilkInward(id, {
        litres: editData.litres,
        rate: editData.rate,
        fat: editData.fat,
        snf: editData.snf,
        temp: editData.temp,
        shift: editData.shift,
        totalAmount: newTotal
      });
      showSuccess(
        'Milk Entry Updated!',
        `${editData.shift || 'Shift'} • ${editData.litres}L • ₹${newTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        { iconType: 'milk' }
      );
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if an entry for this shift on selected date already exists
    const existingEntry = milkInward.find(m => m.date === todayStr && m.shift === formData.shift);
    if (existingEntry) {
      showError(
        'Duplicate Shift Entry',
        `Data for ${formData.shift} shift on this date already exists. You can edit the record in the monthly history below.`
      );
      return;
    }

    const entry: MilkInwardEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr,
      shift: formData.shift,
      litres: parseFloat(formData.litres),
      temp: parseFloat(formData.temp) || 0,
      snf: parseFloat(formData.snf) || 0,
      rate: parseFloat(formData.rate),
      fat: parseFloat(formData.fat) || 0,
      totalAmount
    };
    setIsSaving(true);
    addMilkInward(entry);
    setFormData({ ...formData, litres: '', temp: '', snf: '', rate: '', fat: '' });
    showSuccess(
      'Milk Entry Saved!',
      `${entry.shift} Shift • ${entry.litres.toFixed(1)} Litres • ₹${entry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${!isOnline ? ' (Cached offline)' : ''}`,
      { iconType: 'milk' }
    );
    setTimeout(() => setIsSaving(false), 2000);
  };

  const getExportData = () => {
    return filteredMilkInward.map(entry => [
      entry.date,
      entry.shift,
      entry.litres,
      entry.fat,
      entry.snf,
      `₹${entry.rate}`,
      `₹${entry.totalAmount.toFixed(2)}`
    ]);
  };

  const handleExportPdf = () => {
    exportToPdf(`Milk Inward (${dateRange.displayLabel})`, ['Date', 'Shift', 'Ltr', 'Fat%', 'SNF', 'Rate', 'Total'], getExportData());
  };

  const handleExportExcel = () => {
    exportToExcel(`Milk Inward (${dateRange.displayLabel})`, ['Date', 'Shift', 'Ltr', 'Fat%', 'SNF', 'Rate', 'Total'], getExportData());
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const imageBase64 = await readFileAsDataUrl(file);
      const response = await apiFetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageBase64 })
      });

      if (!response.ok) {
        throw new Error('The receipt service could not process this image.');
      }

      const data = await response.json();
      const quantity = Number(data.totalQuantity);
      const fat = Number(data.avgFat);
      const snf = Number(data.avgSnf);
      const amount = Number(data.totalAmount);
      const hasExtractedData = [quantity, fat, snf, amount].some(value => Number.isFinite(value) && value > 0);

      if (!hasExtractedData) {
        showError('Receipt Scan Failed', 'No milk details were found. Try a clearer image or enter the values manually.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        litres: quantity > 0 ? quantity.toString() : prev.litres,
        fat: fat > 0 ? fat.toString() : prev.fat,
        snf: snf > 0 ? snf.toString() : prev.snf,
        rate: quantity > 0 && amount > 0 ? (amount / quantity).toFixed(2) : prev.rate
      }));
    } catch (error) {
      console.error('Receipt scan failed:', error);
      showError('Receipt Scan Failed', 'Could not read or process this receipt. Try again or enter the values manually.');
    } finally {
      setIsScanning(false);
      input.value = '';
    }
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-full bg-cream-50">
        <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto w-full mb-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHistory(false)}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Back to entry"
              >
                <ArrowLeft size={24} />
              </motion.button>
              <div>
                <h1 className="font-serif font-bold text-xl text-white tracking-tight">MILK INWARD REPORT</h1>
                <p className="text-xs text-brand-200">Historical logs & summaries</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <OfflineSyncBadge />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowHistory(false)}
                className="text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
              >
                + New
              </motion.button>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <DateRangeSelector
              mode={filterMode}
              onModeChange={setFilterMode}
              currentDate={selectedDate}
              onDateChange={setSelectedDate}
              theme="dark"
              idPrefix="milk-history-filter"
            />
          </div>
        </div>
        <ScrollAreaWithGradients
          containerClassName="flex-1 min-h-0 w-full"
          className="p-6 max-w-md mx-auto w-full"
        >
          {filteredMilkInward.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-3xl border border-cream-200 shadow-sm mt-2">
              <p className="font-serif font-bold text-lg text-brand-900 mb-1">No Records Found</p>
              <p className="text-sm text-brand-900/60 font-medium">
                No milk inward entries recorded for {dateRange.displayLabel}.
              </p>
              <button
                onClick={() => setShowHistory(false)}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                Log Entry For {dateRange.displayLabel}
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_4px_20px_-2px_rgba(10,47,32,0.06)] border border-brand-900/10 mb-6 flex justify-between items-center ring-1 ring-white/80">
                <div>
                  <p className="text-[10px] text-brand-900/80 font-bold uppercase tracking-wider mb-1">
                    Total Milk ({filterMode.toUpperCase()})
                  </p>
                  <p className="font-serif font-bold text-brand-900 text-2xl">{totalLitresFiltered.toFixed(1)} Ltr</p>
                  <p className="text-[11px] text-brand-900/60 font-semibold mt-0.5">
                    {filteredMilkInward.length} {filteredMilkInward.length === 1 ? 'collection entry' : 'collection entries'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-brand-900/80 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="font-serif font-bold text-brand-600 text-2xl">₹{totalAmountFiltered.toFixed(2)}</p>
                  <p className="text-[11px] text-brand-900/60 font-semibold mt-0.5">Avg Fat: {avgFatFiltered}%</p>
                </div>
              </div>
              <div className="space-y-4">
                {filteredMilkInward.map((entry, idx) => (
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
                          <div>
                            <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Litres</label>
                            <input type="number" step="0.1" value={editData.litres || ''} onChange={e => setEditData({ ...editData, litres: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Temp (°C)</label>
                            <input type="number" step="0.1" value={editData.temp || ''} onChange={e => setEditData({ ...editData, temp: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">SNF</label>
                            <input type="number" step="0.1" value={editData.snf || ''} onChange={e => setEditData({ ...editData, snf: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Fat (%)</label>
                            <input type="number" step="0.1" value={editData.fat || ''} onChange={e => setEditData({ ...editData, fat: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-brand-900/70 mb-1 block">Rate (₹)</label>
                            <input type="number" step="0.01" value={editData.rate || ''} onChange={e => setEditData({ ...editData, rate: parseFloat(e.target.value) })} className="w-full bg-cream-50 px-3 py-2 rounded-xl border border-brand-900/10 text-sm font-bold text-brand-900" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-brand-900/10">
                          <button onClick={() => setEditingId(null)} className="p-2 text-brand-900/60 hover:bg-cream-100 rounded-lg transition-colors"><X size={16} /></button>
                          <button onClick={() => handleSaveEdit(entry.id)} className="p-2 text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-md shadow-brand-600/20"><Check size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-brand-900">{entry.date}</p>
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
                            <p className="text-xs text-brand-900/80 font-bold uppercase mt-0.5">{entry.shift} • {entry.litres} Ltr @ ₹{entry.rate}/Ltr</p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif font-bold text-brand-600 text-lg">₹{entry.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-brand-900/75 font-bold">Fat: {entry.fat}%</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-brand-900/10">
                          {deleteConfirmId === entry.id ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-red-500">Delete?</span>
                              <button onClick={() => setDeleteConfirmId(null)} className="p-1.5 text-brand-900/60 hover:text-brand-900 hover:bg-cream-100 rounded-lg transition-colors"><X size={14} /></button>
                              <button onClick={() => {
                                deleteMilkInward(entry.id);
                                setDeleteConfirmId(null);
                                showInfo('Milk Entry Removed', `The ${entry.shift} shift record for ${entry.date} was deleted.`);
                              }} className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"><Check size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(entry)} className="p-1.5 text-brand-900/60 hover:text-brand-900 hover:bg-cream-100 rounded-lg transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => setDeleteConfirmId(entry.id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cream-50">
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
              <h1 className="font-serif font-bold text-xl text-white tracking-tight">MILK INWARD</h1>
              <p className="text-xs text-brand-200">Record daily milk collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OfflineSyncBadge />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
              title="View Historical Entries"
            >
              <List size={16} />
              <span>History</span>
            </motion.button>
          </div>
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
            <p className="text-xs font-extrabold text-white uppercase tracking-wider drop-shadow-sm">{currentDateDisplay}</p>
            <p className="text-[10px] text-brand-100 font-bold">Recording Date</p>
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
        {/* Daily Shift Reminder & Status Window */}
        <div className="mb-4">
          <ShiftReminderBanner
            onOpenSettings={onOpenSettings}
            onSelectShift={(s) => setFormData(prev => ({ ...prev, shift: s }))}
          />
        </div>

        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <WifiOff size={16} className="text-amber-600 shrink-0" />
            <p className="font-medium leading-relaxed">
              <strong>Offline Caching Active:</strong> Entries added now are saved to local IndexedDB and will automatically sync once your connection is restored.
            </p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleScanClick}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-3 bg-white/80 backdrop-blur-md border-2 border-dashed border-brand-600/40 text-brand-700 py-4 rounded-[22px] mb-6 hover:bg-brand-600/5 transition-all shadow-sm disabled:opacity-50"
        >
          {isScanning ? (
            <><Loader2 size={24} className="animate-spin" /> <span className="font-bold tracking-wide">SCANNING...</span></>
          ) : (
            <><ScanLine size={24} /> <span className="font-bold tracking-wide">SCAN RECEIPT / AUTO-DATA</span></>
          )}
        </motion.button>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-6 rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80 space-y-5">

          <div className="flex bg-cream-100/80 backdrop-blur-sm p-1 rounded-2xl border border-brand-900/10">
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={() => setFormData({ ...formData, shift: 'Morning' })}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${formData.shift === 'Morning' ? 'bg-white text-brand-900 font-extrabold shadow-sm' : 'text-brand-900/70 hover:text-brand-900'}`}>
              Morning
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={() => setFormData({ ...formData, shift: 'Evening' })}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${formData.shift === 'Evening' ? 'bg-white text-brand-900 font-extrabold shadow-sm' : 'text-brand-900/70 hover:text-brand-900'}`}>
              Evening
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1.5 uppercase tracking-wide">Milk (Litres)</label>
              <input required type="number" step="0.1" className="w-full bg-cream-50/80 px-4 py-3 rounded-2xl border border-brand-900/10 focus:border-brand-600 outline-none text-brand-900 font-bold text-lg"
                value={formData.litres} onChange={e => setFormData({ ...formData, litres: e.target.value })} placeholder="0.0" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1.5 uppercase tracking-wide">Temp (°C)</label>
              <input required type="number" step="0.1" className="w-full bg-cream-50/80 px-4 py-3 rounded-2xl border border-brand-900/10 focus:border-brand-600 outline-none text-brand-900 font-bold text-lg"
                value={formData.temp} onChange={e => setFormData({ ...formData, temp: e.target.value })} placeholder="0.0" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1.5 uppercase tracking-wide">SNF</label>
              <input required type="number" step="0.1" className="w-full bg-cream-50/80 px-4 py-3 rounded-2xl border border-brand-900/10 focus:border-brand-600 outline-none text-brand-900 font-bold text-lg"
                value={formData.snf} onChange={e => setFormData({ ...formData, snf: e.target.value })} placeholder="0.0" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1.5 uppercase tracking-wide">Fat (%)</label>
              <input required type="number" step="0.1" className="w-full px-4 py-3 rounded-2xl border border-brand-600/30 focus:border-brand-600 outline-none text-brand-600 font-serif font-bold text-lg bg-brand-600/5"
                value={formData.fat} onChange={e => setFormData({ ...formData, fat: e.target.value })} placeholder="0.0" />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1.5 uppercase tracking-wide">Rate per Litre (₹)</label>
              <input required type="number" step="0.01" className="w-full bg-cream-50/80 px-4 py-3 rounded-2xl border border-brand-900/10 focus:border-brand-600 outline-none text-brand-900 font-bold text-lg"
                value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} placeholder="0.00" />
            </div>
          </div>

          <div className="p-4 bg-cream-100/60 backdrop-blur-sm rounded-2xl border border-brand-900/10 flex justify-between items-center mt-2">
            <span className="text-sm font-bold text-brand-900/80 uppercase tracking-widest">Total Amount</span>
            <span className="text-2xl font-serif font-bold text-brand-600">₹{totalAmount.toFixed(2)}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSaving || isCurrentShiftSubmitted}
            className={`w-full text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-all mt-4 ${isSaving || isCurrentShiftSubmitted ? 'bg-brand-700 shadow-brand-600/5 opacity-80' : 'bg-brand-600 shadow-brand-600/20 hover:bg-brand-700'}`}
          >
            {isCurrentShiftSubmitted ? 'SHIFT ALREADY SUBMITTED' : isSaving ? 'SUBMITTED ✓' : 'SUBMIT DATA'}
          </motion.button>
        </form>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setShowHistory(true)}
          className="w-full mt-6 flex items-center justify-center gap-2 text-brand-900/80 font-bold text-sm tracking-wide hover:text-brand-900 transition-colors py-4 bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-brand-900/10 hover:border-brand-600/30 ring-1 ring-white/80"
        >
          <List size={18} />
          VIEW HISTORICAL MILK INWARD SHEET
        </motion.button>
      </ScrollAreaWithGradients>
    </div>
  );
}
