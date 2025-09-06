import express from "express"
import http from "node:http"
import path from "node:path"
import dotenv from "dotenv"
import startSubprocessesForModels, { implementedModels } from "./start-subprocesses-for-models.js"
import userToGemini from "./user-to-gemini-1.js"
import { readFile } from 'node:fs/promises';
import test from "node:test"

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
  //const inputForOurModel = "1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"
  const inputForOurModel = await userToGemini(prompt, symptomsArray);
  const testingCriteria = /^(?:[01],){327}[01]$/
  if (!testingCriteria.test(inputForOurModel)) {
    res.json({ "response": "Invalid input genrated by GenAI model" })
    return
  }
  const model = implementedModels.get(modelKey)
  let inputPromptFromOurModel, outputFromOurModel = "The model is not responding", outputPrompt;
  try {
    inputPromptFromOurModel = await model.getInputPrompt()
  }
  catch (err) {
    console.error(err)
  }
  if (inputPromptFromOurModel.includes("Symptoms:")) {
    await model.giveInput(inputForOurModel)
    outputFromOurModel = await model.getOutputPrompt()
  }
  else
    console.log({
      debugMessage: "this input ptompt is not being handled",
      inputPromptFromOurModel 
    })

  res.json({ "response": outputFromOurModel })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 3000
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${ PORT }`)
})