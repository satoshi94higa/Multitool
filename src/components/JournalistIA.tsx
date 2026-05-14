import React, { useState } from 'react';
import { Newspaper, Quote, Heading1, Send, Check, Copy, Loader2, Zap, Info, FileText } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface JournalismOutput {
  news_story: string;
  headlines: {
    seo: string;
    narrative: string;
    direct: string;
  };
  key_quotes: string[];
  angles: string[];
}

export default function JournalistIA() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JournalismOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const processNews = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const prompt = `Actúa como un editor jefe de un diario prestigioso. 
      Toma el siguiente material (pueden ser notas crudas, transcripciones o datos) y conviértelo en una pieza periodística profesional.
      
      Reglas:
      1. Usa la estructura de Pirámide Invertida.
      2. Extrae las declaraciones más importantes (quotes).
      3. Sugiere 3 tipos de titulares.
      4. Propón ángulos periodísticos adicionales.
      
      Material: "${input}"
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "news_story": "El cuerpo central de la noticia estructurado con lead y párrafos de apoyo",
        "headlines": {
          "seo": "Titular optimizado para buscadores",
          "narrative": "Titular con estilo de crónica o reportaje",
          "direct": "Titular de última hora / impacto"
        },
        "key_quotes": ["Declaración 1", "Declaración 2"],
        "angles": ["Ángulo humano...", "Ángulo económico..."]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setData(result);
    } catch (error) {
      console.error('Error processing news:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!data) return;
    
    const fullText = `# ${data.headlines.direct}\n\n## Titulares Alternativos\n- **SEO:** ${data.headlines.seo}\n- **Narrativo:** ${data.headlines.narrative}\n\n---\n\n${data.news_story}\n\n## Citas Destacadas\n${data.key_quotes.map(q => `> "${q}"`).join('\n\n')}\n\n## Posibles Enfoques\n${data.angles.map(a => `- ${a}`).join('\n')}\n\n---\n*Generado para redacción periodística*`;
    
    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-4" id="journalist-ia">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Newspaper size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold leading-tight">Journalist IA</h2>
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Redacción Periodística</p>
          </div>
        </div>
        <div className="flex gap-1">
          {data && (
            <button 
              onClick={sendToProcessor}
              className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${sent ? 'text-green-500 bg-green-50' : 'text-indigo-500 hover:bg-indigo-50'}`}
            >
              {sent ? <Check size={14} /> : <Send size={14} />}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Notas crudas o transcripción..."
          className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-indigo-200 resize-none font-sans leading-relaxed"
        />
        
        <button
          onClick={processNews}
          disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-sm"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
          {loading ? 'Redactando...' : 'Generar Noticia'}
        </button>
      </div>

      {data && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="bg-white border border-indigo-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2 border-b border-indigo-50 pb-1">
              <Heading1 size={10} />
              <span>Titulares</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-900 leading-tight">{data.headlines.direct}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100">
                  <span className="block text-[7px] font-bold text-gray-400 uppercase">SEO</span>
                  <p className="text-[10px] text-gray-600 truncate">{data.headlines.seo}</p>
                </div>
                <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100">
                  <span className="block text-[7px] font-bold text-gray-400 uppercase">Narrativo</span>
                  <p className="text-[10px] text-gray-600 truncate">{data.headlines.narrative}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              <FileText size={10} />
              <span>Cuerpo</span>
            </div>
            <div className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto pr-1 scrollbar-hide">
              {data.news_story}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-indigo-50/30 border border-indigo-100/30 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
                <Quote size={10} />
                <span>Citas</span>
              </div>
              <div className="space-y-1.5">
                {data.key_quotes.slice(0, 2).map((quote, i) => (
                  <p key={i} className="text-[10px] text-indigo-900 italic border-l-2 border-indigo-200 pl-1.5 leading-tight">"{quote}"</p>
                ))}
              </div>
            </div>
            <div className="bg-amber-50/30 border border-amber-100/30 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1.5">
                <Info size={10} />
                <span>Enfoques</span>
              </div>
              <ul className="space-y-1">
                {data.angles.slice(0, 2).map((angle, i) => (
                  <li key={i} className="text-[10px] text-amber-900 flex items-start gap-1.5 leading-tight">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1 flex-none" />
                    {angle}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
