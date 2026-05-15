import React, { useState } from 'react';
import { Video, ScrollText, Play, Copy, Check, Loader2, Youtube, Instagram, MonitorSmartphone, Clock, Send, MessageSquarePlus, Zap } from 'lucide-react';

type Platform = 'instagram' | 'youtube';
type Tone = 'casual' | 'professional' | 'energetic' | 'humorous';

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

  const generateScript = async () => {
    if (!input.trim()) return;
    setLoading(true);
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

      if (!response.ok) throw new Error("Processing failed");
      const dataResponse = await response.json();
      const data: ScriptData = JSON.parse(dataResponse.text.replace(/```json|```/g, '').trim());
      setScript(data.full_script);
      setRundown(data.rundown || []);
      setThumbnail(data.thumbnail || null);
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Error generating script:', error);
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
    <div className="space-y-12 bg-transparent pb-4" id="screenwriter-ia">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Módulo de Guionismo</h2>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">AI.CONTINUITY_ENGINE</span>
        </div>
        
        <div className="flex items-center gap-1 bg-zinc-50 p-1.5 rounded-none border border-zinc-200">
          <button
            onClick={() => setPlatform('instagram')}
            className={`w-12 h-12 rounded-none flex items-center justify-center transition-all ${platform === 'instagram' ? 'bg-black text-white shadow-2xl' : 'text-zinc-400 hover:text-black'}`}
            title="Instagram / TikTok (9:16)"
          >
            <Instagram size={20} />
          </button>
          <button
            onClick={() => setPlatform('youtube')}
            className={`w-12 h-12 rounded-none flex items-center justify-center transition-all ${platform === 'youtube' ? 'bg-black text-white shadow-2xl' : 'text-zinc-400 hover:text-black'}`}
            title="YouTube (16:9)"
          >
            <Youtube size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <div className="flex flex-wrap gap-3 items-center">
          {(['energetic', 'casual', 'professional', 'humorous'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-5 py-3 rounded-none text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                tone === t ? 'bg-black border-black text-white shadow-2xl' : 'bg-transparent border-zinc-100 text-zinc-400 hover:text-black hover:border-black'
              }`}
            >
              {t === 'energetic' ? 'Enérgico' : t === 'casual' ? 'Casual' : t === 'humorous' ? 'Humorístico' : 'Profesional'}
            </button>
          ))}
          
          <div className="flex-1" />
          
          <button
            onClick={() => setPowerHook(!powerHook)}
            className={`flex items-center gap-4 px-5 py-3 rounded-none text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
              powerHook ? 'bg-zinc-50 border-black text-black shadow-lg' : 'bg-transparent border-zinc-100 text-zinc-400 hover:text-black hover:border-black'
            }`}
          >
            <div className={`w-2 h-2 rounded-none ${powerHook ? 'bg-black animate-pulse' : 'bg-zinc-200'}`} />
            Gancho de Alto Impacto
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inicializar inteligencia de origen (tema, objetivo)..."
              className="w-full h-48 p-8 bg-zinc-50 border-2 border-black/5 rounded-none text-sm focus:outline-none focus:border-black resize-none font-sans text-black placeholder-zinc-300 scrollbar-hide"
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
        </div>
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
            <p className="text-[17px] leading-[2] text-black whitespace-pre-wrap font-serif selection:bg-black selection:text-white">{script}</p>
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
            
            <div className="grid gap-8">
              {rundown.map((item, idx) => (
                <div key={idx} className="group flex flex-col p-10 bg-white border-2 border-zinc-100 hover:border-black rounded-none transition-all gap-10 relative">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-black text-white rounded-none flex items-center justify-center text-[12px] font-black tracking-tighter">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <span className="text-base font-black text-black uppercase tracking-[0.1em] italic">{item.scene}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono font-black text-black bg-zinc-50 px-4 py-2 border border-zinc-200 uppercase tracking-tighter">
                      <Clock size={14} className="opacity-40" />
                      {item.duration}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="bg-zinc-50 p-8 border border-zinc-100">
                        <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Matriz_Visual</span>
                        <p className="text-[12px] text-zinc-500 italic leading-relaxed uppercase tracking-tight">{item.visual}</p>
                      </div>
                      <div className="bg-zinc-50 p-8 border border-zinc-100">
                        <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Audio_Diálogo</span>
                        <p className="text-[13px] text-zinc-950 leading-loose font-sans">{item.audio}</p>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 p-8 grid grid-cols-2 gap-y-8 gap-x-12 border border-zinc-100">
                      <div>
                        <span className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Toma / Ángulo</span>
                        <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-tighter">{item.technical?.shot || '-'}</p>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Lente / Óptica</span>
                        <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-tighter">{item.technical?.lens || '-'}</p>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Movimiento</span>
                        <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-tighter">{item.technical?.motion || '-'}</p>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Iluminación</span>
                        <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-tighter">{item.technical?.lighting || '-'}</p>
                      </div>
                      {item.sfx && (
                        <div className="col-span-2 pt-6 border-t border-zinc-200">
                          <span className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3 italic underline">Efectos.SFX</span>
                          <p className="text-[11px] font-mono font-black text-black uppercase tracking-tighter">{item.sfx}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
