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
    <div id="social-booster">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Social Booster IA</h2>
        {mode === 'social' && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-black transition-colors">Limpiar Formato MD</span>
            <input 
              type="checkbox" 
              checked={noMarkdown} 
              onChange={(e) => setNoMarkdown(e.target.checked)}
              className="accent-black w-3 h-3"
            />
          </label>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {(['social', 'grammar', 'emojis', 'cta', 'hooks'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setReport(null); }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                mode === m ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {m === 'social' ? 'Optimizar' : 
               m === 'grammar' ? 'Gramática' : 
               m === 'emojis' ? 'Efecto Emojis' :
               m === 'cta' ? 'CTA' : 'Hooks'}
            </button>
          ))}
        </div>

        {(mode === 'social' || mode === 'cta' || mode === 'hooks') && (
          <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
            {(['casual', 'professional', 'energetic'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`transition-colors border-b-2 flex items-center gap-1 leading-none h-4 ${tone === t ? 'text-black border-black' : 'text-gray-300 border-transparent'}`}
              >
                {t === 'casual' ? 'Casual' : t === 'professional' ? 'Profesional' : 'Enérgico'}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe aquí tu mensaje..."
            className="w-full h-28 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-200 resize-none font-sans"
          />
          <div className="flex gap-3 mt-1.5 ml-1 transition-opacity duration-300">
            {Object.entries(charLimits).map(([key, limit]) => {
              const current = input.length;
              const isOver = current > limit;
              return (
                <div key={key} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                  <span className="opacity-70">{key}:</span>
                  <span>{current}/{limit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={processText}
          disabled={loading || !input.trim()}
          className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-30 transition-all shadow-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {mode === 'social' ? 'Optimizar para redes' : 
           mode === 'grammar' ? 'Corregir Texto' : 
           mode === 'emojis' ? 'Agregar Emojis' :
           mode === 'cta' ? 'Generar CTA' : 'Generar Hooks'}
        </button>

        {output && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="relative group p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm italic text-gray-700">
              <p className="whitespace-pre-wrap">{output}</p>
              <button 
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-1.5 bg-white border border-gray-100 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>

            {report && (
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tracking-tighter">
                <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-blue-800">
                  <p className="mb-1 uppercase opacity-50">Cambios:</p>
                  <ul className="list-disc pl-3">
                    {report.corrections.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-amber-800">
                  <p className="mb-1 uppercase opacity-50">Tips:</p>
                  <ul className="list-disc pl-3">
                    {report.tips.map((t, i) => <li key={i}>{t}</li>)}
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
