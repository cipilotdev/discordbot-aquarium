const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(prompt) {
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text;
    } catch (err) {
      console.error("Gemini API Error:", err.message || err);
      retries--;
      if (retries === 0)
        return "Gemini lagi ngambek (503). Coba lagi nanti ye!";
    }
  }
}

module.exports = { askGemini };
