import React, { useState, useEffect, useRef } from 'react';
import { Video, ScrollText, Play, Copy, Check, Loader2, Youtube, Instagram, MonitorSmartphone, Clock, Send, MessageSquarePlus, Zap, RefreshCw, FileText, Download, Info, History, Trash2, ChevronRight, Volume2, VolumeX, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { processWithGemini } from '../services/geminiService';
import { saveToHistory, getHistory, deleteFromHistory, HistoryItem } from '../lib/persistence';
import Teleprompter from './Teleprompter';

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative inline-block ml-1 align-middle ${show ? 'z-[65]' : 'z-0'}`}>
      <span 
        role="button"
        tabIndex={0}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            setShow(!show);
          }
        }}
        className="text-zinc-400 hover:text-black transition-colors p-1 cursor-help inline-flex items-center justify-center"
      >
        <Info size={10} />
      </span>
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

type Platform = 'instagram' | 'youtube';
type Tone = 'casual' | 'professional' | 'energetic' | 'humorous';
type NarratorProfile = 'expert' | 'creator' | 'storyteller' | 'minimalist' | 'hype';

const platformInfo = {
  instagram: 'Scripts cortos (60-90s) optimizados para formato vertical y hooks rápidos.',
  youtube: 'Scripts estructurados para videos horizontales con introducción, desarrollo y cierre.'
};

const toneInfo = {
  energetic: 'Alta energía, ritmo rápido y tono emocionante.',
  casual: 'Cercano, relajado y modo conversación natural.',
  professional: 'Voz de autoridad, serio y experto.',
  humorous: 'Divertido, con chistes o remates ligeros.',
  professional_stable: 'Voz de autoridad, serio y experto.' // Fallback if professional is mapped differently
};

const narratorInfo = {
  expert: 'Voz de autoridad técnica en el tema.',
  creator: 'Voz de creador compartiendo su proceso personal.',
  storyteller: 'Enfocado en la narrativa emocional.',
  minimalist: 'Conciso, directo y sin rellenos.',
  hype: 'Entusiasmo máximo para captar atención inmediata.'
};

const hookDescriptions = {
  'psicologia-inversa': 'Gancho que desafía al usuario diciéndole que no haga algo o que no es para él.',
  'shokeante': 'Un dato estadístico, revelación o afirmación que rompa esquemas de inmediato.',
  'storytelling': 'Entra directo en medio de la acción ("In Media Res"), relatando un clímax.',
  'desafio': 'Desafía u ofrece una pregunta confrontadora directa a la audiencia.',
  'secreto': 'Plantea una verdad oculta o truco exclusivo desde el primer segundo.'
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
  const [narrator, setNarrator] = useState<NarratorProfile>('creator');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [powerHook, setPowerHook] = useState(true);
  const [hookType, setHookType] = useState<'psicologia-inversa' | 'shokeante' | 'storytelling' | 'desafio' | 'secreto'>('psicologia-inversa');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsIndex, setTtsIndex] = useState<number | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [rundown, setRundown] = useState<Scene[]>([]);
  const [thumbnail, setThumbnail] = useState<{ idea: string; text_overlay: string } | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [sent, setSent] = useState(false);
  const [synced, setSynced] = useState(false);
  const [refiningIdx, setRefiningIdx] = useState<number | null>(null);
  const [productionEstimate, setProductionEstimate] = useState<{ 
    budget: string; 
    difficulty: string; 
    equipment: string[]; 
    total_duration?: string;
    editing_style?: {
      cut_pacing?: string;
      suggested_music?: string;
      screen_text_fx?: string;
    };
  } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startTTS = (textToSpeak: string, index?: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es-AR')) || 
                           voices.find(v => v.lang.startsWith('es-')) ||
                           voices.find(v => v.lang.includes('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      utterance.onend = () => {
        setIsPlayingTTS(false);
        setTtsIndex(null);
      };
      utterance.onerror = () => {
        setIsPlayingTTS(false);
        setTtsIndex(null);
      };
      
      ttsUtteranceRef.current = utterance;
      if (index !== undefined) {
        setTtsIndex(index);
      } else {
        setIsPlayingTTS(true);
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("TTS no está soportado en este navegador");
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
    setTtsIndex(null);
  };

  const addSceneBelow = (idx: number) => {
    const newScene: Scene = {
      scene: `Escena nueva`,
      visual: "Descripción visual de la toma...",
      audio: "Texto hablado para esta secuencia...",
      duration: "5s",
      technical: {
        shot: "Primer plano",
        lens: "50mm",
        motion: "Fijo",
        lighting: "Natural"
      }
    };
    const newRundown = [...rundown];
    newRundown.splice(idx + 1, 0, newScene);
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
  };

  const deleteScene = (idx: number) => {
    if (rundown.length <= 1) {
      alert("Debes mantener al menos una escena en la escaleta.");
      return;
    }
    const newRundown = rundown.filter((_, i) => i !== idx);
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
  };

  const moveSceneUp = (idx: number) => {
    if (idx === 0) return;
    const newRundown = [...rundown];
    const temp = newRundown[idx];
    newRundown[idx] = newRundown[idx - 1];
    newRundown[idx - 1] = temp;
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
  };

  const moveSceneDown = (idx: number) => {
    if (idx === rundown.length - 1) return;
    const newRundown = [...rundown];
    const temp = newRundown[idx];
    newRundown[idx] = newRundown[idx + 1];
    newRundown[idx + 1] = temp;
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
  };

  const refineSceneCustom = async (idx: number, style: 'dynamic' | 'humor' | 'short' | 'epic' | 'director') => {
    setRefiningIdx(idx);
    try {
      const scene = rundown[idx];
      const styleDirectives = {
        dynamic: 'Hacé el diálogo mucho más enérgico, con ritmo rápido, directo y ganchero.',
        humor: 'Agregá un toque de humor, una ironía sutil o un remate divertido al diálogo.',
        short: 'Cortá palabras innecesarias. Mantené la esencia pero hacelo ultra conciso (mínimo tiempo de lectura).',
        epic: 'Dale un tono épico, narrativo, que despierte máxima curiosidad y emoción (storytelling profundo).',
        director: 'Mejorá al máximo los detalles técnicos de la escena (visual, plano, lente, movimiento, luz) para que sea 100% cinematográfico profesional.'
      }[style];

      const prompt = `Actúa como un director de cine experto y guionista senior de contenido digital de habla hispana (Argentina, voseo).
      Tu objetivo es mejorar esta secuencia de guion aplicando la siguiente directiva: "${styleDirectives}".
      
      Escena actual: "${scene.scene}"
      Audio actual: "${scene.audio}"
      Visual actual: "${scene.visual}"
      Dura actual: "${scene.duration}"
      
      Mejora tanto el audio como la descripción visual y mantén coherencia con los parámetros técnicos (plano, lente, movimiento, luz).
      
      Devuelve estrictamente un JSON con campos: scene, visual, audio, duration, technical (shot, lens, motion, lighting). No uses Markdown ni explicaciones adicionales.`;

      const response = await processWithGemini({ customPrompt: prompt }, 'process');
      const data = JSON.parse(response.text.replace(/```json|```/g, '').trim());
      
      const newRundown = [...rundown];
      newRundown[idx] = { ...newRundown[idx], ...data };
      setRundown(newRundown);
      
      const fullScript = newRundown.map(r => r.audio).join('\n\n');
      setScript(fullScript);
    } catch (err) {
      console.error(err);
      alert("Error al refinar la escena");
    } finally {
      setRefiningIdx(null);
    }
  };
  
  useEffect(() => {
    setHistory(getHistory('screenwriter'));
  }, []);

  const loadFromHistory = (item: HistoryItem) => {
    const { output } = item;
    setScript(output.full_script);
    setRundown(output.rundown || []);
    setThumbnail(output.thumbnail || null);
    setKeywords(output.keywords || []);
    setProductionEstimate(output.production_estimate || null);
    setInput(item.input);
    setShowHistory(false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const removeHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = deleteFromHistory('screenwriter', id);
    setHistory(newHistory);
  };

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

      const narratorDescriptor = {
        expert: 'un experto con autoridad y datos técnicos',
        creator: 'un creador de contenido dinámico y cercano',
        storyteller: 'un narrador épico que busca la emoción',
        minimalist: 'directo al grano, sin rodeos, conciso',
        hype: 'extremadamente emocionante, estilo MrBeast'
      }[narrator];

      const hookPromptText = {
        'psicologia-inversa': 'Creá un "Hook Potenciado" extremadamente impactante de psicología inversa en los primeros 3 segundos (ej: "No mires este video si...", "Hacé esto si odiás el dinero").',
        'shokeante': 'Creá un "Hook Potenciado" impactante con un dato shokeante, estadística inesperada o afirmación rompedora en los primeros 3 segundos.',
        'storytelling': 'Creá un "Hook Potenciado" de storytelling puro, iniciando la narrativa "In Media Res" en el clímax o parte más dramática para atrapar atención.',
        'desafio': 'Creá un "Hook Potenciado" de desafío directo confrontativo al espectador (ej: "¿Te animás a decirme que...?", "¿A que no podés...?").',
        'secreto': 'Creá un "Hook Potenciado" prometiendo un secreto absoluto o truco oculto/hack prohibido en el primer segundo.'
      }[hookType];

      const prompt = platform === 'instagram' 
        ? `Actuá como un guionista experto en contenido vertical para Instagram Reels y TikTok. 
           El narrador debe sonar como ${narratorDescriptor}.
           Transformá el siguiente texto en un guion dinámico.
           Usá español de Argentina (voseo, vocabulario local).
           ${powerHook ? `IMPORTANTE: ${hookPromptText}` : 'Incluí un hook claro en los primeros 3 segundos.'}
           El guion debe durar máximo 1:30 minutos.
           Mantené un tono ${toneDescriptor}.
           No utilices formato Markdown (como asteriscos o almohadillas) en el contenido del guion.
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
             "keywords": ["tag1", "tag2", ...],
             "production_estimate": {
               "budget": "Bajo/Medio/Alto",
               "difficulty": "Simple/Media/Pro",
               "equipment": ["item1", "item2"],
               "total_duration": "45-60 segundos",
               "editing_style": {
                 "cut_pacing": "sugerencia de ritmo de cortes (ej: cortes dinámicos 1.5s)",
                 "suggested_music": "música sugerida con BPM y vibra",
                 "screen_text_fx": "estilo de textos y gráficos en pantalla"
               }
             }
           }`
        : `Actuá como un guionista profesional de YouTube para contenido horizontal. 
           El narrador debe sonar como ${narratorDescriptor}.
           Transformá el siguiente texto en un guion estructurado con: Intro, Desarrollo, Valor y CTA.
           Usá español de Argentina (voseo, vocabulario local).
           El tono debe ser ${toneDescriptor}.
           No utilices formato Markdown (como asteriscos o almohadillas) en el contenido del guion.
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
             "keywords": ["tag1", "tag2", ...],
             "production_estimate": {
               "budget": "Bajo/Medio/Alto",
               "difficulty": "Simple/Media/Pro",
               "equipment": ["tripode", "foco led", "microfono lavalier"],
               "total_duration": "8-12 minutos",
               "editing_style": {
                 "cut_pacing": "sugerencia de ritmo de cortes y transiciones para video horizontal",
                 "suggested_music": "género musical y vibra de fondo sugerida",
                 "screen_text_fx": "estilo de callouts o textos animados"
               }
             }
           }`;

      const dataResponse = await processWithGemini({ customPrompt: prompt }, 'process');
      const data = JSON.parse(dataResponse.text.replace(/```json|```/g, '').trim());
      setScript(data.full_script);
      setRundown(data.rundown || []);
      setThumbnail(data.thumbnail || null);
      setKeywords(data.keywords || []);
      if (data.production_estimate) {
        setProductionEstimate(data.production_estimate);
      }
      
      const newHistory = saveToHistory('screenwriter', input, data, input.slice(0, 30));
      setHistory(newHistory);
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
    const mdRows = rundown.map(item => {
      const techStr = item.technical ? `${item.technical.shot} | ${item.technical.lens} | ${item.technical.motion} | ${item.technical.lighting}` : '-';
      return `${item.scene} | ${item.duration} | ${item.visual} | ${item.audio} | ${techStr}`;
    }).join('\n');
    const tablePlain = `Escaleta [Escena | Duración | Visual | Audio | Datos Técnicos]:\n${mdRows}`;
    
    const extraInfo = `IDEAS DE MINIATURA:\n- Idea: ${thumbnail?.idea}\n- Texto: ${thumbnail?.text_overlay}\n\nKEYWORDS: ${keywords.join(', ')}`;
    const fullText = `GUION ${platform.toUpperCase()} (${tone.toUpperCase()})\n${powerHook ? '(Optimizado con Hook Potenciado)\n' : ''}\nGUION:\n${script}\n\nESCALETA TÉCNICA:\n${tablePlain}\n\n------------------\n${extraInfo}`;
    
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

  const refineScene = async (idx: number) => {
    setRefiningIdx(idx);
    try {
      const scene = rundown[idx];
      const prompt = `Actúa como un director de cine extracto y guionista senior. 
      Tu objetivo es mejorar TODA LA FILA de esta secuencia de guion, optimizando tanto el audio como los detalles visuales y técnicos.
      
      Escena actual: "${scene.scene}"
      Audio actual: "${scene.audio}"
      Visual actual: "${scene.visual}"
      Dura actual: "${scene.duration}"
      
      Mejora la narrativa, haz el visual más cinematográfico y ajusta los parámetros técnicos (plano, lente, movimiento, luz) para que coincidan con la nueva intensidad.
      
      Devuelve estrictamente un JSON con campos: scene, visual, audio, duration, technical (shot, lens, motion, lighting). No uses Markdown.`;

      const response = await processWithGemini({ customPrompt: prompt }, 'process');
      const data = JSON.parse(response.text.replace(/```json|```/g, '').trim());
      
      const newRundown = [...rundown];
      newRundown[idx] = { ...newRundown[idx], ...data };
      setRundown(newRundown);
      
      // Actualizar script general
      const fullScript = newRundown.map(r => r.audio).join('\n\n');
      setScript(fullScript);
    } catch (err) {
      console.error(err);
      alert("Error al refinar la secuencia");
    } finally {
      setRefiningIdx(null);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = `Guion ${platform.toUpperCase()} - ${input.slice(0, 40)}`;
    
    // Configuración inicial
    doc.setFontSize(18);
    doc.text("GUION ESTRATÉGICO IA", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Plataforma: ${platform} | Tono: ${tone} | Narrador: ${narrator}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 35);
    
    // Script completo
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("GUION COMPLETO", 14, 45);
    
    doc.setFontSize(11);
    const splitScript = doc.splitTextToSize(script, 180);
    doc.text(splitScript, 14, 55);
    
    // Nueva página para la escaleta
    doc.addPage();
    doc.setFontSize(14);
    doc.text("ESCALETA TÉCNICA", 14, 22);

    const tableData = rundown.map((item, i) => [
      i + 1,
      item.scene,
      item.duration,
      item.visual,
      item.audio,
      `${item.technical?.shot || ''}\n${item.technical?.lens || ''}\n${item.technical?.motion || ''}`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Escena', 'Dura.', 'Visual', 'Audio', 'Técnico']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 40 },
        4: { cellWidth: 60 },
        5: { cellWidth: 35 }
      }
    });

    doc.save(`guion_${platform}_${Date.now()}.pdf`);
  };

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const estReadingTime = Math.ceil(wordCount / 160) || 0;

  return (
    <div className="space-y-12 bg-transparent pb-4 w-full max-w-none px-4 md:px-8" id="screenwriter-ia">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-2 gap-4">
        <h1 className="text-xl font-black uppercase tracking-tighter inline-block self-start">
          Guionista IA
        </h1>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-200"
        >
          <History size={14} />
          {showHistory ? 'Ocultar Historial' : `Historial (${history.length})`}
        </button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 border-2 border-black p-6 mb-8 mt-4">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Últimas 10 Guiones</span>
                <span className="text-[9px] font-bold text-zinc-300">Autoguardado Local</span>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-zinc-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No hay guiones guardados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="group p-4 bg-white border border-zinc-200 hover:border-black cursor-pointer transition-all flex flex-col gap-3 relative"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight text-black truncate">{item.title}</p>
                          <p className="text-[9px] font-bold text-zinc-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(e, item.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300 group-hover:text-black transition-colors">
                        <span className="text-[8px] font-black uppercase tracking-widest">Recuperar</span>
                        <ChevronRight size={10} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 mt-4">
        {/* Fila 1: Plataformas */}
         <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1.5 border border-zinc-200">
          <button
            onClick={() => setPlatform('instagram')}
            className={`flex items-center justify-center gap-3 py-4 transition-all font-black text-[10px] uppercase tracking-widest ${platform === 'instagram' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black'}`}
          >
            <Instagram size={18} />
            <div className="flex flex-col items-center">
              <span>Instagram / TikTok</span>
              <InfoTooltip text={platformInfo.instagram} />
            </div>
          </button>
          <button
            onClick={() => setPlatform('youtube')}
            className={`flex items-center justify-center gap-3 py-4 transition-all font-black text-[10px] uppercase tracking-widest ${platform === 'youtube' ? 'bg-black text-white shadow-xl' : 'text-zinc-400 hover:text-black'}`}
          >
            <Youtube size={18} />
            <div className="flex flex-col items-center">
              <span>YouTube HD</span>
              <InfoTooltip text={platformInfo.youtube} />
            </div>
          </button>
        </div>

        {/* Fila 2: Tonos y Narrador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1">Vibe / Tono</span>
            <div className="grid grid-cols-2 gap-2">
               {(['energetic', 'casual', 'professional', 'humorous'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-3 px-2 border-2 text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight ${
                    tone === t ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
                  }`}
                >
                  <span>{t === 'energetic' ? 'Energético' : t === 'casual' ? 'Casual' : t === 'humorous' ? 'Humorístico' : 'Profesional'}</span>
                  <InfoTooltip text={toneInfo[t]} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1">Perfil del Narrador</span>
            <div className="grid grid-cols-3 gap-2">
               {(['expert', 'creator', 'storyteller', 'minimalist', 'hype'] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setNarrator(n)}
                  className={`py-3 px-2 border-2 text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight ${
                    narrator === n ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
                  }`}
                >
                  <span>{n === 'expert' ? 'Experto' : n === 'creator' ? 'Creador' : n === 'storyteller' ? 'Relator' : n === 'minimalist' ? 'Minimal' : 'Hype'}</span>
                  <InfoTooltip text={narratorInfo[n]} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 3: Hook */}
        <div className="space-y-3 bg-zinc-50/50 p-4 border border-zinc-200/60">
          <button
            onClick={() => setPowerHook(!powerHook)}
            className={`w-full flex items-center justify-between px-6 py-4 border-2 transition-all group ${
              powerHook ? 'bg-zinc-900 border-black text-white shadow-xl' : 'bg-white border-zinc-150 text-zinc-400 hover:border-black'
            }`}
          >
             <div className="flex items-center gap-4">
              <Zap size={18} className={powerHook ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'} />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gancho de Alto Impacto (Hook Potenciado)</span>
                <InfoTooltip text="Técnica de alto impacto psicológico para captar la atención en los primeros 3 segundos." />
              </div>
            </div>
            <div className={`w-10 h-5 rounded-none p-1 transition-colors ${powerHook ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
              <div className={`w-3 h-3 rounded-none transition-transform ${powerHook ? 'bg-yellow-400 translate-x-5' : 'bg-white translate-x-0'}`} />
            </div>
          </button>

          <AnimatePresence>
            {powerHook && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2"
              >
                <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1 mb-2">Elegí la plantilla del Gancho (Hook):</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['psicologia-inversa', 'shokeante', 'storytelling', 'desafio', 'secreto'] as const).map((h) => {
                    const labels = {
                      'psicologia-inversa': 'Psicología Inversa',
                      'shokeante': 'Dato Shokeante',
                      'storytelling': 'Storytelling',
                      'desafio': 'Desafío Espectador',
                      'secreto': 'Secreto Prohibido'
                    };
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHookType(h)}
                        className={`py-3 px-2 border text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight text-center ${
                          hookType === h ? 'bg-black border-black text-white shadow-md font-black' : 'bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black'
                        }`}
                      >
                        <span>{labels[h]}</span>
                        <InfoTooltip text={hookDescriptions[h]} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowTeleprompter(true)}
                  title="Abrir en Teleprompter"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-none transition-all shadow-md active:scale-90 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                >
                  <Monitor size={14} />
                  <span>Teleprompter</span>
                </button>
                <button 
                  onClick={() => {
                    if (isPlayingTTS) {
                      stopTTS();
                    } else {
                      startTTS(script);
                    }
                  }}
                  title={isPlayingTTS ? "Detener voz" : "Escuchar guion completo (TTS)"}
                  className={`px-4 py-2 rounded-none transition-all shadow-md active:scale-90 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border ${
                    isPlayingTTS 
                      ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black border-zinc-300'
                  }`}
                >
                  {isPlayingTTS ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isPlayingTTS ? 'Parar' : 'Escuchar'}</span>
                </button>
                <button 
                  onClick={syncScriptToRundown}
                  title="Sincronizar Guion con Escaleta"
                  className={`p-3 rounded-none transition-all shadow-md active:scale-90 flex items-center gap-2 ${synced ? 'bg-green-500 text-white' : 'bg-zinc-800 text-white hover:bg-black'}`}
                >
                  <RefreshCw size={14} className={synced ? '' : 'animate-spin-slow'} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Sinc.</span>
                </button>
                <button 
                  onClick={sendToProcessor}
                  title="Enviar a Editor"
                  className="p-3 bg-black text-white hover:bg-zinc-800 rounded-none transition-all shadow-md active:scale-90"
                >
                  {sent ? <Check size={14} /> : <Send size={14} />}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-none text-zinc-400 hover:text-black transition-all active:scale-90"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
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

          {(thumbnail || keywords.length > 0 || productionEstimate) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-4">
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
              {productionEstimate && (
                <div className="bg-zinc-900 rounded-none p-10 border-2 border-black hover:border-yellow-400 transition-all text-white">
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8">
                    <Zap size={16} className="text-yellow-400" />
                    <span>LOGÍSTICA_PROD</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Presupuesto</span>
                       <span className="text-[11px] font-black text-yellow-400 uppercase">{productionEstimate.budget}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dificultad</span>
                       <span className="text-[11px] font-black text-white uppercase">{productionEstimate.difficulty}</span>
                    </div>
                    {productionEstimate.total_duration && (
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                         <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Duración Final</span>
                         <span className="text-[11px] font-black text-white uppercase">{productionEstimate.total_duration}</span>
                      </div>
                    )}
                    <div className="pt-2">
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Equipamiento_Sugerido</span>
                       <div className="flex flex-wrap gap-2 mb-4">
                          {productionEstimate.equipment.map((item, i) => (
                            <span key={i} className="text-[8px] font-mono border border-zinc-700 px-2 py-1 text-zinc-400">{item}</span>
                          ))}
                       </div>
                    </div>
                    
                    {productionEstimate.editing_style && (
                      <div className="pt-4 border-t border-zinc-800 space-y-2 text-[9px] leading-relaxed">
                        <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400 block mb-1">Guías de Edición</span>
                        {productionEstimate.editing_style.cut_pacing && (
                          <div>
                            <span className="text-zinc-500 font-mono text-[8px] block">CORTES / RITMO:</span>
                            <span className="text-zinc-200">{productionEstimate.editing_style.cut_pacing}</span>
                          </div>
                        )}
                        {productionEstimate.editing_style.suggested_music && (
                          <div className="mt-1">
                            <span className="text-zinc-500 font-mono text-[8px] block">MÚSICA SUGERIDA:</span>
                            <span className="text-zinc-200">{productionEstimate.editing_style.suggested_music}</span>
                          </div>
                        )}
                        {productionEstimate.editing_style.screen_text_fx && (
                          <div className="mt-1">
                            <span className="text-zinc-500 font-mono text-[8px] block font-black">DISEÑO TEXTOS:</span>
                            <span className="text-zinc-200">{productionEstimate.editing_style.screen_text_fx}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-6 gap-4">
            <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em]">
              <MonitorSmartphone size={20} className="shrink-0" />
              <span>ESCALETA_TÉCNICA ({platform === 'instagram' ? '9:16' : '16:9'})</span>
            </div>
            {rundown.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button 
                  onClick={exportToPDF}
                  className="flex items-center justify-center gap-3 px-6 py-4 sm:py-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-none text-[10px] font-black text-black transition-all shadow-sm active:scale-95 uppercase tracking-widest w-full sm:w-auto"
                >
                  <Download size={16} />
                  <span>Exportar PDF</span>
                </button>
                <button 
                  onClick={copyTableToClipboard}
                  className="flex items-center justify-center gap-3 px-6 py-4 sm:py-3 bg-black hover:bg-zinc-800 rounded-none text-[10px] font-black text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest w-full sm:w-auto"
                >
                  {copiedTable ? <Check size={16} /> : <Copy size={16} />}
                  <span>Copiar Tabla</span>
                </button>
              </div>
            )}
          </div>
            
            <div className="border-t-2 border-black pt-4 overflow-x-auto">
              {/* Desktop Table View */}
              <table className="w-full border-collapse hidden lg:table">
                <thead>
                  <tr className="bg-zinc-50 border-b-2 border-black">
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 w-24">#</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 min-w-[200px]">Matriz_Visual / Audio</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 w-24">Tiempo</th>
                    <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 min-w-[250px]">Especificaciones_Técnicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {rundown.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-2 items-center">
                          <div className="w-8 h-8 bg-black text-white rounded-none flex items-center justify-center text-[10px] font-black">
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <button 
                            onClick={() => refineScene(idx)}
                            className="p-2 bg-white border border-zinc-200 hover:border-black transition-colors text-zinc-300 hover:text-black shadow-sm animate-pulse-slow"
                            title="Describir & Expandir con IA"
                          >
                            {refiningIdx === idx ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          </button>

                          <div className="flex flex-col gap-1 mt-2">
                            <button 
                              onClick={() => addSceneBelow(idx)}
                              className="p-1 bg-zinc-50 border border-zinc-200 hover:border-black transition-colors text-zinc-500 hover:text-black font-black text-[9px] w-8 h-6 flex items-center justify-center"
                              title="Insertar escena abajo"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => deleteScene(idx)}
                              className="p-1 bg-zinc-50 border border-red-150 hover:border-red-500 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors w-8 h-6 flex items-center justify-center"
                              title="Eliminar escena"
                            >
                              <Trash2 size={10} />
                            </button>
                            <div className="flex gap-0.5">
                              <button 
                                onClick={() => moveSceneUp(idx)}
                                disabled={idx === 0}
                                className="p-0.5 bg-zinc-50 border border-zinc-200 hover:border-black disabled:opacity-30 disabled:hover:border-zinc-200 text-zinc-500 hover:text-black text-[7px] w-4 h-5 flex items-center justify-center"
                                title="Subir"
                              >
                                🔼
                              </button>
                              <button 
                                onClick={() => moveSceneDown(idx)}
                                disabled={idx === rundown.length - 1}
                                className="p-0.5 bg-zinc-50 border border-zinc-200 hover:border-black disabled:opacity-30 disabled:hover:border-zinc-200 text-zinc-500 hover:text-black text-[7px] w-4 h-5 flex items-center justify-center"
                                title="Bajar"
                              >
                                🔽
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top space-y-4">
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
                            className="text-[11px] text-zinc-500 italic uppercase leading-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            rows={2}
                          />
                        </div>
                        <div className="p-4 bg-white border-l-4 border-black group-hover:border-zinc-400 transition-colors shadow-sm relative">
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
                            className="w-full text-[13px] leading-relaxed text-black font-sans bg-transparent border-none focus:ring-0 p-0 h-auto min-h-[50px] outline-none"
                          />
                        </div>

                        {/* Quick Rewrite & Listen Tools */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mr-1">Varita IA:</span>
                          {(['dynamic', 'humor', 'short', 'epic', 'director'] as const).map((style) => {
                            const labels = {
                              dynamic: '⚡ Dinámico',
                              humor: '😂 Humor',
                              short: '⏳ Corto',
                              epic: '🎭 Épico',
                              director: '🎬 Cine'
                            };
                            return (
                              <button
                                key={style}
                                disabled={refiningIdx !== null}
                                onClick={() => refineSceneCustom(idx, style)}
                                className="px-2 py-1 bg-zinc-100 hover:bg-black hover:text-white transition-all text-[8px] font-black uppercase tracking-wider text-zinc-500 border border-zinc-200/60 rounded-none disabled:opacity-35"
                              >
                                {refiningIdx === idx ? '...' : labels[style]}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => {
                              if (ttsIndex === idx) {
                                stopTTS();
                              } else {
                                startTTS(item.audio, idx);
                              }
                            }}
                            className={`ml-auto px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-none border transition-all ${
                              ttsIndex === idx 
                                ? 'bg-red-500 text-white border-red-500' 
                                : 'bg-zinc-100 text-black border-zinc-300 hover:bg-black hover:text-white hover:border-black'
                            }`}
                          >
                            {ttsIndex === idx ? '🔇 Detener' : '🔊 Escuchar'}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 text-[11px] font-mono font-black text-black">
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
                      <td className="p-4 align-top">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="block text-[8px] font-black text-black uppercase tracking-widest">Plano</span>
                            <input 
                              value={item.technical?.shot || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.shot = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-black text-black uppercase tracking-widest">Óptica</span>
                            <input 
                              value={item.technical?.lens || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.lens = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-black text-black uppercase tracking-widest">Movimiento</span>
                            <input 
                              value={item.technical?.motion || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.motion = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-black text-black uppercase tracking-widest">Luz</span>
                            <input 
                              value={item.technical?.lighting || ''}
                              onChange={(e) => {
                                const newRundown = [...rundown];
                                if (newRundown[idx].technical) {
                                  newRundown[idx].technical!.lighting = e.target.value;
                                  setRundown(newRundown);
                                }
                              }}
                              className="text-[10px] font-mono text-zinc-400 font-bold bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                            />
                          </div>
                          {item.sfx && (
                            <div className="col-span-2 pt-2 mt-2 border-t border-zinc-100">
                              <span className="block text-[8px] font-black text-red-500 uppercase tracking-widest italic">SFX_REQ</span>
                              <input 
                                value={item.sfx}
                                onChange={(e) => {
                                  const newRundown = [...rundown];
                                  newRundown[idx].sfx = e.target.value;
                                  setRundown(newRundown);
                                }}
                                className="text-[10px] font-mono text-black font-bold uppercase bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-6 pt-4">
                {rundown.map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 border-2 border-black/5 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                       <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-8 h-8 bg-black text-white rounded-none flex items-center justify-center text-[10px] font-black">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <button 
                          onClick={() => refineScene(idx)}
                          className="p-2 bg-white border border-zinc-200 hover:border-black transition-colors text-zinc-300 hover:text-black shadow-sm"
                        >
                          {refiningIdx === idx ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        </button>
                        <button 
                          onClick={() => addSceneBelow(idx)}
                          className="px-2 py-1 bg-white border border-zinc-200 text-zinc-700 font-bold text-[9px] uppercase tracking-wide shadow-xs"
                          title="Insertar abajo"
                        >
                          + Insertar
                        </button>
                        <button 
                          onClick={() => deleteScene(idx)}
                          className="px-2 py-1 bg-white border border-red-200 text-red-500 font-bold text-[9px] uppercase tracking-wide shadow-xs"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono font-black text-black">
                        <Clock size={12} className="opacity-30" />
                        <input 
                          value={item.duration}
                          onChange={(e) => {
                            const newRundown = [...rundown];
                            newRundown[idx].duration = e.target.value;
                            setRundown(newRundown);
                          }}
                          className="bg-transparent border-none focus:ring-0 p-0 w-20 text-right outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <input 
                        value={item.scene}
                        onChange={(e) => {
                          const newRundown = [...rundown];
                          newRundown[idx].scene = e.target.value;
                          setRundown(newRundown);
                        }}
                        className="text-[10px] font-black uppercase text-black tracking-widest bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                      />
                      <AutoResizeTextarea 
                        value={item.visual}
                        onChange={(e) => {
                          const newRundown = [...rundown];
                          newRundown[idx].visual = e.target.value;
                          setRundown(newRundown);
                        }}
                        className="text-[11px] text-zinc-500 italic uppercase leading-tight bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="p-4 bg-white border-l-4 border-black shadow-sm">
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
                        className="w-full text-[13px] leading-relaxed text-black font-sans bg-transparent border-none focus:ring-0 p-0 h-auto min-h-[50px] outline-none"
                      />
                    </div>

                    {/* Quick Rewrite & Listen Tools for Mobile */}
                    <div className="flex flex-wrap items-center gap-1 mt-1 pb-2">
                      <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mr-1">IA:</span>
                      {(['dynamic', 'humor', 'short', 'epic', 'director'] as const).map((style) => {
                        const labels = {
                          dynamic: '⚡',
                          humor: '😂',
                          short: '⏳',
                          epic: '🎭',
                          director: '🎬'
                        };
                        return (
                          <button
                            key={style}
                            disabled={refiningIdx !== null}
                            onClick={() => refineSceneCustom(idx, style)}
                            className="px-2 py-1 bg-white hover:bg-black hover:text-white transition-all text-[8px] border border-zinc-200 rounded-none disabled:opacity-35"
                            title={style}
                          >
                            {refiningIdx === idx ? '...' : labels[style]}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => {
                          if (ttsIndex === idx) {
                            stopTTS();
                          } else {
                            startTTS(item.audio, idx);
                          }
                        }}
                        className={`ml-auto px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none border transition-all ${
                          ttsIndex === idx 
                            ? 'bg-red-500 text-white border-red-500' 
                            : 'bg-white text-black border-zinc-300 hover:bg-black hover:text-white'
                        }`}
                      >
                        {ttsIndex === idx ? '🔇 Stop' : '🔊 Play'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[9px]">
                      <div className="space-y-1">
                        <span className="block font-black text-black uppercase tracking-widest opacity-40">Plano</span>
                        <input value={item.technical?.shot || ''} className="bg-transparent border-none focus:ring-0 p-0 w-full outline-none font-bold" readOnly />
                      </div>
                      <div className="space-y-1">
                        <span className="block font-black text-black uppercase tracking-widest opacity-40">Óptica</span>
                        <input value={item.technical?.lens || ''} className="bg-transparent border-none focus:ring-0 p-0 w-full outline-none font-bold" readOnly />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeleprompter && (
        <Teleprompter 
          initialText={script} 
          onClose={() => setShowTeleprompter(false)} 
        />
      )}
    </div>
  );
}
