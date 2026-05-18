import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw, Brain, Video, Newspaper, Share2, QrCode, Calculator, Zap, ChevronLeft, ChevronRight, Menu, Settings, X, Key } from 'lucide-react';
import TextProcessor from './components/TextProcessor';
import PercentageCalculator from './components/PercentageCalculator';
import SocialFormatter from './components/SocialFormatter';
import ScreenwriterIA from './components/ScreenwriterIA';
import FuelCalculator from './components/FuelCalculator';
import RedactorIA from './components/RedactorIA';
import ContentBrainstormer from './components/ContentBrainstormer';
import QRGenerator from './components/QRGenerator';
import Teleprompter from './components/Teleprompter';
import { processWithGemini, getLocalApiKey, setLocalApiKey } from './services/geminiService';

export default function App() {
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);

  useEffect(() => {
    setTempApiKey(getLocalApiKey());
  }, []);

  const handleTestKey = async () => {
    if (!tempApiKey.trim()) {
      showNotification('Ingresa una clave para probar');
      return;
    }
    setTestingKey(true);
    try {
      const result = await processWithGemini({ customPrompt: 'Responde solo con la palabra OK' }, 'process', tempApiKey);
      if (result.text?.includes('OK')) {
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
    setTempApiKey(trimmedKey);
    setShowSettings(false);
    showNotification('Configuración guardada correctamente');
  };

  const [notification, setNotification] = useState<{message: string, show: boolean}>({ message: '', show: false });

  const showNotification = (message: string) => {
    setNotification({ message, show: true });
    setTimeout(() => setNotification({ message: '', show: false }), 3000);
  };

  const toggleTeleprompter = () => setShowTeleprompter(prev => !prev);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans text-zinc-950 selection:bg-zinc-900 selection:text-white" id="app">
      {/* Sidebar - Sharp Swiss Style */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-zinc-200 flex flex-col items-center py-8 bg-white shrink-0 sticky top-0 h-screen z-[60] transition-all duration-300 ease-in-out group/sidebar`}>
        <div className="mb-12 px-4 w-full flex items-center justify-between">
           <div className={`w-12 h-12 bg-black rounded-none shadow-2xl flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-none`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="font-black text-white text-2xl tracking-tighter italic">U</span>
           </div>
           {!sidebarCollapsed && <span className="font-black text-xs uppercase tracking-[0.3em] ml-4 animate-in fade-in duration-500">Utility.Hub</span>}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto w-full flex flex-col items-center scrollbar-hide px-3">
          <button 
            onClick={() => { setActiveTab('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative ${activeTab === 'dashboard' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
          >
            <LayoutDashboard size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Panel Control</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Panel</span>}
          </button>

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />
          
          <button 
            onClick={() => scrollToSection('text-processor')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <SquarePen size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Procesador</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Procesador</span>}
          </button>

          <button 
            onClick={() => scrollToSection('screenwriter-ia')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Video size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Guionista IA</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Guionista IA</span>}
          </button>

          <button 
            onClick={() => scrollToSection('redactor-ia')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Newspaper size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Redactor IA</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Redactor IA</span>}
          </button>

          <button 
            onClick={() => scrollToSection('content-brainstormer')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Brain size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Lluvia Ideas</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Lluvia de Ideas</span>}
          </button>

          <button 
            onClick={() => scrollToSection('social-formatter')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Share2 size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Boost Social</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Formateador Social</span>}
          </button>

          <button 
            onClick={() => scrollToSection('qr-generator')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <QrCode size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Generador QR</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Generador QR</span>}
          </button>

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />

          <button 
            onClick={() => scrollToSection('percentage-calc')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Calculator size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Porcentajes</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Porcentajes</span>}
          </button>

          <button 
            onClick={() => scrollToSection('fuel-calc')}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Zap size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Combustible</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Combustible</span>}
          </button>

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />

          <button 
            onClick={toggleTeleprompter}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Monitor size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Teleprompter</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Apuntador</span>}
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Settings size={20} className="flex-none" />
            {!sidebarCollapsed && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Configuración</span>}
            {sidebarCollapsed && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">Ajustes</span>}
          </button>
        </nav>

        <div className="mt-auto w-full px-4 mb-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
            <section id="text-processor" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <TextProcessor />
              </div>
            </section>

            {/* Screenwriter IA - Full Width */}
            <section id="screenwriter-ia" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <ScreenwriterIA />
              </div>
            </section>

            {/* Redactor IA - Full Width */}
            <section id="redactor-ia" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <RedactorIA />
              </div>
            </section>

            {/* Lluvia de Ideas - Full Width */}
            <section id="content-brainstormer" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <ContentBrainstormer />
              </div>
            </section>

            {/* Social Formatter - Full Width */}
            <section id="social-formatter" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <SocialFormatter />
              </div>
            </section>

            {/* QR Generator - Full Width */}
            <section id="qr-generator" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <QRGenerator />
              </div>
            </section>

            {/* Percentage Calculator - Full Width */}
            <section id="percentage-calc" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <PercentageCalculator />
              </div>
            </section>

            {/* Fuel Calculator - Full Width */}
            <section id="fuel-calc" className="bg-white border-2 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-10 flex-1 scroll-smooth">
                <FuelCalculator />
              </div>
            </section>
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

      {/* Settings Modal */}
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
                   <p className="text-[10px] text-zinc-500 leading-relaxed">
                     <strong className="text-black">Nota:</strong> Al usar GitHub Pages, esta clave se guarda <strong>solo en tu navegador</strong> (localStorage) para permitir las funciones de IA.
                   </p>
                   <button 
                     onClick={handleTestKey}
                     disabled={testingKey || !tempApiKey.trim()}
                     className="w-full h-10 border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors disabled:opacity-50"
                   >
                     {testingKey ? 'Probando...' : 'Probar Clave'}
                   </button>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={handleSaveSettings}
                    className="flex-1 h-14 bg-black text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition-colors shadow-xl"
                  >
                    Guardar Cambios
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

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
           {notification.message}
        </div>
      )}
    </div>
  );
}
