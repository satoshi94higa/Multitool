import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Brain, Users, Zap, Send, Check, Loader2, Sparkles, 
  Camera, Video, Newspaper, Dice5, MessageSquarePlus, History, 
  Trash2, ChevronRight, FileDown, Copy, Clock, X, Sparkle, RefreshCw, BarChart2, CheckCircle2
} from 'lucide-react';
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

interface ExpandedIdea {
  category: string;
  idea: string;
  result: string;
}

const renderTextWithBolds = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-zinc-900 bg-zinc-100 px-1 rounded-none">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const renderFormattedResult = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2.5" />;

    // Detect if line is a major section title (e.g. "1. PLAN DE ACCIÓN PASO A PASO" or "PROPUESTA DE GUION Y RECURSOS")
    const isNumberedHeading = /^\d+\s*[\.\-:]\s*[A-ZÁÉÍÓÚ\s]{5,}/.test(trimmed) || 
                              /^(PLAN DE ACCIÓN|PLAN DE ACCION|PROPUESTA DE GUION|PROPUESTA DE GUIÓN|LOGÍSTICA|LOGISTICA|PROPUESTA DE GUION Y RECURSOS|LOGÍSTICA Y EQUIPAMIENTO SUTIL)/i.test(trimmed);

    if (isNumberedHeading) {
      let icon = <Sparkles size={14} className="text-black shrink-0" />;
      let styleClasses = "bg-zinc-100 text-black border-zinc-300";

      if (/plan/i.test(trimmed) || /1\./.test(trimmed)) {
        icon = <Check size={14} className="text-black shrink-0 font-bold" />;
        styleClasses = "bg-zinc-50 text-black border-zinc-200 mt-4";
      } else if (/guion|guión/i.test(trimmed) || /2\./.test(trimmed)) {
        icon = <Video size={14} className="text-black shrink-0" />;
        styleClasses = "bg-zinc-50 text-black border-zinc-200 mt-5";
      } else if (/log/i.test(trimmed) || /equi/i.test(trimmed) || /3\./.test(trimmed)) {
        icon = <Users size={14} className="text-black shrink-0" />;
        styleClasses = "bg-zinc-50 text-black border-zinc-200 mt-5";
      }

      return (
        <div key={idx} className={`flex items-center gap-2.5 mb-2.5 px-3.5 py-2 border rounded-none font-bold text-xs ${styleClasses} select-none`}>
          {icon}
          <span className="font-sans uppercase tracking-wider">{trimmed}</span>
        </div>
      );
    }

    // Detect if it is a list element (e.g., lines starting with *, -, or numbers)
    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\s*[\.\-]\s+/.test(trimmed);

    if (isBullet) {
      const cleanLine = trimmed.replace(/^[-*\s]+/, '').replace(/^\d+\s*[\.\-]\s+/, '');
      return (
        <div key={idx} className="flex items-start gap-2.5 pl-3 py-1.5 leading-relaxed text-[11px] text-zinc-700 font-sans font-medium hover:text-black transition-colors">
          <span className="w-1.5 h-1.5 rounded-none bg-black mt-1.5 shrink-0" />
          <span>{renderTextWithBolds(cleanLine)}</span>
        </div>
      );
    }

    // Default line: regular text
    return (
      <p key={idx} className="text-[11.5px] leading-relaxed text-zinc-650 pl-3 py-1 font-sans font-normal">
        {renderTextWithBolds(trimmed)}
      </p>
    );
  });
};

