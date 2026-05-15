import React, { useState } from 'react';
import { LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw } from 'lucide-react';
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

export default function App() {
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleTeleprompter = () => setShowTeleprompter(prev => !prev);

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
          <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Text Processor - Full Width */}
            <section className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <TextProcessor />
              </div>
            </section>

            {/* Grid for other modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <ScreenwriterIA />
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <JournalistIA />
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <ContentBrainstormer />
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <SocialFormatter />
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <QRGenerator />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                  <div className="p-10 flex-1 scroll-smooth">
                    <PercentageCalculator />
                  </div>
                </div>

                <div className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                  <div className="p-10 flex-1 scroll-smooth">
                    <FuelCalculator />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
                <div className="p-10 flex-1 scroll-smooth">
                  <DirectorIA />
                </div>
              </div>
            </div>
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
