import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function PercentageCalculator() {
  const [x, setX] = useState<string>(''); // %
  const [y, setY] = useState<string>(''); // Base
  const [z, setZ] = useState<string>(''); // Result
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    const filled = [x, y, z].filter(val => val.trim() !== '').length;
    setError(null);

    if (filled === 3) {
      setError("Solo se permiten dos valores.");
      return;
    }

    if (filled < 2) {
      setError("Introduce al menos dos valores.");
      return;
    }

    const valX = parseFloat(x);
    const valY = parseFloat(y);
    const valZ = parseFloat(z);

    if (x === '') {
      if (!isNaN(valZ) && !isNaN(valY) && valY !== 0) {
        setX(((valZ / valY) * 100).toFixed(2).replace(/\.00$/, ''));
      }
    } else if (y === '') {
      if (!isNaN(valZ) && !isNaN(valX) && valX !== 0) {
        setY(((valZ * 100) / valX).toFixed(2).replace(/\.00$/, ''));
      }
    } else if (z === '') {
      if (!isNaN(valX) && !isNaN(valY)) {
        setZ(((valX / 100) * valY).toFixed(2).replace(/\.00$/, ''));
      }
    }
  };

  return (
    <div id="percentage-calculator" className="bg-transparent">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start mb-6">
        Calculadora de Porcentajes
      </h1>
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => { setX(''); setY(''); setZ(''); }}
          className="text-[9px] text-zinc-400 hover:text-black font-black uppercase transition-colors"
        >
          Reiniciar
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-bold">
        <div className="flex-1 md:flex-none flex items-center gap-3 bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={x}
            onChange={(e) => setX(e.target.value)}
            placeholder="X"
            className="w-full md:w-16 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
          <span className="text-zinc-400 font-black">%</span>
        </div>
        
        <span className="text-zinc-300 font-black uppercase hidden sm:inline italic">de</span>
        
        <div className="flex-1 md:flex-none bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={y}
            onChange={(e) => setY(e.target.value)}
            placeholder="Base"
            className="w-full md:w-24 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
        </div>
        
        <div className="w-8 h-[2px] bg-zinc-100 hidden sm:inline" />
        
        <div className="flex-1 md:flex-none bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={z}
            onChange={(e) => setZ(e.target.value)}
            placeholder="Total"
            className="w-full md:w-24 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
        </div>
        
        <button 
          onClick={handleCalculate}
          className="w-full md:w-auto md:ml-auto bg-black text-white px-8 py-4 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
        >
          <Calculator size={16} />
          Calcular
        </button>
      </div>

      {error ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      ) : (
        <div className="mt-8 flex items-center gap-3 text-[9px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
          <div className="w-1 h-3 bg-black" />
          <span>Condición Lógica: Mínimo 2 Parámetros</span>
        </div>
      )}
    </div>
  );
}
