import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Trash2, Sparkles, Loader2, 
  Bold, Strikethrough, Type, List, ListOrdered, Download, Italic
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

import { processWithGemini } from '../services/geminiService';

export default function TextProcessor() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[] | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'result'>('editor');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Empieza a escribir aquí...',
      }),
    ],
    content: localStorage.getItem('hub-util-text-rich') || '',
    onUpdate: ({ editor }) => {
      localStorage.setItem('hub-util-text-rich', editor.getHTML());
      localStorage.setItem('hub-util-text-plain', editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm md:prose-lg max-w-none focus:outline-none min-h-[400px] md:min-h-[500px] p-4 md:p-10 font-sans leading-relaxed text-zinc-900',
      },
    },
  });

  useEffect(() => {
    const handleSetText = (e: any) => {
      if (editor && e.detail) {
        if (e.detail.append) {
          const currentContent = editor.getText();
          editor.commands.setContent(currentContent + '\n\n' + e.detail.text);
        } else {
          editor.commands.setContent(e.detail.text);
        }
        setNotification("Texto recibido del editor.");
        setTimeout(() => setNotification(null), 3000);
      }
    };

    window.addEventListener('app-set-text', handleSetText);
    return () => window.removeEventListener('app-set-text', handleSetText);
  }, [editor]);

  const runAiOp = async (type: string) => {
    if (!editor || !editor.getText().trim() || loading) return;
    setLoading(true);
    setNotification(null);
    setCorrections(null);
    
    const plainText = editor.getText();
    
    try {
      const data = await processWithGemini({ type, text: plainText }, 'process');
      
      if (type === 'spelling' || type === 'style') {
        try {
          const cleanJson = data.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          if (type === 'spelling') {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setActiveTab('result');
            setNotification("Ortografía corregida.");
          } else {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setActiveTab('result');
            setNotification("Mejora de estilo lista.");
          }
        } catch (e) {
          setAiResult(data.text);
          setActiveTab('result');
          setNotification("Proceso completado.");
        }
      } else {
        setAiResult(data.text.trim());
        setActiveTab('result');
        setNotification("Proceso completado.");
      }
    } catch (error: any) {
      console.error('TextProcessor Error:', error);
      setNotification(error.message || "Error de conexión con IA.");
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const downloadTxt = () => {
    if (!editor) return;
    const element = document.createElement("a");
    const file = new Blob([editor.getText()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `nota-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText().trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const getCharCount = () => {
    if (!editor) return 0;
    return editor.getText().length;
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full space-y-4" id="text-processor">
      {/* Title */}
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start">
        Procesador de Texto
      </h1>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex bg-zinc-100 p-1">
            <button 
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 transition-colors ${editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}
              title="Negrita"
            >
              <Bold size={14} />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 transition-colors ${editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}
              title="Cursiva"
            >
              <Italic size={14} />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 transition-colors ${editor.isActive('strike') ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}
              title="Tachado"
            >
              <Strikethrough size={14} />
            </button>
            <div className="w-px h-6 bg-zinc-300 mx-1" />
            <button 
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 transition-colors ${editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}
              title="Lista de puntos"
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 transition-colors ${editor.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}
              title="Lista numerada"
            >
              <ListOrdered size={14} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar Texto'}
            </button>
            <button onClick={downloadTxt} className="flex items-center gap-2 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm">
              <Download size={12} /> Guardar
            </button>
            <button 
              onClick={() => { editor.commands.setContent(''); setCorrections(null); }} 
              className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-500 text-[9px] font-black uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold"
            >
              <Trash2 size={12} /> Borrar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[400px] md:min-h-[500px]">
        <div className="flex-1 flex flex-col bg-zinc-50 border-2 border-black/10 focus-within:border-black transition-all relative overflow-hidden group">
          <EditorContent editor={editor} className="flex-1 overflow-auto bg-transparent prose-zinc" />
          
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-black" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Procesando...</span>
              </div>
            </div>
          )}

          {notification && (
            <div className="absolute top-4 right-4 md:right-8 bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest z-50 animate-in fade-in slide-in-from-top-4 shadow-2xl">
              {notification}
            </div>
          )}

          {/* AI Floating Actions */}
          <div className="p-4 md:absolute md:bottom-8 md:left-10 flex flex-col gap-3 bg-white/90 md:bg-white/80 p-4 border border-black shadow-[4px_4px_0px_black] md:max-w-md z-30">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Magic IA</span>
              {aiResult && (
                <button 
                  onClick={() => setActiveTab(activeTab === 'editor' ? 'result' : 'editor')}
                  className="text-[8px] font-black uppercase bg-zinc-100 px-2 py-0.5 hover:bg-black hover:text-white transition-colors"
                >
                  {activeTab === 'editor' ? 'Ver Resultado' : 'Ver Original'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => runAiOp('summarize')} 
                className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase transition-all hover:bg-zinc-800"
              >
                <Sparkles size={10} /> Resumen
              </button>
              <button 
                onClick={() => runAiOp('simplify')} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:bg-zinc-50"
              >
                Simplificar
              </button>
              <button 
                onClick={() => runAiOp('keywords')} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:bg-zinc-50"
              >
                Puntos Clave
              </button>
              <button 
                onClick={() => runAiOp('style')} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:bg-zinc-50"
              >
                Estilo
              </button>
              <button 
                onClick={() => runAiOp('spelling')} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:bg-zinc-50"
              >
                Ortografía
              </button>
            </div>
          </div>
        </div>

        {/* AI Result Area (Conditional) */}
        {activeTab === 'result' && aiResult && (
          <div className="flex-1 flex flex-col bg-amber-50 border-2 border-black animate-in slide-in-from-right-4 relative">
            <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-amber-400" /> Resultado Magic IA
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    editor.commands.setContent(aiResult);
                    setActiveTab('editor');
                    setNotification("Aplicado al texto original");
                  }}
                  className="text-[9px] font-black uppercase bg-white text-black px-3 py-1 hover:bg-amber-100 transition-colors"
                >
                  Usar este texto
                </button>
                <button 
                  onClick={() => setActiveTab('editor')}
                  className="text-[9px] font-black uppercase bg-zinc-800 text-white px-3 py-1 hover:bg-zinc-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="p-6 md:p-10 prose prose-sm md:prose-lg max-w-none overflow-auto flex-1 font-sans text-zinc-900 leading-relaxed whitespace-pre-wrap">
              {aiResult}
            </div>
            <div className="p-4 border-t border-black/10 flex justify-between items-center">
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(aiResult);
                   setNotification("Copiado al portapapeles");
                   setTimeout(() => setNotification(null), 2000);
                 }}
                 className="flex items-center gap-2 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm bg-white"
               >
                 <Copy size={12} /> Copiar Resultado
               </button>
               <span className="text-[8px] font-bold text-zinc-400 uppercase italic">El texto original se mantiene intacto</span>
            </div>
          </div>
        )}

        {/* AI Corrections Panel */}
        {corrections && corrections.length > 0 && !loading && (
          <div className="w-full lg:w-72 bg-white border-2 border-black p-5 shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[10px_10px_0px_black] animate-in slide-in-from-right-4 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
              <span className="text-[10px] font-black uppercase tracking-tighter">Sugerencias Recientes</span>
              <button onClick={() => setCorrections(null)} className="text-zinc-400 hover:text-black hover:bg-zinc-50 p-1">
                <Trash2 size={14} />
              </button>
            </div>
            <ul className="space-y-4">
              {corrections.map((c, i) => (
                <li key={i} className="text-[10px] leading-relaxed text-zinc-600 border-l-2 border-black pl-4">
                  <span className="font-mono text-zinc-300 block mb-1">#{String(i + 1).padStart(2, '0')}</span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-zinc-100 italic text-[8px] text-zinc-300 uppercase tracking-widest">
              Las correcciones se aplican automáticamente al texto
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400 pt-4">
        <div className="flex gap-6">
          <span>Palabras: <span className="text-black">{getWordCount()}</span></span>
          <span>Caracteres: <span className="text-black">{getCharCount()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Auto-Guardado Local</span>
        </div>
      </div>
    </div>
  );
}
