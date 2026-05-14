import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, Monitor } from 'lucide-react';

interface RemoteControlProps {
  sessionId: string;
}

export default function RemoteControl({ sessionId }: RemoteControlProps) {
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const sendCommand = async (command: string) => {
    try {
      setLastCommand(command);
      await fetch(`/api/remote/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      setTimeout(() => setLastCommand(null), 500);
    } catch (err) {
      console.error("Failed to send command", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-12 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/20">
          <Monitor size={32} />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight">Mando Remoto</h1>
        <p className="text-zinc-500 text-xs font-mono">ID: {sessionId}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
        <button 
          onClick={() => sendCommand('play_pause')}
          className={`h-32 rounded-3xl flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
            lastCommand === 'play_pause' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-800'
          }`}
        >
          <div className="flex gap-4">
            <Play size={48} fill="currentColor" />
            <Pause size={48} fill="currentColor" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => sendCommand('reset')}
            className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border transition-all active:scale-95 ${
              lastCommand === 'reset' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <RotateCcw size={24} />
            <span className="text-[10px] font-black uppercase">Reiniciar</span>
          </button>

          <button 
            disabled
            className="h-24 rounded-3xl flex flex-col items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-700 active:scale-95 transition-all"
          >
            <div className="flex gap-1">
              <ChevronUp size={20} />
              <ChevronDown size={20} />
            </div>
            <span className="text-[10px] font-black uppercase">Velocidad</span>
          </button>
        </div>
      </div>

      <div className="mt-12 text-[10px] text-zinc-600 font-mono flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Conectado al Teleprompter
      </div>
    </div>
  );
}
