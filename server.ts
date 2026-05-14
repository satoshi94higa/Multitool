import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for remote commands (active sessions)
  const sessions: Record<string, { command: string | null; timestamp: number }> = {};

  // API to send a command from mobile
  app.post("/api/remote/:id", (req, res) => {
    const { id } = req.params;
    const { command } = req.body;
    sessions[id] = { command, timestamp: Date.now() };
    res.json({ success: true });
  });

  // API to poll for commands from teleprompter
  app.get("/api/remote/:id", (req, res) => {
    const { id } = req.params;
    const session = sessions[id];
    if (session) {
      const { command } = session;
      sessions[id].command = null; // Consume command
      return res.json({ command });
    }
    res.json({ command: null });
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
