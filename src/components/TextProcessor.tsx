import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Trash2, Sparkles, Loader2, 
  Bold, Strikethrough, Type, List, ListOrdered, Download, Italic, FileText,
  MessageSquare
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

export default function TextProcessor() {
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[] | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
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
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-10 font-sans leading-relaxed text-zinc-900',
      },
    },
  });

  const runAiOp = async (type: string) => {
    if (!editor || !editor.getText().trim() || loading) return;
    setLoading(true);
    setNotification(null);
    setCorrections(null);
    
    const plainText = editor.getText();
    
    try {
      const response = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text: plainText }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      
      if (type === 'spelling') {
        try {
          const cleanJson = data.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          editor.commands.setContent(parsed.text);
          setCorrections(parsed.changes || []);
          setNotification("Ortografía corregida.");
        } catch (e) {
          editor.commands.setContent(data.text);
          setNotification("Corrección aplicada.");
        }
      } else {
        editor.commands.setContent(data.text.trim());
        setNotification("Proceso completado.");
      }
    } catch (error) {
      setNotification("Error de conexión con IA.");
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

  const copyMarkdownToClipboard = () => {
    if (!editor) return;
    try {
      // @ts-ignore - tiptap-markdown adds storage.markdown.getMarkdown to editor
      const markdown = editor.storage?.markdown?.getMarkdown?.() || editor.getText();
      navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch (err) {
      console.error(err);
      setNotification("Error al copiar Markdown.");
    }
  };

  const copyWhatsAppToClipboard = () => {
    if (!editor) return;
    try {
      // @ts-ignore - tiptap-markdown adds storage.markdown.getMarkdown to editor
      let text = editor.storage?.markdown?.getMarkdown?.() || editor.getText();
      
      // Basic Markdown to WhatsApp conversion
      // Triple asterisks for bold + italic
      text = text.replace(/\*\*\*(.*?)\*\*\*/g, '*_$1_*');
      // Double asterisks for bold
      text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
      // Single asterisks for italic (handle carefully to avoid bold collision)
      // We look for asterisks that are not preceded or followed by another asterisk
      text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '_$1_');
      // Single underscores for italic (standard markdown)
      text = text.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '_$1_');
      // Double tilde for strikethrough
      text = text.replace(/~~(.*?)~~/g, '~$1~');
      
      navigator.clipboard.writeText(text);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } catch (err) {
      console.error(err);
      setNotification("Error al copiar para WhatsApp.");
    }
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
            <button onClick={copyMarkdownToClipboard} className="flex items-center gap-2 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm">
              {copiedMd ? <Check size={12} /> : <FileText size={12} />}
              {copiedMd ? 'Copiado MD' : 'Copiar MD'}
            </button>
            <button onClick={copyWhatsAppToClipboard} className="flex items-center gap-2 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm">
              {copiedWa ? <Check size={12} /> : <MessageSquare size={12} />}
              {copiedWa ? 'Copiado WA' : 'Copiar WA'}
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
      <div className="flex-1 min-h-[500px] flex flex-col relative group">
        <div className="flex-1 flex flex-col bg-zinc-50 border-2 border-black/10 focus-within:border-black transition-all relative overflow-hidden">
          <EditorContent editor={editor} className="flex-1 overflow-auto bg-transparent prose-zinc" />
          
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-black" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Procesando con IA...</span>
              </div>
            </div>
          )}

          {notification && (
            <div className="absolute top-4 right-8 bg-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest z-50 animate-in fade-in slide-in-from-top-4 shadow-2xl">
              {notification}
            </div>
          )}

          {corrections && corrections.length > 0 && !loading && (
            <div className="absolute top-8 right-8 w-64 bg-white border-2 border-black p-5 shadow-[10px_10px_0px_black] z-50 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                <span className="text-[10px] font-black uppercase tracking-tighter">Cambios Sugeridos</span>
                <button onClick={() => setCorrections(null)} className="text-zinc-400 hover:text-black">
                  <Trash2 size={14} />
                </button>
              </div>
              <ul className="space-y-3">
                {corrections.map((c, i) => (
                  <li key={i} className="text-[10px] leading-tight text-zinc-600 border-l-2 border-zinc-200 pl-3">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Floating Actions */}
          <div className="absolute bottom-8 left-10 flex gap-4 items-center">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Magic IA</span>
            <div className="flex gap-2">
              <button onClick={() => runAiOp('summarize')} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#ccc]">
                <Sparkles size={12} /> Resumen
              </button>
              <button onClick={() => runAiOp('spelling')} className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_black]">
                Ortografía
              </button>
              <button onClick={() => runAiOp('bullets')} className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_black]">
                Puntos
              </button>
            </div>
          </div>
        </div>
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
