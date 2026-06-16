import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'gemini_api_key_v1';
const MODEL_KEY = 'gemini_model_v1';

export const getLocalApiKey = () => typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '';
export const setLocalApiKey = (key: string) => typeof window !== 'undefined' ? localStorage.setItem(STORAGE_KEY, key) : null;

export const getLocalModel = () => typeof window !== 'undefined' ? localStorage.getItem(MODEL_KEY) || 'gemini-3-flash-preview' : 'gemini-3-flash-preview';
export const setLocalModel = (model: string) => typeof window !== 'undefined' ? localStorage.setItem(MODEL_KEY, model) : null;

export async function processWithGemini(body: any, endpoint: string = 'process', customKey?: string) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error("Estás sin conexión a Internet. Las funciones de Inteligencia Artificial requieren conectividad activa.");
  }
  const currentModel = getLocalModel();
  console.log(`[GeminiService] Calling ${endpoint} with model: ${body.model || currentModel}`);
  const apiPath = 'api/gemini/' + endpoint;
  
  // Attach current model to body if not present
  if (!body.model) {
    body.model = currentModel;
  }
  
  // Try server first
  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      return await response.json();
    }
    
    // If we have a local key and server gave 404/500/etc, we try client-side
    const localKey = customKey || getLocalApiKey();
    if (localKey) {
      console.warn(`[GeminiService] Server returned ${response.status}. Attempting client-side fallback with provided key.`);
      return await executeClientSide(body, endpoint, localKey);
    }

    const err = await response.json().catch(() => ({ error: "Error de servidor" }));
    throw new Error(err.error || `Error ${response.status}`);
  } catch (error: any) {
    console.warn(`[GeminiService] Server call failed: ${error.message}. Checking fallback.`);
    
    const localKey = customKey || getLocalApiKey();
    if (localKey) {
      return await executeClientSide(body, endpoint, localKey);
    }
    
    throw new Error(error.message || "No se pudo conectar con el servicio de IA. Si estás en GitHub Pages, configura tu propio API Key en Ajustes.");
  }
}
async function executeClientSide(body: any, endpoint: string, apiKey: string) {
  console.log(`[GeminiService] Executing Gemini call on Client Side for: ${endpoint}`);
  
  let prompt = "";
  if (endpoint === 'process') {
    const { type, text, customPrompt } = body;
    if (customPrompt) {
      prompt = `${customPrompt}\n\n"${text || ''}"`;
    } else {
      const prompts: Record<string, string> = {
        summarize: "Sintetizá el siguiente texto de forma concisa pero manteniendo los puntos clave. Usá un tono natural de Argentina (voseo). No utilices formato Markdown (como asteriscos o almohadillas):",
        spelling: "Actuá como un corrector experto. Corregí la ortografía y gramática del siguiente texto usando español de Argentina (voseo). No uses formato Markdown. Devolvé estrictamente un objeto JSON con esta estructura: {\"text\": \"el texto completo corregido sin markdown\", \"changes\": [\"lista de cambios\"]}",
        grammar: "Actuá como un experto lingüista y corrector. Corregí la gramática y sintaxis del siguiente texto usando español de Argentina (voseo). No uses formato Markdown. Devolvé estrictamente un objeto JSON con esta estructura: {\"text\": \"el texto completo corregido sin markdown\", \"changes\": [\"lista de cambios sintácticos y gramatales\"]}",
        translate: "Traducí el siguiente texto al inglés de forma natural. Sin formato Markdown:",
        bullets: "Transformá el siguiente texto en una lista de puntos clara y organizada. Usá voseo y guiones '-' o números, sin Markdown:",
        simplify: "Simplificá el siguiente texto para que sea más fácil de leer y entender, manteniendo el significado original. Usá español de Argentina (voseo). No uses formato Markdown:",
        keywords: "Extraé los puntos clave o conceptos más importantes del siguiente texto y presentalos en una lista clara. Usá español de Argentina (voseo). No uses formato Markdown:",
        style: "Actuá como un editor de estilo experto. Mejora la legibilidad, fluidez y claridad del siguiente texto usando español de Argentina (voseo). No uses formato Markdown. Devolvé estrictamente un objeto JSON con esta estructura: {\"text\": \"el texto mejorado\", \"changes\": [\"lista de mejoras\"]}",
        brainstorm: "Generá 5 ideas creativas basadas en el siguiente concepto. Usá español de Argentina (voseo). No uses formato Markdown:",
        screenplay: "Generá un esquema de guion basado en la siguiente premisa. Usá español de Argentina (voseo). No uses formato Markdown:",
        journalist: "Escribí un artículo periodístico breve basado en la siguiente información. Usá español de Argentina (voseo). No uses formato Markdown:",
        director: "Generá una descripción visual y técnica para una escena basada en este texto. Usá español de Argentina (voseo). No uses formato Markdown:"
      };
      prompt = (prompts[type as keyof typeof prompts] || "") + (text ? `\n\n"${text}"` : "");
    }
  } else if (endpoint === 'social') {
    const { 
      input, 
      tone, 
      noMarkdown, 
      includeEmojis = true, 
      includeCta = true, 
      includeHooks = true, 
      includeHashtags = true 
    } = body;
    
    const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

    let emojiRule = includeEmojis 
      ? 'Agregá un máximo de un emoji pequeño al final de un párrafo o frase clave para dar color. No satures ni arranques líneas con emojis.'
      : 'NO uses emojis bajo ningún concepto. Tu texto no debe contener emojis.';
    
    let ctaRule = includeCta
      ? 'Terminá siempre con un llamado a la acción (CTA) natural, planteando una pregunta interactiva o invitación directa coherente con el tono (ej: "Contame abajo si te pasó", "Guardate este post si te sirve"). NO uses clichés de venta agresiva.'
      : 'NO incluyas ningún llamado a la acción (CTA) al final del texto.';

    let hookRule = includeHooks
      ? 'La primera frase (el gancho o hook) debe ser sumamente magnética, frenar el scroll del usuario planteando una duda, experiencia o verdad interesante de forma 100% humana y conversacional (sin clichés de IA).'
      : 'Empezá de forma directa con la idea o núcleo central del post sin redactar un gancho dramático ni rebuscado.';

    let hashtagRule = includeHashtags
      ? 'Generá entre 3 y 5 hashtags estratégicos, cortos e intuitivos.'
      : 'NO incluyas hashtags en el texto final.';

    prompt = `Actuá como un experto creador de contenido y redactor estratégico freelance nativo de la región del Río de la Plata (Argentina/Uruguay).
      Tu tarea es tomar el texto ingresado y optimizarlo de manera profesional para publicar directamente en Instagram, garantizando el máximo enganche y claridad.

      DEBÉS GENERAR DOS VARIANTES DISTINTAS (POST A Y POST B) para dar opciones de elección:
      - Variante A: Enfocada en un ángulo directo, de conexión emocional, transparente y ágil.
      - Variante B: Enfocada en un ángulo más enfático/profesional, estructurado o con un giro creativo alternativo.

      REGLAS DE FORMATO Y ESTRUCTURA OBLIGATORIAS PARA AMBAS:
      1. PÁRRAFOS SÚPER CORTOS: El texto debe estructurarse en párrafos muy cortos (máximo 2 o 3 líneas por párrafo). Dejá espacios limpios entre párrafos usando saltos de línea dobles. En el celular la gente escanea la pantalla, la lectura debe ser ágil y liviana.
      2. INFORMACIÓN CENTRAL CRISTALINA: Identificá la idea principal del texto y que quede clarísima.
      3. REGLA DE ADAPTABILIDAD SELECCIONADA:
         - Gancho inicial: ${hookRule}
         - Llamado a la acción (CTA): ${ctaRule}
         - Hashtags sutiles: ${hashtagRule}
      4. EVITÁ EL "TONO IA" (ANTISLOP):
         - Usá español rioplatense natural (voseo: "tenés", "mirá", "pensá", "hacé") con total fluidez. Que suene como un audio de WhatsApp de un amigo súper profesional, no como un folleto corporativo o manual rígido.
         - Prohibidísimo arrancar con frases hechas de IA como: "¡Atención!", "¿Estás listo para...?", "En el mundo tan acelerado de hoy...", "¡Llegó la hora!".
         - ${noMarkdown ? 'No uses ningún tipo de Markdown (nada de asteriscos como **, ni guiones bajos con formato _). Instagram no los interpreta y queda desprolijo.' : 'Podés usar formato limpio.'}
      5. EMOJIS: ${emojiRule}
      6. TONO SELECCIONADO: Adaptá la redacción siguiendo el formato "${toneLabel}":
         - casual: Muy relajado, simpático y cómplice.
         - profesional: Experto, interesante y confiable, sin perder la frescura rioplatense del voseo.
         - enérgico: Motivador, con garra y entusiasmo real por compartir un mensaje valioso.
      7. INVITACIONES A EVENTOS: Si el texto original es sobre un evento, festejo o invitación, remarcá obligatoriamente los datos de fecha, lugar/dirección y hora. Hacelo en un bloque condensado y cortito al final del cuerpo principal (antes del CTA), usando emojis temáticos y claros (ej: 📅 para fecha, 🕒 para hora, 📍 para lugar), ideal para lectura rápida.

      DEBÉS responder EXCLUSIVAMENTE con un objeto JSON válido con la siguiente estructura, sin ningún bloque de código markdown de envoltura (es decir, NO agregues \`\`\`json ni \`\`\`):
      {
        "variantA": "Texto completo optimizado de la Variante A",
        "variantB": "Texto completo optimizado de la Variante B",
        "hashtags": ["etiqueta1", "etiqueta2", "etiqueta3"],
        "readability": {
          "score": 95,
          "level": "green", 
          "feedback": "Resumen cortito (máximo 2 líneas) en español de Río de la Plata indicando por qué es fácil leer este texto en el celu."
        }
      }

      El nivel de legibilidad "level" debe ser "green" (óptimo con párrafos de 3 líneas o menos), "yellow" (algunas partes densas) o "red" (párrafos muy largos).\n\nTexto original para optimizar: "${input}"`;
  }

  const preferredModel = body.model || getLocalModel();
  const modelsToTry = [preferredModel, "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError = "";
  
  // Filter out duplicates and invalid models
  const uniqueModels = Array.from(new Set(modelsToTry.filter(m => m && typeof m === 'string')));

  for (const model of uniqueModels) {
    try {
      console.log(`[GeminiService] Trying local model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (response.ok) {
        return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
      } else {
        lastError = data.error?.message || "Error desconocido";
        console.warn(`[GeminiService] Model ${model} failed: ${lastError}`);
        // Si es un error de API Key inválida, no seguimos probando modelos
        if (response.status === 401 || response.status === 403) break;
      }
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[GeminiService] Fetch error for ${model}: ${lastError}`);
    }
  }

  throw new Error(`Error en la IA local: ${lastError}. Verifica tu API Key y que el modelo esté disponible en tu región.`);
}
