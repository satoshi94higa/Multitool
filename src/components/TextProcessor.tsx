import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Trash2, ArrowUp, ArrowDown, Clock, Eye, SquarePen, Sparkles, Loader2, Bold, Strikethrough, Type, List } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TextProcessor() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('hub-util-text') || '';
    } catch {
      return '';
    }
  });
  const [copied, setCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    const handleSetText = (e: CustomEvent<{ text: string, append?: boolean }>) => {
      if (e.detail.append) {
        setText(prev => prev ? prev + '\n\n' + e.detail.text : e.detail.text);
      } else {
        setText(e.detail.text);
      }
      // Automáticamente cambiar a preview si estamos enviando algo con formato (opcional)
      // setIsPreview(true);
    };

    window.addEventListener('app-set-text' as any, handleSetText);
    return () => window.removeEventListener('app-set-text' as any, handleSetText);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hub-util-text', text);
    } catch (e) {
      console.warn("Storage full or unavailable");
    }
  }, [text]);

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  const toUpperCase = () => setText(text.toUpperCase());
  const toLowerCase = () => setText(text.toLowerCase());
  
  const applyTransform = (prefix: string, suffix: string = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selection = text.substring(start, end);
    
    if (selection) {
      const newText = text.substring(0, start) + prefix + selection + suffix + text.substring(end);
      setText(newText);
    } else {
      // If no selection, apply to entire text or just wrap current cursor
      setText(prefix + text + suffix);
    }
  };

  const toSmallCaps = () => {
    // Plain text small caps is usually simulated with uppercase or just styling.
    // For text processor, we'll convert selection to uppercase as a simple surrogate.
    const el = textareaRef.current;
    if (!el) {
      setText(text.toUpperCase());
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end) {
      const selection = text.substring(start, end);
      setText(text.substring(0, start) + selection.toUpperCase() + text.substring(end));
    } else {
      setText(text.toUpperCase());
    }
  };

  const runAiOp = async (type: 'summarize' | 'spelling' | 'translate' | 'bullets') => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setNotification(null);
    
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompts = {
        summarize: "Resume el siguiente texto de forma concisa pero manteniendo los puntos clave:",
        spelling: "Corrige la ortografía y gramática del siguiente texto. Mantén el tono original. Devuelve SOLO el texto corregido:",
        translate: "Traduce el siguiente texto al inglés de forma natural:",
        bullets: "Transforma el siguiente texto en una lista de bullet points clara y organizada:"
      };

      const result = await model.generateContent(`${prompts[type]}\n\n"${text}"`);
      const response = await result.response;
      const resultText = response.text().trim();
      
      if (type === 'spelling') {
        if (resultText === text.trim()) {
          setNotification("No se encontraron errores ortográficos.");
        } else {
          setNotification("Ortografía corregida. Revisa los cambios.");
        }
      } else {
        setNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} completado.`);
      }
      
      setText(resultText);
    } catch (error) {
      console.error(error);
      setNotification("Error al procesar con IA.");
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const capitalize = () => {
    const capitalized = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
    setText(capitalized);
  };
  const cleanSpaces = () => {
    const cleaned = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
    setText(cleaned);
  };
  const downloadTxt = () => {
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `nota-${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  const clearText = () => {
    if (confirm('¿Borrar todo el texto?')) setText('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-transparent" id="text-processor">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Procesador de Texto</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">DATOS.PROCESANDO</span>
        </div>
        
        <div className="flex flex-wrap gap-2 transition-opacity">
          <div className="flex bg-zinc-50 p-1 rounded-none border border-zinc-200">
            <button 
              onClick={() => applyTransform('**')}
              title="Negrita"
              className="p-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <Bold size={12} />
            </button>
            <button 
              onClick={() => applyTransform('~~')}
              title="Tachado"
              className="p-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <Strikethrough size={12} />
            </button>
            <button 
              onClick={toSmallCaps}
              title="Versalita (Mayúsculas)"
              className="p-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <Type size={12} />
            </button>
            <div className="w-px h-3 bg-zinc-200 mx-1 self-center" />
            <button 
              onClick={capitalize}
              title="Mayúscula primera letra"
              className="px-2 py-1 text-[9px] font-black text-zinc-500 hover:text-black transition-colors"
            >
              Aa
            </button>
            <div className="w-px h-3 bg-zinc-200 mx-1 self-center" />
            <button 
              onClick={downloadTxt}
              title="Descargar como .txt"
              className="px-2 py-1 text-[9px] font-black text-zinc-500 hover:text-black transition-colors"
            >
              TXT
            </button>
          </div>

          <div className="flex bg-zinc-50 p-1 rounded-none border border-zinc-200">
             <button 
              onClick={toUpperCase}
              title="MAYÚSCULAS"
              className="p-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowUp size={12} />
            </button>
            <button 
              onClick={toLowerCase}
              title="minúsculas"
              className="p-1.5 text-zinc-500 hover:text-black transition-colors"
            >
              <ArrowDown size={12} />
            </button>
          </div>

          <button 
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? "Editar texto" : "Vista previa con formato"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[9px] font-black uppercase transition-all border-2 ${
              isPreview ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 text-zinc-400 hover:text-black hover:border-black'
            }`}
          >
            {isPreview ? <SquarePen size={12} /> : <Eye size={12} />}
            <span>{isPreview ? 'Código' : 'Vista'}</span>
          </button>

          <button 
            onClick={clearText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 border border-red-100 rounded-none text-[9px] font-black uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold"
          >
            <Trash2 size={12} />
            <span>BORRAR TODO</span>
          </button>

          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-none text-[9px] font-black uppercase hover:bg-zinc-800 transition-all shadow-xl"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>
      
      {isPreview ? (
        <div className="flex-1 min-h-[400px] overflow-auto p-12 bg-white border-2 border-zinc-100 rounded-none markdown-body prose prose-lg max-w-none mb-6 scrollbar-hide text-zinc-800 shadow-inner relative">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="animate-spin text-black" size={32} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-[400px] bg-zinc-50 border-2 border-black/5 rounded-none p-8 mb-6 focus-within:border-black transition-colors relative group">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe o pega el texto aquí..."
            spellCheck="false"
            className="flex-1 w-full resize-none border-none outline-none text-black placeholder-zinc-300 leading-relaxed font-mono text-base bg-transparent scrollbar-hide"
          />
          
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 className="animate-spin text-black" size={32} />
            </div>
          )}

          {notification && (
            <div className="absolute top-4 right-8 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 z-30">
              {notification}
            </div>
          )}
          
          {text.length > 20 && !loading && (
            <div className="absolute bottom-6 left-8 right-8 flex flex-wrap gap-2 py-4 border-t border-black/5 bg-zinc-50/80 backdrop-blur-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 w-full mb-1">Operaciones Sugeridas:</span>
              <button 
                onClick={() => runAiOp('summarize')}
                className="px-3 py-1 bg-white border border-zinc-200 text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 group"
              >
                <Sparkles size={10} className="text-zinc-400 group-hover:text-white" />
                Resumir
              </button>
              <button 
                onClick={() => runAiOp('spelling')}
                className="px-3 py-1 bg-white border border-zinc-200 text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 group"
              >
                <Sparkles size={10} className="text-zinc-400 group-hover:text-white" />
                Corregir Ortografía
              </button>
              <button 
                onClick={() => runAiOp('translate')}
                className="px-3 py-1 bg-white border border-zinc-200 text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 group"
              >
                <Sparkles size={10} className="text-zinc-400 group-hover:text-white" />
                Traducir a Inglés
              </button>
              <button 
                onClick={() => runAiOp('bullets')}
                className="px-3 py-1 bg-white border border-zinc-200 text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 group"
              >
                <List size={10} className="text-zinc-400 group-hover:text-white" />
                Crear Bullet Points
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 pt-8 border-t border-zinc-100 text-[9px] font-black uppercase tracking-widest text-zinc-400">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="opacity-60">Palabras:</span>
            <span className="text-zinc-600 font-mono italic">{wordCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-60">Caracteres:</span>
            <span className="text-zinc-600 font-mono italic">{charCount}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-zinc-100 pl-6">
            <Clock size={10} className="opacity-60" />
            <span className="opacity-60">Lectura:</span>
            <span className="text-zinc-600 font-mono italic">{readingTime}m</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-40">
           <div className="w-1 h-3 bg-black" />
           <span className="tracking-[0.3em] font-mono">SISTEMA.BUFFER_ACTIVO</span>
        </div>
      </div>
    </div>
  );
}
