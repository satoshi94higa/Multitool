import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Play, Pause, RotateCcw, Type, Gauge, FlipHorizontal, 
  ChevronUp, ChevronDown, Monitor, Maximize2, Minimize2, Palette, Clock, FileText, Coffee, Zap 
} from 'lucide-react';

interface TeleprompterProps {
  initialText?: string;
  onClose: () => void;
}

type Theme = 'classic' | 'high-contrast' | 'safe-green';

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
      status,
      time: `${Math.floor(targetDuration)}m ${Math.round((targetDuration % 1) * 60)}s`
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
    'safe-green': { bg: 'bg-zinc-950', text: 'text-green-500' }
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
      if (e.code === 'ArrowUp') setTargetDuration(prev => Math.max(prev - (5/60), 5/60));
      if (e.code === 'ArrowDown') setTargetDuration(prev => Math.min(prev + (5/60), 20));
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
    <div className={`fixed inset-0 z-[100] ${themes[theme].bg} ${themes[theme].text} flex flex-col font-sans select-none overflow-hidden h-screen`} id="teleprompter-overlay">      {/* Header / Top Controls */}
      <div className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-500 ${isPlaying && !showConfig ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md border border-white/10">
            <Monitor className="text-white" size={16} />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.2em] text-white uppercase opacity-70">Teleprompter Pro</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 px-3 mr-2">
             <div className="flex items-center gap-1.5">
                <FileText size={12} className="text-zinc-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase">{stats.words} wds</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-zinc-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase">{stats.time}</span>
             </div>
          </div>
          <button onClick={toggleFullscreen} className="p-2 text-zinc-400 hover:text-white transition-colors">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg transition-all ${showConfig ? 'bg-white text-black' : 'text-zinc-400 hover:text-white bg-white/5'}`}
          >
            <Settings2 size={18} />
          </button>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-red-500 transition-colors ml-2">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Teleprompter Area */}
        <div className="flex-1 relative flex flex-col bg-inherit">
          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-[180px] font-black text-white animate-pulse">
                {countdown > 0 ? countdown : 'GO!'}
              </div>
            </div>
          )}

          {/* Visual Indicator (Middle lines) */}
          {showIndicator && (
             <>
              <div 
                style={{ height: `${indicatorSize}px` }}
                className="absolute top-1/2 left-0 right-0 bg-white/5 pointer-events-none transform -translate-y-1/2 border-y border-white/10 z-10" 
              />
              <div className="absolute top-1/2 left-6 transform -translate-y-1/2 z-20 pointer-events-none opacity-80">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-red-500 border-b-[10px] border-b-transparent animate-pulse" />
              </div>
             </>
          )}

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-900/30 z-50">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div 
            ref={scrollRef}
            className={`flex-1 overflow-y-auto px-[10%] sm:px-[15%] pt-[45vh] pb-[55vh] transition-all duration-500 scroll-smooth ${isMirrored ? '-scale-x-100' : ''} ${showConfig ? 'sm:mr-72 mr-0' : 'mr-0'}`}
            id="teleprompter-content"
          >
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }} 
              className={`font-bold text-center whitespace-pre-wrap select-none tracking-tight break-words`}
            >
              {renderText()}
              <div className="mt-24 pt-12 border-t border-zinc-800/20 text-[9px] font-black uppercase tracking-[0.8em] text-zinc-800 text-center">
                FIN DE LA SESIÓN
              </div>
            </div>
          </div>

          {/* Floating Controls Overlay */}
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-2xl z-50 transition-all duration-500 ${isPlaying && !showConfig ? 'opacity-20 hover:opacity-100 scale-95 hover:scale-100' : 'opacity-100'}`}>
            <button 
              onClick={resetScroll}
              className="p-3 text-zinc-500 hover:text-white transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            
            <button 
              onClick={handlePlayToggle}
              className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
            >
              {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} className="ml-0.5" fill="black" />}
            </button>

            <div className="flex flex-col items-center px-5 border-l border-white/5 min-w-[110px]">
               <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.status === 'bad' ? 'bg-red-500' : stats.status === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                    {stats.wpm} WPM
                  </span>
               </div>
               <span className="text-xs font-mono font-black text-white">{stats.time}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Config (Now on Right, Floating-style) */}
        {showConfig && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-72 bg-zinc-950/95 backdrop-blur-2xl border-l border-white/5 p-5 space-y-6 overflow-y-auto scrollbar-hide z-[60] shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Ajustes</h3>
              <button onClick={() => setShowConfig(false)} className="p-1 hover:text-white text-zinc-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Type size={12} className="text-zinc-400" />
                  Tipografía
                </label>
                <span className="text-[10px] font-mono font-bold text-white/40">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setFontSize(f => Math.max(f - 4, 24))} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all text-white"><ChevronDown size={14} className="mx-auto" /></button>
                <button onClick={() => setFontSize(f => Math.min(f + 4, 200))} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all text-white"><ChevronUp size={14} className="mx-auto" /></button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Gauge size={12} className="text-zinc-400" />
                Velocidad
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Relax', wpm: 120, icon: <Coffee size={10} /> },
                  { label: 'Pro', wpm: 145, icon: <Zap size={10} className="text-blue-400" /> },
                  { label: 'Fast', wpm: 180, icon: <Zap size={10} className="text-amber-400" /> }
                ].map(style => (
                  <button
                    key={style.label}
                    onClick={() => setTargetWpm(style.wpm)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${targetWpm === style.wpm ? 'bg-white border-white scale-105' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                  >
                    <span className={`${targetWpm === style.wpm ? 'text-black' : 'text-zinc-500 opacity-50'} mb-1`}>{style.icon}</span>
                    <span className={`text-[7px] font-black uppercase tracking-tighter ${targetWpm === style.wpm ? 'text-black' : 'text-zinc-400'}`}>{style.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <input 
                  type="range" min="60" max="250" step="5" value={targetWpm} 
                  onChange={(e) => setTargetWpm(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-widest px-1">
                  <span>Slow</span>
                  <span className="text-white">{targetWpm} WPM</span>
                  <span>Hyper</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Foco</label>
                <input 
                  type="range" min="40" max="250" step="10" value={indicatorSize} 
                  onChange={(e) => setIndicatorSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Interlineado</label>
                <div className="flex gap-1">
                  {[1.2, 1.6].map(lh => (
                    <button 
                      key={lh}
                      onClick={() => setLineHeight(lh)}
                      className={`flex-1 py-1.5 rounded-md border text-[8px] font-black ${lineHeight === lh ? 'bg-white text-black' : 'border-white/5 text-zinc-600'}`}
                    >
                      {lh}X
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Palette size={12} className="text-zinc-400" />
                Estilo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['classic', 'high-contrast', 'safe-green'] as Theme[]).map(t => (
                   <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`h-8 rounded-md border transition-all ${theme === t ? 'border-white ring-2 ring-white/20' : 'border-white/5 hover:border-white/20'}`}
                    style={{ backgroundColor: t === 'classic' ? '#000' : t === 'high-contrast' ? '#000' : '#050505' }}
                   >
                     <div className={`w-full h-full flex items-center justify-center text-[7px] font-black uppercase ${t === 'classic' ? 'text-white' : t === 'high-contrast' ? 'text-yellow-400' : 'text-green-500'}`}>
                        {t === 'classic' ? 'CLA' : t === 'high-contrast' ? 'HI' : 'GRN'}
                     </div>
                   </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Guía de Lectura</span>
                <button 
                  onClick={() => setShowIndicator(!showIndicator)}
                  className={`w-9 h-4.5 rounded-full relative transition-all ${showIndicator ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${showIndicator ? 'right-0.5 underline' : 'left-0.5'}`} />
                </button>
              </div>

              <button 
                onClick={() => setIsMirrored(!isMirrored)}
                className={`w-full py-2.5 rounded-lg font-bold text-[9px] flex items-center justify-center gap-2 border transition-all ${
                  isMirrored ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 border-white/5 hover:border-white/10'
                }`}
              >
                <FlipHorizontal size={14} />
                MODO ESPEJO {isMirrored ? 'OK' : 'OFF'}
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
               <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Editor de Guion</label>
               <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-40 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-zinc-400 focus:outline-none focus:border-white/20 resize-none leading-relaxed"
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
