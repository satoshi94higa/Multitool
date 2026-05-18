import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Quote, Heading1, Send, Check, Copy, Loader2, Zap, Info, FileText, Share2, AlignLeft, MessageSquarePlus } from 'lucide-react';

import { processWithGemini } from '../services/geminiService';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

const AutoResizeTextarea = ({ value, onChange, ...props }: AutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      {...props}
      style={{ ...props.style, overflow: 'hidden', resize: 'none' }}
    />
  );
};

type NarrativeStructure = 'piramide_invertida' | 'cronica' | 'hilo_x' | 'gacetilla' | 'storytelling' | 'reportaje' | 'opinion';

interface JournalismOutput {
  news_story: string;
  headlines: {
    seo: string;
    narrative: string;
    direct: string;
  };
  key_quotes: string[];
  angles: string[];
  social_briefing?: {
    platform_hooks: string[];
    summary: string;
    hashtags: string[];
  };
}

export default function RedactorIA() {
  const [input, setInput] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [structure, setStructure] = useState<NarrativeStructure>('piramide_invertida');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JournalismOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processNews = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const structureLabel = {
        piramide_invertida: 'Pirámide Invertida (de lo más a lo menos importante)',
        cronica: 'Crónica (narración cronológica con enfoque sensorial)',
        hilo_x: 'Hilo de X/Twitter (secuencia de posts concisos y encadenados)',
        gacetilla: 'Gacetilla de Prensa (estilo corporativo listo para enviar a medios)',
        storytelling: 'Storytelling (enfocado en el arco narrativo y emocional)',
        reportaje: 'Reportaje (profundidad, datos y múltiples voces)',
        opinion: 'Nota de Opinión (subjetivo, argumentativo y con voz clara)'
      }[structure];

      const prompt = `Actúa como un redactor jefe experto. 
      Toma el siguiente material y conviértelo en una pieza profesional.
      
      ESTRUCTURA SOLICITADA: ${structureLabel}.
      ${extraInstructions ? `INSTRUCCIONES ADICIONALES DEL USUARIO: ${extraInstructions}` : ''}
      
      Reglas:
      1. Sigue estrictamente la estructura "${structureLabel}".
      2. Extrae las declaraciones más importantes (quotes).
      3. Sugiere 3 tipos de titulares.
      4. Propón ángulos periodísticos adicionales.
      5. Genera un "Social Media Briefing" con ganchos para plataformas, resumen ejecutivo y hashtags relevantes.
      6. IMPORTANTE: No utilices formato Markdown (como asteriscos para negritas, cursivas o almohadillas para títulos) en el contenido de la respuesta.
      
      Material: "${input}"
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "news_story": "El cuerpo central del texto estructurado según la forma solicitada",
        "headlines": {
          "seo": "Titular optimizado para buscadores",
          "narrative": "Titular con estilo narrativo/gancho",
          "direct": "Titular de impacto directo"
        },
        "key_quotes": ["Declaración 1", "Declaración 2"],
        "angles": ["Ángulo humano...", "Ángulo económico..."],
        "social_briefing": {
          "platform_hooks": ["Gancho para LinkedIn", "Gancho para IG/X"],
          "summary": "Resumen rápido",
          "hashtags": ["#ht1", "#ht2"]
        }
      }`;

      const data = await processWithGemini({ customPrompt: prompt }, 'process');
      const result = JSON.parse(data.text.replace(/```json|```/g, '').trim());
      setData(result);
    } catch (error: any) {
      console.error('Error processing news:', error);
      setError(error.message || "Error al procesar noticias");
    } finally {
      setLoading(false);
    }
  };

  const sendToProcessor = () => {
    if (!data) return;
    
    const briefingText = data.social_briefing ? `\n\nSOCIAL MEDIA BRIEFING\n- Resumen: ${data.social_briefing.summary}\n- Hooks: ${data.social_briefing.platform_hooks.join(' | ')}\n- Hashtags: ${data.social_briefing.hashtags.join(' ')}` : '';
    
    const fullText = `${data.headlines.direct.toUpperCase()}\n\nTitulares Alternativos:\n- SEO: ${data.headlines.seo}\n- Narrativo: ${data.headlines.narrative}\n\n------------------\n\n${data.news_story}${briefingText}\n\nCitas Destacadas:\n${data.key_quotes.map(q => `"${q}"`).join('\n\n')}\n\nPosibles Enfoques:\n${data.angles.map(a => `- ${a}`).join('\n')}\n\n------------------\nGenerado con Redactor IA`;
    
    window.dispatchEvent(new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    }));
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-12 bg-transparent pb-4" id="redactor-ia">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start">
        Redactor IA
      </h1>
      
      <div className="flex flex-col gap-8">
        {/* Selector de Estructura */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {(['piramide_invertida', 'cronica', 'hilo_x', 'gacetilla', 'storytelling', 'reportaje', 'opinion'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStructure(s)}
              className={`px-4 py-3 text-[9px] font-black uppercase tracking-tighter transition-all border-2 ${
                structure === s ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <AutoResizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Entrada de datos crudos, declaraciones o registros de entrevistas..."
              className="w-full min-h-[200px] p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-base focus:outline-none focus:border-black font-sans text-black placeholder-zinc-300 transition-all shadow-sm"
            />
          </div>

          <div className="bg-zinc-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <MessageSquarePlus size={14} />
              <span>Prompts_Extras / Instrucciones_Personalizadas</span>
            </div>
            <AutoResizeTextarea
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder="Ej: 'Usa un tono más sarcástico', 'Enfócate en los datos económicos', 'Limita a 3 párrafos'..."
              className="w-full min-h-[80px] p-4 bg-white border border-zinc-200 rounded-none text-sm focus:outline-none focus:border-black font-sans text-black placeholder-zinc-400"
            />
          </div>
          
          <button
            onClick={processNews}
            disabled={loading || !input.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
            {loading ? 'Generando Redactor.Sistema...' : 'PROCESAR_INTEL.SERIALIZAR'}
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

      {data && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="grid gap-10">
            {/* Titulares */}
            <div className="bg-white border-2 border-black rounded-none p-10 shadow-2xl">
              <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-10 border-b-2 border-zinc-50 pb-8">
                <Heading1 size={18} />
                <span>Matriz de Titulares de Impacto</span>
              </div>
              <div className="space-y-10">
                <div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 block italic underline decoration-zinc-100 underline-offset-4">Titular de Impacto Directo</span>
                  <p className="text-2xl font-black text-black leading-[1.1]">{data.headlines.direct}</p>
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

            {/* Redacción y Briefing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white border-2 border-black rounded-none p-12 relative overflow-hidden shadow-[30px_30px_0px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-10 border-b-2 border-zinc-50 pb-8">
                  <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em]">
                    <FileText size={20} />
                    <span>Texto Redactado</span>
                  </div>
                  <button 
                    onClick={sendToProcessor}
                    className="px-8 py-4 bg-black text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-3 active:scale-95 shadow-xl group border-2 border-black"
                  >
                    {sent ? <Check size={16} /> : <Send size={16} />}
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{sent ? 'TRANSFERENCIA_OK' : 'ENVIAR_AL_EDITOR'}</span>
                  </button>
                </div>
                <div className="text-[17px] text-zinc-900 leading-[1.9] whitespace-pre-wrap font-serif relative z-10 selection:bg-black selection:text-white">
                  {data.news_story}
                </div>
              </div>

              {/* Briefing Redes */}
              {data.social_briefing && (
                <div className="bg-zinc-950 text-white p-10 space-y-10">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
                    <Share2 size={18} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Briefing_Social</span>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Resumen_Ejecutivo</span>
                      <p className="text-xs leading-relaxed text-zinc-300 italic">{data.social_briefing.summary}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Hooks_Plataformas</span>
                      {data.social_briefing.platform_hooks.map((hook, i) => (
                        <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 text-[11px] leading-relaxed">
                          {hook}
                        </div>
                      ))}
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Hashtags</span>
                      <p className="text-[11px] font-mono text-white tracking-widest">
                        {data.social_briefing.hashtags.join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none p-10">
                <div className="flex items-center gap-4 text-[10px] font-black text-black uppercase tracking-[0.3em] mb-8">
                  <Quote size={18} />
                  <span>Citas Destacadas</span>
                </div>
                <div className="space-y-6">
                  {data.key_quotes.map((quote, i) => (
                    <div key={i} className="bg-white p-8 border border-zinc-100 leading-relaxed font-serif text-[14px]">
                       "{quote}"
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-50 border-2 border-zinc-100 rounded-none p-10">
                <div className="flex items-center gap-4 text-[10px] font-black text-black uppercase tracking-[0.3em] mb-8">
                  <Info size={18} />
                  <span>Ángulos Proyectados</span>
                </div>
                <ul className="space-y-5">
                  {data.angles.map((angle, i) => (
                    <li key={i} className="text-[13px] text-zinc-600 flex items-start gap-6 p-6 bg-white border border-zinc-100">
                      <div className="w-2 h-0.5 bg-black mt-2 flex-none shrink-0" />
                      <span className="uppercase font-medium tracking-tight">{angle}</span>
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

