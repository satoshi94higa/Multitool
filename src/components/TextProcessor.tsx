import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Trash2, Sparkles, Loader2, 
  Bold, Strikethrough, List, ListOrdered, Download, Italic,
  HelpCircle, CornerDownLeft, Undo2, Redo2, Maximize2, Minimize2, ChevronDown, Type, Palette
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

import { processWithGemini } from '../services/geminiService';

export default function TextProcessor() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[] | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  
  // Custom height states to satisfy either "scrollbar" or "auto-grow window"
  const [editorHeight, setEditorHeight] = useState<'fixed-md' | 'fixed-lg' | 'auto'>(() => {
    return (localStorage.getItem('hub-util-editor-height') as 'fixed-md' | 'fixed-lg' | 'auto') || 'fixed-md';
  });

  // Collapsible AI section to give users a fully focused layout when desired
  const [showAiConsole, setShowAiConsole] = useState<boolean>(() => {
    const saved = localStorage.getItem('hub-util-show-ai-console');
    return saved !== null ? saved === 'true' : true;
  });

  // Editor focus/zen mode
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Editor background themes (Classic White, Sepia Paper, Midnight Black)
  const [editorTheme, setEditorTheme] = useState<'classic' | 'sepia' | 'dark'>(() => {
    return (localStorage.getItem('hub-util-editor-theme') as 'classic' | 'sepia' | 'dark') || 'classic';
  });

  // Editor font size scale (Small, Medium, Large, Extra Large)
  const [editorSize, setEditorSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('hub-util-editor-size') as 'sm' | 'base' | 'lg' | 'xl') || 'base';
  });

  // Dropdown menus open state for flexible format downloading and copying
  const [openDropdown, setOpenDropdown] = useState<'export' | 'copy' | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Empieza a escribir aquí tu obra maestra...',
      }),
    ],
    content: localStorage.getItem('hub-util-text-rich') || '',
    onUpdate: ({ editor }) => {
      localStorage.setItem('hub-util-text-rich', editor.getHTML());
      localStorage.setItem('hub-util-text-plain', editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm md:prose-lg max-w-none focus:outline-none min-h-full p-6 md:p-8 font-sans leading-relaxed text-inherit',
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

  // Escape key support to exit focus/zen mode cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const changeEditorHeight = (val: 'fixed-md' | 'fixed-lg' | 'auto') => {
    setEditorHeight(val);
    localStorage.setItem('hub-util-editor-height', val);
  };

  const changeEditorTheme = (theme: 'classic' | 'sepia' | 'dark') => {
    setEditorTheme(theme);
    localStorage.setItem('hub-util-editor-theme', theme);
  };

  const changeEditorSize = (size: 'sm' | 'base' | 'lg' | 'xl') => {
    setEditorSize(size);
    localStorage.setItem('hub-util-editor-size', size);
  };

  const toggleAiConsole = () => {
    const nextState = !showAiConsole;
    setShowAiConsole(nextState);
    localStorage.setItem('hub-util-show-ai-console', String(nextState));
  };

  const runAiOp = async (type: string) => {
    if (!editor || !editor.getText().trim() || loading) return;
    setLoading(true);
    setNotification(null);
    setCorrections(null);
    
    const plainText = editor.getText();
    
    try {
      const data = await processWithGemini({ type, text: plainText }, 'process');
      
      if (type === 'spelling' || type === 'style' || type === 'grammar') {
        try {
          const cleanJson = data.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          if (type === 'spelling') {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setNotification("Ortografía corregida.");
          } else if (type === 'grammar') {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setNotification("Gramática y sintaxis corregidas.");
          } else if (type === 'style') {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setNotification("Mejora de estilo lista.");
          } else {
            setAiResult(parsed.text);
            setCorrections(parsed.changes || []);
            setNotification("Correcciones aplicadas.");
          }
        } catch (e) {
          setAiResult(data.text);
          setNotification("Proceso completado.");
        }
      } else {
        setAiResult(data.text.trim());
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

  // Convert rich text html to markdown seamlessly
  const convertHtmlToMarkdown = (html: string): string => {
    if (!html) return '';
    let md = html;

    // Headings
    md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
    
    // Lists
    md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<ul>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol>/gi, '\n');
    md = md.replace(/<\/ol>/gi, '\n');
    
    // Formatting tags
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
    md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
    md = md.replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~');
    
    // Paragraphs and breaks
    md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Strip rest of elements
    md = md.replace(/<[^>]+>/g, '');

    // standard HTML entities
    md = md.replace(/&nbsp;/g, ' ')
           .replace(/&amp;/g, '&')
           .replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>')
           .replace(/&quot;/g, '"');

    return md.trim();
  };

  const copyFormatted = (format: 'plain' | 'html' | 'markdown') => {
    if (!editor) return;
    let text = '';
    if (format === 'plain') {
      text = editor.getText();
    } else if (format === 'html') {
      text = editor.getHTML();
    } else if (format === 'markdown') {
      text = convertHtmlToMarkdown(editor.getHTML());
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setNotification(`Copiado como ${format.toUpperCase()}`);
    setTimeout(() => {
      setCopied(false);
      setNotification(null);
    }, 2000);
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
    setNotification("Archivo TXT guardado.");
    setTimeout(() => setNotification(null), 2500);
  };

  const downloadHtml = () => {
    if (!editor) return;
    const content = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Exportado - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 740px;
      margin: 40px auto;
      padding: 0 20px;
      background: #ffffff;
    }
    h1, h2, h3 {
      font-weight: 800;
      color: #000;
      line-height: 1.2;
      margin-top: 2em;
    }
    h1 { font-size: 2.2em; border-bottom: 2px solid #eaeaea; padding-bottom: 0.3em; }
    h2 { font-size: 1.65em; }
    p { margin: 1.2em 0; }
    ul, ol { padding-left: 2em; }
    li { margin: 0.5em 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    s { text-decoration: line-through; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([fullHtml], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `nota-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setNotification("Archivo HTML guardado.");
    setTimeout(() => setNotification(null), 2500);
  };

  const downloadMarkdown = () => {
    if (!editor) return;
    const content = convertHtmlToMarkdown(editor.getHTML());
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `nota-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setNotification("Archivo Markdown guardado.");
    setTimeout(() => setNotification(null), 2500);
  };

  const exportPdfOrPrint = () => {
    if (!editor) return;
    window.print();
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

  const getReadingTime = () => {
    const words = getWordCount();
    return Math.max(1, Math.ceil(words / 200));
  };

  const getParagraphCount = () => {
    if (!editor) return 0;
    const content = editor.getHTML();
    const matches = content.match(/<p>/g);
    return matches ? matches.length : 0;
  };

  const getThemeClasses = () => {
    if (editorTheme === 'sepia') return 'bg-[#FAF4E8] text-[#5D4E3E] border-[#5D4E3E]/10 shadow-[#5D4E3E]/5';
    if (editorTheme === 'dark') return 'bg-[#121214] text-[#E4E4E7] border-zinc-800 shadow-black/40';
    return 'bg-white text-zinc-900 border-zinc-200';
  };

  const getSizeClasses = () => {
    if (editorSize === 'sm') return 'text-sm';
    if (editorSize === 'lg') return 'text-lg';
    if (editorSize === 'xl') return 'text-xl';
    return 'text-base';
  };

  // Get CSS class matching the user selection for height
  const getEditorHeightClass = () => {
    if (editorHeight === 'auto') return 'h-auto min-h-[450px] md:min-h-[580px]';
    if (editorHeight === 'fixed-lg') return 'h-[600px] md:h-[780px]';
    return 'h-[420px] md:h-[550px]';
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full space-y-4" id="text-processor">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-2 gap-4 select-none">
        <h1 className="text-xl font-black uppercase tracking-tighter inline-block self-start">
          Procesador de Texto
        </h1>
        
        {/* Toggle AI Button right in the title area or toolbar */}
        <button 
          onClick={toggleAiConsole}
          className={`flex items-center gap-2 px-3 py-1.5 border-2 border-black text-[9px] font-black uppercase transition-all shadow-sm ${
            showAiConsole 
              ? 'bg-black text-white hover:bg-zinc-800' 
              : 'bg-amber-100 text-black hover:bg-amber-200'
          }`}
          title="Mostrar u ocultar la consola de comandos de Inteligencia Artificial"
        >
          <Sparkles size={11} className={showAiConsole ? 'text-amber-300 animate-spin-slow' : 'text-black'} />
          {showAiConsole ? 'Ocultar Consola IA' : 'Mostrar Consola IA'}
        </button>
      </div>

      {/* Toolbar & Preferences */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Editor commands */}
          <div className="flex bg-zinc-100 p-1 border border-zinc-200 h-9 items-center">
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

            <div className="w-px h-6 bg-zinc-300 mx-1" />

            {/* Undo and Redo system */}
            <button 
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 transition-colors hover:bg-zinc-200 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button 
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 transition-colors hover:bg-zinc-200 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* Visual Theme Selector (Section 1) */}
          <div className="flex items-center bg-zinc-100 p-1 border border-zinc-200 gap-1.5 h-9">
            <Palette size={12} className="text-zinc-400 ml-1.5" />
            <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 pr-1 select-none">
              Tono:
            </span>
            <button 
              onClick={() => changeEditorTheme('classic')}
              className={`w-4 h-4 rounded-full border border-black/20 bg-white transition-all ${editorTheme === 'classic' ? 'scale-110 ring-1 ring-black shadow-sm' : 'opacity-60 hover:opacity-100'}`}
              title="Lienzo Blanco (Día)"
            />
            <button 
              onClick={() => changeEditorTheme('sepia')}
              className={`w-4 h-4 rounded-full border border-orange-950/20 bg-[#FAF4E8] transition-all ${editorTheme === 'sepia' ? 'scale-110 ring-1 ring-orange-900 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
              title="Papel Sepia (Cálido)"
            />
            <button 
              onClick={() => changeEditorTheme('dark')}
              className={`w-4 h-4 rounded-full border border-white/10 bg-zinc-800 transition-all ${editorTheme === 'dark' ? 'scale-110 ring-1 ring-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
              title="Lienzo Oscuro (Noche)"
            />
          </div>

          {/* Typography Font Sizing (Section 1) */}
          <div className="flex items-center bg-zinc-100 p-1 border border-zinc-200 h-9 select-none">
            <Type size={12} className="text-zinc-400 ml-1.5" />
            <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 px-1.5">
              Letra:
            </span>
            <div className="flex gap-1 pr-1.5">
              {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => changeEditorSize(sz)}
                  className={`px-1.5 py-0.5 text-[8px] font-black uppercase transition-colors ${
                    editorSize === sz 
                      ? 'bg-black text-white' 
                      : 'text-zinc-500 hover:text-black hover:bg-zinc-200'
                  }`}
                >
                  {sz === 'base' ? 'Med' : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Configurable window height selector */}
          <div className="flex items-center bg-zinc-100 p-1 border border-zinc-200 h-9">
            <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 px-2 select-none">
              Pantalla:
            </span>
            <div className="flex gap-1 pr-1">
              <button 
                onClick={() => changeEditorHeight('fixed-md')}
                className={`px-2 py-0.5 text-[8px] font-black uppercase transition-colors ${
                  editorHeight === 'fixed-md' ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'
                }`}
                title="Talla estándar de edición"
              >
                Medio
              </button>
              <button 
                onClick={() => changeEditorHeight('fixed-lg')}
                className={`px-2 py-0.5 text-[8px] font-black uppercase transition-colors ${
                  editorHeight === 'fixed-lg' ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'
                }`}
                title="Talla extendida de edición"
              >
                Alto
              </button>
              <button 
                onClick={() => changeEditorHeight('auto')}
                className={`px-2 py-0.5 text-[8px] font-black uppercase transition-colors ${
                  editorHeight === 'auto' ? 'bg-black text-white' : 'hover:bg-zinc-200 text-zinc-600'
                }`}
                title="Crecimiento automático de lienzo"
              >
                Crecer
              </button>
            </div>
          </div>
        </div>
        
        {/* Actions bar (Section 3: Flex formats & Downloads) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zen Focus Mode trigger (Section 1) */}
          <button 
            onClick={() => setFocusMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-amber-100 text-black text-[9px] font-black uppercase hover:bg-amber-200 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
            title="Activar Modo Zen Libre de Distracciones"
          >
            <Maximize2 size={12} />
            Modo Enfoque
          </button>

          {/* Copy Dropdown (Section 3) */}
          <div className="relative inline-block text-left">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'copy' ? null : 'copy')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm bg-white"
            >
              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar...'}
              <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'copy' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'copy' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border-2 border-black shadow-[4px_4px_0px_black] z-50 animate-in fade-in slide-in-from-top-1">
                  <button 
                    onClick={() => { copyFormatted('plain'); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black border-b border-zinc-100"
                  >
                    📋 Texto Plano
                  </button>
                  <button 
                    onClick={() => { copyFormatted('markdown'); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black border-b border-zinc-100"
                  >
                    ✍️ Copiar como Markdown
                  </button>
                  <button 
                    onClick={() => { copyFormatted('html'); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black"
                  >
                    🌐 Copiar como HTML
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Download Dropdown (Section 3) */}
          <div className="relative inline-block text-left">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'export' ? null : 'export')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-sm bg-white"
            >
              <Download size={12} />
              Exportar...
              <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'export' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'export' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 mt-1 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_black] z-50 animate-in fade-in slide-in-from-top-1">
                  <button 
                    onClick={() => { downloadTxt(); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black border-b border-zinc-100"
                  >
                    📄 Guardar TXT (.txt)
                  </button>
                  <button 
                    onClick={() => { downloadHtml(); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black border-b border-zinc-100"
                  >
                    🌐 Guardar HTML (.html)
                  </button>
                  <button 
                    onClick={() => { downloadMarkdown(); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black border-b border-zinc-100"
                  >
                    ✍️ Guardar Markdown (.md)
                  </button>
                  <button 
                    onClick={() => { exportPdfOrPrint(); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-black"
                  >
                    🖨️ Exportar PDF / Imprimir
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => { if (confirm('¿Borrar todo el texto?')) { editor.commands.setContent(''); setCorrections(null); setAiResult(null); } }} 
            className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 text-[9px] font-black uppercase hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
          >
            <Trash2 size={12} /> Limpiar
          </button>
        </div>
      </div>

      {/* Editor & Side/Stacked Console Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: The Editor Box (Completely self-contained, no absolute elements blocking) */}
        <div className={`flex-1 w-full flex flex-col border-2 border-black focus-within:border-black transition-all relative overflow-hidden group shadow-[4px_4px_0px_black] ${getEditorHeightClass()} ${getThemeClasses()}`}>
          
          {/* TipTap main space with custom pretty scrollbar */}
          <div className={`flex-1 overflow-y-auto scroller-pretty h-full transition-colors duration-300 ${getThemeClasses()} ${getSizeClasses()}`}>
            <EditorContent editor={editor} className="prose-zinc focus:outline-none h-full" />
          </div>
          
          {/* Spinner Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-40 animate-fade-in">
              <div className="flex flex-col items-center gap-2 bg-white border-2 border-black p-6 shadow-[8px_8px_0px_black] max-w-xs text-center">
                <Loader2 className="animate-spin text-black" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-black">Procesando con IA...</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">Espera un momento</span>
              </div>
            </div>
          )}

          {/* Quick Notification Toast within Editor */}
          {notification && (
            <div className="absolute top-4 right-4 bg-black text-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest z-50 animate-in fade-in slide-in-from-top-2 shadow-lg">
              {notification}
            </div>
          )}
        </div>

        {/* Right Column: AI command assistant dashboard (Only shown if toggled) */}
        {showAiConsole && (
          <div className={`w-full lg:w-[360px] xl:w-[420px] flex-shrink-0 flex flex-col bg-stone-50 border-2 border-black p-5 shadow-[4px_4px_0px_black] relative transition-all ${
            editorHeight === 'auto' ? 'min-h-[450px] lg:h-[580px]' : getEditorHeightClass()
          }`}>
            
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-black animate-pulse text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-black">Consola Magic IA</span>
              </div>
              <button 
                onClick={toggleAiConsole}
                className="text-[8px] font-black uppercase border border-black/20 hover:border-black px-2 py-0.5 text-zinc-500 hover:text-black transition-colors"
                title="Cerrar esta consola lateral"
              >
                Cerrar
              </button>
            </div>

            <p className="text-[9px] text-zinc-500 leading-relaxed uppercase tracking-wider mb-3">
              Selecciona una acción inteligente para aplicar al texto:
            </p>

            {/* Smart IA triggers grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => runAiOp('summarize')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest transition-all hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed group border border-black"
                title="Generar un resumen del texto"
              >
                <Sparkles size={11} className="text-amber-300 group-hover:scale-125 transition-transform" />
                Resumir
              </button>
              <button 
                onClick={() => runAiOp('simplify')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-zinc-300 hover:border-black text-[9px] font-black uppercase tracking-widest transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Simplificar el lenguaje y hacerlo directo"
              >
                Simplificar
              </button>
              <button 
                onClick={() => runAiOp('keywords')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-zinc-300 hover:border-black text-[9px] font-black uppercase tracking-widest transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Extraer los puntos clave y bullets"
              >
                Puntos Clave
              </button>
              <button 
                onClick={() => runAiOp('style')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-zinc-300 hover:border-black text-[9px] font-black uppercase tracking-widest transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Pulir el estilo para que sea profesional"
              >
                Estilo Pro
              </button>
              <button 
                onClick={() => runAiOp('spelling')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-black text-[9px] font-black uppercase tracking-[0.05em] transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Detectar ortografía y aplicar correcciones"
              >
                Ortografía
              </button>
              <button 
                onClick={() => runAiOp('grammar')}
                disabled={loading || !editor.getText().trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-black text-[9px] font-black uppercase tracking-[0.05em] transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Corregir gramática y sintaxis con IA"
              >
                Gramática y Sintaxis
              </button>
            </div>

            {/* Scrolling console status or output results area */}
            <div className="flex-1 overflow-y-auto scroller-pretty pr-1 space-y-4">
              
              {loading && (
                <div className="p-6 border-2 border-dashed border-black/20 flex flex-col items-center justify-center bg-zinc-100/50">
                  <Loader2 className="animate-spin text-zinc-900 mb-2" size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Obteniendo respuesta de Gemini...</span>
                </div>
              )}

              {/* Display AI outcome when ready */}
              {aiResult && !loading && (
                <div className="border-2 border-black bg-amber-50 p-4 shadow-[2px_2px_0px_black] animate-in fade-in zoom-in-95 leading-normal text-left">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-black/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-500 animate-pulse" /> Resultado Magic IA:
                    </span>
                    <button 
                      onClick={() => setAiResult(null)}
                      className="text-[8px] font-bold text-zinc-400 hover:text-red-600 uppercase"
                    >
                      Limpiar
                    </button>
                  </div>
                  
                  {/* Result Content container with scrollbar inside console */}
                  <div className="text-[11px] leading-relaxed font-sans text-zinc-900 bg-white/60 p-3 border border-black/10 rounded-none max-h-[160px] md:max-h-[220px] overflow-y-auto scroller-pretty whitespace-pre-wrap outline-none select-text">
                    {aiResult}
                  </div>

                  {/* Operational actions for the AI response */}
                  <div className="flex flex-col gap-1.5 mt-3">
                    <button 
                      onClick={() => {
                        editor.commands.setContent(aiResult);
                        setNotification("Aplicado al texto original");
                        setTimeout(() => setNotification(null), 2500);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-[9px] font-black uppercase tracking-wide hover:bg-zinc-800 transition-colors"
                      title="Sustituir todo el texto del editor con este resultado"
                    >
                      <CornerDownLeft size={10} /> Reemplazar Texto del Editor
                    </button>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        onClick={() => {
                          const currentText = editor.getText();
                          editor.commands.setContent(currentContent => {
                            return currentContent.trim() ? currentContent + '\n\n' + aiResult : aiResult;
                          });
                          setNotification("Resultado sumado al final");
                          setTimeout(() => setNotification(null), 2000);
                        }}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-black bg-white text-[8px] font-black uppercase hover:bg-zinc-100 transition-all text-center leading-tight"
                        title="Pegar esta sugerencia al final de tu documento"
                      >
                        Añadir al final
                      </button>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(aiResult);
                          setNotification("Copiado al portapapeles");
                          setTimeout(() => setNotification(null), 2000);
                        }}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-black bg-white text-[8px] font-black uppercase hover:bg-zinc-100 transition-all"
                      >
                        <Copy size={10} /> Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions list for orthography/grammar corrected suggestions */}
              {corrections && corrections.length > 0 && !loading && (
                <div className="border-2 border-black bg-zinc-100 p-4 shadow-[2px_2px_0px_black] animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-black/10 pb-1.5 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-black">Anotaciones Recientes:</span>
                    <button onClick={() => setCorrections(null)} className="text-zinc-500 hover:text-black">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <ul className="space-y-1.5 max-h-[140px] overflow-y-auto scroller-pretty pr-1">
                    {corrections.map((c, i) => (
                      <li key={i} className="text-[10px] leading-relaxed text-zinc-700 bg-white border border-black/5 p-2 font-medium">
                        <span className="font-mono text-zinc-400 font-bold mr-1 bg-zinc-100 px-1 py-[1px]">#{i + 1}</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Console Empty state / Advice */}
              {!aiResult && !corrections && !loading && (
                <div className="border border-dashed border-black/20 p-4 flex flex-col items-center justify-center text-center bg-zinc-50/50 h-44">
                  <div className="w-8 h-8 rounded-full border border-dashed border-black/30 flex items-center justify-center mb-1.5 bg-white">
                    <HelpCircle size={14} className="text-zinc-400" />
                  </div>
                  <h4 className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Esperando comando...</h4>
                  <p className="text-[8px] text-zinc-400 mt-1 max-w-[180px] leading-normal font-sans">
                    Utiliza los botones de arriba para aplicar IA. El texto original no sufrirá cambios a menos que tú lo decidas.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info (Section 1) */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[9px] font-black uppercase tracking-widest text-zinc-400 pt-4 border-t border-zinc-100 mt-2 gap-3 select-none">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <span>Palabras: <span className="text-black">{getWordCount()}</span></span>
          <span>Símbolos: <span className="text-black">{getCharCount()}</span></span>
          <span>Párrafos: <span className="text-black">{getParagraphCount()}</span></span>
          <span>Lectura: <span className="text-black inline-flex items-center gap-1">⏱️ {getReadingTime()} min</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Auto-Guardado Local</span>
        </div>
      </div>

      {/* Invisible Print container: strictly extracted on print trigger (Section 3) */}
      <div id="print-area" className="hidden" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />

      {/* Zen Focus Mode Overlay Grid (Section 1) */}
      {focusMode && (
        <div className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-300 animate-in fade-in ${getThemeClasses()}`} id="focus-canvas">
          {/* Minimalist Top Panel */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 select-none bg-inherit shrink-0">
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider opacity-60">
              <span className="flex items-center gap-1"><Sparkles size={11} className="text-amber-500" /> Zen Mode</span>
              <span>•</span>
              <span>Palabras: {getWordCount()}</span>
              <span>•</span>
              <span>Párrafos: {getParagraphCount()}</span>
              <span>•</span>
              <span>Lectura: {getReadingTime()} min</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick theme swatches */}
              <div className="flex gap-2 items-center">
                <span className="text-[8px] font-black uppercase tracking-wider opacity-40">Tema:</span>
                <button 
                  onClick={() => changeEditorTheme('classic')} 
                  className={`w-4 h-4 rounded-full border border-black/30 bg-white ${editorTheme === 'classic' ? 'ring-2 ring-black ring-offset-2' : ''}`}
                  title="Blanco Día"
                />
                <button 
                  onClick={() => changeEditorTheme('sepia')} 
                  className={`w-4 h-4 rounded-full border border-[#5D4E3E]/30 bg-[#FAF4E8] ${editorTheme === 'sepia' ? 'ring-2 ring-black ring-offset-2' : ''}`}
                  title="Sepia Cálido"
                />
                <button 
                  onClick={() => changeEditorTheme('dark')} 
                  className={`w-4 h-4 rounded-full border border-white/20 bg-zinc-800 ${editorTheme === 'dark' ? 'ring-2 ring-white ring-offset-2 hover:ring-offset-zinc-900' : ''}`}
                  title="Noche Oscura"
                />
              </div>

              {/* Quick font sizing */}
              <div className="flex items-center border border-black/10 bg-black/5 divide-x divide-black/10 h-6">
                <button 
                  onClick={() => {
                    const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                    const idx = sizes.indexOf(editorSize);
                    if (idx > 0) changeEditorSize(sizes[idx - 1]);
                  }}
                  className="px-2.5 h-full text-[9px] font-bold hover:bg-black/10 transition-colors"
                  title="Reducir letra"
                >
                  A-
                </button>
                <button 
                  onClick={() => {
                    const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                    const idx = sizes.indexOf(editorSize);
                    if (idx < sizes.length - 1) changeEditorSize(sizes[idx + 1]);
                  }}
                  className="px-2.5 h-full text-[9px] font-bold hover:bg-black/10 transition-colors"
                  title="Aumentar letra"
                >
                  A+
                </button>
              </div>

              {/* Quick Export formats */}
              <button 
                onClick={downloadMarkdown}
                className="px-2.5 py-1 border border-black/20 hover:border-black text-[8px] font-black uppercase tracking-wider bg-transparent hover:bg-black/5"
                title="Sustraer a Markdown"
              >
                MD
              </button>
              <button 
                onClick={exportPdfOrPrint}
                className="px-2.5 py-1 border border-black/20 hover:border-black text-[8px] font-black uppercase tracking-wider bg-transparent hover:bg-black/5"
                title="Guardar PDF / Imprimir"
              >
                PDF
              </button>

              {/* Exit Focus */}
              <button 
                onClick={() => setFocusMode(false)}
                className="flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-zinc-800 text-[9px] font-black uppercase tracking-widest transition-colors duration-200"
                title="Salir de Enfoque (Esc)"
              >
                <Minimize2 size={12} /> Salir
              </button>
            </div>
          </div>

          {/* Big typing container */}
          <div className="flex-1 overflow-y-auto scroller-pretty px-6 py-12 md:py-16">
            <div className={`max-w-3xl mx-auto h-full ${getSizeClasses()}`}>
              <EditorContent editor={editor} className="prose-zinc focus:outline-none min-h-full pb-32" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

