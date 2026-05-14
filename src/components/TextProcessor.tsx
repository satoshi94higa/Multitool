import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ArrowUp, ArrowDown, Clock, Eye, Edit3 } from 'lucide-react';
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
    <div className="flex flex-col h-full" id="text-processor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Editor de Nota Central</h2>
        <div className="flex flex-wrap gap-1 transition-opacity">
          <button 
            onClick={capitalize}
            title="Capitalizar"
            className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[9px] font-black text-gray-400 hover:text-black hover:bg-gray-100 transition-colors uppercase"
          >
            Aa
          </button>
          <button 
            onClick={cleanSpaces}
            title="Llimpiar espacios"
            className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[9px] font-black text-gray-400 hover:text-black hover:bg-gray-100 transition-colors uppercase"
          >
            Fix
          </button>
          <div className="flex bg-gray-50 border border-gray-100 rounded p-0.5">
            <button 
              onClick={toUpperCase}
              className="p-1 hover:bg-white rounded transition-all text-gray-400 hover:text-black"
            >
              <ArrowUp size={12} />
            </button>
            <button 
              onClick={toLowerCase}
              className="p-1 hover:bg-white rounded transition-all text-gray-400 hover:text-black"
            >
              <ArrowDown size={12} />
            </button>
          </div>
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded text-[9px] font-black uppercase transition-all shadow-sm ${
              isPreview ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black'
            }`}
          >
            {isPreview ? <Edit3 size={11} /> : <Eye size={11} />}
            <span>{isPreview ? 'Editar' : 'Vista'}</span>
          </button>
          <button 
            onClick={clearText}
            className="p-1.5 bg-red-50 text-red-400 border border-red-50 rounded hover:bg-red-100 hover:text-red-600 transition-all shadow-sm"
          >
            <Trash2 size={12} />
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white rounded text-[9px] font-black uppercase hover:bg-black transition-all shadow-sm"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Listo' : 'Copiar'}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] mb-4 relative">
        {isPreview ? (
          <div className="absolute inset-0 overflow-auto p-4 bg-gray-50/20 rounded-xl border border-gray-50 markdown-body prose prose-sm max-w-none scrollbar-hide">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Empieza a escribir..."
            spellCheck="false"
            className="w-full h-full resize-none border-none outline-none text-sm text-gray-700 placeholder-gray-200 leading-relaxed font-sans scrollbar-hide"
          />
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
        <div className="flex gap-4 items-center">
          <div className="flex gap-3">
            <span>W: <span className="text-gray-900 font-bold">{wordCount}</span></span>
            <span>C: <span className="text-gray-900 font-bold">{charCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-gray-100 pl-4 h-3">
            <Clock size={10} />
            <span>~{readingTime} min</span>
          </div>
        </div>
        <button 
          onClick={downloadTxt}
          className="text-gray-300 hover:text-black transition-colors"
        >
          DESCARGAR .TXT
        </button>
      </div>
    </div>

  );
}
