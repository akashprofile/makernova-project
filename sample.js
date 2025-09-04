import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyApGtLxoqs-i9x319wYNez-2Khkfdaq2t4" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few paragraphs.",
  });
  console.log(response.text);
}

main();