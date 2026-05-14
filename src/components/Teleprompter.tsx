import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Play, Pause, RotateCcw, Type, Gauge, FlipHorizontal, 
  ChevronUp, ChevronDown, Monitor, Maximize2, Minimize2, Palette, Clock, FileText, Coffee, Zap,
  Mic, MicOff, MousePointer2, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [isMirrored, setIsMirrored] = useState(false);
  const [theme, setTheme] = useState<Theme>('classic');
  const [showConfig, setShowConfig] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // New features
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isLineHighlightEnabled, setIsLineHighlightEnabled] = useState(true);
  const [targetWpm, setTargetWpm] = useState(140);
  const [controlMode, setControlMode] = useState<'wpm' | 'duration'>('duration');
  const [remoteSessionId] = useState(() => Math.random().toString(36).substring(2, 9));
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'connected'>('idle');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const scrollPosRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Sync wpm and duration
  useEffect(() => {
    if (controlMode === 'wpm') {
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (words > 0) {
        setTargetDuration(words / targetWpm);
      }
    }
  }, [targetWpm, controlMode, text]);

  // Voice Detection Logic
  useEffect(() => {
    if (!isVoiceEnabled) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      return;
    }

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let silenceCount = 0;
        
        const checkVolume = () => {
          if (!isVoiceEnabled) return;
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Simple thresholding
          if (average > 10) { // Detection threshold
            if (!isPlaying && !countdown) setIsPlaying(true);
            silenceCount = 0;
          } else {
            silenceCount++;
            if (silenceCount > 60 && isPlaying) { // ~1 second of silence
              setIsPlaying(false);
            }
          }
          
          requestAnimationFrame(checkVolume);
        };
        
        checkVolume();
      } catch (err) {
        console.error("Mic access denied", err);
        setIsVoiceEnabled(false);
      }
    };

    startMic();
    
    return () => {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isVoiceEnabled]);

  // Remote Control Polling
  useEffect(() => {
    const pollRemote = async () => {
      try {
        const res = await fetch(`/api/remote/${remoteSessionId}`);
        const data = await res.json();
        
        if (data.command === 'play_pause') {
          handlePlayToggle();
        } else if (data.command === 'reset') {
          resetScroll();
        }
      } catch (err) {
        console.error("Remote poll failed", err);
      }
    };

    const interval = setInterval(pollRemote, 1000);
    return () => clearInterval(interval);
  }, [remoteSessionId, isPlaying, countdown]);

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
    <div className={`fixed inset-0 z-[100] ${themes[theme].bg} ${themes[theme].text} flex flex-col font-sans select-none overflow-hidden h-screen`} id="teleprompter-overlay">
      {/* Header / Top Controls */}
      <div className={`flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 transition-opacity duration-500 ${isPlaying && !showConfig ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <Monitor className="text-zinc-500" size={20} />
          <h2 className="text-sm font-bold tracking-tight text-white uppercase">Teleprompter Pro v2</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 px-4 border-r border-zinc-800">
             <div className="flex items-center gap-2">
                <FileText size={14} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400">{stats.words} palabras</span>
             </div>
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400">Est: {stats.time}</span>
             </div>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Settings2 size={20} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 text-zinc-500 hover:text-white">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Config (Collapsible) */}
        {showConfig && (
          <div className="w-80 bg-zinc-900 border-r border-zinc-800 p-6 space-y-8 overflow-y-auto max-h-full">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Type size={12} />
                Tamaño de texto
              </label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFontSize(f => Math.max(f - 8, 24))} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white"><ChevronDown size={16} /></button>
                <span className="flex-1 text-center font-mono font-bold text-xl text-white">{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(f + 8, 200))} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white"><ChevronUp size={16} /></button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Gauge size={12} />
                  Ritmo de Voz
                </label>
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button 
                    onClick={() => setControlMode('wpm')}
                    className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-all ${controlMode === 'wpm' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                  >
                    WPM
                  </button>
                  <button 
                    onClick={() => setControlMode('duration')}
                    className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-all ${controlMode === 'duration' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                  >
                    Tiempo
                  </button>
                </div>
              </div>

              {controlMode === 'wpm' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Calmo', wpm: 120, icon: <Coffee size={12} /> },
                      { label: 'Natural', wpm: 145, icon: <Zap size={12} className="text-blue-400" /> },
                      { label: 'Rápido', wpm: 175, icon: <Zap size={12} className="text-amber-400" /> }
                    ].map(style => (
                      <button
                        key={style.label}
                        onClick={() => {
                          setTargetWpm(style.wpm);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all group ${targetWpm === style.wpm ? 'bg-white border-white scale-105' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'}`}
                      >
                        <span className={`${targetWpm === style.wpm ? 'text-black' : 'text-zinc-500 group-hover:text-white'} transition-colors mb-1`}>{style.icon}</span>
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${targetWpm === style.wpm ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{style.label}</span>
                        <span className={`text-[7px] font-mono ${targetWpm === style.wpm ? 'text-zinc-600' : 'text-zinc-700'}`}>{style.wpm} WPM</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="range" min="60" max="250" step="5" value={targetWpm} 
                      onChange={(e) => setTargetWpm(parseInt(e.target.value))}
                      className="w-full accent-white"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                      <span>Lento</span>
                      <span className="text-white font-bold">{targetWpm} WPM</span>
                      <span>Pro</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input 
                    type="range" min="0.1" max="15" step="0.1" value={targetDuration} 
                    onChange={(e) => setTargetDuration(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                    <span>Breve</span>
                    <span className="text-white font-bold">{targetDuration.toFixed(1)} min</span>
                    <span>Largo</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Mic size={12} className={isVoiceEnabled ? 'text-emerald-500' : ''} />
                  Activación por Voz
                </label>
                <button 
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isVoiceEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isVoiceEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-[9px] text-zinc-500 italic">El scroll se pausa cuando dejas de hablar.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <MousePointer2 size={12} className={isLineHighlightEnabled ? 'text-emerald-500' : ''} />
                  Resaltado de Línea
                </label>
                <button 
                  onClick={() => setIsLineHighlightEnabled(!isLineHighlightEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isLineHighlightEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLineHighlightEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <QrCode size={12} />
                Control Remoto
              </label>
              <div className="bg-white p-4 rounded-xl flex flex-col items-center gap-4">
                <QRCodeSVG 
                  value={`${window.location.origin}/remote/${remoteSessionId}`} 
                  size={140}
                  level="H"
                />
                <div className="text-center space-y-1">
                  <p className="text-[9px] font-black text-black uppercase tracking-tight">Escanea para controlar</p>
                  <p className="text-[8px] text-zinc-400 break-all font-mono">ID: {remoteSessionId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} />
                Temas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['classic', 'high-contrast', 'safe-green'] as Theme[]).map(t => (
                   <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`h-10 rounded-lg border-2 transition-all ${theme === t ? 'border-white' : 'border-zinc-800 hover:border-zinc-700'}`}
                    style={{ backgroundColor: t === 'classic' ? '#000' : t === 'high-contrast' ? '#000' : '#09090b' }}
                   >
                     <div className={`w-full h-full flex items-center justify-center text-[8px] font-black uppercase ${t === 'classic' ? 'text-white' : t === 'high-contrast' ? 'text-yellow-400' : 'text-green-500'}`}>
                        {t === 'classic' ? 'ABC' : t === 'high-contrast' ? 'ABC' : 'ABC'}
                     </div>
                   </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <button 
                onClick={() => setIsMirrored(!isMirrored)}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  isMirrored ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <FlipHorizontal size={16} />
                MODO ESPEJO {isMirrored ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-800">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-zinc-400">Edición de Guion</label>
               <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
               />
            </div>
          </div>
        )}

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

          {/* Line Highlight Overlay */}
          {isLineHighlightEnabled && (
             <div className="absolute inset-0 pointer-events-none z-10">
                <div className="h-full w-full flex flex-col">
                  <div className="flex-1 bg-black/40 backdrop-blur-[2px]" />
                  <div className="h-[1.5em] bg-transparent border-y border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ marginTop: 'calc(50vh - 1em)' }} />
                  <div className="flex-1 bg-black/40 backdrop-blur-[2px]" />
                </div>
             </div>
          )}

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900/50 z-50">
            <div 
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div 
            ref={scrollRef}
            className={`flex-1 overflow-y-auto px-[15%] pt-[45vh] pb-[70vh] transition-transform duration-300 scroll-smooth ${isMirrored ? '-scale-x-100' : ''}`}
            id="teleprompter-content"
          >
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }} 
              className={`font-bold text-center whitespace-pre-wrap select-none tracking-tight break-words ${isLineHighlightEnabled ? 'opacity-80' : ''}`}
            >
              {renderText()}
              <div className="mt-20 pt-10 border-t border-zinc-800/30 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 text-center">
                FIN DEL GUION
              </div>
            </div>
          </div>

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/50 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
            <button 
              onClick={resetScroll}
              className="p-3 text-zinc-500 hover:text-white transition-colors"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={handlePlayToggle}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} className="ml-0.5" fill="black" />}
            </button>
            <div className="flex flex-col items-center px-4 border-l border-zinc-800 min-w-[120px]">
               <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.status === 'bad' ? 'bg-red-500' : stats.status === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                    {stats.wpm} WPM
                  </span>
               </div>
               <span className="text-xs font-mono font-bold text-white leading-none">{stats.time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component Helper
const Settings2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
