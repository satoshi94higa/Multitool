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
        summarize: "Sintetizá el siguiente texto de forma concisa pero manteniendo los puntos clave. Usá un tono natural de Argentina (voseo). No utilices formato Markdown (como asteriscos para negritas o almohadillas para títulos):",
        spelling: `Actuá como un corrector ortográfico experto. Corregí la ortografía y gramática del siguiente texto usando español de Argentina (voseo). 
        No utilices formato Markdown en el campo 'text' (no uses asteriscos, guiones de lista, etc.).
        Devuelve estrictamente un objeto JSON con esta estructura:
        {
          "text": "el texto completo corregido sin formato markdown",
          "changes": ["lista de cambios importantes realizados"]
        }`,
        translate: "Traducí el siguiente texto al inglés de forma natural. No uses formato Markdown:",
        bullets: "Transformá el siguiente texto en una lista de puntos clara y organizada. Usá voseo si es necesario y no utilices formato Markdown (usá guiones simples '-' o números):",
        simplify: "Simplificá el siguiente texto para que sea más fácil de leer y entender, manteniendo el significado original. Usá español de Argentina (voseo). No uses formato Markdown:",
        keywords: "Extraé los puntos clave o conceptos más importantes del siguiente texto y presentalos en una lista clara. Usá español de Argentina (voseo). No uses formato Markdown:",
        style: `Actuá como un editor de estilo experto. Mejora la legibilidad, fluidez y claridad del siguiente texto usando español de Argentina (voseo). 
        No utilices formato Markdown en el campo 'text' (no uses asteriscos, guiones de lista, etc.).
        Devuelve estrictamente un objeto JSON con esta estructura:
        {
          "text": "el texto completo mejorado sin formato markdown",
          "changes": ["lista de las principales mejoras de estilo y legibilidad realizadas"]
        }`,
        brainstorm: "Generá 5 ideas creativas basadas en el siguiente concepto. Usá español de Argentina (voseo). No uses formato Markdown:",
        screenplay: "Generá un esquema de guion basado en la siguiente premisa. Usá español de Argentina (voseo). No uses formato Markdown:",
        journalist: "Escribí un artículo periodístico breve basado en la siguiente información. Usá español de Argentina (voseo). No uses formato Markdown:",
        director: "Generá una descripción visual y técnica para una escena basada en este texto. Usá español de Argentina (voseo). No uses formato Markdown:"
      };
      const prompt = prompts[type as keyof typeof prompts] || "";
      fullContent = prompt + (text ? `\n\n"${text}"` : "");
    }

    if (!fullContent.trim()) {
      return res.status(400).json({ error: "No hay contenido para procesar." });
    }

    const client = getAI();
    const modelName = req.body.model || "gemini-3-flash-preview";
    console.log(`[Gemini] Calling model: ${modelName}`);
    
    const result = await client.models.generateContent({
      model: modelName,
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

      Solo devolvé el texto final formateado y listo para copiar y pegar directamente en Instagram.`;
    } else if (mode === 'grammar') {
      prompt = `Actuá como un corrector de estilo y editor profesional del Río de la Plata.
      Corregí la ortografía, gramática y sintaxis del texto ingresado usando español rioplatense (voseo) de forma fluida y natural.
      Evitá que suene robótico o acartonado.
      Devolvé estrictamente un objeto JSON con esta estructura exacta, sin formato de código markdown alrededor:
      {
        "corrected": "el texto completamente corregido y optimizado, listo para copiar y pegar",
        "changes": ["lista abreviada y clara de los cambios realizados"],
        "tips": ["un consejo corto y práctico de redacción humana para este texto"]
      }`;
    } else if (mode === 'emojis') {
      prompt = `Tomá el siguiente texto y agregale emojis acordes que sumen dinamismo, pero hacelo de forma orgánica y humana, sin saturar.
      Seguí estas reglas estrictas:
      - No pongas más de 1 o 2 emojis por párrafo.
      - No remplaces palabras clave por emojis, colocalos siempre al final de las frases para acompañar el sentido.
      - No uses negritas ni formato markdown (asteriscos, guiones raros, etc.).
      - Debe estar listo para copiar y pegar en Instagram.`;
    } else if (mode === 'cta') {
      prompt = `Generá 3 llamados a la acción (CTA) cortos, humanos y sumamente persuasivos basados en el tema del texto.
      Deben sonar 100% auténticos, escritos por una persona real del Río de la Plata (usando voseo natural y amigable, ej: "Contame abajo qué opinás", "Dejame tu comentario", "Guardate este post para tenerlo a mano").
      Evitá clichés de venta agresiva o robóticos del estilo "¡No dejes pasar esta oportunidad única!".
      Tono: ${toneLabel}.
      Entregá solo las 3 opciones separadas por saltos de línea limpios, sin números ni viñetas, sin markdown, listas para copiar y pegar en Instagram.`;
    } else if (mode === 'hooks') {
      prompt = `Generá 3 ganchos (primeras líneas de lectura o hooks) impactantes y curiosos basados en el tema del texto.
      El objetivo es frenar el scroll del usuario en Instagram de inmediato.
      Deben sonar espontáneos, intrigantes y sumamente humanos, al estilo de un creador de contenido profesional del Río de la Plata (usando voseo natural y amigable, ej: "Me costó un montón de años darme cuenta de esto...", "¿Te pasó alguna vez que...?", "Esto es lo que nadie te cuenta sobre...").
      Evitá ganchos típicos de IA como "Descubrí el fascinante secreto de...".
      Tono: ${toneLabel}.
      Entregá solo las 3 opciones separadas por saltos de línea limpios, sin números ni viñetas, sin markdown, listas para copiar y pegar en Instagram.`;
    }

    const client = getAI();
    const modelName = req.body.model || "gemini-3-flash-preview";
    console.log(`[Gemini Social] Calling model: ${modelName}`);

    const result = await client.models.generateContent({
      model: modelName,
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
    const distPath = path.join(process.cwd(), 'build');
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
