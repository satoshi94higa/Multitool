import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Play, Pause, RotateCcw, Type, Gauge, FlipHorizontal, 
  ChevronUp, ChevronDown, Monitor, Maximize2, Minimize2, Palette, Clock, FileText, Coffee, Zap 
} from 'lucide-react';

interface TeleprompterProps {
  initialText?: string;
  onClose: () => void;
}

type Theme = 'classic' | 'high-contrast' | 'safe-green' | 'light';

export default function Teleprompter({ initialText = '', onClose }: TeleprompterProps) {
  const [text, setText] = useState(initialText || 'Escribe o pega aquí tu guion...');
  const [isPlaying, setIsPlaying] = useState(false);
  const [targetDuration, setTargetDuration] = useState(3); // In minutes
  const [fontSize, setFontSize] = useState(64); // px
  const [lineHeight, setLineHeight] = useState(1.4);
  const [isMirrored, setIsMirrored] = useState(false);
  const [theme, setTheme] = useState<Theme>('classic');
  const [showConfig, setShowConfig] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showIndicator, setShowIndicator] = useState(true);
  const [targetWpm, setTargetWpm] = useState(140);
  const [indicatorSize, setIndicatorSize] = useState(120);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const scrollPosRef = useRef(0);
  const wakeLockRef = useRef<any>(null);

  // Sync duration with wpm
  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (words > 0) {
      setTargetDuration(words / targetWpm);
    }
  }, [targetWpm, text]);

  // Screen Wake Lock Management
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isPlaying]);

  // Re-request wake lock when returning to tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isPlaying]);

  const renderText = () => {
    return text;
  };

  // Statistics & Validations
  const stats = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const wpm = Math.round(words / (targetDuration || 0.1));
    
    let status: 'good' | 'warn' | 'bad' = 'good';
    if (wpm < 100 || wpm > 180) status = 'warn';
    if (wpm < 60 || wpm > 250) status = 'bad';

    return {
      words,
      wpm,
      status
    };
  }, [text, targetDuration]);

  // Handle Play with Countdown
  const handlePlayToggle = () => {
    if (!isPlaying && text.length > 0) {
      setCountdown(3);
    } else {
      setIsPlaying(false);
      setCountdown(null);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setIsPlaying(true);
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const themes = {
    classic: { bg: 'bg-black', text: 'text-white' },
    'high-contrast': { bg: 'bg-black', text: 'text-yellow-400' },
    'safe-green': { bg: 'bg-zinc-950', text: 'text-green-500' },
    'light': { bg: 'bg-white', text: 'text-slate-900 border-slate-200' }
  };

  // Animation Loop
  const animate = () => {
    if (!isPlaying || !scrollRef.current) return;
    
    const container = scrollRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    
    if (maxScroll <= 0) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Calculate pixels per frame base on duration
    const pixelsPerFrame = maxScroll / (targetDuration * 60 * 60);
    
    scrollPosRef.current += pixelsPerFrame;
    
    if (scrollPosRef.current >= maxScroll) {
      scrollPosRef.current = maxScroll;
      setIsPlaying(false);
    }
    
    container.scrollTop = scrollPosRef.current;
    setProgress((scrollPosRef.current / maxScroll) * 100);
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, targetDuration]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.code === 'ArrowUp') setTargetWpm(prev => Math.min(prev + 5, 250));
      if (e.code === 'ArrowDown') setTargetWpm(prev => Math.max(prev - 5, 60));
      if (e.code === 'Escape' && !isFullscreen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  const resetScroll = () => {
    setIsPlaying(false);
    scrollPosRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  return (
    <div className={`fixed inset-0 z-[100] ${themes[theme].bg} ${themes[theme].text} flex flex-col font-sans select-none overflow-hidden h-screen transition-colors duration-700`} id="teleprompter-overlay">
      {/* Header / Top Controls */}
      <div className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 ${theme === 'light' ? 'bg-white border-b-2 border-black' : 'bg-black/40 backdrop-blur-md border-b border-white/5'} transition-all duration-500 ${isPlaying && !showConfig ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-4">
          <div className={`${theme === 'light' ? 'bg-black' : 'bg-white/10'} p-2 rounded-none shadow-xl`}>
            <Monitor className="text-white" size={18} />
          </div>
          <h2 className={`text-[11px] font-black tracking-[0.4em] uppercase ${theme === 'light' ? 'text-black' : 'text-white opacity-70'}`}>APUNTADOR_v4_SERIE</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-5 px-5 mr-3 border-r-2 border-zinc-100 h-8">
             <div className="flex items-center gap-2">
                <FileText size={14} className={theme === 'light' ? "text-zinc-400" : "text-zinc-500"} />
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-400'}`}>{stats.words} PALABRAS</span>
             </div>
          </div>
          <button onClick={toggleFullscreen} className={`p-2 transition-all hover:scale-110 active:scale-95 ${theme === 'light' ? 'text-zinc-400 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-3 rounded-none transition-all shadow-xl border-2 ${showConfig ? (theme === 'light' ? 'bg-black text-white border-black' : 'bg-white text-black border-white') : (theme === 'light' ? 'text-zinc-400 hover:text-black bg-zinc-50 border-zinc-200' : 'text-zinc-400 hover:text-white bg-white/5 border-white/10')}`}
          >
            <Settings2 size={20} />
          </button>
          <button onClick={onClose} className={`p-2 transition-all hover:scale-110 active:scale-95 ml-2 ${theme === 'light' ? 'text-zinc-400 hover:text-black' : 'text-zinc-400 hover:text-red-500'}`}>
            <X size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Teleprompter Area */}
        <div className="flex-1 relative flex flex-col bg-inherit">
          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className={`absolute inset-0 z-[100] ${theme === 'light' ? 'bg-white/95' : 'bg-black/80'} backdrop-blur-md flex items-center justify-center`}>
              <div className={`text-[160px] font-black animate-bounce ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                {countdown > 0 ? countdown : '¡YA!'}
              </div>
            </div>
          )}

          {/* Visual Indicator (Middle lines) */}
          {showIndicator && (
             <>
              <div 
                style={{ height: `${indicatorSize}px` }}
                className={`absolute top-1/2 left-0 right-0 pointer-events-none transform -translate-y-1/2 border-y-2 z-10 ${theme === 'light' ? 'bg-zinc-100/30 border-black/5 shadow-[inset_0_0_100px_rgba(0,0,0,0.02)]' : 'bg-white/5 border-white/10'}`} 
              />
              <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-black border-b-[12px] border-b-transparent animate-pulse" />
              </div>
             </>
          )}

          {/* Progress Bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 z-50 ${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900/30'}`}>
            <div 
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div 
            ref={scrollRef}
            className={`flex-1 overflow-y-auto px-[12%] sm:px-[18%] pt-[45vh] pb-[55vh] transition-all duration-500 scroll-smooth ${isMirrored ? '-scale-x-100' : ''} ${showConfig ? 'sm:mr-80 mr-0' : 'mr-0'} scrollbar-hide`}
            id="teleprompter-content"
          >
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }} 
              className={`font-black text-center whitespace-pre-wrap select-none tracking-tight break-words uppercase`}
            >
              {renderText()}
              <div className={`mt-32 pt-16 border-t-4 text-[11px] font-black uppercase tracking-[1em] text-center ${theme === 'light' ? 'border-black text-black' : 'border-zinc-800/20 text-zinc-800'}`}>
                FIN_DE_SESIÓN
              </div>
            </div>
          </div>

          {/* Floating Controls Overlay */}
          <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 backdrop-blur-2xl border-2 p-3 rounded-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-50 transition-all duration-500 ${theme === 'light' ? 'bg-white/95 border-black' : 'bg-black/80 border-white/10'} ${isPlaying && !showConfig ? 'opacity-20 hover:opacity-100 scale-95 hover:scale-100' : 'opacity-100 scale-100'}`}>
            <button 
              onClick={resetScroll}
              className={`p-4 transition-all hover:scale-110 active:scale-95 ${theme === 'light' ? 'text-zinc-400 hover:text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              <RotateCcw size={20} />
            </button>
            
            <button 
              onClick={handlePlayToggle}
              className={`w-16 h-16 rounded-none flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl ${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
            </button>

            <div className={`flex flex-col items-center px-8 border-l-2 min-w-[140px] ${theme === 'light' ? 'border-zinc-100' : 'border-white/5'}`}>
               <div className="flex items-center gap-3 mb-1">
                  <div className={`w-2 h-2 rounded-none animate-pulse ${stats.status === 'bad' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : stats.status === 'warn' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]'}`} />
                  <span className={`text-[11px] font-black font-mono uppercase tracking-[0.2em] ${theme === 'light' ? 'text-black' : 'text-zinc-400'}`}>
                    {stats.wpm} WPM
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Config (Now on Right, Floating-style) */}
        {showConfig && (
          <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-80 border-l-2 p-8 space-y-10 overflow-y-auto scrollbar-hide z-[60] shadow-[0_0_80px_rgba(0,0,0,0.2)] ${theme === 'light' ? 'bg-white border-zinc-100' : 'bg-black border-white/10 backdrop-blur-2xl'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-[11px] font-black uppercase tracking-[0.5em] ${theme === 'light' ? 'text-zinc-300' : 'text-white/50'}`}>Parámetros</h3>
              <button onClick={() => setShowConfig(false)} className={`p-2 transition-all hover:rotate-90 hover:scale-110 ${theme === 'light' ? 'text-zinc-400 hover:text-black' : 'text-zinc-500 hover:text-white'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                  <Type size={14} className="text-black" />
                  Tamaño Óptico
                </label>
                <span className={`text-[12px] font-mono font-black ${theme === 'light' ? 'text-black' : 'text-white/40'}`}>{fontSize}PX</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(f => Math.max(f - 4, 24))} className={`flex-1 py-4 border-2 rounded-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-black hover:bg-black hover:text-white hover:border-black shadow-sm' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}><ChevronDown size={18} className="mx-auto" /></button>
                <button onClick={() => setFontSize(f => Math.min(f + 4, 200))} className={`flex-1 py-4 border-2 rounded-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-black hover:bg-black hover:text-white hover:border-black shadow-sm' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}><ChevronUp size={18} className="mx-auto" /></button>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                <Gauge size={14} className="text-black" />
                Velocidad de Señal
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Lento', wpm: 120, icon: <Coffee size={14} /> },
                  { label: 'Base', wpm: 145, icon: <Zap size={14} className="text-black group-hover:text-white" /> },
                  { label: 'Rápido', wpm: 180, icon: <Zap size={14} className="text-black group-hover:text-white" /> }
                ].map(style => (
                  <button
                    key={style.label}
                    onClick={() => setTargetWpm(style.wpm)}
                    className={`flex flex-col items-center justify-center py-5 rounded-none border-2 transition-all group ${targetWpm === style.wpm 
                      ? (theme === 'light' ? 'bg-black border-black text-white shadow-2xl scale-110' : 'bg-white border-white scale-105') 
                      : (theme === 'light' ? 'bg-zinc-50 border-zinc-100 hover:border-black text-zinc-400 hover:text-black' : 'border-white/5 bg-white/5 hover:border-white/20')}`}
                  >
                    <span className={`mb-2 transition-colors ${targetWpm === style.wpm ? (theme === 'light' ? 'text-white' : 'text-black') : 'text-zinc-300'}`}>{style.icon}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${targetWpm === style.wpm ? (theme === 'light' ? 'text-white' : 'text-black') : 'text-zinc-400'}`}>{style.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <input 
                  type="range" min="60" max="250" step="5" value={targetWpm} 
                  onChange={(e) => setTargetWpm(parseInt(e.target.value))}
                  className={`w-full h-1.5 rounded-none appearance-none cursor-pointer ${theme === 'light' ? 'bg-zinc-100 accent-black' : 'bg-white/10 accent-white'}`}
                />
                <div className={`flex justify-between text-[9px] font-mono font-black uppercase tracking-[0.3em] px-1 ${theme === 'light' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  <span>Lineal</span>
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>{targetWpm} WPM</span>
                  <span>Máx</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] block italic">Foco</label>
                <input 
                  type="range" min="40" max="250" step="10" value={indicatorSize} 
                  onChange={(e) => setIndicatorSize(parseInt(e.target.value))}
                  className={`w-full h-1.5 rounded-none appearance-none cursor-pointer ${theme === 'light' ? 'bg-zinc-100 accent-black' : 'bg-white/10 accent-white'}`}
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] block italic">Densidad</label>
                <div className="flex gap-2">
                  {[1.2, 1.6].map(lh => (
                    <button 
                      key={lh}
                      onClick={() => setLineHeight(lh)}
                      className={`flex-1 py-3 rounded-none border-2 text-[10px] font-black transition-all ${lineHeight === lh 
                        ? (theme === 'light' ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-black') 
                        : (theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-zinc-300' : 'border-white/5 text-zinc-600')}`}
                    >
                      {lh}X
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                <Palette size={14} className="text-black" />
                Matriz Visual
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['light', 'classic', 'high-contrast', 'safe-green'] as Theme[]).map(t => (
                   <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`h-14 rounded-none border-2 transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${theme === t ? ' border-black ring-4 ring-black/5 scale-105 z-10' : (theme === 'light' ? 'border-zinc-100 hover:border-black bg-zinc-50' : 'border-white/10 hover:border-white/20')}`}
                    style={{ backgroundColor: t === 'light' ? '#fff' : t === 'classic' ? '#1a1a1a' : t === 'high-contrast' ? '#000' : '#050505' }}
                   >
                      <div className={`text-[8px] font-black uppercase tracking-tighter ${t === 'light' ? 'text-black' : t === 'classic' ? 'text-white' : t === 'high-contrast' ? 'text-yellow-400' : 'text-green-500'}`}>
                        {t === 'light' ? 'Blanco' : t === 'classic' ? 'Obsidiana' : t === 'high-contrast' ? 'Contraste' : 'Terminal'}
                      </div>
                   </button>
                ))}
              </div>
            </div>

            <div className={`pt-10 border-t-2 space-y-6 ${theme === 'light' ? 'border-zinc-50' : 'border-white/5'}`}>
              <div className="flex items-center justify-between group">
                <span className="text-[10px] font-black text-black uppercase tracking-[0.3em] italic">Guia Telemétrica</span>
                <button 
                  onClick={() => setShowIndicator(!showIndicator)}
                  className={`w-12 h-6 rounded-none relative transition-all border-2 ${showIndicator ? 'bg-black border-black' : 'bg-zinc-50 border-zinc-100'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-none transition-all shadow-sm ${showIndicator ? 'right-0.5 bg-white' : 'left-0.5 bg-zinc-300'}`} />
                </button>
              </div>

              <button 
                onClick={() => setIsMirrored(!isMirrored)}
                className={`w-full py-5 rounded-none font-black text-[10px] flex items-center justify-center gap-3 border-2 transition-all uppercase tracking-[0.2em] shadow-xl ${
                  isMirrored 
                  ? (theme === 'light' ? 'bg-black text-white border-black' : 'bg-white text-black') 
                  : (theme === 'light' ? 'bg-zinc-50 text-zinc-300 border-zinc-100 hover:border-black hover:text-black' : 'bg-white/5 text-zinc-400 border-white/5 hover:border-white/10')
                }`}
              >
                <FlipHorizontal size={18} />
                Flujo_Espejo {isMirrored ? 'Activado' : 'Desactivado'}
              </button>
            </div>

            <div className={`pt-10 border-t-2 space-y-4 ${theme === 'light' ? 'border-zinc-50' : 'border-white/5'}`}>
               <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] italic">Buffer de Guion</label>
               <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`w-full h-48 border-2 rounded-none p-6 text-[12px] focus:outline-none resize-none leading-relaxed font-mono shadow-inner ${theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-black focus:border-black' : 'bg-white/5 border-white/5 text-zinc-400 focus:border-white/10'}`}
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component Helper
const Settings2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
