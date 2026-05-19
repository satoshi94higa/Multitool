import React, { useState } from 'react';
import { Brain, Users, Zap, Search, Send, Check, Loader2, Sparkles, Camera, Video, Newspaper, Dice5, MessageSquarePlus } from 'lucide-react';

import { processWithGemini } from '../services/geminiService';

interface BrainstormOutput {
  general: string[];
  photographic: string[];
  audiovisual: string[];
  journalistic: string[];
  wildcard: string[];
}

export default function ContentBrainstormer() {
  const [input, setInput] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<BrainstormOutput | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Actuá como un estratega de contenido creativo y productor multimedia.
      Tengo que cubrir la siguiente actividad/tema: "${input}"
      Somos un equipo de ${peopleCount} personas.
      Usá español de Argentina (voseo, vocabulario local).
      
      ${extraPrompt ? `Instrucciones adicionales: ${extraPrompt}` : ''}
      
      Generá una lluvia de ideas (brainstorming) dividida en 5 categorías. Cada categoría debe tener ideas realistas pero creativas adaptadas al tamaño del equipo (${peopleCount} personas).
      
      Categorías:
      1. General: Estrategia de cobertura global.
      2. Fotográfica: Ángulos, momentos clave, estilos visuales.
      3. Audiovisual: Reels, entrevistas rápidas, tomas de recurso, transiciones.
      4. Periodística/Gráfica: Hilos, crónicas, infografías, datos clave.
      5. Wild Card: Ideas disruptivas, divertidas o fuera de lo común.
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "general": ["idea 1", "idea 2"],
        "photographic": ["idea 1", "idea 2"],
        "audiovisual": ["idea 1", "idea 2"],
        "journalistic": ["idea 1", "idea 2"],
        "wildcard": ["idea 1", "idea 2"]
      }`;

      const data = await processWithGemini({ customPrompt: prompt }, 'process');
      const result = JSON.parse(data.text.replace(/```json|```/g, '').trim());
      setIdeas(result);
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      setError(error.message || "Error al generar ideas");
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!ideas) return;
    
    let fullText = `BRAINSTORMING: ${input.toUpperCase()}\nEquipo: ${peopleCount} personas\n\n`;
    
    const categories = [
      { name: 'ESTRATEGIA GENERAL', key: 'general' },
      { name: 'COBERTURA FOTOGRÁFICA', key: 'photographic' },
      { name: 'COBERTURA AUDIOVISUAL', key: 'audiovisual' },
      { name: 'PERIODISMO / GRÁFICA', key: 'journalistic' },
      { name: 'WILD CARD (DISRUPTIVO)', key: 'wildcard' }
    ];

    categories.forEach(cat => {
      fullText += `${cat.name}\n`;
      (ideas as any)[cat.key].forEach((idea: string) => {
        fullText += `- ${idea}\n`;
      });
      fullText += '\n';
    });

    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-12 bg-transparent pb-4" id="content-brainstormer">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start">
        Lluvia de Ideas
      </h1>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-4">
        <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-none border border-zinc-200">
          <div className="flex items-center gap-3 px-3">
            <Users size={16} className="text-zinc-400" />
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Equipo</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setPeopleCount(num)}
                className={`w-10 h-10 rounded-none flex items-center justify-center text-[12px] font-mono transition-all border-2 ${
                  peopleCount === num ? 'bg-black text-white border-black shadow-xl scale-110 z-10' : 'text-zinc-400 border-transparent hover:text-black hover:border-zinc-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inicializar objetivo de origen (tema, contexto)..."
              className="w-full h-40 p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide shadow-sm"
            />
          </div>
          
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors">
              <MessageSquarePlus size={16} />
            </div>
            <input
              type="text"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Parámetros heurísticos (estilo, tono, límites)..."
              className="w-full pl-14 pr-6 py-5 bg-zinc-50 border-2 border-black/5 rounded-none text-[11px] font-mono focus:outline-none focus:border-black placeholder:text-zinc-300 text-black shadow-sm"
            />
          </div>

          <button
            onClick={generateIdeas}
            disabled={loading || !input.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? 'Sintetizando Flujos Creativos...' : 'INICIAR_LLUVIA_DE_IDEAS'}
          </button>

          {error && (
            <div className="p-6 bg-red-50 border-2 border-red-500 text-red-600 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <Zap size={18} className="animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                  [ALERTA_SISTEMA]: {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {ideas && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center justify-between border-b-2 border-black pb-8">
            <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em]">
              <Zap size={18} className="text-black animate-pulse" />
              <span>Síntesis.Resultado / {peopleCount} {peopleCount === 1 ? 'Persona' : 'Personas'}</span>
            </div>
            <button 
              onClick={sendToProcessor}
              className="flex items-center gap-3 px-8 py-4 bg-black hover:bg-zinc-800 rounded-none text-[11px] font-black text-white transition-all shadow-2xl active:scale-95 uppercase tracking-widest border-2 border-black"
            >
              {sent ? <Check size={18} /> : <Send size={18} />}
              <span>{sent ? 'Enviado_al_Buffer' : 'Enviar al Editor'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10">
            <CategoryCard title="Estrategia Global" icon={<Brain size={20} />} items={ideas.general} color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <CategoryCard title="Inteligencia Óptica" icon={<Camera size={20} />} items={ideas.photographic} color="blue" />
              <CategoryCard title="Dinámica de Movimiento" icon={<Video size={20} />} items={ideas.audiovisual} color="red" />
              <CategoryCard title="Narrativa de Datos" icon={<Newspaper size={20} />} items={ideas.journalistic} color="indigo" />
              <CategoryCard title="Anomalía Recursiva" icon={<Dice5 size={20} />} items={ideas.wildcard} color="amber" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ title, icon, items, color }: { title: string, icon: React.ReactNode, items: string[], color: 'purple' | 'blue' | 'red' | 'indigo' | 'amber' }) {
  const themes = {
    purple: 'border-zinc-100 group-hover:border-black',
    blue: 'border-zinc-100 group-hover:border-black',
    red: 'border-zinc-100 group-hover:border-black',
    indigo: 'border-zinc-100 group-hover:border-black',
    amber: 'border-zinc-100 group-hover:border-black'
  };

  return (
    <div className={`p-10 rounded-none border-2 ${themes[color]} transition-all bg-white hover:shadow-2xl group`}>
      <div className="flex items-center gap-5 mb-10 border-b border-zinc-50 pb-6">
        <div className="p-4 bg-zinc-50 text-black shadow-sm transition-colors group-hover:bg-black group-hover:text-white">
          {icon}
        </div>
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] italic">{title}</h3>
      </div>
      <ul className="space-y-6">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-5 text-[14px] text-zinc-600 leading-[1.6] font-sans">
            <div className="w-1.5 h-1.5 bg-zinc-200 mt-2 flex-none rounded-none group-hover:bg-black transition-colors" />
            <span className="group-hover:text-black transition-colors">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
