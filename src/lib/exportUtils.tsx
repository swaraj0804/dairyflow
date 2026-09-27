import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

export const exportToPdf = async (title: string, headers: string[], data: any[][]) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [45, 212, 191] }
  });
  
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

export const exportToExcel = async (title: string, headers: string[], data: any[][]) => {
  const XLSX = await import('xlsx');
  const wsData = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
};

interface ExportButtonsProps {
  onExportPdf?: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
}

export function ExportButtons({ onExportPdf, onExportExcel }: ExportButtonsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handlePdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      if (onExportPdf) {
        await onExportPdf();
      } else {
        alert('Exporting to PDF...');
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExcel = async () => {
    if (isExportingExcel) return;
    try {
      setIsExportingExcel(true);
      if (onExportExcel) {
        await onExportExcel();
      } else {
        alert('Exporting to Excel...');
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex gap-3 mt-4 w-full">
      <button 
        onClick={handlePdf}
        disabled={isExportingPdf}
        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-4 rounded-xl font-medium shadow-sm hover:bg-brand-600-dark transition-colors active:scale-95 disabled:opacity-75 cursor-pointer"
      >
        {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        <span className="text-sm">{isExportingPdf ? 'Exporting...' : 'Export to PDF'}</span>
      </button>
      <button 
        onClick={handleExcel}
        disabled={isExportingExcel}
        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-4 rounded-xl font-medium shadow-sm hover:bg-brand-600-dark transition-colors active:scale-95 disabled:opacity-75 cursor-pointer"
      >
        {isExportingExcel ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
        <span className="text-sm">{isExportingExcel ? 'Exporting...' : 'Export to Excel'}</span>
      </button>
    </div>
  );
}
