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
    <div className="space-y-6" id="fuel-calculator">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <Fuel size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Calculadora de Nafta</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Viajes y Consumo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1 flex items-center gap-1">
            <Ruler size={10} /> Distancia (km)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="Ej: 450"
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1 flex items-center gap-1">
            <Calculator size={10} /> Consumo (L/100km)
          </label>
          <input
            type="number"
            value={consumption}
            onChange={(e) => setConsumption(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="Ej: 8"
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1 flex items-center gap-1">
            <DollarSign size={10} /> Precio por Litro
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            placeholder="Ej: 1000"
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1 flex items-center gap-1">
            <Users size={10} /> Pasajeros
          </label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-sm bg-white border border-gray-100 rounded-xl py-2">
              {people}
            </div>
            <button 
              onClick={() => setPeople(people + 1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {results ? (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4">
            <Info size={12} />
            <span>Resultado del Viaje</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter">Nafta Necesaria</p>
              <p className="text-xl font-bold text-amber-900 leading-none">{results.liters} <span className="text-sm">L</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter">Costo Total</p>
              <p className="text-xl font-bold text-amber-900 leading-none"><span className="text-sm">$</span>{results.totalCost}</p>
            </div>
            {people > 1 && (
              <div className="col-span-2 pt-3 border-t border-amber-100/50 mt-1">
                <p className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter mb-1">Por Persona ({people})</p>
                <p className="text-2xl font-bold text-amber-900 leading-none"><span className="text-sm">$</span>{results.costPerPerson}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 border-dashed flex flex-col items-center justify-center text-center opacity-60">
          <Fuel className="text-gray-300 mb-2" size={32} />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
            Ingresa los datos para <br /> calcular el costo del viaje
          </p>
        </div>
      )}
    </div>
  );
}
