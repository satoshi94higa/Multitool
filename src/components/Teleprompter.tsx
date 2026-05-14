import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, RotateCcw, Type, Gauge, FlipHorizontal, 
  ChevronUp, ChevronDown, Monitor, Maximize2, Minimize2 
} from 'lucide-react';

interface TeleprompterProps {
  initialText?: string;
  onClose: () => void;
}

export default function Teleprompter({ initialText = '', onClose }: TeleprompterProps) {
  const [text, setText] = useState(initialText || 'Escribe o pega aquí tu guion...');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // 1 to 10
  const [fontSize, setFontSize] = useState(48); // px
  const [isMirrored, setIsMirrored] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const scrollPosRef = useRef(0);

  // Animation Loop
  const animate = () => {
    if (!isPlaying) return;
    
    scrollPosRef.current += speed * 0.5;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosRef.current;
    }
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
  }, [isPlaying, speed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.code === 'ArrowUp') setSpeed(prev => Math.min(prev + 1, 20));
      if (e.code === 'ArrowDown') setSpeed(prev => Math.max(prev - 1, 1));
      if (e.code === 'Escape' && !isFullscreen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans select-none overflow-hidden h-screen" id="teleprompter-overlay">
      {/* Header / Top Controls */}
      <div className={`flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 transition-opacity duration-500 ${isPlaying && !showConfig ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <Monitor className="text-zinc-500" size={20} />
          <h2 className="text-sm font-bold tracking-tight text-white uppercase">Teleprompter Pro</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-white'}`}
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
                <button onClick={() => setFontSize(f => Math.max(f - 8, 24))} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"><ChevronDown size={16} /></button>
                <span className="flex-1 text-center font-mono font-bold text-xl">{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(f + 8, 200))} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"><ChevronUp size={16} /></button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Gauge size={12} />
                Velocidad ({speed})
              </label>
              <input 
                type="range" min="1" max="20" value={speed} 
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full accent-zinc-100"
              />
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
               <label className="text-[10px] font-black text-zinc-500 uppercase">Script Editor</label>
               <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600 resize-none"
               />
            </div>
          </div>
        )}

        {/* Teleprompter Area */}
        <div className="flex-1 relative flex flex-col bg-black">
          {/* Visual Indicator (Middle lines) */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-300 opacity-20 transform -translate-y-1/2 z-10 pointer-events-none" />
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20 pointer-events-none">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-red-500 border-b-[10px] border-b-transparent" />
          </div>

          <div 
            ref={scrollRef}
            className={`flex-1 overflow-y-auto px-[15%] pt-[40vh] pb-[60vh] transition-transform duration-300 ${isMirrored ? '-scale-x-100' : ''}`}
            id="teleprompter-content"
          >
            <div 
              style={{ fontSize: `${fontSize}px` }} 
              className="font-bold leading-[1.3] text-center whitespace-pre-wrap select-none tracking-tight"
            >
              {text}
            </div>
          </div>

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-full shadow-2xl z-50">
            <button 
              onClick={resetScroll}
              className="p-4 text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} className="ml-1" fill="black" />}
            </button>
            <div className="flex flex-col items-center px-4 border-l border-zinc-800">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Vel</span>
               <span className="text-xl font-mono font-bold">{speed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component Helper
const Settings2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