export default function ContentBrainstormer() {
  const [input, setInput] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<BrainstormOutput | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Tab state for categories
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'photographic' | 'audiovisual' | 'journalistic' | 'wildcard'>('all');
  
  // Favorites checklist state
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Interactive Idea Expander State
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<ExpandedIdea | null>(null);
  const [expandingError, setExpandingError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory('ideas'));
  }, []);

  const toggleFavorite = (idea: string) => {
    if (favorites.includes(idea)) {
      setFavorites(favorites.filter(item => item !== idea));
    } else {
      setFavorites([...favorites, idea]);
    }
  };

  const cleanAndParseJSON = (rawText: string): BrainstormOutput => {
    let clean = rawText.trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  };

  const generateIdeas = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setIdeas(null);
    setFavorites([]); // Reset favorites for new brainstorm
    setActiveTab('all'); // Reset to all tabs on new brainstorm
    try {
      const prompt = `Actuá como un estratega de contenido creativo y productor multimedia experto rioplatense.
      Tengo que cubrir la siguiente actividad/tema: "${input}"
      Somos un equipo de ${peopleCount} personas.
      Usá español de Argentina (voseo, vocabulario local natural y profesional, evitá sonar robótico o rígido).
      
      ${extraPrompt ? `Criterios específicos del proyecto (Límites y condiciones sugeridas): ${extraPrompt}` : ''}
      
      Generá una lluvia de ideas (brainstorming) dividida en 5 categorías distintas. Cada categoría debe tener exactamente 3 ideas realistas, aplicables y sumamente creativas adaptadas al tamaño del equipo (${peopleCount} personas).
      
      Categorías obligatorias:
      1. general: Estrategia de cobertura global y objetivos macro.
      2. photographic: Ideas para capturas de fotos fijas, ángulos, luces u momentos clave de alta calidad.
      3. audiovisual: Formato vídeo (Reels, TikToks, tomas de recurso específicas, ganchos visuales potentes).
      4. journalistic: Crónicas, hilos de redes, datos interesantes, copys o encandilamiento informativo de valor.
      5. wildcard: Ideas disruptivas, interacciones físicas con la gente o giros de guion inesperados fuera de lo común.
      
      Devuelve la respuesta estrictamente como un objeto JSON con este formato:
      {
        "general": ["idea 1", "idea 2", "idea 3"],
        "photographic": ["idea 1", "idea 2", "idea 3"],
        "audiovisual": ["idea 1", "idea 2", "idea 3"],
        "journalistic": ["idea 1", "idea 2", "idea 3"],
        "wildcard": ["idea 1", "idea 2", "idea 3"]
      }`;

      const data = await processWithGemini({ customPrompt: prompt }, 'process');
      const result = cleanAndParseJSON(data.text);
      setIdeas(result);

      const newHistory = saveToHistory('ideas', input, result, input.slice(0, 35));
      setHistory(newHistory);
    } catch (err: any) {
      console.error('Error generating ideas:', err);
      setError(err.message || "No se pudo generar la lluvia de ideas. Por favor, reintentá.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpandIdea = async (category: string, ideaText: string, index: number) => {
    setExpandingId(`${category}-${index}`);
    setExpandingError(null);
    try {
      const prompt = `Actuá como un productor de campo y guionista creativo experto con acento natural rioplatense (voseo).
      Tengo esta idea generada para una campaña:
      Idea: "${ideaText}"
      Categoría original: "${category}"
      Trabajando con un equipo de: ${peopleCount} personas.
      Tema general: "${input}"
      
      Desarrollá un plan de ejecución práctico, ágil y sumamente aterrizado.
      Dividí el desarrollo obligatoriamente en estos tres apartados con títulos claros y sencillos (sin Markdown pesado):
      
      1. PLAN DE ACCIÓN PASO A PASO
      Qué preparar antes de salir a rodar/grabar, qué capturar puntualmente en el momento, y sugerencia ágil de edición.
      
      2. PROPUESTA DE GUION Y RECURSOS
      Un gancho conversacional de 3 segundos para el inicio y el concepto para el cierre. Sugerí tomas clave.
      
      3. LOGÍSTICA Y EQUIPAMIENTO SUTIL
      Herramientas recomendadas para que lo haga un equipo de ${peopleCount} personas sin complicarse (ej. trípodes, micrófonos lavalier, lentes recomendados).
      
      Mantenelo muy profesional, directo a la acción, motivador y sumamente humano en voseo de Buenos Aires.`;

      const data = await processWithGemini({ customPrompt: prompt }, 'process');
      setExpandedIdea({
        category,
        idea: ideaText,
        result: data.text
      });
    } catch (err: any) {
      console.error('Error expanding idea:', err);
      setExpandingError(err.message || 'Error al conectar con la IA para expandir.');
    } finally {
      setExpandingId(null);
    }
  };

  const getTeamRoleDescription = (count: number) => {
    switch (count) {
      case 1:
        return "Coordinás todo vos solo. Las ideas se diseñarán con foco en la practicidad extrema, agilidad de edición en el celular y optimización de recursos.";
      case 2:
        return "Ideal para repartir tareas entre captura visual (cámara) y recopilación documental/redacción ágil de copys.";
      case 3:
        return "Perfecta separación para Dirección/Sonido, Captura de Imagen dedicada en trípode/gimbal y Conducción/Entrevistas.";
      case 4:
        return "Permite roles dedicados a iluminación, entrevistas fluidas, fotos secundarias tipo backstage y publicación de historias en vivo.";
      case 5:
        return "Ideal para producciones de alta fidelidad, dirección de arte detallada, tomas de recurso cinematográficas y engagement inmediato.";
      default:
        return "Cobertura total y simultánea en múltiples frentes del proyecto, ideal para proyectos híbridos y multiplataforma.";
    }
  };

  const sendToProcessor = (useFavoritesOnly = false) => {
    if (!ideas) return;
    
    let baseIdeas: string[] = [];
    let titlePrefix = "LLUVIA DE IDEAS";
    
    if (useFavoritesOnly) {
      if (favorites.length === 0) return;
      baseIdeas = favorites;
      titlePrefix = "IDEAS SELECCIONADAS (FAVORITAS)";
    }
    
    let fullText = `💡 ${titlePrefix}: ${input.toUpperCase()}\n👥 Equipo: ${peopleCount} ${peopleCount === 1 ? 'persona' : 'personas'}\n📊 Condiciones: ${extraPrompt || 'Ninguna sugerida'}\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
    
    if (useFavoritesOnly) {
      baseIdeas.forEach((idea, idx) => {
        fullText += `${idx + 1}. ${idea}\n`;
      });
    } else {
      const categories = [
        { name: '🌐 ESTRATEGIA GENERAL', key: 'general' },
        { name: '📸 COBERTURA FOTOGRÁFICA', key: 'photographic' },
        { name: '🎥 COBERTURA AUDIOVISUAL', key: 'audiovisual' },
        { name: '✍️ PERIODISMO / GRÁFICA', key: 'journalistic' },
        { name: '🎯 IDEAS DISRUPTIVAS', key: 'wildcard' }
      ];

      categories.forEach(cat => {
        fullText += `${cat.name}\n`;
        const categoryIdeas = (ideas as any)[cat.key] || [];
        categoryIdeas.forEach((idea: string) => {
          const isFav = favorites.includes(idea) ? "★ " : "- ";
          fullText += `${isFav}${idea}\n`;
        });
        fullText += '\n';
      });
    }

    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportToPDF = () => {
    if (!ideas) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      let y = 25;

      // Header Styling
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(17, 24, 39); // Zinc 900
      doc.text("PLAN CREATIVO DE COBERTURA", margin, y);
      
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128); // Zinc 500
      doc.text("Lluvia de ideas diseñada bajo condiciones específicas de producción", margin, y);

      y += 8;
      doc.setDrawColor(229, 231, 235); // Zinc 200
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 12;
      
      // Metadata section
      doc.setFillColor(249, 250, 251); // Gray 50
      doc.rect(margin, y, contentWidth, 36, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81); // Gray 700
      doc.text("CONCEPTO NEURAL:", margin + 5, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      
      const themeLines = doc.splitTextToSize(input, contentWidth - 45);
      doc.text(themeLines, margin + 40, y + 8);
      
      const metaYOffset = (themeLines.length * 5) + 10;
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("EQUIPO DE TRABAJO:", margin + 5, y + metaYOffset);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(`${peopleCount} ${peopleCount === 1 ? 'Persona' : 'Personas'} - (${getTeamRoleDescription(peopleCount).split('.')[0]})`, margin + 40, y + metaYOffset);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("CONDICIONES EXTRA:", margin + 5, y + metaYOffset + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(extraPrompt ? extraPrompt : "Ninguna especificada", margin + 40, y + metaYOffset + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("FECHA DE DISEÑO:", margin + 5, y + metaYOffset + 10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(new Date().toLocaleString('es-AR'), margin + 40, y + metaYOffset + 10);

      y += metaYOffset + 18;

      const categories = [
        { name: '1. ESTRATEGIA GENERAL', key: 'general', r: 99, g: 102, b: 241 }, // Indigo
        { name: '2. ENFOQUE FOTOGRÁFICO', key: 'photographic', r: 59, g: 130, b: 246 }, // Blue
        { name: '3. DINÁMICA AUDIOVISUAL', key: 'audiovisual', r: 239, g: 68, b: 68 }, // Red
        { name: '4. PERIODISMO Y CONTENIDOS', key: 'journalistic', r: 168, g: 85, b: 247 }, // Purple
        { name: '5. IDEA DISRUPTIVA (WILD CARD)', key: 'wildcard', r: 245, g: 158, b: 11 } // Amber
      ];

      categories.forEach(cat => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 25;
        }

        // Category Subheader
        doc.setFillColor(cat.r, cat.g, cat.b);
        doc.rect(margin, y, 4, 8, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(cat.r, cat.g, cat.b);
        doc.text(cat.name, margin + 8, y + 6);
        
        y += 12;

        const categoryIdeas = (ideas as any)[cat.key] || [];
        categoryIdeas.forEach((idea: string) => {
          const isFavorite = favorites.includes(idea);
          const iconText = isFavorite ? "[x] " : "- ";
          const lines = doc.splitTextToSize(idea, contentWidth - 10);
          
          if (y + (lines.length * 5) > pageHeight - margin) {
            doc.addPage();
            y = 25;
          }
          
          doc.setFont("helvetica", isFavorite ? "bold" : "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(17, 24, 39);
          
          doc.text(iconText, margin + 2, y);
          doc.text(lines, margin + 8, y);
          y += (lines.length * 5) + 3;
        });

        y += 6;
      });

      // Export footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Generado exclusivamente con Estudio.Modular", pageWidth / 2, pageHeight - 10, { align: 'center' });

      const fileName = `brainstorming-${input.slice(0, 15).toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation error: ", err);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setIdeas(item.output);
    setInput(item.input);
    setFavorites([]);
    setShowHistory(false);
  };

  const removeHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = deleteFromHistory('ideas', id);
    setHistory(newHistory);
  };

  // Filters ideas based on tab selection
  const getFilteredCategories = () => {
    if (!ideas) return [];
    
    const allCats = [
      { id: 'general', title: 'Estrategia General', subtitle: 'Operación de campo global', icon: Brain, items: ideas.general, color: 'indigo' as const },
      { id: 'photographic', title: 'Inteligencia Fotográfica', subtitle: 'Tomas fijas, luces e instantes', icon: Camera, items: ideas.photographic, color: 'blue' as const },
      { id: 'audiovisual', title: 'Dinámica Audiovisual', subtitle: 'Reels, planos de recurso y ganchos', icon: Video, items: ideas.audiovisual, color: 'red' as const },
      { id: 'journalistic', title: 'Narrativa y Hilos', subtitle: 'Datos, copys y síntesis', icon: Newspaper, items: ideas.journalistic, color: 'purple' as const },
      { id: 'wildcard', title: 'Ideas Disruptivas', subtitle: 'Interactividad y giros de guion', icon: Dice5, items: ideas.wildcard, color: 'amber' as const }
    ];

    if (activeTab === 'all') {
      return allCats;
    }

    return allCats.filter(cat => cat.id === activeTab);
  };

  return (
    <div className="space-y-12 bg-transparent pb-4" id="content-brainstormer">
      
      {/* Refined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-2 gap-4">
        <h1 className="text-xl font-black uppercase tracking-tighter inline-block self-start">
          Lluvia de Ideas
        </h1>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-200"
        >
          <History size={14} />
          {showHistory ? 'Ocultar Historial' : `Historial (${history.length})`}
        </button>
      </div>

      {/* Modern sliding History panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-50 border-2 border-black p-6 mb-8 rounded-none"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Últimas Generaciones</span>
              <span className="text-[9px] font-bold text-zinc-300">Autoguardado Local</span>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No hay registros guardados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="group p-4 bg-white border border-zinc-200 hover:border-black cursor-pointer transition-all flex flex-col gap-3 relative rounded-none"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Form Area (No Presets / Pure Aesthetic input) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step 1 & Textarea Block */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.05)] space-y-4 hover:border-black transition-colors flex-1 flex flex-col justify-between rounded-none">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-none bg-zinc-100 text-black flex items-center justify-center text-[10px] font-black border border-black">1</span>
                  <h2 className="text-[11px] font-black text-zinc-950 uppercase tracking-widest">Definí el Tema, Cobertura o Idea Central</h2>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 border border-zinc-150 rounded-none px-2 py-0.5 select-none">
                  {input.length} caracteres
                </span>
              </div>
              
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ej: Cobertura del festival de foodtrucks con bandas en vivo este finde, inauguración de un local de café de especialidad con propuesta estética minimalista, o un hilo informativo sobre las historias ocultas de los comercios del barrio..."
                  className="w-full h-36 p-4 bg-zinc-50 hover:bg-white focus:bg-white border-2 border-zinc-200 focus:border-black text-sm focus:outline-none resize-none font-sans text-black placeholder-zinc-300 transition-all leading-relaxed rounded-none shadow-sm"
                />
              </div>
            </div>

            {/* Micro details or quick tips inside the textarea footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <Sparkle size={11} className="text-black animate-pulse" />
              <span>Escribe libremente y la IA procesará la cobertura estratégica audiovisual.</span>
            </div>
          </div>
        </div>

        {/* Column 2: Parameters Grid */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Step 2: Equipo con Representación Visual de Avatares */}
          <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.05)] space-y-4 flex flex-col justify-between hover:border-black transition-colors rounded-none">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</span>
                <h2 className="text-sm font-bold text-zinc-800">Tamaño del Equipo</h2>
              </div>
              
              <div className="flex items-center justify-between gap-1 p-1 bg-zinc-100 border border-zinc-200/30 rounded-xl">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPeopleCount(num)}
                    className={`flex-1 h-9 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                      peopleCount === num 
                        ? 'bg-white text-zinc-900 shadow-md border border-zinc-200/50' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    {num} {num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
              
              {/* Refined dynamic avatar visualizer */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex items-start gap-2.5">
                <div className="flex -space-x-1.5 shrink-0 pt-0.5">
                  {Array.from({ length: Math.min(peopleCount, 4) }).map((_, idx) => (
                    <span 
                      key={idx} 
                      className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-600 uppercase"
                    >
                      P{idx + 1}
                    </span>
                  ))}
                  {peopleCount > 4 && (
                    <span className="w-5 h-5 rounded-full bg-zinc-900 border border-white flex items-center justify-center text-[7px] font-bold text-white uppercase">
                      +{peopleCount - 4}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                  <strong>{peopleCount === 1 ? 'Solo-Producer' : peopleCount === 2 ? 'Dúo Cruzado' : peopleCount === 3 ? 'Trío Ágil' : 'Crew Especializada'}:</strong> {getTeamRoleDescription(peopleCount)}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Límites y condiciones en texto */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-zinc-300/80 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">3</span>
              <h2 className="text-sm font-bold text-zinc-800">Límites y Condiciones Creativas (Opcional)</h2>
            </div>
            
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <MessageSquarePlus size={14} />
              </div>
              <input
                type="text"
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="Ej: Usar tono dinámico o humorístico, planos cortos, estética cinematográfica..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-zinc-700 font-medium placeholder-zinc-400 transition-colors"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Main Trigger Button */}
      <div className="flex justify-center max-w-lg mx-auto pt-2">
        <button
          onClick={generateIdeas}
          disabled={loading || !input.trim()}
          className="group w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-zinc-950/5 hover:shadow-zinc-950/15"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Sintetizando ideas tácticas...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Generar Lluvia de Ideas Creativas</span>
            </>
          )}
        </button>
      </div>

      {/* Service Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-150 text-red-700 rounded-2xl animate-in fade-in max-w-3xl mx-auto shadow-sm">
          <div className="flex items-start gap-3">
            <Zap size={16} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Error de Generación</p>
              <p className="text-xs text-red-700/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Section with redesigned Tabs visualization */}
      {ideas && (
        <div className="space-y-6 pt-8 border-t border-zinc-200/60 animate-in fade-in duration-500">
          
          {/* Quick Informative Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-zinc-800">Lluvia de ideas completada</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Adaptado impecablemente para {peopleCount} {peopleCount === 1 ? 'coordinador' : 'productores'}.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 transition-colors shadow-sm cursor-pointer"
              >
                <FileDown size={13} className="text-zinc-400" />
                <span>Exportar PDF</span>
              </button>
              
              <button 
                onClick={() => sendToProcessor(false)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm cursor-pointer"
              >
                {sent ? <Check size={13} className="text-emerald-400" /> : <Send size={13} className="text-indigo-400" />}
                <span>{sent ? '¡Enviado!' : 'Mandar al editor'}</span>
              </button>
            </div>
          </div>

          {/* Tabs Filter Bar (The core of the redone UX) */}
          <div className="border-b border-zinc-200/80 pb-0.5">
            <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 pb-0.5">
              {[
                { id: 'all', label: 'Ver Todo', count: 15, icon: BarChart2 },
                { id: 'general', label: 'Estrategia', count: 3, icon: Brain },
                { id: 'photographic', label: 'Fotografía', count: 3, icon: Camera },
                { id: 'audiovisual', label: 'Audiovisual', count: 3, icon: Video },
                { id: 'journalistic', label: 'Narración', count: 3, icon: Newspaper },
                { id: 'wildcard', label: 'Disruptivo', count: 3, icon: Dice5 }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-950 text-white shadow-md' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-transparent'
                    }`}
                  >
                    <TabIcon size={13} />
                    <span>{tab.label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-zinc-800 text-indigo-300' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {tab.count}
                    </span>
                    {isSelected && (
                      <motion.div 
                        layoutId="activeTabUnderline" 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Bento Grid content displaying filtered items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {getFilteredCategories().map((cat) => (
              <CategorySection 
                key={cat.id}
                title={cat.title} 
                subtitle={cat.subtitle}
                icon={cat.icon} 
                items={cat.items} 
                themeColor={cat.color} 
                favorites={favorites} 
                toggleFavorite={toggleFavorite} 
                categoryKey={cat.id}
                onExpand={handleExpandIdea}
                expandingId={expandingId}
              />
            ))}

            {/* Quick Helper Widget to give life to empty spaces or add interaction values */}
            {activeTab === 'all' && (
              <div className="p-8 bg-zinc-50 border-2 border-black rounded-none flex flex-col justify-between gap-6 relative overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.05)]">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 opacity-[0.03]">
                  <Sparkles size={160} />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-zinc-950 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-zinc-200">
                    <Sparkle size={13} className="text-black" />
                    Guía de Trabajo Modular
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans font-medium">
                    Hacé clic en el ícono de estrella <Sparkle className="inline text-black" size={10} /> para marcar ideas específicas. Podés enviar solamente tu selección estrella directo a tu espacio de trabajo.
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1 font-bold">
                    Usa el botón de varita <Sparkles className="inline text-black" size={10} /> para planificar en profundidad, el cual te entregará guion de audio, tomas de recurso y logística exacta.
                  </p>
                </div>
                
                <div className="bg-white p-4 border-2 border-black rounded-none">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block text-center mb-1">Tu Selección</span>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} className="text-black" />
                    <span className="text-sm font-extrabold text-zinc-800 font-mono">{favorites.length} de 15 ideas estrella</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active selection tray */}
          <AnimatePresence>
            {favorites.length > 0 && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-full max-w-lg px-4"
              >
                <div className="bg-black border-2 border-white text-white rounded-none shadow-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-none border border-white/20 bg-white/10 flex items-center justify-center text-xs font-black text-white">
                      {favorites.length}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white tracking-widest">Ideas Seleccionadas</p>
                      <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Listas para ser pegadas en el editor modular.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setFavorites([])}
                      className="px-3 py-1.5 border border-white/20 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-none cursor-pointer"
                    >
                      Limpiar
                    </button>
                    <button 
                      onClick={() => sendToProcessor(true)}
                      className="px-4 py-1.5 bg-white hover:bg-zinc-200 font-black text-[10px] uppercase tracking-wider text-black rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={11} />
                      Enviar Selección
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Idea Expander Modal / Slide-over */}
      <AnimatePresence>
        {expandedIdea && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setExpandedIdea(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              className="relative bg-white border-4 border-black rounded-none p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[24px_24px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between"
            >
              {/* Close Button */}
              <button 
                onClick={() => setExpandedIdea(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-none transition-all"
              >
                <X size={18} />
              </button>

              <div className="space-y-6">
                
                {/* Modal Title Block */}
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-200">
                  <span className="p-2.5 bg-zinc-100 text-black border border-zinc-300 rounded-none">
                    <Sparkles size={18} className="animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-[11px] font-black text-black uppercase tracking-widest font-sans">Estrategia Detallada de Campo</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Diseño logístico de cobertura generado a medida.</p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 border-2 border-black/5 rounded-none">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Propuesta original</span>
                  <p className="text-xs text-zinc-800 font-bold leading-relaxed font-sans">
                    {expandedIdea.idea}
                  </p>
                </div>

                {/* Main Markdown / Text content rendered beautifully */}
                <div className="space-y-1">
                  <div className="bg-zinc-50 border-2 border-black p-6 rounded-none shadow-sm text-zinc-700 font-sans leading-relaxed">
                    {renderFormattedResult(expandedIdea.result)}
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="border-t border-zinc-150 mt-6 pt-5 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider">
                  <Clock size={11} />
                  Listo para plan de rodaje
                </span>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      copyToClipboard(`IDEA CREATIVA: ${expandedIdea.idea}\n\n${expandedIdea.result}`);
                      showTemporaryToast();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-white hover:bg-zinc-50 text-xs font-black uppercase rounded-none transition-all cursor-pointer"
                  >
                    <Copy size={13} />
                    Copiar
                  </button>
                  
                  <button 
                    onClick={() => {
                      const expandedText = `\nPLAN DETALLADO: ${expandedIdea.idea.toUpperCase()}\n\n${expandedIdea.result}\n\n`;
                      window.dispatchEvent(new CustomEvent('app-set-text', { 
                        detail: { text: expandedText, append: true } 
                      }));
                      setExpandedIdea(null);
                    }}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-black text-white text-xs font-black uppercase rounded-none transition-all cursor-pointer hover:bg-zinc-800"
                  >
                    <Send size={13} />
                    Pegar en editor
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini notification system for copy paste events */}
      <div id="ideas-clipboard-toast" className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-black text-white rounded-none px-4 py-2.5 text-xs font-bold shadow-2xl z-[150] transition-opacity opacity-0 pointer-events-none flex items-center gap-2 border border-white/10">
        <Check size={13} className="text-emerald-400" />
        <span className="uppercase tracking-widest text-[9px]">Texto copiado al portapapeles</span>
      </div>

    </div>
  );
  
  function showTemporaryToast() {
    const el = document.getElementById('ideas-clipboard-toast');
    if (el) {
      el.classList.remove('opacity-0');
      el.classList.add('opacity-100');
      setTimeout(() => {
        el.classList.remove('opacity-100');
        el.classList.add('opacity-0');
      }, 2000);
    }
  }
}

interface CategoryProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number, className?: string }>;
  items: string[];
  themeColor: 'indigo' | 'blue' | 'red' | 'purple' | 'amber';
  favorites: string[];
  toggleFavorite: (idea: string) => void;
  categoryKey: string;
  onExpand: (category: string, ideaText: string, index: number) => Promise<void>;
  expandingId: string | null;
}

function CategorySection({ 
  title, 
  subtitle,
  icon: Icon, 
  items, 
  themeColor, 
  favorites, 
  toggleFavorite,
  categoryKey,
  onExpand,
  expandingId
}: CategoryProps) {
  
  const themes = {
    indigo: {
      border: 'hover:border-black border-zinc-200/80',
      tagBg: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
      iconText: 'text-black',
    },
    blue: {
      border: 'hover:border-black border-zinc-200/80',
      tagBg: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
      iconText: 'text-black',
    },
    red: {
      border: 'hover:border-black border-zinc-200/80',
      tagBg: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
      iconText: 'text-black',
    },
    purple: {
      border: 'hover:border-black border-zinc-200/80',
      tagBg: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
      iconText: 'text-black',
    },
    amber: {
      border: 'hover:border-black border-zinc-200/80',
      tagBg: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
      iconText: 'text-black',
    }
  };

  const copyItemText = (text: string) => {
    navigator.clipboard.writeText(text);
    const el = document.getElementById('ideas-clipboard-toast');
    if (el) {
      el.classList.remove('opacity-0');
      el.classList.add('opacity-100');
      setTimeout(() => {
        el.classList.remove('opacity-100');
        el.classList.add('opacity-0');
      }, 1500);
    }
  };

  return (
    <div className="p-6 bg-white rounded-none border-2 border-black transition-all shadow-[6px_6px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[10px_10px_0px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-4">
        
        {/* Card Header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-200">
          <div className="p-2 rounded-none bg-zinc-100 text-black border border-zinc-300 shrink-0">
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-black font-sans uppercase tracking-tight leading-none">{title}</h3>
            <span className="text-[9px] text-zinc-400 mt-1 block font-bold uppercase tracking-wider">{subtitle}</span>
          </div>
        </div>

        {/* Bullet Points */}
        <ul className="space-y-3 pt-0.5">
          {items.map((item, index) => {
            const isFav = favorites.includes(item);
            const isThisExpanding = expandingId === `${categoryKey}-${index}`;
            
            return (
              <li 
                key={index} 
                className={`p-3 rounded-none border text-xs leading-relaxed transition-all flex flex-col gap-2.5 font-sans ${
                  isFav 
                    ? 'bg-zinc-50 border-2 border-black text-zinc-950 font-semibold shadow-sm' 
                    : 'bg-zinc-50/20 border-zinc-200 hover:border-black/50 hover:bg-zinc-50 text-zinc-650'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-none bg-zinc-400 mt-1.5 flex-none shrink-0" />
                  <span className={`block flex-grow ${isFav ? 'font-bold text-black' : 'font-medium text-zinc-600'}`}>
                    {item}
                  </span>
                </div>

                {/* Hover Quick actions bar */}
                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 pb-0.5 bg-transparent">
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={() => toggleFavorite(item)}
                      title={isFav ? "Quitar del plan estrella" : "Marcar con estrella"}
                      className={`p-1.5 rounded-none hover:bg-zinc-100 transition-colors cursor-pointer ${
                        isFav ? 'text-black' : 'text-zinc-300 hover:text-black'
                      }`}
                    >
                      <Sparkle size={12} fill={isFav ? "currentColor" : "none"} className="transition-transform active:scale-125" />
                    </button>
                    
                    <button 
                      onClick={() => copyItemText(item)}
                      title="Copiar texto de la idea"
                      className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-none transition-colors cursor-pointer"
                    >
                      <Copy size={11} />
                    </button>
                  </div>

                  <button
                    onClick={() => onExpand(categoryKey, item, index)}
                    disabled={isThisExpanding}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer border ${
                      isThisExpanding 
                        ? 'text-zinc-400 border-zinc-200 cursor-not-allowed bg-zinc-50' 
                        : 'text-black border-black hover:bg-black hover:text-white bg-white'
                    }`}
                  >
                    {isThisExpanding ? (
                      <>
                        <Loader2 size={9} className="animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={9} className="text-black" />
                        <span>Tácticas de rodaje</span>
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

      </div>
    </div>
  );
}
