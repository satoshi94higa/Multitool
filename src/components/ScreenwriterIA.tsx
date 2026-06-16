import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, ScrollText, Play, Copy, Check, Loader2, Youtube, Instagram, 
  MonitorSmartphone, Clock, Send, MessageSquarePlus, Zap, RefreshCw, 
  FileText, Download, Info, History, Trash2, ChevronRight, Volume2, 
  VolumeX, Monitor, Sliders, Sparkles, SlidersHorizontal, Eye, Plus, 
  Layers, Volume, Volume1, ArrowUpDown, Minimize, BookOpen, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { processWithGemini } from '../services/geminiService';
import { saveToHistory, getHistory, deleteFromHistory, HistoryItem } from '../lib/persistence';
import Teleprompter from './Teleprompter';

// Info Tooltip for cinematic annotations
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
        className="text-zinc-400 hover:text-black transition-colors p-1 cursor-help inline-flex items-center justify-center transition-transform hover:scale-110"
      >
        <Info size={11} />
      </span>
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-zinc-950 text-white text-[9px] font-bold uppercase tracking-widest leading-relaxed pointer-events-none shadow-2xl border border-white/10"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Procedural Synthesizer for Atmos and Sound Effects in Hollywood Studio Workspace - SILENCED/REMOVED
const playProceduralSound = (type: 'swoosh' | 'drone' | 'click' | 'rise' | 'tick' | 'wood') => {
  // Silent execution to save resources
};

type Platform = 'instagram' | 'youtube' | 'tiktok' | 'tiktok-extendido' | 'cinema';
type Tone = 'casual' | 'professional' | 'energetic' | 'humorous' | 'epic' | 'noir';
type NarratorProfile = 'expert' | 'creator' | 'storyteller' | 'minimalist' | 'hype';
type Slang = 'voseo_porteño' | 'voseo_regio' | 'latino_neutral' | 'seseo_peninsular' | 'hype_mrbeast';
type LayoutStyle = 'av-script' | 'standard-hollywood' | 'bento-grid';
type AtmosPreset = 'none' | 'lofi' | 'synthwave' | 'drums';

const platformInfo = {
  instagram: 'Scripts de hasta 90 segundos optimizados para formato vertical de Reel, ganchos rápidos y retención sostenida.',
  youtube: 'Guiones estructurados en formato horizontal (16:9), ideales para profundizar temáticas paso a paso.',
  tiktok: 'Scripts de ritmo hiper-veloz con cambios de plano constantes y lenguaje ultradinamizado de tendencia.',
  'tiktok-extendido': 'Scripts de formato largo vertical (hasta 10 minutos) diseñados para monetizar en el programa de creadores de TikTok.',
  cinema: 'Formato estándar de cortometraje/narración ficcional que respeta la estructura de guion literario clásica.'
};

const toneInfo = {
  energetic: 'Alta energía, ritmo acelerado y entonación emocionante para enganchar.',
  casual: 'Cercano, modo audio de WhatsApp entre conocidos, relajado y fluido.',
  professional: 'Serio, confiable, con datos con peso de conocimiento sólido.',
  humorous: 'Chistoso, irónico, introduce remates o comparaciones divertidas.',
  epic: 'Voz grandiosa con ritmo solemne de documental o tráiler de cine.',
  noir: 'Tono misterioso con pausas sutiles, estética detectivesca e intelectual.'
};

const narratorInfo = {
  expert: 'Autoridad con datos, que habla desde el rigor técnico.',
  creator: 'Un colega compartiendo su experiencia personal tras la cámara.',
  storyteller: 'Enfocado en el viaje emotivo, anécdotas y metáforas.',
  minimalist: 'Economía absoluta de palabras. Menos es más, cortes directos.',
  hype: 'Estilo MrBeast: máxima excitación y sorpresas continuas en el discurso.'
};

const slangInfo = {
  voseo_porteño: 'Voseo crudo rioplatense (che, laburo, zarpado, boludo sutil, mirá, tenés).',
  voseo_regio: 'Voseo rioplatense neutro y cuidado (escribí, mirá, tenés) sin modismos vulgares.',
  latino_neutral: 'Tú / Usted neutro, ideal para exportación panregional y doblaje.',
  seseo_peninsular: 'Español de España (tío, currar, flipar, vosotros).',
  hype_mrbeast: 'Traducción directa de doblaje de YouTube: ¡Atención!, ¡Haz clic ya!, ¡He gastado-he ganado!'
};

