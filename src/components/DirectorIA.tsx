import React, { useState } from 'react';
import { Camera, Clapperboard, Youtube, Search, Loader2, Play, Check, Copy, Send, ExternalLink, Lightbulb, ListChecks } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Reference {
  platform: 'youtube' | 'web';
  title: string;
  url: string;
}

interface CoverageItem {
  type: string;
  description: string;
  purpose: string;
}

interface DirectorData {
  concept: string;
  visual_style: string;
  lighting_mood: string;
  camera_strategy: string;
  essential_coverage: CoverageItem[];
  equipment_suggestions: string[];
  search_keywords: string[];
}

export default function DirectorIA() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DirectorData | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const analyzeIdea = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    try {
      const prompt = `Actúa como un Director de Fotografía y Productor Creativo experto. 
        Analiza la siguiente idea de contenido y proporciona una guía detallada de ejecución técnica y estética.
        
        Idea: "${idea}"
        
        Tu respuesta debe ser un JSON estricto con:
        - "concept": Un párrafo breve resumiendo el enfoque creativo.
        - "visual_style": Descripción del estilo visual (ej: Cinematográfico, Vlog dinámico, Documental).
        - "lighting_mood": Esquema de iluminación sugerido y atmósfera.
        - "camera_strategy": Tipos de lentes dominantes y estilo de movimiento.
        - "essential_coverage": Lista de 5 tomas clave (A-roll y B-roll) con tipo, descripción y propósito técnico.
        - "equipment_suggestions": Lista de 3-5 piezas de equipo clave para este estilo.
        - "search_keywords": 3 frases cortas de búsqueda para encontrar referencias visuales en YouTube/Web.
        
        Formato JSON:
        {
          "concept": "...",
          "visual_style": "...",
          "lighting_mood": "...",
          "camera_strategy": "...",
          "essential_coverage": [
            { "type": "...", "description": "...", "purpose": "..." }
          ],
          "equipment_suggestions": ["...", "...", ...],
          "search_keywords": ["...", "...", ...]
        }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result: DirectorData = JSON.parse(response.text);
      setData(result);
    } catch (error) {
      console.error('Error in Director IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!data) return;
    
    const coverageMD = "| Tipo | Descripción | Propósito |\n|---|---|---|\n" + 
      data.essential_coverage.map(item => `| ${item.type} | ${item.description} | ${item.purpose} |`).join('\n');

    const fullText = `# DIRECTOR IA - PROPUESTA TÉCNICA\n\n` +
      `## Concepto\n${data.concept}\n\n` +
      `## Estilo Visual y Luz\n- **Estilo:** ${data.visual_style}\n- **Iluminación:** ${data.lighting_mood}\n\n` +
      `## Estrategia de Cámara\n${data.camera_strategy}\n\n` +
      `## Cobertura Esencial\n${coverageMD}\n\n` +
      `## Equipo Sugerido\n${data.equipment_suggestions.map(e => `- ${e}`).join('\n')}`;

    const event = new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    });
    window.dispatchEvent(event);
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = `CONCEPTO: ${data.concept}\nESTILO: ${data.visual_style}\nCÁMARA: ${data.camera_strategy}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 bg-transparent pb-4" id="director-ia">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Módulo del Director</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">AI.VISUAL_STRATEGY_ENGINE</span>
        </div>
        <div className="p-3 bg-black text-white rounded-none shadow-2xl">
          <Clapperboard size={20} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Inicializar concepto visual o requisitos de rodaje..."
            className="w-full h-40 p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide shadow-sm"
          />
          <button
            onClick={analyzeIdea}
            disabled={loading || !idea.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            {loading ? 'Analizando Metadatos de Producción...' : 'PLANIFICAR_EJECUCIÓN_TÉCNICA'}
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-none p-10 border-2 border-black space-y-8 shadow-2xl group">
              <div className="flex items-center gap-4 text-[11px] font-black text-black uppercase tracking-[0.3em]">
                <div className="p-4 bg-zinc-50 border border-zinc-100 shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                  <Lightbulb size={18} />
                </div>
                <span>Propuesta Estética</span>
              </div>
              <div className="space-y-8">
                <div>
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Vector de Estilo Visual</span>
                  <p className="text-xl font-black text-black leading-tight uppercase transition-transform group-hover:translate-x-2">{data.visual_style}</p>
                </div>
                <div className="pt-8 border-t-2 border-zinc-50">
                  <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Atmósfera de Iluminación</span>
                  <p className="text-[13px] text-zinc-600 leading-relaxed font-medium uppercase tracking-tight">{data.lighting_mood}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-none p-10 border-2 border-black space-y-8 shadow-2xl group">
              <div className="flex items-center gap-4 text-[11px] font-black text-black uppercase tracking-[0.3em]">
                <div className="p-4 bg-zinc-50 border border-zinc-100 shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                  <Camera size={18} />
                </div>
                <span>Dinámica de Cámara</span>
              </div>
              <p className="text-xl font-black text-black leading-tight uppercase transition-transform group-hover:translate-x-2">{data.camera_strategy}</p>
              <div className="pt-8 border-t-2 border-zinc-50">
                <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 italic">Carga Técnica</span>
                <div className="flex flex-wrap gap-3">
                  {data.equipment_suggestions.map((eq, i) => (
                    <span key={i} className="px-5 py-2 bg-zinc-50 border border-zinc-100 rounded-none text-[11px] font-mono font-black text-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-8">
              <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em]">
                <Youtube size={18} className="text-black" />
                <span>Referencias de Inteligencia</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={sendToProcessor} 
                  className="p-4 bg-black text-white hover:bg-zinc-800 rounded-none transition-all active:scale-95 shadow-2xl border-2 border-black"
                >
                  {sent ? <Check size={20} /> : <Send size={20} />}
                </button>
                <button 
                  onClick={copyToClipboard} 
                  className="p-4 bg-white hover:bg-zinc-50 border-2 border-black rounded-none text-black transition-all active:scale-95 shadow-xl"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.search_keywords.map((kw, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-6 bg-zinc-50 border-2 border-zinc-100 rounded-none hover:border-black hover:shadow-2xl transition-all group"
                >
                  <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest truncate mr-6 group-hover:text-black transition-colors italic">{kw}</span>
                  <ExternalLink size={18} className="text-zinc-300 group-hover:text-black transition-colors flex-none" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] px-1 italic">
              <ListChecks size={20} className="text-black" />
              <span>Lista de Tomas Operativa</span>
            </div>
            <div className="grid gap-6">
              {data.essential_coverage.map((item, idx) => (
                <div key={idx} className="flex gap-10 p-8 bg-white border-2 border-zinc-100 hover:border-black transition-all group shadow-sm hover:shadow-2xl relative overflow-hidden">
                   <div className="absolute left-0 top-0 w-1.5 h-full bg-black scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                  <div className="flex-none w-20 flex flex-col items-center justify-center border-r-2 border-zinc-50 pr-8">
                    <span className="text-[9px] font-black text-zinc-400 uppercase mb-2 tracking-widest">Tipo</span>
                    <span className="text-[12px] font-mono font-black text-black group-hover:italic transition-all uppercase tracking-tighter">{item.type}</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-base font-black text-black truncate mb-2 uppercase tracking-wide italic">{item.description}</p>
                    <p className="text-[11px] text-zinc-400 italic truncate font-mono uppercase tracking-[0.2em] font-bold underline decoration-zinc-100 underline-offset-4">{item.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
