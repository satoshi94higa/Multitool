import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function PercentageCalculator() {
  const [x, setX] = useState<string>(''); // %
  const [y, setY] = useState<string>(''); // Base
  const [z, setZ] = useState<string>(''); // Result

  const handleCalculate = () => {
    const filled = [x, y, z].filter(val => val.trim() !== '').length;

    if (filled === 3) {
      alert("Los campos de entrada deben tener sólo dos valores.");
      return;
    }

    if (filled < 2) {
      alert("Introduce al menos dos valores.");
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Cálculo de Porcentajes</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">DATA.PERCENT_LOGIC</span>
        </div>
        <button 
          onClick={() => { setX(''); setY(''); setZ(''); }}
          className="text-[9px] text-zinc-400 hover:text-black font-black uppercase transition-colors"
        >
          Reiniciar
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 text-xs font-bold">
        <div className="flex items-center gap-3 bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={x}
            onChange={(e) => setX(e.target.value)}
            placeholder="X"
            className="w-16 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
          <span className="text-zinc-400 font-black">%</span>
        </div>
        
        <span className="text-zinc-300 font-black uppercase hidden sm:inline italic">de</span>
        
        <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={y}
            onChange={(e) => setY(e.target.value)}
            placeholder="Base"
            className="w-24 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
        </div>
        
        <div className="w-8 h-[2px] bg-zinc-100 hidden sm:inline" />
        
        <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none px-4 py-3 focus-within:border-black transition-all">
          <input 
            type="number" 
            value={z}
            onChange={(e) => setZ(e.target.value)}
            placeholder="Total"
            className="w-24 bg-transparent text-center focus:outline-none text-black placeholder-zinc-300 font-mono text-base"
          />
        </div>
        
        <button 
          onClick={handleCalculate}
          className="ml-auto bg-black text-white px-8 py-4 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
        >
          <Calculator size={16} />
          Calcular
        </button>
      </div>
      
      <div className="mt-8 flex items-center gap-3 text-[9px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
        <div className="w-1 h-3 bg-black" />
        <span>Condición Lógica: Mínimo 2 Parámetros</span>
      </div>
    </div>
  );
}
