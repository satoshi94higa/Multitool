import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Download, Copy, Check, DollarSign, Clock, Briefcase, Camera, Film, ListPlus, ReceiptText, Zap, User, Mail, Phone, Calendar, FileText, Info, History, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveToHistory, getHistory, deleteFromHistory, HistoryItem } from '../lib/persistence';

interface Task {
  id: string;
  name: string;
  hours: number;
  amount?: number;
  type: 'shooting' | 'editing' | 'fixed';
}

interface Expense {
  id: string;
  description: string;
  amount: number;
}

export default function BudgetCalculator() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  
  // Persistent data states
  const [myCompany, setMyCompany] = useState(() => localStorage.getItem('budget_myCompany') || '');
  const [myEmail, setMyEmail] = useState(() => localStorage.getItem('budget_myEmail') || '');
  const [myPhone, setMyPhone] = useState(() => localStorage.getItem('budget_myPhone') || '');
  const [myCuil, setMyCuil] = useState(() => localStorage.getItem('budget_myCuil') || '');
  const [pdfSubtitle, setPdfSubtitle] = useState(() => localStorage.getItem('budget_pdfSubtitle') || 'ESTIMACIÓN TÉCNICA Y COMERCIAL');
  const [shootingRate, setShootingRate] = useState(() => Number(localStorage.getItem('budget_shootingRate')) || 45000);
  const [editingRate, setEditingRate] = useState(() => Number(localStorage.getItem('budget_editingRate')) || 30000);

  const [clientEmail, setClientEmail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState('15 días');
  const [notes, setNotes] = useState('');
  const [showDetailsInPDF, setShowDetailsInPDF] = useState(true);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('budget_myCompany', myCompany);
    localStorage.setItem('budget_myEmail', myEmail);
    localStorage.setItem('budget_myPhone', myPhone);
    localStorage.setItem('budget_myCuil', myCuil);
    localStorage.setItem('budget_pdfSubtitle', pdfSubtitle);
    localStorage.setItem('budget_shootingRate', shootingRate.toString());
    localStorage.setItem('budget_editingRate', editingRate.toString());
  }, [myCompany, myEmail, myPhone, myCuil, pdfSubtitle, shootingRate, editingRate]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Pre-producción / Planificación', hours: 2, type: 'editing' },
    { id: '2', name: 'Producción / Rodaje', hours: 4, type: 'shooting' },
    { id: '3', name: 'Post-producción / Edición', hours: 4, type: 'editing' },
    { id: '4', name: 'Equipos adicionales', hours: 0, amount: 15000, type: 'fixed' },
  ]);
  const [extras, setExtras] = useState<Expense[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory('budget'));
  }, []);

  const handleSaveToHistory = () => {
    const data = {
      clientName,
      projectName,
      clientEmail,
      date,
      validity,
      notes,
      tasks,
      extras,
      shootingRate,
      editingRate
    };
    const newHistory = saveToHistory('budget', JSON.stringify(data), { total: grandTotal }, `${projectName || 'Proyecto'} - ${clientName || 'Cliente'}`);
    setHistory(newHistory);
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    try {
      const data = JSON.parse(item.input);
      setClientName(data.clientName || '');
      setProjectName(data.projectName || '');
      setClientEmail(data.clientEmail || '');
      setDate(data.date || new Date().toISOString().split('T')[0]);
      setValidity(data.validity || '15 días');
      setNotes(data.notes || '');
      setTasks(data.tasks || []);
      setExtras(data.extras || []);
      if (data.shootingRate) setShootingRate(data.shootingRate);
      if (data.editingRate) setEditingRate(data.editingRate);
    } catch (e) {
      console.error('Error loading from history:', e);
    }
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = deleteFromHistory('budget', id);
    setHistory(newHistory);
  };

  // Helper handling comma decimal input
  const [activeStrings, setActiveStrings] = useState<Record<string, string>>({});
  
  const handleNumericInput = (id: string, val: string, field: string, setter: (v: number) => void) => {
    // Allows digits and at most one comma or dot
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setActiveStrings(prev => ({ ...prev, [`${id}-${field}`]: val }));
      const normalized = val.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) setter(num);
      else if (val === '') setter(0);
    }
  };

  const getDisplayValue = (id: string, field: string, currentNum: number) => {
    const key = `${id}-${field}`;
    if (activeStrings[key] !== undefined) return activeStrings[key];
    return currentNum.toString().replace('.', ',');
  };

  const clearActiveString = (id: string, field: string) => {
    setActiveStrings(prev => {
      const next = { ...prev };
      delete next[`${id}-${field}`];
      return next;
    });
  };

  const addTask = () => {
    setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), name: '', hours: 0, type: 'editing' }]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const addExtra = () => {
    setExtras([...extras, { id: Math.random().toString(36).substr(2, 9), description: '', amount: 0 }]);
  };

  const updateExtra = (id: string, updates: Partial<Expense>) => {
    setExtras(extras.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExtra = (id: string) => {
    setExtras(extras.filter(e => e.id !== id));
  };

  const totalHours = tasks.reduce((acc, t) => acc + (t.hours || 0), 0);
  
  const hoursSubtotal = tasks.reduce((acc, t) => {
    if (t.type === 'fixed') return acc + (t.amount || 0);
    const rate = t.type === 'shooting' ? shootingRate : editingRate;
    return acc + ((t.hours || 0) * rate);
  }, 0);

  const extrasTotal = extras.reduce((acc, e) => acc + (e.amount || 0), 0);
  const grandTotal = hoursSubtotal + extrasTotal;

  const generateSummary = () => {
    let summary = `PRESUPUESTO: ${projectName || 'Sin Título'}\n`;
    summary += `CLIENTE: ${clientName || 'General'}\n`;
    summary += `-----------------------------------\n`;
    summary += `DESGLOSE DE TRABAJO:\n`;
    tasks.forEach(t => {
      if (t.name) {
        if (t.type === 'fixed') {
          summary += `- ${t.name}: $${(t.amount || 0).toLocaleString()}\n`;
        } else {
          const rate = t.type === 'shooting' ? shootingRate : editingRate;
          summary += `- ${t.name}: ${t.hours}h x $${rate}/h = $${(t.hours * rate).toLocaleString()}\n`;
        }
      }
    });
    summary += `-----------------------------------\n`;
    summary += `TOTAL HORAS: ${totalHours.toString().replace('.', ',')}h\n`;
    summary += `SUBTOTAL TRABAJO: $${hoursSubtotal.toLocaleString('es-AR')}\n`;
    
    if (extras.length > 0) {
      summary += `-----------------------------------\n`;
      summary += `GASTOS EXTRAS:\n`;
      extras.forEach(e => {
        if (e.description) summary += `- ${e.description}: $${e.amount.toLocaleString('es-AR')}\n`;
      });
      summary += `TOTAL EXTRAS: $${extrasTotal.toLocaleString('es-AR')}\n`;
    }
    
    summary += `-----------------------------------\n`;
    summary += `TOTAL ESTIMADO: $${grandTotal.toLocaleString('es-AR')}`;
    return summary;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    const accentColor = [0, 0, 0];
    const secondaryGray = [100, 100, 100];
    const lightGray = [245, 245, 245];

    // --- Header Branding ---
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 15, 22);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfSubtitle.toUpperCase(), 16, 29);
    
    // --- Emisor Info (Right Aligned Header) ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(myCompany?.toUpperCase() || 'EMISOR', 195, 14, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let headerInfoY = 19;
    if (myCuil) { doc.text(`CUIL: ${myCuil}`, 195, headerInfoY, { align: 'right' }); headerInfoY += 4; }
    if (myEmail) { doc.text(myEmail, 195, headerInfoY, { align: 'right' }); headerInfoY += 4; }
    if (myPhone) { doc.text(myPhone, 195, headerInfoY, { align: 'right' }); headerInfoY += 4; }

    // --- Billing Info Grid ---
    const gridY = 48;
    
    // "PARA" (To) Section
    doc.setTextColor(...secondaryGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PARA:', 15, gridY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName?.toUpperCase() || 'CLIENTE GENERAL', 15, gridY + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let clientInfoY = gridY + 11;
    if (clientEmail) { doc.text(clientEmail, 15, clientInfoY); clientInfoY += 4; }
    
    doc.setFont('helvetica', 'bold');
    doc.text('PROYECTO:', 15, clientInfoY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName || 'Sin Título', 15, clientInfoY + 9);
    
    // Invoice Meta (Date, Validity)
    const metaX = 140;
    doc.setTextColor(...secondaryGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL DOCUMENTO', metaX, gridY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', metaX, gridY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(date, metaX + 25, gridY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('VALIDEZ:', metaX, gridY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(validity, metaX + 25, gridY + 11);

    const tableStartY = 85;

    // --- Work Items Table ---
    const taskRows = tasks.filter(t => t.name).map((t, index) => {
      if (t.type === 'fixed') {
        return [
          (index + 1).toString().padStart(2, '0'),
          t.name.toUpperCase(),
          showDetailsInPDF ? 'TARIFA FIJA' : '',
          showDetailsInPDF ? '-' : '',
          showDetailsInPDF ? '-' : '',
          `$${(t.amount || 0).toLocaleString('es-AR')}`
        ].filter(v => v !== '');
      }
      const rate = t.type === 'shooting' ? shootingRate : editingRate;
      return [
        (index + 1).toString().padStart(2, '0'),
        t.name.toUpperCase(),
        showDetailsInPDF ? (t.type === 'shooting' ? 'RODAJE' : 'EDICIÓN') : '',
        showDetailsInPDF ? `${t.hours.toString().replace('.', ',')}H` : '',
        showDetailsInPDF ? `$${rate.toLocaleString('es-AR')}` : '',
        `$${(t.hours * rate).toLocaleString('es-AR')}`
      ].filter(v => v !== '');
    });
    
    const tableHead = showDetailsInPDF 
      ? [['ID', 'DESCRIPCIÓN DEL SERVICIO', 'TIPO', 'HS', 'TARIFA', 'TOTAL']]
      : [['ID', 'DESCRIPCIÓN DEL SERVICIO', 'TOTAL']];

    autoTable(doc, {
      startY: tableStartY,
      head: tableHead,
      body: taskRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [20, 20, 20], 
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [40, 40, 40],
        cellPadding: 3,
        lineColor: [240, 240, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', textColor: [150, 150, 150] },
        [tableHead[0].length - 1]: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }
      },
      margin: { left: 15, right: 15 }
    });
    
    let currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // --- Additional Expenses Table ---
    if (extras.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryGray);
      doc.text('GASTOS ADICIONALES', 15, currentY);
      
      const extraRows = extras.filter(e => e.description).map((e, index) => [
        (index + 1).toString().padStart(2, '0'),
        e.description.toUpperCase(),
        `$${e.amount.toLocaleString('es-AR')}`
      ]);
      
      autoTable(doc, {
        startY: currentY + 3,
        head: [['ID', 'DESCRIPCIÓN', 'MONTO']],
        body: extraRows,
        theme: 'plain',
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontSize: 6, cellPadding: 2 },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          2: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // --- Summary & Totals ---
    if (currentY > 250) { doc.addPage(); currentY = 20; }

    const summaryX = 135;
    const summaryWidth = 60;
    
    doc.setFillColor(...lightGray);
    doc.rect(summaryX, currentY, summaryWidth, 32, 'F');
    
    doc.setTextColor(...secondaryGray);
    doc.setFontSize(6);
    doc.text('RESUMEN DE COSTOS', summaryX + 4, currentY + 5);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal Servicios', summaryX + 4, currentY + 12);
    doc.text(`$${hoursSubtotal.toLocaleString('es-AR')}`, summaryX + summaryWidth - 4, currentY + 12, { align: 'right' });
    
    doc.text('Gastos Adicionales', summaryX + 4, currentY + 19);
    doc.text(`$${extrasTotal.toLocaleString('es-AR')}`, summaryX + summaryWidth - 4, currentY + 19, { align: 'right' });
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(summaryX + 4, currentY + 23, summaryX + summaryWidth - 4, currentY + 23);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', summaryX + 4, currentY + 29);
    doc.text(`$${grandTotal.toLocaleString('es-AR')}`, summaryX + summaryWidth - 4, currentY + 29, { align: 'right' });
    
    // --- Notes and Terms ---
    if (notes) {
      currentY += 40;
      if (currentY > 270) { doc.addPage(); currentY = 20; }
      
      doc.setTextColor(...secondaryGray);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDICIONES COMERCIALES Y NOTAS:', 15, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const splitNotes = doc.splitTextToSize(notes, 100);
      doc.text(splitNotes, 15, currentY + 5);
    }

    // --- Footer Decoration ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.line(15, 280, 40, 280);
      
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(`DOCUMENTO DE CARÁCTER INFORMATIVO | PÁGINA ${i} DE ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    doc.save(`Presupuesto_${projectName.replace(/\s+/g, '_') || 'Freelance'}_${clientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-black flex items-center justify-center text-white shrink-0">
          <Calculator size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Calculadora de Horas por Trabajo</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Presupuestos Basados en Tiempo & Esfuerzo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          {/* Company & Client Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <Info size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">Datos del Emisor & Cliente</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Emisor</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                  <input
                    type="text"
                    value={myCompany}
                    onChange={(e) => setMyCompany(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full h-10 bg-white border border-zinc-200 pl-10 pr-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Subtítulo PDF</label>
                <input
                  type="text"
                  value={pdfSubtitle}
                  onChange={(e) => setPdfSubtitle(e.target.value)}
                  placeholder="Ej: Estimación Técnica..."
                  className="w-full h-10 bg-white border border-zinc-200 px-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">CUIL / CUIT</label>
                <input
                  type="text"
                  value={myCuil}
                  onChange={(e) => setMyCuil(e.target.value)}
                  placeholder="20-12345678-9"
                  className="w-full h-10 bg-white border border-zinc-200 px-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mi Correo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                  <input
                    type="email"
                    value={myEmail}
                    onChange={(e) => setMyEmail(e.target.value)}
                    placeholder="hola@tuweb.com"
                    className="w-full h-10 bg-white border border-zinc-200 pl-10 pr-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mi Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                  <input
                    type="text"
                    value={myPhone}
                    onChange={(e) => setMyPhone(e.target.value)}
                    placeholder="+54 9 11..."
                    className="w-full h-10 bg-white border border-zinc-200 pl-10 pr-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cliente / Marca</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Nike, Starbucks, Juan Pérez"
                  className="w-full h-12 bg-white border-2 border-zinc-100 px-4 font-bold text-sm focus:border-black outline-none transition-all placeholder:text-zinc-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Video Campaña Verano"
                  className="w-full h-12 bg-white border-2 border-zinc-100 px-4 font-bold text-sm focus:border-black outline-none transition-all placeholder:text-zinc-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 bg-white border border-zinc-200 pl-10 pr-4 font-bold text-xs focus:border-black outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Validez</label>
                <input
                  type="text"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  placeholder="Ej: 15 días"
                  className="w-full h-10 bg-white border border-zinc-200 px-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Cliente (Opcional)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@marca.com"
                  className="w-full h-10 bg-white border border-zinc-200 px-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Hours Calculator Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <h3 className="text-xs font-black uppercase tracking-widest">Estimación de Horas</h3>
              </div>
              <button
                onClick={addTask}
                className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Añadir Fase
              </button>
            </div>

            <div className="space-y-px bg-zinc-100 border border-zinc-100">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 bg-white group border-b border-zinc-50 md:border-b-0">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="text-[10px] font-mono text-zinc-300 w-4 shrink-0">{index + 1}</div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(task.id, { name: e.target.value })}
                        placeholder="Nombre de la etapa (ej: Guion, Color, Sonido...)"
                        className="w-full bg-transparent border-none p-0 font-bold text-sm focus:ring-0 outline-none placeholder:text-zinc-200"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto mt-2 md:mt-0 pl-8 md:pl-0">
                    <div className="flex items-center bg-zinc-50 border border-zinc-200">
                      <button
                        onClick={() => updateTask(task.id, { type: 'shooting' })}
                        className={`px-2 py-1 text-[8px] font-black uppercase transition-colors ${task.type === 'shooting' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'}`}
                      >
                        Rodaje
                      </button>
                      <button
                        onClick={() => updateTask(task.id, { type: 'editing' })}
                        className={`px-2 py-1 text-[8px] font-black uppercase transition-colors ${task.type === 'editing' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'}`}
                      >
                        Edición
                      </button>
                      <button
                        onClick={() => updateTask(task.id, { type: 'fixed' })}
                        className={`px-2 py-1 text-[8px] font-black uppercase transition-colors ${task.type === 'fixed' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'}`}
                      >
                        Fijo
                      </button>
                    </div>
                    {task.type === 'fixed' ? (
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1">
                        <span className="text-[10px] font-black text-zinc-400 uppercase">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getDisplayValue(task.id, 'amount', task.amount || 0)}
                          onChange={(e) => handleNumericInput(task.id, e.target.value, 'amount', (v) => updateTask(task.id, { amount: v }))}
                          onBlur={() => clearActiveString(task.id, 'amount')}
                          className="w-20 border-none p-0 text-center font-mono text-sm focus:ring-0 outline-none bg-transparent"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getDisplayValue(task.id, 'hours', task.hours)}
                          onChange={(e) => handleNumericInput(task.id, e.target.value, 'hours', (v) => updateTask(task.id, { hours: v }))}
                          onBlur={() => clearActiveString(task.id, 'hours')}
                          className="w-12 border-none p-0 text-center font-mono text-sm focus:ring-0 outline-none bg-transparent"
                        />
                        <span className="text-[10px] font-black text-zinc-400 uppercase">Horas</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors p-1 md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-2">
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="text-[10px] font-black uppercase tracking-widest">Total Horas</span>
                <span className="text-xl font-mono font-black text-black">{totalHours.toString().replace('.', ',')}h</span>
              </div>
            </div>
          </div>

          {/* Rates and Extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                <Zap size={16} />
                <h3 className="text-xs font-black uppercase tracking-widest">Tarifas Base</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-50 border-2 border-zinc-100 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Rodaje /h</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black opacity-20">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getDisplayValue('global', 'shootingRate', shootingRate)}
                      onChange={(e) => handleNumericInput('global', e.target.value, 'shootingRate', setShootingRate)}
                      onBlur={() => clearActiveString('global', 'shootingRate')}
                      className="w-full bg-transparent border-none p-0 text-lg font-mono font-black focus:ring-0 outline-none"
                    />
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 border-2 border-zinc-100 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Edición /h</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black opacity-20">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getDisplayValue('global', 'editingRate', editingRate)}
                      onChange={(e) => handleNumericInput('global', e.target.value, 'editingRate', setEditingRate)}
                      onBlur={() => clearActiveString('global', 'editingRate')}
                      className="w-full bg-transparent border-none p-0 text-lg font-mono font-black focus:ring-0 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2">
                  <ReceiptText size={16} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Gastos / Extras</h3>
                </div>
                <button
                  onClick={addExtra}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Añadir Gasto
                </button>
              </div>
              
              <div className="space-y-2">
                {extras.length === 0 && (
                  <div className="text-center py-8 bg-zinc-50 border border-dashed border-zinc-200 rounded text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                    Sin gastos adicionales
                  </div>
                )}
                {extras.map(extra => (
                  <div key={extra.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-white border border-zinc-100 group">
                    <input
                      type="text"
                      placeholder="Ej: Licencias, Transporte..."
                      value={extra.description}
                      onChange={(e) => updateExtra(extra.id, { description: e.target.value })}
                      className="w-full sm:flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 outline-none"
                    />
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                      <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded">
                        <span className="text-[10px] text-zinc-400">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getDisplayValue(extra.id, 'extraAmount', extra.amount)}
                          onChange={(e) => handleNumericInput(extra.id, e.target.value, 'extraAmount', (v) => updateExtra(extra.id, { amount: v }))}
                          onBlur={() => clearActiveString(extra.id, 'extraAmount')}
                          className="w-20 sm:w-16 bg-transparent border-none p-0 text-xs font-mono font-bold focus:ring-0 outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => removeExtra(extra.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-1 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <FileText size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">Notas y Condiciones</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: 50% adelantado, fechas de rodaje sujetas a clima, licencias de música no incluidas..."
              className="w-full h-32 bg-white border border-zinc-200 p-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200 resize-none"
            />
          </div>
        </div>

        {/* Totals & Export Summary */}
        <div className="space-y-6">
          <div className="bg-black text-white p-8 shadow-2xl space-y-8 sticky top-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Presupuesto Final</span>
              <div className="text-6xl font-black tracking-tighter italic tabular-nums leading-none">
                ${grandTotal.toLocaleString('es-AR')}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-widest opacity-50">Subtotal Horas ({totalHours.toString().replace('.', ',')}h)</span>
                <span className="font-mono text-zinc-300">${hoursSubtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-widest opacity-50">Total Extras</span>
                <span className="font-mono text-zinc-300">${extrasTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              {/* PDF Settings */}
              <div className="flex items-center justify-between p-3 border border-white/10 rounded">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Mostrar detalles en PDF</span>
                <button 
                  onClick={() => setShowDetailsInPDF(!showDetailsInPDF)}
                  className={`w-10 h-5 rounded-full transition-colors relative border border-white/20 ${showDetailsInPDF ? 'bg-green-500' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-transform ${showDetailsInPDF ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Copiar Resumen'}
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full h-14 border border-white/20 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Download size={16} /> Descargar PDF
                </button>
                <button
                  onClick={handleSaveToHistory}
                  className="w-full h-14 border border-white/20 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Save size={16} /> Guardar en Historial
                </button>
              </div>
            </div>
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white border border-zinc-200 overflow-hidden">
              <div className="bg-zinc-100 px-6 py-3 border-b border-zinc-200 flex items-center gap-2">
                <History size={16} className="text-zinc-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Historial Reciente</h4>
              </div>
              <div className="divide-y divide-zinc-100">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className="p-4 hover:bg-zinc-50 cursor-pointer transition-colors group flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-tight text-black line-clamp-1">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-zinc-400">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-1 rounded">
                          ${item.output.total.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-50 border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Resumen Texto</h4>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <pre className="text-[10px] font-mono text-zinc-600 whitespace-pre-wrap leading-relaxed border-t border-zinc-100 pt-4">
              {generateSummary()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
