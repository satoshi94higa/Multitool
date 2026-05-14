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
    <div className="space-y-6" id="journalist-ia">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Newspaper size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">Journalist IA</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Redacción y Entrevistas</p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega aquí tus notas crudas, declaraciones sueltas o la transcripción de tu entrevista..."
          className="w-full h-32 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-indigo-200 resize-none font-sans"
        />
        
        <button
          onClick={processNews}
          disabled={loading || !input.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-md shadow-indigo-100"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
          {loading ? 'Redactando noticia...' : 'Procesar Material Periodístico'}
        </button>
      </div>

      {data && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid gap-3">
            <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                <Heading1 size={12} />
                <span>Propuestas de Titulares</span>
              </div>
              <div className="space-y-3">
                <div className="group">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Impacto / Crónica</span>
                  <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{data.headlines.direct}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">SEO / Google</span>
                    <p className="text-[11px] text-gray-600 font-medium">{data.headlines.seo}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Narrativo</span>
                    <p className="text-[11px] text-gray-600 font-medium">{data.headlines.narrative}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <FileText size={12} />
                  <span>Cuerpo de la Noticia</span>
                </div>
                <button 
                  onClick={sendToProcessor}
                  className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-md transition-all flex items-center gap-1"
                >
                  {sent ? <Check size={14} className="text-green-500" /> : <Send size={14} />}
                  <span className="text-[9px] font-bold uppercase">{sent ? 'Enviado' : 'Enviar a Editor'}</span>
                </button>
              </div>
              <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {data.news_story}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                  <Quote size={12} />
                  <span>Quotes Destacados</span>
                </div>
                <div className="space-y-2">
                  {data.key_quotes.map((quote, i) => (
                    <p key={i} className="text-[11px] text-indigo-900 italic bg-white/50 p-2 rounded-lg border border-indigo-50">"{quote}"</p>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                  <Info size={12} />
                  <span>Ángulos de Enfoque</span>
                </div>
                <ul className="space-y-1.5">
                  {data.angles.map((angle, i) => (
                    <li key={i} className="text-[11px] text-amber-900 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-none" />
                      {angle}
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
