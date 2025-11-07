import { GoogleGenerativeAI } from "@google/generative-ai";


/**
 * Sends the user prompt and symptoms list to Gemini, and returns an array indicating presence (1) or absence (0) of each symptom.
 * @param {string} userInput - The user's prompt.
 * @param {string[]} symptomsArray - List of symptoms to check.
 * @returns {Promise<number[]>} - Array of 1s and 0s for each symptom.
 */
export default async function userToGemini(userInput, symptomsArray) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing Gemini API key");
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

	// Chunking logic
	const chunkSize = 50;
	const totalChunks = Math.ceil(symptomsArray.length / chunkSize);
	let finalArray = [];

	for (let i = 0; i < totalChunks; i++) {
		const chunkSymptoms = symptomsArray.slice(i * chunkSize, (i + 1) * chunkSize);
		const chunkPrompt = `You are a medical symptom extraction expert. Given the following user input: "${userInput}", analyze it with high accuracy and check for the presence of each symptom in this list (chunk ${i+1} of ${totalChunks}, ${chunkSymptoms.length} symptoms):\n${chunkSymptoms.join(", ")}\nReturn ONLY a JSON array of 1s and 0s, where 1 means present and 0 means not present, in the SAME ORDER as the symptoms list. The array MUST be exactly ${chunkSymptoms.length} elements long. Do not include any explanation, text, or formatting other than the array itself.`;
		let arr = null;
		let attempts = 0;
		const maxAttempts = 5;
		while (attempts < maxAttempts) {
			try {
				const result = await model.generateContent(chunkPrompt);
				const responseText = result.response.text();
				const match = responseText.match(/\[.*\]/s);
				if (!match) throw new Error("Gemini response does not contain a valid array");
				arr = JSON.parse(match[0]);
				if (Array.isArray(arr) && arr.length === chunkSymptoms.length) {
					finalArray = finalArray.concat(arr);
					break;
				}
				attempts++;
			} catch (err) {
				console.error(`Gemini API error (chunk ${i+1}, attempt ${attempts+1}):`, err);
				attempts++;
			}
		}
		if (!arr || arr.length !== chunkSymptoms.length) {
			throw new Error(`Failed to get a valid symptoms array for chunk ${i+1} after ${maxAttempts} attempts.`);
		}
	}
	if (finalArray.length !== symptomsArray.length) {
		throw new Error(`Final symptoms array length ${finalArray.length} does not match expected ${symptomsArray.length}.`);
	}
	return finalArray;
}