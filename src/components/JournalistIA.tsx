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
    <div className="space-y-12 bg-transparent pb-4" id="journalist-ia">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Módulo de Periodismo</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">RED.SERIALIZATION_ENGINE</span>
        </div>
        <div className="p-3 bg-black text-white rounded-none shadow-2xl">
          <Newspaper size={20} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Entrada de datos crudos, declaraciones o registros de entrevistas..."
            className="w-full h-40 p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide transition-all shadow-sm"
          />
          
          <button
            onClick={processNews}
            disabled={loading || !input.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
            {loading ? 'Sintetizando Narrativa...' : 'PROCESAR_INTEL.SERIALIZAR'}
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="grid gap-10">
            <div className="bg-white border-2 border-black rounded-none p-10 shadow-2xl group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-10 border-b-2 border-zinc-50 pb-8">
                <Heading1 size={18} />
                <span>Matriz de Titulares de Impacto</span>
              </div>
              <div className="space-y-10">
                <div className="group/item">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 block italic underline decoration-zinc-100 underline-offset-4">Titular de Impacto Directo</span>
                  <p className="text-2xl font-black text-black leading-[1.1] transition-transform group-hover/item:translate-x-2 duration-300">{data.headlines.direct}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-10 border-t border-zinc-100">
                  <div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 block">Optimización SEO</span>
                    <p className="text-[13px] text-zinc-500 font-mono tracking-tight leading-relaxed py-4 px-5 bg-zinc-50 border border-zinc-100">{data.headlines.seo}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 block">Contexto Narrativo</span>
                    <p className="text-[13px] text-zinc-500 font-mono tracking-tight leading-relaxed py-4 px-5 bg-zinc-50 border border-zinc-100">{data.headlines.narrative}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-black rounded-none p-12 relative overflow-hidden shadow-[30px_30px_0px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-10 border-b-2 border-zinc-50 pb-8">
                <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em]">
                  <FileText size={20} />
                  <span>Resultado de la Noticia</span>
                </div>
                <button 
                  onClick={sendToProcessor}
                  className="px-8 py-4 bg-black text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-3 active:scale-95 shadow-xl group border-2 border-black"
                >
                  {sent ? <Check size={16} /> : <Send size={16} />}
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{sent ? 'TRANSFERENCIA_COMPLETA' : 'ENVIAR_AL_EDITOR'}</span>
                </button>
              </div>
              <div className="text-[17px] text-zinc-900 leading-[1.9] whitespace-pre-wrap max-h-[600px] overflow-y-auto pr-8 scrollbar-hide font-serif relative z-10 selection:bg-black selection:text-white">
                {data.news_story}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none p-10 group hover:border-black transition-all shadow-lg hover:shadow-2xl">
                <div className="flex items-center gap-4 text-[10px] font-black text-black uppercase tracking-[0.3em] mb-8">
                  <div className="p-4 bg-white border border-zinc-100 shadow-sm">
                    <Quote size={18} />
                  </div>
                  <span>Citas de Alto Valor</span>
                </div>
                <div className="space-y-6">
                  {data.key_quotes.map((quote, i) => (
                    <div key={i} className="bg-white p-8 border border-zinc-100 shadow-sm leading-relaxed relative overflow-hidden group/quote">
                       <div className="absolute left-0 top-0 w-1 h-full bg-black scale-y-0 group-hover/quote:scale-y-100 transition-transform origin-top duration-500" />
                       <p className="text-[14px] text-zinc-700 italic font-serif leading-loose">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none p-10 group hover:border-black transition-all shadow-lg hover:shadow-2xl">
                <div className="flex items-center gap-4 text-[10px] font-black text-black uppercase tracking-[0.3em] mb-8">
                  <div className="p-4 bg-white border border-zinc-100 shadow-sm">
                    <Info size={18} />
                  </div>
                  <span>Ángulos de Enfoque Operativos</span>
                </div>
                <ul className="space-y-5">
                  {data.angles.map((angle, i) => (
                    <li key={i} className="text-[13px] text-zinc-600 flex items-start gap-6 p-6 bg-white border border-zinc-100 transition-all group-hover:shadow-sm">
                      <div className="w-2 spacer-h-2 bg-black mt-2 flex-none shrink-0" style={{'height': '2px'} as any} />
                      <span className="uppercase font-medium tracking-tight leading-snug">{angle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
