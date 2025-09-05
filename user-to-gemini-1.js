import { GoogleGenerativeAI } from "@google/generative-ai";


/**
 * Sends the user prompt and symptoms list to Gemini, and returns an array indicating presence (1) or absence (0) of each symptom.
 * @param {string} userInput - The user's prompt.
 * @param {string[]} symptomsArray - List of symptoms to check.
 * @returns {Promise<number[]>} - Array of 1s and 0s for each symptom.
 */
export default async function userToGemini(userInput, symptomsArray) {
	// You must set your Gemini API key in an environment variable or config
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error("Missing Gemini API key");
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

	// Construct prompt for Gemini
	const prompt = `Given the following user input: "${userInput}"\nCheck for the presence of each symptom in this list:\n${symptomsArray.join(", ")}\nReturn a JSON array of 1s and 0s, where 1 means present and 0 means not present, in the same order as the symptoms list.`;

	try {
		const result = await model.generateContent(prompt);
		// Gemini's response should be a JSON array
		const responseText = result.response.text();
		// Extract array from response
		const match = responseText.match(/\[.*\]/s);
		if (!match) throw new Error("Gemini response does not contain a valid array");
		const arr = JSON.parse(match[0]);
		return arr;
	} catch (err) {
		console.error("Gemini API error:", err);
		throw err;
	}
}