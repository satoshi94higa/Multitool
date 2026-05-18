import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

let ai: any = null;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (req.method === 'POST') {
    console.log(`[${timestamp}] ${req.method} ${req.url} - Body sent`);
  } else {
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    aiInitialized: !!ai
  });
});

async function generateContentWithRetry(modelName: string, contents: any) {
  if (!ai) {
    throw new Error("Servicio de IA no disponible en este momento.");
  }
  
  const maxRetries = 3;
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
      const status = error.status || (error.message?.includes('429') ? 429 : 500);
      
      if (status === 429) {
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
          console.log(`[GeminiServer] Quota reached (429). Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error("La cuota gratuita de la IA se ha agotado por hoy. Por favor, intenta de nuevo más tarde.");
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
          "changes": ["lista de cambios importantes realizados"]
        }`,
        translate: "Traduce el siguiente texto al inglés de forma natural:",
        bullets: "Transforma el siguiente texto en una lista de bullet points clara y organizada:",
        brainstorm: "Genera 5 ideas creativas basadas en el siguiente concepto:",
        screenplay: "Genera un esquema de guion basado en la siguiente premisa:",
        journalist: "Escribe un artículo periodístico breve basado en la siguiente información:",
        director: "Genera una descripción visual y técnica para una escena basada en este texto:"
      };
      const prompt = prompts[type as keyof typeof prompts] || "";
      fullContent = prompt + (text ? `\n\n"${text}"` : "");
    }

    if (!fullContent.trim()) {
      return res.status(400).json({ error: "Invalid request: no content to process" });
    }

    const response = await generateContentWithRetry("gemini-2.0-flash", [{ role: 'user', parts: [{ text: fullContent }] }]);
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const status = error.status || (error.message?.includes('429') ? 429 : 500);
    res.status(status === 429 ? 429 : 500).json({ 
      error: status === 429 ? "Límite de cuota excedido (429). Intenta más tarde." : (error.message || "Error interno del servidor")
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
      ${noMarkdown ? 'IMPORTANTE: No uses negritas o cursivas.' : ''}
      Solo devuelve el texto final formateado.`;
    } else if (mode === 'grammar') {
      prompt = `Corrige la gramática y ortografía. Devuelve JSON: {"corrected": "...", "changes": [], "tips": []}`;
    } else if (mode === 'emojis') {
      prompt = `Agrega emojis relevantes al siguiente texto sin cambiar las palabras originales.`;
    } else if (mode === 'cta') {
      prompt = `Genera 3 Call to Action cortos basados en: ${input}`;
    } else if (mode === 'hooks') {
      prompt = `Genera 3 Hooks impactantes basados en: ${input}`;
    }

    const response = await generateContentWithRetry("gemini-2.0-flash", [{ role: 'user', parts: [{ text: `${prompt}\n\nTexto: "${input}"` }] }]);
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Social Error:", error);
    const status = error.status || (error.message?.includes('429') ? 429 : 500);
    res.status(status === 429 ? 429 : 500).json({ 
      error: status === 429 ? "Saturación de IA (429). Intenta de nuevo en un minuto." : (error.message || "Error interno del servidor")
    });
  }
});

// Static files / Vite
async function setupApp() {
  // Initialize AI
  try {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      console.log("Gemini API initialized");
    }
  } catch (err) {
    console.error("AI Init Error:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite Middleware Error:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Avoid sending index.html for API routes that missed the match
      if (req.url.startsWith('/api/')) {
         return res.status(404).json({ error: "API Route not found" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

export default app;

const PORT = Number(process.env.PORT) || 3000;
const isVercel = !!process.env.VERCEL;

setupApp().then(() => {
  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
});
