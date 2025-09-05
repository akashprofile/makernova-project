/* START - handling the model changes */ 
const models = new Map([
  ["ann", "Artificial Neural Network"],
  ["dtc", "Decision Tree Classifier"],
  ["lor", "Logistic Regression"],
  ["lir", "Linear Regression"],
  ["svm", "Support Vector Machines"],
  ["kms", "K Means"],
  ["knn", "K Nearest Neighbour"]
])

const modelChangeDropdown = document.getElementById("model-change-dropdown")
modelChangeDropdown.addEventListener("click", e => {
  modelChangeDropdown.classList.toggle("open")
  
})
const modelElements = new DocumentFragment()
const selectedModelName = document.getElementById("selected-model-name")
const modelsNameList = document.getElementById("models-name-list")

const currentModelKey = "dtc" // to be set later

selectedModelName.setAttribute("data-mkey", currentModelKey)
selectedModelName.textContent = models.get(currentModelKey)

for (const key of models.keys()) {
  const modelElement = document.createElement("span")
  modelElement.setAttribute("data-mkey", key)
  modelElement.textContent = models.get(key)
  modelElement.addEventListener("click", e => {
    const currentModel = selectedModelName.getAttribute("data-mkey")
    const choosedModel = modelElement.getAttribute("data-mkey")
    if (!choosedModel) return
    if (currentModel != choosedModel) {
      selectedModelName.setAttribute("data-mkey", choosedModel)
      selectedModelName.textContent = models.get(choosedModel)
      selectedModelName.dispatchEvent(new Event("model-change"))
    }
  })
  modelElements.appendChild(modelElement)
}
modelsNameList.append(modelElements)
selectedModelName.addEventListener("model-change", e => {
  console.log("Model changed")
})
/* End - Handling the model change */


/* START - Showing the past chats by the user */
const chats = [] // to be fetched from database
for (let i = 0; i < 20; i++) {
  chats.push({ id: `random-id-${i}`, title: `some tile ${i} of chats` })
}

const previousChatsContainer = document.getElementById("previous-chats-container")

const previousChats = new DocumentFragment()
for (let chat of chats) {
  const chatElement = document.createElement("span")
  chatElement.setAttribute("data-id", chat.id)
  chatElement.classList.add("chats")
  chatElement.textContent = chat.title
  previousChats.appendChild(chatElement)
}
previousChatsContainer.append(previousChats)
/* END - Showing the past chats by the user */

let chat = {
  id: 459490,
  title: "I am having headache",
  useremail: "example@email.com",
  interactions: []
}

const interactionsContainer = document.getElementById("interactions-container")
const interactionsFragment = new DocumentFragment()
for (const interaction of chat.interactions) {
  const prompt = document.createElement("div")
  prompt.className = "prompt"
  prompt.textContent = interaction.prompt
  const response = document.createElement("div")
  response.className = "response"
  response.textContent = interaction.response
  interactionsFragment.appendChild(prompt)
  interactionsFragment.appendChild(response)
}
interactionsContainer.append(interactionsFragment)

const writingArea = document.getElementById("writing-area")
const sendPromptButton = document.getElementById("send-prompt-button")

function sendPrompt() {
  const prompt = writingArea.value;
  const promptElement = document.createElement("div")
  promptElement.className = "prompt"
  promptElement.textContent = prompt
  interactionsContainer.appendChild(promptElement)
  console.log(currentModelKey)
  // send the prompt from here
  fetch("./run-model", {
    method: "POST",
    body: JSON.stringify({ prompt: prompt, modelKey: currentModelKey }),
    headers: {
      "Content-Type": "application/json",
    }
  })
    .then(res => res.json())
    .then(obj => {
      const responeElement = document.createElement("div")
      responeElement.className = "response"
      responeElement.textContent = obj.response
      interactionsContainer.appendChild(responeElement)
    })
  // writingArea.value = ""
}

sendPromptButton.addEventListener("click", sendPrompt)

writingArea.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendPrompt();
    writingArea.value = "";
  } else if (e.key === "Enter" && e.shiftKey) {
    // Allow default: insert newline
  }
})