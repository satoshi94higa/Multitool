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
    const { 
      input, 
      tone, 
      noMarkdown, 
      includeEmojis = true, 
      includeCta = true, 
      includeHooks = true, 
      includeHashtags = true 
    } = req.body;
    
    const toneLabel = tone === 'casual' ? 'casual' : tone === 'professional' ? 'profesional' : 'enérgico';

    let emojiRule = includeEmojis 
      ? 'Agregá un máximo de un emoji pequeño al final de un párrafo o frase clave para dar color. No satures ni arranques líneas con emojis.'
      : 'NO uses emojis bajo ningún concepto. Tu texto no debe contener emojis.';
    
    let ctaRule = includeCta
      ? 'Terminá siempre con un llamado a la acción (CTA) natural, planteando una pregunta interactiva o invitación directa coherente con el tono (ej: "Contame abajo si te pasó", "Guardate este post si te sirve"). NO uses clichés de venta agresiva.'
      : 'NO incluyas ningún llamado a la acción (CTA) al final del texto.';

    let hookRule = includeHooks
      ? 'La primera frase (el gancho o hook) debe ser sumamente magnética, frenar el scroll del usuario planteando una duda, experiencia o verdad interesante de forma 100% humana y conversacional (sin clichés de IA).'
      : 'Empezá de forma directa con la idea o núcleo central del post sin redactar un gancho dramático ni rebuscado.';

    let hashtagRule = includeHashtags
      ? 'Generá entre 3 y 5 hashtags estratégicos, cortos e intuitivos.'
      : 'NO incluyas hashtags en el texto final.';

    const prompt = `Actuá como un experto creador de contenido y redactor estratégico freelance nativo de la región del Río de la Plata (Argentina/Uruguay).
      Tu tarea es tomar el texto ingresado y optimizarlo de manera profesional para publicar directamente en Instagram, garantizando el máximo enganche y claridad.

      DEBÉS GENERAR DOS VARIANTES DISTINTAS (POST A Y POST B) para dar opciones de elección:
      - Variante A: Enfocada en un ángulo directo, de conexión emocional, transparente y ágil.
      - Variante B: Enfocada en un ángulo más enfático/profesional, estructurado o con un giro creativo alternativo.

      REGLAS DE FORMATO Y ESTRUCTURA OBLIGATORIAS PARA AMBAS:
      1. PÁRRAFOS SÚPER CORTOS: El texto debe estructurarse en párrafos muy cortos (máximo 2 o 3 líneas por párrafo). Dejá espacios limpios entre párrafos usando saltos de línea dobles. En el celular la gente escanea la pantalla, la lectura debe ser ágil y liviana.
      2. INFORMACIÓN CENTRAL CRISTALINA: Identificá la idea principal del texto y que quede clarísima.
      3. REGLA DE ADAPTABILIDAD SELECCIONADA:
         - Gancho inicial: ${hookRule}
         - Llamado a la acción (CTA): ${ctaRule}
         - Hashtags sutiles: ${hashtagRule}
      4. EVITÁ EL "TONO IA" (ANTISLOP):
         - Usá español rioplatense natural (voseo: "tenés", "mirá", "pensá", "hacé") con total fluidez. Que suene como un audio de WhatsApp de un amigo súper profesional, no como un folleto corporativo o manual rígido.
         - Prohibidísimo arrancar con frases hechas de IA como: "¡Atención!", "¿Estás listo para...?", "En el mundo tan acelerado de hoy...", "¡Llegó la hora!".
         - ${noMarkdown ? 'No uses ningún tipo de Markdown (nada de asteriscos como **, ni guiones bajos con formato _). Instagram no los interpreta y queda desprolijo.' : 'Podés usar formato limpio.'}
      5. EMOJIS: ${emojiRule}
      6. TONO SELECCIONADO: Adaptá la redacción siguiendo el formato "${toneLabel}":
         - casual: Muy relajado, simpático y cómplice.
         - profesional: Experto, interesante y confiable, sin perder la frescura rioplatense del voseo.
         - enérgico: Motivador, con garra y entusiasmo real por compartir un mensaje valioso.
      7. INVITACIONES A EVENTOS: Si el texto original es sobre un evento, festejo o invitación, remarcá obligatoriamente los datos de fecha, lugar/dirección y hora. Hacelo en un bloque condensado y cortito al final del cuerpo principal (antes del CTA), usando emojis temáticos y claros (ej: 📅 para fecha, 🕒 para hora, 📍 para lugar), ideal para lectura rápida.

      DEBÉS responder EXCLUSIVAMENTE con un objeto JSON válido con la siguiente estructura, sin ningún bloque de código markdown de envoltura (es decir, NO agregues \`\`\`json ni \`\`\`):
      {
        "variantA": "Texto completo optimizado de la Variante A",
        "variantB": "Texto completo optimizado de la Variante B",
        "hashtags": ["etiqueta1", "etiqueta2", "etiqueta3"],
        "readability": {
          "score": 95,
          "level": "green", 
          "feedback": "Resumen cortito (máximo 2 líneas) en español de Río de la Plata indicando por qué es fácil leer este texto en el celu."
        }
      }

      El nivel de legibilidad "level" debe ser "green" (óptimo con párrafos de 3 líneas o menos), "yellow" (algunas partes densas) o "red" (párrafos muy largos).`;

    const client = getAI();
    const modelName = req.body.model || "gemini-3.5-flash";
    console.log(`[Gemini Social JSON] Calling model: ${modelName}`);

    const result = await client.models.generateContent({
      model: modelName,
      contents: `${prompt}\n\nTexto original para optimizar: "${input}"`,
      config: {
        responseMimeType: "application/json"
      }
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
