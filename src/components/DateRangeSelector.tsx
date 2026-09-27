import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO,
} from 'date-fns';

export type DateFilterMode = 'day' | 'week' | 'month';

export interface DateRange {
  mode: DateFilterMode;
  date: Date;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string;   // 'yyyy-MM-dd'
  displayLabel: string;
  subLabel?: string;
  isCurrent: boolean;
}

export function getDateRangeDetails(mode: DateFilterMode, date: Date): DateRange {
  const today = new Date();

  if (mode === 'day') {
    const startDate = format(date, 'yyyy-MM-dd');
    const endDate = startDate;
    const isCurrent = isSameDay(date, today);
    const displayLabel = isCurrent ? `Today, ${format(date, 'd MMM yyyy')}` : format(date, 'EEE, d MMM yyyy');
    return {
      mode,
      date,
      startDate,
      endDate,
      displayLabel,
      subLabel: 'Single Day',
      isCurrent,
    };
  }

  if (mode === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(end, 'yyyy-MM-dd');
    const isCurrent = isSameWeek(date, today, { weekStartsOn: 1 });

    const displayLabel = format(start, 'yyyy') === format(end, 'yyyy')
      ? `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
      : `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;

    return {
      mode,
      date,
      startDate,
      endDate,
      displayLabel,
      subLabel: isCurrent ? 'Current Week' : '7-Day Period',
      isCurrent,
    };
  }

  // mode === 'month'
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDate = format(start, 'yyyy-MM-dd');
  const endDate = format(end, 'yyyy-MM-dd');
  const isCurrent = isSameMonth(date, today);
  const displayLabel = format(date, 'MMMM yyyy');

  return {
    mode,
    date,
    startDate,
    endDate,
    displayLabel,
    subLabel: isCurrent ? 'Current Month' : `${format(date, 'MMMM')} Full Month`,
    isCurrent,
  };
}

export function getPreviousDate(mode: DateFilterMode, date: Date): Date {
  if (mode === 'day') return subDays(date, 1);
  if (mode === 'week') return subWeeks(date, 1);
  return subMonths(date, 1);
}

export function getNextDate(mode: DateFilterMode, date: Date): Date {
  if (mode === 'day') return addDays(date, 1);
  if (mode === 'week') return addWeeks(date, 1);
  return addMonths(date, 1);
}

export function isDateInRange(entryDate: string, range: DateRange): boolean {
  return entryDate >= range.startDate && entryDate <= range.endDate;
}

interface DateRangeSelectorProps {
  mode: DateFilterMode;
  onModeChange: (mode: DateFilterMode) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  theme?: 'dark' | 'light';
  className?: string;
  idPrefix?: string;
}

