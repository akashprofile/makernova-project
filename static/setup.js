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
console.log(modelChangeDropdown)
modelChangeDropdown.addEventListener("click", e => {
  modelChangeDropdown.classList.toggle("open")
  
})
const modelElements = new DocumentFragment()
const selectedModelName = document.getElementById("selected-model-name")
const modelsNameList = document.getElementById("models-name-list")

for (const key of models.keys()) {
  const modelElement = document.createElement("span")
  modelElement.setAttribute("data-mkey", key)
  modelElement.textContent = models.get(key)
  modelElement.addEventListener("click", e => {
    const currentModel = selectedModelName.getAttribute("data-mkey")
    const choosedModel = modelElement.getAttribute("data-mkey")
    if (choosedModel)
    if (currentModel != choosedModel) {
      selectedModelName.setAttribute("data-mkey", choosedModel)
      selectedModelName.textContent = models[choosedModel]
      selectedModelName.dispatchEvent("model-change")
    }
  })
  modelElements.appendChild(modelElement)
}
modelsNameList.append(modelElements)
selectedModelName.addEventListener("model-change", e => {
  console.log("Model changed")
})

const chats = []

for (let i = 0; i <= 20; i++) {
  chats.push({ id: `random-id-${i}`, title: `some tile ${i} of chats` })
}

