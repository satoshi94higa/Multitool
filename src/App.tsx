import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, SquarePen, Gauge, RotateCcw, Brain, Video, Newspaper, Share2, QrCode, Calculator, Zap, ChevronLeft, ChevronRight, Menu, Settings, X, Key, Captions, CircleDollarSign, TrendingUp } from 'lucide-react';
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
                  <span className="hidden md:block text-[9px] font-mono text-zinc-400 uppercase">Estado: Nominal</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-zinc-50 border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Settings size={20} />
             </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-12 pb-24 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={
                <div className="space-y-8 md:space-y-10">
                  {TOOLS.map((item) => (
                    <section key={item.id} id={item.id} className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] md:shadow-[16px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all duration-300">
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
                      <div className="p-4 md:p-10 flex-1">
                        <item.component />
                      </div>
                    </section>
                  ))}
                </div>
              } />

              {TOOLS.map((item) => (
                <Route 
                  key={item.id} 
                  path={item.path} 
                  element={
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                       <div className="mb-8 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                                <item.icon size={24} />
                             </div>
                             <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">{item.short}</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Módulo Individual / Compartible</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => navigate('/')}
                            className="bg-zinc-100 px-6 h-12 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2"
                          >
                             <LayoutDashboard size={16} />
                             Volver al Panel
                          </button>
                       </div>
                       <section className="bg-white border-4 border-black shadow-[24px_24px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                          <div className="p-6 md:p-12">
                             <item.component />
                          </div>
                       </section>
                    </div>
                  } 
                />
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
    </div>
  );
}
