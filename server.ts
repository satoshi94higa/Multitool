import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada. Por favor, añádela en la configuración de Secrets.");
    }
    ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY
  });
});

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
      return res.status(400).json({ error: "No hay contenido para procesar." });
    }

    const client = getAI();
    const result = await client.models.generateContent({
      model: req.body.model || "gemini-2.0-flash",
      contents: fullContent
    });

    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || "Error en el servicio de IA."
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
      prompt = `Actúa como corrector gramatical experto. Corrige el texto y devuelve estrictamente un objeto JSON con esta estructura: {"corrected": "el texto corregido", "changes": ["cambio 1", "cambio 2"], "tips": ["consejo 1"]}`;
    } else if (mode === 'emojis') {
      prompt = `Agrega emojis relevantes al siguiente texto sin cambiar las palabras originales.`;
    } else if (mode === 'cta') {
      prompt = `Genera 3 Call to Action cortos basados en: ${input}. Tono: ${toneLabel}.`;
    } else if (mode === 'hooks') {
      prompt = `Genera 3 Hooks impactantes basados en: ${input}. Tono: ${toneLabel}.`;
    }

    const client = getAI();
    const result = await client.models.generateContent({
      model: req.body.model || "gemini-2.0-flash",
      contents: `${prompt}\n\nTexto: "${input}"`
    });

    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Gemini Social Error:", error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || "Error al procesar con IA."
    });
  }
});

// Static files / Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
