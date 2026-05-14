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
    <div className="space-y-6" id="director-ia">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Clapperboard size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Director IA</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Estrategia & Referencias</p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Plantea tu idea de video o sesión de fotos aquí..."
          className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-indigo-200 resize-none"
        />
        <button
          onClick={analyzeIdea}
          disabled={loading || !idea.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-md shadow-indigo-100"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {loading ? 'Analizando producción...' : 'Planificar Ejecución Técnica'}
        </button>
      </div>

      {data && (
        <div className="space-y-6 pt-4 border-t border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                <Lightbulb size={12} />
                <span>Propuesta Estética</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase">Estilo Visual</span>
                  <p className="text-xs text-indigo-900 font-medium">{data.visual_style}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-indigo-400 uppercase">Iluminación</span>
                  <p className="text-xs text-indigo-900 leading-tight">{data.lighting_mood}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                <Camera size={12} />
                <span>Técnica de Cámara</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">{data.camera_strategy}</p>
              <div className="pt-2 border-t border-amber-100/50">
                <span className="block text-[8px] font-bold text-amber-400 uppercase mb-1">Equipo Recomendado</span>
                <div className="flex flex-wrap gap-1">
                  {data.equipment_suggestions.map((eq, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white border border-amber-100 rounded text-[9px] text-amber-700">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Youtube size={12} />
                <span>Búsqueda de Referencias</span>
              </div>
              <div className="flex gap-2">
                <button onClick={sendToProcessor} className="p-1.5 hover:bg-gray-100 rounded-md text-indigo-500 transition-all">
                  {sent ? <Check size={14} className="text-green-500" /> : <Send size={14} />}
                </button>
                <button onClick={copyToClipboard} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-all">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.search_keywords.map((kw, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <span className="text-[10px] font-bold text-gray-600 truncate mr-2">{kw}</span>
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-indigo-500" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              <ListChecks size={12} />
              <span>Cobertura Esencial (Shotlist sugerido)</span>
            </div>
            <div className="grid gap-2">
              {data.essential_coverage.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-white border border-gray-50 rounded-xl hover:border-indigo-100 transition-all">
                  <div className="flex-none w-10 flex flex-col items-center justify-center border-r border-gray-50 pr-2">
                    <span className="text-[8px] font-black text-indigo-300 uppercase">Tipo</span>
                    <span className="text-[10px] font-bold text-indigo-600">{item.type}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">{item.description}</p>
                    <p className="text-[10px] text-gray-500 italic truncate">{item.purpose}</p>
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
