import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'gemini_api_key_v1';
const MODEL_KEY = 'gemini_model_v1';

export const getLocalApiKey = () => typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '';
export const setLocalApiKey = (key: string) => typeof window !== 'undefined' ? localStorage.setItem(STORAGE_KEY, key) : null;

export const getLocalModel = () => typeof window !== 'undefined' ? localStorage.getItem(MODEL_KEY) || 'gemini-3-flash-preview' : 'gemini-3-flash-preview';
export const setLocalModel = (model: string) => typeof window !== 'undefined' ? localStorage.setItem(MODEL_KEY, model) : null;

export async function processWithGemini(body: any, endpoint: string = 'process', customKey?: string) {
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
    const { input, mode, tone, noMarkdown } = body;
    const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

    if (mode === 'social') {
      prompt = `Actuá como un creador de contenido y redactor freelance nativo del Río de la Plata.
      Tomá el siguiente texto y adaptalo para que sea súper atractivo, fluido y listo para publicar directo en Instagram.

      PAUTAS DE ESCRITURA PARA EVITAR EL "TONO IA" (SLOP):
      1. USÁ ESPAÑOL RIOPLATENSE NATURAL: Usá voseo con total naturalidad (ej. "vos tenés", "si querés", "pensá", "hacé", "mirá"). Usá un tono auténtico de acá, fresco y relajado, pero profesional cuando sea pertinente. Evitá modismos exagerados o forzados (no abuses de lunfardo), pero sí usá vocabulario habitual (como "un montón", "bárbaro", "buenísimo", "tranqui").
      2. CERO CLICHÉS DE IA: Prohibido usar introducciones genéricas de marketing como "¡Atención!", "¿Estás listo para...?", "En el mundo de hoy...", "¡Descubrí el secreto!", "¡Llegó la hora!". Empezá directo con el concepto o con una frase con gancho que suene humana y conversacional.
      3. LISTO PARA INSTAGRAM (SIN MARKDOWN): No uses negritas de tipo asteriscos (**), cursivas (*), ni símbolos raros. Instagram no soporta Markdown. El texto debe estar limpio, usando saltos de línea dobles para estructurar párrafos y que sea súper legible al copiar y pegar.
      4. EMOJIS CON CRITERIO: No pongas emojis al inicio de cada línea ni abuses de ellos. Colocá máximo uno o dos emojis sutiles por párrafo para dar calidez, siempre al final de las oraciones.
      5. SIN EXCESOS: Evitá listas numeradas con emojis de números (como 1️⃣, 2️⃣, 3️⃣) a menos que sea estrictamente necesario. Si hacés una lista, usá guiones simples o puntos limpios.
      6. TONO SELECCIONADO: Ajustá el mensaje al tono "${toneLabel}".
         - casual: Muy cercano, amigable, relajado y cómplice, directo al grano.
         - profesional: Serio, interesante, con autoridad y respeto, pero con la cercanía del voseo profesional rioplatense.
         - enérgico: Con empuje, entusiasmo real y motivación genuina, sin sonar como un infomercial de televisión.

      Solo devolvé el texto final formateado y listo para copiar y pegar directamente en Instagram.\n\nTexto: "${input}"`;
    } else if (mode === 'grammar') {
      prompt = `Actuá como un corrector de estilo y editor profesional del Río de la Plata.
      Corregí la ortografía, gramática y sintaxis del texto ingresado usando español rioplatense (voseo) de forma fluida y natural.
      Evitá que suene robótico o acartonado.
      Devolvé estrictamente un objeto JSON con esta estructura exacta, sin formato de código markdown alrededor:
      {
        "corrected": "el texto completamente corregido y optimizado, listo para copiar y pegar",
        "changes": ["lista abreviada y clara de los cambios realizados"],
        "tips": ["un consejo corto y práctico de redacción humana para este texto"]
      }\n\nTexto: "${input}"`;
    } else if (mode === 'emojis') {
      prompt = `Tomá el siguiente texto y agregale emojis acordes que sumen dinamismo, pero hacelo de forma orgánica y humana, sin saturar.
      Seguí estas reglas estrictas:
      - No pongas más de 1 o 2 emojis por párrafo.
      - No remplaces palabras clave por emojis, colocalos siempre al final de las frases para acompañar el sentido.
      - No uses negritas ni formato markdown (asteriscos, guiones raros, etc.).
      - Debe estar listo para copiar y pegar en Instagram.\n\nTexto: "${input}"`;
    } else if (mode === 'cta') {
      prompt = `Generá 3 llamados a la acción (CTA) cortos, humanos y sumamente persuasivos basados en el tema del texto.
      Deben sonar 100% auténticos, escritos por una persona real del Río de la Plata (usando voseo natural y amigable, ej: "Contame abajo qué opinás", "Dejame tu comentario", "Guardate este post para tenerlo a mano").
      Evitá clichés de venta agresiva o robóticos del estilo "¡No dejes pasar esta oportunidad única!".
      Tono: ${toneLabel}.
      Entregá solo las 3 opciones separadas por saltos de línea limpios, sin números ni viñetas, sin markdown, listas para copiar y pegar en Instagram.\n\nTexto: "${body.input}"`;
    } else if (mode === 'hooks') {
      prompt = `Generá 3 ganchos (primeras líneas de lectura o hooks) impactantes y curiosos basados en el tema del texto.
      El objetivo es frenar el scroll del usuario en Instagram de inmediato.
      Deben sonar espontáneos, intrigantes y sumamente humanos, al estilo de un creador de contenido profesional del Río de la Plata (usando voseo natural y amigable, ej: "Me costó un montón de años darme cuenta de esto...", "¿Te pasó alguna vez que...?", "Esto es lo que nadie te cuenta sobre...").
      Evitá ganchos típicos de IA como "Descubrí el fascinante secreto de...".
      Tono: ${toneLabel}.
      Entregá solo las 3 opciones separadas por saltos de línea limpios, sin números ni viñetas, sin markdown, listas para copiar y pegar en Instagram.\n\nTexto: "${body.input}"`;
    }
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
