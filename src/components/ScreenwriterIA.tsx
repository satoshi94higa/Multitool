import React, { useState } from 'react';
import { Video, ScrollText, Play, Copy, Check, Loader2, Youtube, Instagram, MonitorSmartphone, Clock, Send, MessageSquarePlus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data: ScriptData = JSON.parse(response.text);
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
    <div className="space-y-4" id="screenwriter-ia">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Video size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold leading-tight">Screenwriter IA</h2>
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Escaleta Técnica</p>
          </div>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
          <button
            onClick={() => setPlatform('instagram')}
            className={`p-1 rounded-md transition-all ${platform === 'instagram' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Instagram size={14} />
          </button>
          <button
            onClick={() => setPlatform('youtube')}
            className={`p-1 rounded-md transition-all ${platform === 'youtube' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Youtube size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          {(['energetic', 'casual', 'professional', 'humorous'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                tone === t ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-100 hover:text-blue-500'
              }`}
            >
              {t === 'energetic' ? 'Ener' : t === 'casual' ? 'Casu' : t === 'humorous' ? 'Hum' : 'Prof'}
            </button>
          ))}
          
          <button
            onClick={() => setPowerHook(!powerHook)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border ${
              powerHook ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-100 text-gray-400 opacity-60'
            }`}
          >
            Hook
          </button>
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Idea o texto base..."
            className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-blue-200 resize-none font-sans"
          />
          <div className="flex gap-2 mt-1 ml-1 text-[8px] font-bold text-gray-400 uppercase">
            <span>{wordCount} palabras</span>
            <span>~{estReadingTime}s lectura</span>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-2.5 text-gray-300">
            <MessageSquarePlus size={12} />
          </div>
          <input
            type="text"
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="Instrucciones extra..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] focus:outline-none focus:border-blue-100 placeholder:text-gray-300"
          />
        </div>
        
        <button
          onClick={generateScript}
          disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-30 transition-all shadow-sm"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          {loading ? 'Redactando...' : 'Generar Guion'}
        </button>
      </div>

      {(script || rundown.length > 0) && (
        <div className="space-y-4 pt-3 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="bg-gray-50 rounded-xl p-3 relative border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <ScrollText size={10} />
                <span>Guion</span>
              </div>
              <div className="flex gap-1">
                <button onClick={sendToProcessor} className={`p-1 rounded-md transition-all ${sent ? 'text-green-500 bg-green-50' : 'text-blue-500 hover:bg-white'}`}>
                  {sent ? <Check size={14} /> : <Send size={14} />}
                </button>
                <button onClick={copyToClipboard} className={`p-1 rounded-md transition-all ${copied ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:bg-white'}`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto pr-1 scrollbar-hide">{script}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {thumbnail && (
              <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100">
                <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Miniatura</span>
                <p className="text-[10px] font-bold text-blue-900 leading-tight mb-0.5 truncate">{thumbnail.text_overlay}</p>
                <p className="text-[9px] text-blue-700 italic leading-tight truncate">{thumbnail.idea}</p>
              </div>
            )}
            {keywords.length > 0 && (
              <div className="bg-purple-50/50 rounded-xl p-2.5 border border-purple-100">
                <span className="block text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {keywords.slice(0, 4).map((k, i) => (
                    <span key={i} className="text-[9px] text-purple-600 font-medium">#{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Escaleta</span>
              {rundown.length > 0 && (
                <button onClick={copyTableToClipboard} className="text-[8px] font-black text-gray-400 uppercase hover:text-blue-500 transition-colors">
                  {copiedTable ? 'Copiado' : 'Copiar Tabla'}
                </button>
              )}
            </div>
            
            <div className="grid gap-2">
              {rundown.map((item, idx) => (
                <div key={idx} className="group p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 transition-all space-y-2">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-500">{idx + 1}</span>
                      <span className="text-[10px] font-bold text-gray-900 uppercase">{item.scene}</span>
                    </div>
                    <span className="text-[8px] font-black text-blue-400 bg-blue-50 px-1 py-0.5 rounded">{item.duration}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-600 leading-tight"><span className="text-[8px] font-bold uppercase text-gray-400 mr-1">Vis:</span>{item.visual}</p>
                      <p className="text-[10px] text-gray-600 leading-tight font-medium"><span className="text-[8px] font-bold uppercase text-gray-400 mr-1">Aud:</span>{item.audio}</p>
                    </div>
                    
                    <div className="bg-gray-50/50 rounded-lg p-1.5 grid grid-cols-2 gap-1 text-[8px]">
                      <div><span className="text-blue-400 uppercase font-bold">P:</span> {item.technical?.shot || '-'}</div>
                      <div><span className="text-blue-400 uppercase font-bold">L:</span> {item.technical?.lens || '-'}</div>
                      <div className="col-span-2 truncate"><span className="text-blue-400 uppercase font-bold">M:</span> {item.technical?.motion || '-'}</div>
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
