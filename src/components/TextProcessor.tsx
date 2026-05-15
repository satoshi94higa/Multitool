import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ArrowUp, ArrowDown, Clock, Eye, SquarePen } from 'lucide-react';
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
              onClick={capitalize}
              title="Mayúscula primera letra"
              className="px-2 py-1 text-[9px] font-black text-zinc-500 hover:text-black transition-colors"
            >
              Aa
            </button>
            <div className="w-px h-3 bg-zinc-200 mx-1 self-center" />
            <button 
              onClick={cleanSpaces}
              title="Limpiar espacios extra"
              className="px-2 py-1 text-[9px] font-black text-zinc-500 hover:text-black transition-colors"
            >
              FIX
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-300 border border-zinc-100 rounded-none text-[9px] font-black uppercase hover:bg-black hover:text-white hover:border-black transition-all"
          >
            <Trash2 size={12} />
            <span>LIMPIAR</span>
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
        <div className="flex-1 min-h-[300px] overflow-auto p-8 bg-zinc-50 border-2 border-zinc-100 rounded-none markdown-body prose prose-sm max-w-none mb-6 scrollbar-hide text-zinc-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-[300px] bg-zinc-50 border-2 border-black/5 rounded-none p-6 mb-6 focus-within:border-black transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe o pega el texto aquí..."
            spellCheck="false"
            className="flex-1 w-full resize-none border-none outline-none text-black placeholder-zinc-300 leading-relaxed font-mono text-sm bg-transparent scrollbar-hide"
          />
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