const hookDescriptions = {
  'psicologia-inversa': 'Gancho antagónico: Te dice que no sigas viendo o que este video no es para vos.',
  'shokeante': 'Datos brutales o declaraciones demoledoras en el primer segundo.',
  'storytelling': 'Empieza de golpe en la mitad de la peor acción ("In Media Res").',
  'desafio': 'Desafía u ofrece una pregunta confrontadora de forma desafiante.',
  'secreto': 'Promete revelar una verdad oculta o truco prohibido inmediato.'
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

// Simulated backend loop generator for atmospheric synth waves to keep a steady rhythm during reading - SILENCED/REMOVED
class ProceduralAtmosSynth {
  public start(type: AtmosPreset) {}
  public stop() {}
}

// Pre-instantiated singleton to control procedural music across state transitions
const globalAtmosSynth = new ProceduralAtmosSynth();

export default function ScreenwriterIA() {
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [tone, setTone] = useState<Tone>('energetic');
  const [narrator, setNarrator] = useState<NarratorProfile>('creator');
  const [slang, setSlang] = useState<Slang>('voseo_porteño');
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('av-script');
  const [atmosPreset, setAtmosPreset] = useState<AtmosPreset>('none');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [powerHook, setPowerHook] = useState(true);
  const [hookType, setHookType] = useState<'psicologia-inversa' | 'shokeante' | 'storytelling' | 'desafio' | 'secreto'>('psicologia-inversa');
  
  // A/B Comparative Workbench
  const [scriptVariantA, setScriptVariantA] = useState('');
  const [scriptVariantB, setScriptVariantB] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('A');

  // Interactive Blueprint View
  const [activeBlueprintSceneIdx, setActiveBlueprintSceneIdx] = useState<number | null>(null);

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

  // Load history metadata
  useEffect(() => {
    setHistory(getHistory('screenwriter'));
    return () => {
      globalAtmosSynth.stop();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update procedural music background based on layout selection
  const handleAtmosPresetChange = (preset: AtmosPreset) => {
    setAtmosPreset(preset);
    playProceduralSound('rise');
    globalAtmosSynth.start(preset);
  };

  const startTTS = (textToSpeak: string, index?: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      
      // Attempt specific argentine voice if user requested Argentine slang
      const forceAr = slang.includes('voseo');
      const preferredVoice = voices.find(v => forceAr && v.lang.startsWith('es-AR')) || 
                        voices.find(v => v.lang.startsWith('es-AR')) || 
                        voices.find(v => v.lang.startsWith('es-')) ||
                        voices.find(v => v.lang.includes('es'));
                        
      if (preferredVoice) {
        utterance.voice = preferredVoice;
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
      alert("La síntesis de voz no está soportada en tu navegador.");
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
    playProceduralSound('click');
    const newScene: Scene = {
      scene: `Escena ${idx + 2}`,
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
    updateA_B_Variants(fullScript);
  };

  const deleteScene = (idx: number) => {
    playProceduralSound('wood');
    if (rundown.length <= 1) {
      alert("Debes mantener al menos una escena en la escaleta.");
      return;
    }
    const newRundown = rundown.filter((_, i) => i !== idx);
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
    updateA_B_Variants(fullScript);
  };

  const moveSceneUp = (idx: number) => {
    if (idx === 0) return;
    playProceduralSound('tick');
    const newRundown = [...rundown];
    const temp = newRundown[idx];
    newRundown[idx] = newRundown[idx - 1];
    newRundown[idx - 1] = temp;
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
    updateA_B_Variants(fullScript);
  };

  const moveSceneDown = (idx: number) => {
    if (idx === rundown.length - 1) return;
    playProceduralSound('tick');
    const newRundown = [...rundown];
    const temp = newRundown[idx];
    newRundown[idx] = newRundown[idx + 1];
    newRundown[idx + 1] = temp;
    setRundown(newRundown);
    
    const fullScript = newRundown.map(r => r.audio).join('\n\n');
    setScript(fullScript);
    updateA_B_Variants(fullScript);
  };

  const updateA_B_Variants = (sourceText: string) => {
    // Generate simple simulated variants on state change
    setScriptVariantA(sourceText);
    const alterWords = (txt: string) => {
      return txt
        .replace(/¿Tenés/g, '¿Te encontrás con')
        .replace(/laburo/g, 'desarrollo laboral')
        .replace(/mirá/g, 'observa atentamente')
        .replace(/zarpado/g, 'sumamente relevante');
    };
    setScriptVariantB(alterWords(sourceText));
  };

  const refineSceneCustom = async (idx: number, style: 'dynamic' | 'humor' | 'short' | 'epic' | 'director') => {
    setRefiningIdx(idx);
    playProceduralSound('rise');
    try {
      const scene = rundown[idx];
      const styleDirectives = {
        dynamic: 'Hacé el diálogo mucho más enérgico, con ritmo rápido, directo y ganchero.',
        humor: 'Agregá un toque de humor, una ironía sutil o un remate divertido al diálogo.',
        short: 'Cortá palabras innecesarias. Mantené la esencia pero hacelo ultra conciso (mínimo tiempo de lectura).',
        epic: 'Dale un tono épico, narrativo, que despierte máxima curiosidad y emoción (storytelling profundo).',
        director: 'Mejorá al máximo los detalles técnicos de la escena (visual, plano, lente, movimiento, luz) para que sea 100% cinematográfico profesional.'
      }[style];

      const prompt = `Actúa como un director de cine experto y guionista senior de habla hispana.
      Adapta y mejora esta secuencia de guion aplicando la siguiente directiva: "${styleDirectives}".
      Usa modismos locales según la opción seleccionada: "${slangInfo[slang]}".
      
      Escena actual: "${scene.scene}"
      Audio actual: "${scene.audio}"
      Visual actual: "${scene.visual}"
      Duración actual: "${scene.duration}"
      
      Mejora tanto el audio como la descripción visual y ajusta de forma ultra-profesional los parámetros técnicos (plano, lente, movimiento, luz).
      
      Devuelve estrictamente un JSON con campos: scene, visual, audio, duration, technical (shot, lens, motion, lighting). No uses Markdown ni explicaciones adicionales.`;

      const response = await processWithGemini({ customPrompt: prompt }, 'process');
      const cleanJson = response.text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      const newRundown = [...rundown];
      newRundown[idx] = { ...newRundown[idx], ...data };
      setRundown(newRundown);
      
      const fullScript = newRundown.map(r => r.audio).join('\n\n');
      setScript(fullScript);
      updateA_B_Variants(fullScript);
      playProceduralSound('wood');
    } catch (err) {
      console.error(err);
      alert("Error al refinar la escena");
    } finally {
      setRefiningIdx(null);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    playProceduralSound('rise');
    const { output } = item;
    setScript(output.full_script);
    setRundown(output.rundown || []);
    setThumbnail(output.thumbnail || null);
    setKeywords(output.keywords || []);
    setProductionEstimate(output.production_estimate || null);
    setInput(item.input);
    updateA_B_Variants(output.full_script);
    setShowHistory(false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const removeHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    playProceduralSound('wood');
    const newHistory = deleteFromHistory('screenwriter', id);
    setHistory(newHistory);
  };

  const generateScript = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    playProceduralSound('drone');
    try {
      const toneDescriptor = {
        casual: 'casual y relajado',
        professional: 'profesional y serio',
        energetic: 'enérgico y muy dinámico',
        humorous: 'divertido y con toques de humor',
        epic: 'épico, solemne y altamente cinematográfico',
        noir: 'misterioso, intelectual, ritmo pausado'
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

      const prompt = `Actuá como un Director & Guionista Cinematográfico experto en contenido para la plataforma "${platform.toUpperCase()}".
         El narrador debe sonar como ${narratorDescriptor}.
         Adapta los modismos idiomáticos estrictamente a la configuración seleccionada: "${slangInfo[slang]}".
         Transformá el siguiente concepto en un guion estructurado multiescena con toques de dirección técnica realistas de cámara.
         ${powerHook ? `IMPORTANTE: ${hookPromptText}` : 'Incluí un hook ganchero de alta retención en los primeros 5 segundos.'}
         Mantené un tono global ${toneDescriptor}.
         No utilices formato Markdown (como asteriscos o almohadillas) en el contenido del guion hablado.
         ${extraPrompt ? `Criterios extra solicitados por el Director: ${extraPrompt}` : ''}
         
         Texto base: "${input}"
         
         Devuelve la respuesta estrictamente en este formato JSON válido (sin envolturas markdown, solo el objeto crudo):
         {
           "full_script": "Texto completo listo de corrido",
           "variant_A": "Variación alternativa A (más dinámica, enfocada a la acción visual rápida)",
           "variant_B": "Variación alternativa B (más emotiva, enfocada en la introspección narrativa lenta con el voseo seleccionado)",
           "rundown": [
             { 
               "scene": "Gancho Inicial", 
               "visual": "Descripción visual de la toma técnica de cámara", 
               "audio": "Diálogo que se debe decir o voz en off", 
               "duration": "0-5s", 
               "sfx": "Sugerencia de sonido o efecto sutil",
               "technical": {
                 "shot": "Plano (ej. Primer plano, Plano detalle, Plano cenital)",
                 "lens": "Óptica sugerida (ej. 35mm, F/1.4, Wide 14mm, Macro)",
                 "motion": "Movimiento (ej. Zoom rápido, Steadycam activo, Paneo lento, Fijo)",
                 "lighting": "Estilo de iluminación (ej. Key light dura, Sunset dorado, Neon cyberpunk, Noir de claroscuro)"
               }
             }
           ],
           "thumbnail": { "idea": "Idea de portada o composición de miniatura clickbait", "text_overlay": "Texto corto y ganchero superpuesto" },
           "keywords": ["tag1", "tag2", "tag3"],
           "production_estimate": {
             "budget": "Bajo/Medio/Alto",
             "difficulty": "Simple/Media/Pro",
             "equipment": ["trípode", "led led", "lavalier"],
             "total_duration": "45-60 segundos",
             "editing_style": {
               "cut_pacing": "Sugerencia de rítmicas de corte (ej: Cortes rápidos a tempo de 1.8s)",
               "suggested_music": "Vibra de fondo y BPM sugerido",
               "screen_text_fx": "FX de textos en pantalla animada"
             }
           }
         }`;

      const dataResponse = await processWithGemini({ customPrompt: prompt }, 'process');
      const cleanJson = dataResponse.text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      setScript(data.full_script);
      setScriptVariantA(data.variant_A || data.full_script);
      setScriptVariantB(data.variant_B || data.full_script);
      setRundown(data.rundown || []);
      setThumbnail(data.thumbnail || null);
      setKeywords(data.keywords || []);
      if (data.production_estimate) {
        setProductionEstimate(data.production_estimate);
      }
      
      const newHistory = saveToHistory('screenwriter', input, data, input.slice(0, 30));
      setHistory(newHistory);
      playProceduralSound('wood');
    } catch (error: any) {
      console.error('Error generating script:', error);
      setError(error.message || "Error al procesar el guion cinematográfico");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    playProceduralSound('click');
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
    playProceduralSound('click');
    setTimeout(() => setSent(false), 2000);
  };

  const syncScriptToRundown = () => {
    const blocks = script.split(/\n\n+/).filter(b => b.trim().length > 0);
    if (rundown.length > 0) {
      const newRundown = [...rundown];
      for (let i = 0; i < Math.min(blocks.length, rundown.length); i++) {
        newRundown[i].audio = blocks[i].trim();
      }
      setRundown(newRundown);
      setSynced(true);
      playProceduralSound('click');
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
          <tr style="background-color: #000000; color: #ffffff; font-weight: bold;">
            <th style="padding: 8px; border: 1px solid #000;">Escena</th>
            <th style="padding: 8px; border: 1px solid #000;">Dura.</th>
            <th style="padding: 8px; border: 1px solid #000;">Visual</th>
            <th style="padding: 8px; border: 1px solid #000;">Audio</th>
            <th style="padding: 8px; border: 1px solid #000;">Plano</th>
            <th style="padding: 8px; border: 1px solid #000;">Lente</th>
            <th style="padding: 8px; border: 1px solid #000;">Mov.</th>
            <th style="padding: 8px; border: 1px solid #000;">Luz</th>
          </tr>
        </thead>
        <tbody>
          ${rundown.map(item => `
            <tr>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top; font-weight: bold;">${item.scene}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.duration}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top; font-style: italic;">${item.visual}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.audio}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.technical?.shot || '-'}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.technical?.lens || '-'}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.technical?.motion || '-'}</td>
              <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${item.technical?.lighting || '-'}</td>
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
      playProceduralSound('click');
      setTimeout(() => setCopiedTable(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(tableStringTSV);
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    }
  };

  const exportToPDF = () => {
    playProceduralSound('rise');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GUION HOLLYWOOD STUDIO IA", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Cine/Plataforma: ${platform} | Tono: ${tone} | Narrativa: ${narrator} | Expresión: ${slang}`, 14, 30);
    doc.text(`Fecha de Filmación: ${new Date().toLocaleDateString()}`, 14, 35);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("GUION LITERARIO", 14, 45);
    
    doc.setFontSize(11);
    const splitScript = doc.splitTextToSize(script, 180);
    doc.text(splitScript, 14, 55);
    
    doc.addPage();
    doc.setFontSize(14);
    doc.text("ESCALETA TÉCNICA DE CÁMARAS", 14, 22);

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
      head: [['#', 'Escena', 'Dura.', 'Ficha Visual', 'Fila Diálogos', 'Dirección de Arte']],
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

    doc.save(`guion_director_studio_${Date.now()}.pdf`);
  };

  // Automated estimation of engagement pace and cut duration values to feed standard timeline graph
  const computedPace = () => {
    if (rundown.length === 0) return { score: 0, status: 'No cargado', curvePoints: [] as {x: number, y: number, name: string}[] };
    let score = 70;
    
    // Factors: duration of hook scene, count of visual transitions, variety of shots
    const hasHook = powerHook ? 15 : 0;
    const sceneCount = rundown.length;
    const cameraMotionFactor = rundown.some(r => r.technical?.motion.toLowerCase().includes('zoom') || r.technical?.motion.toLowerCase().includes('steady')) ? 10 : 0;
    
    score = Math.min(Math.round(40 + (sceneCount * 5) + hasHook + cameraMotionFactor), 98);
    
    // Draw visual curve coordinates
    const curvePoints = rundown.map((r, i) => {
      let height = 50; 
      if (i === 0) height = 90; // Hook is maximum retention
      else if (r.sfx) height = 80; // Peak tension at sfx lines
      else if (r.scene.toLowerCase().includes('cta') || r.scene.toLowerCase().includes('cierre')) height = 30; // drop on cta
      else if (i % 2 === 0) height = 65; // variation of action
      else height = 45;
      
      return {
        x: (i / (rundown.length || 1)) * 100,
        y: height,
        name: r.scene
      };
    });

    return {
      score,
      status: score > 85 ? 'RETENCIÓN EXCELENTE 🔥' : score > 65 ? 'MEDIO - ESTABLE 📈' : 'LARGO - RIESGO DE AVURRIMIENTO ⚠️',
      curvePoints
    };
  };

  const metricEngine = computedPace();
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const estReadingTime = Math.ceil(wordCount / 160) || 0;

  return (
    <div className="space-y-12 bg-transparent pb-4 w-full max-w-none px-2 md:px-4" id="screenwriter-ia">
      
      {/* Cinematic Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            <Layers className="text-black" /> Hollywood Studio IA
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">Pre-Producción & Mesa de Guion Inteligente</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              playProceduralSound('click');
              setShowHistory(!showHistory);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 rounded-none"
          >
            <History size={14} />
            {showHistory ? 'Ocultar Historial' : `Archivos (${history.length})`}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 border-4 border-black p-6 mb-8 mt-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-none">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Archivos Cinemáticos Guardados</span>
                <span className="text-[9px] font-mono text-zinc-300">Autoguardado Seguro Local</span>
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
                      className="group p-4 bg-white border-2 border-black hover:bg-zinc-50 cursor-pointer transition-all flex flex-col gap-3 relative rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight text-black truncate">{item.title}</p>
                          <p className="text-[9px] font-mono text-zinc-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(e, item.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300 group-hover:text-black transition-colors">
                        <span className="text-[8px] font-black uppercase tracking-widest">Cargar en el Estudio</span>
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

      {/* WORKSPACE PREPARATION DESK */}
      <div className="space-y-6">
          
          {/* PLATFORM BUTTONS */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest pl-1 flex items-center gap-2">
              <Sliders size={12} /> Formato de Transmisión
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-zinc-100 p-1.5 border-2 border-black rounded-none">
              {(['instagram', 'youtube', 'tiktok', 'tiktok-extendido', 'cinema'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    playProceduralSound('click');
                    setPlatform(p);
                  }}
                  className={`flex flex-col items-center justify-center p-3 gap-1.5 transition-all font-black text-[9px] uppercase tracking-wider rounded-none ${platform === p ? 'bg-black text-white border-2 border-black' : 'text-zinc-500 bg-white hover:text-black hover:border-black border-2 border-zinc-200'}`}
                >
                  {p === 'instagram' && <Instagram size={16} />}
                  {p === 'youtube' && <Youtube size={16} />}
                  {p === 'tiktok' && <MonitorSmartphone size={16} />}
                  {p === 'tiktok-extendido' && <Video size={16} />}
                  {p === 'cinema' && <ScrollText size={16} />}
                  <span>{p === 'tiktok-extendido' ? 'Tiktok Ext' : p}</span>
                </button>
              ))}
            </div>
            <div className="p-3 bg-zinc-150 text-[10px] text-zinc-600 uppercase tracking-tighter leading-normal border-2 border-black rounded-none font-mono">
              {platformInfo[platform]}
            </div>
          </div>

          {/* TONALITY & NARRATIVE LEVEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1">Vibe del Relato</span>
              <div className="grid grid-cols-2 gap-2">
                 {(['energetic', 'casual', 'professional', 'humorous', 'epic', 'noir'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      playProceduralSound('click');
                      setTone(t);
                    }}
                    className={`py-3 px-2 border-2 text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight ${
                      tone === t ? 'bg-black border-black text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-black'
                    }`}
                  >
                    <span>{t === 'energetic' ? 'Energético' : t === 'casual' ? 'Casual' : t === 'humorous' ? 'Humorístico' : t === 'professional' ? 'Profesional' : t === 'epic' ? 'Épico' : 'Noir'}</span>
                    <InfoTooltip text={toneInfo[t]} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1">Perfil del Orador</span>
              <div className="grid grid-cols-3 gap-2">
                 {(['expert', 'creator', 'storyteller', 'minimalist', 'hype'] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      playProceduralSound('click');
                      setNarrator(n);
                    }}
                    className={`py-3 px-2 border-2 text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight ${
                      narrator === n ? 'bg-black border-black text-white' : 'bg-white border-zinc-150 text-zinc-400 hover:border-black'
                    }`}
                  >
                    <span>{n === 'expert' ? 'Experto' : n === 'creator' ? 'Creador' : n === 'storyteller' ? 'Relator' : n === 'minimalist' ? 'Minimal' : 'Hype'}</span>
                    <InfoTooltip text={narratorInfo[n]} />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* LINGUISTIC SLANG ADAPTER */}
          <div className="space-y-2 bg-zinc-50 p-4 border-2 border-black rounded-none">
            <span className="text-[9px] font-black uppercase text-zinc-550 tracking-widest pl-1 block flex items-center gap-2">
              <Sparkles size={11} className="text-yellow-500 animate-pulse" /> Sintonizador de Modismos Regionales
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['voseo_porteño', 'voseo_regio', 'latino_neutral', 'seseo_peninsular', 'hype_mrbeast'] as const).map((sl) => (
                <button
                  key={sl}
                  onClick={() => {
                    playProceduralSound('click');
                    setSlang(sl);
                  }}
                  className={`py-2 px-1 text-[8px] border-2 font-black uppercase tracking-wider leading-snug text-center transition-all rounded-none ${slang === sl ? 'bg-black text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black'}`}
                >
                  {sl === 'voseo_porteño' && '🇦🇷 Rioplatense'}
                  {sl === 'voseo_regio' && '🇦🇷 Voseo Neutro'}
                  {sl === 'latino_neutral' && '🇲🇽 Neutral'}
                  {sl === 'seseo_peninsular' && '🇪🇸 Peninsular'}
                  {sl === 'hype_mrbeast' && '🔥 Hype Beast'}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-450 uppercase pl-1 pt-1 italic transition-all">Adaptación: {slangInfo[slang]}</p>
          </div>

      </div>

      {/* DETAILED HIGH RETENTION POWER-HOOK OPTION GROUP */}
      <div className="space-y-3 bg-white p-4 border-2 border-black rounded-none">
        <button
          onClick={() => {
            playProceduralSound('click');
            setPowerHook(!powerHook);
          }}
          className={`w-full flex items-center justify-between px-6 py-4 border-2 transition-all group rounded-none ${
            powerHook ? 'bg-black border-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white border-zinc-200 text-zinc-400 hover:border-black'
          }`}
        >
          <div className="flex items-center gap-4">
            <Zap size={18} className={powerHook ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'} />
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Módulo Gancho Máximo de Retención (Power Hooks)</span>
              <InfoTooltip text="Modelos calibrados para retener el scroll del móvil en los primeros 3 a 5 segundos empleando patrones cognitivos." />
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
              <span className="block text-[8px] font-black uppercase text-zinc-400 tracking-widest pl-1 mb-2">Plantillas de Hook Clínico:</span>
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
                      onClick={() => {
                        playProceduralSound('click');
                        setHookType(h);
                      }}
                      className={`py-3 px-2 border-2 text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 leading-tight text-center rounded-none ${
                        hookType === h ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 text-zinc-450 hover:border-black hover:text-black'
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

      {/* CORE INPUT STAGE */}
      <div className="space-y-6">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Introduce la premisa, tema general, idea guía o núcleo de información..."
            className="w-full min-h-[160px] p-6 bg-white border-2 border-black rounded-none text-sm focus:outline-none focus:bg-zinc-50 font-sans text-black placeholder-zinc-300 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          />
          <div className="absolute bottom-6 right-6 flex gap-6 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] pointer-events-none">
            <span>Palabras: {wordCount}</span>
            <span className="italic">Duración EST: {estReadingTime}s</span>
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
            placeholder="Parámetros extra (ej: 'Menciona mi canal @TechSpace', 'Introduce ruidos bruscos', 'Haz cortes vertiginosos')..."
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-black rounded-none text-[11px] font-mono focus:outline-none focus:bg-zinc-50 placeholder:text-zinc-300 text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          />
        </div>
        
        <button
          onClick={generateScript}
          disabled={loading || !input.trim()}
          className="w-full py-5 bg-black text-white hover:bg-zinc-900 border-2 border-black rounded-none font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 disabled:opacity-30 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {loading ? 'Compilando Cerebro Cinematográfico...' : 'ENRUTAR & CORRER_GUION_IA'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-500 text-red-600">
            <div className="flex items-center gap-4">
              <Zap size={18} className="animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                [ALERTA DE SEGURIDAD]: {error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GENERATED EXPERIENCE BLOCK */}
      {(script || rundown.length > 0) && (
        <div className="space-y-16 animate-in fade-in duration-700">
          
          {/* TIMELINE ANALYSIS & USER RETENTION SPLINE SCREEN */}
          <div className="bg-zinc-950 text-white p-6 md:p-8 border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-800 pb-5 mb-6 gap-3">
              <div>
                <span className="text-[9px] font-mono font-black text-yellow-400 tracking-widest uppercase">Diagnóstico Estructural</span>
                <h3 className="text-xl font-black uppercase tracking-tighter mt-1 flex items-center gap-2">Pulsación y Curva de Retención Promedio</h3>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 text-right">
                <span className="text-[8px] font-black uppercase text-zinc-500 block">Eficiencia Estimada</span>
                <span className="text-sm font-mono font-black text-yellow-500">{metricEngine.score}% - {metricEngine.status}</span>
              </div>
            </div>

            {/* CURVE SVG GRAPH */}
            <div className="relative w-full h-44 bg-zinc-900/60 border border-zinc-800 flex items-end px-4 pb-4">
              <svg className="absolute inset-0 w-full h-full" overflow="visible">
                {/* Baseline grid */}
                <line x1="0" y1="20" x2="100%" y2="20" stroke="#1f2937" strokeDasharray="3,3" />
                <line x1="0" y1="75" x2="100%" y2="75" stroke="#1f2937" strokeDasharray="3,3" />
                <line x1="0" y1="130" x2="100%" y2="130" stroke="#1f2937" strokeDasharray="3,3" />

                {/* SVG splines representing attention values */}
                <path
                  d={`M ${metricEngine.curvePoints.map(p => `${(p.x / 100) * (window.innerWidth < 768 ? 320 : 1000)}, ${140 - (p.y / 100) * 110}`).join(' L ')}`}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  className="transition-all duration-1000"
                />

                {/* Draw node indicators */}
                {metricEngine.curvePoints.map((p, i) => (
                  <g key={i} className="cursor-pointer group">
                    <circle
                      cx={(p.x / 100) * (window.innerWidth < 768 ? 320 : 1000)}
                      cy={140 - (p.y / 100) * 110}
                      r="6"
                      fill="#ffffff"
                      stroke="#fbbf24"
                      strokeWidth="3"
                    />
                    <text
                      x={(p.x / 100) * (window.innerWidth < 768 ? 320 : 1000)}
                      y={140 - (p.y / 100) * 110 - 14}
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-0 group-hover:opacity-100 bg-black font-black"
                    >
                      {p.name.slice(0, 10)}.. ({p.y}%)
                    </text>
                  </g>
                ))}
              </svg>

              {/* Legend indicators */}
              <div className="absolute top-2 left-4 text-[7px] font-mono text-green-400 uppercase tracking-widest">HOOK RETENTION (90%)</div>
              <div className="absolute bottom-2 right-4 text-[7px] font-mono text-zinc-500 uppercase tracking-widest">TIEMPO / FLUJO SECUENCIAL</div>
            </div>

            {/* ACTIONABLE FEEDBACK ALERTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-900 text-[10px] uppercase tracking-normal">
              <div className="p-4 bg-zinc-900 border border-zinc-800">
                <span className="font-black text-yellow-405 block mb-1">🔥 Recomendación Cinematográfica</span>
                <p className="text-zinc-400 leading-normal font-sans">El ritmo es óptimo. El gancho táctico de tipo <span className="text-white">"{hookType}"</span> garantiza retención inmediata sobre la pantalla. Mantén los clips de sonido bajo 2.0 segundos.</p>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800">
                <span className="font-black text-zinc-300 block mb-1">📸 Guía Estructural de Cortes</span>
                <p className="text-zinc-400 leading-normal font-sans">Detectamos {rundown.length} escenas. Promedio de plano {rundown[0]?.technical?.lens || '35mm'}. Sugerimos cambiar el ángulo técnico cada vez que el diálogo altere de temática.</p>
              </div>
            </div>
          </div>

          {/* DUAL COMPARATIVE TONALITIES WORKBENCH (Interactive A/B side-by-side desk) */}
          <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[16px_16px_0px_rgba(0,0,0,1)] relative transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-zinc-100 pb-6 mb-8 gap-4">
              <div>
                <span className="text-[9px] font-mono font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                  <SlidersHorizontal size={14} /> Laboratorio de Variantes A/B
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tighter mt-1 italic">Mesa de Edición de Versión</h3>
              </div>
              
              {/* Layout Formats Selector & Action board */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex bg-zinc-100 p-1 border border-zinc-200">
                  <button 
                    onClick={() => {
                      playProceduralSound('click');
                      setLayoutStyle('av-script');
                    }}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${layoutStyle==='av-script' ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-black'}`}
                  >
                    Columnas A/V
                  </button>
                  <button 
                    onClick={() => {
                      playProceduralSound('click');
                      setLayoutStyle('standard-hollywood');
                    }}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${layoutStyle==='standard-hollywood' ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-black'}`}
                  >
                    Mesa de Cine
                  </button>
                  <button 
                    onClick={() => {
                      playProceduralSound('click');
                      setLayoutStyle('bento-grid');
                    }}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${layoutStyle==='bento-grid' ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-black'}`}
                  >
                    Bento Grid
                  </button>
                </div>

                <button 
                  onClick={() => {
                    playProceduralSound('rise');
                    setShowTeleprompter(true);
                  }}
                  className="px-4 py-2 bg-black hover:bg-zinc-900 border-2 border-black text-white rounded-none transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                >
                  <Monitor size={14} />
                  <span>Teleprompter</span>
                </button>
              </div>
            </div>

            {/* Variant side-by-side view panel (Variant Selector toggler) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Variant A Column */}
              <div className={`p-6 border-2 transition-all ${selectedVariant === 'A' ? 'border-black bg-zinc-50/10 shadow-lg' : 'border-zinc-200 opacity-60'}`}>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-black text-white font-black flex items-center justify-center text-[10px]">A</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Variación Dinámica Comercial</span>
                  </div>
                  {selectedVariant !== 'A' && (
                    <button 
                      onClick={() => {
                        playProceduralSound('click');
                        setSelectedVariant('A');
                        setScript(scriptVariantA);
                      }}
                      className="text-[8px] font-black uppercase px-2 py-1 bg-zinc-100 border border-zinc-200 hover:bg-black hover:text-white transition-all"
                    >
                      Sintonizar A
                    </button>
                  )}
                </div>
                <textarea
                  value={scriptVariantA}
                  onChange={(e) => {
                    setScriptVariantA(e.target.value);
                    if (selectedVariant === 'A') setScript(e.target.value);
                  }}
                  className="w-full h-80 bg-transparent border-none focus:ring-0 p-0 text-[13px] font-sans text-black leading-relaxed resize-none outline-none overflow-y-auto"
                />
              </div>

              {/* Variant B Column */}
              <div className={`p-6 border-2 transition-all ${selectedVariant === 'B' ? 'border-black bg-zinc-50/10 shadow-lg' : 'border-zinc-200 opacity-60'}`}>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-zinc-800 text-white font-black flex items-center justify-center text-[10px]">B</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Variación Narrativa Orgánica</span>
                  </div>
                  {selectedVariant !== 'B' && (
                    <button 
                      onClick={() => {
                        playProceduralSound('click');
                        setSelectedVariant('B');
                        setScript(scriptVariantB);
                      }}
                      className="text-[8px] font-black uppercase px-2 py-1 bg-zinc-100 border border-zinc-200 hover:bg-black hover:text-white transition-all"
                    >
                      Sintonizar B
                    </button>
                  )}
                </div>
                <textarea
                  value={scriptVariantB}
                  onChange={(e) => {
                    setScriptVariantB(e.target.value);
                    if (selectedVariant === 'B') setScript(e.target.value);
                  }}
                  className="w-full h-80 bg-transparent border-none focus:ring-0 p-0 text-[13px] font-sans text-black leading-relaxed resize-none outline-none overflow-y-auto"
                />
              </div>

            </div>

            {/* SELECTED COMPLIANT SCRIPT RENDER VIEWER (Styled by selected layout format style) */}
            <div className="border-t-4 border-black pt-8">
              <span className="text-[9px] font-mono font-black text-zinc-400 tracking-widest block mb-4 uppercase">LECTOR DE MESA / FORMATO ACTIVO</span>
              
              <div className="flex justify-between items-center mb-6 bg-zinc-50 p-4 border border-zinc-150">
                <span className="text-[10px] font-black uppercase tracking-wider">Variación Seleccionada en Edición: <span className="underline">{selectedVariant}</span></span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (isPlayingTTS) {
                        stopTTS();
                      } else {
                        startTTS(script);
                      }
                    }}
                    className={`px-4 py-2 rounded-none transition-all shadow-md active:scale-90 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider border ${
                      isPlayingTTS 
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                        : 'bg-white hover:bg-black hover:text-white text-zinc-600 border-zinc-300'
                    }`}
                  >
                    {isPlayingTTS ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    <span>{isPlayingTTS ? 'Mute' : 'Audio Guía TTS'}</span>
                  </button>
                  <button 
                    onClick={syncScriptToRundown}
                    className={`p-2.5 rounded-none border transition-all ${synced ? 'bg-green-500 text-white' : 'bg-zinc-800 text-white hover:bg-black'}`}
                  >
                    {synced ? '¡Sincronizado!' : 'Sincronizar Guion a Escaleta'}
                  </button>
                  <button 
                    onClick={sendToProcessor}
                    className="p-2.5 bg-black text-white hover:bg-zinc-850 rounded-none transition-all"
                  >
                    {sent ? <Check size={14} /> : 'Compartir a Redactor'}
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2.5 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-black"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* COURIER CINEMA STYLE VIEW */}
              {layoutStyle === 'standard-hollywood' ? (
                <div className="bg-[#fdfcf7] text-[#1e1c18] border-2 border-[#eee3cc] p-10 md:p-14 font-serif rounded-none shadow-sm space-y-6">
                  <div className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-8 border-b-2 border-[#f5ead2] pb-6">
                    ***** Hollywood Standard Screenplay Layout *****
                  </div>
                  <div className="mx-auto max-w-xl text-[16px] leading-[1.8] space-y-8 font-mono">
                    <div className="text-left font-black uppercase tracking-widest text-[11px] mb-2">[TOMA_INI: EXT. ESTUDIO DIGITAL - DÍA]</div>
                    
                    {script.split('\n\n').map((para, pIdx) => (
                      <div key={pIdx} className="space-y-2">
                        <div className="text-center font-black tracking-widest text-[12px] uppercase text-zinc-500 ml-[20%] mr-[20%]">NARRADOR ({tone.toUpperCase()})</div>
                        {para.startsWith('(') ? (
                          <div className="text-zinc-500 text-center italic text-[14px] ml-[25%] mr-[25%]">{para}</div>
                        ) : (
                          <div className="text-left ml-[15%] mr-[10%] leading-relaxed tracking-wide">{para}</div>
                        )}
                      </div>
                    ))}
                    
                    <div className="text-center font-black tracking-widest text-[11px] pt-8 border-t border-[#f5ead2] uppercase text-zinc-450">FADE OUT.</div>
                  </div>
                </div>
              ) : layoutStyle === 'av-script' ? (
                /* Dual Columns A/V visual layout */
                <div className="grid grid-cols-1 md:grid-cols-2 bg-zinc-50 border-2 border-zinc-200">
                  <div className="border-r md:border-r border-zinc-200 p-6 md:p-8">
                    <span className="block text-[9px] font-mono font-black text-zinc-400 tracking-widest uppercase mb-4">COL_A: MATRIZ VISUAL / CÁMARA</span>
                    <div className="space-y-6 text-[11px] font-mono text-zinc-550 leading-relaxed uppercase">
                      {rundown.map((item, id) => (
                        <div key={id} className="p-3 bg-white border border-zinc-200/60 shadow-xs">
                          <span className="font-black text-black">ESCENE {id+1}: ({item.scene})</span>
                          <p className="mt-1 italic font-bold">➡️ {item.visual}</p>
                          <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-100 text-[9px] text-zinc-400 font-black">
                            <span>PLANO: {item.technical?.shot || 'MÓVIL'}</span>
                            <span>| LENTE: {item.technical?.lens || '35mm'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <span className="block text-[9px] font-mono font-black text-zinc-400 tracking-widest uppercase mb-4">COL_B: REPARTO AUDIO / DIÁLOGO</span>
                    <div className="space-y-6 text-[13px] font-sans text-black leading-relaxed">
                      {rundown.map((item, id) => (
                        <div key={id} className="p-3 bg-white border border-zinc-200/60 shadow-xs min-h-[72px] flex flex-col justify-between">
                          <p className="font-medium">"{item.audio}"</p>
                          {item.sfx && (
                            <span className="block text-[8px] font-mono text-red-500 uppercase tracking-widest font-black pt-1">SFX: *{item.sfx}*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Bento Grid visualization format */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rundown.map((item, id) => (
                    <div key={id} className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between border-b pb-2 mb-3 text-[9px] font-mono font-black">
                          <span>ESCENA {String(id+1).padStart(2, '0')}</span>
                          <span className="text-zinc-400">{item.duration}</span>
                        </div>
                        <span className="block text-[9px] font-black uppercase text-zinc-405 mb-1">{item.scene}</span>
                        <p className="text-[10px] text-zinc-500 italic leading-snug uppercase tracking-wide mb-3">{item.visual}</p>
                        <p className="text-[12px] text-black leading-normal font-sans">"{item.audio}"</p>
                      </div>
                      
                      <div className="pt-2 border-t border-zinc-100 text-[8px] font-mono text-zinc-400 font-bold uppercase space-y-0.5">
                        <div className="flex justify-between"><span>Plano:</span><span className="text-black">{item.technical?.shot || '-'}</span></div>
                        <div className="flex justify-between"><span>Luz:</span><span className="text-black">{item.technical?.lighting || '-'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* INTEGRATED THUMBNAIL LOGISTICS & PRODUCTION PLANNING MATRICE */}
          {(thumbnail || keywords.length > 0 || productionEstimate) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
              
              {/* Thumbnail Planner Card */}
              {thumbnail && (
                <div className="bg-zinc-50 rounded-none p-8 border-2 border-zinc-200 hover:border-black transition-all group shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">
                      <Video size={16} />
                      <span>Estrategia de Portada</span>
                    </div>
                    <p className="text-lg font-black text-black tracking-tight leading-none mb-3 uppercase">{thumbnail.text_overlay}</p>
                    <p className="text-[11px] text-zinc-500 italic leading-relaxed uppercase tracking-tighter">{thumbnail.idea}</p>
                  </div>
                  <div className="pt-4 text-left border-t border-zinc-200 mt-4">
                    <span className="text-[8px] font-mono font-black uppercase block text-zinc-400">Dimensión: 1080x1080px (Instagram)</span>
                  </div>
                </div>
              )}

              {/* Advanced Logistics Estimate Card */}
              {productionEstimate && (
                <div className="bg-zinc-950 rounded-none p-8 border-2 border-black hover:border-yellow-400 transition-all text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">
                      <Zap size={16} className="text-yellow-400" />
                      <span>Logística de Filmación</span>
                    </div>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                         <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Presupuesto</span>
                         <span className="text-[10px] font-black text-yellow-400 uppercase">{productionEstimate.budget}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                         <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Dificultad</span>
                         <span className="text-[10px] font-black text-white uppercase">{productionEstimate.difficulty}</span>
                      </div>
                      {productionEstimate.total_duration && (
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                           <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Tiempo de Corrida</span>
                           <span className="text-[10px] font-black text-white uppercase">{productionEstimate.total_duration}</span>
                        </div>
                      )}
                      
                      <div className="pt-1">
                         <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Equipo Recomendado</span>
                         <div className="flex flex-wrap gap-1 mb-2">
                            {productionEstimate.equipment.map((item, i) => (
                              <span key={i} className="text-[7px] font-mono border border-zinc-700 px-1.5 py-0.5 text-zinc-400">{item}</span>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {productionEstimate.editing_style && (
                    <div className="pt-4 border-t border-zinc-805 text-[8px] leading-normal font-mono space-y-1 mt-4">
                      <span className="text-zinc-500 block">EDICIÓN: <span className="text-zinc-300">{productionEstimate.editing_style.cut_pacing}</span></span>
                      <span className="text-zinc-500 block">AUDIO: <span className="text-zinc-300">{productionEstimate.editing_style.suggested_music}</span></span>
                    </div>
                  )}
                </div>
              )}

              {/* Tag SEO Vector Tracker Card */}
              {keywords.length > 0 && (
                <div className="bg-white rounded-none p-8 border-2 border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">
                      <Zap size={16} />
                      <span>Vectores Indexación SEO</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((k, i) => (
                        <span key={i} className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-none text-[9px] font-mono font-black text-black tracking-wider uppercase hover:bg-black hover:text-white transition-colors">#{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 mt-4 text-[8px] font-mono text-zinc-400 uppercase">Tags optimizados para buscadores.</div>
                </div>
              )}

            </div>
          )}

          {/* DYNAMIC CAMERAS INTERACTIVE BLUEPRINT OVERLAY PANEL */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-4 gap-4">
              <div className="flex items-center gap-3">
                <MonitorSmartphone size={18} className="shrink-0 animate-pulse-slow" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Escaleta de Planos Técnicos</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-200 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <Download size={14} /> Exportar PDF del Director
                </button>
                <button 
                  onClick={copyTableToClipboard}
                  className="px-4 py-2 bg-black text-white hover:bg-zinc-800 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md"
                >
                  {copiedTable ? <Check size={14} /> : <Copy size={14} />} Copiar Escaleta
                </button>
              </div>
            </div>

            {/* MAIN TECHNICAL ESCALETA BOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Center Table Section (2 Cols span) */}
              <div className="lg:col-span-2 space-y-4 max-h-[700px] overflow-y-auto scroller-pretty pr-2">
                {rundown.map((item, id) => (
                  <div 
                    key={id} 
                    onClick={() => {
                      playProceduralSound('click');
                      setActiveBlueprintSceneIdx(id);
                    }}
                    className={`p-4 border-2 transition-all cursor-pointer relative flex flex-col md:flex-row justify-between gap-4 ${activeBlueprintSceneIdx === id ? 'border-amber-450 bg-amber-50/5 shadow-md' : 'border-zinc-200 hover:border-black bg-white'}`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-none bg-black text-white flex items-center justify-center font-mono text-[11px] font-black shrink-0">
                        {String(id + 1).padStart(2, '0')}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-black">{item.scene}</span>
                          <span className="text-[9px] font-mono text-zinc-400">⏱️ {item.duration}</span>
                        </div>
                        <p className="text-[10px] italic text-zinc-500 uppercase tracking-tight">{item.visual}</p>
                        <p className="text-[12px] text-zinc-800 leading-normal font-sans">"{item.audio}"</p>
                        
                        {/* Inline rewrite bar */}
                        <div className="flex flex-wrap items-center gap-1 pt-1.5">
                          <span className="text-[7px] font-black font-mono text-zinc-400 uppercase tracking-widest mr-1">Retoques:</span>
                          {(['dynamic', 'humor', 'short', 'epic', 'director'] as const).map((sty) => (
                            <button
                              key={sty}
                              disabled={refiningIdx !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                refineSceneCustom(id, sty);
                              }}
                              className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-500 text-[8px] font-black uppercase tracking-wider hover:bg-black hover:text-white"
                            >
                              {sty === 'dynamic' ? '⚡ Energía' : sty === 'humor' ? '😂 Risas' : sty === 'short' ? '⏳ Cortar' : sty === 'epic' ? '🎭 Épico' : '🎬 Cámara'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 items-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 text-[9px] font-mono text-zinc-400 font-bold uppercase min-w-[120px]">
                      <div className="text-right w-full">
                        <span className="block text-[8px] text-zinc-550">Formato / Ángulo</span>
                        <span className="text-black font-black block">{item.technical?.shot || 'Medio'}</span>
                      </div>
                      <div className="text-right w-full">
                        <span className="block text-[8px] text-zinc-550">Lente / Óptica</span>
                        <span className="text-black font-black block">{item.technical?.lens || '35mm'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Cameraman Technical Blueprint Screen (Interactive previsualization canvas drawing) */}
              <div className="bg-zinc-950 text-white p-6 border-4 border-black flex flex-col justify-between shadow-[8px_8px_0px_rgba(0,0,0,1)] min-h-[400px]">
                
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
                    <span className="text-[8px] font-mono font-black text-yellow-405 tracking-widest uppercase flex items-center gap-1.5">
                      <Eye size={12} /> Tech Camera Blueprint v1.0
                    </span>
                    <span className="text-[7px] font-mono text-zinc-500 uppercase">Interactive Stage</span>
                  </div>

                  {activeBlueprintSceneIdx !== null ? (
                    (() => {
                      const activeItem = rundown[activeBlueprintSceneIdx];
                      const motionType = activeItem.technical?.motion || 'Fijo';
                      const lightType = activeItem.technical?.lighting || 'Natural';
                      const shotType = activeItem.technical?.shot || 'Primer plano';
                      
                      // Choose colors and visual parameters procedurally to match the visual parameters
                      const isSunset = lightType.toLowerCase().includes('gold') || lightType.toLowerCase().includes('atarde');
                      const isCyber = lightType.toLowerCase().includes('cyber') || lightType.toLowerCase().includes('neon');
                      const isNoir = lightType.toLowerCase().includes('noir') || lightType.toLowerCase().includes('claro');
                      const gradientColor = isSunset ? 'from-zinc-700 to-zinc-900' : isCyber ? 'from-zinc-850 to-zinc-950' : isNoir ? 'from-black to-zinc-900' : 'from-zinc-800 to-zinc-950';

                      return (
                        <div className="space-y-4">
                          <p className="text-[9px] font-mono text-yellow-500 uppercase font-black">Escena {activeBlueprintSceneIdx + 1} seleccionada</p>
                          <h4 className="text-sm font-black uppercase text-zinc-100 leading-tight">PREVIEW: {activeItem.scene}</h4>
                          
                          {/* THE DRAWN GRAPHICS GRID PORT */}
                          <div className={`relative w-full h-44 bg-gradient-to-tr ${gradientColor} border-2 border-black flex items-center justify-center overflow-hidden [box-shadow:inset_3px_3px_0px_rgba(0,0,0,1)]`}>
                            {/* Regla de tercios guides */}
                            <div className="absolute inset-x-0 top-1/3 h-[1px] bg-zinc-600/25" />
                            <div className="absolute inset-x-0 top-2/3 h-[1px] bg-zinc-600/25" />
                            <div className="absolute inset-y-0 left-1/3 w-[1px] bg-zinc-600/25" />
                            <div className="absolute inset-y-0 left-2/3 w-[1px] bg-zinc-600/25" />

                            {/* Camera overlay bracket guides */}
                            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/60" />
                            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/60" />
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/60" />
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/60" />

                            {/* Center focus indicator circle */}
                            <div className="w-14 h-14 rounded-full border border-dashed border-red-500/80 flex items-center justify-center animate-spin-slow">
                              <div className="w-3 h-3 rounded-full bg-red-500/45" />
                            </div>

                            {/* Motion vectors illustrated purely in CSS/SVG */}
                            {motionType.toLowerCase().includes('zoom') && (
                              <div className="absolute inset-6 border border-yellow-400/40 animate-pulse flex items-center justify-center">
                                <span className="text-[8px] text-yellow-400 font-mono">🔍 ZOOM_DIRECTION</span>
                              </div>
                            )}

                            {motionType.toLowerCase().includes('steady') && (
                              <div className="absolute inset-x-0 h-4 bg-lime-500/10 border-y border-lime-400/30 flex items-center justify-center">
                                <span className="text-[7px] text-lime-400 font-mono tracking-widest animate-bounce">▶ TRACKING STEADY_VEC</span>
                              </div>
                            )}

                            {/* Lens parameters shown layout */}
                            <div className="absolute bottom-4 left-4 text-[8px] font-mono text-white/50 bg-black/60 px-2 py-0.5 uppercase tracking-widest">
                              OPT: {activeItem.technical?.lens || '35mm'}
                            </div>

                            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-white/50 bg-black/60 px-2 py-0.5 uppercase tracking-widest">
                              {platform === 'instagram' ? '9:16 VERTICAL' : '16:9 HD'}
                            </div>
                          </div>

                          <div className="p-3.5 bg-zinc-900 border border-zinc-805 space-y-1.5 text-[9px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">FORMATO DE PLANO:</span>
                              <span className="text-white font-black">{shotType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">RITMO MOVIMIENTO:</span>
                              <span className="text-white font-black">{motionType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">ILUMINACIÓN DE ESTUDIO:</span>
                              <span className="text-white font-black">{lightType}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2">
                      <Sliders size={20} className="text-zinc-500 animate-pulse" />
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Selecciona una secuencia para previsualizar toma técnica</p>
                    </div>
                  )}

                </div>

                <div className="pt-4 border-t border-zinc-800 text-center text-[8px] text-zinc-500 font-mono uppercase tracking-widest">
                  Mapeado técnico simulado instantáneo.
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* FLOATING TELEPROMPTER OVERLAY PORT PORT INJECTION */}
      {showTeleprompter && (
        <Teleprompter 
          initialText={script} 
          onClose={() => {
            playProceduralSound('wood');
            setShowTeleprompter(false);
          }} 
        />
      )}

    </div>
  );
}
