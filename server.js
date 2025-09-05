import express from "express"
import http from "node:http"
import path from "node:path"
import dotenv from "dotenv"
import startSubprocessesForModels, { implementedModels } from "./start-subprocesses-for-models.js"
import userToGemini from "./user-to-gemini-1.js"
const app = express()
dotenv.config()
let x;

function setCustomHeaders(res, filePath) {
  const ext = path.extname(filePath)
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".woff2": "font/woff2",  }
  if (mimeTypes[ext])
    res.setHeader("X-Content-Type-Options", mimeTypes[ext])
  else
    throw Error(`Unknown MIME Type: ${ext}`)
}

//serving the static pages, images, icons
app.use("/", express.static("./static", { setHeaders: setCustomHeaders }))

startSubprocessesForModels()

app.post("/run-model", express.json(), async (req, res, next) => {
  const { prompt, modelKey } = req.body
  const availableModelsKeys = []
  implementedModels.forEach((value, key, map) => {
    if (value.status) availableModelsKeys.push(value.modelKey)
  })
  if (!availableModelsKeys.includes(modelKey)) {
    res.status(404).json({ "response": "unknown model requested" })
    return
  }
  // Read symptoms from CSV header
  const fs = await import('node:fs/promises');
  const csvPath = "./dataset-partition-1.csv";
  let symptomsArray = [];
  try {
    const csvData = await fs.readFile(csvPath, "utf-8");
    const headerLine = csvData.split("\n")[0];
    // Remove first two columns (Unnamed: 0, diseases)
    symptomsArray = headerLine.split(",").slice(2);
  } catch (err) {
    console.error("Error reading symptoms from CSV:", err);
    res.status(500).json({ "response": "Error reading symptoms list" });
    return;
  }
  const inputForOurModel = await userToGemini(prompt, symptomsArray);
  // const model = implementedModels.get(modelKey)
  // let inputPrompt, outputPromptFromOurModel, outputPrompt = "The model is not responding";
  // try {
  //   inputPrompt = await model.getInputPrompt()
  // }
  // catch (err) {
  //   console.error(err)
  // }
  // if (inputPrompt.includes("Symptoms:")) {
  //   await model.giveInput(inputForOurModel)
  //   outputPrompt = await model.getOutputPrompt()
  // }
  
  res.json({ "response": inputForOurModel })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 3000
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${ PORT }`)
})