import React, { useState } from 'react';
import { Type, Sparkles, Copy, Check, RotateCcw, Layout, MessageSquareQuote, Clapperboard, Download } from 'lucide-react';
import { processWithGemini } from '../services/geminiService';

const SUBTITLE_STYLES = [
  { id: 'bold', name: 'Impacto (Bold)', desc: 'Líneas cortas y directas. Sin formato forzado.' },
  { id: 'minimal', name: 'Minimalista', desc: 'Limpio y sutil, estilo cinematográfico o corporativo.' },
  { id: 'storytelling', name: 'Storytelling', desc: 'Puntuación clara, pausas con puntos suspensivos.' },
  { id: 'podcast', name: 'Estilo Podcast', desc: 'Legibilidad perfecta, bloques narrativos estilo Late Night.' },
  { id: 'dynamic', name: 'Dinámico', desc: 'Símbolos [ ] o * * para resaltar palabras clave.' }
];

export default function SubtitleAssistant() {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('bold');
  const [useSrt, setUseSrt] = useState(false);
  const [useEmojis, setUseEmojis] = useState(false);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const prompt = `Actuá como un editor de video experto en subtítulos dinámicos para redes sociales y post-producción. 
      Tomá el siguiente texto (transcripción) y convertilo en subtítulos con el estilo: "${style}".
      Usá español de Argentina (voseo, vocabulario local).
      
      CONFIGURACIÓN GLOBAL:
      - Emojis: ${useEmojis ? "SÍ, incluí 1-2 emojis pertinentes por cada 2-3 frases." : "NO, no incluyas ningún emoji bajo ninguna circunstancia."}
      
      ${useSrt ? `IMPORTANTE: Debés devolver el resultado estrictamente en FORMATO SRT (.srt) estándar para Premiere Pro.
      - Incluí índices numéricos (1, 2, 3...).
      - Usa timecodes en formato: 00:00:00,000 --> 00:00:00,000.
      - Si el texto de entrada NO tiene timecodes, estimá los tiempos con estas reglas:
        * Dejá un espacio de 100ms a 200ms de silencio entre cada bloque (que no termine uno en el mismo milisegundo que empieza el otro).
        * Si hay un punto final o punto y coma en el texto, dejá una pausa de silencio más larga (500ms).
        * Calculá la duración basada en la cantidad de palabras (~300ms por palabra o lo necesario para legibilidad).
      - Respetá el estilo visual solicitado ("${style}") dentro del texto del subtítulo.` : `Devolvé solo el texto formateado línea por línea.`}
      
      Instrucciones por estilo visual:
      - bold: Líneas muy cortas (máximo 3-4 palabras por bloque). Alta legibilidad. Usá mayúsculas/minúsculas normales. NO USES negritas, ni asteriscos, ni ningún tipo de formato markdown.
      - minimal: Puntuación perfecta, sin énfasis exagerado. Bloques medianos (5-7 palabras).
      - storytelling: Agregá puntos suspensivos (...) para marcar pausas dramáticas o cambios de idea. Tono cálido.
      - podcast: Estilo Late Night. Bloques de 1 o 2 frases completas. Máximo 2 líneas por subtítulo. Gramática perfecta.
      - dynamic: Usa símbolos como [ ] o * * para resaltar palabras clave que el editor colorearía luego.
      
      IMPORTANTE: Devolvé SOLO el contenido de los subtítulos. NO utilices formato Markdown (como **negrita** o *itálica*) a menos que el estilo "dynamic" lo solicite específicamente con símbolos. No incluyas explicaciones ni introducciones.
      
      Texto a procesar: "${input}"`;

      const data = await processWithGemini({ customPrompt: prompt, text: input }, 'process');
      setResult(data.text);
    } catch (error) {
      console.error(error);
      setResult('Error al procesar subtítulos. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSrt = () => {
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "subtitulos_estilizados.srt";
    document.body.appendChild(element);
    element.click();
  };

  const clear = () => {
    setInput('');
    setResult('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-black flex items-center justify-center text-white shrink-0">
          <Type size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Asistente de Subtítulos "Style"</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Post-Producción & Contenido Vertical</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black uppercase tracking-widest block mb-3 flex items-center gap-2">
              <MessageSquareQuote size={14} className="text-zinc-400" />
              Transcripción / Texto Bruto
            </label>
            <textarea
              className="w-full h-48 bg-zinc-50 border-2 border-zinc-100 p-6 font-mono text-sm focus:border-black focus:bg-white outline-none transition-all placeholder:text-zinc-300 resize-none"
              placeholder="Pega aquí el texto extraído del video o tus ideas..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest block mb-4 flex items-center gap-2">
                <Layout size={14} className="text-zinc-400" />
                Seleccionar Estilo Visual
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUBTITLE_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-4 border-2 text-left transition-all ${style === s.id ? 'border-black bg-zinc-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'border-zinc-100 bg-white hover:border-zinc-300'}`}
                  >
                    <div className="font-bold text-[10px] uppercase tracking-tighter">{s.name}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1 leading-tight">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border-2 border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-zinc-200 flex items-center justify-center">
                    <Clapperboard size={20} className={useSrt ? 'text-black' : 'text-zinc-300'} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest">SRT Premiere</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Para importar</div>
                  </div>
                </div>
                <button
                  onClick={() => setUseSrt(!useSrt)}
                  className={`w-12 h-6 rounded-full transition-all relative ${useSrt ? 'bg-black' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useSrt ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="p-4 border-2 border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-zinc-200 flex items-center justify-center">
                    <Sparkles size={20} className={useEmojis ? 'text-black' : 'text-zinc-300'} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest">Incluir Emojis</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">IA detecta contexto</div>
                  </div>
                </div>
                <button
                  onClick={() => setUseEmojis(!useEmojis)}
                  className={`w-12 h-6 rounded-full transition-all relative ${useEmojis ? 'bg-black' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useEmojis ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !input.trim()}
              className="flex-1 h-14 bg-black text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition-colors shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? 'Procesando...' : (
                <>
                  <Sparkles size={16} />
                  Estilizar Subtítulos
                </>
              )}
            </button>
            <button
              onClick={clear}
              className="px-6 h-14 border-2 border-zinc-100 hover:border-black hover:bg-zinc-50 transition-all flex items-center justify-center"
              title="Limpiar"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full border-2 border-zinc-100 bg-zinc-50/30 p-2">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resultado {useSrt ? 'SRT' : 'Generado'}</span>
            <div className="flex gap-4">
              {result && useSrt && (
                <button
                  onClick={downloadSrt}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors"
                >
                  <Download size={14} />
                  Descargar .SRT
                </button>
              )}
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar Texto'}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-300 space-y-4">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">IA Editando...</span>
              </div>
            ) : result ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-300 space-y-4 opacity-50">
                <Clapperboard size={48} strokeWidth={1} />
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] block">
                    Listo para post-producción
                  </span>
                  <p className="text-[9px] font-bold uppercase tracking-widest max-w-[240px]">
                    Si activas SRT, podrás importar este archivo directamente en Premiere Pro, CapCut o DaVinci.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

