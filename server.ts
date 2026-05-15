import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  async function generateContentWithRetry(model: string, contents: any, config?: any) {
    const maxRetries = 5;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            ...config,
            // Add a small safety for the system
            maxOutputTokens: 2048,
          }
        });
      } catch (error: any) {
        lastError = error;
        // Check for 429 Too Many Requests
        if (error.message?.includes('429') || error.status === 429) {
          if (i < maxRetries - 1) {
            // More aggressive backoff since the quota error says to wait ~30s
            // Attempt 0: ~5s
            // Attempt 1: ~10s
            // Attempt 2: ~20s
            // Attempt 3: ~40s
            const delay = Math.pow(2, i) * 5000 + Math.random() * 2000;
            console.log(`Retrying Gemini API call due to 429 error. Attempt ${i + 1}/${maxRetries}. Delaying for ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Gemini API Proxy
  app.post("/api/gemini/process", async (req, res) => {
    try {
      const { type, text, tone, mode, customPrompt } = req.body;
      
      let prompt = "";
      let fullContent = "";
      
      if (customPrompt) {
        fullContent = `${customPrompt}\n\n"${text || ''}"`;
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
        prompt = prompts[type as keyof typeof prompts] || "";
        fullContent = prompt + (text ? `\n\n"${text}"` : "");
      }

      if (!fullContent.trim()) {
        return res.status(400).json({ error: "Invalid request: no content to process" });
      }

      const response = await generateContentWithRetry("gemini-1.5-flash", fullContent);

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const isQuotaError = error.message?.includes('429') || error.status === 429;
      res.status(isQuotaError ? 429 : 500).json({ 
        error: isQuotaError ? "Límite de cuota excedido. Por favor, espera unos segundos. El sistema está reintentando automáticamente, pero si el error persiste es porque la cuota diaria se ha agotado." : (error.message || "Error interno del servidor")
      });
    }
  });

  app.post("/api/gemini/social", async (req, res) => {
    try {
      const { input, mode, tone, noMarkdown } = req.body;
      
      let prompt = '';
      const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

      if (mode === 'social') {
        prompt = `Actúa como un experto en redes sociales. Toma el siguiente texto y formatéalo para que sea atractivo (Instagram/Twitter/LinkedIn). 
        Agrega emojis relevantes. Mantén un tono ${toneLabel}.
        ${noMarkdown ? 'IMPORTANTE: No uses negritas, cursivas o caracteres de formato como asteriscos (*) o guiones bajos (_).' : ''}
        Preserva el mensaje original pero hazlo más legible.
        Solo devuelve el texto final formateado.`;
      } else if (mode === 'grammar') {
        prompt = `Corrige la gramática y ortografía del siguiente texto. 
        IMPORTANTE: Devuelve la respuesta estrictamente en este formato JSON:
        {
          "corrected": "el texto completo corregido",
          "changes": ["lista breve de cambios clave realizados"],
          "tips": ["recomendaciones para mejorar la escritura a futuro"]
        }`;
      } else if (mode === 'emojis') {
        prompt = `Toma el siguiente texto y agrega emojis relevantes al final de las frases o palabras clave. No cambies las palabras originales. Solo devuelve el texto con emojis agregados.`;
      } else if (mode === 'cta') {
        prompt = `Genera un "Call to Action" (Llamado a la acción) potente y corto basado en el siguiente texto. Debe invitar a comentar, compartir o hacer clic. Genera 3 opciones diferentes separadas por líneas.
        Mantén un tono ${toneLabel}.
        Devuelve solo las 3 opciones.`;
      } else if (mode === 'hooks') {
        prompt = `Genera un "Hook" (Gancho inicial) impactante para redes sociales basado en el siguiente texto. Debe ser algo que detenga el scroll. Genera 3 estilos diferentes: una pregunta intrigante, un dato impactante y un beneficio directo.
        Mantén un tono ${toneLabel}.
        Devuelve solo las 3 opciones separadas por líneas.`;
      }

      const response = await generateContentWithRetry("gemini-1.5-flash", `${prompt}\n\nTexto: "${input}"`);

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error /api/gemini/social:", error);
      const isQuotaError = error.message?.includes('429') || error.status === 429;
      res.status(isQuotaError ? 429 : 500).json({ 
        error: isQuotaError ? "Límite de cuota excedido. Por favor, espera un momento." : (error.message || "Error interno del servidor")
      });
    }
  });

  // Catch-all for API routes to return JSON instead of HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
