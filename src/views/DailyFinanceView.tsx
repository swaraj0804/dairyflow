import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, UserPlus, FileBarChart, Check, X, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Customer, DailyFinanceEntry } from '../types';
import ScrollAreaWithGradients from '../components/ScrollAreaWithGradients';
import { useToast } from '../context/ToastContext';
import { toDateKey } from '../utils/dateUtils';

interface DailyFinanceViewProps {
  onBack: () => void;
  onNavigateToReports: () => void;
}

export default function DailyFinanceView({ onBack, onNavigateToReports }: DailyFinanceViewProps) {
  const { customers, dailyFinance, updateDailyFinance, addCustomer, updateCustomer, deleteCustomer, isOnline } = useApp();
  const { showSuccess, showInfo } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => toDateKey());
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

  // Local state for the sheet to allow unsaved edits
  const [sheetData, setSheetData] = useState<Record<string, { amount: string, confirmed: boolean }>>({});
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const [savingAction, setSavingAction] = useState<'save' | 'update' | null>(null);
  const isSaving = savingAction !== null;
  const hasSavedSheet = useMemo(
    () => dailyFinance.some(entry => entry.date === selectedDate),
    [dailyFinance, selectedDate]
  );

  // Initialize sheet data from context
  useEffect(() => {
    const todayEntries = dailyFinance.filter(e => e.date === selectedDate);
    const initialData: Record<string, { amount: string, confirmed: boolean }> = {};

    customers.forEach(cust => {
      const entry = todayEntries.find(e => e.customerId === cust.id);
      initialData[cust.id] = {
        amount: entry ? entry.amount.toString() : (cust.litres ? cust.litres.toString() : ''),
        confirmed: entry ? entry.confirmed : false
      };
    });
    setSheetData(initialData);
  }, [customers, dailyFinance, selectedDate]);

  const handleAmountChange = (customerId: string, amount: string) => {
    setSheetData(prev => ({
      ...prev,
      [customerId]: { ...(prev[customerId] || { amount: '', confirmed: false }), amount }
    }));
  };

  const toggleConfirm = (customerId: string) => {
    setSheetData(prev => ({
      ...prev,
      [customerId]: { ...(prev[customerId] || { amount: '', confirmed: false }), confirmed: !prev[customerId]?.confirmed }
    }));
  };

  const allConfirmed = useMemo(() => {
    return customers.length > 0 && customers.every(c => sheetData[c.id]?.confirmed);
  }, [customers, sheetData]);

  const toggleConfirmAll = () => {
    setSheetData(prev => {
      const newData = { ...prev };
      customers.forEach(c => {
        newData[c.id] = { ...(newData[c.id] || { amount: '', confirmed: false }), confirmed: !allConfirmed };
      });
      return newData;
    });
  };

  const totalAttendance = useMemo(() => {
    return customers.reduce((sum, customer) => {
      const data = sheetData[customer.id] || { amount: '0', confirmed: false };
      if (!data.confirmed) return sum;
      return sum + (parseFloat(data.amount || '0') * (customer.price || 0));
    }, 0).toFixed(2);
  }, [customers, sheetData]);

  const handleSave = async () => {
    const action = hasSavedSheet ? 'update' : 'save';
    setSavingAction(action);
    const newEntries: DailyFinanceEntry[] = customers.map(customer => {
      const data = sheetData[customer.id] || { amount: '0', confirmed: false };
      return {
        id: `${selectedDate}-${customer.id}`,
        date: selectedDate,
        customerId: customer.id,
        amount: parseFloat(data.amount) || 0,
        confirmed: data.confirmed
      };
    });
    try {
      await updateDailyFinance(newEntries, selectedDate);
      const confirmedCount = newEntries.filter(e => e.confirmed).length;
      showSuccess(
        action === 'update' ? 'Daily Sheet Updated!' : 'Daily Sheet Saved!',
        `${confirmedCount} customer deliveries ${action === 'update' ? 'updated' : 'saved'} for ${displayDate}${!isOnline ? ' (Cached offline)' : ''}`,
        { iconType: 'check' }
      );
    } finally {
      setTimeout(() => setSavingAction(null), 2000);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateKey(d));
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDateKey(d));
  };

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Top Bar */}
      <div className="bg-linear-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">

        <div className="flex items-center gap-4 max-w-md mx-auto w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-serif font-bold text-xl text-white tracking-tight">DAILY FINANCE</h1>
              <p className="text-[10px] font-bold text-brand-100 uppercase tracking-widest mt-1">{displayDate}</p>
            </div>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl px-2 py-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handlePrevDay}
                className="p-1.5 text-white hover:bg-white/20 rounded-xl transition-colors"
                title="Previous Day"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleNextDay}
                className="p-1.5 text-white hover:bg-white/20 rounded-xl transition-colors"
                title="Next Day"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollAreaWithGradients
        containerClassName="flex-1 min-h-0 w-full"
        className="p-4 max-w-md mx-auto w-full"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-[26px] shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)] border border-brand-900/10 ring-1 ring-white/80 overflow-hidden mb-6">
          <div className="px-4.5 py-3.5 bg-cream-100/60 backdrop-blur-sm border-b border-brand-900/10 flex justify-between items-center">
            <h2 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Milk Intake Attendance</h2>
            <div className="text-sm font-bold text-brand-600">
              Total: ₹{totalAttendance}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-900/10 bg-cream-50/70 text-xs text-brand-900/80 font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Customer Name</th>
                  <th className="p-3 text-center">Amount (Ltr)</th>
                  <th className="p-3 text-center">Price</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 pr-4 text-center">
                    <button onClick={toggleConfirmAll} className="flex items-center justify-center gap-2 w-full hover:text-brand-900 transition-colors group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allConfirmed ? 'bg-brand-600 border-brand-600 text-white' : 'border-brand-900/60 text-transparent group-hover:border-brand-600/50'}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      Confirm All
                    </button>
                  </th>
                  <th className="p-3 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => {
                  const data = sheetData[customer.id] || { amount: '', confirmed: false };
                  const rowTotal = (parseFloat(data.amount || '0') * (customer.price || 0)).toFixed(2);
                  return (
                    <tr key={customer.id} className={`border-b border-cream-100 last:border-0 ${data.confirmed ? 'bg-brand-600/5' : ''}`}>
                      <td className="p-3 pl-4 font-semibold text-brand-900 text-sm">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          aria-label={`Amount for ${customer.firstName} ${customer.lastName}`}
                          value={data.amount}
                          onChange={event => handleAmountChange(customer.id, event.target.value)}
                          className={`w-full max-w-20 mx-auto block text-center px-2 py-1.5 rounded-lg border-2 text-sm font-bold outline-none focus:border-brand-600 ${data.confirmed ? 'border-transparent text-brand-600' : 'border-cream-200 text-brand-900'}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className={`w-full max-w-20 mx-auto block text-center px-2 py-1.5 rounded-lg border-2 text-sm font-bold ${data.confirmed ? 'border-transparent text-brand-600' : 'border-transparent text-brand-900'
                          }`}>
                          ₹{customer.price || '0'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className={`w-full max-w-20 mx-auto block text-center px-2 py-1.5 rounded-lg border-2 text-sm font-bold text-brand-600`}>
                          ₹{rowTotal}
                        </div>
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <motion.button
                          whileTap={{ scale: 0.82 }}
                          whileHover={{ scale: 1.08 }}
                          onClick={() => toggleConfirm(customer.id)}
                          className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-colors border-2 ${data.confirmed ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-cream-200 text-transparent hover:border-brand-600/50'
                            }`}
                        >
                          <Check size={16} strokeWidth={3} />
                        </motion.button>
                      </td>
                      <td className="p-3 pr-4 text-center flex items-center justify-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => setEditingCustomer(customer)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-900/70 hover:text-brand-900 hover:bg-cream-50 transition-colors"
                        >
                          <Edit2 size={16} strokeWidth={2} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => setCustomerToDelete(customer.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </motion.button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </ScrollAreaWithGradients>

      {/* Local Bottom Action Bar */}
      <div className="bg-white/85 backdrop-blur-xl border-t border-brand-900/10 p-4 sticky bottom-0 z-10 shadow-[0_-8px_24px_rgba(10,47,32,0.06)]">
        <div className="max-w-md mx-auto w-full flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowAddCustomer(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 text-brand-700 bg-brand-600/10 rounded-2xl hover:bg-brand-600/20 transition-colors border border-brand-600/15"
          >
            <UserPlus size={18} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Add Customer</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            onClick={onNavigateToReports}
            className="flex-1 flex flex-col items-center justify-center py-2 text-brand-900 bg-cream-100/80 hover:bg-cream-200 rounded-2xl transition-colors border border-brand-900/10"
          >
            <FileBarChart size={18} className="mb-1 text-brand-900/80" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Reports</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.96 }}
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-2 text-white rounded-2xl font-bold text-sm tracking-wide shadow-md transition-all ${isSaving ? 'bg-brand-700 shadow-brand-600/5' : 'bg-brand-600 shadow-brand-600/20 hover:bg-brand-700'}`}
          >
            {savingAction === 'save' ? 'SAVING...' : savingAction === 'update' ? 'UPDATING...' : hasSavedSheet ? 'UPDATE SHEET' : 'SAVE SHEET'}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {/* Add New Customer Overlay */}
        {showAddCustomer && (
          <AddCustomerModal
            onClose={() => setShowAddCustomer(false)}
            onSave={(cust) => { addCustomer(cust); setShowAddCustomer(false); }}
          />
        )}

        {/* Edit Customer Overlay */}
        {editingCustomer && (
          <AddCustomerModal
            initialData={editingCustomer}
            onClose={() => setEditingCustomer(null)}
            onSave={(cust) => { updateCustomer(cust.id, cust); setEditingCustomer(null); }}
          />
        )}

        {/* Delete Customer Confirmation */}
        {customerToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-cream"
            >
              <h3 className="font-serif font-bold text-xl text-brand-900 mb-2">Delete Customer</h3>
              <p className="text-brand-900/70 mb-6 text-sm">Are you sure you want to delete this customer? This will also remove their daily finance records.</p>
              <div className="flex gap-3">
                <button onClick={() => setCustomerToDelete(null)} className="flex-1 py-3 bg-cream-50 text-brand-900 font-bold rounded-2xl hover:bg-brand-900/5 transition-colors active:scale-95 text-sm">Cancel</button>
                <button onClick={() => { deleteCustomer(customerToDelete); setCustomerToDelete(null); }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20 active:scale-95 text-sm">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent for the Add Customer Form Overlay
function AddCustomerModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (c: Customer) => void, initialData?: Customer }) {
  const [formData, setFormData] = useState<Partial<Customer>>(initialData || {
    milkType: 'Cow',
    shift: 'Morning',
    litres: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      address: formData.address || '',
      phone: formData.phone || '',
      email: formData.email || '',
      milkType: formData.milkType as 'Cow' | 'Buffalo',
      shift: formData.shift as 'Morning' | 'Evening',
      litres: Number(formData.litres) || 0,
      price: Number(formData.price) || 0
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-cream-50 w-full max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 pb-2 sticky top-0 bg-cream-50 z-30 border-b border-cream-200">
          <h2 className="text-xl font-serif font-bold text-brand-900">{initialData ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button onClick={onClose} className="p-2 text-brand-900/60 hover:text-brand-900 hover:bg-cream-100 rounded-full transition-colors active:scale-90"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">First Name</label>
              <input required type="text" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
                value={formData.firstName || ''}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Last Name</label>
              <input required type="text" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
                value={formData.lastName || ''}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Delivery Address</label>
            <input required type="text" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Phone Number</label>
            <input type="tel" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Milk Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, milkType: 'Cow' })}
                className={`py-2.5 rounded-[20px] text-sm font-bold border-2 transition-all ${formData.milkType === 'Cow' ? 'border-brand-600 bg-brand-600/10 text-brand-600' : 'border-cream-200 bg-white text-brand-900/70 hover:border-brand-600/30'}`}>
                Cow
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, milkType: 'Buffalo' })}
                className={`py-2.5 rounded-[20px] text-sm font-bold border-2 transition-all ${formData.milkType === 'Buffalo' ? 'border-brand-600 bg-brand-600/10 text-brand-600' : 'border-cream-200 bg-white text-brand-900/70 hover:border-brand-600/30'}`}>
                Buffalo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Milk (Litres)</label>
            <input required type="number" step="0.1" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
              value={formData.litres || ''}
              onChange={e => setFormData({ ...formData, litres: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 5.5" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Price (₹)</label>
            <input required type="number" step="0.1" className="w-full bg-white px-3 py-3 rounded-[20px] border border-cream-200 shadow-sm focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 outline-none text-sm text-brand-900 font-medium placeholder:text-brand-900/30"
              value={formData.price || ''}
              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 10.5" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-900/70 mb-1 uppercase tracking-wide">Delivery Time</label>
            <div className="flex bg-cream-100 p-1 rounded-[20px] border border-cream-200">
              <button type="button" onClick={() => setFormData({ ...formData, shift: 'Morning' })}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.shift === 'Morning' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-900/60 hover:text-brand-900'}`}>
                Morning
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, shift: 'Evening' })}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.shift === 'Evening' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-900/60 hover:text-brand-900'}`}>
                Evening
              </button>
            </div>
          </div>

          <div className="pt-4 pb-safe">
            <button type="submit" className="w-full bg-brand-600 text-white font-bold text-base py-4 rounded-[20px] shadow-lg shadow-brand-600/20 hover:bg-brand-600-dark active:scale-95 transition-all">
              {initialData ? 'SAVE CHANGES' : 'CREATE PROFILE & SAVE'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
