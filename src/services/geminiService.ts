import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'gemini_api_key_v1';

export const getLocalApiKey = () => typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '';
export const setLocalApiKey = (key: string) => typeof window !== 'undefined' ? localStorage.setItem(STORAGE_KEY, key) : null;

export async function processWithGemini(body: any, endpoint: string = 'process', customKey?: string) {
  console.log(`[GeminiService] Attempting to call backend API for endpoint: ${endpoint}`);
  const apiPath = `/api/gemini/${endpoint}`;
  
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
  console.log(`[GeminiService] Executing Gemini call via direct FETCH (Client Side) for: ${endpoint}`);
  
  let prompt = "";
  if (endpoint === 'process') {
    const { type, text, customPrompt } = body;
    if (customPrompt) {
      prompt = `${customPrompt}\n\n"${text || ''}"`;
    } else {
      const prompts: Record<string, string> = {
        summarize: "Resume el siguiente texto de forma concisa pero manteniendo los puntos clave:",
        spelling: "Actúa como un corrector ortográfico experto. Corrige la ortografía y gramática del siguiente texto. Devuelve estrictamente un objeto JSON con esta estructura: {\"text\": \"el texto completo corregido\", \"changes\": [\"lista de cambios\"]}",
        translate: "Traduce el siguiente texto al inglés de forma natural:",
        bullets: "Transforma el siguiente texto en una lista de bullet points clara y organizada:",
        brainstorm: "Genera 5 ideas creativas basadas en el siguiente concepto:",
        screenplay: "Genera un esquema de guion basado en la siguiente premisa:",
        journalist: "Escribe un artículo periodístico breve basado en la siguiente información:",
        director: "Genera una descripción visual y técnica para una escena basada en este texto:"
      };
      prompt = (prompts[type as keyof typeof prompts] || "") + (text ? `\n\n"${text}"` : "");
    }
  } else if (endpoint === 'social') {
    const { input, mode, tone, noMarkdown } = body;
    const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

    if (mode === 'social') {
      prompt = `Actúa como un experto en redes sociales. Toma el siguiente texto y formatéalo para que sea atractivo (Instagram/Twitter/LinkedIn). 
      Agrega emojis relevantes. Mantén un tono ${toneLabel}.
      ${noMarkdown ? 'IMPORTANTE: No uses negritas o cursivas.' : ''}
      Solo devuelve el texto final formateado.\n\nTexto: "${input}"`;
    } else if (mode === 'grammar') {
      prompt = `Actúa como corrector gramatical experto. Corrige el texto y devuelve estrictamente un objeto JSON con esta estructura: {"corrected": "el texto corregido", "changes": ["cambio 1", "cambio 2"], "tips": ["consejo 1"]}\n\nTexto: "${input}"`;
    } else if (mode === 'emojis') {
      prompt = `Agrega emojis relevantes al siguiente texto sin cambiar las palabras originales.\n\nTexto: "${input}"`;
    } else if (mode === 'cta') {
      prompt = `Genera 3 Call to Action cortos basados en: ${input}. Tono: ${toneLabel}.`;
    } else if (mode === 'hooks') {
      prompt = `Genera 3 Hooks impactantes basados en: ${input}. Tono: ${toneLabel}.`;
    }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error en API de Google");
    
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
  } catch (error: any) {
    console.error("[GeminiService] Client Direct Error:", error);
    throw new Error("Error en la IA local: " + (error.message || "Verifica tu API Key"));
  }
}
