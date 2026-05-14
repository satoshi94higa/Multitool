import React, { useState } from 'react';
import { Brain, Users, Zap, Search, Send, Check, Loader2, Sparkles, Camera, Video, Newspaper, Dice5, MessageSquarePlus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const generateIdeas = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const prompt = `Actúa como un estratega de contenido creativo y productor multimedia.
      Tengo que cubrir la siguiente actividad/tema: "${input}"
      Somos un equipo de ${peopleCount} personas.
      
      ${extraPrompt ? `Instrucciones adicionales: ${extraPrompt}` : ''}
      
      Genera una lluvia de ideas (brainstorming) dividida en 5 categorías. Cada categoría debe tener ideas realistas pero creativas adaptadas al tamaño del equipo (${peopleCount} personas).
      
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setIdeas(result);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!ideas) return;
    
    let fullText = `# Brainstorming: ${input}\nEquipo: ${peopleCount} personas\n\n`;
    
    const categories = [
      { name: 'Estrategia General', key: 'general' },
      { name: 'Cobertura Fotográfica', key: 'photographic' },
      { name: 'Cobertura Audiovisual', key: 'audiovisual' },
      { name: 'Periodismo / Gráfica', key: 'journalistic' },
      { name: 'Wild Card (Disruptivo)', key: 'wildcard' }
    ];

    categories.forEach(cat => {
      fullText += `## ${cat.name}\n`;
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
    <div className="space-y-6" id="content-brainstormer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Brainstormer de Contenido</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Estrategia Creativa</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
          <Users size={12} className="ml-1 text-gray-400" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setPeopleCount(num)}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                  peopleCount === num ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-purple-500 hover:bg-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Actividad o tema a cubrir (puedes incluir enlaces)..."
            className="w-full h-28 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-200 resize-none font-sans"
          />
          
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-300">
              <MessageSquarePlus size={14} />
            </div>
            <input
              type="text"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Instrucciones extra (ej: foco en humor, estilo cinematográfico...)"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:border-purple-100 placeholder:text-gray-300"
            />
          </div>

          <button
            onClick={generateIdeas}
            disabled={loading || !input.trim()}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-30 transition-all shadow-md shadow-purple-100"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Generando ideas...' : 'Lanzar Lluvia de Ideas'}
          </button>
        </div>
      </div>

      {ideas && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Zap size={12} className="text-purple-500" />
              <span>Resultados para {peopleCount} {peopleCount === 1 ? 'persona' : 'personas'}</span>
            </div>
            <button 
              onClick={sendToProcessor}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-purple-50 rounded-md text-[9px] font-bold text-purple-600 transition-colors border border-transparent hover:border-purple-100"
            >
              {sent ? <Check size={12} className="text-green-500" /> : <Send size={12} />}
              <span>{sent ? 'Enviado' : 'Enviar a Procesador'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <CategoryCard title="Estrategia General" icon={<Brain size={14} />} items={ideas.general} color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryCard title="Fotografía" icon={<Camera size={14} />} items={ideas.photographic} color="blue" />
              <CategoryCard title="Audiovisual" icon={<Video size={14} />} items={ideas.audiovisual} color="red" />
              <CategoryCard title="Periodismo" icon={<Newspaper size={14} />} items={ideas.journalistic} color="indigo" />
              <CategoryCard title="Wild Card" icon={<Dice5 size={14} />} items={ideas.wildcard} color="amber" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ title, icon, items, color }: { title: string, icon: React.ReactNode, items: string[], color: 'purple' | 'blue' | 'red' | 'indigo' | 'amber' }) {
  const colors = {
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    red: 'bg-red-50 border-red-100 text-red-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} bg-opacity-50`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${colors[color]} bg-opacity-20`}>
          {icon}
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700 leading-tight">
            <div className={`w-1 h-1 rounded-full mt-1.5 flex-none ${colors[color].split(' ')[2]}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