export default function DateRangeSelector({
  mode,
  onModeChange,
  currentDate,
  onDateChange,
  theme = 'dark',
  className = '',
  idPrefix = 'date-filter',
}: DateRangeSelectorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const range = getDateRangeDetails(mode, currentDate);

  const handlePrev = () => {
    onDateChange(getPreviousDate(mode, currentDate));
  };

  const handleNext = () => {
    onDateChange(getNextDate(mode, currentDate));
  };

  const handleResetCurrent = () => {
    onDateChange(new Date());
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // parseISO avoids local timezone day-offset bugs
      const parsed = parseISO(e.target.value);
      if (!isNaN(parsed.getTime())) {
        onDateChange(parsed);
      }
    }
  };

  const isDark = theme === 'dark';

  return (
    <div id={`${idPrefix}-container`} className={`w-full flex flex-col gap-2.5 ${className}`}>
      {/* Mode Selector Tabs: Day, Week, Month */}
      <div 
        id={`${idPrefix}-mode-tabs`} 
        className={`grid grid-cols-3 p-1 rounded-2xl ${
          isDark 
            ? 'bg-black/25 backdrop-blur-xl border border-white/15 shadow-inner' 
            : 'bg-cream-100/90 backdrop-blur-md border border-brand-900/10'
        }`}
      >
        <button
          type="button"
          id={`${idPrefix}-btn-day`}
          onClick={() => onModeChange('day')}
          className={`py-1.5 px-3 text-xs font-bold rounded-xl tracking-wide transition-all ${
            mode === 'day'
              ? isDark 
                ? 'bg-white text-brand-900 font-extrabold shadow-md' 
                : 'bg-white text-brand-900 font-extrabold shadow-sm border border-brand-900/10'
              : isDark 
                ? 'text-brand-100 hover:text-white hover:bg-white/15' 
                : 'text-brand-900/70 hover:text-brand-900 hover:bg-cream-200/60 font-semibold'
          }`}
        >
          Day
        </button>

        <button
          type="button"
          id={`${idPrefix}-btn-week`}
          onClick={() => onModeChange('week')}
          className={`py-1.5 px-3 text-xs font-bold rounded-xl tracking-wide transition-all ${
            mode === 'week'
              ? isDark 
                ? 'bg-white text-brand-900 font-extrabold shadow-md' 
                : 'bg-white text-brand-900 font-extrabold shadow-sm border border-brand-900/10'
              : isDark 
                ? 'text-brand-100 hover:text-white hover:bg-white/15' 
                : 'text-brand-900/70 hover:text-brand-900 hover:bg-cream-200/60 font-semibold'
          }`}
        >
          Week
        </button>

        <button
          type="button"
          id={`${idPrefix}-btn-month`}
          onClick={() => onModeChange('month')}
          className={`py-1.5 px-3 text-xs font-bold rounded-xl tracking-wide transition-all ${
            mode === 'month'
              ? isDark 
                ? 'bg-white text-brand-900 font-extrabold shadow-md' 
                : 'bg-white text-brand-900 font-extrabold shadow-sm border border-brand-900/10'
              : isDark 
                ? 'text-brand-100 hover:text-white hover:bg-white/15' 
                : 'text-brand-900/70 hover:text-brand-900 hover:bg-cream-200/60 font-semibold'
          }`}
        >
          Month
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div 
        id={`${idPrefix}-nav-bar`}
        className={`flex items-center justify-between px-3 py-2 rounded-2xl transition-all ${
          isDark 
            ? 'bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] text-white' 
            : 'bg-white/90 backdrop-blur-md border border-brand-900/10 shadow-sm text-brand-900'
        }`}
      >
        <button
          type="button"
          id={`${idPrefix}-prev`}
          onClick={handlePrev}
          title="Previous period"
          aria-label="Previous period"
          className={`p-1.5 rounded-xl transition-all active:scale-95 ${
            isDark ? 'text-white hover:bg-white/20' : 'text-brand-900 hover:bg-cream-100'
          }`}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center justify-center text-center px-1 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
            className="group flex items-center gap-1.5 max-w-full truncate focus:outline-none"
            title="Click to jump to a specific date"
          >
            <Calendar size={14} className={`shrink-0 transition-transform group-hover:scale-110 ${
              isDark ? 'text-brand-200' : 'text-brand-600'
            }`} />
            <span className={`text-xs sm:text-sm font-bold truncate tracking-tight ${
              isDark ? 'text-white drop-shadow-sm' : 'text-brand-900'
            }`}>
              {range.displayLabel}
            </span>
          </button>
          
          {range.subLabel && (
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-brand-100 drop-shadow-xs' : 'text-brand-900/60'
            }`}>
              {range.subLabel}
            </span>
          )}

          {/* Hidden native date input to allow direct calendar selection */}
          <input
            ref={dateInputRef}
            type="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={handleNativeDateChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center gap-1">
          {!range.isCurrent && (
            <button
              type="button"
              id={`${idPrefix}-reset-today`}
              onClick={handleResetCurrent}
              title={`Jump to current ${mode}`}
              aria-label={`Jump to current ${mode}`}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 ${
                isDark 
                  ? 'bg-white/25 text-white border border-white/20 hover:bg-white/35 shadow-sm' 
                  : 'bg-cream-100 text-brand-900 border border-brand-900/10 hover:bg-cream-200'
              }`}
            >
              <RotateCcw size={10} strokeWidth={2.5} />
              <span className="hidden sm:inline">Now</span>
            </button>
          )}

          <button
            type="button"
            id={`${idPrefix}-next`}
            onClick={handleNext}
            title="Next period"
            aria-label="Next period"
            className={`p-1.5 rounded-xl transition-all active:scale-95 ${
              isDark ? 'text-white hover:bg-white/20' : 'text-brand-900 hover:bg-cream-100'
            }`}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
