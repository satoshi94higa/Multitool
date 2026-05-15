import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { GripVertical, Lock, Unlock, LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw } from 'lucide-react';
import TextProcessor from './components/TextProcessor';
import PercentageCalculator from './components/PercentageCalculator';
import SocialFormatter from './components/SocialFormatter';
import ScreenwriterIA from './components/ScreenwriterIA';
import FuelCalculator from './components/FuelCalculator';
import JournalistIA from './components/JournalistIA';
import ContentBrainstormer from './components/ContentBrainstormer';
import DirectorIA from './components/DirectorIA';
import QRGenerator from './components/QRGenerator';
import Teleprompter from './components/Teleprompter';

// @ts-ignore
const ResponsiveGridLayout = WidthProvider(Responsive);

const INITIAL_LAYOUTS = {
  lg: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 1, y: 0, w: 1, h: 26 },
    { i: 'journalist', x: 0, y: 14, w: 1, h: 18 },
    { i: 'social', x: 1, y: 26, w: 1, h: 13 },
    { i: 'brainstormer', x: 0, y: 32, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 46, w: 1, h: 16 },
    { i: 'percentage', x: 1, y: 39, w: 1, h: 7 },
    { i: 'fuel', x: 1, y: 46, w: 1, h: 8 },
    { i: 'director', x: 0, y: 62, w: 2, h: 24 },
  ],
  md: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 1, y: 0, w: 1, h: 26 },
    { i: 'journalist', x: 0, y: 14, w: 1, h: 18 },
    { i: 'social', x: 1, y: 26, w: 1, h: 13 },
    { i: 'brainstormer', x: 0, y: 32, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 46, w: 1, h: 16 },
    { i: 'percentage', x: 1, y: 39, w: 1, h: 7 },
    { i: 'fuel', x: 1, y: 46, w: 1, h: 8 },
    { i: 'director', x: 0, y: 62, w: 2, h: 24 },
  ],
  sm: [
    { i: 'text-processor', x: 0, y: 0, w: 1, h: 14 },
    { i: 'screenwriter', x: 0, y: 14, w: 1, h: 24 },
    { i: 'director', x: 0, y: 38, w: 1, h: 24 },
    { i: 'journalist', x: 0, y: 62, w: 1, h: 18 },
    { i: 'brainstormer', x: 0, y: 80, w: 1, h: 14 },
    { i: 'qr-generator', x: 0, y: 94, w: 1, h: 16 },
    { i: 'social', x: 0, y: 110, w: 1, h: 13 },
    { i: 'percentage', x: 0, y: 123, w: 1, h: 7 },
    { i: 'fuel', x: 0, y: 130, w: 1, h: 8 },
  ]
};

