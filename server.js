import fs from "fs";
import express from "express";
import http from "node:http";
import path from "node:path";
import dotenv from "dotenv";
// import genai from "@google/genai";
import * as genai from "@google/genai";
// import { GoogleGenerativeAI } from "@google/genai";

const symptomsList = JSON.parse(fs.readFileSync("./symptoms.json", "utf-8"));
const app = express();

function setCustomHeaders(res, filePath) {
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".woff2": "font/woff2",
  };
  if (mimeTypes[ext]) res.setHeader("X-Content-Type-Options", mimeTypes[ext]);
  else throw Error(`Unknown MIME Type: ${ext}`);
}

// Serving the static pages, images, icons
app.use("/", express.static("./static", { setHeaders: setCustomHeaders }));

// app.get("/", (req, res, next) => {
//   res.set("Content-Type", "text/html");
//   res.send('<img src="./nodejs-logo.png">');
// });

app.post("/model", express.json(), (req, res, next) => {
  console.log("request received");
  console.log(req.body);
  res.json({ response: "sample response from server side to the client" });
});

// Gemini Model 1 integration (real)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.post("/gemini1", express.json(), async (req, res) => {
  try {
    const { prompt } = req.body;
    // Compose a prompt for Gemini to return a 333-length array
    const systemPrompt = `Given the following user description, return ONLY a valid JSON array of length 333, where each index corresponds to the symptom in the provided list, with 1 if present and 0 if not. The order of symptoms is: ${Object.values(symptomsList.index_to_symptom).join(", ")}. User description: "${prompt}". Return ONLY the array, nothing else.`;
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent(systemPrompt);
    const raw = result.response.text();
    console.log("Gemini raw response:", raw);
    let arr;
    try {
      // Try direct JSON parse
      arr = JSON.parse(raw);
    } catch {
      // Try to extract array from text using regex
      const match = raw.match(/\[.*\]/s);
      if (match) {
        arr = JSON.parse(match[0]);
      } else {
        arr = Array(333).fill(0);
      }
    }
    res.json({ symptoms: arr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini 1 integration failed" });
  }
});

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${PORT}`);
});