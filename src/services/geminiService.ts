import { GoogleGenerativeAI } from "@google/generative-ai";

const STORAGE_KEY = 'gemini_api_key_v1';

export const getLocalApiKey = () => localStorage.getItem(STORAGE_KEY) || '';
export const setLocalApiKey = (key: string) => localStorage.setItem(STORAGE_KEY, key);

export async function processWithGemini(body: any, endpoint: string = 'process', customKey?: string) {
  const localKey = customKey || getLocalApiKey();
  
  // Si estamos en un entorno estático (como GitHub Pages) o tenemos una clave local, 
  // intentamos usarla directamente primero si no hay backend activo detectable.
  if (localKey && localKey.length > 10) {
    console.log(`[GeminiService] Using CLIENT-SIDE execution for: ${endpoint}`);
    try {
      const genAI = new GoogleGenerativeAI(localKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      let prompt = "";
      const { type, text, customPrompt, input, mode, tone } = body;
      
      // Reconstruimos el prompt que solía generar el servidor
      if (endpoint === 'process') {
        if (customPrompt) {
          prompt = `${customPrompt}\n\n"${text || ''}"`;
        } else {
          const prompts = {
            summarize: "Resume el siguiente texto de forma concisa:",
            spelling: "Corrige la ortografía y gramática del siguiente texto. Devuelve JSON: {\"text\": \"...\", \"changes\": []}",
            translate: "Traduce al inglés:",
            bullets: "Convierte en lista de bullet points:",
            brainstorm: "Genera 5 ideas basadas en:",
            screenplay: "Genera un esquema de guion:",
            journalist: "Escribe un artículo breve:",
            director: "Genera una descripción visual técnica:"
          };
          prompt = (prompts[type as keyof typeof prompts] || "") + `\n\n"${text}"`;
        }
      } else if (endpoint === 'social') {
        const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';
        if (mode === 'social') {
          prompt = `Expert social media formatter. Tone: ${toneLabel}. Add emojis. Text: "${input}"`;
        } else if (mode === 'grammar') {
          prompt = `Correct grammar. JSON: {"corrected": "...", "changes": []}. Text: "${input}"`;
        } else if (mode === 'emojis') {
          prompt = `Add emojis to text: "${input}"`;
        } else {
          prompt = `Generate 3 options for ${mode} based on: ${input}`;
        }
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { text: response.text() };
    } catch (err: any) {
      console.warn("[GeminiService] Client-side failure, may try server if available:", err);
      if (err.message?.includes("API_KEY_INVALID")) {
        throw new Error("La clave de API ingresada no es válida.");
      }
      // Si falla por otra cosa y no hay backend, lanzamos el error
    }
  }

  // Fallback o intento principal: Llamada al Servidor (Proxy)
  console.log(`[GeminiService] Calling backend API for endpoint: ${endpoint}`);
  const apiPath = `/api/gemini/${endpoint}`;
  
  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({ error: "Error desconocido" }));
       throw new Error(err.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (localKey) throw error; // Si teníamos clave y falló todo
    throw new Error("No se pudo conectar con la IA. Si estás en GitHub Pages, configura tu propio API Key en los ajustes.");
  }
}
