import express from "express"
import http from "node:http"
import path from "node:path"
import startSubprocessesForModels, { implementedModels } from "./start-subprocesses-for-models.js"

const app = express()
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
  const model = implementedModels.get(modelKey)
  let inputPrompt, outputPrompt;
  try {
    inputPrompt = await model.getInputPrompt()
  }
  catch (err) {
    console.error(err)
  }
  if (inputPrompt.includes("Enter name:")) {
    await model.giveInput(prompt)
    outputPrompt = await model.getOutputPrompt()
  }
  res.json({ "response": outputPrompt })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 3000
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${ PORT }`)
})