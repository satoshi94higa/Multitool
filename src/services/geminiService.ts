import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'gemini_api_key_v1';

export const getLocalApiKey = () => localStorage.getItem(STORAGE_KEY) || '';
export const setLocalApiKey = (key: string) => localStorage.setItem(STORAGE_KEY, key);

export async function processWithGemini(body: any, endpoint: string = 'process', customKey?: string) {
  const localKey = customKey || getLocalApiKey();

  // If we have a local key, try to use it directly (important for GitHub Pages)
  if (localKey && localKey.length > 10) {
    console.log(`[GeminiService] Using CLIENT-SIDE execution for: ${endpoint}`);
    try {
      const ai = new GoogleGenAI({ apiKey: localKey });
      
      let prompt = "";
      const { type, text, customPrompt, input, mode, tone } = body;
      
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
          prompt = `Actúa como corrector gramatical experto. Corrige el texto y devuelve estrictamente un objeto JSON con esta estructura: {"corrected": "el texto corregido", "changes": ["cambio 1"], "tips": ["consejo 1"]}. Texto: "${input}"`;
        } else if (mode === 'emojis') {
          prompt = `Agrega emojis relevantes al texto: "${input}"`;
        } else {
          prompt = `Genera 3 opciones para ${mode} basadas en: ${input}. Tono: ${toneLabel}.`;
        }
      }

      const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
      let lastClientError: any;

      for (const modelName of models) {
        try {
          console.log(`[GeminiService] Trying client model ${modelName}...`);
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });
          return { text: result.text };
        } catch (mErr: any) {
          lastClientError = mErr;
          const msg = String(mErr.message || "").toLowerCase();
          if (mErr.status === 429 || mErr.status === 404 || msg.includes("quota") || msg.includes("429") || msg.includes("not found")) {
            console.warn(`[GeminiService] Model ${modelName} failed on client (Status: ${mErr.status}).`);
            continue;
          }
          throw mErr;
        }
      }
      throw lastClientError;
    } catch (err: any) {
      console.warn("[GeminiService] Client-side execution failed:", err);
      const msg = String(err.message || "").toLowerCase();
      if (msg.includes("api_key_invalid") || msg.includes("invalid api key")) {
        throw new Error("Clave de API inválida.");
      }
      if (err.status === 429 || msg.includes("quota") || msg.includes("429")) {
        throw new Error("Has agotado la cuota de tu propia clave API. Intenta de nuevo más tarde.");
      }
      // If we fall through, we might try server (if not on static host)
    }
  }

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
    console.error('GeminiService Error:', error);
    throw new Error(error.message || "No se pudo conectar con el servicio de IA.");
  }
}
