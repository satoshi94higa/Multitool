import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Quote, Heading1, Send, Check, Copy, Loader2, Zap, Info, FileText, Share2, AlignLeft, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { processWithGemini } from '../services/geminiService';

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1 align-middle">
      <button 
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="text-zinc-300 hover:text-black transition-colors p-1"
      >
        <Info size={10} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest leading-relaxed pointer-events-none shadow-2xl border border-white/10"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

type NarrativeStructure = 'piramide_invertida' | 'cronica' | 'hilo_x' | 'gacetilla' | 'storytelling' | 'reportaje' | 'carrusel';

interface CarouselSlide {
  slide_number: number;
  text: string;
  photo_suggestion: string;
}

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
  carousel_slides?: CarouselSlide[];
}

export default function RedactorIA() {
  const [input, setInput] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [structure, setStructure] = useState<NarrativeStructure>('piramide_invertida');
  const [slideCount, setSlideCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JournalismOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const structureInfo = {
    piramide_invertida: 'Información más importante primero, seguida de detalles en orden descendente.',
    cronica: 'Relato detallado y cronológico enfocado en la vivencia y lo sensorial.',
    hilo_x: 'Secuencia de posts cortos y conectados optimizados para lectura rápida en X.',
    gacetilla: 'Comunicado formal corporativo listo para ser difundido por medios.',
    storytelling: 'Relato emocional con un arco narrativo claro: inicio, nudo y desenlace.',
    reportaje: 'Investigación profunda con datos, múltiples ángulos y análisis exhaustivo.',
    carrusel: 'Guion para diapositivas con textos potentes y sugerencias visuales.'
  };

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
        carrusel: `Carrusel de Instagram (secuencia de hasta ${slideCount} diapositivas con textos breves y sugerencias visuales)`
      }[structure];

      let carruselRules = '';
      if (structure === 'carrusel') {
        carruselRules = `
          7. Para el Carrusel de Instagram: 
             - Genera exactamente entre 1 y ${slideCount} diapositivas.
             - Los textos deben ser MUY breves (máximo 15-20 palabras por slide).
             - El tono debe ser estrictamente INFORMATIVO y PRECISO.
             - NO utilices slogans, frases publicitarias o ganchos genéricos.
             - Destaca cifras impactantes, datos concretos o citas clave extraídas directamente del material.
             - No todas las imágenes deben tener texto (algunas pueden ser solo visuales sugeridas para dar aire al diseño).
             - Incluye una sugerencia detallada de qué mostrar en la foto de cada imagen.
        `;
      }

      const prompt = `Actúa como un redactor jefe experto y estratega de contenido visual. 
      Toma el siguiente material y conviértelo en una pieza profesional de alto impacto.
      
      ESTRUCTURA SOLICITADA: ${structureLabel}.
      ${extraInstructions ? `INSTRUCCIONES ADICIONALES DEL USUARIO: ${extraInstructions}` : ''}
      
      Reglas:
      1. Sigue estrictamente la estructura "${structureLabel}".
      2. Extrae las declaraciones más importantes (quotes).
      3. Sugiere 3 tipos de titulares.
      4. Propón ángulos periodísticos adicionales.
      5. Genera un "Social Media Briefing" con ganchos para plataformas, resumen ejecutivo y hashtags relevantes.
      6. IMPORTANTE: No utilices formato Markdown (como asteriscos para negritas, cursivas o almohadillas para títulos) en el contenido de la respuesta.
      ${carruselRules}
      
      Material: "${input}"
      
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "news_story": "El cuerpo central del texto estructurado (si es carrusel, haz una breve introducción o resumen aquí)",
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
        },
        "carousel_slides": [
          { "slide_number": 1, "text": "Texto breve para el slide", "photo_suggestion": "Descripción de la imagen" }
        ]
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
    
    const carouselText = data.carousel_slides ? `\n\nESTRUCTURA DE CARRUSEL DE INSTAGRAM:\n${data.carousel_slides.map(s => `Slide ${s.slide_number}:\n[TEXTO]: ${s.text}\n[IMAGEN]: ${s.photo_suggestion}`).join('\n\n')}` : '';

    const fullText = `${data.headlines.direct.toUpperCase()}\n\nTitulares Alternativos:\n- SEO: ${data.headlines.seo}\n- Narrativo: ${data.headlines.narrative}\n\n------------------\n\n${data.news_story}${carouselText}${briefingText}\n\nCitas Destacadas:\n${data.key_quotes.map(q => `"${q}"`).join('\n\n')}\n\nPosibles Enfoques:\n${data.angles.map(a => `- ${a}`).join('\n')}\n\n------------------\nGenerado con Redactor IA`;
    
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
        <div className="space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {(['piramide_invertida', 'cronica', 'hilo_x', 'gacetilla', 'storytelling', 'reportaje', 'carrusel'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStructure(s)}
                className={`px-4 py-3 text-[9px] font-black uppercase tracking-tighter transition-all border-2 flex flex-col items-center justify-center gap-1 leading-tight ${
                  structure === s ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
                }`}
              >
                <span>{s.replace('_', ' ')}</span>
                <InfoTooltip text={structureInfo[s]} />
              </button>
            ))}
          </div>

          {structure === 'carrusel' && (
            <div className="bg-zinc-100 p-6 space-y-4 animate-in fade-in slide-in-from-left-4">
              <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <Share2 size={14} />
                  <span>Configuración del Carrusel</span>
                </div>
                <span>{slideCount} Imágenes Máx.</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={slideCount} 
                onChange={(e) => setSlideCount(parseInt(e.target.value))}
                className="w-full accent-black h-1.5 bg-zinc-200 rounded-none cursor-pointer appearance-none"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-bold px-1">
                <span>1 SLIDE</span>
                <span>20 SLIDES</span>
              </div>
            </div>
          )}
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

            {/* Carrusel de Instagram */}
            {data.carousel_slides && data.carousel_slides.length > 0 && (
              <div className="bg-white border-2 border-black p-10 shadow-2xl">
                <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-10 border-b-2 border-zinc-50 pb-8">
                  <Share2 size={18} />
                  <span>Plan de Carrusel de Instagram</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.carousel_slides.map((slide, i) => (
                    <div key={i} className="group border border-zinc-100 bg-zinc-50 flex flex-col h-full hover:border-black transition-colors">
                      <div className="p-4 bg-black text-white flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest">DIAPOSITIVA_{slide.slide_number}</span>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col space-y-6">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Texto_en_Imagen</span>
                          <p className="text-sm font-medium leading-relaxed italic text-black bg-white p-4 border border-zinc-100">
                            {slide.text || '(Solo imagen/visual)'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block italic">Sugerencia_Visual</span>
                          <p className="text-[11px] leading-relaxed text-zinc-600 font-mono">
                            {slide.photo_suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

