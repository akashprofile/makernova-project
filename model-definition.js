export default class Model {
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
  getStatus() {
    return this.status
  }
  isWaitingForInput() {
    return this._isWaitingForInput
  }
  isReadyForOutput() {
    return this._isReadyForOutput
  }
  tryRestart() {
    const subprocess = spawn("python", [`models/${modelKey}.py`])
    subprocess.on("spawn", () => {
      console.log(`subprocess for model having key ${modelKey} started successfully`)
      this.status = "spawn"
    })
  }
}