export default function App() {
  const [isDraggable, setIsDraggable] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleTeleprompter = () => setShowTeleprompter(prev => !prev);
  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('hub-layouts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lg) {
          parsed.lg = parsed.lg.filter((item: any) => item.i !== 'shot-planner');
        }
        return parsed;
      } catch (e) {
        return INITIAL_LAYOUTS;
      }
    }
    return INITIAL_LAYOUTS;
  });

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('hub-layouts', JSON.stringify(allLayouts));
  };

  const toggleDraggable = () => setIsDraggable(!isDraggable);

  const resetLayout = () => {
    if (confirm('¿Restablecer el diseño original?')) {
      localStorage.removeItem('hub-layouts');
      setLayouts(INITIAL_LAYOUTS);
      window.location.reload();
    }
  };

  const tools = [
    { id: 'all', label: 'Todo', icon: LayoutDashboard },
    { id: 'writing', label: 'Escritura', icon: SquarePen },
    { id: 'math', label: 'Cálculos', icon: Gauge },
    { id: 'media', label: 'Media', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans text-zinc-950 selection:bg-zinc-900 selection:text-white" id="app">
      {/* Sidebar - Sharp Swiss Style */}
      <aside className="w-16 md:w-24 border-r border-zinc-200 flex flex-col items-center py-8 bg-white shrink-0 sticky top-0 h-screen z-[60]">
        <div className="mb-12">
           <div className="w-12 h-12 md:w-14 md:h-14 bg-black rounded-none shadow-2xl flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <span className="font-black text-white text-2xl tracking-tighter italic">U</span>
           </div>
        </div>

        <nav className="flex-1 space-y-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-12 h-12 rounded-none flex items-center justify-center transition-all group relative ${activeTab === 'dashboard' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black'}`}
          >
            <LayoutDashboard size={20} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Panel</span>
          </button>
          
          <button 
            onClick={toggleTeleprompter}
            className="w-12 h-12 rounded-none flex items-center justify-center transition-all group relative text-zinc-400 hover:text-black"
          >
            <Monitor size={20} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Apuntador</span>
          </button>
        </nav>

        <div className="mt-auto space-y-6">
          <button 
             onClick={toggleDraggable}
             className={`w-12 h-12 rounded-none flex items-center justify-center transition-all group relative border-2 ${isDraggable ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-transparent border-zinc-100 text-zinc-400 hover:text-black hover:border-black'}`}
          >
            {isDraggable ? <Unlock size={18} /> : <Lock size={18} />}
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">{isDraggable ? 'Fijar Diseño' : 'Personalizar Diseño'}</span>
          </button>
          
          {isDraggable && (
             <button 
              onClick={resetLayout}
              className="w-12 h-12 rounded-none flex items-center justify-center transition-all bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white"
            >
              <RotateCcw size={18} />
            </button>
          )}

          <div className="flex flex-col items-center gap-1 opacity-20">
             <div className="w-1 h-8 bg-zinc-950" />
             <div className="w-1 h-2 bg-zinc-950" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 md:h-24 flex items-center justify-between px-8 md:px-12 border-b border-zinc-200 sticky top-0 bg-white/90 backdrop-blur-md z-50">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-black uppercase leading-none mb-1.5 italic">Estudio.Modular_04</h1>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Sistema Operativo</span>
                <span className="w-4 h-[1px] bg-zinc-200" />
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Estado: Nominal</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-6 pr-6 mr-6 border-r border-zinc-100">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black uppercase text-zinc-400">Canal</span>
                   <span className="text-[11px] font-mono text-zinc-950 font-bold tracking-tighter">CIFRADO.AES_256</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black uppercase text-zinc-400">Entorno</span>
                   <span className="text-[11px] font-mono text-black font-bold">PRODUCCIÓN</span>
                </div>
             </div>
             
             <button className="w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center group overflow-hidden">
                <div className="w-5 h-0.5 bg-black" />
             </button>
          </div>
        </header>

        <main className="flex-1 p-8 md:p-12 pb-24 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 }}
              rowHeight={40}
              isDraggable={isDraggable}
              isResizable={isDraggable}
              draggableHandle=".drag-handle"
              onLayoutChange={onLayoutChange}
              margin={[40, 40]}
            >
              <div key="text-processor" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <TextProcessor />
                </div>
              </div>

              <div key="screenwriter" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <ScreenwriterIA />
                </div>
              </div>

              <div key="percentage" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <PercentageCalculator />
                </div>
              </div>

              <div key="social" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <SocialFormatter />
                </div>
              </div>

              <div key="fuel" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <FuelCalculator />
                </div>
              </div>

              <div key="journalist" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <JournalistIA />
                </div>
              </div>

              <div key="brainstormer" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <ContentBrainstormer />
                </div>
              </div>

              <div key="director" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <DirectorIA />
                </div>
              </div>

              <div key="qr-generator" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full group transition-all duration-300">
                {isDraggable && (
                  <div className="drag-handle h-10 bg-zinc-50 border-b border-black flex items-center justify-center text-zinc-300 hover:text-black transition-colors shrink-0">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="p-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                  <QRGenerator />
                </div>
              </div>
            </ResponsiveGridLayout>
          </div>
        </main>
        
        <footer className="h-12 border-t border-zinc-200 bg-white flex items-center justify-between px-12">
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sistema.Inactivo</span>
           <div className="flex gap-8">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Proceso: Nexus_v4.0</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Latencia: 14ms</span>
           </div>
        </footer>
      </div>

      {showTeleprompter && (
        <Teleprompter onClose={() => setShowTeleprompter(false)} />
      )}
    </div>
  );
}
