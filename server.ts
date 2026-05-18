import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
      console.log('Body keys:', Object.keys(req.body || {}));
    }
    next();
  });

  // Health check and diagnostics
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV,
      aiInitialized: !!ai
    });
  });

  app.post("/api/test-post", (req, res) => {
    res.json({ status: "post_ok", bodyReceived: !!req.body });
  });

  let ai: any = null;
  try {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API initialized successfully with @google/genai");
    } else {
      console.warn("GEMINI_API_KEY not found in environment. Server-side AI will be disabled.");
    }
  } catch (err) {
    console.error("Error initializing Gemini API:", err);
  }

  async function generateContentWithRetry(modelName: string, contents: any) {
    if (!ai) {
      throw new Error("El servidor no tiene configurada la clave de API de Gemini. Por favor, configúrala en los Ajustes del proyecto o usa tu propia clave localmente.");
    }
    
    const maxRetries = 5;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[GeminiServer] Calling ${modelName}...`);
        const result = await ai.models.generateContent({
          model: modelName,
          contents: contents
        });
        return { text: result.text };
      } catch (error: any) {
        lastError = error;
        console.error(`[GeminiServer] Error on attempt ${i + 1}:`, error.message || error);
        
        // Check for 429 Too Many Requests
        if (error.message?.includes('429') || error.status === 429) {
          if (i < maxRetries - 1) {
            const delay = Math.pow(2, i) * 3000 + Math.random() * 1000;
            console.log(`[GeminiServer] Quota reached (429). Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error("Límite de cuota excedido (429). Por favor, intenta de nuevo en un minuto o configura tu propia API Key en Ajustes para uso ilimitado.");
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Gemini API Proxy
  app.post("/api/gemini/process", async (req, res) => {
    try {
      const { type, text, customPrompt } = req.body;
      
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

      const response = await generateContentWithRetry("gemini-3-flash-preview", [{ role: 'user', parts: [{ text: fullContent }] }]);

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const isQuotaError = error.message?.includes('429') || error.status === 429;
      res.status(isQuotaError ? 429 : 500).json({ 
        error: isQuotaError ? "La cuota gratuita del servidor se ha agotado por hoy. Para seguir usando la app sin límites, por favor inserta tu propia API Key en Ajustes (ícono de engranaje abajo a la derecha)." : (error.message || "Error interno del servidor")
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

      const response = await generateContentWithRetry("gemini-3-flash-preview", [{ role: 'user', parts: [{ text: `${prompt}\n\nTexto: "${input}"` }] }]);

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
