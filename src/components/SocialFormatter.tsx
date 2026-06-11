import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Info, 
  History, 
  Trash2, 
  ChevronRight, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  ThumbsUp, 
  MessageSquare, 
  Repeat, 
  Share2, 
  AlertTriangle, 
  User, 
  Smartphone, 
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { processWithGemini } from '../services/geminiService';
import { saveToHistory, getHistory, deleteFromHistory, HistoryItem } from '../lib/persistence';

type Mode = 'social' | 'grammar' | 'emojis' | 'cta' | 'hooks';
type Tone = 'casual' | 'professional' | 'energetic';
type PreviewPlatform = 'instagram' | 'linkedin' | 'twitter';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip = ({ text }: InfoTooltipProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative inline-block ml-1 align-middle ${show ? 'z-[65]' : 'z-0'}`}>
      <span 
        role="button"
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            setShow(!show);
          }
        }}
        className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 cursor-help inline-flex items-center justify-center rounded"
      >
        <Info size={14} />
      </span>
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 text-zinc-100 text-xs font-normal leading-relaxed pointer-events-none shadow-2xl border border-white/10 rounded-lg text-center normal-case tracking-normal"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SocialFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [report, setReport] = useState<{ corrections: string[], tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<Mode>('social');
  const [tone, setTone] = useState<Tone>('casual');
  const [noMarkdown, setNoMarkdown] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Checkbox Options for Custom Optimization Elements
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const [includeHooks, setIncludeHooks] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);

  // Advanced variant and mobile readability results
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('A');
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [readability, setReadability] = useState<{ score: number, level: 'green' | 'yellow' | 'red', feedback: string } | null>(null);

  // Redesign state
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('instagram');
  const [likedMockPost, setLikedMockPost] = useState(false);
  const [savedMockPost, setSavedMockPost] = useState(false);
  const [repostedMockPost, setRepostedMockPost] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  useEffect(() => {
    setHistory(getHistory('social'));
  }, []);

  const modeInfo = {
    social: 'Mejorá el estilo, estructura y fluidez de tu texto para lograr mayor interacción y claridad en redes sociales.',
    grammar: 'Corregí la ortografía, gramática y puntuación sin perder tu esencia o personalidad original.',
    emojis: 'Sumá emojis de forma estratégica y natural para que tu publicación sea más visual y atractiva.',
    cta: 'Generá llamados a la acción directos y amigables que incentiven la interacción real de tus seguidores.',
    hooks: 'Creá ganchos o primeras líneas atrapantes para captar la atención desde el principio del post.'
  };

  const toneInfo = {
    casual: 'Un estilo relajado, espontáneo y bien cercano. Ideal para conectar en el día a día.',
    professional: 'Un tono cuidado, profesional y con autoridad. Perfecto para LinkedIn o tu marca personal.',
    energetic: 'Con fuerza, motivación y mucho entusiasmo. Genial para anuncios y ventas con empuje.'
  };

  const charLimits = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200
  };

  const processText = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setVariantA('');
    setVariantB('');
    setOutput('');
    setReport(null);
    setSuggestedHashtags([]);
    setReadability(null);
    setSelectedVariant('A');
    setError(null);
    
    try {
      const data = await processWithGemini({ 
        input, 
        tone, 
        noMarkdown,
        includeEmojis,
        includeCta,
        includeHooks,
        includeHashtags
      }, 'social');
      
      const responseText = data.text || '';

      try {
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        const vA = parsedData.variantA || '';
        const vB = parsedData.variantB || '';
        setVariantA(vA);
        setVariantB(vB);
        setOutput(vA); // Default first variant
        setSuggestedHashtags(parsedData.hashtags || []);
        setReadability(parsedData.readability || null);
      } catch (e) {
        setOutput(responseText);
        setVariantA(responseText);
        setVariantB('');
      }

      const newHistory = saveToHistory('social', input, responseText, input.slice(0, 30));
      setHistory(newHistory);
    } catch (err: any) {
      console.error('Social Booster Error:', err);
      setError(err.message || "Error al procesar el texto.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setShowHistory(false);
    
    // Parse json structure if available in history payload
    if (item.output && (item.output.trim().startsWith('{') || item.output.trim().includes('"variantA"'))) {
      try {
        const cleanJson = item.output.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        const vA = parsedData.variantA || '';
        const vB = parsedData.variantB || '';
        setVariantA(vA);
        setVariantB(vB);
        setOutput(vA);
        setSelectedVariant('A');
        setSuggestedHashtags(parsedData.hashtags || []);
        setReadability(parsedData.readability || null);
      } catch (e) {
        setOutput(item.output);
        setVariantA(item.output);
        setVariantB('');
        setSuggestedHashtags([]);
        setReadability(null);
      }
    } else {
      setOutput(item.output);
      setVariantA(item.output);
      setVariantB('');
      setSuggestedHashtags([]);
      setReadability(null);
    }
  };

  const removeHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = deleteFromHistory('social', id);
    setHistory(newHistory);
  };

  // Preview fallbacks or defaults
  const previewText = output || input || "Acá se mostrará la magia de tu texto optimizado. Escribí un borrador y tocá en el botón de abajo para empezar...";

  return (
    <div id="social-booster" className="bg-transparent font-sans">
      
      {/* Top Redesign Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-zinc-200 pb-5 mb-8 gap-4 mr-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-sm">Rioplatense AI</span>
            <span className="text-[10px] font-mono text-zinc-400">Ver. 2.0</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
            Formateador Social
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Optimizá, corregí, agregá ganchos o emojis con el tono exacto para conectar en redes sociales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Text Plano Toggle */}
          {mode === 'social' && (
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-2 rounded-lg transition-all text-xs">
              <span className="text-[10px] font-black text-zinc-650 uppercase tracking-wider">Texto Plano</span>
              <input 
                type="checkbox" 
                checked={noMarkdown} 
                onChange={(e) => setNoMarkdown(e.target.checked)}
                className="accent-black w-4 h-4 rounded cursor-pointer"
              />
            </label>
          )}

          {/* History Button */}
          <button 
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center justify-center gap-2 px-4 h-10 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              showHistory 
                ? 'bg-black border-black text-white' 
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-350'
            }`}
          >
            <History size={15} />
            Historial ({history.length})
          </button>
        </div>
      </div>

      {/* History Slide Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-zinc-650" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Últimas 10 Optimizaciones</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Autoguardado Local
                </span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-250 rounded-lg bg-white/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No hay registros guardados todavía</p>
                  <p className="text-xs text-zinc-400 mt-1">Los textos que proceses se guardarán automáticamente acá.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="group p-4 bg-white border border-zinc-250 hover:border-zinc-850 hover:shadow-md cursor-pointer transition-all duration-200 rounded-lg flex flex-col justify-between gap-3 relative"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-zinc-900 truncate group-hover:text-black">{item.title}</p>
                          <p className="text-[9.5px] font-bold text-zinc-400 mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => removeHistoryItem(e, item.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-1 hover:bg-zinc-50 rounded"
                          title="Eliminar del historial"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-black transition-colors self-start">
                        <span>Recuperar borrador</span>
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Multi-Pane Sandbox Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Config Panel & Inputs (Col: 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Optimization Options */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.22em] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-black rounded-full" /> 1. Opciones de Inteligencia y Estructura:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
              {/* Checkbox: Emojis */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  checked={includeEmojis} 
                  onChange={(e) => setIncludeEmojis(e.target.checked)}
                  className="accent-black w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 leading-none">Emojis sugeridos</p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">Sumá color y expresividad sutil.</p>
                </div>
              </label>

              {/* Checkbox: CTA */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  checked={includeCta} 
                  onChange={(e) => setIncludeCta(e.target.checked)}
                  className="accent-black w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 leading-none">Llamado a la Acción (CTA)</p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">Incentivá la interacción real al final.</p>
                </div>
              </label>

              {/* Checkbox: Hooks */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  checked={includeHooks} 
                  onChange={(e) => setIncludeHooks(e.target.checked)}
                  className="accent-black w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 leading-none">Ganchos de Lectura (Hooks)</p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">Frená el scroll con un inicio de impacto.</p>
                </div>
              </label>

              {/* Checkbox: Hashtags */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  checked={includeHashtags} 
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  className="accent-black w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 leading-none font-sans">Sugeridor de Hashtags</p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-normal">Sumá etiquetas de contexto estratégico.</p>
                </div>
              </label>
            </div>

            {/* Info Box explaining Selected Mode */}
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-lg flex gap-2.5 items-start">
              <Sparkles size={16} className="text-zinc-650 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10.5px] font-bold text-zinc-800 uppercase tracking-widest leading-none">
                  Optimización Estructural Inteligente
                </p>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Creamos dos propuestas de posteo optimizadas (Variante A directa/emocional y Variante B profesional/creativa), aplicando reglas anti-slop rioplatenses, análisis de legibilidad para móviles, corrección de gramática y ganchos atractivos.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Tone Selection */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-black uppercase tracking-[0.22em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-black rounded-full" /> 2. Elegí el tono de la publicación:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
              {(['casual', 'professional', 'energetic'] as const).map((t) => {
                const isActive = tone === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-3 px-2 border-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-150 flex flex-col items-center justify-center gap-1 leading-tight cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-950 border-zinc-950 text-white shadow-md shadow-zinc-200' 
                        : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{t === 'casual' ? 'Casual 😊' : t === 'professional' ? 'Profesional 💼' : 'Enérgico 🚀'}</span>
                  </button>
                );
              })}
            </div>

            {/* Info Box explaining Tone */}
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-lg text-xs text-zinc-500 leading-relaxed italic">
              {toneInfo[tone]}
            </div>
          </div>

          {/* Step 3: Text input stage */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.22em] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-black rounded-full" /> 3. Redactá tu mensaje borrador:
              </span>

              {input.trim() && (
                <button 
                  type="button"
                  onClick={() => setInput('')}
                  className="text-zinc-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Limpiar borrador
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí o pegá tu texto acá... (ej: 'hola quiero contarles que lanzamos un nuevo producto es ideal para emprendedores')"
                className="w-full h-44 p-4 bg-zinc-50 hover:bg-zinc-50/75 focus:bg-white border border-zinc-200 focus:border-zinc-900 rounded-xl text-sm focus:outline-none transition-all duration-200 resize-none font-sans text-zinc-900 placeholder-zinc-400 scroller-pretty"
              />
            </div>

            {/* Character warning markers for Social Platforms */}
            <div className="flex flex-wrap gap-4 pt-1 bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
              {Object.entries(charLimits).map(([key, limit]) => {
                const current = input.length;
                const isOver = current > limit;
                let pct = Math.min((current / limit) * 100, 100);
                
                return (
                  <div key={key} className="flex-1 min-w-[120px]">
                    <div className="flex items-center justify-between mb-1 text-[9.5px] font-black uppercase tracking-wider">
                      <span className="text-zinc-400">{key}:</span>
                      <span className={isOver ? 'text-red-500' : 'text-zinc-650'}>
                        {current}/{limit}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-zinc-800'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={processText}
            disabled={loading || !input.trim()}
            className="w-full py-4.5 bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed rounded-xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md active:scale-[0.99] active:shadow-sm cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? (
              'Optimizando con IA Rioplatense...'
            ) : (
              'Optimizar con IA Rioplatense'
            )}
          </button>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl animate-in fade-in slide-in-from-top-3">
              <div className="flex gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-800">Hubo un problema al conectar con Gemini</p>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Preview Pane & Live Smartphone Simulator (Col: 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Platform Mockup Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.18em]">
                Previsualización en Vivo
              </span>
              <div className="flex gap-1">
                {[
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'twitter', label: 'X / Twitter' }
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setPreviewPlatform(plat.id as PreviewPlatform)}
                    className={`px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      previewPlatform === plat.id 
                        ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300' 
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Phone Shell Frame */}
            <div className="relative mx-auto max-w-[340px] bg-zinc-900 p-3 pb-4 rounded-[42px] border-4 border-zinc-800 shadow-2xl overflow-hidden">
              
              {/* Speaker & Camera notches */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-800 rounded-full z-40 flex items-center justify-center gap-1.5">
                <div className="w-10 h-1 bg-zinc-900 rounded-full" />
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
              </div>

              {/* Dynamic Screen Area */}
              <div className="bg-white rounded-[32px] pt-6 pb-2 min-h-[460px] text-zinc-900 overflow-hidden flex flex-col justify-between">
                
                {/* Mockup Top Status Bar */}
                <div className="px-5 py-1.5 flex justify-between items-center text-[10px] font-bold text-zinc-405 select-none bg-zinc-50">
                  <span>12:00</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-5 h-2.5 border border-zinc-350 rounded-sm p-[1px] flex items-center">
                      <div className="h-full w-3 bg-zinc-400 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Simulator Feeds Body */}
                <div className="flex-1 overflow-y-auto max-h-[355px] scroller-pretty px-4 py-3 text-left">
                  
                  {loading && (
                    <div className="space-y-4 animate-pulse py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-3 w-28 bg-zinc-100 rounded" />
                          <div className="h-2 w-16 bg-zinc-100 rounded" />
                        </div>
                      </div>
                      <div className="h-40 bg-zinc-100 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-zinc-100 rounded animate-pulse" />
                      </div>
                    </div>
                  )}

                  {!loading && (
                    <>
                      {/* INSTAGRAM SIMULATOR */}
                      {previewPlatform === 'instagram' && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          {/* IG Header */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-[1.5px]">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                  <div className="w-full h-full rounded-full bg-zinc-105 flex items-center justify-center text-zinc-400">
                                    <User size={14} className="text-zinc-650" />
                                  </div>
                                </div>
                              </div>
                              <div className="leading-none">
                                <p className="font-semibold text-zinc-900 text-[11px]">tu_cuenta</p>
                                <p className="text-[9px] text-zinc-400">Buenos Aires, Argentina</p>
                              </div>
                            </div>
                            <MoreHorizontal size={14} className="text-zinc-400" />
                          </div>

                          {/* IG Image Card simulation representing featured graphic */}
                          <div className="w-full aspect-square bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-lg p-5 flex flex-col justify-between text-white relative shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-black/30 px-2 py-0.5 rounded-full border border-white/5">IG_POST</span>
                              <Sparkles size={11} className="text-yellow-400" />
                            </div>
                            
                            <div className="max-h-[140px] overflow-hidden">
                              <p className="text-[12.5px] font-black leading-tight tracking-tight uppercase line-clamp-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-105 via-white to-zinc-200">
                                {input ? input.slice(0, 100) + '...' : 'Tu diseño gráfico de post'}
                              </p>
                            </div>

                            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[7px] font-mono tracking-widest text-zinc-400 uppercase">
                              <span>@tu_cuenta</span>
                              <span>Estudio.Modular</span>
                            </div>
                          </div>

                          {/* IG Actions bar */}
                          <div className="flex justify-between items-center text-zinc-500 py-1">
                            <div className="flex gap-3">
                              <button 
                                type="button"
                                onClick={() => setLikedMockPost(!likedMockPost)} 
                                className="transition-transform active:scale-125 focus:outline-none cursor-pointer"
                              >
                                <Heart size={18} className={likedMockPost ? "fill-red-550 text-red-500 font-bold" : "text-zinc-700"} />
                              </button>
                              <MessageCircle size={18} className="text-zinc-700" />
                              <Send size={18} className="text-zinc-700 -rotate-12" />
                            </div>
                            <button 
                              type="button"
                              onClick={() => setSavedMockPost(!savedMockPost)} 
                              className="transition-transform active:scale-125 focus:outline-none cursor-pointer"
                            >
                              <Bookmark size={18} className={savedMockPost ? "fill-black text-black" : "text-zinc-700"} />
                            </button>
                          </div>

                          {/* IG Likes Count */}
                          <p className="text-[10px] font-black text-zinc-900">
                            Le gusta a {likedMockPost ? '146' : '145'} personas
                          </p>

                          {/* IG Caption Box */}
                          <div className="text-[11px] leading-relaxed text-zinc-800">
                            <span className="font-semibold text-zinc-900 mr-1.5 text-[11px]">tu_cuenta</span>
                            <span className="whitespace-pre-wrap">
                              {showFullCaption || previewText.length < 130 
                                ? previewText 
                                : `${previewText.slice(0, 130)}...`}
                            </span>
                            {previewText.length >= 130 && (
                              <button 
                                type="button"
                                onClick={() => setShowFullCaption(!showFullCaption)}
                                className="block text-zinc-400 font-bold text-[9.5px] uppercase tracking-wider mt-1 hover:text-black focus:outline-none cursor-pointer"
                              >
                                {showFullCaption ? 'Ver menos' : 'Ver más...'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* LINKEDIN SIMULATOR */}
                      {previewPlatform === 'linkedin' && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          {/* LinkedIn Author */}
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center border border-zinc-200 shrink-0">
                              <User size={16} />
                            </div>
                            <div className="leading-tight">
                              <p className="font-bold text-zinc-900 text-[11px] flex items-center gap-1">
                                Tu Nombre Profesional
                                <span className="text-[8.5px] font-bold text-zinc-400">• 1º</span>
                              </p>
                              <p className="text-[8.5px] text-zinc-400 truncate max-w-[190px]">Estratega de Contenidos & Creador de Inteligencia</p>
                              <p className="text-[8px] text-zinc-405 flex items-center gap-1 mt-0.5">1 h • Editado • 🌐</p>
                            </div>
                          </div>

                          {/* LinkedIn Body Text */}
                          <div className="text-[11.5px] leading-relaxed text-zinc-800 whitespace-pre-wrap border-l-2 border-zinc-200/50 pl-2">
                            {previewText}
                          </div>

                          {/* Connections reactions count */}
                          <div className="flex items-center justify-between text-[8px] text-zinc-400 border-b border-zinc-100 pb-2 pt-1 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              👍🏽❤️👏🏽 {likedMockPost ? '47' : '46'} recomendaciones
                            </span>
                            <span>12 comentarios</span>
                          </div>

                          {/* LinkedIn Action Bar */}
                          <div className="grid grid-cols-4 gap-1 text-[8.5px] text-zinc-500 font-bold text-center border-t border-zinc-50 pt-1">
                            <button 
                              type="button"
                              onClick={() => setLikedMockPost(!likedMockPost)} 
                              className={`flex items-center justify-center gap-1 py-1 rounded transition-colors cursor-pointer ${likedMockPost ? 'text-blue-600 bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-zinc-50'}`}
                            >
                              <ThumbsUp size={11} /> Recomendar
                            </button>
                            <div className="flex items-center justify-center gap-1 py-1 rounded hover:bg-zinc-50 cursor-pointer">
                              <MessageSquare size={11} /> Comentar
                            </div>
                            <button 
                              type="button"
                              onClick={() => setRepostedMockPost(!repostedMockPost)}
                              className={`flex items-center justify-center gap-1 py-1 rounded transition-colors cursor-pointer ${repostedMockPost ? 'text-green-600 bg-green-50/50 hover:bg-green-50' : 'hover:bg-zinc-50'}`}
                            >
                              <Repeat size={11} /> Compartir
                            </button>
                            <div className="flex items-center justify-center gap-1 py-1 rounded hover:bg-zinc-50 cursor-pointer">
                              <Send size={11} className="-rotate-12" /> Enviar
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TWITTER / X SIMULATOR */}
                      {previewPlatform === 'twitter' && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          {/* Twitter Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 font-black text-xs">
                                X
                              </div>
                              <div className="leading-tight">
                                <p className="font-bold text-zinc-900 text-[11.5px] flex items-center gap-1">
                                  Tu Perfil
                                  <span className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white">✓</span>
                                </p>
                                <p className="text-[9.5px] text-zinc-400">@tu_cuenta</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono bg-zinc-50 px-2 py-0.5 rounded text-zinc-400 border border-zinc-100">THREAD</span>
                          </div>

                          {/* Twitter text body */}
                          <div className="text-[12px] leading-relaxed text-zinc-900 whitespace-pre-wrap">
                            {previewText}
                          </div>

                          {/* Character limit warning indicator for Twitter specifically */}
                          {previewText.length > 280 && (
                            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 text-[9px] leading-tight font-black uppercase tracking-wider">
                              <AlertTriangle size={13} className="text-yellow-600 shrink-0" />
                              <span>Excede los 280 caracteres recomendados en X ({previewText.length}/280)</span>
                            </div>
                          )}

                          {/* Twitter Time */}
                          <div className="text-[9px] text-zinc-400 border-b border-zinc-100 pb-2">
                            12:00 PM · 11 jun. 2026 · <span className="font-bold text-zinc-650">3,4K</span> reproducciones
                          </div>

                          {/* Twitter Stat meters */}
                          <div className="flex gap-4 text-[9px] text-zinc-400 py-1 border-b border-zinc-100 uppercase font-bold tracking-wider">
                            <span><strong className="text-zinc-800">{repostedMockPost ? '12.5K' : '12.4K'}</strong> Reposts</span>
                            <span><strong className="text-zinc-800">{likedMockPost ? '456' : '455'}</strong> Me gusta</span>
                          </div>

                          {/* Actions row */}
                          <div className="grid grid-cols-4 text-center py-1 text-zinc-450 hover:text-zinc-900">
                            <div className="flex justify-center items-center py-1 hover:bg-zinc-50 rounded cursor-pointer"><MessageCircle size={13} /></div>
                            <button 
                              type="button"
                              onClick={() => setRepostedMockPost(!repostedMockPost)} 
                              className={`flex justify-center items-center py-1 rounded transition-all focus:outline-none cursor-pointer ${repostedMockPost ? 'text-green-500' : ''}`}
                            >
                              <Repeat size={13} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setLikedMockPost(!likedMockPost)} 
                              className={`flex justify-center items-center py-1 rounded transition-all focus:outline-none cursor-pointer ${likedMockPost ? 'text-red-550' : ''}`}
                            >
                              <Heart size={13} className={likedMockPost ? "fill-red-500 text-red-500" : ""} />
                            </button>
                            <div className="flex justify-center items-center py-1 hover:bg-zinc-50 rounded cursor-pointer"><Share2 size={13} /></div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>

                {/* Mockup bottom home bar */}
                <div className="w-full pt-1 flex justify-center bg-zinc-50 select-none">
                  <div className="w-28 h-1 bg-zinc-400 rounded-full mb-1" />
                </div>

              </div>

            </div>

            {/* Evaluation Tools: Variant switcher, Semaphore and Hashtags */}
            {variantA && !loading && (
              <div className="space-y-4 pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-4 duration-300">
                
                {/* Variant Selector Tabs */}
                {variantB && (
                  <div className="flex bg-zinc-105 p-1 rounded-xl border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => { setSelectedVariant('A'); setOutput(variantA); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        selectedVariant === 'A' ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      🎯 Propuesta A (Directo)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedVariant('B'); setOutput(variantB); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        selectedVariant === 'B' ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      ✨ Propuesta B (Foco Profesional)
                    </button>
                  </div>
                )}

                {/* Instant Actions */}
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    className="flex-1 py-3 bg-zinc-950 text-white hover:bg-zinc-850 rounded-lg text-[10.5px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={13} />}
                    {copied ? '¡Propuesta Copiada!' : `Copiar Propuesta ${selectedVariant}`}
                  </button>
                </div>

                {/* 📊 MOBILE READABILITY SEMAPHORE */}
                {readability && (
                  <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-xl text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-600 flex items-center gap-1.5 font-sans">
                        📊 Semáforo de Lectura en Móvil
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          readability.level === 'green' ? 'bg-emerald-500' :
                          readability.level === 'yellow' ? 'bg-amber-400' : 'bg-rose-500'
                        } animate-pulse`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider font-sans ${
                          readability.level === 'green' ? 'text-emerald-600' :
                          readability.level === 'yellow' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {readability.score} pts ({
                            readability.level === 'green' ? 'Excelente' :
                            readability.level === 'yellow' ? 'Atención' : 'Crítico'
                          })
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 leading-relaxed font-mono">
                        {readability.feedback}
                      </p>
                    </div>
                    {/* Visual bar meter */}
                    <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          readability.level === 'green' ? 'bg-emerald-500' :
                          readability.level === 'yellow' ? 'bg-amber-405' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${readability.score}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* #️⃣ AUTO-SUGERIDOR DE HASHTAGS CONTEXTUALES */}
                {suggestedHashtags && suggestedHashtags.length > 0 && (
                  <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-xl text-left space-y-2 font-sans">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-650 flex items-center gap-1.5 font-sans">
                      #️⃣ Hashtags Sugeridos
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestedHashtags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-mono rounded-md transition-colors"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                    <p className="text-[9px] text-zinc-400 font-mono italic">Seleccionados automáticamente según el contexto de tu post.</p>
                  </div>
                )}

                {/* Quality Checklist fallback */}
                <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-xl text-left">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-200 pb-2">
                    <span className="text-[9.5px] font-black tracking-widest uppercase text-zinc-650 flex items-center gap-1 font-sans">
                      <Sparkles size={11} className="text-zinc-650" /> Checklist de Calidad
                    </span>
                    <span className="text-[9px] font-bold text-green-600 font-mono">100% OK</span>
                  </div>

                  <ul className="space-y-2 text-xs text-zinc-500 leading-normal font-mono">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold shrink-0">✓</span>
                      <span><strong>Voseo Rioplatense:</strong> Español natural adaptado con total fluidez.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold shrink-0">✓</span>
                      <span><strong>Antilectura IA:</strong> Sin clichés repetitivos o introducciones robóticas.</span>
                    </li>
                  </ul>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* GRAMMAR REPORTS (Full wide container below if available) */}
      {output && report && !loading && mode === 'grammar' && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
        >
          {/* Changes Panel */}
          <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-xl relative shadow-sm">
            <div className="absolute top-4 right-4 text-zinc-400 font-black font-mono text-[9px] uppercase tracking-widest">
              Reporte de Estilo
            </div>
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-250 pb-3">
              <CheckCircle2 size={16} className="text-zinc-650" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">
                Cambios realizados en gramática:
              </p>
            </div>
            <ul className="space-y-3.5 text-xs font-mono text-zinc-600">
              {report.corrections && report.corrections.length > 0 ? (
                report.corrections.map((c, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="text-zinc-400 font-bold shrink-0 mt-0.5">•</span> 
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))
              ) : (
                <li className="flex gap-2.5 items-start">
                  <span className="text-zinc-400 font-bold shrink-0 mt-0.5">•</span> 
                  <span className="leading-relaxed text-zinc-400 italic">No se detectaron errores de ortografía de gravedad; se optimizó el estilo general.</span>
                </li>
              )}
            </ul>
          </div>

          {/* Advice/Tips Panel */}
          <div className="bg-zinc-950 text-white p-6 rounded-xl relative shadow-sm border border-black">
            <div className="absolute top-4 right-4 text-zinc-700 font-black font-mono text-[9px] uppercase tracking-widest">
              Redacción Humana
            </div>
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-805 pb-3">
              <Sparkles size={16} className="text-zinc-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-200">
                Sugerencias de mejora para vos:
              </p>
            </div>
            <ul className="space-y-3.5 text-xs font-mono text-zinc-300">
              {report.tips && report.tips.length > 0 ? (
                report.tips.map((t, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="text-yellow-400 leading-none shrink-0 font-bold">›</span> 
                    <span className="leading-relaxed italic">{t}</span>
                  </li>
                ))
              ) : (
                <li className="flex gap-2.5 items-start">
                  <span className="text-zinc-450 font-bold shrink-0 mt-0.5">›</span> 
                  <span className="leading-relaxed text-zinc-400 italic">Seguí escribiendo con tu estilo rioplatense personal para lograr mayor autenticidad.</span>
                </li>
              )}
            </ul>
          </div>
        </motion.div>
      )}

    </div>
  );
}
