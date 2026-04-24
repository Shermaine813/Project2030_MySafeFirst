import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Cloud Run uses the PORT environment variable
  const PORT = Number(process.env.PORT) || 8080;

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV === "production") {
    // Vite build output is in the 'dist' folder
    const distPath = path.resolve(__dirname, "dist");
    
    console.log(`Production mode: serving from ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error(`ERROR: Static directory not found: ${distPath}`);
    }

    // Serve the static files from dist
    app.use(express.static(distPath));
    
    // Serve the assets folder specifically
    app.use('/assets', express.static(path.join(distPath, 'assets')));

    // Catch-all route to serve index.html for the React SPA
    app.get("*", (req, res) => {
      const indexFile = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Build files not found. Ensure 'npm run build' was executed.");
      }
    });
  } else {
    // Development mode using Vite middleware
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
