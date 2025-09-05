import express from "express"
import { spawn } from "node:child_process";
import http from "node:http"
import path from "node:path"

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

// app.get("/", (req, res, next) => {
//   res.set("Content-Type", "text/html")
//   res.send('<img src="./nodejs-logo.png">')
// })

// NOTE: Here models are uniquely identifed by it corresponding model key
const modelsToBeImplementedKeys = ["dtc"]
const implementedModels = new Map()
const implementedModelsKeys = []

class Model {
  constructor() {
    this.status = null,
    this.process = null,
    this.inputPrompt = "",
    this.outputPrompt = "",
    this._isWaitingForInput = false,
    this._isReadyForOutput = false,
    this.modelKey = ""
  }
  giveInput(input) {
    return new Promise((resolve, reject) => {
      this.process.stdin.write(input + "\n", err => {
        if (err) reject(err)
        else {
          resolve()
          this._isReadyForOutput = true
        }
      })
    })
  }
  getInputPrompt() {
    //waiting some time for subprocess execution so that it will give new prompt
    return new Promise((resolve, reject) => {
      const maximumWaitingTime = 5000, timeStamp = Date.now()
      let toInput = undefined, timeElapsed = 0
      const interval = setInterval(() => {
        if (this._isWaitingForInput) {
          toInput = this.inputPrompt
          clearInterval(interval)
        }
        if (toInput != undefined) resolve(toInput)
        else {
          timeElapsed = Date.now() - timeStamp;
          if (timeElapsed >= maximumWaitingTime) {
            clearInterval(interval)
            reject("Model is taking to long to take input. Maximum waiting time reached.")
          }
        }
      }, 10)
    })
  }
  getOutputPrompt() {
    //waiting for subprocess execution so that it can generate next prompt for output
    return new Promise((resolve, reject) => {
      const maximumWaitingTime = 5000, timeStamp = Date.now()
      let toOutput = undefined, timeElapsed = 0
      const interval = setInterval(() => {
        if (this._isReadyForOutput) {
          resolve(this.outputPrompt)
          this.outputPrompt = ""
          this._isReadyForOutput = false
          clearInterval(interval)
        }
        if (toOutput != undefined) resolve(toOutput)
        else {
          timeElapsed = Date.now() - timeStamp;
          if (timeElapsed >= maximumWaitingTime) {
            clearInterval(interval)
            reject("Model is taking to long too give output. Maximum waiting time reached.")
          }
        }
      }, 10)
    })
  }
  isAvailable() {
    return this.status
  }
  isWaitingForInput() {
    return this._isWaitingForInput
  }
  tryRestart() {
    const subprocess = spawn("python", [`models/${modelKey}.py`])
    subprocess.on("spawn", () => {
      console.log(`subprocess for model having key ${modelKey} started successfully`)
      this.status = "spawn"
    })
  }
}
async function startsubprocessesForModels() {
  for (const modelKey of modelsToBeImplementedKeys) {
    const model = new Model()
    model.modelKey = modelKey
    const subprocess = spawn("python", [`models/${modelKey}.py`])
    subprocess.on("error", error => {
      console.log(`${error}\nFailed to start a subprocess for model having model key: ${modelKey}`)
      model.status = "error"
    })
    subprocess.on("spawn", () => {
      console.log(`subprocess for model having key ${modelKey} started successfully`)
      model.status = "spawn"
    })
    subprocess.on("exit", (code, signal) => {
      if (code === 0) {
        console.log('subprocess completed successfully.');
      } else {
        console.error(`subprocess exited with code ${code} or signal ${signal}`);
      }
      model.status = "exit"
    })
    subprocess.on("close", (code) => {
      console.log(`subprocess for model having key ${modelKey} has been closed successfully with code ${code}`)
      model.status = "close"
    })
    subprocess.stdout.on("data", data => {
      const prompts = data.toString().split("\r\n")
      for (const prompt of prompts) {
        const [promptType, promptText] = prompt.split(">")
        if (promptType === "input") {
          model.inputPrompt = promptText
          model._isWaitingForInput = true
        }
        else if (promptType === "output") {
          model.outputPrompt = promptText
          model.inputPrompt = ""
          model._isReadyForOutput = true
        }
        else {
          if (model.status === "exit" || model.status === "close") continue
          // uncontrollabe beacuse the 'exit' event is trigerred after 'data' event
          console.error(model.status, Error("unsupported format"))
        }
      }
    })
    model.process = subprocess
    implementedModels.set(modelKey, model)
  }
}
startsubprocessesForModels()

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