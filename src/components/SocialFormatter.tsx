import React, { useState } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type Mode = 'social' | 'grammar' | 'emojis' | 'cta' | 'hooks';
type Tone = 'casual' | 'professional' | 'energetic';

export default function SocialFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [report, setReport] = useState<{ corrections: string[], tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<Mode>('social');
  const [tone, setTone] = useState<Tone>('casual');
  const [noMarkdown, setNoMarkdown] = useState(true);

  const charLimits = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200
  };

  const processText = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReport(null);
    setOutput('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = '';

      if (mode === 'social') {
        prompt = `Actúa como un experto en redes sociales. Toma el siguiente texto y formatéalo para que sea atractivo (Instagram/Twitter/LinkedIn). 
        Agrega emojis relevantes. Mantén un tono ${tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico'}.
        ${noMarkdown ? 'IMPORTANTE: No uses negritas, cursivas o caracteres de formato como asteriscos (*) o guiones bajos (_).' : ''}
        Preserva el mensaje original pero hazlo más legible.
        Solo devuelve el texto final formateado.`;
      } else if (mode === 'grammar') {
        prompt = `Corrige la gramática y ortografía del siguiente texto. 
        IMPORTANTE: Devuelve la respuesta estrictamente en este formato JSON:
        {
          "corrected": "el texto completo corregido",
          "changes": ["lista breve de cambios clave realizados"],
          "tips": ["recomendaciones para mejorar la escritura a futuro"]
        }`;
      } else if (mode === 'emojis') {
        prompt = `Toma el siguiente texto y agrega emojis relevantes al final de las frases o palabras clave. No cambies las palabras originales. Solo devuelve el texto con emojis agregados.`;
      } else if (mode === 'cta') {
        prompt = `Genera un "Call to Action" (Llamado a la acción) potente y corto basado en el siguiente texto. Debe invitar a comentar, compartir o hacer clic. Genera 3 opciones diferentes separadas por líneas.
        Mantén un tono ${tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico'}.
        Devuelve solo las 3 opciones.`;
      } else if (mode === 'hooks') {
        prompt = `Genera un "Hook" (Gancho inicial) impactante para redes sociales basado en el siguiente texto. Debe ser algo que detenga el scroll. Genera 3 estilos diferentes: una pregunta intrigante, un dato impactante y un beneficio directo.
        Mantén un tono ${tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico'}.
        Devuelve solo las 3 opciones separadas por líneas.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompt}\n\nTexto: "${input}"`,
      });

      const responseText = response.text || '';

      if (mode === 'grammar') {
        try {
          const cleanJson = responseText.replace(/```json|```/g, '').trim();
          const data = JSON.parse(cleanJson);
          setOutput(data.corrected);
          setReport({ corrections: data.changes, tips: data.tips });
        } catch (e) {
          setOutput(responseText);
        }
      } else {
        setOutput(responseText);
      }
    } catch (error) {
      setOutput("Error al procesar.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div id="social-booster" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-zinc-100 text-zinc-900 rounded-lg">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold leading-tight uppercase tracking-tight">Social Booster</h2>
          </div>
        </div>
        {mode === 'social' && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-black transition-colors">Clean MD</span>
            <input 
              type="checkbox" 
              checked={noMarkdown} 
              onChange={(e) => setNoMarkdown(e.target.checked)}
              className="accent-black w-2.5 h-2.5"
            />
          </label>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
          {(['social', 'grammar', 'emojis', 'cta', 'hooks'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setReport(null); }}
              className={`px-2 py-1 rounded-lg border transition-all uppercase ${
                mode === m ? 'bg-black text-white border-black shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {m === 'social' ? 'Optimizar' : m === 'grammar' ? 'Gramática' : m === 'emojis' ? 'Emojis' : m === 'cta' ? 'CTA' : 'Hooks'}
            </button>
          ))}
        </div>

        {(mode === 'social' || mode === 'cta' || mode === 'hooks') && (
          <div className="flex gap-3 text-[9px] font-black uppercase tracking-wider pl-1">
            {(['casual', 'professional', 'energetic'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`transition-colors border-b-2 leading-none h-4 ${tone === t ? 'text-black border-black' : 'text-gray-300 border-transparent'}`}
              >
                {t === 'casual' ? 'Casual' : t === 'professional' ? 'Pro' : 'Energ'}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mensaje..."
            className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-gray-200 resize-none font-sans overflow-y-auto"
          />
          <div className="flex gap-2 mt-1 ml-1">
            {Object.entries(charLimits).map(([key, limit]) => {
              const current = input.length;
              const isOver = current > limit;
              return (
                <div key={key} className={`flex items-center gap-0.5 text-[7px] font-black uppercase ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                  <span className="opacity-70">{key[0]}:</span>
                  <span>{current}/{limit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={processText}
          disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-30 transition-all shadow-sm"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? 'Procesando...' : mode === 'social' ? 'Optimizar' : mode === 'grammar' ? 'Corregir' : mode === 'emojis' ? 'Emojis' : 'Generar'}
        </button>

        {output && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-400">
            <div className="relative group p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] italic text-gray-700 leading-relaxed">
              <p className="whitespace-pre-wrap">{output}</p>
              <button 
                onClick={copyToClipboard}
                className="absolute top-1 right-1 p-1 bg-white border border-gray-100 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>

            {report && (
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
                <div className="bg-blue-50/50 border border-blue-100/50 p-2 rounded-lg text-blue-800">
                  <p className="mb-1 uppercase opacity-50 text-[7px]">Cambios:</p>
                  <ul className="list-disc pl-3">
                    {report.corrections.slice(0, 3).map((c, i) => <li key={i} className="leading-tight">{c}</li>)}
                  </ul>
                </div>
                <div className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-lg text-amber-800">
                  <p className="mb-1 uppercase opacity-50 text-[7px]">Tips:</p>
                  <ul className="list-disc pl-3">
                    {report.tips.slice(0, 3).map((t, i) => <li key={i} className="leading-tight">{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
