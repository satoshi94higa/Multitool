import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Download, Copy, Check, DollarSign, Clock, Briefcase, Camera, Film, ListPlus, ReceiptText, Zap, User, Mail, Phone, Calendar, FileText, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Task {
  id: string;
  name: string;
  hours: number;
  type: 'shooting' | 'editing';
}

interface Expense {
  id: string;
  description: string;
  amount: number;
}

export default function BudgetCalculator() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [myCompany, setMyCompany] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState('15 días');
  const [notes, setNotes] = useState('');
  const [shootingRate, setShootingRate] = useState(45000);
  const [editingRate, setEditingRate] = useState(30000);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Pre-producción / Planificación', hours: 2, type: 'editing' },
    { id: '2', name: 'Producción / Rodaje', hours: 4, type: 'shooting' },
    { id: '3', name: 'Post-producción / Edición', hours: 4, type: 'editing' },
  ]);
  const [extras, setExtras] = useState<Expense[]>([]);
  const [copied, setCopied] = useState(false);

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
        const rate = t.type === 'shooting' ? shootingRate : editingRate;
        summary += `- ${t.name}: ${t.hours}h x $${rate}/h = $${(t.hours * rate).toLocaleString()}\n`;
      }
    });
    summary += `-----------------------------------\n`;
    summary += `TOTAL HORAS: ${totalHours}h\n`;
    summary += `SUBTOTAL TRABAJO: $${hoursSubtotal.toLocaleString()}\n`;
    
    if (extras.length > 0) {
      summary += `-----------------------------------\n`;
      summary += `GASTOS EXTRAS:\n`;
      extras.forEach(e => {
        if (e.description) summary += `- ${e.description}: $${e.amount}\n`;
      });
      summary += `TOTAL EXTRAS: $${extrasTotal}\n`;
    }
    
    summary += `-----------------------------------\n`;
    summary += `TOTAL ESTIMADO: $${grandTotal}`;
    return summary;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    const primaryColor = [0, 0, 0];
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName || 'Sin Título', 15, 33);
    
    // Company Info (Right aligned in header)
    doc.setFontSize(10);
    doc.text(myCompany || 'Emisor', 195, 15, { align: 'right' });
    if (myEmail) doc.text(myEmail, 195, 20, { align: 'right' });
    if (myPhone) doc.text(myPhone, 195, 25, { align: 'right' });
    
    // Client & Project Info
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName || 'General', 15, 60);
    if (clientEmail) doc.text(clientEmail, 15, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 140, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(date, 160, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text('VALIDEZ:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(validity, 160, 60);
    
    // Tasks Table
    const taskRows = tasks.filter(t => t.name).map((t, index) => {
      const rate = t.type === 'shooting' ? shootingRate : editingRate;
      return [
        index + 1,
        t.name,
        t.type === 'shooting' ? 'Rodaje' : 'Edición',
        `${t.hours}h`,
        `$${rate.toLocaleString()}`,
        `$${(t.hours * rate).toLocaleString()}`
      ];
    });
    
    (doc as any).autoTable({
      startY: 75,
      head: [['#', 'Descripción', 'Tipo', 'Cant.', 'Tarifa', 'Subtotal']],
      body: taskRows,
      headStyles: { fillStyle: 'black', fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 15, right: 15 }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Extras Table
    if (extras.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS Y EXTRAS', 15, finalY);
      
      const extraRows = extras.filter(e => e.description).map((e, index) => [
        index + 1,
        e.description,
        '-',
        '-',
        '-',
        `$${e.amount.toLocaleString()}`
      ]);
      
      (doc as any).autoTable({
        startY: finalY + 5,
        head: [['#', 'Descripción', '', '', '', 'Subtotal']],
        body: extraRows,
        headStyles: { fillStyle: 'black', fillColor: [60, 60, 60], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 }
      });
      
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Totals
    doc.setFillColor(245, 245, 245);
    doc.rect(130, finalY, 65, 30, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal Horas:', 135, finalY + 10);
    doc.text(`$${hoursSubtotal.toLocaleString()}`, 190, finalY + 10, { align: 'right' });
    
    doc.text('Total Extras:', 135, finalY + 17);
    doc.text(`$${extrasTotal.toLocaleString()}`, 190, finalY + 17, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 135, finalY + 25);
    doc.text(`$${grandTotal.toLocaleString()}`, 190, finalY + 25, { align: 'right' });
    
    // Notes
    if (notes) {
      finalY += 40;
      if (finalY > 250) {
         doc.addPage();
         finalY = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS Y CONDICIONES:', 15, finalY);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(notes, 180);
      doc.text(splitNotes, 15, finalY + 7);
    }
    
    doc.save(`Presupuesto_${projectName.replace(/\s+/g, '_') || 'Freelance'}.pdf`);
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mi Empresa / Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                  <input
                    type="text"
                    value={myCompany}
                    onChange={(e) => setMyCompany(e.target.value)}
                    placeholder="Tu nombre o estudio"
                    className="w-full h-10 bg-white border border-zinc-200 pl-10 pr-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-zinc-200"
                  />
                </div>
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
                <div key={task.id} className="flex items-center gap-4 p-4 bg-white group">
                  <div className="text-[10px] font-mono text-zinc-300 w-4">{index + 1}</div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateTask(task.id, { name: e.target.value })}
                      placeholder="Nombre de la etapa (ej: Guion, Color, Sonido...)"
                      className="w-full bg-transparent border-none p-0 font-bold text-sm focus:ring-0 outline-none placeholder:text-zinc-200"
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
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
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={task.hours}
                        onChange={(e) => updateTask(task.id, { hours: parseFloat(e.target.value) || 0 })}
                        className="w-12 border-none p-0 text-center font-mono text-sm focus:ring-0 outline-none bg-transparent"
                      />
                      <span className="text-[10px] font-black text-zinc-400 uppercase">Horas</span>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-zinc-200 hover:text-red-500 transition-colors pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100"
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
                <span className="text-xl font-mono font-black text-black">{totalHours}h</span>
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
                      type="number"
                      value={shootingRate}
                      onChange={(e) => setShootingRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none p-0 text-lg font-mono font-black focus:ring-0 outline-none"
                    />
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 border-2 border-zinc-100 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-tight text-zinc-400">Edición /h</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black opacity-20">$</span>
                    <input
                      type="number"
                      value={editingRate}
                      onChange={(e) => setEditingRate(parseFloat(e.target.value) || 0)}
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
                  <div key={extra.id} className="flex items-center gap-3 p-2 bg-white border border-zinc-100 group">
                    <input
                      type="text"
                      placeholder="Ej: Licencias, Transporte..."
                      value={extra.description}
                      onChange={(e) => updateExtra(extra.id, { description: e.target.value })}
                      className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 outline-none"
                    />
                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded">
                      <span className="text-[10px] text-zinc-400">$</span>
                      <input
                        type="number"
                        value={extra.amount}
                        onChange={(e) => updateExtra(extra.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-16 bg-transparent border-none p-0 text-xs font-mono font-bold focus:ring-0 outline-none text-right"
                      />
                    </div>
                    <button
                      onClick={() => removeExtra(extra.id)}
                      className="text-zinc-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
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
                ${grandTotal.toLocaleString()}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-widest opacity-50">Subtotal Horas ({totalHours}h)</span>
                <span className="font-mono text-zinc-300">${hoursSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-widest opacity-50">Total Extras</span>
                <span className="font-mono text-zinc-300">${extrasTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
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
            </div>
          </div>

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
