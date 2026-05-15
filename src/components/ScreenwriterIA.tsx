import React, { useState, useEffect, useRef } from 'react';
import { Video, ScrollText, Play, Copy, Check, Loader2, Youtube, Instagram, MonitorSmartphone, Clock, Send, MessageSquarePlus, Zap, RefreshCw } from 'lucide-react';

type Platform = 'instagram' | 'youtube';
type Tone = 'casual' | 'professional' | 'energetic' | 'humorous';

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

interface Scene {
  scene: string;
  visual: string;
  audio: string;
  duration: string;
  sfx?: string;
  technical?: {
    shot: string;    // Plano/Angulo
    lens: string;    // Lente
    motion: string;  // Movimiento
    lighting: string; // Iluminacion
  };
}

interface ScriptData {
  full_script: string;
  rundown: Scene[];
  thumbnail: {
    idea: string;
    text_overlay: string;
  };
  keywords: string[];
}

export default function ScreenwriterIA() {
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [tone, setTone] = useState<Tone>('energetic');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [powerHook, setPowerHook] = useState(true);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [rundown, setRundown] = useState<Scene[]>([]);
  const [thumbnail, setThumbnail] = useState<{ idea: string; text_overlay: string } | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [sent, setSent] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const toneDescriptor = {
        casual: 'casual y relajado',
        professional: 'profesional y serio',
        energetic: 'enérgico y muy dinámico',
        humorous: 'divertido y con toques de humor'
      }[tone];

      const prompt = platform === 'instagram' 
        ? `Actúa como un guionista experto en contenido vertical para Instagram Reels y TikTok. 
           Transforma el siguiente texto en un guion dinámico.
           ${powerHook ? 'IMPORTANTE: Crea un "Hook Potenciado" extremadamente impactante para los primeros 3 segundos.' : 'Incluye un hook claro en los primeros 3 segundos.'}
           El guion debe durar máximo 1:30 minutos.
           Manten un tono ${toneDescriptor}.
           ${extraPrompt ? `Instrucciones adicionales: ${extraPrompt}` : ''}
           
           Texto base: "${input}"
           
           Devuelve la respuesta estrictamente en este formato JSON:
           {
             "full_script": "Texto completo listo para leer",
             "rundown": [
               { 
                 "scene": "Gancho", 
                 "visual": "descripción visual", 
                 "audio": "qué se dice", 
                 "duration": "0-3s", 
                 "sfx": "sugerencia de sonido",
                 "technical": {
                   "shot": "Plano/Ángulo (ej: Primer plano, Zenital)",
                   "lens": "Lente sugerida (ej: 35mm, Wide)",
                   "motion": "Movimiento (ej: Steady, Zoom)",
                   "lighting": "Iluminación (ej: Natural, Key Light)"
                 }
               }
             ],
             "thumbnail": { "idea": "idea visual para la portada", "text_overlay": "texto corto para la portada" },
             "keywords": ["tag1", "tag2", ...]
           }`
        : `Actúa como un guionista profesional de YouTube para contenido horizontal. 
           Transforma el siguiente texto en un guion estructurado con: Intro, Desarrollo, Valor y CTA.
           El tono debe ser ${toneDescriptor}.
           ${extraPrompt ? `Instrucciones adicionales: ${extraPrompt}` : ''}
           
           Texto base: "${input}"
           
           Devuelve la respuesta estrictamente en este formato JSON:
           {
             "full_script": "Texto completo del guion con indicaciones de entonación",
             "rundown": [
               { 
                 "scene": "Intro", 
                 "visual": "descripción de la toma", 
                 "audio": "diálogo detallado", 
                 "duration": "0:30s", 
                 "sfx": "SFX",
                 "technical": {
                   "shot": "Plano/Ángulo",
                   "lens": "Lente",
                   "motion": "Movimiento",
                   "lighting": "Iluminación"
                 }
               }
             ],
             "thumbnail": { "idea": "composición de la miniatura", "text_overlay": "título clickbait para la miniatura" },
             "keywords": ["tag1", "tag2", ...]
           }`;

      const response = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt: prompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Processing failed");
      }
      const dataResponse = await response.json();
      const data: ScriptData = JSON.parse(dataResponse.text.replace(/```json|```/g, '').trim());
      setScript(data.full_script);
      setRundown(data.rundown || []);
      setThumbnail(data.thumbnail || null);
      setKeywords(data.keywords || []);
    } catch (error: any) {
      console.error('Error generating script:', error);
      setError(error.message || "Error al generar guion");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToProcessor = () => {
    const mdHeader = "| Escena | Duración | Visual | Audio | Datos Técnicos |\n|---|---|---|---|---|";
    const mdRows = rundown.map(item => {
      const techStr = item.technical ? `[${item.technical.shot}] [${item.technical.lens}] [${item.technical.motion}] [${item.technical.lighting}]` : '-';
      return `| ${item.scene} | ${item.duration} | ${item.visual} | ${item.audio} | ${techStr} |`;
    }).join('\n');
    const tableMD = `${mdHeader}\n${mdRows}`;
    
    const extraInfo = `IDEAS DE MINIATURA:\n- Idea: ${thumbnail?.idea}\n- Texto: ${thumbnail?.text_overlay}\n\nKEYWORDS: ${keywords.join(', ')}`;
    const fullText = `# GUION ${platform.toUpperCase()} (${tone.toUpperCase()})\n${powerHook ? '> *Optimizado con Hook Potenciado*\n' : ''}\n## Guion\n${script}\n\n## Escaleta Técnica\n${tableMD}\n\n---\n${extraInfo}`;
    
    const event = new CustomEvent('app-set-text', { 
      detail: { text: fullText, append: true } 
    });
    window.dispatchEvent(event);
    
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const syncScriptToRundown = () => {
    // Intenta dividir el guion por bloques de texto (párrafos)
    const blocks = script.split(/\n\n+/).filter(b => b.trim().length > 0);
    
    if (rundown.length > 0) {
      const newRundown = [...rundown];
      // Mapeo 1:1 o secuencial de bloques a escenas
      for (let i = 0; i < Math.min(blocks.length, rundown.length); i++) {
        newRundown[i].audio = blocks[i].trim();
      }
      setRundown(newRundown);
      
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
    }
  };

  const copyTableToClipboard = async () => {
    const headers = ['Escena', 'Duración', 'Visual', 'Audio', 'Plano/Ángulo', 'Lente', 'Movimiento', 'Iluminación'].join('\t');
    const rowsTSV = rundown.map(item => 
      [
        item.scene, 
        item.duration, 
        item.visual, 
        item.audio, 
        item.technical?.shot || '', 
        item.technical?.lens || '', 
        item.technical?.motion || '', 
        item.technical?.lighting || ''
      ].join('\t')
    );
    const tableStringTSV = [headers, ...rowsTSV].join('\n');

    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <th style="padding: 8px; border: 1px solid #ccc;">Escena</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Dura.</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Visual</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Audio</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Plano</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Lente</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Mov.</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Luz</th>
          </tr>
        </thead>
        <tbody>
          ${rundown.map(item => `
            <tr>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.scene}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.duration}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top; font-style: italic;">${item.visual}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.audio}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.technical?.shot || '-'}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.technical?.lens || '-'}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.technical?.motion || '-'}</td>
              <td style="padding: 6px; border: 1px solid #ccc; vertical-align: top;">${item.technical?.lighting || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    try {
      const typeText = "text/plain";
      const typeHtml = "text/html";
      const blobText = new Blob([tableStringTSV], { type: typeText });
      const blobHtml = new Blob([tableHTML], { type: typeHtml });
      const item = new ClipboardItem({ [typeText]: blobText, [typeHtml]: blobHtml });
      await navigator.clipboard.write([item]);
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(tableStringTSV);
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    }
  };

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const estReadingTime = Math.ceil(wordCount / 160) || 0;

  return (
    <div className="space-y-12 bg-transparent pb-4 w-full max-w-none px-4 md:px-8" id="screenwriter-ia">
      <h1 className="text-xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 inline-block self-start">
        Guionista IA
      </h1>

      <div className="space-y-6 mt-4">
        {/* Fila 1: Plataformas */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1.5 border border-zinc-200">
          <button
            onClick={() => setPlatform('instagram')}
            className={`flex items-center justify-center gap-3 py-4 transition-all font-black text-[10px] uppercase tracking-widest ${platform === 'instagram' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black'}`}
          >
            <Instagram size={18} />
            <span>Instagram / TikTok</span>
          </button>
          <button
            onClick={() => setPlatform('youtube')}
            className={`flex items-center justify-center gap-3 py-4 transition-all font-black text-[10px] uppercase tracking-widest ${platform === 'youtube' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black'}`}
          >
            <Youtube size={18} />
            <span>YouTube HD</span>
          </button>
        </div>

        {/* Fila 2: Tonos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['energetic', 'casual', 'professional', 'humorous'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`py-4 px-2 border-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                tone === t ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
              }`}
            >
              {t === 'energetic' ? 'Energético' : t === 'casual' ? 'Casual' : t === 'humorous' ? 'Humorístico' : 'Profesional'}
            </button>
          ))}
        </div>

        {/* Fila 3: Hook */}
        <button
          onClick={() => setPowerHook(!powerHook)}
          className={`w-full flex items-center justify-between px-6 py-4 border-2 transition-all group ${
            powerHook ? 'bg-zinc-900 border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
          }`}
        >
          <div className="flex items-center gap-4">
            <Zap size={18} className={powerHook ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gancho de Alto Impacto (Psicología Inversa)</span>
          </div>
          <div className={`w-10 h-5 rounded-none p-1 transition-colors ${powerHook ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
            <div className={`w-3 h-3 rounded-none transition-transform ${powerHook ? 'bg-yellow-400 translate-x-5' : 'bg-white translate-x-0'}`} />
          </div>
        </button>
      </div>

        <div className="space-y-6">
          <div className="relative group">
            <AutoResizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inicializar inteligencia de origen (tema, objetivo)..."
              className="w-full min-h-[200px] p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-sm focus:outline-none focus:border-black font-sans text-black placeholder-zinc-300"
            />
            <div className="absolute bottom-6 right-8 flex gap-8 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] pointer-events-none">
              <span>Palabras: {wordCount}</span>
              <span className="italic">Tiempo.EST: {estReadingTime}s</span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors">
              <MessageSquarePlus size={16} />
            </div>
            <input
              type="text"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Parámetros de restricción (estilo de marca, requisitos específicos)..."
              className="w-full pl-14 pr-6 py-5 bg-zinc-50 border-2 border-black/5 rounded-none text-[11px] font-mono focus:outline-none focus:border-black placeholder:text-zinc-300 text-black"
            />
          </div>
          
          <button
            onClick={generateScript}
            disabled={loading || !input.trim()}
            className="w-full py-6 bg-black text-white rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
            {loading ? 'Compilando Inteligencia...' : 'GENERAR_GUION_IA'}
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

      {(script || rundown.length > 0) && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-white border-2 border-black rounded-none p-10 relative group shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b-2 border-zinc-50 pb-8">
              <div className="flex items-center gap-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">
                <ScrollText size={18} />
                <span>Resultado.Guion</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={syncScriptToRundown}
                  title="Sincronizar Guion con Escaleta"
                  className={`p-4 rounded-none transition-all shadow-xl active:scale-90 flex items-center gap-2 ${synced ? 'bg-green-500 text-white' : 'bg-zinc-800 text-white hover:bg-black'}`}
                >
                  <RefreshCw size={18} className={synced ? '' : 'animate-spin-slow'} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Sinc. Escaleta</span>
                </button>
                <button 
                  onClick={sendToProcessor}
                  title="Send to Editor"
                  className="p-4 bg-black text-white hover:bg-zinc-800 rounded-none transition-all shadow-xl active:scale-90"
                >
                  {sent ? <Check size={18} /> : <Send size={18} />}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-none text-zinc-400 hover:text-black transition-all active:scale-90"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            <AutoResizeTextarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full text-[17px] leading-[2] text-black bg-transparent border-none focus:ring-0 font-serif selection:bg-black selection:text-white min-h-[400px] outline-none"
              placeholder="El guion aparecerá aquí..."
            />
          </div>

          {(thumbnail || keywords.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
              {thumbnail && (
                <div className="bg-zinc-50 rounded-none p-10 border-2 border-zinc-100 hover:border-black transition-all group">
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8">
                    <Video size={16} />
                    <span>Estrategia de Miniatura</span>
                  </div>
                  <p className="text-xl font-black text-black tracking-tight leading-tight mb-4 uppercase">{thumbnail.text_overlay}</p>
                  <p className="text-[12px] text-zinc-500 italic leading-relaxed uppercase tracking-tighter">{thumbnail.idea}</p>
                </div>
              )}
              {keywords.length > 0 && (
                <div className="bg-white rounded-none p-10 border-2 border-zinc-100 hover:border-black transition-all">
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8">
                    <Zap size={16} />
                    <span>Vectores SEO</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {keywords.map((k, i) => (
                      <span key={i} className="px-5 py-2 bg-zinc-50 border border-zinc-200 rounded-none text-[10px] font-mono font-black text-black tracking-widest uppercase hover:bg-black hover:text-white transition-colors">#{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-6">
              <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em]">
                <MonitorSmartphone size={20} />
                <span>ESCALETA_TÉCNICA ({platform === 'instagram' ? '9:16' : '16:9'})</span>
              </div>
              {rundown.length > 0 && (
                <button 
                  onClick={copyTableToClipboard}
                  className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-zinc-800 rounded-none text-[10px] font-black text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                >
                  {copiedTable ? <Check size={16} /> : <Copy size={16} />}
                  <span>Copiar Tabla</span>
                </button>
              )}
            </div>
            
            <div className="border-t-2 border-black pt-4">
              <table className="w-full border-collapse md:table-auto">
                <thead>
                  <tr className="bg-zinc-50 border-b-2 border-black">
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 w-12 md:w-16">#</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 min-w-[200px]">Matriz_Visual / Audio</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 w-20 md:w-24">Tiempo</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 min-w-[250px]">Especificaciones_Técnicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {rundown.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                      <td className="p-2 md:p-4 align-top">
                        <div className="w-8 h-8 bg-black text-white rounded-none flex items-center justify-center text-[10px] font-black">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                      </td>
                      <td className="p-2 md:p-4 align-top space-y-4">
                        <div className="flex flex-col gap-1">
                          <input 
                            value={item.scene}
                            onChange={(e) => {
                              const newRundown = [...rundown];
                              newRundown[idx].scene = e.target.value;
                              setRundown(newRundown);
                            }}
                            className="text-[9px] font-black uppercase text-black tracking-widest bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                          />
                          <AutoResizeTextarea 
                            value={item.visual}
                            onChange={(e) => {
                              const newRundown = [...rundown];
                              newRundown[idx].visual = e.target.value;
                              setRundown(newRundown);
                            }}
                            className="text-[10px] md:text-[11px] text-zinc-500 italic uppercase leading-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            rows={2}
                          />
                        </div>
                        <div className="p-3 md:p-4 bg-white border-l-4 border-black group-hover:border-zinc-400 transition-colors shadow-sm">
                          <AutoResizeTextarea 
                            value={item.audio}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const newRundown = [...rundown];
                              newRundown[idx].audio = newValue;
                              setRundown(newRundown);
                              const fullScript = newRundown.map(r => r.audio).join('\n\n');
                              setScript(fullScript);
                            }}
                            className="w-full text-[12px] md:text-[13px] leading-relaxed text-black font-sans bg-transparent border-none focus:ring-0 p-0 h-auto min-h-[50px] outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-2 md:p-4 align-top">
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-mono font-black text-black">
                          <Clock size={12} className="opacity-30" />
                          <input 
                            value={item.duration}
                            onChange={(e) => {
                              const newRundown = [...rundown];
                              newRundown[idx].duration = e.target.value;
                              setRundown(newRundown);
                            }}
                            className="bg-transparent border-none focus:ring-0 p-0 w-full text-left outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-2 md:p-4 align-top">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <div className="space-y-1">
                            <span className="block text-[7px] md:text-[8px] font-black text-black uppercase tracking-widest">Plano</span>
                            <input 
                              value={item.technical?.shot || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.shot = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[9px] md:text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[7px] md:text-[8px] font-black text-black uppercase tracking-widest">Óptica</span>
                            <input 
                              value={item.technical?.lens || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.lens = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[9px] md:text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[7px] md:text-[8px] font-black text-black uppercase tracking-widest">Movimiento</span>
                            <input 
                              value={item.technical?.motion || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.motion = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[9px] md:text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[7px] md:text-[8px] font-black text-black uppercase tracking-widest">Luz</span>
                            <input 
                              value={item.technical?.lighting || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.lighting = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[9px] md:text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          {item.sfx && (
                            <div className="col-span-1 sm:col-span-2 pt-2 mt-2 border-t border-zinc-100">
                              <span className="block text-[7px] md:text-[8px] font-black text-red-500 uppercase tracking-widest italic">SFX_REQ</span>
                              <input 
                                value={item.sfx}
                                onChange={(e) => {
                                  const newRundown = [...rundown];
                                  newRundown[idx].sfx = e.target.value;
                                  setRundown(newRundown);
                                }}
                                className="text-[9px] md:text-[10px] font-mono text-black font-bold uppercase bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
