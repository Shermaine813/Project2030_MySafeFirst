import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // CRITICAL: Cloud Run needs this to be exactly process.env.PORT or 8080
  const PORT = process.env.PORT || 8080;

  // Health Check - Google uses this to verify the container started
  app.get("/api/health", (req, res) => {
    res.status(200).send("OK");
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    
    // Serve static files from the dist directory
    app.use(express.static(distPath));

    // Handle React routing (SPA)
    app.get("*", (req, res) => {
      const indexFile = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Build directory 'dist' not found. Check your build logs.");
      }
    });
  } else {
    // Dev mode logic
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // CRITICAL: You MUST listen on '0.0.0.0' for Cloud Run
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is captured and listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
