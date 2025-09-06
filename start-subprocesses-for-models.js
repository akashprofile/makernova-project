import Model from "./model-definition.js"
import { spawn } from "node:child_process";

export const implementedModels = new Map()

const modelsToBeImplementedKeys = ["dtc"]

export default async function startSubprocessesForModels() {
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
      model._isReadyForOutput = false
      model._isReadyForOutput = false
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
          continue
        }
      }
    })
    model.process = subprocess
    implementedModels.set(modelKey, model)
  }
}