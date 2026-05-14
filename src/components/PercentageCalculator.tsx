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
    <div id="percentage-calculator">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Calculadora de Porcentajes</h2>
        <button 
          onClick={() => { setX(''); setY(''); setZ(''); }}
          className="text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase"
        >
          Limpiar
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
        <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
          <input 
            type="number" 
            value={x}
            onChange={(e) => setX(e.target.value)}
            placeholder="X"
            className="w-14 bg-transparent text-center focus:outline-none font-bold"
          />
          <span className="text-gray-400 mr-1">%</span>
        </div>
        <span className="text-gray-400">de</span>
        <div className="bg-gray-50 border rounded-lg p-1">
          <input 
            type="number" 
            value={y}
            onChange={(e) => setY(e.target.value)}
            placeholder="Y"
            className="w-20 bg-transparent text-center focus:outline-none font-bold"
          />
        </div>
        <span className="text-gray-400">=</span>
        <div className="bg-gray-50 border rounded-lg p-1">
          <input 
            type="number" 
            value={z}
            onChange={(e) => setZ(e.target.value)}
            placeholder="Z"
            className="w-20 bg-transparent text-center focus:outline-none font-bold text-black"
          />
        </div>
        
        <button 
          onClick={handleCalculate}
          className="ml-auto bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          <Calculator size={14} />
          Calcular
        </button>
      </div>
      
      <p className="mt-4 text-[10px] text-gray-400 italic">
        Completa dos campos y presiona calcular para obtener el tercero.
      </p>
    </div>
  );
}
