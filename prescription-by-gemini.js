import { GoogleGenerativeAI } from "@google/generative-ai";


/**
 * Sends the user prompt and symptoms list to Gemini, and returns an array indicating presence (1) or absence (0) of each symptom.
 * @param {string} userInput - The user's prompt.
 * @param {string[]} symptomsArray - List of symptoms to check.
 * @returns {Promise<number[]>} - Array of 1s and 0s for each symptom.
 */
export default async function prescriptionByGemini(userInput, disease) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing Gemini API key");
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

	const prescription = await model.generateContent(`Generate a medical prescription for user that provided prompt ${userInput} and our ML model predicted the disease ${disease}. If our model make wrong prediction, accept that whatever disease our model has predicted is correct. Also add a disclaimer that there is probability that this prescriotion may be wrong, user should consult a doctor before making any decision. Format the output using html tags only. Markdown is not supported.`)

  return prescription
}