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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
               { "scene": "Gancho", "visual": "descripción visual", "audio": "qué se dice", "duration": "0-3s", "sfx": "sugerencia de sonido o música" },
               ...
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
               { "scene": "Intro", "visual": "descripción de la toma", "audio": "diálogo detallado", "duration": "0:30s", "sfx": "música de fondo sugerida" },
               ...
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
    const mdHeader = "| Escena | Duración | Visual | Audio | SFX |\n|---|---|---|---|---|";
    const mdRows = rundown.map(item => 
      `| ${item.scene} | ${item.duration} | ${item.visual} | ${item.audio} | ${item.sfx || '-'} |`
    ).join('\n');
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
    const headers = ['Escena', 'Duración', 'Visual', 'Audio', 'SFX/Música'].join('\t');
    const rowsTSV = rundown.map(item => 
      [item.scene, item.duration, item.visual, item.audio, item.sfx || ''].join('\t')
    );
    const tableStringTSV = [headers, ...rowsTSV].join('\n');

    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Escena</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Duración</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Visual</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Audio</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">SFX/Música</th>
          </tr>
        </thead>
        <tbody>
          ${rundown.map(item => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc; vertical-align: top;">${item.scene}</td>
              <td style="padding: 8px; border: 1px solid #ccc; vertical-align: top;">${item.duration}</td>
              <td style="padding: 8px; border: 1px solid #ccc; vertical-align: top; font-style: italic; color: #4b5563;">${item.visual}</td>
              <td style="padding: 8px; border: 1px solid #ccc; vertical-align: top;">${item.audio}</td>
              <td style="padding: 8px; border: 1px solid #ccc; vertical-align: top; color: #2563eb;">${item.sfx || ''}</td>
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
    <div className="space-y-6" id="screenwriter-ia">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Video size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Screenwriter IA</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Guionista de Contenido</p>
          </div>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
          <button
            onClick={() => setPlatform('instagram')}
            className={`p-1.5 rounded-md transition-all ${platform === 'instagram' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Optimizado para Instagram/TikTok (Vertical)"
          >
            <Instagram size={16} />
          </button>
          <button
            onClick={() => setPlatform('youtube')}
            className={`p-1.5 rounded-md transition-all ${platform === 'youtube' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Optimizado para YouTube (Horizontal)"
          >
            <Youtube size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {(['energetic', 'casual', 'professional', 'humorous'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                tone === t ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-100 hover:text-blue-500'
              }`}
            >
              {t === 'energetic' ? 'Enérgico' : t === 'casual' ? 'Casual' : t === 'humorous' ? 'Humor' : 'Profesional'}
            </button>
          ))}
          
          <div className="flex-1" />
          
          <button
            onClick={() => setPowerHook(!powerHook)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
              powerHook ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-100 text-gray-400 opacity-60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${powerHook ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
            Hook Potenciado
          </button>
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pega aquí la idea o el texto base para tu video..."
            className="w-full h-36 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-200 resize-none font-sans"
          />
          <div className="flex gap-4 mt-1.5 ml-1 text-[9px] font-bold text-gray-400 uppercase">
            <span>Palabras: {wordCount}</span>
            <span>~{estReadingTime} seg lectura</span>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-3 text-gray-300">
            <MessageSquarePlus size={14} />
          </div>
          <input
            type="text"
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="Instrucciones extra (ej: menciona mi marca, empieza con un dato...)"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:border-blue-100 placeholder:text-gray-300"
          />
        </div>
        
        <button
          onClick={generateScript}
          disabled={loading || !input.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-30 transition-all shadow-md shadow-blue-100"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          {loading ? 'Redactando guion...' : 'Generar Guion Profesional'}
        </button>
      </div>

      {(script || rundown.length > 0) && (
        <div className="space-y-6 pt-4 border-t border-gray-50">
          <div className="bg-gray-50 rounded-xl p-4 relative border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <ScrollText size={12} />
                <span>Guion Final</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={sendToProcessor}
                  title="Enviar al Procesador de Texto"
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-blue-500 transition-all"
                >
                  {sent ? <Check size={14} className="text-green-500" /> : <Send size={14} />}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-400 transition-all"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{script}</p>
          </div>

          {(thumbnail || keywords.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thumbnail && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                    <Video size={12} />
                    <span>Idea de Miniatura</span>
                  </div>
                  <p className="text-[11px] font-bold text-blue-900 mb-1">{thumbnail.text_overlay}</p>
                  <p className="text-[10px] text-blue-700 italic leading-relaxed">{thumbnail.idea}</p>
                </div>
              )}
              {keywords.length > 0 && (
                <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2">
                    <ScrollText size={12} />
                    <span>Keywords / Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-purple-100 rounded text-[9px] text-purple-600 font-medium">#{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <MonitorSmartphone size={12} />
                <span>Escaleta Técnica ({platform === 'instagram' ? '9:16' : '16:9'})</span>
              </div>
              {rundown.length > 0 && (
                <button 
                  onClick={copyTableToClipboard}
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 rounded-md text-[9px] font-bold text-gray-400 transition-colors border border-transparent hover:border-gray-100"
                  title="Copiar para Word/Excel"
                >
                  {copiedTable ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  <span>{copiedTable ? 'Copiado' : 'Copiar Tabla'}</span>
                </button>
              )}
            </div>
            
            <div className="grid gap-3">
              {rundown.map((item, idx) => (
                <div key={idx} className="group flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 hover:shadow-sm transition-all">
                  <div className="flex-none w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-900">{item.scene}</span>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        <Clock size={10} />
                        {item.duration}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Visual</span>
                        <p className="text-[11px] text-gray-600 italic leading-snug">{item.visual}</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Audio / Locución</span>
                        <p className="text-[11px] text-gray-600 leading-snug">{item.audio}</p>
                      </div>
                      {item.sfx && (
                        <div>
                          <span className="block text-[8px] font-bold text-blue-400 uppercase tracking-tighter mb-1">SFX / Música</span>
                          <p className="text-[11px] text-blue-600 font-medium leading-snug">{item.sfx}</p>
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
