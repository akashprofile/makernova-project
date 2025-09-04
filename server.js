import express from "express"
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

app.post("/model", express.json(), (req, res, next) => {
  console.log("request received")
  console.log(req.body)
  res.json({ "response": "sample response from server side to the client" })
})

const server = http.createServer(app)
const PORT = process.env.PORT || 3000
server.listen(PORT, "localhost", () => {
  console.log(`server listening on port ${ PORT }`)
})