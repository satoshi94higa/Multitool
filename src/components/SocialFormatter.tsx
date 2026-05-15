import React, { useState } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    
    try {
      const response = await fetch("/api/gemini/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode, tone, noMarkdown }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Processing failed");
      }
      const data = await response.json();
      const responseText = data.text || '';

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
    } catch (error: any) {
      console.error('Social Booster Error:', error);
      setError(error.message || "Error al procesar.");
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
    <div id="social-booster" className="bg-transparent">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start mb-6">
        Potenciador Social
      </h1>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {mode === 'social' && (
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-black transition-colors">Texto Plano</span>
            <input 
              type="checkbox" 
              checked={noMarkdown} 
              onChange={(e) => setNoMarkdown(e.target.checked)}
              className="accent-black w-4 h-4 rounded-none bg-zinc-100 border-zinc-200"
            />
          </label>
        )}
      </div>
      
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest bg-zinc-50 p-1.5 rounded-none border border-zinc-200 shadow-sm">
          {(['social', 'grammar', 'emojis', 'cta', 'hooks'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setReport(null); }}
              className={`px-4 py-2.5 rounded-none transition-all ${
                mode === m ? 'bg-black text-white shadow-2xl' : 'text-zinc-400 hover:text-black'
              }`}
            >
              {m === 'social' ? 'Optimizar' : 
               m === 'grammar' ? 'Gramática' : 
               m === 'emojis' ? 'Emojis' :
               m === 'cta' ? 'CTA' : 'Ganchos'}
            </button>
          ))}
        </div>

        {(mode === 'social' || mode === 'cta' || mode === 'hooks') && (
          <div className="flex gap-6 text-[9px] font-black uppercase tracking-[0.2em] ml-1">
            {(['casual', 'professional', 'energetic'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`transition-colors flex items-center gap-2 leading-none h-4 ${tone === t ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <div className={`w-2 h-2 rounded-none ${tone === t ? 'bg-black' : 'bg-transparent border border-zinc-300'}`} />
                {t === 'casual' ? 'Casual' : t === 'professional' ? 'Profesional' : 'Enérgico'}
              </button>
            ))}
          </div>
        )}

        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Entrada de datos crudos..."
            className="w-full h-40 p-6 bg-zinc-50 border-2 border-black/5 rounded-none text-sm focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide"
          />
          <div className="flex gap-6 mt-3 ml-1">
            {Object.entries(charLimits).map(([key, limit]) => {
              const current = input.length;
              const isOver = current > limit;
              return (
                <div key={key} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] ${isOver ? 'text-red-600 underline' : 'text-zinc-400'}`}>
                  <span className="opacity-40">{key}:</span>
                  <span className={isOver ? 'text-red-600' : 'text-zinc-600 font-mono italic'}>{current}/{limit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={processText}
          disabled={loading || !input.trim()}
          className="w-full py-5 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-95"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Sintetizando...' : `Ejecutar Lógica de ${mode.toUpperCase()}`}
        </button>

        {error && (
          <div className="p-6 bg-red-50 border-2 border-red-500 text-red-600 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <Sparkles size={18} className="animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                [ALERTA_SISTEMA]: {error}
              </p>
            </div>
          </div>
        )}

        {output && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative group p-8 bg-zinc-50 border-2 border-zinc-100 rounded-none text-sm text-black leading-loose font-sans shadow-2xl">
              <p className="whitespace-pre-wrap">{output}</p>
              <button 
                onClick={copyToClipboard}
                className="absolute top-4 right-4 p-3 bg-black text-white border border-black rounded-none shadow-xl opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {report && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] font-black tracking-widest font-mono">
                <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-none text-zinc-600">
                  <p className="mb-4 uppercase opacity-40 border-b border-zinc-200 pb-3">Cambios_Realizados:</p>
                  <ul className="space-y-3">
                    {report.corrections.map((c, i) => <li key={i} className="flex gap-2"><span>•</span> {c}</li>)}
                  </ul>
                </div>
                <div className="bg-zinc-950 border border-black p-6 rounded-none text-zinc-400">
                  <p className="mb-4 uppercase opacity-40 border-b border-zinc-800 pb-3 text-white">Refinamientos:</p>
                  <ul className="space-y-3">
                    {report.tips.map((t, i) => <li key={i} className="flex gap-2 italic"><span>›</span> {t}</li>)}
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
