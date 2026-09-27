const fs = require('fs');
let code = fs.readFileSync('src/views/FarmExpensesView.tsx', 'utf8');

// Import ChevronLeft and ChevronRight
code = code.replace("import { ArrowLeft, PlusCircle, ReceiptText, Trash2, Edit2, Check, X } from 'lucide-react';", "import { ArrowLeft, PlusCircle, ReceiptText, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';");

// Add state for selected month in showHistory
const stateAdd = `
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
  });
  
  const monthYearStr = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
`;

code = code.replace("const [editData, setEditData] = useState<Partial<ExpenseEntry>>({});", "const [editData, setEditData] = useState<Partial<ExpenseEntry>>({});\n" + stateAdd);

// Update MONTHLY EXPENSES header
const historyHeaderOld = `<h1 className="font-serif font-bold text-xl text-brand-900 tracking-tight">MONTHLY EXPENSES</h1>`;
const historyHeaderNew = `<h1 className="font-serif font-bold text-xl text-brand-900 tracking-tight">MONTHLY EXPENSES</h1>
              <div className="flex items-center justify-between mt-1 -ml-1">
                <button 
                  onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(d); }}
                  className="p-1 text-brand-900/50 hover:bg-brand-900/10 rounded transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-xs font-bold text-brand-900/50 uppercase tracking-widest">{monthYearStr}</p>
                <button 
                  onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(d); }}
                  className="p-1 text-brand-900/50 hover:bg-brand-900/10 rounded transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>`;

code = code.replace(historyHeaderOld, historyHeaderNew);

// Use currentMonthExpenses instead of expenses
code = code.replace(/{expenses.length === 0 \?/g, "{currentMonthExpenses.length === 0 ?");
code = code.replace(/{expenses.map\(entry => \(/g, "{currentMonthExpenses.map(entry => (");

// Let's also add date selector on the main view
const mainDateStateOld = `const [currentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));`;
const mainDateStateNew = `const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
`;
code = code.replace(mainDateStateOld, mainDateStateNew);

const saveExpenseOld = `date: new Date().toISOString().split('T')[0],`;
const saveExpenseNew = `date: selectedDate.toISOString().split('T')[0],`;
code = code.replace(saveExpenseOld, saveExpenseNew);

const mainHeaderOld = `<p className="text-xs font-bold text-brand-900/50 uppercase tracking-widest mt-1">{currentDate}</p>`;
const mainHeaderNew = `<div className="flex items-center justify-between mt-1 -ml-1">
              <button 
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                className="p-1 text-brand-900/50 hover:bg-brand-900/10 rounded transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-xs font-bold text-brand-900/50 uppercase tracking-widest">{currentDateStr}</p>
              <button 
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                className="p-1 text-brand-900/50 hover:bg-brand-900/10 rounded transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>`;
code = code.replace(mainHeaderOld, mainHeaderNew);

// Export buttons need to export current month
code = code.replace(/return expenses.map/g, "return currentMonthExpenses.map");

fs.writeFileSync('src/views/FarmExpensesView.tsx', code);
console.log('patched FarmExpensesView.tsx');
