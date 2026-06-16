import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw, Brain, Video, 
  Newspaper, Share2, QrCode, Calculator, Zap, ChevronLeft, ChevronRight, 
  Menu, Settings, X, Key, Captions, CircleDollarSign, TrendingUp,
  Search, Keyboard, Clipboard, Wifi, WifiOff, Copy, FileText, CheckCircle, Info, Trash, RefreshCw
} from 'lucide-react';
import TextProcessor from './components/TextProcessor';
import PercentageCalculator from './components/PercentageCalculator';
import SocialFormatter from './components/SocialFormatter';
import ScreenwriterIA from './components/ScreenwriterIA';
import FuelCalculator from './components/FuelCalculator';
import RedactorIA from './components/RedactorIA';
import ContentBrainstormer from './components/ContentBrainstormer';
import QRGenerator from './components/QRGenerator';
import Teleprompter from './components/Teleprompter';
import SubtitleAssistant from './components/SubtitleAssistant';
import BudgetCalculator from './components/BudgetCalculator';
import InflationCalculator from './components/InflationCalculator';
import { processWithGemini, getLocalApiKey, setLocalApiKey, getLocalModel, setLocalModel } from './services/geminiService';

const TOOLS = [
  { id: 'text-processor', path: '/text', icon: SquarePen, label: 'Text', short: 'Procesador', component: TextProcessor, category: 'creativity' },
  { id: 'screenwriter-ia', path: '/screenwriter', icon: Video, label: 'Guión', short: 'Guionista IA', component: ScreenwriterIA, category: 'creativity' },
  { id: 'redactor-ia', path: '/redactor', icon: Newspaper, label: 'Escritor', short: 'Redactor IA', component: RedactorIA, category: 'creativity' },
  { id: 'content-brainstormer', path: '/ideas', icon: Brain, label: 'Ideas', short: 'Lluvia de Ideas', component: ContentBrainstormer, category: 'creativity' },
  { id: 'social-formatter', path: '/social', icon: Share2, label: 'Social', short: 'Formateador Social', component: SocialFormatter, category: 'creativity' },
  { id: 'subtitle-assistant', path: '/subs', icon: Captions, label: 'Subs', short: 'Subtítulos Style', component: SubtitleAssistant, category: 'creativity' },
  { id: 'qr-generator', path: '/qr', icon: QrCode, label: 'QR', short: 'Generador QR', component: QRGenerator, category: 'utilities' },
  { id: 'inflation-calc', path: '/inflation', icon: TrendingUp, label: 'Infla', short: 'Calculadora Inflación', component: InflationCalculator, category: 'utilities' },
  { id: 'budget-calculator', path: '/budget', icon: CircleDollarSign, label: 'Presu', short: 'Presupuestos', component: BudgetCalculator, category: 'utilities' },
  { id: 'percentage-calc', path: '/percentage', icon: Calculator, label: 'Perc', short: 'Porcentajes', component: PercentageCalculator, category: 'utilities' },
  { id: 'fuel-calc', path: '/fuel', icon: Zap, label: 'Fuel', short: 'Combustible', component: FuelCalculator, category: 'utilities' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('gemini-3-flash-preview');
  const [testingKey, setTestingKey] = useState(false);
  const [notification, setNotification] = useState<{message: string, show: boolean}>({ message: '', show: false });

  // UX Optimization States
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('hub-global-scratchpad') || '' : '');

  // Slots del Scratchpad de Creadores
  const [slotA, setSlotA] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('hub-scratchpad-slot-a') || '' : '');
  const [slotB, setSlotB] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('hub-scratchpad-slot-b') || '' : '');
  const [slotC, setSlotC] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('hub-scratchpad-slot-c') || '' : '');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Conexión reestablecida. Herramientas de IA disponibles.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Sin conexión de red. Funciones de IA inactivas; herramientas locales activas.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K o Cmd+K para abrir Buscador de Herramientas (Command Palette)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setPaletteQuery('');
        setPaletteIndex(0);
        return;
      }

      // Cerrar todo con Escape
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowShortcutsModal(false);
        setShowScratchpad(false);
        setShowSettings(false);
        return;
      }

      // Evitar interceptaciones si se escribe en inputs, textarea o tip-tap contenteditable
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.getAttribute('contenteditable') === 'true' ||
        target.closest('.ProseMirror')
      )) {
        return;
      }

      // Tecla h o ? para ver atajos de teclado
      if (e.key.toLowerCase() === 'h' || e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Tecla c para toggle de Scratchpad
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowScratchpad(prev => !prev);
        return;
      }

      // Alt + 1..9 para navegación ágil
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (TOOLS[idx]) {
          e.preventDefault();
          navigate(TOOLS[idx].path);
          showNotification(`Cargando: ${TOOLS[idx].short}`);
        }
        return;
      }

      // Alt + 0 / Alt + P para volver al Panel
      if (e.altKey && (e.key === '0' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        navigate('/');
        showNotification('Panel Principal');
        return;
      }

      // Alt + M para Teleprompter
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowTeleprompter(prev => !prev);
        return;
      }

      // Alt + S para Ajustes
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSettings(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const saveScratchpadValue = (newText: string) => {
    setScratchpadText(newText);
    localStorage.setItem('hub-global-scratchpad', newText);
  };

  const handleSaveSlot = (slot: 'a' | 'b' | 'c') => {
    if (slot === 'a') {
      setSlotA(scratchpadText);
      localStorage.setItem('hub-scratchpad-slot-a', scratchpadText);
    } else if (slot === 'b') {
      setSlotB(scratchpadText);
      localStorage.setItem('hub-scratchpad-slot-b', scratchpadText);
    } else if (slot === 'c') {
      setSlotC(scratchpadText);
      localStorage.setItem('hub-scratchpad-slot-c', scratchpadText);
    }
    showNotification(`Guardado en ranura ${slot.toUpperCase()}`);
  };

  const handleLoadSlot = (slot: 'a' | 'b' | 'c') => {
    let content = '';
    if (slot === 'a') content = slotA;
    else if (slot === 'b') content = slotB;
    else if (slot === 'c') content = slotC;

    if (!content) {
      showNotification(`La ranura ${slot.toUpperCase()} está vacía.`);
      return;
    }
    saveScratchpadValue(content);
    showNotification(`Cargado desde ranura ${slot.toUpperCase()}`);
  };

  const handleCopySlotToClipboard = async (slot: 'a' | 'b' | 'c') => {
    let content = '';
    if (slot === 'a') content = slotA;
    else if (slot === 'b') content = slotB;
    else if (slot === 'c') content = slotC;

    if (!content) {
      showNotification(`La ranura ${slot.toUpperCase()} está vacía.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      showNotification(`Copiado ranura ${slot.toUpperCase()} al portapapeles`);
    } catch (e) {
      showNotification('Error al copiar al portapapeles.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        saveScratchpadValue(scratchpadText ? scratchpadText + '\n\n' + text : text);
        showNotification('Texto pegado del portapapeles.');
      } else {
        showNotification('El portapapeles del sistema está vacío.');
      }
    } catch (e) {
      showNotification('Concede permisos de portapapeles para pegar.');
    }
  };

  const handleCopyScratchpad = async () => {
    if (!scratchpadText.trim()) {
      showNotification('El bloc está vacío para copiar');
      return;
    }
    try {
      await navigator.clipboard.writeText(scratchpadText);
      showNotification('¡Bloc copiado al portapapeles!');
    } catch (e) {
      showNotification('Error al copiar');
    }
  };

  const handleInjectToActive = () => {
    if (!scratchpadText.trim()) {
      showNotification('Escribe algo en el bloc antes de enviarlo');
      return;
    }
    const event = new CustomEvent('app-set-text', { detail: { text: scratchpadText } });
    window.dispatchEvent(event);
    showNotification('Texto inyectado al procesador de texto');
  };

  useEffect(() => {
    setTempApiKey(getLocalApiKey());
    setTempModel(getLocalModel());
  }, []);

  const handleTestKey = async () => {
    if (!tempApiKey.trim()) {
      showNotification('Ingresa una clave para probar');
      return;
    }
    setTestingKey(true);
    try {
      const result = await processWithGemini({ customPrompt: 'Responde solo con la palabra OK' }, 'process', tempApiKey);
      if (result.text.includes('OK')) {
        showNotification('¡Clave válida!');
      } else {
        showNotification('Respuesta inesperada');
      }
    } catch (err: any) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveSettings = () => {
    const trimmedKey = tempApiKey.trim();
    setLocalApiKey(trimmedKey);
    setLocalModel(tempModel);
    setTempApiKey(trimmedKey);
    setShowSettings(false);
    showNotification('Configuración guardada correctamente');
  };

  const showNotification = (message: string) => {
    setNotification({ message, show: true });
    setTimeout(() => setNotification({ message: '', show: false }), 3000);
  };

  const toggleTeleprompter = () => setShowTeleprompter(prev => !prev);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans text-zinc-950 selection:bg-zinc-900 selection:text-white" id="app">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] bg-white transition-transform duration-300 ease-in-out border-r border-zinc-200
        ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full'}
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex md:flex-col md:items-center md:py-8
        ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black md:hidden"
        >
          <X size={20} />
        </button>

        <div className="mb-12 px-6 py-8 md:py-0 md:px-4 w-full flex items-center justify-between">
           <div className="w-12 h-12 bg-black rounded-none shadow-2xl flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-none" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <span className="font-black text-white text-2xl tracking-tighter italic">U</span>
           </div>
           {(!sidebarCollapsed || mobileMenuOpen) && <span className="font-black text-xs uppercase tracking-[0.3em] ml-4 animate-in fade-in duration-500">Utility.Hub</span>}
        </div>

        <nav className="flex-1 overflow-y-auto w-full flex flex-col items-center px-3 py-2 overscroll-contain">
          <button 
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className={`w-full h-10 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-3'} transition-all group relative ${isActive('/') ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
          >
            <LayoutDashboard size={18} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Panel</span>}
          </button>

          <div className="w-full mt-4 mb-2">
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="px-3 text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Creatividad</span>}
            <div className={`mt-2 ${(!sidebarCollapsed || mobileMenuOpen) ? 'grid grid-cols-2 gap-1' : 'space-y-1'}`}>
              {TOOLS.filter(t => t.category === 'creativity').map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full h-10 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-3'} transition-all group relative ${isActive(item.path) ? 'bg-zinc-100 text-black border-zinc-200' : 'text-zinc-400 hover:text-black hover:bg-zinc-50 border-transparent'} border hover:border-zinc-100`}
                >
                  <item.icon size={18} className="flex-none" />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                  {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">{item.short}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full mt-4 mb-2">
             {(!sidebarCollapsed || mobileMenuOpen) && <span className="px-3 text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Utilidades</span>}
             <div className={`mt-2 ${(!sidebarCollapsed || mobileMenuOpen) ? 'grid grid-cols-2 gap-1' : 'space-y-1'}`}>
                {TOOLS.filter(t => t.category === 'utilities').map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`w-full h-10 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-3'} transition-all group relative ${isActive(item.path) ? 'bg-zinc-100 text-black border-zinc-200' : 'text-zinc-400 hover:text-black hover:bg-zinc-50 border-transparent'} border hover:border-zinc-100`}
                  >
                    <item.icon size={18} className="flex-none" />
                    {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                    {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">{item.short}</span>}
                  </button>
                ))}
             </div>
          </div>

          <div className="w-8 h-[1px] bg-zinc-100 my-4 flex-none" />

          <button 
            onClick={() => { toggleTeleprompter(); setMobileMenuOpen(false); }}
            className={`w-full h-10 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-3'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Monitor size={18} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Monitor</span>}
          </button>

          <button 
            onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
            className={`w-full h-10 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-3'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Settings size={18} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Ajustes</span>}
          </button>
        </nav>

        <div className="mt-auto w-full px-4 mb-4 hidden md:block">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 md:h-24 flex items-center justify-between px-4 md:px-12 border-b border-zinc-200 sticky top-0 bg-white/90 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-black"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tighter text-black uppercase leading-none mb-1 md:mb-1.5 italic cursor-pointer" onClick={() => navigate('/')}>Estudio.Modular</h1>
               <div className="flex items-center gap-2">
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400">Modular_04</span>
                  <span className="hidden md:block w-4 h-[1px] bg-zinc-200" />
                  <span className={`hidden md:flex items-center gap-1.5 text-[9px] font-mono uppercase ${isOnline ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
                    Estado: {isOnline ? 'En línea' : 'Sin conexión'}
                  </span>
               </div>
            </div>
          </div>

          {/* Buscador premium al centro (desktrop/large) */}
          <button 
            onClick={() => { setShowCommandPalette(true); setPaletteQuery(''); setPaletteIndex(0); }}
            className="hidden lg:flex items-center gap-3 bg-zinc-50 hover:bg-zinc-100 hover:border-black border border-zinc-200 px-4 py-2 font-mono text-[11px] text-zinc-400 group transition-all w-80 rounded-none cursor-pointer"
          >
            <Search size={14} className="text-zinc-400 group-hover:text-black transition-colors shrink-0" />
            <span className="flex-1 text-left antialiased text-zinc-400 group-hover:text-zinc-600 transition-colors font-sans font-black uppercase tracking-widest text-[8px] truncate">Buscar herramienta...</span>
            <span className="bg-white border border-zinc-200 group-hover:border-black px-1.5 py-0.5 text-[8px] text-zinc-400 group-hover:text-black font-semibold transition-colors rounded-none shadow-sm uppercase">Ctrl + K</span>
          </button>
          
          <div className="flex items-center gap-2 md:gap-4">
             {/* Buscador móvil/médium */}
             <button 
               onClick={() => { setShowCommandPalette(true); setPaletteQuery(''); setPaletteIndex(0); }} 
               className="lg:hidden w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
               title="Buscar herramientas [Ctrl+K]"
             >
               <Search size={18} />
             </button>

             {/* Atajos de teclado */}
             <button 
               onClick={() => setShowShortcutsModal(true)} 
               className="w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
               title="Ver atajos de teclado [?]"
             >
               <Keyboard size={18} />
             </button>

             {/* Portapapeles Único */}
             <button 
               onClick={() => setShowScratchpad(prev => !prev)} 
               className={`w-10 h-10 border flex items-center justify-center transition-all relative ${showScratchpad ? 'bg-black text-white border-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 hover:bg-black hover:text-white'}`}
               title="Portapapeles Inteligente [C]"
             >
               <Clipboard size={18} />
               {scratchpadText.trim() && (
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-black rounded-full border border-white animate-bounce" />
               )}
             </button>

             <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors" title="Ajustes [Alt+S]">
                <Settings size={20} />
             </button>
          </div>
        </header>

        {!isOnline && (
          <div className="bg-amber-500 text-black border-b-2 border-black py-2.5 px-6 md:px-12 flex items-center justify-between text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2">
              <WifiOff size={14} className="shrink-0 animate-bounce" />
              <span>Estás navegando sin conexión. Las calculadoras y herramientas locales funcionan al 100%, pero se pausaron las funciones de IA de Gemini.</span>
            </div>
            <span className="hidden sm:inline bg-black text-white px-2 py-0.5 text-[8px] font-bold tracking-normal rounded-none">Offline</span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-12 pb-24 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            <div className={`flex flex-col ${location.pathname === '/' ? 'space-y-8 md:space-y-10' : ''}`}>
              {TOOLS.map((item) => {
                const isSelected = location.pathname === item.path;
                const isHome = location.pathname === '/';
                const shouldHide = !isSelected && !isHome;

                // Si no es home y no es la seleccionada, Ocultamos con CSS para mantener estado,
                // Pero podemos evitar renderizar si nunca se ha visitado para no sobrecargar el inicio.
                // Sin embargo, el requerimiento es "Mantener datos de TODOS". 
                // Para simplificar y evitar el "blank screen", asegurémonos que el contenedor
                // principal no colapse.

                return (
                  <div 
                    key={item.id} 
                    className={`
                      ${shouldHide ? 'hidden' : 'block'} 
                      ${isSelected ? 'animate-in fade-in zoom-in-95 duration-500' : ''}
                      w-full
                    `}
                  >
                    {isSelected && (
                       <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-black text-white flex items-center justify-center flex-shrink-0">
                                <item.icon size={24} />
                             </div>
                             <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{item.short}</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">Módulo Individual / Compartible</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto bg-zinc-100 px-6 h-12 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <LayoutDashboard size={16} />
                             Volver al Panel
                          </button>
                       </div>
                    )}
                    
                    <section 
                      id={item.id} 
                      className={`
                        bg-white flex flex-col transition-all duration-300 relative ${isSelected ? 'z-[60]' : 'z-10 hover:z-30 focus-within:z-30'} overflow-visible
                        ${isSelected 
                          ? 'border-4 border-black shadow-[24px_24px_0px_rgba(0,0,0,0.05)]' 
                          : 'border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] group'
                        }
                      `}
                    >
                      {isHome && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b-2 border-black bg-zinc-50 gap-4">
                          <div className="flex items-center gap-3">
                            <item.icon size={20} className="shrink-0" />
                            <h2 className="text-sm font-black uppercase tracking-tighter">{item.short}</h2>
                          </div>
                          <button 
                            onClick={() => navigate(item.path)}
                            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-2.5 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <Share2 size={12} />
                            Abrir Individualmente
                          </button>
                        </div>
                      )}
                      <div className={`flex-1 ${isSelected ? 'p-6 md:p-12' : 'p-4 md:p-10'}`}>
                        <item.component />
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>

            <Routes>
              <Route path="/" element={null} />
              {TOOLS.map((item) => (
                <Route key={item.id} path={item.path} element={null} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        <footer className="h-12 border-t border-zinc-200 bg-white flex items-center justify-between px-4 md:px-12">
           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400">Sistema.Activo / Enrutado</span>
           <div className="flex gap-4 md:gap-8 text-[10px] font-mono text-zinc-400 uppercase">
              <span>{location.pathname}</span>
           </div>
        </footer>
      </div>

      {showTeleprompter && <Teleprompter onClose={() => setShowTeleprompter(false)} />}

      {/* Settings Modal - kept identical logic */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white border-4 border-black p-8 md:p-12 w-full max-w-xl shadow-[24px_24px_0px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-black transition-colors">
               <X size={24} />
             </button>

             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
                   <Settings size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter italic">Configuración</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Preferencias del Sistema</p>
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                         <Key size={14} />
                         Gemini API Key
                      </label>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-zinc-400 hover:text-black underline">Obtener clave</a>
                   </div>
                   <input 
                      type="password"
                      value={tempApiKey || ''}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="Pega tu clave aquí..."
                      className="w-full h-14 bg-zinc-50 border-2 border-zinc-100 px-6 font-mono text-sm focus:border-black focus:bg-white outline-none transition-all placeholder:text-zinc-300"
                   />
                   <button 
                      onClick={handleTestKey}
                      disabled={testingKey || !tempApiKey.trim()}
                      className="w-full h-10 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors disabled:opacity-50"
                   >
                      {testingKey ? 'Probando...' : 'Probar Clave Local'}
                   </button>
                </div>

                <div className="space-y-4">
                   <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Brain size={14} />
                      Modelo IA
                   </label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Preview' },
                        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Lite' },
                        { id: 'gemini-flash-latest', name: 'Gemini Flash Stable' },
                        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' }
                      ].map(model => (
                        <button
                          key={model.id}
                          onClick={() => setTempModel(model.id)}
                          className={`p-3 border-2 text-left transition-all ${tempModel === model.id ? 'border-black bg-zinc-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}
                        >
                          <div className="font-bold text-[10px] uppercase tracking-tighter">{model.name}</div>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                      onClick={handleSaveSettings}
                      className="flex-1 h-14 bg-black text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition-colors shadow-xl"
                   >
                      Guardar
                   </button>
                   <button 
                      onClick={() => setShowSettings(false)}
                      className="px-8 h-14 border-2 border-black font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-50 transition-colors"
                   >
                      Cerrar
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
           {notification.message}
        </div>
      )}

      {/* Portapapeles Inteligente Drawer */}
      {showScratchpad && (
        <div className="fixed inset-y-0 right-0 z-[95] w-full sm:w-96 bg-white border-l-4 border-black shadow-[-20px_0px_0px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right-12 duration-300">
          <div className="p-6 border-b-2 border-black flex items-center justify-between bg-zinc-50 flex-none">
            <div className="flex items-center gap-3">
              <Clipboard size={18} />
              <div>
                <h3 className="text-sm font-black uppercase tracking-tighter italic">Portapapeles</h3>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Bloc de notas offline interactivo [C]</p>
              </div>
            </div>
            <button 
              onClick={() => setShowScratchpad(false)} 
              className="p-1.5 px-3 border border-black text-[10px] font-black uppercase hover:bg-black hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Espacio de Notas</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePasteFromClipboard}
                    className="text-[8px] font-black uppercase tracking-wider text-zinc-500 hover:text-black flex items-center gap-1 border border-zinc-200 p-1 bg-white"
                    title="Pegar del portapapeles de tu sistema"
                  >
                    <Clipboard size={10} /> Pegar Sis.
                  </button>
                  <button 
                    onClick={() => saveScratchpadValue('')}
                    className="text-[8px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-100 p-1 bg-white"
                    title="Limpiar notas"
                  >
                    <Trash size={10} /> Limpiar
                  </button>
                </div>
              </div>
              
              <textarea
                value={scratchpadText}
                onChange={(e) => saveScratchpadValue(e.target.value)}
                placeholder="Escribí, pegá o editá texto libremente acá. Se almacena localmente y podés enviarlo al módulo activo de la suite..."
                className="w-full h-80 border-2 border-black p-4 font-mono text-xs focus:ring-0 outline-none leading-relaxed resize-none focus:border-zinc-500 bg-zinc-50"
              />
            </div>

            {/* Ranuras de Memoria */}
            <div className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Ranuras rápidas de snippets</h4>
              <div className="space-y-2">
                {[
                  { id: 'a', label: 'Snippet Alfa', val: slotA },
                  { id: 'b', label: 'Snippet Beta', val: slotB },
                  { id: 'c', label: 'Snippet Gamma', val: slotC },
                ].map((slot) => {
                  return (
                    <div key={slot.id} className="border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-widest">{slot.label}</span>
                        {slot.val ? (
                          <span className="text-[8px] font-mono text-green-600 bg-white border border-green-200 px-1 py-0.5 font-bold uppercase">Activo</span>
                        ) : (
                          <span className="text-[8px] font-mono text-zinc-400 uppercase">Vacío</span>
                        )}
                      </div>
                      
                      {slot.val && (
                        <p className="text-[10px] text-zinc-650 font-mono line-clamp-2 bg-white p-1.5 border border-zinc-100 leading-normal">
                          {slot.val}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          onClick={() => handleSaveSlot(slot.id as 'a'|'b'|'c')}
                          className="text-[8px] font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-850 p-1.5 text-center transition-colors shadow-sm"
                          title="Guardar contenido actual en esta ranura"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => handleLoadSlot(slot.id as 'a'|'b'|'c')}
                          disabled={!slot.val}
                          className="text-[8px] font-black uppercase tracking-widest bg-zinc-200 hover:bg-black hover:text-white p-1.5 text-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Cargar texto de esta ranura en el bloc"
                        >
                          Pegar
                        </button>
                        <button
                          onClick={() => handleCopySlotToClipboard(slot.id as 'a'|'b'|'c')}
                          disabled={!slot.val}
                          className="text-[8px] font-black uppercase tracking-widest bg-white hover:bg-zinc-100 p-1.5 border border-zinc-200 text-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Copiar snippet al portapapeles del sistema"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-black bg-zinc-50 space-y-2 flex-none">
            <button 
              onClick={handleCopyScratchpad}
              className="w-full h-11 bg-zinc-100 border border-black hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Copy size={12} /> Copiar Bloc al Sistema
            </button>
            <button 
              onClick={handleInjectToActive}
              className="w-full h-11 bg-black text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-[0.12em] transition-colors flex items-center justify-center gap-2 shadow-md animate-pulse"
            >
              <FileText size={12} /> Inyectar en Procesador
            </button>
            <p className="text-[8px] font-sans text-center text-zinc-400 uppercase leading-normal pt-1 flex items-center justify-center gap-1">
              <Info size={10} /> Inyecta de forma directa con TipTap
            </p>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      {showCommandPalette && (() => {
        const getPaletteOptions = () => {
          const toolOptions = TOOLS.map((t, idx) => ({
            id: t.id,
            title: t.short,
            subtitle: `Módulo de ${t.category === 'creativity' ? 'Creatividad' : 'Utilidades'} [Alt+${idx + 1}]`,
            icon: t.icon,
            action: () => {
              navigate(t.path);
              setShowCommandPalette(false);
            }
          }));

          const systemOptions = [
            {
              id: 'go-home',
              title: 'Volver al Panel Principal',
              subtitle: 'Vista general con todos los módulos de precisión [Alt+P]',
              icon: LayoutDashboard,
              action: () => { navigate('/'); setShowCommandPalette(false); }
            },
            {
              id: 'open-teleprompter',
              title: 'Monitor Teleprompter',
              subtitle: 'Asistente de lectura rápida con espejo y velocidad regulable [Alt+M]',
              icon: Monitor,
              action: () => { setShowTeleprompter(true); setShowCommandPalette(false); }
            },
            {
              id: 'open-scratchpad',
              title: 'Portapapeles Inteligente',
              subtitle: 'Bloc rápido integrado para transferir textos fácilmente [C]',
              icon: Clipboard,
              action: () => { setShowScratchpad(true); setShowCommandPalette(false); }
            },
            {
              id: 'open-shortcuts',
              title: 'Ver Atajos de Teclado',
              subtitle: 'Ayuda y atajos para navegar como un profesional [H / ?]',
              icon: Keyboard,
              action: () => { setShowShortcutsModal(true); setShowCommandPalette(false); }
            },
            {
              id: 'open-settings',
              title: 'Configurar Clave (Gemini)',
              subtitle: 'Gestor y selector de API Key/Modelos [Alt+S]',
              icon: Settings,
              action: () => { setShowSettings(true); setShowCommandPalette(false); }
            }
          ];

          return [...toolOptions, ...systemOptions];
        };

        const allOptions = getPaletteOptions();
        const filteredOptions = allOptions.filter(opt => 
          opt.title.toLowerCase().includes(paletteQuery.toLowerCase()) || 
          opt.subtitle.toLowerCase().includes(paletteQuery.toLowerCase())
        );

        const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setPaletteIndex(prev => (prev + 1) % filteredOptions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setPaletteIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions[paletteIndex]) {
              filteredOptions[paletteIndex].action();
            }
          }
        };

        return (
          <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 md:pt-36 p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-205" onClick={() => setShowCommandPalette(false)} />
            <div className="relative bg-white border-4 border-black w-full max-w-2xl shadow-[24px_24px_0px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              {/* Input Buscador */}
              <div className="flex items-center gap-4 px-6 border-b-2 border-black bg-zinc-50 py-4 flex-none">
                <Search size={22} className="text-black shrink-0" />
                <input
                  type="text"
                  value={paletteQuery}
                  onChange={(e) => { setPaletteQuery(e.target.value); setPaletteIndex(0); }}
                  onKeyDown={handlePaletteKeyDown}
                  placeholder="Escribe para buscar herramientas o atajos..."
                  className="flex-1 bg-transparent border-none text-xs font-black uppercase tracking-widest outline-none focus:ring-0 placeholder:text-zinc-350"
                  autoFocus
                />
                <button 
                  onClick={() => setShowCommandPalette(false)}
                  className="text-[10px] font-black uppercase border border-black px-2.5 py-1 hover:bg-black hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </div>

              {/* Lista de Herramientas Filtrada */}
              <div className="max-h-96 overflow-y-auto divide-y divide-zinc-200">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, idx) => {
                    const isCurrent = idx === paletteIndex;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => opt.action()}
                        onMouseEnter={() => setPaletteIndex(idx)}
                        className={`w-full p-4 flex items-center justify-between text-left transition-all ${isCurrent ? 'bg-black text-white shadow-inner scale-[1.01]' : 'bg-white hover:bg-zinc-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${isCurrent ? 'bg-white text-black' : 'bg-zinc-150 text-black border border-black'}`}>
                            <opt.icon size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest leading-none">{opt.title}</h4>
                            <p className={`text-[9px] tracking-wide mt-1.5 ${isCurrent ? 'text-zinc-300' : 'text-zinc-400'}`}>{opt.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30">Abrir</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-zinc-50">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">No se encontraron resultados para "{paletteQuery}"</p>
                  </div>
                )}
              </div>

              {/* Pie de Buscador con tips */}
              <div className="p-4 border-t-2 border-black bg-zinc-50 text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between flex-none">
                <span>↑↓ para navegar • Enter para Abrir • Esc para cerrar</span>
                <span className="font-bold text-black border-b border-black">Atajo: Ctrl+K</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowShortcutsModal(false)} />
          <div className="relative bg-white border-4 border-black p-8 md:p-12 w-full max-w-xl shadow-[24px_24px_0px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200 flex flex-col">
             <button onClick={() => setShowShortcutsModal(false)} className="absolute top-6 right-6 text-zinc-450 hover:text-black transition-colors" title="Cerrar [Esc]">
               <X size={24} />
             </button>

             <div className="flex items-center gap-4 mb-8 border-b-2 border-black pb-6">
                <div className="w-12 h-12 bg-black flex items-center justify-center text-white shrink-0">
                   <Keyboard size={24} />
                </div>
                <div>
                   <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">Atajos de Teclado</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Maximiza tu productividad en Estudio.Modular</p>
                </div>
             </div>

             <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Atajos Globales</h3>
                   {[
                     { keys: ['Ctrl', 'K'], desc: 'Buscador instantáneo (Command Palette)' },
                     { keys: ['C'], desc: 'Abrir / Cerrar Portapapeles Inteligente' },
                     { keys: ['H', 'o', '?'], desc: 'Ver este panel de ayuda de atajos' },
                     { keys: ['Esc'], desc: 'Cerrar cualquier panel, menú o modal activo' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-100">
                       <span className="text-zinc-600 font-medium">{item.desc}</span>
                       <div className="flex gap-1">
                         {item.keys.map((k, kIdx) => (
                           <kbd key={kIdx} className="bg-zinc-55 border-2 border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">{k}</kbd>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>

                <div className="space-y-3">
                   <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Herramientas & Secciones</h3>
                   {[
                     { keys: ['Alt', '1..6'], desc: 'Herramientas de Creatividad directas' },
                     { keys: ['Alt', '7..9'], desc: 'Calculadoras y utilidades directas' },
                     { keys: ['Alt', '0', 'o', 'P'], desc: 'Volver al panel principal (Dashboard)' },
                     { keys: ['Alt', 'M'], desc: 'Lanzar el Monitor (Teleprompter)' },
                     { keys: ['Alt', 'S'], desc: 'Ir a Configuración (API Key Gemini)' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-100">
                       <span className="text-zinc-650 font-medium">{item.desc}</span>
                       <div className="flex gap-1 flex-shrink-0">
                         {item.keys.map((k, kIdx) => (
                           <kbd key={kIdx} className="bg-zinc-55 border-2 border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">{k}</kbd>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full h-12 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-lg"
                >
                  Entendido
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
