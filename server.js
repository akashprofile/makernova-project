import fs from "fs";
import express from "express";
import http from "node:http";
import path from "node:path";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Load symptoms JSON
const symptomsList = JSON.parse(fs.readFileSync("./symptoms.json", "utf-8"));

const app = express();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Custom headers for static files
function setCustomHeaders(res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".woff2": "font/woff2",
  };
  if (mimeTypes[ext]) {
    res.setHeader("X-Content-Type-Options", mimeTypes[ext]);
  } else {
    throw Error(`Unknown MIME Type: ${ext}`);
  }
}

// Serving the static frontend
app.use("/", express.static("./static", { setHeaders: setCustomHeaders }));

// Handle model requests
app.post("/model", express.json(), async (req, res) => {
  console.log("request received");
  console.log(req.body);

  const userPrompt = req.body.prompt;

  try {
    // Send prompt to Gemini
    const result = await model.generateContent(userPrompt);

    // Respond to frontend
    res.json({
      response: result.response.text(),
      symptoms: symptomsList, // send your symptom map if needed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model request failed" });
  }
});

// Start server
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${PORT}`);
});
