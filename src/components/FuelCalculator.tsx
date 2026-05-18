import React, { useState } from 'react';
import { Fuel, Ruler, DollarSign, Users, Calculator, Info } from 'lucide-react';

export default function FuelCalculator() {
  const [distance, setDistance] = useState<number | ''>('');
  const [consumption, setConsumption] = useState<number | ''>(8);
  const [price, setPrice] = useState<number | ''>('');
  const [people, setPeople] = useState<number>(1);

  const calculate = () => {
    if (!distance || !consumption || !price) return null;
    
    const totalLiters = (distance * consumption) / 100;
    const totalCost = totalLiters * price;
    const costPerPerson = totalCost / people;

    return {
      liters: totalLiters.toFixed(2),
      totalCost: totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      costPerPerson: costPerPerson.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

  const results = calculate();

  return (
    <div className="space-y-10 bg-transparent" id="fuel-calculator">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start">
        Calculadora de Combustible
      </h1>
      <div className="flex items-center justify-between mt-4">
        <div className="p-3 bg-black text-white rounded-none shadow-2xl">
          <Fuel size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
            <Ruler size={14} className="text-black" /> Distancia (KM)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="0.00"
            className="w-full p-4 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black transition-all font-mono text-black placeholder-zinc-300 shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
            <Calculator size={14} className="text-black" /> Consumo (L/100)
          </label>
          <input
            type="number"
            value={consumption}
            onChange={(e) => setConsumption(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="8.0"
            className="w-full p-4 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black transition-all font-mono text-black placeholder-zinc-300 shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
            <DollarSign size={14} className="text-black" /> Precio Unitario
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="0.00"
            className="w-full p-4 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black transition-all font-mono text-black placeholder-zinc-300 shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
            <Users size={14} className="text-black" /> Ocupantes
          </label>
          <div className="flex items-center gap-1 bg-zinc-50 border-2 border-black/5 rounded-none p-1 focus-within:border-black transition-all shadow-sm">
            <button 
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="w-12 h-12 flex items-center justify-center bg-zinc-100/50 border border-zinc-200 rounded-none hover:bg-black hover:text-white transition-colors text-black font-black text-lg"
            >
              -
            </button>
            <div className="flex-1 text-center font-mono text-lg text-black font-bold">
              {people}
            </div>
            <button 
              onClick={() => setPeople(people + 1)}
              className="w-12 h-12 flex items-center justify-center bg-zinc-100/50 border border-zinc-200 rounded-none hover:bg-black hover:text-white transition-colors text-black font-black text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {results ? (
        <div className="bg-black rounded-none p-10 border-4 border-black animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-900 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
          
          <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10 border-b border-zinc-800 pb-6 relative z-10">
            <Info size={14} />
            <span>INFORME_DE_EJECUCIÓN</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">LITROS.TOTAL</p>
              <p className="text-3xl md:text-4xl font-black text-white leading-none font-mono tracking-tighter">{results.liters}<span className="text-xs text-zinc-700 ml-2">L</span></p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">COSTE.AGREGADO</p>
              <p className="text-3xl md:text-4xl font-black text-white leading-none font-mono tracking-tighter"><span className="text-sm text-zinc-700 mr-1">$</span>{results.totalCost}</p>
            </div>
            {people > 1 && (
              <div className="md:col-span-2 pt-10 border-t border-zinc-800 mt-4">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 border-l-4 border-white pl-4 italic">Asignación de Coste Individual ({people} Personas)</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                   <span className="text-xl md:text-2xl text-zinc-600 font-black tracking-tighter">$</span>
                   <p className="text-5xl md:text-7xl font-black text-white leading-none font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{results.costPerPerson}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-50 rounded-none p-12 border-2 border-zinc-100 border-dashed flex flex-col items-center justify-center text-center group">
          <Fuel className="text-zinc-200 mb-6 group-hover:text-black transition-colors duration-500" size={56} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-loose max-w-[200px]">
             Esperando parámetros de entrada logística...
          </p>
        </div>
      )}
    </div>
  );
}
