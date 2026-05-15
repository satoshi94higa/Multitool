import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'utility_hub_gemini_api_key';

export const getLocalApiKey = () => {
  return localStorage.getItem(STORAGE_KEY) || '';
};

export const setLocalApiKey = (key: string) => {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export async function processWithGemini(body: any, endpoint: string = 'process') {
  const localKey = getLocalApiKey();

  // If we have a local key, use it directly (useful for GitHub Pages)
  if (localKey) {
    console.log("Attempting to use local API Key for Gemini...");
    try {
      const ai = new GoogleGenAI({ 
        apiKey: localKey
      });

      let prompt = "";
      if (endpoint === 'social') {
        const { input, mode, tone, noMarkdown } = body;
        const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

        if (mode === 'social') {
          prompt = `Actúa como un experto en redes sociales. Toma el siguiente texto y formatéalo para que sea atractivo (Instagram/Twitter/LinkedIn). 
          Agrega emojis relevantes. Mantén un tono ${toneLabel}.
          ${noMarkdown ? 'IMPORTANTE: No uses negritas, cursivas o caracteres de formato como asteriscos (*) o guiones bajos (_).' : ''}
          Preserva el mensaje original pero hazlo más legible.
          Solo devuelve el texto final formateado.\n\nTexto: "${input}"`;
        } else if (mode === 'grammar') {
          prompt = `Corrige la gramática y ortografía del siguiente texto. 
          IMPORTANTE: Devuelve la respuesta estrictamente en este formato JSON:
          {
            "corrected": "el texto completo corregido",
            "changes": ["lista breve de cambios clave realizados"],
            "tips": ["recomendaciones para mejorar la escritura a futuro"]
          }\n\nTexto: "${input}"`;
        } else if (mode === 'emojis') {
          prompt = `Toma el siguiente texto y agrega emojis relevantes al final de las frases o palabras clave. No cambies las palabras originales. Solo devuelve el texto con emojis agregados.\n\nTexto: "${input}"`;
        } else if (mode === 'cta') {
          prompt = `Genera un "Call to Action" (Llamado a la acción) potente y corto basado en el siguiente texto. Debe invitar a comentar, compartir o hacer clic. Genera 3 opciones diferentes separadas por líneas.
          Mantén un tono ${toneLabel}.
          Devuelve solo las 3 opciones.\n\nTexto: "${input}"`;
        } else if (mode === 'hooks') {
          prompt = `Genera un "Hook" (Gancho inicial) impactante para redes sociales basado en el siguiente texto. Debe ser algo que detenga el scroll. Genera 3 estilos diferentes: una pregunta intrigante, un dato impactante y un beneficio directo.
          Mantén un tono ${toneLabel}.
          Devuelve solo las 3 opciones separadas por líneas.\n\nTexto: "${input}"`;
        }
      } else {
        const { type, text, customPrompt } = body;
        if (customPrompt) {
          prompt = `${customPrompt}\n\n"${text || ''}"`;
        } else {
          const prompts = {
            summarize: "Resume el siguiente texto de forma concisa pero manteniendo los puntos clave:",
            spelling: `Actúa como un corrector ortográfico experto. Corrige la ortografía y gramática del siguiente texto. 
            Devuelve estrictamente un objeto JSON con esta estructura:
            {
              "text": "el texto completo corregido",
              "changes": ["lista de cambios importantes realizados, ejemplo: 'corregido tilde en cancion'"]
            }`,
            translate: "Traduce el siguiente texto al inglés de forma natural:",
            bullets: "Transforma el siguiente texto en una lista de bullet points clara y organizada:",
            brainstorm: "Genera 5 ideas creativas basadas en el siguiente concepto:",
            screenplay: "Genera un esquema de guion basado en la siguiente premisa:",
            journalist: "Escribe un artículo periodístico breve basado en la siguiente información:",
            director: "Genera una descripción visual y técnica para una escena basada en este texto:"
          };
          prompt = (prompts[type as keyof typeof prompts] || "") + (text ? `\n\n"${text}"` : "");
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      return { text: response.text };
    } catch (error: any) {
      console.error("Local Gemini Error:", error);
      throw new Error(`Error de IA (Local): ${error.message || "Verifica tu API Key."}`);
    }
  }

  // Fallback to server API
  console.log(`Falling back to server API for endpoint: ${endpoint}`);
  const response = await fetch(`/api/gemini/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    if (contentType?.includes('text/html')) {
      throw new Error("El servidor no pudo procesar la solicitud (Error HTML). Si estás en GitHub Pages, debes configurar tu API Key personal en Ajustes para que funcione.");
    }
    
    const clone = response.clone();
    try {
      const errData = await response.json();
      throw new Error(errData.error || `Error del servidor: ${response.statusText}`);
    } catch (e: any) {
      if (e.message && e.message.includes("Error del servidor")) throw e;
      const textBody = await clone.text().catch(() => "Sin cuerpo de respuesta");
      throw new Error(`Error ${response.status} (${response.statusText}): ${textBody.substring(0, 100)}...`);
    }
  }

  if (contentType?.includes('application/json')) {
    const clone = response.clone();
    try {
      return await response.json();
    } catch (e) {
      const textBody = await clone.text().catch(() => "Error al leer texto");
      throw new Error(`Error al procesar JSON: ${textBody.substring(0, 100)}...`);
    }
  } else {
    const textBody = await response.text().catch(() => "Cuerpo ilegible");
    console.error("Non-JSON response from server:", textBody);
    throw new Error(`El servidor devolvió una respuesta inesperada (no JSON): ${textBody.substring(0, 50)}...`);
  }
}
