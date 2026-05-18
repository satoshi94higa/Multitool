import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw, Brain, Video, Newspaper, Share2, QrCode, Calculator, Zap, ChevronLeft, ChevronRight, Menu, Settings, X, Key, Captions, CircleDollarSign } from 'lucide-react';
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
import { processWithGemini, getLocalApiKey, setLocalApiKey, getLocalModel, setLocalModel } from './services/geminiService';

export default function App() {
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('gemini-3-flash-preview');
  const [testingKey, setTestingKey] = useState(false);

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
      // Usamos una operación simple para probar
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
      <aside className={`
        fixed inset-y-0 left-0 z-[100] bg-white transition-transform duration-300 ease-in-out border-r border-zinc-200
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
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
           <div className={`w-12 h-12 bg-black rounded-none shadow-2xl flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-none`} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
              <span className="font-black text-white text-2xl tracking-tighter italic">U</span>
           </div>
           {(!sidebarCollapsed || mobileMenuOpen) && <span className="font-black text-xs uppercase tracking-[0.3em] ml-4 animate-in fade-in duration-500">Utility.Hub</span>}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto w-full flex flex-col items-center scrollbar-hide px-3">
          <button 
            onClick={() => { setActiveTab('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative ${activeTab === 'dashboard' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
          >
            <LayoutDashboard size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Panel Control</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Panel</span>}
          </button>

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />
          
          {[
            { id: 'text-processor', icon: SquarePen, label: 'Procesador', short: 'Procesador' },
            { id: 'screenwriter-ia', icon: Video, label: 'Guionista IA', short: 'Guionista IA' },
            { id: 'redactor-ia', icon: Newspaper, label: 'Redactor IA', short: 'Redactor IA' },
            { id: 'content-brainstormer', icon: Brain, label: 'Lluvia Ideas', short: 'Lluvia de Ideas' },
            { id: 'social-formatter', icon: Share2, label: 'Boost Social', short: 'Formateador Social' },
            { id: 'subtitle-assistant', icon: Captions, label: 'Subtítulos', short: 'Subtítulos Style' },
            { id: 'qr-generator', icon: QrCode, label: 'Generador QR', short: 'Generador QR' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { scrollToSection(item.id); setMobileMenuOpen(false); }}
              className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
            >
              <item.icon size={20} className="flex-none" />
              {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">{item.label}</span>}
              {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">{item.short}</span>}
            </button>
          ))}

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />

          <button 
            onClick={() => { scrollToSection('budget-calculator'); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <CircleDollarSign size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Presupuestos</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Presupuestos</span>}
          </button>

          <button 
            onClick={() => { scrollToSection('percentage-calc'); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Calculator size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Porcentajes</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Porcentajes</span>}
          </button>

          <button 
            onClick={() => { scrollToSection('fuel-calc'); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Zap size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Combustible</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Combustible</span>}
          </button>

          <div className="w-8 h-[1px] bg-zinc-100 my-4" />

          <button 
            onClick={() => { toggleTeleprompter(); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Monitor size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Teleprompter</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Apuntador</span>}
          </button>

          <button 
            onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
            className={`w-full h-12 rounded-none flex-none flex items-center ${sidebarCollapsed && !mobileMenuOpen ? 'md:justify-center' : 'justify-start px-4'} transition-all group relative text-zinc-400 hover:text-black hover:bg-zinc-50`}
          >
            <Settings size={20} className="flex-none" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="ml-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">Configuración</span>}
            {sidebarCollapsed && !mobileMenuOpen && <span className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl hidden md:block">Ajustes</span>}
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
              <h1 className="text-lg md:text-xl font-black tracking-tighter text-black uppercase leading-none mb-1 md:mb-1.5 italic">Estudio.Modular</h1>
               <div className="flex items-center gap-2">
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400">Modular_04</span>
                  <span className="hidden md:block w-4 h-[1px] bg-zinc-200" />
                  <span className="hidden md:block text-[9px] font-mono text-zinc-400 uppercase">Estado: Nominal</span>
               </div>
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
             
             <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Settings size={20} />
             </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-12 pb-24 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-10">
            {/* Text Processor - Full Width */}
            <section id="text-processor" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <TextProcessor />
              </div>
            </section>

            {/* Screenwriter IA - Full Width */}
            <section id="screenwriter-ia" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <ScreenwriterIA />
              </div>
            </section>

            {/* Redactor IA - Full Width */}
            <section id="redactor-ia" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <RedactorIA />
              </div>
            </section>

            {/* Lluvia de Ideas - Full Width */}
            <section id="content-brainstormer" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <ContentBrainstormer />
              </div>
            </section>

            {/* Social Formatter - Full Width */}
            <section id="social-formatter" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <SocialFormatter />
              </div>
            </section>

            {/* Subtitle Assistant - Full Width */}
            <section id="subtitle-assistant" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <SubtitleAssistant />
              </div>
            </section>

            {/* QR Generator - Full Width */}
            <section id="qr-generator" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <QRGenerator />
              </div>
            </section>

            {/* Budget Calculator - Full Width */}
            <section id="budget-calculator" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <BudgetCalculator />
              </div>
            </section>

            {/* Percentage Calculator - Full Width */}
            <section id="percentage-calc" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <PercentageCalculator />
              </div>
            </section>

            {/* Fuel Calculator - Full Width */}
            <section id="fuel-calc" className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
              <div className="p-4 md:p-10 flex-1 scroll-smooth">
                <FuelCalculator />
              </div>
            </section>
          </div>
        </main>
        
        <footer className="h-12 border-t border-zinc-200 bg-white flex items-center justify-between px-4 md:px-12">
           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400">Sistema.Inactivo</span>
           <div className="flex gap-4 md:gap-8">
              <span className="text-[8px] md:text-[10px] font-mono text-zinc-400 uppercase">Nexus_v4.0</span>
              <span className="hidden md:inline text-[10px] font-mono text-zinc-400 uppercase">Latencia: 14ms</span>
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
                        Gemini API Key (Modo Local/Static)
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
                     <strong className="text-black">Nota:</strong> El sistema intenta usar el servidor central (seguro). Si estás en un entorno estático (GitHub Pages), puedes ingresar tu propia clave. Se guarda <strong>solo localmente</strong> en tu navegador.
                   </p>
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
                     Modelo de Inteligencia Artificial
                   </label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Preview', desc: 'Sugerido para creación (Alta Precisión)', color: 'border-zinc-100' },
                        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Lite', desc: 'Máxima Velocidad y Cuota RPD', color: 'border-zinc-100' },
                        { id: 'gemini-flash-latest', name: 'Gemini Flash Stable', desc: 'Equilibrio perfecto (Recomendado)', color: 'border-zinc-100' },
                        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'Máximo Razonamiento (Más Lento)', color: 'border-zinc-100' }
                      ].map(model => (
                        <button
                          key={model.id}
                          onClick={() => setTempModel(model.id)}
                          className={`p-4 border-2 text-left transition-all ${tempModel === model.id ? 'border-black bg-zinc-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}
                        >
                          <div className="font-bold text-xs uppercase tracking-tighter">{model.name}</div>
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{model.desc}</div>
                        </button>
                      ))}
                   </div>
                   <p className="text-[10px] text-zinc-500 leading-relaxed font-bold italic">
                     <span className="text-black not-italic underline decoration-red-500 decoration-2">IMPORTANTE:</span> Si recibes errores de "Quota Exceeded" (RPD) frecuentemente, te recomendamos cambiar a <strong className="text-black">Gemini 3.1 Lite</strong>.
                   </p>
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
