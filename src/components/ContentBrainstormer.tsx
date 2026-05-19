import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Brain, Users, Zap, Search, Send, Check, Loader2, Sparkles, Camera, Video, Newspaper, Dice5, MessageSquarePlus, History, Trash2, ChevronRight, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { processWithGemini } from '../services/geminiService';
import { saveToHistory, getHistory, deleteFromHistory, HistoryItem } from '../lib/persistence';

interface BrainstormOutput {
  general: string[];
  photographic: string[];
  audiovisual: string[];
  journalistic: string[];
  wildcard: string[];
}

export default function ContentBrainstormer() {
  const [input, setInput] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<BrainstormOutput | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(getHistory('ideas'));
  }, []);

  const generateIdeas = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Actuá como un estratega de contenido creativo y productor multimedia.
      Tengo que cubrir la siguiente actividad/tema: "${input}"
      Somos un equipo de ${peopleCount} personas.
      Usá español de Argentina (voseo, vocabulario local).
      
      ${extraPrompt ? `Instrucciones adicionales: ${extraPrompt}` : ''}
      
      Generá una lluvia de ideas (brainstorming) dividida en 5 categorías. Cada categoría debe tener ideas realistas pero creativas adaptadas al tamaño del equipo (${peopleCount} personas).
      
      Categorías:
      1. General: Estrategia de cobertura global.
      2. Fotográfica: Ángulos, momentos clave, estilos visuales.
      3. Audiovisual: Reels, entrevistas rápidas, tomas de recurso, transiciones.
      4. Periodística/Gráfica: Hilos, crónicas, infografías, datos clave.
      5. Wild Card: Ideas disruptivas, divertidas o fuera de lo común.
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "general": ["idea 1", "idea 2"],
        "photographic": ["idea 1", "idea 2"],
        "audiovisual": ["idea 1", "idea 2"],
        "journalistic": ["idea 1", "idea 2"],
        "wildcard": ["idea 1", "idea 2"]
      }`;

      const data = await processWithGemini({ customPrompt: prompt }, 'process');
      const result = JSON.parse(data.text.replace(/```json|```/g, '').trim());
      setIdeas(result);

      const newHistory = saveToHistory('ideas', input, result, input.slice(0, 30));
      setHistory(newHistory);
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      setError(error.message || "Error al generar ideas");
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!ideas) return;
    
    let fullText = `BRAINSTORMING: ${input.toUpperCase()}\nEquipo: ${peopleCount} personas\n\n`;
    
    const categories = [
      { name: 'ESTRATEGIA GENERAL', key: 'general' },
      { name: 'COBERTURA FOTOGRÁFICA', key: 'photographic' },
      { name: 'COBERTURA AUDIOVISUAL', key: 'audiovisual' },
      { name: 'PERIODISMO / GRÁFICA', key: 'journalistic' },
      { name: 'WILD CARD (DISRUPTIVO)', key: 'wildcard' }
    ];

    categories.forEach(cat => {
      fullText += `${cat.name}\n`;
      (ideas as any)[cat.key].forEach((idea: string) => {
        fullText += `- ${idea}\n`;
      });
      fullText += '\n';
    });

    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const exportToPDF = () => {
    if (!ideas) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let y = 20;

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE BRAINSTORMING", pageWidth / 2, y, { align: "center" });
    
    y += 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CONTEXTO DEL PROYECTO", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Input wrapping - crucial to prevent overlap
    const themeLines = doc.splitTextToSize(`TEMA: ${input.toUpperCase()}`, contentWidth);
    doc.text(themeLines, margin, y);
    y += (themeLines.length * 6) + 4;

    doc.text(`EQUIPO: ${peopleCount} ${peopleCount === 1 ? 'persona' : 'personas'}`, margin, y);
    y += 6;
    doc.text(`FECHA: ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    const categories = [
      { name: 'ESTRATEGIA GENERAL', key: 'general' },
      { name: 'COBERTURA FOTOGRÁFICA', key: 'photographic' },
      { name: 'COBERTURA AUDIOVISUAL', key: 'audiovisual' },
      { name: 'PERIODISMO / GRÁFICA', key: 'journalistic' },
      { name: 'WILD CARD (DISRUPTIVO)', key: 'wildcard' }
    ];

    categories.forEach(cat => {
      // Check for space for header + at least one line of intent
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 5, contentWidth, 8, 'F');
      doc.text(cat.name, margin + 2, y + 1);
      y += 12;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const categoryIdeas = (ideas as any)[cat.key] || [];
      categoryIdeas.forEach((idea: string) => {
        const lines = doc.splitTextToSize(`• ${idea}`, contentWidth - 5);
        const itemHeight = (lines.length * 6);

        // Individual item page break check
        if (y + itemHeight > pageHeight - margin) {
          doc.addPage();
          y = 20;
          // Re-draw background slightly if we just switched page in middle of category
          doc.setFontSize(11);
          doc.setFont("helvetica", "italic");
          doc.text(`${cat.name} (continuación)`, margin, y);
          y += 10;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
        }
        
        doc.text(lines, margin + 4, y);
        y += itemHeight + 2;
      });
      y += 6;
    });

    const fileName = `brainstorming-${input.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
    doc.save(fileName);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setIdeas(item.output);
    setInput(item.input);
    setShowHistory(false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const removeHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = deleteFromHistory('ideas', id);
    setHistory(newHistory);
  };

  return (
    <div className="space-y-12 bg-transparent pb-4" id="content-brainstormer">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-4 gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter inline-flex items-center gap-3">
          <Brain size={28} />
          Lluvia de Ideas
        </h1>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-100 hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-200 w-full sm:w-auto"
        >
          <History size={14} />
          {showHistory ? 'Ocultar Historial' : `Historial (${history.length})`}
        </button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 border-2 border-black p-6 mb-8 mt-4">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Últimas 10 Sesiones</span>
                <span className="text-[9px] font-bold text-zinc-300">Autoguardado Local</span>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-zinc-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No hay sesiones guardadas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="group p-4 bg-white border border-zinc-200 hover:border-black cursor-pointer transition-all flex flex-col gap-3 relative"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight text-black truncate">{item.title}</p>
                          <p className="text-[9px] font-bold text-zinc-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(e, item.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300 group-hover:text-black transition-colors">
                        <span className="text-[8px] font-black uppercase tracking-widest">Recuperar</span>
                        <ChevronRight size={10} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 bg-zinc-50 border border-zinc-200 w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-100/50 border-r border-zinc-200 sm:h-full">
            <Users size={16} className="text-zinc-500" />
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Equipo</span>
          </div>
          <div className="flex flex-1 justify-around sm:justify-start p-1 bg-white">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setPeopleCount(num)}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[12px] font-mono transition-all border ${
                  peopleCount === num ? 'bg-black text-white border-black z-10 shadow-lg' : 'text-zinc-400 border-transparent hover:text-black hover:bg-zinc-50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inicializar objetivo de origen (tema, contexto)..."
              className="w-full h-40 p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide shadow-sm"
            />
          </div>
          
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors">
              <MessageSquarePlus size={16} />
            </div>
            <input
              type="text"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Parámetros heurísticos (estilo, tono, límites)..."
              className="w-full pl-14 pr-6 py-5 bg-zinc-50 border-2 border-black/5 rounded-none text-[11px] font-mono focus:outline-none focus:border-black placeholder:text-zinc-300 text-black shadow-sm"
            />
          </div>

          <button
            onClick={generateIdeas}
            disabled={loading || !input.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? 'Sintetizando Flujos Creativos...' : 'INICIAR_LLUVIA_DE_IDEAS'}
          </button>

          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-500 text-red-600 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <Zap size={18} className="animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                  [ALERTA_SISTEMA]: {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {ideas && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-black pb-8 gap-6">
            <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em]">
              <Zap size={18} className="text-black animate-pulse" />
              <span className="truncate">Síntesis.Resultado / {peopleCount} {peopleCount === 1 ? 'Persona' : 'Personas'}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={exportToPDF}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-100 hover:bg-zinc-200 text-black rounded-none text-[10px] font-black transition-all uppercase tracking-widest border border-zinc-200"
              >
                <FileDown size={14} />
                <span>Exportar PDF</span>
              </button>
              <button 
                onClick={sendToProcessor}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-black hover:bg-zinc-800 rounded-none text-[10px] font-black text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest border-2 border-black"
              >
                {sent ? <Check size={14} /> : <Send size={14} />}
                <span>{sent ? 'Enviado_al_Buffer' : 'Enviar al Editor'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            <CategoryCard title="Estrategia Global" icon={<Brain size={20} />} items={ideas.general} color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <CategoryCard title="Inteligencia Óptica" icon={<Camera size={20} />} items={ideas.photographic} color="blue" />
              <CategoryCard title="Dinámica de Movimiento" icon={<Video size={20} />} items={ideas.audiovisual} color="red" />
              <CategoryCard title="Narrativa de Datos" icon={<Newspaper size={20} />} items={ideas.journalistic} color="indigo" />
              <CategoryCard title="Anomalía Recursiva" icon={<Dice5 size={20} />} items={ideas.wildcard} color="amber" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ title, icon, items, color }: { title: string, icon: React.ReactNode, items: string[], color: 'purple' | 'blue' | 'red' | 'indigo' | 'amber' }) {
  const themes = {
    purple: 'border-zinc-100 group-hover:border-black',
    blue: 'border-zinc-100 group-hover:border-black',
    red: 'border-zinc-100 group-hover:border-black',
    indigo: 'border-zinc-100 group-hover:border-black',
    amber: 'border-zinc-100 group-hover:border-black'
  };

  return (
    <div className={`p-10 rounded-none border-2 ${themes[color]} transition-all bg-white hover:shadow-2xl group`}>
      <div className="flex items-center gap-5 mb-10 border-b border-zinc-50 pb-6">
        <div className="p-4 bg-zinc-50 text-black shadow-sm transition-colors group-hover:bg-black group-hover:text-white">
          {icon}
        </div>
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] italic">{title}</h3>
      </div>
      <ul className="space-y-6">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-5 text-[14px] text-zinc-600 leading-[1.6] font-sans">
            <div className="w-1.5 h-1.5 bg-zinc-200 mt-2 flex-none rounded-none group-hover:bg-black transition-colors" />
            <span className="group-hover:text-black transition-colors">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
