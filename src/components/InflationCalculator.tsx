import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, ArrowRight, DollarSign, RefreshCw, BarChart3, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Datos históricos simplificados (IPC Argentina y CPI USA)
// Fuente: Valores aproximados para demostración basada en datos reales 2024-2025
const HISTORICAL_DATA = {
  ARS: [
    { period: 'May 24', value: 4.2 },
    { period: 'Jun 24', value: 4.6 },
    { period: 'Jul 24', value: 4.0 },
    { period: 'Ago 24', value: 4.2 },
    { period: 'Sep 24', value: 3.5 },
    { period: 'Oct 24', value: 2.7 },
    { period: 'Nov 24', value: 2.5 },
    { period: 'Dic 24', value: 3.0 },
    { period: 'Ene 25', value: 2.8 },
    { period: 'Feb 25', value: 2.6 },
    { period: 'Mar 25', value: 2.4 },
    { period: 'Abr 25', value: 2.2 },
  ],
  USD: [
    { period: 'May 24', value: 0.1 },
    { period: 'Jun 24', value: -0.1 },
    { period: 'Jul 24', value: 0.2 },
    { period: 'Ago 24', value: 0.2 },
    { period: 'Sep 24', value: 0.2 },
    { period: 'Oct 24', value: 0.2 },
    { period: 'Nov 24', value: 0.3 },
    { period: 'Dic 24', value: 0.1 },
    { period: 'Ene 25', value: 0.3 },
    { period: 'Feb 25', value: 0.4 },
    { period: 'Mar 25', value: 0.3 },
    { period: 'Abr 25', value: 0.2 },
  ]
};

export default function InflationCalculator() {
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [amount, setAmount] = useState<string>('100000');
  const [months, setMonths] = useState<number>(12);
  const [customRate, setCustomRate] = useState<string>('');

  const calculation = useMemo(() => {
    const val = parseFloat(amount) || 0;
    const data = HISTORICAL_DATA[currency];
    
    // Calculamos inflación acumulada de los últimos 'months'
    const selectedData = data.slice(-months);
    let cumulativeFactor = 1;
    
    selectedData.forEach(m => {
      cumulativeFactor *= (1 + m.value / 100);
    });

    const projectedValue = val * cumulativeFactor;
    const loss = projectedValue - val;
    const purchasingPower = val / cumulativeFactor;

    // Generar datos para el gráfico
    let currentVal = val;
    const chartData = selectedData.map((m) => {
      currentVal *= (1 + m.value / 100);
      return {
        name: m.period,
        valor: parseFloat(currentVal.toFixed(2)),
        original: val
      };
    });

    return {
      cumulativeInflation: ((cumulativeFactor - 1) * 100).toFixed(2),
      projectedValue: projectedValue.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      purchasingPower: purchasingPower.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      loss: loss.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      chartData
    };
  }, [amount, currency, months]);

  return (
    <div id="inflation-calculator" className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b-4 border-black pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Calculadora de Inflación
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-1">
            Análisis de Poder Adquisitivo: {currency}_MODULE
          </p>
        </div>
        <div className="flex bg-zinc-100 p-1">
          <button 
            onClick={() => setCurrency('ARS')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'ARS' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
          >
            Pesos (ARS)
          </button>
          <button 
            onClick={() => setCurrency('USD')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'USD' ? 'bg-black text-white shadow-lg' : 'text-zinc-400 hover:text-black'}`}
          >
            Dólares (USD)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Controles */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} />
              Monto a Calcular
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-300">
                {currency === 'ARS' ? '$' : 'u$s'}
              </span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-16 bg-zinc-50 border-2 border-zinc-100 px-12 font-mono text-xl focus:border-black focus:bg-white outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} />
              Periodo (Últimos meses)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map(m => (
                <button 
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`h-12 border-2 text-[10px] font-black transition-all ${months === m ? 'border-black bg-zinc-50' : 'border-zinc-100 text-zinc-400 hover:border-zinc-300'}`}
                >
                  {m} Meses
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-zinc-950 text-white space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-white" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Resumen del Impacto</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Inflación Acumulada</p>
                <p className="text-3xl font-black italic">{calculation.cumulativeInflation}%</p>
              </div>
              <div className="h-[1px] bg-zinc-800" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Costo de Reposición</p>
                <p className="text-xl font-bold font-mono">
                  {currency === 'ARS' ? '$' : 'u$s'} {calculation.projectedValue}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Poder de Compra Real</p>
                <p className="text-xl font-bold font-mono text-red-500">
                  {currency === 'ARS' ? '$' : 'u$s'} {calculation.purchasingPower}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-2 border-dashed border-zinc-200 flex items-start gap-4">
            <Info size={16} className="text-zinc-400 flex-none mt-1" />
            <p className="text-[9px] font-bold text-zinc-400 leading-relaxed uppercase">
              Los datos se basan en series del IPC (Argentina) y CPI (USA) históricas. 
              Reflejan cuánto dinero necesitarías hoy para comprar lo mismo que hace {months} meses.
            </p>
          </div>
        </div>

        {/* Gráfico y Detalles */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border-2 border-zinc-100 p-8 h-[400px]">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <BarChart3 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Evolución de Valor</span>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-black" />
                    <span className="text-[9px] font-black uppercase text-zinc-400">Proyectado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-zinc-200" />
                    <span className="text-[9px] font-black uppercase text-zinc-400">Original</span>
                  </div>
               </div>
            </div>
            
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={calculation.chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  labelStyle={{ color: '#aaa', fontSize: '9px', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#000" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
                <Area 
                  type="step" 
                  dataKey="original" 
                  stroke="#e4e4e7" 
                  strokeDasharray="5 5"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border-2 border-zinc-100 flex flex-col justify-between group hover:border-black transition-all">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pérdida por Inflación</span>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black text-red-600">-{calculation.loss}</span>
                <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center group-hover:bg-red-50 text-zinc-300 group-hover:text-red-500 transition-colors">
                  <TrendingUp size={20} className="rotate-180" />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-2 border-zinc-100 flex flex-col justify-between group hover:border-black transition-all">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Equivalencia Hoy</span>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-black">{calculation.projectedValue}</span>
                <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 text-zinc-300 transition-colors">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-4 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
        <span>STATUS: DATA_LAST_SYNC_2025_04</span>
        <div className="w-1 h-3 bg-zinc-200" />
        <span className="text-emerald-500 flex items-center gap-1">
          <RefreshCw size={10} className="animate-spin" /> LIVE_ENGINE_READY
        </span>
      </div>
    </div>
  );
}
