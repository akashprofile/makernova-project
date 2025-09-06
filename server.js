import express from "express"
import http from "node:http"
import path from "node:path"
import dotenv from "dotenv"
import startSubprocessesForModels, { implementedModels } from "./start-subprocesses-for-models.js"
import userToGemini from "./user-to-gemini-1.js"
import getPrescription from "./get-prescription.js"
import { readFile } from 'node:fs/promises';

dotenv.config()

const filePath = new URL('./symptoms-array.json', import.meta.url);
let symptomsArray
readFile(filePath, { encoding: 'utf8' })
  .then(stringData => {
    symptomsArray = JSON.parse(stringData)
  })
  .catch(err => {
    console.error(err)
  })

const app = express()
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
  // Read symptoms from symptoms-array.json
  const fs = await import('node:fs/promises');
  const symptomsPath = "./symptoms-array.json";
  let symptomsArray = [];
  try {
    const jsonData = await fs.readFile(symptomsPath, "utf-8");
    symptomsArray = JSON.parse(jsonData);
  } catch (err) {
    console.error("Error reading symptoms from JSON:", err);
    res.status(500).json({ "response": "Error reading symptoms list" });
    return;
  }
  const geminiSymptomsFormat = await userToGemini(prompt, symptomsArray); // array
  const inputForOurModel = geminiSymptomsFormat.join(",")  // our desired input

  if (!(/(?:[01],){327}[01]/.test(inputForOurModel))) {
    res.status(201).send({ GeminiGeneratedInvalidInput: inputForOurModel })
  }

  const model = implementedModels.get(modelKey)
  let inputPrompt, outputFromOurModel = "The model is not responding";
  try {
    inputPrompt = await model.getInputPrompt()
  }
  catch (err) {
    console.error(err)
  }
  if (inputPrompt.includes("Symptoms:")) {
    await model.giveInput(inputForOurModel)
    outputFromOurModel = await model.getOutputPrompt()
  }
  const presentSymptoms = geminiSymptomsFormat.filter(value => (Number(value) === 1)? true : false)
  const prescription = await getPrescription(Array.of(outputFromOurModel), presentSymptoms)

  res.json({ "response": prescription })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 3000
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${ PORT }`)
})
