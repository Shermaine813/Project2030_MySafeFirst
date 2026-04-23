import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // We use process.env.PORT if available (e.g. for Cloud Run) 
  // but fallback to 3000 for the platform's standard environment.
  const PORT = Number(process.env.PORT) || 3000;

  // Add API routes here if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    
    // Debug logging to help identify path issues in Cloud Run
    console.log(`Production mode: serving from ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error(`ERROR: Static directory not found: ${distPath}`);
      console.log(`Current directory contents: ${fs.readdirSync(__dirname).join(', ')}`);
    }

    app.use(express.static(distPath));
    
    // Explicitly handle JS and CSS for Vite
    app.use('/assets', express.static(path.join(distPath, 'assets')));

    app.get("*", (req, res) => {
      console.log(`Fallback route hit for: ${req.url}`);
      const indexFile = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Production build not found. Did you run 'npm run build'?");
      }
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`Development server running at http://0.0.0.0:3000`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
