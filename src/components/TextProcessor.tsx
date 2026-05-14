import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ArrowUp, ArrowDown, Clock } from 'lucide-react';

export default function TextProcessor() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('hub-util-text') || '';
    } catch {
      return '';
    }
  });
  const [copied, setCopied] = useState(false);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Procesador de Texto</h2>
        <div className="flex gap-1.5 transition-opacity">
          <button 
            onClick={capitalize}
            title="Primera letra mayúscula"
            className="px-2 py-1 bg-gray-50 border rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Aa
          </button>
          <button 
            onClick={cleanSpaces}
            title="Limpiar espacios extra"
            className="px-2 py-1 bg-gray-50 border rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Fix
          </button>
          <button 
            onClick={downloadTxt}
            title="Descargar como .txt"
            className="px-2 py-1 bg-gray-50 border rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            TXT
          </button>
          <button 
            onClick={toUpperCase}
            title="Mayúsculas"
            className="p-1.5 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
          >
            <ArrowUp size={14} className="text-gray-600" />
          </button>
          <button 
            onClick={toLowerCase}
            title="Minúsculas"
            className="p-1.5 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
          >
            <ArrowDown size={14} className="text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-100 mx-1" />
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-[10px] font-bold uppercase hover:bg-gray-800 transition-all shadow-sm"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Listo' : 'Copiar'}
          </button>
          <button 
            onClick={clearText}
            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Empieza a escribir aquí..."
        spellCheck="false"
        className="w-full h-64 md:h-80 lg:h-96 resize-none border-none outline-none text-base text-gray-700 placeholder-gray-200 leading-relaxed font-sans mb-4"
      />

      <div className="flex justify-between items-center pt-4 border-t border-gray-50 text-[10px] font-bold uppercase tracking-tighter text-gray-400">
        <div className="flex gap-4 items-center">
          <span>Palabras: <span className="text-gray-900">{wordCount}</span></span>
          <span>Caracteres: <span className="text-gray-900">{charCount}</span></span>
          <div className="flex items-center gap-1 border-l pl-4">
            <Clock size={10} />
            <span>Lectura: <span className="text-gray-900">~{readingTime} min</span></span>
          </div>
        </div>
        <div className="italic opacity-50 tracking-widest flex items-center gap-1">
          <div className="w-1 h-1 bg-green-500 rounded-full" />
          Auto-saved
        </div>
      </div>
    </div>
  );
}
