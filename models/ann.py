import sys
import pickle
import numpy
import torch
import torch.nn as nn
import json
import sklearn
class Model(nn.Module):
    def __init__(self,num_features):
        super().__init__()
        self.network=nn.Sequential(
          nn.Linear(num_features,96),
          nn.BatchNorm1d(96),
          nn.ReLU(),
          nn.Dropout(0.30000000000000004),
          nn.Linear(96,773)
        )
    def forward(self,features):
      out=self.network(features)
      return out
    
fpModel = open("./models/ann.pkl", "rb")

model = pickle.load(fpModel)

fpDisease = open("./models/ann-diseases-names.json", "r")

diseasesList = json.load(fpDisease)

encoder = sklearn.preprocessing.LabelEncoder()
encoder.fit(diseasesList)
while (True):
  symptoms = input("input>Symptoms:")
  #symptoms = "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"
  inputTensor = torch.tensor(numpy.array(symptoms.split(","), dtype=numpy.float64).reshape(1, -1), dtype=torch.float32)
  outputs = model(inputTensor)
  maxOutput = torch.max(outputs, 1)
  bestPrediction = encoder.inverse_transform(maxOutput.indices).item()
  print(f"output>{bestPrediction}")

sys.exit()