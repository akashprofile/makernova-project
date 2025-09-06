import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Given predicted diseases and present symptoms, asks Gemini to generate a doctor-style prescription.
 * @param {string[]} predictedDiseases - Array of disease names predicted by model 1.
 * @param {string[]} presentSymptoms - Array of symptoms present (denoted by 1s from model 1).
 * @returns {Promise<string>} - Prescription text from Gemini.
 */
export default async function getPrescription(predictedDiseases, presentSymptoms) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Doctor-style prompt
    const prompt = `You are an expert medical doctor. Given the following predicted diseases: ${predictedDiseases.join(", ")}
and the following present symptoms: ${presentSymptoms.join(", ")}
Write a detailed prescription for the patient, including medication, advice, and follow-up instructions. Format your response as a professional doctor would. Try to give concise and crisp output`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("Gemini API error (prescription):", err);
        throw err;
    }
}
